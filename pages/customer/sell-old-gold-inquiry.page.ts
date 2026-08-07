import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class SellOldGoldInquiryPage extends BasePage {
  private readonly fullNameInput: Locator;
  private readonly goldGramsInput: Locator;
  // Rendered as a plain <span> (not a real <button>), just below the fold on this form —
  // confirmed live: normal actionability-aware click times out, force is required.
  private readonly submitControl: Locator;
  private readonly dialogContent: Locator;
  private readonly dialogCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.fullNameInput = page.locator('#fullName');
    this.goldGramsInput = page.locator('#integeronly');
    this.submitControl = page.getByText('Submit', { exact: true });
    this.dialogContent = page.locator('.p-dialog-content').first();
    // The header X icon also exposes aria-label="Close" with no text content — scope to
    // getByText so this only matches the visible "Close" text button in the dialog body.
    this.dialogCloseButton = page.locator('.p-dialog').getByText('Close', { exact: true });
  }

  async open(): Promise<void> {
    await this.goto('/sell-old-gold');
    await this.goldGramsInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Pre-filled + disabled for an existing customer with a saved profile name; empty and
   * editable for a freshly registered customer (no name on file yet) — fill it only then.
   */
  async fillNameIfEditable(name: string): Promise<void> {
    if (!(await this.fullNameInput.isDisabled())) {
      await this.fullNameInput.fill(name);
    }
  }

  /** Mobile is always pre-filled from the logged-in session and disabled. */
  async fillGoldGrams(grams: number | string): Promise<void> {
    await this.goldGramsInput.fill(String(grams));
  }

  async clickSubmit(): Promise<void> {
    await this.submitControl.click({ force: true });
  }

  async submitEnquiry(details: { goldGrams: number | string; name?: string }): Promise<void> {
    await this.fillNameIfEditable(details.name ?? 'Automation Test User');
    await this.fillGoldGrams(details.goldGrams);
    await this.clickSubmit();
  }

  successMessageLocator(): Locator {
    return this.dialogContent;
  }

  async closeSuccessDialog(): Promise<void> {
    await this.dialogCloseButton.click();
  }
}
