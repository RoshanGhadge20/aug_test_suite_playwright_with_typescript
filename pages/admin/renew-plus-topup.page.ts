import { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import customerData from "../../testdata/admin/documents/customerData.json";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { AdminLoginPage } from "./login.page";
import { AssignPacketPage } from "./assign-packet.page";
import { RenewLoanPage } from "./renew-loan.page";
import { OpsApprovalPage } from "./ops-approval.page";
import { NewGoldLoanPage } from "./new-gold-loan.page";

/**
 * Port of Java: PO14_RenewPlusTopUp (locators) + Flow16_RenewPlusTopUpLoan.renewPlusTopUp() (actions)
 *
 * PO14_RenewPlusTopUp has only one locator (loc_loanID = Done button XPath).
 * The main action logic lives in Flow16_RenewPlusTopUpLoan.renewPlusTopUp().
 *
 * The active (non-commented) renewPlusTopUp() method:
 *   1. Logs in as appraiser (OMITTED), sets branch Show All.
 *   2. Navigates to Applied Loan, clicks Upload Documents, uploads 4 files + optional 6th.
 *   3. Fills CKYC, saves, selects lead converter, Done.
 *   4. Runs opsAprroval() (calls Flow07_OpsLoanpproval.opsAprroval()) — NOTE: this requires
 *      the OPS role; caller must inject loginAs('ops') before the ops section, so this
 *      method is split: renewPlusTopUpAppraiser() + opsApproval is done by caller + renewPlusTopUpPartner().
 *   5. Switches to partner, navigates Applied Loan, Partner Approval, Next×7, checkboxes, Approved, Submit, disburse.
 *
 * Cross-page locator notes:
 *   - All cross-page locators re-declared locally (same XPaths as other TC02 flows).
 *
 * Omitted loginWith* calls:
 *   - loginWithAppraiser() — OMITTED. Role = appraiser for appraiser section.
 *   - loginWithPartner() — OMITTED. Role = partner for partner section.
 *   Both are injected by the spec via loginAs().
 *
 * File upload note:
 *   - documentPath optional; skipped when not provided.
 */
export class RenewPlusTopupPage extends AdminBasePage {
  private assignPacketPage: AssignPacketPage;
  private newGoldLoanPage: NewGoldLoanPage;
  private adminLoginPage: AdminLoginPage;
  private renewLoanPage = new RenewLoanPage(this.page);
  public opsApprovalPage: OpsApprovalPage;
  constructor(page: Page) {
    super(page);
    this.assignPacketPage = new AssignPacketPage(page);
    this.newGoldLoanPage = new NewGoldLoanPage(page);
    this.adminLoginPage = new AdminLoginPage(page);
    this.opsApprovalPage = new OpsApprovalPage(page);
  }

  // ── Locators (from PO14_RenewPlusTopUp) ───────────────────────────────────

  private readonly loanID = () =>
    this.page.locator("xpath=//span[contains(.,'Done')]");

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
  private readonly btnOk = () =>
    this.page.locator("xpath=//button[@type='submit']");
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
  // PO13_RenewLoan.loc_btnUploadDocuments
  private readonly btnUploadDocuments = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
  private readonly appraisalRequest = () =>
    this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
  private readonly selectAppraiser = () =>
    this.page.locator("xpath=//select[@formcontrolname='appraiserId']");
  private readonly textField = () =>
    this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly customerManagementBtn = () =>
    this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
  private readonly btnProceed = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  private readonly btnRenewLoan = () =>
    this.page.locator("xpath=//button[contains(.,'Renew Loan')]");
  // PO05_AssignPacket.loc_fieldCkyc (inline)
  private readonly fieldCkyc = () =>
    this.page.locator("xpath=//input[@formcontrolname='ckycNumber']");
  // PO05_AssignPacket.loc_btnYes
  private readonly btnYesAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
  // PO05_AssignPacket.loc_btnDone
  private readonly btnDoneAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO07_OpsTeamLoanApproval.loc_partnerApproval
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
  private readonly loanDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  private readonly renewButton = () =>
    this.page.locator(
      "xpath=//button[@role='menuitem' and normalize-space()='Renew Loan']",
    );
  private readonly btnNext = () =>
    this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  // PO10_QuickPayment.loc_kebabMenu
  private readonly kebabMenu = () =>
    this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
  private readonly customerUniqID = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
  private readonly btnDownloadCashDeclaration = () =>
    this.page.locator(
      "xpath=//span[normalize-space(text())='Download Cash Declaration']",
    );
  // PO04_NewGoldLoan.loc_btnNext (for clickNextMultipleTimes)
  private readonly btnNextLoop = () =>
    this.page.locator("xpath=//button[span[normalize-space()='Next']]");
  // PO09_PartnerLoanApproval.loc_btnDisbursement
  // private readonly btnDisbursement = () =>
  //   this.page.locator("xpath=//button[normalize-space()='Disbursement']");
  // PO09_PartnerLoanApproval.loc_transactionID
  private readonly transactionID = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='securedBankTransactionId']",
    );
  // PO09_PartnerLoanApproval.loc_selPaymentType
  private readonly selPaymentType = () =>
    this.page.locator("xpath=//select[@formcontrolname='bankTransferType']");
  // PO09_PartnerLoanApproval.loc_btnDone
  private readonly btnDonePartner = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO09_PartnerLoanApproval.loc_btnYes
  private readonly btnYesPartner = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
  private readonly selPurpose = () =>
    this.page.locator("xpath=//select[@formcontrolname='loanPurpose']");
  private readonly netBanking = () =>
    this.page.locator("xpath=//img[@alt='netbanking']");
  private readonly btnConfirm = () =>
    this.page.locator(
      "xpath=//button[contains(@class,'mat')][.//span[normalize-space()='Confirm']]",
    );

  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Port of Flow05_AssignPacket.generateRandomCKYC() — inline. */
  generateRandomCKYC(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 14; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /** Port of Flow16_RenewPlusTopUpLoan.randomTransactionId(). */
  randomTransactionId(length: number): string {
    const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let sb = "";
    for (let i = 0; i < length; i++) {
      sb += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
    }
    return sb;
  }

  /** Port of Flow16_RenewPlusTopUpLoan.uploadFileToInput(). */
  async uploadFileToInput(index: number, filePath?: string): Promise<void> {
    if (!filePath) return;
    try {
      const input = this.page.locator(
        `xpath=(//input[@type='file'])[${index}]`,
      );
      await input.waitFor({ state: "attached", timeout: 30000 });
      await this.page.waitForTimeout(2000);
      await input.setInputFiles(filePath);
      await this.page.waitForTimeout(3000);
    } catch {
      // non-fatal
    }
  }

  /** Port of Flow16_RenewPlusTopUpLoan.clickNextMultipleTimes(). */
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
  // ── Actions (from Flow16_RenewPlusTopUpLoan.renewPlusTopUp — appraiser section) ──

  /**
   * Port of Flow16_RenewPlusTopUpLoan.renewPlusTopUp() — appraiser section (upload → save → done).
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * File upload: documentPath optional — skipped when not provided.
   */
  async renewPlusTopUp(documentPath?: string): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(7000);
    await this.renewPlusTopUpOnlinePay();
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
    await this.page.getByRole("menuitem", { name: "Renew Loan" }).click();

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
    await this.page.waitForTimeout(2000);
    await this.newGoldLoanPage.validateBankDetailsWithAdvanceCash();
    await this.btnNext().click();
    await this.page.waitForTimeout(3000);

    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const loanMgmt = this.loanManagement();
    await loanMgmt.click();

    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.waitFor({ state: "visible", timeout: 20000 });
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID().fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    //await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(1000);
    await this.filterbtn().click();
    await this.page.waitForTimeout(3000);
    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(5000);
    console.log("Before validateUploadDocuments");
    await this.renewLoanPage.validateUploadDocumnets();
    console.log("After validateUploadDocuments");
    await this.page.waitForTimeout(15000);
    await this.assignPacketPage.downloadAndUploadCashReceipt();
    await this.page.waitForTimeout(5000);
    // Download and re-upload Cash Declaration
    await this.assignPacketPage.downloadAndUploadCashDeclaration();
    await this.page.waitForTimeout(5000);
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

  /**
   * Port of the partner-approval + disbursement section in Flow16_RenewPlusTopUpLoan.renewPlusTopUp().
   *
   * NOTE: loginWithPartner() is OMITTED. Caller must loginAs('partner') before calling this.
   */
  async partnerRenewPlusTopupApproval(): Promise<void> {
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

    // Disbursement
    await this.loanDisbursement();
  }

  /** Port of Flow16_RenewPlusTopUpLoan.loanDisbursement(). */
  async loanDisbursement(): Promise<void> {
    //await this.btnDisbursement().click();
    this.page
      .locator("//button[normalize-space()='Disburse Amount']")
      .first()
      .click();
    await this.waitForLoaderToDisappear();

    await this.transactionID().fill(this.randomTransactionId(12));
    await this.waitForLoaderToDisappear();
    await this.selPaymentType().selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await this.btnDonePartner().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnYesPartner().click();
    await this.waitForLoaderToDisappear();
  }
  async renewPlusTopUpOnlinePay(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    const loanMgmt = this.loanManagement();
    await loanMgmt.click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails();

    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.customerUniqID().fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    //await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const kebab = this.kebabMenu();
    await kebab.scrollIntoViewIfNeeded();
    try {
      await this.page.waitForTimeout(5000);
      await kebab.click();
    } catch {
      await this.jsClick(kebab);
    }
    await this.page.waitForTimeout(5000);
    await this.btnRenewLoan().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const renewLoan = this.page.getByText("Renew Loan", { exact: true });

    console.log("Visible:", await renewLoan.isVisible());

    await renewLoan.highlight(); // Playwright Inspector

    await renewLoan.click();
    await this.page.waitForTimeout(5000);
    await this.page.getByText("Renewal + Top Up", { exact: true }).click();
    await this.page.waitForTimeout(2000);

    const checkbox = this.page.locator(
      "xpath=//td[text()='[ALL] FLEXI 540-30']/preceding-sibling::td//input[@type='checkbox']",
    );

    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await this.selPurpose().selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.selPayment().selectOption({ label: "PAYMENT GATEWAY" });
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
}
