import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import { shopLogActualExpected } from '../../utils/test/shop-log';
import type { ShopPage } from './shop.page';
import { shopWeightGramsFromText } from './shop.page';

export class ShopFilterPage extends BasePage {
  static readonly priceRangeLabel = '₹100 - ₹20000';
  static readonly metalWeight6To8Label = '6 - 8 grms';
  static readonly minWeightGrams = 6;
  static readonly maxWeightGrams = 8;

  private readonly resultsText: Locator;
  private readonly priceRange100To20000Radio: Locator;
  private readonly metalWeight6To8Radio: Locator;
  private readonly listingProductGrid: Locator;

  constructor(page: Page) {
    super(page);
    this.resultsText = page.getByText(/\d+\s+results/i).first();
    this.priceRange100To20000Radio = page
      .getByText(ShopFilterPage.priceRangeLabel, { exact: true })
      .locator('xpath=preceding-sibling::*[1]')
      .first();
    this.metalWeight6To8Radio = page
      .getByText(ShopFilterPage.metalWeight6To8Label, { exact: true })
      .locator('xpath=preceding-sibling::*[1]')
      .first();
    this.listingProductGrid = page.locator('div.col-span-4.lg\\:col-span-3 div.grid.grid-cols-3').first();
  }

  private listingProductCards(): Locator {
    return this.listingProductGrid.locator('app-product-new');
  }

  private async waitForListingReady(timeoutMs = 30_000): Promise<void> {
    await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.resultsText.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async scrollUpToFilters(): Promise<void> {
    await this.page.keyboard.press('Home');
    await this.resultsText.scrollIntoViewIfNeeded().catch(() => {});
  }

  async selectPriceRange100To20000(): Promise<void> {
    await this.scrollUpToFilters();
    await this.page.getByText(ShopFilterPage.priceRangeLabel, { exact: true }).scrollIntoViewIfNeeded();
    await this.priceRange100To20000Radio.click();
    await this.waitForListingReady();
  }

  async selectMetalWeight6To8Grams(): Promise<void> {
    await this.scrollUpToFilters();
    await this.page.getByText(ShopFilterPage.metalWeight6To8Label, { exact: true }).scrollIntoViewIfNeeded();
    await this.metalWeight6To8Radio.click();
    await this.waitForListingReady();
  }

  async getFilteredProductCount(): Promise<number> {
    await this.scrollUpToFilters();
    await expect(this.resultsText).toBeVisible();
    const resultsText = ((await this.resultsText.textContent()) ?? '').trim();
    const count = Number(resultsText.match(/(\d+)\s+results/i)?.[1] ?? 0);
    shopLogActualExpected('Filtered results count parsed', count > 0, true);
    return count;
  }

  private async openProductCardAtIndex(index: number): Promise<void> {
    await this.scrollUpToFilters();
    await this.waitForListingReady();
    const card = this.listingProductCards().nth(index);
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await this.page.locator('h2.line-clamp-2').first().waitFor({ state: 'visible', timeout: 15_000 });
    console.log(`[Shop] Opened product card at index: ${index}`);
  }

  async collectFilteredProductNames(): Promise<string[]> {
    const expectedCount = await this.getFilteredProductCount();
    const names: string[] = [];
    const cards = this.listingProductCards();

    await this.scrollUpToFilters();
    await this.listingProductGrid.scrollIntoViewIfNeeded();

    let stagnant = 0;
    while (names.length < expectedCount && stagnant < 10) {
      const before = names.length;
      const cardCount = await cards.count();

      for (let i = names.length; i < cardCount; i++) {
        const card = cards.nth(i);
        await card.scrollIntoViewIfNeeded();
        const name =
          ((await card.locator('img[alt]').first().getAttribute('alt')) ??
            (await card.locator('h3').first().textContent()) ??
            '').trim();
        if (name.length > 0 && !names.includes(name)) {
          names.push(name);
        }
      }

      if (names.length >= expectedCount) {
        break;
      }

      stagnant = names.length === before ? stagnant + 1 : 0;
      await this.page.mouse.wheel(0, 1_000);
      await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
    }

    console.log(`[Shop] Filtered listing products (${names.length})`);
    for (let i = 0; i < names.length; i++) {
      console.log(`  ${i + 1}. ${names[i]}`);
    }

    return names;
  }

  /** Open each product PDP, read Product Weight from properties, assert 6–8 gm. */
  async verifyEachProductWeightInRange(
    shopPage: ShopPage,
    minGrams = ShopFilterPage.minWeightGrams,
    maxGrams = ShopFilterPage.maxWeightGrams,
  ): Promise<void> {
    const expectedCount = await this.getFilteredProductCount();
    const productNames = await this.collectFilteredProductNames();

    shopLogActualExpected('Filtered product names vs header count', productNames.length, expectedCount);
    expect(productNames.length).toBe(expectedCount);

    for (let i = 0; i < productNames.length; i++) {
      const productName = productNames[i];
      console.log(`[Shop] Verifying product ${i + 1}/${productNames.length}: ${productName}`);

      await this.openProductCardAtIndex(i);
      const weightText = await shopPage.readProductWeightFromProperties();
      const grams = shopWeightGramsFromText(weightText);
      console.log(`[Shop] Product weight: ${grams}g (${weightText})`);
      shopLogActualExpected(
        `${productName} weight ${grams}g in ${minGrams}-${maxGrams}g (${weightText})`,
        grams >= minGrams && grams <= maxGrams,
        true,
      );
      expect(grams, `${productName} weight ${weightText}`).toBeGreaterThanOrEqual(minGrams);
      expect(grams, `${productName} weight ${weightText}`).toBeLessThanOrEqual(maxGrams);

      await shopPage.returnToShopListing();
    }
  }
}
