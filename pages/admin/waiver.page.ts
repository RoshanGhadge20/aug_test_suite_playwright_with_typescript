import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class WaiverPage extends AdminBasePage {
  private readonly waviers: Locator;
  private readonly waviersAmount: Locator;
  private readonly btnAdd: Locator;
  private readonly viewwavier: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly loanDetails: Locator;
  private readonly kebabMenu: Locator;
  private readonly viewLoan: Locator;
  private readonly btnclose: Locator;
  private readonly closeMark: Locator;
  private readonly selWaiverName: Locator;

  constructor(page: Page) {
    super(page);
    this.waviers = this.page.locator(
      "xpath=//button[normalize-space()='Waivers']",
    );
    this.waviersAmount = this.page.locator(
      "xpath=//input[@formcontrolname='amount']",
    );
    this.btnAdd = this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Add']//button[@type='button']",
    );
    this.viewwavier = this.page.locator(
      "xpath=//span[contains(text(),'View Waivers Logs')]",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    this.loanManagement = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.loanDetails = this.page.locator(
      "xpath=//span[normalize-space()='Loan Details']",
    );
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.viewLoan = this.page.locator(
      "xpath=//button[normalize-space()='View Loan']",
    );
    this.btnclose = this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );
    this.closeMark = this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );
    this.selWaiverName = this.page.locator(
      "xpath=//select[@formcontrolname='waiverName']",
    );
  }

  async validateWavier(): Promise<[string, string]> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(5000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();

    const targetButton = this.page.locator(
      "xpath=//button[normalize-space()='Waivers']",
    );
    await targetButton.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(2000);
    await targetButton.click();
    await this.waitForLoaderToDisappear();

    await this.selWaiverName.waitFor({ state: "visible", timeout: 20000 });
    await this.page.waitForTimeout(2000);
    await this.selWaiverName.selectOption({ label: "Test3 Ok" });

    await this.waviersAmount.fill("100");
    await this.page.waitForTimeout(500);
    await this.btnAdd.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan.click();
    await this.waitForLoaderToDisappear();

    const targetElement = this.viewwavier;
    await targetElement.waitFor({ state: "visible", timeout: 10000 });
    await targetElement.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "auto", block: "center" }),
    );
    await targetElement.click();
    await this.waitForLoaderToDisappear();

    const targetEle = this.page.locator(
      "xpath=//mat-dialog-container//table/tbody/tr[1]/td[1]",
    );
    await targetEle.waitFor({ state: "visible", timeout: 10000 });
    const waviersName = (await targetEle.innerText()).trim();

    const targetElem = this.page.locator(
      "xpath=//mat-dialog-container//table/tbody/tr[1]/td[2]",
    );
    await targetElem.waitFor({ state: "visible", timeout: 10000 });
    const wavierCharge = (await targetElem.innerText()).trim();

    await this.page.waitForTimeout(2000);
    await this.closeMark.click();
    await this.waitForLoaderToDisappear();

    return [waviersName, wavierCharge];
  }
}
