import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO16_FullRelease (locators) + Flow18_FullReleaseLoan.fullRelease() (actions)
 *
 * Flow18_FullReleaseLoan.fullRelease() active steps:
 *   1. Login as appraiser (OMITTED), set branch Show All, navigate.
 *   2. Call fullReleaseOnlinePay(): Loan Details → filter → kebab → Jewellery Release → Full Release
 *      → Proceed → PAYMENT GATEWAY / netbanking → Confirm → Yes → Razorpay iframe / SBI / popup Success.
 *   3. Navigate to Funds and Approvals → Jewellery Release Approval → Full Release Approval → Filter.
 *   4. Click Jewellery Release Final Process → Final Full Release → update().
 *
 * Cross-page locator notes:
 *   - All cross-page locators re-declared locally following the TC02 house style.
 *   - PO08_PacketSubmissionAppraiser locators re-declared for update().
 *   - PO15_PartRelease locators (btnCollect, customerHomeIn, btnCamera, btnAttach) re-declared for update().
 *
 * Omitted loginWith* calls:
 *   - Flow18_FullReleaseLoan.fullRelease() called Flow_LoginLogout.loginWithAppraiser() — OMITTED.
 *     Role = appraiser; caller must inject via loginAs('appraiser').
 *
 * Data note:
 *   - Java used `partnerNumber` → mapped to getLoginData().accountNumber.
 */
export class FullReleasePage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO16_FullRelease) ──────────────────────────────────────

  private readonly jewllaryRelease = () => this.page.locator("xpath=//button[normalize-space()='Jewellery Release']");
  private readonly jwellaryReleaseApproval = () => this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
  private readonly btnProced = () => this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  private readonly fullReleaseBtn = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Full Release']//button[@type='button']");
  private readonly fullReleaseApproval = () => this.page.locator("xpath=//span[normalize-space()='Full Release Approval']");
  private readonly btnFundsAndApproval = () => this.page.locator("xpath=//span[normalize-space()='Funds and Approvals']");
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
  private readonly btnAdd = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  private readonly selUserType = () => this.page.locator("xpath=//select[@formcontrolname='userType']");
  private readonly selAppraiser = () => this.page.locator("xpath=//select[@formcontrolname='appraiserId']");
  private readonly assignReleaser = () => this.page.locator("xpath=//button[contains(.,'Assign Releaser')]");
  private readonly btnCollect = () => this.page.locator("xpath=//button[normalize-space()='Collect']");
  private readonly fullReleaseFinalProcess = () => this.page.locator("xpath=//span[normalize-space()='Final Full Release']");

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
  // PO10_QuickPayment.loc_netBanking
  private readonly netBanking = () => this.page.locator("xpath=//img[@alt='netbanking']");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () => this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO10_QuickPayment.loc_btnConfirm
  private readonly btnConfirm = () => this.page.locator("xpath=//span[normalize-space()='Confirm']");
  // PO13_RenewLoan.loc_btnYes
  private readonly btnYesRenew = () => this.page.locator("xpath=//span[contains(.,'Yes')]");
  // PO15_PartRelease.loc_btnJwellaryReleaseFinalProcess
  private readonly btnJwellaryReleaseFinalProcess = () => this.page.locator("xpath=//span[normalize-space()='Jewellery Release Final Process']");
  // PO15_PartRelease.loc_customerHomeIn
  private readonly customerHomeIn = () => this.page.locator("xpath=//button[normalize-space()='Customer Home In']");
  // PO15_PartRelease.loc_btnCamera
  private readonly btnCamera = () => this.page.locator("xpath=//i[@class='fas fa-camera']");
  // PO15_PartRelease.loc_btnAttach
  private readonly btnAttach = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");
  // PO08_PacketSubmissionAppraiser locators (re-declared for update())
  private readonly inputField = () => this.page.locator("xpath=//input[@formcontrolname='Barcode']");
  private readonly btnVerify = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']");
  private readonly inputMobileNumber = () => this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly btnOTP = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']");
  private readonly inputOTP = () => this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnUpdate = () => this.page.locator("xpath=//span[normalize-space()='Update']");

  // ── Actions (from Flow18_FullReleaseLoan.fullRelease) ─────────────────────

  /**
   * Port of Java Flow18_FullReleaseLoan.fullRelease().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates (profile → branch → arrow), calls fullReleaseOnlinePay(), then
   * navigates to Funds and Approvals → Jewellery Release Approval → Full Release Approval → Filter,
   * clicks Final Process → Final Full Release → update().
   */
  async fullRelease(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.fullReleaseOnlinePay();
    await this.page.waitForTimeout(15000);

    // Funds and Approvals → Jewellery Release Approval
    const element1 = this.page.locator("xpath=//span[normalize-space()='Funds and Approvals']");
    await element1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
    await ele.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval().click();
    await this.waitForLoaderToDisappear();
    await this.fullReleaseApproval().click();
    await this.waitForLoaderToDisappear();

    const filterEl = this.page.locator("xpath=//span[normalize-space()='Filter']");
    await filterEl.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await filterEl.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    await this.btnJwellaryReleaseFinalProcess().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(2000);
    await this.fullReleaseFinalProcess().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.update();
    await this.page.waitForTimeout(2000);
  }

  // ── Actions (from Flow18_FullReleaseLoan.fullReleaseOnlinePay) ────────────

  /**
   * Port of Java Flow18_FullReleaseLoan.fullReleaseOnlinePay().
   *
   * Navigates to Loan Details, reads customer ID, clicks Jewellery Release → Full Release → Proceed,
   * selects PAYMENT GATEWAY / netbanking → Confirm → Yes → Razorpay iframe / SBI / Success popup.
   */
  async fullReleaseOnlinePay(): Promise<void> {
    const data = getLoginData();

    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    const elie = this.loanDetails();
    await elie.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
    await elie.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();

    // Read customer ID
    const element = this.page.locator("xpath=(//td[@class='ui-resizable-column p-element p-frozen-column ng-star-inserted'])[1]");
    const str = (await element.innerText()).trim();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.jewllaryRelease().click();
    await this.waitForLoaderToDisappear();
    await this.fullReleaseBtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnProced().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const selectStatusDropdown = this.selPayment();
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView({ block: 'nearest', inline: 'center' }));
    await selectStatusDropdown.click();
    await selectStatusDropdown.selectOption({ label: 'PAYMENT GATEWAY' });

    await this.netBanking().click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
    await this.btnYesRenew().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // Razorpay iframe
    const razorFrame = this.page.frameLocator("xpath=//iframe[@class='razorpay-checkout-frame']");
    await this.page.waitForTimeout(2000);
    await razorFrame.locator("xpath=//input[@placeholder='Search for Banks']").fill('State Bank of India');
    await this.page.waitForTimeout(2000);
    await razorFrame.locator("xpath=(//span[contains(.,'State Bank of India')])[1]").click();
    await razorFrame.locator("xpath=//button[contains(.,'Continue & Pay')]").click();
    await this.page.waitForTimeout(2000);

    // Bank simulator popup
    const [popup] = await Promise.all([
      this.page.context().waitForEvent('page', { timeout: 15000 }).catch(() => null),
      Promise.resolve(),
    ]);
    if (popup) {
      const successBtn = popup.locator("xpath=//button[contains(text(),'Success')]");
      await successBtn.waitFor({ state: 'visible', timeout: 10000 });
      await successBtn.click();
      await popup.waitForEvent('close', { timeout: 10000 }).catch(() => {});
    } else {
      const successBtn = this.page.locator("xpath=//button[contains(text(),'Success')]");
      await successBtn.waitFor({ state: 'visible', timeout: 10000 });
      await successBtn.click();
    }
  }

  // ── Actions (from Flow18_FullReleaseLoan.update) ──────────────────────────

  /**
   * Port of Java Flow18_FullReleaseLoan.update().
   *
   * Clicks Collect, reads barcode, fills barcode field, verifies, OTP, updates.
   * Data note: Java used `partnerNumber` → mapped to getLoginData().accountNumber.
   */
  async update(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    const element = this.btnCollect();
    await element.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element.waitFor({ state: 'visible' });
    await element.click();
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
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(500);
    const element1 = this.customerHomeIn();
    await element1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element1.waitFor({ state: 'visible' });
    await element1.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    const elemen = this.page.locator("xpath=//div[@class='col-7 d-flex align-items-center']");
    const strng1 = (await elemen.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.inputField().fill(strng1);

    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.btnCamera().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAttach().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP().fill('1234');
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();
  }
}
