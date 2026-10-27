import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { adminRoleCreds } from "../../config/urls";
import { getTargetEnv } from "../../config/environments";
import type { AdminRole } from "../../config/roles";
import {
  clearClientSession,
  isAlreadySignedInAs,
  loginWithSessionCache,
} from "../../utils/auth/admin-session-cache";

export class AdminLoginPage extends AdminBasePage {
  private readonly userId: Locator;
  private readonly signInWithOtp: Locator;
  private readonly password: Locator;
  private readonly loginButton: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly errorToast: Locator;
  private readonly forgotPasswordMobileInput: Locator;
  private readonly forgotPasswordSubmitButton: Locator;
  private readonly otpOne: Locator;
  private readonly otpTwo: Locator;
  private readonly otpThree: Locator;
  private readonly otpFour: Locator;
  private readonly submitOtp: Locator;
  private readonly profile: Locator;
  private readonly logoutBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.userId = this.page.locator(
      "xpath=//input[@placeholder='Email ID / Mobile Number']",
    );
    this.signInWithOtp = this.page.locator(
      "xpath=//button[normalize-space()='Sign In With OTP']",
    );
    this.password = this.page.locator(
      "xpath=//input[@formcontrolname='password']",
    );
    this.loginButton = this.page.locator(
      "xpath=//button[normalize-space()='Login']",
    );
    this.forgotPasswordLink = this.page.locator(
      "xpath=//*[normalize-space(text())='Forgot Password?']",
    );
    this.errorToast = this.page.locator(
      "xpath=//div[contains(@class,'toast-message')]",
    );
    this.forgotPasswordMobileInput = this.page.locator(
      "xpath=//input[@formcontrolname='email']",
    );
    this.forgotPasswordSubmitButton = this.page.locator(
      "xpath=//button[@id='kt_login_signin_submit']",
    );
    this.otpOne = this.page.locator("xpath=//input[@formcontrolname='one']");
    this.otpTwo = this.page.locator("xpath=//input[@formcontrolname='two']");
    this.otpThree = this.page.locator(
      "xpath=//input[@formcontrolname='three']",
    );
    this.otpFour = this.page.locator("xpath=//input[@formcontrolname='four']");
    this.submitOtp = this.page.locator(
      "xpath=//button[contains(.,'Submit OTP')]",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.logoutBtn = this.page.locator(
      "xpath=//span[normalize-space()='Sign Out']",
    );
  }

  async open(): Promise<void> {
    await this.goto("/login");
  }

  async login(mobile: string, otp: string): Promise<void> {
    await this.open();
    await this.userId.fill(mobile);
    await this.signInWithOtp.click();
    // OTP entry screen can be slow on UAT (SMS gateway latency); wait generously.
    await this.otpOne.waitFor({ state: "visible", timeout: 60_000 });
    const normalizedOtp = (otp ?? "").toString().replace(/\D/g, "");
    if (normalizedOtp.length < 4) {
      throw new Error(
        `Missing or invalid admin OTP for mobile ${mobile}. Set the role-specific OTP env var or ADMIN_OTP.`,
      );
    }
    const inputs = [this.otpOne, this.otpTwo, this.otpThree, this.otpFour];
    for (let i = 0; i < 4; i++) await inputs[i].fill(normalizedOtp[i] ?? "");
    await this.submitOtp.click();
    await this.waitForLoaderToDisappear();
    await this.page
      .waitForURL((url) => !url.pathname.toLowerCase().includes("/auth/"), {
        timeout: 15_000,
      })
      .catch(() => {});
    if (this.page.url().toLowerCase().includes("/auth/")) {
      throw new Error(
        `Login did not complete for mobile ${mobile} — still on an /auth/* route after OTP submission. ` +
          "Possible causes: rejected/expired OTP, or a session conflict from another concurrent login as the same account.",
      );
    }
  }

  async loginWithPassword(userId: string, password: string): Promise<void> {
    await this.open();
    await this.userId.fill(userId);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async getLoginErrorMessage(timeout = 10_000): Promise<string | null> {
    try {
      await this.errorToast.first().waitFor({ state: "visible", timeout });
      return (await this.errorToast.first().innerText()).trim();
    } catch {
      return null;
    }
  }

  async openForgotPassword(): Promise<void> {
    await this.open();
    await this.forgotPasswordLink.first().click();
    await this.page.waitForURL(/forgot-password/i, { timeout: 15_000 });
  }

  async submitForgotPassword(userId: string): Promise<void> {
    await this.forgotPasswordMobileInput.fill(userId);
    await this.forgotPasswordSubmitButton.click();
  }

  async logout(): Promise<void> {
    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.page
      .locator(".ngx-toastr")
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    const onAuthPage = () => this.page.url().toLowerCase().includes("/auth/");
    const profileShown = await this.profile
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (!profileShown) {
      if (onAuthPage()) {
        console.log(
          "logout(): already on an /auth/* page — no active session to sign out of.",
        );
        return;
      }
      console.log(
        `logout(): profile icon not visible yet at ${this.page.url()} — trying the click anyway.`,
      );
    }
    await this.profile.click({ timeout: 30_000 });
    await this.waitForLoaderToDisappear();
    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.page
      .locator(".ngx-toastr")
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});
    await this.logoutBtn.click({ timeout: 30_000 });
    await this.waitForLoaderToDisappear();
  }

  async loginAs(role: AdminRole): Promise<void> {
    const env = getTargetEnv();
    const { mobile, otp } = adminRoleCreds(role, env);
    if (!mobile) {
      throw new Error(
        `Missing credentials for role '${role}'. Set the env variable for this role's mobile number.`,
      );
    }
    // Already the right user with a still-valid saved session: nothing to do.
    if (await isAlreadySignedInAs(this.page, role, env)) {
      console.log(`✓ Already signed in as role="${role}" — skipping login.`);
      return;
    }
    // Check the saved session first. Do NOT click the app's Sign Out here: it revokes the token
    // cached for the role being left, so every later restore failed and forced a fresh login.
    await clearClientSession(this.page);
    await loginWithSessionCache(this.page, role, env, async () => {
      await this.login(mobile, otp);
    });
  }
}
