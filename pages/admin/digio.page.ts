import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class DigioPage extends AdminBasePage {
  private readonly loc_signDocuments: Locator;
  private readonly loc_signDocument: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly allCustomers: Locator;
  private readonly firstNameFilter: Locator;
  private readonly customerUniqID: Locator;
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
  private readonly fileInput4: Locator;
  private readonly fileInput5: Locator;
  private readonly fileInput7: Locator;
  private readonly fileInput7dNone: Locator;

  constructor(page: Page) {
    super(page);
    this.loc_signDocuments = this.page.locator(
      "xpath=//span[contains(text(),'Sign Documents')]",
    );
    this.loc_signDocument = this.page.locator(
      "xpath=//button[@class='btn btn-sm w-100 mt-3']",
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
    this.customerUniqID = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
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
    this.fileInput4 = this.page.locator("xpath=(//input[@type='file'])[4]");
    this.fileInput5 = this.page.locator("xpath=(//input[@type='file'])[5]");
    this.fileInput7 = this.page.locator("xpath=(//input[@type='file'])[7]");
    this.fileInput7dNone = this.page.locator(
      "xpath=(//input[@type='file' and contains(@class, 'd-none')])[7]",
    );
  }

  async validateDigiO(documentPath?: string): Promise<void> {
    await this.validatePackets_flow40(documentPath);
  }

  async validatePackets_flow40(documentPath?: string): Promise<void> {
    const data = getLoginData();
    const packetCode = this.getRandomAPacketCode();
    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
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
    await this.btnAddPacket.click();
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

    // NOTE: After this, caller must loginAs('appraiser') then call validatePackets_flow40_appraiserPart
    // Storing packetCode via a shared field is not ideal; instead, caller stores and passes it.
    // For simplicity in spec, this method handles both portions in one call (same session assumption).
    // The spec must ensure role is correct before calling.
    await this.validatePackets_flow40_appraiserAssign(packetCode, documentPath);
  }

  private async validatePackets_flow40_appraiserAssign(
    packetCode: string,
    documentPath?: string,
  ): Promise<void> {
    const data = getLoginData();
    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(7000);
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
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.assignPacketBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
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
    await this.page.waitForTimeout(5000);
    await this.btnUploadDocuments.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.loc_signDocuments.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1500);
    await this.loc_signDocuments.click();
    await this.page.waitForTimeout(500);
    await this.loc_signDocuments.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.loc_signDocuments.click();
    await this.loc_signDocument.click();
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
  async validateDigiOFunctionality(documentPath?: string): Promise<void> {
    const fixedCustomerId = "MHOE12GL";
    const fixedSearchId = "MHOE12G";
    const packetCode = this.getRandomAPacketCode();

    await this.page.waitForTimeout(3000);
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
    await this.customerUniqID.fill(fixedCustomerId);
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
    await this.page.waitForTimeout(7000);
    await this.appraiserRequests.waitFor({ state: "visible" });
    await this.appraiserRequests.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.textField.fill(fixedSearchId);

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
    await this.page
      .locator("xpath=//select[@formcontrolname='purpose']")
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.page
      .locator("xpath=//select[@formcontrolname='purpose']")
      .selectOption({ label: "Business Expansion" });
    await this.safeClickLocal(this.btnNext);
    await this.page.waitForTimeout(5000);
    await this.safeClickLocal(this.btnNext);
    await this.addOrnamentsArvog();
    await this.validateFICPage_arvog();
    await this.validateBankDetailsAdvanceCash();
    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.loanManagement_packet.click();
    await this.waitForLoaderToDisappear();
    await this.btnPacket.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAddPacket.click();
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
    await this.customerUniqID.fill(fixedCustomerId);
    await this.page.waitForTimeout(500);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.assignPacketBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.selectPacket.click();

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
    await this.page.waitForTimeout(500);
    await this.headerCheckmark.click();
    await this.page.waitForTimeout(2000);
    await this.btnAddPacket2.click();

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
    await this.btnYesSave.click();
    await this.waitForLoaderToDisappear();
  }
  async validateDigiOFunctionality_appraiserUploadDocs(
    fixedCustomerId = "MHOE12GL",
    documentPath?: string,
  ): Promise<void> {
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
    await this.customerUniqID.fill(fixedCustomerId);
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.btnUploadDocuments.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.loc_signDocuments.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1500);
    await this.loc_signDocuments.click();
    await this.page.waitForTimeout(500);
    await this.loc_signDocument.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.loc_signDocument.click();
    await this.page.waitForTimeout(5000);

    if (documentPath) {
      await this.fileInput1.waitFor({ state: "attached", timeout: 20000 });
      await this.page.waitForTimeout(15000);
      await this.fileInput1.setInputFiles(documentPath);
      await this.fileInput2.setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput3.setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput4.setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput5.setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput7.setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput7dNone.setInputFiles(documentPath);
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

  private async validateFICPage_arvog(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.page
      .locator("xpath=//select[@formcontrolname='partnerId']")
      .selectOption({ label: "ARVOG ARV10" });
    await this.page.waitForTimeout(2000);
    await this.page
      .locator("xpath=//select[@formcontrolname='schemeId']")
      .selectOption({ label: "SCHEME_LTV84 (0 - 1100000)" });
    await this.page.waitForTimeout(2000);
    await this.page
      .locator("xpath=//input[@formcontrolname='finalLoanAmount']")
      .fill("605000");
    await this.page.waitForTimeout(5000);
    const calcBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Calculate']]",
    );
    await calcBtn.waitFor({ state: "visible" });
    await calcBtn.dblclick();
    await calcBtn.click();
    await this.page.waitForTimeout(3000);
    await this.safeClickLocal(this.btnNext);
  }

  private async validateBankDetailsAdvanceCash(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.page.evaluate("window.scrollBy(0, 1000)");
    await this.page.waitForTimeout(2000);
    const loanAmtField = this.page.locator(
      "xpath=//td[normalize-space(.)='Loan Amount']/following-sibling::td[contains(@class,'currency')]",
    );
    await loanAmtField.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1000);
    await this.page.evaluate("window.scrollBy(0, -150)");
    await this.page.waitForTimeout(500);
    await loanAmtField.waitFor({ state: "visible" });
    await loanAmtField.click();
    await this.page.keyboard.press("Tab");
    await this.page.locator("xpath=//input[@formcontrolname='wavier']").clear();
    await this.page.waitForTimeout(3000);
    const toBePaid = this.page.locator(
      "xpath=//td[normalize-space(text())='To be paid']/following-sibling::td[@class='currency']",
    );
    await toBePaid.scrollIntoViewIfNeeded().catch(() => {});
    const str = await toBePaid
      .innerText()
      .then((t) => t.trim())
      .catch(() => "");
    const numericValue = str.replace(/[^0-9]/g, "");
    const advCash = this.page.locator(
      "xpath=//td//input[@formcontrolname='advanceCash']",
    );
    await advCash.scrollIntoViewIfNeeded().catch(() => {});
    await advCash.waitFor({ state: "visible" });
    await advCash.clear();
    await advCash.fill(numericValue);
    await this.page.waitForTimeout(4000);
    await this.safeClickLocal(this.btnNext);
  }

  private async addOrnamentsArvog(): Promise<void> {
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
      if (opts.length > indexToClick) await opts[indexToClick].click();

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
