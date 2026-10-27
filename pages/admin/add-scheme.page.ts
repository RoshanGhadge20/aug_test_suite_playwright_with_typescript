import { Locator, Page } from "@playwright/test";
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
  // ── Locators (from PO38_AddNewScheme + cross-page re-declarations) ───────
  private readonly SchemeConfiguration: Locator;
  private readonly btnAddNewScheme: Locator;
  private readonly PartnerName: Locator;
  private readonly SchemeName: Locator;
  private readonly BasicDescription: Locator;
  private readonly SelSchemeType: Locator;
  private readonly SelCustomerType: Locator;
  private readonly MinKarat: Locator;
  private readonly MaxKarat: Locator;
  private readonly DayInyear: Locator;
  private readonly radioOneTimeProcessing: Locator;
  private readonly RadioPreClosureFees: Locator;
  private readonly RadioToggleOn: Locator;
  private readonly btnNext: Locator;
  private readonly SelAccountingStandard: Locator;
  private readonly LoanPurposeTypeDropdown: Locator;
  private readonly MinLoanAmountLac: Locator;
  private readonly MaxLoanAmountLac: Locator;
  private readonly InternalBranchDropdown: Locator;
  private readonly SchemeLtv: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly AdminSetting: Locator;
  private readonly loc_btnView: Locator;
  private readonly loc_btnPartnerName: Locator;
  private readonly loc_schemeType: Locator;
  private readonly schemeStatusToggle: Locator;
  private readonly confirmYesBtn: Locator;
  private readonly rpgUpdateBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.SchemeConfiguration = this.page.locator(
      "xpath=//span[normalize-space()='Scheme Configuration']",
    );
    this.btnAddNewScheme = this.page.locator(
      "xpath=//span[normalize-space()='Add New Scheme']",
    );
    this.PartnerName = this.page.locator(
      "xpath=//select[@formcontrolname='partnerId']",
    );
    this.SchemeName = this.page.locator(
      "xpath=//input[@placeholder='Express Gold Loan']",
    );
    this.BasicDescription = this.page.locator(
      "xpath=//textarea[@placeholder='Description']",
    );
    this.SelSchemeType = this.page.locator(
      "xpath=//select[@formcontrolname='schemeType']",
    );
    this.SelCustomerType = this.page.locator(
      "xpath=//select[@formcontrolname='customerType']",
    );
    this.MinKarat = this.page.locator(
      "xpath=//select[@formcontrolname='minKarat']",
    );
    this.MaxKarat = this.page.locator(
      "xpath=//select[@formcontrolname='maxKarat']",
    );
    this.DayInyear = this.page.locator(
      "xpath=//input[@formcontrolname='daysInYear']",
    );
    this.radioOneTimeProcessing = this.page.locator(
      "xpath=//label[@for='mat-slide-toggle-510-input']//div[@class='mat-slide-toggle-thumb']",
    );
    this.RadioPreClosureFees = this.page.locator(
      "xpath=//label[@for='mat-slide-toggle-511-input']//div[@class='mat-slide-toggle-thumb']",
    );
    this.RadioToggleOn = this.page.locator(
      "xpath=//label[@for='mat-slide-toggle-512-input']//div[@class='mat-slide-toggle-thumb']",
    );
    this.btnNext = this.page.locator(
      "xpath=//button[normalize-space()='Next']",
    );
    this.SelAccountingStandard = this.page.locator(
      "xpath=//*[normalize-space()='Accounting Standard']/following::select[1]",
    );
    this.LoanPurposeTypeDropdown = this.page
      .locator("xpath=//*[normalize-space()='Loan Purpose Type']")
      .last();
    this.MinLoanAmountLac = this.page.locator(
      "xpath=//input[@placeholder='From e.g. 1 or 1.5']",
    );
    this.MaxLoanAmountLac = this.page.locator(
      "xpath=//input[@placeholder='To e.g. 2']",
    );
    this.InternalBranchDropdown = this.page
      .locator("xpath=//*[normalize-space()='Internal Branch']")
      .last();
    this.SchemeLtv = this.page.locator(
      "xpath=//*[normalize-space()='Accounting Standard']/following::select[2]",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator("xpath=//select[@id='branch']");
    this.AdminSetting = this.page.locator(
      "xpath=//span[normalize-space()='Admin Settings']",
    );
    this.loc_btnView = this.page.locator(
      "xpath=//div[@id='s406']//span[@class='material-icons kt-pointer'][normalize-space()='visibility']",
    );
    this.loc_btnPartnerName = this.page.locator(
      "xpath=//input[@formcontrolname='partnerId']",
    );
    this.loc_schemeType = this.page.locator(
      "xpath=//select[@formcontrolname='schemeType']",
    );
    this.schemeStatusToggle = this.page.locator(
      "xpath=(//input[contains(@class,'mat-slide-toggle-input')])[1]",
    );
    this.confirmYesBtn = this.page.locator(
      "xpath=//span[normalize-space()='Yes']",
    );
    this.rpgUpdateBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Update']]",
    );
  }

  // Locators that depend on a runtime value stay as methods.
  private readonly schemeCardHeading = (schemeName: string) =>
    this.page.locator(
      `xpath=//h5[normalize-space()='${schemeName.toUpperCase()}']`,
    );
  private readonly schemeEditIcon = (schemeName: string) =>
    this.page.locator(
      `xpath=//h5[normalize-space()='${schemeName.toUpperCase()}']/following::img[1]`,
    );
  private readonly partnerTab = (partnerName: string) =>
    this.page.getByRole("tab", {
      name: new RegExp(`^${partnerName}$`, "i"),
    });

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToSchemeConfiguration(): Promise<void> {
    await this.page.waitForTimeout(7000);
    await this.profile.click();
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);
    const settingsEle = this.page.locator(
      "xpath=//div[@id='kt_aside_menu']//span[normalize-space()='Settings']",
    );
    if (!(await this.AdminSetting.isVisible())) {
      await this.jsClick(settingsEle);
    }

    await this.page.waitForTimeout(1000);
    if (!(await this.SchemeConfiguration.isVisible())) {
      await this.AdminSetting.click();
    }
    await this.page.waitForTimeout(500);
    await this.SchemeConfiguration.click();
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
    await this.PartnerName.selectOption({ label: "Kharatmol Sk" });
    await this.page.waitForTimeout(1000);
    await this.SchemeName.fill(schemeName);
    await this.BasicDescription.fill(schemeName);
    await this.page.waitForTimeout(1000);
    await this.SelSchemeType.selectOption({ label: "Secured" });
    await this.page.waitForTimeout(1000);
    await this.SelAccountingStandard.selectOption({ index: 1 });
    await this.page.waitForTimeout(1000);
    await this.jsClick(this.InternalBranchDropdown);
    const branchOptions = this.page.locator(
      "xpath=//div[contains(@class,'ng-option')]",
    );
    await branchOptions.first().waitFor({ state: "visible", timeout: 10000 });
    const augmontBranchOption = branchOptions.filter({ hasText: /Augmont/i });
    await augmontBranchOption.first().click();
    await this.page.waitForTimeout(500);
    await this.SchemeLtv.selectOption({ label: "85" });
    await this.page.waitForTimeout(500);
    await this.SelCustomerType.selectOption({ label: "Active Customer" });
    await this.page.waitForTimeout(500);
    await this.jsClick(this.LoanPurposeTypeDropdown);
    const purposeOptions = this.page.locator(
      "xpath=//div[contains(@class,'ng-option')]",
    );
    await purposeOptions.first().waitFor({ state: "visible", timeout: 10000 });
    await purposeOptions.first().click();
    await this.page.waitForTimeout(500);

    await this.MinLoanAmountLac.fill("1");
    await this.MaxLoanAmountLac.fill("2");
    await this.MinKarat.selectOption({ label: "18 K" });
    await this.page.waitForTimeout(1000);
    await this.MaxKarat.selectOption({ label: "22 K HM" });
    await this.DayInyear.fill("360");
    await this.jsClick(this.btnNext);
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

    await this.jsClick(this.btnNext);
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

    await this.loc_btnView.click();

    const partnerNameEl = this.loc_btnPartnerName;
    const partnerNameVisible = await partnerNameEl.isVisible();

    const schemeTypeEl = this.loc_schemeType;
    const schemeTypeVisible = await schemeTypeEl.isVisible();
    await this.page.locator("xpath=//img[contains(@src,'cancel.svg')]").click();
    await this.page.waitForTimeout(500);
    return { partnerNameVisible, schemeTypeVisible };
  }

  async validateEditScheme(schemeName: string): Promise<string> {
    await this.navigateToSchemeConfiguration();

    await this.partnerTab("Kharatmol Sk").click();
    await this.page.waitForTimeout(1000);
    const searchBox = this.page.locator(
      "xpath=//input[@placeholder='enter text here']",
    );
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

    const updateBtn = this.page.getByRole("button", {
      name: "Update",
      exact: true,
    });
    await updateBtn.waitFor({ state: "visible", timeout: 10000 });
    await updateBtn.click();
    await this.page.waitForTimeout(1000);

    const confirmYes = this.page.getByRole("button", {
      name: "Yes",
      exact: true,
    });
    if (await confirmYes.isVisible().catch(() => false)) {
      await confirmYes.click();
      await this.page.waitForTimeout(2000);
    }

    const modalHeading = this.page.getByRole("heading", {
      name: "Edit Scheme Details",
    });
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

    const toggle = this.schemeStatusToggle;
    await toggle.waitFor({ state: "visible", timeout: 15000 });
    const initialState = await toggle.isChecked();

    await this.jsClick(toggle);
    await this.page.waitForTimeout(1000);
    await this.confirmYesBtn.click();
    await this.page.waitForTimeout(1000);
    await this.rpgUpdateBtn.click();
    await this.page.waitForTimeout(1000);

    const toggledState = await toggle.isChecked();

    await toggle.waitFor({ state: "visible", timeout: 15000 });
    await this.jsClick(toggle);
    await this.page.waitForTimeout(5000);
    await this.confirmYesBtn.click();
    await this.page.waitForTimeout(1000);

    const finalState = await toggle.isChecked();

    return { initialState, toggledState, finalState };
  }
}
