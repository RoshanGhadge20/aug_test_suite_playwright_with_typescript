import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

/**
 * Port of Java: PO21_DeleteLoan (locators) + Flow24_DeleteLoan (actions)
 *
 * Cross-page locator notes:
 *   - `profile`, `arrow`, `branchDropdown` re-declared from PO_LoginLogout / inline Flow24.
 *   - `loanManagement` re-declared from PO_Common.
 *   - `appliedLoan` re-declared inline.
 *   - `firstNameFilter`, `filterbtn`, `assignPacketBtn` re-declared from PO01_KycSel / PO05_AssignPacket.
 *
 * Omitted loginWith* calls:
 *   - Flow24_DeleteLoan.validateDeleteLoan() calls loginWithAppraiser() — OMITTED.
 *     Caller must inject loginAs('appraiser') before calling validateDeleteLoan().
 */
export class DeleteLoanPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO21_DeleteLoan) ──────────────────────────────────────

  private readonly btnDeleteLoan = () =>
    this.page.locator("xpath=//span[normalize-space()='Delete Loan']");
  private readonly btnYesIWantToCancel = () =>
    this.page.locator(
      "xpath=//span[contains(.,'Yes I Want To Cancel This Process')]",
    );

  // Cross-page re-declarations
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  private readonly branchDropdown = () =>
    this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
  private readonly loanManagement = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  private readonly appliedLoan = () =>
    this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
  private readonly firstNameFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly filterbtn = () =>
    this.page.locator("xpath=//button[@type='submit']");
  private readonly assignPacketBtn = () =>
    this.page.locator("xpath=//button[normalize-space()='Assign Packet']");
  private readonly loanCancelReason = () =>
    this.page.locator("xpath=//select[@formcontrolname='loanCancelReason']");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow24_DeleteLoan.validateDeleteLoan().
   * Caller must first loginAs('appraiser').
   */
  async validateDeleteLoan(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(3000);

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    //await this.appliedLoan().scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.assignPacketBtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(4000);

    await this.btnDeleteLoan().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(4000);

    await this.loanCancelReason().waitFor({ state: "visible" });
    await this.loanCancelReason().selectOption({
      label: "Resolved financial need through other sources.",
    });
    await this.page.waitForTimeout(500);

    await this.btnYesIWantToCancel().click();
    await this.waitForLoaderToDisappear();
  }
}
