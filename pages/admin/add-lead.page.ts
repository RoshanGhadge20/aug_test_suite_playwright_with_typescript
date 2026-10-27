import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

export class AddLeadPage extends AdminBasePage {
  private readonly Masters: Locator;
  private readonly LeadSource: Locator;
  private readonly AddLeadSource: Locator;
  private readonly LeadName: Locator;
  private readonly BtnAdd: Locator;
  private readonly btnEdit: Locator;
  private readonly btnUpdate: Locator;
  private readonly btnDelete: Locator;
  private readonly btnYes: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly AdminSetting: Locator;

  constructor(page: Page) {
    super(page);
    this.Masters = this.page.locator(
      "xpath=//span[normalize-space()='Masters']",
    );
    this.LeadSource = this.page.locator(
      "xpath=//span[normalize-space()='Lead Source']",
    );
    this.AddLeadSource = this.page.locator(
      "xpath=//span[normalize-space()='Add Lead Source']",
    );
    this.LeadName = this.page.locator(
      "xpath=//input[@formcontrolname='leadName']",
    );
    this.BtnAdd = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.btnEdit = this.page.locator(
      "xpath=(//span[contains(text(),'Edit')])[1]",
    );
    this.btnUpdate = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.btnDelete = this.page.locator(
      "xpath=(//span[@class='kt-pointer text-danger ng-star-inserted'][normalize-space()='Delete'])[1]",
    );
    this.btnYes = this.page.locator("xpath=//span[contains(.,'Yes')]");
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
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToLeadSource(): Promise<void> {
    await this.page.waitForTimeout(7000);
    await this.profile.click();

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);

    const settingsEle = this.page.locator(
      "xpath=//div[@id='kt_aside_menu']//span[normalize-space()='Settings']",
    );
    await this.jsClick(settingsEle);

    await this.page.waitForTimeout(1000);
    await this.AdminSetting.click();
    await this.Masters.click();
    await this.LeadSource.click();
  }

  async validateAddLeadWithEdit(): Promise<{
    isDisplayed: boolean;
    isEnabled: boolean;
  }> {
    await this.navigateToLeadSource();

    await this.AddLeadSource.click();
    await this.LeadName.fill("Test");
    const addBtn = this.BtnAdd;
    const isDisplayed = await addBtn.isVisible();
    const isEnabled = await addBtn.isEnabled();
    await addBtn.click();

    await this.page.waitForTimeout(3000);

    const editBtn = this.btnEdit;
    await this.jsClick(editBtn);
    await this.LeadName.fill("Demo");
    await this.btnUpdate.click();
    await this.page.waitForTimeout(3000);

    const deleteBtn = this.btnDelete;
    await deleteBtn.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(3000);
    await deleteBtn.click();
    await this.btnYes.click();

    return { isDisplayed, isEnabled };
  }
}
