import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import { setPrimeCalendarDate, type CalendarDate } from '../../utils/calendar-helper';

export type GoalType = 'wedding' | 'education' | 'home' | 'emergencies' | 'specialOnes' | 'retirement';

/**
 * The 6 goal-type cards on `/goal-wise-sip` render in this fixed order — confirmed live
 * 2026-09-01. Each card is a bare `<img alt="">` inside `div.cursor-pointer`; the label text
 * ("WEDDING" etc.) is baked into the banner image file itself, not real DOM text, so selection
 * must be positional rather than by name/role.
 */
const GOAL_TYPE_INDEX: Record<GoalType, number> = {
  wedding: 0,
  education: 1,
  home: 2,
  emergencies: 3,
  specialOnes: 4,
  retirement: 5,
};

export interface SliderBounds {
  min: number;
  max: number;
  current: number;
}

/**
 * `/goal-wise-sip` — Goal-Based SIP creation, tracking, and management. See
 * `tests/customer/Goal-Based SIP Test Plan.md` for the full live-exploration writeup this page
 * object is built from, including confirmed gaps versus the CR (no abbreviated ₹1L/₹1Cr budget
 * display, Gold Coins/Silver goal types not implemented, Goal Details/Manage/Rename/Delete not
 * yet reachable from a Pending/Failed/Paused goal).
 */
export class GoalWiseSipPage extends BasePage {
  private readonly minusButton: Locator;
  private readonly plusButton: Locator;
  private readonly startPlanningButton: Locator;
  private readonly proceedToPayButton: Locator;
  private readonly frequencyHeading: Locator;
  private readonly specialDateInput: Locator;
  private readonly selectAmountButton: Locator;

  constructor(page: Page) {
    super(page);
    this.minusButton = page.getByText('-', { exact: true }).first();
    this.plusButton = page.getByText('+', { exact: true }).first();
    this.startPlanningButton = page.getByRole('button', { name: /^Start planning$/i });
    this.proceedToPayButton = page.getByRole('button', { name: /^Proceed to pay$/i });
    this.frequencyHeading = page.locator('h3').filter({ hasText: /^Save/ }).first();
    // Special Ones' first step ("When is the special day?") is a `p-datepicker` text input, not
    // the year `p-slider` every other goal type uses — confirmed live 2026-09-03. Its own
    // continue button is labeled "Select amount", not "Start planning".
    this.specialDateInput = page.locator('input.p-datepicker-input');
    this.selectAmountButton = page.getByRole('button', { name: /^Select amount$/i });
  }

  async open(): Promise<void> {
    await this.goto('/goal-wise-sip');
  }

  async selectGoalType(type: GoalType): Promise<void> {
    const cards = this.page.locator('app-goals div.cursor-pointer');
    await cards.nth(GOAL_TYPE_INDEX[type]).click();
  }

  /** The single PrimeNG `p-slider` visible on the current step (year / budget / SIP amount). */
  private sliderHandle(): Locator {
    return this.page.locator('p-slider span[role="slider"]').first();
  }

  /**
   * Reads the slider's live business-rule boundaries straight from its ARIA attributes rather
   * than discovering them by clicking — confirmed live 2026-09-01 this is the only practical way
   * to verify the budget step's ₹1L–₹1Cr range (its `+`/`-` step is only ~₹500, making a
   * click-to-boundary approach take ~19,800 clicks).
   */
  async getSliderBounds(): Promise<SliderBounds> {
    const handle = this.sliderHandle();
    await handle.waitFor({ state: 'visible', timeout: 15_000 });
    const [min, max, current] = await Promise.all([
      handle.getAttribute('aria-valuemin'),
      handle.getAttribute('aria-valuemax'),
      handle.getAttribute('aria-valuenow'),
    ]);
    return { min: Number(min), max: Number(max), current: Number(current) };
  }

  private async stepToValue(target: number, step: number): Promise<void> {
    const { current } = await this.getSliderBounds();
    const clicks = Math.round(Math.abs(target - current) / step);
    const button = target > current ? this.plusButton : this.minusButton;
    for (let i = 0; i < clicks; i += 1) {
      await button.click();
    }
  }

  /** Year step ("When is your {goal}?") — confirmed live step size is 1 year per click. */
  async setYear(targetYear: number): Promise<void> {
    await this.stepToValue(targetYear, 1);
  }

  /** Budget step ("Set your {goal} goal") — confirmed live step size is ₹500 per click. */
  async setBudget(targetAmount: number): Promise<void> {
    await this.stepToValue(targetAmount, 500);
  }

  /** Repeatedly clicks `-`; returns the value the slider settled on (should be its `aria-valuemin`). */
  async pushToFloor(maxClicks = 40): Promise<number> {
    for (let i = 0; i < maxClicks; i += 1) {
      await this.minusButton.click();
    }
    return (await this.getSliderBounds()).current;
  }

  /** Repeatedly clicks `+`; returns the value the slider settled on (should be its `aria-valuemax`). */
  async pushToCeiling(maxClicks = 40): Promise<number> {
    for (let i = 0; i < maxClicks; i += 1) {
      await this.plusButton.click();
    }
    return (await this.getSliderBounds()).current;
  }

  /**
   * Jumps the slider straight to its maximum via the `End` key — the only practical way to reach
   * a ceiling far outside the "+"/"-" click-step range (e.g. the SIP-amount step's ₹99,999 cap,
   * ~10,000 clicks away at its ₹10/click step). Mirrors `pushToCeiling`'s contract (returns the
   * value the slider settled on) without the click cost.
   */
  async jumpSliderToCeiling(): Promise<number> {
    const handle = this.sliderHandle();
    await handle.focus();
    await this.page.keyboard.press('End');
    return (await this.getSliderBounds()).current;
  }

  async clickStartPlanning(): Promise<void> {
    await this.startPlanningButton.click();
  }

  /**
   * Special Ones' date step ("When is the special day?") is a `p-datepicker` text input that
   * arrives pre-filled with a valid default (confirmed live: "01 January 2027"). Picking any
   * OTHER date drives the same year/month/day picker `setPrimeCalendarDate` already handles for
   * KYC/profile DOB fields — confirmed live it's the identical PrimeNG widget.
   */
  async setSpecialDate(date: CalendarDate): Promise<void> {
    await setPrimeCalendarDate(this.page, this.specialDateInput, date);
  }

  async getSpecialDateValue(): Promise<string> {
    return (await this.specialDateInput.inputValue()).trim();
  }

  async clickSelectAmount(): Promise<void> {
    await this.selectAmountButton.click();
  }

  /**
   * Frequency step ("Save {Daily|Weekly|Monthly}"). The dropdown is a plain `<h3>` with a
   * `pi-angle-down` icon, not a real combobox — clicking the heading text itself does nothing;
   * only the icon opens the PrimeNG popover (`role="dialog"`) containing a `p-radiobutton` group.
   * Confirmed live 2026-09-01.
   */
  async selectFrequency(frequency: 'Daily' | 'Weekly' | 'Monthly'): Promise<void> {
    const currentText = (await this.frequencyHeading.textContent())?.trim() ?? '';
    if (currentText.includes(frequency)) {
      return;
    }
    await this.page.locator('i.pi-angle-down').first().click({ force: true });
    const popover = this.page.getByRole('dialog').filter({ has: this.page.locator('p-radiobutton') });
    await popover.waitFor({ state: 'visible', timeout: 10_000 });
    await popover.getByText(frequency, { exact: true }).click();
  }

  async getSelectedFrequency(): Promise<string> {
    const text = (await this.frequencyHeading.textContent())?.trim() ?? '';
    return text.replace(/^Save\s*/i, '').trim();
  }

  /** The computed SIP amount shown on the frequency step (e.g. "72" for ₹72/day). */
  async getComputedSipAmount(): Promise<number> {
    const { current } = await this.getSliderBounds();
    return current;
  }

  async clickProceedToPay(): Promise<void> {
    await this.proceedToPayButton.click();
  }

  /** A goal card on the `/goal-wise-sip` listing, matched by its (possibly non-unique) name. */
  goalCardsByName(goalName: string): Locator {
    return this.page
      .locator('div.bg-white.rounded-2xl')
      .filter({ has: this.page.getByText(goalName, { exact: true }) });
  }

  async getGoalStatus(goalCard: Locator): Promise<string> {
    const statusPill = goalCard.locator('p.rounded-lg, p[class*="bg-"]').last();
    return (await statusPill.textContent())?.trim() ?? '';
  }

  async waitForGoalListing(timeoutMs = 15_000): Promise<void> {
    await this.page.getByText('Your Savings', { exact: true }).waitFor({ state: 'visible', timeout: timeoutMs });
  }
}
