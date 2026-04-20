import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async waitForUrl(pattern: RegExp | string, timeoutMs = 15_000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout: timeoutMs });
  }

  protected byTestId(id: string): Locator {
    return this.page.getByTestId(id);
  }

  protected byRole(role: Parameters<Page['getByRole']>[0], options?: Parameters<Page['getByRole']>[1]): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Fill an OTP across one or multiple inputs.
   * Tries several common patterns; handles both single-input and per-digit layouts.
   * Override `otpInputLocator()` in a panel-specific POM if none of these match.
   */
  protected otpInputLocator(): Locator {
    return this.page.locator(
      'input[autocomplete="one-time-code"], ' +
      'input[name^="otp"], ' +
      'input[id^="otp"], ' +
      '[data-testid^="otp-input"], ' +
      '[data-testid^="otp-digit"]',
    );
  }

  protected async fillOtp(otp: string): Promise<void> {
    const inputs = this.otpInputLocator();
    await inputs.first().waitFor({ state: 'visible', timeout: 15_000 });
    const count = await inputs.count();
    if (count === 0) {
      throw new Error('OTP input fields not found on page. Update selectors in BasePage.otpInputLocator().');
    }
    if (count === 1) {
      await inputs.first().fill(otp);
      return;
    }
    for (let i = 0; i < otp.length && i < count; i++) {
      await inputs.nth(i).fill(otp[i]);
    }
  }
}
