import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO04_NewGoldLoan (locators) + Flow04_NewGoldLoan (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator from Flow04 (same as CustomerManagementPage).
 *   - `customerManagementBtn` re-declares PO_CustomerManagement.loc_customer (same XPath).
 *   - `allCustomers` re-declares PO_CustomerManagement.loc_allcustomer (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `imgCamera` re-declares PO01_KycSel.loc_imgCamera (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow04_NewGoldLoan.validateGoldLoan() called Flow_LoginLogout.loginWithAppraiser() and
 *     Flow_LoginLogout.logout() — OMITTED. Role switching must be done by the caller via loginAs(role).
 *
 * File upload TODOs:
 *   - validateBasicDetails(): Income-generating document upload via sendKeys to (//input[@type='file'])[1].
 *     Best-effort Playwright: setInputFiles(). Caller must supply documentPath.
 *   - validateBankDetails(): Bank document upload via sendKeys to //input[@type='file'].
 *     Best-effort Playwright: setInputFiles(). Caller must supply documentPath.
 *     Both flagged DONE_WITH_CONCERNS — paths must be wired from test config/env vars.
 */
export class NewGoldLoanPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO04_NewGoldLoan) ──────────────────────────────────────

  private readonly kebabMenu = () => this.page.locator("xpath=(//button[.//mat-icon[text()='more_vert']])[1]");
  private readonly btnAdd = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  private readonly startNewGL = () => this.page.locator("xpath=//button[normalize-space()='Start New Gold Loan']");
  private readonly appraisalRequest = () => this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
  private readonly textField = () => this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly kebabMenu1 = () => this.page.locator("xpath=(//mat-row[.//*[contains(text(),'New Loan')]]//mat-icon[normalize-space()='more_vert'])[1]");
  private readonly kebabMenu2 = () => this.page.locator("xpath=(//mat-row[.//*[contains(text(),'Renew Loan')]]//mat-icon[normalize-space()='more_vert'])[1]");
  private readonly applyLoan = () => this.page.locator("xpath=//button[contains(@class,'mat-menu-item') and normalize-space(text())='Apply Loan']");
  private readonly btnOk = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly btnNext = () => this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  private readonly txtNameField = () => this.page.locator("xpath=//input[@formcontrolname='nomineeName']");
  private readonly txtNomineeAge = () => this.page.locator("xpath=//input[@formcontrolname='nomineeAge']");
  private readonly txtNomineeRelationship = () => this.page.locator("xpath=//input[@formcontrolname='relationship']");
  private readonly toBePaid = () => this.page.locator("xpath=//td[normalize-space(text())='To be paid']/following-sibling::td[@class='currency']");
  private readonly advanceCashField = () => this.page.locator("xpath=//td//input[@formcontrolname='advanceCash']");
  private readonly txtMobileNumber = () => this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly ornamentType = () => this.page.locator("xpath=//input[@role='combobox']");
  private readonly numberOfPieces = () => this.page.locator("xpath=//input[@formcontrolname='quantity']");
  private readonly grossWt = () => this.page.locator("xpath=//input[@formcontrolname='grossWeight']");
  private readonly deductionWt = () => this.page.locator("xpath=//input[@formcontrolname='deductionWeight']");
  private readonly btnAttach = () => this.page.locator("xpath=(//button[@type='button'])[3]");
  private readonly imgAttach = () => this.page.locator("xpath=//img[@class='placeholder-image']");
  private readonly btnAttach1 = () => this.page.locator("xpath=(//button[@type='button'])[4]");
  private readonly selKarat = () => this.page.locator("xpath=//select[@formcontrolname='karat']");
  private readonly selPurity = () => this.page.locator("xpath=//select[@formcontrolname='ltvPercent']");
  private readonly selPartner = () => this.page.locator("xpath=//select[@formcontrolname='partnerId']");
  private readonly selScheme = () => this.page.locator("xpath=//select[@formcontrolname='schemeId']");
  private readonly loanAmount = () => this.page.locator("xpath=//input[@formcontrolname='finalLoanAmount']");
  private readonly btnCalculate = () => this.page.locator("xpath=//button[contains(@class, \"mat-raised-button\") and contains(@class, \"mat-primary\") and .//span[normalize-space(text()) = \"Calculate\"]]");
  private readonly ifsc = () => this.page.locator("xpath=//input[@formcontrolname='ifscCode']");
  private readonly bankAccount = () => this.page.locator("xpath=//input[@formcontrolname='accountNumber']");
  private readonly verifyBankDetails = () => this.page.locator("xpath=(//div[@class='mat-button-ripple mat-ripple'])[3]");
  private readonly loanAmountField = () => this.page.locator("xpath=//td[normalize-space(.)='Loan Amount']/following-sibling::td[contains(@class,'currency')]");
  private readonly document = () => this.page.locator("xpath=(//input[@type='file'])[1]");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown from Flow04
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO_CustomerManagement.loc_customer
  private readonly customerManagementBtn = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  // PO_CustomerManagement.loc_allcustomer
  private readonly allCustomers = () => this.page.locator("xpath=//span[normalize-space()='All Customers']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  // PO01_KycSel.loc_imgCamera
  private readonly imgCamera = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");

  // ── Actions (from Flow04_NewGoldLoan) ──────────────────────────────────────

  /**
   * Port of Java Flow04_NewGoldLoan.validateGoldLoan().
   *
   * NOTE: loginWithAppraiser() and logout() calls are OMITTED.
   * Role switching must be handled by the caller via loginAs('appraiser').
   */
  async validateGoldLoan(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(3000);

    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
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
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(7000);

    await this.appraisalRequest().waitFor({ state: 'visible' });
    await this.appraisalRequest().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);
    await this.textField().fill(data.firstName);
    await this.waitForLoaderToDisappear();

    const scrollDiv = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollDiv.click();
    await this.page.evaluate(
      (el) => { (el as any).scrollLeft = (el as any).scrollWidth; },
      await scrollDiv.elementHandle(),
    );
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(3000);

    await this.jsClick(this.kebabMenu1());
    await this.jsClick(this.applyLoan());

    await this.btnOk().click();
    await this.waitForLoaderToDisappear();

    await this.validateBasicDetails();
    await this.validateNomineeDetails();
    await this.validateOrnaments();
    await this.validateFICPage();
    await this.validateBankDetails();
  }

  /**
   * Port of Java Flow04_NewGoldLoan.validateBasicDetails().
   *
   * TODO(port): Income-generating document upload — Java used sendKeys to (//input[@type='file'])[1].
   * Best-effort Playwright: setInputFiles(documentPath). Caller must supply documentPath.
   */
  async validateBasicDetails(documentPath?: string): Promise<void> {
    await this.page.waitForTimeout(3000);

    const purposeDropdown = this.page.locator("xpath=//select[@formcontrolname='purpose']");
    await purposeDropdown.scrollIntoViewIfNeeded();
    await purposeDropdown.selectOption({ label: 'Business Expansion' });

    // TODO(port): Income-generating document upload — Java used sendKeys to hidden file input.
    // Best-effort: setInputFiles(). documentPath must be supplied from test config/env vars.
    if (documentPath) {
      const fileInput = this.page.locator("xpath=(//input[@type='file'])[1]");
      await this.page.waitForTimeout(15000);
      await fileInput.setInputFiles(documentPath);
    }

    const nextButton = this.btnNext();
    await nextButton.scrollIntoViewIfNeeded();
    await this.jsClick(this.btnNext());
  }

  /**
   * Port of Java Flow04_NewGoldLoan.validateNomineeDetails().
   */
  async validateNomineeDetails(): Promise<void> {
    await this.txtNameField().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(500);
    await this.txtNameField().click();
    await this.txtNameField().fill('Suman');

    await this.txtNomineeAge().waitFor({ state: 'visible' });
    await this.txtNomineeAge().click();
    await this.txtNomineeAge().fill('50');

    const relationDropdown = this.page.locator("xpath=//select[contains(@class,'form-control') and @formcontrolname='relationship']");
    await relationDropdown.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await relationDropdown.selectOption({ label: 'Mother' });

    await this.page.waitForTimeout(500);
    await this.txtMobileNumber().waitFor({ state: 'visible' });
    await this.txtMobileNumber().click();
    await this.txtMobileNumber().fill('7567201900');

    await this.page.waitForTimeout(2000);
    await this.jsClick(this.btnNext());
  }

  /**
   * Port of Java Flow04_NewGoldLoan.validateOrnaments().
   */
  async validateOrnaments(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.page.evaluate('window.scrollBy(0, 1000)');
    await this.page.waitForTimeout(3000);
    await this.page.evaluate('window.scrollBy(0, -500)');
    await this.page.waitForTimeout(5000);

    for (let i = 0; i < 2; i++) {
      const dropdown = this.page.locator(
        "xpath=//input[@role='combobox']//following::span[@class='ng-arrow-wrapper']",
      );
      await dropdown.waitFor({ state: 'visible' });
      await dropdown.evaluate((el) => (el as any).scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await this.page.waitForTimeout(1000);
      await dropdown.click();

      const indexToClick = 4 + i;
      const opts = this.page.locator("xpath=//span[@class='ng-option-label ng-star-inserted']");
      await opts.nth(indexToClick).waitFor({ state: 'visible' });
      await opts.nth(indexToClick).click();

      await this.page.waitForTimeout(5000);
      await this.numberOfPieces().fill('1');
      await this.waitForLoaderToDisappear();

      await this.enterGrossAndDeductionDecimal();
      await this.page.waitForTimeout(2000);

      await this.btnAttach().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);

      await this.imgCamera().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);

      await this.imgAttach().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);

      await this.imgCamera().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);

      await this.selKarat().selectOption({ label: '22 K HM' });
      await this.selPurity().selectOption({ label: '98 %' });

      if (i === 0) {
        const addMoreBtn = this.page.locator("xpath=//button[normalize-space()='+ Add More']");
        await addMoreBtn.waitFor({ state: 'visible' });
        await addMoreBtn.evaluate((el) => (el as any).scrollIntoView({ behavior: 'smooth', block: 'center' }));
        await this.page.waitForTimeout(2000);
        await addMoreBtn.click();
      }
    }

    const nextButton = this.btnNext();
    await nextButton.evaluate((el) => (el as any).scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await this.jsClick(this.btnNext());
  }

  /**
   * Port of Java Flow04_NewGoldLoan.enterGrossAndDeductionDecimal().
   */
  async enterGrossAndDeductionDecimal(): Promise<void> {
    const grossWt = 10.0 + Math.random() * 40.0;
    const maxDed = Math.min(1.0, grossWt);
    const deductionWt = Math.random() * maxDed;

    const grossStr = grossWt.toFixed(1);
    const dedStr = deductionWt.toFixed(1);

    await this.grossWt().fill(grossStr);
    await this.deductionWt().fill(dedStr);
  }

  /**
   * Port of Java Flow04_NewGoldLoan.validateFICPage().
   */
  async validateFICPage(): Promise<void> {
    await this.page.waitForTimeout(5000);

    await this.selPartner().selectOption({ label: 'KHARATMOL SK' });
    await this.page.waitForTimeout(4000);

    await this.selScheme().selectOption({ label: '[ALL] PURPOSE IGL +CONSUMPTION (0 - 3000000)' });
    await this.page.waitForTimeout(2000);

    await this.loanAmount().fill('100000');
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const calculateBtn = this.page.locator("xpath=//button[.//span[normalize-space(text())='Calculate']]");
    await calculateBtn.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await calculateBtn.dblclick();
    await this.page.waitForTimeout(3000);
    await calculateBtn.click();
    await this.page.waitForTimeout(2000);

    await this.jsClick(this.btnNext());
  }

  /**
   * Port of Java Flow04_NewGoldLoan.validateBankDetails().
   *
   * TODO(port): Bank document upload — Java used sendKeys to //input[@type='file'].
   * Best-effort Playwright: setInputFiles(). Caller must supply documentPath.
   */
  async validateBankDetails(documentPath?: string): Promise<void> {
    const data = getLoginData();

    await this.page.evaluate('window.scrollBy(0, 1000);');
    await this.page.waitForTimeout(2000);

    const loanAmtEl = this.loanAmountField();
    await loanAmtEl.evaluate((el) => (el as any).scrollIntoView(true));
    await this.page.waitForTimeout(1000);
    await this.page.evaluate('window.scrollBy(0, -150);');
    await this.page.waitForTimeout(500);
    await loanAmtEl.waitFor({ state: 'visible' });
    await loanAmtEl.click();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('Tab');

    const wavierField = this.page.locator("xpath=//input[@formcontrolname='wavier']");
    await wavierField.clear();
    await this.page.waitForTimeout(3000);
    await wavierField.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);

    await this.ifsc().fill(data.ifsc);
    await this.waitForLoaderToDisappear();

    await this.bankAccount().fill(data.accountNumber);
    await this.waitForLoaderToDisappear();

    // TODO(port): Bank document upload — Java used sendKeys to //input[@type='file'].
    // Best-effort Playwright: setInputFiles(). documentPath must be supplied from test config/env vars.
    if (documentPath) {
      const fileInput = this.page.locator("xpath=//input[@type='file']");
      await this.page.waitForTimeout(7000);
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(15000);
      await fileInput.setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
    }

    await this.waitForLoaderToDisappear();

    const verifyBtn = this.page.locator(
      "xpath=//button[contains(@class, 'submit') and contains(normalize-space(.), 'Verify Bank Details')]",
    );
    await verifyBtn.waitFor({ state: 'visible' });
    await this.jsClick(verifyBtn);

    await this.page.waitForTimeout(1000);
    await this.btnOk().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.jsClick(this.btnNext());
  }

  /**
   * Port of Java Flow04_NewGoldLoan.validateBankDetailsWithAdvanceCash().
   */
  async validateBankDetailsWithAdvanceCash(): Promise<void> {
    await this.page.reload();
    await this.page.waitForTimeout(5000);

    await this.page.evaluate('window.scrollBy(0, 1000);');
    await this.page.waitForTimeout(2000);

    const loanAmtEl = this.loanAmountField();
    await loanAmtEl.evaluate((el) => (el as any).scrollIntoView(true));
    await this.page.waitForTimeout(1000);
    await this.page.evaluate('window.scrollBy(0, -150);');
    await this.page.waitForTimeout(500);
    await loanAmtEl.waitFor({ state: 'visible' });
    await loanAmtEl.click();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('Tab');

    const wavierField = this.page.locator("xpath=//input[@formcontrolname='wavier']");
    await wavierField.clear();
    await this.page.waitForTimeout(3000);
    await wavierField.scrollIntoViewIfNeeded();

    const toBePaidEl = this.toBePaid();
    await toBePaidEl.scrollIntoViewIfNeeded();
    const str = (await toBePaidEl.innerText()).trim();
    const numericValue = str.replace(/[^0-9]/g, '');

    const advanceCashEl = this.advanceCashField();
    await advanceCashEl.evaluate((el) => (el as any).scrollIntoView({ block: 'center' }));
    await advanceCashEl.clear();
    await advanceCashEl.fill(numericValue);
    await this.page.waitForTimeout(4000);

    await this.page.waitForTimeout(5000);
    await this.jsClick(this.btnNext());
  }

  /**
   * Port of Java Flow04_NewGoldLoan.safeClick().
   * Clicks the Next button using jsClick for reliability.
   */
  async safeClick(): Promise<void> {
    await this.jsClick(this.btnNext());
  }
}
