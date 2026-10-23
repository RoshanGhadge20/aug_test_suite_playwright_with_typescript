import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

/**
 * Port of Java: PO41_AddAndEditKarat (locators) + Flow63_ValidateAddKaratFunctionality (actions)
 *
 * Methods ported:
 *   - validateAddKarat()  ← Flow63.validateAddKarat() (commented in TC05 — ported for completeness)
 *   - validateEditKarat() ← Flow63.validateEditKarat() (commented in TC05 — ported for completeness)
 *   - deleteKarat()        ← Flow63.deleteKarat() (called by TC05 priority=7)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, AdminSetting, Masters re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - validateEditKarat() and deleteKarat() called Flow_LoginLogout.login() — OMITTED.
 */
export class KaratPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO41_AddAndEditKarat) ─────────────────────────────────

  private readonly Karat = () =>
    this.page.locator("xpath=//span[normalize-space()='Karat']");
  private readonly AddKaratDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='Add Karat Details']");
  private readonly KaratDetails = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Karat Details']");
  private readonly PercentageFrom = () =>
    this.page.locator("xpath=//input[@placeholder='from %']");
  private readonly PercentageTo = () =>
    this.page.locator("xpath=//input[@placeholder='To %']");
  private readonly RadioHallmark = () =>
    this.page.locator("xpath=//div[@class='mat-slide-toggle-thumb']");
  private readonly btnAdd = () =>
    this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
  private readonly btnEdit = () =>
    this.page.locator("xpath=(//div[contains(text(),'Edit')])[1]");
  private readonly btnUpdate = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly btnDelete = () =>
    this.page.locator("xpath=(//div[contains(text(),'Delete')])[1]");
  private readonly btnYes = () =>
    this.page.locator("xpath=//button[@type='submit']");

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

  private async navigateToKarat(): Promise<void> {
    await this.page.waitForTimeout(7000);
    await this.profile().click();

    // NOTE: does NOT select a branch from the dropdown — confirmed live (renew-zero.page.ts,
    // loan-defects.page.ts) that switching this account's branch scope (even to a specific
    // named branch, not just "Show All") gets the backend to reject the session outright
    // (403/401, forced redirect to /auth/login) before the sidebar is even reached.
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);

    // jsClick() already waits up to 30s for visibility and scrolls into view itself — a
    // preceding .evaluate(scrollIntoView) call bound by the tight global 10s actionTimeout
    // was timing out here (element not rendered yet right after the branch-dropdown change)
    // before jsClick's own generous wait ever got a chance to run (same fix as
    // loan-defects.page.ts). Also scoped to the sidebar menu specifically — the bare
    // span[text()='Settings'] also matches an unrelated "Settings" link in the header
    // (#kt_header), causing a strict-mode violation.
    const settingsEle = this.page.locator(
      "xpath=//div[@id='kt_aside_menu']//span[normalize-space()='Settings']",
    );
    await this.jsClick(settingsEle);

    await this.page.waitForTimeout(1000);
    await this.AdminSetting().click();
    await this.Masters().click();
    await this.Karat().click();
  }

  /**
   * validateEditKarat()/deleteKarat() originally relied on validateAddKarat() having already
   * left the browser on the Karat list. When that step is skipped (as in TC05 now) the app is
   * still on the dashboard (confirmed from the failure screenshot), so open the Karat page
   * first unless its "Add Karat Details" button is already showing.
   */
  private async ensureOnKaratPage(): Promise<void> {
    const onKaratPage = await this.AddKaratDetails()
      .waitFor({ state: "visible", timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (!onKaratPage) {
      await this.navigateToKarat();
      await this.AddKaratDetails().waitFor({ state: "visible", timeout: 15000 });
    }
    await this.waitForLoaderToDisappear();
  }

  // ── Actions (from Flow63_ValidateAddKaratFunctionality) ───────────────────

  /**
   * Port of Java Flow63_ValidateAddKaratFunctionality.validateAddKarat().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   */
  async validateAddKarat(): Promise<void> {
    await this.navigateToKarat();

    await this.AddKaratDetails().click();
    await this.page.waitForTimeout(3000);
    await this.KaratDetails().fill("11");
    await this.RadioHallmark().click();
    await this.PercentageFrom().fill("1");
    await this.page.waitForTimeout(1000);
    await this.PercentageTo().fill("5");
    await this.btnAdd().click();
  }

  /**
   * Port of Java Flow63_ValidateAddKaratFunctionality.validateEditKarat().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   * NOTE: login() at start OMITTED. Caller handles session.
   */
  async validateEditKarat(): Promise<void> {
    await this.ensureOnKaratPage();

    const element = this.btnEdit();
    await element.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(element);

    await this.KaratDetails().fill("18");
    await this.btnUpdate().click();
  }

  /**
   * Port of Java Flow63_ValidateAddKaratFunctionality.deleteKarat().
   * Called by TC05 priority=7.
   * NOTE: login() at start OMITTED. Caller handles session.
   */
  async deleteKarat(): Promise<void> {
    await this.ensureOnKaratPage();

    const element = this.btnDelete();
    await element.waitFor({ state: "attached", timeout: 30000 });
    await element.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(element);

    await this.btnYes().click();
  }
}
