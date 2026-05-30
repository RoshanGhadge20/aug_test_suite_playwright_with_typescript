import { Page, Locator } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export abstract class AdminBasePage extends BasePage {
  constructor(page: Page) { super(page); }

  /** Port of Java BrowserInitialize.waitForLoaderToDisappear() — app spinner. */
  async waitForLoaderToDisappear(timeoutMs = 300_000): Promise<void> {
    const spinner = this.page.locator("xpath=//div[@class='spinner']");
    if (await spinner.count() > 0) {
      await spinner.first().waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});
    }
  }

  /** Port of Java JavascriptClick(). */
  async jsClick(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.evaluate((el: any) => el.click());
    await this.waitForLoaderToDisappear();
  }
}
