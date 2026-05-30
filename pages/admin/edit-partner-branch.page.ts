import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO34_EditPartnerBranch (locators) + Flow55_ValidateEditPartnerBranch (actions)
 * Also covers Flow54_ValidateAddPartnerBranch (commented out in TC05 — omitted).
 *
 * Methods ported (only active TC05 calls):
 *   - validateDeletePartnerBranch()  ← Flow55.validateDeletePartnerBranch()
 *   (validateEditPartnerBranch() and validateViewPartnerBranch() ported but not called by TC05)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, userManagent re-declared locally.
 *   - partnerbranch locator re-declared from PO32.
 *
 * Omitted loginWith... logout calls:
 *   - All flows called loginWith* — OMITTED. Role = admin.
 */
export class EditPartnerBranchPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO34_EditPartnerBranch) ────────────────────────────────

  private readonly enterText = () => this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly btnEdit = () => this.page.locator("xpath=(//div[contains(@class,'kt-pointer') and contains(text(),'Edit')])[1]");
  private readonly btnUpdate = () => this.page.locator("xpath=//span[contains(.,'Update')]");
  private readonly btnDelete = () => this.page.locator("xpath=(//div[contains(.,'Delete')])[1]");
  private readonly btnYes = () => this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly btnView = () => this.page.locator("xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'View')])[1]");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly userManagent = () => this.page.locator("xpath=//span[normalize-space()='User Management']");
  private readonly partnerbranch = () => this.page.locator("xpath= //span[normalize-space()='Partner Branch']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToPartnerBranch(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(7000);

    await this.arrow().click();
    await this.page.waitForTimeout(1000);
    await this.userManagent().click();

    const element1 = this.partnerbranch();
    await element1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(1000);
    await element1.click();
  }

  // ── Actions (from Flow55_ValidateEditPartnerBranch) ───────────────────────

  /**
   * Port of Java Flow55_ValidateEditPartnerBranch.validateEditPartnerBranch().
   * NOTE: Not called by TC05 but ported for completeness.
   */
  async validateEditPartnerBranch(): Promise<void> {
    await this.navigateToPartnerBranch();

    await this.enterText().fill('Augmont');
    await this.page.waitForTimeout(1000);

    const ele = this.btnEdit();
    await ele.waitFor({ state: 'visible', timeout: 15000 });
    await this.jsClick(ele);
    await this.page.waitForTimeout(2000);

    const ccmail = this.page.locator("xpath=//textarea[@placeholder='Enter CC Mails']");
    await this.page.waitForTimeout(2000);
    await ccmail.scrollIntoViewIfNeeded();

    await this.btnUpdate().click();
  }

  /**
   * Port of Java Flow55_ValidateEditPartnerBranch.validateDeletePartnerBranch().
   * Called by TC05 priority=1.
   */
  async validateDeletePartnerBranch(): Promise<void> {
    await this.navigateToPartnerBranch();
    await this.page.waitForTimeout(2000);

    await this.arrow().click();
    await this.page.waitForTimeout(2000);

    const deleteBtn = this.page.locator("xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Delete')])[1]");
    await deleteBtn.waitFor({ state: 'visible', timeout: 10000 });
    await deleteBtn.click();
    await this.page.waitForTimeout(1000);

    await this.btnYes().click();
  }

  /**
   * Port of Java Flow55_ValidateEditPartnerBranch.validateViewPartnerBranch().
   * NOTE: Not called by TC05 but ported for completeness.
   */
  async validateViewPartnerBranch(): Promise<void> {
    await this.navigateToPartnerBranch();
    await this.btnView().click();
  }
}
