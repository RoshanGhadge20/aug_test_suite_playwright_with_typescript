import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: Flow44_VerifyBankDetails (actions)
 * No dedicated PO — reuses PO03_CreateNewPacket, PO05_AssignPacket, PO07_OpsTeamLoanApproval,
 * PO09_PartnerLoanApproval locators (re-declared here).
 *
 * Role split:
 *   - validateBankDetails() has multiple role switches:
 *     1. Current session (ops from precondition): create packet and update it.
 *     2. loginWithAppraiser: assign packet, upload documents.
 *     3. Via delegate calls: opsAprroval, partnerApproval, packetSubmission — handled by existing POs.
 *   - SPLIT into validateBankDetails_opsPart() and validateBankDetails_appraiserPart().
 *     Downstream approvals delegated to existing POs via spec.
 *
 * File upload TODOs:
 *   - 3 file inputs for upload documents — Java sendKeys("C:\\..."). Playwright: setInputFiles() — guarded.
 *   All paths must be supplied via env vars for live runs.
 */
export class BankDetailsPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (re-declared from various POs) ───────────────────────────────

  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO03_CreateNewPacket
  private readonly loanManagement_packet = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  private readonly btnPacket = () => this.page.locator("xpath=//span[normalize-space()='Packet']");
  private readonly btnAdd = () => this.page.locator("xpath=//button[normalize-space()='Add']");
  private readonly packetID = () => this.page.locator("xpath=//input[@formcontrolname='packetCode']");
  private readonly internalUserBranch = () => this.page.locator("xpath=//select[@formcontrolname='internalUserBranch']");
  private readonly btnNewpacket = () => this.page.locator("xpath=//button[normalize-space()='New Packet']");
  private readonly barCode = () => this.page.locator("xpath=//input[@formcontrolname='barcode']");
  private readonly btnAddPacket = () => this.page.locator("xpath=//button[normalize-space()='Add Packet']");
  private readonly btnEditPacket = () => this.page.locator("xpath=//button[normalize-space()='Edit']");
  private readonly userType = () => this.page.locator("xpath=//select[@formcontrolname='userType']");
  private readonly appraiserId = () => this.page.locator("xpath=//select[@formcontrolname='appraiserId']");
  private readonly btnUpdate = () => this.page.locator("xpath=//button[normalize-space()='Update']");
  // PO_Common / Applied Loan
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  private readonly appliedLoan = () => this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
  // PO01_KycSel
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  // PO05_AssignPacket
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

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow44_VerifyBankDetails.validateBankDetails() — ops/packet-creation segment.
   * Caller must be on ops session (after precondition). Returns the generated packetCode.
   */
  async validateBankDetails_opsPart(): Promise<string> {
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
    await this.page.waitForTimeout(1500);
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
   * Port of Flow44_VerifyBankDetails.validateBankDetails() — appraiser segment.
   * Caller must first loginAs('appraiser') and pass the packetCode from opsPart.
   * File uploads are guarded optional params.
   */
  async validateBankDetails_appraiserPart(
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
    await this.page.waitForTimeout(4000);
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

  // ── Helpers ──────────────────────────────────────────────────────────────

  private getRandomAPacketCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
}
