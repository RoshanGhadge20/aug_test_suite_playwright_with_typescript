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

export interface GoalCardDetails {
  name: string;
  status: string;
  savedAmount: number;
  targetAmount: number;
  targetDateText: string;
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

  /**
   * Occasionally the click lands before Angular's handler is bound to the card (visually
   * actionable, but nothing navigates) — confirmed live 2026-09-15 as an intermittent flake on
   * the Home card. Retries by re-clicking, but checks for navigation *before* each re-click:
   * confirmed live the same day that a slow-but-successful first click can outlast the 5s
   * navigation check below, and re-clicking on the (now-gone) goal-grid card after we've already
   * navigated away just hangs for the full action timeout instead of failing fast.
   */
  async selectGoalType(type: GoalType): Promise<void> {
    const cards = this.page.locator('app-goals div.cursor-pointer');
    const card = cards.nth(GOAL_TYPE_INDEX[type]);
    const before = this.page.url();
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      if (this.page.url() !== before) return;
      await card.click({ timeout: 5_000 }).catch(() => {});
      try {
        await this.page.waitForURL((url) => url.toString() !== before, { timeout: 5_000 });
        return;
      } catch {
        // try again
      }
    }
    if (this.page.url() !== before) return;
    throw new Error(`selectGoalType('${type}'): URL never changed from "${before}" after 5 click attempts.`);
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

  /**
   * Parses a goal card's name/status/saved-amount/target-amount/target-date in one pass —
   * confirmed live 2026-09-17 the card renders as "{name} | You've saved | ₹{saved} | of
   * ₹{target} • by {date} | {status} | Save more | Withdraw" once collapsed to single-spaced text.
   */
  async getGoalCardDetails(goalCard: Locator): Promise<GoalCardDetails> {
    const [name, status] = await Promise.all([this.getGoalName(goalCard), this.getGoalStatus(goalCard)]);
    const cardText = (await goalCard.innerText()).replace(/\s+/g, ' ').trim();

    const savedMatch = cardText.match(/saved\D*?₹\s*([\d,]+)/i);
    const targetMatch = cardText.match(/of\s*₹\s*([\d,]+)/i);
    const dateMatch = cardText.match(/by\s+(\d{1,2}\s+\w+\s+\d{4})/i);

    return {
      name,
      status,
      savedAmount: savedMatch ? this.parseAmount(savedMatch[1]) : NaN,
      targetAmount: targetMatch ? this.parseAmount(targetMatch[1]) : NaN,
      targetDateText: dateMatch?.[1] ?? '',
    };
  }

  /**
   * Scans the `/goal-wise-sip` listing for the first goal card with status "Approved" AND a
   * saved amount greater than 0, paginating forward (via the PrimeNG `p-paginator`) if none is
   * found on the current page. Withdrawal is meaningless against a goal with nothing saved yet
   * (its linked SIP would show 0 withdrawable grams on the investment-list screen). Returns
   * `null` if no such goal exists within `maxPages` — callers should throw a clear error rather
   * than silently skip, since a withdrawal test has nothing to withdraw from otherwise.
   */
  async findApprovedGoalCardWithSavedValue(maxPages = 6): Promise<Locator | null> {
    for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
      const cards = this.page.locator('div.bg-white.rounded-2xl');
      const count = await cards.count();
      for (let i = 0; i < count; i += 1) {
        const card = cards.nth(i);
        const details = await this.getGoalCardDetails(card);
        if (details.status.trim() === 'Approved' && details.savedAmount > 0) {
          return card;
        }
      }

      const nextPageButton = this.page.locator('p-paginator button', { hasText: String(pageNum + 1) }).first();
      if (!(await nextPageButton.isVisible().catch(() => false))) {
        return null;
      }
      await nextPageButton.click();
      await this.page.waitForTimeout(500);
    }
    return null;
  }

  /**
   * Clicks "Withdraw" on a goal card — confirmed live 2026-09-17 this navigates straight to
   * `/withdraw/investment-list` (the same screen `WithdrawalPage.clickGetCashOption()` reaches
   * from the dashboard's general Withdraw entry point), skipping the "Choose Withdrawal Option"
   * dialog entirely. The goal's linked SIP appears there as a "SIP Plan: {goal name}" card
   * alongside Gold Vault and every other SIP — locate it with
   * `Withdrawsip.selectSipForWithdrawalByName()` rather than assuming position.
   */
  async clickWithdraw(goalCard: Locator): Promise<void> {
    await goalCard.getByRole('button', { name: /^Withdraw$/i }).click();
    await this.page.waitForURL(/\/withdraw\/investment-list/i, { timeout: 15_000 });
  }

  /**
   * Clicks "Save more" on an Approved goal card — confirmed live 2026-09-17 this navigates
   * (not a dialog) to `/goal-wise-sip/invest`, a gram-based top-up screen reusing the same
   * `p-slider` +/- stepper as the goal-creation wizard (step size 1 g/click), and its "Proceed
   * to Pay" button hands off into the standard one-time-buy summary at
   * `/digital-gold/buy/summary` — the same `BuySummaryPage` used by `digital-gold/buy`.
   */
  async clickSaveMore(goalCard: Locator): Promise<void> {
    await goalCard.getByRole('button', { name: /^Save more$/i }).click();
    await this.page.waitForURL(/\/goal-wise-sip\/invest/i, { timeout: 15_000 });
  }

  /** The "LIVE GOLD PRICE ₹X/g" banner shown on the `/goal-wise-sip/invest` Save More screen. */
  async getInvestLiveGoldPrice(): Promise<number> {
    const banner = this.page.getByText('LIVE GOLD PRICE', { exact: false });
    await banner.waitFor({ state: 'visible', timeout: 15_000 });
    const text = (await banner.innerText()).replace(/\s+/g, ' ').trim();
    const match = text.match(/₹\s*([\d,.]+)/);
    if (!match) {
      throw new Error(`Could not parse live gold price from: "${text}"`);
    }
    return this.parseAmount(match[1]);
  }

  /**
   * Save More's gram stepper — same `p-slider` +/- mechanics as the wizard, step size 1 g/click
   * (confirmed live 2026-09-17). A click can occasionally land before Angular re-renders the
   * displayed value (the same class of flake `selectGoalType` documents for the goal-type grid),
   * so this re-checks the settled value afterwards and issues correction clicks rather than
   * trusting the single click-count pass.
   */
  async setSaveMoreGrams(targetGrams: number): Promise<void> {
    await this.stepToValue(targetGrams, 1);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { current } = await this.getSliderBounds();
      if (current === targetGrams) return;
      await this.stepToValue(targetGrams, 1);
    }
  }

  /** The name/type pill shown at the top-left of a goal card (e.g. "Retirement", or a custom
   * name after a rename) — confirmed live 2026-09-16 this is the SAME element `goalCardsByName()`
   * matches on, and Rename overwrites it in place (there's no separate immutable "type" field). */
  async getGoalName(goalCard: Locator): Promise<string> {
    const namePill = goalCard.locator('p').first();
    return (await namePill.textContent())?.trim() ?? '';
  }

  /**
   * Scans the `/goal-wise-sip` listing for the first goal card with status "Approved",
   * paginating forward (via the PrimeNG `p-paginator`) if none is found on the current page.
   * Only Approved goals expose Save More/Withdraw and the Rename/Edit/Pause menu — confirmed live
   * 2026-09-16 every other status (Pending/Failed/Paused) still shows the menu but this suite has
   * only verified it against an Approved goal. Returns `null` if no Approved goal exists within
   * `maxPages`.
   */
  async findApprovedGoalCard(maxPages = 6): Promise<Locator | null> {
    for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
      const cards = this.page.locator('div.bg-white.rounded-2xl');
      const count = await cards.count();
      for (let i = 0; i < count; i += 1) {
        const card = cards.nth(i);
        const status = await this.getGoalStatus(card);
        if (status.trim() === 'Approved') {
          return card;
        }
      }

      const nextPageButton = this.page.locator('p-paginator button', { hasText: String(pageNum + 1) }).first();
      if (!(await nextPageButton.isVisible().catch(() => false))) {
        return null;
      }
      await nextPageButton.click();
      await this.page.waitForTimeout(500);
    }
    return null;
  }

  /**
   * Scans the `/goal-wise-sip` listing for a goal card containing this name, paginating forward
   * if it's not on the current page. Confirmed live 2026-09-16: renaming or editing a goal can
   * change its position in the listing (appears to re-sort by last-modified), so a card just
   * mutated should be re-located this way rather than assumed to still be on page 1.
   *
   * Deliberately uses a substring match (`hasText`), NOT `goalCardsByName()`'s exact `getByText`
   * match — confirmed live 2026-09-16 that exact match returns zero results for a multi-word
   * custom name (e.g. after a Rename) even though the card is genuinely on the page, for reasons
   * not fully understood (possibly how Playwright's exact-text engine handles this card's DOM
   * structure for multi-word text). `goalCardsByName()` itself is left untouched since every
   * existing goal-based-sip spec calls it successfully with single-word type names ("Home",
   * "Wedding", etc.) — only this method (used solely for re-locating a just-renamed/edited goal)
   * needed the substring fallback. Returns `null` if no matching card exists within `maxPages`.
   */
  async findGoalCardByName(name: string, maxPages = 6): Promise<Locator | null> {
    for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
      const card = this.page.locator('div.bg-white.rounded-2xl').filter({ hasText: name }).first();
      if (await card.isVisible().catch(() => false)) {
        return card;
      }

      const nextPageButton = this.page.locator('p-paginator button', { hasText: String(pageNum + 1) }).first();
      if (!(await nextPageButton.isVisible().catch(() => false))) {
        return null;
      }
      await nextPageButton.click();
      await this.page.waitForTimeout(500);
    }
    return null;
  }

  /** Opens a goal card's 3-dot ("⋮") menu and returns the resulting popover, which offers
   * Rename / Edit / Pause — confirmed live 2026-09-16 only reachable from an Approved goal. */
  async openGoalCardMenu(goalCard: Locator): Promise<Locator> {
    await goalCard.locator('i.pi-ellipsis-v').click();
    const popover = this.page.locator('[role="dialog"]').last();
    await popover.waitFor({ state: 'visible', timeout: 10_000 });
    return popover;
  }

  async clickMenuOption(popover: Locator, option: 'Rename' | 'Edit' | 'Pause'): Promise<void> {
    await popover.getByText(option, { exact: true }).click();
  }

  /** Rename dialog ("Rename your goal") — a single text input pre-filled with the goal's current
   * name, plus a "Rename" submit button. */
  async getRenameDialogValue(): Promise<string> {
    const dialog = this.page.locator('[role="dialog"]').last();
    return dialog.locator('input').inputValue();
  }

  async submitRename(newName: string): Promise<void> {
    const dialog = this.page.locator('[role="dialog"]').last();
    await dialog.locator('input').fill(newName);
    await dialog.getByRole('button', { name: 'Rename', exact: true }).click();
  }

  /** Pause dialog — confirmed live 2026-09-16: a duration choice (one of these 4 labels), then
   * "Pause Sip" to confirm or "Cancel" to back out. */
  async selectPauseDuration(
    label: 'Pause For 1 Month' | 'Pause For 2 Month' | 'Pause For 3 Month' | 'Pause Until Manually Activated',
  ): Promise<void> {
    const dialog = this.page.locator('[role="dialog"]').last();
    await dialog.getByText(label, { exact: true }).click();
  }

  async confirmPauseSip(): Promise<void> {
    const dialog = this.page.locator('[role="dialog"]').last();
    await dialog.getByRole('button', { name: 'Pause Sip', exact: true }).click();
  }
}
