import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import customerData from "../../testdata/admin/documents/customerData.json";
import { getLoginData } from "../../utils/data/admin-excel-data";

/**
 * Port of Java: PO11_PartPayment (locators) + Flow12_PartPayment.partPaySuccess() (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator shared across TC02 flows (same XPath).
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `loanDetails` re-declares PO10_QuickPayment.loc_LoanDetails (same XPath).
 *   - `kebabMenu` re-declares PO10_QuickPayment.loc_kebabMenu (same XPath).
 *   - `btnProceed` re-declares PO10_QuickPayment.loc_btnProceed (same XPath).
 *   - `netBanking` re-declares PO10_QuickPayment.loc_netBanking (same XPath).
 *   - `searchBank` re-declares PO10_QuickPayment.loc_searchBank (same XPath).
 *   - `sbibank` re-declares PO10_QuickPayment.loc_sbibank (same XPath).
 *   - `btnPay` re-declares PO10_QuickPayment.loc_btnPay (same XPath).
 *   - `selPayment` re-declares PO10_QuickPayment.loc_selPayment (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow12_PartPayment.partPaySuccess() called Flow_LoginLogout.loginWithAppraiser() — OMITTED.
 *   Role = appraiser; caller must inject via loginAs('appraiser').
 */
export class PartPaymentPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO11_PartPayment) ──────────────────────────────────────

  private readonly partPay = () =>
    this.page.locator("xpath=//button[normalize-space()='Part Payment']");
  private readonly paymentAmount = () =>
    this.page.locator("xpath=(//td[contains(@class,'table-last')]//input)[1]");
  private readonly btnProced = () =>
    this.page.locator(
      "xpath=(//kt-button[@ng-reflect-value='Proceed']//button[@type='button'])[2]",
    );

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
  // PO10_QuickPayment.loc_btnProceed
  private readonly btnProceed = () =>
    this.page.locator("xpath=//span[normalize-space()='Proceed']");
  // PO10_QuickPayment.loc_netBanking
  private readonly netBanking = () =>
    this.page.locator("xpath=//img[@alt='netbanking']");
  // PO10_QuickPayment.loc_searchBank
  private readonly searchBank = () =>
    this.page.locator("xpath=//input[@placeholder='Search for Banks']");
  // PO10_QuickPayment.loc_sbibank
  private readonly sbibank = () =>
    this.page.locator("xpath=(//span[contains(.,'State Bank of India')])[1]");
  // PO10_QuickPayment.loc_btnPay
  private readonly textField = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");

  // ── Actions (from Flow12_PartPayment.partPaySuccess) ──────────────────────

  /**
   * Port of Java Flow12_PartPayment.partPaySuccess().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Loan Details, initiates Part Payment of 25000 with PAYMENT GATEWAY,
   * switches to Razorpay iframe, selects SBI, and clicks Success in the bank popup.
   */
  async partPaySuccess(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement().click();
    await this.page.waitForTimeout(5000);

    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.partPay().click();
    await this.waitForLoaderToDisappear();

    const ele = this.paymentAmount();
    await ele.clear();
    await this.page.waitForTimeout(2000);
    await ele.fill("25000");
    await this.waitForLoaderToDisappear();

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();

    await this.selPayment().selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking().click();
    await this.page.waitForTimeout(3000);

    // JS-click the Part Payment proceed button
    await this.jsClick(this.btnProced());
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

  // Switch to bank simulator popup

  // ── Offline Part Pay (TC04 additions) ─────────────────────────────────────

  // Additional locators for offline payment (PO23_PartReleaseOffline locators re-declared locally)
  private readonly inputBankName = () =>
    this.page.locator("xpath=//input[@formcontrolname='bankName']");
  private readonly inputBranchName = () =>
    this.page.locator("xpath=//input[@formcontrolname='branchName']");
  private readonly inputBankTransactionID = () =>
    this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  private readonly btnYesOffline = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  // PO10_QuickPayment.loc_btnDone (payment done button)
  private readonly btnPaymentDone = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO45_Deposit locators re-declared
  private readonly btnEdit = () =>
    this.page.locator("xpath=//button[normalize-space()='Edit']");
  private readonly btndone = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  private readonly btnYesDeposit = () =>
    this.page.locator("xpath=//button[normalize-space()='Yes']");
  // Deposit list filter: Customer Unique Id + Filter button
  private readonly depositCustomerIdFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
  private readonly btnDepositFilter = () =>
    this.page.locator("xpath=//span[normalize-space()='Filter']");

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

  /**
   * Port of Java Flow31_PartPaymentOffline.partPayOffline().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Loan Details, initiates Part Payment of 25000, opens the Payment Mode dialog,
   * selects IMPS, fills bank name/branch name/transaction ID, clicks Done, then JS-clicks the
   * Part Payment proceed button to submit. Returns the customer's unique ID (read from the
   * filtered Loan Details row) so the caller can pass it to deposit() to mark the deposit
   * Completed for that exact customer.
   */
  async partPayOffline(): Promise<string> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement().click();
    await this.page.waitForTimeout(5000);

    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();

    const customerIdCell = this.page.locator(
      "xpath=(//td[@class='ui-resizable-column p-element p-frozen-column ng-star-inserted'])[1]",
    );
    const customerId = (await customerIdCell.innerText()).trim();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.partPay().click();
    await this.waitForLoaderToDisappear();

    const ele = this.paymentAmount();
    await ele.clear();
    await this.page.waitForTimeout(2000);
    await ele.fill("25000");
    await this.waitForLoaderToDisappear();

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();

    await this.selPayment().selectOption({ label: "IMPS" });
    await this.page.waitForTimeout(2000);

    await this.inputBankName().fill(this.getRandomBankName());
    await this.inputBranchName().fill(this.getRandomBranchName());
    await this.page.waitForTimeout(2000);
    await this.inputBankTransactionID().fill(this.generateTransactionId());
    await this.page.waitForTimeout(2000);

    await this.btnPaymentDone().click();
    await this.waitForLoaderToDisappear();

    await this.jsClick(this.btnProced());
    await this.waitForLoaderToDisappear();

    if ((await this.btnYesOffline().count()) > 0) {
      await this.btnYesOffline().click();
      await this.waitForLoaderToDisappear();
    }

    return customerId;
  }

  /**
   * Port of Java Flow31_PartPaymentOffline.deposit() (same pattern as Flow28).
   *
   * NOTE: No loginWith* call. Caller must be logged in as appraiser.
   *
   * Navigates to Funds and Approvals → Deposit, filters by the given customer's unique ID
   * (instead of selecting Status=Pending) so the correct row is found deterministically,
   * scrolls, marks Completed.
   */
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
    await this.textField().fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    await this.btnDepositFilter().click();
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

    await this.btnEdit().click();
    await this.waitForLoaderToDisappear();

    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='depositStatus']",
    );
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: "Completed" });

    await this.btndone().click();
    await this.waitForLoaderToDisappear();
    await this.btnYesDeposit().click();
    await this.waitForLoaderToDisappear();
  }
}
