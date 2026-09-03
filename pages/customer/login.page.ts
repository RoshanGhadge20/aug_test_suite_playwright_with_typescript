import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class CustomerLoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private mobileInput(): Locator {
    return this.page
      .locator('#mobileNumber')
      .or(this.page.locator("input[placeholder*='Mobile'], input[placeholder*='Phone'], input[type='tel']").first());
  }

  private readonly continueButton = () => this.page.getByRole('button', { name: 'Continue' });
  private readonly securityPinInputs = () => this.page.locator('#pin input');

  // Registration flow: unregistered mobile + OTP + first-time PIN setup (same screens as login —
  // see New Signup Window Test Plan.md §2). OTP/PIN boxes have no shared wrapper id, only
  // `maxlength="1"` — verified against the live DOM during exploration.
  private readonly otpOrPinDigitBoxes = () => this.page.locator('input[maxlength="1"]');
  private readonly verifyOtpButton = () => this.page.getByRole('button', { name: 'Verify OTP' });
  // `.first()`: this error text renders in two places at once — a `role="alert"` element (for
  // screen readers) and a plain `<span>` in the form itself — confirmed live via a Playwright
  // strict-mode violation ("resolved to 2 elements") when queried without disambiguation.
  private readonly otpErrorBanner = () =>
    this.page.getByText('The OTP entered is incorrect', { exact: false }).first();
  private readonly resendSmsButton = () => this.page.getByRole('button', { name: 'SMS' });
  private readonly resendCallButton = () => this.page.getByRole('button', { name: 'Call' });
  private readonly otpCountdown = () => this.page.getByText(/OTP expires in/i);
  private readonly proceedButton = () => this.page.getByRole('button', { name: 'Proceed' });
  private readonly pinMismatchError = () =>
    this.page.getByText('PINs do not match. Please try again').first();

  // Referral entry (confirmed live on the OTP-verification screen for a brand-new mobile number):
  // a collapsed "Have a referral code? Get exclusive benefits" banner that expands into a text
  // input on click. A valid code is validated inline ("Referral Code Applied 🎉" in green, no
  // separate Apply button — filling the field is enough). After OTP verify, a "Referral Success!"
  // modal appears ("You were referred by <name>") with its own "Proceed" button (same text/role
  // as the PIN-setup Proceed button, reused via `proceedButtonLocator()`).
  private readonly referralCodeBanner = () => this.page.getByText('Have a referral code?', { exact: true });
  private readonly referralCodeInput = () => this.page.getByPlaceholder('Enter your Referral Code');
  private readonly referralCodeAppliedMessage = () => this.page.getByText('Referral Code Applied', { exact: false });
  private readonly referralSuccessModalHeading = () => this.page.getByText('Referral Success!', { exact: true });

  async open(): Promise<void> {
    await this.goto('/login');
    await this.waitForLoginForm();
  }

  mobileNumberField(): Locator {
    return this.mobileInput();
  }

  continueButtonLocator(): Locator {
    return this.continueButton();
  }

  otpDigitInputs(): Locator {
    return this.otpOrPinDigitBoxes();
  }

  pinDigitInputs(): Locator {
    return this.otpOrPinDigitBoxes();
  }

  verifyOtpButtonLocator(): Locator {
    return this.verifyOtpButton();
  }

  otpErrorMessage(): Locator {
    return this.otpErrorBanner();
  }

  otpResendSmsButton(): Locator {
    return this.resendSmsButton();
  }

  otpResendCallButton(): Locator {
    return this.resendCallButton();
  }

  otpCountdownText(): Locator {
    return this.otpCountdown();
  }

  proceedButtonLocator(): Locator {
    return this.proceedButton();
  }

  pinMismatchErrorMessage(): Locator {
    return this.pinMismatchError();
  }

  referralCodeAppliedMessageLocator(): Locator {
    return this.referralCodeAppliedMessage();
  }

  referralSuccessModalHeadingLocator(): Locator {
    return this.referralSuccessModalHeading();
  }

  async openReferralCodeEntry(): Promise<void> {
    await this.referralCodeBanner().click();
    await this.referralCodeInput().waitFor({ state: 'visible' });
  }

  async enterReferralCode(code: string): Promise<void> {
    await this.referralCodeInput().fill(code);
  }

  async enterMobileNumber(mobile: string): Promise<void> {
    await this.mobileInput().click();
    await this.mobileInput().fill(mobile);
  }

  async clickContinue(): Promise<void> {
    await this.continueButton().click();
  }

  async enterOtp(otp: string): Promise<void> {
    const boxes = this.otpOrPinDigitBoxes();
    await boxes.first().waitFor({ state: 'visible', timeout: 15_000 });
    for (let i = 0; i < otp.length; i += 1) {
      await boxes.nth(i).fill(otp[i]);
    }
  }

  async clickVerifyOtp(): Promise<void> {
    await this.verifyOtpButton().click();
  }

  /** First-time PIN setup only — fills both the 6-digit PIN and confirm-PIN box groups. */
  async enterNewPin(pin: string, confirmPin: string): Promise<void> {
    const boxes = this.otpOrPinDigitBoxes();
    await boxes.first().waitFor({ state: 'visible', timeout: 15_000 });
    const combined = `${pin}${confirmPin}`;
    for (let i = 0; i < combined.length; i += 1) {
      await boxes.nth(i).fill(combined[i]);
    }
  }

  async clickProceed(): Promise<void> {
    await this.proceedButton().click();
  }

  /**
   * Drives mobile entry -> OTP -> (first-time PIN setup, if shown) -> dashboard.
   * Registration and login are the same code path here: they only fork on whether the
   * mobile number is already registered. Pass `pin` whenever the mobile number might be
   * unregistered; it's ignored if the PIN-setup screen doesn't appear.
   *
   * Where OTP verification lands is NOT fixed: an existing account goes straight to
   * /dashboard, and a brand-new account has been observed going through /login/verify-pin
   * on some runs and landing already-authenticated on a promotional page (e.g.
   * /digital-gold/buy) on others, skipping PIN-setup entirely — confirmed by reachability
   * of authenticated routes immediately afterwards. This method treats "any URL other than
   * /login/verify-otp" as success and normalizes to /dashboard from there.
   */
  async registerOrLoginCustomer(mobile: string, otp: string, pin?: string): Promise<void> {
    await this.open();
    await this.enterMobileNumber(mobile);
    await this.continueButton().waitFor({ state: 'visible' });
    await this.clickContinue();
    await this.page.waitForURL(/\/login\/verify-otp/i, { timeout: 20_000 });
    await this.enterOtp(otp);
    await this.clickVerifyOtp();

    await this.page.waitForURL((url) => !/\/login\/verify-otp/i.test(url.pathname), { timeout: 20_000 });

    if (/\/login\/verify-pin/i.test(this.page.url())) {
      if (!pin) {
        throw new Error('New account requires a PIN to be set — pass `pin` to registerOrLoginCustomer().');
      }
      await this.enterNewPin(pin, pin);
      await this.proceedButton().waitFor({ state: 'visible' });
      await this.clickProceed();
    }

    if (!/\/dashboard/i.test(this.page.url())) {
      await this.goto('/dashboard');
    }
    await this.page.waitForURL(/\/dashboard(?:\/|$|\?)/i, { timeout: 30_000 });
  }

  /**
   * Logs the current session out and returns to the mobile-entry screen. Unlike `open()`, this
   * retries the clear-storage/clear-cookies/goto sequence against a deadline rather than trying
   * once — a freshly-registered account has been confirmed live to bounce straight back from
   * `/login` to `/dashboard` on a clear majority of attempts (a fixed pre-wait up to 15s did not
   * reliably avoid it either, suggesting the session keeps getting silently refreshed rather than
   * expiring on a fixed timer). Use this instead of `open()` whenever the caller needs a guaranteed
   * logged-out state right after a `registerOrLoginCustomer()` call — see TC_Registration_002.
   */
  async logoutAndReturnToMobileEntry(timeoutMs = 60_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    do {
      await this.page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* ignore */
        }
      });
      await this.page.context().clearCookies();
      await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(2_000);
      if (/\/login/i.test(this.page.url())) {
        await this.mobileInput().waitFor({ state: 'visible', timeout: 10_000 });
        return;
      }
    } while (Date.now() < deadline);

    throw new Error(
      `logoutAndReturnToMobileEntry: session kept bouncing back to ${this.page.url()} instead of ` +
      `/login within ${timeoutMs}ms.`,
    );
  }

  private async waitForLoginForm(timeoutMs = 20_000): Promise<void> {
    if (!/\/login/i.test(this.page.url())) {
      await this.page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* ignore */
        }
      });
      await this.page.context().clearCookies();
      await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
    }
    await this.mobileInput().waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async login(mobile: string, otp: string): Promise<void> {
    await this.open();
    await this.loginWithExistingPin(mobile, otp);
  }

  /**
   * For a mobile number that already has a PIN set: entering it reveals a "6 digit security
   * pin" section on the SAME /login page (no separate /login/verify-otp screen at all) —
   * confirmed live, distinct from both the brand-new-number OTP flow and the no-PIN-yet
   * /login/verify-pin screen (see New Signup Window Test Plan.md §2). Assumes the caller is
   * already on /login (e.g. via `open()` or `logoutAndReturnToMobileEntry()`).
   *
   * Post-auth landing is not fixed here either — confirmed live landing on a promotional page
   * (e.g. /digital-gold/buy) instead of /dashboard on some runs, same as the brand-new-number
   * OTP flow. Normalizes to /dashboard rather than asserting it's the immediate destination.
   */
  async loginWithExistingPin(mobile: string, pin: string): Promise<void> {
    await this.mobileInput().click();
    await this.mobileInput().fill(mobile);
    await this.continueButton().waitFor({ state: 'visible' });
    await this.continueButton().click();
    await this.enterSecurityPin(pin);
    await this.continueButton().click();

    await this.page.waitForURL((url) => !/\/login\b/i.test(url.pathname), { timeout: 20_000 });
    if (!/\/dashboard/i.test(this.page.url())) {
      await this.goto('/dashboard');
    }
    await this.page.waitForURL(/\/dashboard(?:\/|$|\?)/i, { timeout: 30_000 });
  }

  private async enterSecurityPin(pin: string): Promise<void> {
    await this.securityPinInputs().first().pressSequentially(pin);
  }
}
