import { Page, expect } from '@playwright/test';

export class CustomerPage {
  constructor(private page: Page) {}

  // Locators
  profile = this.page.locator("//img[@alt='profile']");
  branchDropdown = this.page.locator('#branch');
  arrow = this.page.locator("//your-arrow-xpath");
  customer = this.page.locator("//your-customer-xpath");
  allCustomer = this.page.locator("//your-all-customer-xpath");
  addCustomer = this.page.locator("//your-add-customer-xpath");

  leadSource = this.page.locator("//select[@formcontrolname='leadSource']");
  firstName = this.page.locator("//input[@formcontrolname='firstName']");
  lastName = this.page.locator("//input[@formcontrolname='lastName']");
  mobileNumber = this.page.locator("//input[@formcontrolname='mobileNumber']");
  sendOtp = this.page.locator("//button[contains(.,'Send OTP')]");
  enterOtp = this.page.locator("//input[@formcontrolname='otp']");
  verifyOtp = this.page.locator("//button[contains(.,'Verify')]");

  stateDropdown = this.page.locator("//select[@formcontrolname='stateId']");
  cityDropdown = this.page.locator("//select[@formcontrolname='cityId']");
  pinCode = this.page.locator("//input[@formcontrolname='pinCode']");
  goldLoanDropdown = this.page.locator("//select[@formcontrolname='goldLoan']");
  addButton = this.page.locator("//button[contains(.,'Add')]");

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
    const options = await this.leadSource.locator('option').allTextContents();

    if (options.includes(leadName)) {
      await this.leadSource.selectOption({ label: leadName });
    } else {
      // fallback
      for (const option of options) {
        if (
          option.trim() &&
          option !== '-- Select --' &&
          option !== 'Select'
        ) {
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

    await this.enterOtp.fill('1234');

    await this.verifyOtp.click();

    await this.stateDropdown.selectOption({
      label: data.stateName,
    });

    await this.cityDropdown.selectOption({
      label: data.cityName,
    });

    await this.pinCode.fill(pin);

    await this.goldLoanDropdown.selectOption({
      label: 'Gold Loan',
    });

    await this.addButton.click();
  }

  generateRandomMobile(): string {
    const firstDigit = Math.floor(Math.random() * 4) + 6;

    const remainingDigits = Math.floor(
      Math.random() * 1000000000
    )
      .toString()
      .padStart(9, '0');

    return `${firstDigit}${remainingDigits}`;
  }

  generateRandomPin(): string {
    return Math.floor(
      100000 + Math.random() * 900000
    ).toString();
  }
}