import { Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class NewAdminLoginPage extends BasePage {
  constructor(page: Page) { super(page); }

  private readonly mobileInput = () => this.page.getByLabel(/mobile|phone/i);
  private readonly sendOtpButton = () => this.page.getByRole('button', { name: /send otp|get otp|continue|next/i });
  private readonly verifyOtpButton = () => this.page.getByRole('button', { name: /verify|submit|sign ?in|log ?in/i });

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async login(mobile: string, otp: string): Promise<void> {
    await this.open();
    await this.mobileInput().fill(mobile);
    await this.sendOtpButton().click();
    await this.fillOtp(otp);
    const verify = this.verifyOtpButton();
    if (await verify.first().isVisible().catch(() => false)) {
      await verify.first().click();
    }
    await this.waitForUrl(/dashboard|home/i);
  }
}
