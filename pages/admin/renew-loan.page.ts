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

export class RenewLoanPage extends AdminBasePage {
  private assignPacketPage: AssignPacketPage;
  private adminLoginPage: AdminLoginPage;
  private readonly btnUploadDocuments: Locator;
  private readonly btnProceed: Locator;
  private readonly btnCancelText: Locator;
  private readonly btnRenewLoan: Locator;
  private readonly inputBankName: Locator;
  private readonly inputBranchName: Locator;
  private readonly inputBankTransactionID: Locator;
  private readonly btnProced: Locator;
  private readonly jwellaryReleaseApproval: Locator;
  private readonly Renewal: Locator;
  private readonly btnUpdate: Locator;
  private readonly btnUpdate1: Locator;
  private readonly btnYes: Locator;
  private readonly upfrontID: Locator;
  private readonly loanDetails: Locator;
  private readonly renewButton: Locator;
  private readonly btnNext: Locator;
  private readonly firstSchemeCheckbox: Locator;
  private readonly kebabMenu: Locator;
  private readonly profile: Locator;
  private readonly btnYesAssign: Locator;
  private readonly btnDoneAssign: Locator;
  private readonly partnerApproval: Locator;
  private readonly checkClick: Locator;
  private readonly checkClick1: Locator;
  private readonly btnSubmitOps: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly appraisalRequest: Locator;
  private readonly selectAppraiser: Locator;
  private readonly textField: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly fieldCkyc: Locator;
  private readonly kebabMenu1: Locator;
  private readonly kebabMenu2: Locator;
  private readonly applyLoan: Locator;
  private readonly btnOk: Locator;
  private readonly btnNextLoop: Locator;
  private readonly customerUniqID: Locator;
  private readonly transactionID: Locator;
  private readonly selPayment: Locator;
  private readonly selPaymentType: Locator;
  private readonly btnDonePartner: Locator;
  private readonly btnYesPartner: Locator;
  private readonly selPurpose: Locator;
  private readonly netBanking: Locator;
  private readonly btnConfirm: Locator;
  private readonly confirmRenewalRequestedCheckbox: Locator;
  private readonly confirmRenewalRevisedTermsCheckbox: Locator;
  private readonly btnSendOtpRenewal: Locator;
  private readonly btnVerifyRenewalOtp: Locator;
  private readonly consentDialog: Locator;
  private readonly btnCancelConsent: Locator;

  constructor(page: Page) {
    super(page);

    this.assignPacketPage = new AssignPacketPage(page);
    this.adminLoginPage = new AdminLoginPage(page);
    this.btnUploadDocuments = this.page.locator(
      "xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
    this.btnProceed = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Proceed']]",
    );
    this.btnCancelText = this.page.locator(
      "xpath=//span[normalize-space()='Cancel']",
    );
    this.btnRenewLoan = this.page.locator(
      "xpath=//button[contains(.,'Renew Loan')]",
    );
    this.inputBankName = this.page.locator(
      "xpath=//input[@formcontrolname='bankName']",
    );
    this.inputBranchName = this.page.locator(
      "xpath=//input[@formcontrolname='branchName']",
    );
    this.inputBankTransactionID = this.page.locator(
      "xpath=//input[@formcontrolname='transactionId']",
    );
    this.btnProced = this.page.locator(
      "xpath=(//kt-button[@ng-reflect-value='Proceed']//button[@type='button'])[2]",
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
    this.btnYes = this.page.locator("xpath=//span[contains(.,'Yes')]");
    this.upfrontID = this.page.locator(
      "xpath=//input[@formcontrolname='upfrontTransactionId']",
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
    this.firstSchemeCheckbox = this.page
      .locator(
        "xpath=//td[starts-with(normalize-space(text()),'[ALL]')]/preceding-sibling::td//input[@type='checkbox']",
      )
      .first();
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.btnYesAssign = this.page.locator(
      "xpath=//span[normalize-space()='Yes']",
    );
    this.btnDoneAssign = this.page.locator(
      "xpath=//span[normalize-space()='Done']",
    );
    this.partnerApproval = this.page
      .locator("xpath=//button[contains(.,'PARTNER APPROVAL')]")
      .first();
    this.checkClick = this.page.locator(
      "xpath=//img[contains(@name,'incorrectApplicationFormForOperatinalTeam')]",
    );
    this.checkClick1 = this.page.locator(
      "xpath=//img[contains(@name,'incorrectGoldValuationForOperatinalTeam')]",
    );
    this.btnSubmitOps = this.page.locator(
      "xpath=//button[span[normalize-space()='Submit']]",
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
    this.fieldCkyc = this.page.locator(
      "xpath=//input[@formcontrolname='ckycNumber']",
    );
    this.kebabMenu1 = this.page.locator(
      "xpath=(//mat-row[.//*[contains(text(),'New Loan')]]//mat-icon[normalize-space()='more_vert'])[1]",
    );
    this.kebabMenu2 = this.page.locator(
      "xpath=(//mat-row[.//*[contains(text(),'Renew Loan')]]//mat-icon[normalize-space()='more_vert'])[1]",
    );
    this.applyLoan = this.page.locator(
      "xpath=//button[contains(@class,'mat-menu-item') and normalize-space(text())='Apply Loan']",
    );
    this.btnOk = this.page.locator("xpath=//button[@type='submit']");
    this.btnNextLoop = this.page.locator(
      "xpath=//button[span[normalize-space()='Next']]",
    );
    this.customerUniqID = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.transactionID = this.page.locator(
      "xpath=//input[@formcontrolname='securedBankTransactionId']",
    );
    this.selPayment = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
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
    this.confirmRenewalRequestedCheckbox = this.page.locator(
      "xpath=//input[@formcontrolname='customerRequestConfirmed']",
    );
    this.confirmRenewalRevisedTermsCheckbox = this.page.locator(
      "xpath=//input[@formcontrolname='termsAccepted']",
    );
    this.btnSendOtpRenewal = this.page.locator(
      "xpath=//button[normalize-space()='Send OTP']",
    );
    this.btnVerifyRenewalOtp = this.page
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
  }

  protected otpInputLocator(): Locator {
    return this.page.locator(
      "xpath=//div[contains(@class,'consent-dialog')]//input[contains(@class,'otp-cell')]",
    );
  }

  private currentCustomerId(): string {
    return String(
      JSON.parse(
        fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
      ).customerId,
    ).trim();
  }
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
      this.confirmRenewalRequestedCheckbox,
      "customer personally requested this Renewal",
    );
    const revisedTermsCheckboxChecked = await this.checkConsentBox(
      this.confirmRenewalRevisedTermsCheckbox,
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
      '"Confirm Renewal" consent modal appeared — checking both mandatory checkboxes and sending OTP.',
    );

    const { requestedCheckboxChecked, revisedTermsCheckboxChecked } =
      await this.checkBothRenewalConsentBoxes();

    const sendOtp = this.btnSendOtpRenewal;
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

      const verifyBtn = this.btnVerifyRenewalOtp;
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
      const modalStillOpen = await this.consentDialog
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
      const nextBtn = this.page
        .locator("//button[span[normalize-space()='Next']]")
        .first();

      await nextBtn.waitFor({ state: "visible", timeout: 30000 });

      console.log(`Clicking Next button: ${i + 1}`);

      try {
        await nextBtn.scrollIntoViewIfNeeded();
      } catch {
        
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
    await this.profile.click();
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.waitForLoaderToDisappear();
    await this.renewOnlinePay();
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
    await this.btnOk.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
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
      await this.btnNext.click();
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
    const loanMgmt = this.loanManagement;
    await loanMgmt.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.waitFor({ state: "visible" });
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID.fill(this.currentCustomerId());
    console.log(this.currentCustomerId());

    await this.page.waitForTimeout(1000);
    await this.filterbtn.click();
    await this.page.waitForTimeout(5000);
    await this.btnUploadDocuments.click();
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
    await this.page.waitForTimeout(1000);
    //await this.adminLoginPage.logout();
    await this.page.waitForTimeout(5000);
  }

  async renewOnlinePay(): Promise<void> {
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
    await this.filterbtn.click();
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
    await this.page.getByText("Renewal", { exact: true }).click();
    await this.page.waitForTimeout(2000);

    const checkbox = this.firstSchemeCheckbox;

    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await this.selPurpose.selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
    await this.btnProceed.click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.selPayment.selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking.click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm).toBeVisible();
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();
    await this.confirmRenewalConsentIfPresent();
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
    await fundsAndApprovals.evaluate((el: any) => el.click());
    await this.page.waitForTimeout(3000);

    const jra = this.jwellaryReleaseApproval.first();
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

  async renewOfflinePay(): Promise<void> {
    await this.navigateToRenewSchemeScreen();

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selPayment.selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(2000);

    await this.inputBankName.fill("State Bank of India");
    await this.inputBranchName.fill("Lower Parel Branch");
    await this.page.waitForTimeout(1000);
    await this.inputBankTransactionID.fill(this.randomTransactionId(12));
    await this.page.waitForTimeout(2000);

    await this.btnDonePartner.click();
    await this.waitForLoaderToDisappear();
    await this.btnProced.click();
    await this.waitForLoaderToDisappear();

    await this.deposit();
  }

  private async navigateToRenewSchemeScreen(): Promise<void> {
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
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click();
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
    await renewLoan.click();
    await this.page.waitForTimeout(5000);
    await this.page.getByText("Renewal", { exact: true }).click();
    await this.page.waitForTimeout(2000);

    const checkbox = this.firstSchemeCheckbox;
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);
    await this.selPurpose.selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
  }

  private async navigateAndConfirmRenewal(): Promise<void> {
    await this.navigateToRenewSchemeScreen();

    await this.btnProceed.click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.selPayment.selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking.click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm).toBeVisible();
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();
  }

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

  
  async verifyCancelRenewalConsentModal(): Promise<{
    modalOpened: boolean;
    requestedCheckboxChecked: boolean;
    revisedTermsCheckboxChecked: boolean;
    modalClosedAfterCancel: boolean;
  }> {
    await this.navigateAndConfirmRenewal();

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
      '"Confirm Renewal" consent modal appeared — checking both mandatory checkboxes then clicking Cancel.',
    );

    const { requestedCheckboxChecked, revisedTermsCheckboxChecked } =
      await this.checkBothRenewalConsentBoxes();

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

  async validateProceedAndCancelButtons(): Promise<{
    proceedVisible: boolean;
    proceedEnabled: boolean;
    cancelVisible: boolean;
  }> {
    await this.navigateToRenewSchemeScreen();

    const proceed = this.btnProceed;
    const proceedVisible = await proceed.isVisible();
    const proceedEnabled = await proceed.isEnabled();

    await proceed.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const cancelVisible = await this.btnCancelText
      .isVisible()
      .catch(() => false);

    await this.btnCancelText.click().catch(() => {});
    await this.waitForLoaderToDisappear();

    return { proceedVisible, proceedEnabled, cancelVisible };
  }

  async validateWithCashZero(): Promise<{
    cashWithZeroOptionFound: boolean;
    doneVisible: boolean;
  }> {
    await this.navigateToRenewSchemeScreen();

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selPayment.selectOption({ label: "CASH" });
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

    const doneVisible = await this.btnDonePartner
      .isVisible()
      .catch(() => false);

    await this.btnCancelText.click().catch(() => {});
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

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selPayment.selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(2000);

    await this.inputBankName.fill("State Bank of India");
    await this.inputBranchName.fill("Lower Parel Branch");
    await this.page.waitForTimeout(1000);
    await this.inputBankTransactionID.fill(this.randomTransactionId(12));
    await this.page.waitForTimeout(2000);

    const bankNameValue = await this.inputBankName.inputValue().catch(() => "");
    const branchNameValue = await this.inputBranchName
      .inputValue()
      .catch(() => "");
    const transactionIdValue = await this.inputBankTransactionID
      .inputValue()
      .catch(() => "");
    const doneVisible = await this.btnDonePartner
      .isVisible()
      .catch(() => false);

    await this.btnCancelText.click().catch(() => {});
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
    const loanMgmt = this.loanManagement;
    await loanMgmt.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan2 = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan2.waitFor({ state: "visible", timeout: 30000 });
    await appliedLoan2.click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID.fill(this.currentCustomerId());
    console.log(this.currentCustomerId());
    await this.page.waitForTimeout(1000);
    await this.filterbtn.click();
    await this.page.waitForTimeout(2000);

    await this.waitForLoaderToDisappear();
    await this.partnerApproval.waitFor({ state: "visible", timeout: 30000 });
    await this.partnerApproval.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.clickNextSafely(7);
    await this.page.waitForTimeout(2000);

    await this.checkClick.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.checkClick1.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const statusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForPartner']",
    );
    await statusDropdown.selectOption({ label: "Approved" });
    await this.page.waitForTimeout(1000);

    await this.btnSubmitOps.click();
    await this.waitForLoaderToDisappear();
  }
  async renewCronPay(): Promise<void> {
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
    await this.filterbtn.click();
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
    await this.page.getByText("Renewal", { exact: true }).click();
    await this.page.waitForTimeout(2000);
    const checkbox = this.firstSchemeCheckbox;

    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await this.selPurpose.selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
    await this.btnProceed.click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.selPayment.selectOption({ label: "CRON" });
    await this.netBanking.click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm).toBeVisible();
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();
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
