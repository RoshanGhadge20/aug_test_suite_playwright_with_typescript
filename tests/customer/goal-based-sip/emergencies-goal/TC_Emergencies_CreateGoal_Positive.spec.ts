import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Positive-path coverage for the Emergencies Goal-Based SIP creation flow (GBSIP-001), against
 * `tests/customer/Goal-Based SIP Test Plan.md` — the 4th card on `/goal-wise-sip`, same
 * year → budget → frequency wizard as Wedding/Home/Education (see
 * `TC_Wedding_CreateGoal_Positive.spec.ts`). Confirmed live but with no corresponding CR (same
 * status as Special Ones/Retirement — see the test plan's §2.5 open item).
 *
 * Stops at a successfully-generated payment QR code rather than completing payment. Clicking
 * Proceed To Pay on a goal-linked SIP goes straight to a UPI QR-code checkout at this (low, Daily)
 * amount — no "Secure UPI"/"Emandate" choice screen is reachable first. A QR code requires
 * scanning with a phone to authorize, so this test asserts everything automatable: the full
 * wizard (type → year → budget → frequency → computed SIP amount) reaches a correct, successful
 * payment-gateway handoff.
 */
test.describe('TC_GBSIP_Emergencies_Positive @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_Emergencies_001 | Emergencies goal wizard reaches a correctly-generated payment QR for the computed SIP',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'emergencies';
      const targetYear = 2035;
      const targetBudget = 200_000;
      const frequency = 'Daily';

      console.log('[TC_GBSIP_Emergencies_001] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      await test.step('TC_GBSIP_Emergencies_001 | Select Emergencies from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        console.log('[TC_GBSIP_Emergencies_001] Entered goal type:', goalType);
        // Confirmed live 2026-09-16: unlike Wedding/Home/Education (year first, then budget),
        // Emergencies asks for the budget FIRST ("Set your emergency goal amount") and the year
        // second ("How long do you want to save for?") — the wizard step order is reversed.
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/emergencies/i);
      });

      await test.step('TC_GBSIP_Emergencies_002 | Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        const bounds = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_Emergencies_002] Budget slider bounds:', bounds);
        expect(bounds.min).toBe(100_000);
        expect(bounds.max).toBe(10_000_000);

        await goalWiseSipPage.setBudget(targetBudget);
        console.log('[TC_GBSIP_Emergencies_002] Entered target budget:', targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_Emergencies_002] Slider confirmed budget:', current);
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/emergencies/i);
      });

      await test.step('TC_GBSIP_Emergencies_003 | Select a valid year within 2030-2050', async () => {
        await goalWiseSipPage.setYear(targetYear);
        console.log('[TC_GBSIP_Emergencies_003] Entered target year:', targetYear);
        const { current } = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_Emergencies_003] Slider confirmed year:', current);
        expect(current).toBe(targetYear);
        // Confirmed live 2026-09-16: unlike the budget step ("Start planning"), the year step's
        // own continue button is labeled "Proceed to pay" — the same locator
        // GoalWiseSipPage.clickProceedToPay() already targets, reused here.
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/emergencies/i);
      });

      let dailyAmount = 0;
      let sipStartYear = 0;
      let numberOfDays = 0;
      let expectedDailyAmount = 0;

      await test.step('TC_GBSIP_Emergencies_007_008 | Select Daily frequency and read the computed SIP amount', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        console.log('[TC_GBSIP_Emergencies_007] Entered frequency:', frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);
        dailyAmount = await goalWiseSipPage.getComputedSipAmount();
        console.log('[TC_GBSIP_Emergencies_008] Computed Daily SIP amount:', dailyAmount);

        const sipStartDate = new Date();
        sipStartYear = sipStartDate.getFullYear();
        const numberOfYears = targetYear - sipStartYear;
        numberOfDays = numberOfYears * 365;
        expectedDailyAmount = targetBudget / numberOfDays;
        console.log(
          '[TC_GBSIP_Emergencies_008] SIP start year:', sipStartYear,
          '| Goal target year:', targetYear,
          '| Number of years:', numberOfYears,
          '| Number of days (years*365):', numberOfDays,
          '| Expected daily amount (budget/days):', expectedDailyAmount.toFixed(2),
        );
        expect(dailyAmount).toBeGreaterThan(0);
        expect(Math.abs(dailyAmount - expectedDailyAmount)).toBeLessThanOrEqual(3);
      });

      await test.step('TC_GBSIP_Emergencies_009 | Summary reflects the goal-wizard selections', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_Emergencies_009] Verifying summary — goalType:', goalType, '| frequency:', frequency, '| amount: ₹', dailyAmount);
        await expect(page.locator('#sip-information').getByText('Emergencies', { exact: true })).toBeVisible();
        await expect(page.getByText('Daily', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(new RegExp(`₹\\s?${dailyAmount}(?![\\d,])`)).first()).toBeVisible();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_Emergencies_009] SIP Start Date — expected (next date):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('TC_GBSIP_Emergencies_009b | Proceed To Pay generates a valid payment QR', async () => {
        await buySummaryPage.clickProceedToPay();
        const qrModal = page.getByText('Payment QR Code', { exact: true });
        await expect(qrModal).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/QR Code is valid for \d{2}:\d{2} minutes/i)).toBeVisible();
        console.log('[TC_GBSIP_Emergencies_009b] Payment QR generated successfully for the Emergencies goal SIP.');
      });

      await test.step('Cleanup — close the QR and cancel rather than leaving a stray pending payment', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });
        await buySummaryPage.cancelSipFlow();
      });

      console.log('[TC_GBSIP_Emergencies_001] ==================== Test data summary ====================');
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
