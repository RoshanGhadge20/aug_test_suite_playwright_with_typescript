import { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import fs from "fs";
import { NewGoldLoanPage } from "./new-gold-loan.page";
import { AssignPacketPage } from "./assign-packet.page";
import { RenewLoanPage } from "./renew-loan.page";
import { OpsApprovalPage } from "./ops-approval.page";
export class PartReleasePage extends AdminBasePage {
  private newGoldLoanPage: NewGoldLoanPage;
  private assignPacketPage: AssignPacketPage;
  private renewLoanPage = new RenewLoanPage(this.page);
  private readonly checkbox: Locator;
  private readonly jewelleryItemLabel: Locator;
  private readonly selPaymentType: Locator;
  private readonly paidAmountField: Locator;
  private readonly btnDoneText: Locator;
  private readonly btnCancelText: Locator;
  private readonly selReceivingBranch: Locator;
  private readonly inputBankName: Locator;
  private readonly inputBranchName: Locator;
  private readonly inputBankTransactionID: Locator;
  private readonly btnRelease: Locator;
  private readonly partRelease: Locator;
  private readonly btnYes: Locator;
  private readonly customerIDfield: Locator;
  private readonly btnUpdateAppraiser: Locator;
  private readonly btnNext: Locator;
  private readonly btnOk: Locator;
  private readonly loanID: Locator;
  private readonly btnUpdte: Locator;
  private readonly btnJwellaryReleaseFinalProcess: Locator;
  private readonly btnUploadDocuments: Locator;
  private readonly btnProceed: Locator;
  private readonly partReleaseFinalProcess: Locator;
  private readonly btnCollect: Locator;
  private readonly AssignPacket: Locator;
  private readonly selectPacket: Locator;
  private readonly btnAddPacket: Locator;
  private readonly ornamenttype: Locator;
  private readonly btnSave: Locator;
  private readonly customerUniqID: Locator;
  private readonly customerHomeIn: Locator;
  private readonly btnCamera: Locator;
  private readonly btnAttach: Locator;
  private readonly btnYesAssign: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly loanDetails: Locator;
  private readonly kebabMenu: Locator;
  private readonly netBanking: Locator;
  private readonly selPayment: Locator;
  private readonly btnConfirm: Locator;
  private readonly selPurpose: Locator;
  private readonly btnYesRenew: Locator;
  private readonly jewllaryRelease: Locator;
  private readonly jwellaryReleaseApproval: Locator;
  private readonly appraisalRequest: Locator;
  private readonly selectAppraiser: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly textField: Locator;
  private readonly inputField: Locator;
  private readonly btnVerify: Locator;
  private readonly btnDoneAssign: Locator;
  private readonly inputMobileNumber: Locator;
  private readonly btnOTP: Locator;
  private readonly btnFundsAndApproval: Locator;
  private readonly inputOTP: Locator;
  private readonly btnUpdate: Locator;
  private readonly selScheme: Locator;
  private readonly partnerApproval: Locator;
  private readonly checkClick: Locator;
  private readonly checkClick1: Locator;
  private readonly btnSubmitOps: Locator;

  constructor(page: Page) {
    super(page);
    this.newGoldLoanPage = new NewGoldLoanPage(page);
    this.assignPacketPage = new AssignPacketPage(page);
    this.checkbox = this.page.locator(
      "xpath=(//label[@class='custom-checkbox']//input[@type='checkbox'])[1]",
    );
    this.jewelleryItemLabel = this.page.locator(
      "xpath=(//label[contains(@class,'custom-checkbox')])[1]",
    );
    this.selPaymentType = this.page.locator(
      "xpath=//select[@formcontrolname='paymentType']",
    );
    this.paidAmountField = this.page.locator(
      "xpath=//input[@formcontrolname='paidAmount']",
    );
    this.btnDoneText = this.page.locator(
      "xpath=//span[normalize-space()='Done']",
    );
    this.btnCancelText = this.page.locator(
      "xpath=//span[normalize-space()='Cancel']",
    );
    this.selReceivingBranch = this.page.locator(
      "xpath=//select[@formcontrolname='receivedAmountForBranchId']",
    );
    this.inputBankName = this.page.locator(
      "xpath=//input[@formcontrolname='bankName']",
    );
    this.inputBranchName = this.page.locator(
      "xpath=//input[@formcontrolname='branchName']",
    );
    this.inputBankTransactionID = this.page.locator(
      "xpath=//input[@formcontrolname='transactionId']",
    );
    this.btnRelease = this.page.locator(
      "xpath=//span[normalize-space()='Release']/ancestor::button",
    );
    this.partRelease = this.page.locator(
      "xpath=//span[normalize-space()='Part Release Approval']",
    );
    this.btnYes = this.page.locator("xpath=//span[contains(.,'Yes')]");
    this.customerIDfield = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique ID']",
    );
    this.btnUpdateAppraiser = this.page.locator(
      "xpath=(//button[@ng-reflect-klass='apply-kyc'][normalize-space()='Update Appraiser'])[1]",
    );
    this.btnNext = this.page.locator(
      "xpath=//button[span[normalize-space() = 'Next']]",
    );
    this.btnOk = this.page
      .locator(
        "xpath=//button[@type='submit' and (normalize-space()='Ok' or .//span[normalize-space()='Ok'])]",
      )
      .first();
    this.loanID = this.page.locator("xpath=//span[contains(.,'Done')]");
    this.btnUpdte = this.page.locator(
      "xpath=//span[normalize-space()='Update']",
    );
    this.btnJwellaryReleaseFinalProcess = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Final Process']",
    );
    this.btnUploadDocuments = this.page.locator(
      "xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
    this.btnProceed = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Proceed']]",
    );
    this.partReleaseFinalProcess = this.page.locator(
      "xpath=//span[normalize-space()='Final Part Release']",
    );
    this.btnCollect = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer')]//button[normalize-space()='Collect'])[1]",
    );
    this.AssignPacket = this.page.locator(
      "xpath=(//button[@ng-reflect-klass='red-button'][normalize-space()='Assign Packet'])[1]",
    );
    this.selectPacket = this.page.locator(
      "xpath=//select[@formcontrolname='packetId']",
    );
    this.btnAddPacket = this.page.locator("xpath=//button[@type='submit']");
    this.ornamenttype = this.page.locator(
      "xpath=//span[@class='ng-arrow-wrapper']",
    );
    this.btnSave = this.page.locator("xpath=//span[contains(.,'Save')]");
    this.customerUniqID = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.customerHomeIn = this.page.locator(
      "xpath=//button[normalize-space()='Customer Home In']",
    );
    this.btnCamera = this.page.locator("xpath=//i[@class='fas fa-camera']");
    this.btnAttach = this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
    this.btnYesAssign = this.page
      .locator(
        "xpath=//button[normalize-space()='Yes' or .//span[normalize-space()='Yes']]",
      )
      .first();
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
    this.selPayment = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
    );
    this.btnConfirm = this.page
      .locator(
        "xpath=//button[normalize-space()='Confirm' or .//span[normalize-space()='Confirm']]",
      )
      .first();
    this.selPurpose = this.page.locator(
      "xpath=//select[@formcontrolname='loanPurpose']",
    );
    this.btnYesRenew = this.page.locator("xpath=//span[contains(.,'Yes')]");
    this.jewllaryRelease = this.page.locator(
      "xpath=//button[normalize-space()='Jewellery Release']",
    );
    this.jwellaryReleaseApproval = this.page.locator(
      "xpath=//a[contains(@class,'kt-menu__link') and .//span[normalize-space()='Jewellery Release Approval']]",
    );
    this.appraisalRequest = this.page.locator(
      "xpath=//span[normalize-space()='Appraiser Requests']",
    );
    this.selectAppraiser = this.page.locator(
      "xpath=//select[@formcontrolname='appraiserId']",
    );
    this.customerManagementBtn = this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
    this.textField = this.page.locator(
      "xpath=//input[@placeholder='enter text here']",
    );
    this.inputField = this.page.locator(
      "xpath=//input[@formcontrolname='Barcode']",
    );
    this.btnVerify = this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']",
    );
    this.btnDoneAssign = this.page.locator(
      "xpath=//span[normalize-space()='Done']",
    );
    this.inputMobileNumber = this.page.locator(
      "xpath=//input[@formcontrolname='mobileNumber']",
    );
    this.btnOTP = this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']",
    );
    this.btnFundsAndApproval = this.page.locator(
      "xpath=//a[.//span[normalize-space()='Funds and Approvals']]",
    );
    this.inputOTP = this.page.locator("xpath=//input[@formcontrolname='otp']");
    this.btnUpdate = this.page.locator(
      "xpath=//span[normalize-space()='Update']",
    );
    this.selScheme = this.page.locator(
      "xpath=//select[@formcontrolname='schemeId']",
    );
    this.partnerApproval = this.page.locator(
      "xpath=//button[contains(.,'PARTNER APPROVAL')]",
    );
    this.checkClick = this.page.locator(
      "xpath=//img[contains(@name,'incorrectApplicationFormForOperatinalTeam')]",
    );
    this.checkClick1 = this.page.locator(
      "xpath=//img[contains(@name,'incorrectGoldValuationForOperatinalTeam')]",
    );
    this.btnSubmitOps = this.page.locator(
      "xpath=//button[span[normalize-space()='Submit']]",
    );
  }

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

  /** Reads the customer ID most recently written by CustomerManagementPage during onboarding. */
  private getCurrentCustomerId(): string {
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    return customerData.customerId.trim();
  }

  async partnerPartReleaseApproval(): Promise<void> {
    const data = getLoginData();

    await this.expandSidebar();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    //await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID.fill(this.getCurrentCustomerId());
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2500);
    // The Filter click is dispatched (the failure screenshot shows the filtered row) but
    // Playwright's click action never returns while the grid keeps re-rendering after the request.
    // Click at DOM level so it can't hang on that, same approach as top-up's Applied Loan filter.
    const filterBtn = this.filterbtn.first();
    await filterBtn.waitFor({ state: "attached", timeout: 15000 });
    await filterBtn.evaluate((el: HTMLElement) => {
      el.scrollIntoView({ block: "center" });
      el.click();
    });
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    const partnerBtn = this.partnerApproval.first();
    await partnerBtn.waitFor({ state: "visible", timeout: 30000 });
    await partnerBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.clickNextSafely(7);
    await this.page.waitForTimeout(5000);

    await this.checkClick.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.checkClick1.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const statusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForPartner']",
    );
    await statusDropdown.selectOption({ label: "Approved" });
    await this.page.waitForTimeout(2000);

    await this.btnSubmitOps.click();
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
    await this.profile.click();

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.waitForLoaderToDisappear();
    //await this.partReleaseOnlinePay();
    //await this.update();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.customerManagementBtn.click();
    await this.waitForLoaderToDisappear();
    await this.appraisalRequest.waitFor({ state: "visible" });
    await this.appraisalRequest.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const customerIdForPartRelease = this.getCurrentCustomerId();
    const appraiserReqCustomerId = this.page
      .locator(
        "xpath=//input[contains(translate(@placeholder,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'customer unique id')]",
      )
      .first();
    await appraiserReqCustomerId.waitFor({ state: "visible", timeout: 20000 });
    await appraiserReqCustomerId.fill(customerIdForPartRelease);
    console.log(customerIdForPartRelease);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
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
    await this.btnOk.click({ noWaitAfter: true });
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
    await this.btnNext.click();
    await this.page.waitForTimeout(2000);
    await this.waitForLoaderToDisappear();
    await this.clickNextSafely(1);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.clickNextSafely(1);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.page.waitForTimeout(5000);
  }
  async assignPacket(packetCode: string): Promise<void> {
    const data1 = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    const customerIdForAssignPacket = this.getCurrentCustomerId();
    await this.customerUniqID.fill(customerIdForAssignPacket);
    console.log(customerIdForAssignPacket);
    // await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.AssignPacket.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);

    await this.selectPacket.click();
    await this.waitForLoaderToDisappear();
    const code = packetCode.trim();

    const options = await this.selectPacket.locator("option").allTextContents();

    console.log("Packet Code:", code);
    console.log("Dropdown Options:", options);

    await this.selectPacket.selectOption({
      label: `${code} (${code})`,
    });
    await this.page.waitForTimeout(5000);

    await this.ornamenttype.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.checkbox.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAddPacket.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
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

    await this.btnSave.click();
    await this.waitForLoaderToDisappear();
    await this.btnYes.click();

    await this.btnUploadDocuments.click();
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
    await this.btnYesAssign.click();
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
    await this.btnDoneAssign.click();
    await this.waitForLoaderToDisappear();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(5000);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(5000);
  }

  async partReleaseOnlinePay(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails;
    //await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    // await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(5000);
    const customerIdForOnlinePay = this.getCurrentCustomerId();
    // Loan Details filter uses the "Enter Customer Unique Id" placeholder
    await this.customerUniqID.fill(customerIdForOnlinePay);
    await this.page.waitForTimeout(2000);
    console.log(customerIdForOnlinePay);
    await this.waitForLoaderToDisappear();
    // noWaitAfter: see the fix in partnerPartReleaseApproval() above.
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

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
    const check = this.page.locator("xpath=(//input[@type='checkbox'])[1]");
    await check.dispatchEvent("click");
    await this.page.waitForTimeout(5000);
    await this.btnRelease.click();

    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(5000);
    await this.selScheme.selectOption({
      label: "[ALL] FLEXI 540-30 (100000 - 1600000)",
    });
    await this.page.waitForTimeout(2000);
    await this.selPurpose.selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(5000);
    //await this.btnProceed.click();
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

  // ── Actions (standalone, extracted for tc15-part-release-validations.spec.ts) ─

  /**
   * Navigates to Loan Details, opens Jewellery Release, selects exactly ONE jewellery
   * item (checking all of them triggers a Full Release instead of Part Release —
   * confirmed live), clicks Release, then selects a scheme (range covers this loan's
   * amount) and purpose. Stops right before Proceed so callers can branch.
   */
  private async navigateToPartReleaseSchemeScreen(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    // noWaitAfter: see partReleaseLoan() elsewhere in this file.
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.jewllaryRelease.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    await this.jewelleryItemLabel.click();
    await this.page.waitForTimeout(1000);

    await this.btnRelease.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selScheme.selectOption({
      label: "[ALL] FLEXI 540-30 (100000 - 1600000)",
    });
    await this.page.waitForTimeout(2000);
    await this.selPurpose.selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Checks Proceed is visible/enabled on the Part Release scheme screen, clicks it,
   * confirms Cancel appears on the resulting payment screen, then clicks Cancel — leaves
   * the loan unmutated (no real release/payment is submitted).
   */
  async validateProceedAndCancelButtons(): Promise<{
    proceedVisible: boolean;
    proceedEnabled: boolean;
    cancelVisible: boolean;
  }> {
    await this.navigateToPartReleaseSchemeScreen();

    const proceed = this.btnProceed;
    const proceedVisible = await proceed.isVisible();
    const proceedEnabled = await proceed.isEnabled();

    await proceed.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const cancelVisible = await this.btnCancelText
      .isVisible()
      .catch(() => false);

    await this.btnCancelText.click().catch(() => {});
    await this.waitForLoaderToDisappear();

    return { proceedVisible, proceedEnabled, cancelVisible };
  }
  private async uploadCashReceiptForPartRelease(): Promise<void> {
    const nodePath = require("path");
    const nodeFs = require("fs");
    const cashReceiptPdfPath = nodePath.resolve(
      process.cwd(),
      "testdata",
      "admin",
      "cash-receipt-download.pdf",
    );
    const fallbackPdfPath = nodePath.resolve(
      process.cwd(),
      "testdata",
      "admin",
      "singnature-sample.pdf",
    );
    let uploadPdfPath: string = fallbackPdfPath;

    const downloadImg = this.page.locator("xpath=//img[@alt='Download']");
    if ((await downloadImg.count()) > 0) {
      const cdpSession = await this.page.context().newCDPSession(this.page);

      const dialogHandler = async (dialog: any) => {
        await dialog.dismiss();
      };
      this.page.on("dialog", dialogHandler);

      try {
        await this.page.evaluate(() => {
          (window as any).print = () => {};
        });
      } catch (_) {}

      const pdfPromise = (async () => {
        await this.page.waitForTimeout(600);
        try {
          const pdf = await cdpSession.send("Page.printToPDF", {
            displayHeaderFooter: false,
            preferCSSPageSize: true,
            printBackground: true,
            paperWidth: 8.5,
            paperHeight: 11,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
          } as any);
          console.log("✓ Cash Acknowledgement captured as PDF");
          return pdf;
        } catch (err: any) {
          console.warn(`⚠ PDF capture failed: ${err.message}`);
          return null;
        }
      })();

      await downloadImg.click();

      const pdfData = await Promise.race([
        pdfPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
      ]);

      this.page.off("dialog", dialogHandler);

      if (pdfData && (pdfData as any).data) {
        nodeFs.writeFileSync(
          cashReceiptPdfPath,
          Buffer.from((pdfData as any).data, "base64"),
        );
        uploadPdfPath = cashReceiptPdfPath;
        console.log(`✓ Cash Receipt saved to: ${cashReceiptPdfPath}`);
      }

      await cdpSession.detach();
      await this.page.waitForTimeout(1000);
    }

    const signBtn = this.page
      .locator("xpath=//button[normalize-space()='Sign']")
      .or(
        this.page.locator("xpath=//button[normalize-space()='Cash Receipt']"),
      );
    if ((await signBtn.count()) > 0) {
      const fileChooserPromise = this.page
        .waitForEvent("filechooser", { timeout: 5000 })
        .catch(() => null);

      await signBtn.first().click();
      await this.page.waitForTimeout(500);

      const fileChooser = await fileChooserPromise;
      if (fileChooser) {
        try {
          await fileChooser.setFiles(uploadPdfPath);
          console.log(
            `✓ Cash Receipt uploaded via filechooser: ${uploadPdfPath}`,
          );
        } catch (err: any) {
          console.warn(`⚠ filechooser.setFiles failed: ${err.message}`);
        }
      } else {
        const fileInputs = this.page.locator("xpath=//input[@type='file']");
        const inputCount = await fileInputs.count();
        if (inputCount > 0) {
          try {
            await fileInputs.nth(inputCount - 1).setInputFiles(uploadPdfPath);
            console.log(`✓ Cash Receipt uploaded: ${uploadPdfPath}`);
          } catch (err: any) {
            console.warn(`⚠ setInputFiles failed: ${err.message}`);
          }
        }
      }
      await this.page.waitForTimeout(1000);
    }
  }

  async validateWithCashZero(): Promise<{
    paidAmount: string;
    doneVisible: boolean;
  }> {
    await this.navigateToPartReleaseSchemeScreen();

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selPayment.selectOption({ label: "CASH" });
    await this.page.waitForTimeout(2000);

    await this.uploadCashReceiptForPartRelease();

    // paymentType stays disabled until the receiving branch is selected — confirmed live.
    await this.selReceivingBranch.selectOption({ label: "Augmont" });
    await this.page.waitForTimeout(1000);

    await this.selPaymentType.selectOption({ label: "CASH WITH 0" });
    await this.page.waitForTimeout(2000);

    const paidAmount = await this.paidAmountField.inputValue().catch(() => "");
    const doneVisible = await this.btnDoneText.isVisible().catch(() => false);

    await this.btnCancelText.click().catch(() => {});
    await this.waitForLoaderToDisappear();

    return { paidAmount, doneVisible };
  }

  async update(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.btnFundsAndApproval.click();
    await this.page.waitForTimeout(5000);
    // await this.jwellaryReleaseApproval.click();
    // await this.page.waitForTimeout(5000);
    // await this.partRelease.click();
    await this.btnJwellaryReleaseFinalProcess.click();
    await this.page.waitForTimeout(5000);
    await this.partReleaseFinalProcess.click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const customerIdForUpdate = this.getCurrentCustomerId();
    const approvedListCustomerId = this.page
      .locator(
        "xpath=//input[contains(translate(@placeholder,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'customer unique id')]",
      )
      .first();
    await approvedListCustomerId.waitFor({ state: "visible", timeout: 20000 });
    await approvedListCustomerId.fill(customerIdForUpdate);
    await this.page.waitForTimeout(1000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    console.log(customerIdForUpdate);
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
  async partReleaseCronPay(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails;
    await el.click();
    await this.waitForLoaderToDisappear();

    // await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(5000);
    await this.customerUniqID.fill(this.getCurrentCustomerId());
    console.log(this.getCurrentCustomerId());
    await this.waitForLoaderToDisappear();
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    const element = this.page.locator(
      "xpath=(//td[@class='ui-resizable-column p-element p-frozen-column ng-star-inserted'])[1]",
    );
    const str = (await element.innerText()).trim();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.jewllaryRelease.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const check = this.page.locator("xpath=(//input[@type='checkbox'])[1]");
    await check.dispatchEvent("click");
    await this.page.waitForTimeout(5000);
    await this.btnRelease.click();

    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(5000);
    await this.selScheme.selectOption({
      label: "[ALL] FLEXI 540-30 (100000 - 1600000)",
    });
    await this.page.waitForTimeout(2000);
    await this.selPurpose.selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(5000);
    //await this.btnProceed.click();
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

    await this.selPayment.selectOption({ label: "CRON" });
    await this.netBanking.click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm.waitFor({ state: "visible", timeout: 30000 });
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();
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
