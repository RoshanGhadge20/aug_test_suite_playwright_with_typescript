import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

/**
 * Port of Java: PO43_AddAndEditWavierType (locators) + Flow65_ValidateAddAndEditWavierType (actions)
 *
 * Methods ported:
 *   - validateAddWavierType()    ← Flow65.validateAddWavierType() (commented in TC05 — ported)
 *   - validateEditType()         ← Flow65.validateEditType() (commented in TC05 — ported)
 *   - validateDeleteWavierType() ← Flow65.validateDeleteWavierType() (called by TC05 priority=9)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, AdminSetting, Masters re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - OMITTED. Role = admin.
 *
 * Note: Java typo "Wavier" preserved verbatim per porting rules.
 */
export class WaiverTypePage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO43_AddAndEditWavierType) ─────────────────────────────

  private readonly WavierType = () =>
    this.page.locator("xpath=//span[normalize-space()='Waiver Type']");
  private readonly AddWavierType = () =>
    this.page.locator("xpath=//span[normalize-space()='Add Waiver Type']");
  private readonly EnteringWavierType = () =>
    this.page.locator("xpath=//input[@formcontrolname='waiverType']");
  private readonly btnAdd = () =>
    this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
  private readonly btnEdit = () =>
    this.page.locator(
      "xpath=(//div[@class='kt-pointer ng-star-inserted'][normalize-space()='Edit'])[3]",
    );
  private readonly btnUpadte = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly btnDelete = () =>
    this.page.locator(
      "xpath=(//div[@class='kt-pointer text-danger ng-star-inserted'][normalize-space()='Delete'])[3]",
    );
  private readonly btnYes = () =>
    this.page.locator("xpath=(//button[@type='submit'])[1]");

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

  private async navigateToWavierType(): Promise<void> {
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
    await this.page.waitForTimeout(500);

    // "Waiver Type" sits at the bottom of the expanded Masters list, directly underneath the
    // floating "Tech Support" button (confirmed from the failure screenshot). jsClick() is a
    // coordinate-based forced click, so it lands on Tech Support instead and the page never
    // navigates. Dispatch the click on the element itself (no coordinates) and retry until the
    // Waiver Type page's "Add Waiver Type" button actually shows.
    const wavierElement = this.WavierType();
    await wavierElement.waitFor({ state: "attached", timeout: 30000 });
    for (let attempt = 1; attempt <= 3; attempt++) {
      await wavierElement.evaluate((el: HTMLElement) => {
        el.scrollIntoView({ block: "center" });
        el.click();
      });
      await this.waitForLoaderToDisappear();
      const opened = await this.AddWavierType()
        .waitFor({ state: "visible", timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      if (opened) return;
      console.log(`Waiver Type page not open yet (attempt ${attempt}/3) — clicking again.`);
    }
    await this.AddWavierType().waitFor({ state: "visible", timeout: 10000 });
  }

  // ── Actions (from Flow65_ValidateAddAndEditWavierType) ────────────────────

  /**
   * Port of Java Flow65_ValidateAddAndEditWavierType.validateAddWavierType().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   */
  async validateAddWavierType(): Promise<void> {
    await this.navigateToWavierType();

    await this.page.waitForTimeout(1000);
    await this.AddWavierType().click();
    await this.page.waitForTimeout(1000);
    await this.EnteringWavierType().fill("Demo Test");
    await this.btnAdd().click();
    await this.page.waitForTimeout(5000);
    await this.validateEditType();
    await this.page.waitForTimeout(5000);
    await this.validateDeleteWavierType();
  }

  /**
   * Port of Java Flow65_ValidateAddAndEditWavierType.validateEditType().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   */
  async validateEditType(): Promise<void> {
    //await this.navigateToWavierType();

    await this.btnEdit().click();
    await this.page.waitForTimeout(1000);
    await this.EnteringWavierType().fill("Demo");
    await this.btnUpadte().click();
  }

  /**
   * Port of Java Flow65_ValidateAddAndEditWavierType.validateDeleteWavierType().
   * Called by TC05 priority=9.
   */
  async validateDeleteWavierType(): Promise<void> {
    // await this.navigateToWavierType();

    await this.btnDelete().click();
    await this.page.waitForTimeout(1000);
    await this.btnYes().click();
  }
}
