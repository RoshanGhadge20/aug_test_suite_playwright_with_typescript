import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO13_RenewLoan (locators) + Flow15_RenewLoan.renew() (actions)
 *
 * The active (non-commented) Flow15_RenewLoan.renew() method:
 *   1. Logs in as appraiser, sets branch to Show All (OMITTED — loginWithAppraiser omitted).
 *   2. Navigates to Loan Management → Applied Loan, filters by firstName.
 *   3. Clicks Upload Documents, refreshes, uploads 3 (+ optional 6th) file inputs.
 *   4. Fills CKYC, saves, selects leadConverter, clicks Done.
 *   5. Switches to partner, navigates Applied Loan, clicks Partner Approval, next×7, checkboxes, Approved, Submit.
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator (same XPath as other TC02 flows).
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `fieldCkyc` inline re-declaration from Flow05_AssignPacket.
 *   - `btnYesAssign` re-declares PO05_AssignPacket.loc_btnYes (same XPath).
 *   - `btnDoneAssign` re-declares PO05_AssignPacket.loc_btnDone (same XPath).
 *   - `partnerApproval` re-declares PO07_OpsTeamLoanApproval.loc_partnerApproval (same XPath).
 *   - `checkClick` re-declares PO07_OpsTeamLoanApproval.loc_checkClick (same XPath).
 *   - `checkClick1` re-declares PO07_OpsTeamLoanApproval.loc_checkClick1 (same XPath).
 *   - `btnSubmitOps` re-declares PO07_OpsTeamLoanApproval.loc_btnSubmit (same XPath).
 *   - `btnNextLoop` re-declares PO04_NewGoldLoan.loc_btnNext (same XPath) — used in clickNextSafely.
 *
 * Omitted loginWith* calls:
 *   - Flow15_RenewLoan.renew() called Flow_LoginLogout.loginWithAppraiser() — OMITTED.
 *     Role = appraiser; caller must inject via loginAs('appraiser').
 *   - Flow15_RenewLoan.renew() called Flow_LoginLogout.loginWithPartner() — OMITTED.
 *     Role = partner; caller must inject via loginAs('partner') at the appropriate step.
 *
 * File upload note:
 *   - uploadFileToInput(): uses setInputFiles(); caller may supply documentPath.
 *     Defaults to skipping when no path provided (consistent with other TC02 POs).
 */
export class RenewLoanPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO13_RenewLoan) ────────────────────────────────────────

  private readonly btnUploadDocuments = () => this.page.locator("xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]");
  private readonly btnProceed = () => this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  private readonly btnRenewLoan = () => this.page.locator("xpath=//button[contains(.,'Renew Loan')]");
  private readonly btnYes = () => this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly upfrontID = () => this.page.locator("xpath=//input[@formcontrolname='upfrontTransactionId']");

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
  // PO05_AssignPacket.loc_fieldCkyc (inline in Java)
  private readonly fieldCkyc = () => this.page.locator("xpath=//input[@formcontrolname='ckycNumber']");
  // PO05_AssignPacket.loc_btnYes
  private readonly btnYesAssign = () => this.page.locator("xpath=//span[normalize-space()='Yes']");
  // PO05_AssignPacket.loc_btnDone
  private readonly btnDoneAssign = () => this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO07_OpsTeamLoanApproval.loc_partnerApproval (re-declared inline)
  private readonly partnerApproval = () => this.page.locator("xpath=//button[normalize-space()='Partner Approval']");
  // PO07_OpsTeamLoanApproval.loc_checkClick (re-declared inline)
  private readonly checkClick = () => this.page.locator("xpath=(//input[@type='checkbox'])[1]");
  // PO07_OpsTeamLoanApproval.loc_checkClick1 (re-declared inline)
  private readonly checkClick1 = () => this.page.locator("xpath=(//input[@type='checkbox'])[2]");
  // PO07_OpsTeamLoanApproval.loc_btnSubmit (re-declared inline)
  private readonly btnSubmitOps = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  // PO04_NewGoldLoan.loc_btnNext (re-declared for clickNextSafely)
  private readonly btnNextLoop = () => this.page.locator("xpath=//button[span[normalize-space()='Next']]");

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

  /** Port of Flow15_RenewLoan.uploadFileToInput() — uses setInputFiles(). */
  async uploadFileToInput(index: number, filePath?: string): Promise<void> {
    if (!filePath) return;
    try {
      const input = this.page.locator(`xpath=(//input[@type='file'])[${index}]`);
      await input.waitFor({ state: 'attached', timeout: 30000 });
      await this.page.waitForTimeout(2000);
      await input.setInputFiles(filePath);
      await this.page.waitForTimeout(3000);
    } catch (e) {
      // non-fatal — log and skip
    }
  }

  /** Port of Flow15_RenewLoan.clickNextSafely(). Clicks Next button N times. */
  async clickNextSafely(times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      const nextBtn = this.btnNextLoop();
      await nextBtn.waitFor({ state: 'visible', timeout: 30000 });
      await nextBtn.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(2000);
      try {
        await nextBtn.click();
      } catch {
        await this.jsClick(nextBtn);
      }
      await this.page.waitForTimeout(500);
    }
  }

  // ── Actions (from Flow15_RenewLoan.renew — active section) ───────────────

  /**
   * Port of Java Flow15_RenewLoan.renew() — active (non-commented) section.
   *
   * NOTE: loginWithAppraiser() and loginWithPartner() are OMITTED.
   * The caller must:
   *   1. loginAs('appraiser') before calling renew().
   *   2. The method internally navigates to Applied Loan as appraiser, uploads docs,
   *      fills CKYC, saves, then switches to partner (caller must loginAs('partner')
   *      before the partner-approval section — this method calls partnerRenewApproval()
   *      which the spec wires with an explicit loginAs call).
   *
   * This method covers the appraiser portion only (upload docs → save → done).
   * Call partnerRenewApproval() (as partner) for the partner approval step.
   *
   * File upload: documentPath param optional — skip when not provided.
   */
  async renew(documentPath?: string): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();

    const loanMgmt = this.loanManagement();
    await loanMgmt.scrollIntoViewIfNeeded();
    await loanMgmt.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
    await appliedLoan.waitFor({ state: 'visible' });
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(1000);
    await this.filterbtn().click();
    await this.page.waitForTimeout(3000);

    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.reload();
    await this.page.waitForTimeout(3000);

    // Upload files 1, 2, 3 (+ optional 6th)
    await this.uploadFileToInput(1, documentPath);
    await this.uploadFileToInput(2, documentPath);
    await this.uploadFileToInput(3, documentPath);
    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(1000);
    // 6th file input — optional
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
    await dropdownEle.waitFor({ state: 'visible', timeout: 30000 });
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
   * Port of the partner-approval section inside Flow15_RenewLoan.renew().
   *
   * NOTE: loginWithPartner() is OMITTED. Caller must loginAs('partner') before calling this.
   *
   * Navigates to Applied Loan as partner, clicks Partner Approval, Next×7,
   * checks boxes, selects Approved, submits.
   */
  async partnerRenewApproval(): Promise<void> {
    const data = getLoginData();

    await this.arrow().click();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan2 = this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
    await appliedLoan2.waitFor({ state: 'visible', timeout: 30000 });
    await appliedLoan2.scrollIntoViewIfNeeded();
    await appliedLoan2.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(1000);
    await this.filterbtn().click();
    await this.page.waitForTimeout(2000);

    await this.partnerApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.clickNextSafely(7);
    await this.page.waitForTimeout(2000);

    await this.checkClick().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.checkClick1().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const statusDropdown = this.page.locator("xpath=//select[@formcontrolname='loanStatusForPartner']");
    await statusDropdown.selectOption({ label: 'Approved' });
    await this.page.waitForTimeout(1000);

    await this.btnSubmitOps().click();
    await this.waitForLoaderToDisappear();
  }
}
