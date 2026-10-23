import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { adminRoleCreds } from '../../config/urls';
import { getTargetEnv } from '../../config/environments';
import type { AdminRole } from '../../config/roles';
import { loginWithSessionCache } from '../../utils/auth/admin-session-cache';

export class AdminLoginPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  private readonly userId = () => this.page.locator("xpath=//input[@placeholder='Email ID / Mobile Number']");
  private readonly signInWithOtp = () => this.page.locator("xpath=//button[normalize-space()='Sign In With OTP']");
  // Password-based login form, alongside OTP on the same page (confirmed live via DOM inspection).
  private readonly password = () => this.page.locator("xpath=//input[@formcontrolname='password']");
  private readonly loginButton = () => this.page.locator("xpath=//button[normalize-space()='Login']");
  private readonly forgotPasswordLink = () => this.page.locator("xpath=//*[normalize-space(text())='Forgot Password?']");
  // ngx-toastr-style error toast (role="alertdialog"); shown for any failed login attempt with a
  // generic "Something went wrong." message — confirmed live, does not distinguish wrong-userId
  // from wrong-password from inactive-account.
  private readonly errorToast = () => this.page.locator("xpath=//div[contains(@class,'toast-message')]");
  // Forgot-password page (/auth/forgot-password): formcontrolname is "email" but the field is
  // actually a mobile-number input (placeholder "Mobile No.") — confirmed live.
  private readonly forgotPasswordMobileInput = () => this.page.locator("xpath=//input[@formcontrolname='email']");
  private readonly forgotPasswordSubmitButton = () => this.page.locator("xpath=//button[@id='kt_login_signin_submit']");
  private readonly otpOne = () => this.page.locator("xpath=//input[@formcontrolname='one']");
  private readonly otpTwo = () => this.page.locator("xpath=//input[@formcontrolname='two']");
  private readonly otpThree = () => this.page.locator("xpath=//input[@formcontrolname='three']");
  private readonly otpFour = () => this.page.locator("xpath=//input[@formcontrolname='four']");
  private readonly submitOtp = () => this.page.locator("xpath=//button[contains(.,'Submit OTP')]");
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly logoutBtn = () => this.page.locator("xpath=//span[normalize-space()='Sign Out']")
  // ;

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async login(mobile: string, otp: string): Promise<void> {
    await this.open();
    await this.userId().fill(mobile);
    await this.signInWithOtp().click();
    // OTP entry screen can be slow on UAT (SMS gateway latency); wait generously.
    await this.otpOne().waitFor({ state: 'visible', timeout: 60_000 });
    const normalizedOtp = (otp ?? '').toString().replace(/\D/g, '');
    if (normalizedOtp.length < 4) {
      throw new Error(`Missing or invalid admin OTP for mobile ${mobile}. Set the role-specific OTP env var or ADMIN_OTP.`);
    }
    const inputs = [this.otpOne(), this.otpTwo(), this.otpThree(), this.otpFour()];
    for (let i = 0; i < 4; i++) await inputs[i].fill(normalizedOtp[i] ?? '');
    await this.submitOtp().click();
    await this.waitForLoaderToDisappear();

    // Verify the OTP submission actually landed us in the app instead of trusting the loader
    // hiding as a success signal. Confirmed live: this method can resolve "cleanly" (no thrown
    // error) while still on an /auth/* route — e.g. a rejected OTP, a routing race, or simply
    // still sitting on the OTP-entry route (/auth/sign-in-otp, which doesn't contain "login" —
    // an earlier version of this check only excluded "login" and passed vacuously here) —
    // leaving callers like loginAs() to proceed into a business flow that only surfaces the
    // real problem several steps later as an unrelated locator timeout.
    await this.page
      .waitForURL((url) => !url.pathname.toLowerCase().includes('/auth/'), { timeout: 15_000 })
      .catch(() => {});
    if (this.page.url().toLowerCase().includes('/auth/')) {
      throw new Error(
        `Login did not complete for mobile ${mobile} — still on an /auth/* route after OTP submission. ` +
          'Possible causes: rejected/expired OTP, or a session conflict from another concurrent login as the same account.',
      );
    }
  }

  async loginWithPassword(userId: string, password: string): Promise<void> {
    await this.open();
    await this.userId().fill(userId);
    await this.password().fill(password);
    await this.loginButton().click();
  }

  /**
   * Waits for the error toast shown after a failed login attempt and returns its text, or null
   * if no toast appears within the timeout. The app shows a generic "Something went wrong."
   * toast for wrong-userId, wrong-password, and (per live confirmation) inactive-account cases —
   * it does not distinguish the reason in the message itself.
   */
  async getLoginErrorMessage(timeout = 10_000): Promise<string | null> {
    try {
      await this.errorToast().first().waitFor({ state: 'visible', timeout });
      return (await this.errorToast().first().innerText()).trim();
    } catch {
      return null;
    }
  }

  /** Clicks "Forgot Password?" and waits for the dedicated forgot-password route. */
  async openForgotPassword(): Promise<void> {
    await this.open();
    await this.forgotPasswordLink().first().click();
    await this.page.waitForURL(/forgot-password/i, { timeout: 15_000 });
  }

  /** Fills and submits the forgot-password form (mobile-number field, despite formcontrolname="email"). */
  async submitForgotPassword(userId: string): Promise<void> {
    await this.forgotPasswordMobileInput().fill(userId);
    await this.forgotPasswordSubmitButton().click();
  }

  /** Port of Java logout(): open profile menu -> logout. */
  async logout(): Promise<void> {

    await this.page.locator("xpath=//div[@id='spinner']").waitFor({ state: 'hidden' }).catch(() => {});
    // Confirmed live: a lingering ngx-toastr success toast (from the previous action) can
    // intercept pointer events on the profile icon for its whole visible duration, exhausting
    // the entire 30s click retry budget. Toasts auto-dismiss after a few seconds — wait for
    // it to clear first instead of retrying the click against it.
    await this.page.locator(".ngx-toastr").waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});

    // If the stored session already expired (or the previous step logged out), the app sits on
    // /auth/* with no profile icon — confirmed from the TC02 failure video, which ended on the
    // login page while this click waited for an icon that can never appear. There is nothing to
    // sign out of in that case, so skip straight to the login step in loginAs().
    const onAuthPage = () => this.page.url().toLowerCase().includes('/auth/');
    const profileShown = await this.profile()
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (!profileShown) {
      if (onAuthPage()) {
        console.log('logout(): already on an /auth/* page — no active session to sign out of.');
        return;
      }
      console.log(`logout(): profile icon not visible yet at ${this.page.url()} — trying the click anyway.`);
    }
    await this.profile().click({ timeout: 30_000 });
    await this.waitForLoaderToDisappear();
    await this.page.locator("xpath=//div[@id='spinner']").waitFor({ state: 'hidden' }).catch(() => {});
    await this.page.locator(".ngx-toastr").waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.logoutBtn().click({ timeout: 30_000 });
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of loginWithBM/OPS/Partner/Appraiser: logs out of the current role, then switches
   * to the requested role — using a per-role session cache (see
   * utils/auth/admin-session-cache.ts) to skip the OTP flow when a still-valid cached
   * session exists.
   *
   * NOTE: the real UI Sign Out (logout()) is kept as the first step, not replaced by a
   * client-side storage clear. Confirmed live: calling page.goto('/auth/login') a second
   * time while the previous role's session is still fresh (even after manually clearing
   * localStorage/cookies first) gets a 403 from the backend — a proper Sign Out click
   * terminates the session server-side first, which a client-side clear alone doesn't do.
   * Only after that real logout do we attempt to restore a cached session or do a fresh
   * OTP login; either way we land on a genuinely clean, unauthenticated /auth/login page.
   */
  async loginAs(role: AdminRole): Promise<void> {
    const env = getTargetEnv();
    const { mobile, otp } = adminRoleCreds(role, env);
    if (!mobile) {
      throw new Error(`Missing credentials for role '${role}'. Set the env variable for this role's mobile number.`);
    }
    await this.logout();
    await loginWithSessionCache(this.page, role, env, async () => {
      await this.login(mobile, otp);
    });
  }
}
