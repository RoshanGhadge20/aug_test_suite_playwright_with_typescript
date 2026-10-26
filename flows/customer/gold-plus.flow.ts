import type { Page } from '@playwright/test';
import { PaymentPage } from '../../pages/customer/payment.page';

export interface GoldPlusSubscriptionOptions {
  /** Weight chip on /gold-plus, e.g. '10 g' (live label; was '10gm'). */
  weightTab: string;
  /** EMI tenure — matches the row's real `label[for]`/input `id`, e.g. '3 months' (confirmed live). */
  emiTenure: string;
  contactNumber: string;
  bankName: string;
}

/**
 * Subscribes to a Gold Plus plan via EMI + netbanking. No page object exists for Gold Plus yet
 * (confirmed — see project_goalwisesip_flows memory), so this drives it directly with
 * role/text-based locators per the exact live steps: weight tab -> Proceed -> EMI tenure radio ->
 * Proceed -> Netbanking -> Terms & Conditions checkbox -> Pay -> Razorpay netbanking.
 * Assumes the caller is already logged in and KYC-verified.
 */
export async function subscribeToGoldPlusWithEmi(
  page: Page,
  options: GoldPlusSubscriptionOptions,
): Promise<void> {
  const paymentPage = new PaymentPage(page);

  await page.goto('/gold-plus');
  await page.waitForLoadState('domcontentloaded');

  await page.getByText(options.weightTab, { exact: true }).click();
  await page.getByRole('button', { name: /^Proceed$/i }).click();

  // "Choose your EMI plan" modal — each row is a radio named "<tenure> ₹<amount>/month", e.g.
  // "3 months ₹43,624.44/month" (confirmed live 2026-10-26; the old <label for="3 months"> is gone).
  const emiDialog = page.getByRole('dialog', { name: /Choose your EMI plan/i });
  await emiDialog.waitFor({ state: 'visible', timeout: 10_000 });
  const tenureRadio = emiDialog.getByRole('radio', { name: new RegExp(`^${options.emiTenure}\\b`, 'i') });
  await tenureRadio.waitFor({ state: 'visible', timeout: 10_000 });
  await tenureRadio.click();
  // Scoped to the dialog — the page behind it still has its own "Proceed" button, so an
  // unscoped locator matches two elements (confirmed live).
  await emiDialog.getByRole('button', { name: /^Proceed$/i }).click();

  // Same hidden-native-input + real <label for="..."> pattern as the EMI tenure rows above
  // (confirmed live: id="Netbanking" input, "element is not visible").
  await page.locator('label[for="Netbanking"]').click();

  // Real label is "Terms & Conditions" (ampersand, not "and") and it's a button that navigates to
  // a separate page (breadcrumb Home / Gold Plus / Terms And Condition), not a modal — confirmed
  // live. The checkbox text is "I've read and accepted the Terms & Conditions.", not "I have read".
  await page.getByRole('button', { name: /Terms\s*(&|and)\s*Conditions?/i }).click();
  await page.getByRole('checkbox', { name: /read and accepted/i }).check();

  await page.getByRole('button', { name: /^Pay/i }).click();

  await paymentPage.waitForRazorpayFrame();
  await paymentPage.fillContactNumber(options.contactNumber);
  await paymentPage.clickRazorpayContinueBuyNow();
  await paymentPage.selectNetbankingBuyNow();
  try {
    await paymentPage.completeNetbankingPaymentBuyNow(options.bankName);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Confirmed live: the payment actually succeeds ("Payment successful" reached, demo-bank
    // success clicked) and Gold Plus auto-redirects straight to /dashboard, without the
    // post-success "Continue" button the generic Buy Now flow waits for. Only swallow this exact
    // failure mode, and only once we've actually landed on /dashboard.
    if (!/Continue button never appeared/i.test(message) || !/\/dashboard/i.test(page.url())) {
      throw error;
    }
  }
}
