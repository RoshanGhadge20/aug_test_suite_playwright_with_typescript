import { expect, Locator, Page } from '@playwright/test';
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
  private readonly payButton: Locator;
  private readonly addedToCartToast: Locator;
  private readonly detailsCard: Locator;

  constructor(page: Page) {
    super(page);
    this.payButton = page.getByRole('button', { name: /^Pay ₹/i }).first();
    this.addedToCartToast = page.getByText(/Product added to the cart/i);
    this.detailsCard = page.locator('div.border.border-gray-300.rounded-lg').filter({ hasText: 'Payable Amount' });
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

  expectPayButtonMatchesInitialPayment(details: ShopEmiDetails): void {
    expect(details.payButtonAmount).toBe(this.expectedPayAmount(details));
  }

  async payAndAddToCart(): Promise<void> {
    await this.payButton.click();
    await this.addedToCartToast.waitFor({ state: 'visible', timeout: 20_000 });
  }

  private async readRow(label: string): Promise<string> {
    const row = this.detailsCard.locator('div.flex.justify-between', { hasText: label });
    return ((await row.locator('span.text-gray-900').last().textContent()) ?? '').trim();
  }

  private async readCardText(selector: string): Promise<string> {
    return ((await this.detailsCard.locator(selector).first().textContent()) ?? '').trim();
  }
}
