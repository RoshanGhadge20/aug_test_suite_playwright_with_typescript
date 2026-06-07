import { expect, Locator, Page } from '@playwright/test';
import { digitalGoldRatesUrl } from '../../config/urls';
import { shopLogActualExpected, shopLogGet } from '../../utils/test/shop-log';
import { expectedShopProductWeightGrams, type ShopProductDetails } from './shop.page';
import { BasePage } from '../shared/base.page';

export type DashboardPortfolioMetrics = {
  totalGoldGrams: number;
  totalSilverGrams: number;
  portfolioInr: number;
};

export type DigitalMetalSpotRates = { gBuy: number; gSell: number; sBuy: number; sSell: number };

export type DashboardPortfolioSnapshot = {
  totalGoldGrams: number;
  totalSilverGrams: number;
  uiPortfolioInr: number;
  calculatedPortfolioInr: number;
  spot: DigitalMetalSpotRates;
};

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
  return {
    gBuy: parseNum(rates.gBuy ?? rates.gbuy, 'gBuy'),
    gSell: parseNum(rates.gSell ?? rates.gsell, 'gSell'),
    sBuy: parseNum(rates.sBuy ?? rates.sbuy, 'sBuy'),
    sSell: parseNum(rates.sSell ?? rates.ssell, 'sSell'),
  };
}

function portfolioInrFromGramsAndSellRates(
  goldGrams: number,
  silverGrams: number,
  spot: DigitalMetalSpotRates,
): number {
  return Number((goldGrams * spot.gSell + silverGrams * spot.sSell).toFixed(2));
}

export class DashBoardPage extends BasePage {
  private static readonly portfolioFieldTimeoutMs = 5_000;
  private readonly viewAllBtn: Locator;
  private readonly mySipsHeading: Locator;
  private readonly sipTextBlocks: Locator;
  private readonly statusBadges: Locator;
  private readonly goldFDValue: Locator;
  private readonly walletBalance: Locator;
  private readonly totalSilver: Locator;
  private readonly portfolioValueXpath: string;
  private readonly withdrawInvestmentButton: Locator;

  constructor(page: Page) {
    super(page);

    this.viewAllBtn = page.getByRole('button', {
      name: /^view all$/i,
    });

    this.mySipsHeading = page.getByRole('heading', {
      name: 'My SIPs',
    });

    // Shared text block locator used for SIP name and amount labels.
    this.sipTextBlocks = page.locator(
      'div.text-24.font-cabinetgroteskbold',
    );

    this.statusBadges = page.locator(
      'div.rounded-2xl.border.text-14.font-gilroybold',
    );

    this.goldFDValue = page.locator('p', {
      hasText: 'Gold FD+(g)',
    }).locator('xpath=preceding-sibling::p');

    this.walletBalance = this.page
      .locator('div:has-text("My Funds")')
      .locator('div')
      .nth(1);

    this.totalSilver = page.locator(
      "//p[normalize-space()='Total Silver(g)']/preceding-sibling::p",
    );

    this.portfolioValueXpath = "//p[contains(@class,'text-36') and contains(@class,'font-cabinetgroteskbold')]";
    this.withdrawInvestmentButton = page.getByRole('button', { name: /Withdraw Investment/i });
  }

  private portfolioCard(): Locator {
    return this.page.locator('div:has-text("My Portfolio")').first();
  }

  private portfolioGoldLine(): Locator {
    return this.portfolioCard().locator('p').filter({ hasText: /Total Gold/i }).first();
  }

  /** Dynamic wait — exits as soon as My Portfolio / Total Gold is visible (no fixed multi-second sleeps). */
  async waitForDashboardPortfolioSection(timeoutMs = 20_000): Promise<void> {
    if (/\/login/i.test(this.page.url())) {
      throw new Error(
        'Cannot read portfolio: session is on login page. Re-run: npx playwright test --project=auth-setup',
      );
    }

    const blockers = this.page.locator('div.p-blockui[aria-busy="true"], .p-blockui-document');
    await blockers.first().waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    const goldLine = this.portfolioGoldLine();
    try {
      await expect(goldLine).toBeVisible({ timeout: timeoutMs });
      return;
    } catch {
      if (!/\/dashboard/i.test(this.page.url())) {
        throw new Error(
          'Dashboard portfolio (My Portfolio / Total Gold) did not become visible in time. Check UAT dashboard layout or session.',
        );
      }
    }

    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await blockers.first().waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    await expect(goldLine).toBeVisible({
      timeout: Math.min(10_000, timeoutMs),
    });
  }

  /**
   * Read gold (g), silver (g), and portfolio INR in one pass after a single portfolio wait.
   * Use `skipPortfolioWait: true` when step already called `waitForDashboardPortfolioSection`.
   */
  async readPortfolioMetrics(options?: {
    waitTimeoutMs?: number;
    skipPortfolioWait?: boolean;
  }): Promise<DashboardPortfolioMetrics> {
    if (!options?.skipPortfolioWait) {
      await this.waitForDashboardPortfolioSection(options?.waitTimeoutMs ?? 20_000);
    }

    return {
      totalGoldGrams: await this.readTotalGoldGrams(),
      totalSilverGrams: await this.readTotalSilverGrams(),
      portfolioInr: await this.readPortfolioInr(),
    };
  }

  private async readTotalGoldGrams(): Promise<number> {
    const goldLabel = this.portfolioGoldLine();
    await goldLabel.waitFor({ state: 'visible', timeout: DashBoardPage.portfolioFieldTimeoutMs });
    const valueNode = goldLabel.locator('xpath=preceding-sibling::p[1]');
    await valueNode.waitFor({ state: 'visible', timeout: DashBoardPage.portfolioFieldTimeoutMs });
    const text = (await valueNode.textContent())?.trim() ?? '';
    const value = Number(text.replace(/[^\d.]/g, ''));
    if (Number.isNaN(value)) {
      throw new Error(`Unable to parse Total Gold value from: "${text}"`);
    }
    return value;
  }

  private async readTotalSilverGrams(): Promise<number> {
    const silverLabel = this.portfolioCard().locator('p').filter({ hasText: /Total Silver/i }).first();
    await silverLabel.waitFor({ state: 'visible', timeout: DashBoardPage.portfolioFieldTimeoutMs });
    const valueNode = silverLabel.locator('xpath=preceding-sibling::p[1]');
    await valueNode.waitFor({ state: 'visible', timeout: DashBoardPage.portfolioFieldTimeoutMs });
    const text = (await valueNode.textContent())?.trim() ?? '';
    const value = Number(text.replace(/[^\d.]/g, ''));
    if (Number.isNaN(value)) {
      throw new Error(`Unable to parse Total Silver value from: "${text}"`);
    }
    return value;
  }

  private async readPortfolioInr(): Promise<number> {
    const portfolioCard = this.portfolioCard();
    const primary = portfolioCard
      .locator('p.text-36.font-cabinetgroteskbold')
      .filter({ hasText: /[\d,.]/ })
      .first();

    let text = '';
    if (await primary.isVisible({ timeout: 1_000 }).catch(() => false)) {
      text = (await primary.textContent()) ?? '';
    } else {
      const fallback = this.page
        .getByText('My Portfolio')
        .first()
        .locator('xpath=following::p[contains(@class,"text-36")][1]');
      await fallback.waitFor({ state: 'visible', timeout: DashBoardPage.portfolioFieldTimeoutMs });
      text = (await fallback.textContent()) ?? '';
    }

    const n = parseFloat(String(text).replace(/[^\d.]/g, ''));
    if (!Number.isFinite(n)) {
      throw new Error(`Unable to parse portfolio value from: "${String(text).slice(0, 120)}"`);
    }
    return n;
  }

  async verifyDashboardLoaded(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    console.log('Dashboard loaded');
  }

  async clickMyOrders(): Promise<void> {
    const myOrders = this.page
      .getByRole('link', { name: /my orders/i })
      .or(this.page.getByRole('button', { name: /my orders/i }))
      .or(this.page.getByText(/^my orders$/i))
      .first();
    await myOrders.waitFor({ state: 'visible', timeout: 15_000 });
    await myOrders.click();
    await this.page.waitForURL(/my-orders/i, { timeout: 15_000 });
  }

  async clickViewAll(): Promise<void> {
    if (this.page.isClosed()) {
      return;
    }

    if (/\/sip-list/i.test(this.page.url())) {
      await this.mySipsHeading.waitFor({ state: 'visible', timeout: 20_000 });
      return;
    }

    const canClickViewAll = await this.viewAllBtn.isVisible().catch(() => false);
    if (canClickViewAll) {
      await this.viewAllBtn.click().catch(async () => {
        await this.viewAllBtn.click({ force: true }).catch(() => {});
      });
    }

    // Some runs do not navigate immediately after click or button never renders.
    await this.page.waitForURL('**/sip-list', { timeout: 20_000 }).catch(async () => {
      await this.page.goto('/sip-list', { waitUntil: 'domcontentloaded' });
    });

    await this.mySipsHeading.waitFor({ state: 'visible', timeout: 20_000 });
  }

  async getSipNameByText(expectedPlanName: string): Promise<string> {
    const escapedPlanName = expectedPlanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const planNameRegex = new RegExp(escapedPlanName, 'i');
    const maxAttempts = 2;
    const retryWaitMs = 3_000;
    console.log(`Looking for SIP plan: ${expectedPlanName}`);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const sipCard = this.page.locator('app-sip-card').filter({
        hasText: planNameRegex,
      }).first();

      if (await sipCard.isVisible().catch(() => false)) {
        const sipNameNode = sipCard.locator('div.text-24.font-cabinetgroteskbold').first();
        await sipNameNode.waitFor({ state: 'visible', timeout: 10_000 });
        const foundSipName = (await sipNameNode.textContent())?.trim() ?? '';
        console.log(`Matched SIP plan: ${foundSipName}`);
        return foundSipName;
      }

      if (attempt < maxAttempts - 1) {
        await this.page.waitForTimeout(retryWaitMs);
        await this.page.goto('/sip-list', { waitUntil: 'domcontentloaded' });
        await this.mySipsHeading.waitFor({ state: 'visible', timeout: 15_000 });
        await this.page.locator('app-sip-card').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
      }
    }

    const visibleSipNames = await this.page
      .locator('app-sip-card div.text-24.font-cabinetgroteskbold')
      .allTextContents()
      .catch(() => []);
    console.log(`Visible SIP names on sip-list: ${visibleSipNames.map((name) => name.trim()).join(' | ')}`);

    throw new Error(`SIP with plan name "${expectedPlanName}" was not found on sip list page.`);
  }

  async validateAmountIsZero(planName: string): Promise<boolean> {
    const escapedPlanName = planName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sipCard = this.page.locator('app-sip-card').filter({
      hasText: new RegExp(escapedPlanName, 'i'),
    });

    const zeroAmount = sipCard.getByText('₹0', { exact: true });

    await zeroAmount.waitFor({ state: 'visible', timeout: 20_000 });

    const valueText = (await zeroAmount.textContent())?.trim() ?? '';
    return valueText === '₹0';
  }

  async getWeeklyAmount(): Promise<number> {
    const weeklyAmount = this.sipTextBlocks.filter({
      hasText: '/weekly',
    });

    await weeklyAmount.first().waitFor({ state: 'visible' });

    const rawText = (await weeklyAmount.first().textContent())?.trim() ?? '';
    const amount = Number(
      rawText.replace(/[₹,\s]/g, '').split('/')[0],
    );

    return amount;
  }

  async getWeeklySipName(): Promise<string> {
    const weeklyCard = this.page.locator('app-sip-card').filter({
      hasText: /\/weekly/i,
    }).first();
    await weeklyCard.waitFor({ state: 'visible', timeout: 20_000 });
    const nameNode = weeklyCard.locator('div.text-24.font-cabinetgroteskbold').first();
    await nameNode.waitFor({ state: 'visible', timeout: 10_000 });
    return (await nameNode.textContent())?.trim() ?? '';
  }

  async getMonthlySipName(): Promise<string> {
    const monthlyCard = this.page.locator('app-sip-card').filter({
      hasText: /\/monthly/i,
    }).first();
    await monthlyCard.waitFor({ state: 'visible', timeout: 20_000 });
    const nameNode = monthlyCard.locator('div.text-24.font-cabinetgroteskbold').first();
    await nameNode.waitFor({ state: 'visible', timeout: 10_000 });
    return (await nameNode.textContent())?.trim() ?? '';
  }

  async getMonthlyAmount(): Promise<number> {
    const monthlyAmount = this.sipTextBlocks.filter({
      hasText: '/monthly',
    });

    await monthlyAmount.first().waitFor({ state: 'visible' });

    const rawText = (await monthlyAmount.first().textContent())?.trim() ?? '';
    const amount = Number(
      rawText.replace(/[₹,\s]/g, '').split('/')[0],
    );

    return amount;
  }

  async getStatusText(planName: string): Promise<string> {
    const escapedPlanName = planName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const statusBadge = this.page.locator('app-sip-card', {
      hasText: new RegExp(escapedPlanName, 'i'),
    }).locator('text=/Pending|Approved/i');

    await statusBadge.first().waitFor({ state: 'visible', timeout: 20_000 });
    const text = (await statusBadge.textContent())?.trim() ?? '';
    return text;
  }

  async validateSipOnDashboard(params: {
    planName: string;
    expectedAmount: string;
    expectedStatus: string;
    frequency: 'weekly' | 'monthly';
    planNameMatch?: 'exact' | 'contains';
    planNameContains?: string;
  }): Promise<void> {
    await this.clickViewAll();
    await this.page.locator('app-sip-card').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});

    let sipName: string;
    try {
      sipName = await this.getSipNameByText(params.planName);
    } catch {
      console.log(`[SIP DASHBOARD] exact plan not found, using ${params.frequency} SIP fallback`);
      sipName =
        params.frequency === 'weekly' ? await this.getWeeklySipName() : await this.getMonthlySipName();
    }

    if (params.planNameMatch === 'contains' && params.planNameContains) {
      console.log(
        `[SIP DASHBOARD] sipName actual=${sipName.toLowerCase()} expected-contains=${params.planNameContains}`,
      );
      expect(sipName.toLowerCase()).toContain(params.planNameContains.toLowerCase());
    } else {
      console.log(
        `[SIP DASHBOARD] sipName actual=${sipName.toLowerCase()} expected=${params.planName.toLowerCase()}`,
      );
      expect(sipName.toLowerCase()).toBe(params.planName.toLowerCase());
    }

    const amountIsZero = await this.validateAmountIsZero(sipName);
    console.log(`[SIP DASHBOARD] amountIsZero actual=${amountIsZero} expected=true`);
    expect(amountIsZero).toBeTruthy();

    const recurringAmount =
      params.frequency === 'weekly'
        ? await this.getWeeklyAmount()
        : await this.getMonthlyAmount();
    console.log(
      `[SIP DASHBOARD] ${params.frequency}Amount actual=${recurringAmount} expected=${Number(params.expectedAmount)}`,
    );
    expect(recurringAmount).toBe(Number(params.expectedAmount));

    const statusText = await this.getStatusText(sipName);
    console.log(`[SIP DASHBOARD] statusText actual=${statusText} expected=${params.expectedStatus}`);
    expect(statusText).toBe(params.expectedStatus);
  }

  async getTotalGoldValue(): Promise<number> {
    await this.waitForDashboardPortfolioSection(20_000);
    return this.readTotalGoldGrams();
  }

  async getTotalSilverValue(): Promise<number> {
    await this.waitForDashboardPortfolioSection(20_000);
    return this.readTotalSilverGrams();
  }

  async getWalletBalance(): Promise<number> {
    const text = await this.page.locator('text=My Funds')
      .locator('xpath=following-sibling::*')
      .innerText();

    const value = text.replace(/[^\d.]/g, '');
    return parseFloat(value);
  }

  async getPortfolioValueNumber(): Promise<number> {
    await this.waitForDashboardPortfolioSection(20_000);
    return this.readPortfolioInr();
  }

  /** TC004+ withdrawal — capture dashboard portfolio snapshot with optional assertions. */
  async captureWithdrawalDashboardSnapshot(options?: {
    requirePortfolio?: boolean;
    requireGold?: boolean;
    requireSilver?: boolean;
    requireGoldFd?: boolean;
  }): Promise<{
    portfolioValue: number;
    totalGold: number;
    totalSilver: number;
    goldFD: string;
  }> {
    await this.goto('/dashboard');
    const portfolioValue = await this.getPortfolioValueNumber();
    const totalGold = await this.getTotalGoldValue();
    const totalSilver = await this.getTotalSilverValue();
    const goldFD = await this.getGoldFDValue();

    console.log('Total Portfolio Value (Rs):', portfolioValue);
    console.log('Total Gold (g):', totalGold);
    console.log('Total Silver (g):', totalSilver);
    console.log('Gold FD+ Value:', goldFD);

    if (options?.requirePortfolio !== false) {
      expect(portfolioValue).toBeGreaterThan(0);
    }
    if (options?.requireGold !== false) {
      expect(totalGold).toBeGreaterThan(0);
    }
    if (options?.requireSilver) {
      expect(totalSilver).toBeGreaterThan(0);
    }
    if (options?.requireGoldFd !== false) {
      expect(goldFD).not.toBe('');
    }

    return { portfolioValue, totalGold, totalSilver, goldFD };
  }

  async fetchDigitalMetalSpotRates(): Promise<DigitalMetalSpotRates> {
    const ratesUrl = digitalGoldRatesUrl();
    console.log('[digital-gold/rates] GET', ratesUrl);
    const response = await this.page.request.get(ratesUrl, { timeout: 30_000 });
    expect(response.ok(), `digital-gold rates API failed: HTTP ${response.status()}`).toBeTruthy();
    const parsed = parseDigitalMetalSpotRatesFromPayload((await response.json()) as unknown);
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

  private logPortfolioValidation(label: string, actual: unknown, expected: unknown): void {
    console.log(`[VALIDATION] ${label} | actual: ${String(actual)} | expected: ${String(expected)}`);
  }

  private async assertPortfolioFormulaWithRetry(options: {
    logLabel: string;
    gramExpectations?: { expectedGoldGrams?: number; expectedSilverGrams?: number };
    maxAttempts?: number;
    reloadDelayMs?: number;
  }): Promise<DashboardPortfolioSnapshot> {
    await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await this.waitForDashboardPortfolioSection(12_000).catch(() => {});

    const maxAttempts = options.maxAttempts ?? 6;
    const reloadDelayMs = options.reloadDelayMs ?? 5_000;
    const gram = options.gramExpectations;

    let snapshot: DashboardPortfolioSnapshot = {
      totalGoldGrams: 0,
      totalSilverGrams: 0,
      uiPortfolioInr: 0,
      calculatedPortfolioInr: 0,
      spot: { gBuy: 0, gSell: 0, sBuy: 0, sSell: 0 },
    };

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const spot = await this.fetchDigitalMetalSpotRates();
      const metrics = await this.readPortfolioMetrics({ skipPortfolioWait: true });
      const calculated = portfolioInrFromGramsAndSellRates(
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

      const portfolioOk = Math.abs(snapshot.uiPortfolioInr - snapshot.calculatedPortfolioInr) <= 2;
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
        await this.page.waitForTimeout(reloadDelayMs);
        await this.page.reload({ waitUntil: 'domcontentloaded' });
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

    if (gram?.expectedGoldGrams !== undefined) {
      this.logPortfolioValidation(`${label} Total gold (g)`, snapshot.totalGoldGrams, gram.expectedGoldGrams);
      expect(Math.abs(snapshot.totalGoldGrams - gram.expectedGoldGrams)).toBeLessThanOrEqual(0.01);
    }
    if (gram?.expectedSilverGrams !== undefined) {
      this.logPortfolioValidation(
        `${label} Total silver (g)`,
        snapshot.totalSilverGrams,
        gram.expectedSilverGrams,
      );
      expect(Math.abs(snapshot.totalSilverGrams - gram.expectedSilverGrams)).toBeLessThanOrEqual(0.01);
    }

    this.logPortfolioValidation(`${label} UI portfolio vs formula`, snapshot.uiPortfolioInr, snapshot.calculatedPortfolioInr);
    expect(snapshot.uiPortfolioInr).toBeGreaterThan(0);
    expect(Number.isFinite(snapshot.uiPortfolioInr)).toBe(true);
    expect(snapshot.uiPortfolioInr).toBeCloseTo(snapshot.calculatedPortfolioInr, 2);

    return snapshot;
  }

  /** Buy-metal TC_001/002 — capture metal grams before one-time buy. */
  async captureBuyMetalGramsBeforePurchase(metal: 'gold' | 'silver'): Promise<number> {
    await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await this.waitForDashboardPortfolioSection(12_000);
    const grams =
      metal === 'gold' ? await this.readTotalGoldGrams() : await this.readTotalSilverGrams();
    console.log(`[BUY DASHBOARD] total ${metal} before (g): ${grams}`);
    expect(grams).toBeGreaterThan(0);
    return grams;
  }

  /** Buy-metal TC_005 — UI portfolio vs formula before purchase (with retries). */
  async validateBuyMetalPortfolioBeforePurchase(logLabel: string): Promise<DashboardPortfolioSnapshot> {
    const snapshot = await this.assertPortfolioFormulaWithRetry({
      logLabel,
      reloadDelayMs: 2_000,
    });
    expect(snapshot.totalGoldGrams).toBeGreaterThan(0);
    expect(snapshot.totalSilverGrams).toBeGreaterThanOrEqual(0);
    return snapshot;
  }

  /** Buy-metal TC_005 — after purchase: gold grams + portfolio formula. */
  async validateBuyMetalPortfolioAfterPurchase(
    logLabel: string,
    expectedGoldGrams: number,
  ): Promise<DashboardPortfolioSnapshot> {
    await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    let goldGrams = 0;
    let silverGrams = 0;
    let uiPortfolio = 0;
    let calculatedPortfolio = 0;
    let spot: DigitalMetalSpotRates = { gBuy: 0, gSell: 0, sBuy: 0, sSell: 0 };

    // Dashboard can lag after payment — retry up to 6 times (2s wait + reload).
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await this.waitForDashboardPortfolioSection(12_000).catch(() => {});

      spot = await this.fetchDigitalMetalSpotRates();
      const metrics = await this.readPortfolioMetrics({ skipPortfolioWait: true });
      goldGrams = metrics.totalGoldGrams;
      silverGrams = metrics.totalSilverGrams;
      uiPortfolio = metrics.portfolioInr;
      calculatedPortfolio = portfolioInrFromGramsAndSellRates(goldGrams, silverGrams, spot);

      const goldOk = Math.abs(goldGrams - expectedGoldGrams) <= 0.01;
      const portfolioOk = Math.abs(uiPortfolio - calculatedPortfolio) <= 2;

      if (goldOk && portfolioOk && uiPortfolio > 0) {
        break;
      }
      if (attempt < 5) {
        await this.page.waitForTimeout(2_000);
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }
    }

    console.log(`[${logLabel}] Total gold (g):`, goldGrams);
    console.log(`[${logLabel}] Total silver (g):`, silverGrams);
    console.log(
      `[${logLabel}] UI portfolio: ₹${uiPortfolio} | calculated: ₹${calculatedPortfolio} (gold×gSell + silver×sSell)`,
    );
    console.log(
      `[${logLabel}] Formula: ${goldGrams}×gSell(${spot.gSell}) + ${silverGrams}×sSell(${spot.sSell}) = ₹${calculatedPortfolio}`,
    );

    this.logPortfolioValidation(`${logLabel} Total gold (g)`, goldGrams, expectedGoldGrams);
    expect(Math.abs(goldGrams - expectedGoldGrams)).toBeLessThanOrEqual(0.01);

    this.logPortfolioValidation(`${logLabel} UI portfolio vs formula`, uiPortfolio, calculatedPortfolio);
    expect(uiPortfolio).toBeGreaterThan(0);
    expect(uiPortfolio).toBeCloseTo(calculatedPortfolio, 2);

    return {
      totalGoldGrams: goldGrams,
      totalSilverGrams: silverGrams,
      uiPortfolioInr: uiPortfolio,
      calculatedPortfolioInr: calculatedPortfolio,
      spot,
    };
  }

  /** Shop TC_SHOP_004 — single read; UI portfolio vs formula before shop (no retry). */
  async captureShopPortfolioBeforePurchase(
    logLabel: string,
  ): Promise<DashboardPortfolioSnapshot> {
    const snapshot = await this.captureShopPortfolioBeforePurchaseInternal(logLabel);
    shopLogGet('Portfolio before purchase', snapshot);
    return snapshot;
  }

  /** TC_SHOP_004 — validate portfolio grams and INR after full-savings shop purchase. */
  async validateShopPortfolioAfterFullSavingsPurchase(params: {
    productName: string;
    productDetails: ShopProductDetails;
    cartNetWeight: string;
    goldBeforePurchase: number;
    silverBeforePurchase: number;
    portfolioBeforePurchase: number;
  }): Promise<void> {
    const productWeightGrams = expectedShopProductWeightGrams(
      params.productName,
      params.productDetails,
      params.cartNetWeight,
    );
    const expectedGoldGrams = Number((params.goldBeforePurchase - productWeightGrams).toFixed(4));
    shopLogGet('Expected gold grams after purchase', { expectedGoldGrams, productWeightGrams });
    await this.validateShopPortfolioGramsAfterPurchase('Shop portfolio', {
      expectedGoldGrams,
      expectedSilverGrams: params.silverBeforePurchase,
    });
    const portfolioSnapshot = await this.captureShopPortfolioBeforePurchaseInternal(
      'Shop portfolio-after',
    );
    const portfolioAfter = portfolioSnapshot.uiPortfolioInr;
    const expectedPortfolioAfter = Number(
      (params.portfolioBeforePurchase - params.productDetails.grandTotal).toFixed(2),
    );
    const portfolioDiffAbs = Math.abs(portfolioAfter - expectedPortfolioAfter);
    const portfolioDeltaTolerance = Math.max(100, params.productDetails.grandTotal * 0.05);
    shopLogActualExpected('Portfolio after vs expected', portfolioDiffAbs <= portfolioDeltaTolerance, true);
  }

  private async captureShopPortfolioBeforePurchaseInternal(
    logLabel: string,
  ): Promise<DashboardPortfolioSnapshot> {
    await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await this.page.waitForURL(/\/dashboard/i, { timeout: 8_000 });
    await this.waitForDashboardPortfolioSection(12_000);

    const spot = await this.fetchDigitalMetalSpotRates();
    const metrics = await this.readPortfolioMetrics({ skipPortfolioWait: true });
    const calculatedPortfolioInr = portfolioInrFromGramsAndSellRates(
      metrics.totalGoldGrams,
      metrics.totalSilverGrams,
      spot,
    );

    console.log(`[${logLabel}] Total gold (g):`, metrics.totalGoldGrams);
    console.log(`[${logLabel}] Total silver (g):`, metrics.totalSilverGrams);
    console.log(
      `[${logLabel}] UI portfolio: ₹${metrics.portfolioInr} | calculated: ₹${calculatedPortfolioInr} (gold×gSell + silver×sSell)`,
    );

    expect(metrics.totalGoldGrams).toBeGreaterThan(0);
    expect(metrics.totalSilverGrams).toBeGreaterThanOrEqual(0);
    expect(metrics.portfolioInr).toBeGreaterThan(0);
    this.logPortfolioValidation(`${logLabel} UI portfolio vs formula`, metrics.portfolioInr, calculatedPortfolioInr);
    expect(metrics.portfolioInr).toBeCloseTo(calculatedPortfolioInr, 2);

    return {
      totalGoldGrams: metrics.totalGoldGrams,
      totalSilverGrams: metrics.totalSilverGrams,
      uiPortfolioInr: metrics.portfolioInr,
      calculatedPortfolioInr,
      spot,
    };
  }

  /** Shop TC_SHOP_004 — UI portfolio vs formula + expected gold/silver grams after shop. */
  async validateShopPortfolioGramsAfterPurchase(
    logLabel: string,
    gramExpectations: { expectedGoldGrams: number; expectedSilverGrams: number },
  ): Promise<DashboardPortfolioSnapshot> {
    return this.assertPortfolioFormulaWithRetry({ logLabel, gramExpectations });
  }

  async validateWalletBalanceOnProfile(minBalance = 0): Promise<number> {
    await this.page.goto('/my-profile');
    await expect(this.page).toHaveURL(/my-profile/);
    const walletBalance = await this.getWalletBalance();
    console.log(
      `[BUY DASHBOARD] wallet balance actual=${walletBalance} minimum expected=${minBalance}`,
    );
    expect(walletBalance).toBeCloseTo(minBalance, 2);
    return walletBalance;
  }

  /** Buy-metal TC_001/002 — verify metal grams increased after one-time buy. */
  async validateBuyMetalGramsAfterPurchase(
    metal: 'gold' | 'silver',
    beforeGrams: number,
    addedGrams: number,
  ): Promise<number> {
    await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const expectedGrams = Number((beforeGrams + addedGrams).toFixed(4));
    const readGrams = (): Promise<number> =>
      metal === 'gold' ? this.readTotalGoldGrams() : this.readTotalSilverGrams();

    let afterGrams = 0;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await this.waitForDashboardPortfolioSection(10_000).catch(() => {});
      afterGrams = await readGrams();
      if (Math.abs(afterGrams - expectedGrams) <= 0.001) {
        break;
      }
      if (attempt < 3) {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
      }
    }

    console.log(`[BUY DASHBOARD] total ${metal} after (g): ${afterGrams} expected=${expectedGrams}`);
    expect(afterGrams).toBeCloseTo(expectedGrams, 3);
    return afterGrams;
  }

  async getGoldFDValue(): Promise<string> {
    const isVisible = await this.goldFDValue.first().isVisible().catch(() => false);
    if (!isVisible) {
      return 'Gold FD+ not available';
    }

    const text = await this.goldFDValue.first().textContent();
    return text?.trim() || 'Gold FD+ not available';
  }

  async clickWithdrawInvestment(): Promise<void> {
    await this.waitForDashboardPortfolioSection(45_000);
    await this.withdrawInvestmentButton.waitFor({ state: 'visible', timeout: 25_000 });
    const blockingOverlay = this.page.locator('div.p-blockui[aria-busy="true"]');
    if (await blockingOverlay.isVisible().catch(() => false)) {
      await blockingOverlay.waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => undefined);
    }

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const clicked = await this.withdrawInvestmentButton
        .click({ timeout: 5_000 })
        .then(() => true)
        .catch(() => false);
      if (clicked) {
        return;
      }
      await blockingOverlay.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
      await this.page.waitForTimeout(250);
    }

    await this.withdrawInvestmentButton.click({ force: true });
  }

  async getApprovedSipNameWithZeroInvestment(): Promise<string> {
    const sipCards = this.page.locator(
      'app-sip-card, div.border.border-stroke.rounded-xl'
    );
    const nextPageButton = this.page
      .locator(
        '.p-paginator-next, button[aria-label*="Next"], button:has(.pi-angle-right), button[aria-label*="next"]'
      )
      .first();

    while (true) {
      await sipCards.first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
      const cardCount = await sipCards.count();

      for (let i = 0; i < cardCount; i += 1) {
        const card = sipCards.nth(i);
        const cardText = (await card.innerText()).replace(/\s+/g, ' ').trim();
        const isApproved = /\bapproved\b/i.test(cardText);
        const investmentMatch = cardText.match(/Total Investment\s*₹\s*([0-9,]+(?:\.[0-9]+)?)/i);
        const investmentValue = investmentMatch ? Number(investmentMatch[1].replace(/,/g, '')) : NaN;
        const isZeroInvestment = !Number.isNaN(investmentValue) && investmentValue === 0;

        if (isApproved && isZeroInvestment) {
          const sipNameNode = card.locator('div.text-24.font-cabinetgroteskbold').first();
          await sipNameNode.waitFor({ state: 'visible', timeout: 10_000 });
          return (await sipNameNode.textContent())?.trim() ?? '';
        }
      }

      const hasNext = await nextPageButton.isVisible().catch(() => false);
      if (!hasNext) break;

      const ariaDisabled = await nextPageButton.getAttribute('aria-disabled');
      const disabledAttr = await nextPageButton.getAttribute('disabled');
      const classAttr = (await nextPageButton.getAttribute('class')) ?? '';
      const isDisabled =
        ariaDisabled === 'true' ||
        disabledAttr !== null ||
        /\bp-disabled\b|\bdisabled\b/i.test(classAttr);

      if (isDisabled) break;

      await nextPageButton.click();
      await this.page.waitForTimeout(1_000);
    }

    throw new Error('No SIP found with Approved status and Total Investment ₹0.');
  }

  async getApprovedSipNameWithPositiveInvestment(): Promise<string> {
    const sipCards = this.page.locator('app-sip-card');
    const nextPageButton = this.page
      .locator(
        '.p-paginator-next, button[aria-label*="Next"], button:has(.pi-angle-right), button[aria-label*="next"]'
      )
      .first();
    let pageNumber = 1;

    while (true) {
      await sipCards.first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
      const cardCount = await sipCards.count();

      for (let i = 0; i < cardCount; i += 1) {
        const card = sipCards.nth(i);
        const cardText = (await card.innerText()).replace(/\s+/g, ' ').trim();
        const isApproved = /\bapproved\b/i.test(cardText);
        const investmentMatch = cardText.match(/Total Investment\s*₹\s*([0-9,]+(?:\.[0-9]+)?)/i);
        const investmentValue = investmentMatch ? Number(investmentMatch[1].replace(/,/g, '')) : NaN;
        const isPositiveInvestment = !Number.isNaN(investmentValue) && investmentValue > 0;
        if (isApproved && isPositiveInvestment) {
          const sipNameNode = card.locator('div.text-24.font-cabinetgroteskbold').first();
          await sipNameNode.waitFor({ state: 'visible', timeout: 10_000 });
          console.log(`[SIP SEARCH] Condition satisfied on page ${pageNumber}`);
          return (await sipNameNode.textContent())?.trim() ?? '';
        }
      }

      const hasNext = await nextPageButton.isVisible().catch(() => false);
      if (!hasNext) break;

      const ariaDisabled = await nextPageButton.getAttribute('aria-disabled');
      const disabledAttr = await nextPageButton.getAttribute('disabled');
      const classAttr = (await nextPageButton.getAttribute('class')) ?? '';
      const isDisabled =
        ariaDisabled === 'true' ||
        disabledAttr !== null ||
        /\bp-disabled\b|\bdisabled\b/i.test(classAttr);

      if (isDisabled) break;

      await nextPageButton.click();
      await this.page.waitForTimeout(1_000);
      pageNumber += 1;
    }

    throw new Error('No SIP found with Approved status and Total Investment greater than ₹0.');
  }

  async deliveryScrollUpAndClickProceedByMatchingSipMetalValue(
    sipName: string,
    expectedMetalValueInGm: number,
    options?: { onlyMetalType?: 'Gold' | 'Silver' },
  ): Promise<{ sipName: string; metalValue: number; metalType: 'Gold' | 'Silver' }> {
    const onlyMetalType = options?.onlyMetalType;
    const normalizedTargetSipName = sipName.trim().toLowerCase();
    if (!normalizedTargetSipName) {
      throw new Error('SIP name is required for delivery value matching.');
    }
    if (!Number.isFinite(expectedMetalValueInGm) || expectedMetalValueInGm <= 0) {
      throw new Error(`Invalid expected SIP metal value "${expectedMetalValueInGm}".`);
    }

    const sipCards = this.page
      .locator('app-sip-card, div.border.border-stroke.rounded-xl')
      .filter({ has: this.page.locator('div.text-24.font-cabinetgroteskbold') });

    const getCardMeta = async (
      card: Locator,
      metaOptions?: { preferSilver: boolean },
    ): Promise<{ sipName: string; metalValue: number; metalType: 'Gold' | 'Silver' | 'Unknown' }> => {
      const preferSilver = metaOptions?.preferSilver === true;
      const rawTitleText = ((await card.locator('div.text-24.font-cabinetgroteskbold').first().textContent()) ?? '').trim();
      const cardText = ((await card.innerText().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();

      const totalGoldNode = card
        .locator('div.text-14.font-gilroymedium', { hasText: /Total Gold/i })
        .first();
      const totalSilverNode = card
        .locator('div.text-14.font-gilroymedium', { hasText: /Total Silver/i })
        .first();

      let valueText = '';
      let metalType: 'Gold' | 'Silver' | 'Unknown' = 'Unknown';

      const readFromVisibleNodes = async () => {
        if (preferSilver) {
          if (await totalSilverNode.isVisible().catch(() => false)) {
            const silverLine = ((await totalSilverNode.textContent()) ?? '').replace(/\s+/g, ' ').trim();
            const silverMatch = silverLine.match(/Total Silver\s*:?\s*([0-9]+(?:\.[0-9]+)?)\s*gm/i);
            valueText = (silverMatch?.[1] ?? silverLine).trim();
            metalType = 'Silver';
            return;
          }
          if (await totalGoldNode.isVisible().catch(() => false)) {
            const goldLine = ((await totalGoldNode.textContent()) ?? '').replace(/\s+/g, ' ').trim();
            const goldMatch = goldLine.match(/Total Gold\s*:?\s*([0-9]+(?:\.[0-9]+)?)\s*gm/i);
            valueText = (goldMatch?.[1] ?? goldLine).trim();
            metalType = 'Gold';
            return;
          }
        } else {
          if (await totalGoldNode.isVisible().catch(() => false)) {
            const goldLine = ((await totalGoldNode.textContent()) ?? '').replace(/\s+/g, ' ').trim();
            const goldMatch = goldLine.match(/Total Gold\s*:?\s*([0-9]+(?:\.[0-9]+)?)\s*gm/i);
            valueText = (goldMatch?.[1] ?? goldLine).trim();
            metalType = 'Gold';
            return;
          }
          if (await totalSilverNode.isVisible().catch(() => false)) {
            const silverLine = ((await totalSilverNode.textContent()) ?? '').replace(/\s+/g, ' ').trim();
            const silverMatch = silverLine.match(/Total Silver\s*:?\s*([0-9]+(?:\.[0-9]+)?)\s*gm/i);
            valueText = (silverMatch?.[1] ?? silverLine).trim();
            metalType = 'Silver';
            return;
          }
        }
      };

      await readFromVisibleNodes();

      if (metalType === 'Unknown') {
        const labelledGoldMatch = cardText.match(/Total Gold\s*:?\s*([0-9]+(?:\.[0-9]+)?)\s*gm?/i);
        const labelledSilverMatch = cardText.match(/Total Silver\s*:?\s*([0-9]+(?:\.[0-9]+)?)\s*gm?/i);
        if (preferSilver) {
          if (labelledSilverMatch?.[1]) {
            valueText = labelledSilverMatch[1];
            metalType = 'Silver';
          } else if (labelledGoldMatch?.[1]) {
            valueText = labelledGoldMatch[1];
            metalType = 'Gold';
          }
        } else {
          if (labelledGoldMatch?.[1]) {
            valueText = labelledGoldMatch[1];
            metalType = 'Gold';
          } else if (labelledSilverMatch?.[1]) {
            valueText = labelledSilverMatch[1];
            metalType = 'Silver';
          }
        }
        if (metalType === 'Unknown') {
          const genericMetalMatch = cardText.match(/Total\s*(Gold|Silver)\s*:?\s*([0-9]+(?:\.[0-9]+)?)\s*gm?/i);
          if (genericMetalMatch?.[1] && genericMetalMatch?.[2]) {
            metalType = /gold/i.test(genericMetalMatch[1]) ? 'Gold' : 'Silver';
            valueText = genericMetalMatch[2];
          }
        }
      }

      const metalValue = Number((valueText.match(/[\d.]+/)?.[0] ?? '0').trim());
      if (metalType === 'Silver') {
        console.log(`[DELIVERY SIP VALUE] ${rawTitleText} -> Total Silver: ${metalValue} gm`);
      } else if (metalType === 'Gold') {
        console.log(`[DELIVERY SIP VALUE] ${rawTitleText} -> Total Gold: ${metalValue} gm`);
      }
      return { sipName: rawTitleText, metalValue, metalType };
    };

    // First scroll up, then start scanning cards.
    await this.page.evaluate(() => {
      const scopedGlobal = globalThis as { scrollTo?: (x: number, y: number) => void };
      scopedGlobal.scrollTo?.(0, 0);
    });
    await this.page.waitForTimeout(700);
    await this.page.evaluate(() => {
      const scopedGlobal = globalThis as { scrollBy?: (x: number, y: number) => void; innerHeight?: number };
      const viewportHeight = scopedGlobal.innerHeight ?? 0;
      scopedGlobal.scrollBy?.(0, Math.max(120, Math.floor(viewportHeight * 0.45)));
      scopedGlobal.scrollBy?.(0, -Math.max(120, Math.floor(viewportHeight * 0.45)));
    });
    await this.page.waitForTimeout(700);

    const startedAt = Date.now();
    let previousScrollY = -1;
    let noMovementCount = 0;

    for (let cycle = 1; cycle <= 25; cycle += 1) {
      if (Date.now() - startedAt > 30_000) {
        const metalHint =
          onlyMetalType === 'Silver'
            ? 'Silver SIP '
            : onlyMetalType === 'Gold'
              ? 'Gold SIP '
              : '';
        throw new Error(
          `SIP scan timed out after 30s. Could not find ${metalHint}card with value >= ${expectedMetalValueInGm} gm.`,
        );
      }

      const cardCount = await sipCards.count();
      if (cardCount === 0) {
        await this.page.evaluate(() => {
          const scopedGlobal = globalThis as { scrollBy?: (x: number, y: number) => void; innerHeight?: number };
          const viewportHeight = scopedGlobal.innerHeight ?? 0;
          scopedGlobal.scrollBy?.(0, Math.floor(viewportHeight * 0.75));
        });
        await this.page.waitForTimeout(700);
        continue;
      }
      for (let i = 0; i < cardCount; i += 1) {
        const candidate = sipCards.nth(i);
        const meta = await getCardMeta(candidate, { preferSilver: onlyMetalType === 'Silver' });
        const isVaultCard = /^(gold|silver)\s+vault$/i.test(meta.sipName.trim());
        if (isVaultCard) {
          continue;
        }

        if (onlyMetalType === 'Silver' && meta.metalType !== 'Silver') {
          continue;
        }
        if (onlyMetalType === 'Gold' && meta.metalType !== 'Gold') {
          continue;
        }

        const sameSip = meta.sipName.trim().toLowerCase() === normalizedTargetSipName;
        const isEligibleByValue = meta.metalValue + 0.0001 >= expectedMetalValueInGm;
        if (!isEligibleByValue) {
          continue;
        }

        await candidate.scrollIntoViewIfNeeded().catch(() => undefined);

        const resolvedMetalType: 'Gold' | 'Silver' =
          meta.metalType === 'Gold' ? 'Gold' : 'Silver';

        if (sameSip) {
          console.log(
            `[DELIVERY SIP MATCH] ${meta.sipName || sipName} -> ${meta.metalType}: ${meta.metalValue} gm (required >= ${expectedMetalValueInGm} gm)`,
          );
          return {
            sipName: meta.sipName || sipName,
            metalValue: meta.metalValue,
            metalType: resolvedMetalType,
          };
        }
        console.log(
          `[DELIVERY SIP MATCH] ${meta.sipName || sipName} -> ${meta.metalType}: ${meta.metalValue} gm (required >= ${expectedMetalValueInGm} gm)`,
        );
        return {
          sipName: meta.sipName || sipName,
          metalValue: meta.metalValue,
          metalType: resolvedMetalType,
        };
      }

      await this.page.evaluate(() => {
        const scopedGlobal = globalThis as { scrollBy?: (x: number, y: number) => void; innerHeight?: number };
        const viewportHeight = scopedGlobal.innerHeight ?? 0;
        scopedGlobal.scrollBy?.(0, Math.floor(viewportHeight * 0.8));
      });
      await this.page.waitForTimeout(700);

      const currentScrollY = await this.page.evaluate(() => {
        const scopedGlobal = globalThis as { scrollY?: number };
        return scopedGlobal.scrollY ?? 0;
      });
      if (currentScrollY === previousScrollY) {
        noMovementCount += 1;
      } else {
        noMovementCount = 0;
      }
      previousScrollY = currentScrollY;
      if (noMovementCount >= 2) {
        break;
      }
    }

    const metalHint =
      onlyMetalType === 'Silver'
        ? 'Silver SIP '
        : onlyMetalType === 'Gold'
          ? 'Gold SIP '
          : '';
    throw new Error(
      `Could not find any ${metalHint}card with value >= ${expectedMetalValueInGm} gm after scrolling.`,
    );
  }

  async printGoldValueAndClickProceedBySipName(
    sipName?: string,
    options?: {
      minValueThreshold?: number;
      scrollDirection?: 'down' | 'up';
      fallbackToAnySipWhenTargetBelowThreshold?: boolean;
      onlyMetalType?: 'Gold' | 'Silver';
    },
  ): Promise<{ sipName: string; goldValue: string; metalType: 'Gold' | 'Silver' }> {
    const sipCards = this.page
      .locator('app-sip-card, div.border.border-stroke.rounded-xl')
      .filter({
        has: this.page.locator('div.text-24.font-cabinetgroteskbold'),
      })
      .filter({
        has: this.page.getByRole('button', { name: /^Proceed$/i }),
      });
    const targetSipName = sipName?.trim() ?? '';
    const normalizedTargetSipName = targetSipName.toLowerCase();
    const hasProvidedSipName = normalizedTargetSipName.length > 0;
    const minValueThreshold = options?.minValueThreshold ?? 0;
    const scrollDirection: 'down' | 'up' = options?.scrollDirection ?? 'down';
    const fallbackToAnySipWhenTargetBelowThreshold =
      options?.fallbackToAnySipWhenTargetBelowThreshold ?? false;
    const onlyMetalType = options?.onlyMetalType;
    let previousScrollHeight = 0;
    let noMovementCount = 0;
    let scanCycles = 0;
    const startedAt = Date.now();

    if (scrollDirection === 'up') {
      // Move to bottom first so scan can proceed upward.
      await this.page.evaluate(() => {
        const scopedGlobal = globalThis as {
          scrollTo?: (x: number, y: number) => void;
          document?: { body?: { scrollHeight?: number } };
        };
        const fullHeight = scopedGlobal.document?.body?.scrollHeight ?? 0;
        scopedGlobal.scrollTo?.(0, fullHeight);
      });
      await this.page.waitForTimeout(700);
    } else {
      // On some list loads, SIP cards render only after the first viewport movement.
      await this.page.evaluate(() => {
        const scopedGlobal = globalThis as {
          scrollBy?: (x: number, y: number) => void;
          innerHeight?: number;
        };
        const viewportHeight = scopedGlobal.innerHeight ?? 0;
        scopedGlobal.scrollBy?.(0, Math.max(120, Math.floor(viewportHeight * 0.5)));
      });
      await this.page.waitForTimeout(700);
    }

    while (true) {
      scanCycles += 1;
      if (Date.now() - startedAt > 45_000) {
        throw new Error(
          `SIP scan timed out after 45s (cycles=${scanCycles}). No eligible SIP card matched the conditions.`
        );
      }

      const cardCount = await sipCards.count();
      if (scanCycles === 1) {
        console.log(`[SIP SCAN] initial SIP card count: ${cardCount}`);
      }
      if (cardCount === 0 && scanCycles === 1) {
        console.log('[SIP SCAN] No SIP cards visible on initial scan, will scroll and retry.');
      }
      if (scanCycles % 5 === 0) {
        console.log(`[SIP SCAN] cycle=${scanCycles}, visibleCards=${cardCount}, target=${normalizedTargetSipName || 'auto'}`);
      }
      for (let i = 0; i < cardCount; i += 1) {
        const candidateCard = sipCards.nth(i);
        const rawTitleText = ((await candidateCard
          .locator('div.text-24.font-cabinetgroteskbold')
          .first()
          .textContent()
          .catch(() => '')) ?? '')
          .trim();
        const cardText = (await candidateCard.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
        const derivedNameFromCardText = cardText
          .replace(/Total (Gold|Silver|Investment)\b[\s\S]*$/i, '')
          .replace(/\b(Approved|Pending)\b[\s\S]*$/i, '')
          .trim();
        const effectiveSipName = rawTitleText || derivedNameFromCardText || 'selected-sip';
        const titleText = rawTitleText.trim().toLowerCase();

        const nameMatched = normalizedTargetSipName ? titleText === normalizedTargetSipName : true;
        const shouldRestrictToTargetOnly = hasProvidedSipName && !fallbackToAnySipWhenTargetBelowThreshold;
        if (!nameMatched) {
          if (shouldRestrictToTargetOnly) {
            continue;
          }
          // Fallback mode: target SIP can be low value; allow scanning other SIP cards.
          // Continue evaluating this candidate.
        }
        if (!nameMatched && !hasProvidedSipName) {
          continue;
        }

        const isVaultCard = /^(gold|silver)\s+vault$/i.test(rawTitleText.trim());
        if (isVaultCard) {
          continue;
        }

        const isVisible = await candidateCard.isVisible().catch(() => false);
        if (!isVisible) {
          continue;
        }

        const totalGoldNode = candidateCard
          .locator('div.text-14.font-gilroymedium', { hasText: /^Total Gold$/i })
          .locator('xpath=following-sibling::div[1]')
          .first();
        const totalSilverNode = candidateCard
          .locator('div.text-14.font-gilroymedium', { hasText: /^Total Silver$/i })
          .locator('xpath=following-sibling::div[1]')
          .first();
        const fallbackGoldNode = candidateCard
          .locator('div.text-18.font-gilroybold')
          .filter({ hasText: /gm/i })
          .first();

        const planTypeText = ((await candidateCard
          .locator('div.text-16.font-gilroymedium')
          .first()
          .textContent()
          .catch(() => '')) ?? '')
          .trim();
        const planMentionsGold = /\bgold\b/i.test(planTypeText);
        const planMentionsSilver = /\bsilver\b/i.test(planTypeText);
        const cardMentionsTotalGold = /\bTotal Gold\b/i.test(cardText);
        const cardMentionsTotalSilver = /\bTotal Silver\b/i.test(cardText);

        let metalLabel: 'Gold' | 'Silver' | 'Unknown' = 'Unknown';
        if (planMentionsGold) {
          metalLabel = 'Gold';
        } else if (planMentionsSilver) {
          metalLabel = 'Silver';
        } else if (cardMentionsTotalGold) {
          metalLabel = 'Gold';
        } else if (cardMentionsTotalSilver) {
          metalLabel = 'Silver';
        }
        let totalGoldText = '';
        if (await totalGoldNode.isVisible().catch(() => false)) {
          totalGoldText = (await totalGoldNode.textContent())?.trim() ?? '';
          metalLabel = 'Gold';
        }

        if (!totalGoldText && await totalSilverNode.isVisible().catch(() => false)) {
          totalGoldText = (await totalSilverNode.textContent())?.trim() ?? '';
          metalLabel = 'Silver';
        }

        if (!totalGoldText && await fallbackGoldNode.isVisible().catch(() => false)) {
          totalGoldText = (await fallbackGoldNode.textContent())?.trim() ?? '';
        }

        if (!totalGoldText) {
          // Keep this fallback generic because card styles/labels can vary across builds.
          const labelledGoldMatch = cardText.match(/Total Gold\s*([0-9]+(?:\.[0-9]+)?\s*gm)/i);
          const labelledSilverMatch = cardText.match(/Total Silver\s*([0-9]+(?:\.[0-9]+)?\s*gm)/i);
          const anyGoldMatch = cardText.match(/([0-9]+(?:\.[0-9]+)?\s*gm)\b/i);
          totalGoldText = (labelledGoldMatch?.[1] ?? labelledSilverMatch?.[1] ?? anyGoldMatch?.[1] ?? '').trim();
          if (labelledGoldMatch?.[1]) {
            metalLabel = 'Gold';
          } else if (labelledSilverMatch?.[1]) {
            metalLabel = 'Silver';
          }
        }

        // Click only the Proceed button that belongs to this exact matched SIP card.
        const proceedButton = candidateCard
          .getByRole('button', { name: /^Proceed$/i })
          .first();
        const isProceedVisible = await proceedButton.isVisible().catch(() => false);
        const isProceedEnabled = await proceedButton.isEnabled().catch(() => false);
        const hasProceed = isProceedVisible && isProceedEnabled;

        const numericValue = Number(totalGoldText.replace(/[^\d.]/g, ''));
        const hasPositiveValue = !Number.isNaN(numericValue) && numericValue > minValueThreshold;
        console.log(
          `[SIP CHECK] name="${effectiveSipName}" metalType="${metalLabel}" value="${totalGoldText || 'N/A'}" valueGreaterThanZero=${hasPositiveValue}`
        );

        console.log(`SIP Name: ${effectiveSipName}`);
        console.log(`Metal Type for SIP "${effectiveSipName}": ${metalLabel}`);
        console.log(`Total ${metalLabel} for SIP "${effectiveSipName}": ${totalGoldText || 'N/A'}`);
        console.log(`Proceed available for SIP "${effectiveSipName}": ${hasProceed}`);

        if (onlyMetalType && metalLabel !== onlyMetalType) {
          console.log(
            `[SIP SKIP] name="${effectiveSipName}" reason=metalTypeMismatch expected=${onlyMetalType} actual=${metalLabel}`,
          );
          continue;
        }

        const hasSupportedMetal = metalLabel === 'Gold' || metalLabel === 'Silver';
        if (!hasSupportedMetal || !hasPositiveValue || !hasProceed) {
          const reason = `metalSupported=${hasSupportedMetal}, valueGreaterThan${minValueThreshold}=${hasPositiveValue}, proceedAvailable=${hasProceed}`;
          console.log(`[SIP SKIP] name="${effectiveSipName}" reason=${reason}`);
          if (nameMatched && hasProvidedSipName && !fallbackToAnySipWhenTargetBelowThreshold) {
            throw new Error(`Target SIP "${effectiveSipName}" does not satisfy required conditions (${reason}).`);
          }
          continue;
        }
        const resolvedMetalType: 'Gold' | 'Silver' = metalLabel === 'Gold' ? 'Gold' : 'Silver';

        await proceedButton.scrollIntoViewIfNeeded();
        await proceedButton.click();

        return {
          sipName: effectiveSipName,
          goldValue: totalGoldText || 'N/A',
          metalType: resolvedMetalType,
        };
      }

      const currentScrollHeight = await this.page.evaluate(() => {
        const scopedGlobal = globalThis as {
          document?: { body?: { scrollHeight?: number } };
        };
        return scopedGlobal.document?.body?.scrollHeight ?? 0;
      });
      const listContainerMoved = await this.page.evaluate((direction: 'down' | 'up') => {
        const scopedGlobal = globalThis as {
          document?: {
            querySelector?: (selector: string) => {
              parentElement?: unknown;
            } | null;
          };
          getComputedStyle?: (el: unknown) => { overflowY?: string };
        };
        type ScrollEl = {
          scrollTop: number;
          scrollHeight: number;
          clientHeight: number;
          parentElement?: ScrollEl | null;
        };

        const cardTitleNode = scopedGlobal.document?.querySelector?.(
          'div.text-24.font-cabinetgroteskbold'
        );
        let container = (cardTitleNode?.parentElement as ScrollEl | null) ?? null;

        while (container) {
          const style = scopedGlobal.getComputedStyle?.(container);
          const isScrollableY = /(auto|scroll)/i.test(style?.overflowY ?? '');
          const canScroll = isScrollableY && container.scrollHeight > container.clientHeight;
          if (canScroll) {
            const before = container.scrollTop;
            const delta = Math.floor(container.clientHeight * 0.85);
            if (direction === 'up') {
              container.scrollTop = Math.max(0, container.scrollTop - delta);
              return container.scrollTop < before;
            }
            container.scrollTop = Math.min(container.scrollHeight, container.scrollTop + delta);
            return container.scrollTop > before;
          }
          container = container.parentElement ?? null;
        }

        return false;
      }, scrollDirection);

      if (currentScrollHeight === previousScrollHeight && !listContainerMoved) {
        noMovementCount += 1;
      } else {
        noMovementCount = 0;
      }

      if (noMovementCount >= 3) {
        break;
      }

      previousScrollHeight = currentScrollHeight;
      await this.page.evaluate((direction: 'down' | 'up') => {
        const scopedGlobal = globalThis as {
          scrollBy?: (x: number, y: number) => void;
          innerHeight?: number;
        };
        const viewportHeight = scopedGlobal.innerHeight ?? 0;
        const delta = Math.floor(viewportHeight * 0.85);
        scopedGlobal.scrollBy?.(0, direction === 'up' ? -delta : delta);
      }, scrollDirection);
      await this.page.waitForTimeout(800);
    }

    if (normalizedTargetSipName) {
      if (hasProvidedSipName) {
        throw new Error(`SIP "${sipName}" was not found after scrolling the page.`);
      }
      throw new Error(`Selected SIP "${targetSipName}" was not found with Proceed enabled before end of list.`);
    }
    throw new Error(
      `No eligible SIP found (excluding Gold Vault/Silver Vault) with value > ${minValueThreshold} while scrolling ${scrollDirection}.`,
    );
  }
}
