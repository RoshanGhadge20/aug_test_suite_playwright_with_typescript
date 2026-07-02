import { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import customerData from "../../testdata/admin/documents/customerData.json";
import { NewGoldLoanPage } from "./new-gold-loan.page";
import { AssignPacketPage } from "./assign-packet.page";
import { RenewLoanPage } from "./renew-loan.page";
import { OpsApprovalPage } from "./ops-approval.page";
/**
 * Port of Java: PO15_PartRelease (locators) + Flow17_PartReleaseLoan.partRelease() (actions)
 *
 * The active (non-commented) Flow17_PartReleaseLoan.partRelease() delegates entirely to
 * Flow09_PacketSubmission.packetSubmission() (the existing packetSubmission flow).
 * This page object ports the partRelease() method which calls packetSubmission.
 *
 * Additional methods ported (even though commented-out in partRelease):
 *   - partReleaseOnlinePay(): online payment flow for part release.
 *   - update(): collect, fill barcode, verify, OTP, update steps.
 *   - selectLead(): appraiser-side assign-packet + file-upload helper.
 *
 * Cross-page locator notes:
 *   - All re-declarations follow the same pattern as other TC02 page objects.
 *   - `inputField` re-declares PO08_PacketSubmissionAppraiser.loc_inputField.
 *   - `btnVerify` re-declares PO08_PacketSubmissionAppraiser.loc_btnVerify.
 *   - `inputMobileNumber` re-declares PO08_PacketSubmissionAppraiser.loc_inputMobileNumber.
 *   - `btnOTP` re-declares PO08_PacketSubmissionAppraiser.loc_btnOTP.
 *   - `inputOTP` re-declares PO08_PacketSubmissionAppraiser.loc_inputOTP.
 *   - `btnUpdate` re-declares PO08_PacketSubmissionAppraiser.loc_btnUpdate.
 *   - `jewllaryRelease` re-declares PO16_FullRelease.loc_jewllaryRelease.
 *   - `jwellaryReleaseApproval` re-declares PO16_FullRelease.loc_jwellaryReleaseApproval.
 *
 * Omitted loginWith* calls:
 *   - Flow17_PartReleaseLoan.partRelease() called Flow09_PacketSubmission.packetSubmission()
 *     which itself calls loginWithAppraiser() — OMITTED.
 *     Role = appraiser; caller must inject via loginAs('appraiser').
 *
 * Data note:
 *   - Java used `partnerNumber` (BrowserInitialize static) → mapped to getLoginData().accountNumber.
 */
export class PartReleasePage extends AdminBasePage {
  private newGoldLoanPage: NewGoldLoanPage;
  private assignPacketPage: AssignPacketPage;
  private renewLoanPage = new RenewLoanPage(this.page);

  constructor(page: Page) {
    super(page);
    this.newGoldLoanPage = new NewGoldLoanPage(page);
    this.assignPacketPage = new AssignPacketPage(page);
  }

  // ── Locators (from PO15_PartRelease) ──────────────────────────────────────

  private readonly checkbox = () =>
    this.page.locator(
      "xpath=(//label[@class='custom-checkbox']//input[@type='checkbox'])[1]",
    );
  private readonly btnRelease = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Release']/ancestor::button",
    );
  private readonly partRelease = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Part Release Approval']",
    );
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly customerIDfield = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique ID']");
  private readonly btnUpdateAppraiser = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='apply-kyc'][normalize-space()='Update Appraiser'])[1]",
    );
  private readonly btnNext = () =>
    this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  private readonly btnOk = () =>
    this.page.locator("xpath=//button[@type='submit']");
  private readonly loanID = () =>
    this.page.locator("xpath=//span[contains(.,'Done')]");
  private readonly btnUpdte = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly btnJwellaryReleaseFinalProcess = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Final Process']",
    );
  private readonly btnUploadDocuments = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
  private readonly btnProceed = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  private readonly partReleaseFinalProcess = () =>
    this.page.locator("xpath=//span[normalize-space()='Final Part Release']");
  private readonly btnCollect = () =>
    this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer')]//button[normalize-space()='Collect'])[1]",
    );
  private readonly AssignPacket = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='red-button'][normalize-space()='Assign Packet'])[1]",
    );
  private readonly selectPacket = () =>
    this.page.locator("xpath=//select[@formcontrolname='packetId']");
  private readonly btnAddPacket = () =>
    this.page.locator("xpath=//button[@type='submit']");
  private readonly ornamenttype = () =>
    this.page.locator("xpath=//span[@class='ng-arrow-wrapper']");
  private readonly btnSave = () =>
    this.page.locator("xpath=//span[contains(.,'Save')]");
  private readonly customerUniqID = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
  private readonly customerHomeIn = () =>
    this.page.locator("xpath=//button[normalize-space()='Customer Home In']");
  private readonly btnCamera = () =>
    this.page.locator("xpath=//i[@class='fas fa-camera']");
  private readonly btnAttach = () =>
    this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
  private readonly btnYesAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
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
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO10_QuickPayment.loc_btnConfirm
  private readonly btnConfirm = () =>
    this.page.locator("xpath=//span[normalize-space()='Confirm']");
  // PO12_TopUp.loc_selPurpose
  private readonly selPurpose = () =>
    this.page.locator("xpath=//select[@formcontrolname='loanPurpose']");
  // PO13_RenewLoan.loc_btnYes
  private readonly btnYesRenew = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  // PO16_FullRelease.loc_jewllaryRelease
  private readonly jewllaryRelease = () =>
    this.page.locator("xpath=//button[normalize-space()='Jewellery Release']");
  // PO16_FullRelease.loc_jwellaryReleaseApproval
  private readonly jwellaryReleaseApproval = () =>
    this.page.locator(
      "xpath=//a[contains(@class,'kt-menu__link') and .//span[normalize-space()='Jewellery Release Approval']]",
    );
  private readonly appraisalRequest = () =>
    this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
  private readonly selectAppraiser = () =>
    this.page.locator("xpath=//select[@formcontrolname='appraiserId']");

  private readonly customerManagementBtn = () =>
    this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
  // PO08_PacketSubmissionAppraiser locators (re-declared)
  private readonly textField = () =>
    this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly inputField = () =>
    this.page.locator("xpath=//input[@formcontrolname='Barcode']");
  private readonly btnVerify = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']",
    );
  // PO05_AssignPacket.loc_btnDone
  private readonly btnDoneAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  private readonly inputMobileNumber = () =>
    this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly btnOTP = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']",
    );
  private readonly btnFundsAndApproval = () =>
    this.page.locator(
      "xpath=//a[.//span[normalize-space()='Funds and Approvals']]",
    );
  private readonly inputOTP = () =>
    this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnUpdate = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly selScheme = () =>
    this.page.locator("xpath=//select[@formcontrolname='schemeId']");
  private readonly partnerApproval = () =>
    this.page.locator("xpath=//button[contains(.,'PARTNER APPROVAL')]");
  // PO07_OpsTeamLoanApproval.loc_checkClick
  private readonly checkClick = () =>
    this.page.locator(
      "xpath=//img[contains(@name,'incorrectApplicationFormForOperatinalTeam')]",
    );
  // PO07_OpsTeamLoanApproval.loc_checkClick1
  private readonly checkClick1 = () =>
    this.page.locator(
      "xpath=//img[contains(@name,'incorrectGoldValuationForOperatinalTeam')]",
    );
  // PO07_OpsTeamLoanApproval.loc_btnSubmit
  private readonly btnSubmitOps = () =>
    this.page.locator("xpath=//button[span[normalize-space()='Submit']]");
  // ── Actions (from Flow17_PartReleaseLoan.partRelease) ─────────────────────

  /**
   * Port of Java Flow17_PartReleaseLoan.partRelease().
   *
   * NOTE: loginWithAppraiser() (via packetSubmission()) is OMITTED.
   * Role = appraiser; caller must inject via loginAs('appraiser').
   *
   * The active (non-commented) body calls Flow09_PacketSubmission.packetSubmission().
   * Since we have PacketSubmissionPage in the fixture, the spec wires this.
   * This method contains only the preamble + sleep as in Java, then delegates.
   * The spec calls packetSubmission.packetSubmission() for the actual step.
   */ getRandomAPacketCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  async partnerPartReleaseApproval(): Promise<void> {
    const data = getLoginData();

    await this.expandSidebar();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    //await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(2500);
    await this.filterbtn().click();
    await this.page.waitForTimeout(5000);

    await this.partnerApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.clickNextSafely(7);
    await this.page.waitForTimeout(5000);

    await this.checkClick().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.checkClick1().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const statusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForPartner']",
    );
    await statusDropdown.selectOption({ label: "Approved" });
    await this.page.waitForTimeout(2000);

    await this.btnSubmitOps().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
  }
  async clickNextSafely(times: number = 1) {
    for (let i = 0; i < times; i++) {
      const nextBtn = this.page
        .locator("//button[span[normalize-space()='Next']]")
        .first();

      await nextBtn.waitFor({
        state: "visible",
        timeout: 30000,
      });

      await nextBtn.scrollIntoViewIfNeeded();

      console.log(`Clicking Next button: ${i + 1}`);

      await nextBtn.click();

      await this.page.waitForTimeout(1000);
    }
  }
  async partReleaseLoan(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.partReleaseOnlinePay();
    await this.update();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.appraisalRequest().waitFor({ state: "visible" });
    await this.appraisalRequest().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.textField().fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    await this.page.waitForTimeout(5000);
    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await this.page.evaluate(
      (el) => {
        (el as any).scrollLeft = (el as any).scrollWidth;
      },
      await scrollDiv.elementHandle(),
    );
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);
    await this.page
      .locator("//button[contains(@class,'mat-menu-trigger')]")
      .first()
      .click();
    await this.page.waitForTimeout(2000);
    await this.page.getByRole("menuitem", { name: "Apply Loan" }).click();
    await this.page.waitForTimeout(4000);
    await this.btnOk().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    await this.clickNextSafely(3);
    const calculateBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Calculate']]",
    );
    await calculateBtn.waitFor({ state: "visible", timeout: 30000 });
    console.log("Visible:", await calculateBtn.isVisible());
    console.log("Enabled:", await calculateBtn.isEnabled());
    await calculateBtn.scrollIntoViewIfNeeded();
    try {
      await calculateBtn.click({ timeout: 10000 });
    } catch (e) {
      console.log("Normal click failed, trying force click...");
      await calculateBtn.click({ force: true });
    }
    await this.btnNext().click();
    await this.page.waitForTimeout(2000);
    await this.newGoldLoanPage.validateBankDetailsWithAdvanceCash();
    await this.btnNext().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.page.waitForTimeout(5000);
  }
  async assignPacket(packetCode: string): Promise<void> {
    const data1 = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID().fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    // await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.AssignPacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);

    await this.selectPacket().click();
    await this.waitForLoaderToDisappear();

    //     // Select the packet option containing the code (Java line 109: String code = packetCode.trim())
    const code = packetCode.trim();

    const options = await this.selectPacket()
      .locator("option")
      .allTextContents();

    console.log("Packet Code:", code);
    console.log("Dropdown Options:", options);

    await this.selectPacket().selectOption({
      label: `${code} (${code})`,
    });
    await this.page.waitForTimeout(5000);

    await this.ornamenttype().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.checkbox().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnAddPacket().click();
    await this.waitForLoaderToDisappear();

    //await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.page.waitForTimeout(2000);

    for (let i = 0; i < 4; i++) {
      const placeholder = this.page
        .locator("//img[contains(@src,'image-placeholder.png')]")
        .first();

      await placeholder.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await placeholder.click();

      const cameraBtn = this.page.locator("//img[contains(@src,'camera.svg')]");

      await cameraBtn.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await cameraBtn.click();

      await this.page.waitForTimeout(5000);
    }

    await this.page.waitForTimeout(2000);

    await this.btnSave().click();
    await this.waitForLoaderToDisappear();
    await this.btnYes().click();

    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(5000);
    console.log("Before validateUploadDocuments");
    await this.renewLoanPage.validateUploadDocumnets();
    console.log("After validateUploadDocuments");
    await this.page.waitForTimeout(15000);
    // await this.assignPacketPage.downloadAndUploadCashReceipt();
    // await this.page.waitForTimeout(5000);
    // // Download and re-upload Cash Declaration
    // await this.assignPacketPage.downloadAndUploadCashDeclaration();
    // await this.page.waitForTimeout(5000);
    // Save
    const saveBtn = this.page.locator(
      "xpath=//button[normalize-space()='Save']",
    );
    await saveBtn.waitFor({ state: "attached", timeout: 30000 });
    //await saveBtn.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);
    await this.jsClick(saveBtn);
    await this.page.waitForTimeout(2000);
    await this.waitForLoaderToDisappear();

    // Yes
    await this.btnYesAssign().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // // Lead converter dropdown
    const dropdownEle = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );
    await dropdownEle.waitFor({ state: "visible", timeout: 20000 });
    await this.page.waitForTimeout(1000);
    try {
      await dropdownEle.selectOption({ label: "Priyanka Thorat" });
    } catch {
      // option not available — skip
    }
    await this.page.waitForTimeout(1000);
    await this.btnDoneAssign().click();
    await this.waitForLoaderToDisappear();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(5000);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(5000);
  }

  // ── Actions (from Flow17_PartReleaseLoan.partReleaseOnlinePay) ────────────

  /**
   * Port of Java Flow17_PartReleaseLoan.partReleaseOnlinePay().
   *
   * Navigates to Loan Details, reads customer ID, clicks Jewellery Release,
   * checks checkbox, selects purpose (Business Expansion), selects PAYMENT GATEWAY / netbanking,
   * confirms, switches to Razorpay iframe / SBI / Success popup.
   */
  async partReleaseOnlinePay(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails();
    //await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    // await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(5000);
    await this.textField().fill(customerData.customerId.trim());
    await this.page.waitForTimeout(2000);
    console.log(customerData.customerId);
    await this.waitForLoaderToDisappear();
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();

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
    const check = this.page.locator("xpath=(//input[@type='checkbox'])[1]");
    await check.dispatchEvent("click");
    await this.page.waitForTimeout(5000);
    await this.btnRelease().click();

    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(5000);
    await this.selScheme().selectOption({
      label: "[ALL] FLEXI 540-30 (100000 - 1600000)",
    });
    await this.page.waitForTimeout(2000);
    await this.selPurpose().selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(5000);
    //await this.btnProceed().click();
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

  // ── Actions (from Flow17_PartReleaseLoan.update) ──────────────────────────

  /**
   * Port of Java Flow17_PartReleaseLoan.update().
   *
   * Clicks Collect, reads barcode, fills barcode field, verifies, sends OTP, updates.
   * Data note: Java used `partnerNumber` → mapped to getLoginData().accountNumber.
   */
  async update(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.btnFundsAndApproval().click();
    await this.page.waitForTimeout(5000);
    // await this.jwellaryReleaseApproval().click();
    // await this.page.waitForTimeout(5000);
    // await this.partRelease().click();
    await this.btnJwellaryReleaseFinalProcess().click();
    await this.page.waitForTimeout(5000);
    await this.partReleaseFinalProcess().click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.textField().fill(customerData.customerId.trim());
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
