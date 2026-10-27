import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class LoanViewPage extends AdminBasePage {
  // ── Locators ──────────────────────────────────────────────────────────────
  private readonly viewLoan: Locator;
  private readonly viewInterestEMI: Locator;
  private readonly interestPaid: Locator;
  private readonly TransactaionHistory: Locator;
  private readonly paidAmount: Locator;
  private readonly btnclose: Locator;
  private readonly partPayment: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly loanDetails: Locator;
  private readonly kebabMenu: Locator;

  constructor(page: Page) {
    super(page);
    this.viewLoan = this.page.locator(
      "xpath=//button[normalize-space()='View Loan']",
    );
    this.viewInterestEMI = this.page.locator(
      "xpath=//span[contains(text(),'View Interest EMI Logs')]",
    );
    this.interestPaid = this.page.locator("xpath=(//tbody/tr/td[3])[1]");
    this.TransactaionHistory = this.page.locator(
      "xpath=//span[contains(text(),'Transaction History')]",
    );
    this.paidAmount = this.page.locator(
      "xpath=(//td[@class='table-amount'])[1]",
    );
    this.btnclose = this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );
    this.partPayment = this.page.locator(
      "xpath=//span[contains(.,'View Part Payment Logs')]",
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
  }

  private async navigateToLoanDetails(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.branchDropdown.selectOption({ label: "Show All" });
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
  }

  async openViewLoanDetails(): Promise<boolean> {
    await this.navigateToLoanDetails();

    await this.page.waitForTimeout(2000);
    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan.click();
    await this.waitForLoaderToDisappear();

    return await this.viewInterestEMI
      .waitFor({ state: "visible", timeout: 20000 })
      .then(() => true)
      .catch(() => false);
  }

  async validateViewEmiLogs(): Promise<string> {
    const button = this.viewInterestEMI;
    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await button.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await button.click();
    await this.waitForLoaderToDisappear();

    const ele = this.interestPaid;
    await ele.waitFor({ state: "visible", timeout: 20000 });
    const str = (await ele.innerText()).trim();

    await this.btnclose.click();
    await this.waitForLoaderToDisappear();

    return str;
  }

  async validateViewTransactionHistory(): Promise<string> {
    await this.TransactaionHistory.click();
    await this.waitForLoaderToDisappear();
    const ele = this.paidAmount;
    const str = await ele
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => ele.innerText())
      .then((t) => t.trim())
      .catch(() => "No Records Found");

    await this.btnclose.click();
    await this.waitForLoaderToDisappear();

    return str;
  }

  async validateViewTransaction(): Promise<[string, string]> {
    await this.navigateToLoanDetails();

    await this.page.waitForTimeout(2000);
    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan.click();
    await this.waitForLoaderToDisappear();

    // Wait for spinner
    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});

    const ele = this.page.locator(
      "xpath=//span[contains(.,'View Part Payment Logs')]",
    );
    await ele.waitFor({ state: "visible", timeout: 20000 });
    await ele.evaluate((el: any) => {
      el.scrollIntoView({ block: "center" });
    });
    await this.page.waitForTimeout(100); // scrollBy(0, -100)
    await this.jsClick(ele);
    await this.page.waitForTimeout(2000);

    const ele1 = this.page.locator("xpath=(//td[@class='table-amount'])[1]");
    const str = (await ele1.innerText()).trim();

    await this.page.waitForTimeout(2000);
    const element1 = this.page.locator(
      "xpath=//span[@class='currency ng-star-inserted']",
    );
    const strg = (await element1.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.btnclose.click();
    await this.waitForLoaderToDisappear();

    return [str, strg];
  }


  async viewFunctionality(): Promise<[string, string, string]> {
    //await this.navigateToLoanDetails();

    await this.page.waitForTimeout(2000);
    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan.click();
    await this.waitForLoaderToDisappear();
    const element = this.viewInterestEMI;
    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await element.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await element.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const ele = this.interestPaid;
    const str = (await ele.innerText()).trim();
    await this.page.waitForTimeout(2000);

    await this.btnclose.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.TransactaionHistory.click();
    await this.waitForLoaderToDisappear();

    const element1 = this.paidAmount;
    const strng = (await element1.innerText()).trim();
    await this.page.waitForTimeout(500);

    const element2 = this.paidAmount;
    const strng1 = (await element2.innerText()).trim();

    await this.btnclose.click();
    await this.waitForLoaderToDisappear();

    return [str, strng, strng1];
  }
}
