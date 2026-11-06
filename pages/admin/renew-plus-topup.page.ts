import { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { AdminLoginPage } from "./login.page";
import { AssignPacketPage } from "./assign-packet.page";
import { RenewLoanPage } from "./renew-loan.page";
import { OpsApprovalPage } from "./ops-approval.page";
import { NewGoldLoanPage } from "./new-gold-loan.page";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";
import { documentPath as documentPathEnv } from "../../config/urls";

export class RenewPlusTopupPage extends AdminBasePage {
  private assignPacketPage: AssignPacketPage;
  private newGoldLoanPage: NewGoldLoanPage;
  private adminLoginPage: AdminLoginPage;
  private renewLoanPage = new RenewLoanPage(this.page);
  public opsApprovalPage: OpsApprovalPage;

  // ── Locators ──────────────────────────────────────────────────────────────
  private readonly loanID: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly btnOk: Locator;
  private readonly branchDropdown: Locator;
  private readonly btnYes: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly btnUploadDocuments: Locator;
  private readonly appraisalRequest: Locator;
  private readonly selectAppraiser: Locator;
  private readonly textField: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly btnProceed: Locator;
  private readonly btnRenewLoan: Locator;
  private readonly fieldCkyc: Locator;
  private readonly btnYesAssign: Locator;
  private readonly btnDoneAssign: Locator;
  private readonly partnerApproval: Locator;
  private readonly checkClick: Locator;
  private readonly checkClick1: Locator;
  private readonly btnSubmitOps: Locator;
  private readonly loanDetails: Locator;
  private readonly renewButton: Locator;
  private readonly btnNext: Locator;
  private readonly kebabMenu: Locator;
  private readonly customerUniqID: Locator;
  private readonly btnDownloadCashDeclaration: Locator;
  private readonly btnNextLoop: Locator;
  private readonly transactionID: Locator;
  private readonly selPaymentType: Locator;
  private readonly btnDonePartner: Locator;
  private readonly btnYesPartner: Locator;
  private readonly selPurpose: Locator;
  private readonly netBanking: Locator;
  private readonly btnConfirm: Locator;
  private readonly firstSchemeCheckbox: Locator;
  private readonly confirmRenewalTopUpRequestedCheckbox: Locator;
  private readonly confirmRenewalTopUpRevisedTermsCheckbox: Locator;
  private readonly btnSendOtpRenewalTopUp: Locator;
  private readonly btnVerifyRenewalTopUpOtp: Locator;
  private readonly consentDialog: Locator;
  private readonly btnCancelConsent: Locator;
  private readonly selPayment: Locator;
  private readonly jwellaryReleaseApproval: Locator;
  private readonly Renewal: Locator;
  private readonly btnUpdate: Locator;
  private readonly btnUpdate1: Locator;

  constructor(page: Page) {
    super(page);
    this.assignPacketPage = new AssignPacketPage(page);
    this.newGoldLoanPage = new NewGoldLoanPage(page);
    this.adminLoginPage = new AdminLoginPage(page);
    this.opsApprovalPage = new OpsApprovalPage(page);
    this.loanID = this.page.locator("xpath=//span[contains(.,'Done')]");
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.btnOk = this.page.locator("xpath=//button[@type='submit']");
    this.branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    this.btnYes = this.page.locator(
      "xpath=//button[@type='submit' and contains(@class, 'mat-raised-button')][.//span[normalize-space()='Ok']]",
    );
    this.loanManagement = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.btnUploadDocuments = this.page.locator(
      "xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
    this.appraisalRequest = this.page.locator(
      "xpath=//span[normalize-space()='Appraiser Requests']",
    );
    this.selectAppraiser = this.page.locator(
      "xpath=//select[@formcontrolname='appraiserId']",
    );
    this.textField = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique ID']",
    );
    this.customerManagementBtn = this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
    this.btnProceed = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Proceed']]",
    );
    this.btnRenewLoan = this.page.locator(
      "xpath=//button[contains(.,'Renew Loan')]",
    );
    this.fieldCkyc = this.page.locator(
      "xpath=//input[@formcontrolname='ckycNumber']",
    );
    this.btnYesAssign = this.page.locator(
      "xpath=//span[normalize-space()='Yes']",
    );
    this.btnDoneAssign = this.page.locator(
      "xpath=//span[normalize-space()='Done']",
    );
    this.partnerApproval = this.page.locator(
      "xpath=//button[contains(.,'PARTNER APPROVAL')]",
    );
    this.checkClick = this.page.locator(
      "xpath=//img[contains(@name,'incorrectApplicationFormForOperatinalTeam')]",
    );
    this.checkClick1 = this.page.locator(
      "xpath=//img[contains(@name,'incorrectGoldValuationForOperatinalTeam')]",
    );
    this.btnSubmitOps = this.page.locator(
      "xpath=//button[span[normalize-space()='Submit']]",
    );
    this.loanDetails = this.page.locator(
      "xpath=//span[normalize-space()='Loan Details']",
    );
    this.renewButton = this.page.locator(
      "xpath=//button[@role='menuitem' and normalize-space()='Renew Loan']",
    );
    this.btnNext = this.page.locator(
      "xpath=//button[span[normalize-space() = 'Next']]",
    );
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.customerUniqID = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.btnDownloadCashDeclaration = this.page.locator(
      "xpath=//span[normalize-space(text())='Download Cash Declaration']",
    );
    this.btnNextLoop = this.page.locator(
      "xpath=//button[span[normalize-space()='Next']]",
    );
    this.transactionID = this.page.locator(
      "xpath=//input[@formcontrolname='securedBankTransactionId']",
    );
    this.selPaymentType = this.page.locator(
      "xpath=//select[@formcontrolname='bankTransferType']",
    );
    this.btnDonePartner = this.page.locator(
      "xpath=//span[normalize-space()='Done']",
    );
    this.btnYesPartner = this.page.locator(
      "xpath=//span[normalize-space()='Yes']",
    );
    this.selPurpose = this.page.locator(
      "xpath=//select[@formcontrolname='loanPurpose']",
    );
    this.netBanking = this.page.locator("xpath=//img[@alt='netbanking']");
    this.btnConfirm = this.page.locator(
      "xpath=//button[contains(@class,'mat')][.//span[normalize-space()='Confirm']]",
    );
    this.firstSchemeCheckbox = this.page
      .locator(
        "xpath=//td[starts-with(normalize-space(text()),'[ALL]')]/preceding-sibling::td//input[@type='checkbox']",
      )
      .first();
    this.confirmRenewalTopUpRequestedCheckbox = this.page.locator(
      "xpath=//input[@formcontrolname='customerRequestConfirmed']",
    );
    this.confirmRenewalTopUpRevisedTermsCheckbox = this.page.locator(
      "xpath=//input[@formcontrolname='termsAccepted']",
    );
    this.btnSendOtpRenewalTopUp = this.page.locator(
      "xpath=//button[normalize-space()='Send OTP']",
    );
    this.btnVerifyRenewalTopUpOtp = this.page
      .locator(
        "xpath=//button[normalize-space()='Confirm' or normalize-space()='Verify' or " +
          "normalize-space()='Verify OTP' or normalize-space()='Consent Received' or " +
          "normalize-space()='Submit']",
      )
      .first();
    this.consentDialog = this.page.locator(
      "xpath=//div[contains(@class,'consent-dialog')]",
    );
    this.btnCancelConsent = this.consentDialog.locator(
      "xpath=.//button[normalize-space()='Cancel']",
    );
    this.selPayment = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
    );
    this.jwellaryReleaseApproval = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
    this.Renewal = this.page.locator(
      "xpath=//span[contains(.,'Renewal Loans')]",
    );
    this.btnUpdate = this.page.locator(
      "xpath=(//button[contains(.,'Update')])[1]",
    );
    this.btnUpdate1 = this.page.locator(
      "xpath=(//span[contains(.,'Update')])[1]",
    );
  }

  protected otpInputLocator(): Locator {
    return this.page.locator(
      "xpath=//div[contains(@class,'consent-dialog')]//input[contains(@class,'otp-cell')]",
    );
  }

  // Shared by confirmRenewalPlusTopUpConsentIfPresent() (Send OTP path) and
  // verifyCancelRenewalPlusTopUpConsentModal() (Cancel path) — both check the same two boxes
  // before diverging.
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

  private async checkBothRenewalPlusTopUpConsentBoxes(): Promise<{
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
  }> {
    const requestedCheckboxChecked = await this.checkConsentBox(
      this.confirmRenewalTopUpRequestedCheckbox,
      "customer personally requested this Renewal + Top Up",
    );
    const revisedTermsCheckboxChecked = await this.checkConsentBox(
      this.confirmRenewalTopUpRevisedTermsCheckbox,
      "customer agrees to the revised rate/charges/tenure",
    );
    return { requestedCheckboxChecked, revisedTermsCheckboxChecked };
  }

  /**
   * "Confirm Renewal + Top Up" consent modal: checks the two mandatory checkboxes, clicks
   * "Send OTP", then enters the fixed backdoor OTP ("123456", same as the other two consent
   * modals) and submits it. No-ops (returns `modalOpened: false`) if the modal never appears.
   * Never throws — every outcome is reported on the result object. Structurally identical to
   * top-up.page.ts's confirmTopUpConsentIfPresent() / renew-loan.page.ts's
   * confirmRenewalConsentIfPresent() — see those methods' comments for the reasoning behind
   * each step.
   */
  private async confirmRenewalPlusTopUpConsentIfPresent(
    otp: string = "123456",
  ): Promise<{
    modalOpened: boolean;
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
    otpSent: boolean;
    otpEntered: boolean;
    otpAccepted: boolean;
  }> {
    const modalOpen = await this.consentDialog
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
      '"Confirm Renewal + Top Up" consent modal appeared — checking both mandatory checkboxes and sending OTP.',
    );

    const { requestedCheckboxChecked, revisedTermsCheckboxChecked } =
      await this.checkBothRenewalPlusTopUpConsentBoxes();

    const sendOtp = this.btnSendOtpRenewalTopUp;
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

      const verifyBtn = this.btnVerifyRenewalTopUpOtp;
      const verifyVisible = await verifyBtn
        .waitFor({ state: "visible", timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      if (verifyVisible) {
        try {
          await verifyBtn.click({ timeout: 5000 });
        } catch (err: any) {
          console.log(
            `Standard click on the renewal+top-up OTP "Confirm" button failed (${err.message}) — ` +
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
          "No OTP submit button found after entering the renewal+top-up consent OTP — some " +
            "UIs auto-submit on the last digit; continuing to check the outcome regardless.",
        );
      }

      const errorBanner = this.page.locator(
        "xpath=//*[contains(@class,'toast-error') or contains(@class,'alert-danger')]",
      );
      const errorVisible = await errorBanner.isVisible().catch(() => false);
      const modalStillOpen = await this.consentDialog
        .isVisible()
        .catch(() => false);
      otpAccepted = !errorVisible && !modalStillOpen;
    } catch (err: any) {
      console.log(
        `Entering/submitting the renewal+top-up consent OTP failed: ${err.message}`,
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

  async renewPlusTopUp(documentPath?: string): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.renewPlusTopUpOnlinePay();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.customerManagementBtn.click();
    await this.waitForLoaderToDisappear();
    await this.appraisalRequest.waitFor({ state: "visible" });
    await this.appraisalRequest.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);

    await this.textField.fill(this.currentCustomerId());
    console.log(this.currentCustomerId());
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
    await this.btnYes.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);
    const calculateBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Calculate']]",
    );

    const nextBtn = this.page
      .locator("xpath=//button[span[normalize-space()='Next']]")
      .first();
    for (let step = 1; step <= 3; step++) {
      if (await calculateBtn.isVisible().catch(() => false)) break;
      await nextBtn.waitFor({ state: "visible", timeout: 30000 });
      await nextBtn.scrollIntoViewIfNeeded();
      console.log(`Clicking Next button: ${step}`);
      await nextBtn.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(1000);
    }
    await calculateBtn.waitFor({ state: "visible", timeout: 30000 });

    console.log("Visible:", await calculateBtn.isVisible());
    console.log("Enabled:", await calculateBtn.isEnabled());

    let clicked = false;
    for (let attempt = 1; attempt <= 5 && !clicked; attempt++) {
      try {
        await this.waitForLoaderToDisappear();
        await calculateBtn.waitFor({ state: "attached", timeout: 10000 });
        await calculateBtn.evaluate((el: any) => {
          el.scrollIntoView({ block: "center" });
          el.click();
        });
        clicked = true;
      } catch (e) {
        console.log(`Calculate click attempt ${attempt} failed, retrying...`);
        await this.page.waitForTimeout(2000);
      }
    }
    if (!clicked) {
      throw new Error("Could not click the Calculate button after 5 attempts");
    }
    await this.page.waitForTimeout(3000);
    await this.btnNext.click();
    await this.page.waitForTimeout(2000);
    await this.newGoldLoanPage.validateBankDetails();
    await this.btnNext.click();
    await this.page.waitForTimeout(3000);

    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const loanMgmt = this.loanManagement;
    await loanMgmt.click();

    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.waitFor({ state: "visible", timeout: 20000 });
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID.fill(this.currentCustomerId());
    console.log(this.currentCustomerId());
    //await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(1000);

    await this.filterbtn.click({ noWaitAfter: true });
    await this.page.waitForTimeout(3000);
    await this.btnUploadDocuments.click();
    await this.waitForLoaderToDisappear();

    const envPath = documentPath || documentPathEnv("DOCUMENT");
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
      // Shared with assign-packet: includes KFS, Gold Loan Application / Deposit Receipt and
      // treats the removed Scheme Confirmation field as optional.
      await this.assignPacketPage.uploadMandatoryDocuments(resolvedDocPath);
    }

    if (resolvedDocPath && existsSync(resolvedDocPath)) {
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
          ? `⊘ Consumption Supporting upload skipped (file not found: ${resolvedDocPath})`
          : "⊘ Consumption Supporting upload skipped (no file path provided)",
      );
    }
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
    await this.assignPacketPage.ensureCashReceiptAttached();
    // Same Upload Documents checks as the assign-packet flow: every required slot attached, LIP
    // Assessment form filled, then a C-KYC number, all before Save.
    if (resolvedDocPath && existsSync(resolvedDocPath)) {
      await this.assignPacketPage.verifyDocumentsAttached();
    }
    await this.assignPacketPage.fillLipAssessment();

    const ckycField = this.page
      .locator("xpath=//input[@placeholder='C-KYC00']")
      .or(this.fieldCkyc)
      .first();
    if (await ckycField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ckycField.fill(this.assignPacketPage.generateRandomCKYC());
      await this.page.waitForTimeout(2000);
    } else {
      console.log("⊘ C-KYC Number field not shown — skipped");
    }
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
    await this.btnYesAssign.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
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
    await this.btnDoneAssign.click();
    await this.waitForLoaderToDisappear();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(5000);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(5000);
  }
  /** Reads the customer ID fresh — a static JSON import goes stale once onboarding rewrites it. */
  private currentCustomerId(): string {
    return String(
      JSON.parse(
        readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
      ).customerId,
    ).trim();
  }

  async partnerRenewPlusTopupApproval(): Promise<void> {
    const data = getLoginData();

    await this.expandSidebar();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );

    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    const customerId = this.currentCustomerId();
    await this.customerUniqID.fill(customerId);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2500);
    await this.filterbtn.first().click({ noWaitAfter: true });
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    const partnerBtn = this.page
      .locator("xpath=//button[contains(.,'PARTNER APPROVAL')]")
      .first();
    await partnerBtn.waitFor({ state: "visible", timeout: 30000 });
    await partnerBtn.scrollIntoViewIfNeeded();
    await partnerBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.clickNextSafely(7);
    await this.page.waitForTimeout(5000);

    await this.checkClick.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.checkClick1.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const statusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForPartner']",
    );
    await statusDropdown.selectOption({ label: "Approved" });
    await this.page.waitForTimeout(2000);

    await this.btnSubmitOps.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.loanDisbursement();
  }
  async loanDisbursement(): Promise<void> {
    //await this.btnDisbursement().click();
    await this.page
      .locator("//button[normalize-space()='Disburse Amount']")
      .first()
      .click();
    await this.waitForLoaderToDisappear();

    await this.transactionID.fill(this.randomTransactionId(12));
    await this.waitForLoaderToDisappear();
    await this.selPaymentType.selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await this.btnDonePartner.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnYesPartner.click();
    await this.waitForLoaderToDisappear();
    //await this.deposit();
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
    await fundsAndApprovals.click();
    await this.page.waitForTimeout(5000);

    await this.jwellaryReleaseApproval.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.Renewal.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@ng-reflect-name='amountStatus']",
    );
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: "Pending" });
    await this.page.waitForTimeout(2000);
    await this.filterbtn.click({ noWaitAfter: true });
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

    await this.btnUpdate.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.btnUpdate.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='depositStatus']",
    );
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: "Completed" });
    await this.page.waitForTimeout(1000);
    await this.btnUpdate1.click();
    await this.waitForLoaderToDisappear();
  }

  private async navigateAndConfirmRenewPlusTopUp(
    paymentModeLabel: "PAYMENT GATEWAY" | "CRON",
  ): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    const loanMgmt = this.loanManagement;
    await loanMgmt.click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails;

    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.customerUniqID.fill(this.currentCustomerId());
    console.log(this.currentCustomerId());
    //await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const kebab = this.kebabMenu;
    await kebab.scrollIntoViewIfNeeded();
    try {
      await this.page.waitForTimeout(5000);
      await kebab.click();
    } catch {
      await this.jsClick(kebab);
    }
    await this.page.waitForTimeout(5000);
    await this.btnRenewLoan.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const renewLoan = this.page.getByText("Renew Loan", { exact: true });

    console.log("Visible:", await renewLoan.isVisible());

    await renewLoan.highlight();

    await renewLoan.click();
    await this.page.waitForTimeout(5000);
    await this.page.getByText("Renewal + Top Up", { exact: true }).click();
    await this.page.waitForTimeout(2000);

    const checkbox = this.firstSchemeCheckbox;

    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await this.selPurpose.selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.selPayment.selectOption({ label: paymentModeLabel });
    await this.netBanking.click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm).toBeVisible();
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();
  }

  async verifyConfirmRenewalPlusTopUpConsentModal(): Promise<{
    modalOpened: boolean;
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
    otpSent: boolean;
    otpEntered: boolean;
    otpAccepted: boolean;
  }> {
    await this.navigateAndConfirmRenewPlusTopUp("PAYMENT GATEWAY");
    return this.confirmRenewalPlusTopUpConsentIfPresent();
  }

  async verifyCancelRenewalPlusTopUpConsentModal(): Promise<{
    modalOpened: boolean;
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
    modalClosedAfterCancel: boolean;
  }> {
    await this.navigateAndConfirmRenewPlusTopUp("PAYMENT GATEWAY");

    const modalOpen = await this.consentDialog
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
      '"Confirm Renewal + Top Up" consent modal appeared — checking both mandatory checkboxes then clicking Cancel.',
    );

    const { requestedCheckboxChecked, revisedTermsCheckboxChecked } =
      await this.checkBothRenewalPlusTopUpConsentBoxes();

    const cancelBtn = this.btnCancelConsent;
    await cancelBtn.waitFor({ state: "visible", timeout: 8000 });
    await cancelBtn.click();
    await this.waitForLoaderToDisappear().catch(() => {});
    await this.page.waitForTimeout(1500);

    const modalClosedAfterCancel = await this.consentDialog
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

  async renewPlusTopUpOnlinePay(): Promise<void> {
    //await this.navigateAndConfirmRenewPlusTopUp("PAYMENT GATEWAY");
    await this.verifyConfirmRenewalPlusTopUpConsentModal();
    await this.btnYesAssign.click();
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
    //await this.deposit();
  }
  async renewPlusTopUpCronPay(): Promise<void> {
    await this.navigateAndConfirmRenewPlusTopUp("CRON");
    await this.btnYesAssign.click();
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
  }
}
