import { expect, Locator, Page } from '@playwright/test';
import { getShopDataset } from '../../utils/data/customer-excel-data';
import { shopLogActualExpected, shopLogGet } from '../../utils/test/shop-log';
import type { ShopProductDetails } from './shop.page';
import { BasePage } from '../shared/base.page';

export type ShopCartItemDetails = {
  productName: string;
  netWeight: string;
  quantity: string;
  itemPrice: number;
};

/** EMI cart row (TC003) — no quantity dropdown; line price is Net Payable. */
export type ShopEmiCartItemDetails = {
  productName: string;
  netWeight: string;
  itemPrice: number;
};

export type ShopCartPriceDetails = {
  metalPrice: number;
  makingAndDeliveryCharges: number;
  tax: number;
  savings: number;
  grandTotal: number;
};

/** TC003 — EMI + Buy Now cart price panel (TAX, Initial Payment, etc.). */
export type ShopEmiMixedCartPriceDetails = {
  metalPrice: number;
  initialPayment: number;
  makingAndDeliveryCharges: number;
  tax: number;
  grandTotal: number;
};

export type ShopMultiProductCartSnapshot = {
  combinedGrandTotal: number;
  cartNetWeightByName: Record<string, string>;
  productLinePrices: Record<string, number>;
};

export class ShopCartPage extends BasePage {
  private readonly cartItemsHeading: Locator;
  private readonly emptyCartMessage: Locator;
  private readonly cartProductCards: Locator;
  private readonly trashIcon: Locator;
  private readonly removeButton: Locator;
  private readonly proceedToPayButton: Locator;
  private readonly priceDetailsSection: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItemsHeading = page.getByRole('heading', { name: /Cart Items/i, level: 2 });
    this.emptyCartMessage = page.getByText(/your bag is empty/i);
    this.cartProductCards = this.cartItemsHeading.locator('xpath=following-sibling::div/div');
    this.trashIcon = page.locator('i.pi-trash');
    this.removeButton = page.getByRole('button', { name: 'Remove' });
    this.proceedToPayButton = page.getByRole('button', { name: /Proceed to Pay/i });
    this.priceDetailsSection = page
      .getByRole('heading', { name: 'Price Details', level: 3 })
      .locator('xpath=..');
  }

  async clearCart(): Promise<void> {
    await this.page.goto('/shop-new/cart');
    await this.waitForCart();
    await this.removeAllCartItems();
  }

  /** TC_SHOP_001 — empty cart before shop journey. */
  async clearCartAndExpectEmpty(): Promise<string[]> {
    await this.page.goto('/shop-new/cart');
    const removed = await this.removeAllCartItems();

    await expect
      .poll(
        async () => {
          await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
          if (await this.emptyCartMessage.isVisible().catch(() => false)) {
            return 0;
          }
          return this.cartProductCards.count();
        },
        { timeout: 20_000 })
      .toBe(0);

    shopLogActualExpected('Cart item count', 0, 0);
    return removed;
  }

  /** TC_SHOP_002 — validate each cart line and combined grand total. */
  async validateMultiProductCart(
    productNames: string[],
    productDetailsByName: Record<string, ShopProductDetails>): Promise<ShopMultiProductCartSnapshot> {
    let lineTotalSum = 0;
    const cartNetWeightByName: Record<string, string> = {};
    const productLinePrices: Record<string, number> = {};

    for (const name of productNames) {
      const cartItem = await this.getCartItemDetails(name);
      shopLogGet(`Cart item (${name})`, cartItem);
      shopLogActualExpected(`${name} cart item price`, cartItem.itemPrice, productDetailsByName[name].grandTotal);
      expect(cartItem.productName).toContain(name);
      expect(cartItem.itemPrice).toBe(productDetailsByName[name].grandTotal);
      cartNetWeightByName[name] = cartItem.netWeight;
      productLinePrices[name] = cartItem.itemPrice;
      lineTotalSum += cartItem.itemPrice;
    }

    const cartPrice = await this.getCartPriceDetails();
    shopLogGet('Cart price', cartPrice);
    shopLogActualExpected(
      'Cart grand total > first product',
      cartPrice.grandTotal > productDetailsByName[productNames[0]].grandTotal,
      true);
    expect(cartPrice.grandTotal).toBe(lineTotalSum);
    expect(cartPrice.grandTotal).toBeGreaterThan(productDetailsByName[productNames[0]].grandTotal);

    return {
      combinedGrandTotal: cartPrice.grandTotal,
      cartNetWeightByName,
      productLinePrices,
    };
  }

  /** TC_SHOP_007 / TC_SHOP_010 — validate EMI cart line and initial payment total. */
  async validateEmiCart(
    productName: string,
    emiLinePrice: number,
    emiInitialPayment: number): Promise<{ netWeight: string }> {
    const cartItem = await this.getEmiCartItemDetails(productName);
    const cartPrice = await this.getEmiMixedCartPriceDetails();
    shopLogGet('Cart item (EMI)', cartItem);
    shopLogGet('Cart price (EMI)', cartPrice);
    shopLogActualExpected('EMI line price', cartItem.itemPrice, emiLinePrice);
    shopLogActualExpected('Initial payment', cartPrice.initialPayment, emiInitialPayment);
    const validated = await this.expectEmiCartItemMatchesNetPayable(productName, emiLinePrice);
    expect(cartPrice.initialPayment).toBe(emiInitialPayment);
    expect(cartPrice.grandTotal).toBe(emiInitialPayment);
    return { netWeight: validated.netWeight };
  }

  /** TC_SHOP_003 — validate mixed EMI + Buy Now cart lines and combined total. */
  async validateMixedCart(params: {
    productNames: string[];
    emiProductName: string;
    buyNowProductName: string;
    productDetailsByName: Record<string, ShopProductDetails>;
    emiExpectedNetPayable: number;
    emiInitialPayment: number;
  }): Promise<{
    combinedGrandTotal: number;
    cartNetWeightByName: Record<string, string>;
    productLinePrices: Record<string, number>;
  }> {
    const buyNowCart = await this.getCartItemDetails(params.buyNowProductName);
    const productLinePrices: Record<string, number> = {
      [params.buyNowProductName]: buyNowCart.itemPrice,
    };
    const cartNetWeightByName: Record<string, string> = {
      [params.buyNowProductName]: buyNowCart.netWeight,
    };
    shopLogActualExpected(
      `${params.buyNowProductName} cart price`,
      buyNowCart.itemPrice,
      params.productDetailsByName[params.buyNowProductName].grandTotal);
    expect(buyNowCart.itemPrice).toBe(params.productDetailsByName[params.buyNowProductName].grandTotal);

    const emiCart = await this.expectEmiCartItemMatchesNetPayable(
      params.emiProductName,
      params.emiExpectedNetPayable);
    cartNetWeightByName[params.emiProductName] = emiCart.netWeight;
    productLinePrices[params.emiProductName] = emiCart.itemPrice;

    const cartPrice = await this.getEmiMixedCartPriceDetails();
    const expectedCartGrandTotal = buyNowCart.itemPrice + params.emiInitialPayment;
    shopLogGet('Cart price (mixed)', cartPrice);
    shopLogActualExpected('Cart grand total', cartPrice.grandTotal, expectedCartGrandTotal);
    expect(cartPrice.grandTotal).toBe(expectedCartGrandTotal);
    expect(cartPrice.initialPayment).toBe(params.emiInitialPayment);

    return {
      combinedGrandTotal: cartPrice.grandTotal,
      cartNetWeightByName,
      productLinePrices,
    };
  }

  /** TC_SHOP_004 — validate cart, apply Use Saving, return savings amount. */
  async validateBuyNowCartWithFullSavings(
    productDetails: ShopProductDetails,
    productName: string): Promise<{ netWeight: string; cartSavingsAmount: number }> {
    const validated = await this.validateBuyNowCart(productDetails, productName);
    await this.clickUseSavingCheckbox();
    let cartSavingsAmount = await this.getAppliedCartSavingsAmount();
    if (cartSavingsAmount === 0) {
      cartSavingsAmount = productDetails.grandTotal;
    }
    shopLogActualExpected(
      'Cart savings amount',
      cartSavingsAmount,
      productDetails.grandTotal);
    return { netWeight: validated.netWeight, cartSavingsAmount };
  }

  /** TC_SHOP_001 — validate cart line and price panel against PDP details. */
  async validateBuyNowCart(
    productDetails: ShopProductDetails,
    productName = getShopDataset().productName): Promise<{ netWeight: string }> {
    const cartItem = await this.getCartItemDetails(productName);
    const cartPrice = await this.getCartPriceDetails();
    shopLogGet('Cart item', cartItem);
    shopLogGet('Cart price', cartPrice);
    shopLogActualExpected('Cart item price', cartItem.itemPrice, productDetails.grandTotal);
    shopLogActualExpected('Cart metal price', cartPrice.metalPrice, productDetails.goldPrice);
    shopLogActualExpected(
      'Cart making & delivery',
      cartPrice.makingAndDeliveryCharges,
      productDetails.makingAndDeliveryCharges);
    shopLogActualExpected('Cart tax', cartPrice.tax, productDetails.tax);
    shopLogActualExpected('Cart grand total', cartPrice.grandTotal, productDetails.grandTotal);
    expect(cartItem.productName).toContain(productName);
    expect(cartItem.itemPrice).toBe(productDetails.grandTotal);
    expect(cartPrice.metalPrice).toBe(productDetails.goldPrice);
    expect(cartPrice.makingAndDeliveryCharges).toBe(productDetails.makingAndDeliveryCharges);
    expect(cartPrice.tax).toBe(productDetails.tax);
    expect(cartPrice.grandTotal).toBe(productDetails.grandTotal);
    return { netWeight: cartItem.netWeight };
  }

  async expectCartHasProducts(productNames: string[]): Promise<void> {
    await this.waitForCart();
    const cartCount = await this.getCartItemCount();
    const cartNames = await this.getAllCartProductNames();
    shopLogGet('Cart products', cartNames);
    shopLogActualExpected('Cart item count', cartCount, productNames.length);
    expect(cartCount).toBe(productNames.length);
    for (const name of productNames) {
      expect(cartNames.some((cartName) => cartName.includes(name) || name.includes(cartName))).toBe(true);
    }
  }

  async waitForCart(): Promise<void> {
    await this.page.waitForURL(/shop-new\/cart/i, { timeout: 15_000 });
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await Promise.race([
      this.cartItemsHeading.waitFor({ state: 'visible', timeout: 15_000 }),
      this.emptyCartMessage.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);
  }

  async getAllCartProductNames(): Promise<string[]> {
    await this.waitForCart();
    const count = await this.cartProductCards.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const name = await this.text(this.cartProductCards.nth(i).getByRole('heading', { level: 3 }));
      if (name) names.push(name);
    }
    return names;
  }

  async clickTrash(): Promise<void> {
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.trashIcon.first().click({ timeout: 15_000 });
  }

  async clickRemove(): Promise<void> {
    await this.removeButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.removeButton.click();
  }

  get proceedToPay(): Locator {
    return this.proceedToPayButton;
  }

  async clickProceedToPay(): Promise<void> {
    await this.proceedToPayButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.proceedToPayButton.click();
  }

  async continueShopping(): Promise<void> {
    const link = this.page.getByRole('link', { name: /continue shopping/i }).first();
    if (await link.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await link.click();
      await this.page.waitForURL(/shop-new\/product/i, { timeout: 15_000 });
      return;
    }
    await this.page.goto('/shop-new/product');
    await this.page.waitForURL(/shop-new\/product/i, { timeout: 15_000 });
  }

  async removeAllCartItems(): Promise<string[]> {
    await this.waitForCart();
    const removed: string[] = [];
    const maxRemovals = 10;

    for (let attempt = 0; attempt < maxRemovals; attempt++) {
      if (await this.emptyCartMessage.isVisible().catch(() => false)) {
        break;
      }
      if ((await this.cartProductCards.count()) === 0) {
        break;
      }
      if (!(await this.trashIcon.first().isVisible().catch(() => false))) {
        break;
      }

      const name = await this.text(
        this.cartProductCards.first().getByRole('heading', { level: 3 }));
      await this.clickTrash();
      await this.clickRemove();
      removed.push(name);
      await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    }

    return removed;
  }

  async getCartItemCount(): Promise<number> {
    await this.page.waitForURL(/shop-new\/cart/i, { timeout: 15_000 });
    return this.cartProductCards.count();
  }

  async getCartItemDetails(productName: string): Promise<ShopCartItemDetails> {
    await this.waitForCart();
    const item = this.cartItem(productName);
    await item.waitFor({ state: 'visible', timeout: 10_000 });

    return {
      productName: await this.text(item.getByRole('heading', { level: 3 })),
      netWeight: await this.text(item.getByText(/Net weight:/i)),
      quantity: await this.text(item.locator('.p-dropdown .p-dropdown-label').first()),
      itemPrice: this.parseAmount(
        await this.text(item.locator('p.font-bold').filter({ hasText: /^₹/ }))),
    };
  }

  /** TC003 only — EMI lines omit quantity; do not use for Buy Now rows (use getCartItemDetails). */
  async getEmiCartItemDetails(productName: string): Promise<ShopEmiCartItemDetails> {
    await this.waitForCart();
    const item = this.cartItem(productName);
    await item.waitFor({ state: 'visible', timeout: 10_000 });

    return {
      productName: await this.text(item.getByRole('heading', { level: 3 })),
      netWeight: await this.text(item.getByText(/Net weight:/i)),
      itemPrice: this.parseAmount(
        await this.text(item.locator('p.font-bold').filter({ hasText: /^₹/ }))),
    };
  }

  async expectEmiCartItemMatchesNetPayable(
    productName: string,
    expectedNetPayable: number): Promise<ShopEmiCartItemDetails> {
    const cartItem = await this.getEmiCartItemDetails(productName);
    expect(cartItem.productName).toContain(productName);
    expect(cartItem.itemPrice).toBe(expectedNetPayable);
    return cartItem;
  }

  async getCartPriceDetails(): Promise<ShopCartPriceDetails> {
    await this.waitForCart();
    await this.priceDetailsSection.waitFor({ state: 'visible', timeout: 10_000 });

    return {
      metalPrice: await this.priceRow('Metal Price'),
      makingAndDeliveryCharges: await this.priceRow('Making & Delivery Charges'),
      tax: await this.priceRow('Tax'),
      savings: await this.getSavingsAmount(),
      grandTotal: await this.priceRow('Grand Total'),
    };
  }

  /** TC_SHOP_012 — available User Savings shown beside the cart toggle (`Use Savings: ₹…`). */
  async readAvailableUserSavingsBalance(): Promise<number> {
    await this.waitForCart();
    const savingsLabel = this.page.getByText(/^Use Savings:/i);
    await savingsLabel.waitFor({ state: 'visible', timeout: 15_000 });
    const labelText = ((await savingsLabel.innerText()) ?? '').replace(/\s+/g, ' ').trim();
    const amountMatch = labelText.match(/₹[\d,]+(?:\.\d+)?/);
    if (!amountMatch) {
      throw new Error(`Could not parse User Savings balance from cart label: "${labelText}"`);
    }
    return this.parseAmount(amountMatch[0]);
  }

  /** Clicks the Use Savings toggle on the cart page (PrimeNG hidden input + visible box). */
  async clickUseSavingCheckbox(): Promise<void> {
    await this.waitForCart();
    const savingsLabel = this.page.getByText(/^Use Savings:/i);
    await savingsLabel.scrollIntoViewIfNeeded();
    const savingsRow = this.page.locator('div').filter({ has: savingsLabel });
    const hiddenInput = savingsRow.locator(
      'input[type="checkbox"][data-pc-section="hiddenInput"], input.p-element[type="checkbox"]').first();
    await hiddenInput.waitFor({ state: 'attached', timeout: 15_000 });

    const isChecked = async (): Promise<boolean> =>
      (await hiddenInput.getAttribute('aria-checked')) === 'true' ||
      (await hiddenInput.isChecked().catch(() => false));

    if (!(await isChecked())) {
      const visibleToggle = savingsRow.locator('p-checkbox .p-checkbox-box, .p-checkbox-box').first();
      if (await visibleToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await visibleToggle.click();
      } else {
        await savingsLabel.locator('xpath=preceding-sibling::*[1]').click({ force: true });
      }
    }
    await expect(hiddenInput).toHaveAttribute('aria-checked', 'true', { timeout: 10_000 });
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  }

  /**
   * TC004 — cart payable after Use Saving (metal + charges + tax − savings).
   * Cart has no paid-from-funds row; TC001/002 checkout uses getCalculatedGrandTotal on shop-checkout page.
   */
  getCalculatedCartGrandTotal(price: ShopCartPriceDetails): number {
    return Number(
      (price.metalPrice + price.makingAndDeliveryCharges + price.tax - price.savings).toFixed(2));
  }

  /** Reads the Savings row amount from cart Price Details (0 if row is hidden). */
  async getSavingsAmount(): Promise<number> {
    await this.priceDetailsSection.waitFor({ state: 'visible', timeout: 10_000 });
    const labelCell = this.priceDetailsSection.getByText(/^Savings$/i);
    const visible = await labelCell.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!visible) {
      return 0;
    }
    return this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]')));
  }

  /**
   * TC004 — applied savings after Use Savings toggle (Savings row or line-total delta).
   */
  async getAppliedCartSavingsAmount(): Promise<number> {
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.priceDetailsSection
      .getByText(/^Savings$/i)
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {});
    const fromRow = await this.getSavingsAmount();
    if (fromRow > 0) {
      return fromRow;
    }
    const price = await this.getCartPriceDetails();
    return Number(
      (price.metalPrice + price.makingAndDeliveryCharges + price.tax - price.grandTotal).toFixed(2));
  }

  /**
   * After {@link clickUseSavingCheckbox} — poll until Savings row or reduced Grand Total shows applied amount.
   */
  async waitForAppliedCartSavings(orderGrandTotal: number, timeoutMs = 25_000): Promise<number> {
    let applied = 0;
    await expect
      .poll(
        async () => {
          applied = await this.getAppliedCartSavingsAmount();
          if (applied > 0) {
            return applied;
          }
          const grand = (await this.getCartPriceDetails()).grandTotal;
          const delta = Number((orderGrandTotal - grand).toFixed(2));
          if (delta > 0.01) {
            applied = delta;
            return applied;
          }
          return 0;
        },
        { timeout: timeoutMs, intervals: [400, 800, 1500] })
      .toBeGreaterThan(0);
    return applied;
  }

  /** TC003 only — mixed EMI cart uses TAX and Initial Payment rows. */
  async getEmiMixedCartPriceDetails(): Promise<ShopEmiMixedCartPriceDetails> {
    await this.waitForCart();
    await this.priceDetailsSection.waitFor({ state: 'visible', timeout: 10_000 });

    return {
      metalPrice: await this.priceRow('Metal Price'),
      initialPayment: await this.priceRow('Initial Payment'),
      makingAndDeliveryCharges: await this.priceRow('Making & Delivery Charges'),
      tax: await this.priceRowEither('Tax', 'TAX'),
      grandTotal: await this.priceRow('Grand Total'),
    };
  }

  private cartItem(productName: string): Locator {
    return this.cartProductCards.filter({
      has: this.page.getByRole('heading', { name: productName, level: 3 }),
    });
  }

  private async priceRow(label: string): Promise<number> {
    const labelCell = this.priceDetailsSection.getByText(label, { exact: true });
    return this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]')));
  }

  private async priceRowEither(...labels: string[]): Promise<number> {
    for (const label of labels) {
      const labelCell = this.priceDetailsSection.getByText(label, { exact: true });
      if (await labelCell.isVisible({ timeout: 2_000 }).catch(() => false)) {
        return this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]')));
      }
    }
    throw new Error(`Price row not found in cart: ${labels.join(' | ')}`);
  }

  private async text(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }
}
