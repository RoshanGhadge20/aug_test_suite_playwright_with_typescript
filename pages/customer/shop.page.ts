import { Locator, Page } from '@playwright/test';
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
      .locator('xpath=following-sibling::*[1]');
    this.priceRange100To20000Radio = page
      .getByText('₹100 - ₹20000', { exact: true })
      .locator('xpath=preceding-sibling::*[1]');
    this.resultsText = page.getByText(/\d+\s+results/i).first();
    this.goldCoinHeading = page.getByRole('heading', { name: 'Gold Coin', level: 2, exact: true });
    this.goldCoinProductGrid = this.goldCoinHeading.locator(
      'xpath=parent::*/parent::*/following-sibling::*[1]',
    );
    this.productImages = this.goldCoinProductGrid.locator('img[alt]');
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
    await this.page.waitForTimeout(1_000);
    await this.resultsText.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async scrollDownAndGetProducts(): Promise<{ count: number; names: string[] }> {
    await this.resultsText.waitFor({ state: 'visible', timeout: 15_000 });

    const resultsLabel = ((await this.resultsText.textContent()) ?? '').trim();
    const countMatch = resultsLabel.match(/(\d+)\s+results/i);
    const count = countMatch ? Number(countMatch[1]) : 0;

    const imageCount = await this.productImages.count();
    const names: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      const alt = await this.productImages.nth(i).getAttribute('alt');
      if (alt?.trim()) names.push(alt.trim());
    }

    return { count, names };
  }

  async selectProduct(productName: string): Promise<void> {
    await this.productImage(productName).click();
  }

  async expandProductProperties(): Promise<void> {
    await this.expandAccordion(this.productPropertiesAccordion);
    await this.productPropertiesPanel
      .locator('h4')
      .filter({ hasText: /^AU/i })
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });
  }

  async expandPriceBreakdown(): Promise<void> {
    await this.expandAccordion(this.priceBreakdownAccordion);
  }

  async getProductDetails(): Promise<ShopProductDetails> {
    await this.productNameHeading.waitFor({ state: 'visible', timeout: 15_000 });
    await this.expandProductProperties();
    await this.expandPriceBreakdown();

    const trustBadges = await this.trustBadgeLabels.allTextContents();

    return {
      productName: await this.readText(this.productNameHeading),
      price: await this.readText(this.productPrice),
      mrpNote: await this.readText(this.mrpNote),
      emiText: await this.readText(this.emiBanner),
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
    await this.buyNowButton.click();
    await this.page.waitForURL(/shop-new\/cart/i, { timeout: 15_000 });
  }

  async getCartBadgeCount(): Promise<number> {
    await this.page.waitForURL(/shop-new/i, { timeout: 15_000 });
    await this.cartBadge.first().waitFor({ state: 'attached', timeout: 10_000 });
    const text = await this.cartBadge.first().innerText();
    return Number(text.trim()) || 0;
  }

  async clickCartButton(): Promise<void> {
    await this.cartButton.click();
  }

  private productImage(productName: string): Locator {
    return this.page.getByRole('img', { name: productName });
  }

  private async expandAccordion(button: Locator): Promise<void> {
    await button.waitFor({ state: 'visible', timeout: 10_000 });
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

  private async panelValue(panel: Locator, label: string): Promise<string> {
    const row = panel
      .getByRole('heading', { name: label, level: 4, exact: true })
      .locator('xpath=parent::*');
    return this.readText(row.getByRole('heading', { level: 4 }).last());
  }

  private async readText(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }
}
