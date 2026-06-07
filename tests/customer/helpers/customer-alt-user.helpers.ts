import * as fs from 'fs';
import * as path from 'path';
import { expect, type Page } from '@playwright/test';
import { storageStatePath } from '../../../config/constants';
import { getTargetEnv } from '../../../config/environments';
import { panelCreds } from '../../../config/urls';
import type { ShopCheckoutPriceDetailsWithSavings } from '../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../pages/customer/my-order-verification.page';

// ---------------------------------------------------------------------------
// Alt customer credentials (buy-metal TC005, etc.) — not used by TC_SHOP_004 (main panel user)
// Override mobile: TC005_CUSTOMER_USER_MOBILE or ALT_CUSTOMER_MOBILE
// ---------------------------------------------------------------------------

export const DEFAULT_ALT_CUSTOMER_MOBILE = '8141122222';

export function resolveAltCustomerMobile(): string {
  const fromEnv =
    process.env.ALT_CUSTOMER_MOBILE?.trim() || process.env.TC005_CUSTOMER_USER_MOBILE?.trim();
  return fromEnv || DEFAULT_ALT_CUSTOMER_MOBILE;
}

export function resolveAltCustomerOtp(): string {
  const otp = panelCreds('customer', getTargetEnv()).otp;
  if (!otp) {
    throw new Error(
      `Missing customer OTP in env for ${getTargetEnv().toUpperCase()} (e.g. UAT_CUSTOMER_USER_OTP).`,
    );
  }
  return otp;
}

// ---------------------------------------------------------------------------
// Test logging & session
// ---------------------------------------------------------------------------

export function logValidation(label: string, actual: unknown, expected: unknown): void {
  console.log(`[VALIDATION] ${label} | actual: ${String(actual)} | expected: ${String(expected)}`);
}

const kycUrlPattern = /\/kyc(?:\/|$|\?)/i;

function targetPathRegex(targetPath: string): RegExp {
  const normalized = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  if (normalized === '/dashboard') {
    return /\/dashboard(?:\/|$|\?)/i;
  }
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
}

/**
 * After login/navigation, app may briefly land on /kyc. Retry target once with short waits
 * (no fixed sleep). Returns final URL for callers to assert.
 */
export async function waitAndRetryIfKycRedirect(page: Page, targetPath: string): Promise<string> {
  if (!kycUrlPattern.test(page.url())) {
    return page.url();
  }

  const normalizedTarget = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const targetRegex = targetPathRegex(normalizedTarget);
  const gotoTimeoutMs = 8_000;
  const targetUrlTimeoutMs = 4_000;

  await page.waitForLoadState('domcontentloaded').catch(() => {});

  await page.goto(normalizedTarget, { waitUntil: 'domcontentloaded', timeout: gotoTimeoutMs });

  try {
    await page.waitForURL(targetRegex, { timeout: targetUrlTimeoutMs, waitUntil: 'domcontentloaded' });
    return page.url();
  } catch {
    // Still on KYC or another interim route — one quick retry.
  }

  if (kycUrlPattern.test(page.url())) {
    await page
      .waitForURL((u) => !kycUrlPattern.test(u.toString()), {
        timeout: 2_000,
        waitUntil: 'domcontentloaded',
      })
      .catch(() => {});
    await page
      .goto(normalizedTarget, { waitUntil: 'domcontentloaded', timeout: gotoTimeoutMs })
      .catch(() => {});
    await page
      .waitForURL(targetRegex, { timeout: targetUrlTimeoutMs, waitUntil: 'domcontentloaded' })
      .catch(() => {});
  }

  return page.url();
}

/** Clear cookies + web storage so a fresh OTP login can replace project storageState. */
export async function clearCustomerBrowserStorage(page: Page): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.context().clearCookies();
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page
    .locator("input[placeholder*='Mobile'], input[placeholder*='Phone'], input[name*='mobile' i], input[type='tel']")
    .first()
    .waitFor({ state: 'visible', timeout: 8_000 })
    .catch(() => {});
}

/**
 * Write the active browser session to `storage/<env>/customer.json` so later tests
 * in the same Playwright run load the JWT from TC_005 (or any fresh login), not the
 * pre-run auth-setup token that UAT may invalidate on re-login.
 */
export async function persistCustomerStorageState(page: Page): Promise<void> {
  const storagePath = storageStatePath(getTargetEnv(), 'customer');
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  await page.context().storageState({ path: storagePath });
  console.log(`[customer session] Persisted storage state to ${storagePath}`);
}

// ---------------------------------------------------------------------------
// Shop checkout with Use Savings (TC_SHOP_004)
// ---------------------------------------------------------------------------

/** metal + making & delivery + tax − savings − paid from funds */
export function calculateShopCheckoutGrandTotalWithSavings(
  price: ShopCheckoutPriceDetailsWithSavings,
): number {
  return Number(
    (
      price.metalPrice +
      price.makingAndDeliveryCharges +
      price.tax -
      price.savings -
      price.paidFromFunds
    ).toFixed(2),
  );
}

/** Asserts UI Grand Total matches the savings-inclusive checkout formula. */
export function expectShopCheckoutGrandTotalWithSavings(
  price: ShopCheckoutPriceDetailsWithSavings,
  cartSavingsAmount: number,
): number {
  const calculated = calculateShopCheckoutGrandTotalWithSavings(price);
  expect(price.savings).toBe(cartSavingsAmount);
  expect(price.paidFromFunds).toBe(0);
  expect(calculated).toBeCloseTo(price.grandTotal, 2);
  return calculated;
}

/** My Orders SHOP list — product name, line amount, order id only. */
export function expectShopOrderListMainFields(
  order: MyOrderShopCardDetails,
  expected: { productName: string; priceAmount: number; orderId: string },
): void {
  expect(order.productName).toContain(expected.productName);
  expect(order.priceAmount).toBe(expected.priceAmount);
  expect(order.orderId).toBe(expected.orderId);
}

/** View Detail — product name, amount, order id only. */
export function expectShopOrderDetailMainFields(
  detail: { productName: string; priceAmount: number },
  orderMeta: { orderId: string },
  expected: { productName: string; priceAmount: number; orderId: string },
): void {
  expect(detail.productName).toContain(expected.productName);
  expect(detail.priceAmount).toBe(expected.priceAmount);
  expect(orderMeta.orderId).toBe(expected.orderId);
}

/** Invoice PDF — order ref, product name, net payable only. */
export function expectShopInvoiceMainFields(
  pdf: { hasOrderId: boolean; hasProduct: boolean; netPayable: number },
  expected: { orderId: string; productName: string; netPayable: number },
): void {
  expect(pdf.hasOrderId).toBe(true);
  expect(pdf.hasProduct).toBe(true);
  expect(Math.abs(pdf.netPayable - expected.netPayable)).toBeLessThanOrEqual(1);
  expect(expected.orderId).toMatch(/^\d+$/);
  expect(expected.productName.length).toBeGreaterThan(0);
}
