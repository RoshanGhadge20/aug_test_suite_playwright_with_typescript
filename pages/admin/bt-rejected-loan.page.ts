import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';
import { BtLoanPage } from './bt-loan.page';

/**
 * Port of Java: PO48_BTRejectedLoan (locators) + Flow70_ValidateRejectedFlowBTLoan.
 *
 * Cross-page locator notes:
 *   - All navigation, table, and form locators are declared via BtLoanPage helpers
 *     (shared with Flow67/69). Only PO48 unique locator (btnYes) declared locally.
 *   - `profile`, `branchDropdown`, `arrow`, `customerManagementBtn`, `firstNameFilter`,
 *     `filterbtn`, `kebabMenu`, `textField` re-declared locally (cross-page pattern).
 *
 * Omitted loginWith* calls:
 *   - Flow70 called Flow_LoginLogout.loginWithAppraiser() — OMITTED.
 *     Caller must invoke loginAs('appraiser') first.
 *
 * Omitted precondition:
 *   - Flow70 had commented-out KYC + ops rating steps — OMITTED per instructions (skip commented code).
 *
 * File upload TODOs:
 *   - uploadDocuments(): Java used C:\\ path — OMITTED per rules. setInputFiles() can be wired later.
 */
export class BtRejectedLoanPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO48_BTRejectedLoan) ──────────────────────────────────

  private readonly btnYes = () => this.page.locator("xpath=//span[contains(.,'Yes')]");

  // Cross-page re-declarations (needed by validateRejectBTLaon)
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly customerManagementBtn = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly kebabMenu = () => this.page.locator("xpath=(//button[.//mat-icon[text()='more_vert']])[1]");
  private readonly textField = () => this.page.locator("xpath=//input[@placeholder='enter text here']");
  // PO46_BTLoan locators used in this flow
  private readonly kebabMenu1 = () => this.page.locator("xpath=(//mat-row[.//*[contains(text(),'BT Loan')]]//mat-icon[normalize-space()='more_vert'])[1]");
  private readonly btnRCHapproval = () => this.page.locator("xpath=//button[normalize-space()='RCH Approval']");
  private readonly selapproval = () => this.page.locator("xpath=//select[@id='approvalStatus']");
  private readonly comments = () => this.page.locator("xpath=//textarea[@id='comments']");
  private readonly btnSubmit = () => this.page.locator("xpath=//span[normalize-space()='Submit']");
  private readonly btnNext = () => this.page.locator("xpath=//span[normalize-space()='Next']");

  // ── Actions (from Flow70_ValidateRejectedFlowBTLoan) ─────────────────────

  /**
   * Port of Flow70_ValidateRejectedFlowBTLoan.rchApproval().
   * Performs RCH approval with Rejected status.
   */
  async rchApproval(): Promise<void> {
    await this.btnRCHapproval().click();
    await this.page.waitForTimeout(5000);

    for (let i = 0; i < 5; i++) {
      await this.page.waitForTimeout(5000);
      await this.jsClick(this.btnNext());
    }

    const element = this.selapproval();
    await this.page.waitForTimeout(3000);
    await element.scrollIntoViewIfNeeded();
    await this.selapproval().selectOption({ label: 'Rejected' });
    await this.page.waitForTimeout(3000);
    await this.comments().fill('Rejected');
    await this.page.waitForTimeout(500);
    await this.btnSubmit().click();
  }

  /**
   * Port of Flow70_ValidateRejectedFlowBTLoan.validateRejectBTLaon().
   * Full BT loan application flow ending with RCH Rejected approval.
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must invoke loginAs('appraiser') first.
   * NOTE: KYC + ops rating precondition steps were commented out in Java — OMITTED.
   *
   * Delegates shared sub-flows (ornaments, scheme, bank details, upload, dates) to BtLoanPage helpers.
   */
  async validateRejectBTLaon(): Promise<void> {
    const data = getLoginData();
    // Re-use BtLoanPage for the shared sub-flows
    const btLoan = new BtLoanPage(this.page);

    await this.page.waitForTimeout(3000);

    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.page.waitForTimeout(500);

    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();

    // Flow70 only navigates to Customer Management (no all-customers / filter — matches Java)
    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(7000);

    const appraisalRequests = this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
    await appraisalRequests.waitFor({ state: 'visible' });
    await appraisalRequests.click();

    await this.page.waitForTimeout(5000);
    await this.textField().fill(data.firstName);

    const scrollDiv = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(3000);

    await this.kebabMenu1().click();
    await this.page.waitForTimeout(3000);

    const applyBTLoan = this.page.locator("xpath=//button[normalize-space()='Apply BT Loan']");
    await this.jsClick(applyBTLoan);
    await this.page.waitForTimeout(500);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);

    const clickBankNameBox = this.page.locator("xpath=//span[@class='ng-arrow-wrapper']");
    await clickBankNameBox.click();
    const dropdown = this.page.locator("xpath=//ng-select[@formcontrolname='multiSelect']");
    await this.waitForLoaderToDisappear();
    await dropdown.click();
    const clickBankName = this.page.locator("xpath=(//span[@class='checkmark checkmark-custom'])[2]");
    await clickBankName.click();
    await this.page.waitForTimeout(500);

    const customer = this.page.locator("xpath=(//p[contains(.,'CID')])[1]");
    await customer.click();
    await this.page.waitForTimeout(500);

    const companyTypeDropdown = this.page.locator("xpath=//select[@id='companyType']");
    await companyTypeDropdown.selectOption({ label: 'NBFC' });
    await this.page.waitForTimeout(3000);

    const loanNumberInput = this.page.locator("xpath=//input[@id='loanNumber']");
    await loanNumberInput.fill(btLoan.generateLoanNumber());
    await this.page.waitForTimeout(3000);

    const loanAmountValue = 150000;
    const loanAmountInput = this.page.locator("xpath=//input[@id='loanAmount']");
    await loanAmountInput.fill(String(loanAmountValue));
    await this.page.waitForTimeout(2000);

    const releaseAmountInput = this.page.locator("xpath=//input[@id='releaseAmount']");
    await releaseAmountInput.fill(String(loanAmountValue));
    await this.page.waitForTimeout(2000);

    await btLoan.selectLoanDates();
    await this.page.waitForTimeout(500);

    await this.page.waitForTimeout(5000);
    await btLoan.safeClick();
    await this.page.waitForTimeout(5000);
    await btLoan.validateOrnaments();
    await this.page.waitForTimeout(5000);
    await btLoan.safeClick();
    await this.page.waitForTimeout(5000);
    await btLoan.selectScheme();
    await this.page.waitForTimeout(5000);
    await btLoan.safeClick();
    await btLoan.validateBankDetails();
    await this.page.waitForTimeout(5000);
    await btLoan.safeClick();
    await btLoan.uploadDocuments();
    await this.page.waitForTimeout(5000);
    await btLoan.safeClick();
    await this.page.waitForTimeout(5000);

    // RCH Approval with Rejected status
    await this.rchApproval();
  }
}
