import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Daily-frequency SIP-amount boundary coverage for the Retirement Goal-Based SIP creation flow
 * (GBSIP-001), mirroring `TC_Wedding_Daily_MaxAmount.spec.ts` / `TC_Home_Daily_MaxAmount.spec.ts`.
 * Pushes the Daily SIP-amount slider to its own ceiling and asserts that ceiling is exactly
 * ₹99,999 — a payment-gateway-level cap confirmed consistent across goal types.
 *
 * Stops at a successfully-generated payment QR code rather than completing payment.
 */
test.describe('TC_GBSIP_Retirement_Daily_MaxAmount @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_Retirement_Daily_MaxAmount | Retirement Daily SIP-amount slider caps at ₹99,999 and reaches a valid payment QR',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'retirement';
      const targetYear = 2035;
      const targetBudget = 150_000;
      const frequency = 'Daily';
      const expectedMaxDailyAmount = 99_999;

      console.log('[TC_GBSIP_Retirement_Daily_MaxAmount] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      await test.step('Select Retirement from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        console.log('[TC_GBSIP_Retirement_Daily_MaxAmount] Entered goal type:', goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/retirement/i);
      });

      await test.step('Select a valid year within 2030-2050', async () => {
        await goalWiseSipPage.setYear(targetYear);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetYear);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/retirement/i);
      });

      await test.step('Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        await goalWiseSipPage.setBudget(targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/retirement/i);
      });

      let dailyAmount = 0;

      await test.step('Select Daily frequency and push the SIP-amount slider to its ceiling', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);

        const boundsBefore = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_Retirement_Daily_MaxAmount] SIP-amount slider bounds before selecting max:', boundsBefore);
        expect(boundsBefore.max).toBe(expectedMaxDailyAmount);

        dailyAmount = await goalWiseSipPage.jumpSliderToCeiling();
        console.log('[TC_GBSIP_Retirement_Daily_MaxAmount] SIP-amount slider value after selecting max:', dailyAmount);
        expect(dailyAmount).toBe(expectedMaxDailyAmount);
      });

      await test.step('Summary reflects the goal-wizard selections', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_Retirement_Daily_MaxAmount] ==================== Summary page details ====================');
        console.table({
          goalType,
          targetYear,
          targetBudget,
          frequency,
          dailyAmount,
          expectedMaxDailyAmount,
        });

        await expect(page.locator('#sip-information').getByText('Retirement', { exact: true })).toBeVisible();
        await expect(page.getByText('Daily', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(`₹ ${dailyAmount}`, { exact: false }).first()).toBeVisible();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_Retirement_Daily_MaxAmount] SIP Start Date — expected (next date):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('Proceed To Pay generates a valid payment QR', async () => {
        await buySummaryPage.clickProceedToPay();
        const qrModal = page.getByText('Payment QR Code', { exact: true });
        await expect(qrModal).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/QR Code is valid for \d{2}:\d{2} minutes/i)).toBeVisible();
        console.log('[TC_GBSIP_Retirement_Daily_MaxAmount] Payment QR generated and displayed successfully for the max Daily SIP amount.');
      });

      await test.step('Cleanup — close the QR and cancel rather than leaving a stray pending payment', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });
        await buySummaryPage.cancelSipFlow();
      });
    },
  );
});
