import * as os from "os";
import * as path from "path";
import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { TestDataFactory } from "../../utils/data/test-data.factory";

export class CrlPagePage extends AdminBasePage {
  private readonly customerRequestList: Locator;
  private readonly addLead: Locator;
  private readonly firstname: Locator;
  private readonly lastname: Locator;
  private readonly mobileNumber: Locator;
  private readonly btnAdd: Locator;
  private readonly nameField: Locator;
  private readonly view: Locator;
  private readonly close: Locator;
  private readonly btnExport: Locator;
  private readonly reportsDownloadBtn: Locator;
  private readonly listTotalLabel: Locator;
  private readonly requestStatusFilterIcon: Locator;
  private readonly statusMultiselectTrigger: Locator;
  private readonly statusMultiselectItems: Locator;
  private readonly applyNowBtn: Locator;
  private readonly reportsTable: Locator;
  private readonly reportsRefreshBtn: Locator;
  private readonly viewCustomerDialogTitle: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly allCustomers: Locator;
  private readonly addCustomerBtn: Locator;
  private readonly leadSourceDropdown: Locator;
  private readonly firstNameCustomer: Locator;
  private readonly lastNameCustomer: Locator;
  private readonly mobileNumberCustomer: Locator;
  private readonly sendOtp: Locator;
  private readonly enterOtp: Locator;
  private readonly verify: Locator;
  private readonly stateDropdown: Locator;
  private readonly cityDropdown: Locator;
  private readonly branchDropdownInternal: Locator;
  private readonly pinCode: Locator;
  private readonly selGoldloan: Locator;
  private readonly addButton: Locator;
  private readonly crlMobileResult: Locator;

  constructor(page: Page) {
    super(page);
    this.customerRequestList = this.page.locator(
      "xpath=//span[normalize-space()='Customer Request List']",
    );
    this.addLead = this.page.locator(
      "xpath=//span[normalize-space()='Add Lead']",
    );
    this.firstname = this.page.locator(
      "xpath=//input[@placeholder='First Name']",
    );
    this.lastname = this.page.locator(
      "xpath=//input[@placeholder='Last Name']",
    );
    this.mobileNumber = this.page.locator(
      "xpath=//input[@placeholder='Mobile Number']",
    );
    this.btnAdd = this.page.locator(
      "xpath=//button[contains(@class,'mat-raised-button')][normalize-space()='Add']",
    );
    this.nameField = this.page.locator("xpath=//input[@id='mat-input-0']");
    this.view = this.page.locator(
      "xpath=(//mat-icon[@role='img'][normalize-space()='visibility'])[1]",
    );
    this.close = this.page.locator("xpath=//img[@class='kt-pointer']");
    this.btnExport = this.page.locator(
      "xpath=//button[normalize-space()='Export']",
    );
    this.reportsDownloadBtn = this.page.locator(
      "xpath=//button[@icon='pi pi-download']",
    );
    this.listTotalLabel = this.page.locator(
      "xpath=//label[contains(@class,'kt-subheader__desc') and contains(normalize-space(),'Total')]",
    );
    this.requestStatusFilterIcon = this.page.locator(
      "xpath=//th[.//span[normalize-space()='Request Status']]//img[contains(@src,'filter.svg')]",
    );
    this.statusMultiselectTrigger = this.page.locator(
      "xpath=(//div[contains(@class,'ui-multiselect-trigger')])[1]",
    );
    this.statusMultiselectItems = this.page.locator(
      "xpath=//div[contains(@class,'ui-multiselect-items')]//li",
    );
    this.applyNowBtn = this.page.locator(
      "xpath=//button[normalize-space()='Apply Now']",
    );
    this.reportsTable = this.page.locator("xpath=(//p-table)[2]");
    this.reportsRefreshBtn = this.page.locator(
      "xpath=//button[@mattooltip='Refresh']",
    );
    this.viewCustomerDialogTitle = this.page.locator(
      "xpath=//h2[normalize-space()='View Customer'] | //*[normalize-space()='View Customer']",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator("xpath=//select[@id='branch']");
    this.customerManagementBtn = this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
    this.allCustomers = this.page.locator(
      "xpath=//span[normalize-space()='All Customers']",
    );
    this.addCustomerBtn = this.page.locator(
      "xpath=//button[normalize-space()='Add Customer']",
    );
    this.leadSourceDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='leadSource']",
    );
    this.firstNameCustomer = this.page.locator(
      "xpath=//input[@formcontrolname='firstName' and @placeholder='First Name']",
    );
    this.lastNameCustomer = this.page.locator(
      "xpath=//input[@formcontrolname='lastName' and @placeholder='Last Name']",
    );
    this.mobileNumberCustomer = this.page.locator(
      "xpath=//input[@formcontrolname='mobileNumber' and @placeholder='Enter mobile number']",
    );
    this.sendOtp = this.page.locator(
      "xpath=//button[normalize-space()='Send Otp']",
    );
    this.enterOtp = this.page.locator("xpath=//input[@formcontrolname='otp']");
    this.verify = this.page.locator(
      "xpath=//button[normalize-space()='Verify']",
    );
    this.stateDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='stateId']",
    );
    this.cityDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='cityId']",
    );
    this.branchDropdownInternal = this.page.locator(
      "xpath=//select[@formcontrolname='internalBranchId']",
    );
    this.pinCode = this.page.locator(
      "xpath=//input[@formcontrolname='pinCode']",
    );
    this.selGoldloan = this.page.locator(
      "xpath=//select[option[normalize-space()='Gold Loan']]",
    );
    this.addButton = this.page.locator(
      "xpath=//button[normalize-space()='Add']",
    );
    this.crlMobileResult = this.page.locator(
      "xpath=(//td[contains(@class,'ui-resizable-column')]/span[last()][normalize-space(text())])[4]",
    );
  }

  async CRLRequestPage(): Promise<void> {
    const data = getLoginData();
    const mobileNumber = TestDataFactory.mobile();
    const pinCode = String(Math.floor(100000 + Math.random() * 900000));

    await this.page.waitForTimeout(7000);
    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(3000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.customerManagementBtn.click();
    await this.waitForLoaderToDisappear();
    await this.customerRequestList.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);
    await this.page.keyboard.press("Escape").catch(() => {});
    await this.page
      .locator(".cdk-overlay-backdrop")
      .click({ force: true })
      .catch(() => {});
    await this.page.waitForTimeout(500);
    await this.addLead.click();
    await this.page.waitForTimeout(1500);

    await this.firstname.fill(data.firstName);
    await this.lastname.fill(data.lastName);
    await this.mobileNumber.fill(mobileNumber);

    await this.stateDropdown.selectOption({ label: data.state });
    await this.page.waitForTimeout(500);
    await this.cityDropdown.selectOption({ label: data.city });
    await this.page.waitForTimeout(500);
    await this.branchDropdownInternal.selectOption({
      label: data.branchName,
    });
    await this.page.waitForTimeout(500);

    await this.btnAdd.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    const crlMobile = await this.crlMobileResult
      .innerText()
      .then((t) => t.trim())
      .catch(() => mobileNumber);

    await this.page.waitForTimeout(3000);
    await this.page.reload();
    await this.page.waitForTimeout(3000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);
    await this.jsClick(this.customerManagementBtn);
    await this.waitForLoaderToDisappear();
    if (!(await this.allCustomers.isVisible().catch(() => false))) {
      await this.jsClick(this.customerManagementBtn);
      await this.waitForLoaderToDisappear();
    }
    await this.jsClick(this.allCustomers);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    await this.addCustomerBtn.waitFor({ state: "visible", timeout: 15000 });
    await this.addCustomerBtn.click();
    await this.page.waitForTimeout(1000);

    await this.leadSourceDropdown.selectOption({ label: data.leadName });
    await this.page.waitForTimeout(500);

    await this.firstNameCustomer.fill(data.firstName);
    await this.lastNameCustomer.fill(data.lastName);
    await this.mobileNumberCustomer.fill(crlMobile);
    await this.sendOtp.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.enterOtp.fill("1234");
    await this.verify.click();
    await this.waitForLoaderToDisappear();

    await this.stateDropdown.selectOption({ label: data.state });
    await this.page.waitForTimeout(500);
    await this.cityDropdown.selectOption({ label: data.city });
    await this.page.waitForTimeout(500);
    await this.pinCode.fill(pinCode);
    await this.selGoldloan.selectOption({ label: "Gold Loan" });
    await this.addButton.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }

  async viewFunctionality(): Promise<void> {
    const data = getLoginData();
    await this.nameField.fill(data.firstName);
    await this.view.click();
    await this.waitForLoaderToDisappear();
    await this.close.click();
    await this.waitForLoaderToDisappear();
  }

  private async navigateToCustomerRequestList(): Promise<void> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.page.waitForTimeout(5000);
        await this.profile.click();
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(3000);

        await this.branchDropdown.waitFor({ state: "visible" });
        await this.page.waitForTimeout(2000);

        await this.expandSidebar();
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(500);
        await this.jsClick(this.customerManagementBtn);
        await this.waitForLoaderToDisappear();
        if (!(await this.customerRequestList.isVisible().catch(() => false))) {
          await this.jsClick(this.customerManagementBtn);
          await this.waitForLoaderToDisappear();
        }
        await this.jsClick(this.customerRequestList);
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(3000);
        return;
      } catch (err) {
        lastErr = err;
        await this.page.waitForTimeout(2000);
      }
    }
    throw lastErr;
  }

  async validateAllDataWithRequest(): Promise<number> {
    // await this.navigateToCustomerRequestList();
    await this.listTotalLabel.waitFor({ state: "visible", timeout: 20000 });
    const totalText = await this.listTotalLabel.innerText();
    return parseInt(totalText.replace(/\D/g, ""), 10) || 0;
  }

  async validateViewFunctionality(): Promise<boolean> {
    //await this.navigateToCustomerRequestList();
    await this.view.first().click();
    await this.waitForLoaderToDisappear();
    const dialogVisible = await this.viewCustomerDialogTitle
      .first()
      .isVisible()
      .catch(() => false);
    await this.close.first().click();
    await this.waitForLoaderToDisappear();
    return dialogVisible;
  }

  async validateExportFunctionality(): Promise<{
    before: number;
    after: number;
  }> {
    // await this.navigateToCustomerRequestList();
    const before = parseInt(
      (await this.reportsTable.getAttribute("ng-reflect-total-records")) || "0",
      10,
    );
    await this.page
      .locator(".cdk-overlay-backdrop")
      .click({ force: true })
      .catch(() => {});
    await this.page.waitForTimeout(500);
    await this.btnExport.click({ force: true });
    await this.page.waitForTimeout(4000);

    await this.reportsRefreshBtn.click().catch(() => {});
    await this.page.waitForTimeout(3000);
    const after = parseInt(
      (await this.reportsTable.getAttribute("ng-reflect-total-records")) || "0",
      10,
    );

    return { before, after };
  }

  async validateManualDocumentDownload(): Promise<string> {
    await this.navigateToCustomerRequestList();

    const downloadBtn = this.reportsDownloadBtn.first();
    try {
      await downloadBtn.waitFor({ state: "visible", timeout: 15000 });
      const [download] = await Promise.all([
        this.page.waitForEvent("download", { timeout: 30_000 }),
        downloadBtn.click(),
      ]);
      const filePath = path.join(
        os.tmpdir(),
        download.suggestedFilename() || `crl-report-${Date.now()}.xlsx`,
      );
      await download.saveAs(filePath);
      return filePath;
    } catch {
      return "";
    }
  }

  async filterByRequestStatus(
    status: "OPEN" | "PROCESSING" | "CONVERTED" | "NOT INTERESTED" | "CLOSED",
  ): Promise<number> {
    // await this.navigateToCustomerRequestList();

    await this.requestStatusFilterIcon.scrollIntoViewIfNeeded();
    await this.requestStatusFilterIcon.click();
    await this.page.waitForTimeout(1000);
    await this.statusMultiselectTrigger.click();
    await this.page.waitForTimeout(1000);

    await this.statusMultiselectItems
      .filter({ hasText: status })
      .first()
      .click();
    await this.page.waitForTimeout(500);
    await this.statusMultiselectTrigger.click();
    await this.page.waitForTimeout(500);

    await this.applyNowBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const totalText = await this.listTotalLabel.innerText();
    return parseInt(totalText.replace(/\D/g, ""), 10) || 0;
  }
}
