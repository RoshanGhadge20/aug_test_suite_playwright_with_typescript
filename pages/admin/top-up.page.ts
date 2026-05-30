import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO12_TopUp (locators) + Flow14_TopUp.topUp() / topUpOnlinePay() (actions)
 *
 * The active (non-commented) Flow14_TopUp.topUp() method:
 *   1. Fills CKYC number on the PO05_AssignPacket form (continuation of a previous step).
 *   2. Switches to partner role, navigates to Applied Loan, disburses the loan.
 *
 * The topUpOnlinePay() helper contains the online payment flow for top-up.
 * Both are ported here as separate public methods.
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator (same XPath as other TC02 flows).
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `loanDetails` re-declares PO10_QuickPayment.loc_LoanDetails (same XPath).
 *   - `kebabMenu` re-declares PO10_QuickPayment.loc_kebabMenu (same XPath).
 *   - `btnProceed` re-declares PO10_QuickPayment.loc_btnProceed (same XPath).
 *   - `netBanking` re-declares PO10_QuickPayment.loc_netBanking (same XPath).
 *   - `selPayment` re-declares PO10_QuickPayment.loc_selPayment (same XPath).
 *   - `btnConfirm` re-declares PO10_QuickPayment.loc_btnConfirm (same XPath).
 *   - `fieldCkyc` re-declares PO05_AssignPacket.loc_fieldCkyc (inline XPath from Java).
 *   - `btnYes` re-declares PO05_AssignPacket.loc_btnYes (same XPath).
 *   - `btnDone` re-declares PO05_AssignPacket.loc_btnDone (same XPath).
 *   - `btnDisbursement` re-declares PO09_PartnerLoanApproval.loc_btnDisbursement (same XPath).
 *   - `transactionID` re-declares PO09_PartnerLoanApproval.loc_transactionID (same XPath).
 *   - `selPaymentType` re-declares PO09_PartnerLoanApproval.loc_selPaymentType (same XPath).
 *   - `btnDonePartner` re-declares PO09_PartnerLoanApproval.loc_btnDone (same XPath).
 *   - `btnYesPartner` re-declares PO09_PartnerLoanApproval.loc_btnYes (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow14_TopUp.topUp() called Flow_LoginLogout.loginWithPartner() — OMITTED.
 *     Role = partner; caller must inject via loginAs('partner') before topUp().
 *
 * Random CKYC generator ported from Flow05_AssignPacket.generateRandomCKYC() inline.
 */
export class TopUpPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO12_TopUp) ─────────────────────────────────────────────

  private readonly topUpBtn = () => this.page.locator("xpath=//button[normalize-space()='Top-Up']");
  private readonly inputField = () => this.page.locator("xpath=//input[@formcontrolname='topUpAmount']");
  private readonly btnconfirm = () => this.page.locator("xpath=//span[contains(text(),'Confirm')]");
  private readonly btnYes = () => this.page.locator("xpath=//span[normalize-space()='Yes']");
  private readonly btnCheckbox = () => this.page.locator("xpath=//span[@class='checkmark top-0']");
  private readonly selPurpose = () => this.page.locator("xpath=//select[@formcontrolname='loanPurpose']");
  private readonly btnSubmit = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base mat-primary ng-star-inserted']");
  private readonly btnDownloadCash = () => this.page.locator("xpath=//span[contains(.,'Download Cash Declaration')]");
  private readonly btnDone = () => this.page.locator("xpath=//span[contains(.,'Done')]");
  private readonly btnSave = () => this.page.locator("xpath=//span[normalize-space()='Save']");

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
  // PO10_QuickPayment.loc_LoanDetails
  private readonly loanDetails = () => this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  // PO10_QuickPayment.loc_kebabMenu
  private readonly kebabMenu = () => this.page.locator("xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]");
  // PO10_QuickPayment.loc_netBanking
  private readonly netBanking = () => this.page.locator("xpath=//img[@alt='netbanking']");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () => this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO10_QuickPayment.loc_btnConfirm
  private readonly btnConfirm = () => this.page.locator("xpath=//span[normalize-space()='Confirm']");
  // PO13_RenewLoan.loc_btnYes
  private readonly btnYesRenew = () => this.page.locator("xpath=//span[contains(.,'Yes')]");
  // PO05_AssignPacket.loc_fieldCkyc (inline in Java: no dedicated PO constant — re-declared here)
  private readonly fieldCkyc = () => this.page.locator("xpath=//input[@formcontrolname='ckycNumber']");
  // PO05_AssignPacket.loc_btnYes
  private readonly btnYesAssign = () => this.page.locator("xpath=//span[normalize-space()='Yes']");
  // PO05_AssignPacket.loc_btnDone
  private readonly btnDoneAssign = () => this.page.locator("xpath=//span[normalize-space()='Done']");
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

  /** Port of Flow05_AssignPacket.generateRandomCKYC() — inline here to avoid cross-PO dependency. */
  generateRandomCKYC(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 14; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /** Port of Flow14_TopUp.randomTransactionId(). */
  randomTransactionId(length: number): string {
    const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sb = '';
    for (let i = 0; i < length; i++) {
      sb += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
    }
    return sb;
  }

  // ── Actions (from Flow14_TopUp.topUp — active/non-commented section) ──────

  /**
   * Port of Flow14_TopUp.topUp() — the active (non-commented) portion.
   *
   * NOTE: Flow14_TopUp.topUp() called Flow_LoginLogout.loginWithPartner() — OMITTED.
   * Role = partner; caller must inject via loginAs('partner') before calling topUp().
   *
   * Fills CKYC field, saves, selects lead converter, clicks Done, then navigates to
   * Applied Loan as partner and disburses the loan.
   */
  async topUp(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    const ckycNumber = this.generateRandomCKYC();
    const fieldInput = this.fieldCkyc();
    await fieldInput.waitFor({ state: 'visible' });
    await fieldInput.fill(ckycNumber);
    await this.page.waitForTimeout(1000);

    // Navigate to Applied Loan as partner
    await this.arrow().click();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill('Priyanka');
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.page.waitForTimeout(2000);

    await this.loanDisbursement();
    await this.page.waitForTimeout(5000);
  }

  /** Port of Flow14_TopUp.loanDisbursement(). */
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

  // ── Actions (from Flow14_TopUp.topUpOnlinePay) ────────────────────────────

  /**
   * Port of Flow14_TopUp.topUpOnlinePay().
   *
   * Navigates to Loan Details, initiates Top-Up, selects a checkbox, sets purpose,
   * enters topUp amount, confirms, submits via PAYMENT GATEWAY / SBI / Success popup.
   */
  async topUpOnlinePay(): Promise<void> {
    const data = getLoginData();

    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();

    const kebab = this.kebabMenu();
    await kebab.scrollIntoViewIfNeeded();
    try {
      await kebab.click();
    } catch {
      await this.jsClick(kebab);
    }
    await this.page.waitForTimeout(5000);

    await this.topUpBtn().click();
    await this.page.waitForTimeout(5000);

    // Checkbox (3rd custom-checkbox checkmark)
    const checkbox = this.page.locator("xpath=(//label[@class='custom-checkbox']//span[contains(@class,'checkmark')])[3]");
    await checkbox.evaluate((el: any) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await this.page.waitForTimeout(3000);
    await checkbox.dispatchEvent('click');
    await this.page.waitForTimeout(5000);

    await this.selPurpose().selectOption({ label: 'Business Expansion' });
    await this.page.evaluate('window.scrollBy(0, -300)');

    const topUpAmtEl = this.page.locator("xpath=//input[@formcontrolname='topUpAmount']");
    await topUpAmtEl.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(2000);
    await topUpAmtEl.clear();
    await this.page.waitForTimeout(2000);
    await this.page.evaluate('window.scrollBy(0, -300)');
    await this.inputField().fill('25000');
    await this.page.waitForTimeout(2000);

    await this.page.evaluate('window.scrollBy(0, 300)');
    await this.page.waitForTimeout(2000);
    await this.jsClick(this.btnconfirm());

    await this.page.waitForTimeout(2000);
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(5000);

    await this.jsClick(this.btnCheckbox());
    await this.page.waitForTimeout(2000);
    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
  }
}
