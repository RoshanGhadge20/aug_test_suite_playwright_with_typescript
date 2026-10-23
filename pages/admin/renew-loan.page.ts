import { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { AssignPacketPage } from "./assign-packet.page";
import { documentPath } from "@config/urls";
import { existsSync } from "fs";
import fs from "fs";
import { resolve } from "path";
import { AdminLoginPage } from "./login.page";

/**
 * Port of Java: PO13_RenewLoan (locators) + Flow15_RenewLoan.renew() (actions)
 *
 * The active (non-commented) Flow15_RenewLoan.renew() method:
 *   1. Logs in as appraiser, sets branch to Show All (OMITTED — loginWithAppraiser omitted).
 *   2. Navigates to Loan Management → Applied Loan, filters by firstName.
 *   3. Clicks Upload Documents, refreshes, uploads 3 (+ optional 6th) file inputs.
 *   4. Fills CKYC, saves, selects leadConverter, clicks Done.
 *   5. Switches to partner, navigates Applied Loan, clicks Partner Approval, next×7, checkboxes, Approved, Submit.
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator (same XPath as other TC02 flows).
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `fieldCkyc` inline re-declaration from Flow05_AssignPacket.
 *   - `btnYesAssign` re-declares PO05_AssignPacket.loc_btnYes (same XPath).
 *   - `btnDoneAssign` re-declares PO05_AssignPacket.loc_btnDone (same XPath).
 *   - `partnerApproval` re-declares PO07_OpsTeamLoanApproval.loc_partnerApproval (same XPath).
 *   - `checkClick` re-declares PO07_OpsTeamLoanApproval.loc_checkClick (same XPath).
 *   - `checkClick1` re-declares PO07_OpsTeamLoanApproval.loc_checkClick1 (same XPath).
 *   - `btnSubmitOps` re-declares PO07_OpsTeamLoanApproval.loc_btnSubmit (same XPath).
 *   - `btnNextLoop` re-declares PO04_NewGoldLoan.loc_btnNext (same XPath) — used in clickNextSafely.
 *
 * Omitted loginWith* calls:
 *   - Flow15_RenewLoan.renew() called Flow_LoginLogout.loginWithAppraiser() — OMITTED.
 *     Role = appraiser; caller must inject via loginAs('appraiser').
 *   - Flow15_RenewLoan.renew() called Flow_LoginLogout.loginWithPartner() — OMITTED.
 *     Role = partner; caller must inject via loginAs('partner') at the appropriate step.
 *
 * File upload note:
 *   - uploadFileToInput(): uses setInputFiles(); caller may supply documentPath.
 *     Defaults to skipping when no path provided (consistent with other TC02 POs).
 */
export class RenewLoanPage extends AdminBasePage {
  private assignPacketPage: AssignPacketPage;
  private adminLoginPage: AdminLoginPage;
  constructor(page: Page) {
    super(page);

    this.assignPacketPage = new AssignPacketPage(page);
    this.adminLoginPage = new AdminLoginPage(page);
  }

  // Confirmed live via outerHTML dump (2026-09-30, captured off the Renew+TopUp modal's own
  // OTP text — "sent the Renewal + Top Up details" — proving this dialog really is shared
  // across Top Up/Renewal/Renew+TopUp as assumed elsewhere in this file): after "Send OTP",
  // the consent modal re-renders as a `<div class="consent-dialog">` (its own component, not
  // a cdk-overlay-pane/Material dialog) with 6 `<input class="otp-cell" maxlength="1"
  // type="text">` boxes. Scope directly to that dialog's otp-cell inputs — same fix applied to
  // top-up.page.ts's otpInputLocator().
  protected otpInputLocator(): Locator {
    return this.page.locator(
      "xpath=//div[contains(@class,'consent-dialog')]//input[contains(@class,'otp-cell')]",
    );
  }

  // ── Locators (from PO13_RenewLoan) ────────────────────────────────────────

  private readonly btnUploadDocuments = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
  private readonly btnProceed = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  private readonly btnCancelText = () =>
    this.page.locator("xpath=//span[normalize-space()='Cancel']");
  private readonly btnRenewLoan = () =>
    this.page.locator("xpath=//button[contains(.,'Renew Loan')]");
  // Offline (RTGS/NEFT) payment mode fields — re-declared from PO23_PartReleaseOffline,
  // same fields renew-zero.page.ts's validaterenewofflineWithIMPS() fills after selPayment.
  private readonly inputBankName = () =>
    this.page.locator("xpath=//input[@formcontrolname='bankName']");
  private readonly inputBranchName = () =>
    this.page.locator("xpath=//input[@formcontrolname='branchName']");
  private readonly inputBankTransactionID = () =>
    this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  // PO11_PartPayment.loc_btnProced — the kt-button "Proceed" wrapper used to submit the
  // offline (RTGS) payment-mode screen, distinct from the plain btnProceed() used on the
  // scheme-selection screen (same distinction renew-zero.page.ts makes).
  private readonly btnProced = () =>
    this.page.locator(
      "xpath=(//kt-button[@ng-reflect-value='Proceed']//button[@type='button'])[2]",
    );
  // PO16_FullRelease.loc_jwellaryReleaseApproval / renew-zero.page.ts deposit() locators
  private readonly jwellaryReleaseApproval = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
  private readonly Renewal = () =>
    this.page.locator("xpath=//span[contains(.,'Renewal Loans')]");
  private readonly btnUpdate = () =>
    this.page.locator("xpath=(//button[contains(.,'Update')])[1]");
  private readonly btnUpdate1 = () =>
    this.page.locator("xpath=(//span[contains(.,'Update')])[1]");
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly upfrontID = () =>
    this.page.locator("xpath=//input[@formcontrolname='upfrontTransactionId']");
  private readonly loanDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  private readonly renewButton = () =>
    this.page.locator(
      "xpath=//button[@role='menuitem' and normalize-space()='Renew Loan']",
    );
  private readonly btnNext = () =>
    this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");

  private readonly firstSchemeCheckbox = () =>
    this.page
      .locator(
        "xpath=//td[starts-with(normalize-space(text()),'[ALL]')]/preceding-sibling::td//input[@type='checkbox']",
      )
      .first();
  // PO10_QuickPayment.loc_kebabMenu
  private readonly kebabMenu = () =>
    this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  private readonly btnYesAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
  // PO05_AssignPacket.loc_btnDone
  private readonly btnDoneAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO07_OpsTeamLoanApproval.loc_partnerApproval — one customer can have several loans awaiting
  // partner approval (e.g. the original loan and the renewal), so always take the first (newest).
  private readonly partnerApproval = () =>
    this.page.locator("xpath=//button[contains(.,'PARTNER APPROVAL')]").first();

  /** Reads the customer ID fresh — a static JSON import goes stale once onboarding rewrites it. */
  private currentCustomerId(): string {
    return String(
      JSON.parse(
        fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
      ).customerId,
    ).trim();
  }
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
  // PO05_AssignPacket.loc_fieldCkyc (inline in Java)
  private readonly appraisalRequest = () =>
    this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
  private readonly selectAppraiser = () =>
    this.page.locator("xpath=//select[@formcontrolname='appraiserId']");
  private readonly textField = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique ID']");
  private readonly customerManagementBtn = () =>
    this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
  private readonly fieldCkyc = () =>
    this.page.locator("xpath=//input[@formcontrolname='ckycNumber']");
  // PO05_AssignPacket.loc_btnYes

  private readonly kebabMenu1 = () =>
    this.page.locator(
      "xpath=(//mat-row[.//*[contains(text(),'New Loan')]]//mat-icon[normalize-space()='more_vert'])[1]",
    );
  private readonly kebabMenu2 = () =>
    this.page.locator(
      "xpath=(//mat-row[.//*[contains(text(),'Renew Loan')]]//mat-icon[normalize-space()='more_vert'])[1]",
    );
  private readonly applyLoan = () =>
    this.page.locator(
      "xpath=//button[contains(@class,'mat-menu-item') and normalize-space(text())='Apply Loan']",
    );
  private readonly btnOk = () =>
    this.page.locator("xpath=//button[@type='submit']");
  // PO04_NewGoldLoan.loc_btnNext (re-declared for clickNextSafely)
  private readonly btnNextLoop = () =>
    this.page.locator("xpath=//button[span[normalize-space()='Next']]");
  private readonly customerUniqID = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
  private readonly transactionID = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='securedBankTransactionId']",
    );
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
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
  private readonly confirmRenewalRequestedCheckbox = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='customerRequestConfirmed']",
    );
  private readonly confirmRenewalRevisedTermsCheckbox = () =>
    this.page.locator("xpath=//input[@formcontrolname='termsAccepted']");
  private readonly btnSendOtpRenewal = () =>
    this.page.locator("xpath=//button[normalize-space()='Send OTP']");
  private readonly btnVerifyRenewalOtp = () =>
    this.page
      .locator(
        "xpath=//button[normalize-space()='Confirm' or normalize-space()='Verify' or " +
          "normalize-space()='Verify OTP' or normalize-space()='Consent Received' or " +
          "normalize-space()='Submit']",
      )
      .first();

  private readonly consentDialog = () =>
    this.page.locator("xpath=//div[contains(@class,'consent-dialog')]");
  // Confirmed live via screenshot (2026-10-01): "Cancel" sits next to "Send OTP" in the same
  // modal footer. Scoped to consentDialog() to avoid colliding with any other "Cancel" button
  // elsewhere on the page.
  private readonly btnCancelConsent = () =>
    this.consentDialog().locator("xpath=.//button[normalize-space()='Cancel']");

  // Shared by confirmRenewalConsentIfPresent() (Send OTP path) and
  // verifyCancelRenewalConsentModal() (Cancel path) — both check the same two boxes before
  // diverging. Same formcontrolname-based checkboxes as the other two consent modals.
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

  private async checkBothRenewalConsentBoxes(): Promise<{
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
  }> {
    const requestedCheckboxChecked = await this.checkConsentBox(
      this.confirmRenewalRequestedCheckbox(),
      "customer personally requested this Renewal",
    );
    const revisedTermsCheckboxChecked = await this.checkConsentBox(
      this.confirmRenewalRevisedTermsCheckbox(),
      "customer agrees to the revised rate/charges/tenure",
    );
    return { requestedCheckboxChecked, revisedTermsCheckboxChecked };
  }

  private async confirmRenewalConsentIfPresent(
    otp: string = "123456",
  ): Promise<{
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
      '"Confirm Renewal" consent modal appeared — checking both mandatory checkboxes and sending OTP.',
    );

    const { requestedCheckboxChecked, revisedTermsCheckboxChecked } =
      await this.checkBothRenewalConsentBoxes();

    const sendOtp = this.btnSendOtpRenewal();
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

      const verifyBtn = this.btnVerifyRenewalOtp();
      const verifyVisible = await verifyBtn
        .waitFor({ state: "visible", timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      if (verifyVisible) {
        try {
          await verifyBtn.click({ timeout: 5000 });
        } catch (err: any) {
          console.log(
            `Standard click on the renewal OTP "Confirm" button failed (${err.message}) — ` +
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
          "No OTP submit button found after entering the renewal consent OTP — some UIs " +
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
        `Entering/submitting the renewal consent OTP failed: ${err.message}`,
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
  randomTransactionId(length: number): string {
    const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let sb = "";
    for (let i = 0; i < length; i++) {
      sb += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
    }
    return sb;
  }
  async clickNextSafely(times: number = 1) {
    for (let i = 0; i < times; i++) {
      // Re-locate each iteration so a page re-render doesn't cause stale element errors.
      const nextBtn = this.page
        .locator("//button[span[normalize-space()='Next']]")
        .first();

      await nextBtn.waitFor({ state: "visible", timeout: 30000 });

      console.log(`Clicking Next button: ${i + 1}`);

      try {
        await nextBtn.scrollIntoViewIfNeeded();
      } catch {
        // Element may have been replaced by Angular re-render; relocate and proceed.
      }

      await this.page
        .locator("//button[span[normalize-space()='Next']]")
        .first()
        .click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(1000);
    }
  }

  async renew(documentPath?: string): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.waitForLoaderToDisappear();
    await this.renewOnlinePay();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.appraisalRequest().waitFor({ state: "visible" });
    await this.appraisalRequest().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.textField().fill(this.currentCustomerId());
    console.log(this.currentCustomerId());
    await this.page.waitForTimeout(5000);

    // Click the kebab button whose menu contains "Renew Loan".
    // The table uses mat-row/mat-cell (ARIA grid), not tr/td. Only "Processing" rows have a kebab.
    {
      const allKebabs = this.page.locator(
        "xpath=//button[contains(@class,'mat-menu-trigger')]",
      );
      const kebabCount = await allKebabs.count();
      let renewClicked = false;
      for (let k = 0; k < kebabCount; k++) {
        const kebab = allKebabs.nth(k);
        if (!(await kebab.isVisible().catch(() => false))) continue;
        await kebab.scrollIntoViewIfNeeded();
        await kebab.click();
        await this.page.waitForTimeout(800);
        const menuItem = this.page.getByRole("menuitem", {
          name: "Renew Loan",
        });
        if (
          (await menuItem.count()) > 0 &&
          (await menuItem.isVisible().catch(() => false))
        ) {
          await menuItem.click();
          renewClicked = true;
          break;
        }
        await this.page.keyboard.press("Escape");
        await this.page.waitForTimeout(400);
      }
      if (!renewClicked) {
        throw new Error(
          "No kebab with 'Renew Loan' found - loan may need to be in Processing state",
        );
      }
    }

    await this.page.waitForTimeout(2000);
    await this.btnOk().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    // The renew form opens on "Bank Details" (pre-filled tabs skip forward).
    // Click "Final Interest Calculator" tab directly to run calculation first.
    const finalInterestTab = this.page.getByRole("tab", {
      name: "Final Interest Calculator",
    });
    await finalInterestTab.waitFor({ state: "visible", timeout: 15000 });
    await finalInterestTab.click();
    await this.page.waitForTimeout(2000);

    const calculateBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Calculate']]",
    );
    await calculateBtn.waitFor({ state: "visible", timeout: 30000 });
    console.log("Calculate visible:", await calculateBtn.isVisible());
    await calculateBtn.scrollIntoViewIfNeeded();
    try {
      await calculateBtn.click({ timeout: 10000 });
    } catch {
      await calculateBtn.click({ force: true });
    }
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // Navigate to Bank Details tab and handle upload.
    const bankDetailsTab = this.page.getByRole("tab", { name: "Bank Details" });
    await bankDetailsTab.click();
    await this.page.waitForTimeout(2000);

    const upfrontReceiptLabel = this.page.locator(
      "xpath=//*[contains(text(),'Upload Upfront Receipt')]",
    );
    if (
      await upfrontReceiptLabel.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      console.log("Upload Upfront Receipt step - uploading file");
      const pdfPath = resolve(
        process.cwd(),
        "testdata/admin/singnature-sample.pdf",
      );
      const fileInputs = this.page.locator("xpath=//input[@type='file']");
      const fileCount = await fileInputs.count();
      if (fileCount > 0) {
        const lastInput = fileInputs.nth(fileCount - 1);
        await lastInput.evaluate((el) => {
          (el as HTMLInputElement).style.display = "block";
        });
        await lastInput.setInputFiles(pdfPath);
        console.log("Upfront Receipt uploaded: " + pdfPath);
        await this.page.waitForTimeout(1500);
      }
      const txnIdInput = this.page.locator(
        "xpath=//input[@placeholder='Upfront Transaction Id']",
      );
      if (await txnIdInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const existing = await txnIdInput.inputValue();
        if (!existing) {
          await txnIdInput.fill("UPFR" + String(Date.now()).slice(-8));
        }
      }
      await this.btnNext().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);
    }

    await this.page.waitForTimeout(3000);
    // "Loan Status Approval" may or may not have a Next button. Only click if visible.
    const postBankNext = this.page
      .locator("//button[span[normalize-space()='Next']]")
      .first();
    if (await postBankNext.isVisible({ timeout: 5000 }).catch(() => false)) {
      await postBankNext.click();
      await this.waitForLoaderToDisappear();
    }
    await this.page.waitForTimeout(3000);
    const loanMgmt = this.loanManagement();
    await loanMgmt.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.waitFor({ state: "visible" });
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID().fill(this.currentCustomerId());
    console.log(this.currentCustomerId());

    await this.page.waitForTimeout(1000);
    await this.filterbtn().click();
    await this.page.waitForTimeout(5000);
    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    await this.validateUploadDocumnets();
    await this.page.waitForTimeout(5000);
    const saveBtn = this.page.locator(
      "xpath=//button[normalize-space()='Save']",
    );
    await saveBtn.waitFor({ state: "attached", timeout: 30000 });
    await this.page.waitForTimeout(1000);
    await this.jsClick(saveBtn);
    await this.page.waitForTimeout(2000);
    await this.waitForLoaderToDisappear();

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
    await this.page.waitForTimeout(1000);
    //await this.adminLoginPage.logout();
    await this.page.waitForTimeout(5000);
  }

  async renewOnlinePay(): Promise<void> {
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
    await this.customerUniqID().fill(this.currentCustomerId());
    console.log(this.currentCustomerId());
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

    await renewLoan.highlight();

    await renewLoan.click();
    await this.page.waitForTimeout(5000);
    await this.page.getByText("Renewal", { exact: true }).click();
    await this.page.waitForTimeout(2000);

    const checkbox = this.firstSchemeCheckbox();

    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await this.selPurpose().selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
    await this.btnProceed().click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.selPayment().selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking().click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm()).toBeVisible();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
    await this.confirmRenewalConsentIfPresent();
    await this.btnYesAssign().click();
    await this.page.waitForTimeout(5000);
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
    await this.deposit();
  }

  async deposit(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    const fundsAndApprovals = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await fundsAndApprovals.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    // DOM-level click (Tech Support button can cover bottom sidebar items)
    await fundsAndApprovals.evaluate((el: any) => el.click());
    await this.page.waitForTimeout(3000);

    // The menu is a toggle: if it was already open the click above closed it,
    // so click again when the submenu isn't present.
    const jra = this.jwellaryReleaseApproval().first();
    if (!(await jra.isVisible().catch(() => false))) {
      await fundsAndApprovals.evaluate((el: any) => el.click());
      await this.page.waitForTimeout(3000);
    }
    await jra.waitFor({ state: "attached", timeout: 30000 });
    await jra.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(1000);
    await jra.evaluate((el: any) => el.click());
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.Renewal().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@ng-reflect-name='amountStatus']",
    );
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: "Pending" });
    await this.page.waitForTimeout(2000);
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);

    await this.btnUpdate().evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='depositStatus']",
    );
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: "Completed" });
    await this.page.waitForTimeout(1000);
    await this.btnUpdate1().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Real (committing) offline-payment counterpart to validateWithOffline() — same
   * navigation and RTGS selection, but fills bank details and actually submits (Done →
   * the kt-button Proceed) instead of cancelling, then runs deposit() to mark the
   * resulting payment Completed. Same commit sequence renew-zero.page.ts's
   * validaterenewofflineWithIMPS() uses for real.
   */
  async renewOfflinePay(): Promise<void> {
    await this.navigateToRenewSchemeScreen();

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selPayment().selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(2000);

    await this.inputBankName().fill("State Bank of India");
    await this.inputBranchName().fill("Lower Parel Branch");
    await this.page.waitForTimeout(1000);
    await this.inputBankTransactionID().fill(this.randomTransactionId(12));
    await this.page.waitForTimeout(2000);

    await this.btnDonePartner().click();
    await this.waitForLoaderToDisappear();
    await this.btnProced().click();
    await this.waitForLoaderToDisappear();

    await this.deposit();
  }

  // ── Actions (standalone, extracted for renew-loan-validations.spec.ts) ────

  /**
   * Navigates to Loan Details, opens Renew Loan → Renewal, selects a scheme and Loan
   * Purpose (same steps as renewOnlinePay() up to the payment-mode screen). Stops right
   * before Proceed so callers can branch into different payment-mode validations.
   */
  private async navigateToRenewSchemeScreen(): Promise<void> {
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    const loanMgmt = this.loanManagement();
    await loanMgmt.click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails();

    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.customerUniqID().fill(this.currentCustomerId());
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
    await renewLoan.click();
    await this.page.waitForTimeout(5000);
    await this.page.getByText("Renewal", { exact: true }).click();
    await this.page.waitForTimeout(2000);

    const checkbox = this.firstSchemeCheckbox();
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);
    await this.selPurpose().selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Shared navigation for the "Confirm Renewal" consent modal: scheme selection, Proceed,
   * PAYMENT GATEWAY + netBanking, and the "Confirm" click (same sequence renewOnlinePay()
   * already uses up to that point). Extracted so verifyConfirmRenewalConsentModal() (Send OTP
   * path) and verifyCancelRenewalConsentModal() (Cancel path) don't duplicate it.
   */
  private async navigateAndConfirmRenewal(): Promise<void> {
    await this.navigateToRenewSchemeScreen();

    await this.btnProceed().click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.selPayment().selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking().click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm()).toBeVisible();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Test hook for the "Confirm Renewal" consent modal: drives the renew flow through
   * navigateAndConfirmRenewal(), then exercises confirmRenewalConsentIfPresent() and returns
   * what happened so a spec can assert on it.
   */
  async verifyConfirmRenewalConsentModal(): Promise<{
    modalOpened: boolean;
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
    otpSent: boolean;
    otpEntered: boolean;
    otpAccepted: boolean;
  }> {
    await this.navigateAndConfirmRenewal();
    return this.confirmRenewalConsentIfPresent();
  }

  /**
   * "Confirm Renewal" consent modal — Cancel path (screenshot, 2026-10-01): drives the same
   * navigation as verifyConfirmRenewalConsentModal(), checks both mandatory checkboxes, then
   * clicks "Cancel" instead of "Send OTP" and verifies the modal closes without sending an OTP
   * or submitting the renewal. Non-mutating — safe to run before an accept-path test reuses
   * the same loan/customer. Never throws.
   */
  async verifyCancelRenewalConsentModal(): Promise<{
    modalOpened: boolean;
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
    modalClosedAfterCancel: boolean;
  }> {
    await this.navigateAndConfirmRenewal();

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
      '"Confirm Renewal" consent modal appeared — checking both mandatory checkboxes then clicking Cancel.',
    );

    const { requestedCheckboxChecked, revisedTermsCheckboxChecked } =
      await this.checkBothRenewalConsentBoxes();

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

  async validateProceedAndCancelButtons(): Promise<{
    proceedVisible: boolean;
    proceedEnabled: boolean;
    cancelVisible: boolean;
  }> {
    await this.navigateToRenewSchemeScreen();

    const proceed = this.btnProceed();
    const proceedVisible = await proceed.isVisible();
    const proceedEnabled = await proceed.isEnabled();

    await proceed.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const cancelVisible = await this.btnCancelText()
      .isVisible()
      .catch(() => false);

    await this.btnCancelText()
      .click()
      .catch(() => {});
    await this.waitForLoaderToDisappear();

    return { proceedVisible, proceedEnabled, cancelVisible };
  }

  async validateWithCashZero(): Promise<{
    cashWithZeroOptionFound: boolean;
    doneVisible: boolean;
  }> {
    await this.navigateToRenewSchemeScreen();

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selPayment().selectOption({ label: "CASH" });
    await this.page.waitForTimeout(2000);

    const cashWithZeroOption = this.page.locator(
      "xpath=//select[@formcontrolname='paymentType']//option[normalize-space()='CASH WITH 0']",
    );
    const cashWithZeroOptionFound =
      (await cashWithZeroOption.count().catch(() => 0)) > 0;
    if (cashWithZeroOptionFound) {
      await this.page
        .locator("xpath=//select[@formcontrolname='paymentType']")
        .selectOption({ label: "CASH WITH 0" })
        .catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    const doneVisible = await this.btnDonePartner()
      .isVisible()
      .catch(() => false);

    await this.btnCancelText()
      .click()
      .catch(() => {});
    await this.waitForLoaderToDisappear();

    return { cashWithZeroOptionFound, doneVisible };
  }

  async validateWithOffline(): Promise<{
    bankNameValue: string;
    branchNameValue: string;
    transactionIdValue: string;
    doneVisible: boolean;
  }> {
    await this.navigateToRenewSchemeScreen();

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selPayment().selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(2000);

    await this.inputBankName().fill("State Bank of India");
    await this.inputBranchName().fill("Lower Parel Branch");
    await this.page.waitForTimeout(1000);
    await this.inputBankTransactionID().fill(this.randomTransactionId(12));
    await this.page.waitForTimeout(2000);

    const bankNameValue = await this.inputBankName()
      .inputValue()
      .catch(() => "");
    const branchNameValue = await this.inputBranchName()
      .inputValue()
      .catch(() => "");
    const transactionIdValue = await this.inputBankTransactionID()
      .inputValue()
      .catch(() => "");
    const doneVisible = await this.btnDonePartner()
      .isVisible()
      .catch(() => false);

    await this.btnCancelText()
      .click()
      .catch(() => {});
    await this.waitForLoaderToDisappear();

    return { bankNameValue, branchNameValue, transactionIdValue, doneVisible };
  }

  async validateUploadDocumnets(docPath?: string): Promise<void> {
    // Auto-resolve document path from environment if not provided, then resolve to absolute
    const envPath = docPath || documentPath("DOCUMENT");
    let resolvedDocPath: string | undefined;

    if (envPath) {
      const cwd = process.cwd();
      console.log(`Current working directory: ${cwd}`);
      console.log(`Environment path: ${envPath}`);

      resolvedDocPath =
        envPath.startsWith("/") || envPath.match(/^[A-Z]:/)
          ? envPath
          : resolve(cwd, envPath);

      console.log(`Resolved document path: ${resolvedDocPath}`);
      console.log(`File exists: ${existsSync(resolvedDocPath)}`);

      // Fallback: try resolving from __dirname
      if (!existsSync(resolvedDocPath)) {
        const fallbackPath = resolve(__dirname, "../../..", envPath);
        console.log(`Trying fallback path: ${fallbackPath}`);
        console.log(`Fallback file exists: ${existsSync(fallbackPath)}`);
        if (existsSync(fallbackPath)) {
          resolvedDocPath = fallbackPath;
          console.log(`Using fallback path: ${resolvedDocPath}`);
        }
      }
    }
    if (resolvedDocPath) {
      try {
        const fileInputs = this.page.locator("xpath=//input[@type='file']");
        const inputCount = await fileInputs.count();
        console.log(`Found ${inputCount} file input(s) on the page`);

        // Upload to visible/accessible file inputs (up to 4 documents)
        let uploadedCount = 0;
        for (let i = 0; i < inputCount && uploadedCount < 4; i++) {
          try {
            const fileInput = fileInputs.nth(i);

            // Check if input is visible or can be accessed
            try {
              await fileInput.waitFor({ state: "attached", timeout: 2000 });
              console.log(
                `↗ Uploading Document ${uploadedCount + 1} to input ${i}: ${resolvedDocPath}`,
              );
              await fileInput.setInputFiles(resolvedDocPath);
              console.log(
                `✓ Document ${uploadedCount + 1} uploaded successfully to input ${i}`,
              );
              uploadedCount++;
              await this.page.waitForTimeout(1000);
            } catch (err: any) {
              console.log(
                `⊘ Input ${i} not accessible (hidden/detached): ${err.message}`,
              );
            }
          } catch (err: any) {
            console.warn(`⚠ Error with input ${i}: ${err.message}`);
          }
        }

        console.log(
          `Completed uploading ${uploadedCount} document(s) out of 4 requested`,
        );
      } catch (err: any) {
        console.warn(`⚠ Document upload error: ${err.message}`);
      }
    } else {
      console.log(
        "⊘ Document upload skipped (no file path provided in env or parameter)",
      );
    }
    // Upload to "Consumption Supporting Loan Documents" — 9th file input (index 8).
    if (resolvedDocPath && existsSync(resolvedDocPath)) {
      const fileInputsAll = this.page.locator("xpath=//input[@type='file']");
      const totalInputs = await fileInputsAll.count();
      if (totalInputs > 8) {
        const consumptionInput = fileInputsAll.nth(8);
        await consumptionInput.evaluate((el) => {
          (el as HTMLInputElement).style.display = "block";
        });
        await consumptionInput.setInputFiles(resolvedDocPath);
        console.log(
          `✓ Consumption Supporting Document uploaded to nth(8): ${resolvedDocPath}`,
        );
        await this.page.waitForTimeout(2000);
      } else {
        console.warn(
          `⚠ Consumption Supporting skipped — only ${totalInputs} inputs found (need >8)`,
        );
      }
    } else {
      console.log(
        resolvedDocPath
          ? `⊘ Consumption Supporting upload skipped (file not found: ${resolvedDocPath})`
          : "⊘ Consumption Supporting upload skipped (no file path provided)",
      );
    }
  }

  async partnerRenewApproval(): Promise<void> {
    const data = getLoginData();

    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    const loanMgmt = this.loanManagement();
    await loanMgmt.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan2 = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan2.waitFor({ state: "visible", timeout: 30000 });
    await appliedLoan2.click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID().fill(this.currentCustomerId());
    console.log(this.currentCustomerId());
    await this.page.waitForTimeout(1000);
    await this.filterbtn().click();
    await this.page.waitForTimeout(2000);

    await this.waitForLoaderToDisappear();
    await this.partnerApproval().waitFor({ state: "visible", timeout: 30000 });
    await this.partnerApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.clickNextSafely(7);
    await this.page.waitForTimeout(2000);

    await this.checkClick().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.checkClick1().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const statusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForPartner']",
    );
    await statusDropdown.selectOption({ label: "Approved" });
    await this.page.waitForTimeout(1000);

    await this.btnSubmitOps().click();
    await this.waitForLoaderToDisappear();
  }
  async renewCronPay(): Promise<void> {
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
    await this.customerUniqID().fill(this.currentCustomerId());
    console.log(this.currentCustomerId());
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

    await renewLoan.highlight();
    await renewLoan.click();
    await this.page.waitForTimeout(5000);
    await this.page.getByText("Renewal", { exact: true }).click();
    await this.page.waitForTimeout(2000);
    const checkbox = this.firstSchemeCheckbox();

    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await this.selPurpose().selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
    await this.btnProceed().click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.selPayment().selectOption({ label: "CRON" });
    await this.netBanking().click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm()).toBeVisible();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
    await this.btnYesAssign().click();
    await this.page.waitForTimeout(5000);
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
  }
}
