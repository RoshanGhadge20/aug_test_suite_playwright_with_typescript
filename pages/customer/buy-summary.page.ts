import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class BuySummaryPage extends BasePage {
  private readonly validForText: Locator;
  private readonly editButton: Locator;
  private readonly amountValue: Locator;
  private readonly taxValue: Locator;
  private readonly totalValue: Locator;
  private readonly paidFromWallet: Locator;
  private readonly amountPayable: Locator;
  private readonly cancelBtn: Locator;
  private readonly yesCancelBtn: Locator;
  private readonly noCompleteBtn: Locator;
  private readonly payNowBtn: Locator;
  private readonly weeklyText: Locator;
  private readonly quantityText: Locator;

  constructor(page: Page) {
    super(page);
    this.validForText = this.page.getByText('Valid for', { exact: false });
    this.editButton = page.locator('//span[text()="Edit"]');
    this.amountValue = page.locator('//span[text()="Amount"]/following::span[@class="font-gilroybold text-darkgunmetal"][1]');
    this.taxValue = page.locator('//span[text()="Tax"]/following::span[@class="font-gilroybold text-darkgunmetal"][1]');
    this.totalValue = page.locator('//span[text()="Total Amount"]/following::span[@class="font-gilroybold text-darkgunmetal"][1]');
    this.paidFromWallet = page.locator('//span[text()="Paid From Wallet"]/following::span[@class="font-gilroybold text-darkgunmetal"][1]');
    this.amountPayable = page.locator('//span[text()="Amount Payable"]/following::span[@class="font-gilroybold text-darkgunmetal"][1]');
    this.cancelBtn = page.getByText('Cancel', { exact: true });
    this.yesCancelBtn = page.getByText('Yes, Cancel', { exact: true });
    this.noCompleteBtn = page.getByText('No, Complete Process', { exact: true });
    this.payNowBtn = page.getByRole('button', { name: 'Pay Now' });
    this.weeklyText = page.locator('span.font-gilroybold.text-darkgunmetal', { hasText: 'Weekly' });
    this.quantityText = page.locator('text=Quantity >> xpath=following-sibling::*');
  }

  async getBuyingGoldRate(): Promise<number> {
    const text = await this.page.getByText('Buying at ₹', { exact: false }).innerText();
    const rate = text
      .replace('Buying at ₹', '')
      .replace('/ gm', '')
      .replace('Valid for', '')
      .split(':')[0]
      .trim();
    return Number(rate);
  }

  async waitForValidForText(): Promise<void> {
    const kycUrlPattern = /\/kyc(?:\/|$|\?)/i;
    const currentUrl = this.page.url();

    if (kycUrlPattern.test(currentUrl)) {
      throw new Error(`Cannot open buy summary: redirected to KYC page (${currentUrl}).`);
    }

    await this.page.waitForLoadState('domcontentloaded');

    try {
      await this.validForText.first().waitFor({ state: 'visible', timeout: 15_000 });
    } catch {
      const latestUrl = this.page.url();
      if (kycUrlPattern.test(latestUrl)) {
        throw new Error(`Cannot open buy summary: redirected to KYC page (${latestUrl}).`);
      }

      // Some variants render amount blocks before/without the "Valid for" text.
      const investingAmount = this.page.getByText('Investing ₹', { exact: false }).first();
      await investingAmount.waitFor({ state: 'visible', timeout: 20_000 });
    }
  }

  async getInvestingAmount(): Promise<number> {
    const text = await this.page.getByText('Investing ₹', { exact: false }).innerText();
    return Number(text.replace('Investing ₹', '').trim());
  }

  async getInvestingAmountSIP(): Promise<number> {
    const amountSpan = this.page.locator(
      'div.text-24.text-darkgunmetal.font-cabinetgroteskbold span.font-gilroybold',
    );
    await amountSpan.waitFor({ state: 'visible' });
    const text = (await amountSpan.textContent()) ?? '';
    return Number(text.replace(/[₹,\s]/g, ''));
  }

  async isEditVisible(): Promise<boolean> {
    return this.editButton.isVisible();
  }

  async getAmount(): Promise<number> {
    return parseFloat((await this.amountValue.innerText()).replace(/[₹,\s]/g, ''));
  }

  async getQuantity(): Promise<number> {
    await this.quantityText.waitFor({ state: 'visible' });
    const text = (await this.quantityText.textContent()) ?? '';
    return Number(text.replace(/[^\d.]/g, ''));
  }

  async getTax(): Promise<number> {
    return parseFloat((await this.taxValue.innerText()).replace(/[₹,\s]/g, ''));
  }

  async getTotalAmount(): Promise<number> {
    return parseFloat((await this.totalValue.innerText()).replace(/[₹,\s]/g, ''));
  }

  async getPaidFromWallet(): Promise<number> {
    if (await this.paidFromWallet.isVisible({ timeout: 100 })) {
      const text = await this.paidFromWallet.innerText();
      return parseFloat(text.replace(/[₹,\s]/g, ''));
    }
    return 0;
  }

  async getAmountPayable(): Promise<number> {
    return parseFloat((await this.amountPayable.innerText()).replace(/[₹,\s]/g, ''));
  }

  async getMetalTypeText(metal: string): Promise<string> {
    return this.page.locator(
      `//span[@class="font-gilroybold text-darkgunmetal" and normalize-space(text())="${metal}"]`,
    ).innerText();
  }

  async clickCancel(): Promise<void> {
    await this.cancelBtn.click();
  }

  async clickYesCancel(): Promise<void> {
    await this.yesCancelBtn.click();
  }

  async clickNoCompleteProcess(): Promise<void> {
    await this.noCompleteBtn.click();
  }

  async clickPayNowButton(): Promise<void> {
    await this.payNowBtn.click();
  }

  async getFrequencyText(): Promise<string> {
    const valueLocator = this.page.locator('span.font-gilroymedium.text-nickel', {
      hasText: 'SIP Duration',
    }).locator('xpath=following-sibling::span');

    const text = await valueLocator.textContent();
    return text?.trim() ?? '';
  }

  async getInvestmentPurposeText(): Promise<string> {
    const value = this.page.locator(
      'span.font-gilroymedium:text("Investment Purpose") + span.font-gilroybold',
    );

    await value.waitFor({ state: 'visible' });
    return (await value.textContent())?.trim() ?? '';
  }

  async getSipStartDate(): Promise<string> {
    const dateLocator = this.page
      .getByText('SIP Start Date', { exact: true })
      .locator('..')
      .locator('span.font-gilroybold.text-darkgunmetal');

    await dateLocator.waitFor({ state: 'visible' });
    return (await dateLocator.textContent())?.trim() ?? '';
  }

  async getAmountPerWeek(): Promise<number> {
    const text = await this.page
      .locator('text=Amount Per Week')
      .locator('xpath=following-sibling::*')
      .innerText();

    return Number(text.replace(/[₹,\s]/g, ''));
  }

  async getAmountPerMonth(): Promise<number> {
    const text = await this.page
      .locator('text=Amount Per Month')
      .locator('xpath=following-sibling::*')
      .innerText();

    return Number(text.replace(/[₹,\s]/g, ''));
  }

  async clickProceedToPay(): Promise<void> {
    const proceedBtn = this.page.getByRole('button', { name: /proceed to pay/i });
    await proceedBtn.waitFor({ state: 'visible', timeout: 20_000 });
    await proceedBtn.click();
    // UPI flows open "Set Up Bank Mandate"; e-mandate-only flows open "Choose bank account" or add-bank form.
    await Promise.race([
      this.page
        .getByRole('dialog', { name: /set up bank mandate/i })
        .waitFor({ state: 'visible', timeout: 30_000 }),
      this.page
        .getByRole('dialog', { name: /choose bank account/i })
        .waitFor({ state: 'visible', timeout: 30_000 }),
      this.page.locator('input#beneficiaryName').waitFor({ state: 'visible', timeout: 30_000 }),
    ]);
  }
}
