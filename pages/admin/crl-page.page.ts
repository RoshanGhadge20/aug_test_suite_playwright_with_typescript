import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';
import { TestDataFactory } from '../../utils/data/test-data.factory';

/**
 * Port of Java: PO18_CRLPage (locators) + Flow21_CRLPage (actions)
 *
 * Cross-page locator notes:
 *   - `profile`, `arrow`, `branchDropdown`, `customerManagementBtn`, `allCustomers`,
 *     `addCustomerBtn`, `leadSourceDropdown`, `firstNameCustomer`, `lastNameCustomer`,
 *     `mobileNumberCustomer`, `sendOtp`, `enterOtp`, `verify`, `stateDropdown`, `cityDropdown`,
 *     `pinCode`, `selGoldloan`, `addButton` re-declared from PO_CustomerManagement / inline flow.
 *
 * Omitted loginWith* calls:
 *   - Flow21_CRLPage.CRLRequestPage() sets branch via profile — no login switch, uses current session.
 *   - Delegates to Flow01_Kyc.ClickonKyc() and Flow02_KycApproval.performOpsRatingActions() at end —
 *     those are NOT ported here; the spec should call kyc.ClickonKyc() and kycApproval.performOpsRatingActions().
 */
export class CrlPagePage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO18_CRLPage) ─────────────────────────────────────────

  private readonly customerRequestList = () => this.page.locator("xpath=//span[normalize-space()='Customer Request List']");
  private readonly addLead = () => this.page.locator("xpath=//span[normalize-space()='Add Lead']");
  private readonly firstname = () => this.page.locator("xpath=//input[@placeholder='First Name']");
  private readonly lastname = () => this.page.locator("xpath=//input[@placeholder='Last Name']");
  private readonly mobileNumber = () => this.page.locator("xpath=//input[@placeholder='Mobile Number']");
  private readonly btnAdd = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  private readonly nameField = () => this.page.locator("xpath=//input[@id='mat-input-0']");
  private readonly view = () => this.page.locator("xpath=(//mat-icon[@role='img'][normalize-space()='visibility'])[1]");
  private readonly close = () => this.page.locator("xpath=//img[@class='kt-pointer']");
  private readonly btnExport = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Export']//button[@type='button']");
  private readonly btnDownload = () => this.page.locator("xpath=(//button[@type='button'])[33]");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly customerManagementBtn = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  private readonly allCustomers = () => this.page.locator("xpath=//span[normalize-space()='All Customers']");
  private readonly addCustomerBtn = () => this.page.locator("xpath=//button[normalize-space()='Add Customer']");
  private readonly leadSourceDropdown = () => this.page.locator("xpath=//select[@formcontrolname='leadSource']");
  private readonly firstNameCustomer = () => this.page.locator("xpath=//input[@formcontrolname='firstName']");
  private readonly lastNameCustomer = () => this.page.locator("xpath=//input[@formcontrolname='lastName']");
  private readonly mobileNumberCustomer = () => this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly sendOtp = () => this.page.locator("xpath=//button[normalize-space()='Send OTP']");
  private readonly enterOtp = () => this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly verify = () => this.page.locator("xpath=//button[normalize-space()='Verify']");
  private readonly stateDropdown = () => this.page.locator("xpath=//select[@formcontrolname='stateId']");
  private readonly cityDropdown = () => this.page.locator("xpath=//select[@formcontrolname='cityId']");
  private readonly branchDropdownInternal = () => this.page.locator("xpath=//select[@formcontrolname='internalBranchId']");
  private readonly pinCode = () => this.page.locator("xpath=//input[@formcontrolname='pinCode']");
  private readonly selGoldloan = () => this.page.locator("xpath=//select[@formcontrolname='loanType']");
  private readonly addButton = () => this.page.locator("xpath=//button[normalize-space()='Add']");
  private readonly crlMobileResult = () => this.page.locator("xpath=(//td[contains(@class,'ui-resizable-column')]/span[last()][normalize-space(text())])[4]");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow21_CRLPage.CRLRequestPage().
   * Sets branch (profile selector), creates a CRL lead, then adds customer from CRL mobile.
   * NOTE: Delegates to kyc flow at end — caller must follow up with kyc.ClickonKyc() and kycApproval.performOpsRatingActions().
   */
  async CRLRequestPage(): Promise<void> {
    const data = getLoginData();
    const mobileNumber = TestDataFactory.mobile();
    const pinCode = String(Math.floor(100000 + Math.random() * 900000));

    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(3000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.customerRequestList().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    // Add Lead via JS click
    await this.jsClick(this.addLead());
    await this.page.waitForTimeout(1500);

    await this.firstname().fill(data.firstName);
    await this.lastname().fill(data.lastName);
    await this.mobileNumber().fill(mobileNumber);

    await this.stateDropdown().selectOption({ label: data.state });
    await this.page.waitForTimeout(500);
    await this.cityDropdown().selectOption({ label: data.city });
    await this.page.waitForTimeout(500);
    await this.branchDropdownInternal().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(500);

    await this.btnAdd().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    // Capture the CRL mobile number from the result table row
    const crlMobile = await this.crlMobileResult().innerText().then(t => t.trim()).catch(() => mobileNumber);

    await this.page.waitForTimeout(3000);
    await this.page.reload();
    await this.page.waitForTimeout(3000);

    await this.arrow().click();
    await this.page.waitForTimeout(1000);
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers().click();
    await this.waitForLoaderToDisappear();
    await this.addCustomerBtn().click();
    await this.page.waitForTimeout(1000);

    await this.leadSourceDropdown().selectOption({ label: data.leadName });
    await this.page.waitForTimeout(500);

    await this.firstNameCustomer().fill(data.firstName);
    await this.lastNameCustomer().fill(data.lastName);
    await this.mobileNumberCustomer().fill(crlMobile);
    await this.sendOtp().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.enterOtp().fill('1234');
    await this.verify().click();
    await this.waitForLoaderToDisappear();

    await this.stateDropdown().selectOption({ label: data.state });
    await this.page.waitForTimeout(500);
    await this.cityDropdown().selectOption({ label: data.city });
    await this.page.waitForTimeout(500);
    await this.pinCode().fill(pinCode);
    await this.selGoldloan().selectOption({ label: 'Gold Loan' });
    await this.addButton().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Port of Flow21_CRLPage.viewFunctionality().
   */
  async viewFunctionality(): Promise<void> {
    const data = getLoginData();
    await this.nameField().fill(data.firstName);
    await this.view().click();
    await this.waitForLoaderToDisappear();
    await this.close().click();
    await this.waitForLoaderToDisappear();
  }
}
