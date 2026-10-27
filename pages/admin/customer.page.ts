import { Locator, Page } from "@playwright/test";

export class CustomerPage {
  private readonly profile: Locator;
  private readonly branchDropdown: Locator;
  private readonly arrow: Locator;
  private readonly customer: Locator;
  private readonly allCustomer: Locator;
  private readonly addCustomer: Locator;
  private readonly leadSource: Locator;
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly mobileNumber: Locator;
  private readonly sendOtp: Locator;
  private readonly enterOtp: Locator;
  private readonly verifyOtp: Locator;
  private readonly stateDropdown: Locator;
  private readonly cityDropdown: Locator;
  private readonly pinCode: Locator;
  private readonly goldLoanDropdown: Locator;
  private readonly addButton: Locator;

  constructor(private readonly page: Page) {
    this.profile = this.page.locator("//img[@alt='profile']");
    this.branchDropdown = this.page.locator("#branch");
    this.arrow = this.page.locator("//your-arrow-xpath");
    this.customer = this.page.locator("//your-customer-xpath");
    this.allCustomer = this.page.locator("//your-all-customer-xpath");
    this.addCustomer = this.page.locator("//your-add-customer-xpath");
    this.leadSource = this.page.locator(
      "//select[@formcontrolname='leadSource']",
    );
    this.firstName = this.page.locator("//input[@formcontrolname='firstName']");
    this.lastName = this.page.locator("//input[@formcontrolname='lastName']");
    this.mobileNumber = this.page.locator(
      "//input[@formcontrolname='mobileNumber']",
    );
    this.sendOtp = this.page.locator("//button[contains(.,'Send OTP')]");
    this.enterOtp = this.page.locator("//input[@formcontrolname='otp']");
    this.verifyOtp = this.page.locator("//button[contains(.,'Verify')]");
    this.stateDropdown = this.page.locator(
      "//select[@formcontrolname='stateId']",
    );
    this.cityDropdown = this.page.locator(
      "//select[@formcontrolname='cityId']",
    );
    this.pinCode = this.page.locator("//input[@formcontrolname='pinCode']");
    this.goldLoanDropdown = this.page.locator(
      "//select[@formcontrolname='goldLoan']",
    );
    this.addButton = this.page.locator("//button[contains(.,'Add')]");
  }

  async navigateToCustomerManagement(branchName: string) {
    await this.profile.click();

    await this.branchDropdown.selectOption({
      label: branchName,
    });

    await this.page.waitForTimeout(2000);

    await this.arrow.click();
    await this.customer.click();
    await this.allCustomer.click();

    await this.addCustomer.click();
  }

  async selectLead(leadName: string) {
    const options = await this.leadSource.locator("option").allTextContents();

    if (options.includes(leadName)) {
      await this.leadSource.selectOption({ label: leadName });
    } else {
      // fallback
      for (const option of options) {
        if (option.trim() && option !== "-- Select --" && option !== "Select") {
          await this.leadSource.selectOption({ label: option });
          break;
        }
      }
    }
  }

  async fillCustomerDetails(data: {
    firstName: string;
    lastName: string;
    stateName: string;
    cityName: string;
  }) {
    const mobile = this.generateRandomMobile();
    const pin = this.generateRandomPin();

    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);

    await this.mobileNumber.fill(mobile);

    await this.sendOtp.click();

    await this.enterOtp.fill("1234");

    await this.verifyOtp.click();

    await this.stateDropdown.selectOption({
      label: data.stateName,
    });

    await this.cityDropdown.selectOption({
      label: data.cityName,
    });

    await this.pinCode.fill(pin);

    await this.goldLoanDropdown.selectOption({
      label: "Gold Loan",
    });

    await this.addButton.click();
  }

  generateRandomMobile(): string {
    const firstDigit = Math.floor(Math.random() * 4) + 6;

    const remainingDigits = Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0");

    return `${firstDigit}${remainingDigits}`;
  }

  generateRandomPin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
