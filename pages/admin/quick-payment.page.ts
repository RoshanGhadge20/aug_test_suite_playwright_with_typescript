import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import fs from "fs";

export class QuickPaymentPage extends AdminBasePage {
  private readonly loanDetails: Locator;
  private readonly kebabMenu: Locator;
  private readonly quickPay: Locator;
  private readonly btnProceed: Locator;
  private readonly netBanking: Locator;
  private readonly btnConfirm: Locator;
  private readonly searchBank: Locator;
  private readonly sbibank: Locator;
  private readonly btnPay: Locator;
  private readonly btnSign: Locator;
  private readonly btnDone: Locator;
  private readonly selPayment: Locator;
  private readonly btnCancel: Locator;
  private readonly btnFilter: Locator;
  private readonly customerUniqID: Locator;
  private readonly radioTillDate: Locator;
  private readonly radioNextDueDate: Locator;
  private readonly radioCustomAmount: Locator;
  private readonly quickPayAmountField: Locator;
  private readonly btnViewInterestEmiLogs: Locator;
  private readonly btnTransactionHistory: Locator;
  private readonly btnQuickPayTransactionHistory: Locator;
  private readonly logDialogClose: Locator;
  private readonly amountErrorText: Locator;
  private readonly maxAmountErrorText: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly btnNextduedateRadio: Locator;
  private readonly partPay: Locator;
  private readonly paymentAmount: Locator;
  private readonly btnProcedPP: Locator;
  private readonly inputBankName: Locator;
  private readonly inputBranchName: Locator;
  private readonly inputBankTransactionID: Locator;
  private readonly btnYesOffline: Locator;
  private readonly selBranch: Locator;
  private readonly btnEdit: Locator;
  private readonly btndone: Locator;
  private readonly btnYesDeposit: Locator;

  constructor(page: Page) {
    super(page);
    this.loanDetails = this.page.locator(
      "xpath=//span[normalize-space()='Loan Details']",
    );
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.quickPay = this.page.locator(
      "xpath=//button[normalize-space()='Quick Pay']",
    );
    this.btnProceed = this.page.locator(
      "xpath=//span[normalize-space()='Proceed']",
    );
    this.netBanking = this.page.locator("xpath=//img[@alt='netbanking']");
    this.btnConfirm = this.page.locator(
      "xpath=//span[normalize-space()='Confirm']",
    );
    this.searchBank = this.page.locator(
      "xpath=//input[@placeholder='Search for Banks']",
    );
    this.sbibank = this.page.locator(
      "xpath=(//span[contains(.,'State Bank of India')])[1]",
    );
    this.btnPay = this.page.locator(
      "xpath=//button[contains(.,'Continue & Pay')]",
    );
    this.btnSign = this.page.locator(
      "xpath=//button[@ng-reflect-disabled='false']",
    );
    this.btnDone = this.page.locator("xpath=//span[normalize-space()='Done']");
    this.selPayment = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
    );
    this.btnCancel = this.page.locator(
      "xpath=//span[normalize-space()='Cancel']",
    );
    this.btnFilter = this.page.locator(
      "xpath=//span[normalize-space()='Filter']",
    );
    this.customerUniqID = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.radioTillDate = this.page.locator(
      "xpath=//mat-radio-button[contains(normalize-space(.),'Amount Till Date')]",
    );
    this.radioNextDueDate = this.page.locator(
      "xpath=//mat-radio-button[contains(normalize-space(.),'Next Due Date')]",
    );
    this.radioCustomAmount = this.page.locator(
      "xpath=//mat-radio-button[contains(normalize-space(.),'Custom')]",
    );
    this.quickPayAmountField = this.page.locator("xpath=//input[@type='text']");
    this.btnViewInterestEmiLogs = this.page.locator(
      "xpath=//button[normalize-space()='View Interest EMI Logs']",
    );
    this.btnTransactionHistory = this.page.locator(
      "xpath=//button[normalize-space()='Transaction History']",
    );
    this.btnQuickPayTransactionHistory = this.page.locator(
      "xpath=//button[normalize-space()='Quick Pay Transaction History']",
    );
    this.logDialogClose = this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );
    this.amountErrorText = this.page.locator(
      "xpath=//small[@class='text-danger']",
    );
    this.maxAmountErrorText = this.page.locator(
      "xpath=//mat-error[contains(@class,'mat-error')]//small[contains(normalize-space(),'Part Payment option')]",
    );
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
    this.btnNextduedateRadio = this.page.locator(
      "xpath=(//mat-radio-button[@class='mat-radio-button mat-accent'])[1]",
    );
    this.partPay = this.page.locator(
      "xpath=//button[normalize-space()='Part Payment']",
    );
    this.paymentAmount = this.page.locator("xpath=//input[@type='text']");
    this.btnProcedPP = this.page.locator(
      "xpath=(//kt-button[@ng-reflect-value='Proceed']//button[@type='button'])[2]",
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
    this.btnYesOffline = this.page.locator("xpath=//span[contains(.,'Yes')]");
    this.selBranch = this.page.locator(
      "xpath=//select[@formcontrolname='receivedAmountForBranchId']",
    );
    this.btnEdit = this.page.locator(
      "xpath=//button[normalize-space()='Edit']",
    );
    this.btndone = this.page.locator("xpath=//span[normalize-space()='Done']");
    this.btnYesDeposit = this.page.locator(
      "xpath=//button[normalize-space()='Yes']",
    );
  }

  private getCurrentCustomerId(): string {
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    return customerData.customerId.trim();
  }

  private async navigateToLoanDetails(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const customerId = this.getCurrentCustomerId();
    await this.customerUniqID.fill(customerId);
    console.log(customerId);
    //await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(2000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
  }

  async quikPaymentsuccess(): Promise<void> {
    await this.navigateToLoanDetails();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.quickPay.click();
    // await this.page.waitForTimeout(2000);

    // await this.btnNextduedateRadio.click();
    await this.page.waitForTimeout(2000);
    await this.btnProceed.click();

    await this.selPayment.selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking.click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();

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
    await this.deposit();
  }

  async quikPaymentfail(): Promise<string> {
    await this.navigateToLoanDetails();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.partPay.click();
    await this.waitForLoaderToDisappear();

    const ele = this.paymentAmount;
    await ele.clear();
    await this.page.waitForTimeout(2000);
    await ele.fill("200");
    await this.waitForLoaderToDisappear();

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();

    await this.selPayment.selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking.click();
    await this.page.waitForTimeout(2000);

    await this.jsClick(this.btnProcedPP);
    await this.page.waitForTimeout(2000);

    // Switch into Razorpay iframe
    const razorFrame = this.page.frameLocator(
      "xpath=//iframe[@class='razorpay-checkout-frame']",
    );
    await this.page.waitForTimeout(3000);
    await razorFrame
      .locator("xpath=//input[@placeholder='Search for Banks']")
      .fill("State Bank of India");
    await this.page.waitForTimeout(2000);
    await razorFrame
      .locator("xpath=(//span[contains(.,'State Bank of India')])[1]")
      .click();
    const popupPromise = this.page.context().waitForEvent("page");
    await razorFrame
      .locator("xpath=//button[contains(.,'Continue & Pay')]")
      .click();
    await this.page.waitForTimeout(10000);
    const popup = await popupPromise;
    await popup.waitForLoadState();

    const failureBtn = popup.getByRole("button", { name: "Failure" });

    await failureBtn.waitFor({ state: "visible", timeout: 5000 });
    await failureBtn.click();
    await this.page.waitForTimeout(2000);
    return this.validateFailureResponse();
  }

  async validateFailureResponse(): Promise<string> {
    await this.page.waitForTimeout(3000);
    await this.page.mainFrame().evaluate(() => {}); // ensure default content
    const razorFrame = this.page.frameLocator(
      "xpath=//iframe[@class='razorpay-checkout-frame']",
    );
    await this.page.waitForTimeout(5000);
    const msgEl = razorFrame.locator(
      "xpath=//div[contains(@class, 'text-center') and text()='Payment could not be completed']",
    );
    await msgEl.scrollIntoViewIfNeeded();
    return (await msgEl.innerText()).trim();
  }

  async quickPayOffline(): Promise<void> {
    await this.page.addInitScript(() => {
      (window as any).print = () => {};
    });
    try {
      await this.page.evaluate(() => {
        (window as any).print = () => {};
      });
    } catch (_) {}

    await this.navigateToLoanDetails();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.quickPay.click();
    await this.page.waitForTimeout(2000);
    await this.btnNextduedateRadio.click();
    await this.page.waitForTimeout(2000);
    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.selPayment.click();

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
    );
    await selectStatusDropdown.selectOption({ label: "CASH" });
    await this.page.waitForTimeout(2000);

    const nodePath = require("path");
    const nodeFs = require("fs");
    const cashReceiptPdfPath = nodePath.resolve(
      process.cwd(),
      "testdata",
      "admin",
      "cash-receipt-download.pdf",
    );
    const fallbackPdfPath = nodePath.resolve(
      process.cwd(),
      "testdata",
      "admin",
      "singnature-sample.pdf",
    );
    let uploadPdfPath: string = fallbackPdfPath;

    const downloadImg = this.page.locator("xpath=//img[@alt='Download']");
    if ((await downloadImg.count()) > 0) {
      const cdpSession = await this.page.context().newCDPSession(this.page);

      // Dismiss any print dialogs
      const dialogHandler = async (dialog: any) => {
        await dialog.dismiss();
      };
      this.page.on("dialog", dialogHandler);

      // Suppress window.print so Chrome doesn't open a print preview
      try {
        await this.page.evaluate(() => {
          (window as any).print = () => {};
        });
      } catch (_) {}
      const pdfPromise = (async () => {
        await this.page.waitForTimeout(600);
        try {
          const pdf = await cdpSession.send("Page.printToPDF", {
            displayHeaderFooter: false,
            preferCSSPageSize: true,
            printBackground: true,
            paperWidth: 8.5,
            paperHeight: 11,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
          } as any);
          console.log("✓ Cash Acknowledgement captured as PDF");
          return pdf;
        } catch (err: any) {
          console.warn(`⚠ PDF capture failed: ${err.message}`);
          return null;
        }
      })();

      await downloadImg.click();

      // Wait for PDF (max 12s)
      const pdfData = await Promise.race([
        pdfPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
      ]);

      this.page.off("dialog", dialogHandler);

      if (pdfData && (pdfData as any).data) {
        nodeFs.writeFileSync(
          cashReceiptPdfPath,
          Buffer.from((pdfData as any).data, "base64"),
        );
        uploadPdfPath = cashReceiptPdfPath;
        console.log(`✓ Cash Receipt saved to: ${cashReceiptPdfPath}`);
      }
      await cdpSession.detach();
      await this.page.waitForTimeout(1000);
    }
    const cashReceiptBtn = this.page.locator(
      "xpath=//button[normalize-space()='Cash Receipt']",
    );
    if ((await cashReceiptBtn.count()) > 0) {
      await cashReceiptBtn.click();
      await this.page.waitForTimeout(500);

      const fileInputs = this.page.locator("xpath=//input[@type='file']");
      const inputCount = await fileInputs.count();
      if (inputCount > 0) {
        try {
          await fileInputs.nth(inputCount - 1).setInputFiles(uploadPdfPath);
          console.log(`✓ Cash Receipt uploaded: ${uploadPdfPath}`);
        } catch (err: any) {
          console.warn(`⚠ setInputFiles failed: ${err.message}`);
        }
        await this.page.waitForTimeout(1000);
      }
    }

    await this.selBranch.selectOption({ label: "Augmont" });
    await this.btnDone.click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }
  async deposit(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    const element1 = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await element1.click();
    await this.page.waitForTimeout(2000);
    const ele1 = this.page.locator("xpath=//span[normalize-space()='Deposit']");
    await ele1.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(2000);
    await ele1.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@ng-reflect-name='depositStatus']",
    );
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: "Completed" });

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

    await this.btnEdit.click();
    await this.waitForLoaderToDisappear();

    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='depositStatus']",
    );
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: "Completed" });

    await this.btndone.click();
    await this.waitForLoaderToDisappear();
    await this.btnYesDeposit.click();
    await this.waitForLoaderToDisappear();
  }
  private async openQuickPay(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(2000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.quickPay.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }
  async validateTillDateOption(): Promise<string> {
    await this.openQuickPay();
    await this.radioTillDate.click();
    await this.page.waitForTimeout(1000);
    const amount = (await this.quickPayAmountField.inputValue()).trim();
    await this.btnCancel.click();
    await this.waitForLoaderToDisappear();
    return amount;
  }

  async validateNextDueDateOption(): Promise<string> {
    await this.openQuickPay();
    await this.radioNextDueDate.click();
    await this.page.waitForTimeout(1000);
    const amount = (await this.quickPayAmountField.inputValue()).trim();
    await this.btnCancel.click();
    await this.waitForLoaderToDisappear();
    return amount;
  }
  async validateCancelButtonFunctionality(): Promise<boolean> {
    await this.openQuickPay();
    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.btnCancel.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    return await this.btnProceed.isVisible().catch(() => false);
  }
  async validateProceedAndCancelButtons(): Promise<{
    proceedVisible: boolean;
    proceedEnabled: boolean;
    cancelVisible: boolean;
  }> {
    await this.openQuickPay();
    const proceedVisible = await this.btnProceed.isVisible();
    const proceedEnabled = await this.btnProceed.isEnabled();
    const cancelVisible = await this.btnCancel.isVisible();
    await this.btnCancel.click();
    await this.waitForLoaderToDisappear();
    return { proceedVisible, proceedEnabled, cancelVisible };
  }
  async validateViewInterestEmiLogsButton(): Promise<boolean> {
    await this.openQuickPay();
    await this.btnViewInterestEmiLogs.click();
    await this.waitForLoaderToDisappear();
    const opened = await this.logDialogClose
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    await this.logDialogClose.click().catch(() => {});
    await this.waitForLoaderToDisappear();
    return opened;
  }
  async validateTransactionHistoryButton(): Promise<boolean> {
    await this.openQuickPay();
    await this.btnTransactionHistory.click();
    await this.waitForLoaderToDisappear();
    const opened = await this.logDialogClose
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    await this.logDialogClose.click().catch(() => {});
    await this.waitForLoaderToDisappear();
    return opened;
  }
  async validateQuickPayTransactionHistoryButton(): Promise<boolean> {
    await this.openQuickPay();
    await this.btnQuickPayTransactionHistory.click();
    await this.waitForLoaderToDisappear();
    const opened = await this.logDialogClose
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    await this.logDialogClose.click().catch(() => {});
    await this.waitForLoaderToDisappear();
    return opened;
  }
  private async fillCustomAmount(amount: string): Promise<void> {
    await this.radioCustomAmount.click();
    await this.page.waitForTimeout(1000);
    const field = this.quickPayAmountField;
    await field.clear();
    await this.page.waitForTimeout(500);
    await field.fill(amount);
    await this.page.waitForTimeout(500);
  }
  async validateZeroAmount(): Promise<string> {
    await this.openQuickPay();
    await this.fillCustomAmount("0");
    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    const msg = (await this.amountErrorText.innerText()).trim();
    await this.btnCancel.click().catch(() => {});
    return msg;
  }
  async validateMinAmountTen(): Promise<boolean> {
    await this.openQuickPay();
    await this.fillCustomAmount("10");
    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    const errorVisible = await this.amountErrorText
      .isVisible()
      .catch(() => false);
    await this.btnCancel.click().catch(() => {});
    return !errorVisible;
  }
  async validateAmountFiveHundred(): Promise<boolean> {
    await this.openQuickPay();
    await this.fillCustomAmount("500");
    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    const errorVisible = await this.amountErrorText
      .isVisible()
      .catch(() => false);
    await this.btnCancel.click().catch(() => {});
    return !errorVisible;
  }
  async validateAmountOverMax(): Promise<string> {
    await this.openQuickPay();
    await this.radioCustomAmount.click();
    await this.page.waitForTimeout(1000);
    const nextDueCell = this.page.locator(
      "xpath=(//td[contains(@class,'table-amount')]/span)[3]",
    );
    const str = (await nextDueCell.innerText()).trim();
    const value = parseFloat(str.replace(/,/g, ""));
    const overMax = (value + 1).toFixed(2);
    const field = this.quickPayAmountField;
    await field.clear();
    await this.page.waitForTimeout(500);
    await field.fill(overMax);
    await this.page.waitForTimeout(500);
    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    const msg = (await this.maxAmountErrorText.innerText()).trim();
    await this.btnCancel.click().catch(() => {});
    return msg;
  }
  async quikPaymentsuccessCron(): Promise<void> {
    await this.navigateToLoanDetails();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.quickPay.click();
    // await this.page.waitForTimeout(2000);

    // await this.btnNextduedateRadio.click();
    await this.page.waitForTimeout(2000);
    await this.btnProceed.click();

    await this.selPayment.selectOption({ label: "CRON" });
    await this.netBanking.click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();

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
