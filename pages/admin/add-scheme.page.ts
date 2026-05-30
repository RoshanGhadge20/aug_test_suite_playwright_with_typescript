import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO38_AddNewScheme (locators) + Flow59_ValidateAddNewScheme (actions)
 *
 * Methods ported:
 *   - validateAddNewScheme()  ← Flow59.validateAddNewScheme()
 *   - validateViewScheme()    ← Flow59.validateViewScheme() (not called by TC05 — ported for completeness)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, AdminSetting re-declared locally.
 *   - PO39_UpdateRPG.loc_btnView / loc_btnPartnerName / loc_schemeType re-declared.
 *
 * Omitted loginWith... logout calls:
 *   - OMITTED. Role = admin.
 */
export class AddSchemePage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO38_AddNewScheme) ────────────────────────────────────

  private readonly SchemeConfiguration = () => this.page.locator("xpath=//span[normalize-space()='Scheme Configuration']");
  private readonly btnAddNewScheme = () => this.page.locator("xpath=//span[normalize-space()='Add New Scheme']");
  private readonly PartnerName = () => this.page.locator("xpath=//select[@formcontrolname='partnerId']");
  private readonly SchemeName = () => this.page.locator("xpath=//input[@placeholder='Express Gold Loan']");
  private readonly BasicDescription = () => this.page.locator("xpath=//textarea[@placeholder='Description']");
  private readonly SelSchemeType = () => this.page.locator("xpath=//select[@formcontrolname='schemeType']");
  private readonly selLTV = () => this.page.locator("xpath=//select[@formcontrolname='ltv']");
  private readonly SelCustomerType = () => this.page.locator("xpath=//select[@formcontrolname='customerType']");
  private readonly MinLoanAmount = () => this.page.locator("xpath=//input[@formcontrolname='schemeAmountStart']");
  private readonly MaxLoanAmount = () => this.page.locator("xpath=//input[@formcontrolname='schemeAmountEnd']");
  private readonly MinKarat = () => this.page.locator("xpath=//select[@formcontrolname='minKarat']");
  private readonly MaxKarat = () => this.page.locator("xpath=//select[@formcontrolname='maxKarat']");
  private readonly DayInyear = () => this.page.locator("xpath=//input[@formcontrolname='daysInYear']");
  private readonly radioOneTimeProcessing = () => this.page.locator("xpath=//label[@for='mat-slide-toggle-510-input']//div[@class='mat-slide-toggle-thumb']");
  private readonly RadioPreClosureFees = () => this.page.locator("xpath=//label[@for='mat-slide-toggle-511-input']//div[@class='mat-slide-toggle-thumb']");
  private readonly RadioToggleOn = () => this.page.locator("xpath=//label[@for='mat-slide-toggle-512-input']//div[@class='mat-slide-toggle-thumb']");
  private readonly btnNext = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  private readonly MapUnsecuredScheme = () => this.page.locator("xpath=//div[contains(@class,'mat-radio-container')]//input[@value='isUnsecuredSchemeMapped']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly AdminSetting = () => this.page.locator("xpath=//span[normalize-space()='Admin Settings']");
  // PO39_UpdateRPG locators used in validateViewScheme
  private readonly loc_btnView = () => this.page.locator("xpath=//div[@id='s406']//span[@class='material-icons kt-pointer'][normalize-space()='visibility']");
  private readonly loc_btnPartnerName = () => this.page.locator("xpath=//input[@formcontrolname='partnerId']");
  private readonly loc_schemeType = () => this.page.locator("xpath=//select[@formcontrolname='schemeType']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToSchemeConfiguration(): Promise<void> {
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
  }

  // ── Actions (from Flow59_ValidateAddNewScheme) ────────────────────────────

  /**
   * Port of Java Flow59_ValidateAddNewScheme.validateAddNewScheme().
   * Called by TC05 priority=5.
   */
  async validateAddNewScheme(): Promise<void> {
    await this.navigateToSchemeConfiguration();

    // Wait for loader and click Add New Scheme button
    const addSchemeBtn = this.page.locator("xpath=//button[.//span[normalize-space()='Add New Scheme']]");
    await addSchemeBtn.waitFor({ state: 'visible', timeout: 20000 });
    await this.jsClick(addSchemeBtn);
    await this.page.waitForTimeout(5000);

    await this.PartnerName().selectOption({ label: 'Kharatmol Sk' });
    await this.page.waitForTimeout(1000);
    await this.SchemeName().fill('Automation_Test');
    await this.BasicDescription().fill('Automation_Test');
    await this.page.waitForTimeout(1000);
    await this.SelSchemeType().selectOption({ label: 'Secured' });
    await this.page.waitForTimeout(1000);

    // Click MapUnsecuredScheme radio
    const mapEl = this.MapUnsecuredScheme();
    await mapEl.waitFor({ state: 'visible', timeout: 10000 });
    await mapEl.evaluate((el: any) => el.scrollIntoView(true));
    await mapEl.click();
    await this.page.waitForTimeout(1000);

    await this.selLTV().selectOption({ label: '77' });

    // Select loan purpose from ng-select (2 iterations at index 5, 6)
    for (let i = 0; i < 2; i++) {
      const dropdown = this.page.locator("xpath=//input[@role='combobox']//following::span[@class='ng-arrow-wrapper']");
      await dropdown.evaluate((el: any) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await this.page.waitForTimeout(1000);
      await dropdown.click();

      const indexToClick = 5 + i;
      const opts = this.page.locator("xpath=//ng-select//div[contains(@class,'ng-dropdown-panel-items')]//div[contains(@class,'ng-option')]");
      if (await opts.count() > indexToClick) {
        await opts.nth(indexToClick).click();
      }
      await this.page.waitForTimeout(1000);
    }

    await this.SelCustomerType().selectOption({ label: 'New Customer' });
    await this.MinLoanAmount().fill('0');
    await this.MaxLoanAmount().fill('10');
    await this.MinKarat().selectOption({ label: '18K' });
    await this.MaxKarat().selectOption({ label: '22K HM' });
    await this.DayInyear().fill('360');
  }

  /**
   * Port of Java Flow59_ValidateAddNewScheme.validateViewScheme().
   * NOTE: Not called by TC05 (commented out) but ported for completeness.
   *
   * Returns { partnerNameVisible, schemeTypeVisible } for spec assertions.
   */
  async validateViewScheme(): Promise<{ partnerNameVisible: boolean; schemeTypeVisible: boolean }> {
    await this.navigateToSchemeConfiguration();

    await this.loc_btnView().click();

    const partnerNameEl = this.loc_btnPartnerName();
    const partnerNameVisible = await partnerNameEl.isVisible();

    const schemeTypeEl = this.loc_schemeType();
    const schemeTypeVisible = await schemeTypeEl.isVisible();

    return { partnerNameVisible, schemeTypeVisible };
  }
}
