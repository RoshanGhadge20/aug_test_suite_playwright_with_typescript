import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO42_AddAndEditUnApprovalReason (locators) + Flow64_ValidateAddApprovalReason (actions)
 *
 * Methods ported:
 *   - validateAddApproval()          ← Flow64.validateAddApproval() (commented in TC05 — ported)
 *   - vaidateEditUnapprovalReason()  ← Flow64.vaidateEditUnapprovalReason() (commented in TC05 — ported)
 *   - validateDeleteUnapprovalReason() ← Flow64.validateDeleteUnapprovalReason() (called by TC05 priority=8)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, AdminSetting, Masters re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - OMITTED. Role = admin.
 */
export class UnapprovalReasonPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO42_AddAndEditUnApprovalReason) ───────────────────────

  private readonly UnapprovedReasons = () => this.page.locator("xpath=//span[normalize-space()='Unapproved Reasons']");
  private readonly btnAddReason = () => this.page.locator("xpath=//span[normalize-space()='Add Reason']");
  private readonly EnteringReason = () => this.page.locator("xpath=//input[@formcontrolname='description']");
  private readonly btnAdd = () => this.page.locator("xpath=//span[normalize-space()='Add']");
  private readonly btnEdit = () => this.page.locator("xpath=(//span[@class='kt-pointer ng-star-inserted'][normalize-space()='Edit'])[1]");
  private readonly btnUpdate = () => this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly btnDelete = () => this.page.locator("xpath=(//span[@class='kt-pointer text-danger ng-star-inserted'][normalize-space()='Delete'])[1]");
  private readonly btnYes = () => this.page.locator("xpath=//button[@type='submit']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly AdminSetting = () => this.page.locator("xpath=//span[normalize-space()='Admin Settings']");
  private readonly Masters = () => this.page.locator("xpath=//span[normalize-space()='Masters']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToUnapprovedReasons(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(7000);

    await this.arrow().click();
    await this.page.waitForTimeout(1000);

    const settingsEle = this.page.locator("xpath=//span[normalize-space()='Settings']");
    await settingsEle.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(settingsEle);

    await this.page.waitForTimeout(1000);
    await this.AdminSetting().click();
    await this.Masters().click();
    await this.page.waitForTimeout(500);
    await this.UnapprovedReasons().click();
  }

  // ── Actions (from Flow64_ValidateAddApprovalReason) ───────────────────────

  /**
   * Port of Java Flow64_ValidateAddApprovalReason.validateAddApproval().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   */
  async validateAddApproval(): Promise<void> {
    await this.navigateToUnapprovedReasons();

    await this.btnAddReason().click();
    await this.page.waitForTimeout(1000);
    await this.EnteringReason().fill('Incomplete Documents');
    await this.btnAdd().click();
  }

  /**
   * Port of Java Flow64_ValidateAddApprovalReason.vaidateEditUnapprovalReason().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   */
  async vaidateEditUnapprovalReason(): Promise<void> {
    await this.navigateToUnapprovedReasons();
    await this.page.waitForTimeout(2000);

    const element = this.btnEdit();
    await element.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(element);

    await this.EnteringReason().fill('Documents');
    await this.btnUpdate().click();
  }

  /**
   * Port of Java Flow64_ValidateAddApprovalReason.validateDeleteUnapprovalReason().
   * Called by TC05 priority=8.
   */
  async validateDeleteUnapprovalReason(): Promise<void> {
    await this.navigateToUnapprovedReasons();
    await this.page.waitForTimeout(2000);

    const element = this.btnDelete();
    await element.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(element);

    await this.btnYes().click();
  }
}
