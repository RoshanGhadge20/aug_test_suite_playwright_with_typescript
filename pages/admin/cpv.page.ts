import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO30_CPVAddAndAttach (locators) + Flow39_ValidateAddCPVAndAttachedWithNonArvogPartner
 *              + Flow51_ValidateAddCpvAndAttchedCpvWithArvogPartner (actions)
 *
 * Both flows share very similar structure. Key differences:
 *   - Flow39: Non-Arvog partner (delegates to Flow04_NewGoldLoan.validateFICPage() = ICICI).
 *   - Flow51: Arvog partner (ARVOG ARV10, scheme SCHEME_LTV84, loan 605000).
 *
 * Role split for both flows:
 *   1. Appraiser: KYC (already done via precondition), start new GL, appraiser requests, apply loan.
 *   2. Ops (after appraiser logout): create packet, update packet.
 *   3. Appraiser: assign packet, upload documents.
 *   4. BM: branch manager approval (existing PO via spec).
 *   5. Appraiser (again): upload more documents, save, done.
 *   6. Ops: ops approval.
 *   7. Arvog partner / Non-Arvog partner: approval and disbursement.
 *   8. Appraiser: packet submission, CPV attachment validation.
 *
 * File upload TODOs:
 *   - Multiple file inputs — Java sendKeys("C:\\..."). Playwright: setInputFiles() — guarded.
 *   All paths must be supplied via env vars for live runs.
 */
export class CpvPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO30_CPVAddAndAttach) ─────────────────────────────────

  private readonly viewLoan = () => this.page.locator("xpath=//button[contains(.,'View Loan')]");
  private readonly view = () => this.page.locator("xpath=(//div[contains(@class,'kt-pointer') and normalize-space()='View'])[1]");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  private readonly customerManagementBtn = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  private readonly allCustomers = () => this.page.locator("xpath=//span[normalize-space()='All Customers']");
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
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
  // Applied loan / assign packet
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
  private readonly fileInput7 = () => this.page.locator("xpath=(//input[@type='file'])[7]");
  private readonly fileInput7dNone = () => this.page.locator("xpath=(//input[@type='file' and contains(@class, 'd-none')])[7]");
  // FIC page locators
  private readonly selPartner = () => this.page.locator("xpath=//select[@formcontrolname='partnerId']");
  private readonly selScheme = () => this.page.locator("xpath=//select[@formcontrolname='schemeId']");
  private readonly loanAmountInput = () => this.page.locator("xpath=//input[@formcontrolname='finalLoanAmount']");
  private readonly calculateBtn = () => this.page.locator("xpath=//button[.//span[normalize-space(text())='Calculate']]");
  private readonly toBePaid = () => this.page.locator("xpath=//td[normalize-space(text())='To be paid']/following-sibling::td[@class='currency']");
  private readonly advanceCashField = () => this.page.locator("xpath=//td//input[@formcontrolname='advanceCash']");
  private readonly wavierInput = () => this.page.locator("xpath=//input[@formcontrolname='wavier']");
  private readonly loanAmountField = () => this.page.locator("xpath=//td[normalize-space(.)='Loan Amount']/following-sibling::td[contains(@class,'currency')]");
  // Packet submission (PO08)
  private readonly btnSubmitPacket = () => this.page.locator("xpath=//button[normalize-space()='Submit Packet']");
  private readonly selLocation = () => this.page.locator("xpath=//select[@formcontrolname='locationId']");
  private readonly selBranch = () => this.page.locator("xpath=//select[@formcontrolname='branchId']");
  private readonly inputField = () => this.page.locator("xpath=//input[@formcontrolname='address']");
  private readonly btnVerify = () => this.page.locator("xpath=//button[normalize-space()='Verify']");
  private readonly inputMobileNumber = () => this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly btnOTP = () => this.page.locator("xpath=//button[normalize-space()='Send OTP']");
  private readonly inputOTP = () => this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnUpdateSubmit = () => this.page.locator("xpath=//button[normalize-space()='Update']");
  // Loan details / CPV view
  private readonly loanDetails = () => this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  private readonly kebabMenuDetails = () => this.page.locator("xpath=(//button[.//mat-icon[text()='more_vert']])[1]");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow51_ValidateAddCpvAndAttchedCpvWithArvogPartner.validateAddCPVAndAttchCpv()
   * appraiser portion (after precondition KYC done).
   * Caller must first loginAs('appraiser').
   * Returns packetCode for use in subsequent role segments.
   */
  async validateAddCPVAndAttchCpv_appraiserApplyLoan(): Promise<string> {
    const data = getLoginData();

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
    await this.firstNameFilter().fill(data.firstName);
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
    await this.page.waitForTimeout(2000);
    await this.appraiserRequests().waitFor({ state: 'visible' });
    await this.appraiserRequests().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.textField().fill(data.firstName);
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

    // Basic details, nominee (Next x2), ornaments
    await this.selectFromDropdown(this.page.locator("xpath=//select[@formcontrolname='purpose']"), 'Business Expansion');
    await this.safeClick(this.btnNext());
    await this.page.waitForTimeout(5000);
    await this.safeClick(this.btnNext()); // nominee next
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

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.assignPacketBtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
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

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.btnUploadDocuments().click();
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
      await this.fileInput7().setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      // fileInput7dNone — CPV attachment
      await this.fileInput7dNone().setInputFiles(documentPath);
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
   * Port of Flow51_ValidateAddCpvAndAttchedCpvWithArvogPartner.packetSubmission().
   * Caller must first loginAs('appraiser').
   */
  async packetSubmission(): Promise<void> {
    const data = getLoginData();

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

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnSubmitPacket().click();
    await this.waitForLoaderToDisappear();
    await this.selLocation().selectOption({ label: 'Partner Branch In' });
    await this.page.waitForTimeout(2000);
    await this.selBranch().selectOption({ label: 'Hyderabad Cms' });
    await this.page.waitForTimeout(2000);

    const addressText = await this.page.locator("xpath=//div[@class='col-7 d-flex align-items-center']").innerText().catch(() => '');
    await this.page.waitForTimeout(500);
    await this.inputField().fill(addressText);
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.inputMobileNumber().fill('9689598798');
    await this.page.waitForTimeout(1000);
    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP().fill('1234');
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdateSubmit().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of Flow51_ValidateAddCpvAndAttchedCpvWithArvogPartner.valiadateCPVAttachment().
   * Caller must first loginAs('appraiser').
   * Returns visibility boolean for soft assertion in spec.
   */
  async valiadateCPVAttachment(): Promise<boolean> {
    const data = getLoginData();

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
    await this.page.waitForTimeout(2000);

    await this.loanDetails().scrollIntoViewIfNeeded().catch(() => {});
    await this.loanDetails().click();
    await this.waitForLoaderToDisappear();
    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();

    await this.kebabMenuDetails().click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan().click();
    await this.waitForLoaderToDisappear();

    await this.view().waitFor({ state: 'visible', timeout: 10000 });
    return this.view().isVisible();
  }

  /**
   * Port of Flow39_ValidateAddCPVAndAttachedWithNonArvogPartner.validateAddCPVAndAttached()
   * appraiser-apply-loan portion.
   * Caller must first loginAs('appraiser').
   */
  async validateAddCPVAndAttached_appraiserApplyLoan(): Promise<void> {
    const data = getLoginData();

    // KYC ops approval (precondition for non-arvog flow)
    // NOTE: caller is responsible for calling kycApproval.performOpsRatingActions() first

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
    await this.firstNameFilter().fill(data.firstName);
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
    await this.page.waitForTimeout(2000);
    await this.appraiserRequests().waitFor({ state: 'visible' });
    await this.appraiserRequests().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.textField().fill(data.firstName);
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

    // Basic details
    await this.selectFromDropdown(this.page.locator("xpath=//select[@formcontrolname='purpose']"), 'Business Expansion');
    await this.safeClick(this.btnNext());
    await this.page.waitForTimeout(5000);
    await this.safeClick(this.btnNext()); // nominee
    await this.addOrnaments();
    // FIC — Non-Arvog (ICICI/W0 scheme)
    await this.validateFICPage_nonArvog();
    await this.validateBankDetailsWithAdvanceCash();
  }

  // ── Shared FIC/Bank detail helpers ───────────────────────────────────────

  async validateFICPage_arvog(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.selPartner().selectOption({ label: 'ARVOG ARV10' });
    await this.page.waitForTimeout(2000);
    await this.selScheme().selectOption({ label: 'SCHEME_LTV84 (0 - 1100000)' });
    await this.page.waitForTimeout(2000);
    await this.loanAmountInput().fill('605000');
    await this.page.waitForTimeout(5000);
    await this.calculateBtn().waitFor({ state: 'visible' });
    await this.calculateBtn().dblclick();
    await this.calculateBtn().click();
    await this.page.waitForTimeout(3000);
    await this.safeClick(this.btnNext());
  }

  async validateFICPage_nonArvog(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.selPartner().selectOption({ label: 'ARVOG ARV-10' });
    await this.page.waitForTimeout(2000);
    await this.selScheme().selectOption({ label: 'W0 (0 - 5000000)' });
    await this.page.waitForTimeout(2000);
    await this.loanAmountInput().fill('75000');
    await this.page.waitForTimeout(5000);
    await this.calculateBtn().waitFor({ state: 'visible' });
    await this.calculateBtn().dblclick();
    await this.calculateBtn().click();
    await this.page.waitForTimeout(3000);
    await this.safeClick(this.btnNext());
  }

  async validateBankDetailsWithAdvanceCash(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.page.evaluate('window.scrollBy(0, 1000)');
    await this.page.waitForTimeout(2000);
    await this.loanAmountField().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1000);
    await this.page.evaluate('window.scrollBy(0, -150)');
    await this.page.waitForTimeout(500);
    await this.loanAmountField().waitFor({ state: 'visible' });
    await this.loanAmountField().click();
    await this.page.keyboard.press('Tab');
    await this.wavierInput().clear();
    await this.page.waitForTimeout(3000);
    await this.wavierInput().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(3000);
    await this.toBePaid().scrollIntoViewIfNeeded().catch(() => {});
    const str = await this.toBePaid().innerText().then(t => t.trim()).catch(() => '');
    const numericValue = str.replace(/[^0-9]/g, '');
    await this.advanceCashField().scrollIntoViewIfNeeded().catch(() => {});
    await this.advanceCashField().waitFor({ state: 'visible' });
    await this.advanceCashField().clear();
    await this.advanceCashField().fill(numericValue);
    await this.page.waitForTimeout(4000);
    await this.safeClick(this.btnNext());
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async addOrnaments(): Promise<void> {
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
      if (opts.length > indexToClick) {
        await opts[indexToClick].click();
      }

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

  private async selectFromDropdown(locator: ReturnType<typeof this.page.locator>, label: string): Promise<void> {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.selectOption({ label });
  }

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
