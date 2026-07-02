import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO37_GoldRateFunctionality (locators) + Flow58_ValidatingGoldRate (actions)
 *
 * Methods ported:
 *   - validatingGoldRate()  ← Flow58.validatingGoldRate()
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - OMITTED. Role = admin.
 *
 * SoftAssert translated to return value:
 *   - validatingGoldRate() returns actualOldRate for spec assertions.
 */
export class GoldRatePage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO37_GoldRateFunctionality) ───────────────────────────

  private readonly Setting = () => this.page.locator("xpath=//span[@class='kt-menu__link-text ng-star-inserted'][normalize-space()='Settings']");
  private readonly AdminSetting = () => this.page.locator("xpath=//span[normalize-space()='Admin Settings']");
  private readonly InputField = () => this.page.locator("xpath=//input[@name='goldRate']");
  private readonly btnSave = () => this.page.locator("xpath=//span[normalize-space()='Save']");
  private readonly goldRate = () => this.page.locator("xpath=//tr[1]//td[4]");
  private readonly btnUploadData = () => this.page.locator("xpath=//span[normalize-space()='Upload Data']");
  private readonly GoldRate = () => this.page.locator("xpath=//span[normalize-space()='Gold Rate']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");

  // ── Actions (from Flow58_ValidatingGoldRate) ──────────────────────────────

  /**
   * Port of Java Flow58_ValidatingGoldRate.validatingGoldRate().
   * Called by TC05 priority=4.
   *
   * Returns actualOldRate for spec assertions.
   */
  async validatingGoldRate(): Promise<string> {
    const data = getLoginData();

    await this.page.waitForTimeout(7000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(7000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);

    const settingsEle = this.page.locator("xpath=//span[normalize-space()='Settings']");
    await settingsEle.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(settingsEle);

    await this.page.waitForTimeout(1000);
    await this.AdminSetting().click();
    await this.page.waitForTimeout(1000);
    await this.btnUploadData().click();
    await this.page.waitForTimeout(1000);
    await this.GoldRate().click();
    await this.page.waitForTimeout(1000);
    await this.InputField().fill('9600');
    await this.page.waitForTimeout(500);
    await this.btnSave().click();

    const oldRateElement = this.InputField();
    const actualOldRate = (await oldRateElement.inputValue()).trim();

    return actualOldRate;
  }
}
