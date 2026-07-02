import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO08_PacketSubmissionAppraiser (locators) + Flow09_PacketSubmission (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator from Flow09.
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow09_PacketSubmission.packetSubmission() called Flow_LoginLogout.loginWithAppraiser() —
 *     OMITTED. Role switching must be handled by the caller via loginAs('appraiser').
 *
 * Data note:
 *   - Java used `partnerNumber` (a BrowserInitialize static field). Mapped to
 *     `getLoginData().accountNumber` as the closest available field. If the partner mobile
 *     number is stored separately, update this mapping.
 */
export class PacketSubmissionPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO08_PacketSubmissionAppraiser) ─────────────────────────

  private readonly btnSubmitPacket = () => this.page.locator("xpath=(//button[contains(text(),'SUBMIT PACKET')])[1]");
  private readonly selLocation = () => this.page.locator("xpath=//select[@formcontrolname='packetLocationId']");
  private readonly inputField = () => this.page.locator("xpath=//input[@formcontrolname='Barcode']");
  private readonly selBranch = () => this.page.locator("xpath=//select[@formcontrolname='partnerBranchId']");
  private readonly btnVerify = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']");
  private readonly inputMobileNumber = () => this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly user = () => this.page.locator("xpath=//label[normalize-space()='User']");
  private readonly btnOTP = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']");
  private readonly inputOTP = () => this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnUpdate = () => this.page.locator("xpath=//span[normalize-space()='Update']");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown from Flow09
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");

  // ── Actions (from Flow09_PacketSubmission) ─────────────────────────────────

  /**
   * Port of Java Flow09_PacketSubmission.packetSubmission().
   *
   * NOTE: loginWithAppraiser() call is OMITTED.
   * Role switching must be handled by the caller via loginAs('appraiser').
   *
   * Data note: Java `partnerNumber` → mapped to `getLoginData().accountNumber`.
   * Update this mapping if a dedicated partner mobile field is available.
   */
  async packetSubmission(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);

    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
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
    await this.page.waitForTimeout(5000);

    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnSubmitPacket().click();
    await this.waitForLoaderToDisappear();

    await this.selLocation().selectOption({ label: 'Partner Branch In' });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selBranch().selectOption({ label: 'Dnd_sk' });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // Read barcode text from the page
    const ele = this.page.locator("xpath=//div[@class='col-7 d-flex align-items-center']");
    const str = (await ele.innerText()).trim();
    await this.page.waitForTimeout(500);

    await this.inputField().fill(str);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    // Java used `partnerNumber` — mapped to accountNumber; update if needed
    await this.inputMobileNumber().fill(data.partnerNumber);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.inputOTP().fill('1234');
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();
  }
}
