import { test, expect } from '../../../../../fixtures/base.fixture';

/**
 * Positive-path coverage for the "Special Ones" Goal-Based SIP creation flow — the 5th card on
 * `/goal-wise-sip`, confirmed live but with no corresponding CR (see
 * `tests/customer/Goal-Based SIP Test Plan.md` §2.5 open item 4).
 *
 * Step 1 ("When is the special day?", route `/select-date/special-ones`) is a `p-datepicker`
 * text input, driven here via `setSpecialDate()` — confirmed live to be the same PrimeNG widget
 * `setPrimeCalendarDate` already drives for KYC/profile DOB fields. Its continue button is
 * labeled "Select amount".
 *
 * Stops at a successfully-generated payment QR code rather than completing payment: a goal-linked
 * SIP checkout is UPI-QR-only and cannot be authorized headlessly.
 */
test.describe('TC_GBSIP_SpecialOnes_Positive @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_SpecialOnes_001 | Special Ones goal wizard reaches a correctly-generated payment QR for the computed SIP',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'specialOnes';
      const specialDate = { day: 15, month: 6, year: 2028 };
      const targetBudget = 250_000;
      const frequency = 'Daily';

      await test.step('TC_GBSIP_SpecialOnes_001 | Select Special Ones from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-date\/special-ones/i);
      });

      await test.step('TC_GBSIP_SpecialOnes_002 | Pick the special date from the calendar and continue', async () => {
        await goalWiseSipPage.setSpecialDate(specialDate);
        const dateValue = await goalWiseSipPage.getSpecialDateValue();
        console.log('[TC_GBSIP_SpecialOnes_002] Special date selected:', dateValue);
        expect(dateValue).toContain(String(specialDate.year));

        await goalWiseSipPage.clickSelectAmount();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/special-ones/i);
      });

      await test.step('TC_GBSIP_SpecialOnes_003 | Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        const bounds = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_SpecialOnes_003] Budget slider bounds:', bounds);
        expect(bounds.min).toBe(100_000);
        expect(bounds.max).toBe(10_000_000);

        await goalWiseSipPage.setBudget(targetBudget);
        console.log('[TC_GBSIP_SpecialOnes_003] Entered target budget:', targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/special-ones/i);
      });

      let dailyAmount = 0;

      await test.step('TC_GBSIP_SpecialOnes_007_008 | Select Daily frequency and read the computed SIP amount', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        console.log('[TC_GBSIP_SpecialOnes_007] Entered frequency:', frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);
        dailyAmount = await goalWiseSipPage.getComputedSipAmount();
        console.log('[TC_GBSIP_SpecialOnes_008] Computed Daily SIP amount:', dailyAmount);
        expect(dailyAmount).toBeGreaterThan(0);
      });

      await test.step('TC_GBSIP_SpecialOnes_009 | Summary reflects the goal-wizard selections', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_SpecialOnes_009] Verifying summary — frequency:', frequency, '| amount: ₹', dailyAmount);
        // "Special Ones" confirmed live as the Investment Purpose label on the summary page.
        await expect(page.getByText('Special Ones', { exact: true })).toBeVisible();
        await expect(page.getByText('Daily', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(`₹ ${dailyAmount}`, { exact: false }).first()).toBeVisible();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_SpecialOnes_009] SIP Start Date — expected (next date):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('TC_GBSIP_SpecialOnes_009b | Proceed To Pay generates a valid payment QR', async () => {
        await buySummaryPage.clickProceedToPay();
        const qrModal = page.getByText('Payment QR Code', { exact: true });
        await expect(qrModal).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/QR Code is valid for \d{2}:\d{2} minutes/i)).toBeVisible();
        console.log('[TC_GBSIP_SpecialOnes_009b] Payment QR generated successfully for the Special Ones goal SIP.');
      });

      await test.step('Cleanup — close the QR and cancel rather than leaving a stray pending payment', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });
        await buySummaryPage.cancelSipFlow();
      });

      console.log('[TC_GBSIP_SpecialOnes_001] ==================== Test data summary ====================');
      console.table({
        goalType,
        specialDate: `${specialDate.day}/${specialDate.month}/${specialDate.year}`,
        targetBudget,
        frequency,
        dailyAmount,
      });
    },
  );
});
