import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO27_WavierFunctionalityLoan (locators) + Flow50_WavierFunctionalityLoan (actions)
 *
 * Methods ported:
 *   - validateWavier()  ← Flow50.validateWavier()
 *
 * Cross-page locator notes:
 *   - All navigation locators re-declared locally.
 *   - PO26_ViewFunctionalityLoan.loc_viewLoan / loc_btnclose re-declared.
 *   - PO28_ManualChargesFunctionality.loc_closeMark re-declared as closeMark.
 *
 * Omitted loginWith* calls:
 *   - validateWavier() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *
 * SoftAssert assertions translated to return values:
 *   - Returns [waiversName, wavierCharge] so spec can assert with expect.soft().
 */
export class WaiverPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO27_WavierFunctionalityLoan) ──────────────────────────

  private readonly waviers = () => this.page.locator("xpath=//button[normalize-space()='Waivers']");
  private readonly waviersAmount = () => this.page.locator("xpath=//input[@formcontrolname='amount']");
  private readonly btnAdd = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Add']//button[@type='button']");
  private readonly viewwavier = () => this.page.locator("xpath=//span[contains(text(),'View Waivers Logs')]");

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
  // PO26_ViewFunctionalityLoan.loc_viewLoan
  private readonly viewLoan = () => this.page.locator("xpath=//button[normalize-space()='View Loan']");
  // PO26_ViewFunctionalityLoan.loc_btnclose
  private readonly btnclose = () => this.page.locator("xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']");
  // PO28_ManualChargesFunctionality.loc_closeMark
  private readonly closeMark = () => this.page.locator("xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']");
  // Waivers dropdown
  private readonly selWaiverName = () => this.page.locator("xpath=//select[@formcontrolname='waiverName']");

  // ── Actions (from Flow50_WavierFunctionalityLoan.validateWavier) ──────────

  /**
   * Port of Java Flow50_WavierFunctionalityLoan.validateWavier().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Loan Details, opens Waivers dialog, adds waiver 100,
   * then opens View Loan → View Waivers Logs and reads the first row's name and amount.
   *
   * Returns [waiversName, wavierCharge] — spec asserts with expect.soft().
   */
  async validateWavier(): Promise<[string, string]> {
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
    await this.loanManagement().click();
    await this.page.waitForTimeout(5000);

    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();

    const targetButton = this.page.locator("xpath=//button[normalize-space()='Waivers']");
    await targetButton.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(2000);
    await targetButton.click();
    await this.waitForLoaderToDisappear();

    await this.selWaiverName().waitFor({ state: 'visible', timeout: 20000 });
    await this.page.waitForTimeout(2000);
    await this.selWaiverName().selectOption({ label: 'Test3 Ok' });

    await this.waviersAmount().fill('100');
    await this.page.waitForTimeout(500);
    await this.btnAdd().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    // Re-filter and open View Loan
    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan().click();
    await this.waitForLoaderToDisappear();

    const targetElement = this.viewwavier();
    await targetElement.waitFor({ state: 'visible', timeout: 10000 });
    await targetElement.evaluate((el: any) => el.scrollIntoView({ behavior: 'auto', block: 'center' }));
    await targetElement.click();
    await this.waitForLoaderToDisappear();

    const targetEle = this.page.locator("xpath=//mat-dialog-container//table/tbody/tr[1]/td[1]");
    await targetEle.waitFor({ state: 'visible', timeout: 10000 });
    const waviersName = (await targetEle.innerText()).trim();

    const targetElem = this.page.locator("xpath=//mat-dialog-container//table/tbody/tr[1]/td[2]");
    await targetElem.waitFor({ state: 'visible', timeout: 10000 });
    const wavierCharge = (await targetElem.innerText()).trim();

    await this.page.waitForTimeout(2000);
    await this.closeMark().click();
    await this.waitForLoaderToDisappear();

    return [waviersName, wavierCharge];
  }
}
