import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import { ShopCartPriceDetails } from './shop-cart.page';

export type ShopCheckoutPriceDetails = ShopCartPriceDetails & {
  savings: number;
  paidFromFunds: number;
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

  async getPriceDetails(): Promise<ShopCheckoutPriceDetails> {
    const section = await this.priceSection();
    return {
      metalPrice: await this.priceRow('Metal Price', section),
      makingAndDeliveryCharges: await this.priceRow('Making & Delivery Charges', section),
      savings: await this.priceRow('Savings', section),
      paidFromFunds: await this.priceRow('Paid From Funds', section),
      tax: await this.priceRow('Tax', section),
      grandTotal: await this.priceRow('Grand Total', section),
    };
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
      this.emiSummaryDetailsPanel.locator('.bg-amber-50 p').first(),
    );
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

  getCalculatedGrandTotal(price: ShopCheckoutPriceDetails): number {
    return (
      price.metalPrice +
      price.makingAndDeliveryCharges +
      price.tax -
      price.savings -
      price.paidFromFunds
    );
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

  async selectNetbanking(): Promise<void> {
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

  async getOrderPlacedDetails(): Promise<ShopOrderPlacedDetails> {
    const dialog = this.page.getByRole('dialog', { name: /^Order Placed$/i });
    await dialog.waitFor({ state: 'visible', timeout: 30_000 });

    const successMessage = await this.text(
      dialog
        .locator('app-dialog .text-16.font-gilroy')
        .filter({ hasText: /booked|placed/i })
        .first(),
    );
    const orderIdRaw = await this.text(dialog.locator('.bg-teal-aliceblue').first());
    const orderId = this.parseOrderIds(orderIdRaw).join(',');

    return { orderId, successMessage };
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
    firstProductPrice: number,
  ): number {
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
      'xpath=ancestor::*[.//*[normalize-space()="Grand Total"]][1]',
    );
  }

  private async priceRow(label: string, section: Locator): Promise<number> {
    const labelCell = section.getByText(label, { exact: true });
    const value = await this.text(labelCell.locator('xpath=following-sibling::*[1]'));
    return Math.abs(this.parseAmount(value));
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

  private async emiPriceRow(label: string): Promise<number> {
    const labelCell = this.emiPriceDetailsPanel.getByText(label, { exact: true });
    return Math.abs(
      this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]'))),
    );
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
          this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]'))),
        );
      }
    }
    throw new Error(`Price row not found in checkout: ${labels.join(' | ')}`);
  }

  private async emiSummaryPriceRow(label: string): Promise<number> {
    const labelCell = this.emiSummaryDetailsPanel.getByText(label, { exact: true });
    return Math.abs(
      this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]'))),
    );
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
          this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]'))),
        );
      }
    }
    throw new Error(`Price row not found in EMI summary: ${labels.join(' | ')}`);
  }

  private async text(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }
}
