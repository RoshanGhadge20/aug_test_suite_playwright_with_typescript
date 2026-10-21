import { Page } from '@playwright/test';
import { CustomerManagementPage } from '../pages/customerManagement.page';

export class Flow_CustomerManagement {
  private page: Page;
  private cm: CustomerManagementPage;

  // Test data (pass via constructor or Excel reader)
  private branchName: string;
  private leadName: string;
  private firstName: string;
  private lastName: string;
  private stateName: string;
  private cityName: string;

  constructor(
    page: Page,
    data: {
      branchName: string;
      leadName: string;
      firstName: string;
      lastName: string;
      stateName: string;
      cityName: string;
    }
  ) {
    this.page = page;
    this.cm = new CustomerManagementPage(page);
    this.branchName = data.branchName;
    this.leadName   = data.leadName;
    this.firstName  = data.firstName;
    this.lastName   = data.lastName;
    this.stateName  = data.stateName;
    this.cityName   = data.cityName;
  }

  // ─── Utility Methods ───────────────────────────────────────────

  generateRandomMobile(): string {
    const firstDigit = Math.floor(Math.random() * 4) + 6; // 6, 7, 8, or 9
    const rest = Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, '0');
    return `${firstDigit}${rest}`;
  }

  generateRandomPin(): string {
    const pin = Math.floor(Math.random() * 900_000) + 100_000; // 100000–999999
    return pin.toString();
  }

  // ─── Main Flow ─────────────────────────────────────────────────

  async clickOnCustomerManagementButton(): Promise<void> {
    await this.page.waitForTimeout(7000);

    // Click Profile
    await this.cm.loc_profile().click();
    console.log('Profile button is clicked');

    // Select Branch
    await this.cm.loc_branchDropdown().selectOption({ label: this.branchName });
    console.log(`Branch name selected: ${this.branchName}`);

    await this.page.waitForTimeout(7000);

    // Navigate to Customer Management
    await this.cm.loc_arrow().click();
    await this.page.waitForTimeout(1000);
    await this.cm.loc_customer().click();
    console.log('Customer Management button is clicked');

    await this.cm.loc_allCustomer().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    await this.cm.loc_addCustomer().click();

    // Sub-flows
    await this.selectLead();
    await this.searchInput();
  }

  // ─── Select Lead ───────────────────────────────────────────────

  async selectLead(): Promise<void> {
    try {
      const dropdown = this.cm.loc_leadSource();
      await dropdown.waitFor({ state: 'visible' });
      await this.page.waitForTimeout(2000);

      // Get all options
      const options = await dropdown.locator('option').allTextContents();
      console.log('Available lead options:', options);

      // Try selecting from test data
      if (this.leadName && this.leadName.trim() !== '') {
        try {
          await dropdown.selectOption({ label: this.leadName.trim() });
          console.log(`Lead selected: ${this.leadName}`);
          return;
        } catch {
          console.log(`Lead '${this.leadName}' not found in dropdown.`);
        }
      }

      // Fallback: select first non-empty, non-placeholder option
      const skipValues = ['-- Select --', 'Select', 'Choose...', ''];
      for (const option of options) {
        if (!skipValues.includes(option.trim())) {
          await dropdown.selectOption({ label: option.trim() });
          console.log(`Fallback lead selected: '${option.trim()}'`);
          return;
        }
      }

      // Last resort: select index 1
      if (options.length > 1) {
        await dropdown.selectOption({ index: 1 });
        console.log(`Fallback lead selected by index 1: '${options[1]}'`);
      } else {
        throw new Error('No lead options available in dropdown');
      }

    } catch (error) {
      console.error('Critical error in selectLead():', error);
      throw error;
    }
  }

  // ─── Search / Fill Form ────────────────────────────────────────

  async searchInput(): Promise<void> {
    const mobileNumber = this.generateRandomMobile();
    const pinCode      = this.generateRandomPin();

    // Fill First Name
    await this.cm.loc_firstName().fill(this.firstName);
    console.log(`First name entered: ${this.firstName}`);

    // Fill Last Name
    await this.cm.loc_lastName().fill(this.lastName);
    console.log(`Last name entered: ${this.lastName}`);

    // Fill Mobile & Send OTP
    await this.cm.loc_mobileNumber().fill(mobileNumber);
    console.log(`Mobile number entered: ${mobileNumber}`);
    await this.cm.loc_sendOtp().click();

    // Enter OTP
    await this.page.waitForTimeout(500);
    await this.cm.loc_enterOtp().fill('1234');
    console.log('OTP entered: 1234');

    // Verify OTP
    await this.cm.loc_verify().click();

    // Select State
    await this.cm.loc_stateDropdown().selectOption({ label: this.stateName });
    console.log(`State selected: ${this.stateName}`);

    // Select City
    await this.page.waitForTimeout(500);
    await this.cm.loc_cityDropdown().selectOption({ label: this.cityName });
    console.log(`City selected: ${this.cityName}`);

    // Fill Pin Code
    await this.cm.loc_pinCode().fill(pinCode);
    console.log(`Pin code entered: ${pinCode}`);

    // Select Gold Loan
    await this.selectAsGoldLoan();

    // Submit
    await this.cm.loc_addButton().click();
  }

  // ─── Dropdown Helpers ──────────────────────────────────────────

  async parameterSelection(parameter: string): Promise<void> {
    await this.cm.loc_goldLoan().selectOption({ label: parameter });
  }

  async selectAsGoldLoan(): Promise<void> {
    await this.parameterSelection('Gold Loan');
  }

  // ─── Loader Helper ─────────────────────────────────────────────

  async waitForLoaderToDisappear(): Promise<void> {
    // Replace with your actual loader locator
    const loader = this.page.locator('.loader, .spinner');
    await loader.waitFor({ state: 'hidden' }).catch(() => {
      console.log('Loader not found or already gone.');
    });
  }
}