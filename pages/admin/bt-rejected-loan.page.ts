import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { BtLoanPage } from "./bt-loan.page";


export class BtRejectedLoanPage extends AdminBasePage {
  private readonly btnYes: Locator;
  private readonly profile: Locator;
  private readonly branchDropdown: Locator;
  private readonly arrow: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly kebabMenu: Locator;
  private readonly textField: Locator;
  private readonly kebabMenu1: Locator;
  private readonly btnRCHapproval: Locator;
  private readonly selapproval: Locator;
  private readonly comments: Locator;
  private readonly btnSubmit: Locator;
  private readonly btnNext: Locator;

  constructor(page: Page) {
    super(page);
    this.btnYes = this.page.locator("xpath=//span[contains(.,'Yes')]");
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.customerManagementBtn = this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[text()='more_vert']])[1]",
    );
    this.textField = this.page.locator(
      "xpath=//input[@placeholder='enter text here']",
    );
    this.kebabMenu1 = this.page.locator(
      "xpath=(//mat-row[.//*[contains(text(),'BT Loan')]]//mat-icon[normalize-space()='more_vert'])[1]",
    );
    this.btnRCHapproval = this.page.locator(
      "xpath=//button[normalize-space()='RCH Approval']",
    );
    this.selapproval = this.page.locator(
      "xpath=//select[@id='approvalStatus']",
    );
    this.comments = this.page.locator("xpath=//textarea[@id='comments']");
    this.btnSubmit = this.page.locator(
      "xpath=//span[normalize-space()='Submit']",
    );
    this.btnNext = this.page.locator("xpath=//span[normalize-space()='Next']");
  }

  async rchApproval(): Promise<void> {
    await this.btnRCHapproval.click();
    await this.page.waitForTimeout(5000);

    for (let i = 0; i < 5; i++) {
      await this.page.waitForTimeout(5000);
      await this.jsClick(this.btnNext);
    }

    const element = this.selapproval;
    await this.page.waitForTimeout(3000);
    await element.scrollIntoViewIfNeeded();
    await this.selapproval.selectOption({ label: "Rejected" });
    await this.page.waitForTimeout(3000);
    await this.comments.fill("Rejected");
    await this.page.waitForTimeout(500);
    await this.btnSubmit.click();
  }

  async validateRejectBTLaon(): Promise<void> {
    const data = getLoginData();
    const btLoan = new BtLoanPage(this.page);

    await this.page.waitForTimeout(3000);

    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.page.waitForTimeout(500);

    await this.customerManagementBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(7000);

    const appraisalRequests = this.page.locator(
      "xpath=//span[normalize-space()='Appraiser Requests']",
    );
    await appraisalRequests.waitFor({ state: "visible" });
    await appraisalRequests.click();

    await this.page.waitForTimeout(5000);
    await this.textField.fill(data.firstName);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);

    await this.kebabMenu1.click();
    await this.page.waitForTimeout(3000);

    const applyBTLoan = this.page.locator(
      "xpath=//button[normalize-space()='Apply BT Loan']",
    );
    await this.jsClick(applyBTLoan);
    await this.page.waitForTimeout(500);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);

    const clickBankNameBox = this.page.locator(
      "xpath=//span[@class='ng-arrow-wrapper']",
    );
    await clickBankNameBox.click();
    const dropdown = this.page.locator(
      "xpath=//ng-select[@formcontrolname='multiSelect']",
    );
    await this.waitForLoaderToDisappear();
    await dropdown.click();
    const clickBankName = this.page.locator(
      "xpath=(//span[@class='checkmark checkmark-custom'])[2]",
    );
    await clickBankName.click();
    await this.page.waitForTimeout(500);

    const customer = this.page.locator("xpath=(//p[contains(.,'CID')])[1]");
    await customer.click();
    await this.page.waitForTimeout(500);

    const companyTypeDropdown = this.page.locator(
      "xpath=//select[@id='companyType']",
    );
    await companyTypeDropdown.selectOption({ label: "NBFC" });
    await this.page.waitForTimeout(3000);

    const loanNumberInput = this.page.locator(
      "xpath=//input[@id='loanNumber']",
    );
    await loanNumberInput.fill(btLoan.generateLoanNumber());
    await this.page.waitForTimeout(3000);

    const loanAmountValue = 150000;
    const loanAmountInput = this.page.locator(
      "xpath=//input[@id='loanAmount']",
    );
    await loanAmountInput.fill(String(loanAmountValue));
    await this.page.waitForTimeout(2000);

    const releaseAmountInput = this.page.locator(
      "xpath=//input[@id='releaseAmount']",
    );
    await releaseAmountInput.fill(String(loanAmountValue));
    await this.page.waitForTimeout(2000);

    await btLoan.selectLoanDates();
    await this.page.waitForTimeout(500);

    await this.page.waitForTimeout(5000);
    await btLoan.safeClick();
    await this.page.waitForTimeout(5000);
    await btLoan.validateOrnaments();
    await this.page.waitForTimeout(5000);
    await btLoan.safeClick();
    await this.page.waitForTimeout(5000);
    await btLoan.selectScheme();
    await this.page.waitForTimeout(5000);
    await btLoan.safeClick();
    await btLoan.validateBankDetails();
    await this.page.waitForTimeout(5000);
    await btLoan.safeClick();
    await btLoan.uploadDocuments();
    await this.page.waitForTimeout(5000);
    await btLoan.safeClick();
    await this.page.waitForTimeout(5000);

    // RCH Approval with Rejected status
    await this.rchApproval();
  }
}
