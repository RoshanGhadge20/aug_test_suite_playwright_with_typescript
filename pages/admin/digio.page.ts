import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO31_DigiOFunctionality (locators) + Flow40_ValidateDigiOfunctionality
 *              + Flow41_ValidateDigiOFunctionalityArvog (actions)
 *
 * Cross-page locator notes:
 *   - All cross-page locators re-declared from PO01_KycSel, PO03_CreateNewPacket, PO05_AssignPacket,
 *     PO07_OpsTeamLoanApproval, PO09_PartnerLoanApproval, PO_Common, PO_CustomerManagement,
 *     PO_LoginLogout (re-declared locally per porting recipe).
 *
 * Role split for Flow40 (validateDigiO):
 *   1. Appraiser (after precondition GoldLoan): creates packet, assigns it, uploads with DigiO sign docs.
 *   2. Ops + Partner + Packet submission: delegated to existing POs via spec.
 *
 * Role split for Flow41 (validateDigiOFunctionality — Arvog):
 *   1. Appraiser: navigate fixed customer (MHOE12GL), apply loan, create packet, assign.
 *   2. BM approval, ops approval, Arvog partner approval, packet submission.
 *
 * File upload TODOs:
 *   - Multiple file inputs (1-4, 5, 7, 7dNone) — Java sendKeys("C:\\..."). Playwright: setInputFiles() guarded.
 *   All paths must be supplied via env vars for live runs.
 */
export class DigioPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO31_DigiOFunctionality) ───────────────────────────────

  private readonly loc_signDocuments = () => this.page.locator("xpath=//span[contains(text(),'Sign Documents')]");
  private readonly loc_signDocument = () => this.page.locator("xpath=//button[@class='btn btn-sm w-100 mt-3']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  private readonly customerManagementBtn = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  private readonly allCustomers = () => this.page.locator("xpath=//span[normalize-space()='All Customers']");
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly customerUniqID = () => this.page.locator("xpath=//input[@placeholder='Enter Customer Unique ID']");
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly kebabMenu = () => this.page.locator("xpath=(//button[.//mat-icon[text()='more_vert']])[1]");
  private readonly startNewGL = () => this.page.locator("xpath=//button[normalize-space()='Start New Gold Loan']");
  private readonly btnAdd = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  private readonly appraiserRequests = () => this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
  private readonly textField = () => this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly kebabMenu1 = () => this.page.locator("xpath=(//mat-row[.//*[contains(text(),'New Loan')]]//mat-icon[normalize-space()='more_vert'])[1]");
  private readonly applyLoan = () => this.page.locator("xpath=//button[normalize-space()='Apply Loan']");
  private readonly btnOk = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly btnNext = () => this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  private readonly scrollableTable = () => this.page.locator("xpath=//div[@class='mat-table__wrapper']");
  // Packet creation
  private readonly loanManagement_packet = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  private readonly btnPacket = () => this.page.locator("xpath=//span[normalize-space()='Packet']");
  private readonly packetID = () => this.page.locator("xpath=//input[@formcontrolname='packetCode']");
  private readonly internalUserBranch = () => this.page.locator("xpath=//select[@formcontrolname='internalUserBranch']");
  private readonly btnNewpacket = () => this.page.locator("xpath=//button[normalize-space()='New Packet']");
  private readonly barCode = () => this.page.locator("xpath=//input[@formcontrolname='barcode']");
  private readonly btnAddPacket = () => this.page.locator("xpath=//button[normalize-space()='Add Packet']");
  private readonly btnEditPacket = () => this.page.locator("xpath=//button[normalize-space()='Edit']");
  private readonly userType = () => this.page.locator("xpath=//select[@formcontrolname='userType']");
  private readonly appraiserId = () => this.page.locator("xpath=//select[@formcontrolname='appraiserId']");
  private readonly btnUpdate = () => this.page.locator("xpath=//button[normalize-space()='Update']");
  // Applied loan / assign
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  private readonly appliedLoan = () => this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
  private readonly assignPacketBtn = () => this.page.locator("xpath=//button[normalize-space()='Assign Packet']");
  private readonly selectPacket = () => this.page.locator("xpath=//button[normalize-space()='Select Packet']");
  private readonly packetIdDropdown = () => this.page.locator("xpath=//select[@formcontrolname='packetId']");
  private readonly ornamenttype = () => this.page.locator("xpath=//button[normalize-space()='Ornament Type']");
  private readonly headerCheckmark = () => this.page.locator("xpath=//span[@class='checkmark checkmark-custom header-checkmark']");
  private readonly btnAddPacket2 = () => this.page.locator("xpath=//button[normalize-space()='Add Packet']");
  private readonly imagePlaceholder = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/image-placeholder.png']");
  private readonly camera = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");
  private readonly btnSave = () => this.page.locator("xpath=//button[normalize-space()='Save']");
  private readonly btnYesSave = () => this.page.locator("xpath=//button[normalize-space()='Yes']");
  private readonly btnUploadDocuments = () => this.page.locator("xpath=//button[normalize-space()='Upload Documents']");
  private readonly selLead = () => this.page.locator("xpath=//select[@formcontrolname='leadConverterId']");
  private readonly btnDone = () => this.page.locator("xpath=//button[normalize-space()='Done']");
  private readonly fileInput1 = () => this.page.locator("xpath=(//input[@type='file'])[1]");
  private readonly fileInput2 = () => this.page.locator("xpath=(//input[@type='file'])[2]");
  private readonly fileInput3 = () => this.page.locator("xpath=(//input[@type='file'])[3]");
  private readonly fileInput4 = () => this.page.locator("xpath=(//input[@type='file'])[4]");
  private readonly fileInput5 = () => this.page.locator("xpath=(//input[@type='file'])[5]");
  private readonly fileInput7 = () => this.page.locator("xpath=(//input[@type='file'])[7]");
  private readonly fileInput7dNone = () => this.page.locator("xpath=(//input[@type='file' and contains(@class, 'd-none')])[7]");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow40_ValidateDigiOfunctionality.validateDigiO().
   * Calls validateGoldLoan() (precondition) + validatePackets().
   * Caller must first loginAs('appraiser') for the gold loan portion.
   * NOTE: precondition validateGoldLoan() delegated to existing NewGoldLoanPage via spec.
   */
  async validateDigiO(documentPath?: string): Promise<void> {
    await this.validatePackets_flow40(documentPath);
  }

  /**
   * Port of Flow40_ValidateDigiOfunctionality.validatePackets().
   * Caller must be on ops session (after validateGoldLoan precondition, loginAs('ops')).
   * Returns packetCode for subsequent use.
   */
  async validatePackets_flow40(documentPath?: string): Promise<void> {
    const data = getLoginData();
    const packetCode = this.getRandomAPacketCode();

    // Ops: create packet
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.loanManagement_packet().click();
    await this.waitForLoaderToDisappear();
    await this.btnPacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAdd().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);
    await this.packetID().fill(packetCode);
    await this.internalUserBranch().selectOption({ label: 'Augmont' });
    await this.btnNewpacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.barCode().fill(packetCode);
    await this.barCode().click();
    await this.btnAddPacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.btnEditPacket().click();
    await this.waitForLoaderToDisappear();
    await this.userType().selectOption({ label: 'Appraiser' });
    await this.appraiserId().selectOption({ label: 'Priyanka Thorat' });
    await this.btnUpdate().click();
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

    // Appraiser: assign packet and upload docs with DigiO
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(7000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan().scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();
    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.assignPacketBtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
    await this.selectPacket().click();
    await this.waitForLoaderToDisappear();

    const code = packetCode.trim();
    const packetOption = this.page.locator(`xpath=//select[@formcontrolname='packetId']//option[contains(., '${code}')]`);
    await packetOption.waitFor({ state: 'attached', timeout: 10000 });
    await this.packetIdDropdown().click();
    await this.page.waitForTimeout(2000);
    await packetOption.click();
    await this.page.waitForTimeout(2000);

    await this.ornamenttype().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.headerCheckmark().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAddPacket2().click();
    await this.waitForLoaderToDisappear();
    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(2000);

    const rows = await this.imagePlaceholder().all();
    for (const row of rows) {
      await this.page.waitForTimeout(2000);
      await row.click();
      await this.page.waitForTimeout(2000);
      await this.camera().scrollIntoViewIfNeeded().catch(() => {});
      await this.page.waitForTimeout(2000);
      await this.camera().click();
      await this.page.waitForTimeout(5000);
    }

    await this.btnSave().click();
    await this.waitForLoaderToDisappear();
    await this.btnYesSave().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // DigiO sign documents
    await this.loc_signDocuments().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1500);
    await this.loc_signDocuments().click();
    await this.page.waitForTimeout(500);
    await this.loc_signDocuments().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.loc_signDocuments().click();
    await this.loc_signDocument().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    if (documentPath) {
      await this.fileInput1().waitFor({ state: 'attached', timeout: 20000 });
      await this.page.waitForTimeout(15000);
      await this.fileInput1().setInputFiles(documentPath);
      await this.fileInput2().setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput3().setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
    } else {
      await this.page.waitForTimeout(5000);
    }

    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.btnSave().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.btnSave().click();
    await this.waitForLoaderToDisappear();

    await this.selLead().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(5000);
    await this.selLead().selectOption({ label: 'Priyanka Thorat' });
    await this.page.waitForTimeout(2000);
    await this.btnDone().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of Flow41_ValidateDigiOFunctionalityArvog.validateDigiOFunctionality().
   * Caller must first loginAs('appraiser').
   * Uses fixed customer ID "MHOE12GL" (as in Java source).
   * File uploads are guarded optional params.
   */
  async validateDigiOFunctionality(documentPath?: string): Promise<void> {
    const fixedCustomerId = 'MHOE12GL';
    const fixedSearchId = 'MHOE12G';
    const packetCode = this.getRandomAPacketCode();

    await this.page.waitForTimeout(3000);
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(7000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers().click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID().fill(fixedCustomerId);
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
    await this.page.waitForTimeout(3000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
    await this.appraiserRequests().waitFor({ state: 'visible' });
    await this.appraiserRequests().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.textField().fill(fixedSearchId);

    await this.scrollableTable().click();
    await this.scrollableTable().evaluate((el) => { (el as any).scrollLeft = (el as any).scrollWidth; });
    await this.page.waitForTimeout(3000);
    await this.scrollableTable().click();
    await this.scrollableTable().evaluate((el) => { (el as any).scrollLeft = 0; });
    await this.page.waitForTimeout(3000);

    await this.jsClick(this.kebabMenu1());
    await this.jsClick(this.applyLoan());
    await this.btnOk().click();
    await this.waitForLoaderToDisappear();

    // Basic details, nominee, ornaments, FIC (Arvog), bank
    await this.page.locator("xpath=//select[@formcontrolname='purpose']").scrollIntoViewIfNeeded().catch(() => {});
    await this.page.locator("xpath=//select[@formcontrolname='purpose']").selectOption({ label: 'Business Expansion' });
    await this.safeClick(this.btnNext());
    await this.page.waitForTimeout(5000);
    await this.safeClick(this.btnNext());
    await this.addOrnamentsArvog();
    await this.validateFICPage_arvog();
    await this.validateBankDetailsAdvanceCash();

    // Ops creates packet (same session if logged in as ops after appraiser logout)
    // NOTE: this mirrors the Java flow where login switches happen inside validatePackets()
    // In the TS port, the spec handles role switching. This section assumes ops session.

    // Ops packet creation inlined
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.loanManagement_packet().click();
    await this.waitForLoaderToDisappear();
    await this.btnPacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAdd().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);
    await this.packetID().fill(packetCode);
    await this.internalUserBranch().selectOption({ label: 'Augmont' });
    await this.btnNewpacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.barCode().fill(packetCode);
    await this.barCode().click();
    await this.btnAddPacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.btnEditPacket().click();
    await this.waitForLoaderToDisappear();
    await this.userType().selectOption({ label: 'Appraiser' });
    await this.appraiserId().selectOption({ label: 'Priyanka Thorat' });
    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();

    // Appraiser: assign packet, digio upload
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan().scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID().fill(fixedCustomerId);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.assignPacketBtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.selectPacket().click();

    const code = packetCode.trim();
    const packetOption = this.page.locator(`xpath=//select[@formcontrolname='packetId']//option[contains(., '${code}')]`);
    await packetOption.waitFor({ state: 'attached', timeout: 10000 });
    await this.packetIdDropdown().click();
    await this.page.waitForTimeout(2000);
    await packetOption.click();
    await this.page.waitForTimeout(2000);
    await this.ornamenttype().click();
    await this.page.waitForTimeout(500);
    await this.headerCheckmark().click();
    await this.page.waitForTimeout(2000);
    await this.btnAddPacket2().click();

    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(2000);
    const rows = await this.imagePlaceholder().all();
    for (const row of rows) {
      await this.page.waitForTimeout(2000);
      await row.click();
      await this.page.waitForTimeout(2000);
      await this.camera().scrollIntoViewIfNeeded().catch(() => {});
      await this.page.waitForTimeout(2000);
      await this.camera().click();
      await this.page.waitForTimeout(5000);
    }
    await this.btnSave().click();
    await this.btnYesSave().click();
    await this.waitForLoaderToDisappear();

    // BM approval delegated to spec
  }

  // ── DigiO upload for Arvog flow after BM ─────────────────────────────────

  /**
   * Port of Flow41 appraiser upload-with-DigiO segment (called after BM approval).
   * Caller must first loginAs('appraiser').
   * File uploads are guarded optional params.
   */
  async validateDigiOFunctionality_appraiserUploadDocs(
    fixedCustomerId = 'MHOE12GL',
    documentPath?: string,
  ): Promise<void> {
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan().scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID().fill(fixedCustomerId);
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // DigiO sign
    await this.loc_signDocuments().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1500);
    await this.loc_signDocuments().click();
    await this.page.waitForTimeout(500);
    await this.loc_signDocument().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.loc_signDocument().click();
    await this.page.waitForTimeout(5000);

    if (documentPath) {
      await this.fileInput1().waitFor({ state: 'attached', timeout: 20000 });
      await this.page.waitForTimeout(15000);
      await this.fileInput1().setInputFiles(documentPath);
      await this.fileInput2().setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput3().setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput4().setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput5().setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput7().setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput7dNone().setInputFiles(documentPath);
    } else {
      await this.page.waitForTimeout(5000);
    }

    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.btnSave().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.btnSave().click();
    await this.waitForLoaderToDisappear();

    await this.selLead().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(5000);
    await this.selLead().selectOption({ label: 'Priyanka Thorat' });
    await this.page.waitForTimeout(2000);
    await this.btnDone().click();
    await this.waitForLoaderToDisappear();
  }

  // ── FIC / bank helpers for Flow41 ────────────────────────────────────────

  private async validateFICPage_arvog(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.page.locator("xpath=//select[@formcontrolname='partnerId']").selectOption({ label: 'ARVOG ARV10' });
    await this.page.waitForTimeout(2000);
    await this.page.locator("xpath=//select[@formcontrolname='schemeId']").selectOption({ label: 'SCHEME_LTV84 (0 - 1100000)' });
    await this.page.waitForTimeout(2000);
    await this.page.locator("xpath=//input[@formcontrolname='finalLoanAmount']").fill('605000');
    await this.page.waitForTimeout(5000);
    const calcBtn = this.page.locator("xpath=//button[.//span[normalize-space(text())='Calculate']]");
    await calcBtn.waitFor({ state: 'visible' });
    await calcBtn.dblclick();
    await calcBtn.click();
    await this.page.waitForTimeout(3000);
    await this.safeClick(this.btnNext());
  }

  private async validateBankDetailsAdvanceCash(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.page.evaluate('window.scrollBy(0, 1000)');
    await this.page.waitForTimeout(2000);
    const loanAmtField = this.page.locator("xpath=//td[normalize-space(.)='Loan Amount']/following-sibling::td[contains(@class,'currency')]");
    await loanAmtField.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1000);
    await this.page.evaluate('window.scrollBy(0, -150)');
    await this.page.waitForTimeout(500);
    await loanAmtField.waitFor({ state: 'visible' });
    await loanAmtField.click();
    await this.page.keyboard.press('Tab');
    await this.page.locator("xpath=//input[@formcontrolname='wavier']").clear();
    await this.page.waitForTimeout(3000);
    const toBePaid = this.page.locator("xpath=//td[normalize-space(text())='To be paid']/following-sibling::td[@class='currency']");
    await toBePaid.scrollIntoViewIfNeeded().catch(() => {});
    const str = await toBePaid.innerText().then(t => t.trim()).catch(() => '');
    const numericValue = str.replace(/[^0-9]/g, '');
    const advCash = this.page.locator("xpath=//td//input[@formcontrolname='advanceCash']");
    await advCash.scrollIntoViewIfNeeded().catch(() => {});
    await advCash.waitFor({ state: 'visible' });
    await advCash.clear();
    await advCash.fill(numericValue);
    await this.page.waitForTimeout(4000);
    await this.safeClick(this.btnNext());
  }

  private async addOrnamentsArvog(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.page.evaluate('window.scrollBy(0, 1000)');
    await this.page.waitForTimeout(3000);
    await this.page.evaluate('window.scrollBy(0, -500)');
    await this.page.waitForTimeout(5000);

    const ornamentDropdownArrow = this.page.locator("xpath=//input[@role='combobox']//following::span[@class='ng-arrow-wrapper']");
    const ornamentOptions = this.page.locator("xpath=//span[@class='ng-option-label ng-star-inserted']");

    for (let i = 0; i < 2; i++) {
      await ornamentDropdownArrow.waitFor({ state: 'visible' });
      await ornamentDropdownArrow.scrollIntoViewIfNeeded().catch(() => {});
      await ornamentDropdownArrow.click();
      const opts = await ornamentOptions.all();
      const indexToClick = 4 + i;
      if (opts.length > indexToClick) await opts[indexToClick].click();

      await this.page.waitForTimeout(5000);
      await this.page.locator("xpath=//input[@formcontrolname='quantity']").fill('1');
      const grossWt = 300.0;
      const deductionWt = Math.random() * Math.min(1.0, grossWt);
      await this.page.locator("xpath=//input[@formcontrolname='grossWeight']").fill(grossWt.toFixed(1));
      await this.page.locator("xpath=//input[@formcontrolname='deductionWeight']").fill(deductionWt.toFixed(1));

      await this.page.waitForTimeout(2000);
      await this.page.locator("xpath=(//button[@type='button'])[3]").click();
      await this.page.waitForTimeout(2000);
      await this.camera().click();
      await this.page.waitForTimeout(2000);
      await this.page.locator("xpath=//img[@class='placeholder-image']").click();
      await this.page.waitForTimeout(2000);
      await this.camera().click();
      await this.page.waitForTimeout(2000);

      await this.page.locator("xpath=//select[@formcontrolname='karat']").selectOption({ label: '22 K HM' });
      await this.page.locator("xpath=//select[@formcontrolname='ltvPercent']").selectOption({ label: '98 %' });

      if (i === 0) {
        const addMoreBtn = this.page.locator("xpath=//button[normalize-space()='+ Add More']");
        await addMoreBtn.scrollIntoViewIfNeeded().catch(() => {});
        await this.page.waitForTimeout(2000);
        await addMoreBtn.click();
      }
    }

    const nextButton = this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
    await nextButton.scrollIntoViewIfNeeded().catch(() => {});
    await this.safeClick(nextButton);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async safeClick(locator: ReturnType<typeof this.page.locator>): Promise<void> {
    try {
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await locator.waitFor({ state: 'visible', timeout: 30000 });
      await locator.click();
    } catch {
      await this.jsClick(locator);
    }
  }

  private getRandomAPacketCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
}
