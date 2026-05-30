import { Page } from '@playwright/test';
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

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(7000);

    await this.arrow().click();
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

    await this.selBranch().selectOption({ label: 'Augmont' });

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

    await this.selUsertype().selectOption({ label: 'Appraiser' });
    await this.selAppraiserId().selectOption({ label: 'Priyanka Thorat' });

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
}
