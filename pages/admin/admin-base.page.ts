import { Page, Locator } from "@playwright/test";
import { BasePage } from "../shared/base.page";

export abstract class AdminBasePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Port of Java BrowserInitialize.waitForLoaderToDisappear() — app spinner. */
  async waitForLoaderToDisappear(timeout = 60000) {
    const spinner = this.page.locator("//div[contains(@class,'spinner')]");

    if (await spinner.count()) {
      await spinner.first().waitFor({
        state: "hidden",
        timeout,
      });
    }

    // This admin app has persistent background network chatter (notification polling,
    // the Tech Support iframe widget) that can keep the page from ever reaching networkidle.
    // Confirmed live: a hard, uncaught timeout here killed the whole flow mid-way through the
    // Pawn Copy "Print" click in assign-packet.page.ts. The spinner-hidden check above is the
    // reliable signal, so networkidle is best-effort only — never let it fail the caller.
    await this.page
      .waitForLoadState("networkidle", { timeout: 5000 })
      .catch(() => {});
  }

  /** Port of Java JavascriptClick(). */
  async jsClick(locator: Locator): Promise<void> {
    await locator.waitFor({ state: "visible", timeout: 30000 });
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
      document.body.classList.add("kt-aside--on");
      document.body.classList.remove("kt-aside--minimize");
      document.body.classList.remove("kt-aside--minimize-hover");
    });
    await this.page.waitForTimeout(500);
  }
}
