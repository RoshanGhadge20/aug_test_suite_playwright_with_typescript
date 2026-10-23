import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

/**
 * Port of Java: PO44_EditAndViewLoanDefects (locators) + Flow66_ValidateEditAndViewLoanDefects (actions)
 *
 * Methods ported:
 *   - validatAddLoanDefects()   ← Flow66.validatAddLoanDefects() (commented in TC05 — ported)
 *   - validateEditLoanDefect()  ← Flow66.validateEditLoanDefect() (called by TC05 priority=10)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, AdminSetting, Masters re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - OMITTED. Role = admin.
 */
export class LoanDefectsPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO44_EditAndViewLoanDefects) ───────────────────────────

  private readonly loanDefects = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Defects']");
  private readonly btnEdit = () =>
    this.page.locator(
      "xpath=(//span[@class='kt-pointer text-primary ng-star-inserted'][normalize-space()='Edit'])[1]",
    );
  private readonly addErrorMessage = () =>
    this.page.locator("xpath=//i[contains(.,' Add New Error Message ')]");
  private readonly enterErrorMessage = () =>
    this.page.locator("xpath=//input[@placeholder='Enter issue']");
  private readonly btnUpdate = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly btnEditMeassge = () =>
    this.page.locator("xpath=(//img[@alt='Edit'])[13]");
  private readonly enterEditErrorMessage = () =>
    this.page.locator(
      "xpath=//input[@class='form-control ng-tns-c37-6 ng-pristine ng-valid ng-star-inserted ng-touched']",
    );

  // Cross-page re-declarations
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  private readonly branchDropdown = () =>
    this.page.locator("xpath=//select[@id='branch']");
  private readonly AdminSetting = () =>
    this.page.locator("xpath=//span[normalize-space()='Admin Settings']");
  private readonly Masters = () =>
    this.page.locator("xpath=//span[normalize-space()='Masters']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToLoanDefects(): Promise<void> {
    await this.page.waitForTimeout(7000);
    await this.profile().click();

    // NOTE: does NOT select a branch from the dropdown — confirmed live that switching this
    // account's branch scope (even to a specific named branch, not just "Show All") gets the
    // backend to reject the session outright and force a redirect to /auth/login before the
    // sidebar is even reached. Same root cause already fixed in renew-zero.page.ts. Stays on
    // whatever branch scope the account already has by default.
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);

    // jsClick() already waits up to 30s for visibility and scrolls into view itself — the
    // preceding .evaluate(scrollIntoView) calls that used to sit here were redundant AND
    // bound by the tight global 10s actionTimeout, so they timed out (element not rendered
    // yet right after the branch-dropdown change) before jsClick's own generous wait ever
    // got a chance to run.
    // Scoped to the sidebar menu specifically — the bare span[text()='Settings'] also
    // matches an unrelated "Settings" link in the header (#kt_header), causing a strict-mode
    // violation (same fix as gold-rate.page.ts's Setting() locator).
    const settingsEle = this.page.locator(
      "xpath=//div[@id='kt_aside_menu']//span[normalize-space()='Settings']",
    );
    // "Settings" is a collapsible sidebar menu — only click it if its submenu isn't already
    // expanded. Confirmed live: this method runs twice per test (validatAddLoanDefects() then
    // validateEditLoanDefect()), and clicking an already-expanded "Settings" a second time
    // toggles it CLOSED, hiding "Admin Settings" instead of revealing it.
    if (!(await this.AdminSetting().isVisible())) {
      await this.jsClick(settingsEle);
    }

    await this.page.waitForTimeout(1000);
    // Same idempotency issue one level deeper: "Admin Settings" and "Masters" are also
    // collapsible toggles — only click each if its own submenu isn't already expanded from
    // the previous call to this method.
    if (!(await this.Masters().isVisible())) {
      await this.AdminSetting().click();
    }
    await this.page.waitForTimeout(500);
    if (!(await this.loanDefects().isVisible())) {
      await this.Masters().click();
    }
    await this.page.waitForTimeout(500);

    // "Loan Defects" is the last item of the expanded Masters list and can sit under the floating
    // "Tech Support" button; jsClick() force-clicks at screen coordinates and would hit that
    // button instead (same failure as waiver-type.page.ts). Click the element directly instead.
    const loanDefectsEl = this.loanDefects();
    await loanDefectsEl.waitFor({ state: "attached", timeout: 30000 });
    await loanDefectsEl.evaluate((el: HTMLElement) => {
      el.scrollIntoView({ block: "center" });
      el.click();
    });
    await this.waitForLoaderToDisappear();
  }

  // ── Actions (from Flow66_ValidateEditAndViewLoanDefects) ──────────────────

  /**
   * Port of Java Flow66_ValidateEditAndViewLoanDefects.validatAddLoanDefects().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   */
  async validatAddLoanDefects(): Promise<void> {
    await this.navigateToLoanDefects();

    await this.btnEdit().click();
    await this.addErrorMessage().click();
    await this.page.waitForTimeout(5000);
    await this.enterErrorMessage().fill("Incorrect adhar Number");
    await this.btnUpdate().click();
  }

  /**
   * Port of Java Flow66_ValidateEditAndViewLoanDefects.validateEditLoanDefect().
   * Called by TC05 priority=10.
   */
  async validateEditLoanDefect(): Promise<void> {
    await this.navigateToLoanDefects();

    await this.btnEdit().click();

    const ele2 = this.btnEditMeassge();
    await ele2.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(ele2);

    await this.page.waitForTimeout(5000);
    // Targets the input within the same row as the clicked Edit icon, rather than searching
    // the whole page for an `ng-reflect-model` attribute — that attribute is an Angular
    // dev-mode debug artifact, absent from this app's production build (confirmed: no other
    // page object in this codebase relies on ng-reflect-*, and the locator never matched live).
    // Clicking the pencil swaps that row's Edit icon for an inline textbox plus a green
    // "Correct" (✓) icon (confirmed from the failure snapshot), so the Edit icon (ele2) no longer
    // exists afterwards and anything anchored on it can't resolve. Find the row being edited
    // by its "Correct" icon instead.
    const editingRow = this.page
      .locator("xpath=//tr[.//img[@alt='Correct']]")
      .first();
    await editingRow.waitFor({ state: "visible", timeout: 15000 });
    const editInput = editingRow.locator("xpath=.//input").first();
    await editInput.clear();
    await editInput.fill("New IGL");
    await editingRow.locator("xpath=.//img[@alt='Correct']").click();
    await this.page.waitForTimeout(2000);
    await this.btnUpdate().click();
  }
}
