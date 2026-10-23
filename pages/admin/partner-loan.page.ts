import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: Flow25_ApplyLoanWithPartnerLoan (actions)
 * No dedicated PO — reuses PO04_NewGoldLoan locators (re-declared here).
 *
 * Role split:
 *   - validateLoanwithPartner() has several role switches:
 *     1. onboardCustomerThroughKyc (handled by flow in spec precondition)
 *     2. loginWithAppraiser: navigate appraiser requests, apply loan, FIC, bank details.
 *     3. login (ops): continues from prior flow — handled by caller as loginAs('ops').
 *     4. Various downstream flows (Flow05..Flow09) already ported as separate POs.
 *   - validateLoanwithPartner() is exposed as the main entry; the spec handles role injection.
 *
 * Omitted loginWith* calls:
 *   - All loginWith* removed. Caller must inject loginAs() at appropriate boundaries.
 */
export class PartnerLoanPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO04_NewGoldLoan, re-declared) ────────────────────────

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
  private readonly appraiserRequests = () => this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
  private readonly textField = () => this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly kebabMenu1 = () => this.page.locator("xpath=(//mat-row[.//*[contains(text(),'New Loan')]]//mat-icon[normalize-space()='more_vert'])[1]");
  private readonly applyLoan = () => this.page.locator("xpath=//button[normalize-space()='Apply Loan']");
  private readonly btnOk = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly btnNext = () => this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  private readonly purposeDropdown = () => this.page.locator("xpath=//select[@formcontrolname='purpose']");
  private readonly txtNameField = () => this.page.locator("xpath=//input[@formcontrolname='nomineeName']");
  private readonly txtNomineeAge = () => this.page.locator("xpath=//input[@formcontrolname='nomineeAge']");
  private readonly relationDropdown = () => this.page.locator("xpath=//select[contains(@class,'form-control') and @formcontrolname='relationship']");
  private readonly txtMobileNumber = () => this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly ornamentDropdownArrow = () => this.page.locator("xpath=//input[@role='combobox']//following::span[@class='ng-arrow-wrapper']");
  private readonly ornamentOptions = () => this.page.locator("xpath=//span[@class='ng-option-label ng-star-inserted']");
  private readonly numberOfPieces = () => this.page.locator("xpath=//input[@formcontrolname='quantity']");
  private readonly grossWeight = () => this.page.locator("xpath=//input[@formcontrolname='grossWeight']");
  private readonly deductionWeight = () => this.page.locator("xpath=//input[@formcontrolname='deductionWeight']");
  private readonly btnAttach = () => this.page.locator("xpath=(//button[@type='button'])[3]");
  private readonly imgAttach = () => this.page.locator("xpath=//img[@class='placeholder-image']");
  private readonly imgCamera = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");
  private readonly selKarat = () => this.page.locator("xpath=//select[@formcontrolname='karat']");
  private readonly selPurity = () => this.page.locator("xpath=//select[@formcontrolname='ltvPercent']");
  private readonly addMoreBtn = () => this.page.locator("xpath=//button[normalize-space()='+ Add More']");
  private readonly selPartner = () => this.page.locator("xpath=//select[@formcontrolname='partnerId']");
  private readonly selScheme = () => this.page.locator("xpath=//select[@formcontrolname='schemeId']");
  private readonly loanAmount = () => this.page.locator("xpath=//input[@formcontrolname='finalLoanAmount']");
  private readonly calculateBtn = () => this.page.locator("xpath=//button[.//span[normalize-space(text())='Calculate']]");
  private readonly loanAmountField = () => this.page.locator("xpath=//td[normalize-space(.)='Loan Amount']/following-sibling::td[contains(@class,'currency')]");
  private readonly toBePaid = () => this.page.locator("xpath=//td[normalize-space(text())='To be paid']/following-sibling::td[@class='currency']");
  private readonly advanceCashField = () => this.page.locator("xpath=//td//input[@formcontrolname='advanceCash']");
  private readonly wavierInput = () => this.page.locator("xpath=//input[@formcontrolname='wavier']");
  private readonly scrollableTable = () => this.page.locator("xpath=//div[@class='mat-table__wrapper']");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow25_ApplyLoanWithPartnerLoan.validateLoanwithPartner() — appraiser segment.
   * Caller must first loginAs('appraiser').
   */
  async validateLoanwithPartner_appraiserPart(): Promise<void> {
    const data = getLoginData();

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — confirmed live (renew-zero.page.ts,
    // loan-defects.page.ts) that switching this account's branch scope gets the backend to
    // reject the session outright (403/401, forced redirect to /auth/login).
    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers().click();
    await this.waitForLoaderToDisappear();
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
    await this.page.waitForTimeout(3000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
    await this.appraiserRequests().waitFor({ state: 'visible' });
    await this.appraiserRequests().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.textField().fill(data.firstName);

    await this.scrollableTable().click();
    await this.scrollableTable().evaluate((el) => { (el as any).scrollLeft = (el as any).scrollWidth; });
    await this.page.waitForTimeout(3000);
    await this.scrollableTable().click();
    await this.scrollableTable().evaluate((el) => { (el as any).scrollLeft = 0; });
    await this.page.waitForTimeout(3000);

    await this.jsClick(this.kebabMenu1());
    await this.jsClick(this.applyLoan());
    await this.btnOk().click();
    await this.waitForLoaderToDisappear();

    await this.validateBasicDetails();
    await this.validateNomineeDetails();
    await this.validateOrnaments();
    await this.validateFICPage();
    await this.validateBankDetailsWithAdvanceCash();
  }

  async validateBasicDetails(): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.purposeDropdown().scrollIntoViewIfNeeded().catch(() => {});
    await this.purposeDropdown().selectOption({ label: 'Business Expansion' });
    await this.btnNext().scrollIntoViewIfNeeded().catch(() => {});
    await this.safeClick(this.btnNext());
  }

  async validateNomineeDetails(): Promise<void> {
    await this.txtNameField().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(500);
    await this.txtNameField().click();
    await this.txtNameField().clear();
    await this.txtNameField().fill('Suman');

    await this.txtNomineeAge().waitFor({ state: 'visible' });
    await this.txtNomineeAge().click();
    await this.txtNomineeAge().clear();
    await this.txtNomineeAge().fill('50');

    await this.relationDropdown().waitFor({ state: 'visible' });
    await this.relationDropdown().selectOption({ label: 'Mother' });

    await this.txtMobileNumber().waitFor({ state: 'visible' });
    await this.txtMobileNumber().click();
    await this.txtMobileNumber().clear();
    await this.txtMobileNumber().fill('7567201900');
    await this.page.waitForTimeout(2000);
    await this.safeClick(this.btnNext());
  }

  async validateOrnaments(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.page.evaluate('window.scrollBy(0, 1000)');
    await this.page.waitForTimeout(3000);
    await this.page.evaluate('window.scrollBy(0, -500)');
    await this.page.waitForTimeout(5000);

    for (let i = 0; i < 2; i++) {
      await this.ornamentDropdownArrow().waitFor({ state: 'visible' });
      await this.ornamentDropdownArrow().scrollIntoViewIfNeeded().catch(() => {});
      await this.page.waitForTimeout(1000);
      await this.ornamentDropdownArrow().click();

      const opts = await this.ornamentOptions().all();
      const indexToClick = 4 + i;
      if (opts.length > indexToClick) {
        await opts[indexToClick].click();
      }

      await this.page.waitForTimeout(5000);
      await this.numberOfPieces().fill('1');
      await this.enterGrossAndDeductionDecimal(300.0);

      await this.page.waitForTimeout(2000);
      await this.btnAttach().click();
      await this.page.waitForTimeout(2000);
      await this.imgCamera().click();
      await this.page.waitForTimeout(2000);
      await this.imgAttach().click();
      await this.page.waitForTimeout(2000);
      await this.imgCamera().click();
      await this.page.waitForTimeout(2000);

      await this.selKarat().selectOption({ label: '22 K HM' });
      await this.selPurity().selectOption({ label: '98 %' });

      if (i === 0) {
        await this.addMoreBtn().scrollIntoViewIfNeeded().catch(() => {});
        await this.page.waitForTimeout(2000);
        await this.addMoreBtn().click();
      }
    }

    await this.btnNext().scrollIntoViewIfNeeded().catch(() => {});
    await this.safeClick(this.btnNext());
  }

  async validateFICPage(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.selPartner().selectOption({ label: 'ARVOG ARV-10' });
    await this.page.waitForTimeout(2000);
    await this.selScheme().selectOption({ label: 'W0 (0 - 5000000)' });
    await this.page.waitForTimeout(2000);
    await this.loanAmount().fill('75000');
    await this.page.waitForTimeout(5000);

    await this.calculateBtn().waitFor({ state: 'visible' });
    await this.calculateBtn().dblclick();
    await this.calculateBtn().click();
    await this.page.waitForTimeout(3000);

    await this.safeClick(this.btnNext());
  }

  async validateBankDetailsWithAdvanceCash(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.page.evaluate('window.scrollBy(0, 1000)');
    await this.page.waitForTimeout(2000);

    await this.loanAmountField().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1000);
    await this.page.evaluate('window.scrollBy(0, -150)');
    await this.page.waitForTimeout(500);
    await this.loanAmountField().waitFor({ state: 'visible' });
    await this.loanAmountField().click();
    await this.page.keyboard.press('Tab');

    await this.wavierInput().clear();
    await this.page.waitForTimeout(3000);
    await this.wavierInput().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(3000);

    await this.toBePaid().scrollIntoViewIfNeeded().catch(() => {});
    const str = await this.toBePaid().innerText().then(t => t.trim()).catch(() => '');
    const numericValue = str.replace(/[^0-9]/g, '');

    await this.advanceCashField().scrollIntoViewIfNeeded().catch(() => {});
    await this.advanceCashField().waitFor({ state: 'visible' });
    await this.advanceCashField().clear();
    await this.advanceCashField().fill(numericValue);
    await this.page.waitForTimeout(4000);
    await this.safeClick(this.btnNext());
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async enterGrossAndDeductionDecimal(grossWt: number): Promise<void> {
    const maxDed = Math.min(1.0, grossWt);
    const deductionWt = Math.random() * maxDed;
    await this.grossWeight().fill(grossWt.toFixed(1));
    await this.deductionWeight().fill(deductionWt.toFixed(1));
  }

  private async safeClick(locator: ReturnType<typeof this.page.locator>): Promise<void> {
    try {
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await locator.waitFor({ state: 'visible', timeout: 30000 });
      await locator.click();
    } catch {
      await this.jsClick(locator);
    }
  }
}
