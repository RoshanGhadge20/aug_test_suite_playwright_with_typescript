import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { TestDataFactory } from "../../utils/data/test-data.factory";
import fs from "fs";

export class CustomerManagementPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  private readonly customer = () =>
    this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
  private readonly allcustomer = () =>
    this.page.locator("xpath=//span[normalize-space()='All Customers']");
  private readonly addCustomer = () =>
    this.page.locator("xpath=//span[normalize-space()='Add Customer']");
  private readonly selectlead = () =>
    this.page.locator("xpath=//select[@formcontrolname='leadSource']");
  private readonly firstName = () =>
    this.page.locator("xpath=//input[@placeholder='First Name']");
  private readonly lastName = () =>
    this.page.locator("xpath=//input[@placeholder='Last Name']");
  private readonly mobileNumber = () =>
    this.page.locator("xpath=//input[@placeholder='Enter mobile number']");
  private readonly sendOtp = () =>
    this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base w-100 mat-primary ng-star-inserted']",
    );
  private readonly enterOtp = () =>
    this.page.locator("xpath=//input[@placeholder='Enter OTP']");
  private readonly verify = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']",
    );
  private readonly selState = () =>
    this.page.locator("xpath=//select[@formcontrolname='stateId']");
  private readonly selCity = () =>
    this.page.locator("xpath=//select[@formcontrolname='cityId']");
  private readonly pinCode = () =>
    this.page.locator("xpath=//input[@placeholder='000 000']");
  private readonly selGoldloan = () =>
    this.page.locator("xpath=//select[@formcontrolname='moduleId']");
  private readonly addButton = () =>
    this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );

  private readonly statusId = () =>
    this.page.locator("xpath=//select[@formcontrolname='statusId']");

  private readonly cancelButton = () =>
    this.page.locator(
      "xpath=//button[@type='reset' and normalize-space()='Cancel']",
    );
  private readonly commentField = () =>
    this.page.locator("xpath=//textarea[@formcontrolname='comment']");

  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  private readonly branchDropdown = () =>
    this.page.locator("xpath=//select[@id='branch']");

  async clickOnCustomerManagementButton(): Promise<void> {
    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    // Confirmed live elsewhere in this suite: selecting any branch scope other than the
    // account's own assigned branch gets the session force-logged-out on UAT within ~3s
    // (backend rejects subsequent calls with 401/403, redirect to /auth/login). Leave the
    // account on its default branch scope instead of calling selectOption().
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(7000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.customer().click();
    await this.waitForLoaderToDisappear();
    await this.allcustomer().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    await this.addCustomer().click();
    await this.waitForLoaderToDisappear();
    await this.selectLead();
    await this.SearchInput();
  }

  async selectLead(): Promise<void> {
    const data = getLoginData();
    const dropdown = this.selectlead();
    await dropdown.waitFor({ state: "visible" });
    // leadSource options load asynchronously; wait until more than the placeholder is present.
    for (
      let i = 0;
      i < 15 && (await dropdown.locator("option").count()) <= 1;
      i++
    ) {
      await this.page.waitForTimeout(1000);
    }

    const options = (await dropdown.locator("option").allTextContents()).map(
      (o) => o.trim(),
    );
    const realOptions = options.filter(
      (o) => o && !/^(--\s*)?select\b/i.test(o) && !/^choose\b/i.test(o),
    );

    const target =
      data.leadName && realOptions.includes(data.leadName.trim())
        ? data.leadName.trim()
        : realOptions[0];
    if (!target)
      throw new Error("No selectable lead options in leadSource dropdown");
    await dropdown.selectOption({ label: target });
  }

  async SearchInput(): Promise<void> {
    const data = getLoginData();
    const mobileNumber = TestDataFactory.mobile();
    const pinCodeVal = this.generateRandomPin();

    await this.firstName().fill(data.firstName);
    await this.waitForLoaderToDisappear();

    await this.lastName().fill(data.lastName);
    await this.waitForLoaderToDisappear();

    await this.mobileNumber().fill(mobileNumber);

    await this.waitForLoaderToDisappear();

    await this.sendOtp().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(500);
    await this.enterOtp().fill("1234");
    await this.waitForLoaderToDisappear();

    await this.verify().click();
    await this.waitForLoaderToDisappear();

    await this.selState().selectOption({ label: data.state });

    await this.page.waitForTimeout(500);
    await this.selCity().selectOption({ label: data.city });

    await this.pinCode().fill(pinCodeVal);
    const pinCode = await this.page
      .locator("//input[@formcontrolname='pinCode']")
      .inputValue();

    console.log("PIN Code:", pinCode);
    await this.waitForLoaderToDisappear();

    await this.selectAsGoldLoan();

    await this.addButton().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);
    const customerId =
      (
        await this.page
          .locator(
            "(//span[normalize-space()='Customer ID']/following-sibling::span)[1]",
          )
          .textContent()
      )?.trim() || "";

    console.log("Customer ID captured:", customerId);

    fs.writeFileSync(
      "./testdata/admin/documents/customerData.json",
      JSON.stringify(
        {
          customerId,
          pinCode: pinCodeVal,
        },
        null,
        2,
      ),
    );

    // Verify what was saved
    const verify = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );

    console.log("Saved JSON:", verify);
  }
  generateRandomMobile(): string {
    return TestDataFactory.mobile();
  }

  generateRandomPin(): string {
    return String(Math.floor(100_000 + Math.random() * 900_000));
  }

  async parameterSelection(parameter: string): Promise<void> {
    await this.selGoldloan().selectOption({ label: parameter });
  }

  async selectAsGoldLoan(): Promise<void> {
    await this.parameterSelection("Gold Loan");
  }
  async validateDuplicateMobile(): Promise<string> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.branchDropdown().waitFor({ state: "visible" });
    // Tags the customer under "Augmont" (see openAddCustomerForm() above) — same fix, applied
    // here since this method also opens the Add Customer form directly.
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.customer().click();
    await this.waitForLoaderToDisappear();
    await this.allcustomer().click();
    await this.waitForLoaderToDisappear();
    await this.addCustomer().click();
    await this.waitForLoaderToDisappear();
    await this.selectLead();
    await this.firstName().fill(data.firstName);
    await this.lastName().fill(data.lastName);
    await this.mobileNumber().fill("9123456789");
    await this.page.waitForTimeout(500);
    await this.sendOtp().click();
    await this.waitForLoaderToDisappear();
    await this.selState().selectOption({ label: data.state });
    await this.page.waitForTimeout(2000);
    const errorLocator = this.page.locator(
      "xpath=//div[@aria-label='Mobile number is already exist.']",
    );
    const errorText = await errorLocator.innerText().catch(() => "");
    return errorText;
  }

  private async openAddCustomerForm(): Promise<void> {
    const data = getLoginData();
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.page.waitForTimeout(7000);
        await this.profile().click();
        await this.waitForLoaderToDisappear();
        await this.branchDropdown().waitFor({ state: "visible" });
        // Tags the customer under the "Augmont" branch from admin-data.xlsx instead of this
        // account's default branch — confirmed live safe under the admin role (unlike
        // appraiser, where switching branch scope forces a logout; see
        // clickOnCustomerManagementButton() above for the same fix).
        await this.branchDropdown().selectOption({ label: data.branchName });
        await this.page.waitForTimeout(5000);
        await this.expandSidebar();
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(1000);

        await this.jsClick(this.customer());
        await this.waitForLoaderToDisappear();
        if (
          !(await this.allcustomer()
            .isVisible()
            .catch(() => false))
        ) {
          await this.jsClick(this.customer());
          await this.waitForLoaderToDisappear();
        }
        await this.jsClick(this.allcustomer());
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(3000);

        await this.jsClick(this.addCustomer());
        await this.waitForLoaderToDisappear();
        return;
      } catch (err) {
        lastErr = err;
        await this.page.waitForTimeout(2000);
      }
    }
    throw lastErr;
  }

  async validateCancelButton(): Promise<boolean> {
    const data = getLoginData();
    await this.openAddCustomerForm();

    await this.firstName().fill(data.firstName);
    await this.lastName().fill(data.lastName);
    await this.mobileNumber().fill(TestDataFactory.mobile());
    await this.page.waitForTimeout(500);

    await this.cancelButton().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    return (await this.mobileNumber().count()) === 0;
  }

  async addCustomerWithStatus(
    status: "Confirm" | "Future Perspective",
  ): Promise<string> {
    const data = getLoginData();
    const mobileNumber = TestDataFactory.mobile();
    const pinCodeVal = this.generateRandomPin();

    await this.openAddCustomerForm();
    await this.selectLead();

    await this.firstName().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.lastName().fill(data.lastName);
    await this.waitForLoaderToDisappear();
    await this.mobileNumber().fill(mobileNumber);
    await this.waitForLoaderToDisappear();

    await this.sendOtp().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.enterOtp().fill("1234");
    await this.waitForLoaderToDisappear();
    await this.verify().click();
    await this.waitForLoaderToDisappear();

    await this.selState().selectOption({ label: data.state });
    await this.page.waitForTimeout(500);
    await this.selCity().selectOption({ label: data.city });
    await this.pinCode().fill(pinCodeVal);
    await this.waitForLoaderToDisappear();

    await this.selectAsGoldLoan();
    await this.waitForLoaderToDisappear();
    const statusSelect = this.statusId();
    if (await statusSelect.isEnabled()) {
      await statusSelect.selectOption({ label: status });
      await this.page.waitForTimeout(500);
    } else {
      const currentValue = (
        await statusSelect.locator("option:checked").textContent()
      )?.trim();
      if (currentValue !== status) {
        await this.cancelButton()
          .click()
          .catch(() => {});
        await this.waitForLoaderToDisappear().catch(() => {});
        throw new Error(
          `Select Status is disabled through this Add Customer form and defaults to "${currentValue}" — "${status}" cannot be selected here.`,
        );
      }
    }
    if (await this.commentField().count()) {
      await this.commentField().fill(`Status: ${status}`);
      await this.page.waitForTimeout(500);
    }

    await this.addButton().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const customerId =
      (
        await this.page
          .locator(
            "(//span[normalize-space()='Customer ID']/following-sibling::span)[1]",
          )
          .textContent()
      )?.trim() || "";
    await this.page.keyboard.press("Escape").catch(() => {});
    await this.page
      .locator(".cdk-overlay-backdrop")
      .click({ force: true })
      .catch(() => {});
    await this.page.waitForTimeout(1000);

    return customerId;
  }
  async validateIncorrectMobileNumber(): Promise<{
    sendOtpEnabled: boolean;
    mobileFieldInvalid: boolean;
  }> {
    const data = getLoginData();
    // await this.openAddCustomerForm();
    await this.jsClick(this.allcustomer());
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.jsClick(this.addCustomer());
    await this.waitForLoaderToDisappear();
    await this.firstName().fill(data.firstName);
    await this.lastName().fill(data.lastName);
    await this.mobileNumber().fill("12345");
    await this.page.waitForTimeout(500);

    const sendOtpEnabled = await this.sendOtp().isEnabled();
    const mobileClass = (await this.mobileNumber().getAttribute("class")) || "";
    const mobileFieldInvalid = mobileClass.includes("ng-invalid");

    return { sendOtpEnabled, mobileFieldInvalid };
  }
}
