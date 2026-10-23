import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import fs from "fs";

/**
 * Port of Java: PO07_OpsTeamLoanApproval (locators) + Flow07_OpsLoanpproval (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator from Flow07.
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `btnNext` re-declares PO04_NewGoldLoan.loc_btnNext (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow07_OpsLoanpproval.opsAprroval() called Flow_LoginLogout.loginWithOPS() —
 *     OMITTED. Role switching must be handled by the caller via loginAs('opsTeam').
 */
export class OpsApprovalPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO07_OpsTeamLoanApproval) ──────────────────────────────

  private readonly btnOPSTeam = () =>
    this.page.locator("xpath=//button[normalize-space()='OPS TEAM RATING']");
  private readonly btnApprove = () =>
    this.page.locator("xpath=//span[normalize-space()='Approve']");
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
  private readonly txtArea = () =>
    this.page.locator(
      "xpath=//textarea[@formcontrolname='commentByOperatinalTeam']",
    );
  private readonly submit = () =>
    this.page.locator("xpath=(//span[@class='mat-button-wrapper'])[4]");
  private readonly selAtatus = () =>
    this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForOperatinalTeam']",
    );
  private readonly txtarea = () =>
    this.page.locator(
      "xpath=//textarea[@formcontrolname='commentByOperatinalTeam']",
    );
  private readonly btnSubmit = () =>
    this.page.locator("xpath=(//span[@class='mat-button-wrapper'])[2]");
  private readonly partnerApproval = () =>
    this.page.locator(
      "xpath=(//button[normalize-space()='PARTNER APPROVAL'])[1]",
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
  private readonly textField = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
  // Inline branch dropdown from Flow07
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
  // PO04_NewGoldLoan.loc_btnNext — some loan records render more than one accordion
  // section already expanded (e.g. Basic Details + Nominee Details both showing a "Next"
  // button at once), so scope to .first() to avoid a strict-mode violation.
  private readonly btnNext = () =>
    this.page
      .locator("xpath=//button[span[normalize-space() = 'Next']]")
      .first();

  // ── Actions (from Flow07_OpsLoanpproval) ──────────────────────────────────

  /**
   * Port of Java Flow07_OpsLoanpproval.opsAprroval().
   *
   * NOTE: loginWithOPS() call is OMITTED.
   * Role switching must be handled by the caller via loginAs('opsTeam').
   */
  async opsAprroval(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // Confirmed live: selecting any branch scope other than the account's own assigned
    // branch gets the session force-logged-out on UAT within ~3s (backend rejects
    // subsequent calls with 401/403, Angular's http interceptor redirects to /auth/login).
    // Leave the account on its default branch scope instead of calling selectOption().
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    // Read the JSON fresh: the static `import customerData` is resolved once at module load, so
    // it holds the PREVIOUS run's customer ID (onboarding rewrites this file during the run) and
    // the filter returns "No data found".
    const currentCustomer = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    const customerId = String(currentCustomer.customerId).trim();
    await this.textField().fill(customerId);
    console.log(customerId);
    // await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Confirmed live: this table keeps re-rendering continuously (likely polling for status
    // updates), so ANY stability-polling action hangs — not just click()'s own check, but even
    // jsClick()'s scrollIntoViewIfNeeded() step before the force-click times out the same way.
    // Bypass stability polling entirely: scroll via evaluate() (no wait) then force-click.
    const filterBtn = this.filterbtn();
    await filterBtn.waitFor({ state: "attached", timeout: 15000 });
    await filterBtn.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await filterBtn.click({ force: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.clickFirstUnlockedOpsTeamRating();
    await this.waitForLoaderToDisappear();

    // safeClick(PO04_NewGoldLoan.loc_btnNext) × 5
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext());

    await this.page.waitForTimeout(5000);
    //await this.btnApprove().click();
    // await this.waitForLoaderToDisappear();
    // await this.btnYes().click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(2000);

    // await this.txtArea().fill("Verified");
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(5000);

    // await this.submit().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(1000);

    await this.page.waitForTimeout(5000);

    // The wizard gained extra tabs (Packets, Upload Documents) so a fixed number of Next clicks
    // stops short of the Loan Status Approval tab. Keep clicking Next until the rating icon shows.
    const incorrectAppForm = this.page.locator(
      "xpath=//img[@name='incorrectApplicationFormForOperatinalTeam']",
    );
    for (let i = 0; i < 6; i++) {
      if (await incorrectAppForm.isVisible().catch(() => false)) break;
      await this.safeScrollAndClick();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(3000);
    }
    await incorrectAppForm.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.page
      .locator("xpath=//img[@name='incorrectGoldValuationForOperatinalTeam']")
      .click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForOperatinalTeam']",
    );
    await selectStatusDropdown.selectOption({ label: "Approved" });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
  }

  async clickFirstUnlockedOpsTeamRating(): Promise<void> {
    const buttons = this.btnOPSTeam();
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      try {
        await buttons.nth(i).click({ timeout: 5000 });
        return;
      } catch {
        // Locked row — the lock icon intercepts pointer events. Try the next candidate.
      }
    }
    throw new Error(
      `No clickable "OPS TEAM RATING" button found among ${count} candidates — all appear locked by another session.`,
    );
  }

  async safeScrollAndClick(): Promise<void> {
    const locator = this.btnNext();
    const hasNext = await locator
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!hasNext) {
      return;
    }

    try {
      await locator.click();
    } catch {
      await locator.click();
    }
  }
}
