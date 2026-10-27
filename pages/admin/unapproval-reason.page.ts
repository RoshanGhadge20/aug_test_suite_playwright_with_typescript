import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class UnapprovalReasonPage extends AdminBasePage {


  private readonly UnapprovedReasons: Locator;
  private readonly btnAddReason: Locator;
  private readonly EnteringReason: Locator;
  private readonly btnAdd: Locator;
  private readonly btnEdit: Locator;
  private readonly btnUpdate: Locator;
  private readonly btnDelete: Locator;
  private readonly btnYes: Locator;

  // Cross-page re-declarations
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly AdminSetting: Locator;
  private readonly Masters: Locator;

  constructor(page: Page) {
    super(page);
    this.UnapprovedReasons = this.page.locator(
      "xpath=//span[normalize-space()='Unapproved Reasons']",
    );
    this.btnAddReason = this.page.locator(
      "xpath=//span[normalize-space()='Add Reason']",
    );
    this.EnteringReason = this.page.locator(
      "xpath=//input[@formcontrolname='description']",
    );
    this.btnAdd = this.page.locator("xpath=//span[normalize-space()='Add']");
    this.btnEdit = this.page.locator(
      "xpath=(//span[@class='kt-pointer ng-star-inserted'][normalize-space()='Edit'])[1]",
    );
    this.btnUpdate = this.page.locator(
      "xpath=//span[normalize-space()='Update']",
    );
    this.btnDelete = this.page.locator(
      "xpath=(//span[@class='kt-pointer text-danger ng-star-inserted'][normalize-space()='Delete'])[1]",
    );
    this.btnYes = this.page.locator("xpath=//button[@type='submit']");
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
    this.Masters = this.page.locator(
      "xpath=//span[normalize-space()='Masters']",
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToUnapprovedReasons(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile.click();

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.branchDropdown.selectOption({ label: data.branchName });
    await this.page.waitForTimeout(7000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);

    const settingsEle = this.page.locator(
      "xpath=//div[@id='kt_aside_menu']//span[normalize-space()='Settings']",
    );
    await settingsEle.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(settingsEle);

    await this.page.waitForTimeout(1000);
    await this.AdminSetting.click();
    await this.Masters.click();
    await this.page.waitForTimeout(500);
    await this.UnapprovedReasons.click();
  }

  async validateAddApproval(): Promise<void> {
    await this.navigateToUnapprovedReasons();

    await this.btnAddReason.click();
    await this.page.waitForTimeout(1000);
    await this.EnteringReason.fill("Incomplete Documents");
    await this.btnAdd.click();
  }

  async vaidateEditUnapprovalReason(): Promise<void> {
    await this.navigateToUnapprovedReasons();
    await this.page.waitForTimeout(2000);

    const element = this.btnEdit;
    await element.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(element);

    await this.EnteringReason.fill("Documents");
    await this.btnUpdate.click();
  }

  
  async validateDeleteUnapprovalReason(): Promise<void> {
    await this.navigateToUnapprovedReasons();
    await this.page.waitForTimeout(2000);

    const element = this.btnDelete;
    await element.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(element);

    await this.btnYes.click();
  }
}
