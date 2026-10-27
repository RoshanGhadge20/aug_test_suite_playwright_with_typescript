import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class CpvPage extends AdminBasePage {
  private readonly viewLoan: Locator;
  private readonly view: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly allCustomers: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly kebabMenu: Locator;
  private readonly startNewGL: Locator;
  private readonly btnAdd: Locator;
  private readonly appraiserRequests: Locator;
  private readonly textField: Locator;
  private readonly kebabMenu1: Locator;
  private readonly applyLoan: Locator;
  private readonly btnOk: Locator;
  private readonly btnNext: Locator;
  private readonly scrollableTable: Locator;
  private readonly loanManagement_packet: Locator;
  private readonly btnPacket: Locator;
  private readonly packetID: Locator;
  private readonly internalUserBranch: Locator;
  private readonly btnNewpacket: Locator;
  private readonly barCode: Locator;
  private readonly btnAddPacket: Locator;
  private readonly btnEditPacket: Locator;
  private readonly userType: Locator;
  private readonly appraiserId: Locator;
  private readonly btnUpdate: Locator;
  private readonly loanManagement: Locator;
  private readonly appliedLoan: Locator;
  private readonly assignPacketBtn: Locator;
  private readonly selectPacket: Locator;
  private readonly packetIdDropdown: Locator;
  private readonly ornamenttype: Locator;
  private readonly headerCheckmark: Locator;
  private readonly btnAddPacket2: Locator;
  private readonly imagePlaceholder: Locator;
  private readonly camera: Locator;
  private readonly btnSave: Locator;
  private readonly btnYesSave: Locator;
  private readonly btnUploadDocuments: Locator;
  private readonly selLead: Locator;
  private readonly btnDone: Locator;
  private readonly fileInput1: Locator;
  private readonly fileInput2: Locator;
  private readonly fileInput3: Locator;
  private readonly fileInput7: Locator;
  private readonly fileInput7dNone: Locator;
  private readonly selPartner: Locator;
  private readonly selScheme: Locator;
  private readonly loanAmountInput: Locator;
  private readonly calculateBtn: Locator;
  private readonly toBePaid: Locator;
  private readonly advanceCashField: Locator;
  private readonly wavierInput: Locator;
  private readonly loanAmountField: Locator;
  private readonly btnSubmitPacket: Locator;
  private readonly selLocation: Locator;
  private readonly selBranch: Locator;
  private readonly inputField: Locator;
  private readonly btnVerify: Locator;
  private readonly inputMobileNumber: Locator;
  private readonly btnOTP: Locator;
  private readonly inputOTP: Locator;
  private readonly btnUpdateSubmit: Locator;
  private readonly loanDetails: Locator;
  private readonly kebabMenuDetails: Locator;

  constructor(page: Page) {
    super(page);
    this.viewLoan = this.page.locator(
      "xpath=//button[contains(.,'View Loan')]",
    );
    this.view = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and normalize-space()='View'])[1]",
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
    this.customerManagementBtn = this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
    this.allCustomers = this.page.locator(
      "xpath=//span[normalize-space()='All Customers']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[text()='more_vert']])[1]",
    );
    this.startNewGL = this.page.locator(
      "xpath=//button[normalize-space()='Start New Gold Loan']",
    );
    this.btnAdd = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.appraiserRequests = this.page.locator(
      "xpath=//span[normalize-space()='Appraiser Requests']",
    );
    this.textField = this.page.locator(
      "xpath=//input[@placeholder='enter text here']",
    );
    this.kebabMenu1 = this.page.locator(
      "xpath=(//mat-row[.//*[contains(text(),'New Loan')]]//mat-icon[normalize-space()='more_vert'])[1]",
    );
    this.applyLoan = this.page.locator(
      "xpath=//button[normalize-space()='Apply Loan']",
    );
    this.btnOk = this.page.locator("xpath=//button[@type='submit']");
    this.btnNext = this.page.locator(
      "xpath=//button[span[normalize-space() = 'Next']]",
    );
    this.scrollableTable = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    this.loanManagement_packet = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.btnPacket = this.page.locator(
      "xpath=//span[normalize-space()='Packet']",
    );
    this.packetID = this.page.locator(
      "xpath=//input[@formcontrolname='packetCode']",
    );
    this.internalUserBranch = this.page.locator(
      "xpath=//select[@formcontrolname='internalUserBranch']",
    );
    this.btnNewpacket = this.page.locator(
      "xpath=//button[normalize-space()='New Packet']",
    );
    this.barCode = this.page.locator(
      "xpath=//input[@formcontrolname='barcode']",
    );
    this.btnAddPacket = this.page.locator(
      "xpath=//button[normalize-space()='Add Packet']",
    );
    this.btnEditPacket = this.page.locator(
      "xpath=//button[normalize-space()='Edit']",
    );
    this.userType = this.page.locator(
      "xpath=//select[@formcontrolname='userType']",
    );
    this.appraiserId = this.page.locator(
      "xpath=//select[@formcontrolname='appraiserId']",
    );
    this.btnUpdate = this.page.locator(
      "xpath=//button[normalize-space()='Update']",
    );
    this.loanManagement = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    this.assignPacketBtn = this.page.locator(
      "xpath=//button[normalize-space()='Assign Packet']",
    );
    this.selectPacket = this.page.locator(
      "xpath=//button[normalize-space()='Select Packet']",
    );
    this.packetIdDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='packetId']",
    );
    this.ornamenttype = this.page.locator(
      "xpath=//button[normalize-space()='Ornament Type']",
    );
    this.headerCheckmark = this.page.locator(
      "xpath=//span[@class='checkmark checkmark-custom header-checkmark']",
    );
    this.btnAddPacket2 = this.page.locator(
      "xpath=//button[normalize-space()='Add Packet']",
    );
    this.imagePlaceholder = this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/image-placeholder.png']",
    );
    this.camera = this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
    this.btnSave = this.page.locator(
      "xpath=//button[normalize-space()='Save']",
    );
    this.btnYesSave = this.page.locator(
      "xpath=//button[normalize-space()='Yes']",
    );
    this.btnUploadDocuments = this.page.locator(
      "xpath=//button[normalize-space()='Upload Documents']",
    );
    this.selLead = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );
    this.btnDone = this.page.locator(
      "xpath=//button[normalize-space()='Done']",
    );
    this.fileInput1 = this.page.locator("xpath=(//input[@type='file'])[1]");
    this.fileInput2 = this.page.locator("xpath=(//input[@type='file'])[2]");
    this.fileInput3 = this.page.locator("xpath=(//input[@type='file'])[3]");
    this.fileInput7 = this.page.locator("xpath=(//input[@type='file'])[7]");
    this.fileInput7dNone = this.page.locator(
      "xpath=(//input[@type='file' and contains(@class, 'd-none')])[7]",
    );
    this.selPartner = this.page.locator(
      "xpath=//select[@formcontrolname='partnerId']",
    );
    this.selScheme = this.page.locator(
      "xpath=//select[@formcontrolname='schemeId']",
    );
    this.loanAmountInput = this.page.locator(
      "xpath=//input[@formcontrolname='finalLoanAmount']",
    );
    this.calculateBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Calculate']]",
    );
    this.toBePaid = this.page.locator(
      "xpath=//td[normalize-space(text())='To be paid']/following-sibling::td[@class='currency']",
    );
    this.advanceCashField = this.page.locator(
      "xpath=//td//input[@formcontrolname='advanceCash']",
    );
    this.wavierInput = this.page.locator(
      "xpath=//input[@formcontrolname='wavier']",
    );
    this.loanAmountField = this.page.locator(
      "xpath=//td[normalize-space(.)='Loan Amount']/following-sibling::td[contains(@class,'currency')]",
    );
    this.btnSubmitPacket = this.page.locator(
      "xpath=//button[normalize-space()='Submit Packet']",
    );
    this.selLocation = this.page.locator(
      "xpath=//select[@formcontrolname='locationId']",
    );
    this.selBranch = this.page.locator(
      "xpath=//select[@formcontrolname='branchId']",
    );
    this.inputField = this.page.locator(
      "xpath=//input[@formcontrolname='address']",
    );
    this.btnVerify = this.page.locator(
      "xpath=//button[normalize-space()='Verify']",
    );
    this.inputMobileNumber = this.page.locator(
      "xpath=//input[@formcontrolname='mobileNumber']",
    );
    this.btnOTP = this.page.locator(
      "xpath=//button[normalize-space()='Send OTP']",
    );
    this.inputOTP = this.page.locator("xpath=//input[@formcontrolname='otp']");
    this.btnUpdateSubmit = this.page.locator(
      "xpath=//button[normalize-space()='Update']",
    );
    this.loanDetails = this.page.locator(
      "xpath=//span[normalize-space()='Loan Details']",
    );
    this.kebabMenuDetails = this.page.locator(
      "xpath=(//button[.//mat-icon[text()='more_vert']])[1]",
    );
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow51_ValidateAddCpvAndAttchedCpvWithArvogPartner.validateAddCPVAndAttchCpv()
   * appraiser portion (after precondition KYC done).
   * Caller must first loginAs('appraiser').
   * Returns packetCode for use in subsequent role segments.
   */
  async validateAddCPVAndAttchCpv_appraiserApplyLoan(): Promise<string> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — confirmed live (renew-zero.page.ts,
    // loan-defects.page.ts) that switching this account's branch scope gets the backend to
    // reject the session outright (403/401, forced redirect to /auth/login). Only applied to
    // appraiser methods here — the ops method (validateAddCPVAndAttchCpv_opsPacket) is left
    // as-is since no live evidence yet confirms/denies the same bug for the ops role.
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.customerManagementBtn.click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers.click();
    await this.waitForLoaderToDisappear();
    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    // noWaitAfter: this button is type="submit" inside a <form> — Playwright detects a real
    // navigation attempt from the native submit and hangs waiting for it to "finish" even
    // though Angular's (ngSubmit) handler already intercepted it client-side (same fix as
    // renew-zero.page.ts / manual-charges.page.ts / loan-view.page.ts / custom-cancel.page.ts
    // / waiver.page.ts / ops-approval.page.ts).
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.startNewGL.click();
    await this.waitForLoaderToDisappear();
    await this.btnAdd.click();
    await this.page.waitForTimeout(3000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.appraiserRequests.waitFor({ state: "visible" });
    await this.appraiserRequests.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.textField.fill(data.firstName);
    await this.scrollableTable.click();
    await this.scrollableTable.evaluate((el) => {
      (el as any).scrollLeft = (el as any).scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await this.scrollableTable.click();
    await this.scrollableTable.evaluate((el) => {
      (el as any).scrollLeft = 0;
    });
    await this.page.waitForTimeout(3000);

    await this.jsClick(this.kebabMenu1);
    await this.jsClick(this.applyLoan);
    await this.btnOk.click();
    await this.waitForLoaderToDisappear();

    // Basic details, nominee (Next x2), ornaments
    await this.selectFromDropdown(
      this.page.locator("xpath=//select[@formcontrolname='purpose']"),
      "Business Expansion",
    );
    await this.safeClickLocal(this.btnNext);
    await this.page.waitForTimeout(5000);
    await this.safeClickLocal(this.btnNext); // nominee next
    // Ornaments (reuse helper)
    await this.addOrnaments();
    // FIC page — Arvog
    await this.validateFICPage_arvog();
    // Bank details advance cash
    await this.validateBankDetailsWithAdvanceCash();

    // After this: caller must loginAs('ops') to create packet
    return this.getRandomAPacketCode();
  }

  /**
   * Port of ops segment — create and configure packet.
   * Caller must first loginAs('ops').
   * Pass the same packetCode generated in appraiserApplyLoan or generate new one.
   */
  async validateAddCPVAndAttchCpv_opsPacket(): Promise<string> {
    const packetCode = this.getRandomAPacketCode();

    await this.page.waitForTimeout(7000);
    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Confirmed live: selecting any branch scope other than the account's own assigned
    // branch gets the session force-logged-out on UAT within ~3s (backend rejects
    // subsequent calls with 401/403, Angular's http interceptor redirects to /auth/login).
    // Leave the account on its default branch scope instead of calling selectOption().
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.loanManagement_packet.click();
    await this.waitForLoaderToDisappear();
    await this.btnPacket.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAdd.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    await this.packetID.fill(packetCode);
    await this.internalUserBranch.selectOption({ label: "Augmont" });
    await this.btnNewpacket.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.barCode.fill(packetCode);
    await this.barCode.click();
    await this.btnAddPacket.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.btnEditPacket.click();
    await this.waitForLoaderToDisappear();
    await this.userType.selectOption({ label: "Appraiser" });
    await this.appraiserId.selectOption({ label: "Priyanka Thorat" });
    await this.btnUpdate.click();
    await this.waitForLoaderToDisappear();

    return packetCode;
  }

  /**
   * Port of appraiser assign-packet segment.
   * Caller must first loginAs('appraiser').
   * File uploads are guarded optional params.
   */
  async validateAddCPVAndAttchCpv_appraiserAssignPacket(
    packetCode: string,
    documentPath?: string,
  ): Promise<void> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — see validateAddCPVAndAttchCpv_appraiserApplyLoan().
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
    // noWaitAfter: this button is type="submit" inside a <form> — Playwright detects a real
    // navigation attempt from the native submit and hangs waiting for it to "finish" even
    // though Angular's (ngSubmit) handler already intercepted it client-side (same fix as
    // renew-zero.page.ts / manual-charges.page.ts / loan-view.page.ts / custom-cancel.page.ts
    // / waiver.page.ts / ops-approval.page.ts).
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.assignPacketBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.selectPacket.click();
    await this.waitForLoaderToDisappear();

    const code = packetCode.trim();
    const packetOption = this.page.locator(
      `xpath=//select[@formcontrolname='packetId']//option[contains(., '${code}')]`,
    );
    await packetOption.waitFor({ state: "attached", timeout: 10000 });
    await this.packetIdDropdown.click();
    await this.page.waitForTimeout(2000);
    await packetOption.click();
    await this.page.waitForTimeout(2000);

    await this.ornamenttype.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.headerCheckmark.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAddPacket2.click();
    await this.waitForLoaderToDisappear();

    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.page.waitForTimeout(2000);

    const rows = await this.imagePlaceholder.all();
    for (const row of rows) {
      await this.page.waitForTimeout(2000);
      await row.click();
      await this.page.waitForTimeout(2000);
      await this.camera.scrollIntoViewIfNeeded().catch(() => {});
      await this.page.waitForTimeout(2000);
      await this.camera.click();
      await this.page.waitForTimeout(5000);
    }

    await this.btnSave.click();
    await this.waitForLoaderToDisappear();
    await this.btnYesSave.click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of second appraiser upload-documents segment.
   * Caller must first loginAs('appraiser').
   * File uploads are guarded optional params.
   */
  async validateAddCPVAndAttchCpv_appraiserUploadDocs(
    documentPath?: string,
  ): Promise<void> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — see validateAddCPVAndAttchCpv_appraiserApplyLoan().
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(5000);
    // noWaitAfter: this button is type="submit" inside a <form> — Playwright detects a real
    // navigation attempt from the native submit and hangs waiting for it to "finish" even
    // though Angular's (ngSubmit) handler already intercepted it client-side (same fix as
    // renew-zero.page.ts / manual-charges.page.ts / loan-view.page.ts / custom-cancel.page.ts
    // / waiver.page.ts / ops-approval.page.ts).
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.btnUploadDocuments.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    if (documentPath) {
      await this.fileInput1.waitFor({ state: "attached", timeout: 20000 });
      await this.page.waitForTimeout(15000);
      await this.fileInput1.setInputFiles(documentPath);
      await this.fileInput2.setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput3.setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput7.setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      // fileInput7dNone — CPV attachment
      await this.fileInput7dNone.setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
    } else {
      await this.page.waitForTimeout(5000);
    }

    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.btnSave.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.btnSave.click();
    await this.waitForLoaderToDisappear();

    await this.selLead.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);
    await this.selLead.selectOption({ label: "Priyanka Thorat" });
    await this.page.waitForTimeout(2000);
    await this.btnDone.click();
    await this.waitForLoaderToDisappear();
  }
  async packetSubmission(): Promise<void> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnSubmitPacket.click();
    await this.waitForLoaderToDisappear();
    await this.selLocation.selectOption({ label: "Partner Branch In" });
    await this.page.waitForTimeout(2000);
    await this.selBranch.selectOption({ label: "Hyderabad Cms" });
    await this.page.waitForTimeout(2000);

    const addressText = await this.page
      .locator("xpath=//div[@class='col-7 d-flex align-items-center']")
      .innerText()
      .catch(() => "");
    await this.page.waitForTimeout(500);
    await this.inputField.fill(addressText);
    await this.page.waitForTimeout(500);
    await this.btnVerify.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.inputMobileNumber.fill("9689598798");
    await this.page.waitForTimeout(1000);
    await this.btnOTP.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP.fill("1234");
    await this.page.waitForTimeout(500);
    await this.btnVerify.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdateSubmit.click();
    await this.waitForLoaderToDisappear();
  }
  async valiadateCPVAttachment(): Promise<boolean> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.loanDetails.scrollIntoViewIfNeeded().catch(() => {});
    await this.loanDetails.click();
    await this.waitForLoaderToDisappear();
    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    await this.kebabMenuDetails.click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan.click();
    await this.waitForLoaderToDisappear();

    await this.view.waitFor({ state: "visible", timeout: 10000 });
    return this.view.isVisible();
  }
  async validateAddCPVAndAttached_appraiserApplyLoan(): Promise<void> {
    const data = getLoginData();
    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.customerManagementBtn.click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers.click();
    await this.waitForLoaderToDisappear();
    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.startNewGL.click();
    await this.waitForLoaderToDisappear();
    await this.btnAdd.click();
    await this.page.waitForTimeout(3000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.appraiserRequests.waitFor({ state: "visible" });
    await this.appraiserRequests.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.textField.fill(data.firstName);
    await this.scrollableTable.click();
    await this.scrollableTable.evaluate((el) => {
      (el as any).scrollLeft = (el as any).scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await this.scrollableTable.click();
    await this.scrollableTable.evaluate((el) => {
      (el as any).scrollLeft = 0;
    });
    await this.page.waitForTimeout(3000);

    await this.jsClick(this.kebabMenu1);
    await this.jsClick(this.applyLoan);
    await this.btnOk.click();
    await this.waitForLoaderToDisappear();
    await this.selectFromDropdown(
      this.page.locator("xpath=//select[@formcontrolname='purpose']"),
      "Business Expansion",
    );
    await this.safeClickLocal(this.btnNext);
    await this.page.waitForTimeout(5000);
    await this.safeClickLocal(this.btnNext); // nominee
    await this.addOrnaments();
    await this.validateFICPage_nonArvog();
    await this.validateBankDetailsWithAdvanceCash();
  }

  async validateFICPage_arvog(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.selPartner.selectOption({ label: "ARVOG ARV10" });
    await this.page.waitForTimeout(2000);
    await this.selScheme.selectOption({ label: "SCHEME_LTV84 (0 - 1100000)" });
    await this.page.waitForTimeout(2000);
    await this.loanAmountInput.fill("605000");
    await this.page.waitForTimeout(5000);
    await this.calculateBtn.waitFor({ state: "visible" });
    await this.calculateBtn.dblclick();
    await this.calculateBtn.click();
    await this.page.waitForTimeout(3000);
    await this.safeClickLocal(this.btnNext);
  }

  async validateFICPage_nonArvog(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.selPartner.selectOption({ label: "ARVOG ARV-10" });
    await this.page.waitForTimeout(2000);
    await this.selScheme.selectOption({ label: "W0 (0 - 5000000)" });
    await this.page.waitForTimeout(2000);
    await this.loanAmountInput.fill("75000");
    await this.page.waitForTimeout(5000);
    await this.calculateBtn.waitFor({ state: "visible" });
    await this.calculateBtn.dblclick();
    await this.calculateBtn.click();
    await this.page.waitForTimeout(3000);
    await this.safeClickLocal(this.btnNext);
  }

  async validateBankDetailsWithAdvanceCash(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.page.evaluate("window.scrollBy(0, 1000)");
    await this.page.waitForTimeout(2000);
    await this.loanAmountField.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1000);
    await this.page.evaluate("window.scrollBy(0, -150)");
    await this.page.waitForTimeout(500);
    await this.loanAmountField.waitFor({ state: "visible" });
    await this.loanAmountField.click();
    await this.page.keyboard.press("Tab");
    await this.wavierInput.clear();
    await this.page.waitForTimeout(3000);
    await this.wavierInput.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(3000);
    await this.toBePaid.scrollIntoViewIfNeeded().catch(() => {});
    const str = await this.toBePaid
      .innerText()
      .then((t) => t.trim())
      .catch(() => "");
    const numericValue = str.replace(/[^0-9]/g, "");
    await this.advanceCashField.scrollIntoViewIfNeeded().catch(() => {});
    await this.advanceCashField.waitFor({ state: "visible" });
    await this.advanceCashField.clear();
    await this.advanceCashField.fill(numericValue);
    await this.page.waitForTimeout(4000);
    await this.safeClickLocal(this.btnNext);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async addOrnaments(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.page.evaluate("window.scrollBy(0, 1000)");
    await this.page.waitForTimeout(3000);
    await this.page.evaluate("window.scrollBy(0, -500)");
    await this.page.waitForTimeout(5000);

    const ornamentDropdownArrow = this.page.locator(
      "xpath=//input[@role='combobox']//following::span[@class='ng-arrow-wrapper']",
    );
    const ornamentOptions = this.page.locator(
      "xpath=//span[@class='ng-option-label ng-star-inserted']",
    );

    for (let i = 0; i < 2; i++) {
      await ornamentDropdownArrow.waitFor({ state: "visible" });
      await ornamentDropdownArrow.scrollIntoViewIfNeeded().catch(() => {});
      await ornamentDropdownArrow.click();

      const opts = await ornamentOptions.all();
      const indexToClick = 4 + i;
      if (opts.length > indexToClick) {
        await opts[indexToClick].click();
      }

      await this.page.waitForTimeout(5000);
      await this.page
        .locator("xpath=//input[@formcontrolname='quantity']")
        .fill("1");
      const grossWt = 300.0;
      const deductionWt = Math.random() * Math.min(1.0, grossWt);
      await this.page
        .locator("xpath=//input[@formcontrolname='grossWeight']")
        .fill(grossWt.toFixed(1));
      await this.page
        .locator("xpath=//input[@formcontrolname='deductionWeight']")
        .fill(deductionWt.toFixed(1));

      await this.page.waitForTimeout(2000);
      await this.page.locator("xpath=(//button[@type='button'])[3]").click();
      await this.page.waitForTimeout(2000);
      await this.camera.click();
      await this.page.waitForTimeout(2000);
      await this.page
        .locator("xpath=//img[@class='placeholder-image']")
        .click();
      await this.page.waitForTimeout(2000);
      await this.camera.click();
      await this.page.waitForTimeout(2000);

      await this.page
        .locator("xpath=//select[@formcontrolname='karat']")
        .selectOption({ label: "22 K HM" });
      await this.page
        .locator("xpath=//select[@formcontrolname='ltvPercent']")
        .selectOption({ label: "98 %" });

      if (i === 0) {
        const addMoreBtn = this.page.locator(
          "xpath=//button[normalize-space()='+ Add More']",
        );
        await addMoreBtn.scrollIntoViewIfNeeded().catch(() => {});
        await this.page.waitForTimeout(2000);
        await addMoreBtn.click();
      }
    }

    const nextButton = this.page.locator(
      "xpath=//button[span[normalize-space() = 'Next']]",
    );
    await nextButton.scrollIntoViewIfNeeded().catch(() => {});
    await this.safeClickLocal(nextButton);
  }

  private async selectFromDropdown(
    locator: ReturnType<typeof this.page.locator>,
    label: string,
  ): Promise<void> {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.selectOption({ label });
  }

  private async safeClickLocal(
    locator: ReturnType<typeof this.page.locator>,
  ): Promise<void> {
    try {
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await locator.waitFor({ state: "visible", timeout: 30000 });
      await locator.click();
    } catch {
      await this.jsClick(locator);
    }
  }

  private getRandomAPacketCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++)
      result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
}
