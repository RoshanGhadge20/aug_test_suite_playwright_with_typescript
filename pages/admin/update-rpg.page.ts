import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class UpdateRpgPage extends AdminBasePage {
  private readonly EnteringValue: Locator;
  private readonly EditRPG: Locator;
  private readonly btnUpdate: Locator;
  private readonly btnClose: Locator;
  private readonly RadioButton: Locator;
  private readonly btnYes: Locator;
  private readonly btnPartnerName: Locator;
  private readonly btnView: Locator;
  private readonly schemeType: Locator;

  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly AdminSetting: Locator;
  private readonly SchemeConfiguration: Locator;

  constructor(page: Page) {
    super(page);
    this.EnteringValue = this.page.locator(
      "xpath=//input[@formcontrolname='rpg']",
    );
    this.EditRPG = this.page.locator(
      "xpath=//img[@mattooltip='partner rpg edit']",
    );
    this.btnUpdate = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Update']]",
    );
    this.btnClose = this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );
    this.RadioButton = this.page.locator(
      "xpath=//label[@for='mat-slide-toggle-501-input']//div[@class='mat-slide-toggle-thumb']",
    );
    this.btnYes = this.page.locator("xpath=//span[normalize-space()='Yes']");
    this.btnPartnerName = this.page.locator(
      "xpath=//input[@formcontrolname='partnerId']",
    );
    this.btnView = this.page.locator(
      "xpath=//div[@id='s406']//span[@class='material-icons kt-pointer'][normalize-space()='visibility']",
    );
    this.schemeType = this.page.locator(
      "xpath=//select[@formcontrolname='schemeType']",
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
    this.SchemeConfiguration = this.page.locator(
      "xpath=//span[normalize-space()='Scheme Configuration']",
    );
  }

  async validateRPGUpdate(): Promise<boolean> {
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
    await this.SchemeConfiguration.click();
    await this.EditRPG.click();
    await this.EnteringValue.fill("5000");

    const updateBtn = this.btnUpdate;
    await updateBtn.waitFor({ state: "visible", timeout: 10000 });
    await updateBtn.click();

    await this.page.waitForTimeout(500);
    const isDisabled = !(await updateBtn.isEnabled());

    try {
      await this.btnClose.click();
    } catch {}

    return isDisabled;
  }
}
