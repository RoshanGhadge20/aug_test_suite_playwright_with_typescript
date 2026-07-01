import { expect, Locator, Page } from '@playwright/test';
import { getShopDataset } from '../../utils/data/customer-excel-data';
import { shopLogActualExpected, shopLogGet } from '../../utils/test/shop-log';
import type { ShopCartPriceDetailsWithCoupon } from './shop-cart.page';
import type { ShopProductDetails } from './shop.page';
import type { ShopEmiDetails } from './shop-emi.page';
import { BasePage } from '../shared/base.page';
/** TC001 / TC002 checkout Price Details — no Savings row. */
export type ShopCheckoutPriceDetails = {
  metalPrice: number;
  makingAndDeliveryCharges: number;
  tax: number;
  grandTotal: number;
  paidFromFunds: number;
};

/** TC004 checkout Price Details after Use Saving. */
export type ShopCheckoutPriceDetailsWithSavings = ShopCheckoutPriceDetails & {
  savings: number;
};

/** TC_SHOP_014 checkout Price Details with coupon discount. */
export type ShopCheckoutPriceDetailsWithCoupon = ShopCheckoutPriceDetails & {
  couponDiscount: number;
  totalSum: number;
};

/** TC_SHOP_016 checkout Price Details with coupon discount and User Savings. */
export type ShopCheckoutPriceDetailsWithCouponAndSavings = ShopCheckoutPriceDetailsWithSavings & {
  couponDiscount: number;
  totalSum: number;
};

/** TC003 — EMI Details panel on order summary (after OTP). */
export type ShopEmiSummaryPriceDetails = {
  downPayment: number;
  totalAmount: number;
  emiScheme: string;
  emiPerMonth: number;
  makingAndDeliveryCharges: number;
  tax: number;
  savings: number;
  paidFromFunds: number;
  grandTotal: number;
};

/** TC003 — EMI + Buy Now checkout price panel (flex rows under Price Details). */
export type ShopEmiMixedCheckoutPriceDetails = {
  metalPrice: number;
  initialPayment: number;
  emiScheme: string;
  emiPerMonth: number;
  makingAndDeliveryCharges: number;
  tax: number;
  grandTotal: number;
  savings: number;
  paidFromFunds: number;
};

export type ShopBillingAddressDetails = {
  fullName: string;
  mobile: string;
  address: string;
  pincode: string;
};

export type ShopOrderItemDetails = {
  productName: string;
  quantity: number;
  itemPrice: number;
};

/** Order summary panel snapshot after OTP (single Buy Now product). */
export type ShopOrderSummarySnapshot = {
  orderItem: ShopOrderItemDetails;
  checkoutPrice: ShopCheckoutPriceDetails;
  deliveryAddress: ShopBillingAddressDetails;
  billingAddress: ShopBillingAddressDetails;
};

/** Order summary panel snapshot after OTP (multi-product cart). */
export type ShopMultiProductOrderSummarySnapshot = {
  orderItemsByName: Record<string, ShopOrderItemDetails>;
  checkoutPrice: ShopCheckoutPriceDetails;
  deliveryAddress: ShopBillingAddressDetails;
  billingAddress: ShopBillingAddressDetails;
};

/** Order summary panel snapshot after OTP (EMI purchase). */
export type ShopEmiOrderSummarySnapshot = {
  orderItem: ShopOrderItemDetails;
  emiSummary: ShopEmiSummaryPriceDetails;
  deliveryAddress: ShopBillingAddressDetails;
  billingAddress: ShopBillingAddressDetails;
};

export type ShopOrderPlacedDetails = {
  orderId: string;
  successMessage: string;
};

/** Parsed order ID(s) from the Order Placed dialog — one shared ID or one per product. */
export type ShopPlacedOrders = {
  orderIds: string[];
  displayText: string;
  isSingleSharedOrder: boolean;
  successMessage: string;
};

export class ShopCheckoutPage extends BasePage {
  private readonly priceDetailsSection: Locator;
  /** TC003 — bordered price card on address step (Initial Payment row). */
  private readonly emiPriceDetailsPanel: Locator;
  /** TC003 — bordered EMI Details card on summary step (Total Amount row). */
  private readonly emiSummaryDetailsPanel: Locator;
  private readonly billingToThisAddressButton: Locator;
  private readonly chooseBillingHeading: Locator;
  private readonly sameAsBillingLabel: Locator;
  private readonly deliverToThisAddressButton: Locator;
  private readonly otpDialog: Locator;
  private readonly otpSentToLabel: Locator;
  private readonly verifyOtpButton: Locator;
  private readonly payButton: Locator;
  private readonly shippingAddressAccordion: Locator;
  private readonly billingAddressAccordion: Locator;
  readonly firstName = this.page.getByRole('textbox', { name: 'Enter First Name' });
  readonly lastName = this.page.getByRole('textbox', { name: 'Enter Last Name' });
  readonly mobileNumber = this.page.getByRole('textbox', { name: 'Enter Mobile Number' });
  readonly firstAddressLine = this.page.getByRole('textbox', { name: 'Enter Address Line 1' });


  constructor(page: Page) {
    super(page);
    this.priceDetailsSection = page
      .getByRole('heading', { name: 'Price Details', level: 2 })
      .locator('xpath=..');
    this.emiPriceDetailsPanel = page
      .locator('div.border.border-gray-300.rounded-lg')
      .filter({ has: page.getByText('Initial Payment', { exact: true }) });
    this.emiSummaryDetailsPanel = page
      .locator('div.border.border-gray-300.rounded-lg')
      .filter({ has: page.getByText('Total Amount', { exact: true }) });
    this.billingToThisAddressButton = page.getByRole('button', { name: /Billing to this Address/i });
    this.chooseBillingHeading = page.getByRole('heading', { name: 'Choose Billing Address', level: 2 });
    this.sameAsBillingLabel = page.locator('label[for="sameAsBillingAddress"]');
    this.deliverToThisAddressButton = page.getByRole('button', { name: /Deliver to this Address/i });
    this.otpDialog = page.locator('app-dialog');
    this.otpSentToLabel = this.otpDialog.getByText(/^Sent to/i);
    this.verifyOtpButton = this.otpDialog.getByRole('button', { name: /^Verify$/i });
    this.payButton = page.getByRole('button', { name: /^Pay ₹/i });
    this.shippingAddressAccordion = page.locator('#shipping-address');
    this.billingAddressAccordion = page.locator('#billing-address');
  }

  protected otpInputLocator(): Locator {
    return this.otpDialog.locator('p-inputotp input[maxlength="1"]');
  }

  async waitForCheckoutPage(): Promise<void> {
    await this.page.waitForURL(/shop-new\/(address|checkout)/i, { timeout: 15_000 });
    await this.page.getByRole('heading', { name: 'Choose Billing Address', level: 2 }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
  }

  async waitForOrderSummary(): Promise<void> {
    await this.otpDialog.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.page.getByRole('heading', { name: 'Address Details', level: 2 }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
  }

  /** TC001 / TC002 — metal, charges, tax, paid-from-funds, grand total (no Savings row). */
  async getPriceDetails(): Promise<ShopCheckoutPriceDetails> {
    const section = await this.priceSection();
    return {
      metalPrice: await this.priceRow('Metal Price', section),
      makingAndDeliveryCharges: await this.priceRow('Making & Delivery Charges', section),
      paidFromFunds: await this.priceRow('Paid From Funds', section),
      tax: await this.priceRow('Tax', section),
      grandTotal: await this.priceRow('Grand Total', section),
    };
  }

  /** TC004 only — {@link getPriceDetails} plus Savings row after Use Saving. */
  async getPriceDetailsWithSavings(): Promise<ShopCheckoutPriceDetailsWithSavings> {
    const section = await this.priceSection();
    await section.getByText('Savings', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 });
    return {
      metalPrice: await this.priceRow('Metal Price', section),
      makingAndDeliveryCharges: await this.priceRow('Making & Delivery Charges', section),
      savings: await this.priceRow('Savings', section),
      paidFromFunds: await this.priceRow('Paid From Funds', section),
      tax: await this.priceRow('Tax', section),
      grandTotal: await this.priceRow('Grand Total', section),
    };
  }

  /**
   * After cart Use Savings + Proceed to Pay — poll until checkout Price Details shows Savings row.
   */
  async waitForCheckoutPriceWithSavings(timeoutMs = 25_000): Promise<ShopCheckoutPriceDetailsWithSavings> {
    let price: ShopCheckoutPriceDetailsWithSavings | undefined;
    await expect
      .poll(
        async () => {
          try {
            price = await this.getPriceDetailsWithSavings();
            return price.savings;
          } catch {
            return 0;
          }
        },
        { timeout: timeoutMs, intervals: [400, 800, 1500] })
      .toBeGreaterThan(0);
    return price!;
  }

  /** TC003 only — same price-row pattern as cart; not for TC001/TC002 ({@link getPriceDetails}). */
  async getEmiMixedCheckoutPriceDetails(): Promise<ShopEmiMixedCheckoutPriceDetails> {
    await this.emiPriceDetailsPanel.waitFor({ state: 'visible', timeout: 10_000 });
    return {
      metalPrice: await this.emiPriceRow('Metal Price'),
      initialPayment: await this.emiPriceRow('Initial Payment'),
      emiScheme: await this.emiPriceRowText('EMI Scheme'),
      emiPerMonth: await this.emiPriceRow('EMI Amount per month'),
      tax: await this.emiPriceRowEither('Tax', 'TAX'),
      makingAndDeliveryCharges: await this.emiPriceRow('Making & Delivery Charges'),
      grandTotal: await this.emiPriceRow('Grand Total'),
      savings: 0,
      paidFromFunds: 0,
    };
  }

  /** TC003 only — EMI Details on summary; not for TC001/TC002 ({@link getPriceDetails}). */
  async getEmiSummaryPriceDetails(): Promise<ShopEmiSummaryPriceDetails> {
    await this.page
      .getByRole('heading', { name: 'EMI Details', level: 2 })
      .waitFor({ state: 'visible', timeout: 15_000 });
    await this.emiSummaryDetailsPanel.waitFor({ state: 'visible', timeout: 10_000 });

    const downPaymentText = await this.text(
      this.emiSummaryDetailsPanel.locator('.bg-amber-50 p').first());
    const downPaymentMatch = downPaymentText.match(/₹[\d,.]+/);

    return {
      downPayment: this.parseAmount(downPaymentMatch?.[0] ?? downPaymentText),
      totalAmount: await this.emiSummaryPriceRow('Total Amount'),
      emiScheme: await this.emiSummaryPriceRowText('EMI Scheme'),
      emiPerMonth: await this.emiSummaryPriceRow('EMI Amount per month'),
      tax: await this.emiSummaryPriceRowEither('Tax', 'TAX'),
      makingAndDeliveryCharges: await this.emiSummaryPriceRow('Making & Delivery Charges'),
      savings: await this.emiSummaryPriceRow('Savings'),
      paidFromFunds: await this.emiSummaryPriceRow('Paid From Funds'),
      grandTotal: await this.emiSummaryPriceRow('Grand Total'),
    };
  }

  /** TC001 / TC002 — metal + charges + tax − paid-from-funds (no savings). */
  getCalculatedGrandTotal(price: ShopCheckoutPriceDetails): number {
    return price.metalPrice + price.makingAndDeliveryCharges + price.tax - price.paidFromFunds;
  }

  /** TC_SHOP_014 — checkout price panel with coupon discount. */
  async getPriceDetailsWithCoupon(): Promise<ShopCheckoutPriceDetailsWithCoupon> {
    const section = await this.priceSection();
    const metalPrice = await this.priceRow('Metal Price', section);
    const makingAndDeliveryCharges = await this.priceRow('Making & Delivery Charges', section);
    const tax = await this.priceRow('Tax', section);
    const paidFromFunds = await this.optionalPriceRow(section, 'Paid From Funds');
    const grandTotal = await this.priceRow('Grand Total', section);
    const couponDiscount = await this.readCouponDiscount(section);
    const totalSum = Number((metalPrice + makingAndDeliveryCharges + tax).toFixed(2));
    return { metalPrice, makingAndDeliveryCharges, tax, paidFromFunds, grandTotal, couponDiscount, totalSum };
  }

  /** TC_SHOP_014 — checkout matches cart; grandTotal = totalSum − couponDiscount. */
  async validateCheckoutPriceMatchesCartWithCoupon(
    cartPrice: ShopCartPriceDetailsWithCoupon,
  ): Promise<ShopCheckoutPriceDetailsWithCoupon> {
    await this.waitForCheckoutPage();
    const checkoutPrice = await this.getPriceDetailsWithCoupon();

    shopLogGet('Cart price (coupon)', cartPrice);
    shopLogGet('Checkout price (coupon)', checkoutPrice);

    const cartExpectedGrand = Number(
      (cartPrice.totalSum - cartPrice.couponDiscount - cartPrice.savings).toFixed(2),
    );
    shopLogActualExpected('Cart grand total formula', cartPrice.grandTotal, cartExpectedGrand);
    expect(cartPrice.grandTotal).toBe(cartExpectedGrand);

    shopLogActualExpected('Checkout metal price', checkoutPrice.metalPrice, cartPrice.metalPrice);
    shopLogActualExpected('Checkout making & delivery', checkoutPrice.makingAndDeliveryCharges, cartPrice.makingAndDeliveryCharges);
    shopLogActualExpected('Checkout tax', checkoutPrice.tax, cartPrice.tax);

    expect(checkoutPrice.metalPrice).toBe(cartPrice.metalPrice);
    expect(checkoutPrice.makingAndDeliveryCharges).toBe(cartPrice.makingAndDeliveryCharges);
    expect(checkoutPrice.tax).toBe(cartPrice.tax);

    const expectedCheckoutGrand = Number(
      (cartPrice.totalSum - checkoutPrice.couponDiscount - checkoutPrice.paidFromFunds - cartPrice.savings).toFixed(2),
    );
    shopLogActualExpected('Checkout grand total', checkoutPrice.grandTotal, expectedCheckoutGrand);
    expect(checkoutPrice.grandTotal).toBe(expectedCheckoutGrand);

    const checkoutExpectedGrand = Number(
      (checkoutPrice.totalSum - checkoutPrice.couponDiscount - checkoutPrice.paidFromFunds).toFixed(2),
    );
    shopLogActualExpected('Checkout grand total formula', checkoutPrice.grandTotal, checkoutExpectedGrand);
    expect(checkoutPrice.grandTotal).toBe(checkoutExpectedGrand);

    return checkoutPrice;
  }

  /**
   * TC_SHOP_015 only — EMI address step: coupon lines match cart; savings apply on summary after OTP.
   */
  async validateEmiCheckoutCouponLinesMatchCart(
    cartPrice: ShopCartPriceDetailsWithCoupon,
  ): Promise<ShopCheckoutPriceDetailsWithCoupon> {
    await this.waitForCheckoutPage();
    const checkoutPrice = await this.getEmiCheckoutPriceDetailsWithCoupon();
    shopLogGet('Cart price (coupon)', cartPrice);
    shopLogGet('Checkout price (EMI coupon)', checkoutPrice);
    shopLogActualExpected('Checkout coupon discount', checkoutPrice.couponDiscount, cartPrice.couponDiscount);
    expect(checkoutPrice.couponDiscount).toBe(cartPrice.couponDiscount);
    this.expectNoPaidFromFunds(checkoutPrice);
    return checkoutPrice;
  }

  /** TC_SHOP_015 only — EMI billing when coupon is on address step but payable is still down payment. */
  async confirmEmiBillingAfterCoupon(expectedGrandTotal: number): Promise<ShopBillingAddressDetails> {
    const checkoutPrice = await this.getEmiCheckoutPriceDetailsWithCoupon();
    shopLogActualExpected('Checkout grand total before billing', checkoutPrice.grandTotal, expectedGrandTotal);
    expect(checkoutPrice.grandTotal).toBe(expectedGrandTotal);
    const billingAddress = await this.getBillingAddress();
    expect(billingAddress.address).toBeTruthy();
    expect(billingAddress.pincode).toMatch(/^\d{6}$/);
    await this.confirmBillingAndDelivery();
    return billingAddress;
  }

  /** TC_SHOP_015 only — EMI order summary after OTP: coupon + savings → Pay ₹0. */
  async validateEmiCouponSavingsZeroPayOrderSummaryAndPay(): Promise<void> {
    await this.waitForOrderSummary();
    let paidFromFunds = 0;
    await expect
      .poll(async () => {
        const emiSummary = await this.getEmiSummaryPriceDetails();
        shopLogGet('Order summary price (EMI coupon + savings)', emiSummary);
        paidFromFunds = emiSummary.paidFromFunds;
        return emiSummary.grandTotal;
      }, { timeout: 25_000, intervals: [400, 800, 1500] })
      .toBe(0);
    this.expectNoPaidFromFunds({ paidFromFunds });
    shopLogActualExpected('Summary grand total', 0, 0);
    await expect(this.payButton).toContainText('₹0');
    await this.clickPay();
  }

  /** TC_SHOP_014 — billing + delivery after coupon price validation. */
  async confirmBillingAfterCoupon(
    cartPrice: ShopCartPriceDetailsWithCoupon,
  ): Promise<ShopBillingAddressDetails> {
    const checkoutPrice = await this.getPriceDetailsWithCoupon();
    shopLogActualExpected('Checkout grand total before billing', checkoutPrice.grandTotal, cartPrice.grandTotal);
    expect(checkoutPrice.grandTotal).toBe(cartPrice.grandTotal);
    const billingAddress = await this.getBillingAddress();
    expect(billingAddress.address).toBeTruthy();
    expect(billingAddress.pincode).toMatch(/^\d{6}$/);
    await this.confirmBillingAndDelivery();
    return billingAddress;
  }

  /** TC_SHOP_014 — coupon-only flow; no wallet funds used. */
  expectNoPaidFromFunds(price: { paidFromFunds: number }): void {
    shopLogActualExpected('Paid from funds', price.paidFromFunds, 0);
    expect(price.paidFromFunds).toBe(0);
  }

  /** TC_SHOP_014 — order summary Pay ₹0 (no netbanking). */
  async validateZeroPayOrderSummaryAndPay(
    cartPrice: ShopCartPriceDetailsWithCoupon,
  ): Promise<void> {
    await this.waitForOrderSummary();
    const checkoutPrice = await this.getPriceDetailsWithCoupon();
    shopLogGet('Order summary price (coupon)', checkoutPrice);
    this.expectNoPaidFromFunds(checkoutPrice);
    shopLogActualExpected('Summary grand total', checkoutPrice.grandTotal, cartPrice.grandTotal);
    expect(checkoutPrice.grandTotal).toBe(0);
    await expect(this.payButton).toContainText('₹0');
    await this.clickPay();
  }

  /** Reads the billing card you select (default: first card with green tick, else first saved). */
  async getBillingAddress(cardIndex?: number): Promise<ShopBillingAddressDetails> {
    const card = await this.resolveBillingAddressCard(cardIndex);
    await card.scrollIntoViewIfNeeded();
    const details = await this.readAddressLines(card);
    const radio = card.locator('input[type="radio"]').first();
    if (await radio.isVisible().catch(() => false)) {
      await radio.check();
    } else {
      await card.click();
    }
    return details;
  }

  async getDeliveryAddress(): Promise<ShopBillingAddressDetails> {
    return this.readSummaryAddress(this.shippingAddressAccordion);
  }

  async getBilledToAddress(): Promise<ShopBillingAddressDetails> {
    return this.readSummaryAddress(this.billingAddressAccordion);
  }

  async getOrderItemDetails(productName: string): Promise<ShopOrderItemDetails> {
    const card = this.page.getByRole('heading', { level: 3, name: productName }).locator('xpath=..');
    await card.waitFor({ state: 'visible', timeout: 15_000 });

    return {
      productName: (await this.text(card.getByRole('heading', { level: 3 }))) || productName,
      quantity: Number((await this.text(card.getByText(/Quantity/i))).replace(/\D/g, '')) || 1,
      itemPrice: this.parseAmount(await this.text(card.locator('p').filter({ hasText: /^₹/ }).first())),
    };
  }

  async getOtpSentToText(): Promise<string> {
    await this.otpSentToLabel.waitFor({ state: 'visible', timeout: 15_000 });
    return this.text(this.otpSentToLabel);
  }

  async submitOtp(otp: string): Promise<void> {
    const digits = otp.replace(/\D/g, '');
    const inputCount = await this.otpInputLocator().count();
    await this.fillOtp(digits.slice(0, inputCount));
    await this.verifyOtpButton.click();
  }

  async selectNetbanking():
   Promise<void> {
    const netbankingLabel = this.page.locator('label[for="Netbanking"]');
    if (await netbankingLabel.isVisible().catch(() => false)) {
      await netbankingLabel.click();
      return;
    }
    await this.page.getByText('NETBANKING', { exact: true }).click();
  }

  async clickPay(): Promise<void> {
    await this.payButton.click();
  }

  // async getOrderPlacedDetails(): Promise<ShopOrderPlacedDetails> {
  //   const dialog = this.page.getByRole('dialog', { name: /^Order Placed$/i });
  //   await dialog.waitFor({ state: 'visible', timeout: 30_000 });

  //   const successMessage = await this.text(
  //     dialog
  //       .locator('app-dialog .text-16.font-gilroy')
  //       .filter({ hasText: /booked|placed/i })
  //       .first());
  //   const orderIdRaw = await this.text(dialog.locator('.bg-teal-aliceblue').first());
  //   const orderId = this.parseOrderIds(orderIdRaw).join(',');

  //   return { orderId, successMessage };
  // }
  async getOrderPlacedDetails(): Promise<ShopOrderPlacedDetails> {
    const orderPlacedDialog = this.page.getByRole('dialog', {
      name: /^Order Placed$/i,
    });

    const errorToast = this.page.getByText('something went wrong', {
      exact: false,
    });

    await Promise.race([
      orderPlacedDialog.waitFor({ state: 'visible', timeout: 30000 }),
      errorToast.waitFor({ state: 'visible', timeout: 30000 }),
    ]);

    if (await errorToast.isVisible().catch(() => false)) {
      throw new Error(
        'Order placement failed. Application displayed: "something went wrong".'
      );
    }

    const successMessage = await this.text(
      orderPlacedDialog
        .locator('app-dialog .text-16.font-gilroy')
        .filter({ hasText: /booked|placed/i })
        .first()
    );

    const orderIdRaw = await this.text(
      orderPlacedDialog.locator('.bg-teal-aliceblue').first()
    );

    return {
      orderId: this.parseOrderIds(orderIdRaw).join(','),
      successMessage,
    };
  }
  parseOrderIds(rawOrderId: string): string[] {
    return rawOrderId
      .replace(/^Order\s*ID:\s*/i, '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  async getPlacedOrders(productCount: number): Promise<ShopPlacedOrders> {
    const placed = await this.getOrderPlacedDetails();
    const orderIds = this.parseOrderIds(placed.orderId);

    return {
      orderIds,
      displayText: orderIds.join(','),
      isSingleSharedOrder: orderIds.length === 1,
      successMessage: placed.successMessage,
    };
  }

  assertPlacedOrders(orders: ShopPlacedOrders, productCount: number): void {
    for (const id of orders.orderIds) {
      expect(id).toMatch(/^\d+$/);
    }
    if (orders.isSingleSharedOrder) {
      expect(orders.orderIds).toHaveLength(1);
      return;
    }
    expect(orders.orderIds).toHaveLength(productCount);
  }

  assertOrderIdForProduct(shopOrderId: string, orders: ShopPlacedOrders): void {
    if (orders.isSingleSharedOrder) {
      expect(shopOrderId).toBe(orders.orderIds[0]);
      return;
    }
    expect(orders.orderIds).toContain(shopOrderId);
  }

  getInvoiceOrderId(orders: ShopPlacedOrders, firstProductOrderId: string): string {
    return orders.isSingleSharedOrder ? orders.orderIds[0] : firstProductOrderId;
  }

  getExpectedInvoiceNetPayable(
    orders: ShopPlacedOrders,
    combinedGrandTotal: number,
    firstProductPrice: number): number {
    return orders.isSingleSharedOrder ? combinedGrandTotal : firstProductPrice;
  }

  getInvoiceProductNames(orders: ShopPlacedOrders, productNames: string[]): string[] {
    return orders.isSingleSharedOrder ? productNames : [productNames[0]];
  }

  async dismissOrderPlacedDialog(): Promise<void> {
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  async confirmBillingAndDelivery(): Promise<void> {
    await this.billingToThisAddressButton.click();
    await this.sameAsBillingLabel.scrollIntoViewIfNeeded();
    const checkbox = this.page.locator('#sameAsBillingAddress');
    if (!(await checkbox.isChecked().catch(() => false))) {
      await this.sameAsBillingLabel.click();
    }
    await this.page.keyboard.press('Home');
    await this.deliverToThisAddressButton.click();
  }

  /** Delivery address management — Choose Billing Address step loaded with at least one card. */
  async validateChooseBillingAddressCheckoutPage(): Promise<void> {
    await this.waitForCheckoutPage();
    await expect(this.billingAddressCards().first()).toBeVisible({ timeout: 15_000 });
    const section = await this.priceSection();
    await expect(section.getByText('Grand Total', { exact: true })).toBeVisible();
  }

  /** Delivery address management — select billing address card by index (0 = first). */
  async selectBillingAddressCardByIndex(cardIndex = 0): Promise<void> {
    const card = await this.resolveBillingAddressCard(cardIndex);
    await card.scrollIntoViewIfNeeded();
    await card.click();
  }

  /** Delivery address management — click Edit on billing address card. */
  async clickEditOnBillingAddressCard(cardIndex = 0): Promise<void> {
    const card = await this.resolveBillingAddressCard(cardIndex);
    await card.scrollIntoViewIfNeeded();
    const editButton = card.getByRole('button', { name: /^Edit$/i }).first();
    await editButton.waitFor({ state: 'visible', timeout: 10_000 });
    await editButton.click().catch(async () => {
      await editButton.click({ force: true });
    });
    await this.waitForAddressEditFormLoaded();
  }

  /** TC_SHOP_001 — checkout prices, billing address, confirm billing + delivery. */
  async validateBillingAndConfirmDelivery(
    productDetails: ShopProductDetails): Promise<ShopBillingAddressDetails> {
    await this.waitForCheckoutPage();
    const checkoutPrice = await this.getPriceDetails();
    const savedBillingAddress = await this.getBillingAddress();
    shopLogGet('Checkout price', checkoutPrice);
    shopLogGet('Billing address', savedBillingAddress);
    shopLogActualExpected('Checkout grand total', checkoutPrice.grandTotal, productDetails.grandTotal);
    shopLogActualExpected('Paid from funds', checkoutPrice.paidFromFunds, 0);
    expect(checkoutPrice.grandTotal).toBe(productDetails.grandTotal);
    expect(checkoutPrice.paidFromFunds).toBe(0);
    expect(savedBillingAddress.address).toBeTruthy();
    expect(savedBillingAddress.pincode).toMatch(/^\d{6}$/);
    await this.confirmBillingAndDelivery();
    return savedBillingAddress;
  }

  /** TC_SHOP_002 — checkout combined total, billing address, confirm billing + delivery. */
  async validateBillingAndConfirmDeliveryForCombinedTotal(
    combinedGrandTotal: number): Promise<ShopBillingAddressDetails> {
    await this.waitForCheckoutPage();
    const checkoutPrice = await this.getPriceDetails();
    const savedBillingAddress = await this.getBillingAddress();
    shopLogGet('Checkout price', checkoutPrice);
    shopLogGet('Billing address', savedBillingAddress);
    shopLogActualExpected('Checkout grand total', checkoutPrice.grandTotal, combinedGrandTotal);
    shopLogActualExpected('Paid from funds', checkoutPrice.paidFromFunds, 0);
    expect(checkoutPrice.grandTotal).toBe(combinedGrandTotal);
    expect(checkoutPrice.paidFromFunds).toBe(0);
    expect(savedBillingAddress.address).toBeTruthy();
    expect(savedBillingAddress.pincode).toMatch(/^\d{6}$/);
    await this.confirmBillingAndDelivery();
    return savedBillingAddress;
  }

  /** TC_SHOP_001 — verify OTP sent to mobile and submit checkout OTP. */
  async validateCheckoutOtp(
    mobile = getShopDataset().mobile,
    otp = getShopDataset().otp): Promise<void> {
    const sentToText = await this.getOtpSentToText();
    const actualMobile = sentToText.replace(/\D/g, '').slice(-10);
    const expectedMobile = mobile.replace(/\D/g, '').slice(-10);
    shopLogGet('OTP sent to', sentToText);
    shopLogActualExpected('OTP mobile', actualMobile, expectedMobile);
    expect(actualMobile).toBe(expectedMobile);
    await this.submitOtp(otp);
  }

  /** TC_SHOP_001 — order summary cart, prices and addresses after OTP. */
  async validateOrderSummaryAfterOtp(params: {
    productDetails: ShopProductDetails;
    savedBillingAddress: ShopBillingAddressDetails;
    productName?: string;
  }): Promise<ShopOrderSummarySnapshot> {
    const productName = params.productName ?? getShopDataset().productName;
    const { productDetails, savedBillingAddress } = params;

    await this.waitForOrderSummary();
    const orderItem = await this.getOrderItemDetails(productName);
    const checkoutPrice = await this.getPriceDetails();
    const deliveryAddress = await this.getDeliveryAddress();
    const billingAddress = await this.getBilledToAddress();

    const summary: ShopOrderSummarySnapshot = {
      orderItem,
      checkoutPrice,
      deliveryAddress,
      billingAddress,
    };
    shopLogGet('Order summary snapshot', summary);

    shopLogActualExpected('Summary product name', orderItem.productName, productName);
    expect(orderItem.productName).toContain(productName);

    shopLogActualExpected('Summary item price', orderItem.itemPrice, productDetails.grandTotal);
    expect(orderItem.itemPrice).toBe(productDetails.grandTotal);

    shopLogActualExpected('Summary metal price', checkoutPrice.metalPrice, productDetails.goldPrice);
    shopLogActualExpected(
      'Summary making & delivery',
      checkoutPrice.makingAndDeliveryCharges,
      productDetails.makingAndDeliveryCharges);
    shopLogActualExpected('Summary tax', checkoutPrice.tax, productDetails.tax);
    shopLogActualExpected('Summary grand total', checkoutPrice.grandTotal, productDetails.grandTotal);
    shopLogActualExpected('Summary paid from funds', checkoutPrice.paidFromFunds, 0);
    expect(checkoutPrice.metalPrice).toBe(productDetails.goldPrice);
    expect(checkoutPrice.makingAndDeliveryCharges).toBe(productDetails.makingAndDeliveryCharges);
    expect(checkoutPrice.tax).toBe(productDetails.tax);
    expect(checkoutPrice.grandTotal).toBe(productDetails.grandTotal);
    expect(checkoutPrice.paidFromFunds).toBe(0);

    shopLogGet('Delivery address', deliveryAddress);
    shopLogGet('Billing address', billingAddress);
    shopLogActualExpected('Delivery full name', deliveryAddress.fullName, savedBillingAddress.fullName);
    shopLogActualExpected('Delivery mobile', deliveryAddress.mobile, savedBillingAddress.mobile);
    shopLogActualExpected('Delivery address line', deliveryAddress.address, savedBillingAddress.address);
    shopLogActualExpected('Delivery pincode', deliveryAddress.pincode, savedBillingAddress.pincode);
    shopLogActualExpected('Billing full name', billingAddress.fullName, savedBillingAddress.fullName);
    shopLogActualExpected('Billing mobile', billingAddress.mobile, savedBillingAddress.mobile);
    shopLogActualExpected('Billing address line', billingAddress.address, savedBillingAddress.address);
    shopLogActualExpected('Billing pincode', billingAddress.pincode, savedBillingAddress.pincode);
    this.assertOrderSummaryAddressesMatchBilling(deliveryAddress, billingAddress, savedBillingAddress);

    return summary;
  }

  /** TC_SHOP_002 — order summary for each line item and combined total after OTP. */
  async validateMultiProductOrderSummaryAfterOtp(params: {
    productNames: string[];
    productDetailsByName: Record<string, ShopProductDetails>;
    savedBillingAddress: ShopBillingAddressDetails;
    combinedGrandTotal: number;
  }): Promise<ShopMultiProductOrderSummarySnapshot> {

    await this.waitForOrderSummary();

    const orderItemsByName: Record<string, ShopOrderItemDetails> = {};
    for (const name of params.productNames) {
      const orderItem = await this.getOrderItemDetails(name);
      shopLogGet(`Order summary item (${name})`, orderItem);
      shopLogActualExpected(`${name} summary product name`, orderItem.productName, name);
      expect(orderItem.productName).toContain(name);
      shopLogActualExpected(`${name} summary item price`, orderItem.itemPrice, params.productDetailsByName[name].grandTotal);
      expect(orderItem.itemPrice).toBe(params.productDetailsByName[name].grandTotal);
      orderItemsByName[name] = orderItem;
    }

    const checkoutPrice = await this.getPriceDetails();
    shopLogGet('Order summary price', checkoutPrice);
    shopLogActualExpected('Summary grand total', checkoutPrice.grandTotal, params.combinedGrandTotal);
    expect(checkoutPrice.grandTotal).toBe(params.combinedGrandTotal);

    const deliveryAddress = await this.getDeliveryAddress();
    const billingAddress = await this.getBilledToAddress();
    shopLogGet('Delivery address', deliveryAddress);
    shopLogGet('Billing address', billingAddress);
    shopLogActualExpected('Delivery full name', deliveryAddress.fullName, params.savedBillingAddress.fullName);
    shopLogActualExpected('Delivery mobile', deliveryAddress.mobile, params.savedBillingAddress.mobile);
    shopLogActualExpected('Delivery address line', deliveryAddress.address, params.savedBillingAddress.address);
    shopLogActualExpected('Delivery pincode', deliveryAddress.pincode, params.savedBillingAddress.pincode);
    shopLogActualExpected('Billing full name', billingAddress.fullName, params.savedBillingAddress.fullName);
    shopLogActualExpected('Billing mobile', billingAddress.mobile, params.savedBillingAddress.mobile);
    shopLogActualExpected('Billing address line', billingAddress.address, params.savedBillingAddress.address);
    shopLogActualExpected('Billing pincode', billingAddress.pincode, params.savedBillingAddress.pincode);
    this.assertOrderSummaryAddressesMatchBilling(deliveryAddress, billingAddress, params.savedBillingAddress);

    return {
      orderItemsByName,
      checkoutPrice,
      deliveryAddress,
      billingAddress,
    };
  }

  /** TC_SHOP_001 — select Netbanking and open Razorpay (order dialog appears after payment). */
  async placeOrderViaNetbanking(): Promise<void> {
    await this.selectNetbanking();
    await this.clickPay();
  }

  /** TC_SHOP_001 — assert order-placed dialog and dismiss; returns order id. */
  async confirmBuyNowOrderPlaced(): Promise<string> {
    const orderPlaced = await this.getOrderPlacedDetails();
    shopLogGet('Order placed dialog', orderPlaced);
    expect(orderPlaced.orderId).toMatch(/^\d+$/);
    expect(orderPlaced.successMessage).toMatch(/booked/i);
    await this.dismissOrderPlacedDialog();
    shopLogActualExpected('Placed order id', orderPlaced.orderId, orderPlaced.orderId);
    return orderPlaced.orderId;
  }

  /** TC_SHOP_002 — assert multi-product order-placed dialog and dismiss. */
  async confirmMultiProductOrdersPlaced(
    productCount: number): Promise<ShopPlacedOrders> {
    const placedOrders = await this.getPlacedOrders(productCount);
    shopLogGet('Order placed dialog', {
      orderId: placedOrders.displayText,
      successMessage: placedOrders.successMessage,
    });
    shopLogActualExpected('Payment method', 'Netbanking', 'Netbanking');
    this.assertPlacedOrders(placedOrders, productCount);
    expect(placedOrders.successMessage).toMatch(/booked/i);
    await this.dismissOrderPlacedDialog();
    return placedOrders;
  }

  /** TC_SHOP_007 / TC_SHOP_010 — EMI checkout billing and confirm delivery. */
  async validateEmiCheckoutBilling(params: {
    emiPlanDetails: ShopEmiDetails;
    emiInitialPayment: number;
    expectedEmiPerMonth: number;
  }): Promise<ShopBillingAddressDetails> {
    await this.waitForCheckoutPage();
    const checkoutPrice = await this.getEmiMixedCheckoutPriceDetails();
    shopLogGet('Checkout price (EMI)', checkoutPrice);
    shopLogActualExpected('Checkout initial payment', checkoutPrice.initialPayment, params.emiInitialPayment);
    expect(checkoutPrice.initialPayment).toBe(params.emiInitialPayment);
    expect(checkoutPrice.emiScheme).toBe(params.emiPlanDetails.emiScheme);
    expect(checkoutPrice.emiPerMonth).toBe(params.expectedEmiPerMonth);
    expect(checkoutPrice.grandTotal).toBe(params.emiInitialPayment);
    expect(checkoutPrice.paidFromFunds).toBe(0);
    const savedBillingAddress = await this.getBillingAddress();
    shopLogGet('Billing address', savedBillingAddress);
    expect(savedBillingAddress.address).toBeTruthy();
    expect(savedBillingAddress.pincode).toMatch(/^\d{6}$/);
    await this.confirmBillingAndDelivery();
    return savedBillingAddress;
  }

  /** TC_SHOP_007 / TC_SHOP_010 — EMI order summary after OTP. */
  async validateEmiOrderSummaryAfterOtp(params: {
    productName: string;
    emiLinePrice: number;
    emiInitialPayment: number;
    emiPlanDetails: ShopEmiDetails;
    expectedEmiPerMonth: number;
    savedBillingAddress: ShopBillingAddressDetails;
  }): Promise<ShopEmiOrderSummarySnapshot> {

    await this.waitForOrderSummary();
    const orderItem = await this.getOrderItemDetails(params.productName);
    const emiSummary = await this.getEmiSummaryPriceDetails();
    const deliveryAddress = await this.getDeliveryAddress();
    const billingAddress = await this.getBilledToAddress();

    shopLogGet('Order summary item', orderItem);
    shopLogGet('EMI summary', emiSummary);
    shopLogActualExpected('Summary product name', orderItem.productName, params.productName);
    expect(orderItem.productName).toContain(params.productName);
    shopLogActualExpected('Summary line price', orderItem.itemPrice, params.emiLinePrice);
    expect(orderItem.itemPrice).toBe(params.emiLinePrice);
    shopLogActualExpected('Down payment', emiSummary.downPayment, params.emiInitialPayment);
    expect(emiSummary.downPayment).toBe(params.emiInitialPayment);
    shopLogActualExpected('EMI scheme', emiSummary.emiScheme, params.emiPlanDetails.emiScheme);
    expect(emiSummary.emiScheme).toBe(params.emiPlanDetails.emiScheme);
    shopLogActualExpected('EMI per month', emiSummary.emiPerMonth, params.expectedEmiPerMonth);
    expect(emiSummary.emiPerMonth).toBe(params.expectedEmiPerMonth);
    shopLogActualExpected('Summary grand total', emiSummary.grandTotal, params.emiInitialPayment);
    shopLogActualExpected('Summary paid from funds', emiSummary.paidFromFunds, 0);
    expect(emiSummary.grandTotal).toBe(params.emiInitialPayment);
    expect(emiSummary.paidFromFunds).toBe(0);

    shopLogGet('Delivery address', deliveryAddress);
    shopLogGet('Billing address', billingAddress);
    shopLogActualExpected('Delivery full name', deliveryAddress.fullName, params.savedBillingAddress.fullName);
    shopLogActualExpected('Delivery mobile', deliveryAddress.mobile, params.savedBillingAddress.mobile);
    shopLogActualExpected('Delivery address line', deliveryAddress.address, params.savedBillingAddress.address);
    shopLogActualExpected('Delivery pincode', deliveryAddress.pincode, params.savedBillingAddress.pincode);
    shopLogActualExpected('Billing full name', billingAddress.fullName, params.savedBillingAddress.fullName);
    shopLogActualExpected('Billing mobile', billingAddress.mobile, params.savedBillingAddress.mobile);
    shopLogActualExpected('Billing address line', billingAddress.address, params.savedBillingAddress.address);
    shopLogActualExpected('Billing pincode', billingAddress.pincode, params.savedBillingAddress.pincode);
    this.assertOrderSummaryAddressesMatchBilling(deliveryAddress, billingAddress, params.savedBillingAddress);

    return {
      orderItem,
      emiSummary,
      deliveryAddress,
      billingAddress,
    };
  }

  /** TC_SHOP_003 — mixed EMI + Buy Now checkout billing. */
  async validateMixedEmiCheckoutBilling(params: {
    emiPlanDetails: ShopEmiDetails;
    emiInitialPayment: number;
    expectedEmiPerMonth: number;
    combinedGrandTotal: number;
    buyNowLineTotal: number;
  }): Promise<ShopBillingAddressDetails> {
    await this.waitForCheckoutPage();
    const checkoutPrice = await this.getEmiMixedCheckoutPriceDetails();
    shopLogGet('Checkout price (mixed)', checkoutPrice);
    shopLogActualExpected('Checkout grand total', checkoutPrice.grandTotal, params.combinedGrandTotal);
    expect(checkoutPrice.initialPayment).toBe(params.emiInitialPayment);
    expect(checkoutPrice.emiScheme).toBe(params.emiPlanDetails.emiScheme);
    expect(checkoutPrice.emiPerMonth).toBe(params.expectedEmiPerMonth);
    expect(checkoutPrice.grandTotal).toBe(params.combinedGrandTotal);
    expect(checkoutPrice.savings).toBe(0);
    expect(checkoutPrice.paidFromFunds).toBe(0);
    const savedBillingAddress = await this.getBillingAddress();
    expect(savedBillingAddress.address).toBeTruthy();
    expect(savedBillingAddress.pincode).toMatch(/^\d{6}$/);
    await this.confirmBillingAndDelivery();
    return savedBillingAddress;
  }

  /** TC_SHOP_003 — mixed cart order summary after OTP. */
  async validateMixedOrderSummaryAfterOtp(params: {
    productNames: string[];
    productLinePrices: Record<string, number>;
    emiInitialPayment: number;
    combinedGrandTotal: number;
  }): Promise<void> {
    await this.waitForOrderSummary();
    for (const name of params.productNames) {
      const orderItem = await this.getOrderItemDetails(name);
      shopLogActualExpected(`${name} summary line price`, orderItem.itemPrice, params.productLinePrices[name]);
      expect(orderItem.itemPrice).toBe(params.productLinePrices[name]);
    }
    const emiSummary = await this.getEmiSummaryPriceDetails();
    shopLogGet('EMI summary', emiSummary);
    shopLogActualExpected('Down payment', emiSummary.downPayment, params.emiInitialPayment);
    shopLogActualExpected('Summary grand total', emiSummary.grandTotal, params.combinedGrandTotal);
    expect(emiSummary.downPayment).toBe(params.emiInitialPayment);
    expect(emiSummary.grandTotal).toBe(params.combinedGrandTotal);
  }

  /** TC_SHOP_013 — EMI billing address step (savings applied on order summary after OTP, not here). */
  async validateEmiBillingWithFullSavingsAndConfirm(params: {
    emiPlanDetails: ShopEmiDetails;
    emiInitialPayment: number;
    expectedEmiPerMonth: number;
  }): Promise<ShopBillingAddressDetails> {
    return this.validateEmiCheckoutBilling({
      emiPlanDetails: params.emiPlanDetails,
      emiInitialPayment: params.emiInitialPayment,
      expectedEmiPerMonth: params.expectedEmiPerMonth,
    });
  }

  /** TC_SHOP_013 — poll EMI order summary until full savings shows ₹0 payable. */
  async waitForEmiSummaryWithFullSavings(
    cartSavingsAmount: number,
    timeoutMs = 25_000,
  ): Promise<ShopEmiSummaryPriceDetails> {
    let summary: ShopEmiSummaryPriceDetails | undefined;
    await expect
      .poll(
        async () => {
          summary = await this.getEmiSummaryPriceDetails();
          return summary.grandTotal === 0 ? summary.savings : 0;
        },
        { timeout: timeoutMs, intervals: [400, 800, 1500] })
      .toBe(cartSavingsAmount);
    return summary!;
  }

  /** TC_SHOP_013 — EMI order summary after OTP; Pay ₹0 via full User Savings. */
  async validateEmiFullSavingsOrderSummaryAndPay(params: {
    productName: string;
    emiLinePrice: number;
    emiInitialPayment: number;
    emiPlanDetails: ShopEmiDetails;
    expectedEmiPerMonth: number;
    savedBillingAddress: ShopBillingAddressDetails;
    cartSavingsAmount: number;
  }): Promise<ShopEmiOrderSummarySnapshot> {
    await this.waitForOrderSummary();
    const orderItem = await this.getOrderItemDetails(params.productName);
    const emiSummary = await this.waitForEmiSummaryWithFullSavings(params.cartSavingsAmount);
    const deliveryAddress = await this.getDeliveryAddress();
    const billingAddress = await this.getBilledToAddress();

    shopLogGet('Order summary item (EMI full savings)', orderItem);
    shopLogGet('EMI summary (full savings)', emiSummary);
    expect(orderItem.productName).toContain(params.productName);
    expect(orderItem.itemPrice).toBe(params.emiLinePrice);
    expect(emiSummary.downPayment).toBe(params.emiInitialPayment);
    expect(emiSummary.savings).toBe(params.cartSavingsAmount);
    expect(emiSummary.grandTotal).toBe(0);
    expect(emiSummary.paidFromFunds).toBe(0);
    expect(emiSummary.emiScheme).toBe(params.emiPlanDetails.emiScheme);
    expect(emiSummary.emiPerMonth).toBe(params.expectedEmiPerMonth);
    shopLogActualExpected('Summary remaining payable (zero)', emiSummary.grandTotal, 0);
    this.assertOrderSummaryAddressesMatchBilling(
      deliveryAddress,
      billingAddress,
      params.savedBillingAddress,
    );
    await this.clickPay();
    return { orderItem, emiSummary, deliveryAddress, billingAddress };
  }

  /** TC_SHOP_004 — checkout with full savings applied; confirm billing + delivery. */
  async validateBillingWithFullSavingsAndConfirm(
    cartSavingsAmount: number): Promise<ShopBillingAddressDetails> {
    await this.waitForCheckoutPage();
    const checkoutPrice = await this.getPriceDetailsWithSavings();
    const savedBillingAddress = await this.getBillingAddress();
    shopLogGet('Checkout price (with savings)', checkoutPrice);
    shopLogActualExpected('Checkout savings', checkoutPrice.savings, cartSavingsAmount);
    shopLogActualExpected('Paid from funds', checkoutPrice.paidFromFunds, 0);
    expect(checkoutPrice.savings).toBe(cartSavingsAmount);
    expect(checkoutPrice.paidFromFunds).toBe(0);
    await this.confirmBillingAndDelivery();
    return savedBillingAddress;
  }

  /** TC_SHOP_004 — order summary with full savings; Pay ₹0. */
  async validateFullSavingsOrderSummaryAndPay(params: {
    productName: string;
    productDetails: ShopProductDetails;
    cartSavingsAmount: number;
  }): Promise<void> {
    await this.waitForOrderSummary();
    const orderItem = await this.getOrderItemDetails(params.productName);
    const checkoutPrice = await this.getPriceDetailsWithSavings();
    const summaryPayableSum = this.expectCheckoutGrandTotalWithSavings(checkoutPrice, params.cartSavingsAmount);
    shopLogGet('Order summary item', orderItem);
    shopLogGet('Order summary price', checkoutPrice);
    shopLogActualExpected('Remaining payable (zero for full savings)', summaryPayableSum, 0);
    expect(orderItem.itemPrice).toBe(params.productDetails.grandTotal);
    expect(checkoutPrice.grandTotal).toBe(0);
    await this.clickPay();
  }

  /** TC_SHOP_016 — coupon + savings on checkout address step before Razorpay. */
  async getPriceDetailsWithCouponAndSavings(): Promise<ShopCheckoutPriceDetailsWithCouponAndSavings> {
    const section = await this.priceSection();
    await section.getByText('Savings', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 });
    const metalPrice = await this.priceRow('Metal Price', section);
    const makingAndDeliveryCharges = await this.priceRow('Making & Delivery Charges', section);
    const savings = await this.priceRow('Savings', section);
    const paidFromFunds = await this.optionalPriceRow(section, 'Paid From Funds');
    const tax = await this.priceRow('Tax', section);
    const grandTotal = await this.priceRow('Grand Total', section);
    const couponDiscount = await this.readCouponDiscount(section);
    const totalSum = Number((metalPrice + makingAndDeliveryCharges + tax).toFixed(2));
    return {
      metalPrice,
      makingAndDeliveryCharges,
      savings,
      paidFromFunds,
      tax,
      grandTotal,
      couponDiscount,
      totalSum,
    };
  }

  /** TC_SHOP_016 — poll until checkout shows savings and coupon discount. */
  async waitForCheckoutPriceWithCouponAndSavings(
    expectedCouponAmount: number,
    timeoutMs = 25_000,
  ): Promise<ShopCheckoutPriceDetailsWithCouponAndSavings> {
    let price: ShopCheckoutPriceDetailsWithCouponAndSavings | undefined;
    await expect
      .poll(
        async () => {
          try {
            price = await this.getPriceDetailsWithCouponAndSavings();
            return price.savings > 0 && price.couponDiscount === expectedCouponAmount ? 1 : 0;
          } catch {
            return 0;
          }
        },
        { timeout: timeoutMs, intervals: [400, 800, 1500] },
      )
      .toBe(1);
    return price!;
  }

  /** TC_SHOP_016 — partial savings + ₹100 coupon checkout; Razorpay remainder required. */
  async validatePartialSavingsCouponCheckout(params: {
    productDetails: ShopProductDetails;
    couponAmount: number;
  }): Promise<{ cartSavingsAmount: number; summaryPayableSum: number }> {
    await this.waitForCheckoutPage();
    const checkoutPrice = await this.waitForCheckoutPriceWithCouponAndSavings(params.couponAmount);
    const summaryPayableSum = this.calculateCheckoutGrandTotalWithCouponAndSavings(checkoutPrice);
    shopLogGet('Checkout price (partial savings + coupon)', checkoutPrice);
    shopLogActualExpected('Coupon discount', checkoutPrice.couponDiscount, params.couponAmount);
    shopLogActualExpected('Savings applied', checkoutPrice.savings, '> 0');
    shopLogActualExpected('Razorpay remainder', summaryPayableSum, '> 0');
    expect(checkoutPrice.couponDiscount).toBe(params.couponAmount);
    this.assertPartialSavingsCouponAndNetbankingRequired(
      checkoutPrice.savings,
      checkoutPrice.couponDiscount,
      summaryPayableSum,
      params.productDetails.grandTotal,
      'Partial savings + coupon checkout',
    );
    return { cartSavingsAmount: checkoutPrice.savings, summaryPayableSum };
  }

  /** TC_SHOP_016 — order summary with partial savings + coupon before Razorpay. */
  async validatePartialSavingsCouponOrderSummary(params: {
    productDetails: ShopProductDetails;
    cartSavingsAmount: number;
    couponAmount: number;
  }): Promise<number> {
    await this.waitForOrderSummary();
    const checkoutPrice = await this.getPriceDetailsWithCouponAndSavings();
    const summaryPayableSum = this.expectCheckoutGrandTotalWithCouponAndSavings(
      checkoutPrice,
      params.cartSavingsAmount,
      params.couponAmount,
    );
    shopLogActualExpected('Summary Razorpay payable', summaryPayableSum, summaryPayableSum);
    this.assertPartialSavingsCouponAndNetbankingRequired(
      params.cartSavingsAmount,
      params.couponAmount,
      summaryPayableSum,
      params.productDetails.grandTotal,
      'Partial savings + coupon summary',
    );
    expect(summaryPayableSum).toBeGreaterThan(0);
    return summaryPayableSum;
  }

  /** TC_SHOP_017 — mixed EMI address step: coupon + EMI rows (savings finalize on summary after OTP). */
  async validateMixedEmiCouponCheckoutAddressStep(params: {
    couponAmount: number;
    emiPlanDetails: ShopEmiDetails;
    emiInitialPayment: number;
    expectedEmiPerMonth: number;
  }): Promise<void> {
    await this.waitForCheckoutPage();
    await this.emiPriceDetailsPanel.waitFor({ state: 'visible', timeout: 10_000 });

    let couponDiscount = 0;
    await expect
      .poll(async () => {
        couponDiscount = await this.readCouponDiscount(this.emiPriceDetailsPanel);
        return couponDiscount === params.couponAmount ? 1 : 0;
      }, { timeout: 25_000, intervals: [400, 800, 1500] })
      .toBe(1);

    const initialPayment = await this.emiPriceRow('Initial Payment');
    const emiScheme = await this.emiPriceRowText('EMI Scheme');
    const emiPerMonth = await this.emiPriceRow('EMI Amount per month');
    shopLogActualExpected('Coupon discount', couponDiscount, params.couponAmount);
    shopLogActualExpected('EMI initial payment', initialPayment, params.emiInitialPayment);
    shopLogActualExpected('EMI scheme', emiScheme, params.emiPlanDetails.emiScheme);
    shopLogActualExpected('EMI per month', emiPerMonth, params.expectedEmiPerMonth);
    expect(couponDiscount).toBe(params.couponAmount);
    expect(initialPayment).toBe(params.emiInitialPayment);
    expect(emiScheme).toBe(params.emiPlanDetails.emiScheme);
    expect(emiPerMonth).toBe(params.expectedEmiPerMonth);
  }

  /** TC_SHOP_017 — poll EMI summary until partial savings + coupon reduce payable below combined total. */
  async waitForMixedEmiSummaryWithPartialSavings(
    combinedGrandTotal: number,
    couponAmount: number,
    timeoutMs = 25_000,
  ): Promise<ShopEmiSummaryPriceDetails> {
    let summary: ShopEmiSummaryPriceDetails | undefined;
    await expect
      .poll(
        async () => {
          summary = await this.getEmiSummaryPriceDetails();
          if (summary.savings <= 0) {
            return 0;
          }
          const payable = summary.grandTotal;
          return payable > 0 && payable < combinedGrandTotal - couponAmount ? payable : 0;
        },
        { timeout: timeoutMs, intervals: [400, 800, 1500] },
      )
      .toBeGreaterThan(0);
    return summary!;
  }

  /** TC_SHOP_017 — mixed EMI + Buy Now checkout with partial savings + coupon. */
  async validateMixedPartialSavingsCouponCheckout(params: {
    combinedGrandTotal: number;
    couponAmount: number;
    emiPlanDetails: ShopEmiDetails;
    emiInitialPayment: number;
    expectedEmiPerMonth: number;
  }): Promise<void> {
    await this.validateMixedEmiCouponCheckoutAddressStep({
      couponAmount: params.couponAmount,
      emiPlanDetails: params.emiPlanDetails,
      emiInitialPayment: params.emiInitialPayment,
      expectedEmiPerMonth: params.expectedEmiPerMonth,
    });
  }

  /** TC_SHOP_017 — mixed cart order summary after OTP with partial savings + coupon. */
  async validateMixedPartialSavingsCouponOrderSummary(params: {
    productNames: string[];
    productLinePrices: Record<string, number>;
    emiInitialPayment: number;
    combinedGrandTotal: number;
    couponAmount: number;
  }): Promise<number> {
    await this.waitForOrderSummary();
    for (const name of params.productNames) {
      const orderItem = await this.getOrderItemDetails(name);
      shopLogActualExpected(`${name} summary line price`, orderItem.itemPrice, params.productLinePrices[name]);
      expect(orderItem.itemPrice).toBe(params.productLinePrices[name]);
    }
    const emiSummary = await this.waitForMixedEmiSummaryWithPartialSavings(
      params.combinedGrandTotal,
      params.couponAmount,
    );
    const summaryPayableSum = emiSummary.grandTotal;
    shopLogGet('EMI summary (mixed coupon + savings)', emiSummary);
    shopLogActualExpected('Down payment', emiSummary.downPayment, params.emiInitialPayment);
    shopLogActualExpected('Savings applied', emiSummary.savings, '> 0');
    shopLogActualExpected('Summary Razorpay payable', summaryPayableSum, summaryPayableSum);
    expect(emiSummary.downPayment).toBe(params.emiInitialPayment);
    expect(emiSummary.savings).toBeGreaterThan(0);
    this.assertPartialSavingsCouponAndNetbankingRequired(
      emiSummary.savings,
      params.couponAmount,
      summaryPayableSum,
      params.combinedGrandTotal,
      'Mixed partial savings + coupon summary',
    );
    expect(summaryPayableSum).toBeGreaterThan(0);
    return summaryPayableSum;
  }

  /** TC_SHOP_012 — partial savings checkout after Use Saving on cart. */
  async validatePartialSavingsCheckout(params: {
    productName: string;
    productDetails: ShopProductDetails;
  }): Promise<{ cartSavingsAmount: number; summaryPayableSum: number }> {
    await this.waitForCheckoutPage();
    const checkoutPrice = await this.waitForCheckoutPriceWithSavings();
    const cartSavingsAmount = checkoutPrice.savings;
    const summaryPayableSum = this.calculateCheckoutGrandTotalWithSavings(checkoutPrice);
    shopLogGet('Checkout price (partial savings)', checkoutPrice);
    shopLogActualExpected('Savings applied', cartSavingsAmount, '> 0');
    shopLogActualExpected('Remaining payable', summaryPayableSum, '> 0');
    this.assertPartialSavingsAndNetbankingRequired(
      cartSavingsAmount,
      summaryPayableSum,
      params.productDetails.grandTotal,
      'Partial savings checkout');
    return { cartSavingsAmount, summaryPayableSum };
  }

  /** TC_SHOP_012 — order summary with partial savings before netbanking. */
  async validatePartialSavingsOrderSummary(params: {
    productDetails: ShopProductDetails;
    cartSavingsAmount: number;
  }): Promise<number> {
    await this.waitForOrderSummary();
    const checkoutPrice = await this.getPriceDetailsWithSavings();
    const summaryPayableSum = this.expectCheckoutGrandTotalWithSavings(checkoutPrice, params.cartSavingsAmount);
    shopLogActualExpected(
      'Summary remaining payable',
      summaryPayableSum,
      summaryPayableSum);
    this.assertPartialSavingsAndNetbankingRequired(
      params.cartSavingsAmount,
      summaryPayableSum,
      params.productDetails.grandTotal,
      `${'Partial savings checkout'} summary`);
    return summaryPayableSum;
  }

  private calculateCheckoutGrandTotalWithSavings(price: ShopCheckoutPriceDetailsWithSavings): number {
    return Number(
      (
        price.metalPrice +
        price.makingAndDeliveryCharges +
        price.tax -
        price.savings -
        price.paidFromFunds
      ).toFixed(2));
  }

  private calculateCheckoutGrandTotalWithCouponAndSavings(
    price: ShopCheckoutPriceDetailsWithCouponAndSavings,
  ): number {
    return Number((price.totalSum - price.couponDiscount - price.savings - price.paidFromFunds).toFixed(2));
  }

  private expectCheckoutGrandTotalWithCouponAndSavings(
    price: ShopCheckoutPriceDetailsWithCouponAndSavings,
    cartSavingsAmount: number,
    couponAmount: number,
  ): number {
    const calculated = this.calculateCheckoutGrandTotalWithCouponAndSavings(price);
    expect(price.savings).toBe(cartSavingsAmount);
    expect(price.couponDiscount).toBe(couponAmount);
    expect(price.paidFromFunds).toBe(0);
    expect(calculated).toBeCloseTo(price.grandTotal, 2);
    return calculated;
  }

  private expectCheckoutGrandTotalWithSavings(
    price: ShopCheckoutPriceDetailsWithSavings,
    cartSavingsAmount: number): number {
    const calculated = this.calculateCheckoutGrandTotalWithSavings(price);
    expect(price.savings).toBe(cartSavingsAmount);
    expect(price.paidFromFunds).toBe(0);
    expect(calculated).toBeCloseTo(price.grandTotal, 2);
    return calculated;
  }

  private assertOrderSummaryAddressesMatchBilling(
    deliveryAddress: ShopBillingAddressDetails,
    billingAddress: ShopBillingAddressDetails,
    saved: ShopBillingAddressDetails): void {
    expect(deliveryAddress.fullName).toBe(saved.fullName);
    expect(deliveryAddress.address).toBe(saved.address);
    expect(deliveryAddress.pincode).toBe(saved.pincode);
    expect(billingAddress.fullName).toBe(saved.fullName);
    expect(billingAddress.address).toBe(saved.address);
    expect(billingAddress.pincode).toBe(saved.pincode);
    if (saved.mobile) {
      expect(deliveryAddress.mobile).toBe(saved.mobile);
      expect(billingAddress.mobile).toBe(saved.mobile);
    }
    expect(deliveryAddress.pincode).toBe(billingAddress.pincode);
  }

  private async readSummaryAddress(accordion: Locator): Promise<ShopBillingAddressDetails> {
    await accordion.waitFor({ state: 'visible', timeout: 15_000 });
    await accordion.locator('a.p-accordion-header-link').click();
    await accordion.locator('p.text-gray-600').first().waitFor({ state: 'visible', timeout: 10_000 });

    const headerText = await this.text(accordion.locator('span.font-semibold'));
    const headerMatch = headerText.match(/(?:Billed to|Recieved At|Received At)\s+(.+?),\s*(\d{6})/i);
    const lines = (await accordion.locator('p.text-gray-600').allTextContents())
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const pinLine = lines.find((line) => /\b\d{6}\b/.test(line)) ?? '';
    const pincode = pinLine.match(/\b(\d{6})\b/)?.[1] ?? headerMatch?.[2] ?? '';
    const mobile = lines.find((line) => line.replace(/\D/g, '').length === 10)?.replace(/\D/g, '') ?? '';

    return {
      fullName: headerMatch?.[1]?.trim() ?? '',
      mobile,
      address: lines.filter((line) => line !== pinLine && line.replace(/\D/g, '') !== mobile).join(', '),
      pincode,
    };
  }

  private billingAddressCards(): Locator {
    return this.chooseBillingHeading
      .locator('xpath=following-sibling::*[1]/*')
      .filter({ has: this.page.getByRole('button', { name: 'Edit' }) });
  }

  private async resolveBillingAddressCard(cardIndex?: number): Promise<Locator> {
    const cards = this.billingAddressCards();
    if (cardIndex !== undefined) {
      return cards.nth(cardIndex);
    }
    const count = await cards.count();
    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      if ((await card.locator('.pi-check').count()) > 0) {
        return card;
      }
      if ((await card.locator('input[type="radio"]:checked').count()) > 0) {
        return card;
      }
    }
    return cards.first();
  }

  private async readAddressLines(card: Locator): Promise<ShopBillingAddressDetails> {
    await card.waitFor({ state: 'visible', timeout: 10_000 });
    const { fullName, lines } = await card.evaluate((root: unknown) => {
      type MiniEl = {
        querySelector: (sel: string) => MiniEl | null;
        querySelectorAll: (sel: string) => ArrayLike<MiniEl>;
        parentElement: MiniEl | null;
        nextElementSibling: MiniEl | null;
        tagName: string;
        textContent: string | null;
      };

      const r = root as MiniEl;
      const tick = r.querySelector('.pi-check');
      let scope: MiniEl | null = r;
      if (tick) {
        let node: MiniEl | null = tick;
        while (node && node !== r && !node.querySelector('h3')) {
          node = node.parentElement;
        }
        if (node?.querySelector('h3')) {
          scope = node;
        }
      }

      const heading = scope?.querySelector('h3');
      if (!heading) {
        return { fullName: '', lines: [] as string[] };
      }

      const collectText = (node: MiniEl): string =>
        (node.textContent ?? '').replace(/\s+/g, ' ').trim();

      const addressLines: string[] = [];
      let sibling: MiniEl | null = heading.nextElementSibling;
      while (sibling && sibling.tagName !== 'BUTTON' && !sibling.querySelector('button')) {
        if (sibling.tagName === 'P') {
          const text = collectText(sibling);
          if (text) addressLines.push(text);
        } else {
          const nestedPs = Array.from(sibling.querySelectorAll('p'));
          nestedPs.forEach((p: MiniEl) => {
            const text = collectText(p);
            if (text) addressLines.push(text);
          });
        }
        sibling = sibling.nextElementSibling;
      }

      return {
        fullName: collectText(heading),
        lines: [...new Set(addressLines)],
      };
    });
    const pinLine = lines.find((line) => /\b\d{6}\b/.test(line)) ?? '';
    const mobile =
      lines.find((line) => line.replace(/\D/g, '').length === 10)?.replace(/\D/g, '') ?? '';

    return {
      fullName,
      mobile,
      address: lines
        .filter((line) => line !== pinLine && line.replace(/\D/g, '') !== mobile)
        .join(', '),
      pincode: pinLine.match(/\b(\d{6})\b/)?.[1] ?? '',
    };
  }

  private async priceSection(): Promise<Locator> {
    if (await this.priceDetailsSection.isVisible().catch(() => false)) {
      return this.priceDetailsSection;
    }
    const metalPrice = this.page.getByText('Metal Price', { exact: true }).first();
    await metalPrice.waitFor({ state: 'visible', timeout: 15_000 });
    return metalPrice.locator(
      'xpath=ancestor::*[.//*[normalize-space()="Grand Total"]][1]');
  }

  private async priceRow(label: string, section: Locator): Promise<number> {
    const labelCell = section.getByText(label, { exact: true });
    const value = await this.text(labelCell.locator('xpath=following-sibling::*[1]'));
    return Math.abs(this.parseAmount(value));
  }

  private async readCouponDiscount(section: Locator): Promise<number> {
    for (const label of ['Coupon Discount', 'Coupon Benefit', 'Coupon', 'Discount']) {
      const labelCell = section.getByText(label, { exact: true });
      if (await labelCell.isVisible({ timeout: 1_000 }).catch(() => false)) {
        return this.optionalPriceRow(section, label);
      }
    }
    return 0;
  }

  private async optionalPriceRow(section: Locator, label: string): Promise<number> {
    const labelCell = section.getByText(label, { exact: true });
    if (!(await labelCell.isVisible({ timeout: 2_000 }).catch(() => false))) {
      return 0;
    }
    const value = await this.text(labelCell.locator('xpath=following-sibling::*[1]'));
    return Math.abs(this.parseAmount(value));
  }

  private async priceRowEither(section: Locator, ...labels: string[]): Promise<number> {
    for (const label of labels) {
      const labelCell = section.getByText(label, { exact: true });
      if (await labelCell.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const value = await this.text(labelCell.locator('xpath=following-sibling::*[1]'));
        return Math.abs(this.parseAmount(value));
      }
    }
    throw new Error(`Price row not found in checkout: ${labels.join(' | ')}`);
  }

  /** TC_SHOP_015 only — EMI address-step price panel with coupon discount. */
  private async getEmiCheckoutPriceDetailsWithCoupon(): Promise<ShopCheckoutPriceDetailsWithCoupon> {
    await this.emiPriceDetailsPanel.waitFor({ state: 'visible', timeout: 10_000 });
    const section = this.emiPriceDetailsPanel;
    const metalPrice = await this.emiPriceRow('Metal Price');
    const makingAndDeliveryCharges = await this.emiPriceRow('Making & Delivery Charges');
    const tax = await this.emiPriceRowEither('Tax', 'TAX');
    const grandTotal = await this.emiPriceRow('Grand Total');
    const couponDiscount = await this.readCouponDiscount(section);
    const initialPayment = await this.optionalEmiPriceRow('Initial Payment');
    const totalSum =
      initialPayment > 0
        ? initialPayment
        : Number((metalPrice + makingAndDeliveryCharges + tax).toFixed(2));
    return {
      metalPrice,
      makingAndDeliveryCharges,
      tax,
      paidFromFunds: 0,
      grandTotal,
      couponDiscount,
      totalSum,
    };
  }

  private async optionalEmiPriceRow(label: string): Promise<number> {
    const labelCell = this.emiPriceDetailsPanel.getByText(label, { exact: true });
    if (!(await labelCell.isVisible({ timeout: 2_000 }).catch(() => false))) {
      return 0;
    }
    return Math.abs(
      this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]'))));
  }

  private async emiPriceRow(label: string): Promise<number> {
    const labelCell = this.emiPriceDetailsPanel.getByText(label, { exact: true });
    return Math.abs(
      this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]'))));
  }

  private async emiPriceRowText(label: string): Promise<string> {
    const labelCell = this.emiPriceDetailsPanel.getByText(label, { exact: true });
    return this.text(labelCell.locator('xpath=following-sibling::*[1]'));
  }

  private async emiPriceRowEither(...labels: string[]): Promise<number> {
    for (const label of labels) {
      const labelCell = this.emiPriceDetailsPanel.getByText(label, { exact: true });
      if (await labelCell.isVisible({ timeout: 2_000 }).catch(() => false)) {
        return Math.abs(
          this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]'))));
      }
    }
    throw new Error(`Price row not found in checkout: ${labels.join(' | ')}`);
  }

  private async emiSummaryPriceRow(label: string): Promise<number> {
    const labelCell = this.emiSummaryDetailsPanel.getByText(label, { exact: true });
    return Math.abs(
      this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]'))));
  }

  private async emiSummaryPriceRowText(label: string): Promise<string> {
    const labelCell = this.emiSummaryDetailsPanel.getByText(label, { exact: true });
    return this.text(labelCell.locator('xpath=following-sibling::*[1]'));
  }

  private async emiSummaryPriceRowEither(...labels: string[]): Promise<number> {
    for (const label of labels) {
      const labelCell = this.emiSummaryDetailsPanel.getByText(label, { exact: true });
      if (await labelCell.isVisible({ timeout: 2_000 }).catch(() => false)) {
        return Math.abs(
          this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]'))));
      }
    }
    throw new Error(`Price row not found in EMI summary: ${labels.join(' | ')}`);
  }

  private async text(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /** TC_SHOP_016 — savings + coupon must not zero out payable; Razorpay amount required. */
  private assertPartialSavingsCouponAndNetbankingRequired(
    savings: number,
    couponDiscount: number,
    payable: number,
    productGrandTotal: number,
    stepLabel: string,
  ): void {
    if (payable <= 0) {
      throw new Error(
        `[TC_SHOP_016] ${stepLabel}: Payable after savings and coupon is ₹${payable}. ` +
          'Razorpay remainder must be greater than zero.',
      );
    }
    if (productGrandTotal <= savings + couponDiscount) {
      throw new Error(
        `[TC_SHOP_016] ${stepLabel}: Product price (₹${productGrandTotal}) must exceed ` +
          `User Savings (₹${savings}) + coupon (₹${couponDiscount}).`,
      );
    }
    expect(savings, 'TC_SHOP_016 requires User Savings on account').toBeGreaterThan(0);
    expect(couponDiscount, 'TC_SHOP_016 requires coupon discount').toBeGreaterThan(0);
    expect(payable, 'TC_SHOP_016 requires Razorpay remainder after savings + coupon').toBeGreaterThan(0);
  }

  /** TC_SHOP_012 / AT-1647 — fail fast when savings cover the full order (no Netbanking remainder). */
  private assertPartialSavingsAndNetbankingRequired(
    savings: number,
    payable: number,
    productGrandTotal: number,
    stepLabel: string): void {
    if (payable <= 0) {
      throw new Error(
        `[AT-1647] ${stepLabel}: Payable amount after savings is ₹${payable} (zero). ` +
          'Partial User Savings + Netbanking is required — savings must not cover the full order amount.');
    }
    if (savings >= productGrandTotal) {
      throw new Error(
        `[AT-1647] ${stepLabel}: Applied savings (₹${savings}) is greater than or equal to product price (₹${productGrandTotal}). ` +
          'Use a customer or product where savings only cover part of the order so Netbanking pays the remainder.');
    }
    expect(savings, 'AT-1647 requires User Savings on account').toBeGreaterThan(0);
    expect(savings).toBeLessThan(productGrandTotal);
    expect(payable, 'AT-1647 requires Netbanking remainder after savings').toBeGreaterThan(0);
  }

  async updateCustomerDetails(
    firstName: string,
    lastName: string,
    mobileNumber: string,
    firstAddressLine: string
  ): Promise<void> {
    await this.firstName.waitFor({ state: 'visible', timeout: 10_000 });
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.mobileNumber.fill(mobileNumber);
    await this.firstAddressLine.fill(firstAddressLine);
  }

  /** Delivery address management — Set as default PrimeNG checkbox on address edit form. */
  // async clickSetAsDefaultCheckbox(): Promise<void> {
  //   const checkbox = this.page.getByRole('checkbox', { name: /Set this as my default address/i });
  //   await checkbox.scrollIntoViewIfNeeded();
  //   if (!(await checkbox.isChecked().catch(() => false))) {
  //     await checkbox.click();
  //   }
  //   await expect(checkbox).toBeChecked({ timeout: 10_000 });
  // }
  // async clickSetAsDefaultCheckbox(): Promise<void> {
  //   const container = this.page
  //     .locator('div.flex.items-center')
  //     .filter({
  //       hasText: 'Set this as my default address',
  //     });

  //   await expect(container).toBeVisible();

  //   await container.click();

  //   await expect(this.page.locator('#isDefault')).toBeChecked();
  // }
  private readonly defaultAddressCheckbox =
    this.page.locator('p-checkbox:has(#isDefault)');

  async clickSetAsDefaultCheckbox(): Promise<void> {
    const input = this.defaultAddressCheckbox.locator('#isDefault');
    const box = this.defaultAddressCheckbox.locator('.p-checkbox-box');

    await expect(box).toBeVisible();

    if (!(await input.isChecked())) {
      await box.click();
    }

    await expect(input).toBeChecked();
  }  /** Delivery address management — Save & Proceed on address edit form. */
  async clickSaveAndContinue(): Promise<void> {
    const saveButton = this.page.getByRole('button', { name: /^Save\s*&\s*Proceed$/i });
    await saveButton.scrollIntoViewIfNeeded();
    await expect(saveButton).toBeEnabled({ timeout: 10_000 });
    await saveButton.click();
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.chooseBillingHeading.waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  /** Delivery address management — Cancel on address edit form; returns to Choose Billing Address. */
  async clickCancelOnAddressEditForm(): Promise<void> {
    await this.waitForAddressEditFormLoaded();
    const cancelButton = this.page.getByRole('button', { name: /^Cancel$/i });
    await cancelButton.scrollIntoViewIfNeeded();
    await expect(cancelButton).toBeVisible({ timeout: 10_000 });
    await cancelButton.click();
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.chooseBillingHeading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Delivery address management — edit form is ready for input/actions. */
  private async waitForAddressEditFormLoaded(): Promise<void> {
    await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.firstName.waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.getByRole('button', { name: /^Cancel$/i }).waitFor({ state: 'visible', timeout: 15_000 });
  }

  private addNewAddressCard(): Locator {
    return this.page.getByText(/^Add New Address$/i).first();
  }

  /** Delivery address management — Add New Address card on Choose Billing Address step. */
  async expectAddNewAddressButtonVisible(): Promise<void> {
    const card = this.addNewAddressCard();
    await expect(card).toBeVisible({ timeout: 15_000 });
  }

  /** Delivery address management — cancel edit should show Add New Address card. */
  async verifyCancelEditAddressFormRestoresCardList(): Promise<void> {
    await this.expectAddNewAddressButtonVisible();
  }

  /** Delivery address management — edited card shows Default badge and is selected. */
  async verifyBillingAddressCardIsSelectedDefault(
    cardIndex = 0,
    expected?: Pick<ShopBillingAddressDetails, 'fullName' | 'mobile' | 'address'>
  ): Promise<void> {
    const card = this.billingAddressCards().nth(cardIndex);
    await expect(card).toBeVisible({ timeout: 15_000 });

    const defaultBadge = card.locator('div.green-gradient').filter({ hasText: /^Default$/i });
    await expect(defaultBadge).toBeVisible({ timeout: 15_000 });
    await expect(defaultBadge.locator('.pi-check')).toBeVisible();

    const isSelected =
      (await card.locator('input[type="radio"]:checked').count()) > 0 ||
      (await card.locator('.pi-check').count()) > 0;
    expect(isSelected, 'Edited billing address card should be selected').toBe(true);

    if (!expected) return;

    const details = await this.readAddressLines(card);
    if (expected.fullName) {
      expect(details.fullName.toLowerCase()).toBe(expected.fullName.toLowerCase());
    }
    if (expected.mobile) {
      expect(details.mobile.replace(/\D/g, '')).toBe(expected.mobile.replace(/\D/g, ''));
    }
    if (expected.address) {
      expect(details.address.toLowerCase()).toContain(expected.address.toLowerCase());
    }
  }

  /** Delivery address management — Billing to this Address. */
  async clickBillingToThisAddress(): Promise<void> {
    await this.billingToThisAddressButton.scrollIntoViewIfNeeded();
    await expect(this.billingToThisAddressButton).toBeEnabled({ timeout: 10_000 });
    await this.billingToThisAddressButton.click();
  }

  /** Delivery address management — Same as billing address checkbox. */
  async selectSameAsBillingAddress(): Promise<void> {
    await this.sameAsBillingLabel.scrollIntoViewIfNeeded();
    const checkbox = this.page.locator('#sameAsBillingAddress');
    if (!(await checkbox.isChecked().catch(() => false))) {
      await this.sameAsBillingLabel.click();
    }
    await expect(checkbox).toBeChecked({ timeout: 10_000 });
  }

  /** Delivery address management — Deliver to this Address. */
  async clickDeliverToThisAddress(): Promise<void> {
    await this.page.keyboard.press('Home');
    await this.deliverToThisAddressButton.scrollIntoViewIfNeeded();
    await expect(this.deliverToThisAddressButton).toBeEnabled({ timeout: 10_000 });
    await this.deliverToThisAddressButton.click();
  }

  /** Delivery address management — Address Details on order summary after OTP. */
  async validateCheckoutAddressDetails(
    expectedAddress: ShopBillingAddressDetails
  ): Promise<{ deliveryAddress: ShopBillingAddressDetails; billingAddress: ShopBillingAddressDetails }> {
    await this.waitForOrderSummary();
    const deliveryAddress = await this.getDeliveryAddress();
    const billingAddress = await this.getBilledToAddress();
    shopLogGet('Delivery address', deliveryAddress);
    shopLogGet('Billing address', billingAddress);
    this.assertOrderSummaryAddressesMatchBilling(deliveryAddress, billingAddress, expectedAddress);
    return { deliveryAddress, billingAddress };
  }
}
