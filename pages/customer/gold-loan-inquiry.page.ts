import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class GoldLoanInquiryPage extends BasePage {
  private readonly enquireNowHeading: Locator;
  private readonly firstNameInput: Locator;
  private readonly mobileNumberInput: Locator;
  private readonly cityInput: Locator;
  private readonly termsCheckbox: Locator;
  private readonly submitButton: Locator;
  private readonly successHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.enquireNowHeading = page.getByText('Enquire Now!', { exact: false });
    this.firstNameInput = page.locator('#firstName');
    this.mobileNumberInput = page.locator('#mobileNumber');
    this.cityInput = page.locator('#referralCityName');
    this.termsCheckbox = page.getByRole('checkbox').first();
    this.submitButton = page.getByRole('button', { name: 'Submit' }).first();
    // Confirmed live: success is a PrimeNG dialog (`app-thank-you-campaign-dialog`), not a toast.
    this.successHeading = page.getByText('Thank you', { exact: true });
  }

  async open(): Promise<void> {
    await this.goto('/gold-loan');
    await this.enquireNowHeading.waitFor({ state: 'visible' });
  }

  /** State is a PrimeNG `p-dropdown` — click the trigger, then pick the first available option. */
  private stateDropdownTrigger(): Locator {
    return this.page.locator('div.p-dropdown').filter({ visible: true }).first();
  }

  async selectFirstAvailableState(): Promise<void> {
    await this.stateDropdownTrigger().click();
    const firstOption = this.page.locator('.p-dropdown-panel li[role="option"]').first();
    await firstOption.waitFor({ state: 'visible' });
    await firstOption.click();
  }

  async fillName(name: string): Promise<void> {
    await this.firstNameInput.fill(name);
  }

  async fillMobile(mobile: string): Promise<void> {
    await this.mobileNumberInput.fill(mobile);
  }

  async fillCity(city: string): Promise<void> {
    await this.cityInput.fill(city);
  }

  async acceptTerms(): Promise<void> {
    const isChecked = await this.termsCheckbox.isChecked().catch(() => false);
    if (!isChecked) {
      await this.termsCheckbox.check({ force: true });
    }
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /** State dropdown (mandatory) → City → accept terms → Submit, in the order the form requires. */
  async submitEnquiry(details: { name: string; mobile: string; city: string }): Promise<void> {
    await this.fillName(details.name);
    await this.fillMobile(details.mobile);
    await this.selectFirstAvailableState();
    await this.fillCity(details.city);
    await this.acceptTerms();
    await this.clickSubmit();
  }

  successHeadingLocator(): Locator {
    return this.successHeading;
  }
}
