import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class BmApprovalPage extends AdminBasePage {
  private readonly btnBM: Locator;
  private readonly clickArrow: Locator;
  private readonly clickArrow1: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly btnNext: Locator;
  private readonly btnSubmit: Locator;

  constructor(page: Page) {
    super(page);
    this.btnBM = this.page.locator("xpath=//button[contains(.,'BM RATING')]");
    this.clickArrow = this.page.locator(
      "xpath=//img[@name='incorrectApplicationFormForBM']",
    );
    this.clickArrow1 = this.page.locator(
      "xpath=//img[@name='incorrectGoldValuationForBM']",
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
    this.btnNext = this.page.locator(
      "xpath=//button[span[normalize-space() = 'Next']]",
    );
    this.btnSubmit = this.page.locator(
      "xpath=(//span[@class='mat-button-wrapper'])[2]",
    );
  }
  async validateBranchManager(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(5000);

    await this.btnBM.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(500);

    await this.page.waitForTimeout(5000);

    await this.clickArrow.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.clickArrow1.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForBM']",
    );
    await selectStatusDropdown.selectOption({ label: "Approved" });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnSubmit.click();
    await this.waitForLoaderToDisappear();
  }
}
