import { expect, Locator, Page } from '@playwright/test';
import { shopLogActualExpected, shopLogGet } from '../../utils/test/shop-log';
import { BasePage } from '../shared/base.page';

export type ShopEmiDetails = {
  summaryLine: string;
  payableAmount: string;
  initialPayment: string;
  emiScheme: string;
  emiPerMonth: string;
  netPayable: string;
  payButtonAmount: number;
};

export class ShopEmiPage extends BasePage {
  /** EMI tenure labels on shop PDP (e.g. `3 Months`, `9 Months`). */
  static readonly planTenures = {
    THREE_MONTHS: '3 Months',
    SIX_MONTHS: '6 Months',
    NINE_MONTHS: '9 Months',
  } as const;

  private readonly payButton: Locator;
  private readonly addedToCartToast: Locator;
  private readonly detailsCard: Locator;

  constructor(page: Page) {
    super(page);
    this.payButton = page.getByRole('button', { name: /^Pay ₹/i }).first();
    this.addedToCartToast = page.getByText(/Product added to the cart/i);
    this.detailsCard = page.locator('div.border.border-gray-300.rounded-lg').filter({ hasText: 'Payable Amount' });
  }

  /** Number of installments from tenure string (`3 Months` → 3, `9 Months` → 9). */
  static parseInstallmentCount(emiPlanTenure: string): number {
    const count = Number(emiPlanTenure.match(/(\d+)/)?.[1] ?? 0);
    if (count < 1) {
      throw new Error(`Cannot parse EMI installment count from tenure: "${emiPlanTenure}"`);
    }
    return count;
  }

  /**
   * My Orders EMI list shows every installment at the per-month amount (paise kept); only the
   * last absorbs the rounding remainder, e.g. 9 months → eight × ₹169.84, last ₹169.82.
   * The last entry is therefore approximate — see `validateAllInstallmentsPending` tolerance.
   */
  static expectedInstallmentAmounts(emiPerMonth: number, installmentCount: number): number[] {
    if (installmentCount < 1) {
      throw new Error(`installmentCount must be >= 1, got ${installmentCount}`);
    }
    const perMonth = ShopEmiPage.roundMoney(emiPerMonth);
    return Array.from({ length: installmentCount }, () => perMonth);
  }

  static expectedInstallmentAmountsForTenure(emiPerMonth: number, emiPlanTenure: string): number[] {
    return ShopEmiPage.expectedInstallmentAmounts(
      emiPerMonth,
      ShopEmiPage.parseInstallmentCount(emiPlanTenure),
    );
  }

  private static roundMoney(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  async waitForScreen(): Promise<void> {
    await Promise.race([
      this.page.getByRole('heading', { name: 'Choose your EMI plan' }).waitFor({ state: 'visible', timeout: 30_000 }),
      this.page.getByRole('heading', { name: 'EMI Details' }).waitFor({ state: 'visible', timeout: 30_000 }),
      this.payButton.waitFor({ state: 'visible', timeout: 30_000 }),
    ]);
  }

  async selectPlan(tenure: string): Promise<void> {
    await this.waitForScreen();
    // Tenure options are the app's own `<button class="aug-select-option">` with the
    // label as direct text — never a PrimeNG `span.p-button-label`. The first click can
    // land before Angular finishes wiring the handler (button visible but not yet
    // interactive), silently doing nothing — verify the `aug-active` class actually
    // applied and retry if not.
    const option = this.page.getByRole('button', { name: tenure, exact: true });
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await option.click();
      const className = await option.getAttribute('class').catch(() => null);
      if (/\baug-active\b/.test(className ?? '')) {
        return;
      }
      await this.page.waitForTimeout(500);
    }
    throw new Error(`[Shop EMI] "${tenure}" plan did not become active after 3 click attempts.`);
  }

  async getDetails(): Promise<ShopEmiDetails> {
    await this.waitForScreen();
    await this.detailsCard.waitFor({ state: 'visible', timeout: 15_000 });

    const payButtonText = ((await this.payButton.innerText()) ?? '').trim();
    const payAmountMatch = payButtonText.match(/₹[\d,.]+/);

    return {
      summaryLine: await this.readCardText('.bg-amber-50 p.text-sheengold-liver'),
      payableAmount: await this.readRow('Payable Amount'),
      initialPayment: await this.readRow('Initial Payment'),
      emiScheme: await this.readRow('EMI Scheme'),
      emiPerMonth: await this.readRow('EMI Amount per month'),
      netPayable: await this.readRow('Net Payable Amount'),
      payButtonAmount: payAmountMatch ? this.parseAmount(payAmountMatch[0]) : 0,
    };
  }

  expectedPayAmount(details: ShopEmiDetails): number {
    return this.parseAmount(details.initialPayment);
  }

  expectedNetPayableAmount(details: ShopEmiDetails): number {
    return this.parseAmount(details.netPayable);
  }

  expectedEmiPerMonthAmount(details: ShopEmiDetails): number {
    return this.parseAmount(details.emiPerMonth);
  }

  static emiPerMonthAmount(details: ShopEmiDetails): number {
    return Number(details.emiPerMonth.replace(/[₹,\s]/g, '')) || 0;
  }

  expectPayButtonMatchesInitialPayment(details: ShopEmiDetails): void {
    expect(details.payButtonAmount).toBe(this.expectedPayAmount(details));
  }

  async payAndAddToCart(): Promise<void> {
    // The Pay button briefly re-renders with "Pay ₹null" while the amount recalculates —
    // wait for a real digit amount so the click doesn't land during that reset.
    await expect(this.payButton).toHaveText(/^Pay ₹[\d,]/, { timeout: 15_000 });
    await this.payButton.click();
    await this.addedToCartToast.waitFor({ state: 'visible', timeout: 20_000 });
  }

  /** TC_SHOP_007 / TC_SHOP_010 — select EMI plan, validate Pay amount, add to cart. */
  async addProductViaEmiPlan(
    tenure: string,
  ): Promise<{
    emi: ShopEmiDetails;
    emiLinePrice: number;
    emiInitialPayment: number;
  }> {
    await this.selectPlan(tenure);
    const emi = await this.getDetails();
    this.expectPayButtonMatchesInitialPayment(emi);
    const emiLinePrice = this.expectedNetPayableAmount(emi);
    const emiInitialPayment = this.expectedPayAmount(emi);
    shopLogGet('EMI plan details', emi);
    shopLogActualExpected('EMI scheme', emi.emiScheme, tenure);
    shopLogActualExpected('Net payable (line price)', emiLinePrice, emiLinePrice);
    shopLogActualExpected('Initial payment', emiInitialPayment, emiInitialPayment);
    await this.payAndAddToCart();
    return { emi, emiLinePrice, emiInitialPayment };
  }

  private async readRow(label: string): Promise<string> {
    const row = this.detailsCard.locator('div.flex.justify-between', { hasText: label });
    return ((await row.locator('span.text-gray-900').last().textContent()) ?? '').trim();
  }

  private async readCardText(selector: string): Promise<string> {
    return ((await this.detailsCard.locator(selector).first().textContent()) ?? '').trim();
  }
}
