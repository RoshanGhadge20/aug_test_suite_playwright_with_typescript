import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class WithdrawalPage extends BasePage {
  private readonly cancelButton: Locator;
  private readonly proceedButton: Locator;
  private readonly depositOption: Locator;
  private readonly depositProceedButton: Locator;
  private readonly goldVaultSection: Locator;
  private readonly silverVaultSection: Locator;
  private readonly totalGoldVault: Locator;
  private readonly totalSilverVault: Locator;
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
  private readonly minimumSellingAmountErrorSection: Locator;

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

    this.silverVaultSection = page
      .getByText('Silver Vault', { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"border") or contains(@class,"card")]')
      .first();

    this.totalGoldVault = this.goldVaultSection
      .locator('xpath=.//div[normalize-space()="Total Gold"]/following-sibling::div[1]')
      .first();

    this.totalSilverVault = this.silverVaultSection
      .locator('xpath=.//div[normalize-space()="Total Silver"]/following-sibling::div[1]')
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
    this.minimumSellingAmountErrorSection = page
      .locator('section.bg-white.rounded-xl')
      .filter({ hasText: /The minimum selling amount is Rs\.?\s*10/i });
  }

  private proceedButtonVault(vaultName: string): Locator {
    return this.page
      .locator('div.border')
      .filter({ hasText: vaultName })
      .getByRole('button', { name: 'Proceed' });
  }

  private convertGoldJewelleryProceedButton(): Locator {
    return this.page
      .locator(
        'xpath=//div[contains(@class,"border") and contains(@class,"rounded-xl") and .//div[contains(normalize-space(),"Convert into Gold/Jewellery")]]',
      )
      .first()
      .locator('span.p-button-label.ng-star-inserted')
      .filter({ hasText: /^Proceed$/i })
      .first();
  }

  private convertSilverJewelleryProceedButton(): Locator {
    return this.page
      .locator(
        'xpath=//div[contains(@class,"border") and contains(@class,"rounded-xl") and .//div[contains(normalize-space(),"Convert into Silver/Jewellery")]]',
      )
      .first()
      .locator('span.p-button-label.ng-star-inserted')
      .filter({ hasText: /^Proceed$/i })
      .first();
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
  async getSilverVaultValue(): Promise<number> {
    const text = (await this.totalSilverVault.textContent()) ?? '';
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
    const quantityInput = this.page.locator('#integeronly:visible').first();
    await quantityInput.waitFor({ state: 'visible' });
    await quantityInput.click();
    await quantityInput.fill('');
    await quantityInput.type(value.toString(), { delay: 100 });
    await quantityInput.press('Tab');
  }

  /** Quantity field scoped to the Silver Vault card (convert-to-silver flows). */
  async enterQuantityInSilverVault(value: number): Promise<void> {
    const silverVaultCard = this.page
      .locator('div.border.border-stroke.rounded-xl')
      .filter({ hasText: /Silver Vault/i })
      .first();

    const scopedSilverInput = silverVaultCard
      .locator('input#integeronly, input[role="spinbutton"][placeholder="Enter Grams"]')
      .first();
    const genericVisibleInput = this.page
      .locator('input#integeronly:visible, input[role="spinbutton"][placeholder="Enter Grams"]:visible')
      .first();

    const hasScopedInput = await scopedSilverInput.isVisible().catch(() => false);
    if (!hasScopedInput) {
      await silverVaultCard.scrollIntoViewIfNeeded().catch(() => undefined);
      await this.page.waitForTimeout(300);
    }

    const quantityInput =
      (await scopedSilverInput.isVisible().catch(() => false))
        ? scopedSilverInput
        : genericVisibleInput;

    await quantityInput.waitFor({ state: 'visible', timeout: 20_000 });
    await quantityInput.click();
    await quantityInput.fill('');
    await quantityInput.type(value.toString(), { delay: 100 });
    await quantityInput.press('Tab');
  }

  /**
   * Delivery SIP card scoped helper:
   * - finds SIP card by name
   * - reads Remaining (gm) from that same card
   * - enters quantity equal to provided product value (gm) in that card input
   */
  async deliveryGetRemainingAndEnterQuantityForSipCard(
    sipName: string,
    productValueInGm: number,
  ): Promise<{
    sipName: string;
    remainingValueInGm: number;
    enteredQuantityInGm: number;
    remainingValueAfterEntryInGm: number;
  }> {
    const normalizedSipName = sipName.trim();
    if (!normalizedSipName) {
      throw new Error('SIP name is required for delivery SIP card quantity entry.');
    }
    if (!Number.isFinite(productValueInGm) || productValueInGm <= 0) {
      throw new Error(`Invalid product value provided: ${productValueInGm}`);
    }

    const sipCard = this.page
      .locator('div.border.border-stroke.rounded-xl')
      .filter({
        has: this.page.locator('div.text-24.text-darkgunmetal.font-cabinetgroteskbold', {
          hasText: normalizedSipName,
        }),
      })
      .first();

    await sipCard.waitFor({ state: 'visible', timeout: 20_000 });

    const remainingTextRaw = (
      (await sipCard
        .locator('div.text-14.text-nickel.font-gilroymedium')
        .filter({ hasText: /Remaining/i })
        .locator('span.text-darkgunmetal.text-18.font-cabinetgroteskbold')
        .first()
        .textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    const remainingValueInGm = Number((remainingTextRaw.match(/[\d.]+/)?.[0] ?? '0').trim());
    if (!Number.isFinite(remainingValueInGm) || remainingValueInGm <= 0) {
      throw new Error(`Unable to parse Remaining value for SIP "${normalizedSipName}". Raw: "${remainingTextRaw}"`);
    }

    const quantityInput = sipCard.locator('input[role="spinbutton"][placeholder="Enter Grams"]').first();
    await quantityInput.waitFor({ state: 'visible', timeout: 20_000 });
    await quantityInput.click();
    await quantityInput.fill('');
    await quantityInput.type(productValueInGm.toString(), { delay: 80 });
    await quantityInput.press('Tab');
    await this.page.waitForTimeout(500);

    const remainingAfterEntryTextRaw = (
      (await sipCard
        .locator('div.text-14.text-nickel.font-gilroymedium')
        .filter({ hasText: /Remaining/i })
        .locator('span.text-darkgunmetal.text-18.font-cabinetgroteskbold')
        .first()
        .textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    const remainingValueAfterEntryInGm = Number((remainingAfterEntryTextRaw.match(/[\d.]+/)?.[0] ?? '0').trim());
    if (!Number.isFinite(remainingValueAfterEntryInGm) || remainingValueAfterEntryInGm < 0) {
      throw new Error(
        `Unable to parse Remaining-after-entry value for SIP "${normalizedSipName}". Raw: "${remainingAfterEntryTextRaw}"`,
      );
    }

    console.log(`[DELIVERY SIP CARD] Name: ${normalizedSipName}`);
    console.log(`[DELIVERY SIP CARD] Remaining (gm): ${remainingValueInGm}`);
    console.log(`[DELIVERY SIP CARD] Entered Quantity (gm): ${productValueInGm}`);
    console.log(`[DELIVERY SIP CARD] Remaining After Entry (gm): ${remainingValueAfterEntryInGm}`);

    return {
      sipName: normalizedSipName,
      remainingValueInGm,
      enteredQuantityInGm: productValueInGm,
      remainingValueAfterEntryInGm,
    };
  }

  async enterQuantityInFirstSipCard(
    quantityInGm: number,
    options?: { metalType?: 'Gold' | 'Silver' },
  ): Promise<{
    sipName: string;
    remainingValueInGm: number;
    enteredQuantityInGm: number;
    remainingValueAfterEntryInGm: number;
  }> {
    if (!Number.isFinite(quantityInGm) || quantityInGm <= 0) {
      throw new Error(`Invalid SIP quantity provided: ${quantityInGm}`);
    }

    const metalType = options?.metalType;
    const sipCards = this.page
      .locator('div.border.border-stroke.rounded-xl')
      .filter({
        has: this.page.locator('div.text-24.text-darkgunmetal.font-cabinetgroteskbold'),
      })
      .filter({ hasNotText: /Vault/i });

    await sipCards.first().waitFor({ state: 'visible', timeout: 20_000 });
    const cardCount = await sipCards.count();

    let sipCard: Locator | null = null;
    let sipName = '';
    let remainingTextRaw = '';
    let remainingValueInGm = 0;

    for (let index = 0; index < cardCount; index += 1) {
      const candidate = sipCards.nth(index);
      const candidateText = ((await candidate.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      if (metalType && !new RegExp(`\\b${metalType}\\b`, 'i').test(candidateText)) {
        continue;
      }

      const candidateSipName = (
        (await candidate.locator('div.text-24.text-darkgunmetal.font-cabinetgroteskbold').first().textContent()) ?? ''
      )
        .replace(/\s+/g, ' ')
        .trim();
      const candidateRemainingTextRaw = (
        (await candidate
          .locator('div.text-14.text-nickel.font-gilroymedium')
          .filter({ hasText: /Remaining/i })
          .locator('span.text-darkgunmetal.text-18.font-cabinetgroteskbold')
          .first()
          .textContent()) ?? ''
      )
        .replace(/\s+/g, ' ')
        .trim();
      const candidateRemainingValueInGm = Number((candidateRemainingTextRaw.match(/[\d.]+/)?.[0] ?? '0').trim());

      if (!Number.isFinite(candidateRemainingValueInGm) || candidateRemainingValueInGm < quantityInGm) {
        continue;
      }

      sipCard = candidate;
      sipName = candidateSipName;
      remainingTextRaw = candidateRemainingTextRaw;
      remainingValueInGm = candidateRemainingValueInGm;
      break;
    }

    if (!sipCard) {
      const metalLabel = metalType ? `${metalType} ` : '';
      throw new Error(
        `No ${metalLabel}SIP card found with remaining >= ${quantityInGm}gm.`,
      );
    }

    const quantityInput = sipCard.locator('input[role="spinbutton"][placeholder="Enter Grams"]').first();
    await quantityInput.waitFor({ state: 'visible', timeout: 20_000 });
    await quantityInput.click();
    await quantityInput.fill('');
    await quantityInput.type(quantityInGm.toString(), { delay: 80 });
    await quantityInput.press('Tab');
    await this.page.waitForTimeout(500);

    const remainingAfterEntryTextRaw = (
      (await sipCard
        .locator('div.text-14.text-nickel.font-gilroymedium')
        .filter({ hasText: /Remaining/i })
        .locator('span.text-darkgunmetal.text-18.font-cabinetgroteskbold')
        .first()
        .textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    const remainingValueAfterEntryInGm = Number((remainingAfterEntryTextRaw.match(/[\d.]+/)?.[0] ?? '0').trim());
    if (!Number.isFinite(remainingValueAfterEntryInGm) || remainingValueAfterEntryInGm < 0) {
      throw new Error(
        `Unable to parse Remaining-after-entry value for SIP "${sipName}". Raw: "${remainingAfterEntryTextRaw}"`,
      );
    }

    console.log(`[SIP CARD] Name: ${sipName}`);
    console.log(`[SIP CARD] Remaining (gm): ${remainingValueInGm}`);
    console.log(`[SIP CARD] Entered Quantity (gm): ${quantityInGm}`);
    console.log(`[SIP CARD] Remaining After Entry (gm): ${remainingValueAfterEntryInGm}`);

    return {
      sipName,
      remainingValueInGm,
      enteredQuantityInGm: quantityInGm,
      remainingValueAfterEntryInGm,
    };
  }

  /**
   * SIP card helper:
   * 1) reads Remaining value from the current SIP panel
   * 2) enters quantity equal to selected product value (gm)
   */
  async getRemainingAndEnterQuantityEqualToProductValue(productValueInGm: number): Promise<number> {
    if (!Number.isFinite(productValueInGm) || productValueInGm <= 0) {
      throw new Error(`Invalid product value provided: ${productValueInGm}`);
    }

    const remainingValue = await this.getRemainingValue();
    console.log(`[SIP REMAINING VALUE] ${remainingValue}`);

    await this.enterQuantity(productValueInGm);
    console.log(`[SIP ENTERED QUANTITY] ${productValueInGm}`);

    return remainingValue;
  }

  async getQuantityErrorText(): Promise<string> {
    await this.quantityError.waitFor({ state: 'visible' });
    const text = (await this.quantityError.textContent()) ?? '';
    return text.trim();
  }

  async clickUseTotalInvestmentAmountFromSipCheckbox(): Promise<void> {
    const checkboxContainer = this.page
      .locator('div.border.border-stroke')
      .filter({ hasText: /Use the total investment amount from this SIP/i })
      .first();

    await checkboxContainer.waitFor({ state: 'visible', timeout: 20_000 });

    const hiddenInput = checkboxContainer.locator('input[type="checkbox"]').first();
    const isCheckedBefore = await hiddenInput.isChecked().catch(() => false);
    if (!isCheckedBefore) {
      const label = checkboxContainer
        .locator('label')
        .filter({ hasText: /Use the total investment amount from this SIP/i })
        .first();

      if (await label.isVisible().catch(() => false)) {
        await label.click({ force: true });
      } else {
        const radioLikeRoot = checkboxContainer
          .locator('div[role="radio"], div.p-checkbox-box, div[data-pc-section="input"]')
          .first();
        await radioLikeRoot.click({ force: true });
      }
    }

    const isCheckedAfter = await hiddenInput.isChecked().catch(() => false);
    if (!isCheckedAfter) {
      throw new Error('Failed to select "Use the total investment amount from this SIP" checkbox.');
    }
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

  async getTotalGoldValueDelivery(): Promise<number> {
    const candidates = [
      this.page
        .locator('//div[normalize-space()="Total Gold Value"]/following-sibling::div[1]//span')
        .first(),
      this.page
        .locator('div.text-18.text-nickel.font-gilroymedium', { hasText: /^Total Gold Value$/i })
        .first()
        .locator('xpath=following-sibling::div[1]//span'),
      this.page.getByText(/^Total Gold Value$/i).first().locator('xpath=following-sibling::div[1]'),
      this.page.getByText(/^Total Gold Value$/i).first().locator('xpath=ancestor::div[1]/following-sibling::div[1]'),
    ];

    // Delivery summary can render a bit late after navigation.
    await this.page.waitForTimeout(1_000);

    for (const candidate of candidates) {
      const becameVisible = await candidate
        .waitFor({ state: 'visible', timeout: 5_000 })
        .then(() => true)
        .catch(() => false);

      if (becameVisible) {
        const valueText = ((await candidate.textContent()) ?? '').trim();
        const numeric = valueText.replace(/[^\d.]/g, '');
        const totalGoldValue = numeric ? Number(numeric) : 0;
        console.log('Total Gold Value (Delivery):', totalGoldValue);
        return totalGoldValue;
      }
    }

    throw new Error('Total Gold Value is not visible on delivery screen.');
  }

  async validateTotalGoldValueDelivery(expectedValue: number, precision = 4): Promise<void> {
    const actualValue = await this.getTotalGoldValueDelivery();
    const tolerance = 10 ** -precision;
    if (Math.abs(actualValue - expectedValue) > tolerance) {
      throw new Error(
        `Total Gold Value validation failed. Expected: ${expectedValue}, Actual: ${actualValue}`,
      );
    }
  }

  async getTotalSilverValueDelivery(): Promise<number> {
    const candidates = [
      this.page
        .locator('//div[normalize-space()="Total Silver Value"]/following-sibling::div[1]//span')
        .first(),
      this.page
        .locator('div.text-18.text-nickel.font-gilroymedium', { hasText: /^Total Silver Value$/i })
        .first()
        .locator('xpath=following-sibling::div[1]//span'),
      this.page.getByText(/^Total Silver Value$/i).first().locator('xpath=following-sibling::div[1]'),
      this.page.getByText(/^Total Silver Value$/i).first().locator('xpath=ancestor::div[1]/following-sibling::div[1]'),
    ];

    await this.page.waitForTimeout(1_000);

    for (const candidate of candidates) {
      const becameVisible = await candidate
        .waitFor({ state: 'visible', timeout: 5_000 })
        .then(() => true)
        .catch(() => false);

      if (becameVisible) {
        const valueText = ((await candidate.textContent()) ?? '').trim();
        const numeric = valueText.replace(/[^\d.]/g, '');
        const totalSilverValue = numeric ? Number(numeric) : 0;
        console.log('Total Silver Value (Delivery):', totalSilverValue);
        return totalSilverValue;
      }
    }

    throw new Error('Total Silver Value is not visible on delivery screen.');
  }

  async validateTotalSilverValueDelivery(expectedValue: number, precision = 4): Promise<void> {
    const actualValue = await this.getTotalSilverValueDelivery();
    const tolerance = 10 ** -precision;
    if (Math.abs(actualValue - expectedValue) > tolerance) {
      throw new Error(
        `Total Silver Value validation failed. Expected: ${expectedValue}, Actual: ${actualValue}`,
      );
    }
  }

  async selectBankAccount(): Promise<void> {
    const blockingOverlay = this.page.locator('div.p-blockui[aria-busy="true"]');
    if (await blockingOverlay.isVisible().catch(() => false)) {
      await blockingOverlay.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
    }

    const bankAccountLabel = this.page.locator('label[for="Bank Account"]').first();
    if (await bankAccountLabel.isVisible().catch(() => false)) {
      await bankAccountLabel.click({ force: true });
      return;
    }

    await this.page.getByText('Bank Account', { exact: true }).first().click({ force: true });
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

  /**
   * After "Proceed to withdraw", validates the inline error when the sell amount is below the platform minimum (Rs. 10).
   */
  async validateMinimumSellingAmountRs10Error(timeoutMs = 30_000): Promise<void> {
    const banner = this.minimumSellingAmountErrorSection.first();
    await banner.waitFor({ state: 'visible', timeout: timeoutMs });
    await expect(banner.getByText('Error', { exact: true })).toBeVisible();
    await expect(banner).toContainText('The minimum selling amount is Rs. 10');

    const messageLine =
      (await banner.locator('p.font-gilroy').filter({ hasText: /minimum selling amount/i }).first().textContent())?.trim() ??
      (await banner.locator('p').nth(1).textContent())?.trim() ??
      '';
    const bannerText = (await banner.innerText())?.trim() ?? '';
    console.log('[Withdrawal] Minimum selling error — message:', messageLine || bannerText);
  }

  async isProceedToWithdrawButtonDisabled(): Promise<boolean> {
    await this.proceedToWithdrawBtn.waitFor({ state: 'visible' });
    return this.proceedToWithdrawBtn.isDisabled();
  }

  async isProceedToWithdrawButtonEnabled(): Promise<boolean> {
    await this.proceedToWithdrawBtn.waitFor({ state: 'visible' });
    return this.proceedToWithdrawBtn.isEnabled();
  }

  async verifyDepositAndConvertToJewelleryOptionsVisible(): Promise<void> {
    await this.depositOption.waitFor({ state: 'visible' });
    await this.page
      .locator(
        'xpath=//div[contains(@class,"border") and contains(@class,"rounded-xl") and .//div[contains(normalize-space(),"Convert into Gold/Jewellery")]]',
      )
      .first()
      .waitFor({ state: 'visible' });
  }

  /** Withdraw flow: Deposits (withdraw deposit) + Convert into Silver/Jewellery cards visible. */

  async clickProceedForConvertGoldJewellery(): Promise<void> {
    const proceedBtn = this.convertGoldJewelleryProceedButton();
    await proceedBtn.waitFor({ state: 'visible' });
    await proceedBtn.click();
  }

  /** URL after Proceed on "Convert into Gold/Jewellery" (product list). */
  async waitForProductListPage(timeoutMs = 15_000): Promise<void> {
    await this.waitForUrl(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i, timeoutMs);
  }

  /** Short pause for UI settle (retries, checkbox state). */
  async settleMs(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Clicks the teal **Proceed** on the withdraw delivery/billing step. Polls until enabled — the button stays
   * disabled until delivery + billing validation passes.
   */
  async clickDeliveryProceedButton(options?: { timeoutMs?: number }): Promise<void> {
    const timeoutMs = options?.timeoutMs ?? 60_000;
    const proceedButton = this.page
      .locator('app-button[ng-reflect-label="Proceed"] button[data-pc-name="button"]')
      .first();
    await proceedButton.waitFor({ state: 'visible' });
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await proceedButton.isEnabled()) {
        await proceedButton.click();
        return;
      }
      await this.page.waitForTimeout(300);
    }
    throw new Error(
      `Withdraw Proceed remained disabled after ${timeoutMs}ms. Complete delivery and billing required fields.`,
    );
  }

  /** Clicks Proceed only if enabled; returns whether a click was performed (false = stayed disabled, e.g. validation). */
  async clickDeliveryProceedButtonIfEnabled(): Promise<boolean> {
    const proceedButton = this.page
      .locator('app-button[ng-reflect-label="Proceed"] button[data-pc-name="button"]')
      .first();
    await proceedButton.waitFor({ state: 'visible' });
    if (await proceedButton.isEnabled()) {
      await proceedButton.click();
      return true;
    }
    return false;
  }

  async clickSameAsBillingAddressCheckbox(): Promise<void> {
    const sameAsBillingCheckbox = this.page.locator('#sameAsBilling').first();
    const sameAsBillingLabel = this.page.locator('label[for="sameAsBilling"]').first();

    await sameAsBillingCheckbox.waitFor({ state: 'attached' });
    await sameAsBillingLabel.waitFor({ state: 'visible' });

    const alreadyChecked = await sameAsBillingCheckbox.isChecked().catch(() => false);
    if (!alreadyChecked) {
      await sameAsBillingLabel.click();
    }
  }

  async getAndLogDeliveryInformation(): Promise<{
    firstName: string;
    lastName: string;
    address: string;
    pincode: string;
    state: string;
    cityOrDistrict: string;
  }> {
    const deliverySection = this.page
      .locator('div.border.border-stroke.col-span-12.p-4.rounded-2xl')
      .first();
    await deliverySection.waitFor({ state: 'visible' });

    const firstName = (await deliverySection.locator('#firstName').first().inputValue()).trim();
    const lastName = (await deliverySection.locator('#lastName').first().inputValue()).trim();
    const address = (await deliverySection.locator('#address').first().inputValue()).trim();
    const pincode = (await deliverySection.locator('#pinCode').first().inputValue()).trim();

    const state = (
      (await deliverySection
        .locator('div:has(> div[for="stateId"]) span[role="combobox"]')
        .first()
        .textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    const cityOrDistrict = (
      (await deliverySection
        .locator('div:has(> div[for="cityId"]) span[role="combobox"]')
        .first()
        .textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Delivery First Name:', firstName);
    console.log('Delivery Last Name:', lastName);
    console.log('Delivery Address:', address);
    console.log('Delivery Pincode:', pincode);
    console.log('Delivery State:', state);
    console.log('Delivery City/District:', cityOrDistrict);

    return {
      firstName,
      lastName,
      address,
      pincode,
      state,
      cityOrDistrict,
    };
  }

  /** Checkout “To Deliver At” card (`bg-teal-aliceblue` + **Edit**) — avoids unrelated teal blocks. */
  private checkoutPageDeliveryAddressCard(): Locator {
    const byTealAndEdit = this.page
      .locator('div.bg-teal-aliceblue')
      .filter({ has: this.page.getByRole('button', { name: /^Edit$/i }) });
    const afterHeading = this.page
      .getByText(/^To Deliver At$/i)
      .locator('xpath=following-sibling::*[1]');
    return byTealAndEdit.or(afterHeading).first();
  }

  /** After Proceed / tab switch the page often jumps to top — scroll the snapshot card before reading text. */
  async scrollCheckoutDeliveryAddressCardIntoView(): Promise<void> {
    const card = this.checkoutPageDeliveryAddressCard();
    await card.waitFor({ state: 'attached', timeout: 15_000 });
    await card.scrollIntoViewIfNeeded();
    await this.settleMs(400);
  }

  async checkoutPageGetAndLogDeliveryAddressDisplay(options?: { log?: boolean }): Promise<{
    headerLine: string;
    contactName: string;
    phone: string;
    addressBodyRaw: string;
    addressBodyNormalized: string;
  }> {
    const card = this.checkoutPageDeliveryAddressCard();
    await card.scrollIntoViewIfNeeded();
    await card.waitFor({ state: 'visible', timeout: 15_000 });

    const headerRow = card.locator('div.flex.justify-between.items-center').first();
    let headerLine = '';
    if (await headerRow.isVisible().catch(() => false)) {
      headerLine = (
        (await headerRow.locator('div').filter({ hasText: /\|/ }).first().textContent()) ??
        (await headerRow.locator('div').first().textContent()) ??
        ''
      )
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (!headerLine) {
      headerLine = (
        (await card.locator('div.font-gilroysemibold.text-20').first().textContent()) ??
        (await card.getByText(/\|/).first().textContent()) ??
        ''
      )
        .replace(/\s+/g, ' ')
        .trim();
    }

    let contactName = '';
    let phone = '';
    const pipeParts = headerLine.split('|').map((part) => part.trim());
    if (pipeParts.length >= 2) {
      contactName = pipeParts[0];
      phone = pipeParts.slice(1).join('|').trim();
    } else {
      contactName = headerLine;
    }

    const afterHeader = card
      .locator('div.flex.justify-between.items-center')
      .first()
      .locator('xpath=following-sibling::*')
      .first();
    let addressBodyRaw = ((await afterHeader.textContent()) ?? '').trim();
    if (!addressBodyRaw) {
      addressBodyRaw = (
        (await card.locator('div.pt-3.pb-6.text-16.font-gilroymedium').first().textContent()) ?? ''
      ).trim();
    }
    const addressBodyNormalized = addressBodyRaw.replace(/\s+/g, ' ').trim();

    if (options?.log !== false) {
      console.log('[Checkout][Delivery Display] ----------------');
      console.log(`  Header : ${headerLine}`);
      console.log(`  Name   : ${contactName}`);
      console.log(`  Phone  : ${phone}`);
      console.log(`  Address: ${addressBodyNormalized}`);
    }

    return {
      headerLine,
      contactName,
      phone,
      addressBodyRaw,
      addressBodyNormalized,
    };
  }

  /**
   * Compares checkout delivery card text with values read from the delivery form ({@link getAndLogDeliveryInformation}).
   * Optionally checks header mobile digits vs billing/mobile entered on the form (`expectedMobileDigits`).
   */
  async checkoutPageValidateDeliveryAddressAgainstDeliveryInfo(
    expected: {
      firstName: string;
      lastName: string;
      address: string;
      pincode: string;
      state: string;
      cityOrDistrict: string;
    },
    options?: {
      expectedMobileDigits?: string;
      /** Skip re-querying the DOM when {@link checkoutPageGetAndLogDeliveryAddressDisplay} was already called. */
      prefetchedDisplay?: Awaited<ReturnType<WithdrawalPage['checkoutPageGetAndLogDeliveryAddressDisplay']>>;
    },
  ): Promise<void> {
    const display =
      options?.prefetchedDisplay ?? (await this.checkoutPageGetAndLogDeliveryAddressDisplay());
    const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();
    const digitsOnly = (value: string): string => value.replace(/\D/g, '');

    const expectedFullName = `${expected.firstName} ${expected.lastName}`.trim();
    const nameOk = normalize(display.contactName) === normalize(expectedFullName);

    const body = normalize(display.addressBodyNormalized);
    const addressOk = expected.address.length === 0 || body.includes(normalize(expected.address));
    const cityOk = expected.cityOrDistrict.length === 0 || body.includes(normalize(expected.cityOrDistrict));
    const stateOk = expected.state.length === 0 || body.includes(normalize(expected.state));
    const pinOk = expected.pincode.length === 0 || body.includes(expected.pincode.trim());

    let mobileOk = true;
    let mobileLogLine = '';
    if (options?.expectedMobileDigits !== undefined && options.expectedMobileDigits !== '') {
      const exp = digitsOnly(options.expectedMobileDigits);
      const act = digitsOnly(display.phone);
      mobileOk = exp.length === 0 || act.includes(exp) || act === exp;
      mobileLogLine = `  Mobile  : expected digits "${exp}" actual "${display.phone}" (${act}) -> ${mobileOk ? 'PASS' : 'FAIL'}`;
    }

    console.log('[Checkout][Delivery Validation] --------------');
    if (mobileLogLine) {
      console.log(mobileLogLine);
    }
    console.log(`  Name    : expected="${expectedFullName}" actual="${display.contactName}" -> ${nameOk ? 'PASS' : 'FAIL'}`);
    console.log(`  Address : expected contains "${expected.address}" -> ${addressOk ? 'PASS' : 'FAIL'}`);
    console.log(`  City    : expected contains "${expected.cityOrDistrict}" -> ${cityOk ? 'PASS' : 'FAIL'}`);
    console.log(`  State   : expected contains "${expected.state}" -> ${stateOk ? 'PASS' : 'FAIL'}`);
    console.log(`  Pincode : expected contains "${expected.pincode}" -> ${pinOk ? 'PASS' : 'FAIL'}`);

    if (!nameOk) {
      throw new Error(
        `Checkout delivery name mismatch. Expected "${expectedFullName}", actual "${display.contactName}"`,
      );
    }
    if (!addressOk) {
      throw new Error(
        `Checkout delivery address mismatch. Expected body to include "${expected.address}", actual "${display.addressBodyNormalized}"`,
      );
    }
    if (!cityOk) {
      throw new Error(
        `Checkout delivery city/district mismatch. Expected body to include "${expected.cityOrDistrict}"`,
      );
    }
    if (!stateOk) {
      throw new Error(`Checkout delivery state mismatch. Expected body to include "${expected.state}"`);
    }
    if (!pinOk) {
      throw new Error(`Checkout delivery pincode mismatch. Expected body to include "${expected.pincode}"`);
    }
    if (options?.expectedMobileDigits !== undefined && options.expectedMobileDigits !== '' && !mobileOk) {
      throw new Error(
        `Checkout delivery phone mismatch. Expected digits "${digitsOnly(options.expectedMobileDigits)}", header showed "${display.phone}"`,
      );
    }

    console.log('[Checkout][Delivery Validation] PASS');
  }

  async clickProceedLabelInConvertGoldJewelleryCard(): Promise<void> {
    const proceedLabel = this.page
      .locator(
        'xpath=//div[contains(@class,"border") and contains(@class,"rounded-xl") and .//div[contains(normalize-space(),"Convert into Gold/Jewellery")]]',
      )
      .first()
      .locator('span.p-button-label.ng-star-inserted')
      .filter({ hasText: /^Proceed$/i })
      .first();
    await proceedLabel.waitFor({ state: 'visible' });
    await proceedLabel.click();
  }

  async clickRequestDelivery(): Promise<void> {
    const requestDeliveryButton = this.page
      .getByRole('button', { name: /^Request Delivery$/i })
      .first();
    if (await requestDeliveryButton.isVisible().catch(() => false)) {
      await requestDeliveryButton.click();
      return;
    }

    await this.page
      .locator('span.p-button-label', { hasText: /^Request Delivery$/i })
      .first()
      .click();
  }

  /** PrimeNG select-button group: primary attribute or fallback when markup/version differs. */
  private productCategorySelectGroup(): Locator {
    const primary = this.page.locator('div[role="group"][data-pc-name="selectbutton"]').first();
    const fallback = this.page
      .locator('div[role="group"]')
      .filter({
        has: this.page
          .locator('div[role="radio"]')
          .filter({ has: this.page.locator('span.p-button-label', { hasText: /^Coin$/i }) }),
      })
      .first();
    return primary.or(fallback);
  }

  async getAndLogProductCategoryNames(): Promise<string[]> {
    const categoryGroup = this.productCategorySelectGroup();
    await categoryGroup.waitFor({ state: 'visible', timeout: 45_000 });

    const categoryButtons = categoryGroup.locator('div[role="radio"]');
    const count = await categoryButtons.count();
    const categories: string[] = [];

    for (let index = 0; index < count; index += 1) {
      const button = categoryButtons.nth(index);
      const ariaLabel = (await button.getAttribute('aria-label'))?.trim();
      const labelText = (await button.locator('span.p-button-label').first().textContent())?.trim();
      const name = ariaLabel || labelText || `Category-${index + 1}`;
      categories.push(name);
    }

    console.log(`Product Category Count: ${categories.length}`);
    console.log(`Product Categories: ${categories.join(', ')}`);
    return categories;
  }

  async selectCoinCategoryIfNotSelected(): Promise<void> {
    await this.selectProductCategoryIfNotSelected('Coin');
  }

  async selectJewelleryCategoryIfNotSelected(): Promise<void> {
    await this.selectProductCategoryIfNotSelected('Jewellery');
  }

  private async selectProductCategoryIfNotSelected(category: 'Coin' | 'Jewellery'): Promise<void> {
    const categoryGroup = this.productCategorySelectGroup();
    await categoryGroup.scrollIntoViewIfNeeded().catch(() => {});
    // Product list step already waited on this group; keep this wait bounded so
    // selectProductByName retries cannot burn most of the test timeout.
    await categoryGroup.waitFor({ state: 'visible', timeout: 15_000 }).catch(async () => {
      await this.page.keyboard.press('Escape').catch(() => {});
      await categoryGroup.scrollIntoViewIfNeeded().catch(() => {});
      await categoryGroup.waitFor({ state: 'visible', timeout: 15_000 });
    });

    const categoryOption = categoryGroup
      .locator('div[role="radio"]')
      .filter({ hasText: new RegExp(`^${category}$`, 'i') })
      .first();

    await categoryOption.waitFor({ state: 'visible', timeout: 15_000 });
    const isSelected = (await categoryOption.getAttribute('aria-checked')) === 'true';
    if (!isSelected) {
      await categoryOption.click();
      await this.page.waitForTimeout(400);
    }
  }

  async getAndLogProductCountAndNames(): Promise<{ count: number; names: string[] }> {
    const productCards = this.page.locator('div.border-2.border-stroke.rounded-2xl.cursor-pointer');
    await productCards.first().waitFor({ state: 'visible' });

    const count = await productCards.count();
    const names: string[] = [];

    for (let index = 0; index < count; index += 1) {
      const card = productCards.nth(index);
      const heading = card.locator('h2').first();
      await heading.waitFor({ state: 'visible', timeout: 2500 }).catch(() => undefined);
      const name = ((await heading.textContent().catch(() => null)) ?? '').trim();
      if (name) {
        names.push(name);
      }
    }

    console.log(`Product Count: ${count}`);
    console.log(`Product Names: ${names.join(' | ')}`);

    return { count, names };
  }

  async selectProductByName(productName: string, retryCategory: 'Coin' | 'Jewellery' = 'Coin'): Promise<void> {
    const normalizedProductName = productName.trim();
    const escapedName = normalizedProductName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(escapedName, 'i');
    const productCards = this.page.locator('app-product');
    const directTarget = productCards
      .filter({
        has: this.page.locator('h2', { hasText: nameRegex }),
      })
      .first();
    const reflectedTitleTarget = productCards
      .locator(`xpath=.//app-product[contains(translate(@ng-reflect-title,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), "${normalizedProductName.toLowerCase()}")]`)
      .first();

    await productCards.first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const target =
        (await directTarget.isVisible({ timeout: 2_000 }).catch(() => false)) ? directTarget : reflectedTitleTarget;
      await target.scrollIntoViewIfNeeded().catch(() => {});
      const clickableCard = target.locator('div.border-2.border-stroke.rounded-2xl.cursor-pointer').first();
      if (await clickableCard.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await clickableCard.click({ force: true });
        await this.page
          .locator('h1.text-32')
          .or(this.page.locator('text=/Product Weight|Making\\s*&\\s*Delivery Charges/i'))
          .first()
          .waitFor({ state: 'visible', timeout: 20_000 });
        return;
      }
      if (attempt < 3) {
        await this.selectProductCategoryIfNotSelected(retryCategory);
        await this.page.waitForTimeout(600);
      }
    }

    const available = await this.getAndLogProductCountAndNames();
    throw new Error(
      `Product "${normalizedProductName}" not found after direct retries. Available products: ${available.names.join(', ')}`,
    );
  }

  async getAndLogSelectedProductDetails(): Promise<{
    productName: string;
    purity: string;
    productWeight: string;
    makingAndDeliveryCharges: string;
    makingAndDeliveryChargesAmount: number;
    expectedDeliveryDate: string;
    quantity: number;
  }> {
    const detailsContainer = this.page.locator('div').filter({ has: this.page.locator('h1.text-32') }).first();
    await detailsContainer.waitFor({ state: 'visible' });

    const heading = detailsContainer.locator('h1.text-32').first();
    const headingText = ((await heading.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const productName = headingText.split('(')[0].trim();
    const purity = ((await heading.locator('span').first().textContent()) ?? '').replace(/\s+/g, ' ').trim();

    const productWeightText = (
      (await detailsContainer.locator('div.flex.pt-5.items-center.gap-5').first().textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    const makingAndDeliveryCharges = (
      (await detailsContainer.locator('p').filter({ hasText: /Making\s*&\s*Delivery Charges/i }).first().textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    const makingAndDeliveryChargesAmountText = (
      (await detailsContainer.locator('div.text-20.font-gilroybold').first().textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    const makingAndDeliveryChargesAmount = Number(
      (makingAndDeliveryChargesAmountText.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''),
    );

    const expectedDeliveryDate = (
      (await detailsContainer
        .locator('div.rounded-2xl')
        .filter({ hasText: /Expected date of delivery/i })
        .locator('div.text-20')
        .first()
        .textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    const quantityRaw = await detailsContainer
      .locator('input[role="spinbutton"][min="1"][max="99"]')
      .first()
      .inputValue();
    const quantity = Number(quantityRaw);

    console.log('Selected Product Name:', productName);
    console.log('Selected Product Purity:', purity);
    console.log('Selected Product Weight:', productWeightText);
    console.log('Making & Delivery Charges Label:', makingAndDeliveryCharges);
    console.log('Making & Delivery Charges Amount:', makingAndDeliveryChargesAmount);
    console.log('Expected Delivery Date:', expectedDeliveryDate);
    console.log('Selected Quantity:', quantity);

    return {
      productName,
      purity,
      productWeight: productWeightText,
      makingAndDeliveryCharges,
      makingAndDeliveryChargesAmount,
      expectedDeliveryDate,
      quantity,
    };
  }

  async getAndLogCartItemDetails(): Promise<{
    productName: string;
    productWeight: string;
    quantity: number;
  }> {
    const cartContainer = this.page
      .locator('div,section,article')
      .filter({ hasText: /Total Weight|Total Quantity|Total Amount Payable/i })
      .first();
    await cartContainer.waitFor({ state: 'visible' });

    const productName = (
      (await cartContainer
        .locator('h1, h2, h3, .text-24, .text-20')
        .filter({ hasText: /.+/ })
        .first()
        .textContent()) ?? ''
    ).replace(/\s+/g, ' ').trim();

    const productWeight = (
      (await cartContainer
        .locator('text=/Product Weight|Weight/i')
        .first()
        .textContent()) ?? ''
    ).replace(/\s+/g, ' ').trim();

    const quantityText = (
      (await cartContainer
        .locator('text=/Total Quantity|Quantity/i')
        .first()
        .textContent()) ?? ''
    ).replace(/\s+/g, ' ').trim();
    const quantityMatch = quantityText.match(/\d+/);
    const quantity = quantityMatch ? Number(quantityMatch[0]) : 0;

    console.log('Cart Product Name:', productName);
    console.log('Cart Product Weight:', productWeight);
    console.log('Cart Quantity:', quantity);

    return {
      productName,
      productWeight,
      quantity,
    };
  }

  async validateCartItemWithSelectedProduct(selected: {
    productName: string;
    productWeight: string;
    quantity: number;
  }): Promise<void> {
    const cart = await this.getAndLogCartItemDetails();
    const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();

    if (selected.productName && !normalize(cart.productName).includes(normalize(selected.productName))) {
      throw new Error(
        `Cart product name mismatch. Expected contains "${selected.productName}", actual "${cart.productName}"`,
      );
    }

    const selectedWeightValue = Number(selected.productWeight.match(/[\d.]+/)?.[0] ?? '0');
    const cartWeightValue = Number(cart.productWeight.match(/[\d.]+/)?.[0] ?? '0');
    if (
      selectedWeightValue > 0 &&
      cartWeightValue > 0 &&
      Math.abs(cartWeightValue - selectedWeightValue) > 0.001
    ) {
      throw new Error(
        `Cart product weight mismatch. Expected "${selected.productWeight}", actual "${cart.productWeight}"`,
      );
    }

    if (selected.quantity > 0 && cart.quantity > 0 && cart.quantity !== selected.quantity) {
      throw new Error(`Cart quantity mismatch. Expected "${selected.quantity}", actual "${cart.quantity}"`);
    }
  }

  async getCountOfProductInCart(): Promise<number> {
    const cartCards = this.page.locator('div.border.border-sheengold.rounded-2xl.p-4.mb-4');
    await cartCards.first().waitFor({ state: 'visible' });
    const count = await cartCards.count();
    console.log('Cart product count:', count);
    return count;
  }

  async removeExtraProductsFromCart(keepProductName: string): Promise<void> {
    const normalizedKeepName = keepProductName.replace(/\s+/g, ' ').trim().toLowerCase();
    const cartCards = this.page.locator('div.border.border-sheengold.rounded-2xl.p-4.mb-4');
    await cartCards.first().waitFor({ state: 'visible' });

    let safety = 0;
    while ((await cartCards.count()) > 1) {
      const cardCount = await cartCards.count();
      let removed = false;

      for (let i = 0; i < cardCount; i += 1) {
        const card = cartCards.nth(i);
        const cardText = ((await card.textContent()) ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
        const shouldKeep = cardText.includes(normalizedKeepName);
        if (shouldKeep) {
          continue;
        }

        const removeBtn = card.getByRole('button', { name: /Remove Item/i }).first();
        await removeBtn.waitFor({ state: 'visible' });
        await removeBtn.click();

        const expectedCount = cardCount - 1;
        await this.page.waitForFunction(
          ({ selector, expected }) => {
            const scopedGlobal = globalThis as {
              document?: { querySelectorAll?: (s: string) => { length: number } };
            };
            return (scopedGlobal.document?.querySelectorAll?.(selector)?.length ?? 0) <= expected;
          },
          { selector: 'div.border.border-sheengold.rounded-2xl.p-4.mb-4', expected: expectedCount },
          { timeout: 10_000 },
        );
        removed = true;
        break;
      }

      if (!removed) {
        break;
      }

      safety += 1;
      if (safety > 10) {
        throw new Error('Safety stop while removing extra cart products.');
      }
    }
  }

  private cartProductCardByName(productName: string): Locator {
    const normalizedName = productName.replace(/\s+/g, ' ').trim();
    return this.page
      .locator('div.border.border-sheengold.rounded-2xl.p-4.mb-4')
      .filter({ has: this.page.locator('div.text-20.text-darkgunmetal.font-cabinetgroteskextrabold', { hasText: normalizedName }) })
      .first();
  }

  async getSelectedProductQuantityInCart(productName: string): Promise<number> {
    const card = this.cartProductCardByName(productName);
    await card.waitFor({ state: 'visible' });
    const quantityInput = card.locator('input[role="spinbutton"][min="1"][max="99"]').first();
    await quantityInput.waitFor({ state: 'visible' });

    const ariaValueNow = await quantityInput.getAttribute('aria-valuenow');
    const inputValue = await quantityInput.inputValue().catch(() => '');
    const parsed = Number((ariaValueNow ?? inputValue ?? '').trim());
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new Error(`Unable to parse selected product quantity in cart for "${productName}".`);
    }
    console.log('Selected product quantity in cart:', parsed);
    return parsed;
  }

  async reduceSelectedProductQuantityInCart(productName: string, targetQuantity = 1): Promise<void> {
    if (targetQuantity < 1) {
      throw new Error(`Target quantity must be at least 1. Received: ${targetQuantity}`);
    }

    const card = this.cartProductCardByName(productName);
    await card.waitFor({ state: 'visible' });
    const decrementButton = card.locator('button[data-pc-section="decrementbutton"]').first();
    await decrementButton.waitFor({ state: 'visible' });

    let currentQuantity = await this.getSelectedProductQuantityInCart(productName);
    let safety = 0;
    while (currentQuantity > targetQuantity) {
      await decrementButton.click();
      await this.page.waitForTimeout(150);
      const updatedQuantity = await this.getSelectedProductQuantityInCart(productName);
      if (updatedQuantity >= currentQuantity) {
        throw new Error(`Selected product quantity did not decrease for "${productName}".`);
      }
      currentQuantity = updatedQuantity;
      safety += 1;
      if (safety > 20) {
        throw new Error('Safety stop while reducing selected product quantity in cart.');
      }
    }

    if (targetQuantity === 1 && currentQuantity === 1) {
      // Let cart totals/UI settle after final decrement to quantity 1.
      await this.page.waitForTimeout(500);
    }
  }

  async validateSelectedProductCardInCart(productName: string, expectedQuantity: number): Promise<void> {
    const card = this.cartProductCardByName(productName);
    await card.waitFor({ state: 'visible' });

    const cardText = ((await card.textContent()) ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    const normalizedName = productName.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!cardText.includes(normalizedName)) {
      throw new Error(`Selected product card not found in cart. Expected contains "${productName}".`);
    }

    const actualQuantity = await this.getSelectedProductQuantityInCart(productName);
    if (actualQuantity !== expectedQuantity) {
      throw new Error(
        `Selected product quantity mismatch in cart. Expected "${expectedQuantity}", actual "${actualQuantity}"`,
      );
    }
  }

  async getCartTotalAmountPayable(): Promise<number> {
    const cartContainer = this.page
      .locator('div,section,article')
      .filter({ hasText: /Total Weight|Total Quantity|Total Amount Payable/i })
      .first();
    await cartContainer.waitFor({ state: 'visible' });

    const amountTextCandidates = await cartContainer
      .locator('div, span, p')
      .filter({ hasText: /₹|INR|[\d,]+(?:\.\d+)?/i })
      .allTextContents();

    const combined = amountTextCandidates.join(' ');
    const numeric = combined.match(/[\d,]+(?:\.\d+)?/g);
    if (!numeric || numeric.length === 0) {
      throw new Error(`Unable to read Total Amount Payable from cart. Texts: ${combined}`);
    }

    const lastAmount = numeric[numeric.length - 1];
    return Number(lastAmount.replace(/,/g, ''));
  }

  async clickSelectInvestments(): Promise<void> {
    const selectInvestmentsButton = this.page
      .getByRole('button', { name: /^Select Investments$/i })
      .first();
    if (await selectInvestmentsButton.isVisible().catch(() => false)) {
      await selectInvestmentsButton.click();
      return;
    }

    await this.page
      .locator('span.p-button-label', { hasText: /^Select Investments$/i })
      .first()
      .click();
  }

  async reduceCartQuantityTo(targetQuantity: number): Promise<void> {
    if (targetQuantity < 1) {
      throw new Error(`Target quantity must be at least 1. Received: ${targetQuantity}`);
    }

    const cartContainer = this.page
      .locator('div,section,article')
      .filter({ hasText: /Total Weight|Total Quantity|Total Amount Payable/i })
      .first();
    await cartContainer.waitFor({ state: 'visible' });

    const quantityInput = cartContainer.locator('input[role="spinbutton"][min="1"][max="99"]').first();
    const decrementButton = cartContainer
      .locator('button[data-pc-section="decrementbutton"]')
      .filter({ has: this.page.locator('span.pi.pi-minus') })
      .first();
    const totalQuantityText = cartContainer.locator('text=/Total Quantity|Quantity/i').first();

    await quantityInput.waitFor({ state: 'visible' });
    await decrementButton.waitFor({ state: 'visible' });
    await totalQuantityText.waitFor({ state: 'visible' });

    const getDisplayedCartQuantity = async (): Promise<number> => {
      const quantityText = ((await totalQuantityText.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      const quantityMatch = quantityText.match(/\d+/);
      return quantityMatch ? Number(quantityMatch[0]) : 0;
    };

    let currentQuantity = await getDisplayedCartQuantity();
    if (Number.isNaN(currentQuantity)) {
      throw new Error('Unable to parse current cart quantity from input.');
    }

    let clicks = 0;
    while (currentQuantity > targetQuantity) {
      await decrementButton.click();
      let attempts = 0;
      let updatedQuantity = await getDisplayedCartQuantity();
      while (updatedQuantity >= currentQuantity && attempts < 10) {
        await this.page.waitForTimeout(100);
        updatedQuantity = await getDisplayedCartQuantity();
        attempts += 1;
      }
      if (updatedQuantity >= currentQuantity) {
        throw new Error('Cart quantity did not decrease after clicking decrement button.');
      }
      currentQuantity = updatedQuantity;
      clicks += 1;
      if (clicks > 99) {
        throw new Error('Safety stop triggered while reducing cart quantity.');
      }
    }
  }

  async getInvestmentListTotalGoldRequired(): Promise<number> {
    const card = this.page
      .locator('div.bg-sheengold-cosmiclatte.p-5.rounded-xl')
      .filter({ hasText: /Total Gold Required/i })
      .first();
    await card.waitFor({ state: 'visible' });

    const valueText = ((await card.locator('div.text-24').first().textContent()) ?? '').trim();
    const numeric = valueText.match(/[\d.]+/)?.[0] ?? '0';
    const totalGoldRequired = Number(numeric);

    console.log('Total Gold Required:', totalGoldRequired);
    return totalGoldRequired;
  }

  async getInvestmentListTotalSilverRequired(): Promise<number> {
    const card = this.page
      .locator('div.bg-sheengold-cosmiclatte.p-5.rounded-xl')
      .filter({ hasText: /Total Silver Required/i })
      .first();
    await card.waitFor({ state: 'visible' });

    const valueText = ((await card.locator('div.text-24').first().textContent()) ?? '').trim();
    const numeric = valueText.match(/[\d.]+/)?.[0] ?? '0';
    const totalSilverRequired = Number(numeric);

    console.log('Total Silver Required:', totalSilverRequired);
    return totalSilverRequired;
  }

  async getInvestmentListTotalGoldAvailable(): Promise<number> {
    const card = this.page
      .locator('div.bg-sheengold-cosmiclatte.p-5.rounded-xl')
      .filter({ hasText: /Total Gold Available/i })
      .first();
    await card.waitFor({ state: 'visible' });

    const valueText = ((await card.locator('div.text-24').first().textContent()) ?? '').trim();
    const numeric = valueText.match(/[\d.]+/)?.[0] ?? '0';
    const totalGoldAvailable = Number(numeric);

    console.log('Total Gold Available:', totalGoldAvailable);
    return totalGoldAvailable;
  }

  async getInvestmentListTotalSilverAvailable(): Promise<number> {
    const card = this.page
      .locator('div.bg-sheengold-cosmiclatte.p-5.rounded-xl')
      .filter({ hasText: /Total Silver Available/i })
      .first();
    await card.waitFor({ state: 'visible' });

    const valueText = ((await card.locator('div.text-24').first().textContent()) ?? '').trim();
    const numeric = valueText.match(/[\d.]+/)?.[0] ?? '0';
    const totalSilverAvailable = Number(numeric);

    console.log('Total Silver Available:', totalSilverAvailable);
    return totalSilverAvailable;
  }

  async getGoldVaultCardTotals(): Promise<{
    totalGold: number;
    remainingGold: number;
  }> {
    const goldVaultCard = this.page
      .locator('div.border.border-stroke.rounded-xl')
      .filter({ hasText: /Gold Vault/i })
      .first();
    await goldVaultCard.waitFor({ state: 'visible' });

    const totalGoldLine = (
      (await goldVaultCard.getByText(/Total Gold/i).first().textContent()) ?? ''
    ).trim();

    const remainingLine = (
      (await goldVaultCard.getByText(/Remaining/i).first().textContent()) ?? ''
    ).trim();

    const parseGrams = (value: string): number => {
      const numeric = value.match(/[\d.]+/)?.[0] ?? '0';
      return Number(numeric);
    };

    const totalGold = parseGrams(totalGoldLine);
    const remainingGold = parseGrams(remainingLine);

    console.log('Gold Vault Total Gold:', totalGold);
    console.log('Gold Vault Remaining:', remainingGold);

    return {
      totalGold,
      remainingGold,
    };
  }

  async getSilverVaultCardTotals(): Promise<{
    totalSilver: number;
    remainingSilver: number;
  }> {
    const silverVaultCard = this.page
      .locator('div.border.border-stroke.rounded-xl')
      .filter({ hasText: /Silver Vault/i })
      .first();
    await silverVaultCard.waitFor({ state: 'visible' });

    const totalSilverLine = (
      (await silverVaultCard.getByText(/Total Silver/i).first().textContent()) ?? ''
    ).trim();

    const remainingLine = (
      (await silverVaultCard.getByText(/Remaining/i).first().textContent()) ?? ''
    ).trim();

    const parseGrams = (value: string): number => {
      const numeric = value.match(/[\d.]+/)?.[0] ?? '0';
      return Number(numeric);
    };

    const totalSilver = parseGrams(totalSilverLine);
    const remainingSilver = parseGrams(remainingLine);

    console.log('Silver Vault Total Silver:', totalSilver);
    console.log('Silver Vault Remaining:', remainingSilver);

    return {
      totalSilver,
      remainingSilver,
    };
  }

  /** "Selected product" card on checkout (title, Making Charges, Quantity). */
  private checkoutPageSelectedProductCard(): Locator {
    return this.page
      .locator('div.border.border-stroke.rounded-2xl')
      .filter({ hasText: /Making Charges/i })
      .filter({ has: this.page.locator('div.text-20.font-gilroybold') })
      .first();
  }

  async checkoutPageGetAndLogSelectedProductDetails(options?: { log?: boolean }): Promise<{
    productName: string;
    makingChargesAmount: number;
    quantity: number;
  }> {
    const card = this.checkoutPageSelectedProductCard();
    await card.waitFor({ state: 'visible' });

    const productName = (
      (await card.locator('div.text-20.font-gilroybold').first().textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    const makingLine = (
      (await card.locator('div.font-gilroymedium').filter({ hasText: /Making Charges/i }).first().textContent()) ??
      ''
    ).trim();
    const makingChargesAmount = Number(
      (makingLine.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''),
    );

    const qtyLine = (
      (await card.locator('div.font-gilroymedium').filter({ hasText: /Quantity/i }).first().textContent()) ?? ''
    ).trim();
    const quantityMatch = qtyLine.match(/\d+/);
    const quantity = quantityMatch ? Number(quantityMatch[0]) : 0;

    if (options?.log !== false) {
      console.log('[Checkout][Product] --------------------------');
      console.log(`  Name          : ${productName}`);
      console.log(`  Making Charges: ${makingChargesAmount}`);
      console.log(`  Quantity      : ${quantity}`);
    }

    return {
      productName,
      makingChargesAmount,
      quantity,
    };
  }

  /**
   * Validates checkout selected-product row against values captured on the product screen (same expectations as cart).
   */
  async checkoutPageValidateSelectedProductAgainstProductDetails(expected: {
    productName: string;
    makingAndDeliveryChargesAmount: number;
    quantity: number;
  }): Promise<void> {
    const checkout = await this.checkoutPageGetAndLogSelectedProductDetails();
    const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();

    const nameOk =
      !expected.productName ||
      normalize(checkout.productName).includes(normalize(expected.productName));
    const tol = 0.01;
    const chargesOk =
      Math.abs(checkout.makingChargesAmount - expected.makingAndDeliveryChargesAmount) <= tol;
    const quantityOk = expected.quantity <= 0 || checkout.quantity === expected.quantity;

    console.log('[Checkout][Product Validation] ----------------');
    console.log(
      `  Name    : expected contains "${expected.productName}" | actual "${checkout.productName}" -> ${nameOk ? 'PASS' : 'FAIL'}`,
    );
    console.log(
      `  Charges : expected ${expected.makingAndDeliveryChargesAmount} | actual ${checkout.makingChargesAmount} -> ${chargesOk ? 'PASS' : 'FAIL'}`,
    );
    console.log(
      `  Quantity: expected ${expected.quantity} | actual ${checkout.quantity} -> ${quantityOk ? 'PASS' : 'FAIL'}`,
    );

    if (!nameOk) {
      throw new Error(
        `Checkout product name mismatch. Expected title to contain "${expected.productName}", actual "${checkout.productName}"`,
      );
    }

    if (!chargesOk) {
      throw new Error(
        `Checkout Making Charges mismatch. Expected ${expected.makingAndDeliveryChargesAmount}, actual ${checkout.makingChargesAmount}`,
      );
    }

    if (!quantityOk) {
      throw new Error(`Checkout quantity mismatch. Expected ${expected.quantity}, actual ${checkout.quantity}`);
    }

    console.log('[Checkout][Product Validation] PASS');
  }

  /** Checkout summary block (Total Amount / Paid From Funds / Net Payable Amount). */
  private checkoutPagePaymentSummaryCard(): Locator {
    const styled = this.page
      .locator('div.p-4.border-2.border-stroke.rounded-2xl')
      .filter({ hasText: /Net Payable Amount/i });
    const tabSummary = this.page
      .locator('[role="tabpanel"]')
      .filter({ hasText: /Net Payable Amount/i })
      .filter({ hasText: /Paid From Funds/i });
    return styled.or(tabSummary).first();
  }

  private parseRupeeAmount(text: string): number {
    const match = text.match(/[\d,]+(?:\.\d+)?/);
    if (!match) {
      return Number.NaN;
    }
    return Number(match[0].replace(/,/g, ''));
  }

  async checkoutPageGetPaymentSummary(): Promise<{
    totalAmount: number;
    paidFromFunds: number;
    netPayableAmount: number;
  }> {
    const card = this.checkoutPagePaymentSummaryCard();
    await card.waitFor({ state: 'visible' });

    const readLabelAmount = async (label: string): Promise<number> => {
      const labelEl = card.getByText(label, { exact: true }).first();
      await labelEl.waitFor({ state: 'visible' });
      const valueEl = labelEl.locator('xpath=following-sibling::*[1]');
      const valueText = ((await valueEl.textContent()) ?? '').trim();
      const amount = this.parseRupeeAmount(valueText);
      if (Number.isNaN(amount)) {
        throw new Error(`Could not parse checkout amount for "${label}" from text: "${valueText}"`);
      }
      return amount;
    };

    const totalAmount = await readLabelAmount('Total Amount');
    const paidFromFunds = await readLabelAmount('Paid From Funds');
    const netPayableAmount = await readLabelAmount('Net Payable Amount');

    console.log('[Checkout][Payment Summary] ------------------');
    console.log(`  Total Amount   : ${totalAmount}`);
    console.log(`  Paid From Funds: ${paidFromFunds}`);
    console.log(`  Net Payable    : ${netPayableAmount}`);

    return {
      totalAmount,
      paidFromFunds,
      netPayableAmount,
    };
  }

  /**
   * Validates checkout summary against Making & Delivery Charges from the product details screen.
   * Expects Total Amount to match that value, Net Payable = Total Amount − Paid From Funds.
   */
  async checkoutPageValidatePaymentSummaryAgainstMakingCharges(
    expectedMakingChargesAmount: number,
    precision = 2,
  ): Promise<void> {
    const summary = await this.checkoutPageGetPaymentSummary();
    const tolerance = 10 ** -precision;
    const expectedNetFromRows = summary.totalAmount - summary.paidFromFunds;
    const totalMatchesMakingCharges =
      Math.abs(summary.totalAmount - expectedMakingChargesAmount) <= tolerance;
    const netMatchesComputed = Math.abs(summary.netPayableAmount - expectedNetFromRows) <= tolerance;

    console.log('[Checkout][Payment Validation] ---------------');
    console.log(
      `  Total vs Charges: expected ${expectedMakingChargesAmount} | actual ${summary.totalAmount} -> ${totalMatchesMakingCharges ? 'PASS' : 'FAIL'}`,
    );
    console.log(
      `  Net Payable     : expected ${expectedNetFromRows} | actual ${summary.netPayableAmount} -> ${netMatchesComputed ? 'PASS' : 'FAIL'}`,
    );

    if (Math.abs(summary.totalAmount - expectedMakingChargesAmount) > tolerance) {
      throw new Error(
        `Checkout Total Amount does not match Making & Delivery Charges. Expected: ${expectedMakingChargesAmount}, Actual: ${summary.totalAmount}`,
      );
    }

    const expectedNet = summary.totalAmount - summary.paidFromFunds;
    if (Math.abs(summary.netPayableAmount - expectedNet) > tolerance) {
      throw new Error(
        `Checkout Net Payable Amount mismatch. Expected (Total − Paid From Funds): ${expectedNet}, Actual: ${summary.netPayableAmount}`,
      );
    }
  }

  private checkoutPagePaymentTypeGrid(): Locator {
    return this.page
      .locator('div.gap-4.grid.grid-cols-2.items-center')
      .filter({ has: this.page.locator('input[name="paymentType"]') })
      .first();
  }

  /** Selects the **Netbanking** payment option (`input#Netbanking`, `name="paymentType"`). */
  async checkoutPageSelectPaymentTypeNetbanking(): Promise<void> {
    const grid = this.checkoutPagePaymentTypeGrid();
    await grid.waitFor({ state: 'visible' });
    const label = grid.locator('label[for="Netbanking"]');
    const fallback = this.page.locator('input#Netbanking[name="paymentType"]');
    if (await label.isVisible().catch(() => false)) {
      await label.click();
    } else {
      await fallback.first().click({ force: true });
    }
    console.log('[Checkout payment type] Selected: Netbanking');
  }

  async checkoutPageGetAndLogPaymentTypes(): Promise<string[]> {
    const grid = this.checkoutPagePaymentTypeGrid();
    await grid.waitFor({ state: 'visible' });

    const labelLocators = grid.locator('label[for]');
    const count = await labelLocators.count();
    const types: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const text = ((await labelLocators.nth(i).textContent()) ?? '').replace(/\s+/g, ' ').trim();
      if (text) {
        types.push(text);
      }
    }

    const selected = grid.locator('input[name="paymentType"]:checked').first();
    let selectedLabel: string | null = null;
    if ((await selected.count()) > 0) {
      const id = await selected.getAttribute('id');
      if (id) {
        selectedLabel = ((await grid.locator(`label[for="${id}"]`).textContent()) ?? '').replace(/\s+/g, ' ').trim();
      }
    }

    console.log('[Checkout payment types] Count:', types.length);
    types.forEach((t, idx) => console.log(`[Checkout payment types] ${idx + 1}. ${t}`));
    console.log('[Checkout payment types] All values:', JSON.stringify(types, null, 2));
    console.log('[Checkout payment types] Selected:', selectedLabel ?? '(none)');

    return types;
  }

  /**
   * Clicks the checkout **Proceed to Pay** action (PrimeNG `p-button`, `ng-reflect-label="Proceed to Pay"`).
   * Often disabled until payment type is chosen; polls until enabled then clicks.
   */
  async checkoutPageClickProceedToPay(options?: { timeoutMs?: number }): Promise<void> {
    const timeoutMs = options?.timeoutMs ?? 60_000;
    const button = this.page
      .getByRole('button', { name: /^Proceed to Pay$/i })
      .or(this.page.locator('p-button[ng-reflect-label="Proceed to Pay"] button[data-pc-section="root"]'))
      .first();

    await button.waitFor({ state: 'visible', timeout: timeoutMs });

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await button.isEnabled()) {
        await button.click();
        return;
      }
      await this.page.waitForTimeout(300);
    }

    throw new Error(
      `Proceed to Pay remained disabled after ${timeoutMs}ms. Choose a payment method or complete required checkout fields.`,
    );
  }

  /**
   * Delivery address card (same scope as {@link getAndLogDeliveryInformation}).
   * Scoped to the bordered card that contains delivery `#firstName` (avoids an unrelated `.first()` match).
   */
  getDeliveryAddressFormSection(): Locator {
    return this.page
      .locator('div.border.border-stroke.col-span-12.p-4.rounded-2xl')
      .filter({ has: this.page.locator('#firstName') })
      .first();
  }

  async waitForDeliveryAddressFormSectionVisible(options?: { timeoutMs?: number }): Promise<void> {
    await this.getDeliveryAddressFormSection().waitFor({
      state: 'visible',
      timeout: options?.timeoutMs ?? 15_000,
    });
  }

  /** After Proceed from dashboard withdraw entry, URL must change. */
  async expectUrlNotToEqual(previousUrl: string): Promise<void> {
    await expect(this.page).not.toHaveURL(previousUrl);
  }

  /** After Proceed from withdraw delivery step toward checkout. */
  async expectCheckoutDeliveryOrAddressUrl(options?: { timeoutMs?: number }): Promise<void> {
    await expect(this.page).toHaveURL(/checkout|address|delivery/i, {
      timeout: options?.timeoutMs ?? 30_000,
    });
  }

  /** Checkout Summary: heading above the delivery snapshot card (must exist before scroll). */
  async expectCheckoutToDeliverAtHeadingVisible(options?: { timeoutMs?: number }): Promise<void> {
    const heading = this.page.getByText(/^To Deliver At$/i).first();
    await expect(heading).toBeVisible({
      timeout: options?.timeoutMs ?? 15_000,
    });
    await heading.scrollIntoViewIfNeeded();
  }

  /**
   * Checkout **Summary** shows “To Deliver At” read-only; **Edit** opens the delivery + billing form (`#firstName`, `#name`, …).
   */
  async checkoutPageClickEditDeliveryAddress(): Promise<void> {
    await this.page.waitForURL(/\/checkout/i, { timeout: 30_000 });
    const panel = this.page.getByRole('tabpanel').first();
    await panel.waitFor({ state: 'visible', timeout: 15_000 });
    const edit = panel.getByRole('button', { name: /^Edit$/i }).first();
    await edit.waitFor({ state: 'visible', timeout: 15_000 });
    await edit.click();
    await this.settleMs(500);
  }

  /** “To Deliver At” lives on the **Summary** tab; switch back after editing **Delivery Information**. */
  async checkoutPageClickSummaryTab(): Promise<void> {
    await this.page.waitForURL(/\/checkout/i, { timeout: 30_000 });
    const tablist = this.page.getByRole('tablist').first();
    await tablist.waitFor({ state: 'visible', timeout: 15_000 });

    const byAriaTab = tablist.getByRole('tab', { name: /^Summary$/i }).first();
    if ((await byAriaTab.count()) > 0 && (await byAriaTab.isVisible().catch(() => false))) {
      await byAriaTab.click();
    } else {
      // PrimeNG: tab header is often a clickable wrapper + label (not `role="tab"`).
      await tablist.getByText('Summary', { exact: true }).first().click();
    }
    await this.settleMs(800);
  }

  /**
   * Checkout **billing** card (Full Name / Mobile / …) — `#name` + `#mobileNumber`, not delivery `#firstName`.
   */
  getCheckoutBillingAddressSection(): Locator {
    return this.page
      .locator('div.border.border-stroke.col-span-12.p-4.rounded-2xl')
      .filter({ has: this.page.locator('#name') })
      .filter({ has: this.page.locator('#mobileNumber') })
      .first();
  }

  /** Scroll billing card into view (Delivery Information tab **and** checkout — layout often jumps). */
  async scrollCheckoutBillingSectionIntoView(): Promise<void> {
    const section = this.getCheckoutBillingAddressSection();
    await section.waitFor({ state: 'visible', timeout: 15_000 });
    await section.scrollIntoViewIfNeeded();
  }

  /**
   * Fills checkout billing fields (`#name`, `#mobileNumber`, `#address`, `#pinCode`, State, City).
   */
  async fillCheckoutBillingAddress(opts: {
    fullName: string;
    mobile: string;
    address: string;
    pincode: string;
    stateOptionLabel: string;
    cityOptionLabel: string;
  }): Promise<void> {
    const section = this.getCheckoutBillingAddressSection();
    await section.scrollIntoViewIfNeeded();
    await section.locator('#name').fill(opts.fullName);
    await section.locator('#mobileNumber').fill(opts.mobile);
    await section.locator('#address').fill(opts.address);
    await section.locator('#pinCode').fill(opts.pincode);

    const stateCombo = section.locator('div:has(> div[for="stateId"]) span[role="combobox"]').first();
    await stateCombo.click();
    await this.settleMs(200);
    await this.page
      .getByRole('option')
      .filter({ hasText: new RegExp(opts.stateOptionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first()
      .click();
    await this.settleMs(500);

    const cityCombo = section.locator('div:has(> div[for="cityId"]) span[role="combobox"]').first();
    await cityCombo.click();
    await this.settleMs(200);
    await this.page
      .getByRole('option')
      .filter({ hasText: new RegExp(opts.cityOptionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first()
      .click();
    await this.settleMs(200);
  }

  /** Inline validation near a checkout billing input (`#name`, `#mobileNumber`, `#address`, `#pinCode`). */
  async getCheckoutBillingFieldInlineError(fieldId: string): Promise<string> {
    const input = this.getCheckoutBillingAddressSection().locator(`#${fieldId}`).first();
    const wrap = input.locator('xpath=ancestor::app-field[1]');
    const err = wrap.locator('small.p-error, small[class*="p-error"], small.text-failed, small[class*="text-failed"]');
    const n = await err.count();
    for (let i = 0; i < n; i++) {
      const el = err.nth(i);
      if (await el.isVisible().catch(() => false)) {
        const t = ((await el.textContent()) ?? '').replace(/\s+/g, ' ').trim();
        if (t) {
          return t;
        }
      }
    }
    return '';
  }

  /** Non-empty validation texts inside the checkout billing card. */
  async getAllVisibleCheckoutBillingFormErrorTexts(): Promise<string[]> {
    const section = this.getCheckoutBillingAddressSection();
    const nodes = section.locator('small.p-error, small.text-failed, small[class*="text-failed"]');
    const n = await nodes.count();
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const el = nodes.nth(i);
      if (!(await el.isVisible().catch(() => false))) {
        continue;
      }
      const t = (await el.textContent())?.trim();
      if (t) {
        out.push(t);
      }
    }
    return out;
  }

  /** Inline validation under billing State / City PrimeNG dropdowns (`for="stateId"` / `for="cityId"`). */
  async getCheckoutBillingDropdownInlineError(forAttr: 'stateId' | 'cityId'): Promise<string> {
    const section = this.getCheckoutBillingAddressSection();
    const block = section.locator(`div:has(> div[for="${forAttr}"])`).first();
    const errNodes = block.locator(
      'small.p-error, small[class*="p-error"], small.text-failed, small[class*="text-failed"]',
    );
    const n = await errNodes.count();
    for (let i = 0; i < n; i++) {
      const el = errNodes.nth(i);
      if (await el.isVisible().catch(() => false)) {
        const t = ((await el.textContent()) ?? '').replace(/\s+/g, ' ').trim();
        if (t) {
          return t;
        }
      }
    }
    const anchor = section.locator(`div[for="${forAttr}"]`).first();
    const wrap = anchor.locator('xpath=ancestor::app-field[1]');
    const errLegacy = wrap.locator('small.p-error, small[class*="p-error"], small.text-failed, small[class*="text-failed"]');
    const n2 = await errLegacy.count();
    for (let i = 0; i < n2; i++) {
      const el = errLegacy.nth(i);
      if (await el.isVisible().catch(() => false)) {
        const t = ((await el.textContent()) ?? '').replace(/\s+/g, ' ').trim();
        if (t) {
          return t;
        }
      }
    }
    return '';
  }

  /** Select placeholder option so dropdown is “empty” before Tab/blur validation (best-effort for PrimeNG). */
  private async clearCheckoutBillingDropdownToPlaceholder(
    section: Locator,
    forAttr: 'stateId' | 'cityId',
  ): Promise<void> {
    const combo = section.locator(`div:has(> div[for="${forAttr}"]) span[role="combobox"]`).first();
    await combo.click();
    await this.settleMs(250);
    const placeholderRx = forAttr === 'stateId' ? /enter state/i : /enter city/i;
    const opt = this.page.getByRole('option').filter({ hasText: placeholderRx }).first();
    if (await opt.isVisible({ timeout: 2500 }).catch(() => false)) {
      await opt.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await this.settleMs(300);
  }

  /** Billing text inputs under checkout edit (`#name`, `#mobileNumber`, …). */
  private static readonly checkoutBillingTextFieldIds = ['name', 'mobileNumber', 'address', 'pinCode'] as const;

  private static readonly checkoutBillingFieldLabels: Record<
    (typeof WithdrawalPage.checkoutBillingTextFieldIds)[number],
    string
  > = {
    name: 'Full Name',
    mobileNumber: 'Mobile',
    address: 'Address',
    pinCode: 'Pincode',
  };

  /**
   * Clears checkout billing text fields and (best-effort) State/City placeholders, then for each control:
   * focus → Tab → read inline error (text inputs + State/City comboboxes).
   * Prints a compact `console.table` and optional aggregate line for messages visible on the card.
   *
   * @returns Rows `{ field, message }` for callers that need assertions later.
   */
  async logCheckoutBillingValidationAfterTabThrough(options?: {
    /** Prefix for log lines (e.g. step id `TC016_13`). */
    logPrefix?: string;
  }): Promise<{ field: string; message: string }[]> {
    const prefix = options?.logPrefix ?? '[Checkout][Billing]';
    const section = this.getCheckoutBillingAddressSection();
    const ids = WithdrawalPage.checkoutBillingTextFieldIds;

    for (const id of ids) {
      await section.locator(`#${id}`).first().fill('');
    }
    await this.clearCheckoutBillingDropdownToPlaceholder(section, 'stateId');
    await this.clearCheckoutBillingDropdownToPlaceholder(section, 'cityId');
    await this.settleMs(400);

    const rows: { field: string; message: string }[] = [];
    for (const id of ids) {
      const input = section.locator(`#${id}`).first();
      await input.click();
      await input.press('Tab');
      await this.settleMs(500);
      const inline = await this.getCheckoutBillingFieldInlineError(id);
      rows.push({
        field: WithdrawalPage.checkoutBillingFieldLabels[id],
        message: inline.trim() || '—',
      });
    }

    for (const forAttr of ['stateId', 'cityId'] as const) {
      const combo = section.locator(`div:has(> div[for="${forAttr}"]) span[role="combobox"]`).first();
      await combo.focus();
      await combo.press('Tab');
      await this.page.keyboard.press('Escape');
      await this.settleMs(500);
      let inline = await this.getCheckoutBillingDropdownInlineError(forAttr);
      if (!inline.trim()) {
        await this.settleMs(400);
        inline = await this.getCheckoutBillingDropdownInlineError(forAttr);
      }
      rows.push({
        field: forAttr === 'stateId' ? 'State' : 'City/District',
        message: inline.trim() || '—',
      });
    }

    const cardErrors = await this.getAllVisibleCheckoutBillingFormErrorTexts();
    console.log(`\n${prefix} | Validation (empty → click each field → Tab; includes State & City)`);
    console.table(rows);
    if (cardErrors.length > 0) {
      console.log(`${prefix} | All messages on billing card: ${cardErrors.join(' | ')}`);
    }

    return rows;
  }

  /**
   * Fills withdraw **delivery** fields (text inputs + State / City). Does not toggle same-as-billing; fills
   * `#firstName` / `#lastName` only when enabled.
   */
  async fillManualDeliveryAddress(opts: {
    firstName: string;
    lastName: string;
    address: string;
    pincode: string;
    stateOptionLabel: string;
    cityOptionLabel: string;
  }): Promise<void> {
    const section = this.getDeliveryAddressFormSection();
    await section.scrollIntoViewIfNeeded();
    await section.waitFor({ state: 'visible' });

    const firstNameInput = section.locator('#firstName').first();
    await firstNameInput.waitFor({ state: 'visible' });
    if (await firstNameInput.isEnabled()) {
      await firstNameInput.fill(opts.firstName);
    }
    const lastNameInput = section.locator('#lastName').first();
    if (await lastNameInput.isEnabled()) {
      await lastNameInput.fill(opts.lastName);
    }

    await section.locator('#address').fill(opts.address);
    await section.locator('#pinCode').fill(opts.pincode);

    const stateCombo = section.locator('div:has(> div[for="stateId"]) span[role="combobox"]').first();
    await stateCombo.click();
    await this.settleMs(200);
    await this.page
      .getByRole('option')
      .filter({ hasText: new RegExp(opts.stateOptionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first()
      .click();
    await this.settleMs(500);

    const cityCombo = section.locator('div:has(> div[for="cityId"]) span[role="combobox"]').first();
    await cityCombo.click();
    await this.settleMs(200);
    await this.page
      .getByRole('option')
      .filter({ hasText: new RegExp(opts.cityOptionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first()
      .click();
    await this.settleMs(200);
  }

  /** Inline validation text near a delivery text input (`#firstName`, `#lastName`, `#address`, `#pinCode`). */
  async getDeliveryFieldInlineError(fieldId: string): Promise<string> {
    const input = this.page.locator(`#${fieldId}`).first();
    const col = input.locator('xpath=ancestor::div[contains(@class,"col-span")][1]');
    const err = col.locator('small.p-error, small[class*="p-error"]').first();
    if (await err.isVisible().catch(() => false)) {
      return ((await err.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  /** All non-empty `small.p-error` texts inside the delivery address card. */
  async getAllVisibleDeliveryFormErrorTexts(): Promise<string[]> {
    const section = this.getDeliveryAddressFormSection();
    const nodes = section.locator('small.p-error');
    const n = await nodes.count();
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const el = nodes.nth(i);
      if (!(await el.isVisible().catch(() => false))) {
        continue;
      }
      const t = (await el.textContent())?.trim();
      if (t) {
        out.push(t);
      }
    }
    return out;
  }

}
