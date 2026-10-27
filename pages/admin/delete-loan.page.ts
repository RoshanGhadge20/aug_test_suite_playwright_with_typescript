import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class DeleteLoanPage extends AdminBasePage {
  private readonly btnDeleteLoan: Locator;
  private readonly btnYesIWantToCancel: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly appliedLoan: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly assignPacketBtn: Locator;
  private readonly loanCancelReason: Locator;

  constructor(page: Page) {
    super(page);
    this.btnDeleteLoan = this.page.locator(
      "xpath=//span[normalize-space()='Delete Loan']",
    );
    this.btnYesIWantToCancel = this.page.locator(
      "xpath=//span[contains(.,'Yes I Want To Cancel This Process')]",
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
    this.appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.assignPacketBtn = this.page.locator(
      "xpath=//button[normalize-space()='Assign Packet']",
    );
    this.loanCancelReason = this.page.locator(
      "xpath=//select[@formcontrolname='loanCancelReason']",
    );
  }

  async validateDeleteLoan(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(3000);

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.assignPacketBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(4000);

    await this.btnDeleteLoan.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(4000);

    await this.loanCancelReason.waitFor({ state: "visible" });
    await this.loanCancelReason.selectOption({
      label: "Resolved financial need through other sources.",
    });
    await this.page.waitForTimeout(500);
    await this.btnYesIWantToCancel.click();
    await this.waitForLoaderToDisappear();
  }
}
