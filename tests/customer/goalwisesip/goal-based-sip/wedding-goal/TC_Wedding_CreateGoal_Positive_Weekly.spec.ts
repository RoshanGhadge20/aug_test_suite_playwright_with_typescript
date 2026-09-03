import { test, expect } from '../../../../../fixtures/base.fixture';

/**
 * Positive-path coverage for the Wedding Goal-Based SIP creation flow (GBSIP-001) with **Weekly**
 * frequency, mirroring `TC_Wedding_CreateGoal_Positive.spec.ts` (Daily) — see that file and
 * `tests/customer/Goal-Based SIP Test Plan.md` TC_GBSIP_007/008 for background. Weekly/Monthly
 * recalculation was previously unverified; this closes the Weekly gap.
 *
 * Stops at a successfully-generated payment QR code rather than completing payment — same
 * UPI-QR-only checkout blocker documented in the sibling Daily spec.
 */
test.describe('TC_GBSIP_Wedding_Positive_Weekly @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_001_Weekly | Wedding goal wizard reaches a correctly-generated payment QR for the computed Weekly SIP',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'wedding';
      const targetYear = 2036;
      const targetBudget = 150_000;
      const frequency = 'Weekly';

      console.log('[TC_GBSIP_001_Weekly] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      await test.step('TC_GBSIP_001 | Select Wedding from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        console.log('[TC_GBSIP_001_Weekly] Entered goal type:', goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/wedding/i);
      });

      await test.step('TC_GBSIP_002 | Select a valid year within 2030-2050', async () => {
        await goalWiseSipPage.setYear(targetYear);
        console.log('[TC_GBSIP_002] Entered target year:', targetYear);
        const { current } = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_002] Slider confirmed year:', current);
        expect(current).toBe(targetYear);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/wedding/i);
      });

      await test.step('TC_GBSIP_003 | Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        await goalWiseSipPage.setBudget(targetBudget);
        console.log('[TC_GBSIP_003] Entered target budget:', targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_003] Slider confirmed budget:', current);
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/wedding/i);
      });

      let weeklyAmount = 0;
      let sipStartYear = 0;
      let numberOfDays = 0;
      let numberOfWeeks = 0;
      let expectedWeeklyAmount = 0;

      await test.step('TC_GBSIP_007_008 | Select Weekly frequency and read the computed SIP amount', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        console.log('[TC_GBSIP_007_Weekly] Entered frequency:', frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);
        weeklyAmount = await goalWiseSipPage.getComputedSipAmount();
        console.log('[TC_GBSIP_008_Weekly] Computed Weekly SIP amount:', weeklyAmount);

        const sipStartDate = new Date();
        sipStartYear = sipStartDate.getFullYear();
        // Goal end date = the selected goal year's date, i.e. today's day/month carried
        // forward into targetYear (an exact N-year tenure from today).
        const goalEndDate = new Date(targetYear, sipStartDate.getMonth(), sipStartDate.getDate());
        numberOfDays = Math.round(
          (goalEndDate.getTime() - sipStartDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        numberOfWeeks = numberOfDays / 7;
        expectedWeeklyAmount = targetBudget / numberOfWeeks;
        console.log(
          '[TC_GBSIP_008_Weekly] SIP start date:', sipStartDate.toDateString(),
          '| Goal end date:', goalEndDate.toDateString(),
          '| Total days (start to goal end date):', numberOfDays,
          '| Total weeks (days/7):', numberOfWeeks,
          '| Expected weekly amount (budget/weeks):', expectedWeeklyAmount.toFixed(2),
        );
        expect(weeklyAmount).toBeGreaterThan(0);
        expect(Math.abs(weeklyAmount - expectedWeeklyAmount)).toBeLessThanOrEqual(3);
      });

      await test.step('TC_GBSIP_009 | Summary reflects the goal-wizard selections', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_009_Weekly] Verifying summary — goalType:', goalType, '| frequency:', frequency, '| amount: ₹', weeklyAmount);
        await expect(page.getByText('Wedding', { exact: true })).toBeVisible();
        await expect(page.getByText('Weekly', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(`₹ ${weeklyAmount}`, { exact: false }).first()).toBeVisible();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_009_Weekly] SIP Start Date — expected (next date):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('TC_GBSIP_009b | Proceed To Pay generates a valid payment QR', async () => {
        await buySummaryPage.clickProceedToPay();
        const qrModal = page.getByText('Payment QR Code', { exact: true });
        await expect(qrModal).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/QR Code is valid for \d{2}:\d{2} minutes/i)).toBeVisible();
        console.log('[TC_GBSIP_009b_Weekly] Payment QR generated successfully for the Wedding goal SIP.');
      });

      await test.step('Cleanup — close the QR and cancel rather than leaving a stray pending payment', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });
        await buySummaryPage.cancelSipFlow();
      });

      console.log('[TC_GBSIP_001_Weekly] ==================== Test data summary ====================');
      console.table({
        goalType,
        targetYear,
        targetBudget,
        frequency,
        sipStartYear,
        numberOfDays,
        numberOfWeeks,
        expectedWeeklyAmount: expectedWeeklyAmount.toFixed(2),
        actualWeeklyAmount: weeklyAmount,
      });
    },
  );
});
