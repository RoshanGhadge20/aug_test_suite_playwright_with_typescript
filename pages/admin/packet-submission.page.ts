import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import fs from "fs";

export class PacketSubmissionPage extends AdminBasePage {
  private readonly btnSubmitPacket: Locator;
  private readonly selLocation: Locator;
  private readonly inputField: Locator;
  private readonly selBranch: Locator;
  private readonly btnVerify: Locator;
  private readonly inputMobileNumber: Locator;
  private readonly user: Locator;
  private readonly btnOTP: Locator;
  private readonly inputOTP: Locator;
  private readonly btnUpdate: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly customerIdFilter: Locator;
  private readonly filterbtn: Locator;

  constructor(page: Page) {
    super(page);
    this.btnSubmitPacket = this.page
      .locator(
        "xpath=//td[.//button[normalize-space()='SUBMIT PACKET']][not(.//img)]",
      )
      .first()
      .locator("xpath=.//button[normalize-space()='SUBMIT PACKET']");
    this.selLocation = this.page.locator(
      "xpath=//select[@formcontrolname='packetLocationId']",
    );
    this.inputField = this.page.locator(
      "xpath=//input[@formcontrolname='Barcode']",
    );
    this.selBranch = this.page.locator(
      "xpath=//select[@formcontrolname='partnerBranchId']",
    );
    this.btnVerify = this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']",
    );
    this.inputMobileNumber = this.page.locator(
      "xpath=//input[@formcontrolname='mobileNumber']",
    );
    this.user = this.page.locator("xpath=//label[normalize-space()='User']");
    this.btnOTP = this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']",
    );
    this.inputOTP = this.page.locator("xpath=//input[@formcontrolname='otp']");
    this.btnUpdate = this.page.locator(
      "xpath=//span[normalize-space()='Update']",
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
    this.customerIdFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
  }

  async packetSubmission(): Promise<void> {
    const data = getLoginData();
    this.page.on("dialog", (dialog) => dialog.accept().catch(() => {}));

    await this.page.waitForTimeout(5000);

    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

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

    // Filter by the customer ID written during onboarding (a first name can match older loans).
    const currentCustomer = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    const customerId = String(currentCustomer.customerId).trim();
    await this.customerIdFilter.fill(customerId);
    console.log(customerId);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnSubmitPacket.click();
    await this.waitForLoaderToDisappear();

    await this.selLocation.waitFor({ state: "visible", timeout: 20000 });
    await this.selLocation.selectOption({ label: "Partner Branch In" });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selBranch.selectOption({ label: "Nashik Road" });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    const ele = this.page.locator(
      "xpath=//div[@class='col-7 d-flex align-items-center']",
    );
    const str = (await ele.innerText()).trim();
    await this.page.waitForTimeout(500);

    await this.inputField.fill(str);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnVerify.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.inputMobileNumber.fill(data.partnerNumber);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.btnOTP.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.inputOTP.fill("1234");
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnVerify.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnUpdate.click();
    await this.waitForLoaderToDisappear();
  }
}
