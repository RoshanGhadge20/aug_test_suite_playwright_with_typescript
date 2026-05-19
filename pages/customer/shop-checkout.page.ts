import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import { ShopCartPriceDetails } from './shop-cart.page';

export type ShopCheckoutPriceDetails = ShopCartPriceDetails & {
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

export class ShopCheckoutPage extends BasePage {
  private readonly priceDetailsSection: Locator;
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
    const orderId = orderIdRaw.replace(/^Order\s*ID:\s*/i, '').trim();

    return { orderId, successMessage };
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

  private async text(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }
}
