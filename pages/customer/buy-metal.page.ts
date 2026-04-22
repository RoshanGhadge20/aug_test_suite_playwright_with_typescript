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
    await this.productsMenu.waitFor({ state: 'visible' });
    await this.productsMenu.hover();
    await this.digitalGold.waitFor({ state: 'visible' });
    await this.digitalGold.click();
  }

  async hoverOnProductsAndClickDigitalSilver(): Promise<void> {
    await this.productsMenu.waitFor({ state: 'visible' });
    await this.productsMenu.hover();
    await this.digitalSilver.waitFor({ state: 'visible' });
    await this.digitalSilver.click();
  }

  async enterAmount(amount: string): Promise<void> {
    await this.waitForBuyFormReady();
    await this.amountInput.press('Backspace');
    await this.amountInput.click();
    await this.amountInput.press('Control+A');
    await this.amountInput.fill(amount);
  }

  async waitForBuyFormReady(): Promise<void> {
    const blockUI = this.page.locator('.p-blockui-document');
    await blockUI.waitFor({ state: 'hidden' }).catch(() => {});

    await this.amountInput.waitFor({ state: 'visible', timeout: 20_000 });
    await expect(this.amountInput).toBeEnabled({ timeout: 20_000 });
  }

  async clickOnOneTime(): Promise<void> {
    await this.oneTimeClick.click();
  }

  async clickOnCreateSIP(): Promise<void> {
    await this.createSipClick.click();
  }

  async selectWeeklyFrequency(): Promise<void> {
    await this.page.getByText('Weekly', { exact: true }).click();
  }

  async selectMonthlyFrequency(): Promise<void> {
    await this.page.getByText('Monthly', { exact: true }).click();
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
    await this.planNameInput.waitFor({ state: 'visible' });
    await this.planNameInput.fill(uniquePlanName);
    return uniquePlanName;
  }

  async enterStartDatePlusDays(days = 5): Promise<string> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const day = String(targetDate.getDate());

    await this.startDateInput.click();

    const dateCell = this.page
      .locator('.p-datepicker td:not(.p-disabled)')
      .filter({ hasText: day })
      .first();

    await dateCell.waitFor({ state: 'visible' });
    await dateCell.click();

    const value = await this.startDateInput.inputValue();
    if (!value.includes(day)) {
      throw new Error(`Date not applied. Expected day ${day}, got ${value}`);
    }
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
}
