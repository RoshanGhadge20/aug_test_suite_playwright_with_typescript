import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Weekly-frequency SIP-amount boundary coverage for the "Special Ones" Goal-Based SIP creation
 * flow, mirroring `TC_SpecialOnes_CreateGoal_Positive_Weekly.spec.ts` and the Wedding goal type's
 * own `TC_Wedding_Weekly_MaxAmount.spec.ts`. Pushes the Weekly SIP-amount slider (shown on the
 * "Save [Weekly ▾]" step) to its own ceiling (₹9,99,999) and validates the same amount-dependent
 * business rules confirmed live for Wedding: a Weekly SIP over ₹1,00,000 (a) starts 5 calendar
 * days out instead of the next day, and (b) skips the Secure UPI choice entirely — routed
 * straight into Emandate's bank-account picker, since UPI can't carry a recurring debit this
 * large. These are payment-gateway rules, not goal-type-specific ones, so they're expected to
 * hold for Special Ones too; this is the confirmatory pass for that assumption.
 */
test.describe('TC_GBSIP_SpecialOnes_Weekly_MaxAmount @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_SpecialOnes_Weekly_MaxAmount | Special Ones Weekly SIP-amount slider caps at ₹9,99,999 with correct start date and Emandate-only routing',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'specialOnes';
      const specialDate = { day: 15, month: 6, year: 2028 };
      const targetBudget = 150_000;
      const frequency = 'Weekly';
      const expectedMaxWeeklyAmount = 999_999;

      await test.step('TC_GBSIP_SpecialOnes_001 | Select Special Ones from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-date\/special-ones/i);
      });

      await test.step('TC_GBSIP_SpecialOnes_002 | Pick the special date from the calendar and continue', async () => {
        await goalWiseSipPage.setSpecialDate(specialDate);
        const dateValue = await goalWiseSipPage.getSpecialDateValue();
        console.log('[TC_GBSIP_SpecialOnes_Weekly_MaxAmount] Special date selected:', dateValue);
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
        console.log('[TC_GBSIP_SpecialOnes_003] Entered target budget:', targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/special-ones/i);
      });

      let weeklyAmount = 0;

      await test.step('TC_GBSIP_SpecialOnes_Weekly_MaxAmount_1 | Select Weekly frequency and push the SIP-amount slider to its ceiling', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        console.log('[TC_GBSIP_SpecialOnes_Weekly_MaxAmount] Entered frequency:', frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);

        const boundsBefore = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_SpecialOnes_Weekly_MaxAmount] SIP-amount slider bounds before selecting max:', boundsBefore);
        expect(boundsBefore.max).toBe(expectedMaxWeeklyAmount);

        weeklyAmount = await goalWiseSipPage.jumpSliderToCeiling();
        console.log('[TC_GBSIP_SpecialOnes_Weekly_MaxAmount] SIP-amount slider value after selecting max:', weeklyAmount);
        expect(weeklyAmount).toBe(expectedMaxWeeklyAmount);
      });

      await test.step('TC_GBSIP_SpecialOnes_009 | Summary reflects the goal-wizard selections and SIP Start Date', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_SpecialOnes_Weekly_MaxAmount] ==================== Summary page details ====================');
        console.table({
          goalType,
          specialDate: `${specialDate.day}/${specialDate.month}/${specialDate.year}`,
          targetBudget,
          frequency,
          weeklyAmount,
          expectedMaxWeeklyAmount,
        });

        await expect(page.getByText('Special Ones', { exact: true })).toBeVisible();
        await expect(page.getByText('Weekly', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(new RegExp(`₹\\s?${weeklyAmount}(?![\\d,])`)).first()).toBeVisible();

        // Confirmed live for Wedding: a Weekly SIP amount over ₹1,00,000 starts 5 calendar days
        // out (not "tomorrow", the rule for amounts at/below ₹1,00,000). ₹999,999 exceeds that
        // threshold, so the expected start date is today + 5 days.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expectedStartDate = new Date(today);
        expectedStartDate.setDate(expectedStartDate.getDate() + 5);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${expectedStartDate.getFullYear()}-${pad(expectedStartDate.getMonth() + 1)}-${pad(expectedStartDate.getDate())}`;

        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_SpecialOnes_Weekly_MaxAmount] SIP Start Date — amount', weeklyAmount, '> ₹1,00,000, expected (today+5):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('TC_GBSIP_SpecialOnes_Weekly_MaxAmount_2 | Amount over ₹1,00,000 forces the Emandate-only payment path', async () => {
        await buySummaryPage.clickProceedToPay();

        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        const chooseBankDialog = page.getByRole('dialog', { name: 'Choose Bank Account' });
        const qrModal = page.getByText('Payment QR Code', { exact: true });

        await expect(bankMandateDialog.or(chooseBankDialog).or(qrModal)).toBeVisible({ timeout: 15_000 });

        if (await bankMandateDialog.isVisible().catch(() => false)) {
          const secureUpiVisible = await page.getByRole('button', { name: 'Secure UPI' }).isVisible({ timeout: 2_000 }).catch(() => false);
          const emandateVisible = await page.getByRole('button', { name: 'Emandate' }).isVisible({ timeout: 2_000 }).catch(() => false);
          console.log('[TC_GBSIP_SpecialOnes_Weekly_MaxAmount] "Set Up Bank Mandate" dialog options — Secure UPI visible:', secureUpiVisible, '| Emandate visible:', emandateVisible);
          expect(secureUpiVisible).toBe(false);
          expect(emandateVisible).toBe(true);
        } else {
          console.log('[TC_GBSIP_SpecialOnes_Weekly_MaxAmount] No Secure UPI/Emandate choice shown — routed straight to Emandate\'s bank-account picker.');
        }

        await expect(chooseBankDialog).toBeVisible({ timeout: 15_000 });
        console.log('[TC_GBSIP_SpecialOnes_Weekly_MaxAmount] "Choose Bank Account" (Emandate) dialog confirmed — Secure UPI is not offered above ₹1,00,000.');
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
