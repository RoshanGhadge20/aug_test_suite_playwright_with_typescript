import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';

/**
 * Port of Java: PO47_ZAHReview (locators) + Flow68_ValidateZAHReview.
 *
 * Omitted loginWith* calls:
 *   - Flow68_ValidateZAHReview.validateZahReview() had commented-out loginWithAppraiser() block — OMITTED.
 *     Role switching must be handled by the caller via loginAs(role).
 */
export class ZahReviewPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO47_ZAHReview) ───────────────────────────────────────

  private readonly dashboard = () => this.page.locator("xpath=//button[@id='kt_aside_mobile_toggler']");

  private readonly btnAdvanceApproval = () => this.page.locator("xpath=//span[normalize-space()='Advance Approval']");

  private readonly selStatus = () => this.page.locator("xpath=(//select[option[normalize-space(text())='Select Status']])[1]");

  private readonly btnSubmit = () => this.page.locator("xpath=(//button[contains(.,'Submit')])[1]");

  private readonly enterReason = () => this.page.locator("xpath=//textarea[@placeholder='Enter Reason']");

  private readonly btnAdd = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");

  private readonly btnYes = () => this.page.locator("xpath=//span[contains(.,'Yes')]");

  // ── Actions (from Flow68_ValidateZAHReview) ───────────────────────────────

  /**
   * Port of Flow68_ValidateZAHReview.validateZahReview().
   * Navigates to Funds and Approvals → Advance Approval, scrolls table, approves.
   *
   * NOTE: loginWithAppraiser() was commented out in the Java source — OMITTED.
   */
  async validateZahReview(): Promise<void> {
    await this.page.waitForTimeout(3000);

    await this.page.waitForTimeout(5000);
    const element = this.page.locator("xpath=//span[normalize-space()='Funds and Approvals']");
    await element.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element.click();

    await this.btnAdvanceApproval().click();
    await this.page.waitForTimeout(2000);

    const scrollDiv = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);

    await scrollDiv.click();
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(3000);

    await this.selStatus().selectOption({ label: 'Approved' });
    await this.page.waitForTimeout(2000);

    const submitEl = this.btnSubmit();
    await this.page.waitForTimeout(2000);
    await submitEl.evaluate((el: any) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await this.page.waitForTimeout(2000);
    await submitEl.click();

    await this.enterReason().fill('Approved');
    await this.btnAdd().click();
    await this.btnYes().click();
  }
}
