import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

export class WaiverTypePage extends AdminBasePage {
  private readonly WavierType: Locator;
  private readonly AddWavierType: Locator;
  private readonly EnteringWavierType: Locator;
  private readonly btnAdd: Locator;
  private readonly btnEdit: Locator;
  private readonly btnUpadte: Locator;
  private readonly btnDelete: Locator;
  private readonly btnYes: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly AdminSetting: Locator;
  private readonly Masters: Locator;

  constructor(page: Page) {
    super(page);
    this.WavierType = this.page.locator(
      "xpath=//span[normalize-space()='Waiver Type']",
    );
    this.AddWavierType = this.page.locator(
      "xpath=//span[normalize-space()='Add Waiver Type']",
    );
    this.EnteringWavierType = this.page.locator(
      "xpath=//input[@formcontrolname='waiverType']",
    );
    this.btnAdd = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.btnEdit = this.page.locator(
      "xpath=(//div[@class='kt-pointer ng-star-inserted'][normalize-space()='Edit'])[3]",
    );
    this.btnUpadte = this.page.locator(
      "xpath=//span[normalize-space()='Update']",
    );
    this.btnDelete = this.page.locator(
      "xpath=(//div[@class='kt-pointer text-danger ng-star-inserted'][normalize-space()='Delete'])[3]",
    );
    this.btnYes = this.page.locator("xpath=(//button[@type='submit'])[1]");
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

  private async navigateToWavierType(): Promise<void> {
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
    await this.page.waitForTimeout(500);
    const wavierElement = this.WavierType;
    await wavierElement.waitFor({ state: "attached", timeout: 30000 });
    for (let attempt = 1; attempt <= 3; attempt++) {
      await wavierElement.evaluate((el: HTMLElement) => {
        el.scrollIntoView({ block: "center" });
        el.click();
      });
      await this.waitForLoaderToDisappear();
      const opened = await this.AddWavierType.waitFor({
        state: "visible",
        timeout: 8000,
      })
        .then(() => true)
        .catch(() => false);
      if (opened) return;
      console.log(
        `Waiver Type page not open yet (attempt ${attempt}/3) — clicking again.`,
      );
    }
    await this.AddWavierType.waitFor({ state: "visible", timeout: 10000 });
  }

  async validateAddWavierType(): Promise<void> {
    await this.navigateToWavierType();

    await this.page.waitForTimeout(1000);
    await this.AddWavierType.click();
    await this.page.waitForTimeout(1000);
    await this.EnteringWavierType.fill("Demo Test");
    await this.btnAdd.click();
    await this.page.waitForTimeout(5000);
    await this.validateEditType();
    await this.page.waitForTimeout(5000);
    await this.validateDeleteWavierType();
  }


  async validateEditType(): Promise<void> {
    //await this.navigateToWavierType();

    await this.btnEdit.click();
    await this.page.waitForTimeout(1000);
    await this.EnteringWavierType.fill("Demo");
    await this.btnUpadte.click();
  }

  async validateDeleteWavierType(): Promise<void> {
    // await this.navigateToWavierType();

    await this.btnDelete.click();
    await this.page.waitForTimeout(1000);
    await this.btnYes.click();
  }
}
