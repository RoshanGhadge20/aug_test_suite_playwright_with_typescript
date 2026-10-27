import { Locator, Page } from "@playwright/test";
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

export class InternalUserBranchPage extends AdminBasePage {
  private readonly AddInternalUserBranch: Locator;
  private readonly InternalUserBranch: Locator;
  private readonly BranchName: Locator;
  private readonly SolId: Locator;
  private readonly selBranchType: Locator;
  private readonly Address: Locator;
  private readonly SelState: Locator;
  private readonly SelCity: Locator;
  private readonly Pincode: Locator;
  private readonly SelAuditor: Locator;
  private readonly BankName: Locator;
  private readonly BankBranchName: Locator;
  private readonly IFSC: Locator;
  private readonly ACHolderName: Locator;
  private readonly ACNumber: Locator;
  private readonly Commision: Locator;
  private readonly Product: Locator;
  private readonly Attach: Locator;
  private readonly btnAdd: Locator;
  private readonly btnView: Locator;
  private readonly btnClose: Locator;
  private readonly searchfield: Locator;
  private readonly btnEdit: Locator;
  private readonly btnUpdate: Locator;
  private readonly inputfield: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly userManagent: Locator;
  private readonly nameInput: Locator;

  constructor(page: Page) {
    super(page);
    this.AddInternalUserBranch = this.page.locator(
      "xpath=//button[normalize-space()='Add Internal Branch']",
    );
    this.InternalUserBranch = this.page.locator(
      "xpath=//span[normalize-space()='Internal User Branch']",
    );
    this.BranchName = this.page.locator(
      "xpath=//input[@formcontrolname='name']",
    );
    this.SolId = this.page.locator(
      "xpath=//input[@formcontrolname='dcbSolId']",
    );
    this.selBranchType = this.page.locator(
      "xpath=//select[@formcontrolname='branchType']",
    );
    this.Address = this.page.locator(
      "xpath=//textarea[@placeholder='e.g 012345']",
    );
    this.SelState = this.page.locator(
      "xpath=//select[@formcontrolname='stateId']",
    );
    this.SelCity = this.page.locator(
      "xpath=//select[@formcontrolname='cityId']",
    );
    this.Pincode = this.page.locator("xpath=//input[@placeholder='eg.123465']");
    this.SelAuditor = this.page.locator(
      "xpath=//select[@formcontrolname='auditorId']",
    );
    this.BankName = this.page.locator(
      "xpath=//input[@placeholder='Bank Name']",
    );
    this.BankBranchName = this.page.locator(
      "xpath=//input[@formcontrolname='bankBranch']",
    );
    this.IFSC = this.page.locator("xpath=//input[@placeholder='IFSC Code']");
    this.ACHolderName = this.page.locator(
      "xpath=//input[@placeholder='A/C Holder Name']",
    );
    this.ACNumber = this.page.locator(
      "xpath=//input[@placeholder='A/C Number']",
    );
    this.Commision = this.page.locator(
      "xpath=//input[@placeholder='Commission %']",
    );
    this.Product = this.page.locator(
      "xpath=(//input[@role='combobox']//following::span[@class='ng-arrow-wrapper'])[2]",
    );
    this.Attach = this.page.locator("xpath=//input[@id='file']");
    this.btnAdd = this.page.locator("xpath=//span[normalize-space()='Add']");
    this.btnView = this.page.locator(
      "xpath=(//div[contains(@class,'action-btn-group')]/div[1])[1]",
    );
    this.btnClose = this.page.locator("xpath=//img[@class='kt-pointer']");
    this.searchfield = this.page.locator(
      "xpath=//input[@placeholder='Enter Branch Name']",
    );
    this.btnEdit = this.page.locator(
      "xpath=(//div[@class='kt-pointer ng-star-inserted'])[2]",
    );
    this.btnUpdate = this.page.locator(
      "xpath=(//div[@class='kt-pointer ng-star-inserted'])[3]",
    );
    this.inputfield = this.page.locator(
      "xpath=(//*[normalize-space(.)='Total'])[last()]/preceding::input[1]",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator("xpath=//select[@id='branch']");
    this.userManagent = this.page.locator(
      "xpath=//span[normalize-space()='User Management']",
    );
    this.nameInput = this.page.locator(
      "xpath=//input[@placeholder='Enter Branch Name']",
    );
  }
  private generateRandomSoldId(): string {
    return `SOLD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  private async navigateToInternalUserBranch(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile.click();

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.branchDropdown.selectOption({ label: data.branchName });
    await this.page.waitForTimeout(5000);
    const iubLink = this.InternalUserBranch;
    const isIubVisible = await iubLink
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (!isIubVisible) {
      await this.expandSidebar();
      await this.page.waitForTimeout(1000);
      const isUserMgmtPresent = await this.userManagent
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (isUserMgmtPresent) {
        await this.userManagent.click();
        await this.page.waitForTimeout(3000);
      }
    }

    await iubLink.click();
    await this.page.waitForTimeout(2000);
  }

  async validateInternalUserBranch(): Promise<void> {
    const d = getInternalUserBranchData();
    await this.navigateToInternalUserBranch();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);

    await this.validateViewInternalUserBranch(d.searchBranchName);
    await this.page.waitForTimeout(3000);

    await this.validateEditInternalUserBranch(d.searchBranchName);
    await this.page.waitForTimeout(3000);
  }

  async validateViewInternalUserBranch(searchName?: string): Promise<string> {
    const d = getInternalUserBranchData();
    const nameToSearch = searchName ?? d.searchBranchName;

    await this.page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await this.nameInput.waitFor({ state: "visible", timeout: 15_000 });
    await this.nameInput.fill(nameToSearch);
    await this.page
      .locator("xpath=//button[normalize-space()='Filter']")
      .click();
    await this.page.waitForTimeout(1000);
    await this.btnView.click();

    const branchValue = this.page.locator(
      "xpath=//input[@formcontrolname='name']",
    );
    const actualBranch = (await branchValue.inputValue()).trim();
    console.log(
      `[validateViewInternalUserBranch] searched="${nameToSearch}", found="${actualBranch}"`,
    );

    await this.btnClose.click();

    return actualBranch;
  }

  async validateEditInternalUserBranch(searchName?: string): Promise<{
    isDisplayed: boolean;
    isEnabled: boolean;
  }> {
    const d = getInternalUserBranchData();
    const nameToSearch = searchName ?? d.searchBranchName;

    await this.page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await this.searchfield.waitFor({ state: "visible", timeout: 15_000 });
    await this.searchfield.fill(nameToSearch);
    await this.page
      .locator("xpath=//button[normalize-space()='Filter']")
      .click();
    await this.page.waitForTimeout(1000);
    await this.btnEdit.click();
    const dialogUpdateBtn = this.page.locator(
      "xpath=//button[normalize-space()='Update']",
    );
    await dialogUpdateBtn.waitFor({ state: "visible", timeout: 15_000 });
    const isDisplayed = await dialogUpdateBtn.isVisible();
    const isEnabled = await dialogUpdateBtn.isEnabled();
    console.log(
      `[validateEditInternalUserBranch] searched="${nameToSearch}", Update visible=${isDisplayed}, enabled=${isEnabled}`,
    );
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

  async valiadateOdlInternalBranchUser(): Promise<{
    isDisplayed: boolean;
    isEnabled: boolean;
  }> {
    const d = getInternalUserBranchData();
    await this.navigateToInternalUserBranch();

    await this.searchfield.waitFor({ state: "visible", timeout: 15_000 });
    await this.searchfield.fill(d.searchBranchName);
    await this.page
      .locator("xpath=//button[normalize-space()='Filter']")
      .click();
    await this.page.waitForTimeout(1000);
    await this.btnUpdate.click();
    await this.page.waitForTimeout(1000);
    await this.inputfield.fill(d.oldUserCount);
    await this.page.waitForTimeout(500);

    const addBtn = this.btnAdd;
    await addBtn.waitFor({ state: "visible", timeout: 15000 });
    const isDisplayed = await addBtn.isVisible();
    const isEnabled = await addBtn.isEnabled();

    await addBtn.click();

    return { isDisplayed, isEnabled };
  }
}
