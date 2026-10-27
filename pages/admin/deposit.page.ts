import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

export class DepositPage extends AdminBasePage {
  private readonly deposit: Locator;
  private readonly btnEdit: Locator;
  private readonly btndone: Locator;
  private readonly btnYes: Locator;

  constructor(page: Page) {
    super(page);
    this.deposit = this.page.locator(
      "xpath=//span[normalize-space()='Deposit']",
    );
    this.btnEdit = this.page.locator(
      "xpath=//button[contains(@class,'apply-kyc') and normalize-space()='Edit']",
    );
    this.btndone = this.page.locator(
      "xpath=//button//span[normalize-space()='Done']",
    );
    this.btnYes = this.page.locator(
      "xpath=//button[contains(@class,'mat-raised-button')]//span[normalize-space()='Yes']",
    );
  }
  async clickDeposit(): Promise<void> {
    await this.deposit.click();
    await this.waitForLoaderToDisappear();
  }
  async clickEdit(): Promise<void> {
    await this.btnEdit.click();
    await this.waitForLoaderToDisappear();
  }

  async clickDone(): Promise<void> {
    await this.btndone.click();
    await this.waitForLoaderToDisappear();
  }

  async clickYes(): Promise<void> {
    await this.btnYes.click();
    await this.waitForLoaderToDisappear();
  }
}
