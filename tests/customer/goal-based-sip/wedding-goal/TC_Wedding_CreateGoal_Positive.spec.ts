import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Positive-path coverage for the Wedding Goal-Based SIP creation flow (GBSIP-001), against
 * `tests/customer/Goal-Based SIP Test Plan.md` TC_GBSIP_001/002/003/007/008/009.
 *
 * Stops at a successfully-generated payment QR code rather than completing payment.
 * Confirmed live 2026-09-01: clicking Proceed To Pay on a goal-linked SIP goes straight to a
 * UPI QR-code checkout — no "Secure UPI"/"Emandate" choice screen is reachable first (unlike the
 * plain Buy-Metal SIP flow, where `paymentPage.clickEmandate()` works after
 * `buySummaryPage.clickProceedToPay()`; confirmed by two failed attempts reusing
 * `paySipWithNewBankEmandate` from `flows/customer/sip-emandate.flow.ts`, both landing straight
 * on the QR modal with the Emandate button never appearing). A QR code requires scanning with a
 * phone to authorize, so full goal activation (Pending status, appearing under Your Savings)
 * cannot be verified headlessly until this gets a resolution — see the test plan's open items.
 * This test instead asserts everything automatable: the full wizard (type → year → budget →
 * frequency → computed SIP amount) reaches a correct, successful payment-gateway handoff.
 */
test.describe('TC_GBSIP_Wedding_Positive @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_001 | Wedding goal wizard reaches a correctly-generated payment QR for the computed SIP',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'wedding';
      const targetYear = 2036;
      const targetBudget = 150_000;
      const frequency = 'Daily';

      console.log('[TC_GBSIP_001] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      await test.step('TC_GBSIP_001 | Select Wedding from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        console.log('[TC_GBSIP_001] Entered goal type:', goalType);
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

      let dailyAmount = 0;
      let sipStartYear = 0;
      let numberOfDays = 0;
      let expectedDailyAmount = 0;

      await test.step('TC_GBSIP_007_008 | Select Daily frequency and read the computed SIP amount', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        console.log('[TC_GBSIP_007] Entered frequency:', frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);
        dailyAmount = await goalWiseSipPage.getComputedSipAmount();
        console.log('[TC_GBSIP_008] Computed Daily SIP amount:', dailyAmount);

        const sipStartDate = new Date();
        sipStartYear = sipStartDate.getFullYear();
        const numberOfYears = targetYear - sipStartYear;
        numberOfDays = numberOfYears * 365;
        expectedDailyAmount = targetBudget / numberOfDays;
        console.log(
          '[TC_GBSIP_008] SIP start year:', sipStartYear,
          '| Goal target year:', targetYear,
          '| Number of years:', numberOfYears,
          '| Number of days (years*365):', numberOfDays,
          '| Expected daily amount (budget/days):', expectedDailyAmount.toFixed(2),
        );
        expect(dailyAmount).toBeGreaterThan(0);
        expect(Math.abs(dailyAmount - expectedDailyAmount)).toBeLessThanOrEqual(3);
      });

      await test.step('TC_GBSIP_009 | Summary reflects the goal-wizard selections', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_009] Verifying summary — goalType:', goalType, '| frequency:', frequency, '| amount: ₹', dailyAmount);
        await expect(page.getByText('Wedding', { exact: true })).toBeVisible();
        await expect(page.getByText('Daily', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(`₹ ${dailyAmount}`, { exact: false }).first()).toBeVisible();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_009] SIP Start Date — expected (next date):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('TC_GBSIP_009b | Proceed To Pay generates a valid payment QR', async () => {
        await buySummaryPage.clickProceedToPay();
        const qrModal = page.getByText('Payment QR Code', { exact: true });
        await expect(qrModal).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/QR Code is valid for \d{2}:\d{2} minutes/i)).toBeVisible();
        console.log('[TC_GBSIP_009b] Payment QR generated successfully for the Wedding goal SIP.');
      });

      await test.step('Cleanup — close the QR and cancel rather than leaving a stray pending payment', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });
        await buySummaryPage.cancelSipFlow();
      });

      console.log('[TC_GBSIP_001] ==================== Test data summary ====================');
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
