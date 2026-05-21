import { expect, FrameLocator, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class PaymentPage extends BasePage {
  private readonly continueBtn: Locator;
  private readonly cardInput: Locator;
  private readonly phoneInput: Locator;
  private readonly authenticateBtn: Locator;
  private readonly bankAadhaarOption: Locator;
  private readonly secureUpiBtn: Locator;
  private readonly emandateBtn: Locator;
  private readonly closeBtn: Locator;
  private readonly addNewBankBtn: Locator;
  private readonly bankRadioButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.continueBtn = page.getByRole('button', { name: 'Continue' });
    this.cardInput = page.locator('input[name="card.number"]');
    this.phoneInput = page.locator('#contact');
    this.authenticateBtn = page.locator('#redesign-v15-cta');
    this.bankAadhaarOption = page.getByText('via Bank Account and Aadhaar details', { exact: true });
    this.secureUpiBtn = page.getByRole('button', { name: 'Secure UPI' });
    this.emandateBtn = page.getByRole('button', { name: 'Emandate' });
    this.closeBtn = page.getByRole('button', { name: 'Close' });
    this.addNewBankBtn = page.locator('button:has(.pi-plus):has-text("Add New")');
    this.bankRadioButtons = page.locator('.p-radiobutton-box');
  }

  razorpayFrame(): FrameLocator {
    return this.page.frameLocator('iframe[src*="razorpay"]');
  }

  async waitForRazorpayFrame(): Promise<void> {
    await this.page.waitForSelector('iframe[src*="razorpay"]', { state: 'attached' });
  }

  async getPriceSummaryAmountFromFrame(): Promise<number> {
    try {
      await this.waitForRazorpayFrame();
      const frame = this.page.frameLocator('iframe[src*="razorpay"]');
      const amountCandidates: Locator[] = [
        frame.locator('h3.number-flip'),
        frame.locator('h3[data-value]'),
        frame.locator('[data-testid="amount"]'),
        frame.locator('h3, h2, .number-flip').filter({ hasText: /₹|INR|[0-9]+(?:\.[0-9]+)?/i }).first(),
      ];

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        for (const amountLocator of amountCandidates) {
          const isVisible = await amountLocator
            .first()
            .waitFor({ state: 'visible', timeout: 6_000 })
            .then(() => true)
            .catch(() => false);
          if (!isVisible) {
            continue;
          }

          const amountAttr = (await amountLocator.first().getAttribute('data-value').catch(() => null)) ?? '';
          const amountText = ((await amountLocator.first().textContent().catch(() => null)) ?? '').trim();
          const attrNumeric = Number((amountAttr.match(/[\d.]+/)?.[0] ?? '').trim());
          if (Number.isFinite(attrNumeric) && attrNumeric > 0) {
            return attrNumeric;
          }
          const textNumeric = Number((amountText.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '').replace(/,/g, ''));
          if (Number.isFinite(textNumeric) && textNumeric > 0) {
            return textNumeric;
          }
        }
        await this.page.waitForTimeout(800);
      }
      throw new Error('Amount not found in Razorpay frame via known selectors.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Failed to read Razorpay amount from iframe:', msg);
      throw error;
    }
  }

  async clickContinueIfPresent(timeout = 15_000): Promise<boolean> {
    try {
      await this.waitForRazorpayFrame();
      const continueBtn = this.razorpayFrame().getByRole('button', { name: /continue/i });
      await continueBtn.waitFor({ state: 'visible', timeout });
      await continueBtn.waitFor({ state: 'attached', timeout: 5_000 });
      const isEnabled = await continueBtn.isEnabled().catch(() => true);
      if (!isEnabled) await this.page.waitForTimeout(1_000);
      await continueBtn.scrollIntoViewIfNeeded();
      await continueBtn.click({ timeout: 5_000 });
      await this.page.waitForLoadState('domcontentloaded');
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`Continue button not found or not clickable: ${msg}`);
      return false;
    }
  }

  async clickContinueButton(timeout = 15_000): Promise<boolean> {
    try {
      const continueBtn = this.page.getByRole('button', { name: /^continue$/i });
      await continueBtn.waitFor({ state: 'visible', timeout });
      await continueBtn.waitFor({ state: 'attached', timeout: 5_000 });
      await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
      await continueBtn.scrollIntoViewIfNeeded();
      await continueBtn.click({ timeout: 5_000 });
      await this.page.waitForLoadState('domcontentloaded');
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`Continue button not found or not clickable: ${msg}`);
      return false;
    }
  }

  async clickContinueInDialog(dialogName = 'Success', timeout = 60_000): Promise<boolean> {
    try {
      const dialog = this.page.getByRole('dialog', { name: dialogName });
      await dialog.waitFor({ state: 'visible', timeout });
      const continueBtn = dialog.getByRole('button', { name: 'Continue' });
      await continueBtn.waitFor({ state: 'visible', timeout });
      await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
      await continueBtn.scrollIntoViewIfNeeded();
      await continueBtn.click({ timeout: 5_000 });
      await this.page.waitForLoadState('domcontentloaded');
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`Continue button in dialog not found: ${msg}`);
      return false;
    }
  }

  async fillContactNumber(number: string): Promise<void> {
    await this.waitForRazorpayFrame();
    const frame = this.razorpayFrame();
    const fallbackPhone =
      process.env.UAT_CUSTOMER_USER_MOBILE ??
      process.env.TEST_CUSTOMER_USER_MOBILE ??
      '';
    const resolvedPhone = (number || fallbackPhone).trim();
    const digitsOnlyPhone = resolvedPhone.replace(/\D/g, '').slice(-10);
    if (!digitsOnlyPhone) {
      return;
    }

    const contactInput = frame
      .getByTestId('contactNumber')
      .or(frame.locator('#contact'))
      .or(frame.locator('input[placeholder*="mobile" i], input[name*="contact" i], input[type="tel"]'))
      .first();

    const isVisible = await contactInput
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!isVisible) {
      return;
    }

    await contactInput.click({ force: true });
    await contactInput.fill('');
    await contactInput.type(digitsOnlyPhone, { delay: 75 });

    const typedValue = await contactInput.inputValue().catch(() => '');
    const typedDigits = typedValue.replace(/\D/g, '');
    if (!typedDigits.endsWith(digitsOnlyPhone.slice(-4))) {
      await contactInput.click({ force: true });
      await this.page.keyboard.press('Control+A');
      await this.page.keyboard.press('Backspace');
      await contactInput.type(digitsOnlyPhone, { delay: 100 });
    }
  }

  async clickRazorpayContinue(): Promise<void> {
    await this.waitForRazorpayFrame();
    const frame = this.razorpayFrame();

    const netbanking = frame.locator('label').filter({ hasText: 'Netbanking' });
    if (await netbanking.isVisible().catch(() => false)) {
      return;
    }

    const continueBtn = frame
      .getByRole('button', { name: /^continue$/i })
      .or(frame.locator('button[validateform="true"]').filter({ hasText: /^Continue$/i }))
      .first();

    const isVisible = await continueBtn
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!isVisible) {
      return;
    }

    await continueBtn.click({ force: true });
    await frame.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async selectNetbanking(): Promise<void> {
    await this.waitForRazorpayFrame();
    const netbanking = this.razorpayFrame().locator('label').filter({ hasText: 'Netbanking' });
    await netbanking.waitFor({ state: 'visible' });
    await netbanking.click({ force: true });
  }

  async selectCards(): Promise<void> {
    await this.waitForRazorpayFrame();
    const cardsOption = this.razorpayFrame().locator('[data-value="card"]');
    await cardsOption.waitFor({ state: 'visible' });
    await cardsOption.click();
  }

  async enterCardNumber(cardNumber: string): Promise<void> {
    const cardNumberInput = this.razorpayFrame().locator('input[name="card.number"]');
    await cardNumberInput.waitFor({ state: 'visible' });
    await cardNumberInput.click();
    await cardNumberInput.type(cardNumber, { delay: 100 });
  }

  async enterCardExpiry(expiry: string): Promise<void> {
    const expiryInput = this.razorpayFrame().locator('input[name="card.expiry"]');
    await expiryInput.waitFor({ state: 'visible' });
    await expiryInput.click();
    await expiryInput.type(expiry, { delay: 150 });
    await expiryInput.press('Tab');
  }

  async enterCardCVV(cvv: string): Promise<void> {
    const cvvInput = this.razorpayFrame().locator('input[name="card.cvv"]');
    await cvvInput.waitFor({ state: 'visible' });
    await cvvInput.click();
    await cvvInput.type(cvv, { delay: 150 });
  }

  async enterCardHolderName(name: string): Promise<void> {
    const cardHolderNameInput = this.razorpayFrame().locator('input[placeholder*="name on card" i]');
    const isVisible = await cardHolderNameInput.isVisible().catch(() => false);
    if (!isVisible) {
      return;
    }
    await cardHolderNameInput.click();
    await cardHolderNameInput.fill(name);
  }

  async clickCardContinue(): Promise<void> {
    const continueBtn = this.razorpayFrame().locator('button[data-test-id="add-card-cta"]');
    await continueBtn.waitFor({ state: 'visible' });
    await expect(continueBtn).toBeEnabled({ timeout: 10_000 });
    await continueBtn.click({ force: true });
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickOnMaybeLaterButton(): Promise<boolean> {
    const maybeLaterBtn = this.razorpayFrame().locator('button[name="pay_without_saving_card"]');
    const visible = await maybeLaterBtn.isVisible().catch(() => false);
    if (!visible) {
      return false;
    }
    await maybeLaterBtn.click({ force: true });
    return true;
  }

  async enterOtp(otp: string): Promise<void> {
    const frame = this.razorpayFrame();
    const otpInputs = frame.locator(
      [
        'input[name*="otp" i]',
        'input[id*="otp" i]',
        'input[placeholder*="otp" i]',
        'input[autocomplete="one-time-code"]',
        'input[maxlength="1"]',
      ].join(', '),
    );
    const overlayBackdrop = frame.locator('#overlay-backdrop');
    const paymentFailedTitle = frame.getByText(/payment could not be completed/i);
    const paymentFailedReason = frame.getByText(/international cards are not supported/i);

    await Promise.race([
      otpInputs.first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {}),
      paymentFailedTitle.first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {}),
      paymentFailedReason.first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {}),
    ]);

    if (await paymentFailedTitle.first().isVisible().catch(() => false)) {
      const reason = (await paymentFailedReason.first().textContent().catch(() => 'Card payment was rejected.')) ?? 'Card payment was rejected.';
      throw new Error(reason.trim());
    }

    await overlayBackdrop.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
    await otpInputs.first().waitFor({ state: 'visible', timeout: 10_000 });
    const otpCount = await otpInputs.count();

    if (otpCount > 1) {
      const normalized = otp.trim();
      for (let i = 0; i < Math.min(otpCount, normalized.length); i++) {
        const box = otpInputs.nth(i);
        await box.click({ force: true });
        await box.fill('');
        await box.type(normalized[i], { delay: 75 });
      }
      return;
    }

    await otpInputs.first().click({ force: true });
    await otpInputs.first().fill('');
    await otpInputs.first().type(otp, { delay: 100 });
  }


  async clickOnOtpContinueButton(): Promise<void> {
    const frame = this.razorpayFrame();
    const continueBtn = frame
      .locator(
        'button[type="submit"]:has-text("Continue"), button[type="submit"]:has-text("Submit"), button[type="submit"]:has-text("Verify"), button[type="submit"]:has-text("Pay")',
      )
      .first();
    const paymentFailedTitle = frame.getByText(/payment could not be completed/i).first();
    const paymentFailedReason = frame
      .getByText(/international cards are not supported|invalid card/i)
      .first();

    await Promise.race([
      continueBtn.waitFor({ state: 'visible', timeout: 25_000 }).catch(() => {}),
      paymentFailedTitle.waitFor({ state: 'visible', timeout: 25_000 }).catch(() => {}),
      paymentFailedReason.waitFor({ state: 'visible', timeout: 25_000 }).catch(() => {}),
    ]);

    if (await paymentFailedTitle.isVisible().catch(() => false)) {
      const reason =
        (await paymentFailedReason.textContent().catch(() => 'Card payment was rejected.')) ??
        'Card payment was rejected.';
      throw new Error(reason.trim());
    }

    await continueBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await continueBtn.click({ force: true });

    const successDialog = this.page.getByRole('dialog', { name: /success/i });
    const frameSuccessText = frame.getByText(/payment successful/i).first();
    const dashboardUrl = /\/dashboard(?:\/|$|\?)/i;

    const successSource = await Promise.race([
      successDialog.waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'dialog' as const),
      frameSuccessText.waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'frame' as const),
      paymentFailedTitle.waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'failed' as const),
    ]).catch(() => 'none' as const);

    if (successSource === 'failed') {
      const reason =
        (await paymentFailedReason.textContent().catch(() => 'Card payment was rejected.')) ??
        'Card payment was rejected.';
      throw new Error(reason.trim());
    }

    if (successSource === 'none') {
      throw new Error('Payment success confirmation not detected after OTP submit.');
    }

    if (successSource === 'dialog') {
      const continueBtnAfterSuccess = successDialog.getByRole('button', { name: 'Continue' });
      await continueBtnAfterSuccess.waitFor({ state: 'visible', timeout: 10_000 });
      await continueBtnAfterSuccess.click();
    } else {
      await frame.getByRole('button', { name: /continue|done|close/i }).first().click({ force: true });
      const continueBtnAfterSuccess = successDialog.getByRole('button', { name: 'Continue' });
      if (await continueBtnAfterSuccess.isVisible().catch(() => false)) {
        await continueBtnAfterSuccess.click();
      }
    }

    await this.page.waitForURL(dashboardUrl, { timeout: 30_000 }).catch(() => {});
  }

  async closeUsingAsOverlayIfPresent(): Promise<void> {
    const usingBtn = this.razorpayFrame().locator('button:has-text("Using as +91")');
    if (await usingBtn.isVisible().catch(() => false)) {
      await usingBtn.click({ force: true });
    }
  }

  async selectBankAndWaitForPopup(bankName: string): Promise<void> {
    await this.waitForRazorpayFrame();
    const bankBtn = this.razorpayFrame().getByRole('button', { name: new RegExp(bankName, 'i') }).first();
    await bankBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await bankBtn.click({ trial: true });
    await bankBtn.click({ force: true });
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickRazorpaySuccess(): Promise<void> {
    const popup = await this.page.waitForEvent('popup', { timeout: 20_000 });
    await popup.waitForLoadState('domcontentloaded');
    const successBtn = popup.locator('button[data-val="S"].success').first();
    await successBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await successBtn.click();
    await popup.waitForEvent('close', { timeout: 15_000 }).catch(() => {});
  }

  async completeSbiPaymentViaPopup(): Promise<void> {
    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
    const [bankPopup] = await Promise.all([
      this.page.waitForEvent('popup'),
      frame.getByRole('button', { name: /state bank of india/i }).first().click(),
    ]);

    await bankPopup.waitForLoadState('domcontentloaded');
    await bankPopup.locator('button, input').filter({ hasText: /success/i }).click();
    await bankPopup.waitForEvent('close', { timeout: 10_000 }).catch(() => {});

    await this.page.waitForURL(/\/digital-gold\/buy\/summary/i, { timeout: 15_000, waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('domcontentloaded');

    const razorpayFrame = this.page.frameLocator('iframe[src*="razorpay"]');
    const successDialog = this.page.getByRole('dialog', { name: 'Success' });
    await Promise.race([
      razorpayFrame.getByRole('heading', { name: /payment successful/i }).waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {}),
      successDialog.waitFor({ state: 'visible', timeout: 30_000 }),
    ]);

    await successDialog.waitFor({ state: 'visible', timeout: 30_000 });
    const continueBtn = successDialog.getByRole('button', { name: 'Continue' });
    await continueBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await continueBtn.click();
  }

  async continueClickForFullyWalletPayment(): Promise<void> {
    const successDialog = this.page.getByRole('dialog', { name: 'Success' });
    const continueBtnAfterSuccess = successDialog.getByRole('button', { name: 'Continue' });
    await continueBtnAfterSuccess.waitFor({ state: 'visible', timeout: 5_000 });
    await continueBtnAfterSuccess.click();
    await this.page.waitForURL('**/dashboard**');
  }

  // Old implementation kept for reference.
  // async enterPhoneNumber(phoneNumber: string): Promise<void> {
  //   await this.waitForRazorpayFrame();
  //   const frame = this.razorpayFrame();
  //   const phoneInput = frame.getByPlaceholder('Mobile number');
  //   await phoneInput.waitFor({ state: 'visible', timeout: 20_000 });
  //   await phoneInput.fill(phoneNumber);
  // }
  async enterPhoneNumber(phoneNumber: string): Promise<void> {
    await this.waitForRazorpayFrame();
    const frame = this.razorpayFrame();
    const fallbackPhone =
      process.env.UAT_CUSTOMER_USER_MOBILE ??
      process.env.TEST_CUSTOMER_USER_MOBILE ??
      '';
    const resolvedPhone = (phoneNumber || fallbackPhone).trim();
    const digitsOnlyPhone = resolvedPhone.replace(/\D/g, '').slice(-10);
    if (!digitsOnlyPhone) {
      throw new Error('Unable to enter mobile number: dataset and env fallback are both empty.');
    }

    const phoneInput = frame
      .locator('input[placeholder*="mobile" i], input[name*="contact" i], input[type="tel"]')
      .first();

    try {
      await phoneInput.waitFor({ state: 'visible', timeout: 20_000 });
    } catch {
      return;
    }
    await phoneInput.click({ force: true });
    await phoneInput.fill('');
    await phoneInput.type(digitsOnlyPhone, { delay: 75 });

    // Razorpay input can ignore fill while overlay animation is active.
    const typedValue = await phoneInput.inputValue().catch(() => '');
    const typedDigits = typedValue.replace(/\D/g, '');
    if (!typedDigits.endsWith(digitsOnlyPhone.slice(-4))) {
      await phoneInput.click({ force: true });
      await this.page.keyboard.press('Control+A');
      await this.page.keyboard.press('Backspace');
      await phoneInput.type(digitsOnlyPhone, { delay: 100 });
    }
  }

  async clickContactContinue(): Promise<void> {
    const frame = this.razorpayFrame();
    const phoneInput = frame
      .locator('input[placeholder*="mobile" i], input[name*="contact" i], input[type="tel"]')
      .first();
    try {
      await phoneInput.waitFor({ state: 'visible', timeout: 20_000 });
    } catch {
      return;
    }

    const continueBtn = frame
      .locator('button[validateform="true"], button[name="button"], button:has-text("Continue")')
      .filter({ hasText: /^Continue$/i })
      .first();
    await continueBtn.waitFor({ state: 'visible', timeout: 20_000 });
    await continueBtn.click({ force: true });
    await frame.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

    // Retry once if contact step remains visible despite valid input.
    if (await phoneInput.isVisible().catch(() => false)) {
      const digits = (await phoneInput.inputValue().catch(() => '')).replace(/\D/g, '');
      if (digits.length >= 10) {
        await continueBtn.click({ force: true });
        await frame.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
      }
    }
  }

  async clickOnBankByNameEmandate(bankName: string): Promise<void> {
    const frame = this.razorpayFrame();
    await frame.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

    const normalizedBankName = bankName.trim();
    const bankByDataValue = frame.locator(`div[role="button"][data-value="${normalizedBankName}"]`).first();
    const bankByText = frame
      .locator('div[role="button"]')
      .filter({ has: frame.locator('span.font-medium', { hasText: new RegExp(normalizedBankName, 'i') }) })
      .first();
    const firstBank = frame.locator('div[role="button"]').first();
    const bank = (await bankByDataValue.isVisible().catch(() => false))
      ? bankByDataValue
      : ((await bankByText.isVisible().catch(() => false)) ? bankByText : firstBank);

    await bank.waitFor({ state: 'visible', timeout: 20_000 });
    try {
      await bank.click({ timeout: 5_000 });
    } catch {
      await bank.click({ force: true });
    }
  }

  async clickOnBankByCodeEmandate(bankCode: string): Promise<void> {
    const frame = this.razorpayFrame();
    await frame.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

    const normalizedCode = bankCode.trim().toUpperCase();
    const bankByCode = frame.locator(`div[role="button"]:has([data-value="${normalizedCode}"])`).first();
    const firstBank = frame.locator('div[role="button"]').first();
    const bank = (await bankByCode.isVisible().catch(() => false)) ? bankByCode : firstBank;
    await bank.waitFor({ state: 'visible', timeout: 20_000 });
    try {
      await bank.click({ timeout: 5_000 });
    } catch {
      await bank.click({ force: true });
    }
  }

  async getPriceSummaryEmandate(): Promise<string> {
    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
    const price = frame.locator('h3:visible', { hasText: '₹' });
    await price.waitFor({ state: 'visible', timeout: 20_000 });
    return (await price.first().innerText()).trim();
  }

  async clickAadhaarEmandate() {
    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
  
    const aadhaarOption = frame.locator('[data-value="aadhaar"]');
  
    await aadhaarOption.waitFor({ state: 'visible', timeout: 20000 });
    await aadhaarOption.click();
  }
  async clickAuthenticate() {
    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
  
    // ensure form is loaded before clicking
    await frame.getByPlaceholder('Bank Account Number')
      .waitFor({ state: 'visible', timeout: 20000 });
  
    const btn = frame.getByRole('button', { name: /authenticate/i });
  
    await btn.click();
  }


  async selectViaBankAndAadhaar(): Promise<void> {
    await this.waitForRazorpayFrame();
    const option = this.razorpayFrame().locator('text=/Aadhaar details/i');
    await option.click();
  }

  async clickRazorpaySuccessInPopup(): Promise<void> {
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup', { timeout: 20_000 }),
      this.razorpayFrame().locator('#redesign-v15-cta').click(),
    ]);

    await popup.waitForLoadState('domcontentloaded');
    const successBtn = popup.locator('button[data-val="S"].success').first();
    await successBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await successBtn.click();
    await popup.waitForEvent('close', { timeout: 15_000 }).catch(() => {});

    await this.page.waitForURL(/\/digital-(gold|silver)\/buy\/summary/i, { timeout: 30_000, waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('domcontentloaded');

    const razorpayFrame = this.page.frameLocator('iframe[src*="razorpay"]');
    const successDialog = this.page.getByRole('dialog', { name: 'Success' });
    await Promise.race([
      razorpayFrame.getByRole('heading', { name: /payment successful/i }).waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {}),
      successDialog.waitFor({ state: 'visible', timeout: 30_000 }),
    ]);

    await successDialog.waitFor({ state: 'visible', timeout: 30_000 });
    const continueBtn = successDialog.getByRole('button', { name: 'Continue' });
    await continueBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await continueBtn.click();
    await this.page.waitForURL('**/dashboard**');
  }

  async verifyUpiAndEmandateOptionsVisible(): Promise<{ secureUpi: boolean; emandate: boolean }> {
    await this.secureUpiBtn.waitFor({ state: 'visible' });
    await this.emandateBtn.waitFor({ state: 'visible' });
    return {
      secureUpi: await this.secureUpiBtn.isVisible(),
      emandate: await this.emandateBtn.isVisible(),
    };
  }

  async clickEmandate(): Promise<void> {
    await this.emandateBtn.waitFor({ state: 'visible' });
    await this.emandateBtn.waitFor({ state: 'attached' });
    await this.emandateBtn.click();
  }

  async clickCloseAndWaitForSummary(): Promise<string> {
    await this.closeBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await this.closeBtn.click();
    await this.page.waitForURL(/summary/, { timeout: 10_000 });
    return this.page.url();
  }

  async selectBankOrAddNew(): Promise<boolean> {
    const bankDialog = this.page.getByRole('dialog', { name: /choose bank account/i });
    await bankDialog.waitFor({ state: 'visible', timeout: 20_000 });
    const bankCards = bankDialog.locator('div[class*="bg-teal-aliceblue"]');
    const count = await bankCards.count();

    if (count === 0) {
      const addNewAccountTrigger = bankDialog
        .locator('button:has(.pi-plus), button:has-text("Add New"), button:has-text("Add New Account")')
        .first();
      if (await addNewAccountTrigger.isVisible().catch(() => false)) {
        await addNewAccountTrigger.click();
      }
      return false;
    }

    const firstRadioBox = bankCards.first().locator('div.p-radiobutton-box');
    await firstRadioBox.waitFor({ state: 'visible' });
    await firstRadioBox.click();
    return true;
  }

  async clickPayButton(): Promise<void> {
    const chooseBankDialog = this.page.getByRole('dialog', { name: /choose bank account/i });
    const payButtonInDialog = chooseBankDialog.getByRole('button', { name: /^pay$/i });
    const useDialogPay = await payButtonInDialog.first().isVisible().catch(() => false);

    const payButton = useDialogPay
      ? payButtonInDialog.first()
      : this.page.locator('button:has-text("Pay"), span[data-pc-section="label"]:has-text("Pay")').first();
    await payButton.waitFor({ state: 'visible', timeout: 20_000 });
    await payButton.scrollIntoViewIfNeeded();
    await payButton.click();
  }

  async completeNetbankingPayment(bankName: string): Promise<void> {
    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
    let bankPopup: Page | null = null;

    try {
      [bankPopup] = await Promise.all([
        this.page.waitForEvent('popup', { timeout: 5_000 }),
        frame.getByRole('button', { name: new RegExp(bankName, 'i') }).first().click(),
      ]);
    } catch {
      await frame.getByRole('button', { name: new RegExp(bankName, 'i') }).first().click();
    }

    if (bankPopup) {
      await bankPopup.waitForLoadState();
      await bankPopup.locator('button, input').filter({ hasText: /success/i }).first().click().catch(() => {});
      await bankPopup.waitForEvent('close').catch(() => {});
    }

    const razorpayFrame = this.page.frameLocator('iframe[src*="razorpay"]');
    const pageSuccessDialog = this.page.getByRole('dialog', { name: /success/i });
    const frameSuccessHeading = razorpayFrame.getByText(/payment successful/i);

    const successSource = await Promise.race([
      pageSuccessDialog.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'page' as const),
      frameSuccessHeading.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'frame' as const),
    ]);

    if (successSource === 'page') {
      await pageSuccessDialog.getByRole('button', { name: /continue/i }).click().catch(() => {});
    } else {
      await razorpayFrame.getByRole('button', { name: /continue|done|close/i }).first().click().catch(() => {});
    }

    await Promise.race([
      this.page.locator('iframe[src*="razorpay"]').first().waitFor({ state: 'hidden', timeout: 30_000 }),
      this.page.waitForURL(/summary|dashboard|my-orders|success/i, { timeout: 30_000 }),
    ]);
  }

  /**
   * Withdrawal/jewellery netbanking: dismiss overlay → bank → **Continue & Pay** → **bank again** (some Razorpay flows), then same completion as {@link completeNetbankingPayment}.
   * All withdrawal-only steps live in this method only (no separate private helpers on the class).
   */
  async completeNetbankingPaymentWithdrwal(
    bankName: string,
    options?: { tc005Mode?: boolean },
  ): Promise<void> {
    const isTc005Mode = options?.tc005Mode === true;
    const sleepMs = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    const dismissFeeBearerOverlay = async (): Promise<void> => {
      const overlayRoot = this.page.locator('[data-testid="overlay-fee-bearer"], #overlay-backdrop').first();
      for (let attempt = 0; attempt < 40; attempt += 1) {
        if (!(await overlayRoot.isVisible().catch(() => false))) {
          return;
        }
        const inOverlay = this.page.locator('[data-testid="overlay-fee-bearer"]').locator('button, [role="button"], a');
        const n = await inOverlay.count();
        for (let i = 0; i < n; i += 1) {
          await inOverlay.nth(i).click({ timeout: 1500, force: true }).catch(() => {});
        }
        await this.page
          .getByRole('button', { name: /continue|proceed|confirm|pay now|ok|i understand|got it/i })
          .first()
          .click({ timeout: 2000, force: true })
          .catch(() => {});
        await overlayRoot.click({ position: { x: 2, y: 2 }, force: true }).catch(() => {});
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
        if (await overlayRoot.isVisible().catch(() => false)) {
          await this.page
            .evaluate(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
              () => (globalThis as any).document?.querySelector?.('[data-testid="overlay-fee-bearer"]')?.remove(),
            )
            .catch(() => {});
          await this.page
            .evaluate(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
              () => (globalThis as any).document?.getElementById?.('overlay-backdrop')?.remove(),
            )
            .catch(() => {});
        }
      }
    };

    const clickContinueAndPayIfVisible = async (razorpayFrame: FrameLocator): Promise<void> => {
      await dismissFeeBearerOverlay();

      const label = /Continue\s*(?:and|&)\s*Pay/i;
      const union = razorpayFrame
        .getByRole('button', { name: label })
        .or(razorpayFrame.getByRole('button', { name: 'Continue & Pay', exact: true }))
        .or(razorpayFrame.locator('button, [role="button"], a').filter({ hasText: label }));

      const feeBreakupOpen = await razorpayFrame.getByText(/fee breakup/i).first().isVisible({ timeout: 2_500 }).catch(() => false);
      const target = feeBreakupOpen ? union.last() : union.first();

      await target.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});

      if (!(await target.isVisible().catch(() => false))) {
        return;
      }

      await target.scrollIntoViewIfNeeded();
      for (let attempt = 0; attempt < 4; attempt += 1) {
        if (attempt > 0) {
          await dismissFeeBearerOverlay();
        }
        const clicked = await target
          .click({ force: true, timeout: 12_000 })
          .then(() => true)
          .catch(() => false);
        if (clicked) {
          return;
        }
        await this.page.waitForTimeout(400);
      }
    };

    const confirmDemoBankSuccess = async (preOpenedPopup: Page | null): Promise<void> => {
      const tryClickSuccess = async (p: Page | null): Promise<boolean> => {
        if (!p || p.isClosed()) return false;
        await p.waitForLoadState('domcontentloaded').catch(() => {});
        const byAttr = p.locator('button[data-val="S"]');
        const byRole = p.getByRole('button', { name: /^success$/i });
        if (await byAttr.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          if (isTc005Mode) {
            console.log('[PAYMENT SUCCESS] Clicking popup success button via data-val="S"');
            await byAttr.first().click({ force: true }).catch(async () => {
              await byAttr.first().dispatchEvent('click').catch(() => {});
            });
            console.log('[PAYMENT SUCCESS] Clicked popup success button');
          } else {
            await byAttr.first().click();
          }
          await p.waitForEvent('close', { timeout: 20_000 }).catch(() => {});
          return true;
        }
        if (await byRole.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          if (isTc005Mode) {
            console.log('[PAYMENT SUCCESS] Clicking popup success button via role/name');
            await byRole.first().click({ force: true }).catch(async () => {
              await byRole.first().dispatchEvent('click').catch(() => {});
            });
            console.log('[PAYMENT SUCCESS] Clicked popup success button');
          } else {
            await byRole.first().click();
          }
          await p.waitForEvent('close', { timeout: 20_000 }).catch(() => {});
          return true;
        }
        return false;
      };

      if (await tryClickSuccess(preOpenedPopup)) return;

      for (const p of this.page.context().pages()) {
        if (p === this.page) continue;
        if (await tryClickSuccess(p)) return;
      }

      const latePopup = await this.page.waitForEvent('popup', { timeout: 6_000 }).catch(() => null);
      if (await tryClickSuccess(latePopup)) return;

      const rzFrame = this.page.frameLocator('iframe[src*="razorpay"]');
      const inFrameSuccess = rzFrame.locator('button[data-val="S"]');
      const processing = rzFrame.getByText(/processing your payment/i);
      await Promise.race([
        inFrameSuccess.waitFor({ state: 'visible', timeout: 12_000 }),
        processing.waitFor({ state: 'visible', timeout: 12_000 }),
      ]).catch(() => {});
      if (isTc005Mode) {
        const frameSuccessVisible = await inFrameSuccess.isVisible().catch(() => false);
        if (frameSuccessVisible) {
          console.log('[PAYMENT SUCCESS] Clicking in-frame success button');
          await inFrameSuccess
            .click({ timeout: 8_000, force: true })
            .catch(async () => {
              await inFrameSuccess.dispatchEvent('click').catch(() => {});
            });
          console.log('[PAYMENT SUCCESS] Clicked in-frame success button');
        } else {
          console.log('[PAYMENT SUCCESS] In-frame success button not visible at fallback click stage');
        }
      } else {
        await inFrameSuccess.click({ timeout: 8_000 }).catch(() => {});
      }
    };

    const successAlreadyVisible = async (): Promise<boolean> => {
      if (this.page.isClosed()) return false;
      try {
        if (/summary|dashboard|my-orders|success/i.test(this.page.url())) return true;
      } catch {
        return false;
      }
      const pageSuccessDialog = this.page.getByRole('dialog', { name: /success/i });
      if (await pageSuccessDialog.isVisible({ timeout: 700 }).catch(() => false)) return true;
      const rf = this.page.frameLocator('iframe[src*="razorpay"]');
      const frameHeading = rf
        .getByText(/payment successful/i)
        .or(rf.getByText(/your payment was successful/i))
        .first();
      if (await frameHeading.isVisible({ timeout: 700 }).catch(() => false)) return true;
      return false;
    };

    const waitSuccessOutcome = async (timeoutMs: number): Promise<'page' | 'frame' | 'url'> => {
      const razorpayFrame = this.page.frameLocator('iframe[src*="razorpay"]');
      const pageSuccessDialog = this.page.getByRole('dialog', { name: /success/i });
      const frameSuccessHeading = razorpayFrame
        .getByText(/payment successful/i)
        .or(razorpayFrame.getByText(/your payment was successful/i))
        .first();

      return await Promise.any([
        pageSuccessDialog.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => 'page' as const),
        frameSuccessHeading.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => 'frame' as const),
        this.page.waitForURL(/summary|dashboard|my-orders|success/i, { timeout: timeoutMs }).then(() => 'url' as const),
      ]).catch(() => {
        throw new Error(
          'Razorpay (withdrawal): success UI / navigation did not occur — check sandbox payment or extend timeouts.',
        );
      });
    };

    const dismissSuccessChrome = async (source: 'page' | 'frame' | 'url'): Promise<void> => {
      if (source === 'url') {
        await this.page.locator('iframe[src*="razorpay"]').first().waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {});
        return;
      }
      const razorpayFrame = this.page.frameLocator('iframe[src*="razorpay"]');
      if (source === 'page') {
        await this.page.getByRole('dialog', { name: /success/i }).getByRole('button', { name: /continue/i }).click().catch(() => {});
      } else {
        await razorpayFrame.getByRole('button', { name: /continue|done|close/i }).first().click().catch(() => {});
      }
      await Promise.any([
        this.page.locator('iframe[src*="razorpay"]').first().waitFor({ state: 'hidden', timeout: 45_000 }),
        this.page.waitForURL(/summary|dashboard|my-orders|success/i, { timeout: 45_000 }),
      ]).catch(() => {});
    };

    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
    let bankPopup: Page | null = null;
    const bankPopupWaitMs = 12_000;

    try {
      [bankPopup] = await Promise.all([
        this.page.waitForEvent('popup', { timeout: bankPopupWaitMs }),
        frame.getByRole('button', { name: new RegExp(bankName, 'i') }).first().click({ force: true }),
      ]);
    } catch {
      await frame.getByRole('button', { name: new RegExp(bankName, 'i') }).first().click({ force: true });
    }

    await clickContinueAndPayIfVisible(frame);

    await frame
      .getByRole('button', { name: new RegExp(bankName, 'i') })
      .first()
      .click({ force: true })
      .catch(() => {});

    await sleepMs(400);
    await clickContinueAndPayIfVisible(frame);

    await Promise.race([
      frame.getByText(/processing your payment/i).first().waitFor({ state: 'visible', timeout: 30_000 }),
      this.page.waitForEvent('popup', { timeout: 12_000 }).then(() => {}),
    ]).catch(() => {});

    await confirmDemoBankSuccess(bankPopup);
    await sleepMs(500);
    await confirmDemoBankSuccess(null);

    if (await successAlreadyVisible()) {
      await dismissSuccessChrome(await waitSuccessOutcome(15_000));
      return;
    }

    await clickContinueAndPayIfVisible(frame);
    await sleepMs(350);
    await clickContinueAndPayIfVisible(frame);

    if (await successAlreadyVisible()) {
      await dismissSuccessChrome(await waitSuccessOutcome(15_000));
      return;
    }

    await dismissSuccessChrome(await waitSuccessOutcome(60_000));
  }

  /**
   * Withdrawal/jewellery netbanking FAILURE path (NEW — does not modify {@link completeNetbankingPaymentWithdrwal}).
   *
   * Same Razorpay navigation as the success flow (bank → **Continue & Pay** → bank again),
   * but in the demo-bank popup it clicks **Failure** (`data-val="F"`) instead of Success.
   * Polls popups + in-frame for ~45s, captures and returns the failure message text shown
   * by the Razorpay frame / app dialog / toast (or empty string if none).
   */
  async failNetbankingPaymentWithdrawal(bankName: string): Promise<string> {
    const sleepMs = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    const dismissFeeBearerOverlay = async (): Promise<void> => {
      const overlayRoot = this.page
        .locator('[data-testid="overlay-fee-bearer"], #overlay-backdrop')
        .first();
      for (let attempt = 0; attempt < 40; attempt += 1) {
        if (!(await overlayRoot.isVisible().catch(() => false))) return;
        const inOverlay = this.page
          .locator('[data-testid="overlay-fee-bearer"]')
          .locator('button, [role="button"], a');
        const n = await inOverlay.count();
        for (let i = 0; i < n; i += 1) {
          await inOverlay.nth(i).click({ timeout: 1500, force: true }).catch(() => {});
        }
        await this.page
          .getByRole('button', { name: /continue|proceed|confirm|pay now|ok|i understand|got it/i })
          .first()
          .click({ timeout: 2000, force: true })
          .catch(() => {});
        await overlayRoot.click({ position: { x: 2, y: 2 }, force: true }).catch(() => {});
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.waitForTimeout(300);
      }
    };

    const clickContinueAndPayIfVisible = async (rzFrame: FrameLocator): Promise<void> => {
      await dismissFeeBearerOverlay();
      const label = /Continue\s*(?:and|&)\s*Pay/i;
      const union = rzFrame
        .getByRole('button', { name: label })
        .or(rzFrame.getByRole('button', { name: 'Continue & Pay', exact: true }))
        .or(rzFrame.locator('button, [role="button"], a').filter({ hasText: label }));

      const feeBreakupOpen = await rzFrame
        .getByText(/fee breakup/i)
        .first()
        .isVisible({ timeout: 2_500 })
        .catch(() => false);
      const target = feeBreakupOpen ? union.last() : union.first();

      await target.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
      if (!(await target.isVisible().catch(() => false))) return;

      await target.scrollIntoViewIfNeeded().catch(() => {});
      for (let attempt = 0; attempt < 4; attempt += 1) {
        if (attempt > 0) await dismissFeeBearerOverlay();
        const ok = await target
          .click({ force: true, timeout: 12_000 })
          .then(() => true)
          .catch(() => false);
        if (ok) return;
        await this.page.waitForTimeout(400);
      }
    };

    const tryClickFailureInPopup = async (p: Page | null): Promise<boolean> => {
      if (!p || p.isClosed()) return false;
      await p.waitForLoadState('domcontentloaded').catch(() => {});
      const byAttr = p.locator('button[data-val="F"]').first();
      const byRole = p.getByRole('button', { name: /^failure$/i }).first();
      const byText = p
        .locator('button, input[type="submit"], input[type="button"]')
        .filter({ hasText: /failure|fail/i })
        .first();
      for (const candidate of [byAttr, byRole, byText]) {
        if (await candidate.isVisible({ timeout: 1_000 }).catch(() => false)) {
          console.log('[PAYMENT FAILURE] Clicking demo-bank Failure button on popup');
          await candidate.click({ force: true }).catch(async () => {
            await candidate.dispatchEvent('click').catch(() => {});
          });
          await p.waitForEvent('close', { timeout: 20_000 }).catch(() => {});
          return true;
        }
      }
      return false;
    };

    const tryInFrameFailure = async (rzFrame: FrameLocator): Promise<boolean> => {
      const inFrameFailure = rzFrame.locator('button[data-val="F"]').first();
      if (!(await inFrameFailure.isVisible({ timeout: 1_000 }).catch(() => false))) {
        return false;
      }
      console.log('[PAYMENT FAILURE] Clicking in-frame Failure button (data-val="F")');
      const ok = await inFrameFailure
        .click({ force: true, timeout: 5_000 })
        .then(() => true)
        .catch(() => false);
      if (ok) return true;
      await inFrameFailure.dispatchEvent('click').catch(() => {});
      return true;
    };

    const pollForFailureClick = async (
      preOpenedPopup: Page | null,
      rzFrame: FrameLocator,
      totalTimeoutMs: number,
    ): Promise<boolean> => {
      const start = Date.now();
      while (Date.now() - start < totalTimeoutMs) {
        if (preOpenedPopup && !preOpenedPopup.isClosed()) {
          if (await tryClickFailureInPopup(preOpenedPopup)) return true;
        }
        for (const p of this.page.context().pages()) {
          if (p === this.page) continue;
          if (await tryClickFailureInPopup(p)) return true;
        }
        const latePopup = await this.page.waitForEvent('popup', { timeout: 2_000 }).catch(() => null);
        if (latePopup && (await tryClickFailureInPopup(latePopup))) return true;

        if (await tryInFrameFailure(rzFrame)) return true;

        await sleepMs(500);
      }
      return false;
    };

    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
    let bankPopup: Page | null = null;

    try {
      [bankPopup] = await Promise.all([
        this.page.waitForEvent('popup', { timeout: 12_000 }),
        frame.getByRole('button', { name: new RegExp(bankName, 'i') }).first().click({ force: true }),
      ]);
    } catch {
      await frame.getByRole('button', { name: new RegExp(bankName, 'i') }).first().click({ force: true });
    }

    await clickContinueAndPayIfVisible(frame);

    await frame
      .getByRole('button', { name: new RegExp(bankName, 'i') })
      .first()
      .click({ force: true })
      .catch(() => {});

    await sleepMs(400);
    await clickContinueAndPayIfVisible(frame);

    await Promise.race([
      frame.getByText(/processing your payment/i).first().waitFor({ state: 'visible', timeout: 30_000 }),
      this.page.waitForEvent('popup', { timeout: 12_000 }).then(() => {}),
    ]).catch(() => {});

    const failureClicked = await pollForFailureClick(bankPopup, frame, 45_000);
    if (!failureClicked) {
      throw new Error(
        'Razorpay (withdrawal failure): demo-bank Failure button was not found / clickable within 45s.',
      );
    }

    const failurePatterns =
      /payment\s*(?:was\s*)?(?:failed|unsuccessful|not\s*(?:completed|successful))|payment\s*could\s*not\s*be\s*completed|transaction\s*(?:has\s*)?failed|something\s*went\s*wrong|payment\s*(?:has\s*)?failed/i;

    const razorpayFrame = this.page.frameLocator('iframe[src*="razorpay"]');
    const frameFailure = razorpayFrame.getByText(failurePatterns).first();
    const pageFailureDialog = this.page.getByRole('dialog').filter({ hasText: failurePatterns }).first();
    const pageFailureToast = this.page
      .locator('div.p-toast-message, p-toast .p-toast-detail, .p-toast-summary, [role="alert"], app-dialog')
      .filter({ hasText: failurePatterns })
      .first();
    const pageFailureText = this.page.getByText(failurePatterns).first();

    const failureSource = await Promise.race([
      frameFailure.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'frame' as const),
      pageFailureDialog.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'dialog' as const),
      pageFailureToast.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'toast' as const),
      pageFailureText.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'text' as const),
    ]).catch(() => 'none' as const);

    console.log('[PAYMENT FAILURE] UI source:', failureSource);

    let capturedFailureMessage = '';
    if (failureSource === 'frame') {
      capturedFailureMessage = ((await frameFailure.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    } else if (failureSource === 'dialog') {
      capturedFailureMessage = ((await pageFailureDialog.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    } else if (failureSource === 'toast') {
      capturedFailureMessage = ((await pageFailureToast.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    } else if (failureSource === 'text') {
      capturedFailureMessage = ((await pageFailureText.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    }

    const dismiss = this.page
      .getByRole('button', { name: /^(?:retry|try again|close|ok|cancel|continue|done)$/i })
      .first();
    if (await dismiss.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dismiss.click({ force: true }).catch(() => {});
    }
    await razorpayFrame
      .getByRole('button', { name: /^(?:close|cancel|done|go back)$/i })
      .first()
      .click({ force: true })
      .catch(() => {});

    await this.page.waitForLoadState('domcontentloaded').catch(() => {});

    return capturedFailureMessage;
  }

  async selectBank(): Promise<void> {
    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
    await frame.locator('text=Netbanking').waitFor({ state: 'visible', timeout: 15_000 });
    await frame.locator('text=Suggested Banks').waitFor({ state: 'visible' });
    const banks = frame.locator('div[role="button"]');
    const count = await banks.count();
    if (count === 0) throw new Error('No banks found in Razorpay');
    const firstBank = banks.first();
    await firstBank.waitFor({ state: 'visible' });
    await firstBank.scrollIntoViewIfNeeded();
    await firstBank.click({ force: true });
  }

  async clickSuccessButton(): Promise<void> {
    const popup = await this.page.waitForEvent('popup', { timeout: 10_000 }).catch(() => null);
    if (popup) {
      await popup.waitForLoadState();
      const successBtn = popup.locator('button[data-val="S"]');
      if (await successBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await successBtn.click();
        await popup.close().catch(() => {});
      }
      return;
    }

    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
    const successBtn = frame.locator('button[data-val="S"]');
    const processingText = frame.locator('text=Processing your payment');
    await Promise.race([
      successBtn.waitFor({ state: 'visible', timeout: 15_000 }),
      processingText.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);
    if (await successBtn.isVisible().catch(() => false)) {
      await successBtn.click();
    }
  }

  async waitForSuccessButtonAndClick(): Promise<void> {
    const frame = this.page.frameLocator('iframe.razorpay-checkout-frame');
    const successBtn = frame.locator('button:has-text("Success")');
    await successBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await successBtn.click();
  }

  async getSuccessMessageAndContinueToDashboard(): Promise<string> {
    const successDialog = this.page.getByRole('dialog', { name: /success/i });
    await successDialog.waitFor({ state: 'visible', timeout: 30_000 });

    const successMessage = successDialog
      .locator('app-dialog .text-16, app-dialog div')
      .filter({ hasText: /successfully/i })
      .first();
    await successMessage.waitFor({ state: 'visible', timeout: 15_000 });
    const messageText = (await successMessage.textContent())?.trim() ?? '';
    console.log('Success Message:', messageText);
    const continueButton = successDialog.getByRole('button', { name: /^continue$/i });
    await continueButton.waitFor({ state: 'visible', timeout: 15_000 });
    await continueButton.click();

    await this.page.waitForURL(/\/dashboard(?:\/|$|\?)/i, { timeout: 30_000 });
    return messageText;
  }

  async completeEmandateFlow() {
    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
  
    // 1️⃣ Wait for Continue button inside iframe
    const continueBtn = frame.getByRole('button', { name: /^continue$/i });
  
    await continueBtn.waitFor({ state: 'visible', timeout: 10000 });
  
    // 2️⃣ Click Continue + handle optional popup
    let popup = null;
  
    try {
      [popup] = await Promise.all([
        this.page.waitForEvent('popup', { timeout: 10000 }),
        continueBtn.click(),
      ]);
    } catch {
      // No popup → normal flow
      await continueBtn.click();
    }
  
    // 3️⃣ If popup appears → handle success
    if (popup) {
      await popup.waitForLoadState();
  
      const successBtn = popup.locator('button[data-val="S"].success').first();
  
      await successBtn.waitFor({ state: 'visible', timeout: 15000 });
      await successBtn.click();
  
      await popup.close().catch(() => {});
    }
  
    // 4️⃣ Wait for success dialog on main page
    const successDialog = this.page.getByRole('dialog', { name: /success/i });
  
    await successDialog.waitFor({ state: 'visible', timeout: 30000 });
  
    // 5️⃣ Click Continue on success dialog
    await successDialog.getByRole('button', { name: /continue/i }).click();
  
    // 6️⃣ Verify redirect
    await this.page.waitForURL('**/dashboard**');
  }
  
}
