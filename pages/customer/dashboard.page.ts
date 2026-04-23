import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class DashBoardPage extends BasePage {
  private readonly viewAllBtn: Locator;
  private readonly mySipsHeading: Locator;
  private readonly sipTextBlocks: Locator;
  private readonly statusBadges: Locator;
  private readonly totalGoldValue: Locator;
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

    this.totalGoldValue = page.locator(
      "//p[text()='Total Gold(g)']/preceding-sibling::p",
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
    this.withdrawInvestmentButton = page.getByRole('button', { name: 'Withdraw Investment' });
  }

  async verifyDashboardLoaded(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    console.log('Dashboard loaded');
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
    console.log(`Looking for SIP plan: ${expectedPlanName}`);

    for (let attempt = 0; attempt < 4; attempt += 1) {
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

      if (attempt < 3) {
        await this.page.waitForTimeout(5_000);
        await this.page.goto('/sip-list', { waitUntil: 'domcontentloaded' });
        await this.mySipsHeading.waitFor({ state: 'visible', timeout: 20_000 });
        await this.page.reload({ waitUntil: 'domcontentloaded' });
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

  async getTotalGoldValue(): Promise<number> {
    const text = await this.totalGoldValue.innerText();
    return parseFloat(text.replace('g', '').trim());
  }

  async getTotalSilverValue(): Promise<number> {
    const text = (await this.totalSilver.textContent()) ?? '';
    return Number(text.replace('g', '').trim());
  }

  async getWalletBalance(): Promise<number> {
    const text = await this.page.locator('text=My Funds')
      .locator('xpath=following-sibling::*')
      .innerText();

    const value = text.replace(/[^\d.]/g, '');
    return parseFloat(value);
  }

  async getPortfolioValueNumber(): Promise<number> {
    const locator = this.page.getByText('My Portfolio')
      .locator('xpath=following::p[1]');

    await locator.waitFor({ state: 'visible' });

    const text = (await locator.textContent()) ?? '';
    return parseFloat(text.replace(/[^\d.]/g, ''));
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
    await this.withdrawInvestmentButton.waitFor({ state: 'visible' });
    await this.withdrawInvestmentButton.click();
  }
}
