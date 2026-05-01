import { Locator, Page } from '@playwright/test';
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
    const goldVaultQuantityInput = this.page
      .locator('div.border.border-stroke.rounded-xl')
      .filter({ hasText: /Gold Vault/i })
      .first()
      .locator('#integeronly')
      .first();
    await goldVaultQuantityInput.waitFor({ state: 'visible' });
    await goldVaultQuantityInput.click();
    await goldVaultQuantityInput.fill('');
    await goldVaultQuantityInput.type(value.toString(), { delay: 100 });
    await goldVaultQuantityInput.press('Tab');
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

  async clickProceedForConvertGoldJewellery(): Promise<void> {
    const proceedBtn = this.convertGoldJewelleryProceedButton();
    await proceedBtn.waitFor({ state: 'visible' });
    await proceedBtn.click();
  }

  async clickDeliveryProceedButton(): Promise<void> {
    const proceedButton = this.page
      .locator('app-button[ng-reflect-label="Proceed"] button[data-pc-name="button"]')
      .first();
    await proceedButton.waitFor({ state: 'visible' });
    await proceedButton.click();
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

  async getAndLogProductCategoryNames(): Promise<string[]> {
    const categoryGroup = this.page.locator('div[role="group"][data-pc-name="selectbutton"]').first();
    await categoryGroup.waitFor({ state: 'visible' });

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
    const categoryGroup = this.page.locator('div[role="group"][data-pc-name="selectbutton"]').first();
    await categoryGroup.waitFor({ state: 'visible' });

    const coinOption = categoryGroup
      .locator('div[role="radio"]')
      .filter({ has: this.page.locator('span.p-button-label', { hasText: /^Coin$/i }) })
      .first();

    await coinOption.waitFor({ state: 'visible' });
    const isSelected = (await coinOption.getAttribute('aria-checked')) === 'true';
    if (!isSelected) {
      await coinOption.click();
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

  async selectProductByName(productName: string): Promise<void> {
    const normalizedProductName = productName.trim();
    const escapedName = normalizedProductName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(escapedName, 'i');
    const directTarget = this.page
      .locator('div.border-2.border-stroke.rounded-2xl.cursor-pointer')
      .filter({ has: this.page.locator('h2', { hasText: nameRegex }) })
      .first();

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      if (await directTarget.isVisible({ timeout: 5000 }).catch(() => false)) {
        await directTarget.click();
        return;
      }
      await this.selectCoinCategoryIfNotSelected();
      await this.page.waitForTimeout(800);
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

}
