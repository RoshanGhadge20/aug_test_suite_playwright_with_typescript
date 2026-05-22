import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export type ShopProductDetails = {
  productName: string;
  price: string;
  mrpNote: string;
  emiText: string;
  quantity: string;
  sku: string;
  metalType: string;
  purity: string;
  productWeight: string;
  goldPrice: number;
  makingAndDeliveryCharges: number;
  tax: number;
  grandTotal: number;
  returnsPolicy: string;
  trustBadges: string[];
};

export class ShopPage extends BasePage {
  /** PDP / accordion waits for getProductDetails (keep below global 15s action timeout). */
  private static readonly pdpHeadingTimeoutMs = 8_000;
  private static readonly accordionControlTimeoutMs = 5_000;
  private static readonly accordionPanelTimeoutMs = 5_000;
  private static readonly panelFieldProbeMs = 800;
  private static readonly emiBannerProbeMs = 1_500;
  private static readonly skuValuePollMs = 1_500;
  private readonly goldCoinCheckbox: Locator;
  private readonly priceRange100To20000Radio: Locator;
  private readonly resultsText: Locator;
  private readonly goldCoinHeading: Locator;
  private readonly goldCoinProductGrid: Locator;
  private readonly productImages: Locator;
  private readonly productNameHeading: Locator;
  private readonly productPrice: Locator;
  private readonly mrpNote: Locator;
  private readonly emiBanner: Locator;
  private readonly quantityDropdown: Locator;
  private readonly returnsPolicyText: Locator;
  private readonly trustBadgeLabels: Locator;
  private readonly productPropertiesAccordion: Locator;
  private readonly priceBreakdownAccordion: Locator;
  private readonly productPropertiesPanel: Locator;
  private readonly priceBreakdownPanel: Locator;
  private readonly buyWithEmiButton: Locator;
  private readonly buyNowButton: Locator;
  private readonly cartButton: Locator;
  private readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.goldCoinCheckbox = page
      .getByText('Gold Coin', { exact: true })
      .locator('xpath=following-sibling::*[1]')
      .first();
    this.priceRange100To20000Radio = page
      .getByText('₹100 - ₹20000', { exact: true })
      .locator('xpath=preceding-sibling::*[1]')
      .first();
    this.resultsText = page.getByText(/\d+\s+results/i).first();
    this.goldCoinHeading = page.getByRole('heading', { name: 'Gold Coin', level: 2, exact: true });
    this.goldCoinProductGrid = this.goldCoinHeading.locator(
      'xpath=parent::*/parent::*/following-sibling::*[1]',
    );
    this.productImages = this.goldCoinProductGrid.locator('img[alt]').or(page.locator('figure img[alt]'));
    this.productNameHeading = page.locator('h2.line-clamp-2').first();
    this.productPrice = page.locator('div.font-semibold').filter({ hasText: /^₹/ }).first();
    this.mrpNote = page.getByText('MRP inclusive of all taxes');
    this.emiBanner = page.getByText(/EMI STARTS FROM/i);
    this.quantityDropdown = page.locator('.p-dropdown-label');
    this.returnsPolicyText = page.getByText(/30-day returns/i);
    this.trustBadgeLabels = page.locator('.bg-maroon span.font-medium');
    this.productPropertiesAccordion = page.getByRole('button', { name: 'Product Properties' });
    this.priceBreakdownAccordion = page.getByRole('button', { name: /Price Breakdown/i });
    this.productPropertiesPanel = page.getByRole('region', { name: 'Product Properties' });
    this.priceBreakdownPanel = page.getByRole('region', { name: /Price Breakdown/i });
    this.buyWithEmiButton = page.getByRole('button', { name: 'Buy with EMI' });
    this.buyNowButton = page.getByRole('button', { name: 'Buy Now' });
    this.cartButton = page
      .getByRole('button')
      .filter({ has: page.locator('.pi-shopping-bag') })
      .first();
    this.cartBadge = page.locator('span.p-badge.p-badge-danger');
  }

  get buyWithEmi(): Locator {
    return this.buyWithEmiButton;
  }

  get buyNow(): Locator {
    return this.buyNowButton;
  }

  async open(): Promise<void> {
    await this.goto('/shop-new/product');
    await this.page.waitForURL(/shop-new\/product/i, { timeout: 15_000 });
    await this.page.getByText('Gold Coin', { exact: true }).waitFor({ state: 'visible', timeout: 15_000 });
  }

  async openListingWithFilters(): Promise<void> {
    await this.open();
    await this.applyListingFilters();
  }

  async openProduct(productName: string): Promise<void> {
    await this.openListingWithFilters();
    await this.selectProduct(productName);
  }

  async expectProductsListed(productNames: string[]): Promise<void> {
    const { count, names } = await this.scrollDownAndGetProducts();
    expect(count).toBeGreaterThan(0);
    for (const name of productNames) {
      expect(names).toContain(name);
    }
  }

  async expectPdpBuyButtons(requireEmi = false): Promise<void> {
    await expect(this.buyNow).toBeVisible();
    if (requireEmi) {
      await expect(this.buyWithEmi).toBeVisible();
      await expect(this.buyWithEmi).toBeEnabled();
    }
  }

  /** Scroll to top of PDP so Buy with EMI is in view (after reading details lower on page). */
  async scrollToBuyWithEmi(): Promise<void> {
    await this.page.keyboard.press('Home');
    await this.buyWithEmiButton.scrollIntoViewIfNeeded();
    await this.buyWithEmiButton.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Scroll Buy Now into view on PDP. */
  async scrollToBuyNow(): Promise<void> {
    await this.page.keyboard.press('Home');
    await this.buyNowButton.scrollIntoViewIfNeeded();
    await this.buyNowButton.waitFor({ state: 'visible', timeout: 10_000 });
  }

  printProductDetails(tag: string, details: ShopProductDetails): void {
    console.log(`${tag} Name:`, details.productName);
    console.log(`${tag} Price:`, details.price);
    console.log(`${tag} MRP Note:`, details.mrpNote);
    console.log(`${tag} EMI:`, details.emiText || '(not shown)');
    console.log(`${tag} Quantity:`, details.quantity);
    console.log(`${tag} SKU:`, details.sku);
    console.log(`${tag} Metal Type:`, details.metalType);
    console.log(`${tag} Purity:`, details.purity);
    console.log(`${tag} Product Weight:`, details.productWeight);
    console.log(`${tag} 24 KT Gold Price:`, details.goldPrice);
    console.log(`${tag} Making & Delivery Charges:`, details.makingAndDeliveryCharges);
    console.log(`${tag} TAX:`, details.tax);
    console.log(`${tag} Grand Total:`, details.grandTotal);
    console.log(`${tag} Returns Policy:`, details.returnsPolicy);
    console.log(`${tag} Trust Badges:`, details.trustBadges.join(' | '));
  }

  async scrollPageUp(): Promise<void> {
    await this.page.keyboard.press('Home');
  }

  async scrollPageDown(): Promise<void> {
    await this.page.keyboard.press('End');
  }

  async clickGoldCoinCheckbox(): Promise<void> {
    await this.scrollPageUp();
    await this.goldCoinCheckbox.click();
  }

  async clickPriceRangeRadio(): Promise<void> {
    await this.scrollPageUp();
    await this.priceRange100To20000Radio.click();
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    await this.resultsText.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Scroll listing and collect unique product `alt` names (lazy-loaded grid). */
  private async collectAllProductNames(): Promise<string[]> {
    const names = new Set<string>();
    let stagnantRounds = 0;

    for (let round = 0; round < 50 && stagnantRounds < 6; round += 1) {
      const batch = await this.productImages.evaluateAll((imgs) =>
        imgs.map((img) => img.getAttribute('alt')?.trim() ?? '').filter((alt) => alt.length > 0),
      );
      const before = names.size;
      for (const name of batch) {
        names.add(name);
      }
      stagnantRounds = names.size === before ? stagnantRounds + 1 : 0;

      await this.goldCoinProductGrid
        .evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        })
        .catch(() => {});
      await this.productImages
        .last()
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await this.page.mouse.wheel(0, 800);
      await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
    }

    return [...names];
  }

  async scrollDownAndGetProducts(): Promise<{ count: number; names: string[] }> {
    await this.resultsText.waitFor({ state: 'visible', timeout: 15_000 });

    const resultsLabel = ((await this.resultsText.textContent()) ?? '').trim();
    const countMatch = resultsLabel.match(/(\d+)\s+results/i);
    const count = countMatch ? Number(countMatch[1]) : 0;

    const names = await this.collectAllProductNames();

    return { count, names };
  }

  async selectProduct(productName: string): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const img = this.productImage(productName);
      try {
        await img.scrollIntoViewIfNeeded();
        await img.click();
        break;
      } catch (error) {
        if (attempt === 2) {
          throw error;
        }
      }
    }
    await this.productNameHeading.waitFor({ state: 'visible', timeout: ShopPage.pdpHeadingTimeoutMs });
  }

  async expandProductProperties(): Promise<void> {
    await this.expandAccordion(this.productPropertiesAccordion);
    await this.productPropertiesPanel.waitFor({ state: 'visible', timeout: ShopPage.accordionPanelTimeoutMs });
    await this.productPropertiesPanel
      .getByRole('heading', { name: 'Metal Type', level: 4, exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: ShopPage.accordionPanelTimeoutMs });

    const skuLabel = this.productPropertiesPanel
      .getByRole('heading', { name: 'SKU', level: 4, exact: true })
      .first();
    if (await skuLabel.isVisible({ timeout: ShopPage.panelFieldProbeMs }).catch(() => false)) {
      const skuRow = skuLabel.locator('xpath=parent::*');
      try {
        await expect
          .poll(async () => ((await skuRow.textContent()) ?? '').replace(/\s+/g, ' ').trim(), {
            timeout: ShopPage.skuValuePollMs,
            intervals: [100, 200, 300],
          })
          .not.toMatch(/^SKU\s*:?\s*$/i);
      } catch {
        // Some PDPs omit SKU; panelValue may still read value from row text.
      }
    }
  }

  async expandPriceBreakdown(): Promise<void> {
    await this.expandAccordion(this.priceBreakdownAccordion);
    await this.priceBreakdownPanel.waitFor({ state: 'visible', timeout: ShopPage.accordionPanelTimeoutMs });
    await this.priceBreakdownPanel
      .getByRole('heading', { name: 'Grand Total', level: 4, exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: ShopPage.accordionPanelTimeoutMs });
  }

  async getProductDetails(): Promise<ShopProductDetails> {
    await this.productNameHeading.waitFor({ state: 'visible', timeout: ShopPage.pdpHeadingTimeoutMs });
    await this.expandProductProperties();
    await this.expandPriceBreakdown();

    const trustBadges = await this.trustBadgeLabels.allTextContents();

    return {
      productName: await this.readText(this.productNameHeading),
      price: await this.readText(this.productPrice),
      mrpNote: await this.readText(this.mrpNote),
      emiText: await this.readEmiBannerText(),
      quantity: await this.readText(this.quantityDropdown),
      sku: await this.readPropertyValue('SKU'),
      metalType: await this.readPropertyValue('Metal Type'),
      purity: await this.readPropertyValue('Purity'),
      productWeight: await this.readPropertyValue('Product Weight'),
      goldPrice: await this.readPriceValue('24 KT Gold Price'),
      makingAndDeliveryCharges: await this.readPriceValue('Making & Delivery Charges'),
      tax: await this.readPriceValue('TAX'),
      grandTotal: await this.readPriceValue('Grand Total'),
      returnsPolicy: await this.readText(this.returnsPolicyText),
      trustBadges: trustBadges.map((badge) => badge.trim()).filter(Boolean),
    };
  }

  async clickBuyNow(): Promise<void> {
    await this.scrollToBuyNow();
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    await this.productNameHeading.waitFor({ state: 'visible', timeout: 15_000 });

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      await expect(this.buyNowButton).toBeEnabled({ timeout: 10_000 });
      await this.buyNowButton.click({ force: attempt > 1 });
      try {
        await this.page.waitForURL(/shop-new\/cart/i, { timeout: 15_000 });
        return;
      } catch {
        if (attempt >= 2) {
          throw new Error('Cart page did not open after clicking Buy Now (2 attempts)');
        }
        await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
        await expect(this.buyNowButton).toBeEnabled({ timeout: 5_000 });
        await this.scrollToBuyNow();
      }
    }
  }

  /** Clicks Buy with EMI on PDP and waits until EMI plan screen is shown. */
  async clickBuyWithEmi(): Promise<void> {
    const emiScreenVisible = (): Promise<void> =>
      Promise.race([
        this.page
          .getByRole('heading', { name: 'Choose your EMI plan' })
          .waitFor({ state: 'visible', timeout: 20_000 }),
        this.page.getByRole('heading', { name: 'EMI Details' }).waitFor({ state: 'visible', timeout: 20_000 }),
        this.page.getByRole('button', { name: /^Pay ₹/i }).first().waitFor({ state: 'visible', timeout: 20_000 }),
      ]);

    await this.scrollToBuyWithEmi();
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      await expect(this.buyWithEmiButton).toBeEnabled({ timeout: 10_000 });
      await this.buyWithEmiButton.click({ force: attempt > 1 });
      try {
        await emiScreenVisible();
        return;
      } catch {
        if (attempt >= 2) {
          throw new Error('EMI plan screen did not open after clicking Buy with EMI (2 attempts)');
        }
        await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
        await expect(this.buyWithEmiButton).toBeEnabled({ timeout: 5_000 });
        await this.scrollToBuyWithEmi();
      }
    }
  }

  /** Adds current PDP item to cart without Buy Now (for multi-product flows). */
  async addProductToCart(): Promise<void> {
    await this.productNameHeading.waitFor({ state: 'visible', timeout: 15_000 });

    const addBtn = this.page.getByRole('button', { name: /add to (cart|bag)/i });
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click({ force: true });
    } else {
      const bagBtn = this.page
        .locator('button')
        .filter({ has: this.page.locator('.pi-shopping-bag, span.pi-shopping-bag') })
        .filter({ hasNot: this.buyNowButton })
        .first();
      await bagBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await bagBtn.click({ force: true });
    }
    await this.page.getByText(/Product added to the cart/i).waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Gold Coin + ₹100–₹20000 filters (main flow; single apply — avoid toggling Gold Coin off on retry). */
  async applyListingFilters(): Promise<void> {
    await this.scrollPageUp();
    await this.resultsText.waitFor({ state: 'visible', timeout: 15_000 });
    const readCount = async (): Promise<number> => {
      const label = ((await this.resultsText.textContent()) ?? '').trim();
      const match = label.match(/(\d+)\s+results/i);
      return match ? Number(match[1]) : 999;
    };
    const count = await readCount();
    if (count > 30) {
      await this.clickGoldCoinCheckbox();
      await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
      await this.clickPriceRangeRadio();
      await expect
        .poll(readCount, { timeout: 20_000, intervals: [300, 500, 1000, 2000] })
        .toBeLessThanOrEqual(30);
    }
  }

  async getCartBadgeCount(): Promise<number> {
    await this.page.waitForURL(/shop-new/i, { timeout: 15_000 });
    const visible = await this.cartBadge.first().isVisible({ timeout: 3_000 }).catch(() => false);
    if (!visible) return 0;
    const text = await this.cartBadge.first().innerText();
    return Number(text.trim()) || 0;
  }

  async clickCartButton(): Promise<void> {
    await this.cartButton.click();
  }

  private productImage(productName: string): Locator {
    return this.page.getByRole('img', { name: productName, exact: true });
  }

  private async expandAccordion(button: Locator): Promise<void> {
    await button.waitFor({ state: 'visible', timeout: ShopPage.accordionControlTimeoutMs });
    if ((await button.getAttribute('aria-expanded')) !== 'true') {
      await button.click();
    }
  }

  private readPropertyValue(label: string): Promise<string> {
    return this.panelValue(this.productPropertiesPanel, label);
  }

  private async readPriceValue(label: string): Promise<number> {
    const value = await this.panelValue(this.priceBreakdownPanel, label);
    return this.parseAmount(value);
  }

  /**
   * Read a label/value pair from Product Properties or Price Breakdown.
   * PDP rows may use two h4s or label h4 + value in span/p — not only `.last()` h4.
   */
  private async panelValue(panel: Locator, label: string): Promise<string> {
    const labelHeading = panel
      .getByRole('heading', { name: label, level: 4, exact: true })
      .first();
    if (!(await labelHeading.isVisible({ timeout: ShopPage.panelFieldProbeMs }).catch(() => false))) {
      return '';
    }

    const row = labelHeading.locator('xpath=parent::*');
    const headings = row.getByRole('heading', { level: 4 });
    const headingCount = await headings.count();
    for (let i = 0; i < headingCount; i += 1) {
      const text = await this.readText(headings.nth(i));
      if (text && text.toLowerCase() !== label.toLowerCase()) {
        return text;
      }
    }

    const sibling = labelHeading.locator('xpath=following-sibling::*[1]').first();
    if ((await sibling.count()) > 0) {
      const siblingText = await this.readText(sibling);
      if (siblingText) {
        return siblingText;
      }
    }

    const rowText = ((await row.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return rowText.replace(new RegExp(`\\b${escaped}\\b\\s*:?\\s*`, 'i'), '').trim();
  }

  private async readText(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /** EMI strip is not shown on every PDP (e.g. some coin SKUs); return empty string when absent. */
  private async readEmiBannerText(): Promise<string> {
    const visible = await this.emiBanner.isVisible({ timeout: ShopPage.emiBannerProbeMs }).catch(() => false);
    if (!visible) {
      return '';
    }
    return this.readText(this.emiBanner);
  }
}
