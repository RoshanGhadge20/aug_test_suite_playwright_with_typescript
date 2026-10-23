import { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import fs from "fs";
import { existsSync } from "fs";
import { resolve } from "path";
import { documentPath } from "../../config/urls";
import { NewGoldLoanPage } from "./new-gold-loan.page";
import { AssignPacketPage } from "./assign-packet.page";
import { AdminLoginPage } from "./login.page";
import { OpsApprovalPage } from "./ops-approval.page";

/**
 * Port of Java: PO12_TopUp (locators) + Flow14_TopUp.topUp() / topUpOnlinePay() (actions)
 *
 * The active (non-commented) Flow14_TopUp.topUp() method:
 *   1. Fills CKYC number on the PO05_AssignPacket form (continuation of a previous step).
 *   2. Switches to partner role, navigates to Applied Loan, disburses the loan.
 *
 * The topUpOnlinePay() helper contains the online payment flow for top-up.
 * Both are ported here as separate public methods.
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator (same XPath as other TC02 flows).
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `loanDetails` re-declares PO10_QuickPayment.loc_LoanDetails (same XPath).
 *   - `kebabMenu` re-declares PO10_QuickPayment.loc_kebabMenu (same XPath).
 *   - `btnProceed` re-declares PO10_QuickPayment.loc_btnProceed (same XPath).
 *   - `netBanking` re-declares PO10_QuickPayment.loc_netBanking (same XPath).
 *   - `selPayment` re-declares PO10_QuickPayment.loc_selPayment (same XPath).
 *   - `btnConfirm` re-declares PO10_QuickPayment.loc_btnConfirm (same XPath).
 *   - `fieldCkyc` re-declares PO05_AssignPacket.loc_fieldCkyc (inline XPath from Java).
 *   - `btnYes` re-declares PO05_AssignPacket.loc_btnYes (same XPath).
 *   - `btnDone` re-declares PO05_AssignPacket.loc_btnDone (same XPath).
 *   - `btnDisbursement` re-declares PO09_PartnerLoanApproval.loc_btnDisbursement (same XPath).
 *   - `transactionID` re-declares PO09_PartnerLoanApproval.loc_transactionID (same XPath).
 *   - `selPaymentType` re-declares PO09_PartnerLoanApproval.loc_selPaymentType (same XPath).
 *   - `btnDonePartner` re-declares PO09_PartnerLoanApproval.loc_btnDone (same XPath).
 *   - `btnYesPartner` re-declares PO09_PartnerLoanApproval.loc_btnYes (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow14_TopUp.topUp() called Flow_LoginLogout.loginWithPartner() — OMITTED.
 *     Role = partner; caller must inject via loginAs('partner') before topUp().
 *
 * Random CKYC generator ported from Flow05_AssignPacket.generateRandomCKYC() inline.
 */
export class TopUpPage extends AdminBasePage {
  // Confirmed live via outerHTML dump (2026-09-30): after "Send OTP", the consent modal
  // re-renders as a `<div class="consent-dialog">` (its own component, NOT a
  // cdk-overlay-pane/Material dialog — different button/icon classes too: `kyc-btn`/`la la-*`)
  // with 6 `<input class="otp-cell" maxlength="1" type="text">` boxes. Scope directly to that
  // dialog's otp-cell inputs instead of the CDK-overlay guess used elsewhere in this suite for
  // the (differently-styled) Aadhaar-consent modal.
  protected otpInputLocator(): Locator {
    return this.page.locator(
      "xpath=//div[contains(@class,'consent-dialog')]//input[contains(@class,'otp-cell')]",
    );
  }

  private newGoldLoanPage = new NewGoldLoanPage(this.page);
  private assignPacketPage = new AssignPacketPage(this.page);
  private adminLoginPage: AdminLoginPage;
  private opsApprovalPage: OpsApprovalPage;
  constructor(page: Page) {
    super(page);
    this.newGoldLoanPage = new NewGoldLoanPage(this.page);
    this.assignPacketPage = new AssignPacketPage(this.page);
    this.adminLoginPage = new AdminLoginPage(this.page);
    this.opsApprovalPage = new OpsApprovalPage(this.page);
  }

  // ── Locators (from PO12_TopUp) ─────────────────────────────────────────────
  private readonly btnUploadDocuments = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
  private readonly topUpBtn = () =>
    this.page.locator("xpath=//button[normalize-space()='Top-Up']");
  private readonly inputField = () =>
    this.page.locator("xpath=//input[@formcontrolname='topUpAmount']");
  private readonly btnconfirm = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Confirm']/ancestor::button",
    );
  private readonly btnYes = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Yes']]");
  private readonly btnCheckbox = () =>
    this.page.locator("xpath=//span[@class='checkmark top-0']");
  private readonly selPurpose = () =>
    this.page.locator("xpath=//select[@formcontrolname='loanPurpose']");
  private readonly btnSubmit = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Submit']]");
  private readonly btnDownloadCash = () =>
    this.page.locator("xpath=//span[contains(.,'Download Cash Declaration')]");
  private readonly btnDone = () =>
    this.page.locator("xpath=//span[contains(.,'Done')]");
  private readonly btnSave = () =>
    this.page.locator("xpath=//span[normalize-space()='Save']");

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
  // PO10_QuickPayment.loc_LoanDetails
  private readonly loanDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  // PO10_QuickPayment.loc_kebabMenu
  private readonly kebabMenu = () =>
    this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
  // PO10_QuickPayment.loc_netBanking
  private readonly netBanking = () =>
    this.page.locator("xpath=//img[@alt='netbanking']");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO10_QuickPayment.loc_btnConfirm
  private readonly btnConfirm = () =>
    this.page.locator("xpath=(//span[normalize-space()='Confirm'])[2]");
  // PO13_RenewLoan.loc_btnYes
  private readonly btnYesRenew = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  // PO05_AssignPacket.loc_fieldCkyc (inline in Java: no dedicated PO constant — re-declared here)
  private readonly fieldCkyc = () =>
    this.page.locator("xpath=//input[@formcontrolname='ckycNumber']");
  // PO05_AssignPacket.loc_btnYes
  // "Yes" confirmation dialogs here render a real <button>Yes</button> (see assign-packet.page.ts),
  // not a bare span — match either form and take the first.
  private readonly btnYesAssign = () =>
    this.page
      .locator(
        "xpath=//button[normalize-space()='Yes' or .//span[normalize-space()='Yes']]",
      )
      .first();
  // PO05_AssignPacket.loc_btnDone
  private readonly btnDoneAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO09_PartnerLoanApproval.loc_btnDisbursement
  private readonly btnDisbursement = () =>
    this.page.locator("xpath=(//button[@class='green-button'])[1]");
  // PO09_PartnerLoanApproval.loc_transactionID
  private readonly transactionID = () =>
    this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  // PO09_PartnerLoanApproval.loc_selPaymentType
  private readonly selPaymentType = () =>
    this.page.locator("xpath=//select[@formcontrolname='paymentType']");
  // PO09_PartnerLoanApproval.loc_btnDone
  private readonly btnDonePartner = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO09_PartnerLoanApproval.loc_btnYes
  private readonly btnYesPartner = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
  private readonly customerUniqID = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
  private readonly btnNext = () =>
    this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  private readonly toBePaid = () =>
    this.page.locator(
      "xpath=//td[normalize-space(text())='To be paid']/following-sibling::td[@class='currency']",
    );
  private readonly advanceCashField = () =>
    this.page.locator("xpath=//td//input[@formcontrolname='advanceCash']");
  private readonly loanAmountField = () =>
    this.page.locator(
      "//td[normalize-space(text())='Top up Amount']/following-sibling::td[1]",
    );
  // "Confirm Top Up" consent modal — confirmed live via screenshot (2026-09-28) and via a real
  // outerHTML dump (2026-09-29). The outerHTML exposed the actual bug in the two checkbox
  // locators below: `//*[contains(normalize-space(),'...')]` matches every ANCESTOR of the
  // matching text too (an ancestor's string-value includes all its descendants' text), and
  // since XPath returns nodes in document order, `.first()` was resolving to some huge outer
  // container (e.g. near the document root) instead of the checkbox's row — clicking it was a
  // silent no-op. Fixed by targeting the checkboxes directly via their formcontrolname
  // (confirmed live: `formcontrolname="customerRequestConfirmed"` / `="termsAccepted"`, each a
  // real <input type="checkbox"> nested inside a `<label class="check-row">` alongside its
  // `<span class="check-text">` — same convention as every other formcontrolname locator in
  // this suite).
  // Confirmed live via outerHTML dump (2026-09-30): the whole modal — both the checkbox step
  // and the "Enter OTP received by customer" step it advances to after Send OTP — stays inside
  // one `<div class="consent-dialog">` wrapper for its entire lifetime; only the content
  // inside re-renders per step. This is a more reliable "is the modal (still) open" signal
  // than confirmTopUpHeading(), whose matched text is step-specific and goes stale once the
  // modal moves past the checkbox step (its heading isn't "Confirm Top Up" anymore once the
  // OTP step renders).
  private readonly consentDialog = () =>
    this.page.locator("xpath=//div[contains(@class,'consent-dialog')]");
  private readonly confirmTopUpRequestedCheckbox = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='customerRequestConfirmed']",
    );
  private readonly confirmTopUpRevisedTermsCheckbox = () =>
    this.page.locator("xpath=//input[@formcontrolname='termsAccepted']");
  private readonly btnSendOtp = () =>
    this.page.locator("xpath=//button[normalize-space()='Send OTP']");
  // Confirmed live via screenshot (2026-10-01): "Cancel" sits next to "Send OTP" in the same
  // modal footer. Scoped to consentDialog() rather than a bare //button match — RenewLoanPage
  // has its own unrelated "Cancel" locator (a <span>, different modal) and a bare match here
  // would risk colliding with a similarly-labeled button elsewhere on the page.
  private readonly btnCancelConsent = () =>
    this.consentDialog().locator("xpath=.//button[normalize-space()='Cancel']");

  // Confirmed live (2026-09-29): after "Send OTP", the modal advances to an OTP-entry step
  // whose submit button is labeled "Confirm" (not "Verify"/"Submit" as originally guessed —
  // this button matches on the <button>'s own normalize-space(), so it won't false-match the
  // "Confirm Renewal"/"Confirm Top Up" *heading* text elsewhere on the page). Older guessed
  // labels kept as fallbacks in case a different environment's build still uses them.
  private readonly btnVerifyTopUpOtp = () =>
    this.page
      .locator(
        "xpath=//button[normalize-space()='Confirm' or normalize-space()='Verify' or " +
          "normalize-space()='Verify OTP' or normalize-space()='Consent Received' or " +
          "normalize-space()='Submit']",
      )
      .first();

  // Confirmed live via outerHTML dump (2026-09-29): each checkbox is a real, visible
  // <input formcontrolname="..." type="checkbox"> nested directly inside its
  // <label class="check-row"> alongside the <span class="check-text"> — not the zero-size
  // custom-checkbox pattern used elsewhere in this suite. confirmTopUpRequestedCheckbox()/
  // confirmTopUpRevisedTermsCheckbox() resolve straight to these inputs (see their
  // definitions above for why the old contains()-text locators silently failed), so this can
  // interact with the checkbox directly instead of hunting for it via an ancestor. Shared by
  // confirmTopUpConsentIfPresent() (Send OTP path) and verifyCancelTopUpConsentModal()
  // (Cancel path) — both check the same two boxes before diverging.
  private async checkConsentBox(
    checkbox: Locator,
    description: string,
  ): Promise<boolean> {
    try {
      await checkbox.check({ timeout: 5000 });
    } catch (err: any) {
      console.log(
        `check() on "${description}" checkbox failed (${err.message}) — retrying with a forced click.`,
      );
      await checkbox.click({ force: true }).catch(async () => {
        await checkbox.dispatchEvent("click");
      });
    }
    await this.page.waitForTimeout(300);

    return checkbox.isChecked().catch(() => false);
  }

  private async checkBothTopUpConsentBoxes(): Promise<{
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
  }> {
    const requestedCheckboxChecked = await this.checkConsentBox(
      this.confirmTopUpRequestedCheckbox(),
      "customer personally requested this Top Up",
    );
    const revisedTermsCheckboxChecked = await this.checkConsentBox(
      this.confirmTopUpRevisedTermsCheckbox(),
      "customer agrees to the revised rate/charges/tenure",
    );
    return { requestedCheckboxChecked, revisedTermsCheckboxChecked };
  }

  /**
   * "Confirm Top Up" consent modal (screenshot, 2026-09-28 and 2026-09-29): checks the two
   * mandatory checkboxes ("customer personally requested this Top Up" / "customer has been
   * shown and agrees to the revised rate, charges and tenure"), clicks "Send OTP", then enters
   * the fixed backdoor OTP (same "123456" used elsewhere in this suite, e.g.
   * kyc.page.ts's completeAadhaarConsentModalIfPresent) and submits it. No-ops (returns
   * `modalOpened: false`) if the modal never appears. Never throws — every outcome, including a
   * rejected OTP, is reported back on the result object so callers (tests) can assert on it
   * without the whole flow blowing up mid-step.
   */
  private async confirmTopUpConsentIfPresent(otp: string = "123456"): Promise<{
    modalOpened: boolean;
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
    otpSent: boolean;
    otpEntered: boolean;
    otpAccepted: boolean;
  }> {
    const modalOpen = await this.consentDialog()
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!modalOpen) {
      return {
        modalOpened: false,
        requestedCheckboxChecked: false,
        revisedTermsCheckboxChecked: false,
        otpSent: false,
        otpEntered: false,
        otpAccepted: false,
      };
    }

    console.log(
      '"Confirm Top Up" consent modal appeared — checking both mandatory checkboxes and sending OTP.',
    );

    const { requestedCheckboxChecked, revisedTermsCheckboxChecked } =
      await this.checkBothTopUpConsentBoxes();

    const sendOtp = this.btnSendOtp();
    await sendOtp.waitFor({ state: "visible", timeout: 8000 });
    await sendOtp.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    let otpEntered = false;
    let otpAccepted = false;
    try {
      await this.fillOtp(otp);
      otpEntered = true;
      await this.page.waitForTimeout(500);

      const verifyBtn = this.btnVerifyTopUpOtp();
      const verifyVisible = await verifyBtn
        .waitFor({ state: "visible", timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      if (verifyVisible) {
        try {
          await verifyBtn.click({ timeout: 5000 });
        } catch (err: any) {
          console.log(
            `Standard click on the top-up OTP "Confirm" button failed (${err.message}) — ` +
              "retrying after scrollIntoView, then with a forced click.",
          );
          await verifyBtn.scrollIntoViewIfNeeded().catch(() => {});
          await verifyBtn.click({ force: true }).catch(async () => {
            await verifyBtn.dispatchEvent("click");
          });
        }
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(2000);
      } else {
        console.log(
          "No OTP submit button found after entering the top-up consent OTP — some UIs " +
            "auto-submit on the last digit; continuing to check the outcome regardless.",
        );
      }

      const errorBanner = this.page.locator(
        "xpath=//*[contains(@class,'toast-error') or contains(@class,'alert-danger')]",
      );
      const errorVisible = await errorBanner.isVisible().catch(() => false);
      const modalStillOpen = await this.consentDialog()
        .isVisible()
        .catch(() => false);
      otpAccepted = !errorVisible && !modalStillOpen;
    } catch (err: any) {
      console.log(
        `Entering/submitting the top-up consent OTP failed: ${err.message}`,
      );
    }

    return {
      modalOpened: true,
      requestedCheckboxChecked,
      revisedTermsCheckboxChecked,
      otpSent: true,
      otpEntered,
      otpAccepted,
    };
  }

  generateRandomCKYC(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 14; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /** Port of Flow14_TopUp.randomTransactionId(). */
  randomTransactionId(length: number): string {
    const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let sb = "";
    for (let i = 0; i < length; i++) {
      sb += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
    }
    return sb;
  }

  // ── Actions (from Flow14_TopUp.topUp — active/non-commented section) ──────

  /**
   * Port of Flow14_TopUp.topUp() — the active (non-commented) portion.
   *
   * NOTE: Flow14_TopUp.topUp() called Flow_LoginLogout.loginWithPartner() — OMITTED.
   * Role = partner; caller must inject via loginAs('partner') before calling topUp().
   *
   * Fills CKYC field, saves, selects lead converter, clicks Done, then navigates to
   * Applied Loan as partner and disburses the loan.
   */
  async topUp(): Promise<void> {
    const data = getLoginData();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.topUpOnlinePay();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.validateBankDetailsWithAdvanceCash();
    await this.page.waitForTimeout(5000);

    // After Bank Details → Next the Top Up wizard now carries on to its own Upload Documents tab
    // (confirmed from the TC02 video). The top-up loan doesn't exist in Applied Loan until the
    // wizard is saved, so leaving it to look the loan up there ("No data found") abandons the
    // top-up. Stay in the wizard; only fall back to the Applied Loan route for older builds that
    // still end the wizard after Bank Details.
    const uploadDocsTab = this.page
      .locator(
        "xpath=//*[contains(normalize-space(text()),'Gold Loan Application')]",
      )
      .first();
    let inWizardUploadDocs = await uploadDocsTab
      .waitFor({ state: "visible", timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    // Intermediate tabs (Loan Status Approval / Packets) may need a Next each.
    for (let i = 0; i < 3 && !inWizardUploadDocs; i++) {
      const next = this.page
        .locator("xpath=//button[normalize-space()='Next']")
        .first();
      if (!(await next.isEnabled().catch(() => false))) break;
      await next.click();
      await this.waitForLoaderToDisappear();
      inWizardUploadDocs = await uploadDocsTab
        .waitFor({ state: "visible", timeout: 10000 })
        .then(() => true)
        .catch(() => false);
    }

    if (!inWizardUploadDocs) {
      console.log(
        "Upload Documents tab not reached in the wizard — using Applied Loan.",
      );
      await this.expandSidebar();
      await this.page.waitForTimeout(5000);
      const loanMgmt = this.loanManagement();
      await loanMgmt.click();
      await this.waitForLoaderToDisappear();

      const appliedLoan = this.page.locator(
        "xpath=//span[normalize-space()='Applied Loan']",
      );
      await appliedLoan.waitFor({ state: "visible" });
      await appliedLoan.click();
      await this.waitForLoaderToDisappear();
      await this.filterAppliedLoanByCustomer(this.currentCustomerId());
      await this.btnUploadDocuments().waitFor({
        state: "visible",
        timeout: 30000,
      });
      await this.btnUploadDocuments().click();
      await this.waitForLoaderToDisappear();
    }
    const envPath = documentPath("DOCUMENT");
    let resolvedDocPath: string | undefined;
    if (envPath) {
      resolvedDocPath =
        envPath.startsWith("/") || envPath.match(/^[A-Z]:/)
          ? envPath
          : resolve(process.cwd(), envPath);

      if (!existsSync(resolvedDocPath)) {
        const fallbackPath = resolve(__dirname, "../../..", envPath);
        if (existsSync(fallbackPath)) {
          resolvedDocPath = fallbackPath;
        }
      }
    }

    if (resolvedDocPath && existsSync(resolvedDocPath)) {
      await this.assignPacketPage.uploadMandatoryDocuments(resolvedDocPath);

      const consumptionInput = this.page.locator(
        "xpath=//i[@class='fas fa-file-upload']/parent::button/following-sibling::input[@type='file'][1]",
      );
      if (await consumptionInput.count()) {
        await consumptionInput.setInputFiles(resolvedDocPath);
        console.log("✓ Consumption Supporting Document uploaded");
        await this.page.waitForTimeout(2000);
      } else {
        console.warn(
          "⚠ Consumption Supporting file input not found next to the upload icon",
        );
      }
    } else {
      console.log(
        resolvedDocPath
          ? `⊘ Mandatory document upload skipped (file not found: ${resolvedDocPath})`
          : "⊘ Mandatory document upload skipped (no file path provided)",
      );
    }

    await this.page.waitForTimeout(10000);
    await this.assignPacketPage.downloadAndUploadCashReceipt();
    await this.page.waitForTimeout(5000);
    await this.assignPacketPage.downloadAndUploadCashDeclaration();
    await this.assignPacketPage.ensureCashReceiptAttached();
    const saveBtn = this.page.locator(
      "xpath=//button[normalize-space()='Save']",
    );
    await saveBtn.waitFor({ state: "attached", timeout: 30000 });
    await this.page.waitForTimeout(1000);
    await this.jsClick(saveBtn);
    await this.page.waitForTimeout(2000);
    await this.waitForLoaderToDisappear();

    await this.btnYesAssign().waitFor({ state: "visible", timeout: 20000 });
    await this.btnYesAssign().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    const dropdownEle = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );
    await dropdownEle.waitFor({ state: "visible", timeout: 30000 });
    await this.page.waitForTimeout(1000);
    try {
      await dropdownEle.selectOption({ label: "Priyanka Thorat" });
    } catch {}
    await this.page.waitForTimeout(1000);
    await this.btnDoneAssign().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(5000);
  }

  private async filterAppliedLoanByCustomer(customerId: string): Promise<void> {
    console.log("Applied Loan filter — customer:", customerId);
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await this.page.waitForTimeout(3000);

    for (let attempt = 1; attempt <= 3; attempt++) {
      const field = this.customerUniqID();
      await field.waitFor({ state: "visible", timeout: 20000 });
      await field.click();
      await field.fill(customerId);
      await this.page.waitForTimeout(1000);
      if ((await field.inputValue().catch(() => "")).trim() !== customerId) {
        console.log(
          `Filter box lost the value (attempt ${attempt}/3) — retrying.`,
        );
        await this.page.waitForTimeout(3000);
        continue;
      }

      // The table keeps re-rendering: bypass stability polling for the Filter click.
      const filterBtn = this.filterbtn().first();
      await filterBtn.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await filterBtn.click({ force: true, noWaitAfter: true });
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(3000);

      const rows = this.page.locator(
        "xpath=//*[@role='row'][.//*[@role='gridcell' or self::td or self::mat-cell]]",
      );
      const texts = await rows.allInnerTexts().catch(() => [] as string[]);
      const onlyThisCustomer =
        texts.length > 0 && texts.every((t) => t.includes(customerId));
      if (onlyThisCustomer) return;
      console.log(
        `Applied Loan not filtered to ${customerId} yet (attempt ${attempt}/3, ${texts.length} row(s)) — retrying.`,
      );
      await this.page.waitForTimeout(3000);
    }
    throw new Error(
      `Applied Loan never filtered down to customer ${customerId} (or the customer has no loan in this list).`,
    );
  }

  /** Port of Flow14_TopUp.loanDisbursement(). */
  /** Reads the customer ID fresh — a static JSON import goes stale once onboarding rewrites it. */
  private currentCustomerId(): string {
    return String(
      JSON.parse(
        fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
      ).customerId,
    ).trim();
  }

  async loanDisbursement(): Promise<void> {
    // After loginAs('partner') the app lands on the dashboard (confirmed from the failure
    // screenshot), so the "Disburse Amount" button doesn't exist yet — open Applied Loan and
    // filter to this customer first, like partner-approval.page.ts does.
    await this.page.waitForTimeout(500);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.customerUniqID().fill(this.currentCustomerId());
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2500);

    // Table re-renders continuously — bypass stability polling for the Filter click.
    const filterBtn = this.filterbtn().first();
    await filterBtn.waitFor({ state: "attached", timeout: 15000 });
    await filterBtn.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await filterBtn.click({ force: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.btnDisbursement().waitFor({ state: "attached", timeout: 30000 });
    await this.btnDisbursement().click({ force: true });
    await this.waitForLoaderToDisappear();

    // The Top Up disbursement form (confirmed from the failure snapshot) has no
    // formcontrolname='transactionId' input — the field is just labelled "Transaction ID*".
    // Locate by label (or the old formcontrolname if it ever exists) instead of a fixed attribute.
    const txnInput = this.page
      .locator(
        "xpath=(//*[self::label or self::span or self::div][starts-with(normalize-space(text()),'Transaction ID')]/following::input[not(@disabled)][1])[1]",
      )
      .or(this.transactionID())
      .first();
    await txnInput.waitFor({ state: "visible", timeout: 30000 });
    await txnInput.scrollIntoViewIfNeeded();
    const txnId = this.randomTransactionId(12);
    await txnInput.fill(txnId);
    await expect(txnInput).toHaveValue(txnId);
    await this.waitForLoaderToDisappear();

    // Payment Type is a <select> with IMPS / NEFT / RTGS (placeholder "Select Payment Type").
    const paymentType = this.page
      .locator("xpath=//select[option[normalize-space()='RTGS']]")
      .first();
    await paymentType.scrollIntoViewIfNeeded();
    await paymentType.selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(1000);

    const doneBtn = this.page
      .locator(
        "xpath=//button[normalize-space()='Done' or .//span[normalize-space()='Done']]",
      )
      .first();
    await doneBtn.scrollIntoViewIfNeeded();
    await expect(doneBtn).toBeEnabled({ timeout: 15000 });
    await doneBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const yesBtn = this.page
      .locator(
        "xpath=//button[normalize-space()='Yes' or .//span[normalize-space()='Yes']]",
      )
      .first();
    await yesBtn.waitFor({ state: "visible", timeout: 15000 });
    await yesBtn.click();
    await this.waitForLoaderToDisappear();
  }
  async validateBankDetailsWithAdvanceCash(): Promise<void> {
    // No page.reload() here: the Top Up Preview → Bank Details screen lives only in the SPA's
    // in-memory state, so a reload redirects back to the Loan Details list and the "Top up Amount"
    // row below never exists (confirmed from the TC02 failure video — the preview was already
    // showing "Top up Amount ₹700.00" right before the reload threw it back to the list).
    await this.waitForLoaderToDisappear();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(3000);
    const loanAmtEl = this.loanAmountField();
    //await loanAmtEl.evaluate((el) => (el as any).scrollIntoView(true));

    console.log("Loan Amount Count:", await loanAmtEl.count());
    await this.page.waitForTimeout(1000);
    // await this.page.evaluate('window.scrollBy(0, -150);');
    await this.page.waitForTimeout(5000);
    await loanAmtEl.waitFor({
      state: "attached",
      timeout: 30000,
    });
    //await loanAmtEl.waitFor({ state: "visible" });
    await expect(loanAmtEl.first()).toBeVisible({
      timeout: 60000,
    });
    await loanAmtEl.click();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press("Tab");

    // const wavierField = this.page.locator(
    //   "xpath=//input[@formcontrolname='wavier']",
    // );
    // await wavierField.clear();
    await this.page.waitForTimeout(3000);
    // await wavierField.scrollIntoViewIfNeeded();

    const toBePaidEl = this.toBePaid();
    //await toBePaidEl.scrollIntoViewIfNeeded();
    const str = (await toBePaidEl.innerText()).trim();

    const numericValue = str.replace(/₹/g, "").replace(/,/g, "");

    console.log(numericValue);

    const advanceCashEl = this.advanceCashField();
    await advanceCashEl.evaluate((el) =>
      (el as any).scrollIntoView({ block: "center" }),
    );
    await advanceCashEl.clear();
    await advanceCashEl.fill(numericValue);
    await this.page.waitForTimeout(4000);

    // The "To be paid" row's Remarks box is mandatory (red "Required field" in the failure video):
    // Next silently refuses to advance while it is empty. Fill every empty remark in this table.
    const remarkBoxes = this.page.locator(
      "xpath=//table//textarea[not(@disabled)] | //td//textarea[not(@disabled)]",
    );
    const remarkCount = await remarkBoxes.count();
    for (let i = 0; i < remarkCount; i++) {
      const box = remarkBoxes.nth(i);
      if (!(await box.isVisible().catch(() => false))) continue;
      if ((await box.inputValue().catch(() => "")).trim()) continue;
      await box.fill("Top-up bank details verified");
    }
    await this.page.waitForTimeout(1000);

    await this.page.waitForTimeout(5000);
    await this.jsClick(this.btnNext());
    await this.waitForLoaderToDisappear();
  }

  /**
   * Shared navigation for the top-up amount entry: opens the customer's loan, opens the
   * top-up form, fills amount + purpose, and clicks "Confirm" twice. Extracted from
   * topUpOnlinePay() so verifyConfirmTopUpConsentModal() can reach the same point without
   * duplicating the flow or altering topUpOnlinePay()'s own (unchanged) behavior below it.
   */
  private async navigateAndConfirmTopUp(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.customerUniqID().fill(this.currentCustomerId());
    console.log(this.currentCustomerId());
    //await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    // noWaitAfter: see the fix earlier in topUp() above.
    await this.filterbtn().click({ noWaitAfter: true });
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

    await this.topUpBtn().click();
    await this.page.waitForTimeout(5000);

    // Checkbox (3rd custom-checkbox checkmark)
    const checkbox = this.page.locator(
      "xpath=(//label[@class='custom-checkbox']//span[contains(@class,'checkmark')])[6]",
    );
    //await checkbox.evaluate((el: any) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await this.page.waitForTimeout(3000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(5000);
    const topUpAmtEl = this.page.locator(
      "xpath=//input[@formcontrolname='topUpAmount']",
    );
    await this.page.waitForTimeout(5000);
    await topUpAmtEl.clear();
    await this.page.waitForTimeout(2000);
    // 200 is below this scheme's processing fee (₹1,000 in the TC02 run), which makes "To be paid"
    // negative (-₹800) and the Bank Details step unusable. Use an amount that clears the fee.
    await this.inputField().fill("5000");
    await this.page.waitForTimeout(2000);
    await this.selPurpose().selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
    await expect(this.btnConfirm()).toBeVisible();
    await this.btnConfirm().click();
    await this.page.waitForTimeout(1000);
    await this.btnConfirm().click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
  }

  /** Port of Flow14_TopUp.topUpOnlinePay() — unchanged legacy Yes/checkbox/submit path. */
  async topUpOnlinePay(): Promise<void> {
    await this.navigateAndConfirmTopUp();

    const yesBtn = this.page.locator(
      "//button[.//span[normalize-space()='Yes']]",
    );
    const yesBtnVisible = await yesBtn.isVisible().catch(() => false);
    if (yesBtnVisible) {
      await yesBtn.click();
      await this.page.waitForTimeout(5000);
    }

    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);

    await this.btnCheckbox().click();

    await this.page.waitForTimeout(2000);
    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
  }

  async verifyConfirmTopUpConsentModal(): Promise<{
    modalOpened: boolean;
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
    otpSent: boolean;
    otpEntered: boolean;
    otpAccepted: boolean;
  }> {
    await this.navigateAndConfirmTopUp();
    return this.confirmTopUpConsentIfPresent();
  }

  /**
   * "Confirm Top Up" consent modal — Cancel path (screenshot, 2026-10-01): drives the same
   * navigation as verifyConfirmTopUpConsentModal(), checks both mandatory checkboxes, then
   * clicks "Cancel" instead of "Send OTP" and verifies the modal closes without sending an OTP
   * or submitting the top-up. Non-mutating (no OTP sent, nothing submitted) — safe to run
   * before an accept-path test reuses the same loan/customer. Never throws.
   */
  async verifyCancelTopUpConsentModal(): Promise<{
    modalOpened: boolean;
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
    modalClosedAfterCancel: boolean;
  }> {
    await this.navigateAndConfirmTopUp();

    const modalOpen = await this.consentDialog()
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!modalOpen) {
      return {
        modalOpened: false,
        requestedCheckboxChecked: false,
        revisedTermsCheckboxChecked: false,
        modalClosedAfterCancel: false,
      };
    }

    console.log(
      '"Confirm Top Up" consent modal appeared — checking both mandatory checkboxes then clicking Cancel.',
    );

    const { requestedCheckboxChecked, revisedTermsCheckboxChecked } =
      await this.checkBothTopUpConsentBoxes();

    const cancelBtn = this.btnCancelConsent();
    await cancelBtn.waitFor({ state: "visible", timeout: 8000 });
    await cancelBtn.click();
    await this.waitForLoaderToDisappear().catch(() => {});
    await this.page.waitForTimeout(1500);

    const modalClosedAfterCancel = await this.consentDialog()
      .isVisible()
      .then((visible) => !visible)
      .catch(() => true);

    return {
      modalOpened: true,
      requestedCheckboxChecked,
      revisedTermsCheckboxChecked,
      modalClosedAfterCancel,
    };
  }
}
