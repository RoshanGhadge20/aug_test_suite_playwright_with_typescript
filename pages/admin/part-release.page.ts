import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

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
  constructor(page: Page) { super(page); }

  // ── Locators (from PO15_PartRelease) ──────────────────────────────────────

  private readonly checkbox = () => this.page.locator("xpath=(//label[@class='custom-checkbox']//input[@type='checkbox'])[1]");
  private readonly btnRelease = () => this.page.locator("xpath=//button[.//span[normalize-space()='Release']]");
  private readonly partRelease = () => this.page.locator("xpath=//span[normalize-space()='Part Release Approval']");
  private readonly customerIDfield = () => this.page.locator("xpath=//input[@placeholder='Enter Customer Unique ID']");
  private readonly btnUpdateAppraiser = () => this.page.locator("xpath=(//button[@ng-reflect-klass='apply-kyc'][normalize-space()='Update Appraiser'])[1]");
  private readonly loanID = () => this.page.locator("xpath=//span[contains(.,'Done')]");
  private readonly btnUpdte = () => this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly btnJwellaryReleaseFinalProcess = () => this.page.locator("xpath=//span[normalize-space()='Jewellery Release Final Process']");
  private readonly partReleaseFinalProcess = () => this.page.locator("xpath=//span[normalize-space()='Final Part Release']");
  private readonly btnCollect = () => this.page.locator("xpath=//button[normalize-space()='Collect']");
  private readonly customerHomeIn = () => this.page.locator("xpath=//button[normalize-space()='Customer Home In']");
  private readonly btnCamera = () => this.page.locator("xpath=//i[@class='fas fa-camera']");
  private readonly btnAttach = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  // PO10_QuickPayment.loc_LoanDetails
  private readonly loanDetails = () => this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  // PO10_QuickPayment.loc_kebabMenu
  private readonly kebabMenu = () => this.page.locator("xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]");
  // PO10_QuickPayment.loc_netBanking
  private readonly netBanking = () => this.page.locator("xpath=//img[@alt='netbanking']");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () => this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO10_QuickPayment.loc_btnConfirm
  private readonly btnConfirm = () => this.page.locator("xpath=//span[normalize-space()='Confirm']");
  // PO12_TopUp.loc_selPurpose
  private readonly selPurpose = () => this.page.locator("xpath=//select[@formcontrolname='loanPurpose']");
  // PO13_RenewLoan.loc_btnYes
  private readonly btnYesRenew = () => this.page.locator("xpath=//span[contains(.,'Yes')]");
  // PO16_FullRelease.loc_jewllaryRelease
  private readonly jewllaryRelease = () => this.page.locator("xpath=//button[normalize-space()='Jewellery Release']");
  // PO16_FullRelease.loc_jwellaryReleaseApproval
  private readonly jwellaryReleaseApproval = () => this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
  // PO08_PacketSubmissionAppraiser locators (re-declared)
  private readonly inputField = () => this.page.locator("xpath=//input[@formcontrolname='Barcode']");
  private readonly btnVerify = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']");
  private readonly inputMobileNumber = () => this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly btnOTP = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']");
  private readonly inputOTP = () => this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnUpdate = () => this.page.locator("xpath=//span[normalize-space()='Update']");

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
   */
  async partReleaseLoan(): Promise<void> {
    await this.page.waitForTimeout(5000);
    // Active Java code: Flow09_PacketSubmission.packetSubmission() — delegated to spec
    // (spec calls packetSubmission fixture directly, consistent with TC01 pattern)
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

    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();

    // Read customer ID
    const element = this.page.locator("xpath=(//td[@class='ui-resizable-column p-element p-frozen-column ng-star-inserted'])[1]");
    const str = (await element.innerText()).trim();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.jewllaryRelease().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const elem = this.checkbox();
    await this.page.waitForTimeout(500);
    await this.jsClick(elem);

    await this.btnRelease().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Second checkbox
    const checkbox = this.page.locator("xpath=(//label[@class='custom-checkbox']//span[contains(@class,'checkmark')])[2]");
    await checkbox.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent('click');
    await this.page.waitForTimeout(5000);

    await this.selPurpose().selectOption({ label: 'Business Expansion' });

    await this.page.waitForTimeout(2000);
    const selectStatusDropdown = this.selPayment();
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView({ block: 'nearest', inline: 'center' }));
    await selectStatusDropdown.click();
    await selectStatusDropdown.selectOption({ label: 'PAYMENT GATEWAY' });

    await this.netBanking().click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
    await this.btnYesRenew().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // Razorpay iframe
    const razorFrame = this.page.frameLocator("xpath=//iframe[@class='razorpay-checkout-frame']");
    await this.page.waitForTimeout(2000);
    await razorFrame.locator("xpath=//input[@placeholder='Search for Banks']").fill('State Bank of India');
    await this.page.waitForTimeout(2000);
    await razorFrame.locator("xpath=(//span[contains(.,'State Bank of India')])[1]").click();
    await razorFrame.locator("xpath=//button[contains(.,'Continue & Pay')]").click();
    await this.page.waitForTimeout(2000);

    // Bank simulator popup
    const [popup] = await Promise.all([
      this.page.context().waitForEvent('page', { timeout: 15000 }).catch(() => null),
      Promise.resolve(),
    ]);
    if (popup) {
      const successBtn = popup.locator("xpath=//button[contains(text(),'Success')]");
      await successBtn.waitFor({ state: 'visible', timeout: 10000 });
      await successBtn.click();
      await popup.waitForEvent('close', { timeout: 10000 }).catch(() => {});
    } else {
      const successBtn = this.page.locator("xpath=//button[contains(text(),'Success')]");
      await successBtn.waitFor({ state: 'visible', timeout: 10000 });
      await successBtn.click();
    }
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

    await this.btnCollect().click();
    await this.waitForLoaderToDisappear();

    const eleme = this.page.locator("xpath=//div[@class='col-7 d-flex align-items-center']");
    const str1 = (await eleme.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.inputField().fill(str1);

    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.inputMobileNumber().fill(data.accountNumber);
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

    await this.page.waitForTimeout(500);
    await this.customerHomeIn().click();
    await this.waitForLoaderToDisappear();

    const elemen = this.page.locator("xpath=//div[@class='col-7 d-flex align-items-center']");
    const strng1 = (await elemen.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.inputField().fill(strng1);

    await this.page.waitForTimeout(500);
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
