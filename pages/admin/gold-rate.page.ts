import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class GoldRatePage extends AdminBasePage {
  private readonly Setting: Locator;
  private readonly AdminSetting: Locator;
  private readonly InputField: Locator;
  private readonly btnSave: Locator;
  private readonly goldRate: Locator;
  private readonly btnUploadData: Locator;
  private readonly GoldRate: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.Setting = this.page.locator(
      "xpath=//span[@class='kt-menu__link-text ng-star-inserted'][normalize-space()='Settings']",
    );
    this.AdminSetting = this.page.locator(
      "xpath=//span[normalize-space()='Admin Settings']",
    );
    this.InputField = this.page.locator("xpath=//input[@name='goldRate']");
    this.btnSave = this.page.locator("xpath=//span[normalize-space()='Save']");
    this.goldRate = this.page.locator("xpath=//tr[1]//td[4]");
    this.btnUploadData = this.page.locator(
      "xpath=//span[normalize-space()='Upload Data']",
    );
    this.GoldRate = this.page.locator(
      "xpath=//span[normalize-space()='Gold Rate']",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator("xpath=//select[@id='branch']");
  }

  async validatingGoldRate(): Promise<string> {
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
    await this.page.waitForTimeout(1000);
    await this.btnUploadData.click();
    await this.page.waitForTimeout(1000);
    await this.GoldRate.click();
    await this.page.waitForTimeout(1000);
    await this.InputField.fill("9600");
    await this.page.waitForTimeout(500);
    await this.btnSave.click();

    const oldRateElement = this.InputField;
    const actualOldRate = (await oldRateElement.inputValue()).trim();

    return actualOldRate;
  }
}
