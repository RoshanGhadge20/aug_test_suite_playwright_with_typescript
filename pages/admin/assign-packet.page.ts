import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO05_AssignPacket (locators) + Flow05_AssignPacket (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator from Flow05.
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement / PO03.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `packetID` re-declares PO03_CreateNewPacket.loc_packetID (same XPath).
 *   - `selBranchPacket` re-declares PO03_CreateNewPacket.loc_selBranch (same XPath).
 *   - `btnNewpacket` re-declares PO03_CreateNewPacket.loc_btnNewpacket (same XPath).
 *   - `barCode` re-declares PO03_CreateNewPacket.loc_barCode (same XPath).
 *   - `btnAddPacketPO03` re-declares PO03_CreateNewPacket.loc_btnAddPacket (same XPath).
 *   - `btnEditPacket` re-declares PO03_CreateNewPacket.loc_btnEditPacket (same XPath).
 *   - `selUsertype` re-declares PO03_CreateNewPacket.loc_selUsertype (same XPath).
 *   - `btnUpdatePO03` re-declares PO03_CreateNewPacket.loc_btnUpdate (same XPath).
 *   - `imgCamera` re-declares inline camera button from Flow05.
 *
 * Omitted loginWith* calls:
 *   - Flow05_AssignPacket.validatePackets() called Flow_LoginLogout.loginWithAppraiser() mid-flow —
 *     OMITTED. Role switching must be handled by the caller via loginAs('appraiser').
 *
 * File upload TODOs:
 *   - validatePackets(): Three document uploads via sendKeys to (//input[@type='file'])[1/2/3] and
 *     a 6th input by index. Best-effort Playwright: setInputFiles(). Caller must supply documentPath.
 *     Flagged DONE_WITH_CONCERNS — paths must be wired from test config/env vars.
 */
export class AssignPacketPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO05_AssignPacket) ─────────────────────────────────────

  private readonly AssignPacket = () => this.page.locator("xpath=(//button[@ng-reflect-klass='red-button'][normalize-space()='Assign Packet'])[1]");
  private readonly selectPacket = () => this.page.locator("xpath=//select[@formcontrolname='packetId']");
  private readonly btnAddPacket = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly ornamenttype = () => this.page.locator("xpath=//span[@class='ng-arrow-wrapper']");
  private readonly btnSave = () => this.page.locator("xpath=//span[contains(.,'Save')]");
  private readonly btnYes = () => this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly btnUploadDocuments = () => this.page.locator("xpath=(//button[normalize-space(text())='UPLOAD DOCUMENTS'])[1]");
  private readonly btnDigitalSign = () => this.page.locator("xpath=//button[@ng-reflect-disabled='true']");
  private readonly btnSave1 = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='save']//button[@type='button']");
  private readonly selLead = () => this.page.locator("xpath=//select[@formcontrolname='leadConverterId']");
  private readonly btnDone = () => this.page.locator("xpath=//span[contains(.,'Done')]");
  private readonly btnDownloadCashDeclaration = () => this.page.locator("xpath=//span[normalize-space(text())='Download Cash Declaration']");
  private readonly btnDownloadReceipt = () => this.page.locator("xpath=//span[normalize-space(text())='Download Cash Receipt']");
  private readonly checkbox = () => this.page.locator("xpath=//span[@class='checkmark checkmark-custom header-checkmark']");
  private readonly cashReceiptNumber = () => this.page.locator("xpath=//input[@formcontrolname='receiptNumber']");
  private readonly consumptionSupporting = () => this.page.locator("xpath=//i[@class='fas fa-file-upload']");
  private readonly fieldCkyc = () => this.page.locator("xpath=//input[@placeholder='C-KYC00']");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown from Flow05
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  // PO03_CreateNewPacket.loc_packetID
  private readonly packetID = () => this.page.locator("xpath=//input[@formcontrolname='packetUniqueId']");
  // PO03_CreateNewPacket.loc_selBranch
  private readonly selBranchPacket = () => this.page.locator("xpath=//select[@formcontrolname='internalUserBranch']");
  // PO03_CreateNewPacket.loc_btnNewpacket
  private readonly btnNewpacket = () => this.page.locator("xpath=//div[@class='mat-slide-toggle-bar mat-slide-toggle-bar-no-side-margin']");
  // PO03_CreateNewPacket.loc_barCode
  private readonly barCode = () => this.page.locator("xpath=//input[@formcontrolname='barcodeNumber']");
  // PO03_CreateNewPacket.loc_btnAddPacket
  private readonly btnAddPacketPO03 = () => this.page.locator("xpath=//span[normalize-space()='Add']");
  // PO03_CreateNewPacket.loc_btnEditPacket
  private readonly btnEditPacket = () => this.page.locator("xpath=(//div[@class='kt-pointer ng-star-inserted'])[1]");
  // PO03_CreateNewPacket.loc_selUsertype
  private readonly selUsertype = () => this.page.locator("xpath=//select[@formcontrolname='userType']");
  // PO03_CreateNewPacket.loc_btnUpdate
  private readonly btnUpdatePO03 = () => this.page.locator("xpath=//span[normalize-space()='Update']");
  // Inline appraiser dropdown from Flow05
  private readonly selAppraiserId = () => this.page.locator("xpath=//select[@formcontrolname='appraiserId']");
  // Inline camera button from Flow05
  private readonly imgCamera = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");

  // ── Actions (from Flow05_AssignPacket) ────────────────────────────────────

  /**
   * Phase A — port of Java Flow05_AssignPacket.validatePackets() lines 32–79.
   *
   * Creates a new packet, assigns it to the appraiser role, then returns the
   * generated packet code so the caller can pass it to validateAppraisalPacket()
   * after switching roles.
   *
   * NOTE: loginWithAppraiser() (Java line 80) is OMITTED here.
   * The caller must call loginAs('appraiser') before invoking validateAppraisalPacket().
   */
  async createAndAssignPacket(): Promise<string> {
    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.page.locator("xpath=//span[normalize-space()='Packet']").click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.page.locator("xpath=//span[normalize-space()='Add Packet']").click();
    await this.waitForLoaderToDisappear();

    const packetCode = this.getRandomAPacketCode();
    await this.page.waitForTimeout(1500);
    await this.packetID().fill(packetCode);
    await this.waitForLoaderToDisappear();

    await this.selBranchPacket().selectOption({ label: 'Augmont' });
    await this.btnNewpacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.barCode().fill(packetCode);
    await this.waitForLoaderToDisappear();
    await this.barCode().click();
    await this.waitForLoaderToDisappear();
    await this.btnAddPacketPO03().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.jsClick(this.btnEditPacket());
    await this.page.waitForTimeout(1000);

    await this.selUsertype().selectOption({ label: 'Appraiser' });
    await this.page.waitForTimeout(500);
    await this.selAppraiserId().selectOption({ label: 'Priyanka Thorat' });
    await this.page.waitForTimeout(500);
    await this.btnUpdatePO03().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // NOTE: loginWithAppraiser() (Java line 80) OMITTED — caller injects loginAs('appraiser')
    return packetCode;
  }

  /**
   * Phase B — port of Java Flow05_AssignPacket.validatePackets() lines 81–246.
   *
   * Runs as the appraiser role. Accepts the packetCode returned by
   * createAndAssignPacket() so it can select the correct packet from the
   * dropdown (Java line 109: `String code = packetCode.trim()`).
   *
   * TODO(port): Document uploads — Java used sendKeys to (//input[@type='file'])[1/2/3] and index 6.
   * Best-effort Playwright: setInputFiles(). documentPath must be supplied from test config/env vars.
   */
  async validateAppraisalPacket(packetCode: string, documentPath?: string): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
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

    // Select the packet option containing the code (Java line 109: String code = packetCode.trim())
    const code = packetCode.trim();
    const option = this.page.locator(
      `xpath=//select[@formcontrolname='packetId']//option[contains(., '${code}')]`,
    );
    await option.waitFor({ state: 'attached' });
    await this.selectPacket().click();
    await this.page.waitForTimeout(2000);
    await option.click();
    await this.page.waitForTimeout(2000);

    await this.ornamenttype().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.checkbox().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnAddPacket().click();
    await this.waitForLoaderToDisappear();

    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(2000);

    // Click all image placeholder buttons and then camera button for each
    const placeholders = this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/image-placeholder.png']",
    );
    const count = await placeholders.count();
    for (let i = 0; i < count; i++) {
      await this.page.waitForTimeout(2000);
      await placeholders.nth(i).click();
      await this.page.waitForTimeout(2000);
      const btn = this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");
      await btn.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(2000);
      await btn.click();
      await this.page.waitForTimeout(5000);
    }

    await this.btnSave().click();
    await this.waitForLoaderToDisappear();
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // TODO(port): Document uploads — Java used sendKeys to (//input[@type='file'])[1/2/3] and index 6.
    // Best-effort Playwright: setInputFiles(). documentPath must be supplied from test config/env vars.
    if (documentPath) {
      const fileInputs = [1, 2, 3];
      for (const idx of fileInputs) {
        const fileInput = this.page.locator(`xpath=(//input[@type='file'])[${idx}]`);
        await this.page.waitForTimeout(15000);
        await fileInput.setInputFiles(documentPath);
        await this.page.waitForTimeout(5000);
      }

      // safeFileUpload(6, path) — 6th file input
      const allInputs = this.page.locator("xpath=//input[@type='file']");
      const inputCount = await allInputs.count();
      if (inputCount >= 6) {
        const sixthInput = allInputs.nth(5);
        await sixthInput.evaluate((el) => { (el as any).style.display = 'block'; });
        await this.page.waitForTimeout(500);
        await sixthInput.setInputFiles(documentPath);
        await this.page.waitForTimeout(3000);
      }
    }

    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight);');
    await this.page.waitForTimeout(5000);

    const ckycNumber = this.generateRandomCKYC();
    await this.fieldCkyc().fill(ckycNumber);
    await this.page.waitForTimeout(1000);

    const saveBtn = this.page.locator("xpath=//button[normalize-space()='Save']");
    await saveBtn.waitFor({ state: 'attached' });
    await saveBtn.evaluate((el) => (el as any).scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await this.page.waitForTimeout(1000);
    await this.jsClick(saveBtn);
    await this.page.waitForTimeout(2000);
    await this.waitForLoaderToDisappear();

    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const dropdownEle = this.page.locator("xpath=//select[@formcontrolname='leadConverterId']");
    await dropdownEle.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(1000);

    try {
      await dropdownEle.selectOption({ label: 'Priyanka Thorat' });
    } catch {
      // fallback: select first non-empty option
      const options = await dropdownEle.locator('option').allTextContents();
      const nonEmpty = options.find((o) => o.trim() && o.trim() !== '-- Select --');
      if (nonEmpty) await dropdownEle.selectOption({ label: nonEmpty });
    }

    await this.page.waitForTimeout(1000);
    await this.btnDone().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of Java Flow05_AssignPacket.getRandomAPacketCode().
   */
  getRandomAPacketCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Port of Java Flow05_AssignPacket.generateRandomCKYC().
   */
  generateRandomCKYC(): string {
    const firstPart = String(1_000_000 + Math.floor(Math.random() * 9_000_000));
    const secondPart = String(1_000_000 + Math.floor(Math.random() * 9_000_000));
    return firstPart + secondPart;
  }
}
