import { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import customerData from "../../testdata/admin/documents/customerData.json";
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
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO16_FullRelease) ──────────────────────────────────────

  private readonly jewllaryRelease = () =>
    this.page.locator("xpath=//button[normalize-space()='Jewellery Release']");
  private readonly jwellaryReleaseApproval = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
  private readonly btnProced = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  private readonly fullReleaseBtn = () =>
    this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Full Release']]",
    );
  private readonly fullReleaseApproval = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Full Release Approval']",
    );
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO10_QuickPayment.loc_btnConfirm
  private readonly btnConfirm = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Confirm']]");
  // PO12_TopUp.loc_selPurpose
  private readonly selPurpose = () =>
    this.page.locator("xpath=//select[@formcontrolname='loanPurpose']");
  private readonly btnFundsAndApproval = () =>
    this.page.locator("xpath=//span[normalize-space()='Funds and Approvals']");
  private readonly selDate = () =>
    this.page.locator("xpath=//input[@placeholder='DD/MM/YYYY']");
  private readonly dateArrow = () =>
    this.page.locator("xpath=//div[@class='mat-calendar-arrow']");
  private readonly selYear = () =>
    this.page.locator(
      "xpath=(//div[@class='mat-calendar-body-cell-content'])[1]",
    );
  private readonly selMonth = () =>
    this.page.locator(
      "xpath=(//div[@class='mat-calendar-body-cell-content'])[2]",
    );
  private readonly selDay = () =>
    this.page.locator(
      "xpath=(//div[@class='mat-calendar-body-cell-content'])[2]",
    );
  private readonly selTimeFrom = () =>
    this.page.locator("xpath=//input[@placeholder='From']");
  private readonly selTime = () =>
    this.page.locator("xpath=//span[@class='active']");
  private readonly btnOk = () =>
    this.page.locator("xpath=//span[normalize-space()='Ok']");
  private readonly selTimeTo = () =>
    this.page.locator("xpath=//input[@placeholder='To']");
  private readonly selTimeINPM = () =>
    this.page.locator("xpath=//button[normalize-space()='PM']");
  private readonly selTimeTHour = () =>
    this.page.locator("xpath=//span[@class='active']");
  private readonly btnAdd = () =>
    this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
  private readonly selScheme = () =>
    this.page.locator("xpath=//select[@formcontrolname='schemeId']");
  private readonly selUserType = () =>
    this.page.locator("xpath=//select[@formcontrolname='userType']");
  private readonly selAppraiser = () =>
    this.page.locator("xpath=//select[@formcontrolname='appraiserId']");
  private readonly assignReleaser = () =>
    this.page.locator("xpath=//button[contains(.,'Assign Releaser')]");
  private readonly btnCollect = () =>
    this.page.locator("xpath=//button[normalize-space()='Collect']");
  private readonly fullReleaseFinalProcess = () =>
    this.page.locator("xpath=//span[normalize-space()='Final Full Release']");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  // Inline branch dropdown
  private readonly branchDropdown = () =>
    this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () =>
    this.page.locator("xpath=//button[@type='submit']");
  // PO10_QuickPayment.loc_LoanDetails
  private readonly loanDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  // PO10_QuickPayment.loc_kebabMenu
  private readonly kebabMenu = () =>
    this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
  // PO10_QuickPayment.loc_netBanking
  private readonly netBanking = () =>
    this.page.locator("xpath=//img[@alt='netbanking']");
  // PO10_QuickPayment.loc_selPayment

  // PO13_RenewLoan.loc_btnYes
  private readonly btnYesRenew = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  // PO15_PartRelease.loc_btnJwellaryReleaseFinalProcess
  private readonly btnJwellaryReleaseFinalProcess = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Final Process']",
    );
  // PO15_PartRelease.loc_customerHomeIn
  private readonly customerHomeIn = () =>
    this.page.locator("xpath=//button[normalize-space()='Customer Home In']");
  // PO15_PartRelease.loc_btnCamera
  private readonly btnCamera = () =>
    this.page.locator("xpath=//i[@class='fas fa-camera']");
  // PO15_PartRelease.loc_btnAttach
  private readonly btnAttach = () =>
    this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
  private readonly btnYesAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
  // PO13_RenewLoan.loc_btnYes
  // PO08_PacketSubmissionAppraiser locators (re-declared for update())
  private readonly inputField = () =>
    this.page.locator("xpath=//input[@formcontrolname='Barcode']");
  private readonly btnVerify = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']",
    );
  private readonly textField = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
  private readonly UniqField = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique ID']");
  private readonly inputMobileNumber = () =>
    this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly btnOTP = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']",
    );
  private readonly inputOTP = () =>
    this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnUpdate = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");

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
    const data = getLoginData();
    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.fullReleaseOnlinePay();
    await this.page.waitForTimeout(15000);
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
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails();
    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.textField().fill(customerData.customerId.trim());
    await this.page.waitForTimeout(5000);
    console.log(customerData.customerId);
    await this.waitForLoaderToDisappear();
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    // Read customer ID
    const element = this.page.locator(
      "xpath=(//td[@class='ui-resizable-column p-element p-frozen-column ng-star-inserted'])[1]",
    );
    const str = (await element.innerText()).trim();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.jewllaryRelease().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.fullReleaseBtn().click();

    await this.page.waitForTimeout(5000);

    const proceed = this.page.locator(
      "//button[.//span[normalize-space()='Proceed']]",
    );

    await proceed.waitFor({ state: "visible", timeout: 30000 });

    //await proceed.scrollIntoViewIfNeeded();
    await proceed.click();
    console.log("Proceed button is visible, clicking..." + proceed);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();

    const payment = this.selPayment();

    await payment.waitFor({
      state: "visible",
      timeout: 30000,
    });

    console.log("Payment count:", await payment.count());
    await payment.scrollIntoViewIfNeeded();

    const options = await payment.locator("option").allTextContents();

    console.log("Payment dropdown options:", options);

    await this.page.waitForFunction(() => {
      const select = document.querySelector(
        "select[name='showPaymentValue']",
      ) as HTMLSelectElement;

      return select && select.options.length > 1;
    });

    await payment.selectOption({
      label: "PAYMENT GATEWAY",
    });
    //await this.selPayment().selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking().click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm()).toBeVisible();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.btnYesAssign().click();
    await this.page.waitForTimeout(5000);
    // Switch into Razorpay iframe
    const iframeEl = this.page.locator(
      "xpath=//iframe[@class='razorpay-checkout-frame']",
    );
    await iframeEl.waitFor({ state: "attached" });
    const frame =
      this.page.frame({ url: /razorpay/ }) ??
      this.page.frames().find((f) => f.url().includes("razorpay"));
    if (frame) {
      await frame.waitForTimeout(5000);
      await frame.fill(
        "xpath=//input[@placeholder='Search for Banks']",
        "State Bank of India",
      );
      await frame.waitForTimeout(5000);
      await frame.click("xpath=(//span[contains(.,'State Bank of India')])[1]");
      const popupPromise = this.page.context().waitForEvent("page");
      await frame.click("xpath=//button[contains(.,'Continue & Pay')]");
      const popup = await popupPromise;
      await popup.waitForLoadState();

      const successBtn = popup.getByRole("button", { name: "Success" });

      await successBtn.waitFor({ state: "visible", timeout: 5000 });

      await successBtn.click();
    } else {
      // fallback: use frameLocator
      const razorFrame = this.page.frameLocator(
        "xpath=//iframe[@class='razorpay-checkout-frame']",
      );
      await this.page.waitForTimeout(5000);
      await razorFrame
        .locator("xpath=//input[@placeholder='Search for Banks']")
        .fill("State Bank of India");
      await this.page.waitForTimeout(5000);
      await razorFrame
        .locator("xpath=(//span[contains(.,'State Bank of India')])[1]")
        .click();
      const popupPromise = this.page.context().waitForEvent("page");
      await razorFrame
        .locator("xpath=//button[contains(.,'Continue & Pay')]")
        .click();
      const popup = await popupPromise;
      await popup.waitForLoadState();

      const successBtn = popup.getByRole("button", { name: "Success" });

      await successBtn.waitFor({ state: "visible", timeout: 5000 });

      await successBtn.click();
    }
    await this.page.waitForTimeout(2000);
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
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.btnFundsAndApproval().click();
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval().click();
    await this.fullReleaseApproval().click();
    await this.page.waitForTimeout(5000);
    await this.UniqField().fill(customerData.customerId.trim());
    await this.page.waitForTimeout(5000);
    console.log(customerData.customerId);
    await this.waitForLoaderToDisappear();
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.assignReleaser().click();
    await this.page.waitForTimeout(5000);
    const userType = this.page.locator("//select[@formcontrolname='userType']");

    await userType.waitFor({
      state: "visible",
      timeout: 30000,
    });

    await userType.selectOption("appraiser");
    await this.page.waitForTimeout(5000);
    const appraiser = this.page.locator(
      "//select[@formcontrolname='appraiserId']",
    );

    await appraiser.waitFor({
      state: "visible",
      timeout: 30000,
    });

    await appraiser.selectOption("2717");

    await appraiser.dispatchEvent("change");

    console.log("Selected value:", await appraiser.inputValue());
    await this.page.waitForTimeout(5000);
    await this.btnAdd().click();
    await this.page.waitForTimeout(5000);
    await this.btnJwellaryReleaseFinalProcess().click();
    await this.fullReleaseFinalProcess().click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.UniqField().fill(customerData.customerId.trim());
    await this.page.waitForTimeout(5000);
    console.log(customerData.customerId);
    const collect = this.btnCollect();

    console.log("Collect count:", await collect.count());

    await collect.waitFor({
      state: "visible",
      timeout: 60000,
    });

    await collect.scrollIntoViewIfNeeded();

    await collect.click();
    await this.page.waitForTimeout(5000);
    const packetID = await this.page
      .locator("//label[contains(text(),'Packet ID')]/following::div[3]")
      .innerText();

    console.log(packetID);
    await this.page.locator("//input[@placeholder='Barcode']").fill(packetID);
    await this.page.waitForTimeout(5000);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.inputMobileNumber().fill(data.partnerNumber);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP().fill("1234");
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.customerHomeIn().click();
    await this.waitForLoaderToDisappear();

    const packet = await this.page
      .locator("xpath=//label[contains(text(),'Packet ID')]/following::div[3]")
      .innerText();

    console.log(packet);
    await this.page.locator("//input[@placeholder='Barcode']").fill(packet);
    await this.page.waitForTimeout(5000);
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
    await this.inputOTP().fill("1234");
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();
  }
}
