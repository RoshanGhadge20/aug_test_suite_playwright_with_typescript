import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class BuyMetalPage extends BasePage {
  private readonly productsMenu: Locator;
  private readonly digitalGold: Locator;
  private readonly digitalSilver: Locator;
  private readonly amountInput: Locator;
  private readonly oneTimeClick: Locator;
  private readonly createSipClick: Locator;
  private readonly buyGoldBtn: Locator;
  private readonly buySilverBtn: Locator;
  private readonly oneTimeRadioBtn: Locator;
  private readonly investmentDayDropdown: Locator;
  private readonly investmentDayListbox: Locator;
  private readonly createSIPButton: Locator;
  private readonly planNameInput: Locator;
  private readonly startDateInput: Locator;

  constructor(page: Page) {
    super(page);

    this.productsMenu = page.getByText('PRODUCTS', { exact: true });
    this.digitalGold = page.getByRole('link', { name: /Digital Gold Buy and save/i });
    this.digitalSilver = page.getByRole('link', { name: /Digital Silver Buy and save/i });
    this.amountInput = this.page
      .locator('text=Amount')
      .locator('..')
      .locator('input[role="spinbutton"]');

    this.oneTimeClick = page.getByRole('button', { name: 'One-Time' });
    this.createSipClick = page.getByRole('button', { name: 'Create SIP' });
    this.buyGoldBtn = page.getByRole('button', { name: 'Buy Gold' });
    this.buySilverBtn = page.getByRole('button', { name: 'Buy Silver' });
    this.oneTimeRadioBtn = page.getByRole('radio', { name: 'One Time' });
    this.investmentDayDropdown = page
      .locator('text=Investment Day')
      .locator('..')
      .getByRole('combobox');
    this.investmentDayListbox = page.getByRole('listbox', { name: 'Option List' });

    this.createSIPButton = page.getByRole('button', {
      name: 'Create SIP',
      exact: true,
    });
    this.planNameInput = page.locator('#planName');
    this.startDateInput = page.locator('#startDate');
  }

  private dayOption(day: string): Locator {
    return this.investmentDayListbox.getByRole('option', {
      name: day,
      exact: true,
    });
  }

  async hoverOnProductsAndClickDigitalGold(): Promise<void> {
    await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
    await this.productsMenu.waitFor({ state: 'visible' });
    await this.productsMenu.hover();
    await this.digitalGold.waitFor({ state: 'visible' });
    await this.digitalGold.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.skipKycRedirectIfShown('/digital-gold/buy');
    await this.waitForBuyFormReady();
  }

  async hoverOnProductsAndClickDigitalSilver(): Promise<void> {
    await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
    await this.productsMenu.waitFor({ state: 'visible' });
    await this.productsMenu.hover();
    await this.digitalSilver.waitFor({ state: 'visible' });
    await this.digitalSilver.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.skipKycRedirectIfShown('/digital-silver/buy');
    await this.waitForBuyFormReady();
  }

  async openDigitalGoldBuyPage(): Promise<void> {
    await this.openBuyPage('/digital-gold/buy');
  }

  async openDigitalSilverBuyPage(): Promise<void> {
    await this.openBuyPage('/digital-silver/buy');
  }

  private async openBuyPage(buyPath: string): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.goto(buyPath);
    await this.page.waitForLoadState('domcontentloaded');
    await this.skipKycRedirectIfShown(buyPath);
    if (/\/kyc/i.test(this.page.url())) {
      throw new Error(`Buy page blocked by KYC: ${this.page.url()}`);
    }
    await this.waitForBuyFormReady();
  }

  private async skipKycRedirectIfShown(fallbackBuyPath: string): Promise<void> {
    if (!/\/kyc/i.test(this.page.url())) return;

    await this.page.waitForLoadState('domcontentloaded');
    const redirectTo = new URL(this.page.url()).searchParams.get('redirectTo');
    await this.page.goto(redirectTo || fallbackBuyPath);
    await this.page.waitForLoadState('domcontentloaded');

    if (/\/kyc/i.test(this.page.url())) {
      await this.page.goto('/dashboard');
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.goto(fallbackBuyPath);
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  async enterAmount(amount: string): Promise<void> {
    await this.waitForBuyFormReady();
    await this.amountInput.press('Backspace');
    await this.amountInput.click();
    await this.amountInput.press('Control+A');
    await this.amountInput.fill(amount);
    await this.amountInput.press('Tab');
    await this.waitForBlockUiHidden(15_000);
  }

  private async ensureSipModeSelected(): Promise<void> {
    const sipRadio = this.page.getByRole('radio', { name: /SIP Recommended/i });
    if (await sipRadio.isVisible({ timeout: 5_000 }).catch(() => false)) {
      if (!(await sipRadio.isChecked().catch(() => false))) {
        await sipRadio.click();
        await this.waitForBlockUiHidden(15_000);
      }
    }
  }

  private sipFrequencyRadio(frequency: 'weekly' | 'monthly'): Locator {
    const label = frequency === 'monthly' ? 'Monthly' : 'Weekly';
    return this.page.getByRole('radio', { name: label, exact: true });
  }

  private async selectInvestmentDayIfVisible(day: string): Promise<void> {
    const dropdownVisible = await this.investmentDayDropdown.isVisible().catch(() => false);
    const altVisible = await this.page
      .locator('label:has-text("Investment Day"), text=Investment Day')
      .first()
      .isVisible()
      .catch(() => false);
    if (dropdownVisible || altVisible) {
      await this.selectInvestmentDay(day);
    }
  }

  private async waitForBlockUiHidden(timeoutMs = 30_000): Promise<void> {
    await this.page.locator('div.p-blockui[aria-busy="true"]').waitFor({ state: 'hidden', timeout: timeoutMs });
  }

  async waitForBuyFormReady(): Promise<void> {
    await this.waitForBlockUiHidden(30_000);

    await this.amountInput.waitFor({ state: 'visible', timeout: 20_000 });
    await expect(this.amountInput).toBeEnabled({ timeout: 20_000 });
  }

  async clickOnOneTime(): Promise<void> {
    await this.oneTimeClick.click();
  }

  /** Wait until One-Time buy CTA is ready (replaces fixed post-radio sleep). */
  private async waitForOneTimeBuyButtonReady(metal: 'gold' | 'silver'): Promise<void> {
    const blockUI = this.page.locator('.p-blockui-document');
    await blockUI.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
    const buyBtn = metal === 'gold' ? this.buyGoldBtn : this.buySilverBtn;
    await buyBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(buyBtn).toBeEnabled({ timeout: 15_000 });
  }

  private buyPagePath(metal: 'gold' | 'silver'): string {
    return metal === 'gold' ? '/digital-gold/buy' : '/digital-silver/buy';
  }

  /** Wait until overlays are gone and Create SIP is ready to click. */
  private async waitForCreateSipButtonReady(): Promise<void> {
    await this.waitForBlockUiHidden(30_000);
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const amountVisible = await this.amountInput.isVisible().catch(() => false);
    if (amountVisible) {
      await expect(this.amountInput).toBeEnabled({ timeout: 20_000 }).catch(() => {});
    }

    await this.createSipClick.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(this.createSipClick).toBeEnabled({ timeout: 30_000 });
    await this.createSipClick.scrollIntoViewIfNeeded();
    await this.waitForBlockUiHidden(30_000);
  }

  async clickOnCreateSIP(): Promise<void> {
    await this.waitForCreateSipButtonReady();
    await this.createSipClick.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    const blockUI = this.page.locator('.p-blockui-document');
    await blockUI.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
  }

  /** Create SIP through plan form — works for gold/silver and weekly/monthly. */
  async createSip(options: {
    metal: 'gold' | 'silver';
    frequency: 'weekly' | 'monthly';
    amount: string;
    investmentDay?: string;
    startAfterDays: number;
    planPrefix?: string;
    startDateOverride?: Date;
  }): Promise<{ planName: string; startDate: string }> {
    const targetDate =
      options.startDateOverride ??
      (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + options.startAfterDays);
        return d;
      })();

    let investmentDay = options.investmentDay;
    if (!investmentDay && options.frequency === 'monthly') {
      investmentDay = String(targetDate.getDate());
    }

    await this.startSipAndOpenPlanForm({
      metal: options.metal,
      amount: options.amount,
      frequency: options.frequency,
      investmentDay,
    });
    const planName = await this.enterUniquePlanName(options.planPrefix);
    const startDate = await this.enterStartDatePlusDays(
      options.startAfterDays,
      options.startDateOverride,
    );
    await this.clickOnCreateSIP();
    return { planName, startDate };
  }

  private async isOnSipPlanForm(): Promise<boolean> {
    if (/\/create-sip/i.test(this.page.url())) {
      return this.planNameInput.isVisible({ timeout: 5_000 }).catch(() => false);
    }
    return this.planNameInput.isVisible({ timeout: 2_000 }).catch(() => false);
  }

  /** Navigate to buy, fill SIP amount/frequency, and land on plan-name step. */
  async startSipAndOpenPlanForm(options: {
    metal: 'gold' | 'silver';
    amount: string;
    frequency: 'weekly' | 'monthly';
    investmentDay?: string;
    skipNavigation?: boolean;
  }): Promise<void> {
    const buyPath =
      options.metal === 'gold' ? '/digital-gold/buy' : ('/digital-silver/buy' as const);

    if (!options.skipNavigation) {
      if (options.metal === 'gold') {
        await this.openDigitalGoldBuyPage();
      } else {
        await this.openDigitalSilverBuyPage();
      }
    }

    if (await this.isOnSipPlanForm()) {
      return;
    }

    await this.ensureSipModeSelected();

    if (await this.isOnSipPlanForm()) {
      await this.page.goBack();
      await this.waitForBuyFormReady();
    }

    if (options.frequency === 'monthly') {
      await this.selectMonthlyFrequency();
    } else {
      await this.selectWeeklyFrequency();
    }
    await this.enterAmount(options.amount);
    if (options.investmentDay) {
      await this.selectInvestmentDayIfVisible(options.investmentDay);
    }

    await this.clickOnCreateSIP();

    if (!(await this.isOnSipPlanForm())) {
      await this.clickCreateSipToPlanForm({
        buyPath,
        amount: options.amount,
        frequency: options.frequency,
        investmentDay: options.investmentDay,
      });
    }

    await this.planNameInput.waitFor({ state: 'visible', timeout: 20_000 });
  }

  /** Second Create SIP click — retries once if KYC redirect clears the form. */
  async clickCreateSipToPlanForm(options: {
    buyPath: '/digital-gold/buy' | '/digital-silver/buy';
    amount: string;
    frequency: 'weekly' | 'monthly';
    investmentDay?: string;
  }): Promise<void> {
    await this.clickOnCreateSIP();

    if (await this.planNameInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      return;
    }

    await this.skipKycRedirectIfShown(options.buyPath);
    await this.openBuyPage(options.buyPath);

    await this.clickOnCreateSIP();
    if (options.frequency === 'monthly') {
      await this.selectMonthlyFrequency();
    } else {
      await this.selectWeeklyFrequency();
    }
    await this.enterAmount(options.amount);
    if (options.investmentDay) {
      await this.selectInvestmentDayIfVisible(options.investmentDay);
    }
    await this.clickOnCreateSIP();
    await this.planNameInput.waitFor({ state: 'visible', timeout: 20_000 });
  }

  async selectWeeklyFrequency(): Promise<void> {
    if (await this.isOnSipPlanForm()) return;
    const weekly = this.sipFrequencyRadio('weekly');
    await weekly.waitFor({ state: 'visible', timeout: 20_000 });
    await weekly.click();
    await expect(weekly).toBeChecked({ timeout: 10_000 });
    await this.waitForBlockUiHidden(15_000);
  }

  async selectMonthlyFrequency(): Promise<void> {
    if (await this.isOnSipPlanForm()) return;
    const monthly = this.sipFrequencyRadio('monthly');
    await monthly.waitFor({ state: 'visible', timeout: 20_000 });
    await monthly.click();
    await expect(monthly).toBeChecked({ timeout: 10_000 });
    await this.waitForBlockUiHidden(15_000);
  }

  async selectInvestmentDay(day: string): Promise<void> {
    const altDropdown = this.page
      .locator('label:has-text("Investment Day"), text=Investment Day')
      .locator('xpath=ancestor::*[1]')
      .locator('[role="combobox"]')
      .first();

    const dropdown = (await this.investmentDayDropdown.isVisible().catch(() => false))
      ? this.investmentDayDropdown
      : altDropdown;

    await dropdown.waitFor({ state: 'visible', timeout: 20_000 });
    await dropdown.click({ force: true });
    await this.investmentDayListbox.waitFor({ state: 'visible', timeout: 10_000 });

    const option = this.dayOption(day);
    if (!(await option.isVisible().catch(() => false))) {
      await dropdown.click({ force: true });
      await this.investmentDayListbox.waitFor({ state: 'visible', timeout: 10_000 });
    }
    await option.click({ force: true });
  }

  async enterUniquePlanName(prefix = 'Sip_plan_weekly'): Promise<string> {
    const uniquePlanName = `${prefix}_${Date.now()}`;
    const blockUI = this.page.locator('.p-blockui-document');
    await blockUI.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
    await this.planNameInput.waitFor({ state: 'visible', timeout: 30_000 });
    await expect(this.planNameInput).toBeEnabled({ timeout: 20_000 });
    await this.planNameInput.fill(uniquePlanName);
    return uniquePlanName;
  }

  /**
   * @param days — offset from today when `targetOverride` is omitted
   * @param targetOverride — exact calendar date (optional); when set, `days` is ignored
   */
  async enterStartDatePlusDays(days = 5, targetOverride?: Date): Promise<string> {
    const targetDate = targetOverride
      ? new Date(targetOverride)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + days);
          return d;
        })();
    const expectedDay = targetDate.getDate();
    const expectedMonth = targetDate.getMonth() + 1;
    const expectedYear = targetDate.getFullYear();
    const dayPart = String(expectedDay).padStart(2, '0');
    const monthPart = String(expectedMonth).padStart(2, '0');
    const yearPart = String(expectedYear);
    const formattedDateDash = `${dayPart}-${monthPart}-${yearPart}`;
    const formattedDateSlash = `${dayPart}/${monthPart}/${yearPart}`;
    const formattedDate = formattedDateSlash;
    console.log(
      `[SIP DATE] requested days=${targetOverride ? 'override' : days}, targetDate=${formattedDate}`,
    );

    const matchesTargetDate = (value: string): boolean => {
      const parts = value.split(/[/-]/).map((p) => Number(p.trim()));
      if (parts.length < 3) {
        return false;
      }
      const [d, m, y] = parts;
      return d === expectedDay && m === expectedMonth && y === expectedYear;
    };

    if (targetOverride) {
      await this.startDateInput.click();
      await this.startDateInput.fill(formattedDateSlash);
      await this.startDateInput.press('Enter');
      await this.startDateInput.press('Tab');
      const typedValue = await this.startDateInput.inputValue();
      if (matchesTargetDate(typedValue)) {
        console.log(`[SIP DATE] final inputValue=${typedValue}`);
        return typedValue;
      }
    }
    const startDateMeta = await this.startDateInput.evaluate((el) => {
      const input = el as any;
      return {
        min: input.min || '',
        max: input.max || '',
        readOnly: input.readOnly,
        disabled: input.disabled,
        type: input.type,
        placeholder: input.placeholder || '',
      };
    });
    console.log(`[SIP DATE] input-meta=${JSON.stringify(startDateMeta)}`);

    await this.startDateInput.click();
    const datePicker = this.page.locator('.p-datepicker');
    await datePicker.waitFor({ state: 'visible', timeout: 10_000 });
    const calendarMeta = await datePicker.evaluate((el) => {
      const selected = el.querySelector('td .p-highlight')?.textContent?.trim() || '';
      const disabledCount = el.querySelectorAll('td.p-disabled').length;
      const enabledCount = el.querySelectorAll('td:not(.p-disabled)').length;
      return { selected, disabledCount, enabledCount };
    });
    console.log(`[SIP DATE] calendar-meta=${JSON.stringify(calendarMeta)}`);

    let value = '';
    let selectedDay = NaN;
    const dayMatcher = new RegExp(`^${expectedDay}$`);

    const dateCellButton = datePicker
      .locator('td:not(.p-disabled):not(.p-datepicker-other-month) span')
      .filter({ hasText: dayMatcher })
      .first();
    await dateCellButton.waitFor({ state: 'visible', timeout: 10_000 });
    await dateCellButton.click({ force: true });
    await expect(this.startDateInput).not.toHaveValue('', { timeout: 10_000 });
    value = await this.startDateInput.inputValue();
    selectedDay = Number(value.split('/')[0]);
    console.log(`[SIP DATE] after calendar click, inputValue=${value}`);

    if (!matchesTargetDate(value)) {
      console.log(`[SIP DATE] fallback typing targetDate=${formattedDateDash}`);
      await this.startDateInput.fill(formattedDateDash);
      await this.startDateInput.press('Enter');
      await this.startDateInput.press('Tab');
      value = await this.startDateInput.inputValue();
    }

    if (!matchesTargetDate(value)) {
      console.log(`[SIP DATE] second fallback typing targetDate=${formattedDateSlash}`);
      await this.startDateInput.fill(formattedDateSlash);
      await this.startDateInput.press('Enter');
      await this.startDateInput.press('Tab');
      value = await this.startDateInput.inputValue();
    }

    console.log(`[SIP DATE] final inputValue=${value}`);
    return value;
  }

  async clickOnOneTimeRadioBtn(): Promise<void> {
    const blockUI = this.page.locator('.p-blockui-document');
    await blockUI.waitFor({ state: 'hidden' });
    await this.oneTimeRadioBtn.waitFor({ state: 'visible' });
    await this.oneTimeRadioBtn.click();
  }

  async clickOnBuyGold(): Promise<void> {
    await expect(this.buyGoldBtn).toBeVisible();
    await expect(this.buyGoldBtn).toBeEnabled();
    await this.buyGoldBtn.click();
  }

  async clickOnBuySilver(): Promise<void> {
    await expect(this.buySilverBtn).toBeVisible();
    await expect(this.buySilverBtn).toBeEnabled();
    await this.buySilverBtn.click();
  }

  async waitForBuySummaryOrKyc(): Promise<'summary' | 'kyc' | 'unknown'> {
    const summaryPattern = /digital-(?:gold|silver)\/buy\/summary/i;
    const kycPattern = /\/kyc(?:\/|$|\?)/i;

    return Promise.race([
      this.page.waitForURL(summaryPattern, { timeout: 15_000 }).then(() => 'summary' as const),
      this.page.waitForURL(kycPattern, { timeout: 15_000 }).then(() => 'kyc' as const),
      this.page.waitForTimeout(15_000).then(() => 'unknown' as const),
    ]);
  }

  async prepareOneTimeOrder(metal: 'gold' | 'silver', amount: string): Promise<void> {
    const buyPagePath = this.buyPagePath(metal);
    await this.page.goto(metal === 'gold' ? '/digital-gold' : '/digital-silver');
    await this.page.waitForLoadState('domcontentloaded');
    await this.skipKycRedirectIfShown(buyPagePath);
    if (/\/kyc/i.test(this.page.url())) {
      throw new Error(`Buy page blocked by KYC: ${this.page.url()}`);
    }
    await this.waitForBuyFormReady();
    await this.enterAmount(amount);
    await this.clickOnOneTime();
    await this.waitForOneTimeBuyButtonReady(metal);
  }

  async confirmOneTimeBuy(metal: 'gold' | 'silver'): Promise<'summary' | 'kyc' | 'unknown'> {
    if (metal === 'gold') {
      await this.clickOnBuyGold();
    } else {
      await this.clickOnBuySilver();
    }
    return this.waitForBuySummaryOrKyc();
  }

  async placeOneTimeOrder(metal: 'gold' | 'silver', amount: string): Promise<void> {
    await this.prepareOneTimeOrder(metal, amount);
    let outcome = await this.confirmOneTimeBuy(metal);
    if (outcome === 'kyc') {
      await this.skipKycRedirectIfShown(this.buyPagePath(metal));
      if (/\/kyc/i.test(this.page.url())) {
        throw new Error(`Buy flow redirected to KYC: ${this.page.url()}`);
      }
      await this.waitForBuyFormReady();
      await this.enterAmount(amount);
      await this.clickOnOneTime();
      await this.waitForOneTimeBuyButtonReady(metal);
      outcome = await this.confirmOneTimeBuy(metal);
    }
    if (outcome === 'kyc') {
      throw new Error(`Buy flow redirected to KYC: ${this.page.url()}`);
    }
  }

  async repurchaseOneTimeOrder(metal: 'gold' | 'silver', amount: string): Promise<void> {
    await this.clickOnOneTimeRadioBtn();
    await this.enterAmount(amount);
    if (metal === 'gold') {
      await this.clickOnBuyGold();
    } else {
      await this.clickOnBuySilver();
    }
    const outcome = await this.waitForBuySummaryOrKyc();
    if (outcome === 'kyc') {
      throw new Error(`Re-purchase flow redirected to KYC: ${this.page.url()}`);
    }
  }
}
