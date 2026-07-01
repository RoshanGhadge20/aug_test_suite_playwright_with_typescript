import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import { shopLogActualExpected } from '../../utils/test/shop-log';

export type ListingProductPrice = {
  name: string;
  price: number;
  priceText: string;
};

export class ShopSortPage extends BasePage {
  static readonly defaultSortLabel = 'Sorting Options';
  static readonly priceHighToLow = 'Price - High to Low';
  static readonly priceLowToHigh = 'Price - Low to High';

  private static readonly sortComboboxName = /sorting options|price\s*-\s*high|price\s*-\s*low|newest|popular|recommended/i;

  private readonly pageRef: Page;

  constructor(page: Page) {
    super(page);
    this.pageRef = page;
  }

  private sortCombobox(): Locator {
    return this.pageRef.getByRole('combobox', { name: ShopSortPage.sortComboboxName });
  }

  private sortDropdown(): Locator {
    return this.pageRef.locator('p-dropdown').filter({ has: this.sortCombobox() });
  }

  private sortDropdownTrigger(): Locator {
    return this.sortDropdown().locator('.p-dropdown-trigger, [aria-label="dropdown trigger"]');
  }

  private listingResultsHeader(categoryLabel: string): Locator {
    return this.listingSection(categoryLabel).locator('div.flex.px-6.justify-between > div').first();
  }

  private listingSection(categoryLabel: string): Locator {
    return this.pageRef.locator('div.col-span-4.lg\\:col-span-3').filter({
      has: this.pageRef.getByRole('heading', { level: 2, name: categoryLabel, exact: true }),
    });
  }

  private listingProductCards(categoryLabel: string): Locator {
    return this.listingSection(categoryLabel).locator('app-product-new');
  }

  private async readListingCardPrice(card: Locator): Promise<ListingProductPrice> {
    const name =
      ((await card.locator('img[alt]').first().getAttribute('alt')) ??
        (await card.locator('h3').first().textContent()) ??
        '').trim();
    const priceText = (
      (await card.locator('div.text-20.font-gilroymedium').filter({ hasText: /^₹/ }).first().textContent()) ?? ''
    ).trim();
    let price = this.parseAmount(priceText);
    if (price <= 0) {
      price = Number((await card.getAttribute('ng-reflect-amount')) ?? 0);
    }
    return { name, price, priceText: priceText || `₹${price}` };
  }

  private async goToNextListingPageIfAvailable(): Promise<boolean> {
    const next = this.page.getByRole('button', { name: /next page/i });
    if (!(await next.isEnabled({ timeout: 500 }).catch(() => false))) {
      return false;
    }
    await next.click();
    await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    return true;
  }

  private logListingProducts(categoryLabel: string, products: ListingProductPrice[]): void {
    console.log(`[Shop] ${categoryLabel} listing products (${products.length})`);
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`  ${i + 1}. ${product.name} - ${product.priceText}`);
    }
  }

  /** Read product count from listing header e.g. USilver + "27 results". */
  async getListingProductCount(categoryLabel = 'USilver'): Promise<{ category: string; count: number }> {
    const header = this.listingResultsHeader(categoryLabel);
    const resultsLine = header.getByText(/\d+\s+results/i);
    await expect(header).toBeVisible();
    await expect(resultsLine).toBeVisible();

    const category = ((await header.getByRole('heading', { level: 2 }).textContent()) ?? categoryLabel).trim();
    const resultsText = ((await resultsLine.textContent()) ?? '').trim();
    const count = Number(resultsText.match(/(\d+)\s+results/i)?.[1] ?? 0);

    shopLogActualExpected(`${category} results count parsed`, count > 0, true);
    return { category, count };
  }

  async expectListingProductCount(categoryLabel: string, expectedCount: number): Promise<void> {
    const { category, count } = await this.getListingProductCount(categoryLabel);
    shopLogActualExpected(`${category} results count`, count, expectedCount);
    expect(count).toBe(expectedCount);
  }

  /** Collect all listing card prices in DOM order (scroll / paginate until header count reached). */
  async getAllListingProductPrices(categoryLabel = 'USilver'): Promise<ListingProductPrice[]> {
    const { count: expectedCount } = await this.getListingProductCount(categoryLabel);
    const section = this.listingSection(categoryLabel);
    const cards = this.listingProductCards(categoryLabel);
    const products: ListingProductPrice[] = [];

    await this.page.keyboard.press('Home');
    await section.scrollIntoViewIfNeeded();

    let stagnant = 0;
    while (products.length < expectedCount && stagnant < 10) {
      const before = products.length;
      const cardCount = await cards.count();

      for (let i = products.length; i < cardCount; i++) {
        const card = cards.nth(i);
        await card.scrollIntoViewIfNeeded();
        products.push(await this.readListingCardPrice(card));
      }

      if (products.length >= expectedCount) {
        break;
      }

      stagnant = products.length === before ? stagnant + 1 : 0;
      const advanced = await this.goToNextListingPageIfAvailable();
      if (!advanced) {
        await this.page.mouse.wheel(0, 1_000);
        await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
      }
    }

    this.logListingProducts(categoryLabel, products);
    return products;
  }

  /** Assert card count matches header and prices are non-increasing (High to Low). */
  async expectProductsSortedHighToLow(categoryLabel = 'USilver'): Promise<void> {
    await this.expectProductsSortedByPrice(categoryLabel, 'desc');
  }

  /** Assert card count matches header and prices are non-decreasing (Low to High). */
  async expectProductsSortedLowToHigh(categoryLabel = 'USilver'): Promise<void> {
    await this.expectProductsSortedByPrice(categoryLabel, 'asc');
  }

  private async expectProductsSortedByPrice(
    categoryLabel: string,
    direction: 'desc' | 'asc',
  ): Promise<void> {
    const { count } = await this.getListingProductCount(categoryLabel);
    const products = await this.getAllListingProductPrices(categoryLabel);

    shopLogActualExpected(`${categoryLabel} card count vs results header`, products.length, count);
    expect(products.length).toBe(count);

    const priceSummary = products.map((product) => product.price).join(', ');
    const orderLabel = direction === 'desc' ? 'high→low' : 'low→high';
    console.log(`[Shop] ${categoryLabel} prices ${orderLabel} (${products.length}): ${priceSummary}`);

    for (let i = 0; i < products.length - 1; i++) {
      const current = products[i];
      const next = products[i + 1];
      const ok = direction === 'desc' ? current.price >= next.price : current.price <= next.price;
      const comparator = direction === 'desc' ? '>=' : '<=';
      shopLogActualExpected(
        `[${i}] ₹${current.price} (${current.name}) ${comparator} [${i + 1}] ₹${next.price} (${next.name})`,
        ok,
        true,
      );
      if (direction === 'desc') {
        expect(
          current.price,
          `[${i}] ${current.name} ₹${current.price} should be >= [${i + 1}] ${next.name} ₹${next.price}`,
        ).toBeGreaterThanOrEqual(next.price);
      } else {
        expect(
          current.price,
          `[${i}] ${current.name} ₹${current.price} should be <= [${i + 1}] ${next.name} ₹${next.price}`,
        ).toBeLessThanOrEqual(next.price);
      }
    }
  }

  /** Scroll to top so the sort dropdown in the listing toolbar is visible. */
  async scrollUpToSortingOptions(): Promise<void> {
    await this.page.keyboard.press('Home');
    await this.sortDropdown().scrollIntoViewIfNeeded();
  }

  /** Default sort dropdown shows placeholder label "Sorting Options". */
  async expectDefaultSortingOptionDisplayed(): Promise<void> {
    const combobox = this.sortCombobox();
    await expect(this.sortDropdown()).toBeVisible();
    await expect(combobox).toBeVisible();
    await expect(combobox).toHaveText(ShopSortPage.defaultSortLabel);

    const ariaLabel = await combobox.getAttribute('aria-label');
    shopLogActualExpected('Sort dropdown aria-label', ariaLabel, ShopSortPage.defaultSortLabel);
    expect(ariaLabel).toBe(ShopSortPage.defaultSortLabel);
  }

  /** Open sort dropdown and select an option (e.g. Price - High to Low). */
  async selectSortOption(optionLabel: string): Promise<void> {
    const pattern = new RegExp(optionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    await this.sortDropdown().scrollIntoViewIfNeeded();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.sortDropdownTrigger().click();
      const panel = this.page.locator('.p-dropdown-panel').filter({ has: this.page.getByRole('option', { name: pattern }) });
      const option = panel.getByRole('option', { name: pattern }).first();
      await expect(option).toBeVisible({ timeout: 10_000 });
      try {
        await option.click({ timeout: 5_000 });
        break;
      } catch (error) {
        if (attempt === 2) {
          throw error;
        }
        await this.page.keyboard.press('Escape').catch(() => {});
      }
    }

    await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  }

  async expectSelectedSortOption(optionLabel: string): Promise<void> {
    const combobox = this.sortCombobox();
    await expect(combobox).toBeVisible();
    const ariaLabel = ((await combobox.getAttribute('aria-label')) ?? (await combobox.innerText())).trim();
    shopLogActualExpected('Selected sort option', ariaLabel, optionLabel);
    expect(ariaLabel).toMatch(new RegExp(optionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
}
