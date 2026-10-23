import {
  Page,
  Locator,
  expect
} from '@playwright/test';

export abstract class BasePage {

  constructor(
    protected readonly page: Page
  ) {}

  async goto(path: string = '/'): Promise<void> {
    // waitUntil: 'domcontentloaded' — confirmed live on the admin panel that the default
    // 'load' wait can hang past the default 30s navigation timeout: a third-party "Tech
    // Support" widget's script occasionally stalls during the initial parse (the page
    // snapshot at failure showed only that widget's iframe, no app content, while a plain
    // HTTP request to the same URL resolved in under a second — the app itself isn't slow,
    // that one blocking <script> is). domcontentloaded doesn't wait on it; callers needing
    // full resource load already wait on specific elements.
    //
    // One bounded retry: confirmed live that even domcontentloaded can occasionally hang
    // the full 60s (the widget stall seems to vary in duration, not just presence) — a
    // fresh navigation attempt on retry has consistently succeeded quickly rather than
    // hitting the same stall twice in a row.
    //
    // 20s per attempt, not 60s: this goto runs inside the `page` fixture's own timeout
    // budget alongside session-restore/login logic — a 60s+60s retry pair left no room for
    // anything else and blew the fixture timeout outright (confirmed live: the first 60s
    // attempt alone exceeded the fixture's timeout, so the "retry" fired during teardown and
    // failed with ERR_ABORTED instead of ever getting a fair second attempt).
    try {
      await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    } catch (err) {
      await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    }
  }

  async waitForUrl(
    pattern: RegExp | string,
    timeoutMs = 15_000
  ): Promise<void> {

    await this.page.waitForURL(
      pattern,
      { timeout: timeoutMs }
    );
  }

  protected byTestId(
    id: string
  ): Locator {

    return this.page.getByTestId(id);
  }

  protected byRole(
    role: Parameters<Page['getByRole']>[0],
    options?: Parameters<Page['getByRole']>[1]
  ): Locator {

    return this.page.getByRole(
      role,
      options
    );
  }

  // ==========================================
  // COMMON REUSABLE METHODS
  // ==========================================

  async click(
    locator: Locator
  ): Promise<void> {

    await locator.waitFor({
      state: 'visible'
    });

    await locator.click();
  }

  async fill(
    locator: Locator,
    value: string
  ): Promise<void> {

    await locator.waitFor({
      state: 'visible'
    });

    await locator.fill(value);
  }

  async type(
    locator: Locator,
    value: string
  ): Promise<void> {

    await locator.pressSequentially(
      value
    );
  }

  async getText(
    locator: Locator
  ): Promise<string> {

    await locator.waitFor();

    return (
      await locator.textContent()
    )?.trim() || '';
  }

  async isVisible(
    locator: Locator
  ): Promise<boolean> {

    return await locator.isVisible();
  }

  async scrollIntoView(
    locator: Locator
  ): Promise<void> {

    await locator.scrollIntoViewIfNeeded();
  }

  async hover(
    locator: Locator
  ): Promise<void> {

    await locator.hover();
  }

  async wait(
    ms: number
  ): Promise<void> {

    await this.page.waitForTimeout(ms);
  }

  async uploadFile(
    locator: Locator,
    filePath: string
  ): Promise<void> {

    await locator.setInputFiles(
      filePath
    );
  }

  async selectDropdown(
    locator: Locator,
    value: string
  ): Promise<void> {

    await locator.selectOption(
      value
    );
  }

  async checkCheckbox(
    locator: Locator
  ): Promise<void> {

    if (
      !(await locator.isChecked())
    ) {

      await locator.check();
    }
  }

  async uncheckCheckbox(
    locator: Locator
  ): Promise<void> {

    if (
      await locator.isChecked()
    ) {

      await locator.uncheck();
    }
  }

  async waitForLoader(): Promise<void> {

    await this.page.waitForLoadState(
      'networkidle'
    );
  }

  async verifyText(
    locator: Locator,
    expected: string
  ): Promise<void> {

    await expect(locator)
      .toContainText(expected);
  }

  async verifyVisible(
    locator: Locator
  ): Promise<void> {

    await expect(locator)
      .toBeVisible();
  }

  /** Strips ₹, commas and whitespace; returns 0 for unparseable input. */
  protected parseAmount(value: string): number {
    return Number(value.replace(/[₹,\s]/g, '')) || 0;
  }

  /** True when `value` is a non-empty string of digits (e.g. shop order id). */
  protected isNumericId(value: string): boolean {
    if (value.length === 0) return false;
    for (const ch of value) {
      if (ch < '0' || ch > '9') return false;
    }
    return true;
  }

  // ==========================================
  // OTP METHODS
  // ==========================================

  protected otpInputLocator(): Locator {

    return this.page.locator(

      'input[autocomplete="one-time-code"], ' +

      'input[name^="otp"], ' +

      'input[id^="otp"], ' +

      '[data-testid^="otp-input"], ' +

      '[data-testid^="otp-digit"]'
    );
  }

  protected async fillOtp(
    otp: string
  ): Promise<void> {

    const inputs =
      this.otpInputLocator();

    await inputs.first().waitFor({
      state: 'visible',
      timeout: 15_000
    });

    const count =
      await inputs.count();

    if (count === 0) {

      throw new Error(
        'OTP input fields not found'
      );
    }

    if (count === 1) {

      await inputs.first().click();

      await inputs.first().fill(
        otp
      );

      return;
    }

    for (let i = 0;i < otp.length &&i < count;i++) {

      await inputs.nth(i).click();

      await inputs.nth(i).fill(
        otp[i]
      );
    }
  }
}