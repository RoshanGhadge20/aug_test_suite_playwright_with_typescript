import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO17_AppraiserRequestPage (locators) + Flow20_AppraiserRequestPage (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` re-declares inline Flow20 XPath.
 *   - `customerManagementBtn` re-declares PO_CustomerManagement.loc_customer (same XPath).
 *   - `allCustomers` re-declares PO_CustomerManagement.loc_allcustomer (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `kebabMenu`, `startNewGL`, `btnAdd`, `appraisalRequest`, `textField` re-declared from PO04_NewGoldLoan.
 *
 * Omitted loginWith* calls:
 *   - Flow20_AppraiserRequestPage.validateAppraiserRequest() calls loginWithOPS() — OMITTED.
 *     Caller must inject loginAs('ops') before calling validateAppraiserRequest().
 */
export class AppraiserRequestPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO17_AppraiserRequestPage) ────────────────────────────

  private readonly btnUpadateAppraiser = () => this.page.locator("xpath=//mat-row[13]//mat-cell[12]//div[2]//button[1]");
  private readonly btnAppraiserName = () => this.page.locator("xpath=//select[@formcontrolname='appraiserId']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  private readonly customerManagementBtn = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  private readonly allCustomers = () => this.page.locator("xpath=//span[normalize-space()='All Customers']");
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly kebabMenu = () => this.page.locator("xpath=(//button[.//mat-icon[text()='more_vert']])[1]");
  private readonly startNewGL = () => this.page.locator("xpath=//button[normalize-space()='Start New Gold Loan']");
  private readonly btnAdd = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  private readonly appraisalRequest = () => this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
  private readonly textField = () => this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly scrollableTable = () => this.page.locator("xpath=//div[@class='mat-table__wrapper']");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow20_AppraiserRequestPage.validateAppraiserRequest().
   * Caller must first loginAs('ops').
   */
  async validateAppraiserRequest(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers().click();
    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.startNewGL().click();
    await this.waitForLoaderToDisappear();
    await this.btnAdd().click();
    await this.page.waitForTimeout(5000);

    await this.appraisalRequest().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.textField().fill(data.firstName);

    // Scroll table horizontally then back (Actions.scrollLeft/sendKeys.HOME equivalent)
    await this.scrollableTable().click();
    await this.scrollableTable().evaluate((el) => { (el as any).scrollLeft = (el as any).scrollWidth; });
    await this.page.waitForTimeout(3000);
    await this.scrollableTable().click();
    await this.scrollableTable().evaluate((el) => { (el as any).scrollLeft = 0; });
    await this.page.waitForTimeout(3000);

    await this.btnUpadateAppraiser().click();
    await this.waitForLoaderToDisappear();
    await this.btnAppraiserName().waitFor({ state: 'visible' });
    await this.btnAppraiserName().selectOption({ label: 'Priyanka Thorat' });
  }
}
