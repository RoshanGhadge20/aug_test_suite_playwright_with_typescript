import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO28_ManualChargesFunctionality (locators) + Flow38_ManualChargesFunctionality (actions)
 *
 * Methods ported:
 *   - manualCharges()  ← Flow38.manualCharges()
 *
 * Cross-page locator notes:
 *   - All navigation locators re-declared locally.
 *   - PO26_ViewFunctionalityLoan.loc_viewLoan re-declared as viewLoan.
 *
 * Omitted loginWith* calls:
 *   - Flow38.manualCharges() has no loginWith* call (session assumed). Role = appraiser.
 *
 * SoftAssert assertions translated to return values:
 *   - Returns [chargeName, chargeAmount] so spec can assert with expect.soft().
 */
export class ManualChargesPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO28_ManualChargesFunctionality) ───────────────────────

  private readonly chargeName = () => this.page.locator("xpath=//input[@formcontrolname='chargeName']");
  private readonly chargeAmount = () => this.page.locator("xpath=//input[@formcontrolname='charges']");
  private readonly btnAdd = () => this.page.locator("xpath=//span[normalize-space()='Add']");
  private readonly charges = () => this.page.locator("xpath=//body[1]/div[7]/div[2]/div[1]/mat-dialog-container[1]/kt-manual-charges-dialog[1]/kt-portlet[1]/div[1]/kt-portlet-body[1]/div[1]/table[1]/tbody[1]/tr[1]/td[2]");
  private readonly viewManaulCharges = () => this.page.locator("xpath=//span[normalize-space()='View Manual Charges Logs']");
  private readonly closeMark = () => this.page.locator("xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile (not called — session assumed; kept for navigateToLoanDetails)
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

  // ── Actions (from Flow38_ManualChargesFunctionality.manualCharges) ─────────

  /**
   * Port of Java Flow38_ManualChargesFunctionality.manualCharges().
   *
   * NOTE: No loginWith* in Java. Session is assumed (caller logged in as appraiser).
   * Profile click → branch → arrow → Loan Management → Loan Details → filter → kebab
   * → Manual Charges dialog → add charge "QA" / 100 → re-filter → View Loan → View Manual Charges Logs
   * → read first row name and amount → close.
   *
   * Returns [chargeName, chargeAmount] — spec asserts with expect.soft().
   */
  async manualCharges(): Promise<[string, string]> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
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

    const targetButton = this.page.locator("xpath=//button[normalize-space()='Manual Charges']");
    await targetButton.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await targetButton.click();
    await this.waitForLoaderToDisappear();

    await this.chargeName().fill('QA');
    await this.chargeAmount().fill('100');
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

    const targetElement = this.viewManaulCharges();
    await targetElement.waitFor({ state: 'visible', timeout: 10000 });
    await targetElement.evaluate((el: any) => el.scrollIntoView({ behavior: 'auto', block: 'center' }));
    await targetElement.click();
    await this.waitForLoaderToDisappear();

    const targetEle = this.page.locator("xpath=//mat-dialog-container//table/tbody/tr[1]/td[1]");
    await targetEle.waitFor({ state: 'visible', timeout: 10000 });
    const chargeNameText = (await targetEle.innerText()).trim();

    const targetElem = this.page.locator("xpath=//mat-dialog-container//table/tbody/tr[1]/td[2]");
    await targetElem.waitFor({ state: 'visible', timeout: 10000 });
    const actualCharge = (await targetElem.innerText()).trim();

    await this.page.waitForTimeout(2000);
    await this.closeMark().click();
    await this.waitForLoaderToDisappear();

    return [chargeNameText, actualCharge];
  }
}
