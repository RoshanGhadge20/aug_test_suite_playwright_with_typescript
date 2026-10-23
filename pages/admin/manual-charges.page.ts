import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

/**
 * Port of Java: PO28_ManualChargesFunctionality (locators) + Flow38_ManualChargesFunctionality (actions)
 *
 * Methods ported:
 *   - manualCharges()  ← Flow38.manualCharges()
 *
 * Cross-page locator notes:
 *   - All navigation locators re-declared locally.
 *   - PO26_ViewFunctionalityLoan.loc_viewLoan re-declared as viewLoan.
 *
 * Omitted loginWith* calls:
 *   - Flow38.manualCharges() has no loginWith* call (session assumed). Role = appraiser.
 *
 * SoftAssert assertions translated to return values:
 *   - Returns { listEntry } so spec can assert with expect.soft(). listEntry is read from the
 *     "View Manual Charges Logs" modal (view manual charges functionality) — all 7 columns
 *     (Charge Name, Charges, Paid Amount, Balance Amount, Date, Status, Created By).
 */
export class ManualChargesPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO28_ManualChargesFunctionality) ───────────────────────

  private readonly chargeName = () =>
    this.page.locator("xpath=//input[@formcontrolname='chargeName']");
  private readonly chargeAmount = () =>
    this.page.locator("xpath=//input[@formcontrolname='charges']");
  private readonly btnAdd = () =>
    this.page.locator("xpath=//span[normalize-space()='Add']");
  private readonly charges = () =>
    this.page.locator(
      "xpath=//body[1]/div[7]/div[2]/div[1]/mat-dialog-container[1]/kt-manual-charges-dialog[1]/kt-portlet[1]/div[1]/kt-portlet-body[1]/div[1]/table[1]/tbody[1]/tr[1]/td[2]",
    );
  private readonly viewManaulCharges = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='View Manual Charges Logs']",
    );
  private readonly closeMark = () =>
    this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile (not called — session assumed; kept for navigateToLoanDetails)
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
  // PO26_ViewFunctionalityLoan.loc_viewLoan
  private readonly viewLoan = () =>
    this.page.locator("xpath=//button[normalize-space()='View Loan']");

  // ── Actions (from Flow38_ManualChargesFunctionality.manualCharges) ─────────

  /**
   * Port of Java Flow38_ManualChargesFunctionality.manualCharges().
   *
   * NOTE: No loginWith* in Java. Session is assumed (caller logged in as appraiser).
   * Profile click → branch → arrow → Loan Management → Loan Details → filter → kebab
   * → Manual Charges dialog → add charge "QA" / 100 → re-filter → View Loan → View Manual Charges Logs
   * → read first row name and amount → close.
   *
   * Returns { listEntry } — spec asserts with expect.soft().
   */
  async manualCharges(): Promise<{
    listEntry: {
      chargeName: string;
      charges: string;
      paidAmount: string;
      balanceAmount: string;
      date: string;
      status: string;
      createdBy: string;
    };
  }> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // Confirmed live: selecting any branch scope other than the appraiser account's own
    // assigned branch gets the session force-logged-out on UAT within ~3s (backend rejects
    // subsequent calls with 401/403, Angular's http interceptor redirects to /auth/login).
    // Leave the account on its default branch scope instead of calling selectOption().
    await this.branchDropdown().waitFor({ state: "visible" });
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
    // renew-zero.page.ts / full-release-offline.page.ts).
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // Confirmed live: this grid can reorder after the charge is added below (the loan we act
    // on may no longer be the "first" row), and multiple loans commonly share this generic
    // test first name — capture the specific row's unique "ID" column now so later steps can
    // relocate the SAME loan instead of blindly re-picking "first row" (same pattern as
    // rowActionButton1 in bt-loan.page.ts / zah-review.page.ts).
    const dataRows = this.page
      .getByRole("row")
      .filter({ has: this.page.getByRole("cell") });
    const loanRowId = (
      await dataRows.first().getByRole("cell").nth(1).innerText()
    ).trim();
    const rowById = (id: string) =>
      this.page.getByRole("row", { name: new RegExp(`\\b${id}\\b`) });

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();

    const targetButton = this.page.locator(
      "xpath=//button[normalize-space()='Manual Charges']",
    );
    await targetButton.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await targetButton.click();
    await this.waitForLoaderToDisappear();

    await this.chargeName().fill("QA");
    await this.chargeAmount().fill("100");
    await this.btnAdd().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    // Confirmed live: clicking "Add" saves the charge and navigates all the way back to the
    // Loan Details list — the "Manual Charges" page never inlines a history table (verified via
    // debug screenshot: re-opening it just shows the same empty Charge Name/Charge Amount form).
    // View manual charges functionality lives in the separate "View Manual Charges Logs" modal
    // below — read all 7 columns from it instead of just the first two.

    // Re-filter and open View Loan
    await this.page.waitForTimeout(5000);
    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
    // noWaitAfter: see the first filterbtn() call above.
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.jsClick(rowById(loanRowId).getByRole("button").first());
    await this.waitForLoaderToDisappear();
    await this.viewLoan().click();
    await this.waitForLoaderToDisappear();

    const targetElement = this.viewManaulCharges();
    await targetElement.waitFor({ state: "visible", timeout: 10000 });
    await targetElement.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "auto", block: "center" }),
    );
    await targetElement.click();
    await this.waitForLoaderToDisappear();

    const logRow = this.page.locator(
      "xpath=//mat-dialog-container//table/tbody/tr[1]",
    );
    await logRow.waitFor({ state: "visible", timeout: 10000 });
    const logCells = logRow.locator("td");
    const listEntry = {
      chargeName: (await logCells.nth(0).innerText()).trim(),
      charges: (await logCells.nth(1).innerText()).trim(),
      paidAmount: (await logCells.nth(2).innerText()).trim(),
      balanceAmount: (await logCells.nth(3).innerText()).trim(),
      date: (await logCells.nth(4).innerText()).trim(),
      status: (await logCells.nth(5).innerText()).trim(),
      createdBy: (await logCells.nth(6).innerText()).trim(),
    };
    await this.page.waitForTimeout(2000);
    await this.closeMark().click();
    await this.waitForLoaderToDisappear();

    return { listEntry };
  }
}
