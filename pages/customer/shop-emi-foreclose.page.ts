import { expect, Locator, Page } from '@playwright/test';
import { ShopEmiPage } from './shop-emi.page';
import { shopLogActualExpected, shopLogGet } from '../../utils/test/shop-log';
import {
  persistShopEmiPurchaseChainState,
  type ShopEmiPurchaseChainState,
} from '../../utils/test/shop-emi-purchase-chain';
import { PaymentPage } from './payment.page';
import type { MyOrderVerificationPage } from './my-order-verification.page';
import { BasePage } from '../shared/base.page';

export type ShopEmiForecloseSummary = {
  forecloseAmount: number;
  forecloseAmountText: string;
  labelText: string;
};

export type ShopEmiForeclosePaymentSummary = {
  pendingEmiTotal: number;
  paidEmi: number;
  payButtonAmount: number;
  payButtonText: string;
};

/** Total / Net Payable card after all EMI checkboxes are selected. */
export type ShopEmiForeclosePayableAmounts = {
  totalAmount: number;
  netPayableAmount: number;
  totalAmountText: string;
  netPayableAmountText: string;
};

/** Pay one pending EMI on the foreclose page, or tick all rows for full foreclose. */
export type ForecloseEmiInstallmentSelection = 'first' | 'all';

/** One pending/paid row on pay-emi/foreclose under "Transfer this amount to". */
export type ShopEmiForecloseInstallment = {
  monthLabel: string;
  emiAmount: number;
  emiAmountText: string;
  status: string;
  isChecked: boolean;
};

/** Gray bordered card after Pay Now on a Booked EMI shop order (AT-1658). */
export type ShopEmiPayNowOrderDetails = {
  expectedEmiCompletionDate: string;
  expectedEmiCompletionNote: string;
  emiTenure: string;
  emiPerMonth: number;
  downpayment: number;
  amountRemaining: number;
};

/**
 * Jira AT-1658 — EMI Pay Now summary + foreclose flow after opening a Booked EMI row from My Orders.
 */
export class ShopEmiForeclosePage extends BasePage {
  /** UAT e.g. https://cp.gfau.augmont.com/shop-new/pay-emi/foreclose */
  private static readonly FORECLOSE_PAYMENT_URL = /\/shop-new\/pay-emi\/foreclose(?:\/|$|\?|#)/i;

  constructor(page: Page) {
    super(page);
  }

  private emiSummaryPanel(): Locator {
    return this.page
      .locator('div.bg-sheengold-ochre.rounded-lg.shadow-sm, motion.div.bg-sheengold-ochre.rounded-lg.shadow-sm')
      .filter({ has: this.page.getByRole('button', { name: /^pay now$/i }) })
      .filter({ has: this.page.getByRole('button', { name: /cancel booking/i }) })
      .filter({ has: this.page.getByText(/Net weight:/i) })
      .filter({ has: this.page.getByText(/^DUE ON/i) })
      .first();
  }

  async waitForEmiSummaryPanel(): Promise<void> {
    await this.emiSummaryPanel().waitFor({ state: 'visible', timeout: 20_000 });
    await expect(this.emiSummaryPanel().getByRole('button', { name: /^pay now$/i })).toBeVisible();
  }

  /** Pay Now on the ochre EMI summary (starts installment pay or foreclose checkout). */
  async clickPayNowOnEmiSummary(): Promise<void> {
    await this.waitForEmiSummaryPanel();
    await this.emiSummaryPanel().getByRole('button', { name: /^pay now$/i }).click();
  }

  private emiPayNowOrderDetailsCard(): Locator {
    return this.page
      .locator('div.border.border-gray-300.rounded-lg')
      .filter({ has: this.page.getByText(/Expected EMI Completion/i) })
      .filter({ has: this.page.getByText(/Amount Remaining/i) })
      .first();
  }

  async waitForEmiPayNowOrderDetailsCard(): Promise<void> {
    const card = this.emiPayNowOrderDetailsCard();
    await card.waitFor({ state: 'visible', timeout: 20_000 });
    await expect(card.getByText(/EMI Tenure/i)).toBeVisible();
    await expect(card.getByText(/Amount Remaining/i)).toBeVisible();
  }

  private async readEmiDetailRow(card: Locator, label: string): Promise<string> {
    const row = card.locator('div.w-full.flex').filter({
      has: this.page.getByRole('heading', { level: 4, name: label }),
    });
    return ((await row.getByRole('heading', { level: 4 }).nth(1).textContent()) ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Read tenure, EMI/month, downpayment, amount remaining from Pay Now EMI details card. */
  async getEmiPayNowOrderDetails(): Promise<ShopEmiPayNowOrderDetails> {
    await this.waitForEmiPayNowOrderDetailsCard();
    const card = this.emiPayNowOrderDetailsCard();
    const header = card.locator('div.bg-amber-50').first();
    const headerText = ((await header.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const noteMatch = headerText.match(/Subject to timely payments/i);
    const dateMatch = headerText.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i);

    const emiPerMonthText = await this.readEmiDetailRow(card, 'EMI per month');
    const downpaymentText = await this.readEmiDetailRow(card, 'Downpayment');
    const amountRemainingText = await this.readEmiDetailRow(card, 'Amount Remaining');

    return {
      expectedEmiCompletionDate: dateMatch?.[0] ?? '',
      expectedEmiCompletionNote: noteMatch ? 'Subject to timely payments' : '',
      emiTenure: await this.readEmiDetailRow(card, 'EMI Tenure'),
      emiPerMonth: this.parseAmount(emiPerMonthText),
      downpayment: this.parseAmount(downpaymentText),
      amountRemaining: this.parseAmount(amountRemainingText),
    };
  }

  private forecloseControl(): Locator {
    return this.page
      .getByRole('button', { name: /foreclose/i })
      .or(this.page.getByRole('radio', { name: /foreclose/i }))
      .or(this.page.locator('span.p-button-label').filter({ hasText: /foreclose/i }))
      .or(this.page.getByText(/^foreclose/i));
  }

  async isForecloseOptionVisible(): Promise<boolean> {
    return this.forecloseControl()
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  /** Select / click Foreclose EMI (summary panel, checkout, or payment-type screen). */
  async clickForecloseEmi(): Promise<void> {
    if (await this.isForecloseOptionVisible()) {
      await this.forecloseControl().first().click();
      return;
    }

    await this.clickPayNowOnEmiSummary();
    await this.page.waitForLoadState('domcontentloaded');

    if (await this.isForecloseOptionVisible()) {
      await this.forecloseControl().first().click();
      return;
    }

    const onOrderDetail = /\/shop-new\/order\//i.test(this.page.url());
    if (onOrderDetail) {
      const myEmisForeclose = this.page
        .locator('p-accordiontab, div.rounded-lg')
        .filter({ has: this.page.getByText(/My EMIs/i) })
        .getByRole('button', { name: /foreclose/i })
        .first();
      if (await myEmisForeclose.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await myEmisForeclose.click();
        return;
      }
    }

    throw new Error(
      '[AT-1658] Foreclose EMI control not found. Validate UAT copy/locators (button or label matching /foreclose/i).');
  }

  async confirmForecloseDialogIfPresent(): Promise<void> {
    const confirm = this.page.getByRole('button', { name: /^(confirm|yes|proceed|continue)$/i });
    if (await confirm.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirm.first().click();
    }
  }

  async readForeclosePayableAmount(): Promise<ShopEmiForecloseSummary> {
    const payment = await this.readForeclosePaymentSummary().catch(() => null);
    if (payment && payment.pendingEmiTotal > 0) {
      const forecloseAmountText = `₹${payment.pendingEmiTotal}`;
      return {
        forecloseAmount: payment.pendingEmiTotal,
        forecloseAmountText,
        labelText: `Pending EMI ${forecloseAmountText} | Pay button: ${payment.payButtonText}`,
      };
    }

    const bodyText = ((await this.page.locator('body').textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const pendingMatch = bodyText.match(/Pending\s*EMI\s*₹?\s*([\d,.]+)/i);
    if (pendingMatch) {
      const forecloseAmount = this.parseAmount(pendingMatch[1]);
      return {
        forecloseAmount,
        forecloseAmountText: `₹${pendingMatch[1]}`,
        labelText: bodyText.slice(0, 500),
      };
    }

    const payBtn = this.page.getByRole('button', { name: /^Pay ₹/i }).first();
    const payButtonText = ((await payBtn.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
    const payMatch = payButtonText.match(/₹\s*([\d,.]+)/);
    const forecloseAmount = payMatch ? this.parseAmount(payMatch[1]) : 0;

    return {
      forecloseAmount,
      forecloseAmountText: payMatch ? `₹${payMatch[1]}` : payButtonText,
      labelText: bodyText.slice(0, 500),
    };
  }

  isOnForeclosePaymentPage(): boolean {
    return ShopEmiForeclosePage.FORECLOSE_PAYMENT_URL.test(this.page.url());
  }

  async waitForForeclosePaymentPage(): Promise<void> {
    await this.page.waitForURL(ShopEmiForeclosePage.FORECLOSE_PAYMENT_URL, { timeout: 20_000 });
    await this.page.getByText(/Foreclose EMI/i).first().waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.getByRole('button', { name: /^Pay ₹/i }).first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** AT-1658 foreclose screen — Pending EMI total, Paid EMI, Pay ₹ button amount. */
  async readForeclosePaymentSummary(): Promise<ShopEmiForeclosePaymentSummary> {
    await this.waitForForeclosePaymentPage();
    const bodyText = ((await this.page.locator('body').textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const pendingMatch = bodyText.match(/Pending\s*EMI\s*₹?\s*([\d,.]+)/i);
    const paidMatch = bodyText.match(/Paid\s*EMI\s*₹?\s*([\d,.]+)/i);
    const payBtn = this.page.getByRole('button', { name: /^Pay ₹/i }).first();
    const payButtonText = ((await payBtn.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const payMatch = payButtonText.match(/₹\s*([\d,.]+)/);

    return {
      pendingEmiTotal: pendingMatch ? this.parseAmount(pendingMatch[1]) : 0,
      paidEmi: paidMatch ? this.parseAmount(paidMatch[1]) : 0,
      payButtonAmount: payMatch ? this.parseAmount(payMatch[1]) : 0,
      payButtonText,
    };
  }

  private forecloseTransferSection(): Locator {
    return this.page.getByRole('heading', { name: /^Transfer this amount to$/i, level: 2 }).locator('..');
  }

  /** One card per EMI month (checkbox + amount + Pending/Paid label). */
  private forecloseInstallmentRows(): Locator {
    return this.forecloseTransferSection().locator('> div').first().locator('> div');
  }

  private readInstallmentStatusFromText(rowText: string): string {
    if (/\bPending\b/i.test(rowText)) {
      return 'Pending';
    }
    if (/\bPaid\b/i.test(rowText)) {
      return 'Paid';
    }
    return '';
  }

  private static readonly EMI_MONTH_YEAR =
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i;

  /** Foreclose page — each EMI month row with amount, status, and checkbox state. */
  async getForecloseInstallments(): Promise<ShopEmiForecloseInstallment[]> {
    await this.waitForForeclosePaymentPage();
    const rows = this.forecloseInstallmentRows();
    await rows.first().waitFor({ state: 'visible', timeout: 15_000 });
    const count = await rows.count();
    const installments: ShopEmiForecloseInstallment[] = [];

    for (let i = 0; i < count; i += 1) {
      const row = rows.nth(i);
      const rowText = ((await row.innerText()) ?? '').replace(/\s+/g, ' ').trim();
      const monthMatch = rowText.match(ShopEmiForeclosePage.EMI_MONTH_YEAR);
      const amountMatch = rowText.match(/EMI Amount\s*₹\s*([\d,.]+)/i);
      const status = this.readInstallmentStatusFromText(rowText);

      const checkbox = row.getByRole('checkbox').first();
      const hiddenInput = row.locator('input[type="checkbox"]').first();
      let isChecked = false;
      if (await checkbox.count()) {
        isChecked = await checkbox.isChecked().catch(() => false);
      } else if (await hiddenInput.count()) {
        isChecked =
          (await hiddenInput.getAttribute('aria-checked')) === 'true' ||
          (await hiddenInput.isChecked().catch(() => false));
      }

      const amountRaw = amountMatch?.[1] ?? '0';
      installments.push({
        monthLabel: monthMatch?.[0] ?? '',
        emiAmount: this.parseAmount(amountRaw),
        emiAmountText: `₹${amountRaw}`,
        status,
        isChecked,
      });
    }

    return installments;
  }

  async assertForeclosePayButtonDisabled(): Promise<void> {
    const payBtn = this.page.getByRole('button', { name: /^Pay ₹/i }).first();
    await expect(payBtn).toBeVisible();
    await expect(payBtn).toBeDisabled();
  }

  /**
   * AT-1658 — on pay-emi/foreclose before any selection: all rows Pending, unchecked, Pay disabled.
   */
  async verifyForecloseInitialInstallmentState(
    payNow: ShopEmiPayNowOrderDetails): Promise<ShopEmiForecloseInstallment[]> {
    expect(this.isOnForeclosePaymentPage(), 'Expected /shop-new/pay-emi/foreclose').toBe(true);

    const installments = await this.getForecloseInstallments();
    const tenureCount = Number(payNow.emiTenure.match(/(\d+)/)?.[1] ?? installments.length);
    expect(installments.length).toBeGreaterThan(0);
    expect(installments.length).toBeLessThanOrEqual(tenureCount);

    console.log('[Foreclose EMI] Row count:', installments.length, '| Tenure:', payNow.emiTenure);
    const totalEmi = installments.reduce((sum, row) => sum + row.emiAmount, 0);
    for (const row of installments) {
      console.log(
        '[Foreclose EMI]',
        row.monthLabel,
        '| Amount:',
        row.emiAmountText,
        '| Status:',
        row.status,
        '| Checked:',
        row.isChecked);
      expect(row.monthLabel).toMatch(ShopEmiForeclosePage.EMI_MONTH_YEAR);
      expect(row.emiAmount).toBeGreaterThan(0);
      expect(row.status, `${row.monthLabel} status must be Pending`).toBe('Pending');
      expect(row.isChecked, `${row.monthLabel} should be unchecked`).toBe(false);
    }
    console.log(
      '[Foreclose EMI] Total EMI:',
      totalEmi,
      '| Amount remaining (Pay Now):',
      payNow.amountRemaining);
    expect(totalEmi).toBeCloseTo(payNow.amountRemaining, 0);
    await this.assertForeclosePayButtonDisabled();
    console.log('[Foreclose EMI] Pay button: disabled (no installment selected)');
    return installments;
  }

  private async checkForecloseInstallmentRow(row: Locator): Promise<void> {
    await row.scrollIntoViewIfNeeded();
    const hiddenInput = row.locator('input[type="checkbox"]').first();
    // This PrimeNG version doesn't expose `aria-checked` on the input — the native
    // `checked` property (what `.check()`/`.isChecked()` use) is the real signal.
    if (await hiddenInput.isChecked().catch(() => false)) {
      return;
    }
    // The visible `.p-checkbox-box` div sits underneath its own native checkbox
    // `<input>`, which intercepts pointer events — target the input directly.
    if (await hiddenInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await hiddenInput.check();
    } else {
      await row.getByText(/EMI Amount ₹/i).click();
      await expect(hiddenInput).toBeChecked({ timeout: 8_000 });
    }
  }

  /**
   * Tick pending EMI checkboxes on the foreclose page.
   * - `first` — one installment (partial pay, e.g. TC_SHOP_008)
   * - `all` — every visible row (full foreclose, e.g. TC_SHOP_011)
   */
  async selectPendingForecloseInstallments(
    selection: ForecloseEmiInstallmentSelection): Promise<{ selectedCount: number; selectedIndices: number[] }> {
    await this.waitForForeclosePaymentPage();
    const rows = this.forecloseInstallmentRows();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    const selectedIndices =
      selection === 'all' ? Array.from({ length: rowCount }, (_, i) => i) : [0];

    for (const index of selectedIndices) {
      await this.checkForecloseInstallmentRow(rows.nth(index));
    }
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    console.log(
      `[Foreclose EMI] Selection mode: ${selection} | checked ${selectedIndices.length} row(s)`);
    return { selectedCount: selectedIndices.length, selectedIndices };
  }

  /** @deprecated Prefer {@link selectPendingForecloseInstallments} with `'first'`. */
  async selectFirstPendingForecloseInstallment(): Promise<void> {
    await this.selectPendingForecloseInstallments('first');
  }

  /** @deprecated Prefer {@link selectPendingForecloseInstallments} with `'all'`. */
  async selectAllPendingForecloseInstallments(): Promise<void> {
    await this.selectPendingForecloseInstallments('all');
  }

  private foreclosePayableAmountCard(): Locator {
    return this.page
      .locator('div.border.border-gray-300.rounded-lg')
      .filter({ has: this.page.getByRole('heading', { level: 4, name: 'Total Amount' }) })
      .filter({ has: this.page.getByRole('heading', { level: 4, name: 'Net Payable Amount' }) })
      .first();
  }

  private async readForeclosePayableRow(card: Locator, label: string): Promise<string> {
    const row = card.locator('div.w-full').filter({
      has: this.page.getByRole('heading', { level: 4, name: label }),
    });
    return ((await row.getByRole('heading', { level: 4 }).nth(1).textContent()) ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Read Total Amount and Net Payable Amount from the summary card. */
  async readForeclosePayableAmounts(): Promise<ShopEmiForeclosePayableAmounts> {
    await this.waitForForeclosePaymentPage();
    const card = this.foreclosePayableAmountCard();
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    const totalAmountText = await this.readForeclosePayableRow(card, 'Total Amount');
    const netPayableAmountText = await this.readForeclosePayableRow(card, 'Net Payable Amount');
    return {
      totalAmount: this.parseAmount(totalAmountText),
      netPayableAmount: this.parseAmount(netPayableAmountText),
      totalAmountText,
      netPayableAmountText,
    };
  }

  /** After checkboxes selected — Total and Net Payable must match expected (e.g. Pay Now amount remaining). */
  async verifyForecloseNetPayableAmount(expected: number): Promise<ShopEmiForeclosePayableAmounts> {
    const amounts = await this.readForeclosePayableAmounts();
    console.log('[Foreclose EMI] Total Amount:', amounts.totalAmountText);
    console.log('[Foreclose EMI] Net Payable Amount:', amounts.netPayableAmountText);
    expect(amounts.totalAmount).toBeCloseTo(expected, 0);
    expect(amounts.netPayableAmount).toBeCloseTo(expected, 0);
    expect(amounts.netPayableAmount).toBeCloseTo(amounts.totalAmount, 0);
    return amounts;
  }

  private forecloseNetbankingControl(): Locator {
    return this.page.locator('label[for="NETBANKING"]').or(this.page.locator('#NETBANKING')).or(
      this.page
        .locator('div.payment-type, div.grid.grid-cols-2')
        .getByRole('radio', { name: /NETBANKING/i }));
  }

  async isForecloseNetbankingVisible(): Promise<boolean> {
    return this.forecloseNetbankingControl()
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
  }

  async selectForecloseNetbanking(): Promise<void> {
    const label = this.page.locator('label[for="NETBANKING"]');
    if (await label.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await label.scrollIntoViewIfNeeded();
      await label.click();
    } else {
      const box = this.page
        .locator('p-radiobutton')
        .filter({ has: this.page.locator('#NETBANKING') })
        .locator('.p-radiobutton-box')
        .first();
      await box.click();
    }
    await expect(this.page.locator('#NETBANKING')).toBeChecked({ timeout: 8_000 });
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    console.log('[Foreclose EMI] Payment method: NETBANKING selected');
  }

  async waitForForeclosePayButtonEnabled(timeoutMs = 45_000): Promise<void> {
    const payBtn = this.page.getByRole('button', { name: /^Pay ₹/i }).first();
    await expect(payBtn).toBeEnabled({ timeout: timeoutMs });
  }

  async clickForeclosePayButton(): Promise<void> {
    await this.waitForForeclosePayButtonEnabled();
    const payBtn = this.page.getByRole('button', { name: /^Pay ₹/i }).first();
    await payBtn.scrollIntoViewIfNeeded();
    await payBtn.click();
    console.log('[Foreclose EMI] Clicked Pay button');
  }

  /**
   * Foreclose app screen only: select EMIs, validate Net Payable, pick NETBANKING payment type, click Pay ₹.
   * (Opens Razorpay — actual bank payment is {@link completeForecloseRazorpayPayment}.)
   */
  async payForecloseWithNetbanking(
    expectedNetPayable: number,
    selection: ForecloseEmiInstallmentSelection = 'all'): Promise<ShopEmiForeclosePaymentSummary> {
    await this.selectPendingForecloseInstallments(selection);
    await this.verifyForecloseNetPayableAmount(expectedNetPayable);
    await this.selectForecloseNetbanking();
    const payment = await this.readForeclosePaymentSummary();
    console.log('[Foreclose EMI] Pay button:', payment.payButtonText);
    expect(payment.payButtonAmount).toBeCloseTo(expectedNetPayable, 0);
    await this.clickForeclosePayButton();
    return payment;
  }

  async getInstallmentPaidDetails(): Promise<{ message: string; emiProgress: string }> {
    const dialog = this.page.getByRole('dialog', { name: /^Installment Paid$/i });
    await dialog.waitFor({ state: 'visible', timeout: 30_000 });
    const message = ((await dialog.getByText(/You have successfully paid your installment/i).textContent()) ?? '').trim();
    const progressBlock = dialog.locator('p-knob').locator('xpath=ancestor::div[contains(@class,"border")]').first();
    const emiProgress = ((await progressBlock.innerText()) ?? '').replace(/\s+/g, ' ').trim();
    return { message, emiProgress };
  }

  async dismissInstallmentPaidDialog(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: /^Installment Paid$/i });
    await dialog.getByRole('button', { name: /^Done$/i }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 15_000 });
  }

  /** Razorpay gateway after Pay on foreclose page — one real netbanking charge (HDFC). */
  async completeForecloseRazorpayPayment(
    paymentPage: PaymentPage,
    mobile: string,
    expectedAmount: number): Promise<void> {
    expect(expectedAmount, 'Foreclose Pay amount must be > 0').toBeGreaterThan(0);

    const razorpayAmountRaw = await paymentPage.getPriceSummaryAmountFromFrame();
    const normalized =
      razorpayAmountRaw > expectedAmount * 10
        ? Number((razorpayAmountRaw / 100).toFixed(2))
        : razorpayAmountRaw;
    console.log('[Foreclose EMI] Razorpay amount:', normalized, '| expected:', expectedAmount);
    expect(Math.abs(normalized - expectedAmount)).toBeLessThanOrEqual(2);

    await paymentPage.fillContactNumber(mobile);
    await paymentPage.clickRazorpayContinueShop();
    await paymentPage.selectNetbankingShop();
    await paymentPage.completeNetbankingPaymentShop('HDFC Bank');
  }

  /** Foreclose page Pay → Razorpay HDFC (Installment Paid dialog handled in spec). */
  async completeForecloseEmiPayment(
    expectedNetPayable: number,
    paymentPage: PaymentPage,
    mobile: string): Promise<ShopEmiForeclosePaymentSummary> {
    const payment = await this.payForecloseWithNetbanking(expectedNetPayable);
    await this.completeForecloseRazorpayPayment(paymentPage, mobile, payment.payButtonAmount);
    return payment;
  }

  /** TC_SHOP_008 / TC_SHOP_011 — capture Pay Now card with logging. */
  async capturePayNowDetails(): Promise<ShopEmiPayNowOrderDetails> {
    const payNowDetails = await this.getEmiPayNowOrderDetails();
    shopLogGet('EMI Pay Now details', payNowDetails);
    shopLogActualExpected('EMI per month > 0', payNowDetails.emiPerMonth > 0, true);
    shopLogActualExpected('Amount remaining > 0', payNowDetails.amountRemaining > 0, true);
    return payNowDetails;
  }

  /** TC_SHOP_008 / TC_SHOP_011 — open foreclose and validate payable vs Pay Now. */
  async openForecloseAndValidateSummary(
    payNow: ShopEmiPayNowOrderDetails): Promise<number> {
    await this.clickForecloseEmi();
    await this.confirmForecloseDialogIfPresent();
    await this.waitForForeclosePaymentPage();
    const summary = await this.readForeclosePayableAmount();
    shopLogActualExpected('Foreclose amount', summary.forecloseAmount, payNow.amountRemaining);
    expect(summary.forecloseAmount).toBeCloseTo(payNow.amountRemaining, 0);
    return summary.forecloseAmount;
  }

  /** TC_SHOP_008 — verify installment schedule on foreclose page. */
  async verifyInitialInstallmentStateWithLog(
    payNow: ShopEmiPayNowOrderDetails): Promise<number[]> {
    const installments = await this.verifyForecloseInitialInstallmentState(payNow);
    const amounts = installments.map((row) => row.emiAmount);
    shopLogGet('Foreclose installment schedule', amounts);
    return amounts;
  }

  /** TC_SHOP_008 — select first installment and validate net payable. */
  async selectFirstInstallmentAndValidateNetPayable(
    installmentAmounts: number[]): Promise<number> {
    const installments = await this.getForecloseInstallments();
    const payable = installmentAmounts[0] ?? installments[0]?.emiAmount ?? 0;
    await this.selectPendingForecloseInstallments('first');
    await this.verifyForecloseNetPayableAmount(payable);
    shopLogActualExpected('Net payable (first EMI)', payable, payable);
    return payable;
  }

  /** TC_SHOP_011 — select all installments and validate net payable. */
  async selectAllInstallmentsAndValidateNetPayable(
    foreclosePayable: number): Promise<number> {
    await this.selectPendingForecloseInstallments('all');
    await this.verifyForecloseNetPayableAmount(foreclosePayable);
    shopLogActualExpected('Net payable (full foreclose)', foreclosePayable, foreclosePayable);
    return foreclosePayable;
  }

  /** TC_SHOP_008 / TC_SHOP_011 — netbanking Pay on foreclose page. */
  async selectNetbankingAndPay(): Promise<number> {
    await this.selectForecloseNetbanking();
    const payment = await this.readForeclosePaymentSummary();
    shopLogActualExpected('Pay button amount', payment.payButtonAmount, payment.payButtonAmount);
    await this.clickForeclosePayButton();
    return payment.payButtonAmount;
  }

  /** TC_SHOP_008 / TC_SHOP_011 — Razorpay netbanking with logging. */
  async completeForecloseRazorpayPaymentWithLog(
    paymentPage: PaymentPage,
    mobile: string,
    expectedAmount: number): Promise<void> {
    await this.completeForecloseRazorpayPayment(paymentPage, mobile, expectedAmount);
    shopLogActualExpected('Razorpay foreclose amount', expectedAmount, expectedAmount);
  }

  /** TC_SHOP_008 / TC_SHOP_011 — store Pay Now screen data on the purchase chain for later steps. */
  savePayNowDetailsToPurchaseChain(
    chain: ShopEmiPurchaseChainState,
    payNowDetails: ShopEmiPayNowOrderDetails): void {
    chain.payNowDetails = payNowDetails;
    persistShopEmiPurchaseChainState(chain);
  }

  /** TC_SHOP_008 / TC_SHOP_011 — Installment Paid dialog validation. */
  async verifyInstallmentPaidDialog(
    emiTenure: string,
    expectAllPaid = false): Promise<void> {
    const emiCount = ShopEmiPage.parseInstallmentCount(emiTenure);
    const installmentPaid = await this.getInstallmentPaidDetails();
    const emiProgressCore = installmentPaid.emiProgress.replace(/\s+EMI Completed$/i, '').trim();
    const expectedProgress = expectAllPaid ? `${emiCount}/${emiCount}` : `1/${emiCount}`;
    shopLogGet('Installment Paid dialog', installmentPaid);
    if (expectAllPaid) {
      shopLogActualExpected('EMI progress (all paid)', emiProgressCore, expectedProgress);
    } else {
      shopLogActualExpected('Success message', /successfully paid your installment/i.test(installmentPaid.message), true);
      shopLogActualExpected('EMI progress', emiProgressCore, expectedProgress);
    }
    if (expectAllPaid) {
      expect(emiProgressCore).toBe(expectedProgress);
    } else {
      expect(installmentPaid.message).toMatch(/successfully paid your installment/i);
      expect(emiProgressCore).toBe(expectedProgress);
    }
  }

  /** TC008 / TC010 — Pay Now entry through foreclose payment. */
  async forecloseEmiOrder(
    myOrderVerificationPage: MyOrderVerificationPage,
    paymentPage: PaymentPage,
    params: {
      orderId: string;
      productName: string;
      mobile: string;
      purchaseChain?: ShopEmiPurchaseChainState;
    }) {
    await myOrderVerificationPage.clickPayNowOnShopEmiOrderByOrderId(params.orderId, {
      productName: params.productName,
    });

    const payNowDetails = await this.capturePayNowDetails();

    if (params.purchaseChain) {
      this.savePayNowDetailsToPurchaseChain(params.purchaseChain, payNowDetails);
    }

    await this.openForecloseAndValidateSummary(payNowDetails);

    await this.verifyInitialInstallmentStateWithLog(payNowDetails);

    const foreclosePayable = payNowDetails.amountRemaining;

    await this.selectAllInstallmentsAndValidateNetPayable(foreclosePayable);

    const payButtonAmount = await this.selectNetbankingAndPay();

    await this.completeForecloseRazorpayPaymentWithLog(
      paymentPage,
      params.mobile,
      payButtonAmount);

    await this.verifyInstallmentPaidDialog(payNowDetails.emiTenure, true);

    await this.dismissInstallmentPaidDialog();

    return {
      payNowDetails,
      foreclosePayable,
      payButtonAmount,
    };
  }

  /** TC008 — Pay Now, first EMI installment only, netbanking. */
  async payFirstEmiInstallment(
    myOrderVerificationPage: MyOrderVerificationPage,
    paymentPage: PaymentPage,
    params: {
      orderId: string;
      productName: string;
      mobile: string;
      purchaseChain?: ShopEmiPurchaseChainState;
    }) {
    await myOrderVerificationPage.clickPayNowOnShopEmiOrderByOrderId(params.orderId, {
      productName: params.productName,
    });

    const payNowDetails = await this.capturePayNowDetails();

    if (params.purchaseChain) {
      this.savePayNowDetailsToPurchaseChain(params.purchaseChain, payNowDetails);
    }

    await this.openForecloseAndValidateSummary(payNowDetails);

    const installmentAmounts = await this.verifyInitialInstallmentStateWithLog(payNowDetails);

    const foreclosePayable = await this.selectFirstInstallmentAndValidateNetPayable(installmentAmounts);

    const payButtonAmount = await this.selectNetbankingAndPay();

    await this.completeForecloseRazorpayPaymentWithLog(
      paymentPage,
      params.mobile,
      payButtonAmount);

    await this.verifyInstallmentPaidDialog(payNowDetails.emiTenure);

    await this.dismissInstallmentPaidDialog();

    return {
      payNowDetails,
      foreclosePayable,
      payButtonAmount,
    };
  }

  /** TC_SHOP_009 — click Cancel Booking on the open EMI summary panel. */
  async cancelEmiBooking(): Promise<void> {
    await this.waitForEmiSummaryPanel();
    await this.emiSummaryPanel().getByRole('button', { name: /cancel booking/i }).click();

    shopLogGet('Cancel Booking', 'clicked');
  }
}
