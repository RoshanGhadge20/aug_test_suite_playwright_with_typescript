import { expect, type Locator } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import { getShopDataset } from '../../utils/data/customer-excel-data';

/**
 * Redeem admin wallet-gift coupon (`giftOnWalletAmt`) from My Profile → APPLY COUPON.
 */
export class WalletGiftCouponPage extends BasePage {
  private applyCouponButton(): Locator {
    return this.page.getByRole('button', { name: /^apply coupon$/i });
  }

  private couponDialog(): Locator {
    return this.page
      .locator('[role="dialog"], .p-dialog, p-dialog')
      .filter({ has: this.page.getByText(/coupon/i) })
      .first();
  }

  private codeInput(): Locator {
    const dialog = this.couponDialog();
    return dialog
      .getByPlaceholder(/coupon|code|enter/i)
      .or(dialog.locator('input[type="text"], input.p-inputtext'))
      .first();
  }

  private proceedButton(): Locator {
    return this.page.getByRole('button', { name: /^proceed$/i });
  }

  private payZeroButton(): Locator {
    return this.page.getByRole('button', { name: /pay/i }).filter({ hasText: /₹\s*0/ });
  }

  /** My Profile → APPLY COUPON → summary → Proceed → OTP/Pay ₹0 → success. */
  async redeem(code: string): Promise<void> {
    await this.goto('/my-profile');
    await expect(this.page).toHaveURL(/my-profile/);

    await this.applyCouponButton().click();
    const dialog = this.couponDialog();
    await dialog.waitFor({ state: 'visible', timeout: 15_000 });

    const input = this.codeInput();
    await input.waitFor({ state: 'visible', timeout: 15_000 });
    await input.fill(code);

    await dialog
      .getByRole('button', { name: /apply|redeem|submit|confirm/i })
      .first()
      .click();

    await this.expectCouponSummary(code);
    await this.proceedButton().click();
    await this.completeCouponRedemption();
  }

  private async expectCouponSummary(code: string): Promise<void> {
    await expect(this.page).toHaveURL(/coupon-summary/i, { timeout: 15_000 });
    await expect(this.page.getByText(new RegExp(`coupon code\\s+${code}`, 'i')).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(this.page.getByText(/coupon benefit/i).first()).toBeVisible({ timeout: 15_000 });
  }

  private async completeCouponRedemption(): Promise<void> {
    const otpPrompt = this.page.getByText(/otp sent|enter otp|verify otp/i).first();
    if (await otpPrompt.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await this.fillOtp(getShopDataset().otp);
      const verify = this.page.getByRole('button', { name: /verify|submit|proceed|confirm/i }).first();
      if (await verify.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await verify.click();
      }
    }

    if (await this.payZeroButton().isVisible({ timeout: 10_000 }).catch(() => false)) {
      await this.payZeroButton().click();
    }

    const success = this.page
      .getByRole('dialog')
      .filter({ hasText: /success/i })
      .or(this.page.getByText(/successfully|redeemed|credited|purchase successful/i))
      .first();
    await expect(success).toBeVisible({ timeout: 30_000 });

    const dismiss = this.page.getByRole('button', { name: /continue|ok|done|close/i }).first();
    if (await dismiss.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await dismiss.click();
    }
  }
}
