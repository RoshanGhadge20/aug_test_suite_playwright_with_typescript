import { expect, type Page } from '@playwright/test';
import { digitalGoldRatesUrl } from '../../../config/urls';
import { getTargetEnv } from '../../../config/environments';
import { panelCreds } from '../../../config/urls';
import type { DashBoardPage } from '../../../pages/customer/dashboard.page';
import type { ShopCheckoutPriceDetailsWithSavings } from '../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../pages/customer/my-order-verification.page';

// ---------------------------------------------------------------------------
// Alt customer credentials (buy-metal TC005, shop TC_SHOP_004)
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

// ---------------------------------------------------------------------------
// Dashboard portfolio (digital-gold spot rates API)
// ---------------------------------------------------------------------------

export type DigitalMetalSpotRates = { gBuy: number; gSell: number; sBuy: number; sSell: number };

function parseDigitalMetalSpotRatesFromPayload(payload: unknown): DigitalMetalSpotRates {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error(`Invalid digital-gold rates response (not an object): ${String(payload)}`);
  }
  const root = payload as Record<string, unknown>;
  const rate = root.rate as Record<string, unknown> | undefined;
  const rates = rate?.rates as Record<string, unknown> | undefined;
  if (!rates) {
    throw new Error(`Could not find rate.rates in response: ${JSON.stringify(payload)}`);
  }
  const parseNum = (raw: unknown, label: string): number => {
    if (raw === undefined || raw === null) {
      throw new Error(`Missing ${label} in rates.rates`);
    }
    const n = Number(String(raw).replace(/,/g, ''));
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(`Invalid ${label} value: ${String(raw)}`);
    }
    return n;
  };
  const gBuy = parseNum(rates.gBuy ?? rates.gbuy, 'gBuy');
  const gSell = parseNum(rates.gSell ?? rates.gsell, 'gSell');
  const sBuy = parseNum(rates.sBuy ?? rates.sbuy, 'sBuy');
  const sSell = parseNum(rates.sSell ?? rates.ssell, 'sSell');
  return { gBuy, gSell, sBuy, sSell };
}

export async function fetchDigitalMetalSpotRates(page: Page): Promise<DigitalMetalSpotRates> {
  const ratesUrl = digitalGoldRatesUrl();
  console.log('[digital-gold/rates] GET', ratesUrl);
  const response = await page.request.get(ratesUrl, { timeout: 30_000 });
  expect(response.ok(), `digital-gold rates API failed: HTTP ${response.status()}`).toBeTruthy();
  const payload = (await response.json()) as unknown;
  const parsed = parseDigitalMetalSpotRatesFromPayload(payload);
  console.log(
    '[digital-gold/rates] gBuy:',
    parsed.gBuy,
    'gSell:',
    parsed.gSell,
    'sBuy:',
    parsed.sBuy,
    'sSell:',
    parsed.sSell,
  );
  return parsed;
}

export function portfolioFromMetalGramsAndSellRates(
  goldGrams: number,
  silverGrams: number,
  spot: DigitalMetalSpotRates,
): number {
  return Number((goldGrams * spot.gSell + silverGrams * spot.sSell).toFixed(2));
}

export type DashboardPortfolioGramExpectations = {
  expectedGoldGrams?: number;
  expectedSilverGrams?: number;
};

export type DashboardPortfolioSnapshot = {
  totalGoldGrams: number;
  totalSilverGrams: number;
  uiPortfolioInr: number;
  calculatedPortfolioInr: number;
  spot: DigitalMetalSpotRates;
};

/**
 * Dashboard portfolio check with retries (buy-metal TC005_7 pattern):
 * UI portfolio vs gold×gSell + silver×sSell, optional gram expectations.
 * When subtractFromCalculatedPortfolioInr is set (e.g. shop grand total after Use Savings),
 * expected UI = calculated − that amount.
 */
export async function assertDashboardPortfolioWithRetry(
  page: Page,
  dashboardPage: DashBoardPage,
  options: {
    logLabel: string;
    gramExpectations?: DashboardPortfolioGramExpectations;
    /** Shop savings — UI portfolio = calculated portfolio − this value (INR). */
    subtractFromCalculatedPortfolioInr?: number;
    maxAttempts?: number;
    reloadDelayMs?: number;
  },
): Promise<DashboardPortfolioSnapshot> {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await dashboardPage.waitForDashboardPortfolioSection(12_000).catch(() => {});

  const maxAttempts = options.maxAttempts ?? 6;
  const reloadDelayMs = options.reloadDelayMs ?? 5_000;
  const gram = options.gramExpectations;
  const portfolioDeduction = options.subtractFromCalculatedPortfolioInr ?? 0;
  const expectedUiPortfolio = (calculated: number): number =>
    Number((calculated - portfolioDeduction).toFixed(2));

  let snapshot: DashboardPortfolioSnapshot = {
    totalGoldGrams: 0,
    totalSilverGrams: 0,
    uiPortfolioInr: 0,
    calculatedPortfolioInr: 0,
    spot: { gBuy: 0, gSell: 0, sBuy: 0, sSell: 0 },
  };

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const spot = await fetchDigitalMetalSpotRates(page);
    const metrics = await dashboardPage.readPortfolioMetrics({ skipPortfolioWait: true });
    const calculated = portfolioFromMetalGramsAndSellRates(
      metrics.totalGoldGrams,
      metrics.totalSilverGrams,
      spot,
    );

    snapshot = {
      totalGoldGrams: metrics.totalGoldGrams,
      totalSilverGrams: metrics.totalSilverGrams,
      uiPortfolioInr: metrics.portfolioInr,
      calculatedPortfolioInr: calculated,
      spot,
    };

    const expectedUi = expectedUiPortfolio(snapshot.calculatedPortfolioInr);
    const portfolioOk = Math.abs(snapshot.uiPortfolioInr - expectedUi) <= 2;
    const goldOk =
      gram?.expectedGoldGrams === undefined
        ? true
        : Math.abs(snapshot.totalGoldGrams - gram.expectedGoldGrams) <= 0.01;
    const silverOk =
      gram?.expectedSilverGrams === undefined
        ? true
        : Math.abs(snapshot.totalSilverGrams - gram.expectedSilverGrams) <= 0.01;

    if (portfolioOk && goldOk && silverOk && snapshot.uiPortfolioInr > 0) {
      break;
    }
    if (attempt < maxAttempts - 1) {
      await page.waitForTimeout(reloadDelayMs);
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }

  const label = options.logLabel;
  console.log(`[${label}] Total gold (g):`, snapshot.totalGoldGrams);
  console.log(`[${label}] Total silver (g):`, snapshot.totalSilverGrams);
  console.log(
    `[${label}] UI portfolio: ₹${snapshot.uiPortfolioInr} | calculated: ₹${snapshot.calculatedPortfolioInr} (gold×gSell + silver×sSell)`,
  );
  console.log(
    `[${label}] Formula: ${snapshot.totalGoldGrams}×gSell(${snapshot.spot.gSell}) + ${snapshot.totalSilverGrams}×sSell(${snapshot.spot.sSell}) = ₹${snapshot.calculatedPortfolioInr}`,
  );
  const expectedUi = expectedUiPortfolio(snapshot.calculatedPortfolioInr);
  if (portfolioDeduction > 0) {
    console.log(
      `[${label}] Expected UI = calculated − grand total: ₹${snapshot.calculatedPortfolioInr} − ₹${portfolioDeduction} = ₹${expectedUi}`,
    );
  }

  if (gram?.expectedGoldGrams !== undefined) {
    logValidation(`${label} Total gold (g)`, snapshot.totalGoldGrams, gram.expectedGoldGrams);
    expect(snapshot.totalGoldGrams).toBeCloseTo(gram.expectedGoldGrams, 2);
  }
  if (gram?.expectedSilverGrams !== undefined) {
    logValidation(`${label} Total silver (g)`, snapshot.totalSilverGrams, gram.expectedSilverGrams);
    expect(snapshot.totalSilverGrams).toBeCloseTo(gram.expectedSilverGrams, 2);
  }

  const portfolioValidationLabel =
    portfolioDeduction > 0
      ? `${label} UI portfolio vs calculated − grand total`
      : `${label} UI portfolio vs formula`;
  logValidation(portfolioValidationLabel, snapshot.uiPortfolioInr, expectedUi);
  expect(snapshot.uiPortfolioInr).toBeGreaterThan(0);
  expect(Number.isFinite(snapshot.uiPortfolioInr)).toBe(true);
  expect(snapshot.uiPortfolioInr).toBeCloseTo(expectedUi, 2);

  return snapshot;
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
