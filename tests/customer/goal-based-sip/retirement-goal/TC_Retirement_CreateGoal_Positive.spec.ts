import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Positive-path coverage for the Retirement Goal-Based SIP creation flow (GBSIP-001) — the 6th
 * (last) card on `/goal-wise-sip`, confirmed live but with no corresponding CR (same status as
 * Emergencies/Special Ones). Confirmed live 2026-09-16: Retirement follows the standard
 * year → budget → frequency wizard order (both step-continue buttons labeled "Start planning"),
 * same as Wedding/Home/Education — unlike Emergencies, which reverses that order.
 *
 * Stops at a successfully-generated payment QR code rather than completing payment. A QR code
 * requires scanning with a phone to authorize, so this test asserts everything automatable: the
 * full wizard (type → year → budget → frequency → computed SIP amount) reaches a correct,
 * successful payment-gateway handoff.
 */
test.describe('TC_GBSIP_Retirement_Positive @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_Retirement_001 | Retirement goal wizard reaches a correctly-generated payment QR for the computed SIP',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'retirement';
      const targetYear = 2035;
      const targetBudget = 200_000;
      const frequency = 'Daily';

      console.log('[TC_GBSIP_Retirement_001] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      await test.step('TC_GBSIP_Retirement_001 | Select Retirement from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        console.log('[TC_GBSIP_Retirement_001] Entered goal type:', goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/retirement/i);
      });

      await test.step('TC_GBSIP_Retirement_002 | Select a valid year within 2030-2050', async () => {
        await goalWiseSipPage.setYear(targetYear);
        console.log('[TC_GBSIP_Retirement_002] Entered target year:', targetYear);
        const { current } = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_Retirement_002] Slider confirmed year:', current);
        expect(current).toBe(targetYear);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/retirement/i);
      });

      await test.step('TC_GBSIP_Retirement_003 | Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        const bounds = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_Retirement_003] Budget slider bounds:', bounds);
        expect(bounds.min).toBe(100_000);
        expect(bounds.max).toBe(10_000_000);

        await goalWiseSipPage.setBudget(targetBudget);
        console.log('[TC_GBSIP_Retirement_003] Entered target budget:', targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_Retirement_003] Slider confirmed budget:', current);
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/retirement/i);
      });

      let dailyAmount = 0;
      let sipStartYear = 0;
      let numberOfDays = 0;
      let expectedDailyAmount = 0;

      await test.step('TC_GBSIP_Retirement_007_008 | Select Daily frequency and read the computed SIP amount', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        console.log('[TC_GBSIP_Retirement_007] Entered frequency:', frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);
        dailyAmount = await goalWiseSipPage.getComputedSipAmount();
        console.log('[TC_GBSIP_Retirement_008] Computed Daily SIP amount:', dailyAmount);

        const sipStartDate = new Date();
        sipStartYear = sipStartDate.getFullYear();
        const numberOfYears = targetYear - sipStartYear;
        numberOfDays = numberOfYears * 365;
        expectedDailyAmount = targetBudget / numberOfDays;
        console.log(
          '[TC_GBSIP_Retirement_008] SIP start year:', sipStartYear,
          '| Goal target year:', targetYear,
          '| Number of years:', numberOfYears,
          '| Number of days (years*365):', numberOfDays,
          '| Expected daily amount (budget/days):', expectedDailyAmount.toFixed(2),
        );
        expect(dailyAmount).toBeGreaterThan(0);
        expect(Math.abs(dailyAmount - expectedDailyAmount)).toBeLessThanOrEqual(3);
      });

      await test.step('TC_GBSIP_Retirement_009 | Summary reflects the goal-wizard selections', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_Retirement_009] Verifying summary — goalType:', goalType, '| frequency:', frequency, '| amount: ₹', dailyAmount);
        await expect(page.locator('#sip-information').getByText('Retirement', { exact: true })).toBeVisible();
        await expect(page.getByText('Daily', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(`₹ ${dailyAmount}`, { exact: false }).first()).toBeVisible();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_Retirement_009] SIP Start Date — expected (next date):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('TC_GBSIP_Retirement_009b | Proceed To Pay generates a valid payment QR', async () => {
        await buySummaryPage.clickProceedToPay();
        const qrModal = page.getByText('Payment QR Code', { exact: true });
        await expect(qrModal).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/QR Code is valid for \d{2}:\d{2} minutes/i)).toBeVisible();
        console.log('[TC_GBSIP_Retirement_009b] Payment QR generated successfully for the Retirement goal SIP.');
      });

      await test.step('Cleanup — close the QR and cancel rather than leaving a stray pending payment', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });
        await buySummaryPage.cancelSipFlow();
      });

      console.log('[TC_GBSIP_Retirement_001] ==================== Test data summary ====================');
      console.table({
        goalType,
        targetYear,
        targetBudget,
        frequency,
        sipStartYear,
        numberOfDays,
        expectedDailyAmount: expectedDailyAmount.toFixed(2),
        actualDailyAmount: dailyAmount,
      });
    },
  );
});
