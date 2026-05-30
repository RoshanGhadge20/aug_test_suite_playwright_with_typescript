import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO14_RenewPlusTopUp (locators) + Flow16_RenewPlusTopUpLoan.renewPlusTopUp() (actions)
 *
 * PO14_RenewPlusTopUp has only one locator (loc_loanID = Done button XPath).
 * The main action logic lives in Flow16_RenewPlusTopUpLoan.renewPlusTopUp().
 *
 * The active (non-commented) renewPlusTopUp() method:
 *   1. Logs in as appraiser (OMITTED), sets branch Show All.
 *   2. Navigates to Applied Loan, clicks Upload Documents, uploads 4 files + optional 6th.
 *   3. Fills CKYC, saves, selects lead converter, Done.
 *   4. Runs opsAprroval() (calls Flow07_OpsLoanpproval.opsAprroval()) — NOTE: this requires
 *      the OPS role; caller must inject loginAs('ops') before the ops section, so this
 *      method is split: renewPlusTopUpAppraiser() + opsApproval is done by caller + renewPlusTopUpPartner().
 *   5. Switches to partner, navigates Applied Loan, Partner Approval, Next×7, checkboxes, Approved, Submit, disburse.
 *
 * Cross-page locator notes:
 *   - All cross-page locators re-declared locally (same XPaths as other TC02 flows).
 *
 * Omitted loginWith* calls:
 *   - loginWithAppraiser() — OMITTED. Role = appraiser for appraiser section.
 *   - loginWithPartner() — OMITTED. Role = partner for partner section.
 *   Both are injected by the spec via loginAs().
 *
 * File upload note:
 *   - documentPath optional; skipped when not provided.
 */
export class RenewPlusTopupPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO14_RenewPlusTopUp) ───────────────────────────────────

  private readonly loanID = () => this.page.locator("xpath=//span[contains(.,'Done')]");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  // PO13_RenewLoan.loc_btnUploadDocuments
  private readonly btnUploadDocuments = () => this.page.locator("xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]");
  // PO05_AssignPacket.loc_fieldCkyc (inline)
  private readonly fieldCkyc = () => this.page.locator("xpath=//input[@formcontrolname='ckycNumber']");
  // PO05_AssignPacket.loc_btnYes
  private readonly btnYesAssign = () => this.page.locator("xpath=//span[normalize-space()='Yes']");
  // PO05_AssignPacket.loc_btnDone
  private readonly btnDoneAssign = () => this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO07_OpsTeamLoanApproval.loc_partnerApproval
  private readonly partnerApproval = () => this.page.locator("xpath=//button[normalize-space()='Partner Approval']");
  // PO07_OpsTeamLoanApproval.loc_checkClick
  private readonly checkClick = () => this.page.locator("xpath=(//input[@type='checkbox'])[1]");
  // PO07_OpsTeamLoanApproval.loc_checkClick1
  private readonly checkClick1 = () => this.page.locator("xpath=(//input[@type='checkbox'])[2]");
  // PO07_OpsTeamLoanApproval.loc_btnSubmit
  private readonly btnSubmitOps = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  // PO04_NewGoldLoan.loc_btnNext (for clickNextMultipleTimes)
  private readonly btnNextLoop = () => this.page.locator("xpath=//button[span[normalize-space()='Next']]");
  // PO09_PartnerLoanApproval.loc_btnDisbursement
  private readonly btnDisbursement = () => this.page.locator("xpath=//button[normalize-space()='Disbursement']");
  // PO09_PartnerLoanApproval.loc_transactionID
  private readonly transactionID = () => this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  // PO09_PartnerLoanApproval.loc_selPaymentType
  private readonly selPaymentType = () => this.page.locator("xpath=//select[@formcontrolname='paymentType']");
  // PO09_PartnerLoanApproval.loc_btnDone
  private readonly btnDonePartner = () => this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO09_PartnerLoanApproval.loc_btnYes
  private readonly btnYesPartner = () => this.page.locator("xpath=//span[normalize-space()='Yes']");

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Port of Flow05_AssignPacket.generateRandomCKYC() — inline. */
  generateRandomCKYC(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 14; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /** Port of Flow16_RenewPlusTopUpLoan.randomTransactionId(). */
  randomTransactionId(length: number): string {
    const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sb = '';
    for (let i = 0; i < length; i++) {
      sb += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
    }
    return sb;
  }

  /** Port of Flow16_RenewPlusTopUpLoan.uploadFileToInput(). */
  async uploadFileToInput(index: number, filePath?: string): Promise<void> {
    if (!filePath) return;
    try {
      const input = this.page.locator(`xpath=(//input[@type='file'])[${index}]`);
      await input.waitFor({ state: 'attached', timeout: 30000 });
      await this.page.waitForTimeout(2000);
      await input.setInputFiles(filePath);
      await this.page.waitForTimeout(3000);
    } catch {
      // non-fatal
    }
  }

  /** Port of Flow16_RenewPlusTopUpLoan.clickNextMultipleTimes(). */
  async clickNextMultipleTimes(numClicks: number): Promise<void> {
    for (let count = 0; count < numClicks; count++) {
      const nextBtn = this.btnNextLoop();
      await nextBtn.waitFor({ state: 'visible', timeout: 30000 });
      await nextBtn.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(5000);
      try {
        await nextBtn.click();
      } catch {
        await this.jsClick(nextBtn);
      }
      await this.page.waitForTimeout(500);
    }
  }

  // ── Actions (from Flow16_RenewPlusTopUpLoan.renewPlusTopUp — appraiser section) ──

  /**
   * Port of Flow16_RenewPlusTopUpLoan.renewPlusTopUp() — appraiser section (upload → save → done).
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * File upload: documentPath optional — skipped when not provided.
   */
  async renewPlusTopUp(documentPath?: string): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(7000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);
    const loanMgmt = this.loanManagement();
    await loanMgmt.scrollIntoViewIfNeeded();
    await loanMgmt.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
    await appliedLoan.waitFor({ state: 'visible', timeout: 20000 });
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(1000);
    await this.filterbtn().click();
    await this.page.waitForTimeout(3000);

    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    // Upload files 1, 2, 3, 4 + optional 6th
    await this.uploadFileToInput(1, documentPath);
    await this.uploadFileToInput(2, documentPath);
    await this.uploadFileToInput(3, documentPath);
    await this.uploadFileToInput(4, documentPath);
    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(1000);
    try {
      const fileInput6 = this.page.locator("xpath=(//input[@type='file'])[6]");
      await fileInput6.waitFor({ state: 'visible', timeout: 10000 });
      if (documentPath) await fileInput6.setInputFiles(documentPath);
      await this.page.waitForTimeout(3000);
    } catch {
      // 6th input not present — skip
    }

    await this.page.waitForTimeout(5000);

    // CKYC
    const ckycNumber = this.generateRandomCKYC();
    const fieldInput = this.fieldCkyc();
    await fieldInput.waitFor({ state: 'visible' });
    await fieldInput.fill(ckycNumber);
    await this.page.waitForTimeout(1000);

    // Save
    const saveBtn = this.page.locator("xpath=//button[normalize-space()='Save']");
    await saveBtn.waitFor({ state: 'attached', timeout: 30000 });
    await saveBtn.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);
    await this.jsClick(saveBtn);
    await this.page.waitForTimeout(2000);
    await this.waitForLoaderToDisappear();

    // Yes
    await this.btnYesAssign().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // Lead converter dropdown
    const dropdownEle = this.page.locator("xpath=//select[@formcontrolname='leadConverterId']");
    await dropdownEle.waitFor({ state: 'visible', timeout: 20000 });
    await this.page.waitForTimeout(1000);
    try {
      await dropdownEle.selectOption({ label: 'Priyanka Thorat' });
    } catch {
      // option not available — skip
    }
    await this.page.waitForTimeout(1000);
    await this.btnDoneAssign().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
  }

  /**
   * Port of the partner-approval + disbursement section in Flow16_RenewPlusTopUpLoan.renewPlusTopUp().
   *
   * NOTE: loginWithPartner() is OMITTED. Caller must loginAs('partner') before calling this.
   */
  async partnerRenewPlusTopupApproval(): Promise<void> {
    const data = getLoginData();

    await this.arrow().click();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(2500);
    await this.filterbtn().click();
    await this.page.waitForTimeout(5000);

    await this.partnerApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.clickNextMultipleTimes(7);
    await this.page.waitForTimeout(5000);

    await this.checkClick().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.checkClick1().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const statusDropdown = this.page.locator("xpath=//select[@formcontrolname='loanStatusForPartner']");
    await statusDropdown.selectOption({ label: 'Approved' });
    await this.page.waitForTimeout(2000);

    await this.btnSubmitOps().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Disbursement
    await this.loanDisbursement();
  }

  /** Port of Flow16_RenewPlusTopUpLoan.loanDisbursement(). */
  async loanDisbursement(): Promise<void> {
    await this.btnDisbursement().click();
    await this.waitForLoaderToDisappear();

    await this.transactionID().fill(this.randomTransactionId(12));
    await this.waitForLoaderToDisappear();

    const submitBtn = this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
    await submitBtn.scrollIntoViewIfNeeded();

    await this.selPaymentType().selectOption({ label: 'RTGS' });
    await this.page.waitForTimeout(2000);

    await submitBtn.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);

    await this.btnDonePartner().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnYesPartner().click();
    await this.waitForLoaderToDisappear();
  }
}
