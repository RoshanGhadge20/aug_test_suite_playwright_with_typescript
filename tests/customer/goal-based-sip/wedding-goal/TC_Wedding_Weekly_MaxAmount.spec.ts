import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Weekly-frequency SIP-amount boundary coverage for the Wedding Goal-Based SIP creation flow
 * (GBSIP-001), sibling to `TC_Wedding_Daily_MaxAmount.spec.ts` (which found the Daily slider caps
 * at ₹99,999). This pushes the Weekly SIP-amount slider (shown on the "Save [Weekly ▾]" step) to
 * its own ceiling (₹9,99,999) and validates two amount-dependent business rules confirmed live
 * 2026-09-02: a Weekly SIP over ₹1,00,000 (a) starts 5 calendar days out instead of the next day,
 * and (b) skips the Secure UPI choice entirely — routed straight into Emandate's bank-account
 * picker, since UPI can't carry a recurring debit this large.
 */
test.describe('TC_GBSIP_Wedding_Weekly_MaxAmount @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_Weekly_MaxAmount | Wedding Weekly SIP-amount slider caps at ₹9,99,999 with correct start date and Emandate-only routing',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'wedding';
      const targetYear = 2036;
      const targetBudget = 150_000;
      const frequency = 'Weekly';
      const expectedMaxWeeklyAmount = 999_999;

      console.log('[TC_GBSIP_Weekly_MaxAmount] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      await test.step('TC_GBSIP_001 | Select Wedding from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        console.log('[TC_GBSIP_Weekly_MaxAmount] Entered goal type:', goalType);
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

      await test.step('TC_GBSIP_Weekly_MaxAmount_1 | Select Weekly frequency and push the SIP-amount slider to its ceiling', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        console.log('[TC_GBSIP_Weekly_MaxAmount] Entered frequency:', frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);

        const boundsBefore = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_Weekly_MaxAmount] SIP-amount slider bounds before selecting max:', boundsBefore);
        expect(boundsBefore.max).toBe(expectedMaxWeeklyAmount);

        weeklyAmount = await goalWiseSipPage.jumpSliderToCeiling();
        console.log('[TC_GBSIP_Weekly_MaxAmount] SIP-amount slider value after selecting max:', weeklyAmount);
        expect(weeklyAmount).toBe(expectedMaxWeeklyAmount);
      });

      await test.step('TC_GBSIP_009 | Summary reflects the goal-wizard selections and SIP Start Date', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_Weekly_MaxAmount] ==================== Summary page details ====================');
        console.table({
          goalType,
          targetYear,
          targetBudget,
          frequency,
          weeklyAmount,
          expectedMaxWeeklyAmount,
        });

        await expect(page.getByText('Wedding', { exact: true })).toBeVisible();
        await expect(page.getByText('Weekly', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(`₹ ${weeklyAmount}`, { exact: false }).first()).toBeVisible();

        // Confirmed live 2026-09-02: a Weekly SIP amount over ₹1,00,000 starts 5 calendar days
        // out (not "tomorrow", the rule for amounts at/below ₹1,00,000 — see the sibling positive
        // spec). ₹999,999 exceeds that threshold, so the expected start date is today + 5 days.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expectedStartDate = new Date(today);
        expectedStartDate.setDate(expectedStartDate.getDate() + 5);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${expectedStartDate.getFullYear()}-${pad(expectedStartDate.getMonth() + 1)}-${pad(expectedStartDate.getDate())}`;

        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_Weekly_MaxAmount] SIP Start Date — amount', weeklyAmount, '> ₹1,00,000, expected (today+5):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('TC_GBSIP_Weekly_MaxAmount_2 | Amount over ₹1,00,000 forces the Emandate-only payment path', async () => {
        await buySummaryPage.clickProceedToPay();

        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        const chooseBankDialog = page.getByRole('dialog', { name: 'Choose Bank Account' });
        const qrModal = page.getByText('Payment QR Code', { exact: true });

        await expect(bankMandateDialog.or(chooseBankDialog).or(qrModal)).toBeVisible({ timeout: 15_000 });

        if (await bankMandateDialog.isVisible().catch(() => false)) {
          const secureUpiVisible = await page.getByRole('button', { name: 'Secure UPI' }).isVisible({ timeout: 2_000 }).catch(() => false);
          const emandateVisible = await page.getByRole('button', { name: 'Emandate' }).isVisible({ timeout: 2_000 }).catch(() => false);
          console.log('[TC_GBSIP_Weekly_MaxAmount] "Set Up Bank Mandate" dialog options — Secure UPI visible:', secureUpiVisible, '| Emandate visible:', emandateVisible);
          expect(secureUpiVisible).toBe(false);
          expect(emandateVisible).toBe(true);
        } else {
          console.log('[TC_GBSIP_Weekly_MaxAmount] No Secure UPI/Emandate choice shown — routed straight to Emandate\'s bank-account picker.');
        }

        await expect(chooseBankDialog).toBeVisible({ timeout: 15_000 });
        console.log('[TC_GBSIP_Weekly_MaxAmount] "Choose Bank Account" (Emandate) dialog confirmed — Secure UPI is not offered above ₹1,00,000.');
      });

      await test.step('Cleanup — close the Emandate dialog and cancel rather than leaving a stray pending payment', async () => {
        const chooseBankDialog = page.getByRole('dialog', { name: 'Choose Bank Account' });
        await page.keyboard.press('Escape');
        await chooseBankDialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

        await buySummaryPage.cancelSipFlow();
      });
    },
  );
});
