import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class WithdrawalPage extends BasePage {
  private readonly cancelButton: Locator;
  private readonly proceedButton: Locator;
  private readonly depositOption: Locator;
  private readonly depositProceedButton: Locator;
  private readonly goldVaultSection: Locator;
  private readonly totalGoldVault: Locator;
  private readonly totalGold: Locator;
  private readonly totalSilver: Locator;
  private readonly totalInvestment: Locator;
  private readonly withdrawingValue: Locator;
  private readonly remainingValue: Locator;
  private readonly sellingPrice: Locator;
  private readonly quantityInput: Locator;
  private readonly quantityError: Locator;
  private readonly timer: Locator;
  private readonly goldRow: Locator;
  private readonly goldValue: Locator;
  private readonly amountRow: Locator;
  private readonly amountValue: Locator;
  private readonly totalAmountRow: Locator;
  private readonly totalAmountValue: Locator;
  private readonly totalWithdrawContainer: Locator;
  private readonly totalWithdrawAmount: Locator;
  private readonly proceedToWithdrawBtn: Locator;

  constructor(page: Page) {
    super(page);

    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.proceedButton = page.getByRole('button', { name: 'Proceed' });

    this.depositOption = page.getByText('Deposits');
    this.depositProceedButton = page.getByRole('button', { name: /Proceed/i }).first();

    this.goldVaultSection = page
      .getByText('Gold Vault', { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"border") or contains(@class,"card")]')
      .first();

    this.totalGoldVault = this.goldVaultSection
      .locator('xpath=.//div[normalize-space()="Total Gold"]/following-sibling::div[1]')
      .first();

    this.totalGold = page.locator(
      'xpath=(//div[normalize-space()="Total Gold"]/preceding-sibling::div[1])[1]',
    );

    this.totalSilver = page.locator(
      'xpath=(//div[normalize-space()="Total Silver"]/preceding-sibling::div[1])[1]',
    );

    this.totalInvestment = page.locator(
      'xpath=(//div[normalize-space()="Total Investment"]/following-sibling::div)[1]',
    );

    this.withdrawingValue = page.locator(
      'xpath=(//div[normalize-space()="Withdrawing"]/following-sibling::div[1])[1]',
    );

    this.remainingValue = page.locator(
      'xpath=(//div[normalize-space()="Remaining"]/following-sibling::div[1])[1]',
    );

    this.sellingPrice = page.locator(
      'xpath=//div[contains(text(),"Selling at")]//span',
    );

    this.quantityInput = page.locator('#integeronly');
    this.quantityError = page.locator('small.p-error span');
    this.timer = page.locator('text=/Valid for \\d{1,2}:\\d{2}/');
    this.goldRow = page.locator('div:has-text("Gold")').locator('..');
    this.goldValue = page.locator('//div[normalize-space()="Gold"]/following-sibling::div');
    this.amountRow = page.locator('div:has-text("Amount")').locator('..');
    this.amountValue = this.amountRow.locator('div').nth(1);
    this.totalAmountRow = page.locator('div:has-text("Total Amount")').locator('..');
    this.totalAmountValue = this.totalAmountRow.locator('div').nth(1);
    this.totalWithdrawContainer = page.locator('div:has-text("Total amount to withdraw")');
    this.totalWithdrawAmount = this.totalWithdrawContainer.locator('span');
    this.proceedToWithdrawBtn = page.getByRole('button', { name: 'Proceed to withdraw' });
  }

  private proceedButtonVault(vaultName: string): Locator {
    return this.page
      .locator('div.border')
      .filter({ hasText: vaultName })
      .getByRole('button', { name: 'Proceed' });
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickProceed(): Promise<void> {
    await this.proceedButton.click();
  }

  async clickDeposit(): Promise<void> {
    await this.depositOption.click();
  }

  async clickDepositProceed(): Promise<void> {
    await this.depositProceedButton.click();
  }

  async getTotalInvestmentValue(): Promise<number> {
    const text = (await this.totalInvestment.textContent()) ?? '';
    const cleaned = text.replace(/[₹,\s]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  }

  async getTotalGoldValue(): Promise<number> {
    const text = (await this.totalGold.textContent()) ?? '';
    const cleaned = text.replace(/[^\d.]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  }

  async getTotalSilverValue(): Promise<number> {
    const text = (await this.totalSilver.textContent()) ?? '';
    const cleaned = text.replace(/[^\d.]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  }

  async getGoldVaultValue(): Promise<number> {
    const text = (await this.totalGoldVault.textContent()) ?? '';
    const cleaned = text.replace(/[^\d.]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  }

  async getWithdrawingValue(): Promise<number> {
    await this.withdrawingValue.waitFor({ state: 'visible' });
    const text = (await this.withdrawingValue.textContent()) ?? '';
    const cleaned = text.replace(/[^\d.]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  }

  async getRemainingValue(): Promise<number> {
    await this.remainingValue.waitFor({ state: 'visible' });
    const text = (await this.remainingValue.textContent()) ?? '';
    const cleaned = text.replace(/[^\d.]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  }

  async getSellingPrice(): Promise<number> {
    await this.sellingPrice.waitFor({ state: 'visible' });
    const text = (await this.sellingPrice.textContent()) ?? '';
    const cleaned = text.replace(/[^\d.]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  }

  async enterQuantity(value: number): Promise<void> {
    await this.quantityInput.click();
    await this.quantityInput.fill('');
    await this.quantityInput.type(value.toString(), { delay: 100 });
    await this.quantityInput.press('Tab');
  }

  async getQuantityErrorText(): Promise<string> {
    await this.quantityError.waitFor({ state: 'visible' });
    const text = (await this.quantityError.textContent()) ?? '';
    return text.trim();
  }

  async clickVaultProceed(vaultName: string): Promise<void> {
    const btn = this.proceedButtonVault(vaultName);
    await btn.waitFor({ state: 'visible' });
    await btn.click();
  }

  async isProceedButtonDisabled(): Promise<boolean> {
    await this.proceedButton.waitFor({ state: 'visible' });
    return this.proceedButton.isDisabled();
  }

  async isProceedButtonEnabled(): Promise<boolean> {
    await this.proceedButton.waitFor({ state: 'visible' });
    return this.proceedButton.isEnabled();
  }

  convertToSeconds(time: string): number {
    const [min, sec] = time.trim().split(':').map(Number);
    return min * 60 + sec;
  }

  async isTimerVisible(): Promise<boolean> {
    return this.timer.isVisible();
  }

  async getTimerText(): Promise<string> {
    const raw = (await this.timer.textContent())?.trim() ?? '';
    const match = raw.match(/\d{1,2}:\d{2}/);
    if (!match) {
      throw new Error(`Timer text is not in expected format. Received: "${raw}"`);
    }
    return match[0];
  }

  async waitForTimerChange(previousTime: string): Promise<void> {
    const timeoutMs = 10_000;
    const intervalMs = 500;
    const maxAttempts = Math.ceil(timeoutMs / intervalMs);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const current = await this.getTimerText();
      if (current !== previousTime) {
        return;
      }
      await this.page.waitForTimeout(intervalMs);
    }

    throw new Error(`Timer did not change within ${timeoutMs}ms from ${previousTime}`);
  }

  async getGoldValueFromDetails(): Promise<number> {
    await this.goldValue.waitFor({ state: 'visible' });
    const text = await this.goldValue.textContent();

    if (!text) {
      throw new Error('Gold value not found');
    }

    return parseFloat(text.replace('gm', '').trim());
  }

  async getMetalValueFromDetails(metalType: 'Gold' | 'Silver'): Promise<number> {
    const metalValue = this.page.locator(
      `//div[normalize-space()="${metalType}"]/following-sibling::div`
    );
    await metalValue.waitFor({ state: 'visible' });
    const text = await metalValue.textContent();
    if (!text) {
      throw new Error(`${metalType} value not found`);
    }
    return parseFloat(text.replace('gm', '').trim());
  }

  async getAmountFromAccountDetails(): Promise<number> {
    const text = (await this.page.locator('text=Amount').locator('..').locator('div').nth(1).textContent()) ?? '';
    return parseFloat(text.replace(/[₹,]/g, '').trim());
  }

  async getTotalAmountFromAccountDetails(): Promise<number> {
    const text = (await this.page.locator('text=Total Amount').locator('..').locator('div').nth(1).textContent()) ?? '';
    return parseFloat(text.replace(/[₹,]/g, '').trim());
  }

  async selectBankAccount(): Promise<void> {
    await this.page.getByText('Bank Account').click();
  }

  async getTotalWithdrawAmount(): Promise<number> {
    const text = (await this.page
      .locator('text=Total amount to withdraw')
      .locator('..')
      .locator('div')
      .nth(1)
      .textContent()) ?? '';

    const match = text.match(/[\d,]+(\.\d+)?/);
    if (!match) {
      throw new Error(`Amount not found in text: ${text}`);
    }

    return parseFloat(match[0].replace(/,/g, ''));
  }

  async clickProceedToWithdraw(): Promise<void> {
    await this.proceedToWithdrawBtn.waitFor({ state: 'visible' });
    await this.proceedToWithdrawBtn.click();
  }
}
