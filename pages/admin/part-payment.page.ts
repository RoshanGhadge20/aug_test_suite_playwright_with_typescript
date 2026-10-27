import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import fs from "fs";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class PartPaymentPage extends AdminBasePage {
  private readonly partPay: Locator;
  private readonly paymentAmount: Locator;
  private readonly btnProced: Locator;
  private readonly viewPartPaymentLogsBtn: Locator;
  private readonly partPayTransactionHistoryBtn: Locator;
  private readonly btnCancelText: Locator;
  private readonly logAmountCell: Locator;
  private readonly logDialogClose: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly loanDetails: Locator;
  private readonly kebabMenu: Locator;
  private readonly btnProceed: Locator;
  private readonly netBanking: Locator;
  private readonly searchBank: Locator;
  private readonly sbibank: Locator;
  private readonly textField: Locator;
  private readonly selPayment: Locator;
  private readonly inputBankName: Locator;
  private readonly inputBranchName: Locator;
  private readonly inputBankTransactionID: Locator;
  private readonly btnYesOffline: Locator;
  private readonly btnPaymentDone: Locator;
  private readonly btnEdit: Locator;
  private readonly btndone: Locator;
  private readonly btnYesDeposit: Locator;
  private readonly depositCustomerIdFilter: Locator;
  private readonly btnDepositFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.partPay = this.page.locator(
      "xpath=//button[normalize-space()='Part Payment']",
    );
    this.paymentAmount = this.page.locator(
      "xpath=(//td[contains(@class,'table-last')]//input)[1]",
    );
    this.btnProced = this.page.locator(
      "xpath=(//kt-button[@ng-reflect-value='Proceed']//button[@type='button'])[2]",
    );
    this.viewPartPaymentLogsBtn = this.page.locator(
      "xpath=//span[contains(.,'View Part Payment Logs')]",
    );
    this.partPayTransactionHistoryBtn = this.page.locator(
      "xpath=//span[contains(text(),'Transaction History')]",
    );
    this.btnCancelText = this.page.locator(
      "xpath=//span[normalize-space()='Cancel']",
    );
    this.logAmountCell = this.page.locator(
      "xpath=(//td[@class='table-amount'])[1]",
    );
    this.logDialogClose = this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
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
    this.loanDetails = this.page.locator(
      "xpath=//span[normalize-space()='Loan Details']",
    );
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.btnProceed = this.page.locator(
      "xpath=//span[normalize-space()='Proceed']",
    );
    this.netBanking = this.page.locator("xpath=//img[@alt='netbanking']");
    this.searchBank = this.page.locator(
      "xpath=//input[@placeholder='Search for Banks']",
    );
    this.sbibank = this.page.locator(
      "xpath=(//span[contains(.,'State Bank of India')])[1]",
    );
    this.textField = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.selPayment = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
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
    this.btnPaymentDone = this.page.locator(
      "xpath=//span[normalize-space()='Done']",
    );
    this.btnEdit = this.page.locator(
      "xpath=//button[normalize-space()='Edit']",
    );
    this.btndone = this.page.locator("xpath=//span[normalize-space()='Done']");
    this.btnYesDeposit = this.page.locator(
      "xpath=//button[normalize-space()='Yes']",
    );
    this.depositCustomerIdFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.btnDepositFilter = this.page.locator(
      "xpath=//span[normalize-space()='Filter']",
    );
  }

  async partPaySuccess(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(5000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.partPay.click();
    await this.waitForLoaderToDisappear();

    const ele = this.paymentAmount;
    await ele.clear();
    await this.page.waitForTimeout(2000);
    await ele.fill("25000");
    await this.waitForLoaderToDisappear();

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();

    await this.selPayment.selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking.click();
    await this.page.waitForTimeout(3000);

    // JS-click the Part Payment proceed button
    await this.jsClick(this.btnProced);
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

    const successBtn = popup.getByRole("button", { name: "Success" });

    await successBtn.waitFor({ state: "visible", timeout: 5000 });

    await successBtn.click();

    await this.page.waitForTimeout(2000);
  }

  private async navigateToPartPaymentScreen(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(5000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    // noWaitAfter: see partPaySuccess() above.
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.partPay.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }

  async validateViewTransactionLog(): Promise<string> {
    await this.navigateToPartPaymentScreen();

    await this.viewPartPaymentLogsBtn.click();
    await this.waitForLoaderToDisappear();

    const ele = this.logAmountCell;
    const str = await ele
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => ele.innerText())
      .then((t) => t.trim())
      .catch(() => "No Records Found");

    await this.logDialogClose.click();
    await this.waitForLoaderToDisappear();

    return str;
  }

  async validatePartPayTransactionHistory(): Promise<string> {
    await this.partPayTransactionHistoryBtn.click();
    await this.waitForLoaderToDisappear();

    const ele = this.logAmountCell;
    const str = await ele
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => ele.innerText())
      .then((t) => t.trim())
      .catch(() => "No Records Found");

    await this.logDialogClose.click();
    await this.waitForLoaderToDisappear();

    return str;
  }

  async validateProceedAndCancelButtons(): Promise<{
    proceedVisible: boolean;
    proceedEnabled: boolean;
    cancelVisible: boolean;
  }> {
    const proceed = this.btnProceed;
    const proceedVisible = await proceed.isVisible();
    const proceedEnabled = await proceed.isEnabled();
    const cancelVisible = await this.btnCancelText.isVisible();

    return { proceedVisible, proceedEnabled, cancelVisible };
  }

  async validateWithCashZero(): Promise<string> {
    const amountField = this.paymentAmount;
    await amountField.clear();
    await this.page.waitForTimeout(1000);
    await amountField.fill("0");
    await this.page.waitForTimeout(1000);

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();

    const error = this.page.locator(
      "xpath=//mat-error[contains(normalize-space(.),'Amount should be atleast')]",
    );
    await error.waitFor({ state: "visible", timeout: 10000 });
    return (await error.innerText()).trim();
  }

  // ── Offline Part Pay (TC04 additions) ─────────────────────────────────────

  private generateTransactionId(): string {
    return "TXN-" + Math.random().toString(36).substring(2, 14).toUpperCase();
  }

  private getRandomBankName(): string {
    const banks = [
      "State Bank of India",
      "HDFC Bank",
      "ICICI Bank",
      "Axis Bank",
      "Punjab National Bank",
      "Bank of Baroda",
      "Kotak Mahindra Bank",
      "Yes Bank",
      "IDFC First Bank",
      "Union Bank of India",
    ];
    return banks[Math.floor(Math.random() * banks.length)];
  }

  /** Reads the customer ID most recently written by CustomerManagementPage during onboarding. */
  private getCurrentCustomerId(): string {
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    return customerData.customerId.trim();
  }

  private getRandomBranchName(): string {
    const branches = [
      "MG Road Branch",
      "Andheri Branch",
      "Connaught Place Branch",
      "Koramangala Branch",
      "Bandra Branch",
      "Chandni Chowk Branch",
      "Jayanagar Branch",
      "Indiranagar Branch",
      "Santacruz Branch",
      "Pune Camp Branch",
    ];
    return branches[Math.floor(Math.random() * branches.length)];
  }

  async partPayOffline(): Promise<string> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(5000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    // noWaitAfter: see partPaySuccess() above.
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    const customerIdCell = this.page.locator(
      "xpath=(//td[@class='ui-resizable-column p-element p-frozen-column ng-star-inserted'])[1]",
    );
    const customerId = (await customerIdCell.innerText()).trim();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.partPay.click();
    await this.waitForLoaderToDisappear();

    const ele = this.paymentAmount;
    await ele.clear();
    await this.page.waitForTimeout(2000);
    await ele.fill("25000");
    await this.waitForLoaderToDisappear();

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();

    await this.selPayment.selectOption({ label: "IMPS" });
    await this.page.waitForTimeout(2000);

    await this.inputBankName.fill(this.getRandomBankName());
    await this.inputBranchName.fill(this.getRandomBranchName());
    await this.page.waitForTimeout(2000);
    await this.inputBankTransactionID.fill(this.generateTransactionId());
    await this.page.waitForTimeout(2000);

    await this.btnPaymentDone.click();
    await this.waitForLoaderToDisappear();

    await this.jsClick(this.btnProced);
    await this.waitForLoaderToDisappear();

    if ((await this.btnYesOffline.count()) > 0) {
      await this.btnYesOffline.click();
      await this.waitForLoaderToDisappear();
    }

    return customerId;
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
    const customerId = this.getCurrentCustomerId();
    await this.textField.fill(customerId);
    console.log(customerId);
    await this.btnDepositFilter.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

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
  async partPaySuccessCron(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(5000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.partPay.click();
    await this.waitForLoaderToDisappear();

    const ele = this.paymentAmount;
    await ele.clear();
    await this.page.waitForTimeout(2000);
    await ele.fill("25000");
    await this.waitForLoaderToDisappear();

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();

    await this.selPayment.selectOption({ label: "CRON" });
    await this.netBanking.click();
    await this.page.waitForTimeout(3000);

    // JS-click the Part Payment proceed button
    await this.jsClick(this.btnProced);
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

    const successBtn = popup.getByRole("button", { name: "Success" });

    await successBtn.waitFor({ state: "visible", timeout: 5000 });

    await successBtn.click();

    await this.page.waitForTimeout(2000);
  }
}
