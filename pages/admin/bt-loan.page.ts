import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO46_BTLoan (locators) + Flow67_ValidateForBTLoan + Flow69_ValidateIncompleteFolwBTLoan.
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator from Flow67/69/70 (same pattern as CustomerManagementPage).
 *   - `customerManagementBtn` re-declares PO_CustomerManagement.loc_customer (same XPath).
 *   - `allCustomers` re-declares PO_CustomerManagement.loc_allcustomer (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `kebabMenu` re-declares PO04_NewGoldLoan.loc_kebabMenu (same XPath).
 *   - `btnAdd` re-declares PO04_NewGoldLoan.loc_btnAdd (same XPath).
 *   - `textField` re-declares PO04_NewGoldLoan.loc_textField (same XPath).
 *   - `btnNext` re-declares PO04_NewGoldLoan.loc_btnNext (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow67/69/70 called Flow_LoginLogout.loginWithAppraiser() — OMITTED.
 *     Role switching must be handled by the caller via loginAs('appraiser').
 *
 * File upload TODOs:
 *   - validateBankDetails(): bank document upload via sendKeys to //input[@type='file'].
 *     Best-effort Playwright: setInputFiles(). No path wired (C:\\ path omitted per rules).
 *   - uploadDocuments(): multiple file inputs via (//input[@type='file'])[1/2/7/8].
 *     Best-effort Playwright: setInputFiles(). No path wired (C:\\ path omitted per rules).
 *
 * Approval thresholds (from Flow67 constants):
 *   - RCH only:           loan < 10 Lakhs
 *   - RCH + RH:           10 Lakhs ≤ loan < 25 Lakhs
 *   - RCH + RH + ZH:      25 Lakhs ≤ loan < 50 Lakhs
 *   - RCH+RH+ZH+ZAH+CEO:  loan > 50 Lakhs
 */
export class BtLoanPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO46_BTLoan) ───────────────────────────────────────────

  private readonly startNewBTProcess = () => this.page.locator("xpath=//button[normalize-space()='Start New BT Process']");

  private readonly clickBankNameBox = () => this.page.locator("xpath=//span[@class='ng-arrow-wrapper']");

  private readonly clickBankName = () => this.page.locator("xpath=(//span[@class='checkmark checkmark-custom'])[2]");

  private readonly companyType = () => this.page.locator("xpath=//select[@id='companyType']");

  private readonly loanNumber = () => this.page.locator("xpath=//input[@id='loanNumber']");

  private readonly loanAmount = () => this.page.locator("xpath=//input[@id='loanAmount']");

  private readonly releaseAmount = () => this.page.locator("xpath=//input[@id='releaseAmount']");

  private readonly loanStartDate = () => this.page.locator("xpath=//input[@formcontrolname='loanStartDate']");

  private readonly dateArrow = () => this.page.locator("xpath=//div[@class='mat-calendar-arrow']");

  private readonly year = () => this.page.locator("xpath=//div[@class='mat-calendar-body-cell-content mat-calendar-body-selected mat-calendar-body-today']");

  private readonly month = () => this.page.locator("xpath=//div[@class='mat-calendar-body-cell-content mat-calendar-body-selected mat-calendar-body-today']");

  private readonly date = () => this.page.locator("xpath=//div[@class='mat-calendar-body-cell-content mat-calendar-body-selected']");

  private readonly loanEndDate = () => this.page.locator("xpath=//input[@formcontrolname='loanEndDate']");

  private readonly btnNext = () => this.page.locator("xpath=//span[normalize-space()='Next']");

  private readonly addJwellaryDetails = () => this.page.locator("xpath=(//button[normalize-space()='Add Scheme Details'])[1]");

  private readonly kebabMenu1 = () => this.page.locator("xpath=(//mat-row[.//*[contains(text(),'BT Loan')]]//mat-icon[normalize-space()='more_vert'])[1]");

  private readonly noOfPieces = () => this.page.locator("xpath=//input[@placeholder='Number of pieces']");

  private readonly selPurity = () => this.page.locator("xpath=//select[@formcontrolname='purity']");

  private readonly selKarat = () => this.page.locator("xpath=//select[@formcontrolname='karat']");

  private readonly selPartner = () => this.page.locator("xpath=//select[@formcontrolname='partnerId']");

  private readonly selLoanTenuar = () => this.page.locator("xpath=//select[@formcontrolname='loanTenuar']");

  private readonly selRepaymentCycle = () => this.page.locator("xpath=//select[@formcontrolname='repaymentCycle']");

  private readonly btnRadio = () => this.page.locator("xpath=//input[@type='radio']");

  private readonly loanRequiredAmount = () => this.page.locator("xpath=//input[@id='loanAmount']");

  private readonly accountNumber = () => this.page.locator("xpath=//input[@placeholder='Account Number']");

  private readonly ifscCode = () => this.page.locator("xpath=//input[@placeholder='IFSC Code']");

  private readonly btnVerifyBankDetails = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Verify Bank Details']//button[@type='button']");

  private readonly img = () => this.page.locator("xpath=//img[@alt='placeholder']");

  private readonly imgCamera = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");

  private readonly btnRCHapproval = () => this.page.locator("xpath=//button[normalize-space()='RCH Approval']");

  private readonly selapproval = () => this.page.locator("xpath=//select[@id='approvalStatus']");

  private readonly comments = () => this.page.locator("xpath=//textarea[@id='comments']");

  private readonly btnSubmit = () => this.page.locator("xpath=//span[normalize-space()='Submit']");

  private readonly btnAddExistingBT = () => this.page.locator("xpath=//button[normalize-space()='Add Existing BT']");

  private readonly customer = () => this.page.locator("xpath=(//p[contains(.,'CID')])[1]");

  private readonly btnRHapproval = () => this.page.locator("xpath=//button[normalize-space()='RH Approval']");

  private readonly btnZHapproval = () => this.page.locator("xpath=//button[normalize-space()='ZH Approval']");

  private readonly btnZAHapproval = () => this.page.locator("xpath=//button[normalize-space()='ZAH Approval']");

  private readonly btnCEOapproval = () => this.page.locator("xpath=//button[normalize-space()='CEO Approval']");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown from Flow67/69/70
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO_CustomerManagement.loc_customer
  private readonly customerManagementBtn = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  // PO_CustomerManagement.loc_allcustomer
  private readonly allCustomers = () => this.page.locator("xpath=//span[normalize-space()='All Customers']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  // PO04_NewGoldLoan.loc_kebabMenu
  private readonly kebabMenu = () => this.page.locator("xpath=(//button[.//mat-icon[text()='more_vert']])[1]");
  // PO04_NewGoldLoan.loc_btnAdd
  private readonly btnAdd = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  // PO04_NewGoldLoan.loc_textField
  private readonly textField = () => this.page.locator("xpath=//input[@placeholder='enter text here']");

  // ── Approval thresholds (from Flow67 constants) ───────────────────────────

  private readonly RH_APPROVAL_THRESHOLD = 1000000;   // 10 Lakhs
  private readonly ZH_APPROVAL_THRESHOLD = 2500000;   // 25 Lakhs
  private readonly CEO_APPROVAL_THRESHOLD = 5000000;  // 50 Lakhs

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Port of Flow67_ValidateForBTLoan.generateLoanNumber(). */
  generateLoanNumber(): string {
    return 'LN' + Date.now();
  }

  /**
   * Port of Flow67_ValidateForBTLoan.selectDateFromCalendar().
   * Opens the mat-datepicker and selects a specific date.
   */
  async selectDateFromCalendar(dateInput: { year: number; month: string; day: number }): Promise<void> {
    const header = this.page.locator("xpath=//button[contains(@class,'mat-calendar-period-button')]");
    await header.click();

    const yearEle = this.page.locator(
      `xpath=//div[contains(@class,'mat-calendar-body-cell-content') and text()='${dateInput.year}']`,
    );
    await yearEle.click();

    const monthEle = this.page.locator(
      `xpath=//div[contains(@class,'mat-calendar-body-cell-content') and contains(text(),'${dateInput.month}')]`,
    );
    await monthEle.click();

    const dayEle = this.page.locator(
      `xpath=//div[contains(@class,'mat-calendar-body-cell-content') and text()='${dateInput.day}']`,
    );
    try {
      await dayEle.click();
    } catch {
      await this.jsClick(dayEle);
    }
  }

  /**
   * Port of Flow67_ValidateForBTLoan.selectLoanDates().
   * Selects loan start date (5 months back) and end date (+6 months from start).
   */
  async selectLoanDates(): Promise<void> {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 5);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 6);

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    await this.page.waitForTimeout(3000);
    await this.loanStartDate().click();
    await this.selectDateFromCalendar({
      year: startDate.getFullYear(),
      month: monthNames[startDate.getMonth()],
      day: startDate.getDate(),
    });

    await this.page.waitForTimeout(3000);
    await this.loanEndDate().click();
    await this.selectDateFromCalendar({
      year: endDate.getFullYear(),
      month: monthNames[endDate.getMonth()],
      day: endDate.getDate(),
    });
  }

  /**
   * Port of Flow67_ValidateForBTLoan.enterGrossAndNetWeight().
   * Fills gross and net weight fields for the given ornament row index.
   */
  async enterGrossAndNetWeight(index: number): Promise<void> {
    const ratePerKg = 5100000.0 / 1000.0;
    const grossWt = 100.0 + Math.random() * 900.0;
    const netWt = 1.0 + Math.random() * (grossWt - 1.0);
    let loanAmt = netWt * ratePerKg;
    if (loanAmt > 5100000) loanAmt = 5100000;

    const grossStr = grossWt.toFixed(1);
    const netStr = netWt.toFixed(1);

    const grossList = this.page.locator("xpath=//input[@formcontrolname='grossWeight']");
    const netList = this.page.locator("xpath=//input[@formcontrolname='netWeight']");

    await this.page.waitForTimeout(2000);
    await grossList.nth(index).fill(grossStr);

    await this.page.waitForTimeout(2000);
    await netList.nth(index).fill(netStr);
  }

  /**
   * Port of Flow67_ValidateForBTLoan.validateOrnaments().
   * Fills jewellery type, pieces, gross/net weight, karat, purity for 2 ornaments.
   */
  async validateOrnaments(): Promise<void> {
    for (let i = 0; i < 2; i++) {
      const dropdowns = this.page.locator("xpath=//select[@aria-label='Jewellery Type']");
      const dropdown = dropdowns.nth(i);
      await dropdown.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));

      // Select first non-placeholder option at index i
      const options = await dropdown.locator('option').all();
      const nonPlaceholder = options.slice(1);
      const optIdx = Math.min(i, nonPlaceholder.length - 1);
      const selectedText = await nonPlaceholder[optIdx].innerText();
      await dropdown.selectOption({ label: selectedText.trim() });

      const piecesList = this.page.locator("xpath=//input[@formcontrolname='numberOfPieces']");
      await piecesList.nth(i).clear();
      await piecesList.nth(i).fill('1');

      await this.enterGrossAndNetWeight(i);

      const karatList = this.page.locator("xpath=//select[@formcontrolname='karat']");
      await karatList.nth(i).selectOption({ label: '20 K HM' });

      const purityList = this.page.locator("xpath=//select[@formcontrolname='purity']");
      await purityList.nth(i).selectOption({ label: '90 %' });

      if (i === 0) {
        const addMoreBtn = this.page.locator("xpath=//button[contains(.,'Add More Jewellery')]");
        await addMoreBtn.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
        await this.jsClick(addMoreBtn);
        // Wait for second row to appear
        await this.page.locator("xpath=//select[@aria-label='Jewellery Type']").nth(1).waitFor({ state: 'visible' });
      }
    }
  }

  /**
   * Port of Flow67_ValidateForBTLoan.selectScheme().
   * Selects partner, loan tenure, repayment cycle, radio, and enters loan amount.
   */
  async selectScheme(): Promise<void> {
    await this.selPartner().selectOption({ label: 'KHARATMOL SK' });
    await this.page.waitForTimeout(4000);
    await this.selLoanTenuar().selectOption({ label: '90' });
    await this.page.waitForTimeout(4000);

    const repayment = this.page.locator("xpath=//select[@formcontrolname='repaymentCycle']");
    await repayment.selectOption({ value: '30Days' });
    await this.page.waitForTimeout(4000);

    await this.btnRadio().click();
    await this.page.waitForTimeout(4000);

    await this.enterLoanAmountBasedOnSchemeEligibility();
  }

  /**
   * Port of Flow67_ValidateForBTLoan.enterLoanAmountBasedOnSchemeEligibility().
   * Reads eligibility from DOM and enters a valid loan amount.
   */
  async enterLoanAmountBasedOnSchemeEligibility(): Promise<void> {
    await this.waitForLoaderToDisappear();

    const eligibilityCell = this.page.locator(
      "xpath=//input[@formcontrolname='schemeId']/ancestor::tr/td[last()]",
    );
    const rawEligibility = (await eligibilityCell.innerText()).trim();

    const cleanedEligibility = rawEligibility
      .replace('₹', '')
      .replace(/,/g, '')
      .replace(/ /g, '')
      .trim();

    let eligibilityAmount = 5100000;
    const parsed = parseFloat(cleanedEligibility);
    if (!isNaN(parsed)) {
      eligibilityAmount = parsed;
    }

    const minLoan = 100000;
    const maxLoan = Math.min(eligibilityAmount, 5100000);
    let loanAmount: number;
    if (maxLoan <= minLoan) {
      loanAmount = minLoan;
    } else {
      loanAmount = Math.floor(minLoan + Math.random() * (maxLoan - minLoan + 1));
    }

    await this.waitForLoaderToDisappear();
    const loanField = this.page.locator("xpath=//input[@formcontrolname='requiredLoanAmount']");
    await loanField.clear();
    await this.page.waitForTimeout(1000);
    await loanField.fill(String(loanAmount));
  }

  /**
   * Port of Flow67_ValidateForBTLoan.validateBankDetails().
   * Enters account number, IFSC code, and verifies bank details.
   *
   * NOTE: bank document upload omitted — Java used C:\\ path (omitted per rules).
   */
  async validateBankDetails(): Promise<void> {
    await this.accountNumber().fill('50100709899488');
    await this.page.waitForTimeout(4000);
    await this.ifscCode().fill('HDFC0001210');
    await this.page.waitForTimeout(4000);

    // TODO(port): Bank document upload — Java used sendKeys to //input[@type='file'] with C:\\ path.
    // Best-effort: setInputFiles(). documentPath must be supplied from test config/env vars if needed.

    await this.waitForLoaderToDisappear();
    await this.btnVerifyBankDetails().click();
  }

  /**
   * Port of Flow67_ValidateForBTLoan.uploadDocuments().
   * Clicks the placeholder image, camera icon, and uploads documents to file inputs.
   *
   * NOTE: document uploads omitted — Java used C:\\ paths (omitted per rules).
   */
  async uploadDocuments(): Promise<void> {
    await this.page.waitForTimeout(2000);
    const element = this.img();
    await element.evaluate((el: any) => { el.scrollIntoView(true); });
    await this.page.evaluate('window.scrollBy(0, -150);');
    await this.page.waitForTimeout(3000);
    await element.click();
    await this.imgCamera().click();

    // TODO(port): document uploads — Java used sendKeys to (//input[@type='file'])[1/2/7/8] with C:\\ paths.
    // Best-effort: setInputFiles(). Paths must be supplied from test config/env vars if needed.

    await this.page.waitForTimeout(5000);
  }

  /**
   * Port of Flow67_ValidateForBTLoan.safeClick() — clicks Next button via jsClick.
   */
  async safeClick(): Promise<void> {
    await this.jsClick(this.btnNext());
  }

  // ── Approval methods (from Flow67) ────────────────────────────────────────

  /**
   * Port of Flow67_ValidateForBTLoan.performApprovalStep().
   * Clicks approval button, navigates through 5 Next clicks, sets status + comment, submits.
   */
  async performApprovalStep(approvalButtonLocator: () => import('@playwright/test').Locator, status: string): Promise<void> {
    await approvalButtonLocator().click();
    await this.page.waitForTimeout(5000);

    for (let i = 0; i < 5; i++) {
      await this.page.waitForTimeout(5000);
      await this.safeClick();
    }

    const element = this.selapproval();
    await this.page.waitForTimeout(3000);
    await element.scrollIntoViewIfNeeded();
    await this.selapproval().selectOption({ label: status });
    await this.page.waitForTimeout(3000);
    await this.comments().fill(status);
    await this.page.waitForTimeout(500);
    await this.btnSubmit().click();
  }

  /**
   * Port of Flow67_ValidateForBTLoan.rchApproval().
   */
  async rchApproval(status = 'Approved'): Promise<void> {
    await this.performApprovalStep(() => this.btnRCHapproval(), status);
  }

  /**
   * Port of Flow67_ValidateForBTLoan.rhApproval().
   */
  async rhApproval(): Promise<void> {
    await this.performApprovalStep(() => this.btnRHapproval(), 'Approved');
  }

  /**
   * Port of Flow67_ValidateForBTLoan.zhApproval().
   */
  async zhApproval(): Promise<void> {
    await this.performApprovalStep(() => this.btnZHapproval(), 'Approved');
  }

  /**
   * Port of Flow67_ValidateForBTLoan.ceoApproval().
   */
  async ceoApproval(): Promise<void> {
    await this.performApprovalStep(() => this.btnCEOapproval(), 'Approved');
  }

  /**
   * Port of Flow67_ValidateForBTLoan.executeApprovalForLoanAmount().
   * Runs approval chain based on loan amount thresholds.
   */
  async executeApprovalForLoanAmount(loanAmount: number): Promise<void> {
    await this.rchApproval();

    if (loanAmount > this.CEO_APPROVAL_THRESHOLD) {
      await this.rhApproval();
      await this.zhApproval();
      // ZAH approval is handled by ZahReviewPage.validateZahReview()
      await this.ceoApproval();
    } else if (loanAmount >= this.ZH_APPROVAL_THRESHOLD) {
      await this.rhApproval();
      await this.zhApproval();
    } else if (loanAmount >= this.RH_APPROVAL_THRESHOLD) {
      await this.rhApproval();
    }
    // else: RCH only (already done above)
  }

  // ── Main flow methods ─────────────────────────────────────────────────────

  /**
   * Port of Flow67_ValidateForBTLoan.validateForBTLoan().
   * Navigates to customer, starts BT process, fills BT loan details, and runs approvals.
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must invoke loginAs('appraiser') first.
   * NOTE: Flow68_ValidateZAHReview.validateZahReview() is called inside executeApprovalForLoanAmount
   *       only when loanAmount > CEO_APPROVAL_THRESHOLD. For the normal path (loanAmount=1000000,
   *       which is 10 Lakhs) only RCH approval runs. The spec calls validateZahReview separately
   *       as the second @Test step.
   */
  async validateForBTLoan(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(3000);

    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

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
    await this.startNewBTProcess().click();
    await this.btnAdd().click();
    await this.page.waitForTimeout(7000);

    const appraisalRequests = this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
    await appraisalRequests.waitFor({ state: 'visible' });
    await appraisalRequests.click();

    await this.page.waitForTimeout(5000);
    await this.textField().fill(data.firstName);

    const scrollDiv = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(3000);

    await this.jsClick(this.kebabMenu1());
    const applyBTLoan = this.page.locator("xpath=//button[normalize-space()='Apply BT Loan']");
    await this.jsClick(applyBTLoan);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);

    await this.clickBankNameBox().click();
    await this.clickBankName().click();
    await this.page.waitForTimeout(2000);

    // Close ng-select dropdown via JS
    await this.page.evaluate("document.querySelector('ng-select').dispatchEvent(new Event('blur'));");
    await this.page.waitForTimeout(1000);

    await this.customer().click();
    await this.page.waitForTimeout(1000);

    const companyTypeDropdown = this.companyType();
    await companyTypeDropdown.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(1000);
    await companyTypeDropdown.selectOption({ label: 'NBFC' });
    await this.page.waitForTimeout(3000);

    await this.loanNumber().fill(this.generateLoanNumber());
    await this.page.waitForTimeout(3000);

    const loanAmountValue = '1000000';
    await this.loanAmount().fill(loanAmountValue);
    await this.page.waitForTimeout(2000);

    await this.releaseAmount().fill(loanAmountValue);
    await this.page.waitForTimeout(2000);

    await this.selectLoanDates();
    await this.page.waitForTimeout(500);

    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.page.waitForTimeout(5000);
    await this.validateOrnaments();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.page.waitForTimeout(5000);
    await this.selectScheme();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.validateBankDetails();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.uploadDocuments();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.page.waitForTimeout(5000);

    await this.executeApprovalForLoanAmount(parseInt(loanAmountValue));
    await this.page.waitForTimeout(5000);
  }

  /**
   * Port of Flow69_ValidateIncompleteFolwBTLoan.validateIncompleteBTLaon().
   * Full BT loan application flow ending with RCH Incomplete approval.
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must invoke loginAs('appraiser') first.
   * NOTE: Flow_CustomerManagement.clickOnCustomerManagementButton(), Flow01_Kyc.ClickonKyc(),
   *       and Flow02_KycApproval.performOpsRatingActions() are OMITTED — precondition handled
   *       by createDisbursedLoan(page) in test setup.
   */
  async validateIncompleteBTLaon(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(3000);

    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
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
    await this.startNewBTProcess().click();
    await this.btnAdd().click();
    await this.page.waitForTimeout(7000);

    const appraisalRequests = this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
    await appraisalRequests.waitFor({ state: 'visible' });
    await appraisalRequests.click();

    await this.page.waitForTimeout(5000);
    await this.textField().fill(data.firstName);

    const scrollDiv = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(3000);

    const kebabMenu = this.kebabMenu1();
    await kebabMenu.click();
    await this.page.waitForTimeout(3000);

    const applyBTLoan = this.page.locator("xpath=//button[normalize-space()='Apply BT Loan']");
    await this.jsClick(applyBTLoan);
    await this.page.waitForTimeout(500);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);

    await this.clickBankNameBox().click();
    const dropdown = this.page.locator("xpath=//ng-select[@formcontrolname='multiSelect']");
    await this.waitForLoaderToDisappear();
    await dropdown.click();
    await this.clickBankName().click();
    await this.page.waitForTimeout(500);

    await this.customer().click();
    await this.page.waitForTimeout(500);

    const companyTypeDropdown = this.companyType();
    await companyTypeDropdown.selectOption({ label: 'NBFC' });
    await this.page.waitForTimeout(3000);

    await this.loanNumber().fill(this.generateLoanNumber());
    await this.page.waitForTimeout(3000);

    const loanAmountValue = 150000;
    await this.loanAmount().fill(String(loanAmountValue));
    await this.page.waitForTimeout(2000);

    await this.releaseAmount().fill(String(loanAmountValue));
    await this.page.waitForTimeout(2000);

    await this.selectLoanDates();
    await this.page.waitForTimeout(500);

    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.page.waitForTimeout(5000);
    await this.validateOrnaments();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.page.waitForTimeout(5000);
    await this.selectScheme();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.validateBankDetails();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.uploadDocuments();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.page.waitForTimeout(5000);

    // Incomplete flow: Add Existing BT instead of approval chain
    await this.btnAddExistingBT().click();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.page.waitForTimeout(5000);
    await this.safeClick();
    await this.page.waitForTimeout(5000);

    await this.uploadDocuments();
    await this.page.waitForTimeout(5000);

    // RCH Approval with Incomplete status
    await this.rchApproval('Incomplete');
  }
}
