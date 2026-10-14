import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import { shopLogActualExpected, shopLogGet } from '../../utils/test/shop-log';

const CANCELLATION_CHARGE_RATE = 0.02;
const GST_MULTIPLIER = 1.18;

/** Top-level summary grid shown before expanding the accordion (D, C, refund). */
export type CancellationSummaryOverview = {
  totalAmountPaidTillDateD: number;
  totalChargesDebitedIncGstC: number;
  totalRefundableAmount: number;
};

/** Expanded refundable breakdown after opening the accordion (AT-1642 / TC_SHOP_009). */
export type CancellationRefundableBreakdown = {
  productPriceOnBookingDate: number;
  productPriceOnCancellationDate: number;
  differencePayableA: number;
  cancellationChargesB: number;
  totalChargesDebitedAB: number;
  totalChargesDebitedIncGstC: number;
  totalAmountPaidTillDateD: number;
  totalRefundableAmount: number;
};

/**
 * Shop EMI cancellation summary shown after Cancel Booking (AT-1642).
 */
export class CancellationSummaryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private refundableAmountAccordionHeader(): Locator {
    return this.page
      .locator('#amount_header_action')
      .or(this.page.getByRole('button', { name: /Total Refundable Amount/i }))
      .first();
  }

  private breakdownPanel(): Locator {
    return this.page.getByRole('region', { name: /Total Refundable Amount/i });
  }

  /** Collapsed summary grid above the accordion (D, C, refundable). */
  private summaryOverviewGrid(): Locator {
    return this.page
      .locator('div.grid.grid-cols-2.gap-5')
      .filter({ has: this.page.getByText(/Total Amount Paid till Date\(D\)/i) })
      .filter({ has: this.page.getByText(/Total Refundable Amount \(D-C\)/i) })
      .first();
  }

  async waitForCancellationSummary(): Promise<void> {
    await expect(this.page.getByText('Cancellation Summary')).toBeVisible({ timeout: 20_000 });
    const header = this.refundableAmountAccordionHeader();
    await expect(header.getByText(/Total Refundable Amount/i)).toBeVisible();
  }

  /** Click Total Refundable Amount accordion to show the calculation grid. */
  async expandRefundableAmountDetails(): Promise<void> {
    await this.waitForCancellationSummary();
    const header = this.refundableAmountAccordionHeader();
    const expanded = (await header.getAttribute('aria-expanded')) === 'true';
    if (!expanded) {
      await header.click();
    }
    await expect(header).toHaveAttribute('aria-expanded', 'true');
  }

  /** Read D, C, and refundable from the collapsed summary grid (before accordion expand). */
  async getSummaryOverview(): Promise<CancellationSummaryOverview> {
    await this.waitForCancellationSummary();
    const grid = this.summaryOverviewGrid();
    const overview = {
      totalAmountPaidTillDateD: await this.readColSpanGridAmount(
        grid,
        /Total Amount Paid till Date\(D\)/i,
      ),
      totalChargesDebitedIncGstC: await this.readColSpanGridAmount(
        grid,
        /Total Charges Debited \(Inc 18% GST\)\(C\)/i,
      ),
      totalRefundableAmount: await this.readColSpanGridAmount(
        grid,
        /Total Refundable Amount \(D-C\)/i,
      ),
    };

    shopLogGet('Total Amount Paid till Date (D)', overview.totalAmountPaidTillDateD);
    shopLogGet('Total Charges Debited inc GST (C)', overview.totalChargesDebitedIncGstC);
    shopLogGet('Total Refundable Amount (D-C)', overview.totalRefundableAmount);

    return overview;
  }

  /** Read all rows from the expanded refundable breakdown grid. */
  async getRefundableAmountBreakdown(
    overview?: CancellationSummaryOverview,
  ): Promise<CancellationRefundableBreakdown> {
    await this.expandRefundableAmountDetails();
    const panel = this.breakdownPanel();

    return {
      productPriceOnBookingDate: await this.readGridAmount(panel, 'Product Price on Booking Date'),
      productPriceOnCancellationDate: await this.readGridAmount(
        panel,
        'Product Price on Cancellation Date',
      ),
      differencePayableA: await this.readGridAmount(panel, 'Difference Payable (A)'),
      cancellationChargesB: await this.readGridAmount(
        panel,
        /Cancellation Charges\(2% of Price on Booking Date\)\(B\)/i,
      ),
      totalChargesDebitedAB: await this.readGridAmount(panel, 'Total Charges Debited(A)+(B)'),
      totalChargesDebitedIncGstC:
        overview?.totalChargesDebitedIncGstC ??
        (await this.readGridAmount(panel, /Total Charges Debited\(Inc 18% GST\)\(C\)/i)),
      totalAmountPaidTillDateD:
        overview?.totalAmountPaidTillDateD ??
        (await this.readGridAmount(panel, /Total Amount Paid till Date/i)),
      totalRefundableAmount:
        overview?.totalRefundableAmount ??
        (await this.readGridAmount(panel, /Total Refundable Amount\(D-C\)/i)),
    };
  }

  /** Read cancellation summary from screen and print each amount. */
  async getCancellationSummary(): Promise<CancellationRefundableBreakdown> {
    const overview = await this.getSummaryOverview();
    const summary = await this.getRefundableAmountBreakdown(overview);

    shopLogGet('Product Price on Booking Date', summary.productPriceOnBookingDate);
    shopLogGet('Product Price on Cancellation Date', summary.productPriceOnCancellationDate);
    shopLogGet('Difference Payable (A)', summary.differencePayableA);
    shopLogGet('Cancellation Charges (B)', summary.cancellationChargesB);
    shopLogGet('Total Charges Debited (A+B)', summary.totalChargesDebitedAB);

    return summary;
  }

  /**
   * TC_SHOP_009 — check refund math (pass `summary` if already read by {@link getCancellationSummary}).
   */
  async validateRefundableAmountBreakdown(params?: {
    summary?: CancellationRefundableBreakdown;
  }): Promise<CancellationRefundableBreakdown> {
    const screen = params?.summary ?? (await this.getRefundableAmountBreakdown());
    const expected = this.calculateExpectedAmounts(screen);

    this.assertRefundLine('A — Difference Payable', screen.differencePayableA, expected.differenceA);
    this.assertRefundLine('B — Cancellation Charges (2%)', screen.cancellationChargesB, expected.cancellationB);
    this.assertRefundLine('A+B — Charges before GST', screen.totalChargesDebitedAB, expected.chargesAB);
    this.assertRefundLine('C — Charges with GST', screen.totalChargesDebitedIncGstC, expected.chargesC);
    this.assertRefundLine('Refund = D − C', screen.totalRefundableAmount, expected.refundable);

    return screen;
  }

  /** Expected amounts from the cancellation refund formulas. */
  private calculateExpectedAmounts(screen: CancellationRefundableBreakdown) {
    const differenceA = screen.productPriceOnBookingDate - screen.productPriceOnCancellationDate;
    const cancellationB = screen.productPriceOnBookingDate * CANCELLATION_CHARGE_RATE;
    const chargesAB = differenceA + cancellationB;
    const chargesC = chargesAB * GST_MULTIPLIER;
    const refundable = screen.totalAmountPaidTillDateD - chargesC;

    return { differenceA, cancellationB, chargesAB, chargesC, refundable };
  }

  private assertRefundLine(label: string, actual: number, expected: number): void {
    shopLogActualExpected(label, actual, expected);
    expect(actual, label).toBeCloseTo(expected, 2);
  }

  private async readGridAmount(panel: Locator, label: string | RegExp): Promise<number> {
    const labelEl =
      typeof label === 'string'
        ? panel.getByText(label, { exact: true })
        : panel.getByText(label).first();
    await labelEl.waitFor({ state: 'visible', timeout: 10_000 });
    const valueEl = labelEl.locator('xpath=../following-sibling::*[1]');
    await valueEl.waitFor({ state: 'visible', timeout: 10_000 });
    return Math.abs(this.parseAmount((await valueEl.innerText()).trim()));
  }

  /** Label/value pairs are sibling `col-span-1` columns in the overview grid. */
  private async readColSpanGridAmount(grid: Locator, label: string | RegExp): Promise<number> {
    const labelEl =
      typeof label === 'string' ? grid.getByText(label) : grid.getByText(label).first();
    await labelEl.waitFor({ state: 'visible', timeout: 10_000 });
    const valueEl = labelEl.locator(
      'xpath=ancestor::div[contains(@class,"col-span-1")][1]/following-sibling::div[contains(@class,"text-end")][1]',
    );
    await valueEl.waitFor({ state: 'visible', timeout: 10_000 });
    return Math.abs(this.parseAmount((await valueEl.innerText()).trim()));
  }
}
