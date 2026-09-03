import { BasePage } from "@pages/shared/base.page";
import { test, expect, Page, Locator } from '@playwright/test';

export class WithdrawAccountDetailPage extends BasePage {

  private readonly withdrawalAmount: Locator;
  private readonly withdrawalFrom: Locator;
  private readonly metalQuantity: Locator;
  private readonly netWithdrawalAmount: Locator;
  private readonly bankAccountOption: Locator;
  private readonly upiOption: Locator;
  private readonly transferOptions: Locator;
  private readonly bankCards: Locator;
  private readonly validForCounter: Locator;
  private readonly liveSilverPrice: Locator;
  private readonly withdrawButton: Locator;
  private readonly cancelButton: Locator;
  private readonly upiCards: Locator;
  private readonly selectedUpiCard: Locator;


  constructor(page: Page) {
    super(page);
    this.selectedUpiCard = this.page.locator(
      'div.border-sheengold-brown'
    );
    this.withdrawalAmount = this.page.locator(
      'p:text-is("Withdrawal Amount") + p'
    );
    this.upiCards = page.locator(
      'div.border.rounded-lg.py-4.px-4.border-slate-300.cursor-pointer'
    );
    this.withdrawalFrom = page
      .locator('p:has-text("Withdrawal from")')
      .locator('xpath=following-sibling::p[1]');

    this.metalQuantity = page
      .locator('p:has-text("Quantity")')
      .locator('xpath=following-sibling::p[1]');

    this.netWithdrawalAmount = page
      .locator('p:has-text("Net Withdrawal Amount")')
      .locator('xpath=following-sibling::p[1]');

    this.bankAccountOption = page.getByRole('button', {
      name: 'Bank Account View, manage and add bank accounts',
    });
    this.upiOption = page.getByRole('button', {
      name: /UPI/i,
    });

    this.transferOptions = page.locator(
      'button:has-text("Bank Account"), button:has-text("UPI")'
    );
    this.validForCounter = page.locator('span', {
      hasText: 'Valid For',
    });
    this.liveSilverPrice = page.locator(
      'span:has-text("Live Silver Price") >> span.font-bold'
    );
    this.bankCards = page.locator(
      'div.border.cursor-pointer.rounded-lg'
    );
    this.withdrawButton = page
    .getByRole('dialog', { name: 'Withdrawal Confirmation' })
    .getByRole('button', { name: 'Withdraw' });
  
    this.cancelButton = page
    .getByRole('dialog', { name: 'Withdrawal Confirmation' })    
    .getByRole('button', { name: 'Cancel' }); 
  
  }    



  async getWithdrawalAmount(): Promise<number> {
    await expect(this.withdrawalAmount).toBeVisible();

    const text = await this.withdrawalAmount.textContent();

    return Number(text?.replace(/[₹,]/g, '').trim() ?? '0');
  }

  async getAccountDetails(): Promise<{
    withdrawalFrom: string;
    quantity: number;
    netWithdrawalAmount: number;
  }> {
    const withdrawalFromText =
      await this.withdrawalFrom.textContent();

    const quantityText =
      await this.metalQuantity.textContent();

    const netWithdrawalAmountText =
      await this.netWithdrawalAmount.textContent();

    return {
      withdrawalFrom: withdrawalFromText?.trim() ?? '',

      quantity: Number(
        quantityText
          ?.replace('gm', '')
          .replace(/,/g, '')
          .trim() ?? '0',
      ),

      netWithdrawalAmount: Number(
        netWithdrawalAmountText
          ?.replace('₹', '')
          .replace(/,/g, '')
          .trim() ?? '0',
      ),
    };
  }

  async validateTransferOptions(): Promise<void> {
    await expect(this.bankAccountOption).toBeVisible();
    await expect(this.upiOption).toBeVisible();
    await expect(this.transferOptions).toHaveCount(2);
  }

  

  async clickUPI(): Promise<void> {
    await this.upiOption.waitFor({ state: 'visible' });
    await this.upiOption.click();
  }

  private async waitForDialogMaskHidden(timeoutMs = 10_000): Promise<void> {
    await this.page
      .locator('.p-dialog-mask')
      .waitFor({ state: 'hidden', timeout: timeoutMs })
      .catch(() => {});
  }

  async clickBankAccount(): Promise<void> {
    await this.waitForDialogMaskHidden();
    await this.bankAccountOption.waitFor({ state: 'visible' });
    await this.bankAccountOption.click();
  }

  async validateCounter(): Promise<void> {
    await expect(this.validForCounter).toBeVisible();
  
    await expect(this.validForCounter).toHaveText(
      /^Valid For \d{2}:\d{2}$/,
      { timeout: 10000 }
    );
  
    const initialText =
      (await this.validForCounter.textContent())?.trim() || '';
  
    console.log(`Initial Counter Value: ${initialText}`);
  
    await this.page.waitForTimeout(3000);
  
    const updatedText =
      (await this.validForCounter.textContent())?.trim() || '';
  
    console.log(`Updated Counter Value: ${updatedText}`);
  
    expect(updatedText).not.toBe(initialText);
  }  
  
  async getLiveSilverPrice(): Promise<number> {
    const priceText = (await this.liveSilverPrice.textContent())?.trim() || '';

    console.log(`Live Silver Price: ${priceText}`);

    return Number(
      priceText.replace('₹', '').replace('/gm', '').trim()
    );
  }

  private bankCardByName(bankName: string): Locator {
    return this.page.locator(
      'div.border.cursor-pointer.rounded-lg',
      {
        has: this.page.locator('p.font-gilroysemibold', {
          hasText: bankName,
        }),
      }
    );
  }

  /**
   * True if `bankName` already appears among the customer's linked bank accounts.
   * Uses a bounded wait rather than a bare `.isVisible()` check (which returns immediately,
   * without retrying) — confirmed live 2026-09-01: called right after `clickBankAccount()` opens
   * the account list, before its accordion content has finished rendering, a bare `.isVisible()`
   * can read `false` on an already-linked bank. That false negative sent the test down the
   * "add new bank" branch for a bank that already existed, and the app's resulting "Customer bank
   * already added" toast (plus the add-bank dialog's mask) then blocked pointer events over the
   * bank list for the next several seconds, so the caller's own follow-up `selectBank()` click
   * kept timing out too. Same bounded-wait pattern `hasAnyBank()` already uses below.
   */
  async isBankAvailable(bankName: string): Promise<boolean> {
    return this.bankCardByName(bankName)
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
  }

  /** True if the customer has any linked bank account at all. */
  async hasAnyBank(): Promise<boolean> {
    return this.bankCards
      .first()
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
  }

  async selectBank(bankName: string): Promise<void> {
    const bankCard = this.bankCardByName(bankName);

    await bankCard.click();

    console.log(`Selected Bank: ${bankName}`);
  }
  async selectFirstBank(): Promise<void> {
    await this.clickBankAccount();

    const firstBank = this.bankCards.filter({ visible: true }).first();

    if (!(await firstBank.isVisible())) {
      throw new Error(
        'No visible bank account found. Please create at least one bank account.'
      );
    }

    await firstBank.click();
  }

  async getBankDetails(bankName: string): Promise<{
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
  }> {
    const bankCard = this.bankCardByName(bankName);

    const details = await bankCard.locator('p').allTextContents();

    const bankDetails = {
      bankName: details[0]?.trim() || '',
      accountHolderName:
        details[1]?.replace('Name:', '').trim() || '',
      accountNumber:
        details[2]?.replace('Account Number:', '').trim() || '',
      ifscCode:
        details[3]?.replace('IFSC Code:', '').trim() || '',
    };

    console.log('Bank Details:', bankDetails);

    return bankDetails;
  }
  async validateWithdrawAndCancelOptions(): Promise<void> {
    await expect(this.withdrawButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
    console.log('Withdraw button is displayed');
    console.log('Cancel button is displayed');
  }
  async withdrawButtonClick() {
    await this.withdrawButton.click();
    await this.page.waitForTimeout(3000);
  }
  async cancelButtonClick() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(1000);
  }
  async isWithdrawalConfirmationDialogVisible(): Promise<boolean> {
    return this.page
      .getByRole('dialog', { name: 'Withdrawal Confirmation' })
      .isVisible();
  }
  getLivePrice(metal: 'Gold' | 'Silver'): Locator {
    return this.page.locator(
      `span:has-text("Live ${metal} Price") >> span.font-bold`
    );
  }
  async getLivePriceValue(metal: 'Gold' | 'Silver'): Promise<number> {
    const priceText =
      (await this.getLivePrice(metal).textContent())?.trim() || '';
  
    console.log(`Live ${metal} Price: ${priceText}`);
  
    return Number(
      priceText.replace('₹', '').replace('/gm', '').trim()
    );
  }
  async selectUpi(): Promise<string> {
    const upiRegion = this.page.getByRole('region', { name: /UPI/i });

    const upiText = upiRegion.locator('p').filter({ hasText: /@/ }).first();

    await expect(
      upiText,
      'No UPI account is available. Please add a UPI account before proceeding.'
    ).toBeVisible();

    const upiId = (await upiText.textContent())?.trim() ?? '';

    console.log(`Selected UPI: ${upiId}`);

    // A UPI account that hasn't been verified yet renders as a `cursor-not-allowed` card with its
    // own "VERIFY" button instead of the selectable `cursor-pointer` card the ancestor lookup
    // below expects — confirmed live 2026-09-01 against the shared UAT customer's account.
    // Verifying flips the card to selectable immediately; no OTP step is involved.
    const card = upiText.locator(
      'xpath=ancestor::div[contains(@class,"border") and contains(@class,"rounded-lg")][1]'
    );
    const verifyButton = card.getByRole('button', { name: 'VERIFY' });
    if (await verifyButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await verifyButton.click();
      await expect(card).not.toHaveClass(/cursor-not-allowed/, { timeout: 10_000 });
    }

    await card.click();

    return upiId;
  }  async getSelectedBankDetails() {
    const selectedBank = this.page.locator('div.border-sheengold-brown');
  
    return {
      bankName: (await selectedBank.locator('p.font-gilroysemibold').textContent())?.trim() ?? '',
      accountHolder: (await selectedBank.locator('p').nth(1).textContent())?.replace('Name: ', '').trim() ?? '',
      accountNumber: (await selectedBank.locator('p').nth(2).textContent())?.replace('Account Number: ', '').trim() ?? '',
      ifscCode: (await selectedBank.locator('p').nth(3).textContent())?.replace('IFSC Code: ', '').trim() ?? '',
    };

    
  }
  


}