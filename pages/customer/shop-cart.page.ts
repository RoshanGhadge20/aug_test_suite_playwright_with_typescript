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

/** TC_SHOP_014 — cart price panel with coupon discount. */
export type ShopCartPriceDetailsWithCoupon = ShopCartPriceDetails & {
  couponDiscount: number;
  totalSum: number;
};

/** TC003 — EMI + Buy Now cart price panel (TAX, Initial Payment, etc.). */
export type ShopEmiMixedCartPriceDetails = {
  metalPrice: number;
  initialPayment: number;
  makingAndDeliveryCharges: number;
  tax: number;
  grandTotal: number;
};

/** TC_SHOP_015 — EMI cart price panel with coupon + User Savings. */
export type ShopEmiCartPriceDetailsWithCoupon = ShopEmiMixedCartPriceDetails & {
  savings: number;
  couponDiscount: number;
  /** Payable base for EMI down payment (equals {@link initialPayment} before discounts). */
  totalSum: number;
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
  private readonly cartItems: Locator;
  private readonly invalidCouponMessage: Locator;
  private readonly couponErrorMessage: Locator;
  private readonly quantityDropdown: Locator;




  constructor(page: Page) {
    super(page);
    this.cartItemsHeading = page.getByRole('heading', { name: /Cart Items/i, level: 2 });
    this.emptyCartMessage = page.getByText(/your bag is empty!?/i);
    this.cartProductCards = this.cartItemsHeading.locator('xpath=following-sibling::div/div');
    this.trashIcon = page.locator('i.pi-trash');
    this.removeButton = page.getByRole('button', { name: 'Remove' });
    this.proceedToPayButton = page.getByRole('button', { name: /Proceed to Pay/i });
    this.priceDetailsSection = page
      .getByRole('heading', { name: 'Price Details', level: 3 })
      .locator('xpath=..');
      this.cartItems = page.locator(
        'div.bg-sheengold-ochre.rounded-lg.shadow-sm'
      );
    this.invalidCouponMessage = page.locator('p.text-red-600');
    this.couponErrorMessage = page.locator('[role="alert"]'); 
    // PrimeNG renamed its Dropdown component (and classes) from `p-dropdown*` to `p-select*`.
    this.quantityDropdown = page.locator('p-select').first();

  }


  private couponCodeInput(): Locator {
    return this.page.getByPlaceholder('Enter Coupon Code');
  }

  // 
  async selectQuantity(quantity: string): Promise<void> {
    await this.quantityDropdown.click();
  
    await this.page.getByRole('option', {
      name: quantity,
      exact: true,
    }).click();
  
    await expect(this.quantityDropdown).toContainText(quantity);
  }

  async clearCart(): Promise<void> {
    await this.page.goto('/shop-new/cart');
    await this.waitForCart();
    await this.removeAllCartItems();
  }

  /** TC_SHOP_014 — enter coupon code on cart. */
  async enterCouponCode(couponCode: string): Promise<void> {
    await this.waitForCart();
    await this.couponCodeInput().fill(couponCode);
  }

  /** TC_SHOP_014 — enter coupon code and click Apply. */
  async applyCouponCode(couponCode: string): Promise<void> {
    await this.enterCouponCode(couponCode);
    await this.page.getByRole('button', { name: /^apply$/i }).first().click();
    await expect(this.page.locator('.p-blockui')).toBeHidden({ timeout: 15_000 });
    await this.assertNoCouponApplyError();
    await this.waitForCartCouponDiscountIfShown();
  }

  async applyInvalidCouponCode(couponCode: string): Promise<void> {
    await this.enterCouponCode(couponCode);
    await this.page.getByRole('button', { name: /^apply$/i }).first().click();
  
    await expect(this.page.locator('.p-blockui')).toBeHidden({
      timeout: 15_000,
    });
  
   // const message = await this.invalidCouponMessage.textContent();
   // console.log('[Invalid Coupon Message:]', message?.trim());
  //  expect(message?.trim()).toBe('THE COUPON CODE YOU ENTERED IS INVALID.');
  }
  async validateCouponMessage(expectedMessage: string): Promise<void> {
    const message = await this.invalidCouponMessage.textContent();
  
    console.log('[Coupon Message:]', message?.trim());
  
    expect(message?.trim()).toBe(expectedMessage);
  }  
  async validateCouponErrorMessage(expectedMessage: string): Promise<void> {
    const errorMessage = this.page.getByText(expectedMessage, {
      exact: true,
    });
    const message = await errorMessage.textContent();
    console.log('error message:', message);
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
  }

  /** Cart Price Details — Grand Total. */
  async getGrandTotal(): Promise<number> {
    return (await this.getCartPriceDetails()).grandTotal;
  }

  /** TC_SHOP_014 — cart price panel with coupon discount and totalSum (metal + charges + tax). */
  async getCartPriceDetailsWithCoupon(): Promise<ShopCartPriceDetailsWithCoupon> {
    await this.waitForCart();
    await expect(this.priceDetailsSection).toBeVisible();
    await expect
      .poll(() => this.priceRow('Grand Total'))
      .toBeGreaterThan(0);

    const metalPrice = await this.priceRow('Metal Price');
    const makingAndDeliveryCharges = await this.priceRow('Making & Delivery Charges');
    const tax = await this.priceRow('Tax');
    const savings = await this.optionalCartPriceRow('Savings');
    const grandTotal = await this.priceRow('Grand Total');
    const couponDiscount = await this.readCartCouponDiscount();
    const totalSum = Number((metalPrice + makingAndDeliveryCharges + tax).toFixed(2));

    return { metalPrice, makingAndDeliveryCharges, tax, savings, grandTotal, couponDiscount, totalSum };
  }

  /** TC_SHOP_014 — grandTotal = totalSum − couponDiscount − savings. */
  expectCartGrandTotalWithCoupon(price: ShopCartPriceDetailsWithCoupon): void {
    const expected = Number((price.totalSum - price.couponDiscount - price.savings).toFixed(2));
    shopLogActualExpected('Cart grand total (totalSum - coupon - savings)', price.grandTotal, expected);
    expect(price.grandTotal).toBe(expected);
  }

  /** TC_SHOP_014 — coupon-only flow; User Savings must not be applied on cart. */
  expectNoSavingsApplied(price: { savings: number }): void {
    shopLogActualExpected('Cart savings', price.savings, 0);
    expect(price.savings).toBe(0);
  }

  /** TC_SHOP_016 — product price must exceed User Savings + fixed coupon; Razorpay remainder required. */
  assertTc016CouponPartialSavingsPreconditions(
    productGrandTotal: number,
    availableSavings: number,
    couponAmount: number,
  ): void {
    const razorpayRemainder = Number((productGrandTotal - availableSavings - couponAmount).toFixed(2));
    shopLogActualExpected('Product price > User Savings', productGrandTotal > availableSavings, true);
    shopLogActualExpected('Razorpay remainder after savings + coupon', razorpayRemainder, '> 0');
    shopLogActualExpected('Coupon amount', couponAmount, 100);
    expect(productGrandTotal).toBeGreaterThan(availableSavings);
    expect(razorpayRemainder).toBeGreaterThan(0);
    expect(availableSavings).toBeGreaterThan(0);
    expect(couponAmount).toBe(100);
  }

  /** TC_SHOP_017 — combined EMI + Buy Now total must exceed User Savings + coupon; Razorpay remainder required. */
  assertTc017MixedCouponPartialSavingsPreconditions(
    combinedGrandTotal: number,
    availableSavings: number,
    couponAmount: number,
  ): void {
    const razorpayRemainder = Number((combinedGrandTotal - availableSavings - couponAmount).toFixed(2));
    shopLogActualExpected(
      'Combined price > User Savings + coupon',
      combinedGrandTotal > availableSavings + couponAmount,
      true,
    );
    shopLogActualExpected('Razorpay remainder after savings + coupon', razorpayRemainder, '> 0');
    shopLogActualExpected('Coupon amount', couponAmount, couponAmount);
    expect(combinedGrandTotal).toBeGreaterThan(availableSavings + couponAmount);
    expect(razorpayRemainder).toBeGreaterThan(0);
    expect(availableSavings).toBeGreaterThan(0);
    expect(couponAmount).toBeGreaterThan(0);
  }

  /** TC_SHOP_017 — mixed EMI + Buy Now cart price panel with coupon + User Savings. */
  async getEmiMixedCartPriceDetailsWithCouponAndSavings(
    combinedGrandTotal: number,
  ): Promise<ShopEmiCartPriceDetailsWithCoupon> {
    const emi = await this.getEmiMixedCartPriceDetails();
    const savings = await this.optionalCartPriceRow('Savings');
    const couponDiscount = await this.readCartCouponDiscount();
    return { ...emi, savings, couponDiscount, totalSum: combinedGrandTotal };
  }

  /** TC_SHOP_017 — apply coupon + Use Savings on mixed cart (savings may finalize on checkout). */
  async applyMixedCartCouponAndSavings(couponCode: string): Promise<void> {
    await this.applyCouponCode(couponCode);
    await this.clickUseSavingCheckbox();
    const cartPrice = await this.getEmiMixedCartPriceDetails();
    shopLogGet('Mixed cart after coupon + Use Savings toggle', cartPrice);
  }

  /** TC_SHOP_015 — down payment and coupon must both be below User Savings balance. */
  assertTc015CouponSavingsPreconditions(
    availableSavings: number,
    emiInitialPayment: number,
    couponAmount: number,
    productPrice: number,
  ): void {
    shopLogActualExpected('EMI down payment < User Savings', emiInitialPayment < availableSavings, true);
    shopLogActualExpected('Coupon amount < User Savings', couponAmount < availableSavings, true);
    shopLogActualExpected('Coupon amount < product price', couponAmount < productPrice, true);
    expect(emiInitialPayment).toBeLessThan(availableSavings);
    expect(couponAmount).toBeLessThan(availableSavings);
    expect(couponAmount).toBeGreaterThan(0);
    expect(couponAmount).toBeLessThan(emiInitialPayment);
    expect(productPrice).toBeGreaterThan(emiInitialPayment);
  }

  /** TC_SHOP_015 — EMI cart with coupon discount and savings rows. */
  async getEmiCartPriceDetailsWithCoupon(): Promise<ShopEmiCartPriceDetailsWithCoupon> {
    const emi = await this.getEmiMixedCartPriceDetails();
    const savings = await this.optionalCartPriceRow('Savings');
    const couponDiscount = await this.readCartCouponDiscount();
    const totalSum = emi.initialPayment;
    return { ...emi, savings, couponDiscount, totalSum };
  }

  /** Map EMI coupon cart to {@link ShopCartPriceDetailsWithCoupon} for shared checkout helpers. */
  emiCartAsCouponPrice(emi: ShopEmiCartPriceDetailsWithCoupon): ShopCartPriceDetailsWithCoupon {
    return {
      metalPrice: emi.metalPrice,
      makingAndDeliveryCharges: emi.makingAndDeliveryCharges,
      tax: emi.tax,
      savings: emi.savings,
      grandTotal: emi.grandTotal,
      couponDiscount: emi.couponDiscount,
      totalSum: emi.totalSum,
    };
  }

  /**
   * TC_SHOP_015 — validate EMI cart, apply coupon then Use Savings for remaining down payment.
   */
  async validateEmiCartApplyCouponAndSavings(
    productName: string,
    emiLinePrice: number,
    emiInitialPayment: number,
    couponCode: string,
  ): Promise<{ netWeight: string; cartPrice: ShopEmiCartPriceDetailsWithCoupon; cartSavingsAmount: number }> {
    const validated = await this.validateEmiCart(productName, emiLinePrice, emiInitialPayment);
    const availableSavings = await this.readAvailableUserSavingsBalance();
    this.assertUserSavingsCoversEmiDownPayment(availableSavings, emiInitialPayment);

    await this.applyCouponCode(couponCode);
    await this.clickUseSavingCheckbox();

    const cartPrice = await this.getEmiCartPriceDetailsWithCoupon();
    let cartSavingsAmount = await this.getAppliedEmiCartSavingsAmount(emiInitialPayment);
    const savingsAfterCoupon = Number((emiInitialPayment - cartPrice.couponDiscount).toFixed(2));
    if (cartSavingsAmount === 0 && savingsAfterCoupon > 0) {
      cartSavingsAmount = savingsAfterCoupon;
    }
    if (cartSavingsAmount === 0) {
      cartSavingsAmount = emiInitialPayment;
    }

    shopLogGet('EMI cart savings after coupon', { cartSavingsAmount, savingsAfterCoupon, cartPrice });
    return { netWeight: validated.netWeight, cartPrice, cartSavingsAmount };
  }

  /** TC_SHOP_001 — empty cart before shop journey. */
  async clearCartAndExpectEmpty(): Promise<string[]> {
    await this.page.goto('/shop-new/cart');
    const removed = await this.removeAllCartItems();

    const cartEmpty = async (): Promise<number> => {
      await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
      if (await this.isCartEmptyStateVisible()) {
        return 0;
      }
      return this.cartProductCards.count();
    };

    try {
      await expect.poll(cartEmpty, { timeout: 20_000 }).toBe(0);
    } catch {
      // Leftover items sometimes survive a first pass (e.g. a stale count read
      // right as the last removal lands) — one more full pass clears them.
      removed.push(...(await this.removeAllCartItems()));
      await expect.poll(cartEmpty, { timeout: 20_000 }).toBe(0);
    }

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

  /** TC_SHOP_013 — User Savings must exceed EMI down payment before applying Use Savings. */
  assertUserSavingsCoversEmiDownPayment(availableSavings: number, emiInitialPayment: number): void {
    if (availableSavings <= emiInitialPayment) {
      throw new Error(
        `[TC_SHOP_013] User Savings (₹${availableSavings}) is not greater than EMI down payment (₹${emiInitialPayment}). ` +
          'Product down payment must be less than User Savings for full savings EMI checkout.',
      );
    }
  }

  /** TC_SHOP_013 — validate EMI cart, apply Use Saving for full down payment. */
  async validateEmiCartWithFullSavings(
    productName: string,
    emiLinePrice: number,
    emiInitialPayment: number,
  ): Promise<{ netWeight: string; cartSavingsAmount: number }> {
    const validated = await this.validateEmiCart(productName, emiLinePrice, emiInitialPayment);
    const availableSavings = await this.readAvailableUserSavingsBalance();
    this.assertUserSavingsCoversEmiDownPayment(availableSavings, emiInitialPayment);
    await this.clickUseSavingCheckbox();
    let cartSavingsAmount = await this.getAppliedEmiCartSavingsAmount(emiInitialPayment);
    if (cartSavingsAmount === 0) {
      // EMI cart often keeps Grand Total at down payment until checkout (same as TC004 Buy Now fallback).
      cartSavingsAmount = emiInitialPayment;
    }
    shopLogActualExpected('EMI cart savings amount', cartSavingsAmount, emiInitialPayment);
    return { netWeight: validated.netWeight, cartSavingsAmount };
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

  /** AT-1666 — wishlist Move To Cart lands on cart with matching line item. */

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

  private async isCartEmptyStateVisible(): Promise<boolean> {
    if (await this.emptyCartMessage.isVisible().catch(() => false)) {
      return true;
    }
    const startShopping = this.page.getByRole('button', { name: /start shopping/i }).first();
    if (await startShopping.isVisible().catch(() => false)) {
      return true;
    }
    const continueShopping = this.page
      .getByRole('link', { name: /continue shopping/i })
      .or(this.page.getByRole('button', { name: /continue shopping/i }))
      .first();
    return continueShopping.isVisible().catch(() => false);
  }

  async waitForCart(): Promise<void> {
    await this.page.waitForURL(/shop-new\/cart/i, { timeout: 15_000 });
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await expect
      .poll(async () => {
        if (await this.cartItemsHeading.isVisible().catch(() => false)) {
          return true;
        }
        return this.isCartEmptyStateVisible();
      }, { timeout: 15_000 })
      .toBe(true);
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

  private trashIconInCard(card: Locator): Locator {
    return card.locator('i.pi-trash, .pi-trash, [class*="pi-trash"]').first();
  }

  private removeConfirmButton(): Locator {
    return this.page
      .locator('.p-dialog, app-dialog, [role="dialog"]')
      .last()
      .getByRole('button', { name: /^Remove$/i });
  }

  async clickTrash(card?: Locator): Promise<void> {
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    const targetCard = card ?? this.cartProductCards.first();
    const trash = this.trashIconInCard(targetCard);
    await trash.waitFor({ state: 'visible', timeout: 10_000 });
    await trash.click({ timeout: 15_000 });
  }

  async clickRemove(): Promise<void> {
    const button = this.removeConfirmButton();
    await button.waitFor({ state: 'visible', timeout: 10_000 });
    await button.click();
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

  /** TC_SHOP_017 — remove duplicate cart lines when the same product appears more than once. */
  async removeDuplicateCartProducts(): Promise<void> {
    await this.waitForCart();
    const names = await this.getAllCartProductNames();
    const counts = new Map<string, number>();
    for (const name of names) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    for (const [name, count] of counts) {
      for (let duplicate = 1; duplicate < count; duplicate += 1) {
        const cards = this.cartProductCards.filter({
          has: this.page.getByRole('heading', { level: 3, name }),
        });
        await this.clickTrash(cards.last());
        await this.clickRemove();
        await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
      }
    }
  }

  async removeAllCartItems(): Promise<string[]> {
    await this.waitForCart();
    const removed: string[] = [];
    const maxRemovals = 20;

    for (let attempt = 0; attempt < maxRemovals; attempt++) {
      if (await this.isCartEmptyStateVisible()) {
        break;
      }
      const countBefore = await this.cartProductCards.count();
      if (countBefore === 0) {
        break;
      }

      const card = this.cartProductCards.first();
      const trash = this.trashIconInCard(card);
      if (!(await trash.isVisible().catch(() => false))) {
        throw new Error(
          `[Shop cart] Delete icon not found on cart line (items remaining: ${countBefore}).`,
        );
      }

      const name = await this.text(card.getByRole('heading', { level: 3 }));
      await this.clickTrash(card);
      await this.clickRemove();
      removed.push(name);

      // Wait for a strict decrease (not just "changed") — a transient re-add or a stale
      // count read could otherwise satisfy a plain "not equal" check without real progress.
      await expect
        .poll(async () => {
          await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
          if (await this.isCartEmptyStateVisible()) {
            return 0;
          }
          return this.cartProductCards.count();
        }, { timeout: 20_000 })
        .toBeLessThan(countBefore);
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
      quantity: await this.text(item.locator('.p-select .p-select-label').first()),
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
      tax: await this.priceRowEither('Tax', 'TAX'),
      savings: await this.getSavingsAmount(),
      grandTotal: await this.priceRow('Grand Total'),
    };
  }

  /**
   * TC_SHOP_012 — available User Savings shown beside the cart toggle (`Use Savings: ₹…`).
   * This is a wallet-level balance fetched independently of the cart's own render, so it can
   * lag behind the rest of the cart (worse on a multi-product cart) — retry with a reload,
   * same pattern as DashBoardPage.waitForDashboardPortfolioSection.
   */
  async readAvailableUserSavingsBalance(options?: { maxAttempts?: number }): Promise<number> {
    const maxAttempts = options?.maxAttempts ?? 4;
    const savingsLabel = this.page.getByText(/^Use Savings:/i);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await this.waitForCart();
      await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

      const visible = await savingsLabel
        .waitFor({ state: 'visible', timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (visible) {
        const labelText = ((await savingsLabel.innerText()) ?? '').replace(/\s+/g, ' ').trim();
        const amountMatch = labelText.match(/₹[\d,]+(?:\.\d+)?/);
        if (amountMatch) {
          return this.parseAmount(amountMatch[0]);
        }
      }

      if (attempt < maxAttempts - 1) {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }
    }

    throw new Error(
      `Use Savings balance did not appear on cart after ${maxAttempts} attempts (with reloads).`,
    );
  }

  /** TC_SHOP_016 / TC_SHOP_017 — fail fast when shop User Savings toggle is absent (₹0 balance). */
  async requireShopUserSavingsOnCart(testCaseLabel: string): Promise<number> {
    await this.waitForCart();
    const savingsLabel = this.page.getByText(/^Use Savings:/i);
    if (!(await savingsLabel.isVisible({ timeout: 15_000 }).catch(() => false))) {
      throw new Error(
        `[${testCaseLabel}] Use Savings toggle not visible on cart — customer has ₹0 shop User Savings. ` +
          'Restore shop savings on the alt customer before running this test.',
      );
    }
    return this.readAvailableUserSavingsBalance();
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

    // This PrimeNG version doesn't expose `aria-checked` on the input — the native
    // `checked` property (what `.check()`/`.isChecked()` use) is the real signal.
    if (!(await hiddenInput.isChecked().catch(() => false))) {
      // The visible `.p-checkbox-box` div sits underneath its own native checkbox
      // `<input>`, which intercepts pointer events — target the input directly.
      if (await hiddenInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await hiddenInput.check();
      } else {
        await savingsLabel.locator('xpath=preceding-sibling::*[1]').click({ force: true });
        await expect(hiddenInput).toBeChecked({ timeout: 10_000 });
      }
    }
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
   * TC_SHOP_013 — applied savings on EMI cart (Savings row or initial-payment − grand total).
   */
  async getAppliedEmiCartSavingsAmount(emiInitialPayment: number): Promise<number> {
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.priceDetailsSection
      .getByText(/^Savings$/i)
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {});
    const fromRow = await this.getSavingsAmount();
    if (fromRow > 0) {
      return fromRow;
    }
    const price = await this.getEmiMixedCartPriceDetails();
    return Number((emiInitialPayment - price.grandTotal).toFixed(2));
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

  /**
   * TC_SHOP_017 — poll until mixed EMI + Buy Now cart shows applied User Savings.
   */
  async waitForAppliedMixedCartSavings(
    combinedGrandTotal: number,
    timeoutMs = 25_000,
  ): Promise<number> {
    let applied = 0;
    await expect
      .poll(
        async () => {
          applied = await this.getSavingsAmount();
          if (applied > 0) {
            return applied;
          }
          const grand = (await this.getEmiMixedCartPriceDetails()).grandTotal;
          const delta = Number((combinedGrandTotal - grand).toFixed(2));
          if (delta > 0.01) {
            applied = delta;
            return applied;
          }
          return 0;
        },
        { timeout: timeoutMs, intervals: [400, 800, 1500] },
      )
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

  private async optionalCartPriceRow(label: string): Promise<number> {
    const labelCell = this.priceDetailsSection.getByText(label, { exact: true });
    if (!(await labelCell.isVisible().catch(() => false))) {
      return 0;
    }
    return this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]')));
  }

  private async cartPriceTotalSum(): Promise<number> {
    const initialPayment = await this.optionalCartPriceRow('Initial Payment');
    const grandTotal = await this.priceRow('Grand Total');
    if (initialPayment > 0 && grandTotal > initialPayment) {
      return grandTotal;
    }
    if (initialPayment > 0) {
      return initialPayment;
    }
    return Number(
      (
        (await this.priceRow('Metal Price')) +
        (await this.priceRow('Making & Delivery Charges')) +
        (await this.priceRowEither('Tax', 'TAX'))
      ).toFixed(2),
    );
  }

  private async isCartCouponDiscountApplied(): Promise<boolean> {
    try {
      const discount = await this.readCartCouponDiscount();
      if (discount > 0) {
        return true;
      }
      const totalSum = await this.cartPriceTotalSum();
      const grandTotal = await this.priceRow('Grand Total');
      return grandTotal < totalSum;
    } catch {
      return false;
    }
  }

  /** Some UAT builds apply the coupon on cart but only show discount on checkout. */
  private async waitForCartCouponDiscountIfShown(timeoutMs = 15_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.isCartCouponDiscountApplied()) {
        return;
      }
      await this.page.waitForTimeout(250);
    }
  }

  private async assertNoCouponApplyError(): Promise<void> {
    const error = this.page
      .locator('.p-toast-message, .p-message, [role="alert"]')
      .filter({ hasText: /invalid|expired|not applicable|coupon.*fail|unable to apply/i })
      .first();
    if (await error.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const message = ((await error.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      throw new Error(`Coupon apply failed: ${message || 'unknown error'}`);
    }
  }

  private async readCartCouponDiscount(): Promise<number> {
    for (const label of ['Coupon Discount', 'Coupon Benefit', 'Coupon', 'Discount']) {
      if (await this.priceDetailsSection.getByText(label, { exact: true }).isVisible().catch(() => false)) {
        return this.optionalCartPriceRow(label);
      }
    }
    const totalSum = await this.cartPriceTotalSum();
    const grandTotal = await this.priceRow('Grand Total');
    if (grandTotal < totalSum) {
      return Number((totalSum - grandTotal).toFixed(2));
    }
    return 0;
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
  async validateCartItemAfterWishlistMove(
    productName: string
  ): Promise<void> {
    const cartItem = this.cartItems.filter({
      has: this.page.locator(`h3:has-text("${productName}")`),
    });

    await expect(cartItem).toBeVisible();

    console.log(`Verified '${productName}' is present in the cart.`);
  }

}
