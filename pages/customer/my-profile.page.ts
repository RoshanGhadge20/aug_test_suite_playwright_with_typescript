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
  private readonly referralCodeChip: Locator;
  private readonly referralCodeCopyIcon: Locator;
  private readonly referralCopySuccessMessage: Locator;
  private readonly totalReferralsLabel: Locator;
  private readonly pendingLabel: Locator;
  private readonly totalEarnedLabel: Locator;

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
    // Live DOM (confirmed against /my-profile): the "Refer and Earn" card renders the truncated
    // code as a pill — `<button>Ref: H38TF8... <i class="pi pi-copy"></i></button>`. The copy
    // action is wired to the `.pi-copy` icon specifically, NOT the button wrapper — clicking
    // elsewhere on the pill (e.g. its text/center) is a no-op, confirmed live via a click-capture
    // probe showing the event landing on the button with no resulting clipboard write or toast.
    this.referralCodeChip = page.getByRole('button', { name: /^Ref:/i });
    this.referralCodeCopyIcon = this.referralCodeChip.locator('.pi-copy');
    // Live toast markup (confirmed): a two-line message — "Success" heading + "Text Copied to
    // Clipboard!" body — with no role/toast-library class to key off, so match on the body text.
    this.referralCopySuccessMessage = page.getByText('Text Copied to Clipboard!', { exact: true });
    this.totalReferralsLabel = page.getByText('Total Referrals', { exact: true });
    this.pendingLabel = page.getByText('Pending', { exact: true });
    this.totalEarnedLabel = page.getByText('Total Earned', { exact: true });
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

  /** The referral code section sits above the fold; scroll back up to reach it after any in-page navigation. */
  async scrollToTop(): Promise<void> {
    await this.page.mouse.wheel(0, -10_000);
  }

  async copyReferralCode(): Promise<void> {
    await this.referralCodeChip.scrollIntoViewIfNeeded();
    await this.referralCodeCopyIcon.click();
  }

  referralCopySuccessMessageLocator(): Locator {
    return this.referralCopySuccessMessage;
  }

  /** Reads the referral code chip's text (for logging/assertion, not for clicking). */
  async getReferralCode(): Promise<string> {
    const text = await this.referralCodeChip.textContent();
    return (text ?? '').trim();
  }

  /** The "Refer and Earn" card renders the count as a sibling `<p>` immediately before the "Total Referrals" label. */
  async getTotalReferralCount(): Promise<number> {
    const countLocator = this.totalReferralsLabel.locator('xpath=preceding-sibling::*[1]');
    const text = await countLocator.textContent();
    return Number((text ?? '').trim());
  }

  /** Same "Refer and Earn" card layout as `getTotalReferralCount` — the ₹ amount is the sibling `<p>` immediately before the "Pending" label. */
  async getPendingReferralAmount(): Promise<number> {
    const amountLocator = this.pendingLabel.locator('xpath=preceding-sibling::*[1]');
    const text = await amountLocator.textContent();
    return this.parseAmount(text ?? '');
  }

  /** Same "Refer and Earn" card layout — the ₹ amount is the sibling `<p>` immediately before the "Total Earned" label. */
  async getTotalEarnedAmount(): Promise<number> {
    const amountLocator = this.totalEarnedLabel.locator('xpath=preceding-sibling::*[1]');
    const text = await amountLocator.textContent();
    return this.parseAmount(text ?? '');
  }
}
