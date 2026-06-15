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
   * My Orders EMI list truncates decimals on early installments; remainder rolls into the last.
   * e.g. ₹150.91 × 9 → eight × ₹150, last ₹158.19 (150 + 9×0.91).
   */
  static expectedInstallmentAmounts(emiPerMonth: number, installmentCount: number): number[] {
    if (installmentCount < 1) {
      throw new Error(`installmentCount must be >= 1, got ${installmentCount}`);
    }
    const perMonth = ShopEmiPage.roundMoney(emiPerMonth);
    const fractionalPart = perMonth - Math.floor(perMonth);
    if (fractionalPart < 0.001) {
      return Array.from({ length: installmentCount }, () => perMonth);
    }
    const base = Math.floor(perMonth);
    const last = ShopEmiPage.roundMoney(perMonth * installmentCount - base * (installmentCount - 1));
    return [...Array.from({ length: installmentCount - 1 }, () => base), last];
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
    await this.page.locator('span.p-button-label', { hasText: tenure }).click();
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
