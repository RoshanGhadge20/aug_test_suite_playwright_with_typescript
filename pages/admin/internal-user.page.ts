import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { TestDataFactory } from "../../utils/data/test-data.factory";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { documentPath } from "@config/urls";

export class InternalUserPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO35_InternalUser) ────────────────────────────────────

  private readonly btnInternalUser = () =>
    this.page.locator("xpath=//span[normalize-space()='Internal User']");
  private readonly addInternalUser = () =>
    this.page.locator("xpath=//span[normalize-space()='Add Internal User']");
  private readonly firstname = () =>
    this.page.locator("xpath=//input[@placeholder='First Name']");
  private readonly lastName = () =>
    this.page.locator("xpath=//input[@placeholder='Last Name']");
  private readonly selUsertype = () =>
    this.page.locator("xpath=//select[@formcontrolname='userTypeId']");
  private readonly selRole = () =>
    this.page.locator("xpath=//select[@formcontrolname='roleId']");
  private readonly selBranch = () =>
    this.page.locator("xpath=(//ng-select//input[@role='combobox'])[1]");
  private readonly selDefaultBranch = () =>
    this.page.locator(
      "xpath=//select[@formcontrolname='defaultInternalBranchId']",
    );
  private readonly enteringEmail = () =>
    this.page.locator("xpath=//input[@placeholder='e.g abc@123.com']");
  private readonly IDNumber = () =>
    this.page.locator("xpath=//input[@placeholder='e.g 012345']");
  private readonly mobileNumber = () =>
    this.page.locator("xpath=//input[@placeholder='e.g 9023451234']");
  private readonly sendOTP = () =>
    this.page.locator(
      "xpath=//button[contains(@class,'mat-raised-button') and .//span[text()=' Send OTP ']]",
    );
  private readonly otpValue = () =>
    this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnVerify = () =>
    this.page.locator(
      "xpath=//button[contains(@class,'mat-raised-button') and .//span[text()='Verify']]",
    );
  private readonly uploadPAN = () =>
    this.page.locator("xpath=(//input[@type='file'])[1]");
  private readonly uploadAadhar = () =>
    this.page.locator("xpath=(//input[@type='file'])[2]");
  private readonly btnAdd = () =>
    this.page.getByRole("button", { name: "Add", exact: true });
  private readonly nameInput = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly viewBranches = () =>
    this.page.locator(
      "xpath=(//mat-cell[contains(@class,'mat-column-action')]//div[contains(@class,'kt-pointer') and contains(text(),'View Branches')])[1]",
    );
  private readonly close = () =>
    this.page.locator("xpath=//img[@class='kt-pointer']");
  private readonly btnEdit = () =>
    this.page.locator("xpath=(//div[@class='kt-pointer ng-star-inserted'])[1]");
  private readonly btnUpdate = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly btnFilter = () =>
    this.page.locator("xpath=//button[span[normalize-space(text())='Filter']]");
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

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToInternalUser(): Promise<void> {
    // Idempotent: when a previous step already left the app inside the User Management section,
    // the sidebar shows its sub-items directly and there is no "User Management" header to click
    // (confirmed from the TC05 failure screenshot) — just open Internal User from the sidebar.
    const internalUserLink = this.btnInternalUser();
    if (await internalUserLink.isVisible().catch(() => false)) {
      await internalUserLink.click();
      await this.waitForLoaderToDisappear();
      return;
    }

    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(7000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);
    // The section may already be expanded after the sidebar opens; only click the header if
    // Internal User isn't visible yet.
    if (!(await this.btnInternalUser().isVisible().catch(() => false))) {
      await this.userManagent().click();
      await this.page.waitForTimeout(1000);
    }
    await this.btnInternalUser().click();
  }

  async validateInternalUser(
    panDocumentPath?: string,
    aadharDocumentPath?: string,
  ): Promise<void> {
    const data = getLoginData();
    await this.navigateToInternalUser();

    const resolvedPanPath = panDocumentPath ?? documentPath("PAN_CARD");
    const resolvedAadharPath = aadharDocumentPath ?? documentPath("AADHAAR");

    const addBtn = this.addInternalUser();
    await addBtn.waitFor({ state: "visible", timeout: 15000 });
    await addBtn.click();

    await this.firstname().fill(data.firstName);
    await this.page.waitForTimeout(1000);
    await this.lastName().fill(data.lastName);
    await this.page.waitForTimeout(500);
    await this.selUsertype().selectOption({ label: "Appraiser" });
    await this.page.waitForTimeout(500);
    await this.selRole().selectOption({ label: "Appraiser" });
    await this.page.waitForTimeout(500);

    // Select branch from ng-select dropdown (2 iterations)
    for (let i = 0; i < 2; i++) {
      const dropdown = this.page.locator(
        "xpath=(//input[@role='combobox']//following::span[@class='ng-arrow-wrapper'])[2]",
      );
      await dropdown.evaluate((el: any) =>
        el.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      await this.page.waitForTimeout(1000);
      await dropdown.click();

      const indexToClick = 4 + i;
      const opts = this.page.locator(
        "xpath=//ng-select//div[contains(@class,'ng-dropdown-panel-items')]//div[contains(@class,'ng-option')]",
      );

      if ((await opts.count()) > indexToClick) {
        await opts.nth(indexToClick).click();
      }
      await this.page.waitForTimeout(1000);
    }

    await this.page.waitForTimeout(2000);
    await this.selDefaultBranch().selectOption({ label: "Andheri" });
    const email = TestDataFactory.email();
    await this.enteringEmail().fill(email);
    await this.mobileNumber().scrollIntoViewIfNeeded();
    const mobileNumber = TestDataFactory.mobile();
    await this.mobileNumber().fill(mobileNumber);

    await this.page.waitForTimeout(500);
    await this.sendOTP().click();
    await this.page.waitForTimeout(500);
    await this.otpValue().fill("1234");
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.page.waitForTimeout(500);
    const idNumber = TestDataFactory.idNumber();
    await this.IDNumber().fill(idNumber);

    if (resolvedPanPath) {
      const fileInput1 = this.page.locator("xpath=(//input[@id='file'])[1]");
      await this.page.waitForTimeout(10000);
      await fileInput1.setInputFiles(resolvedPanPath);
    }
    if (resolvedAadharPath) {
      const fileInput2 = this.page.locator("xpath=(//input[@id='file'])[2]");
      await this.page.waitForTimeout(10000);
      await fileInput2.setInputFiles(resolvedAadharPath);
    }

    await this.btnAdd().click();
    await this.page.waitForTimeout(3000);
    await this.waitForLoaderToDisappear();
    await this.page
      .locator(".cdk-overlay-backdrop")
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.validatingViewBranches();
    await this.page.waitForTimeout(5000);
    await this.validateInternalUserUpdate();
  }

  async validatingViewBranches(): Promise<void> {
    const data = getLoginData();
    //await this.navigateToInternalUser();
    await this.page.waitForLoadState("networkidle");
    // const userType = this.page.locator(
    //   "//label[normalize-space(text())='User Type']/parent::div/following-sibling::div//select",
    // );

    // await userType.waitFor({ state: "visible", timeout: 30000 });

    // await userType.selectOption({ label: "Appraiser" });
    await this.nameInput().fill(data.firstName);
    await this.btnFilter().click();
    await this.page.waitForTimeout(5000);
    await this.viewBranches().click();

    const branchCell = this.page.locator(
      "//td[normalize-space(text())='Andheri']",
    );

    const branchName = await branchCell.innerText();

    console.log(branchName);
    await this.page.waitForTimeout(5000);
    await this.close().click();
  }
  async validateInternalUserUpdate(): Promise<{
    isDisplayed: boolean;
    isEnabled: boolean;
  }> {
    //await this.navigateToInternalUser();
    const data = getLoginData();
    await this.nameInput().fill(data.firstName);
    await this.btnFilter().click();
    await this.page.waitForTimeout(5000);
    await this.btnEdit().click();
    await this.page.waitForTimeout(500);

    const updateBtn = this.btnUpdate();
    await updateBtn.waitFor({ state: "visible", timeout: 15000 });
    const isDisplayed = await updateBtn.isVisible();
    const isEnabled = await updateBtn.isEnabled();
    await this.firstname().clear();
    await this.page.waitForTimeout(5000);
    await this.firstname().fill("Priyanka");
    await this.page.waitForTimeout(5000);
    const checkbox = this.page.locator(
      "//mat-checkbox[@formcontrolname='isDefaultAppraiser']",
    );
    await checkbox.waitFor({ state: "visible", timeout: 10000 });
    await checkbox.click();
    await updateBtn.click();

    return { isDisplayed, isEnabled };
  }

  async validateOldeInternalUser(): Promise<string> {
    await this.navigateToInternalUser();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
    await this.nameInput().waitFor({ state: "visible", timeout: 15_000 });
    await this.nameInput().fill("Priyanka");
    await this.btnFilter().click();
    await this.page.waitForTimeout(2000);

    const firstResultCell = this.page.locator(
      "xpath=(//mat-cell[@role='gridcell'])[2]",
    );
    const actualUser = (await firstResultCell.innerText()).trim();
    console.log(`[validateOldeInternalUser] Found user: "${actualUser}"`);

    // ── Step 2: Click Edit → verify Update button visible → Cancel ────────
    await this.btnEdit().click();
    await this.page.waitForTimeout(500);
    const updateBtn = this.btnUpdate();
    await updateBtn.waitFor({ state: "visible", timeout: 15_000 });
    const isUpdateVisible = await updateBtn.isVisible();
    const isUpdateEnabled = await updateBtn.isEnabled();
    console.log(
      `[validateOldeInternalUser] Update visible=${isUpdateVisible}, enabled=${isUpdateEnabled}`,
    );
    await this.page
      .locator("xpath=//button[normalize-space()='Cancel']")
      .last()
      .click()
      .catch(() => {});
    await this.page
      .locator(".cdk-overlay-backdrop")
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1000);

    // ── Step 3: Search again → click View Branches → read branch → close ──
    await this.nameInput().fill("Priya");
    await this.btnFilter().click();
    await this.page.waitForTimeout(2000);
    await this.viewBranches().click();
    await this.page.waitForTimeout(2000);
    const branchCell = this.page
      .locator("xpath=//td[normalize-space(text())='Andheri']")
      .first();
    const branchName = await branchCell.innerText().catch(() => "");
    console.log(`[validateOldeInternalUser] Branch: "${branchName}"`);
    await this.close().click();

    return actualUser;
  }
}
