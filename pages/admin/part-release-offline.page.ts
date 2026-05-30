import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';
import { TestDataFactory } from '../../utils/data/test-data.factory';

/**
 * Port of Java: PO23_PartReleaseOffline (locators) + Flow36_PartReleaseOffline (actions)
 *
 * PO23_PartReleaseOffline provides offline-payment locators (bank name, branch name, transaction ID,
 * status selects, update buttons, camera, Yes button) reused across many TC04 flows.
 *
 * Methods ported:
 *   - validatePartReleaseOffline()  ← Flow36.validatePartReleaseOffline()
 *   - deposit()                     ← Flow36.deposit()
 *
 * Cross-page locator notes:
 *   - All navigation locators re-declared locally following house style.
 *   - PO08_PacketSubmissionAppraiser locators re-declared for update().
 *   - PO15_PartRelease locators re-declared for approval portion.
 *   - PO16_FullRelease locators re-declared for navigation.
 *   - PO10_QuickPayment.loc_btnFilter re-declared as btnFilter.
 *
 * Omitted loginWith* calls:
 *   - validatePartReleaseOffline() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *   - deposit() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *
 * Data note: Java used static `partnerNumber` → mapped to getLoginData().accountNumber.
 * Java C:\\ file paths omitted (upload is optional / guarded).
 */
export class PartReleaseOfflinePage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO23_PartReleaseOffline) ───────────────────────────────

  private readonly inputBankName = () => this.page.locator("xpath=//input[@formcontrolname='bankName']");
  private readonly inputBranchName = () => this.page.locator("xpath=//input[@formcontrolname='branchName']");
  private readonly inputBankTransactionID = () => this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  private readonly btnYes = () => this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly btnUpdate = () => this.page.locator("xpath=(//button[@class='apply-kyc ng-star-inserted'][normalize-space()='Update'])[1]");
  private readonly selStatus = () => this.page.locator("xpath=//select[@formcontrolname='amountStatus']");
  private readonly btnCamera = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");
  private readonly btnDone = () => this.page.locator("xpath=//span[normalize-space()='Done']");
  private readonly btncutomRadio = () => this.page.locator("xpath=(//div[@class='mat-radio-inner-circle'])[3]");
  private readonly btnNextduedateRadio = () => this.page.locator("xpath=(//div[@class='mat-radio-inner-circle'])[2]");
  private readonly paymentAmount = () => this.page.locator("xpath=//input[@type='text']");
  private readonly updatebtn = () => this.page.locator("xpath=(//button[contains(.,'Update')])[1] ");
  private readonly btupdate = () => this.page.locator("xpath=//span[contains(.,'Update')]");

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
  // PO10_QuickPayment.loc_btnDone (payment done button)
  private readonly btnPaymentDone = () => this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO10_QuickPayment.loc_btnConfirm
  private readonly btnConfirm = () => this.page.locator("xpath=//span[normalize-space()='Confirm']");
  // PO10_QuickPayment.loc_btnFilter
  private readonly btnFilter = () => this.page.locator("xpath=//span[normalize-space()='Filter']");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () => this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO15_PartRelease.loc_partRelease
  private readonly partRelease = () => this.page.locator("xpath=//span[normalize-space()='Part Release Approval']");
  // PO15_PartRelease.loc_customerIDfield
  private readonly customerIDfield = () => this.page.locator("xpath=//input[@placeholder='Enter Customer Unique ID']");
  // PO15_PartRelease.loc_btnUpdte
  private readonly btnUpdte = () => this.page.locator("xpath=//span[normalize-space()='Update']");
  // PO15_PartRelease.loc_btnJwellaryReleaseFinalProcess
  private readonly btnJwellaryReleaseFinalProcess = () => this.page.locator("xpath=//span[normalize-space()='Jewellery Release Final Process']");
  // PO15_PartRelease.loc_partReleaseFinalProcess
  private readonly partReleaseFinalProcess = () => this.page.locator("xpath=//span[normalize-space()='Final Part Release']");
  // PO15_PartRelease.loc_btnCollect
  private readonly btnCollect = () => this.page.locator("xpath=//button[normalize-space()='Collect']");
  // PO15_PartRelease.loc_customerHomeIn
  private readonly customerHomeIn = () => this.page.locator("xpath=//button[normalize-space()='Customer Home In']");
  // PO15_PartRelease.loc_btnCamera (fa-camera)
  private readonly btnCameraFa = () => this.page.locator("xpath=//i[@class='fas fa-camera']");
  // PO15_PartRelease.loc_btnAttach
  private readonly btnAttach = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");
  // PO15_PartRelease.loc_btnUpdateAppraiser
  private readonly btnUpdateAppraiser = () => this.page.locator("xpath=(//button[@ng-reflect-klass='apply-kyc'][normalize-space()='Update Appraiser'])[1]");
  // PO16_FullRelease.loc_jewllaryRelease
  private readonly jewllaryRelease = () => this.page.locator("xpath=//button[normalize-space()='Jewellery Release']");
  // PO16_FullRelease.loc_jwellaryReleaseApproval
  private readonly jwellaryReleaseApproval = () => this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
  // PO16_FullRelease.loc_btnProced
  private readonly btnProced = () => this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  // Date/time pickers (re-declared from PO16_FullRelease)
  private readonly selDate = () => this.page.locator("xpath=//input[@placeholder='DD/MM/YYYY']");
  private readonly dateArrow = () => this.page.locator("xpath=//div[@class='mat-calendar-arrow']");
  private readonly selYear = () => this.page.locator("xpath=(//div[@class='mat-calendar-body-cell-content'])[1]");
  private readonly selMonth = () => this.page.locator("xpath=(//div[@class='mat-calendar-body-cell-content'])[2]");
  private readonly selDay = () => this.page.locator("xpath=(//div[@class='mat-calendar-body-cell-content'])[2]");
  private readonly selTimeFrom = () => this.page.locator("xpath=//input[@placeholder='From']");
  private readonly selTime = () => this.page.locator("xpath=//span[@class='active']");
  private readonly btnOk = () => this.page.locator("xpath=//span[normalize-space()='Ok']");
  private readonly selTimeTo = () => this.page.locator("xpath=//input[@placeholder='To']");
  private readonly selTimeINPM = () => this.page.locator("xpath=//button[normalize-space()='PM']");
  private readonly selTimeTHour = () => this.page.locator("xpath=//span[@class='active']");
  // PO04_NewGoldLoan.loc_btnNext (re-declared for part release final process)
  private readonly btnNext = () => this.page.locator("xpath=//button[span[normalize-space()='Next']]");
  // PO08_PacketSubmissionAppraiser locators (re-declared for update())
  private readonly inputField = () => this.page.locator("xpath=//input[@formcontrolname='Barcode']");
  private readonly btnVerify = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']");
  private readonly inputMobileNumber = () => this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly btnOTP = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']");
  private readonly inputOTP = () => this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnOTPUpdate = () => this.page.locator("xpath=//span[normalize-space()='Update']");

  // ── Helper ────────────────────────────────────────────────────────────────

  private generateTransactionId(): string {
    return 'TXN-' + Math.random().toString(36).substring(2, 14).toUpperCase();
  }

  private getRandomBankName(): string {
    const banks = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank',
      'Bank of Baroda', 'Kotak Mahindra Bank', 'Yes Bank', 'IDFC First Bank', 'Union Bank of India'];
    return banks[Math.floor(Math.random() * banks.length)];
  }

  private getRandomBranchName(): string {
    const branches = ['MG Road Branch', 'Andheri Branch', 'Connaught Place Branch', 'Koramangala Branch',
      'Bandra Branch', 'Chandni Chowk Branch', 'Jayanagar Branch', 'Indiranagar Branch', 'Santacruz Branch',
      'Pune Camp Branch'];
    return branches[Math.floor(Math.random() * branches.length)];
  }

  // ── Actions (from Flow36_PartReleaseOffline.validatePartReleaseOffline) ───

  /**
   * Port of Java Flow36_PartReleaseOffline.validatePartReleaseOffline().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Loan Details, opens Part Release (offline IMPS payment),
   * then handles Jewellery Release Approval → final process → update → Calculate → Next × 2
   * → selectLead() → partnerApprove(). File upload steps are guarded (C:\\ paths omitted).
   */
  async validatePartReleaseOffline(): Promise<void> {
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

    // paymentPartRelease
    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();

    // Read customer ID
    const element = this.page.locator("xpath=(//td[@class='ui-resizable-column p-element p-frozen-column ng-star-inserted'])[1]");
    const customerId = (await element.innerText()).trim();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.jewllaryRelease().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const elem = this.page.locator("xpath=(//label[@class='custom-checkbox']//input[@type='checkbox'])[1]");
    await this.page.waitForTimeout(500);
    await this.jsClick(elem);

    await this.page.locator("xpath=//button[.//span[normalize-space()='Release']]").click();
    await this.waitForLoaderToDisappear();

    // Select scheme
    const selScheme = this.page.locator("xpath=//select[@formcontrolname='scheme']");
    await selScheme.selectOption({ label: 'ONLY_SECUAT_TS_32 (50000 - 500000)' }).catch(() => {});
    await this.page.waitForTimeout(200);

    await this.btnProced().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const selectStatusDropdown = this.selPayment();
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView({ block: 'nearest', inline: 'center' }));
    await selectStatusDropdown.click();
    await selectStatusDropdown.selectOption({ label: 'IMPS' });

    await this.inputBankName().fill(this.getRandomBankName());
    await this.inputBranchName().fill(this.getRandomBranchName());
    await this.page.waitForTimeout(2000);
    await this.inputBankTransactionID().fill(this.generateTransactionId());
    await this.page.waitForTimeout(2000);
    await this.btnPaymentDone().click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(15000);

    // Funds and Approvals → Jewellery Release Approval → Part Release
    const element1 = this.page.locator("xpath=//span[normalize-space()='Funds and Approvals']");
    await element1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
    await ele.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval().click();
    await this.waitForLoaderToDisappear();
    await this.partRelease().click();
    await this.waitForLoaderToDisappear();

    await this.customerIDfield().fill(customerId);
    const element2 = this.page.locator("xpath=//span[normalize-space()='Filter']");
    await element2.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await element2.click();
    await this.waitForLoaderToDisappear();

    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(5000);

    const scrollContainer = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollContainer.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);

    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    await this.selStatus().selectOption({ label: 'Completed' });
    await this.page.waitForTimeout(500);
    await this.btnUpdte().click();
    await this.waitForLoaderToDisappear();

    await this.btnCamera().click();
    await this.waitForLoaderToDisappear();
    await this.btnUpdateAppraiser().click();
    await this.waitForLoaderToDisappear();

    // Date / time pickers
    await this.selDate().click();
    await this.page.waitForTimeout(2000);
    await this.dateArrow().click();
    await this.page.waitForTimeout(2000);
    await this.selYear().click();
    await this.page.waitForTimeout(2000);
    await this.selMonth().click();
    await this.page.waitForTimeout(2000);
    await this.selDay().click();
    await this.page.waitForTimeout(2000);

    await this.selTimeFrom().click();
    await this.page.waitForTimeout(2000);
    await this.selTime().click();
    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(2000);
    await this.btnOk().click();
    await this.page.waitForTimeout(2000);
    await this.selTimeTo().click();
    await this.page.waitForTimeout(2000);
    await this.selTimeINPM().click();
    await this.page.waitForTimeout(2000);
    await this.selTimeTHour().click();
    await this.page.waitForTimeout(2000);
    await this.btnOk().click();
    await this.page.waitForTimeout(2000);
    await this.btnUpdte().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Jewellery Release Final Process
    const ele1 = this.page.locator("xpath=//span[normalize-space()='Jewellery Release Final Process']");
    await ele1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(2000);
    await this.btnJwellaryReleaseFinalProcess().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(2000);
    await this.partReleaseFinalProcess().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.update();
    await this.page.waitForTimeout(2000);

    // Calculate
    const calculateBtn = this.page.locator("xpath=//button[.//span[normalize-space(text())='Calculate']]");
    await calculateBtn.waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForTimeout(3000);
    await calculateBtn.click();
    await this.page.waitForTimeout(3000);

    const el1 = this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
    await el1.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(5000);
    await this.btnNext().click();
    await this.page.waitForTimeout(5000);

    const ele2 = this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
    await ele2.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(5000);
    await this.btnNext().click();
  }

  // ── Actions: update (from Flow36_PartReleaseOffline.update) ──────────────

  /**
   * Port of Java Flow36_PartReleaseOffline.update().
   * Clicks Collect, reads barcode, fills field, verifies, OTP, updates, Customer Home In.
   */
  async update(): Promise<void> {
    const data = getLoginData();

    const btnCollect = this.page.locator("xpath=//button[normalize-space()='Collect']");
    await this.page.waitForTimeout(2000);
    await btnCollect.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await btnCollect.waitFor({ state: 'visible' });
    await btnCollect.click();
    await this.waitForLoaderToDisappear();

    const eleme = this.page.locator("xpath=//div[@class='col-7 d-flex align-items-center']");
    const str1 = (await eleme.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.inputField().fill(str1);

    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.inputMobileNumber().fill(data.accountNumber);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP().fill('1234');
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnOTPUpdate().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const btnCustomerHomeIn = this.page.locator("xpath=//button[normalize-space()='Customer Home In']");
    await this.page.waitForTimeout(2000);
    await btnCustomerHomeIn.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await btnCustomerHomeIn.waitFor({ state: 'visible' });
    await btnCustomerHomeIn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const elemen = this.page.locator("xpath=//div[@class='col-7 d-flex align-items-center']");
    const strng1 = (await elemen.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.inputField().fill(strng1);

    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.btnCameraFa().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAttach().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP().fill('1234');
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnOTPUpdate().click();
    await this.waitForLoaderToDisappear();
  }

  // ── Actions (from Flow36_PartReleaseOffline.deposit) ─────────────────────

  /**
   * Port of Java Flow36_PartReleaseOffline.deposit().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Funds and Approvals → Jewellery Release Approval → Part Release,
   * filters Pending, scrolls to Update button, marks Completed, then logs out (omitted).
   */
  async deposit(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.arrow().click();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator("xpath=//span[normalize-space()='Funds and Approvals']");
    await element1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
    await ele.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.partRelease().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);
    const selectStatusDropdown = this.page.locator("xpath=//select[@ng-reflect-name='amountStatus']");
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: 'Pending' });
    await this.btnFilter().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    const scrollDiv = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(3000);

    const elee = this.updatebtn();
    await elee.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await elee.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(3000);
    const selectStatusDropdown1 = this.page.locator("xpath=//select[@formcontrolname='amountStatus']");
    await selectStatusDropdown1.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown1.selectOption({ label: 'Completed' });
    await this.page.waitForTimeout(2000);
    await this.btupdate().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }
}
