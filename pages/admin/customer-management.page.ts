import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';
import { TestDataFactory } from '../../utils/data/test-data.factory';

/**
 * Port of Java: PO_CustomerManagement (locators) + Flow_CustomerManagement (actions)
 *
 * Cross-page locator note:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `branchDropdown` is an inline locator from Flow_CustomerManagement (no dedicated PO entry).
 */
export class CustomerManagementPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO_CustomerManagement) ──────────────────────────────────

  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly customer = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  private readonly allcustomer = () => this.page.locator("xpath=//span[normalize-space()='All Customers']");
  private readonly addCustomer = () => this.page.locator("xpath=//span[normalize-space()='Add Customer']");
  private readonly selectlead = () => this.page.locator("xpath=//select[@formcontrolname='leadSource']");
  private readonly firstName = () => this.page.locator("xpath=//input[@placeholder='First Name']");
  private readonly lastName = () => this.page.locator("xpath=//input[@placeholder='Last Name']");
  private readonly mobileNumber = () => this.page.locator("xpath=//input[@placeholder='Enter mobile number']");
  private readonly sendOtp = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base w-100 mat-primary ng-star-inserted']");
  private readonly enterOtp = () => this.page.locator("xpath=//input[@placeholder='Enter OTP']");
  private readonly verify = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']");
  private readonly selState = () => this.page.locator("xpath=//select[@formcontrolname='stateId']");
  private readonly selCity = () => this.page.locator("xpath=//select[@formcontrolname='cityId']");
  private readonly pinCode = () => this.page.locator("xpath=//input[@placeholder='000 000']");
  private readonly selGoldloan = () => this.page.locator("xpath=//select[@formcontrolname='moduleId']");
  private readonly addButton = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");

  // Cross-page re-declaration: PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // Inline locator used in Flow_CustomerManagement (branch selector)
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");

  // ── Actions (from Flow_CustomerManagement) ─────────────────────────────────

  /**
   * Port of Java Flow_CustomerManagement.clickOnCustomerManagementButton().
   * Selects the branch from the profile dropdown, navigates to Customer Management,
   * then calls selectLead(), SearchInput() and the random generators inline.
   */
  async clickOnCustomerManagementButton(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.waitForLoaderToDisappear();

    await this.branchDropdown().selectOption({ label: data.branchName });

    await this.page.waitForTimeout(7000);
    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.customer().click();
    await this.waitForLoaderToDisappear();
    await this.allcustomer().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    await this.addCustomer().click();
    await this.waitForLoaderToDisappear();

    await this.selectLead();
    await this.SearchInput();
  }

  /**
   * Port of Java Flow_CustomerManagement.selectLead().
   * Tries to select leadName from the dropdown; falls back to first non-empty option.
   */
  async selectLead(): Promise<void> {
    const data = getLoginData();
    const dropdown = this.selectlead();
    await dropdown.waitFor({ state: 'visible' });
    // leadSource options load asynchronously; wait until more than the placeholder is present.
    for (let i = 0; i < 15 && (await dropdown.locator('option').count()) <= 1; i++) {
      await this.page.waitForTimeout(1000);
    }

    const options = (await dropdown.locator('option').allTextContents()).map((o) => o.trim());
    // Exclude placeholder options ("Select Lead", "-- Select --", "Choose...") — they are
    // typically disabled, so selecting one would hang.
    const realOptions = options.filter((o) => o && !/^(--\s*)?select\b/i.test(o) && !/^choose\b/i.test(o));

    const target = data.leadName && realOptions.includes(data.leadName.trim())
      ? data.leadName.trim()
      : realOptions[0];
    if (!target) throw new Error('No selectable lead options in leadSource dropdown');
    await dropdown.selectOption({ label: target });
  }

  /**
   * Port of Java Flow_CustomerManagement.SearchInput().
   * Fills customer form fields with test data and submits.
   */
  async SearchInput(): Promise<void> {
    const data = getLoginData();
    const mobileNumber = TestDataFactory.mobile();
    const pinCodeVal = this.generateRandomPin();

    await this.firstName().fill(data.firstName);
    await this.waitForLoaderToDisappear();

    await this.lastName().fill(data.lastName);
    await this.waitForLoaderToDisappear();

    await this.mobileNumber().fill(mobileNumber);
    await this.waitForLoaderToDisappear();

    await this.sendOtp().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(500);
    await this.enterOtp().fill('1234');
    await this.waitForLoaderToDisappear();

    await this.verify().click();
    await this.waitForLoaderToDisappear();

    await this.selState().selectOption({ label: data.state });

    await this.page.waitForTimeout(500);
    await this.selCity().selectOption({ label: data.city });

    await this.pinCode().fill(pinCodeVal);
    await this.waitForLoaderToDisappear();

    await this.selectAsGoldLoan();

    await this.addButton().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of Java Flow_CustomerManagement.generateRandomMobile().
   * Kept here for completeness; prefer TestDataFactory.mobile() in specs.
   */
  generateRandomMobile(): string {
    return TestDataFactory.mobile();
  }

  /**
   * Port of Java Flow_CustomerManagement.generateRandomPin().
   */
  generateRandomPin(): string {
    return String(Math.floor(100_000 + Math.random() * 900_000));
  }

  /**
   * Port of Java Flow_CustomerManagement.parameterSelection().
   */
  async parameterSelection(parameter: string): Promise<void> {
    await this.selGoldloan().selectOption({ label: parameter });
  }

  /**
   * Port of Java Flow_CustomerManagement.selectAsGoldLoan().
   */
  async selectAsGoldLoan(): Promise<void> {
    await this.parameterSelection('Gold Loan');
  }

  /**
   * Port of Java Flow19_AddCustomer.validateDuplicateMobile().
   * Navigates to Add Customer, fills form with a duplicate mobile (9123456789),
   * clicks Send OTP, and checks for the duplicate-mobile error toast.
   * Returns the error element text for soft assertion in spec.
   */
  async validateDuplicateMobile(): Promise<string> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(5000);
    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.customer().click();
    await this.waitForLoaderToDisappear();
    await this.allcustomer().click();
    await this.waitForLoaderToDisappear();
    await this.addCustomer().click();
    await this.waitForLoaderToDisappear();
    await this.selectLead();
    await this.firstName().fill(data.firstName);
    await this.lastName().fill(data.lastName);
    await this.mobileNumber().fill('9123456789');
    await this.page.waitForTimeout(500);
    await this.sendOtp().click();
    await this.waitForLoaderToDisappear();
    await this.selState().selectOption({ label: data.state });
    await this.page.waitForTimeout(2000);
    const errorLocator = this.page.locator("xpath=//div[@aria-label='Mobile number is already exist.']");
    const errorText = await errorLocator.innerText().catch(() => '');
    return errorText;
  }
}
