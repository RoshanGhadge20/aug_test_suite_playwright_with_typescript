import { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import customerData from "../../testdata/admin/documents/customerData.json";

export class FullReleasePage extends AdminBasePage {
  // ── Locators (from PO16_FullRelease + cross-page re-declarations) ─────────
  private readonly jewllaryRelease: Locator;
  private readonly jwellaryReleaseApproval: Locator;
  private readonly btnProced: Locator;
  private readonly fullReleaseBtn: Locator;
  private readonly fullReleaseApproval: Locator;
  private readonly selPayment: Locator;
  private readonly btnConfirm: Locator;
  private readonly selPurpose: Locator;
  private readonly btnFundsAndApproval: Locator;
  private readonly selDate: Locator;
  private readonly dateArrow: Locator;
  private readonly selYear: Locator;
  private readonly selMonth: Locator;
  private readonly selDay: Locator;
  private readonly selTimeFrom: Locator;
  private readonly selTime: Locator;
  private readonly btnOk: Locator;
  private readonly selTimeTo: Locator;
  private readonly selTimeINPM: Locator;
  private readonly selTimeTHour: Locator;
  private readonly btnAdd: Locator;
  private readonly selScheme: Locator;
  private readonly selUserType: Locator;
  private readonly selAppraiser: Locator;
  private readonly assignReleaser: Locator;
  private readonly btnCollect: Locator;
  private readonly fullReleaseFinalProcess: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly loanDetails: Locator;
  private readonly kebabMenu: Locator;
  private readonly netBanking: Locator;
  private readonly customerUniqID: Locator;
  private readonly btnYesRenew: Locator;
  private readonly btnJwellaryReleaseFinalProcess: Locator;
  private readonly customerHomeIn: Locator;
  private readonly btnCamera: Locator;
  private readonly btnAttach: Locator;
  private readonly btnYesAssign: Locator;
  private readonly inputField: Locator;
  private readonly btnVerify: Locator;
  private readonly textField: Locator;
  private readonly UniqField: Locator;
  private readonly inputMobileNumber: Locator;
  private readonly btnOTP: Locator;
  private readonly inputOTP: Locator;
  private readonly btnUpdate: Locator;

  constructor(page: Page) {
    super(page);
    this.jewllaryRelease = this.page.locator(
      "xpath=//button[normalize-space()='Jewellery Release']",
    );
    this.jwellaryReleaseApproval = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
    this.btnProced = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Proceed']]",
    );
    this.fullReleaseBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Full Release']]",
    );
    this.fullReleaseApproval = this.page.locator(
      "xpath=//span[normalize-space()='Full Release Approval']",
    );
    this.selPayment = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
    );
    this.btnConfirm = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Confirm']]",
    );
    this.selPurpose = this.page.locator(
      "xpath=//select[@formcontrolname='loanPurpose']",
    );
    this.btnFundsAndApproval = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    this.selDate = this.page.locator(
      "xpath=//input[@placeholder='DD/MM/YYYY']",
    );
    this.dateArrow = this.page.locator(
      "xpath=//div[@class='mat-calendar-arrow']",
    );
    this.selYear = this.page.locator(
      "xpath=(//div[@class='mat-calendar-body-cell-content'])[1]",
    );
    this.selMonth = this.page.locator(
      "xpath=(//div[@class='mat-calendar-body-cell-content'])[2]",
    );
    this.selDay = this.page.locator(
      "xpath=(//div[@class='mat-calendar-body-cell-content'])[2]",
    );
    this.selTimeFrom = this.page.locator("xpath=//input[@placeholder='From']");
    this.selTime = this.page.locator("xpath=//span[@class='active']");
    this.btnOk = this.page.locator("xpath=//span[normalize-space()='Ok']");
    this.selTimeTo = this.page.locator("xpath=//input[@placeholder='To']");
    this.selTimeINPM = this.page.locator(
      "xpath=//button[normalize-space()='PM']",
    );
    this.selTimeTHour = this.page.locator("xpath=//span[@class='active']");
    this.btnAdd = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.selScheme = this.page.locator(
      "xpath=//select[@formcontrolname='schemeId']",
    );
    this.selUserType = this.page.locator(
      "xpath=//select[@formcontrolname='userType']",
    );
    this.selAppraiser = this.page.locator(
      "xpath=//select[@formcontrolname='appraiserId']",
    );
    this.assignReleaser = this.page.locator(
      "xpath=//button[contains(.,'Assign Releaser')]",
    );
    this.btnCollect = this.page.locator(
      "xpath=//button[normalize-space()='Collect']",
    );
    this.fullReleaseFinalProcess = this.page.locator(
      "xpath=//span[normalize-space()='Final Full Release']",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    this.loanManagement = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.loanDetails = this.page.locator(
      "xpath=//span[normalize-space()='Loan Details']",
    );
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.netBanking = this.page.locator("xpath=//img[@alt='netbanking']");
    this.customerUniqID = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.btnYesRenew = this.page.locator("xpath=//span[contains(.,'Yes')]");
    this.btnJwellaryReleaseFinalProcess = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Final Process']",
    );
    this.customerHomeIn = this.page.locator(
      "xpath=//button[normalize-space()='Customer Home In']",
    );
    this.btnCamera = this.page.locator("xpath=//i[@class='fas fa-camera']");
    this.btnAttach = this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
    this.btnYesAssign = this.page.locator(
      "xpath=//span[normalize-space()='Yes']",
    );
    this.inputField = this.page.locator(
      "xpath=//input[@formcontrolname='Barcode']",
    );
    this.btnVerify = this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']",
    );
    this.textField = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.UniqField = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique ID']",
    );
    this.inputMobileNumber = this.page.locator(
      "xpath=//input[@formcontrolname='mobileNumber']",
    );
    this.btnOTP = this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']",
    );
    this.inputOTP = this.page.locator("xpath=//input[@formcontrolname='otp']");
    this.btnUpdate = this.page.locator(
      "xpath=//span[normalize-space()='Update']",
    );
  }

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
    await this.profile.click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown.selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.fullReleaseOnlinePay();
    await this.page.waitForTimeout(15000);
    await this.update();
    await this.page.waitForTimeout(2000);
  }

  async fullReleaseOnlinePay(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails;
    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(5000);
    await this.customerUniqID.fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    await this.waitForLoaderToDisappear();
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    // Read customer ID
    const element = this.page.locator(
      "xpath=(//td[@class='ui-resizable-column p-element p-frozen-column ng-star-inserted'])[1]",
    );
    const str = (await element.innerText()).trim();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.jewllaryRelease.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.fullReleaseBtn.click();

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

    const payment = this.selPayment;

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
    //await this.selPayment.selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking.click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm).toBeVisible();
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.btnYesAssign.click();
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
    await this.btnFundsAndApproval.click();
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval.click();
    await this.fullReleaseApproval.click();
    await this.page.waitForTimeout(5000);
    await this.UniqField.fill(customerData.customerId.trim());
    await this.page.waitForTimeout(5000);
    console.log(customerData.customerId);
    await this.waitForLoaderToDisappear();
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.assignReleaser.click();
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
    await this.btnAdd.click();
    await this.page.waitForTimeout(5000);
    await this.btnJwellaryReleaseFinalProcess.click();
    await this.fullReleaseFinalProcess.click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.UniqField.fill(customerData.customerId.trim());
    await this.page.waitForTimeout(5000);
    console.log(customerData.customerId);
    const collect = this.btnCollect;

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
    await this.btnVerify.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.inputMobileNumber.fill(data.partnerNumber);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.btnOTP.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP.fill("1234");
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnVerify.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdate.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.customerHomeIn.click();
    await this.waitForLoaderToDisappear();

    const packet = await this.page
      .locator("xpath=//label[contains(text(),'Packet ID')]/following::div[3]")
      .innerText();

    console.log(packet);
    await this.page.locator("//input[@placeholder='Barcode']").fill(packet);
    await this.page.waitForTimeout(5000);
    await this.btnVerify.click();
    await this.waitForLoaderToDisappear();
    await this.btnCamera.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAttach.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.btnOTP.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP.fill("1234");
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnVerify.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdate.click();
    await this.waitForLoaderToDisappear();
  }
  async fullReleaseCronPay(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails;
    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.textField.fill(customerData.customerId.trim());
    await this.page.waitForTimeout(5000);
    console.log(customerData.customerId);
    await this.waitForLoaderToDisappear();
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    // Read customer ID
    const element = this.page.locator(
      "xpath=(//td[@class='ui-resizable-column p-element p-frozen-column ng-star-inserted'])[1]",
    );
    const str = (await element.innerText()).trim();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.jewllaryRelease.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.fullReleaseBtn.click();

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

    const payment = this.selPayment;

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
    await this.page.waitForTimeout(5000);
    await this.selPayment.selectOption({ label: "CRON" });
    await this.netBanking.click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm).toBeVisible();
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.btnYesAssign.click();
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
}
