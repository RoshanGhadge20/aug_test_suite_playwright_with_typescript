import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO07_OpsTeamLoanApproval (locators) + Flow07_OpsLoanpproval (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator from Flow07.
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `btnNext` re-declares PO04_NewGoldLoan.loc_btnNext (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow07_OpsLoanpproval.opsAprroval() called Flow_LoginLogout.loginWithOPS() —
 *     OMITTED. Role switching must be handled by the caller via loginAs('opsTeam').
 */
export class OpsApprovalPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO07_OpsTeamLoanApproval) ──────────────────────────────

  private readonly btnOPSTeam = () => this.page.locator("xpath=//button[normalize-space()='OPS TEAM RATING']");
  private readonly btnApprove = () => this.page.locator("xpath=//span[normalize-space()='Approve']");
  private readonly btnYes = () => this.page.locator("xpath=//span[normalize-space()='Yes']");
  private readonly txtArea = () => this.page.locator("xpath=//textarea[@formcontrolname='commentByOperatinalTeam']");
  private readonly submit = () => this.page.locator("xpath=(//span[@class='mat-button-wrapper'])[4]");
  private readonly selAtatus = () => this.page.locator("xpath=//select[@formcontrolname='loanStatusForOperatinalTeam']");
  private readonly txtarea = () => this.page.locator("xpath=//textarea[@formcontrolname='commentByOperatinalTeam']");
  private readonly btnSubmit = () => this.page.locator("xpath=(//span[@class='mat-button-wrapper'])[2]");
  private readonly checkClick = () => this.page.locator("xpath=(//img[@src='../../../../../../../assets/media/icons/incorrect.svg'])[1]");
  private readonly checkClick1 = () => this.page.locator("xpath=(//img[@class='ng-star-inserted'])[2]");
  private readonly partnerApproval = () => this.page.locator("xpath=(//button[normalize-space()='PARTNER APPROVAL'])[1]");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown from Flow07
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  // PO04_NewGoldLoan.loc_btnNext
  private readonly btnNext = () => this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");

  // ── Actions (from Flow07_OpsLoanpproval) ──────────────────────────────────

  /**
   * Port of Java Flow07_OpsLoanpproval.opsAprroval().
   *
   * NOTE: loginWithOPS() call is OMITTED.
   * Role switching must be handled by the caller via loginAs('opsTeam').
   */
  async opsAprroval(): Promise<void> {
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
    await this.page.waitForTimeout(5000);

    await this.btnOPSTeam().click();
    await this.waitForLoaderToDisappear();

    // safeClick(PO04_NewGoldLoan.loc_btnNext) × 5
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
    await this.btnApprove().click();
    await this.waitForLoaderToDisappear();
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.txtArea().fill('Verified');
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.submit().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(1000);

    await this.page.evaluate('window.scrollTo(0, 0);');
    await this.page.waitForTimeout(1000);

    // safeScrollAndClick(PO04_NewGoldLoan.loc_btnNext) × 2
    await this.safeScrollAndClick();
    await this.page.waitForTimeout(1000);
    await this.safeScrollAndClick();

    await this.page.waitForTimeout(5000);

    await this.checkClick().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.checkClick1().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForOperatinalTeam']",
    );
    await selectStatusDropdown.selectOption({ label: 'Approved' });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of Java Flow07_OpsLoanpproval.safeScrollAndClick().
   * Scrolls the Next button into view and clicks it, falling back to jsClick.
   */
  async safeScrollAndClick(): Promise<void> {
    const locator = this.btnNext();
    try {
      await locator.waitFor({ state: 'attached', timeout: 20_000 });
      await locator.evaluate((el) => (el as any).scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await this.page.waitForTimeout(800);
      try {
        await locator.click();
      } catch {
        await this.jsClick(locator);
      }
    } catch {
      await this.jsClick(locator);
    }
  }
}
