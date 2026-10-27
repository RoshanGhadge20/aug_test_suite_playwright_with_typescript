import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

export class KaratPage extends AdminBasePage {
  private readonly Karat: Locator;
  private readonly AddKaratDetails: Locator;
  private readonly KaratDetails: Locator;
  private readonly PercentageFrom: Locator;
  private readonly PercentageTo: Locator;
  private readonly RadioHallmark: Locator;
  private readonly btnAdd: Locator;
  private readonly btnEdit: Locator;
  private readonly btnUpdate: Locator;
  private readonly btnDelete: Locator;
  private readonly btnYes: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly AdminSetting: Locator;
  private readonly Masters: Locator;

  constructor(page: Page) {
    super(page);
    this.Karat = this.page.locator("xpath=//span[normalize-space()='Karat']");
    this.AddKaratDetails = this.page.locator(
      "xpath=//span[normalize-space()='Add Karat Details']",
    );
    this.KaratDetails = this.page.locator(
      "xpath=//input[@placeholder='Enter Karat Details']",
    );
    this.PercentageFrom = this.page.locator(
      "xpath=//input[@placeholder='from %']",
    );
    this.PercentageTo = this.page.locator("xpath=//input[@placeholder='To %']");
    this.RadioHallmark = this.page.locator(
      "xpath=//div[@class='mat-slide-toggle-thumb']",
    );
    this.btnAdd = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.btnEdit = this.page.locator(
      "xpath=(//div[contains(text(),'Edit')])[1]",
    );
    this.btnUpdate = this.page.locator(
      "xpath=//span[normalize-space()='Update']",
    );
    this.btnDelete = this.page.locator(
      "xpath=(//div[contains(text(),'Delete')])[1]",
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

  private async navigateToKarat(): Promise<void> {
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
    await this.Karat.click();
  }

  private async ensureOnKaratPage(): Promise<void> {
    const onKaratPage = await this.AddKaratDetails.waitFor({
      state: "visible",
      timeout: 3000,
    })
      .then(() => true)
      .catch(() => false);
    if (!onKaratPage) {
      await this.navigateToKarat();
      await this.AddKaratDetails.waitFor({ state: "visible", timeout: 15000 });
    }
    await this.waitForLoaderToDisappear();
  }

  async validateAddKarat(): Promise<void> {
    await this.navigateToKarat();

    await this.AddKaratDetails.click();
    await this.page.waitForTimeout(3000);
    await this.KaratDetails.fill("11");
    await this.RadioHallmark.click();
    await this.PercentageFrom.fill("1");
    await this.page.waitForTimeout(1000);
    await this.PercentageTo.fill("5");
    await this.btnAdd.click();
  }

  async validateEditKarat(): Promise<void> {
    await this.ensureOnKaratPage();

    const element = this.btnEdit;
    await element.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(element);

    await this.KaratDetails.fill("18");
    await this.btnUpdate.click();
  }
  async deleteKarat(): Promise<void> {
    await this.ensureOnKaratPage();

    const element = this.btnDelete;
    await element.waitFor({ state: "attached", timeout: 30000 });
    await element.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(element);

    await this.btnYes.click();
  }
}
