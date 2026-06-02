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
      .or(
        frame.locator(
          'input[placeholder*="mobile" i], input[placeholder="Mobile number"], input[name*="contact" i], input[type="tel"]',
        ),
      )
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

  private razorpayContactInput(frame: FrameLocator): Locator {
    return frame
      .getByTestId('contactNumber')
      .or(frame.locator('#contact'))
      .or(
        frame.locator(
          'input[placeholder*="mobile" i], input[placeholder="Mobile number"], input[name*="contact" i], input[type="tel"]',
        ),
      )
      .first();
  }

  private razorpayContactContinueButton(frame: FrameLocator): Locator {
    return frame
      .getByRole('button', { name: /^continue$/i })
      .or(frame.locator('button[validateform="true"], button[name="button"]').filter({ hasText: /^Continue$/i }))
      .first();
  }

  /** Contact overlay open while payment options (e.g. Netbanking) are visible behind it. */
  private async isRazorpayContactStepOpen(frame: FrameLocator): Promise<boolean> {
    const contactInput = this.razorpayContactInput(frame);
    if (await contactInput.isVisible().catch(() => false)) {
      return true;
    }
    return (
      (await frame.getByText(/contact details/i).first().isVisible().catch(() => false)) ||
      (await frame.getByText(/enter mobile.*email/i).first().isVisible().catch(() => false))
    );
  }

  private async clickRazorpayContactContinue(frame: FrameLocator): Promise<boolean> {
    if (!(await this.isRazorpayContactStepOpen(frame))) {
      return false;
    }

    const contactInput = this.razorpayContactInput(frame);
    const continueBtn = this.razorpayContactContinueButton(frame);
    await continueBtn.waitFor({ state: 'visible', timeout: 20_000 });
    await this.dismissRazorpayFeeOverlay();
    await continueBtn.click({ force: true });
    await frame.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

    if (await contactInput.isVisible().catch(() => false)) {
      const digits = (await contactInput.inputValue().catch(() => '')).replace(/\D/g, '');
      if (digits.length >= 10) {
        await continueBtn.click({ force: true }).catch(() => {});
        await frame.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
      }
    }

    await contactInput.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    return true;
  }

  /** Shop: skip Continue only when contact step is closed and Netbanking is already on screen. */
  async clickRazorpayContinueShop(): Promise<void> {
    await this.waitForRazorpayFrame();
    const frame = this.razorpayFrame();

    if (await this.clickRazorpayContactContinue(frame)) {
      return;
    }

    const netbanking = frame.locator('label').filter({ hasText: 'Netbanking' });
    if (await netbanking.isVisible().catch(() => false)) {
      return;
    }

    const continueBtn = this.razorpayContactContinueButton(frame);
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

  /**
   * Buy Now: always click Continue when contact overlay is open (do not skip because Netbanking is visible behind it).
   */
  async clickRazorpayContinueBuyNow(): Promise<void> {
    await this.waitForRazorpayFrame();
    const frame = this.razorpayFrame();

    if (await this.clickRazorpayContactContinue(frame)) {
      await this.dismissRazorpayFeeOverlay();
      return;
    }

    const continueBtn = this.razorpayContactContinueButton(frame);
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click({ force: true });
      await frame.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    }
  }

  /** @deprecated Use {@link clickRazorpayContinueShop} or {@link clickRazorpayContinueBuyNow}. */
  async clickRazorpayContinue(): Promise<void> {
    await this.clickRazorpayContinueShop();
  }

  /** Dismiss Razorpay fee-bearer / backdrop (withdrawal / Buy Now / long flows). */
  private async dismissRazorpayFeeOverlay(): Promise<void> {
    const overlayRoot = this.page.locator('[data-testid="overlay-fee-bearer"], #overlay-backdrop').first();

    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (!(await overlayRoot.isVisible().catch(() => false))) {
        return;
      }
      const inOverlay = this.page
        .locator('[data-testid="overlay-fee-bearer"]')
        .locator('button, [role="button"], a');
      const n = await inOverlay.count();
      for (let i = 0; i < n; i += 1) {
        await inOverlay.nth(i).click({ timeout: 800, force: true }).catch(() => {});
      }
      await this.page
        .getByRole('button', { name: /continue|proceed|confirm|pay now|ok|i understand|got it/i })
        .first()
        .click({ timeout: 1_000, force: true })
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
  }

  /** Withdrawal only — faster overlay dismiss (fewer retries than shop/buy-now). */
  private async dismissRazorpayFeeOverlayWithdrawal(): Promise<void> {
    const overlayRoot = this.page.locator('[data-testid="overlay-fee-bearer"], #overlay-backdrop').first();

    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (!(await overlayRoot.isVisible().catch(() => false))) {
        return;
      }
      await this.page
        .getByRole('button', { name: /continue|proceed|confirm|pay now|ok|i understand|got it/i })
        .first()
        .click({ timeout: 800, force: true })
        .catch(() => {});
      await overlayRoot.click({ position: { x: 2, y: 2 }, force: true }).catch(() => {});
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(150);
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
  }

  /** Shop: Netbanking already selected on checkout before Razorpay opens. */
  async selectNetbankingShop(): Promise<void> {
    await this.waitForRazorpayFrame();
    const frame = this.razorpayFrame();
    const netbanking = frame.locator('label').filter({ hasText: 'Netbanking' });
    await netbanking.waitFor({ state: 'visible', timeout: 20_000 });
    await netbanking.click({ force: true });
  }

  /** Digital-gold Buy Now: Razorpay opens without app-level Netbanking pre-select. */
  async selectNetbankingBuyNow(): Promise<void> {
    await this.waitForRazorpayFrame();
    await this.dismissRazorpayFeeOverlay();
    const frame = this.razorpayFrame();
    await frame.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

    const netbankingRadio = frame.getByRole('radio', { name: /Netbanking/i }).first();
    const netbankingRow = frame
      .locator('div')
      .filter({ has: frame.getByText(/^Netbanking$/i) })
      .first();
    const netbankingLabel = frame.locator('label').filter({ hasText: 'Netbanking' }).first();

    if (await netbankingRadio.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await netbankingRadio.click({ force: true });
    } else if (await netbankingRow.isVisible().catch(() => false)) {
      await netbankingRow.click({ force: true });
    } else {
      await netbankingLabel.waitFor({ state: 'visible', timeout: 20_000 });
      await netbankingLabel.click({ force: true });
    }
  }

  /** @deprecated Use {@link selectNetbankingShop} or {@link selectNetbankingBuyNow}. */
  async selectNetbanking(): Promise<void> {
    await this.selectNetbankingShop();
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
    await this.waitForRazorpayFrame();
    await this.clickRazorpayContactContinue(this.razorpayFrame());
  }

  /**
   * SIP Emandate bank picker only — uses tile/img locators + fee overlay dismiss.
   * Not used by shop, buy-now, or withdrawal netbanking flows.
   */
  private async clickRazorpayNetbankingBankEmandate(bankName: string): Promise<void> {
    await this.dismissRazorpayFeeOverlay();
    const rz = this.razorpayFrame();
    await rz.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

    const normalized = bankName.trim();
    const bankCode = normalized.replace(/\s+Bank$/i, '').trim();
    const byBankImg = rz.getByRole('img', { name: new RegExp(`^${bankCode}$`, 'i') }).first();
    const byDataValue = rz.locator(`div[role="button"][data-value="${normalized}"]`).first();
    const byText = rz
      .locator('div[role="button"]')
      .filter({ has: rz.locator('span.font-medium', { hasText: new RegExp(normalized, 'i') }) })
      .first();
    const byRoleButton = rz.getByRole('button', { name: new RegExp(normalized, 'i') }).first();
    const bank = (await byBankImg.isVisible().catch(() => false))
      ? byBankImg
      : (await byDataValue.isVisible().catch(() => false))
        ? byDataValue
        : (await byText.isVisible().catch(() => false))
          ? byText
          : (await byRoleButton.isVisible().catch(() => false))
            ? byRoleButton
            : rz.locator('div[role="button"]').first();

    await bank.waitFor({ state: 'visible', timeout: 25_000 });
    await bank.scrollIntoViewIfNeeded();
    try {
      await bank.click({ timeout: 8_000 });
    } catch {
      await bank.click({ force: true });
    }
  }

  private isRazorpayBankUnavailable(label: string): boolean {
    return /facing\s+issues|temporarily\s+unavailable|not\s+available|try\s+with\s+other\s+payment/i.test(label);
  }

  private razorpayBankCode(bankName: string): string {
    const firstLine = bankName.trim().split(/\r?\n/)[0]?.trim() || bankName.trim();
    return firstLine.replace(/\s+Bank$/i, '').trim();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async readRazorpayBankRowRawText(locator: Locator): Promise<string> {
    return ((await locator.innerText().catch(() => '')) || '').trim();
  }

  private async readRazorpayBankAccessibleName(locator: Locator): Promise<string> {
    return locator
      .evaluate((el) => {
        const aria = el.getAttribute('aria-label')?.trim();
        if (aria) {
          return aria;
        }
        const labelledBy = el.getAttribute('aria-labelledby');
        if (labelledBy) {
          const doc = el.ownerDocument;
          const labelEl = doc?.getElementById(labelledBy);
          if (labelEl?.textContent) {
            return labelEl.textContent.trim();
          }
        }
        return (el.textContent || '').trim();
      })
      .catch(() => '');
  }

  private async readRazorpayBankRowLabel(locator: Locator): Promise<string> {
    const raw = await this.readRazorpayBankRowRawText(locator);
    const collapsed = raw.replace(/\s+/g, ' ').trim();
    const firstLine = collapsed.split(/\r?\n/)[0]?.trim() || collapsed;
    return firstLine;
  }

  private async isRazorpayBankRowUsable(locator: Locator): Promise<boolean> {
    const raw = await this.readRazorpayBankRowRawText(locator);
    const accessible = await this.readRazorpayBankAccessibleName(locator);
    if (this.isRazorpayBankUnavailable(raw) || this.isRazorpayBankUnavailable(accessible)) {
      return false;
    }
    const disabled =
      (await locator.getAttribute('aria-disabled').catch(() => null)) === 'true' ||
      (await locator.getAttribute('disabled').catch(() => null)) !== null;
    return !disabled;
  }

  /** Bank rows in Razorpay netbanking list (excludes tabs like Wallet/UPI and unavailable banks). */
  private razorpayNetbankingBankTiles(frame: FrameLocator): Locator {
    return frame
      .locator('div[role="button"]')
      .filter({ has: frame.locator('span.font-medium') })
      .filter({ hasNot: frame.getByText(/facing\s+issues|try\s+with\s+other\s+payment/i) });
  }

  private async isRazorpayBankTile(locator: Locator): Promise<boolean> {
    const hasBankLabel = await locator
      .locator('span.font-medium')
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false);
    const hasBankImg = await locator
      .locator('img')
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false);
    return hasBankLabel || hasBankImg;
  }

  private async clickRazorpayBankRow(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: 10_000 });
    await locator.scrollIntoViewIfNeeded().catch(() => {});

    const roleButtonAncestor = locator.locator('xpath=ancestor-or-self::*[@role="button"][1]').first();
    const innerLabel = locator.locator('span.font-medium').first();
    const innerImg = locator.locator('img').first();

    const targets: Locator[] = [];
    for (const candidate of [innerLabel, innerImg, roleButtonAncestor, locator]) {
      if ((await candidate.count().catch(() => 0)) > 0) {
        targets.push(candidate);
      }
    }

    const runClickStrategies = async (target: Locator): Promise<boolean> => {
      const strategies: Array<() => Promise<void>> = [
        () => target.click({ timeout: 4_000 }),
        () => target.click({ force: true, timeout: 4_000 }),
        async () => {
          await target.dispatchEvent('click');
        },
        async () => {
          const box = await target.boundingBox();
          if (!box) {
            throw new Error('No bounding box for bank row');
          }
          await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        },
        async () => {
          await target.evaluate((el) => {
            if (typeof (el as { click?: () => void }).click === 'function') {
              (el as { click: () => void }).click();
            }
          });
        },
      ];

      for (const click of strategies) {
        try {
          await click();
          return true;
        } catch {
          /* try next strategy */
        }
      }
      return false;
    };

    for (const target of targets) {
      if (await runClickStrategies(target)) {
        return;
      }
    }

    throw new Error('Could not click Razorpay netbanking bank row');
  }

  private async enumerateUsableRazorpayBanks(
    frame: FrameLocator,
  ): Promise<Array<{ locator: Locator; selectedName: string }>> {
    await frame.locator('text=Suggested Banks').waitFor({ state: 'visible', timeout: 6_000 }).catch(() => {});
    const onNetbanking =
      (await frame.locator('text=Suggested Banks').isVisible({ timeout: 500 }).catch(() => false)) ||
      (await this.razorpayNetbankingBankTiles(frame).first().isVisible({ timeout: 500 }).catch(() => false));
    if (!onNetbanking) {
      await frame.locator('text=Netbanking').first().click({ timeout: 2_000 }).catch(() => {});
    }

    const banks = this.razorpayNetbankingBankTiles(frame);
    const count = await banks.count();
    const usable: Array<{ locator: Locator; selectedName: string }> = [];

    for (let i = 0; i < count; i += 1) {
      const candidate = banks.nth(i);
      const picked = await this.tryRazorpayBankCandidate(candidate, '');
      if (!picked?.selectedName) {
        continue;
      }
      if (/continue|netbanking|upi|card|wallet|view all|fee breakup|pay now/i.test(picked.selectedName)) {
        continue;
      }
      usable.push(picked);
    }

    return usable;
  }

  private async tryRazorpayBankCandidate(
    locator: Locator,
    fallbackName: string,
  ): Promise<{ locator: Locator; selectedName: string } | null> {
    if (!(await locator.isVisible({ timeout: 600 }).catch(() => false))) {
      return null;
    }
    if (!(await this.isRazorpayBankRowUsable(locator))) {
      return null;
    }
    if (!(await this.isRazorpayBankTile(locator))) {
      return null;
    }
    const label = await this.readRazorpayBankRowLabel(locator);
    return { locator, selectedName: label || fallbackName };
  }

  private async resolveFirstAvailableRazorpayBank(
    frame: FrameLocator,
  ): Promise<{ locator: Locator; selectedName: string }> {
    const usable = await this.enumerateUsableRazorpayBanks(frame);
    if (usable.length > 0) {
      return usable[0];
    }

    throw new Error('No usable Razorpay netbanking bank found in Suggested Banks list');
  }

  /**
   * Resolve netbanking bank in Razorpay: prefer requested name (e.g. HDFC Bank), else first usable bank.
   * Skips banks marked unavailable (e.g. "facing issues") and prefers div[role="button"] rows over native buttons.
   */
  private async resolveRazorpayNetbankingBank(
    bankName: string,
    frame: FrameLocator,
  ): Promise<{ locator: Locator; selectedName: string } | null> {
    const normalized = bankName.trim().split(/\r?\n/)[0]?.trim() || bankName.trim();
    const bankCode = this.razorpayBankCode(normalized);
    const namePattern = new RegExp(this.escapeRegExp(normalized), 'i');
    const codePattern = new RegExp(`^${this.escapeRegExp(bankCode)}$`, 'i');

    const byBankImg = frame.getByRole('img', { name: codePattern }).first();
    if (await byBankImg.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const row = byBankImg.locator('xpath=ancestor::div[@role="button"][1]').first();
      const picked = await this.tryRazorpayBankCandidate(row, normalized);
      if (picked) {
        return picked;
      }
    }

    const byDataValue = frame.locator(`div[role="button"][data-value="${normalized}"]`).first();
    const pickedData = await this.tryRazorpayBankCandidate(byDataValue, normalized);
    if (pickedData) {
      return pickedData;
    }

    const byDiv = this.razorpayNetbankingBankTiles(frame)
      .filter({ has: frame.locator('span.font-medium', { hasText: namePattern }) })
      .first();
    const pickedDiv = await this.tryRazorpayBankCandidate(byDiv, normalized);
    if (pickedDiv) {
      return pickedDiv;
    }

    console.log(`[Razorpay] "${normalized}" not available; will pick from bank list`);
    return null;
  }

  /**
   * Withdrawal/jewellery netbanking bank select — returns the bank name actually clicked.
   */
  private async clickRazorpayNetbankingBankWithdrawal(
    bankName: string,
    frame: FrameLocator,
  ): Promise<string> {
    const requested = bankName.trim().split(/\r?\n/)[0]?.trim() || bankName.trim();
    const namePattern = new RegExp(this.escapeRegExp(requested), 'i');

    const ordered: Array<{ locator: Locator; selectedName: string }> = [];
    const preferred = await this.resolveRazorpayNetbankingBank(bankName, frame).catch(() => null);
    if (preferred) {
      ordered.push(preferred);
    }

    const listUsableBanks = async (): Promise<void> => {
      const candidates = await this.enumerateUsableRazorpayBanks(frame);
      for (const bank of candidates) {
        if (ordered.some((item) => item.selectedName === bank.selectedName)) {
          continue;
        }
        ordered.push(bank);
      }
    };

    if (ordered.length === 0) {
      await listUsableBanks();
    }

    if (ordered.length === 0) {
      throw new Error('No usable Razorpay netbanking bank found');
    }

    const tryClickBanks = async (
      banks: Array<{ locator: Locator; selectedName: string }>,
    ): Promise<string | null> => {
      const tried = new Set<string>();
      for (const { locator, selectedName } of banks) {
        if (tried.has(selectedName)) {
          continue;
        }
        tried.add(selectedName);

        if (!namePattern.test(selectedName)) {
          console.log(`[Razorpay withdrawal] Requested "${requested}" → trying "${selectedName}"`);
        }

        try {
          await this.clickRazorpayBankRow(locator);
          console.log(`[Razorpay withdrawal] Selected bank: "${selectedName}"`);
          return selectedName;
        } catch (error) {
          console.warn(
            `[Razorpay withdrawal] Click failed for "${selectedName}" (${error instanceof Error ? error.message : String(error)})`,
          );
        }
      }
      return null;
    };

    let picked = await tryClickBanks(ordered);
    if (picked) {
      return picked;
    }

    await listUsableBanks();
    picked = await tryClickBanks(ordered);
    if (picked) {
      return picked;
    }

    throw new Error('Could not click any usable Razorpay netbanking bank');
  }

  /**
   * Withdrawal netbanking only — clicks "Continue & Pay" when present (short poll, no long waitFor).
   */
  private async clickWithdrawalRazorpayContinueAndPayIfVisible(
    frame: FrameLocator,
    options?: {
      dismissOverlay?: () => Promise<void>;
      pollMs?: number;
      clickAttempts?: number;
    },
  ): Promise<boolean> {
    const dismissOverlay = options?.dismissOverlay ?? (() => this.dismissRazorpayFeeOverlayWithdrawal());
    const pollMs = options?.pollMs ?? 2_500;
    const clickAttempts = options?.clickAttempts ?? 2;

    await dismissOverlay();

    const label = /Continue\s*(?:and|&)\s*Pay/i;
    const continueAndPay = frame
      .getByRole('button', { name: label })
      .or(frame.getByRole('button', { name: 'Continue & Pay', exact: true }))
      .or(frame.locator('button, [role="button"], a, div[role="button"]').filter({ hasText: label }))
      .or(frame.getByText(label));

    const feeBreakupOpen = await frame
      .getByText(/fee breakup/i)
      .first()
      .isVisible({ timeout: 1_500 })
      .catch(() => false);
    const target = feeBreakupOpen ? continueAndPay.last() : continueAndPay.first();

    const deadline = Date.now() + pollMs;
    let visible = false;
    while (Date.now() < deadline) {
      if (await target.isVisible({ timeout: 400 }).catch(() => false)) {
        visible = true;
        break;
      }
      await this.page.waitForTimeout(200);
    }

    if (!visible) {
      return false;
    }

    await target.scrollIntoViewIfNeeded().catch(() => {});
    for (let attempt = 0; attempt < clickAttempts; attempt += 1) {
      if (attempt > 0) {
        await dismissOverlay();
      }
      const clicked = await target
        .click({ force: true, timeout: 5_000 })
        .then(() => true)
        .catch(() => false);
      if (clicked) {
        return true;
      }
      await this.page.waitForTimeout(250);
    }

    return false;
  }

  /**
   * Withdrawal netbanking only — after bank select, poll for processing / demo-bank (no popup waitForEvent).
   */
  private async waitForWithdrawalRazorpayDemoBankOrProcessing(
    frame: FrameLocator,
    options?: { maxMs?: number },
  ): Promise<'processing' | 'popup' | 'demo-success' | 'none'> {
    const maxMs = options?.maxMs ?? 5_000;
    const deadline = Date.now() + maxMs;
    const processing = frame.getByText(/processing your payment/i).first();
    const inFrameSuccess = frame.locator('button[data-val="S"]').first();
    const inFrameFailure = frame.locator('button[data-val="F"]').first();

    while (Date.now() < deadline) {
      for (const popup of this.page.context().pages()) {
        if (popup === this.page || popup.isClosed()) {
          continue;
        }
        const demoBtn = popup
          .locator('button[data-val="S"], button[data-val="F"]')
          .or(popup.getByRole('button', { name: /^(?:success|failure)$/i }))
          .first();
        if (await demoBtn.isVisible({ timeout: 250 }).catch(() => false)) {
          return 'popup';
        }
      }

      if (await inFrameSuccess.isVisible({ timeout: 250 }).catch(() => false)) {
        return 'demo-success';
      }
      if (await inFrameFailure.isVisible({ timeout: 250 }).catch(() => false)) {
        return 'demo-success';
      }
      if (await processing.isVisible({ timeout: 250 }).catch(() => false)) {
        return 'processing';
      }

      await this.page.waitForTimeout(250);
    }

    return 'none';
  }

  /** Withdrawal netbanking only — open pages that may host Razorpay demo-bank UI. */
  private listWithdrawalRazorpayDemoBankPopups(): Page[] {
    return this.page.context().pages().filter((p) => p !== this.page && !p.isClosed());
  }

  /** Withdrawal netbanking only — quick detect of post-payment success UI (no long waitFor). */
  private async detectWithdrawalPaymentSuccessSource(): Promise<'page' | 'frame' | 'url' | null> {
    if (this.page.isClosed()) {
      return null;
    }
    try {
      if (/summary|dashboard|my-orders|success/i.test(this.page.url())) {
        return 'url';
      }
    } catch {
      return null;
    }

    const pageSuccessDialog = this.page.getByRole('dialog', { name: /success/i });
    if (await pageSuccessDialog.isVisible({ timeout: 400 }).catch(() => false)) {
      return 'page';
    }

    const razorpayFrame = this.page.frameLocator('iframe[src*="razorpay"]');
    const frameSuccess = razorpayFrame
      .getByText(/payment successful/i)
      .or(razorpayFrame.getByText(/your payment was successful/i))
      .or(razorpayFrame.getByRole('heading', { name: /payment successful/i }))
      .first();
    if (await frameSuccess.isVisible({ timeout: 400 }).catch(() => false)) {
      return 'frame';
    }

    const appSuccessText = this.page
      .getByText(/payment\s+successful|order\s+placed|thank\s+you\s+for\s+your\s+order/i)
      .first();
    if (await appSuccessText.isVisible({ timeout: 400 }).catch(() => false)) {
      return 'page';
    }

    return null;
  }

  private async isWithdrawalPaymentSuccessVisible(): Promise<boolean> {
    return (await this.detectWithdrawalPaymentSuccessSource()) !== null;
  }

  /** Withdrawal netbanking only — poll for success UI / navigation (avoids 15–60s waitFor on frame heading). */
  private async waitForWithdrawalPaymentSuccessOutcome(
    timeoutMs: number,
  ): Promise<'page' | 'frame' | 'url'> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const detected = await this.detectWithdrawalPaymentSuccessSource();
      if (detected) {
        return detected;
      }

      await this.page.waitForTimeout(200);
    }

    throw new Error(
      'Razorpay (withdrawal): success UI / navigation did not occur — check sandbox payment or extend timeouts.',
    );
  }

  /** Withdrawal netbanking only — click demo-bank Success (popup or in-frame). */
  private async confirmWithdrawalDemoBankSuccess(isTc005Mode: boolean): Promise<void> {
    const tryClickSuccess = async (p: Page | null): Promise<boolean> => {
      if (!p || p.isClosed()) {
        return false;
      }
      await p.waitForLoadState('domcontentloaded').catch(() => {});
      const byAttr = p.locator('button[data-val="S"]');
      const byRole = p.getByRole('button', { name: /^success$/i });
      if (await byAttr.first().isVisible({ timeout: 800 }).catch(() => false)) {
        if (isTc005Mode) {
          console.log('[PAYMENT SUCCESS] Clicking popup success button via data-val="S"');
        }
        await byAttr.first().click({ force: true }).catch(() => {});
        await p.waitForEvent('close', { timeout: 8_000 }).catch(() => {});
        return true;
      }
      if (await byRole.first().isVisible({ timeout: 800 }).catch(() => false)) {
        if (isTc005Mode) {
          console.log('[PAYMENT SUCCESS] Clicking popup success button via role/name');
        }
        await byRole.first().click({ force: true }).catch(() => {});
        await p.waitForEvent('close', { timeout: 8_000 }).catch(() => {});
        return true;
      }
      return false;
    };

    const rzFrame = this.page.frameLocator('iframe[src*="razorpay"]');
    const inFrameSuccess = rzFrame.locator('button[data-val="S"]');
    const clickInFrameSuccess = async (): Promise<boolean> => {
      if (!(await inFrameSuccess.isVisible({ timeout: 400 }).catch(() => false))) {
        return false;
      }
      if (isTc005Mode) {
        console.log('[PAYMENT SUCCESS] Clicking in-frame success button');
      }
      await inFrameSuccess.click({ force: true, timeout: 5_000 }).catch(() => {});
      return true;
    };

    const deadline = Date.now() + 8_000;
    while (Date.now() < deadline) {
      for (const p of this.listWithdrawalRazorpayDemoBankPopups()) {
        if (await tryClickSuccess(p)) {
          return;
        }
      }
      if (await clickInFrameSuccess()) {
        return;
      }
      await this.page.waitForTimeout(200);
    }

    await clickInFrameSuccess().catch(() => {});
  }

  /** Withdrawal netbanking only — dismiss Razorpay / app success chrome after payment. */
  private async dismissWithdrawalPaymentSuccessChrome(source: 'page' | 'frame' | 'url'): Promise<void> {
    if (source === 'url') {
      await this.page.locator('iframe[src*="razorpay"]').first().waitFor({ state: 'hidden', timeout: 12_000 }).catch(() => {});
      return;
    }

    const razorpayFrame = this.page.frameLocator('iframe[src*="razorpay"]');
    if (source === 'page') {
      await this.page
        .getByRole('dialog', { name: /success/i })
        .getByRole('button', { name: /continue/i })
        .click({ timeout: 8_000 })
        .catch(() => {});
    } else {
      await razorpayFrame
        .getByRole('button', { name: /continue|done|close/i })
        .first()
        .click({ force: true, timeout: 8_000 })
        .catch(() => {});
    }

    await Promise.any([
      this.page.locator('iframe[src*="razorpay"]').first().waitFor({ state: 'hidden', timeout: 20_000 }),
      this.page.waitForURL(/summary|dashboard|my-orders|success/i, { timeout: 20_000 }),
    ]).catch(() => {});
  }

  /** Wait for Razorpay payment-success UI, click Continue, then wait for checkout to close. */
  private async waitAndClickWithdrawalPaymentSuccess(frame: FrameLocator): Promise<void> {
    const pageSuccessDialog = this.page.getByRole('dialog', { name: /success/i });
    const frameSuccessHeading = frame
      .getByText(/payment successful/i)
      .or(frame.getByText(/your payment was successful/i))
      .first();

    const successSource = await Promise.race([
      pageSuccessDialog.waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'page' as const),
      frameSuccessHeading.waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'frame' as const),
      this.page
        .waitForURL(/summary|dashboard|my-orders|success/i, { timeout: 45_000 })
        .then(() => 'url' as const),
    ]).catch(() => {
      throw new Error(
        'Razorpay (withdrawal): success UI / navigation did not occur — check sandbox payment or extend timeouts.',
      );
    });

    if (successSource === 'page') {
      const pageContinue = pageSuccessDialog.getByRole('button', { name: /continue/i });
      await pageContinue.waitFor({ state: 'visible', timeout: 15_000 });
      await expect(pageContinue).toBeEnabled({ timeout: 10_000 });
      await pageContinue.click({ timeout: 10_000 });
    } else if (successSource === 'frame') {
      const frameContinue = frame
        .getByRole('button', { name: /continue|done|close/i })
        .or(frame.locator('button[validateform="true"]').filter({ hasText: /^Continue$/i }))
        .or(frame.locator('button').filter({ hasText: /^Continue$/i }))
        .first();
      await frameContinue.waitFor({ state: 'visible', timeout: 15_000 });
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const clicked = await frameContinue
          .click({ force: true, timeout: 8_000 })
          .then(() => true)
          .catch(() => false);
        if (clicked) {
          break;
        }
        await this.page.waitForTimeout(500);
      }
    }

    await Promise.race([
      this.page.locator('iframe[src*="razorpay"]').first().waitFor({ state: 'hidden', timeout: 30_000 }),
      this.page.waitForURL(/summary|dashboard|my-orders|success/i, { timeout: 30_000 }),
    ]).catch(() => {});
  }

  async clickOnBankByNameEmandate(bankName: string): Promise<void> {
    await this.clickRazorpayNetbankingBankEmandate(bankName);
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

  /**
   * Shop checkout: Netbanking is pre-selected on app checkout before Razorpay opens.
   */
  async completeNetbankingPaymentShop(bankName: string): Promise<void> {
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

  /** Poll demo-bank Success (popup / in-frame) until clicked or deadline. */
  private async confirmRazorpayDemoBankSuccessBuyNow(
    preOpenedPopup: Page | null,
    deadlineMs = 12_000,
  ): Promise<void> {
    const tryPopupSuccess = async (popup: Page | null): Promise<boolean> => {
      if (!popup || popup.isClosed()) {
        return false;
      }
      const successBtn = popup
        .locator('button[data-val="S"]')
        .or(popup.getByRole('button', { name: /^success$/i }))
        .first();
      if (await successBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await successBtn.click({ force: true });
        await popup.waitForEvent('close', { timeout: 15_000 }).catch(() => {});
        return true;
      }
      return false;
    };

    const tryFrameSuccess = async (): Promise<boolean> => {
      const rz = this.razorpayFrame();
      const byAttr = rz.locator('button[data-val="S"]').first();
      const byRole = rz.getByRole('button', { name: /^success$/i }).first();
      const successBtn = (await byAttr.isVisible({ timeout: 2_000 }).catch(() => false)) ? byAttr : byRole;
      if (await successBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
        await successBtn.click({ force: true });
        return true;
      }
      return false;
    };

    if (await tryPopupSuccess(preOpenedPopup)) {
      return;
    }

    const deadline = Date.now() + deadlineMs;
    while (Date.now() < deadline) {
      for (const popup of this.page.context().pages()) {
        if (popup !== this.page && (await tryPopupSuccess(popup))) {
          return;
        }
      }
      if (await tryFrameSuccess()) {
        return;
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        break;
      }
      const latePopup = await this.page
        .waitForEvent('popup', { timeout: Math.min(8_000, remaining) })
        .catch(() => null);
      if (await tryPopupSuccess(latePopup)) {
        return;
      }
      await this.page.waitForTimeout(400);
    }
  }

  /**
   * Wait for Razorpay payment-success UI, click Continue, then wait for checkout to close.
   */
  private async waitAndClickBuyNowPaymentSuccess(frame: FrameLocator): Promise<void> {
    const pageSuccessDialog = this.page.getByRole('dialog', { name: /success/i });
    const frameSuccessHeading = frame
      .getByText(/payment successful/i)
      .or(frame.getByText(/your payment was successful/i))
      .first();

    const successSource = await Promise.race([
      pageSuccessDialog.waitFor({ state: 'visible', timeout: 25_000 }).then(() => 'page' as const),
      frameSuccessHeading.waitFor({ state: 'visible', timeout: 25_000 }).then(() => 'frame' as const),
    ]).catch(() => 'frame' as const);

    if (successSource === 'page') {
      const pageContinue = pageSuccessDialog.getByRole('button', { name: /continue/i });
      await pageContinue.waitFor({ state: 'visible', timeout: 15_000 });
      await expect(pageContinue).toBeEnabled({ timeout: 10_000 });
      await pageContinue.click({ timeout: 10_000 });
    } else {
      const frameContinue = frame
        .getByRole('button', { name: /continue|done|close/i })
        .or(frame.locator('button[validateform="true"]').filter({ hasText: /^Continue$/i }))
        .or(frame.locator('button').filter({ hasText: /^Continue$/i }))
        .first();
      await frameContinue.waitFor({ state: 'visible', timeout: 15_000 });
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const clicked = await frameContinue
          .click({ force: true, timeout: 8_000 })
          .then(() => true)
          .catch(() => false);
        if (clicked) {
          break;
        }
        await this.page.waitForTimeout(500);
      }
    }

    await Promise.race([
      this.page.locator('iframe[src*="razorpay"]').first().waitFor({ state: 'hidden', timeout: 30_000 }),
      this.page.waitForURL(/summary|dashboard|my-orders|digital-gold|success/i, { timeout: 30_000 }),
    ]).catch(() => {});
  }

  /**
   * Digital-gold Buy Now: HDFC Bank → demo Success → payment-success Continue → leave Razorpay.
   */
  async completeNetbankingPaymentBuyNow(bankName: string): Promise<void> {
    await this.waitForRazorpayFrame();
    await this.dismissRazorpayFeeOverlay();
    const frame = this.razorpayFrame();
    await frame.locator('#overlay-backdrop').waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});

    const normalized = bankName.trim();
    const bankButton = frame.getByRole('button', { name: new RegExp(normalized, 'i') }).first();
    await bankButton.waitFor({ state: 'visible', timeout: 20_000 });
    await bankButton.scrollIntoViewIfNeeded();

    let bankPopup: Page | null = null;
    try {
      [bankPopup] = await Promise.all([
        this.page.waitForEvent('popup', { timeout: 10_000 }),
        bankButton.click({ force: true }),
      ]);
    } catch {
      await bankButton.click({ force: true });
    }

    const continueAndPay = frame
      .getByRole('button', { name: /Continue\s*(?:and|&)\s*Pay/i })
      .or(frame.locator('button').filter({ hasText: /Continue\s*(?:and|&)\s*Pay/i }))
      .first();
    if (await continueAndPay.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.dismissRazorpayFeeOverlay();
      await continueAndPay.click({ force: true }).catch(() => {});
    }

    await Promise.race([
      frame.getByText(/processing your payment/i).first().waitFor({ state: 'visible', timeout: 15_000 }),
      this.page.waitForEvent('popup', { timeout: 10_000 }).then(() => {}),
    ]).catch(() => {});

    await this.confirmRazorpayDemoBankSuccessBuyNow(bankPopup);
    await this.confirmRazorpayDemoBankSuccessBuyNow(null);

    await this.waitAndClickBuyNowPaymentSuccess(frame);
  }

  /** @deprecated Use {@link completeNetbankingPaymentShop} or {@link completeNetbankingPaymentBuyNow}. */
  async completeNetbankingPayment(bankName: string): Promise<void> {
    await this.completeNetbankingPaymentShop(bankName);
  }

  /**
   * Withdrawal/jewellery netbanking (main-branch flow): overlay → bank → Continue & Pay → demo Success.
   * Uses {@link clickRazorpayNetbankingBankWithdrawal} when the requested bank is not listed.
   */
  async completeNetbankingPaymentWithdrwal(
    bankName: string,
    options?: { tc005Mode?: boolean },
  ): Promise<void> {
    const isTc005Mode = options?.tc005Mode === true;
    const frame = this.page.frameLocator('iframe[src*="razorpay"]');
    const dismissOverlay = (): Promise<void> => this.dismissRazorpayFeeOverlayWithdrawal();

    await dismissOverlay();
    await this.clickRazorpayNetbankingBankWithdrawal(bankName.trim(), frame);

    const continueClicked = await this.clickWithdrawalRazorpayContinueAndPayIfVisible(frame, {
      dismissOverlay,
      pollMs: 4_000,
      clickAttempts: 2,
    });

    await this.waitForWithdrawalRazorpayDemoBankOrProcessing(frame, {
      maxMs: continueClicked ? 8_000 : 4_000,
    });
    await this.confirmWithdrawalDemoBankSuccess(isTc005Mode);

    if (!(await this.isWithdrawalPaymentSuccessVisible())) {
      await this.clickWithdrawalRazorpayContinueAndPayIfVisible(frame, {
        dismissOverlay,
        pollMs: 2_000,
        clickAttempts: 1,
      });
      await this.waitForWithdrawalRazorpayDemoBankOrProcessing(frame, { maxMs: 5_000 });
      await this.confirmWithdrawalDemoBankSuccess(isTc005Mode);
    }

    const source = await this.waitForWithdrawalPaymentSuccessOutcome(12_000);
    await this.dismissWithdrawalPaymentSuccessChrome(source);
    await this.page
      .locator('iframe[src*="razorpay"]')
      .first()
      .waitFor({ state: 'hidden', timeout: 8_000 })
      .catch(() => {});
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
    const FAILURE_CLICK_DEADLINE_MS = 30_000;

    const dismissOverlay = (): Promise<void> => this.dismissRazorpayFeeOverlayWithdrawal();

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
        for (const p of this.listWithdrawalRazorpayDemoBankPopups()) {
          if (await tryClickFailureInPopup(p)) return true;
        }

        if (await tryInFrameFailure(rzFrame)) return true;

        await sleepMs(250);
      }
      return false;
    };

    const frame = this.page.frameLocator('iframe[src*="razorpay"]');

    await dismissOverlay();
    await this.clickRazorpayNetbankingBankWithdrawal(bankName.trim(), frame);

    await this.clickWithdrawalRazorpayContinueAndPayIfVisible(frame, {
      dismissOverlay,
      pollMs: 2_500,
      clickAttempts: 2,
    });

    await this.waitForWithdrawalRazorpayDemoBankOrProcessing(frame, { maxMs: 5_000 });

    const failureClicked = await pollForFailureClick(null, frame, FAILURE_CLICK_DEADLINE_MS);
    if (!failureClicked) {
      throw new Error(
        `Razorpay (withdrawal failure): demo-bank Failure button was not found / clickable within ${FAILURE_CLICK_DEADLINE_MS / 1000}s.`,
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
