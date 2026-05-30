import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO39_UpdateRPG (locators) + Flow60_ValidateRPG (actions)
 *
 * Methods ported:
 *   - validateRPGUpdate()  ← Flow60.validateRPGUpdate()
 *     NOTE: NOT called by TC05 (commented out in TC05 priority=5). Ported for completeness.
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, AdminSetting, SchemeConfiguration re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - OMITTED. Role = admin.
 *
 * SoftAssert translated to return value:
 *   - validateRPGUpdate() returns isDisabled for spec assertions.
 */
export class UpdateRpgPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO39_UpdateRPG) ───────────────────────────────────────

  private readonly EnteringValue = () => this.page.locator("xpath=//input[@formcontrolname='rpg']");
  private readonly EditRPG = () => this.page.locator("xpath=//img[@mattooltip='partner rpg edit']");
  private readonly btnUpdate = () => this.page.locator("xpath=//button[.//span[normalize-space()='Update']]");
  private readonly btnClose = () => this.page.locator("xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']");
  private readonly RadioButton = () => this.page.locator("xpath=//label[@for='mat-slide-toggle-501-input']//div[@class='mat-slide-toggle-thumb']");
  private readonly btnYes = () => this.page.locator("xpath=//span[normalize-space()='Yes']");
  private readonly btnPartnerName = () => this.page.locator("xpath=//input[@formcontrolname='partnerId']");
  private readonly btnView = () => this.page.locator("xpath=//div[@id='s406']//span[@class='material-icons kt-pointer'][normalize-space()='visibility']");
  private readonly schemeType = () => this.page.locator("xpath=//select[@formcontrolname='schemeType']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly AdminSetting = () => this.page.locator("xpath=//span[normalize-space()='Admin Settings']");
  private readonly SchemeConfiguration = () => this.page.locator("xpath=//span[normalize-space()='Scheme Configuration']");

  // ── Actions (from Flow60_ValidateRPG) ─────────────────────────────────────

  /**
   * Port of Java Flow60_ValidateRPG.validateRPGUpdate().
   * NOTE: NOT called by TC05 (commented out). Ported for completeness.
   *
   * Returns isDisabled (whether Update btn is disabled after click) for spec assertions.
   */
  async validateRPGUpdate(): Promise<boolean> {
    const data = getLoginData();

    await this.page.waitForTimeout(7000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(7000);

    await this.arrow().click();
    await this.page.waitForTimeout(1000);

    const settingsEle = this.page.locator("xpath=//span[normalize-space()='Settings']");
    await settingsEle.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(settingsEle);

    await this.page.waitForTimeout(1000);
    await this.AdminSetting().click();
    await this.SchemeConfiguration().click();
    await this.EditRPG().click();
    await this.EnteringValue().fill('5000');

    const updateBtn = this.btnUpdate();
    await updateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await updateBtn.click();

    await this.page.waitForTimeout(500);
    const isDisabled = !(await updateBtn.isEnabled());

    // Close modal — ignore stale element if modal already closed
    try {
      await this.btnClose().click();
    } catch {
      // Modal already closed
    }

    return isDisabled;
  }
}
