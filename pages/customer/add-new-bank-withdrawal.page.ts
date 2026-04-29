import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class AddNewBankWithdrawalPage extends BasePage {
  private readonly addNewBankButton: Locator;
  private readonly cancelButton: Locator;
  private readonly accountNumberInput: Locator;
  private readonly ifscInput: Locator;
  private readonly saveBankButton: Locator;
  private readonly invalidAccountToast: Locator;
  private readonly toastErrorSummary: Locator;
  private readonly toastErrorDetail: Locator;
  private readonly toastCloseIcon: Locator;
  private readonly ifscFieldErrorMessage: Locator;
  private readonly accountNumberFieldErrorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.addNewBankButton = page.getByRole('button', { name: 'Add Bank Details' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.accountNumberInput = page.locator('input#accountNumber');
    this.ifscInput = page.locator('input#ifscCode');
    this.saveBankButton = page.getByRole('button', { name: 'Save Bank' });
    this.invalidAccountToast = page
      .locator('section:has(p:text-is("Error")):has(p:text-is("TRANSACTION NOT ALLOWED AS INVALID ACCOUNT"))')
      .first();
    this.toastErrorSummary = page
      .locator('div.p-toast.p-component .p-toast-message-error .p-toast-summary, div.p-toast.p-component p.font-gilroybold.text-failed')
      .first();
    this.toastErrorDetail = page
      .locator('div.p-toast.p-component .p-toast-message-error .p-toast-detail, div.p-toast.p-component p.font-gilroy')
      .first();
    this.toastCloseIcon = page.locator('div.p-toast.p-component i.pi.pi-times.cursor-pointer').first();
    this.ifscFieldErrorMessage = page
      .locator('input#ifscCode')
      .locator('xpath=ancestor::div[contains(@class,"ng-invalid")]//small[contains(@class,"p-error")]')
      .first();
    this.accountNumberFieldErrorMessage = page
      .locator('input#accountNumber')
      .locator('xpath=ancestor::div[contains(@class,"ng-invalid")]//small[contains(@class,"p-error")]')
      .first();
  }

  async clickAddBankDetails(): Promise<void> {
    await this.addNewBankButton.waitFor({ state: 'visible' });
    await expect(this.addNewBankButton).toBeEnabled();
    await this.addNewBankButton.click();
  }

  async enterAccountNumber(accountNumber: string): Promise<void> {
    await this.accountNumberInput.waitFor({ state: 'visible' });
    await this.accountNumberInput.fill(accountNumber);
  }

  async enterIFSCCode(ifscCode: string): Promise<void> {
    await this.ifscInput.waitFor({ state: 'visible' });
    await expect(this.ifscInput).toBeEditable();
    await this.ifscInput.click();
    await this.ifscInput.fill('');
    await this.ifscInput.type(ifscCode, { delay: 50 });
    await this.ifscInput.press('Tab');
  }

  async clickSaveBank(): Promise<void> {
    await this.saveBankButton.waitFor({ state: 'visible' });
    await this.saveBankButton.click();
  }

  async isSaveBankEnabled(): Promise<boolean> {
    await this.saveBankButton.waitFor({ state: 'visible' });
    return this.saveBankButton.isEnabled();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.waitFor({ state: 'visible' });
    await this.cancelButton.click();
  }

  async getErrorMessage(): Promise<string> {
    await this.toastErrorDetail.waitFor({ state: 'visible' });
    return (await this.toastErrorDetail.textContent())?.trim() ?? '';
  }

  async getErrorSummary(): Promise<string> {
    await this.toastErrorSummary.waitFor({ state: 'visible' });
    return (await this.toastErrorSummary.textContent())?.trim() ?? '';
  }

  async getInvalidAccountToastMessage(): Promise<string> {
    await this.invalidAccountToast.waitFor({ state: 'visible' });
    return (await this.invalidAccountToast.locator('p.font-gilroy').textContent())?.trim() ?? '';
  }

  async closeToast(): Promise<void> {
    if (await this.toastCloseIcon.isVisible().catch(() => false)) {
      await this.toastCloseIcon.click();
    }
  }

  async getIFSCFieldErrorMessage(): Promise<string> {
    await this.ifscFieldErrorMessage.waitFor({ state: 'visible' });
    return (await this.ifscFieldErrorMessage.textContent())?.trim() ?? '';
  }

  async getAccountNumberFieldErrorMessage(): Promise<string> {
    await this.accountNumberFieldErrorMessage.waitFor({ state: 'visible' });
    return (await this.accountNumberFieldErrorMessage.textContent())?.trim() ?? '';
  }

  async getAnyValidationErrorMessage(timeoutMs = 10_000): Promise<string> {
    const pollMs = 250;
    const maxTries = Math.ceil(timeoutMs / pollMs);

    for (let i = 0; i < maxTries; i++) {
      if (await this.accountNumberFieldErrorMessage.isVisible().catch(() => false)) {
        return (await this.accountNumberFieldErrorMessage.textContent())?.trim() ?? '';
      }
      if (await this.ifscFieldErrorMessage.isVisible().catch(() => false)) {
        return (await this.ifscFieldErrorMessage.textContent())?.trim() ?? '';
      }
      if (await this.toastErrorDetail.isVisible().catch(() => false)) {
        return (await this.toastErrorDetail.textContent())?.trim() ?? '';
      }
      await this.page.waitForTimeout(pollMs);
    }

    throw new Error(`No validation error appeared within ${timeoutMs}ms`);
  }
}