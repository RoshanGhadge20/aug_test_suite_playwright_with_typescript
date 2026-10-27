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

export class TopUpPage extends AdminBasePage {
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
    this.btnUploadDocuments = this.page.locator(
      "xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
    this.topUpBtn = this.page.locator(
      "xpath=//button[normalize-space()='Top-Up']",
    );
    this.inputField = this.page.locator(
      "xpath=//input[@formcontrolname='topUpAmount']",
    );
    this.btnconfirm = this.page.locator(
      "xpath=//span[normalize-space()='Confirm']/ancestor::button",
    );
    this.btnYes = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Yes']]",
    );
    this.btnCheckbox = this.page.locator(
      "xpath=//span[@class='checkmark top-0']",
    );
    this.selPurpose = this.page.locator(
      "xpath=//select[@formcontrolname='loanPurpose']",
    );
    this.btnSubmit = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Submit']]",
    );
    this.btnDownloadCash = this.page.locator(
      "xpath=//span[contains(.,'Download Cash Declaration')]",
    );
    this.btnDone = this.page.locator("xpath=//span[contains(.,'Done')]");
    this.btnSave = this.page.locator("xpath=//span[normalize-space()='Save']");
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    this.loanManagement = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.loanDetails = this.page.locator(
      "xpath=//span[normalize-space()='Loan Details']",
    );
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.netBanking = this.page.locator("xpath=//img[@alt='netbanking']");
    this.selPayment = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
    );
    this.btnConfirm = this.page.locator(
      "xpath=(//span[normalize-space()='Confirm'])[2]",
    );
    this.btnYesRenew = this.page.locator("xpath=//span[contains(.,'Yes')]");
    this.fieldCkyc = this.page.locator(
      "xpath=//input[@formcontrolname='ckycNumber']",
    );
    this.btnYesAssign = this.page
      .locator(
        "xpath=//button[normalize-space()='Yes' or .//span[normalize-space()='Yes']]",
      )
      .first();
    this.btnDoneAssign = this.page.locator(
      "xpath=//span[normalize-space()='Done']",
    );
    this.btnDisbursement = this.page.locator(
      "xpath=(//button[@class='green-button'])[1]",
    );
    this.transactionID = this.page.locator(
      "xpath=//input[@formcontrolname='transactionId']",
    );
    this.selPaymentType = this.page.locator(
      "xpath=//select[@formcontrolname='paymentType']",
    );
    this.btnDonePartner = this.page.locator(
      "xpath=//span[normalize-space()='Done']",
    );
    this.btnYesPartner = this.page.locator(
      "xpath=//span[normalize-space()='Yes']",
    );
    this.customerUniqID = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.btnNext = this.page.locator(
      "xpath=//button[span[normalize-space() = 'Next']]",
    );
    this.toBePaid = this.page.locator(
      "xpath=//td[normalize-space(text())='To be paid']/following-sibling::td[@class='currency']",
    );
    this.advanceCashField = this.page.locator(
      "xpath=//td//input[@formcontrolname='advanceCash']",
    );
    this.loanAmountField = this.page.locator(
      "//td[normalize-space(text())='Top up Amount']/following-sibling::td[1]",
    );
    this.consentDialog = this.page.locator(
      "xpath=//div[contains(@class,'consent-dialog')]",
    );
    this.confirmTopUpRequestedCheckbox = this.page.locator(
      "xpath=//input[@formcontrolname='customerRequestConfirmed']",
    );
    this.confirmTopUpRevisedTermsCheckbox = this.page.locator(
      "xpath=//input[@formcontrolname='termsAccepted']",
    );
    this.btnSendOtp = this.page.locator(
      "xpath=//button[normalize-space()='Send OTP']",
    );
    this.btnCancelConsent = this.consentDialog.locator(
      "xpath=.//button[normalize-space()='Cancel']",
    );
    this.btnVerifyTopUpOtp = this.page
      .locator(
        "xpath=//button[normalize-space()='Confirm' or normalize-space()='Verify' or " +
          "normalize-space()='Verify OTP' or normalize-space()='Consent Received' or " +
          "normalize-space()='Submit']",
      )
      .first();
  }

  // ── Locators (from PO12_TopUp) ─────────────────────────────────────────────
  private readonly btnUploadDocuments: Locator;
  private readonly topUpBtn: Locator;
  private readonly inputField: Locator;
  private readonly btnconfirm: Locator;
  private readonly btnYes: Locator;
  private readonly btnCheckbox: Locator;
  private readonly selPurpose: Locator;
  private readonly btnSubmit: Locator;
  private readonly btnDownloadCash: Locator;
  private readonly btnDone: Locator;
  private readonly btnSave: Locator;

  private readonly profile: Locator;

  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly loanDetails: Locator;
  private readonly kebabMenu: Locator;
  private readonly netBanking: Locator;
  private readonly selPayment: Locator;
  private readonly btnConfirm: Locator;
  private readonly btnYesRenew: Locator;
  private readonly fieldCkyc: Locator;
  private readonly btnYesAssign: Locator;
  private readonly btnDoneAssign: Locator;
  private readonly btnDisbursement: Locator;
  private readonly transactionID: Locator;
  private readonly selPaymentType: Locator;
  private readonly btnDonePartner: Locator;
  private readonly btnYesPartner: Locator;
  private readonly customerUniqID: Locator;
  private readonly btnNext: Locator;
  private readonly toBePaid: Locator;
  private readonly advanceCashField: Locator;
  private readonly loanAmountField: Locator;
  private readonly consentDialog: Locator;
  private readonly confirmTopUpRequestedCheckbox: Locator;
  private readonly confirmTopUpRevisedTermsCheckbox: Locator;
  private readonly btnSendOtp: Locator;
  private readonly btnCancelConsent: Locator;
  private readonly btnVerifyTopUpOtp: Locator;

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
      this.confirmTopUpRequestedCheckbox,
      "customer personally requested this Top Up",
    );
    const revisedTermsCheckboxChecked = await this.checkConsentBox(
      this.confirmTopUpRevisedTermsCheckbox,
      "customer agrees to the revised rate/charges/tenure",
    );
    return { requestedCheckboxChecked, revisedTermsCheckboxChecked };
  }

  private async confirmTopUpConsentIfPresent(otp: string = "123456"): Promise<{
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
      '"Confirm Top Up" consent modal appeared — checking both mandatory checkboxes and sending OTP.',
    );

    const { requestedCheckboxChecked, revisedTermsCheckboxChecked } =
      await this.checkBothTopUpConsentBoxes();

    const sendOtp = this.btnSendOtp;
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

      const verifyBtn = this.btnVerifyTopUpOtp;
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
      const modalStillOpen = await this.consentDialog
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

  async topUp(): Promise<void> {
    const data = getLoginData();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.topUpOnlinePay();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.validateBankDetailsWithAdvanceCash();
    await this.page.waitForTimeout(5000);
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
      const loanMgmt = this.loanManagement;
      await loanMgmt.click();
      await this.waitForLoaderToDisappear();

      const appliedLoan = this.page.locator(
        "xpath=//span[normalize-space()='Applied Loan']",
      );
      await appliedLoan.waitFor({ state: "visible" });
      await appliedLoan.click();
      await this.waitForLoaderToDisappear();
      await this.filterAppliedLoanByCustomer(this.currentCustomerId());
      await this.btnUploadDocuments.waitFor({
        state: "visible",
        timeout: 30000,
      });
      await this.btnUploadDocuments.click();
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

    await this.btnYesAssign.waitFor({ state: "visible", timeout: 20000 });
    await this.btnYesAssign.click();
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
    await this.btnDoneAssign.click();
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
      const field = this.customerUniqID;
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
      const filterBtn = this.filterbtn.first();
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

  private currentCustomerId(): string {
    return String(
      JSON.parse(
        fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
      ).customerId,
    ).trim();
  }

  async loanDisbursement(): Promise<void> {
    await this.page.waitForTimeout(500);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.customerUniqID.fill(this.currentCustomerId());
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2500);
    const filterBtn = this.filterbtn.first();
    await filterBtn.waitFor({ state: "attached", timeout: 15000 });
    await filterBtn.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await filterBtn.click({ force: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.btnDisbursement.waitFor({ state: "attached", timeout: 30000 });
    await this.btnDisbursement.click({ force: true });
    await this.waitForLoaderToDisappear();
    const txnInput = this.page
      .locator(
        "xpath=(//*[self::label or self::span or self::div][starts-with(normalize-space(text()),'Transaction ID')]/following::input[not(@disabled)][1])[1]",
      )
      .or(this.transactionID)
      .first();
    await txnInput.waitFor({ state: "visible", timeout: 30000 });
    await txnInput.scrollIntoViewIfNeeded();
    const txnId = this.randomTransactionId(12);
    await txnInput.fill(txnId);
    await expect(txnInput).toHaveValue(txnId);
    await this.waitForLoaderToDisappear();
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
    await this.waitForLoaderToDisappear();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(3000);
    const loanAmtEl = this.loanAmountField;
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

    const toBePaidEl = this.toBePaid;
    //await toBePaidEl.scrollIntoViewIfNeeded();
    const str = (await toBePaidEl.innerText()).trim();

    const numericValue = str.replace(/₹/g, "").replace(/,/g, "");

    console.log(numericValue);

    const advanceCashEl = this.advanceCashField;
    await advanceCashEl.evaluate((el) =>
      (el as any).scrollIntoView({ block: "center" }),
    );
    await advanceCashEl.clear();
    await advanceCashEl.fill(numericValue);
    await this.page.waitForTimeout(4000);
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
    await this.jsClick(this.btnNext);
    await this.waitForLoaderToDisappear();
  }

  private async navigateAndConfirmTopUp(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.customerUniqID.fill(this.currentCustomerId());
    console.log(this.currentCustomerId());
    //await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    // noWaitAfter: see the fix earlier in topUp() above.
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

    await this.topUpBtn.click();
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
    await this.inputField.fill("5000");
    await this.page.waitForTimeout(2000);
    await this.selPurpose.selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
    await expect(this.btnConfirm).toBeVisible();
    await this.btnConfirm.click();
    await this.page.waitForTimeout(1000);
    await this.btnConfirm.click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
  }

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

    await this.btnCheckbox.click();

    await this.page.waitForTimeout(2000);
    await this.btnSubmit.click();
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

  async verifyCancelTopUpConsentModal(): Promise<{
    modalOpened: boolean;
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
    modalClosedAfterCancel: boolean;
  }> {
    await this.navigateAndConfirmTopUp();

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
      '"Confirm Top Up" consent modal appeared — checking both mandatory checkboxes then clicking Cancel.',
    );

    const { requestedCheckboxChecked, revisedTermsCheckboxChecked } =
      await this.checkBothTopUpConsentBoxes();

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
}
