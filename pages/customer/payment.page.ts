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
      const amountLocator = this.page.frameLocator('iframe[src*="razorpay"]').locator('h3.number-flip');
      await amountLocator.waitFor({ state: 'visible', timeout: 15_000 });
      const amountAttr = await amountLocator.getAttribute('data-value');
      return Number(amountAttr);
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
    const contactInput = this.razorpayFrame().getByTestId('contactNumber');
    await contactInput.waitFor({ state: 'visible' });
    await contactInput.fill(number);
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

  // async clickOnOtpContinueButton(): Promise<void> {
  //   const frame = this.razorpayFrame();
  //   const continueBtn = frame
  //     .locator('button[type="submit"]:has-text("Continue"), button[type="submit"]:has-text("Submit"), button[type="submit"]:has-text("Verify"), button[type="submit"]:has-text("Pay")')
  //     .first();
  //   const paymentFailedTitle = frame.getByText(/payment could not be completed/i);
  //   const paymentFailedReason = frame.getByText(/international cards are not supported|invalid card/i);

  //   await Promise.race([
  //     continueBtn.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {}),
  //     paymentFailedTitle.first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {}),
  //     paymentFailedReason.first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {}),
  //   ]);

  //   if (await paymentFailedTitle.first().isVisible().catch(() => false)) {
  //     const reason = (await paymentFailedReason.first().textContent().catch(() => 'Card payment was rejected.')) ?? 'Card payment was rejected.';
  //     throw new Error(reason.trim());
  //   }

  //   await continueBtn.waitFor({ state: 'visible', timeout: 10_000 });
  //   await continueBtn.click({ force: true });
  //   await this.page.waitForSelector('text=/payment successful|success/i', { timeout: 40_000 });
  //   const successDialog = this.page.getByRole('dialog', { name: 'Success' });
  //   const continueBtnAfterSuccess = successDialog.getByRole('button', { name: 'Continue' });
  //   await continueBtnAfterSuccess.waitFor({ state: 'visible', timeout: 5_000 });
  //   await continueBtnAfterSuccess.click();
  // }

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
