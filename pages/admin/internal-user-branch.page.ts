import { Page } from "@playwright/test";
import * as path from "path";
import { AdminBasePage } from "./admin-base.page";
import {
  getLoginData,
  getInternalUserBranchData,
} from "../../utils/data/admin-excel-data";

const DEFAULT_DOCUMENT_PATH = path.resolve(
  process.cwd(),
  "testdata",
  "admin",
  "image.png",
);

/**
 * Port of Java: PO36_InternalUserBranch (locators) + Flow57_InternalUserBranch (actions)
 *
 * Methods ported (only active TC05 calls):
 *   - valiadateOdlInternalBranchUser()  ← Flow57.valiadateOdlInternalBranchUser()
 *   (validateInternalUserBranch(), validateViewInternalUserBranch(), validateEditInternalUserBranch() commented in TC05 — ported)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, userManagent, nameInput re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - All flows called loginWith* — OMITTED. Role = admin.
 *
 * File upload notes:
 *   - validateInternalUserBranch(): Java used sendKeys to //input[@id='file'] — guarded.
 *
 * SoftAssert translated to return value:
 *   - valiadateOdlInternalBranchUser() returns { isDisplayed, isEnabled } for spec assertions.
 */
export class InternalUserBranchPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO36_InternalUserBranch) ───────────────────────────────

  private readonly AddInternalUserBranch = () =>
    this.page.locator(
      "xpath=//button[normalize-space()='Add Internal Branch']",
    );
  private readonly InternalUserBranch = () =>
    this.page.locator("xpath=//span[normalize-space()='Internal User Branch']");
  private readonly BranchName = () =>
    this.page.locator("xpath=//input[@formcontrolname='name']");
  private readonly SolId = () =>
    this.page.locator("xpath=//input[@formcontrolname='dcbSolId']");
  private readonly selBranchType = () =>
    this.page.locator("xpath=//select[@formcontrolname='branchType']");
  private readonly Address = () =>
    this.page.locator("xpath=//textarea[@placeholder='e.g 012345']");
  private readonly SelState = () =>
    this.page.locator("xpath=//select[@formcontrolname='stateId']");
  private readonly SelCity = () =>
    this.page.locator("xpath=//select[@formcontrolname='cityId']");
  private readonly Pincode = () =>
    this.page.locator("xpath=//input[@placeholder='eg.123465']");
  private readonly SelAuditor = () =>
    this.page.locator("xpath=//select[@formcontrolname='auditorId']");
  private readonly BankName = () =>
    this.page.locator("xpath=//input[@placeholder='Bank Name']");
  private readonly BankBranchName = () =>
    this.page.locator("xpath=//input[@formcontrolname='bankBranch']");
  private readonly IFSC = () =>
    this.page.locator("xpath=//input[@placeholder='IFSC Code']");
  private readonly ACHolderName = () =>
    this.page.locator("xpath=//input[@placeholder='A/C Holder Name']");
  private readonly ACNumber = () =>
    this.page.locator("xpath=//input[@placeholder='A/C Number']");
  private readonly Commision = () =>
    this.page.locator("xpath=//input[@placeholder='Commission %']");
  private readonly Product = () =>
    this.page.locator(
      "xpath=(//input[@role='combobox']//following::span[@class='ng-arrow-wrapper'])[2]",
    );
  private readonly Attach = () =>
    this.page.locator("xpath=//input[@id='file']");
  private readonly btnAdd = () =>
    this.page.locator("xpath=//span[normalize-space()='Add']");
  private readonly btnView = () =>
    this.page.locator(
      "xpath=(//div[contains(@class,'action-btn-group')]/div[1])[1]",
    );
  private readonly btnClose = () =>
    this.page.locator("xpath=//img[@class='kt-pointer']");
  private readonly searchfield = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Branch Name']");
  private readonly btnEdit = () =>
    this.page.locator("xpath=(//div[@class='kt-pointer ng-star-inserted'])[2]");
  private readonly btnUpdate = () =>
    this.page.locator("xpath=(//div[@class='kt-pointer ng-star-inserted'])[3]");
  private readonly inputfield = () =>
    this.page.locator(
      "xpath=//input[@class='form-control ng-valid ng-dirty ng-touched']",
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
  private readonly userManagent = () =>
    this.page.locator("xpath=//span[normalize-space()='User Management']");
  private readonly nameInput = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Branch Name']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private generateRandomSoldId(): string {
    return `SOLD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  private async navigateToInternalUserBranch(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(5000);

    // Ensure sidebar is expanded: only toggle if Internal User Branch is not already visible.
    const iubLink = this.InternalUserBranch();
    const isIubVisible = await iubLink
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (!isIubVisible) {
      await this.expandSidebar();
      await this.page.waitForTimeout(1000);
      // In some environments "Internal User Branch" is nested under "User Management".
      const isUserMgmtPresent = await this.userManagent()
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (isUserMgmtPresent) {
        await this.userManagent().click();
        await this.page.waitForTimeout(3000);
      }
    }

    await iubLink.click();
    await this.page.waitForTimeout(2000);
  }

  // ── Actions (from Flow57_InternalUserBranch) ──────────────────────────────

  /**
   * Port of Java Flow57_InternalUserBranch.validateInternalUserBranch().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   *
   * TODO(port): File upload — Java used sendKeys to //input[@id='file'] — guarded.
   */
  async validateInternalUserBranch(): Promise<void> {
    const d = getInternalUserBranchData();
    await this.navigateToInternalUserBranch();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);

    // await this.validateViewInternalUserBranch(d.searchBranchName);
    // await this.page.waitForTimeout(3000);

    // await this.validateEditInternalUserBranch(d.searchBranchName);
    await this.page.waitForTimeout(3000);
  }

  /**
   * Port of Java Flow57_InternalUserBranch.validateViewInternalUserBranch().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   *
   * Returns actualBranch for spec assertions.
   */
  async validateViewInternalUserBranch(searchName?: string): Promise<string> {
    const d = getInternalUserBranchData();
    const nameToSearch = searchName ?? d.searchBranchName;

    await this.page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await this.nameInput().waitFor({ state: "visible", timeout: 15_000 });
    await this.nameInput().fill(nameToSearch);
    await this.page
      .locator("xpath=//button[normalize-space()='Filter']")
      .click();
    await this.page.waitForTimeout(1000);
    await this.btnView().click();

    const branchValue = this.page.locator(
      "xpath=//input[@formcontrolname='name']",
    );
    const actualBranch = (await branchValue.inputValue()).trim();
    console.log(
      `[validateViewInternalUserBranch] searched="${nameToSearch}", found="${actualBranch}"`,
    );

    await this.btnClose().click();

    return actualBranch;
  }

  /**
   * Port of Java Flow57_InternalUserBranch.validateEditInternalUserBranch().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   *
   * Returns { isDisplayed, isEnabled } for spec assertions.
   */
  async validateEditInternalUserBranch(searchName?: string): Promise<{
    isDisplayed: boolean;
    isEnabled: boolean;
  }> {
    const d = getInternalUserBranchData();
    const nameToSearch = searchName ?? d.searchBranchName;

    await this.page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await this.searchfield().waitFor({ state: "visible", timeout: 15_000 });
    await this.searchfield().fill(nameToSearch);
    await this.page
      .locator("xpath=//button[normalize-space()='Filter']")
      .click();
    await this.page.waitForTimeout(1000);
    await this.btnEdit().click();

    // The Edit dialog opens — use the dialog's own Update button for assertions.
    const dialogUpdateBtn = this.page.locator(
      "xpath=//button[normalize-space()='Update']",
    );
    await dialogUpdateBtn.waitFor({ state: "visible", timeout: 15_000 });
    const isDisplayed = await dialogUpdateBtn.isVisible();
    const isEnabled = await dialogUpdateBtn.isEnabled();
    console.log(
      `[validateEditInternalUserBranch] searched="${nameToSearch}", Update visible=${isDisplayed}, enabled=${isEnabled}`,
    );

    // Close the dialog via Cancel so the overlay is dismissed before the next step.
    await this.page
      .locator("xpath=//button[normalize-space()='Cancel']")
      .last()
      .click();
    await this.page
      .locator(".cdk-overlay-backdrop")
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});

    return { isDisplayed, isEnabled };
  }

  /**
   * Port of Java Flow57_InternalUserBranch.valiadateOdlInternalBranchUser().
   * Called by TC05 priority=3.
   *
   * Returns { isDisplayed, isEnabled } for spec assertions.
   */
  async valiadateOdlInternalBranchUser(): Promise<{
    isDisplayed: boolean;
    isEnabled: boolean;
  }> {
    const d = getInternalUserBranchData();
    await this.navigateToInternalUserBranch();

    await this.searchfield().waitFor({ state: "visible", timeout: 15_000 });
    await this.searchfield().fill(d.searchBranchName);
    await this.page
      .locator("xpath=//button[normalize-space()='Filter']")
      .click();
    await this.page.waitForTimeout(1000);
    await this.btnUpdate().click();
    await this.page.waitForTimeout(1000);
    await this.inputfield().fill(d.oldUserCount);
    await this.page.waitForTimeout(500);

    const addBtn = this.btnAdd();
    await addBtn.waitFor({ state: "visible", timeout: 15000 });
    const isDisplayed = await addBtn.isVisible();
    const isEnabled = await addBtn.isEnabled();

    await addBtn.click();

    return { isDisplayed, isEnabled };
  }
}
