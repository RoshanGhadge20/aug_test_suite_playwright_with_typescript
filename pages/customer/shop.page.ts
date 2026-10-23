import { expect, Locator, Page } from '@playwright/test';
import { getShopDataset } from '../../utils/data/customer-excel-data';
import { shopLogActualExpected, shopLogGet } from '../../utils/test/shop-log';
import type { ShopCartPage } from './shop-cart.page';
import type { ShopEmiDetails, ShopEmiPage } from './shop-emi.page';
import { BasePage } from '../shared/base.page';

export const shopWeightGramsFromText = (value: string): number =>
  Number(value.match(/[\d.]+/)?.[0] ?? 0);

/** PDP weight can read as "gram" only; fall back to cart or product name. */
export const expectedShopProductWeightGrams = (
  productName: string,
  pdp: ShopProductDetails,
  cartNetWeight: string): number => {
  const fromPdp = shopWeightGramsFromText(pdp.productWeight);
  if (fromPdp > 0) return fromPdp;
  const fromCart = shopWeightGramsFromText(cartNetWeight);
  if (fromCart > 0) return fromCart;
  return Number(productName.match(/(\d+(?:\.\d+)?)\s*gm/i)?.[1] ?? 0);
};

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
  private readonly uSilverSubcategoryCheckbox: Locator;
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
    // UAT lists two "Gold Coin" sub-categories; the standard 999-purity coins (incl. the
    // 0.1Gm test product) sit under the last one. `.last()` also works if only one remains.
    this.goldCoinCheckbox = page
      .getByText('Gold Coin', { exact: true })
      .locator('xpath=following-sibling::*[1]')
      .last();
    this.uSilverSubcategoryCheckbox = page
      .getByText('USilver', { exact: true })
      .locator('xpath=following-sibling::*[1]')
      .first();
    // Price-range radios are bucketed live from the catalog's min/max price, so the
    // lowest-bucket label (e.g. "₹100 - ₹20000") drifts as the cheapest product's price
    // changes. Select by position (first = lowest bucket) instead of matching that text.
    // The visible `.p-radiobutton-box` div sits underneath its own native radio
    // `<input>`, which intercepts pointer events — target the input directly.
    this.priceRange100To20000Radio = page
      .getByRole('heading', { name: 'Price Range', exact: true })
      .locator('xpath=following::input[@type="radio"][1]');
    this.resultsText = page.getByText(/\d+\s+results/i).first();
    this.goldCoinHeading = page.getByRole('heading', { name: 'Gold Coin', level: 2, exact: true });
    this.goldCoinProductGrid = this.goldCoinHeading.locator(
      'xpath=parent::*/parent::*/following-sibling::*[1]');
    this.productImages = this.goldCoinProductGrid.locator('img[alt]').or(page.locator('figure img[alt]'));
    this.productNameHeading = page.locator('h2.line-clamp-2').first();
    this.productPrice = page.locator('div.font-semibold').filter({ hasText: /^₹/ }).first();
    this.mrpNote = page.getByText('MRP inclusive of all taxes');
    this.emiBanner = page.getByText(/EMI STARTS FROM/i);
    // PrimeNG renamed its Dropdown component's classes from `p-dropdown*` to `p-select*`.
    this.quantityDropdown = page.locator('.p-select-label');
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

  private async scrollToShopListingSection(): Promise<void> {
    await this.page.keyboard.press('Home');
    const productsHeading = this.page.getByRole('heading', { name: 'Products', level: 2 });
    await productsHeading.scrollIntoViewIfNeeded();
    await this.page.getByText('Gold Coin', { exact: true }).first().scrollIntoViewIfNeeded().catch(() => {});
  }

  private async waitForShopFiltersReady(timeoutMs = 45_000): Promise<void> {
    const goldCoin = this.page.getByText('Gold Coin', { exact: true }).first();
    const productsHeading = this.page.getByRole('heading', { name: 'Products', level: 2 });
    await productsHeading.waitFor({ state: 'visible', timeout: 15_000 });

    let exploredBanner = false;
    await expect
      .poll(
        async () => {
          await this.scrollToShopListingSection();
          if (await goldCoin.isVisible().catch(() => false)) {
            return true;
          }
          if (!exploredBanner) {
            const exploreBtn = this.page.getByRole('button', { name: /explore products/i });
            if (await exploreBtn.isVisible({ timeout: 500 }).catch(() => false)) {
              await exploreBtn.click().catch(() => {});
              exploredBanner = true;
            }
          }
          return goldCoin.isVisible().catch(() => false);
        },
        { timeout: timeoutMs, intervals: [500, 1000, 2000, 3000] })
      .toBe(true);
  }

  async open(): Promise<void> {
    await this.goto('/shop-new/product');
    await this.page.waitForURL(/shop-new\/product/i, { timeout: 15_000 });
    await this.page
      .locator('.p-blockui, .p-blockui-document')
      .waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => {});
    await this.waitForShopFiltersReady();
  }

  /** TC_SHOP_001 — open listing and assert shop product URL. */
  async openShopListing(): Promise<void> {
    await this.open();
    await expect(this.page).toHaveURL(/shop-new\/product/i);
  }

  async openListingWithFilters(): Promise<void> {
    await this.open();
    await this.applyListingFilters();
  }

  /** TC001 / TC002 / TC004 — clear cart, Gold Coin listing + price filters. */
  async prepareGoldCoinListing(shopCartPage: ShopCartPage): Promise<void> {
    await shopCartPage.clearCartAndExpectEmpty();
    await this.openShopListing();
    await this.applyGoldCoinPriceFilters();
  }

  /** TC003 / TC007 — clear cart, listing with catalog filters. */
  async prepareFilteredListing(shopCartPage: ShopCartPage): Promise<void> {
    await shopCartPage.clearCartAndExpectEmpty();
    await this.openListingWithFilters();
  }

  async openProduct(productName: string): Promise<void> {
    await this.openListingWithFilters();
    await this.selectProduct(productName);
  }

  async expectProductsListed(productNames: string[]): Promise<void> {
    const { count, names } = await this.scrollDownAndGetProducts();
    shopLogGet('Catalog listing', { count, names });
    for (const name of productNames) {
      shopLogActualExpected(`Product in catalog (${name})`, names.includes(name), true);
    }
    expect(count).toBeGreaterThan(0);
    for (const name of productNames) {
      expect(names).toContain(name);
    }
  }

  /** TC_SHOP_002 — verify each product name appears in filtered catalog listing. */
  async verifyProductsInCatalog(
    productNames: string[]): Promise<{ count: number; names: string[] }> {
    shopLogGet('Excel product names', productNames);
    const catalog = await this.scrollDownAndGetProducts();
    shopLogGet('Catalog listing', catalog);
    for (const name of productNames) {
      shopLogActualExpected(`Product in catalog (${name})`, catalog.names.includes(name), true);
    }
    expect(catalog.count).toBeGreaterThan(0);
    for (const name of productNames) {
      expect(catalog.names).toContain(name);
    }
    return catalog;
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

  /** TC_SHOP_014 — Jewellery Type → Silver. */
  async selectJewelleryTypeSilver(): Promise<void> {
    await this.scrollPageUp();
    await this.page.getByRole('heading', { name: 'Jewellery Type', level: 1 }).scrollIntoViewIfNeeded();

    // The visible `.p-radiobutton-box` div sits underneath its own native radio
    // `<input>`, which intercepts pointer events — target the input directly.
    const silverInput = this.page.locator('input#silver[name="jwelleryType"]');
    await silverInput.check();

    await expect.poll(() => silverInput.isChecked()).toBe(true);
    await this.waitForShopListingReady();
  }

  /** TC_SHOP_014 — open listing, select Silver jewellery type, scroll up, open product PDP. */
  async openSilverJewelleryProduct(productName: string): Promise<void> {
    await this.openShopListing();
    await this.selectJewelleryTypeSilver();
    await this.scrollPageUp();
    await this.selectProduct(productName);
  }

  async scrollPageDown(): Promise<void> {
    await this.page.keyboard.press('End');
  }

  private async waitForShopListingReady(timeoutMs = 30_000): Promise<void> {
    await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.resultsText.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async clickGoldCoinCheckbox(): Promise<void> {
    await this.page.getByText('Gold Coin', { exact: true }).last().scrollIntoViewIfNeeded();
    await this.goldCoinCheckbox.click();
    await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
    await this.resultsText.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
  }

  async clickPriceRangeRadio(): Promise<void> {
    await this.priceRange100To20000Radio.scrollIntoViewIfNeeded();
    await this.priceRange100To20000Radio.check();
    await this.waitForShopListingReady(30_000);
  }

  /** Read Product Weight (grams) from Product Properties accordion on PDP. */
  async readProductWeightFromProperties(): Promise<string> {
    await this.expandProductProperties();
    return this.readPropertyValue('Product Weight');
  }

  /** Return from PDP to filtered shop product listing. */
  async returnToShopListing(): Promise<void> {
    await this.page.goBack();
    await this.page.waitForURL(/shop-new\/product/i, { timeout: 15_000 });
    await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.resultsText.waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.keyboard.press('Home');
  }

  /** Subcategory filter — USilver only (uncheck AKAM group if all subcategories selected). */
  async selectUSilverSubcategory(): Promise<void> {
    await this.scrollPageUp();
    await this.page.getByRole('heading', { name: 'Sub Category', level: 1 }).scrollIntoViewIfNeeded();

    const akamGroupToggle = this.page
      .getByRole('heading', { name: 'Sub Category', level: 1 })
      .locator('xpath=following::*[normalize-space()="AKAM"][1]')
      .locator('xpath=following-sibling::*[1]')
      .first();
    const akamGroupChecked = await akamGroupToggle
      .locator('.p-checkbox-checked, input[type="checkbox"]:checked')
      .isVisible({ timeout: 1_000 })
      .catch(() => false);
    if (akamGroupChecked) {
      await akamGroupToggle.click();
      await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    }

    await this.uSilverSubcategoryCheckbox.scrollIntoViewIfNeeded();
    await this.uSilverSubcategoryCheckbox.click();
    await this.waitForShopListingReady(30_000);
  }

  /** Silver listing filters — jewellery type Silver, USilver subcategory, ₹100–₹20000. */
  async applySilverUsilverPriceFilters(): Promise<void> {
    await this.selectJewelleryTypeSilver();
    await this.selectUSilverSubcategory();
    await this.clickPriceRangeRadio();
  }

  /** TC_SHOP_001 — Gold Coin + ₹100–₹20000 filters. */
  async applyGoldCoinPriceFilters(): Promise<void> {
    await this.clickGoldCoinCheckbox();
    await this.clickPriceRangeRadio();
  }

  /** TC_SHOP_001 — verify Excel product appears in filtered listing. */
  async verifyProductInCatalog(
    productName = getShopDataset().productName): Promise<{ count: number; names: string[] }> {
    const { count, names } = await this.scrollDownAndGetProducts();
    shopLogGet('Catalog listing', { count, names });
    shopLogActualExpected('Product in catalog', names.includes(productName), true);
    expect(count).toBeGreaterThan(0);
    expect(names).toContain(productName);
    return { count, names };
  }

  /** TC_SHOP_001 — open PDP and capture full product details. */
  async selectProductAndCaptureDetails(
    productName = getShopDataset().productName): Promise<ShopProductDetails> {
    await this.selectProduct(productName);
    const productDetails = await this.getProductDetails();
    shopLogGet('Product details (PDP)', productDetails);
    expect(productDetails.productName).toContain(productName);
    expect(productDetails.grandTotal).toBeGreaterThan(0);
    return productDetails;
  }

  /** TC_SHOP_001 — assert Buy with EMI + Buy Now (when applicable), then add product to cart. */
  async clickBuyNowFromPdp(requireEmi = true): Promise<void> {
    if (requireEmi) {
      await expect(this.buyWithEmiButton).toBeVisible();
    }
    await expect(this.buyNowButton).toBeVisible();
    await this.clickBuyNow();
  }

  /**
   * TC_SHOP_012 / AT-1647 — pick a Buy Now product priced above User Savings so Netbanking remainder is required.
   * Tries catalog names heaviest-first; optional Excel preferred name is attempted first.
   */
  async addBuyNowProductForPartialSavings(
    shopCartPage: ShopCartPage,
    options?: { preferredProductName?: string }): Promise<{ productName: string; productDetails: ShopProductDetails }> {
    await this.openShopListing();
    await this.applyGoldCoinPriceFilters();
    const { names } = await this.scrollDownAndGetProducts();
    const tryOrder = this.orderCatalogNamesForPartialSavings(names, options?.preferredProductName);
    shopLogGet('Partial savings product try order', tryOrder);

    for (const productName of tryOrder) {
      const productDetails = await this.selectProductAndCaptureDetails(productName);
      await this.clickBuyNowFromPdp(false);
      const availableSavings = await shopCartPage.requireShopUserSavingsOnCart('AT-1647');
      const cartPrice = await shopCartPage.getCartPriceDetails();
      const partialOk =
        availableSavings > 0 &&
        productDetails.grandTotal > availableSavings &&
        cartPrice.grandTotal === productDetails.grandTotal;
      shopLogActualExpected(
        `${productName} partial savings (price > savings)`,
        partialOk,
        true);
      if (partialOk) {
        shopLogGet('Selected product for partial savings', {
          productName,
          grandTotal: productDetails.grandTotal,
          availableSavings,
        });
        return { productName, productDetails };
      }
      await shopCartPage.clearCartAndExpectEmpty();
      await this.openShopListing();
      await this.applyGoldCoinPriceFilters();
    }

    throw new Error(
      '[AT-1647] No shop product found where User Savings partially cover the order. ' +
        'Use a lower-savings customer or set ShopTc011ProductName to a higher-priced coin in Excel.');
  }

  /**
   * TC_SHOP_016 — scan full shop catalog (no price filters) until one Buy Now product satisfies:
   * price > User Savings and Razorpay remainder after coupon > 0.
   */
  async addBuyNowProductForPartialSavingsWithCoupon(
    shopCartPage: ShopCartPage,
    couponAmount: number,
  ): Promise<{ productName: string; productDetails: ShopProductDetails; availableSavings: number }> {
    await this.openShopListing();
    const { names } = await this.scrollDownAndGetProducts();
    const tryOrder = this.orderCatalogNamesForPartialSavings(names);
    shopLogGet('TC_SHOP_016 — full catalog products to evaluate', tryOrder);

    for (const productName of tryOrder) {
      const productDetails = await this.selectProductAndCaptureDetails(productName);
      const buyNowEligible = await this.buyNowButton.isVisible({ timeout: 2_000 }).catch(() => false);
      if (!buyNowEligible) {
        shopLogGet('Skip non–Buy Now product', productName);
        await this.openShopListing();
        continue;
      }
      await this.clickBuyNowFromPdp(false);
      const availableSavings = await shopCartPage.readAvailableUserSavingsBalance();
      const cartPrice = await shopCartPage.getCartPriceDetails();
      const razorpayRemainder = Number(
        (productDetails.grandTotal - availableSavings - couponAmount).toFixed(2),
      );
      const partialWithCouponOk =
        availableSavings > 0 &&
        productDetails.grandTotal > availableSavings &&
        cartPrice.grandTotal === productDetails.grandTotal &&
        razorpayRemainder > 0;
      shopLogGet(`TC_SHOP_016 product check (${productName})`, {
        grandTotal: productDetails.grandTotal,
        availableSavings,
        couponAmount,
        razorpayRemainder,
        partialWithCouponOk,
      });
      if (partialWithCouponOk) {
        shopLogGet('Selected product for partial savings + coupon', {
          productName,
          grandTotal: productDetails.grandTotal,
          availableSavings,
          couponAmount,
          razorpayRemainder,
        });
        return { productName, productDetails, availableSavings };
      }
      await shopCartPage.clearCartAndExpectEmpty();
      await this.openShopListing();
    }

    throw new Error(
      '[TC_SHOP_016] No Buy Now product in the shop catalog satisfies: ' +
        'price > User Savings and Razorpay remainder after ₹' +
        `${couponAmount} coupon > 0. Use a customer with lower User Savings.`,
    );
  }

  /**
   * TC_SHOP_017 — scan catalog for EMI + Buy Now pair where combined cart total exceeds
   * User Savings + coupon so Razorpay remainder stays positive.
   */
  async addMixedEmiBuyNowForPartialSavingsWithCoupon(
    shopCartPage: ShopCartPage,
    shopEmiPage: ShopEmiPage,
    couponAmount: number,
    options?: {
      preferredEmiProductName?: string;
      preferredBuyNowProductName?: string;
      emiPlanTenure?: string;
    },
  ): Promise<{
    emiProductName: string;
    buyNowProductName: string;
    productNames: string[];
    productDetailsByName: Record<string, ShopProductDetails>;
    emiResult: { emi: ShopEmiDetails; emiLinePrice: number; emiInitialPayment: number };
    combinedGrandTotal: number;
    availableSavings: number;
    cartSnapshot: Awaited<ReturnType<ShopCartPage['validateMixedCart']>>;
  }> {
    const emiPlanTenure = options?.emiPlanTenure ?? '3 Months';
    await shopCartPage.clearCartAndExpectEmpty();
    await this.openShopListing();
    const { names } = await this.scrollDownAndGetProducts();
    const emiTryOrder = this.orderCatalogNamesForFullSavingsEmi(names, options?.preferredEmiProductName);
    const buyNowTryOrder = this.orderCatalogNamesForPartialSavings(names, options?.preferredBuyNowProductName);
    shopLogGet('TC_SHOP_017 — EMI products to evaluate', emiTryOrder);
    shopLogGet('TC_SHOP_017 — Buy Now products to evaluate', buyNowTryOrder);

    // User Savings is a wallet-level balance, not tied to cart contents. It's read once per
    // candidate pair on the EMI-only cart (see TC_SHOP_013, which reads it the same way) —
    // readAvailableUserSavingsBalance() itself retries with a reload if the balance widget
    // hasn't rendered yet, so no extra caching/retry wrapper is needed here.
    for (const buyNowProductName of buyNowTryOrder) {
      for (const emiProductName of emiTryOrder) {
        await shopCartPage.clearCartAndExpectEmpty();
        await this.openShopListing();

        const emiProductDetails = await this.selectProductAndCaptureDetails(emiProductName);
        const emiEligible =
          /EMI/i.test(emiProductDetails.emiText) &&
          (await this.buyWithEmiButton.isVisible({ timeout: 2_000 }).catch(() => false));
        if (!emiEligible) {
          shopLogGet('TC_SHOP_017 skip non-EMI product', emiProductName);
          continue;
        }
        await this.clickBuyWithEmi();
        let emiResult: { emi: ShopEmiDetails; emiLinePrice: number; emiInitialPayment: number };
        try {
          emiResult = await shopEmiPage.addProductViaEmiPlan(emiPlanTenure);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          shopLogGet(`TC_SHOP_017 skip unstable EMI add (${emiProductName})`, {
            reason: message,
          });
          continue;
        }

        let availableSavings: number;
        try {
          availableSavings = await shopCartPage.readAvailableUserSavingsBalance();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          shopLogGet(`TC_SHOP_017 skip pair (Use Savings not ready on EMI-only cart: ${emiProductName})`, {
            reason: message,
          });
          continue;
        }

        await this.openShopListing();
        const buyNowProductDetails = await this.selectProductAndCaptureDetails(buyNowProductName);
        const buyNowEligible = await this.buyNowButton.isVisible({ timeout: 2_000 }).catch(() => false);
        if (!buyNowEligible) {
          shopLogGet('TC_SHOP_017 skip non–Buy Now product', buyNowProductName);
          continue;
        }
        await this.clickBuyNowFromPdp(false);

        await shopCartPage.removeDuplicateCartProducts();
        const productNames = [emiProductName, buyNowProductName];
        try {
          await shopCartPage.expectCartHasProducts(productNames);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          shopLogGet(`TC_SHOP_017 skip unstable cart pair (${emiProductName} + ${buyNowProductName})`, {
            reason: message,
          });
          continue;
        }

        const productDetailsByName: Record<string, ShopProductDetails> = {
          [emiProductName]: emiProductDetails,
          [buyNowProductName]: buyNowProductDetails,
        };
        const cartSnapshot = await shopCartPage.validateMixedCart({
          productNames,
          emiProductName,
          buyNowProductName,
          productDetailsByName,
          emiExpectedNetPayable: shopEmiPage.expectedNetPayableAmount(emiResult.emi),
          emiInitialPayment: emiResult.emiInitialPayment,
        });
        const combinedGrandTotal = cartSnapshot.combinedGrandTotal;
        const razorpayRemainder = Number(
          (combinedGrandTotal - availableSavings - couponAmount).toFixed(2),
        );
        const partialWithCouponOk =
          availableSavings > 0 &&
          combinedGrandTotal > availableSavings + couponAmount &&
          razorpayRemainder > 0;
        shopLogGet(`TC_SHOP_017 mixed pair check (${emiProductName} + ${buyNowProductName})`, {
          combinedGrandTotal,
          availableSavings,
          couponAmount,
          razorpayRemainder,
          partialWithCouponOk,
        });
        if (partialWithCouponOk) {
          shopLogGet('Selected mixed EMI + Buy Now for partial savings + coupon', {
            emiProductName,
            buyNowProductName,
            combinedGrandTotal,
            availableSavings,
            couponAmount,
            razorpayRemainder,
          });
          return {
            emiProductName,
            buyNowProductName,
            productNames,
            productDetailsByName,
            emiResult,
            combinedGrandTotal,
            availableSavings,
            cartSnapshot,
          };
        }
      }
    }

    throw new Error(
      '[TC_SHOP_017] No EMI + Buy Now pair satisfies: combined cart total > User Savings + ₹' +
        `${couponAmount} coupon. Try a customer with lower User Savings or higher-priced catalog items.`,
    );
  }

  /**
   * TC_SHOP_013 — pick an EMI product (6-month) whose down payment is below User Savings
   * so the initial EMI payment can be fully covered by savings.
   */
  async addEmiProductForFullSavingsDownPayment(
    shopCartPage: ShopCartPage,
    shopEmiPage: ShopEmiPage,
    options: { emiPlanTenure: string; preferredProductName?: string },
  ): Promise<{
    productName: string;
    productDetails: ShopProductDetails;
    emi: ShopEmiDetails;
    emiLinePrice: number;
    emiInitialPayment: number;
  }> {
    await this.openShopListing();
    await this.applyGoldCoinPriceFilters();
    const { names } = await this.scrollDownAndGetProducts();
    const tryOrder = this.orderCatalogNamesForFullSavingsEmi(names, options.preferredProductName);
    shopLogGet('Full savings EMI product try order', tryOrder);

    for (const productName of tryOrder) {
      const productDetails = await this.selectProductAndCaptureDetails(productName);
      const emiEligible =
        /EMI/i.test(productDetails.emiText) &&
        (await this.buyWithEmiButton.isVisible({ timeout: 2_000 }).catch(() => false));
      if (!emiEligible) {
        shopLogGet('Skip non-EMI product', productName);
        await this.openShopListing();
        await this.applyGoldCoinPriceFilters();
        continue;
      }
      await this.clickBuyWithEmi();
      const emiResult = await shopEmiPage.addProductViaEmiPlan(options.emiPlanTenure);
      const availableSavings = await shopCartPage.readAvailableUserSavingsBalance();
      shopLogActualExpected(
        `${productName} full savings EMI (savings > down payment)`,
        availableSavings > emiResult.emiInitialPayment,
        true);
      if (availableSavings > emiResult.emiInitialPayment) {
        shopLogGet('Selected product for full savings EMI down payment', {
          productName,
          emiInitialPayment: emiResult.emiInitialPayment,
          availableSavings,
          emiPlanTenure: options.emiPlanTenure,
        });
        return {
          productName,
          productDetails,
          emi: emiResult.emi,
          emiLinePrice: emiResult.emiLinePrice,
          emiInitialPayment: emiResult.emiInitialPayment,
        };
      }
      await shopCartPage.clearCartAndExpectEmpty();
      await this.openShopListing();
      await this.applyGoldCoinPriceFilters();
    }

    throw new Error(
      '[TC_SHOP_013] No shop product found for EMI where User Savings fully cover the down payment. ' +
        'Down payment must be less than User Savings (product price is less than user saving). ' +
        'Use a customer with higher savings or a lower-priced EMI product in Excel (ShopTc013ProductName).');
  }

  private orderCatalogNamesForPartialSavings(catalogNames: string[], preferred?: string): string[] {
    const weightFromName = (name: string): number =>
      Number(name.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|grams?)/i)?.[1] ?? 0);
    const sorted = [...catalogNames].sort((a, b) => weightFromName(b) - weightFromName(a));
    if (preferred && sorted.includes(preferred)) {
      return [preferred, ...sorted.filter((name) => name !== preferred)];
    }
    return sorted;
  }

  private orderCatalogNamesForFullSavingsEmi(catalogNames: string[], preferred?: string): string[] {
    const weightFromName = (name: string): number =>
      Number(name.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|grams?)/i)?.[1] ?? 0);
    const sorted = [...catalogNames].sort((a, b) => weightFromName(a) - weightFromName(b));
    if (preferred && sorted.includes(preferred)) {
      return [preferred, ...sorted.filter((name) => name !== preferred)];
    }
    return sorted;
  }

  /** TC_SHOP_003 — open EMI PDP, capture details and assert Buy with EMI. */
  async captureEmiProductForMixedCart(
    emiProductName: string): Promise<ShopProductDetails> {
    await this.openProduct(emiProductName);
    const details = await this.getProductDetails();
    shopLogGet(`Product details (EMI) — ${emiProductName}`, details);
    expect(details.emiText).toMatch(/EMI/i);
    await this.scrollToBuyWithEmi();
    await this.expectPdpBuyButtons(true);
    return details;
  }

  /** TC_SHOP_003 — open Buy Now PDP and capture details. */
  async captureBuyNowProductForMixedCart(
    buyNowProductName: string): Promise<ShopProductDetails> {
    await this.openProduct(buyNowProductName);
    const details = await this.getProductDetails();
    shopLogGet(`Product details (Buy Now) — ${buyNowProductName}`, details);
    await this.expectPdpBuyButtons();
    return details;
  }

  /** TC_SHOP_002 — filtered listing → PDP → capture details. */
  async captureProductDetailsFromListing(
    productName: string): Promise<ShopProductDetails> {
    await this.open();
    await this.applyGoldCoinPriceFilters();
    return this.selectProductAndCaptureDetails(productName);
  }

  /** TC_SHOP_002 — capture PDP details for each product in Excel list. */
  async captureProductDetailsForNames(
    productNames: string[]): Promise<Record<string, ShopProductDetails>> {
    const productDetailsByName: Record<string, ShopProductDetails> = {};
    for (const name of productNames) {
      const details = await this.captureProductDetailsFromListing(name);
      productDetailsByName[name] = details;
      shopLogActualExpected(`${name} grand total > 0`, details.grandTotal > 0, true);
    }
    expect(productNames.length).toBeGreaterThanOrEqual(2);
    shopLogGet(
      'PDP snapshot summary',
      Object.fromEntries(
        productNames.map((n) => [
          n,
          { sku: productDetailsByName[n].sku, grandTotal: productDetailsByName[n].grandTotal },
        ])));
    return productDetailsByName;
  }

  /** TC_SHOP_002 — filtered listing → PDP → Buy Now. */
  async addProductViaBuyNowFromListing(
    productName: string,
    options?: { expectEmiButton?: boolean }): Promise<void> {
    await this.open();
    await this.applyGoldCoinPriceFilters();
    await this.selectProduct(productName);
    await expect(this.buyNowButton).toBeVisible();
    await expect(this.buyNowButton).toBeEnabled();
    if (options?.expectEmiButton) {
      await expect(this.buyWithEmiButton).toBeVisible();
    }
    await this.clickBuyNow();
  }

  /** Scroll listing and collect unique product `alt` names (lazy-loaded grid). */
  private async collectAllProductNames(): Promise<string[]> {
    const names = new Set<string>();
    let stagnantRounds = 0;

    for (let round = 0; round < 50 && stagnantRounds < 6; round += 1) {
      const batch = await this.productImages.evaluateAll((imgs) =>
        imgs.map((img) => img.getAttribute('alt')?.trim() ?? '').filter((alt) => alt.length > 0));
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
