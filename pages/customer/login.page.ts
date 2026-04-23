import { Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class CustomerLoginPage extends BasePage {
  constructor(page: Page) { super(page); }

  private readonly loginLink = () => this.page.getByRole('link', { name: /log in|sign up/i });
  private readonly mobileNumberInput = () => this.page.locator(
    "input[placeholder*='Mobile'], input[placeholder*='Phone'], input[name*='mobile' i], input[type='tel']",
  );
  private readonly submitBtn = () => this.page.getByRole('button', { name: /submit|send otp|get otp|proceed|continue|next/i });
  private readonly proceedBtn = () => this.page.getByRole('button', { name: /proceed|verify|submit|log ?in|sign ?in/i });

  async open(): Promise<void> {
    await this.goto('/login');
    if (!/\/login/i.test(this.page.url()) && await this.loginLink().first().isVisible().catch(() => false)) {
      await this.loginLink().first().click();
    }
  }

  async login(mobile: string, otp: string): Promise<void> {
    await this.open();
    await this.mobileNumberInput().first().waitFor({ state: 'visible', timeout: 15_000 });
    await this.mobileNumberInput().first().fill(mobile);
    await this.submitBtn().first().click();
    await this.waitForCodeEntryUi();
    await this.fillSecurityCode(otp);
    await this.finishLoginAfterOtp();
  }

  /** Avoid waiting out a long URL timeout before trying Enter / Verify — that was adding ~7s+ on many flows. */
  private async finishLoginAfterOtp(): Promise<void> {
    const home = /dashboard|home|account|\/$/i;

    await this.page.keyboard.press('Enter').catch(() => {});

    const proceed = this.proceedBtn().first();
    if (await proceed.isVisible().catch(() => false)) {
      await this.waitProceedEnabled(proceed, 4_000).catch(() => {});
      await proceed.click();
      await this.page.waitForLoadState('domcontentloaded');
    }

    try {
      await this.page.waitForURL(home, { timeout: 20_000 });
    } catch {
      throw new Error('Customer login did not reach home/dashboard after OTP/PIN submission.');
    }
  }

  /**
   * After "Send OTP", wait until OTP/PIN fields exist. Do not use a broad `input[inputmode=tel]`
   * matcher here — it matches the mobile field and breaks PIN/OTP detection.
   */
  private async waitForCodeEntryUi(): Promise<void> {
    const anyCodeField = this.page.locator(
      [
        'input[autocomplete="one-time-code"]',
        'input[name*="otp" i]',
        'input[id*="otp" i]',
        'input[placeholder*="otp" i]',
        'input[maxlength="1"]:visible',
        'input[inputmode="numeric"]:visible',
      ].join(', '),
    );
    await anyCodeField.first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  private async fillSecurityCode(code: string): Promise<void> {
    // Segmented PIN/OTP boxes only — exclude `inputmode=tel` (mobile number uses it).
    const pinBoxes = this.page.locator("input[maxlength='1']:visible");
    if (await pinBoxes.first().isVisible().catch(() => false)) {
      const count = await pinBoxes.count();
      if (count > 1) {
        const normalized = code.trim();
        if (!/^\d{6}$/.test(normalized)) {
          throw new Error('Customer security PIN must be exactly 6 digits for UAT.');
        }
        if (count !== 6) {
          throw new Error(`Security PIN UI expected 6 boxes, but found ${count}.`);
        }

        // Retry to handle occasional dropped keystrokes in segmented PIN UIs.
        for (let attempt = 0; attempt < 3; attempt++) {
          for (let i = 0; i < 6; i++) {
            const box = pinBoxes.nth(i);
            await box.click();
            await box.fill('');
            await box.type(normalized[i], { delay: 25 });
          }

          const joined = await pinBoxes.evaluateAll((els) =>
            els.map((el: any) => String(el.value ?? '')).join(''),
          );
          if (joined.length === 6 && /^\d{6}$/.test(joined)) {
            return;
          }
        }
        throw new Error('Failed to populate all 6 security PIN digits reliably.');
        return;
      }
    }
    await this.fillOtp(code);
  }

  private async waitProceedEnabled(proceed: ReturnType<CustomerLoginPage['proceedBtn']>, timeoutMs: number): Promise<boolean> {
    try {
      await this.page.waitForFunction((el: any) => !el.hasAttribute('disabled'), await proceed.elementHandle(), { timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  protected override otpInputLocator() {
    return this.page.locator(
      "input[inputmode='tel'], input[autocomplete='one-time-code'], input[name*='otp' i], input[id*='otp' i], input[maxlength='1']",
    );
  }
}
