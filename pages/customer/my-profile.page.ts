import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import { setPrimeCalendarDate, type CalendarDate } from '../../utils/calendar-helper';

/** `/my-profile` — view/edit of the placeholder profile created at registration. */
export class MyProfilePage extends BasePage {
  private readonly editPencilIcon: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly mobileNumberInput: Locator;
  private readonly emailInput: Locator;
  private readonly dobInput: Locator;
  private readonly updateProfileButton: Locator;
  private readonly verifiedEmailBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.editPencilIcon = page.locator('.pi-pencil');
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.mobileNumberInput = page.locator('#mobileNumber');
    this.emailInput = page.locator('#email');
    this.dobInput = page.locator('#dateOfBirth');
    this.updateProfileButton = page.getByRole('button', { name: 'Update Profile' });
    this.verifiedEmailBadge = page.getByText('Verified', { exact: true });
  }

  async open(): Promise<void> {
    await this.goto('/my-profile');
    await this.waitForUrl(/\/my-profile/i);
  }

  async openEditModal(): Promise<void> {
    await this.editPencilIcon.first().click();
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  firstNameField(): Locator {
    return this.firstNameInput;
  }

  lastNameField(): Locator {
    return this.lastNameInput;
  }

  mobileNumberField(): Locator {
    return this.mobileNumberInput;
  }

  emailField(): Locator {
    return this.emailInput;
  }

  dateOfBirthField(): Locator {
    return this.dobInput;
  }

  updateProfileButtonLocator(): Locator {
    return this.updateProfileButton;
  }

  verifiedEmailBadgeLocator(): Locator {
    return this.verifiedEmailBadge;
  }

  async clearEmail(): Promise<void> {
    await this.emailInput.fill('');
  }

  async enterEmail(value: string): Promise<void> {
    await this.emailInput.click();
    await this.emailInput.fill(value);
  }

  async setDateOfBirth(date: CalendarDate): Promise<void> {
    await setPrimeCalendarDate(this.page, this.dobInput, date);
  }
}
