import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

/**
 * `/request-statement` — request a downloadable account statement for a financial year.
 * Confirmed live (UAT): "Financial Year" and "Report Format" are PrimeNG `p-dropdown`s exposing
 * role=combobox (accessible name = current value/placeholder, e.g. "2025-2026" /
 * "Select Report Format"), each opening a `.p-dropdown-panel` listbox of `role=option`s.
 * "E-Mail" is an editable `role=textbox` pre-filled with the account's email — read via
 * `.inputValue()`, not `.textContent()`.
 */
export class AccountStatementPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly generateButton: Locator;
  private readonly reportReceivedDialog: Locator;
  private readonly dialogCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    // Accessible name includes a leading icon glyph (confirmed live: " Generate"), so match
    // loosely rather than anchoring the whole string.
    this.generateButton = page.getByRole('button', { name: /generate/i });
    // Live dialog title is actually misspelled "Report Request Recieved" (confirmed live) —
    // match loosely on "report request" so this doesn't break if that typo gets fixed.
    this.reportReceivedDialog = page.getByRole('dialog').filter({ hasText: /report request/i });
    // Same pattern as SellOldGoldInquiryPage's dialog close: scope to the text button, not the
    // header X icon (which also exposes aria-label="Close" with no visible text).
    this.dialogCloseButton = page.locator('.p-dialog').getByText('Close', { exact: true });
  }

  async open(): Promise<void> {
    await this.goto('/request-statement');
    await this.waitForUrl(/\/request-statement/i);
  }

  /**
   * One `role=combobox` per p-dropdown widget (confirmed live) — unlike a CSS class selector,
   * this can't double-count a single widget's outer `<p-dropdown>` tag plus its inner
   * `.p-dropdown` wrapper div as two separate "dropdowns".
   */
  private comboboxes(): Locator {
    return this.page.getByRole('combobox');
  }

  /** First combobox on the page, per the given step order. */
  private financialYearCombobox(): Locator {
    return this.comboboxes().nth(0);
  }

  /** Second combobox on the page, per the given step order. */
  private reportFormatCombobox(): Locator {
    return this.comboboxes().nth(1);
  }

  /** PrimeNG renamed the Dropdown overlay `.p-dropdown-panel` to `.p-select-overlay`; match either. */
  private dropdownPanels(): Locator {
    return this.page.locator('.p-select-overlay, .p-dropdown-panel');
  }

  private async closeAnyOpenDropdownPanel(): Promise<void> {
    const openPanel = this.dropdownPanels().first();
    if (await openPanel.isVisible({ timeout: 500 }).catch(() => false)) {
      await this.page.keyboard.press('Escape');
      await openPanel.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    }
  }

  private async openDropdownPanel(combobox: Locator): Promise<Locator> {
    // A prior dropdown left open (e.g. its panel not fully closing after selection) can absorb
    // the next click via its overlay — confirmed live cause of a mis-click on the wrong widget.
    await this.closeAnyOpenDropdownPanel();
    await combobox.scrollIntoViewIfNeeded();
    await combobox.click();
    const panel = this.dropdownPanels().last();
    await panel.waitFor({ state: 'visible', timeout: 10_000 });
    return panel;
  }

  /**
   * Opens the Financial Year dropdown and picks whichever option's leading 4-digit year is
   * highest — doesn't assume the panel already lists them in latest-first order.
   */
  async selectLatestFinancialYear(): Promise<string> {
    const panel = await this.openDropdownPanel(this.financialYearCombobox());
    const options = panel.getByRole('option');
    const count = await options.count();

    let latestLabel = '';
    let latestYear = -Infinity;
    for (let i = 0; i < count; i++) {
      const label = ((await options.nth(i).textContent()) ?? '').trim();
      const year = Number(label.match(/\d{4}/)?.[0] ?? NaN);
      if (!Number.isNaN(year) && year > latestYear) {
        latestYear = year;
        latestLabel = label;
      }
    }
    if (!latestLabel) {
      throw new Error('No financial-year options with a parseable year were found in the dropdown panel.');
    }

    await panel.getByRole('option', { name: latestLabel, exact: true }).click();
    return latestLabel;
  }

  async selectReportFormat(format: string): Promise<void> {
    const panel = await this.openDropdownPanel(this.reportFormatCombobox());
    const pattern = new RegExp(`^${format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    await panel.getByRole('option', { name: pattern }).click();
  }

  /** E-Mail is a pre-filled editable textbox (confirmed live) — read via `.inputValue()`. */
  async getDisplayedEmail(): Promise<string> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 10_000 });
    return (await this.emailInput.inputValue()).trim();
  }

  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  async getReportRequestReceivedMessage(): Promise<string> {
    await this.reportReceivedDialog.waitFor({ state: 'visible', timeout: 15_000 });
    return ((await this.reportReceivedDialog.textContent()) ?? '').trim();
  }

  async closeReportRequestReceivedDialog(): Promise<void> {
    await this.dialogCloseButton.click();
  }
}
