import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class ManualChargesPage extends AdminBasePage {
  private readonly chargeName: Locator;
  private readonly chargeAmount: Locator;
  private readonly btnAdd: Locator;
  private readonly charges: Locator;
  private readonly viewManaulCharges: Locator;
  private readonly closeMark: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly loanDetails: Locator;
  private readonly kebabMenu: Locator;
  private readonly viewLoan: Locator;

  constructor(page: Page) {
    super(page);
    this.chargeName = this.page.locator(
      "xpath=//input[@formcontrolname='chargeName']",
    );
    this.chargeAmount = this.page.locator(
      "xpath=//input[@formcontrolname='charges']",
    );
    this.btnAdd = this.page.locator("xpath=//span[normalize-space()='Add']");
    this.charges = this.page.locator(
      "xpath=//body[1]/div[7]/div[2]/div[1]/mat-dialog-container[1]/kt-manual-charges-dialog[1]/kt-portlet[1]/div[1]/kt-portlet-body[1]/div[1]/table[1]/tbody[1]/tr[1]/td[2]",
    );
    this.viewManaulCharges = this.page.locator(
      "xpath=//span[normalize-space()='View Manual Charges Logs']",
    );
    this.closeMark = this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
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
  }

  async manualCharges(): Promise<{
    listEntry: {
      chargeName: string;
      charges: string;
      paidAmount: string;
      balanceAmount: string;
      date: string;
      status: string;
      createdBy: string;
    };
  }> {
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
    const dataRows = this.page
      .getByRole("row")
      .filter({ has: this.page.getByRole("cell") });
    const loanRowId = (
      await dataRows.first().getByRole("cell").nth(1).innerText()
    ).trim();
    const rowById = (id: string) =>
      this.page.getByRole("row", { name: new RegExp(`\\b${id}\\b`) });

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();

    const targetButton = this.page.locator(
      "xpath=//button[normalize-space()='Manual Charges']",
    );
    await targetButton.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await targetButton.click();
    await this.waitForLoaderToDisappear();

    await this.chargeName.fill("QA");
    await this.chargeAmount.fill("100");
    await this.btnAdd.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.page.waitForTimeout(5000);
    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.jsClick(rowById(loanRowId).getByRole("button").first());
    await this.waitForLoaderToDisappear();
    await this.viewLoan.click();
    await this.waitForLoaderToDisappear();

    const targetElement = this.viewManaulCharges;
    await targetElement.waitFor({ state: "visible", timeout: 10000 });
    await targetElement.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "auto", block: "center" }),
    );
    await targetElement.click();
    await this.waitForLoaderToDisappear();

    const logRow = this.page.locator(
      "xpath=//mat-dialog-container//table/tbody/tr[1]",
    );
    await logRow.waitFor({ state: "visible", timeout: 10000 });
    const logCells = logRow.locator("td");
    const listEntry = {
      chargeName: (await logCells.nth(0).innerText()).trim(),
      charges: (await logCells.nth(1).innerText()).trim(),
      paidAmount: (await logCells.nth(2).innerText()).trim(),
      balanceAmount: (await logCells.nth(3).innerText()).trim(),
      date: (await logCells.nth(4).innerText()).trim(),
      status: (await logCells.nth(5).innerText()).trim(),
      createdBy: (await logCells.nth(6).innerText()).trim(),
    };
    await this.page.waitForTimeout(2000);
    await this.closeMark.click();
    await this.waitForLoaderToDisappear();

    return { listEntry };
  }
}
