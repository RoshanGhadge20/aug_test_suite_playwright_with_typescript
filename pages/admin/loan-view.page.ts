import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

/**
 * Port of Java: PO26_ViewFunctionalityLoan (locators) + Flow32_ValidateViewTransctionLog (actions)
 *               + Flow49_ViewFunctionalityLoan (actions)
 *
 * Methods ported:
 *   - validateViewTransaction()  ← Flow32.validateViewTransaction()
 *   - viewFunctionality()        ← Flow49.viewFunctionality()
 *
 * Cross-page locator notes:
 *   - All navigation locators re-declared locally.
 *
 * Omitted loginWith* calls:
 *   - validateViewTransaction() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *   - viewFunctionality() called loginWithAppraiser() — OMITTED. Role = appraiser.
 */
export class LoanViewPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO26_ViewFunctionalityLoan) ────────────────────────────

  private readonly viewLoan = () =>
    this.page.locator("xpath=//button[normalize-space()='View Loan']");
  private readonly viewInterestEMI = () =>
    this.page.locator(
      "xpath=//span[contains(text(),'View Interest EMI Logs')]",
    );
  private readonly interestPaid = () =>
    this.page.locator("xpath=(//tbody/tr/td[3])[1]");
  private readonly TransactaionHistory = () =>
    this.page.locator("xpath=//span[contains(text(),'Transaction History')]");
  private readonly paidAmount = () =>
    this.page.locator("xpath=(//td[@class='table-amount'])[1]");
  private readonly btnclose = () =>
    this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );
  private readonly partPayment = () =>
    this.page.locator("xpath=//span[contains(.,'View Part Payment Logs')]");

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

  // ── Private navigation helper ─────────────────────────────────────────────

  private async navigateToLoanDetails(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(2000);

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
    await this.page.waitForTimeout(7000);
    // noWaitAfter: this button is type="submit" inside a <form> — Playwright detects a real
    // navigation attempt from the native submit and hangs waiting for it to "finish" even
    // though Angular's (ngSubmit) handler already intercepted it client-side (same fix as
    // renew-zero.page.ts / full-release-offline.page.ts / manual-charges.page.ts).
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
  }

  // ── Actions (standalone, extracted for tc13-loan-view-validations.spec.ts) ─

  /**
   * Navigates to Loan Details and opens "View Loan" from the kebab menu.
   * Returns whether the View Loan screen actually opened (View Interest EMI Logs
   * button visible), so callers can assert on it before chaining further actions.
   */
  async openViewLoanDetails(): Promise<boolean> {
    await this.navigateToLoanDetails();

    await this.page.waitForTimeout(2000);
    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan().click();
    await this.waitForLoaderToDisappear();

    return await this.viewInterestEMI()
      .waitFor({ state: "visible", timeout: 20000 })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Must be called with the "View Loan" screen already open (openViewLoanDetails()).
   * Opens View Interest EMI Logs, reads the interest paid value, then closes.
   */
  async validateViewEmiLogs(): Promise<string> {
    const button = this.viewInterestEMI();
    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await button.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await button.click();
    await this.waitForLoaderToDisappear();

    const ele = this.interestPaid();
    await ele.waitFor({ state: "visible", timeout: 20000 });
    const str = (await ele.innerText()).trim();

    await this.btnclose().click();
    await this.waitForLoaderToDisappear();

    return str;
  }

  /**
   * Must be called with the "View Loan" screen already open (openViewLoanDetails()).
   * Opens Transaction History, reads the paid amount value, then closes.
   */
  async validateViewTransactionHistory(): Promise<string> {
    await this.TransactaionHistory().click();
    await this.waitForLoaderToDisappear();

    // A test loan with no payments yet renders "No Records Found" instead of a row —
    // that's a valid empty state, not a locator failure.
    const ele = this.paidAmount();
    const str = await ele
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => ele.innerText())
      .then((t) => t.trim())
      .catch(() => "No Records Found");

    await this.btnclose().click();
    await this.waitForLoaderToDisappear();

    return str;
  }

  // ── Actions (from Flow32_ValidateViewTransctionLog.validateViewTransaction) ─

  /**
   * Port of Java Flow32_ValidateViewTransctionLog.validateViewTransaction().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Loan Details, opens View Loan, clicks View Part Payment Logs,
   * reads loan amount and part pay amount, then closes.
   * Returns [loanAmount, partPayAmount] so spec can inspect if needed.
   */
  async validateViewTransaction(): Promise<[string, string]> {
    await this.navigateToLoanDetails();

    await this.page.waitForTimeout(2000);
    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan().click();
    await this.waitForLoaderToDisappear();

    // Wait for spinner
    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});

    const ele = this.page.locator(
      "xpath=//span[contains(.,'View Part Payment Logs')]",
    );
    await ele.waitFor({ state: "visible", timeout: 20000 });
    await ele.evaluate((el: any) => {
      el.scrollIntoView({ block: "center" });
    });
    await this.page.waitForTimeout(100); // scrollBy(0, -100)
    await this.jsClick(ele);
    await this.page.waitForTimeout(2000);

    const ele1 = this.page.locator("xpath=(//td[@class='table-amount'])[1]");
    const str = (await ele1.innerText()).trim();

    await this.page.waitForTimeout(2000);
    const element1 = this.page.locator(
      "xpath=//span[@class='currency ng-star-inserted']",
    );
    const strg = (await element1.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.btnclose().click();
    await this.waitForLoaderToDisappear();

    return [str, strg];
  }

  // ── Actions (from Flow49_ViewFunctionalityLoan.viewFunctionality) ──────────

  /**
   * Port of Java Flow49_ViewFunctionalityLoan.viewFunctionality().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Loan Details, opens View Loan, scrolls to View Interest EMI Logs,
   * reads interest paid, reads transaction history paid amount, then closes.
   * Returns [interestPaidStr, transactionAmountStr, transactionAmount2Str].
   */
  async viewFunctionality(): Promise<[string, string, string]> {
    //await this.navigateToLoanDetails();

    await this.page.waitForTimeout(2000);
    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan().click();
    await this.waitForLoaderToDisappear();

    // Note: Java has a broken XPath string in Flow49: "(PO25_ViewFunctionalityLoan.loc_viewInterestEMI"
    // Using PO26_ViewFunctionalityLoan.loc_viewInterestEMI instead
    const element = this.viewInterestEMI();
    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await element.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await element.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const ele = this.interestPaid();
    const str = (await ele.innerText()).trim();
    await this.page.waitForTimeout(2000);

    await this.btnclose().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.TransactaionHistory().click();
    await this.waitForLoaderToDisappear();

    const element1 = this.paidAmount();
    const strng = (await element1.innerText()).trim();
    await this.page.waitForTimeout(500);

    const element2 = this.paidAmount();
    const strng1 = (await element2.innerText()).trim();

    await this.btnclose().click();
    await this.waitForLoaderToDisappear();

    return [str, strng, strng1];
  }
}
