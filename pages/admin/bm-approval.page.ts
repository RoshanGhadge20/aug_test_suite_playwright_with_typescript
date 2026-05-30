import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO06_BranchManagerApproval (locators) + Flow06_BranchManagerApproval (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator from Flow06.
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `btnNext` re-declares PO04_NewGoldLoan.loc_btnNext (same XPath).
 *   - `btnSubmit` re-declares PO07_OpsTeamLoanApproval.loc_btnSubmit (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow06_BranchManagerApproval.validateBranchManager() called Flow_LoginLogout.loginWithBM() —
 *     OMITTED. Role switching must be handled by the caller via loginAs('branchManager').
 */
export class BmApprovalPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO06_BranchManagerApproval) ────────────────────────────

  private readonly btnBM = () => this.page.locator("xpath=//button[contains(.,'BM RATING')]");
  private readonly clickArrow = () => this.page.locator("xpath=//img[@name='incorrectApplicationFormForBM']");
  private readonly clickArrow1 = () => this.page.locator("xpath=//img[@name='incorrectGoldValuationForBM']");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown from Flow06
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  // PO04_NewGoldLoan.loc_btnNext
  private readonly btnNext = () => this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  // PO07_OpsTeamLoanApproval.loc_btnSubmit
  private readonly btnSubmit = () => this.page.locator("xpath=(//span[@class='mat-button-wrapper'])[2]");

  // ── Actions (from Flow06_BranchManagerApproval) ───────────────────────────

  /**
   * Port of Java Flow06_BranchManagerApproval.validateBranchManager().
   *
   * NOTE: loginWithBM() call is OMITTED.
   * Role switching must be handled by the caller via loginAs('branchManager').
   */
  async validateBranchManager(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(5000);

    await this.btnBM().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // safeClick(PO04_NewGoldLoan.loc_btnNext) × 6
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(500);

    await this.page.waitForTimeout(5000);

    await this.clickArrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.clickArrow1().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const selectStatusDropdown = this.page.locator("xpath=//select[@formcontrolname='loanStatusForBM']");
    await selectStatusDropdown.selectOption({ label: 'Approved' });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
  }
}
