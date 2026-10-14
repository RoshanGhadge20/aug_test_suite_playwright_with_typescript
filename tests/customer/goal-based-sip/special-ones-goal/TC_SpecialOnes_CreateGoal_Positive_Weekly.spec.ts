import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Positive-path coverage for the "Special Ones" Goal-Based SIP creation flow with **Weekly**
 * frequency, mirroring `TC_SpecialOnes_CreateGoal_Positive.spec.ts` (Daily) — see that file and
 * `tests/customer/Goal-Based SIP Test Plan.md` for background on this goal type's date-picker
 * step 1.
 *
 * Unlike the year-based goal types, Special Ones' tenure is an exact picked date rather than just
 * a target year, so the expected weekly amount here is computed from the precise
 * today → special-date day count, not a year-only approximation.
 *
 * Stops at a successfully-generated payment QR code rather than completing payment: a goal-linked
 * SIP checkout is UPI-QR-only and cannot be authorized headlessly.
 */
test.describe('TC_GBSIP_SpecialOnes_Positive_Weekly @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_SpecialOnes_001_Weekly | Special Ones goal wizard reaches a correctly-generated payment QR for the computed Weekly SIP',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'specialOnes';
      const specialDate = { day: 15, month: 6, year: 2028 };
      const targetBudget = 150_000;
      const frequency = 'Weekly';

      await test.step('TC_GBSIP_SpecialOnes_001 | Select Special Ones from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-date\/special-ones/i);
      });

      await test.step('TC_GBSIP_SpecialOnes_002 | Pick the special date from the calendar and continue', async () => {
        await goalWiseSipPage.setSpecialDate(specialDate);
        const dateValue = await goalWiseSipPage.getSpecialDateValue();
        console.log('[TC_GBSIP_SpecialOnes_002_Weekly] Special date selected:', dateValue);
        expect(dateValue).toContain(String(specialDate.year));

        await goalWiseSipPage.clickSelectAmount();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/special-ones/i);
      });

      await test.step('TC_GBSIP_SpecialOnes_003 | Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        const bounds = await goalWiseSipPage.getSliderBounds();
        expect(bounds.min).toBe(100_000);
        // Special Ones budget is capped at ₹10 lakh (other goals stay at ₹1 crore) — confirmed 2026-10-06.
        expect(bounds.max).toBe(1_000_000);

        await goalWiseSipPage.setBudget(targetBudget);
        console.log('[TC_GBSIP_SpecialOnes_003_Weekly] Entered target budget:', targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/special-ones/i);
      });

      let weeklyAmount = 0;
      let numberOfDays = 0;
      let numberOfWeeks = 0;
      let expectedWeeklyAmount = 0;

      await test.step('TC_GBSIP_SpecialOnes_007_008 | Select Weekly frequency and read the computed SIP amount', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        console.log('[TC_GBSIP_SpecialOnes_007_Weekly] Entered frequency:', frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);
        weeklyAmount = await goalWiseSipPage.getComputedSipAmount();
        console.log('[TC_GBSIP_SpecialOnes_008_Weekly] Computed Weekly SIP amount:', weeklyAmount);

        const sipStartDate = new Date();
        const goalEndDate = new Date(specialDate.year, specialDate.month - 1, specialDate.day);
        numberOfDays = Math.round((goalEndDate.getTime() - sipStartDate.getTime()) / (1000 * 60 * 60 * 24));
        numberOfWeeks = numberOfDays / 7;
        expectedWeeklyAmount = targetBudget / numberOfWeeks;
        console.log(
          '[TC_GBSIP_SpecialOnes_008_Weekly] SIP start date:', sipStartDate.toDateString(),
          '| Special date (goal end):', goalEndDate.toDateString(),
          '| Total days:', numberOfDays,
          '| Total weeks (days/7):', numberOfWeeks,
          '| Expected weekly amount (budget/weeks):', expectedWeeklyAmount.toFixed(2),
        );
        expect(weeklyAmount).toBeGreaterThan(0);
        // The app divides by a whole number of weeks and rounds, so allow anything between
        // budget/ceil(weeks) and budget/floor(weeks) (seen 2026-10-06: 88.14 weeks → app ₹1705 vs ₹1701.78).
        const minWeekly = Math.floor(targetBudget / Math.ceil(numberOfWeeks));
        const maxWeekly = Math.ceil(targetBudget / Math.floor(numberOfWeeks));
        console.log('[TC_GBSIP_SpecialOnes_008_Weekly] Accepted weekly range:', minWeekly, '–', maxWeekly);
        expect(weeklyAmount).toBeGreaterThanOrEqual(minWeekly);
        expect(weeklyAmount).toBeLessThanOrEqual(maxWeekly);
      });

      await test.step('TC_GBSIP_SpecialOnes_009 | Summary reflects the goal-wizard selections', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_SpecialOnes_009_Weekly] Verifying summary — frequency:', frequency, '| amount: ₹', weeklyAmount);
        await expect(page.getByText('Special Ones', { exact: true })).toBeVisible();
        await expect(page.getByText('Weekly', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(new RegExp(`₹\\s?${weeklyAmount}(?![\\d,])`)).first()).toBeVisible();

        // The next-day SIP start rule for amounts at/below ₹1,00,000 was confirmed live for
        // Weekly Wedding SIPs — carried over here as a payment-gateway rule rather than a
        // goal-type-specific one, since ₹150,000/weeks stays well under that threshold.
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_SpecialOnes_009_Weekly] SIP Start Date — expected (next date):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('TC_GBSIP_SpecialOnes_009b | Proceed To Pay generates a valid payment QR', async () => {
        await buySummaryPage.clickProceedToPay();
        const qrModal = page.getByText('Payment QR Code', { exact: true });
        await expect(qrModal).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/QR Code is valid for \d{2}:\d{2} minutes/i)).toBeVisible();
        console.log('[TC_GBSIP_SpecialOnes_009b_Weekly] Payment QR generated successfully for the Special Ones goal SIP.');
      });

      await test.step('Cleanup — close the QR and cancel rather than leaving a stray pending payment', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });
        await buySummaryPage.cancelSipFlow();
      });

      console.log('[TC_GBSIP_SpecialOnes_001_Weekly] ==================== Test data summary ====================');
      console.table({
        goalType,
        specialDate: `${specialDate.day}/${specialDate.month}/${specialDate.year}`,
        targetBudget,
        frequency,
        numberOfDays,
        numberOfWeeks,
        expectedWeeklyAmount: expectedWeeklyAmount.toFixed(2),
        actualWeeklyAmount: weeklyAmount,
      });
    },
  );
});
