import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO35_InternalUser (locators) + Flow56_ValidateInternalUser (actions)
 *
 * Methods ported (only active TC05 calls):
 *   - validateOldeInternalUser()  ← Flow56.validateOldeInternalUser()
 *   (validateInternalUser(), validatingViewBranches(), validateInternalUserUpdate() commented in TC05 — ported but noted)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, userManagent re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - All flows called loginWith* — OMITTED. Role = admin.
 *
 * File upload notes:
 *   - validateInternalUser(): Java used sendKeys to (//input[@id='file'])[1/2] — guarded
 *     behind documentPath? optional params.
 *
 * SoftAssert translated to return value:
 *   - validateOldeInternalUser() returns actualUser string for spec assertions.
 */
export class InternalUserPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO35_InternalUser) ────────────────────────────────────

  private readonly btnInternalUser = () => this.page.locator("xpath=//span[normalize-space()='Internal User']");
  private readonly addInternalUser = () => this.page.locator("xpath=//span[normalize-space()='Add Internal User']");
  private readonly firstname = () => this.page.locator("xpath=//input[@placeholder='First Name']");
  private readonly lastName = () => this.page.locator("xpath=//input[@placeholder='Last Name']");
  private readonly selUsertype = () => this.page.locator("xpath=//select[@formcontrolname='userTypeId']");
  private readonly selRole = () => this.page.locator("xpath=//select[@formcontrolname='roleId']");
  private readonly selBranch = () => this.page.locator("xpath=(//ng-select//input[@role='combobox'])[1]");
  private readonly selDefaultBranch = () => this.page.locator("xpath=//select[@formcontrolname='defaultInternalBranchId']");
  private readonly enteringEmail = () => this.page.locator("xpath=//input[@placeholder='e.g abc@123.com']");
  private readonly IDNumber = () => this.page.locator("xpath=//input[@placeholder='e.g 012345']");
  private readonly mobileNumber = () => this.page.locator("xpath=//input[@placeholder='e.g 9023451234']");
  private readonly sendOTP = () => this.page.locator("xpath=//button[contains(@class,'mat-raised-button') and .//span[text()=' Send OTP ']]");
  private readonly otpValue = () => this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnVerify = () => this.page.locator("xpath=//button[contains(@class,'mat-raised-button') and .//span[text()='Verify']]");
  private readonly uploadPAN = () => this.page.locator("xpath=(//input[@type='file'])[1]");
  private readonly uploadAadhar = () => this.page.locator("xpath=(//input[@type='file'])[2]");
  private readonly btnAdd = () => this.page.locator("xpath=//span[normalize-space()='Add']");
  private readonly nameInput = () => this.page.locator("xpath=//input[@id='mat-input-0']");
  private readonly viewBranches = () => this.page.locator("xpath=//div[@class='kt-pointer']");
  private readonly close = () => this.page.locator("xpath=//img[@class='kt-pointer']");
  private readonly btnEdit = () => this.page.locator("xpath=//div[@class='kt-pointer ng-star-inserted']");
  private readonly btnUpdate = () => this.page.locator("xpath=//span[normalize-space()='Update']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly userManagent = () => this.page.locator("xpath=//span[normalize-space()='User Management']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToInternalUser(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(7000);

    await this.arrow().click();
    await this.page.waitForTimeout(1000);
    await this.userManagent().click();
    await this.page.waitForTimeout(1000);
    await this.btnInternalUser().click();
  }

  // ── Actions (from Flow56_ValidateInternalUser) ────────────────────────────

  /**
   * Port of Java Flow56_ValidateInternalUser.validateInternalUser().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   *
   * TODO(port): File upload — Java used sendKeys to (//input[@id='file'])[1/2].
   * Best-effort: setInputFiles(). panDocumentPath / aadharDocumentPath must be supplied.
   */
  async validateInternalUser(panDocumentPath?: string, aadharDocumentPath?: string): Promise<void> {
    await this.navigateToInternalUser();

    const addBtn = this.addInternalUser();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();

    await this.firstname().fill('Priyanka');
    await this.page.waitForTimeout(1000);
    await this.lastName().fill('Thorat');
    await this.page.waitForTimeout(500);
    await this.selUsertype().selectOption({ label: 'Appraiser' });
    await this.page.waitForTimeout(500);
    await this.selRole().selectOption({ label: 'Appraiser' });
    await this.page.waitForTimeout(500);

    // Select branch from ng-select dropdown (2 iterations)
    for (let i = 0; i < 2; i++) {
      const dropdown = this.page.locator("xpath=(//input[@role='combobox']//following::span[@class='ng-arrow-wrapper'])[2]");
      await dropdown.evaluate((el: any) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await this.page.waitForTimeout(1000);
      await dropdown.click();

      const indexToClick = 4 + i;
      const opts = this.page.locator("xpath=//ng-select//div[contains(@class,'ng-dropdown-panel-items')]//div[contains(@class,'ng-option')]");
      if (await opts.count() > indexToClick) {
        await opts.nth(indexToClick).click();
      }
      await this.page.waitForTimeout(1000);
    }

    await this.page.waitForTimeout(2000);
    await this.selDefaultBranch().selectOption({ label: 'Augmont' });
    await this.enteringEmail().fill('thoratpriyanka@gmail.com');
    await this.mobileNumber().scrollIntoViewIfNeeded();
    await this.mobileNumber().fill('7689000876');

    await this.page.waitForTimeout(500);
    await this.sendOTP().click();
    await this.page.waitForTimeout(500);
    await this.otpValue().fill('1234');
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.page.waitForTimeout(500);
    await this.IDNumber().fill('PMT12');

    // TODO(port): File upload — guarded behind optional params.
    if (panDocumentPath) {
      const fileInput1 = this.page.locator("xpath=(//input[@id='file'])[1]");
      await this.page.waitForTimeout(10000);
      await fileInput1.setInputFiles(panDocumentPath);
    }
    if (aadharDocumentPath) {
      const fileInput2 = this.page.locator("xpath=(//input[@id='file'])[2]");
      await this.page.waitForTimeout(10000);
      await fileInput2.setInputFiles(aadharDocumentPath);
    }

    await this.btnAdd().click();
  }

  /**
   * Port of Java Flow56_ValidateInternalUser.validatingViewBranches().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   *
   * Returns actualBranchName for spec assertions.
   */
  async validatingViewBranches(): Promise<string> {
    await this.navigateToInternalUser();

    await this.nameInput().fill('Priyanka');
    await this.page.waitForTimeout(500);
    await this.viewBranches().click();

    const branchCell = this.page.locator("xpath=//td[normalize-space()='Augmont']");
    const actualBranchName = (await branchCell.innerText()).trim();

    await this.close().click();

    return actualBranchName;
  }

  /**
   * Port of Java Flow56_ValidateInternalUser.validateInternalUserUpdate().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   *
   * Returns { isDisplayed, isEnabled } for spec assertions.
   */
  async validateInternalUserUpdate(): Promise<{ isDisplayed: boolean; isEnabled: boolean }> {
    await this.navigateToInternalUser();

    await this.nameInput().fill('Priyanka');
    await this.page.waitForTimeout(500);
    await this.btnEdit().click();
    await this.page.waitForTimeout(500);

    const updateBtn = this.btnUpdate();
    await updateBtn.waitFor({ state: 'visible', timeout: 15000 });
    const isDisplayed = await updateBtn.isVisible();
    const isEnabled = await updateBtn.isEnabled();

    await updateBtn.click();

    return { isDisplayed, isEnabled };
  }

  /**
   * Port of Java Flow56_ValidateInternalUser.validateOldeInternalUser().
   * Called by TC05 priority=2.
   *
   * Returns actualUser string for spec assertions.
   */
  async validateOldeInternalUser(): Promise<string> {
    await this.navigateToInternalUser();

    await this.nameInput().fill('Priyanka');
    await this.page.waitForTimeout(500);

    const selectedUser = this.page.locator("xpath=(//mat-cell[@role='gridcell'])[2]");
    const actualUser = (await selectedUser.innerText()).trim();

    return actualUser;
  }
}
