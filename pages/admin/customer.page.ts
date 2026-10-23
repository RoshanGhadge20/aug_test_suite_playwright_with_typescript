import { Locator, Page } from '@playwright/test';

export class CustomerPage {
  constructor(private page: Page) {}


  get profile(): Locator {
    return this.page.locator("//img[@alt='profile']");
  }
  get branchDropdown(): Locator {
    return this.page.locator('#branch');
  }
  get arrow(): Locator {
    return this.page.locator("//your-arrow-xpath");
  }
  get customer(): Locator {
    return this.page.locator("//your-customer-xpath");
  }
  get allCustomer(): Locator {
    return this.page.locator("//your-all-customer-xpath");
  }
  get addCustomer(): Locator {
    return this.page.locator("//your-add-customer-xpath");
  }

  get leadSource(): Locator {
    return this.page.locator("//select[@formcontrolname='leadSource']");
  }
  get firstName(): Locator {
    return this.page.locator("//input[@formcontrolname='firstName']");
  }
  get lastName(): Locator {
    return this.page.locator("//input[@formcontrolname='lastName']");
  }
  get mobileNumber(): Locator {
    return this.page.locator("//input[@formcontrolname='mobileNumber']");
  }
  get sendOtp(): Locator {
    return this.page.locator("//button[contains(.,'Send OTP')]");
  }
  get enterOtp(): Locator {
    return this.page.locator("//input[@formcontrolname='otp']");
  }
  get verifyOtp(): Locator {
    return this.page.locator("//button[contains(.,'Verify')]");
  }

  get stateDropdown(): Locator {
    return this.page.locator("//select[@formcontrolname='stateId']");
  }
  get cityDropdown(): Locator {
    return this.page.locator("//select[@formcontrolname='cityId']");
  }
  get pinCode(): Locator {
    return this.page.locator("//input[@formcontrolname='pinCode']");
  }
  get goldLoanDropdown(): Locator {
    return this.page.locator("//select[@formcontrolname='goldLoan']");
  }
  get addButton(): Locator {
    return this.page.locator("//button[contains(.,'Add')]");
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