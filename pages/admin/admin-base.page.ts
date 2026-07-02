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
  await locator.waitFor({ state: 'visible', timeout: 30000 });
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });

  await this.waitForLoaderToDisappear();
}

  /**
   * Expands the sidebar when it is collapsed off-screen (headless mode after fresh login).
   * The sidebar toggle (.kt-aside__brand-tools) is positioned outside the viewport when
   * the sidebar is collapsed, so a regular click() fails. JS click bypasses this.
   */
  /**
   * Expands the sidebar when it is off-screen (headless mode after fresh login).
   * Adds `kt-aside--on` to the body (same as clicking the hamburger toggle) and
   * removes minimize classes so all sidebar menu items slide into the viewport.
   */
  async expandSidebar(): Promise<void> {
    await this.page.evaluate(() => {
      document.body.classList.add('kt-aside--on');
      document.body.classList.remove('kt-aside--minimize');
      document.body.classList.remove('kt-aside--minimize-hover');
    });
    await this.page.waitForTimeout(500);
  }
}
