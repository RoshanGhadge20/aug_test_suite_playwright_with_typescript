import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO44_EditAndViewLoanDefects (locators) + Flow66_ValidateEditAndViewLoanDefects (actions)
 *
 * Methods ported:
 *   - validatAddLoanDefects()   ← Flow66.validatAddLoanDefects() (commented in TC05 — ported)
 *   - validateEditLoanDefect()  ← Flow66.validateEditLoanDefect() (called by TC05 priority=10)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, AdminSetting, Masters re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - OMITTED. Role = admin.
 */
export class LoanDefectsPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO44_EditAndViewLoanDefects) ───────────────────────────

  private readonly loanDefects = () => this.page.locator("xpath=//span[normalize-space()='Loan Defects']");
  private readonly btnEdit = () => this.page.locator("xpath=(//span[@class='kt-pointer text-primary ng-star-inserted'][normalize-space()='Edit'])[1]");
  private readonly addErrorMessage = () => this.page.locator("xpath=//i[contains(.,' Add New Error Message ')]");
  private readonly enterErrorMessage = () => this.page.locator("xpath=//input[@placeholder='Enter issue']");
  private readonly btnUpdate = () => this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly btnEditMeassge = () => this.page.locator("xpath=(//img[@alt='Edit'])[13]");
  private readonly enterEditErrorMessage = () => this.page.locator("xpath=//input[@class='form-control ng-tns-c37-6 ng-pristine ng-valid ng-star-inserted ng-touched']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly AdminSetting = () => this.page.locator("xpath=//span[normalize-space()='Admin Settings']");
  private readonly Masters = () => this.page.locator("xpath=//span[normalize-space()='Masters']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToLoanDefects(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(7000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);

    const settingsEle = this.page.locator("xpath=//span[normalize-space()='Settings']");
    await settingsEle.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(settingsEle);

    await this.page.waitForTimeout(1000);
    await this.AdminSetting().click();
    await this.Masters().click();
    await this.page.waitForTimeout(500);

    const loanDefectsEl = this.loanDefects();
    await loanDefectsEl.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(loanDefectsEl);
  }

  // ── Actions (from Flow66_ValidateEditAndViewLoanDefects) ──────────────────

  /**
   * Port of Java Flow66_ValidateEditAndViewLoanDefects.validatAddLoanDefects().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   */
  async validatAddLoanDefects(): Promise<void> {
    await this.navigateToLoanDefects();

    await this.btnEdit().click();
    await this.addErrorMessage().click();
    await this.page.waitForTimeout(500);
    await this.enterErrorMessage().fill('Incorrect adhar Number');
    await this.btnUpdate().click();
  }

  /**
   * Port of Java Flow66_ValidateEditAndViewLoanDefects.validateEditLoanDefect().
   * Called by TC05 priority=10.
   */
  async validateEditLoanDefect(): Promise<void> {
    await this.navigateToLoanDefects();

    await this.btnEdit().click();

    const ele2 = this.btnEditMeassge();
    await ele2.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(ele2);

    await this.page.waitForTimeout(500);
    const editInput = this.page.locator("xpath=//input[contains(@class,'form-control') and contains(@ng-reflect-model,'adhar')]");
    await editInput.clear();
    await this.page.waitForTimeout(500);
    await this.btnUpdate().click();
  }
}
