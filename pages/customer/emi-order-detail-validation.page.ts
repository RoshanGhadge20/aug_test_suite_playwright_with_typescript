import { expect, Locator, Page } from '@playwright/test';
import { ShopEmiPage } from './shop-emi.page';
import { shopLogActualExpected, shopLogGet } from '../../utils/test/shop-log';
import { BasePage } from '../shared/base.page';

export type EmiInstallmentDetail = {
  monthLabel: string;
  emiAmount: number;
  emiAmountText: string;
  dueDate: string;
  detailLine: string;
  status: string;
};

export type MyEmisSummary = {
  completedCount: number;
  totalCount: number;
  completedLabel: string;
  pendingCount: number;
  pendingLabel: string;
};

export type EmiOrderDetailValidationDetails = {
  summary: MyEmisSummary;
  installments: EmiInstallmentDetail[];
};

/**
 * My EMIs block on shop EMI order detail (`/shop-new/order/...`).
 */
export class EmiOrderDetailValidationPage extends BasePage {
  private readonly installmentCards: Locator;

  constructor(page: Page) {
    super(page);
    this.installmentCards = page
      .locator('div.rounded-lg')
      .filter({ has: page.getByRole('heading', { level: 3 }) })
      .filter({ has: page.getByText(/EMI amount\s*₹|Paid\s*₹/i) });
  }

  async waitForMyEmisSection(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: 'My EMIs', exact: true }).first();
    await heading.waitFor({ state: 'visible', timeout: 15_000 });
    await heading.scrollIntoViewIfNeeded();
    await this.page.getByText(/\d+\/\d+\s+EMI Completed/i).first().waitFor({ state: 'visible' });
  }

  async ensureMyEmisAccordionExpanded(): Promise<void> {
    if (await this.installmentCards.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
      return;
    }

    // PrimeNG renamed AccordionTab's markup: `p-accordiontab` -> `p-accordion-panel`,
    // and the `a.p-accordion-header-link` anchor was dropped in favor of the
    // `<p-accordion-header>` element itself being the clickable toggle.
    const accordionLink = this.page
      .locator('p-accordion-panel')
      .filter({
        has: this.page.getByRole('heading', { name: 'My EMIs', exact: true }),
      })
      .locator('p-accordion-header')
      .first();

    if (await accordionLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const expanded = await accordionLink.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await accordionLink.click();
      }
    } else {
      const accordionBtn = this.page
        .getByRole('button', { name: /My EMIs.*paid.*pending.*upcoming/i })
        .first();
      if (await accordionBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        if ((await accordionBtn.getAttribute('aria-expanded')) !== 'true') {
          await accordionBtn.click();
        }
      }
    }

    await this.installmentCards.first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  async getMyEmisSummary(): Promise<MyEmisSummary> {
    const completedText = await this.readText(this.page.getByText(/\d+\/\d+\s+EMI Completed/i).first());
    const completedMatch = completedText.match(/(\d+)\s*\/\s*(\d+)\s+EMI Completed/i);

    let pendingCount = 0;
    let pendingLabel = '';
    const pendingEl = this.page.getByText(/\d+\s+pending EMI/i).first();
    if (await pendingEl.isVisible({ timeout: 2_000 }).catch(() => false)) {
      pendingLabel = await this.readText(pendingEl);
      pendingCount = Number(pendingLabel.match(/(\d+)\s+pending EMI/i)?.[1] ?? 0);
    }

    return {
      completedCount: Number(completedMatch?.[1] ?? 0),
      totalCount: Number(completedMatch?.[2] ?? 0),
      completedLabel: completedText,
      pendingCount,
      pendingLabel,
    };
  }

  async getEmiInstallments(): Promise<EmiInstallmentDetail[]> {
    const count = await this.installmentCards.count();
    const installments: EmiInstallmentDetail[] = [];

    for (let i = 0; i < count; i += 1) {
      const card = this.installmentCards.nth(i);
      const cardText = ((await card.innerText()) ?? '').replace(/\s+/g, ' ').trim();
      const monthLabel = (await this.readText(card.getByRole('heading', { level: 3 }))).trim();
      const detailLine = await this.readText(card.getByText(/EMI amount\s*₹|Paid\s*₹/i).first());
      const pendingMatch = detailLine.match(/EMI amount\s*₹([\d,.]+)\s*\|\s*Due Date:\s*(.+)/i);
      const paidMatch = detailLine.match(/Paid\s*₹([\d,.]+)\s+on\s+(.+)/i);
      const amountRaw = paidMatch?.[1] ?? pendingMatch?.[1] ?? '';

      installments.push({
        monthLabel,
        emiAmount: this.parseAmount(amountRaw),
        emiAmountText: amountRaw ? `₹${amountRaw}` : detailLine,
        dueDate: (paidMatch?.[2] ?? pendingMatch?.[2] ?? '').trim(),
        detailLine,
        status: paidMatch ? 'Paid' : this.parseInstallmentStatus(cardText),
      });
    }

    return installments;
  }

  async getAllDetails(): Promise<EmiOrderDetailValidationDetails> {
    await this.waitForMyEmisSection();
    await this.ensureMyEmisAccordionExpanded();
    return {
      summary: await this.getMyEmisSummary(),
      installments: await this.getEmiInstallments(),
    };
  }

  /** TC_SHOP_007 / TC_SHOP_010 — all installments Pending after EMI purchase. */
  async validateAllInstallmentsPending(
    expectedCount: number,
    expectedInstallmentAmounts: number[] = [],
  ): Promise<EmiOrderDetailValidationDetails> {
    const myEmis = await this.getAllDetails();
    shopLogGet('My EMIs (pending)', myEmis.summary);
    expect(myEmis.summary.completedCount).toBe(0);
    expect(myEmis.summary.totalCount).toBe(expectedCount);
    expect(myEmis.summary.pendingCount).toBe(expectedCount);
    expect(myEmis.installments).toHaveLength(expectedCount);
    for (let i = 0; i < myEmis.installments.length; i += 1) {
      const installment = myEmis.installments[i];
      expect(installment.monthLabel.length).toBeGreaterThan(0);
      expect(installment.dueDate).toMatch(/\d{4}/);
      expect(installment.detailLine).toMatch(/EMI amount\s*₹/i);
      if (expectedInstallmentAmounts[i] != null) {
        expect(Math.abs(installment.emiAmount - expectedInstallmentAmounts[i])).toBeLessThanOrEqual(0.02);
      }
    }
    return myEmis;
  }

  /** TC_SHOP_008 — first EMI paid, remaining pending. */
  async validateFirstEmiPaidRemainingPending(params: {
    emiTenure: string;
  }): Promise<EmiOrderDetailValidationDetails> {
    const emiCount = ShopEmiPage.parseInstallmentCount(params.emiTenure);
    const myEmis = await this.getAllDetails();
    shopLogActualExpected('Completed count', myEmis.summary.completedCount, 1);
    shopLogActualExpected('Pending count', myEmis.summary.pendingCount, emiCount - 1);
    expect(myEmis.summary.completedCount).toBe(1);
    expect(myEmis.summary.pendingCount).toBe(emiCount - 1);
    return myEmis;
  }

  /** TC_SHOP_011 — all EMIs paid after full foreclose. */
  async validateAllEmisPaid(params: {
    emiTenure: string;
  }): Promise<EmiOrderDetailValidationDetails> {
    const emiCount = ShopEmiPage.parseInstallmentCount(params.emiTenure);
    const myEmis = await this.getAllDetails();
    shopLogActualExpected('Completed count', myEmis.summary.completedCount, emiCount);
    shopLogActualExpected('Pending count', myEmis.summary.pendingCount, 0);
    expect(myEmis.summary.completedCount).toBe(emiCount);
    expect(myEmis.summary.pendingCount).toBe(0);
    return myEmis;
  }

  private parseInstallmentStatus(cardText: string): string {
    if (/\bPaid\b/i.test(cardText)) {
      return 'Paid';
    }
    if (/\bPending\b/i.test(cardText)) {
      return 'Pending';
    }
    return '';
  }

  private async readText(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }
}
