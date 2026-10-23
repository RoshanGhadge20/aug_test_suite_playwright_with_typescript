import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

export class DepositPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO45_Deposit) ─────────────────────────────────────────

  private readonly deposit = () =>
    this.page.locator("xpath=//span[normalize-space()='Deposit']");

  private readonly btnEdit = () =>
    this.page.locator(
      "xpath=//button[contains(@class,'apply-kyc') and normalize-space()='Edit']",
    );

  private readonly btndone = () =>
    this.page.locator("xpath=//button//span[normalize-space()='Done']");

  private readonly btnYes = () =>
    this.page.locator(
      "xpath=//button[contains(@class,'mat-raised-button')]//span[normalize-space()='Yes']",
    );

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Navigate to Deposit section. */
  async clickDeposit(): Promise<void> {
    await this.deposit().click();
    await this.waitForLoaderToDisappear();
  }

  /** Click Edit button. */
  async clickEdit(): Promise<void> {
    await this.btnEdit().click();
    await this.waitForLoaderToDisappear();
  }

  /** Click Done button. */
  async clickDone(): Promise<void> {
    await this.btndone().click();
    await this.waitForLoaderToDisappear();
  }

  /** Click Yes confirmation button. */
  async clickYes(): Promise<void> {
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
  }
}
