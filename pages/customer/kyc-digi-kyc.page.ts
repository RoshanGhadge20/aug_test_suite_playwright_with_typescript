import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import { setPrimeCalendarDate, type CalendarDate } from '../../utils/calendar-helper';

/**
 * `/kyc/digi-kyc` — the only in-app KYC step (PAN + DOB). Submitting hands off to a
 * third-party vendor (KARZA) for actual verification; see New Signup Window Test Plan.md §4.6.
 * `karzaProceedButtonLocator()` is for existence checks only — clicking it leaves the app
 * under test via an external redirect and must never be exercised in automated tests.
 */
export class KycDigiKycPage extends BasePage {
  private readonly panInput: Locator;
  private readonly dobInput: Locator;
  private readonly stateDropdown: Locator;
  private readonly cityDropdown: Locator;
  private readonly emailInput: Locator;
  private readonly verifyButton: Locator;
  private readonly panRequiredError: Locator;
  private readonly dobRequiredError: Locator;
  private readonly panInvalidError: Locator;
  private readonly stateRequiredError: Locator;
  private readonly cityRequiredError: Locator;
  private readonly emailRequiredError: Locator;
  private readonly karzaModalHeading: Locator;
  private readonly karzaCancelButton: Locator;
  private readonly karzaProceedButton: Locator;
  private readonly panAlreadyExistsError: Locator;
  private readonly verifiedModalHeading: Locator;
  private readonly verifiedModalProceedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.panInput = page.locator('#panCardNumber');
    this.dobInput = page.locator('#dateOfBirth');
    // State/City are cascading PrimeNG dropdowns (City's option list depends on the selected
    // State) — confirmed live 2026-07-06, not documented in the original exploration, which only
    // found PAN + DOB on this screen. `div.p-dropdown` (class, not the `<p-dropdown>` custom
    // element itself) is the actual clickable trigger; State is the first of the two, City second.
    this.stateDropdown = page.locator('div.p-dropdown').nth(0);
    this.cityDropdown = page.locator('div.p-dropdown').nth(1);
    this.emailInput = page.locator('#email');
    this.verifyButton = page.getByRole('button', { name: 'Verify' });
    this.panRequiredError = page.getByText('PAN Number is required');
    this.dobRequiredError = page.getByText('DOB is required');
    this.panInvalidError = page.getByText('Enter a valid PAN Number');
    this.stateRequiredError = page.getByText('Select a State');
    this.cityRequiredError = page.getByText('Select a City/District');
    this.emailRequiredError = page.getByText('Email is required');
    this.karzaModalHeading = page.getByText('Experience Smooth KYC with KARZA');
    this.karzaCancelButton = page.getByRole('button', { name: 'Cancel' });
    this.karzaProceedButton = page.getByRole('button', { name: 'Proceed for PAN Verification' });
    // Renders in two places at once (an alert region plus a plain element) — same duplicate
    // accessibility pattern as the OTP-incorrect error (see New Signup Window Test Plan.md §26
    // item 18); scope to .first() to avoid a strict-mode violation.
    this.panAlreadyExistsError = page.getByText('PAN Card already exists!').first();
    // Shown instead of the duplicate-PAN error when the PAN's e-KYC record has been freed (e.g.
    // via removeEkycRecord()) — confirmed live 2026-07-08 that Proceed then runs through KARZA's
    // (mocked, in UAT) verification and this success modal appears in-app, no external redirect.
    this.verifiedModalHeading = page.getByText('All Set! Verified!');
    this.verifiedModalProceedButton = page.getByRole('dialog').getByRole('button', { name: 'Proceed' });
  }

  /**
   * Navigating here right after `registerOrLoginCustomer()` can bounce back to a promotional page
   * (e.g. `/digital-gold/buy`) instead of landing on `/kyc/digi-kyc` — the same post-registration
   * "grace window" behavior confirmed live for `/login` (see `logoutAndReturnToMobileEntry()` in
   * `login.page.ts` and New Signup Window Test Plan.md §26 item 14). Retries against a deadline
   * rather than trusting a single navigation.
   */
  async open(timeoutMs = 60_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    do {
      await this.goto('/kyc/digi-kyc');
      const landed = await this.panInput
        .waitFor({ state: 'visible', timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (landed) {
        // The bounce-back can be delayed — confirmed live landing on /kyc/digi-kyc long enough
        // for panInput to become visible, then redirecting to /digital-gold/buy a moment later.
        // Settle first, THEN check the URL, rather than trusting an immediate check.
        await this.page.waitForTimeout(1_500);
        if (/\/kyc\/digi-kyc/i.test(this.page.url())) {
          // Confirmed live: the PAN input can also be replaced by a re-render shortly after
          // first becoming visible ("element was detached from the DOM, retrying" on the next
          // interaction) even when the page itself doesn't redirect — re-check it's still there.
          const stillThere = await this.panInput.isVisible().catch(() => false);
          if (stillThere) {
            return;
          }
        }
      }
    } while (Date.now() < deadline);

    throw new Error(
      `KycDigiKycPage.open: kept bouncing away from /kyc/digi-kyc (last seen: ${this.page.url()}) ` +
      `within ${timeoutMs}ms.`,
    );
  }

  panNumberField(): Locator {
    return this.panInput;
  }

  dateOfBirthField(): Locator {
    return this.dobInput;
  }

  verifyButtonLocator(): Locator {
    return this.verifyButton;
  }

  panRequiredErrorLocator(): Locator {
    return this.panRequiredError;
  }

  dobRequiredErrorLocator(): Locator {
    return this.dobRequiredError;
  }

  panInvalidErrorLocator(): Locator {
    return this.panInvalidError;
  }

  stateField(): Locator {
    return this.stateDropdown;
  }

  cityField(): Locator {
    return this.cityDropdown;
  }

  emailField(): Locator {
    return this.emailInput;
  }

  stateRequiredErrorLocator(): Locator {
    return this.stateRequiredError;
  }

  cityRequiredErrorLocator(): Locator {
    return this.cityRequiredError;
  }

  emailRequiredErrorLocator(): Locator {
    return this.emailRequiredError;
  }

  karzaModalHeadingLocator(): Locator {
    return this.karzaModalHeading;
  }

  karzaCancelButtonLocator(): Locator {
    return this.karzaCancelButton;
  }

  /** Existence-check only — never click; the click fires an external redirect out of the app under test. */
  karzaProceedButtonLocator(): Locator {
    return this.karzaProceedButton;
  }

  panAlreadyExistsErrorLocator(): Locator {
    return this.panAlreadyExistsError;
  }

  /**
   * Only safe to call for a PAN whose e-KYC state this test controls — either (a) already
   * registered to another account and left as-is, which short-circuits with an inline "PAN Card
   * already exists!" error (confirmed live 2026-07-06), or (b) already registered but freed via
   * `removeEkycRecord()` first, which instead runs through KARZA's (mocked, in UAT) verification
   * and surfaces `verifiedModalHeadingLocator()` (confirmed live 2026-07-08). For any genuinely
   * new/never-registered PAN, clicking this button redirects externally to the real KARZA site —
   * never call this outside those two API-controlled cases. See `karzaProceedButtonLocator()`.
   */
  async clickProceedForPanVerification(): Promise<void> {
    await expect(this.karzaProceedButton).toBeVisible({ timeout: 10_000 });
    await this.karzaProceedButton.click();
  }

  verifiedModalHeadingLocator(): Locator {
    return this.verifiedModalHeading;
  }

  /**
   * Only reachable after `clickProceedForPanVerification()` on a PAN freed via `removeEkycRecord()`
   * first. Clicking it navigates in-app to `/digital-gold/buy` — confirmed live 2026-07-08, no
   * external redirect.
   */
  async acknowledgeVerifiedModal(): Promise<void> {
    await this.verifiedModalProceedButton.click();
  }

  async clearPan(): Promise<void> {
    await this.panInput.fill('');
  }

  async clearDob(): Promise<void> {
    await this.dobInput.fill('');
  }

  /** Opens the State dropdown and selects the option matching `stateName` (e.g. "Maharashtra"). */
  async selectState(stateName: string): Promise<void> {
    await this.stateDropdown.click();
    const option = this.page.locator('li[role="option"]', { hasText: stateName });
    await option.first().click();
  }

  /**
   * City's option list depends on the State already selected (confirmed live: selecting
   * "Maharashtra" populated 52 Maharashtra cities). Picks the first available option rather than
   * a hardcoded city name, so this doesn't need to track which cities exist per state.
   */
  async selectFirstAvailableCity(): Promise<void> {
    await this.cityDropdown.click();
    const options = this.page.locator('li[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 10_000 });
    await options.first().click();
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.click();
    await this.emailInput.fill(email);
  }

  async enterPan(pan: string): Promise<void> {
    await this.panInput.click();
    await this.panInput.fill(pan);
  }

  async setDateOfBirth(date: CalendarDate): Promise<void> {
    await setPrimeCalendarDate(this.page, this.dobInput, date);
  }

  async clickVerify(): Promise<void> {
    // The calendar helper clicks the day cell with `force: true` (see calendar-helper.ts) to
    // work around PrimeNG's panel re-rendering; that can outrun Angular's own change-detection
    // tick that flips the form control (and Verify's disabled state) to valid. Wait for the
    // button to actually report enabled rather than clicking immediately.
    await expect(this.verifyButton).toBeEnabled({ timeout: 5_000 });
    await this.verifyButton.click();
  }

  async cancelKarzaModal(): Promise<void> {
    await this.karzaCancelButton.click();
  }
}
