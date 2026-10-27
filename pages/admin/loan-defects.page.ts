import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

export class LoanDefectsPage extends AdminBasePage {
  private readonly loanDefects: Locator;
  private readonly btnEdit: Locator;
  private readonly addErrorMessage: Locator;
  private readonly enterErrorMessage: Locator;
  private readonly btnUpdate: Locator;
  private readonly btnEditMeassge: Locator;
  private readonly enterEditErrorMessage: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly AdminSetting: Locator;
  private readonly Masters: Locator;

  constructor(page: Page) {
    super(page);
    this.loanDefects = this.page.locator(
      "xpath=//span[normalize-space()='Loan Defects']",
    );
    this.btnEdit = this.page.locator(
      "xpath=(//span[@class='kt-pointer text-primary ng-star-inserted'][normalize-space()='Edit'])[1]",
    );
    this.addErrorMessage = this.page.locator(
      "xpath=//i[contains(.,' Add New Error Message ')]",
    );
    this.enterErrorMessage = this.page.locator(
      "xpath=//input[@placeholder='Enter issue']",
    );
    this.btnUpdate = this.page.locator(
      "xpath=//span[normalize-space()='Update']",
    );
    this.btnEditMeassge = this.page.locator("xpath=(//img[@alt='Edit'])[13]");
    this.enterEditErrorMessage = this.page.locator(
      "xpath=//input[@class='form-control ng-tns-c37-6 ng-pristine ng-valid ng-star-inserted ng-touched']",
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
    this.Masters = this.page.locator(
      "xpath=//span[normalize-space()='Masters']",
    );
  }
  private async navigateToLoanDefects(): Promise<void> {
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
    if (!(await this.Masters.isVisible())) {
      await this.AdminSetting.click();
    }
    await this.page.waitForTimeout(500);
    if (!(await this.loanDefects.isVisible())) {
      await this.Masters.click();
    }
    await this.page.waitForTimeout(500);
    const loanDefectsEl = this.loanDefects;
    await loanDefectsEl.waitFor({ state: "attached", timeout: 30000 });
    await loanDefectsEl.evaluate((el: HTMLElement) => {
      el.scrollIntoView({ block: "center" });
      el.click();
    });
    await this.waitForLoaderToDisappear();
  }

  async validatAddLoanDefects(): Promise<void> {
    await this.navigateToLoanDefects();

    await this.btnEdit.click();
    await this.addErrorMessage.click();
    await this.page.waitForTimeout(5000);
    await this.enterErrorMessage.fill("Incorrect adhar Number");
    await this.btnUpdate.click();
  }

  async validateEditLoanDefect(): Promise<void> {
    await this.navigateToLoanDefects();

    await this.btnEdit.click();

    const ele2 = this.btnEditMeassge;
    await ele2.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(ele2);

    await this.page.waitForTimeout(5000);

    const editingRow = this.page
      .locator("xpath=//tr[.//img[@alt='Correct']]")
      .first();
    await editingRow.waitFor({ state: "visible", timeout: 15000 });
    const editInput = editingRow.locator("xpath=.//input").first();
    await editInput.clear();
    await editInput.fill("New IGL");
    await editingRow.locator("xpath=.//img[@alt='Correct']").click();
    await this.page.waitForTimeout(2000);
    await this.btnUpdate.click();
  }
}
