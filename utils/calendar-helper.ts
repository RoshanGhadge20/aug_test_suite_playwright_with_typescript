import { Locator, Page } from '@playwright/test';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface CalendarDate {
  day: number;
  /** 1-12 */
  month: number;
  year: number;
}

/**
 * Drives a PrimeNG `p-calendar` date input by clicking through its year/month/day picker.
 * `.fill()`/`.type()` on these inputs updates the visible text but not the underlying
 * Angular form control, leaving the field stuck in a "required" validation state —
 * confirmed on both the KYC (`#dateOfBirth`) and My Profile edit-modal DOB fields.
 *
 * Confirmed live: this widget can reset back to its default day-view mid-sequence (e.g. after
 * a `force: true` click lands slightly off-target during an overlay animation), which then makes
 * any later step in a single linear pass fail confusingly (looking for a year/day that's no
 * longer the active panel mode). Rather than trying to patch each individual step, the whole
 * open-picker -> year -> month -> day sequence is retried from scratch a few times.
 */
export async function setPrimeCalendarDate(page: Page, dateInput: Locator, date: CalendarDate): Promise<void> {
  const maxAttempts = 4;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await attemptSetPrimeCalendarDate(page, dateInput, date);
      const value = await dateInput.inputValue().catch(() => '');
      if (value.trim().length > 0) {
        return;
      }
      lastError = new Error(`DOB input still empty after attempt ${attempt}`);
    } catch (error) {
      lastError = error;
    }
    // Close whatever state the picker is in and let the next attempt start clean.
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(300);
  }

  throw new Error(
    `setPrimeCalendarDate: failed to set ${date.day}/${date.month}/${date.year} after ${maxAttempts} attempts. ` +
    `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

async function attemptSetPrimeCalendarDate(page: Page, dateInput: Locator, date: CalendarDate): Promise<void> {
  await dateInput.scrollIntoViewIfNeeded();
  await dateInput.click();

  const datepicker = page.locator('.p-datepicker');
  await datepicker.waitFor({ state: 'visible', timeout: 10_000 });

  await clickByExactText(datepicker.locator('.p-datepicker-year'));
  await navigateToDecadeContaining(page, date.year);

  const yearOption = datepicker.locator('span, button').filter({ hasText: exactTextPattern(String(date.year)) });
  const foundOnFirstPass = await yearOption.first().isVisible({ timeout: 3_000 }).catch(() => false);
  if (!foundOnFirstPass) {
    await navigateToDecadeContaining(page, date.year, 3);
  }
  await clickByExactText(yearOption.first());

  const monthLabel = MONTH_ABBR[date.month - 1];
  const monthOption = datepicker.locator('span, button').filter({ hasText: exactTextPattern(monthLabel) });
  await clickByExactText(monthOption.first());

  const dayCell = datepicker
    .locator('td:not(.p-datepicker-other-month)')
    .filter({ hasText: exactTextPattern(String(date.day)) });
  await clickByExactText(dayCell.first());
}

/**
 * PrimeNG pads each cell's text node (e.g. `" 2001 "`, not `"2001"`) — confirmed live via DOM
 * dump. Playwright's `hasText` RegExp matching does NOT trim/normalize whitespace the way its
 * plain-string matching does, so a naive `^2001$` anchor never matches and silently returns zero
 * elements (which then surfaces confusingly as a "waiting for locator to be visible" timeout,
 * not a clear "0 matches" error). Tolerate the padding explicitly instead.
 */
function exactTextPattern(value: string): RegExp {
  return new RegExp(`^\\s*${value}\\s*$`);
}

/**
 * PrimeNG re-renders this widget's panel on every mode transition (decade -> year -> month ->
 * day), which can leave Playwright's strict actionability check (element must be visible AND
 * stable AND not obscured) polling against a node that keeps getting replaced — timing out even
 * though the element is plainly visible and clickable on screen (confirmed live: the original
 * manual exploration bypassed this identically, using a raw in-page `element.click()` rather than
 * Playwright's locator click). `force: true` skips those checks; a short settle wait afterwards
 * gives the next panel time to finish rendering before the next lookup.
 */
async function clickByExactText(locator: Locator): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout: 10_000 });
  await locator.click({ force: true });
  await locator.page().waitForTimeout(400);
}

/** Pages the decade picker with prev/next until the visible range (e.g. "1990 - 1999") contains `targetYear`. */
async function navigateToDecadeContaining(page: Page, targetYear: number, maxHops = 12): Promise<void> {
  const title = page.locator('.p-datepicker-title');
  for (let hop = 0; hop < maxHops; hop += 1) {
    // Give any pending re-render from the previous hop's click a moment to flush before reading
    // the title — reading too eagerly risks acting on stale text (confirmed live flakiness).
    await page.waitForTimeout(200);
    const label = (await title.first().textContent())?.trim() ?? '';
    const match = label.match(/(\d{4})\s*-\s*(\d{4})/);
    if (!match) return;
    const [start, end] = [Number(match[1]), Number(match[2])];
    if (targetYear >= start && targetYear <= end) return;
    const pager = page.locator(targetYear < start ? '.p-datepicker-prev' : '.p-datepicker-next');
    await pager.click({ force: true });
    await page.waitForTimeout(500);
  }
}
