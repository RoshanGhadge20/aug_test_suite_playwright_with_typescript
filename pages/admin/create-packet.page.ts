import { Locator, Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';

/**
 * Port of Java: PO03_CreateNewPacket (locators) + Flow03_CreateNewPacket (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator from Flow03_CreateNewPacket (same as in CustomerManagementPage).
 *
 * Omitted loginWith* calls:
 *   - Flow03_CreateNewPacket.validateNewPacket() did NOT call loginWith*; it assumed an already-logged-in session.
 *     The profile click + branch switch is preserved here.
 */
export class CreatePacketPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO03_CreateNewPacket) ──────────────────────────────────

  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  private readonly btnPacket = () => this.page.locator("xpath=//span[normalize-space()='Packet']");
  private readonly btnAdd = () => this.page.locator("xpath=//span[normalize-space()='Add Packet']");
  private readonly packetID = () => this.page.locator("xpath=//input[@formcontrolname='packetUniqueId']");
  private readonly selBranch = () => this.page.locator("xpath=//select[@formcontrolname='internalUserBranch']");
  private readonly btnNewpacket = () => this.page.locator("xpath=//div[@class='mat-slide-toggle-bar mat-slide-toggle-bar-no-side-margin']");
  private readonly barCode = () => this.page.locator("xpath=//input[@formcontrolname='barcodeNumber']");
  private readonly btnAddPacket = () => this.page.locator("xpath=//span[normalize-space()='Add']");
  private readonly btnEditPacket = () => this.page.locator("xpath=(//div[@class='kt-pointer ng-star-inserted'])[1]");
  private readonly selUsertype = () => this.page.locator("xpath=//select[@formcontrolname='userType']");
  private readonly btnUpdate = () => this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly btnDelete = () => this.page.locator("xpath=//tbody/tr[2]/td[9]/div[1]/div[1]/div[3]/button[1]");
  private readonly btnYes = () => this.page.locator("xpath=//span[normalize-space()='Yes']");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown from Flow03
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // Inline appraiser dropdown from Flow03
  private readonly selAppraiserId = () => this.page.locator("xpath=//select[@formcontrolname='appraiserId']");

  // ── Actions (from Flow03_CreateNewPacket) ─────────────────────────────────

  /**
   * Port of Java Flow03_CreateNewPacket.validateNewPacket().
   */
  async validateNewPacket(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — confirmed live (renew-zero.page.ts,
    // loan-defects.page.ts) that switching this account's branch scope gets the backend to
    // reject the session outright (403/401, forced redirect to /auth/login).
    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.btnPacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    await this.btnAdd().click();
    await this.waitForLoaderToDisappear();

    const packetCode = this.getRandomAPacketCode();
    await this.page.waitForTimeout(1500);
    await this.packetID().fill(packetCode);
    await this.waitForLoaderToDisappear();

    await this.selectOptionByLabel(this.selBranch(), 'Augmont');

    await this.btnNewpacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.barCode().fill(packetCode);
    await this.waitForLoaderToDisappear();

    await this.barCode().click();
    await this.waitForLoaderToDisappear();

    await this.btnAddPacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.btnEditPacket().click();
    await this.waitForLoaderToDisappear();

    await this.selectOptionByLabel(this.selUsertype(), 'Appraiser');
    await this.selectOptionByLabel(this.selAppraiserId(), 'Priyanka Thorat');

    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Port of Java Flow03_CreateNewPacket.getRandomAPacketCode().
   */
  getRandomAPacketCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Port of Java Flow03_CreateNewPacket.delete().
   */
  async delete(): Promise<void> {
    await this.btnDelete().click();
    await this.waitForLoaderToDisappear();
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Wait for a dropdown option to be populated before selecting it.
   * This avoids Playwright timing out while the backend is still loading the option list.
   */
  private async selectOptionByLabel(locator: Locator, label: string, timeoutMs = 30_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: timeoutMs });
    const normalize = (value: string) => value.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
    const expected = normalize(label);

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const optionCount = await locator.locator('option').count();
      const optionValue = await locator.locator('option').evaluateAll((options, expectedText) => {
        const normalizeOption = (value: string) => value.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
        const match = options.find((option: any) => normalizeOption(option.textContent ?? '') === expectedText);
        return match ? String((match as any).value ?? '') : '';
      }, expected);
      if (optionValue) {
        await locator.selectOption({ value: optionValue }, { timeout: timeoutMs });
        return;
      }
      if (optionCount > 1) {
        await this.page.waitForTimeout(500);
        continue;
      }
      await this.page.waitForTimeout(500);
    }

    const availableOptions = (await locator.locator('option').allTextContents())
      .map((text) => normalize(text))
      .filter(Boolean)
      .join(', ');
    throw new Error(`Option '${label}' was not available in the dropdown. Available options: ${availableOptions || '(none)'}`);
  }
}
