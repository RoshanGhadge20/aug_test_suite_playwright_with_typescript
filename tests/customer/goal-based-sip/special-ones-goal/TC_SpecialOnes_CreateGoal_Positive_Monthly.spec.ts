import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Positive-path coverage for the "Special Ones" Goal-Based SIP creation flow with **Monthly**
 * frequency, mirroring `TC_SpecialOnes_CreateGoal_Positive_Weekly.spec.ts` (Weekly) — see that
 * file and `tests/customer/Goal-Based SIP Test Plan.md` for background on this goal type's
 * date-picker step 1.
 *
 * Unlike the year-based goal types, Special Ones' tenure is an exact picked date rather than just
 * a target year, so the expected monthly amount here is computed from the precise
 * today → special-date calendar-month count, not a year-only approximation.
 *
 * Expected app behavior, confirmed live for Monthly goal SIPs: unlike Daily/Weekly (straight to
 * the payment QR), a Monthly goal SIP first shows a "Set Up Bank Mandate" dialog offering Secure
 * UPI (pre-selected) / Emandate before the QR is generated, and starts on the 1st of next month.
 */
test.describe('TC_GBSIP_SpecialOnes_Positive_Monthly @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_SpecialOnes_001_Monthly | Special Ones goal wizard reaches a correctly-generated payment QR for the computed Monthly SIP',
    async ({ page, goalWiseSipPage, buySummaryPage, paymentPage }) => {
      test.setTimeout(120_000);

      const goalType = 'specialOnes';
      const specialDate = { day: 15, month: 6, year: 2028 };
      const targetBudget = 150_000;
      const frequency = 'Monthly';

      await test.step('TC_GBSIP_SpecialOnes_001 | Select Special Ones from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-date\/special-ones/i);
      });

      await test.step('TC_GBSIP_SpecialOnes_002 | Pick the special date from the calendar and continue', async () => {
        await goalWiseSipPage.setSpecialDate(specialDate);
        const dateValue = await goalWiseSipPage.getSpecialDateValue();
        console.log('[TC_GBSIP_SpecialOnes_002_Monthly] Special date selected:', dateValue);
        expect(dateValue).toContain(String(specialDate.year));

        await goalWiseSipPage.clickSelectAmount();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/special-ones/i);
      });

      await test.step('TC_GBSIP_SpecialOnes_003 | Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        const bounds = await goalWiseSipPage.getSliderBounds();
        expect(bounds.min).toBe(100_000);
        expect(bounds.max).toBe(10_000_000);

        await goalWiseSipPage.setBudget(targetBudget);
        console.log('[TC_GBSIP_SpecialOnes_003_Monthly] Entered target budget:', targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/special-ones/i);
      });

      let monthlyAmount = 0;
      let numberOfDays = 0;
      let numberOfMonths = 0;
      let expectedMonthlyAmount = 0;

      await test.step('TC_GBSIP_SpecialOnes_007_008 | Select Monthly frequency and read the computed SIP amount', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        console.log('[TC_GBSIP_SpecialOnes_007_Monthly] Entered frequency:', frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);
        monthlyAmount = await goalWiseSipPage.getComputedSipAmount();
        console.log('[TC_GBSIP_SpecialOnes_008_Monthly] Computed Monthly SIP amount:', monthlyAmount);

        const sipStartDate = new Date();
        const goalEndDate = new Date(specialDate.year, specialDate.month - 1, specialDate.day);
        numberOfDays = Math.round((goalEndDate.getTime() - sipStartDate.getTime()) / (1000 * 60 * 60 * 24));
        numberOfMonths =
          (goalEndDate.getFullYear() - sipStartDate.getFullYear()) * 12 +
          (goalEndDate.getMonth() - sipStartDate.getMonth());
        expectedMonthlyAmount = targetBudget / numberOfMonths;
        console.log(
          '[TC_GBSIP_SpecialOnes_008_Monthly] SIP start date:', sipStartDate.toDateString(),
          '| Special date (goal end):', goalEndDate.toDateString(),
          '| Total days:', numberOfDays,
          '| Total months (calendar months between dates):', numberOfMonths,
          '| Expected monthly amount (budget/months):', expectedMonthlyAmount.toFixed(2),
        );
        expect(monthlyAmount).toBeGreaterThan(0);
        expect(Math.abs(monthlyAmount - expectedMonthlyAmount)).toBeLessThanOrEqual(3);
      });

      await test.step('TC_GBSIP_SpecialOnes_009 | Summary reflects the goal-wizard selections', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_SpecialOnes_009_Monthly] Verifying summary — frequency:', frequency, '| amount: ₹', monthlyAmount);
        await expect(page.getByText('Special Ones', { exact: true })).toBeVisible();
        await expect(page.getByText('Monthly', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(`₹ ${monthlyAmount}`, { exact: false }).first()).toBeVisible();

        // Confirmed live for Wedding: unlike Daily/Weekly (next calendar day), a Monthly SIP's
        // start date is the 1st of next month — carried over here as a payment-gateway rule
        // rather than a goal-type-specific one.
        const today = new Date();
        const nextMonthFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${nextMonthFirst.getFullYear()}-${pad(nextMonthFirst.getMonth() + 1)}-${pad(nextMonthFirst.getDate())}`;
        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_SpecialOnes_009_Monthly] SIP Start Date — expected (1st of next month):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('TC_GBSIP_SpecialOnes_009a_Monthly | Set Up Bank Mandate dialog offers Secure UPI and Emandate', async () => {
        await buySummaryPage.clickProceedToPay();

        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        await expect(bankMandateDialog).toBeVisible({ timeout: 10_000 });

        const { secureUpi, emandate } = await paymentPage.verifyUpiAndEmandateOptionsVisible();
        console.log('[TC_GBSIP_SpecialOnes_009a_Monthly] Set Up Bank Mandate options — Secure UPI visible:', secureUpi, '| Emandate visible:', emandate);
        expect(secureUpi).toBe(true);
        expect(emandate).toBe(true);

        const secureUpiBtn = page.getByRole('button', { name: 'Secure UPI' });
        await expect(secureUpiBtn).toBeVisible();
        console.log('[TC_GBSIP_SpecialOnes_009a_Monthly] Secure UPI is the pre-selected/active option — selecting it');
        await secureUpiBtn.click();
      });

      await test.step('TC_GBSIP_SpecialOnes_009b | Proceed To Pay generates a valid payment QR', async () => {
        const qrModal = page.getByText('Payment QR Code', { exact: true });
        await expect(qrModal).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/QR Code is valid for \d{2}:\d{2} minutes/i)).toBeVisible();
        console.log('[TC_GBSIP_SpecialOnes_009b_Monthly] Payment QR generated successfully for the Special Ones goal SIP.');
      });

      await test.step('Cleanup — close the QR and cancel rather than leaving a stray pending payment', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });

        // Monthly SIPs surface an extra "Set Up Bank Mandate" dialog beneath the QR — its mask
        // blocks the summary page's Cancel button until it's closed too.
        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        if (await bankMandateDialog.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape');
          await bankMandateDialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
        }

        await buySummaryPage.cancelSipFlow();
      });

      console.log('[TC_GBSIP_SpecialOnes_001_Monthly] ==================== Test data summary ====================');
      console.table({
        goalType,
        specialDate: `${specialDate.day}/${specialDate.month}/${specialDate.year}`,
        targetBudget,
        frequency,
        numberOfDays,
        numberOfMonths,
        expectedMonthlyAmount: expectedMonthlyAmount.toFixed(2),
        actualMonthlyAmount: monthlyAmount,
      });
    },
  );
});
