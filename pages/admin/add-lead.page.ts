import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO40_AddLeadAndEdit (locators) + Flow62_ValidatingAddLeadWithEditFunctionality (actions)
 *
 * Methods ported:
 *   - validateAddLeadWithEdit()  ← Flow62.validateAddLeadWithEdit()
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, AdminSetting re-declared locally.
 *
 * Omitted loginWith... logout calls:
 *   - OMITTED. Role = admin.
 *
 * SoftAssert translated to return value:
 *   - validateAddLeadWithEdit() returns { isDisplayed, isEnabled } for spec assertions.
 */
export class AddLeadPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO40_AddLeadAndEdit) ──────────────────────────────────

  private readonly Masters = () => this.page.locator("xpath=//span[normalize-space()='Masters']");
  private readonly LeadSource = () => this.page.locator("xpath=//span[normalize-space()='Lead Source']");
  private readonly AddLeadSource = () => this.page.locator("xpath=//span[normalize-space()='Add Lead Source']");
  private readonly LeadName = () => this.page.locator("xpath=//input[@formcontrolname='leadName']");
  private readonly BtnAdd = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  private readonly btnEdit = () => this.page.locator("xpath=(//span[contains(text(),'Edit')])[1]");
  private readonly btnUpdate = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  private readonly btnDelete = () => this.page.locator("xpath=(//span[@class='kt-pointer text-danger ng-star-inserted'][normalize-space()='Delete'])[1]");
  private readonly btnYes = () => this.page.locator("xpath=//span[contains(.,'Yes')]");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly AdminSetting = () => this.page.locator("xpath=//span[normalize-space()='Admin Settings']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToLeadSource(): Promise<void> {
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
    await this.LeadSource().click();
  }

  // ── Actions (from Flow62_ValidatingAddLeadWithEditFunctionality) ──────────

  /**
   * Port of Java Flow62_ValidatingAddLeadWithEditFunctionality.validateAddLeadWithEdit().
   * Called by TC05 priority=6.
   *
   * Returns { isDisplayed, isEnabled } for spec assertions.
   */
  async validateAddLeadWithEdit(): Promise<{ isDisplayed: boolean; isEnabled: boolean }> {
    await this.navigateToLeadSource();

    await this.AddLeadSource().click();
    await this.LeadName().fill('Test');

    const addBtn = this.BtnAdd();
    await addBtn.click();

    const isDisplayed = await addBtn.isVisible();
    const isEnabled = await addBtn.isEnabled();

    await this.page.waitForTimeout(3000);

    const editBtn = this.btnEdit();
    await this.jsClick(editBtn);
    await this.LeadName().fill('Demo');
    await this.btnUpdate().click();
    await this.page.waitForTimeout(3000);

    const deleteBtn = this.btnDelete();
    await deleteBtn.evaluate((el: any) => el.scrollIntoView(true));
    await this.page.waitForTimeout(3000);
    await deleteBtn.click();
    await this.btnYes().click();

    return { isDisplayed, isEnabled };
  }
}
