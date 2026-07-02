import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { adminRoleCreds } from '../../config/urls';
import { getTargetEnv } from '../../config/environments';
import type { AdminRole } from '../../config/roles';

export class AdminLoginPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  private readonly userId = () => this.page.locator("xpath=//input[@placeholder='Email ID / Mobile Number']");
  private readonly signInWithOtp = () => this.page.locator("xpath=//button[normalize-space()='Sign In With OTP']");
  private readonly otpOne = () => this.page.locator("xpath=//input[@formcontrolname='one']");
  private readonly otpTwo = () => this.page.locator("xpath=//input[@formcontrolname='two']");
  private readonly otpThree = () => this.page.locator("xpath=//input[@formcontrolname='three']");
  private readonly otpFour = () => this.page.locator("xpath=//input[@formcontrolname='four']");
  private readonly submitOtp = () => this.page.locator("xpath=//button[contains(.,'Submit OTP')]");
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly logoutBtn = () => this.page.locator("xpath=//span[normalize-space()='Sign Out']")
  // ;

  async open(): Promise<void> { await this.goto('/auth/login'); }

  /** mobile + 4-digit OTP (Java entered digit-by-digit into formcontrolname one..four). */
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
  }

  /** Port of Java logout(): open profile menu -> logout. */
  async logout(): Promise<void> {
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.logoutBtn().click();
    await this.waitForLoaderToDisappear();
  }

  /** Port of loginWithBM/OPS/Partner/Appraiser: logout then login as the requested role. */
  async loginAs(role: AdminRole): Promise<void> {
    await this.logout();
    const { mobile, otp } = adminRoleCreds(role, getTargetEnv());
    if (!mobile) {
      throw new Error(`Missing credentials for role '${role}'. Set the env variable for this role's mobile number.`);
    }
    await this.login(mobile, otp);
  }
}
