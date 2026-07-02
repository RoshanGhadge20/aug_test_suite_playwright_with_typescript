import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO43_AddAndEditWavierType (locators) + Flow65_ValidateAddAndEditWavierType (actions)
 *
 * Methods ported:
 *   - validateAddWavierType()    ← Flow65.validateAddWavierType() (commented in TC05 — ported)
 *   - validateEditType()         ← Flow65.validateEditType() (commented in TC05 — ported)
 *   - validateDeleteWavierType() ← Flow65.validateDeleteWavierType() (called by TC05 priority=9)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, AdminSetting, Masters re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - OMITTED. Role = admin.
 *
 * Note: Java typo "Wavier" preserved verbatim per porting rules.
 */
export class WaiverTypePage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO43_AddAndEditWavierType) ─────────────────────────────

  private readonly WavierType = () => this.page.locator("xpath=//span[normalize-space()='Waiver Type']");
  private readonly AddWavierType = () => this.page.locator("xpath=//span[normalize-space()='Add Waiver Type']");
  private readonly EnteringWavierType = () => this.page.locator("xpath=//input[@formcontrolname='waiverType']");
  private readonly btnAdd = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  private readonly btnEdit = () => this.page.locator("xpath=(//div[@class='kt-pointer ng-star-inserted'][normalize-space()='Edit'])[3]");
  private readonly btnUpadte = () => this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly btnDelete = () => this.page.locator("xpath=(//div[@class='kt-pointer text-danger ng-star-inserted'][normalize-space()='Delete'])[3]");
  private readonly btnYes = () => this.page.locator("xpath=(//button[@type='submit'])[1]");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly AdminSetting = () => this.page.locator("xpath=//span[normalize-space()='Admin Settings']");
  private readonly Masters = () => this.page.locator("xpath=//span[normalize-space()='Masters']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToWavierType(): Promise<void> {
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
    await this.Masters().click();
    await this.page.waitForTimeout(500);

    const wavierElement = this.WavierType();
    await wavierElement.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await this.jsClick(wavierElement);
  }

  // ── Actions (from Flow65_ValidateAddAndEditWavierType) ────────────────────

  /**
   * Port of Java Flow65_ValidateAddAndEditWavierType.validateAddWavierType().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   */
  async validateAddWavierType(): Promise<void> {
    await this.navigateToWavierType();

    await this.page.waitForTimeout(1000);
    await this.AddWavierType().click();
    await this.page.waitForTimeout(1000);
    await this.EnteringWavierType().fill('Demo Test');
    await this.btnAdd().click();
  }

  /**
   * Port of Java Flow65_ValidateAddAndEditWavierType.validateEditType().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   */
  async validateEditType(): Promise<void> {
    await this.navigateToWavierType();

    await this.btnEdit().click();
    await this.page.waitForTimeout(1000);
    await this.EnteringWavierType().fill('Demo');
    await this.btnUpadte().click();
  }

  /**
   * Port of Java Flow65_ValidateAddAndEditWavierType.validateDeleteWavierType().
   * Called by TC05 priority=9.
   */
  async validateDeleteWavierType(): Promise<void> {
    await this.navigateToWavierType();

    await this.btnDelete().click();
    await this.page.waitForTimeout(1000);
    await this.btnYes().click();
  }
}
