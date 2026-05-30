import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO36_InternalUserBranch (locators) + Flow57_InternalUserBranch (actions)
 *
 * Methods ported (only active TC05 calls):
 *   - valiadateOdlInternalBranchUser()  ← Flow57.valiadateOdlInternalBranchUser()
 *   (validateInternalUserBranch(), validateViewInternalUserBranch(), validateEditInternalUserBranch() commented in TC05 — ported)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, userManagent, nameInput re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - All flows called loginWith* — OMITTED. Role = admin.
 *
 * File upload notes:
 *   - validateInternalUserBranch(): Java used sendKeys to //input[@id='file'] — guarded.
 *
 * SoftAssert translated to return value:
 *   - valiadateOdlInternalBranchUser() returns { isDisplayed, isEnabled } for spec assertions.
 */
export class InternalUserBranchPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO36_InternalUserBranch) ───────────────────────────────

  private readonly AddInternalUserBranch = () => this.page.locator("xpath=//span[normalize-space()='Add Internal Branch']");
  private readonly InternalUserBranch = () => this.page.locator("xpath=//span[normalize-space()='Internal User Branch']");
  private readonly BranchName = () => this.page.locator("xpath=//input[@formcontrolname='name']");
  private readonly selBranchType = () => this.page.locator("xpath=//select[@formcontrolname='branchType']");
  private readonly Address = () => this.page.locator("xpath=//textarea[@placeholder='e.g 012345']");
  private readonly SelState = () => this.page.locator("xpath=//select[@formcontrolname='stateId']");
  private readonly SelCity = () => this.page.locator("xpath=//select[@formcontrolname='cityId']");
  private readonly Pincode = () => this.page.locator("xpath=//input[@placeholder='eg.123465']");
  private readonly SelAuditor = () => this.page.locator("xpath=//select[@formcontrolname='auditorId']");
  private readonly BankName = () => this.page.locator("xpath=//input[@placeholder='Bank Name']");
  private readonly BankBranchName = () => this.page.locator("xpath=//input[@formcontrolname='bankBranch']");
  private readonly IFSC = () => this.page.locator("xpath=//input[@placeholder='IFSC Code']");
  private readonly ACHolderName = () => this.page.locator("xpath=//input[@placeholder='A/C Holder Name']");
  private readonly ACNumber = () => this.page.locator("xpath=//input[@placeholder='A/C Number']");
  private readonly Commision = () => this.page.locator("xpath=//input[@placeholder='Commission %']");
  private readonly Product = () => this.page.locator("xpath=(//input[@role='combobox']//following::span[@class='ng-arrow-wrapper'])[2]");
  private readonly Attach = () => this.page.locator("xpath=//input[@id='file']");
  private readonly btnAdd = () => this.page.locator("xpath=//span[normalize-space()='Add']");
  private readonly btnView = () => this.page.locator("xpath=(//div[contains(@class,'action-btn-group')]/div[1])[1]");
  private readonly btnClose = () => this.page.locator("xpath=//img[@class='kt-pointer']");
  private readonly searchfield = () => this.page.locator("xpath=//input[@id='mat-input-0']");
  private readonly btnEdit = () => this.page.locator("xpath=(//div[@class='kt-pointer ng-star-inserted'])[2]");
  private readonly btnUpdate = () => this.page.locator("xpath=(//div[@class='kt-pointer ng-star-inserted'])[3]");
  private readonly inputfield = () => this.page.locator("xpath=//input[@class='form-control ng-valid ng-dirty ng-touched']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly userManagent = () => this.page.locator("xpath=//span[normalize-space()='User Management']");
  private readonly nameInput = () => this.page.locator("xpath=//input[@id='mat-input-0']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToInternalUserBranch(): Promise<void> {
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
    await this.InternalUserBranch().click();
  }

  // ── Actions (from Flow57_InternalUserBranch) ──────────────────────────────

  /**
   * Port of Java Flow57_InternalUserBranch.validateInternalUserBranch().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   *
   * TODO(port): File upload — Java used sendKeys to //input[@id='file'] — guarded.
   */
  async validateInternalUserBranch(documentPath?: string): Promise<void> {
    await this.navigateToInternalUserBranch();

    const addBranchBtn = this.AddInternalUserBranch();
    await addBranchBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBranchBtn.click();

    await this.page.waitForTimeout(500);
    await this.BranchName().fill('Augmont');
    await this.selBranchType().selectOption({ label: 'Augmont Branch' });

    // Select auditor partners from ng-select (2 iterations at index 18, 19)
    for (let i = 0; i < 2; i++) {
      const dropdown = this.page.locator("xpath=(//input[@role='combobox']//following::span[@class='ng-arrow-wrapper'])[1]");
      await dropdown.evaluate((el: any) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await this.page.waitForTimeout(1000);
      await dropdown.click();

      const indexToClick = 18 + i;
      const opts = this.page.locator("xpath=//ng-select//div[contains(@class,'ng-dropdown-panel-items')]//div[contains(@class,'ng-option')]");
      if (await opts.count() > indexToClick) {
        await opts.nth(indexToClick).click();
      }
      await this.page.waitForTimeout(1000);
    }

    await this.page.waitForTimeout(500);
    await this.Address().fill('Mumbai');
    await this.SelState().selectOption({ label: 'Maharashtra' });
    await this.SelCity().selectOption({ label: 'Mumbai' });
    await this.page.waitForTimeout(500);
    await this.Pincode().fill('435005');
    await this.SelAuditor().selectOption({ label: 'regression test' });
    await this.page.waitForTimeout(500);
    await this.BankName().fill('SBI');
    await this.page.waitForTimeout(500);
    await this.BankBranchName().fill('Main Branch');
    await this.page.waitForTimeout(500);
    await this.IFSC().fill('SBIN0000000');
    await this.page.waitForTimeout(500);
    await this.ACHolderName().fill('Priyanka Thorat');
    await this.ACNumber().fill('999988887777');
    await this.Commision().fill('1%');

    // Select products from ng-select (2 iterations at index 0, 1)
    for (let i = 0; i < 2; i++) {
      const dropdown = this.page.locator("xpath=(//input[@role='combobox']//following::span[@class='ng-arrow-wrapper'])[2]");
      await dropdown.evaluate((el: any) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await this.page.waitForTimeout(1000);
      await dropdown.click();

      const opts = this.page.locator("xpath=//ng-select//div[contains(@class,'ng-dropdown-panel-items')]//div[contains(@class,'ng-option')]");
      if (await opts.count() > i) {
        await opts.nth(i).click();
      }
      await this.page.waitForTimeout(1000);
    }

    // TODO(port): File upload guarded behind optional param.
    if (documentPath) {
      const fileInput = this.page.locator("xpath=//input[@id='file']");
      await this.page.waitForTimeout(10000);
      await fileInput.setInputFiles(documentPath);
    }

    await this.page.waitForTimeout(500);
    await this.btnAdd().click();
  }

  /**
   * Port of Java Flow57_InternalUserBranch.validateViewInternalUserBranch().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   *
   * Returns actualBranch for spec assertions.
   */
  async validateViewInternalUserBranch(): Promise<string> {
    await this.navigateToInternalUserBranch();

    await this.nameInput().fill('Main Branch');
    await this.page.waitForTimeout(500);
    await this.arrow().click();
    await this.btnView().click();

    const branchValue = this.page.locator("xpath=//input[@formcontrolname='name']");
    const actualBranch = (await branchValue.inputValue()).trim();

    await this.btnClose().click();

    return actualBranch;
  }

  /**
   * Port of Java Flow57_InternalUserBranch.validateEditInternalUserBranch().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   *
   * Returns { isDisplayed, isEnabled } for spec assertions.
   */
  async validateEditInternalUserBranch(): Promise<{ isDisplayed: boolean; isEnabled: boolean }> {
    await this.navigateToInternalUserBranch();

    await this.searchfield().fill('Main Branch');
    await this.page.waitForTimeout(500);
    await this.arrow().click();
    await this.page.waitForTimeout(500);
    await this.btnEdit().click();

    const updateBtn = this.btnUpdate();
    await updateBtn.waitFor({ state: 'visible', timeout: 15000 });
    const isDisplayed = await updateBtn.isVisible();
    const isEnabled = await updateBtn.isEnabled();

    await updateBtn.click();

    return { isDisplayed, isEnabled };
  }

  /**
   * Port of Java Flow57_InternalUserBranch.valiadateOdlInternalBranchUser().
   * Called by TC05 priority=3.
   *
   * Returns { isDisplayed, isEnabled } for spec assertions.
   */
  async valiadateOdlInternalBranchUser(): Promise<{ isDisplayed: boolean; isEnabled: boolean }> {
    await this.navigateToInternalUserBranch();

    await this.searchfield().fill('Main Branch');
    await this.page.waitForTimeout(500);
    await this.arrow().click();
    await this.btnUpdate().click();
    await this.page.waitForTimeout(1000);
    await this.inputfield().fill('5');
    await this.page.waitForTimeout(500);

    const addBtn = this.btnAdd();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    const isDisplayed = await addBtn.isVisible();
    const isEnabled = await addBtn.isEnabled();

    await addBtn.click();

    return { isDisplayed, isEnabled };
  }
}
