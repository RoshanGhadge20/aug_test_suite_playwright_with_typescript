import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { TestDataFactory } from "../../utils/data/test-data.factory";

/**
 * Port of Java: PO38_AddNewScheme (locators) + Flow59_ValidateAddNewScheme (actions)
 *
 * Methods ported:
 *   - validateAddNewScheme()  ← Flow59.validateAddNewScheme()
 *   - validateViewScheme()    ← Flow59.validateViewScheme() (not called by TC05 — ported for completeness)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, AdminSetting re-declared locally.
 *   - PO39_UpdateRPG.loc_btnView / loc_btnPartnerName / loc_schemeType re-declared.
 *
 * Omitted loginWith... logout calls:
 *   - OMITTED. Role = admin.
 */
export class AddSchemePage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO38_AddNewScheme) ────────────────────────────────────

  private readonly SchemeConfiguration = () =>
    this.page.locator("xpath=//span[normalize-space()='Scheme Configuration']");
  private readonly btnAddNewScheme = () =>
    this.page.locator("xpath=//span[normalize-space()='Add New Scheme']");
  private readonly PartnerName = () =>
    this.page.locator("xpath=//select[@formcontrolname='partnerId']");
  private readonly SchemeName = () =>
    this.page.locator("xpath=//input[@placeholder='Express Gold Loan']");
  private readonly BasicDescription = () =>
    this.page.locator("xpath=//textarea[@placeholder='Description']");
  private readonly SelSchemeType = () =>
    this.page.locator("xpath=//select[@formcontrolname='schemeType']");
  private readonly SelCustomerType = () =>
    this.page.locator("xpath=//select[@formcontrolname='customerType']");
  private readonly MinKarat = () =>
    this.page.locator("xpath=//select[@formcontrolname='minKarat']");
  private readonly MaxKarat = () =>
    this.page.locator("xpath=//select[@formcontrolname='maxKarat']");
  private readonly DayInyear = () =>
    this.page.locator("xpath=//input[@formcontrolname='daysInYear']");
  private readonly radioOneTimeProcessing = () =>
    this.page.locator(
      "xpath=//label[@for='mat-slide-toggle-510-input']//div[@class='mat-slide-toggle-thumb']",
    );
  private readonly RadioPreClosureFees = () =>
    this.page.locator(
      "xpath=//label[@for='mat-slide-toggle-511-input']//div[@class='mat-slide-toggle-thumb']",
    );
  private readonly RadioToggleOn = () =>
    this.page.locator(
      "xpath=//label[@for='mat-slide-toggle-512-input']//div[@class='mat-slide-toggle-thumb']",
    );
  private readonly btnNext = () =>
    this.page.locator("xpath=//button[normalize-space()='Next']");
  // Current live "Add New Scheme" modal (2026-07-08 screenshots) — a multi-step wizard, not
  // the single-page form the rest of this file's locators were originally ported for.
  private readonly SelAccountingStandard = () =>
    this.page.locator(
      "xpath=//*[normalize-space()='Accounting Standard']/following::select[1]",
    );
  private readonly LoanPurposeTypeDropdown = () =>
    this.page
      .locator("xpath=//*[normalize-space()='Loan Purpose Type']")
      .last();
  private readonly MinLoanAmountLac = () =>
    this.page.locator("xpath=//input[@placeholder='From e.g. 1 or 1.5']");
  private readonly MaxLoanAmountLac = () =>
    this.page.locator("xpath=//input[@placeholder='To e.g. 2']");
  private readonly InternalBranchDropdown = () =>
    this.page.locator("xpath=//*[normalize-space()='Internal Branch']").last();
  
  private readonly SchemeLtv = () =>
    this.page.locator(
      "xpath=//*[normalize-space()='Accounting Standard']/following::select[2]",
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
  // PO39_UpdateRPG locators used in validateViewScheme
  private readonly loc_btnView = () =>
    this.page.locator(
      "xpath=//div[@id='s406']//span[@class='material-icons kt-pointer'][normalize-space()='visibility']",
    );
  private readonly loc_btnPartnerName = () =>
    this.page.locator("xpath=//input[@formcontrolname='partnerId']");
  private readonly loc_schemeType = () =>
    this.page.locator("xpath=//select[@formcontrolname='schemeType']");
  private readonly schemeCardHeading = (schemeName: string) =>
    this.page.locator(`xpath=//h5[normalize-space()='${schemeName.toUpperCase()}']`);
  private readonly schemeEditIcon = (schemeName: string) =>
    this.page.locator(
      `xpath=//h5[normalize-space()='${schemeName.toUpperCase()}']/following::img[1]`,
    );
  private readonly partnerTab = (partnerName: string) =>
    this.page.getByRole("tab", {
      name: new RegExp(`^${partnerName}$`, "i"),
    });
  // Port of Java Flow61_CheckActiveAndDeactiveFunctionality — takes the first scheme card's
  // status toggle (Java hardcodes index [1] too; there's no per-scheme-name locator in the
  // original PO38/PO39 either).
  private readonly schemeStatusToggle = () =>
    this.page.locator(
      "xpath=(//input[contains(@class,'mat-slide-toggle-input')])[1]",
    );
  private readonly confirmYesBtn = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
  private readonly rpgUpdateBtn = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Update']]");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToSchemeConfiguration(): Promise<void> {
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
    //
    // This method runs twice per test (validateAddNewScheme, then validateViewScheme). The
    // sidebar "Settings" section is a TOGGLE, not a plain expand — confirmed live (same bug as
    // loan-defects.page.ts): clicking it unconditionally on the second call collapses the
    // already-expanded section, hiding "Admin Settings" underneath and timing out the next
    // click. Guard each toggle click with an isVisible() check on its target submenu.
    const settingsEle = this.page.locator(
      "xpath=//div[@id='kt_aside_menu']//span[normalize-space()='Settings']",
    );
    if (!(await this.AdminSetting().isVisible())) {
      await this.jsClick(settingsEle);
    }

    await this.page.waitForTimeout(1000);
    if (!(await this.SchemeConfiguration().isVisible())) {
      await this.AdminSetting().click();
    }
    await this.page.waitForTimeout(500);
    await this.SchemeConfiguration().click();
  }

  async validateAddNewScheme(): Promise<string> {
    const schemeName = `Automation_Test${TestDataFactory.stamp()}`;

    await this.navigateToSchemeConfiguration();
    const addSchemeBtn = this.page.getByRole("button", {
      name: "Add New Scheme",
    });
    await addSchemeBtn.waitFor({ state: "visible", timeout: 20000 });
    await addSchemeBtn.scrollIntoViewIfNeeded();
    await addSchemeBtn.click();
    await this.page.waitForTimeout(5000);
    await this.PartnerName().selectOption({ label: "Kharatmol Sk" });
    await this.page.waitForTimeout(1000);
    await this.SchemeName().fill(schemeName);
    await this.BasicDescription().fill(schemeName);
    await this.page.waitForTimeout(1000);
    await this.SelSchemeType().selectOption({ label: "Secured" });
    await this.page.waitForTimeout(1000);
    await this.SelAccountingStandard().selectOption({ index: 1 });
    await this.page.waitForTimeout(1000);
    await this.jsClick(this.InternalBranchDropdown());
    const branchOptions = this.page.locator(
      "xpath=//div[contains(@class,'ng-option')]",
    );
    await branchOptions.first().waitFor({ state: "visible", timeout: 10000 });
    const augmontBranchOption = branchOptions.filter({ hasText: /Augmont/i });
    await augmontBranchOption.first().click();
    await this.page.waitForTimeout(500);

    // "Scheme LTV(%)" is a required native select.
    await this.SchemeLtv().selectOption({ label: "85" });
    await this.page.waitForTimeout(500);

    // "Loan Type" already shows a default chip ("Fresh Loan (+5)") in the live UI — left as-is.
    await this.SelCustomerType().selectOption({ label: "Active Customer" });
    await this.page.waitForTimeout(500);
    await this.jsClick(this.LoanPurposeTypeDropdown());
    const purposeOptions = this.page.locator(
      "xpath=//div[contains(@class,'ng-option')]",
    );
    await purposeOptions.first().waitFor({ state: "visible", timeout: 10000 });
    await purposeOptions.first().click();
    await this.page.waitForTimeout(500);

    await this.MinLoanAmountLac().fill("1");
    await this.MaxLoanAmountLac().fill("2");
    await this.MinKarat().selectOption({ label: "18 K" });
    await this.page.waitForTimeout(1000);
    await this.MaxKarat().selectOption({ label: "22 K HM" });
    await this.DayInyear().fill("360");
    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(2000);
    const interestTab = this.page.getByRole("tab", {
      name: "Interest & Dates",
    });
    const advancedPastBasicInfo = await interestTab
      .isEnabled()
      .catch(() => false);
    if (!advancedPastBasicInfo) {
      const requiredAlerts = await this.page
        .locator("xpath=//*[normalize-space()='Required field']")
        .allTextContents();
      throw new Error(
        `Add New Scheme: still on "Basic Info" tab after clicking Next — required fields not ` +
          `satisfied (${requiredAlerts.length} alert(s) present).`,
      );
    }
    await this.page
      .locator(
        "xpath=//mat-radio-button[.//text()[normalize-space()='Simple']]",
      )
      .click();
    await this.page.waitForTimeout(500);

    const interestDatesPanel = this.page.getByRole("tabpanel", {
      name: "Interest & Dates",
    });
    const loanTenure = interestDatesPanel.locator("select").nth(0);
    await loanTenure.selectOption({ label: "360" });
    await this.page.waitForTimeout(1000);

    const interestPerMonth = interestDatesPanel.getByRole("spinbutton").first();
    await interestPerMonth.fill("1");
    await this.page.waitForTimeout(500);
    const billingCycle = interestDatesPanel.locator("select").nth(1);
    await billingCycle
      .locator("option")
      .nth(1)
      .waitFor({ state: "attached", timeout: 10000 });
    await billingCycle.selectOption({ index: 1 });
    await this.page.waitForTimeout(500);

    await this.jsClick(this.btnNext());
    await this.page.waitForTimeout(2000);
    const chargesPanel = this.page.getByRole("tabpanel", {
      name: "Charges & Penalties",
    });
    const chargesPercent = chargesPanel.getByRole("spinbutton").nth(0);
    const gracePeriodDays = chargesPanel.getByRole("spinbutton").nth(1);
    await chargesPercent.fill("2");
    await gracePeriodDays.fill("3");
    await this.page.waitForTimeout(500);

  
    const addBtn = this.page.getByRole("button", { name: "Add", exact: true });
    await addBtn.waitFor({ state: "visible", timeout: 10000 });
    await addBtn.click();
    await this.page.waitForTimeout(1000);

    const confirmYes = this.page.getByRole("button", {
      name: "Yes",
      exact: true,
    });
    await confirmYes.waitFor({ state: "visible", timeout: 10000 });
    await confirmYes.click();
    await this.page.waitForTimeout(2000);
    const modalHeading = this.page.getByRole("heading", {
      name: "Add New Scheme",
    });
    const stillOpen = await modalHeading.isVisible().catch(() => false);
    if (stillOpen) {
      throw new Error(
        'Add New Scheme: modal still open after clicking "Add" — submit likely failed validation.',
      );
    }

    return schemeName;
  }

  async validateViewScheme(): Promise<{
    partnerNameVisible: boolean;
    schemeTypeVisible: boolean;
  }> {
    await this.navigateToSchemeConfiguration();

    await this.loc_btnView().click();

    const partnerNameEl = this.loc_btnPartnerName();
    const partnerNameVisible = await partnerNameEl.isVisible();

    const schemeTypeEl = this.loc_schemeType();
    const schemeTypeVisible = await schemeTypeEl.isVisible();
    await this.page.locator("xpath=//img[contains(@src,'cancel.svg')]").click();
    await this.page.waitForTimeout(500);
    return { partnerNameVisible, schemeTypeVisible };
  }

  async validateEditScheme(schemeName: string): Promise<string> {
    await this.navigateToSchemeConfiguration();

    await this.partnerTab("Kharatmol Sk").click();
    await this.page.waitForTimeout(1000);
    const searchBox = this.page.locator("xpath=//input[@placeholder='enter text here']");
    await searchBox.waitFor({ state: "visible", timeout: 10000 });
    await searchBox.fill(schemeName);
    await this.page.waitForTimeout(2000);

    await this.schemeCardHeading(schemeName).waitFor({
      state: "visible",
      timeout: 15000,
    });
    await this.schemeEditIcon(schemeName).click();
    await this.page.waitForTimeout(2000);

    const editLtv = this.page.locator(
      "xpath=//*[normalize-space()='Scheme LTV (%):']/following::select[1]",
    );
    await editLtv.waitFor({ state: "visible", timeout: 10000 });
    const currentValue = await editLtv.inputValue();
    const newValue = currentValue === "80" ? "75" : "80";
    await editLtv.selectOption({ label: newValue });
    await this.page.waitForTimeout(500);

    const updateBtn = this.page.getByRole("button", { name: "Update", exact: true });
    await updateBtn.waitFor({ state: "visible", timeout: 10000 });
    await updateBtn.click();
    await this.page.waitForTimeout(1000);

    const confirmYes = this.page.getByRole("button", { name: "Yes", exact: true });
    if (await confirmYes.isVisible().catch(() => false)) {
      await confirmYes.click();
      await this.page.waitForTimeout(2000);
    }

    const modalHeading = this.page.getByRole("heading", { name: "Edit Scheme Details" });
    const stillOpen = await modalHeading.isVisible().catch(() => false);
    if (stillOpen) {
      throw new Error(
        'Edit Scheme: modal still open after clicking "Update" — submit likely failed validation.',
      );
    }

    return newValue;
  }

  /**
   * Port of Java Flow61_CheckActiveAndDeactiveFunctionality.validateCheckActiveAndDeactive().
   * Round-trip: toggle the first scheme's status off, confirm, Update, then toggle it back on
   * and confirm again — leaves the scheme's status unchanged overall.
   *
   * Returns the toggle's checked state at each stage for spec assertions.
   */
  async validateActiveAndDeactiveScheme(): Promise<{
    initialState: boolean;
    toggledState: boolean;
    finalState: boolean;
  }> {
    await this.navigateToSchemeConfiguration();

    const toggle = this.schemeStatusToggle();
    await toggle.waitFor({ state: "visible", timeout: 15000 });
    const initialState = await toggle.isChecked();

    await this.jsClick(toggle);
    await this.page.waitForTimeout(1000);
    await this.confirmYesBtn().click();
    await this.page.waitForTimeout(1000);
    await this.rpgUpdateBtn().click();
    await this.page.waitForTimeout(1000);

    const toggledState = await toggle.isChecked();

    await toggle.waitFor({ state: "visible", timeout: 15000 });
    await this.jsClick(toggle);
    await this.page.waitForTimeout(5000);
    await this.confirmYesBtn().click();
    await this.page.waitForTimeout(1000);

    const finalState = await toggle.isChecked();

    return { initialState, toggledState, finalState };
  }
}
