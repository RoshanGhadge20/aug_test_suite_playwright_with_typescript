import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import { shopLogGet } from '../../utils/test/shop-log';
import { getShopDataset } from '../../utils/data/customer-excel-data';

export type OrderCancelledDialogDetails = {
  message: string;
};

const DEFAULT_CANCELLATION_REASON = 'Test automation cancellation (AT-1642)';

/**
 * Shop EMI cancel-booking form on `/shop-new/cancel-booking/{id}` (AT-1642 / TC_SHOP_009).
 * Summary breakdown lives in {@link CancellationSummaryPage}; this page covers reason → OTP → bank → submit.
 */
export class ShopCancelBookingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private cancelBookingForm(): Locator {
    return this.page
      .locator('form, div')
      .filter({ has: this.page.getByRole('button', { name: /^cancel order$/i }) })
      .last();
  }

  private cancellationReasonInput(): Locator {
    return this.page.locator('input#reason');
  }

  private generateOtpButton(): Locator {
    return this.page
      .locator('app-button')
      .filter({ has: this.page.locator('span.p-button-label', { hasText: /^Generate OTP$/i }) })
      .locator('button.p-button')
      .first();
  }

  private cancelOrderButton(): Locator {
    return this.page.getByRole('button', { name: /^cancel order$/i });
  }

  private bookingCancelledDialog(): Locator {
    return this.page
      .locator('.p-dialog')
      .filter({ has: this.page.locator('.p-dialog-title', { hasText: /^Booking Cancelled$/i }) });
  }

  private bookingCancelledContinueButton(): Locator {
    return this.bookingCancelledDialog()
      .locator('app-button')
      .filter({ has: this.page.locator('span.p-button-label', { hasText: /^Continue$/i }) })
      .locator('button.p-button');
  }

  protected otpInputLocator(): Locator {
    return this.cancelBookingForm()
      .locator('p-inputotp input[maxlength="1"]')
      .or(this.page.locator('p-inputotp input[maxlength="1"]'))
      .or(this.page.locator('input[autocomplete="one-time-code"]'));
  }

  private bankAccountRadio(): Locator {
    return this.page.locator('label[for="Bank Account"]');
  }

  async enterCancellationReason(reason = DEFAULT_CANCELLATION_REASON): Promise<void> {
    const input = this.cancellationReasonInput();
    await input.waitFor({ state: 'visible', timeout: 20_000 });
    await input.fill(reason);
    await input.blur();
    shopLogGet('Cancellation reason', reason);
  }

  async clickGenerateOtp(): Promise<void> {
    const button = this.generateOtpButton();
    await expect(button, 'Generate OTP enabled after reason').toBeEnabled({ timeout: 15_000 });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await this.otpInputLocator()
      .first()
      .waitFor({ state: 'visible', timeout: 20_000 });
    shopLogGet('Generate OTP', 'clicked');
  }

  async fillCancellationOtp(otp = getShopDataset().otp): Promise<void> {
    await this.fillOtp(otp);
    shopLogGet('Cancellation OTP', otp);
  }

  async selectRefundBankAccount(): Promise<void> {
    const radio = this.bankAccountRadio();
    await radio.click();
    shopLogGet('Bank Account', 'selected');
  }

  async clickCancelOrder(): Promise<void> {
    const button = this.cancelOrderButton();
    await button.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(button).toBeVisible({ timeout: 10_000 });
    await expect(button).toBeEnabled({ timeout: 10_000 });
    await button.click();
    shopLogGet('Cancel Order', 'clicked');
  }

  async getOrderCancelledMessage(): Promise<OrderCancelledDialogDetails> {
    const dialog = this.bookingCancelledDialog();
    await dialog.waitFor({ state: 'visible', timeout: 30_000 });

    const message =
      (
        await dialog.locator('app-dialog div.text-16.font-gilroy').first().textContent()
      )?.trim() ?? '';

    const details = { message };
    shopLogGet('Booking cancelled message', message);
    return details;
  }

  async validateOrderCancelledMessage(): Promise<OrderCancelledDialogDetails> {
    const details = await this.getOrderCancelledMessage();
    expect(details.message).toMatch(/successfully cancelled/i);
    return details;
  }

  async clickContinueAfterOrderCancelled(): Promise<void> {
    const button = this.bookingCancelledContinueButton();
    await button.waitFor({ state: 'visible', timeout: 15_000 });
    await button.click();
    await this.bookingCancelledDialog().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});

    shopLogGet('Continue', 'clicked');
  }
}
