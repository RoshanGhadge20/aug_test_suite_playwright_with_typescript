import { Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class CustomerLoginPage extends BasePage {
  constructor(page: Page) { super(page); }

  private readonly emailInput = () => this.page.getByLabel(/email|mobile/i);
  private readonly passwordInput = () => this.page.getByLabel(/password/i);
  private readonly submitButton = () => this.page.getByRole('button', { name: /log ?in|sign ?in/i });

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.open();
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
    await this.waitForUrl(/dashboard|home|account/i);
  }
}
