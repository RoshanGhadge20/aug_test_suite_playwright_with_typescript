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

  async open(): Promise<void> {
    await this.goto('/login');
    await this.waitForLoginForm();
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
    await this.mobileInput().click();
    await this.mobileInput().fill(mobile);
    await this.continueButton().waitFor({ state: 'visible' });
    await this.continueButton().click();
    await this.enterSecurityPin(otp);
    await this.continueButton().click();
    await this.page.waitForURL(/\/dashboard(?:\/|$|\?)/i, { timeout: 30_000 });
  }

  private async enterSecurityPin(pin: string): Promise<void> {
    await this.securityPinInputs().first().pressSequentially(pin);
  }
}
