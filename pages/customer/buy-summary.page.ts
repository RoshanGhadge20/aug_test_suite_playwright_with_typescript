import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export type OneTimeSummaryResult = {
  quantity: number;
  buyingRate: number;
  amount: number;
  tax: number;
  total: number;
  paidFromWallet: number;
  payable: number;
};

function calculateOneTimeAmounts(total: number, buyingRate: number, paidFromWallet: number) {
  const taxable = Number((total / 1.03).toFixed(2));
  const gst = Number((total - taxable).toFixed(2));
  const payable = Number((total - paidFromWallet).toFixed(2));
  const quantity = Number((taxable / buyingRate).toFixed(4));
  return { amount: taxable, tax: gst, total, payable, calcQuantity: quantity };
}

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

  async validateSipSummary(params: {
    amount: string;
    frequency: string;
    planName: string;
    metalLabel: string;
    metal: string;
    frequencyType: 'weekly' | 'monthly';
    selectedSipStartDate?: string;
  }): Promise<void> {
    const investingAmount = Number(await this.getInvestingAmountSIP());
    console.log(
      `[SIP SUMMARY] investingAmount actual=${investingAmount} expected=${Number(params.amount)}`,
    );
    expect(investingAmount).toBe(Number(params.amount));

    const isEditVisible = await this.isEditVisible();
    console.log(`[SIP SUMMARY] editVisible actual=${isEditVisible} expected=true`);
    expect(isEditVisible).toBe(true);

    const frequencyText = await this.getFrequencyText();
    console.log(`[SIP SUMMARY] frequency actual=${frequencyText} expected=${params.frequency}`);
    expect(frequencyText).toBe(params.frequency);

    const investmentPurposeText = await this.getInvestmentPurposeText();
    console.log(`[SIP SUMMARY] investmentPurpose actual=${investmentPurposeText} expected=${params.planName}`);
    expect(investmentPurposeText).toBe(params.planName);

    const metalType = (await this.getMetalTypeText(params.metalLabel)).toLowerCase();
    console.log(`[SIP SUMMARY] metalType actual=${metalType} expected=${params.metal.toLowerCase()}`);
    expect(metalType).toBe(params.metal.toLowerCase());

    if (params.selectedSipStartDate) {
      const sipStartDate = await this.getSipStartDate();
      const [day, month, year] = params.selectedSipStartDate.split('/');
      const expectedDate = `${year}-${month}-${day}`;
      console.log(`[SIP SUMMARY] sipStartDate actual=${sipStartDate} expected=${expectedDate}`);
      expect(sipStartDate).toBe(expectedDate);
    }

    if (params.frequencyType === 'weekly') {
      const amountPerWeek = Number(await this.getAmountPerWeek());
      console.log(
        `[SIP SUMMARY] amountPerWeek actual=${amountPerWeek} expected=${Number(params.amount)}`,
      );
      expect(amountPerWeek).toBe(Number(params.amount));
    } else {
      const amountPerMonth = Number(await this.getAmountPerMonth());
      console.log(
        `[SIP SUMMARY] amountPerMonth actual=${amountPerMonth} expected=${Number(params.amount)}`,
      );
      expect(amountPerMonth).toBe(Number(params.amount));
    }
  }

  async validateSipSummaryAndProceed(params: {
    amount: string;
    frequency: string;
    planName: string;
    metalLabel: string;
    metal: string;
    frequencyType: 'weekly' | 'monthly';
    selectedSipStartDate?: string;
  }): Promise<void> {
    await this.validateSipSummary(params);
    await this.clickProceedToPay();
  }

  async validateOneTimeSummary(expectedAmount: string): Promise<OneTimeSummaryResult> {
    await this.waitForValidForText();
    const quantity = await this.getQuantity();
    const buyingRate = await this.getBuyingGoldRate();
    const investingAmount = await this.getInvestingAmount();
    console.log(`[BUY SUMMARY] buyingRate=${buyingRate}`);
    console.log(
      `[BUY SUMMARY] investingAmount actual=${investingAmount} expected=${Number(expectedAmount)}`,
    );
    expect(investingAmount).toBe(Number(expectedAmount));
    expect(await this.isEditVisible()).toBe(true);

    const amount = await this.getAmount();
    const tax = await this.getTax();
    const total = await this.getTotalAmount();
    const paidFromWallet = await this.getPaidFromWallet();
    const payable = await this.getAmountPayable();
    const calculated = calculateOneTimeAmounts(total, buyingRate, paidFromWallet);

    console.log(`[BUY SUMMARY] quantity actual=${quantity} expected=${calculated.calcQuantity}`);
    console.log(`[BUY SUMMARY] taxable amount actual=${amount} expected=${calculated.amount}`);
    console.log(`[BUY SUMMARY] tax actual=${tax} expected=${calculated.tax}`);
    console.log(`[BUY SUMMARY] payable actual=${payable} expected=${calculated.payable}`);

    expect(quantity).toBeCloseTo(calculated.calcQuantity, 3);
    expect(amount).toBeCloseTo(calculated.amount, 2);
    expect(tax).toBeCloseTo(calculated.tax, 2);
    expect(payable).toBeCloseTo(calculated.payable, 2);
    await expect(this.page).toHaveURL(/digital-(?:gold|silver)\/buy\/summary/i);

    return { quantity, buyingRate, amount, tax, total, paidFromWallet, payable };
  }

  async cancelAndStayOnSummary(): Promise<void> {
    await this.clickCancel();
    await expect(this.page.getByText('Yes, Cancel', { exact: true })).toBeVisible();
    await expect(this.page.getByText('No, Complete Process', { exact: true })).toBeVisible();
    await this.clickNoCompleteProcess();
    await expect(this.page).toHaveURL(/summary/);
  }

  async cancelAndReturnToBuyPage(buyPathPattern: RegExp): Promise<void> {
    await this.clickCancel();
    await this.clickYesCancel();
    await expect(this.page).toHaveURL(buyPathPattern);
  }

  async cancelSipFlow(): Promise<void> {
    await this.cancelAndStayOnSummary();
    await this.cancelAndReturnToBuyPage(/digital-gold/);
  }

  async cancelBuyFlow(metal: 'gold' | 'silver'): Promise<void> {
    const buyPathPattern = metal === 'gold' ? /digital-gold/ : /digital-silver/;
    await this.cancelAndStayOnSummary();
    await this.cancelAndReturnToBuyPage(buyPathPattern);
  }

  async expectOnBuySummaryPage(metal: 'gold' | 'silver'): Promise<void> {
    await this.waitForValidForText();
    const summaryUrlPattern =
      metal === 'gold' ? /digital-gold\/buy\/summary/i : /digital-silver\/buy\/summary/i;
    await expect(this.page).toHaveURL(summaryUrlPattern);
  }

  async validateOneTimeSummaryAndPayNow(expectedAmount: string): Promise<OneTimeSummaryResult> {
    const summary = await this.validateOneTimeSummary(expectedAmount);
    await this.clickPayNowButton();
    return summary;
  }

  async confirmRecreateAndProceed(expectedFrequency: string): Promise<string> {
    const planName = await this.getInvestmentPurposeText();
    expect(await this.getFrequencyText()).toBe(expectedFrequency);
    await this.clickProceedToPay();
    return planName;
  }
}
