import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Monthly-frequency SIP-amount boundary coverage for the "Special Ones" Goal-Based SIP creation
 * flow, sibling to `TC_SpecialOnes_Weekly_MaxAmount.spec.ts` and the Wedding goal type's own
 * `TC_Wedding_Monthly_MaxAmount.spec.ts`. Pushes the Monthly SIP-amount slider to its ceiling and
 * validates the same amount-dependent SIP Start Date rule confirmed for Wedding: a Monthly SIP
 * amount ≤ ₹99,999 starts the 1st of next month (see the sibling positive spec), while an amount
 * > ₹99,999 starts the 5th of next month instead. Also checks whether that threshold forces the
 * same Emandate-only routing observed for Weekly. These are payment-gateway rules, not
 * goal-type-specific ones, so they're expected to hold for Special Ones too — this is the
 * confirmatory pass for that assumption.
 */
test.describe('TC_GBSIP_SpecialOnes_Monthly_MaxAmount @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_SpecialOnes_Monthly_MaxAmount | Special Ones Monthly SIP-amount slider max amount starts on the 5th of next month',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
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
        console.log('[TC_GBSIP_SpecialOnes_Monthly_MaxAmount] Special date selected:', dateValue);
        expect(dateValue).toContain(String(specialDate.year));

        await goalWiseSipPage.clickSelectAmount();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/special-ones/i);
      });

      await test.step('TC_GBSIP_SpecialOnes_003 | Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        const bounds = await goalWiseSipPage.getSliderBounds();
        expect(bounds.min).toBe(100_000);
        expect(bounds.max).toBe(10_000_000);

        await goalWiseSipPage.setBudget(targetBudget);
        console.log('[TC_GBSIP_SpecialOnes_003] Entered target budget:', targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/special-ones/i);
      });

      let monthlyAmount = 0;

      await test.step('TC_GBSIP_SpecialOnes_Monthly_MaxAmount_1 | Select Monthly frequency and push the SIP-amount slider to its ceiling', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        console.log('[TC_GBSIP_SpecialOnes_Monthly_MaxAmount] Entered frequency:', frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);

        const boundsBefore = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_SpecialOnes_Monthly_MaxAmount] SIP-amount slider bounds before selecting max:', boundsBefore);

        monthlyAmount = await goalWiseSipPage.jumpSliderToCeiling();
        console.log('[TC_GBSIP_SpecialOnes_Monthly_MaxAmount] SIP-amount slider value after selecting max:', monthlyAmount);
        expect(monthlyAmount).toBe(boundsBefore.max);
        expect(monthlyAmount).toBeGreaterThan(99_999);
      });

      await test.step('TC_GBSIP_SpecialOnes_009 | Summary reflects the goal-wizard selections and SIP Start Date', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_SpecialOnes_Monthly_MaxAmount] ==================== Summary page details ====================');
        console.table({
          goalType,
          specialDate: `${specialDate.day}/${specialDate.month}/${specialDate.year}`,
          targetBudget,
          frequency,
          monthlyAmount,
        });

        await expect(page.getByText('Special Ones', { exact: true })).toBeVisible();
        await expect(page.getByText('Monthly', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(`₹ ${monthlyAmount}`, { exact: false }).first()).toBeVisible();

        // Confirmed for Wedding: a Monthly SIP amount > ₹99,999 starts on the 5th of next
        // month, instead of the 1st-of-next-month rule that applies at/below ₹99,999.
        const today = new Date();
        const expectedStartDate = new Date(today.getFullYear(), today.getMonth() + 1, 5);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${expectedStartDate.getFullYear()}-${pad(expectedStartDate.getMonth() + 1)}-${pad(expectedStartDate.getDate())}`;

        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_SpecialOnes_Monthly_MaxAmount] SIP Start Date — amount', monthlyAmount, '> ₹99,999, expected (5th of next month):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('TC_GBSIP_SpecialOnes_Monthly_MaxAmount_2 | Amount over ₹99,999 payment-method routing', async () => {
        await buySummaryPage.clickProceedToPay();

        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        const chooseBankDialog = page.getByRole('dialog', { name: 'Choose Bank Account' });
        const qrModal = page.getByText('Payment QR Code', { exact: true });

        await expect(bankMandateDialog.or(chooseBankDialog).or(qrModal)).toBeVisible({ timeout: 15_000 });

        if (await bankMandateDialog.isVisible().catch(() => false)) {
          const secureUpiVisible = await page.getByRole('button', { name: 'Secure UPI' }).isVisible({ timeout: 2_000 }).catch(() => false);
          const emandateVisible = await page.getByRole('button', { name: 'Emandate' }).isVisible({ timeout: 2_000 }).catch(() => false);
          console.log('[TC_GBSIP_SpecialOnes_Monthly_MaxAmount] "Set Up Bank Mandate" dialog options — Secure UPI visible:', secureUpiVisible, '| Emandate visible:', emandateVisible);
          expect(emandateVisible).toBe(true);

          // Only Emandate is offered above ₹1,00,000, and the app auto-advances into it (the
          // button detaches mid-click if we try to click it ourselves) — just wait for the
          // resulting "Choose Bank Account" dialog instead of interacting further.
          await expect(chooseBankDialog).toBeVisible({ timeout: 15_000 });
          console.log('[TC_GBSIP_SpecialOnes_Monthly_MaxAmount] Auto-advanced into Emandate — "Choose Bank Account" dialog confirmed.');
        } else if (await chooseBankDialog.isVisible().catch(() => false)) {
          console.log('[TC_GBSIP_SpecialOnes_Monthly_MaxAmount] No Secure UPI/Emandate choice shown — routed straight to Emandate\'s bank-account picker.');
        } else {
          console.log('[TC_GBSIP_SpecialOnes_Monthly_MaxAmount] Routed straight to the payment QR (no Emandate-only forcing observed for Monthly at this amount).');
        }
      });

      await test.step('Cleanup — close whatever dialog is open and cancel rather than leaving a stray pending payment', async () => {
        const chooseBankDialog = page.getByRole('dialog', { name: 'Choose Bank Account' });
        const qrModal = page.getByText('Payment QR Code', { exact: true });

        // Escape doesn't dismiss "Choose Bank Account" (confirmed live for Wedding) — it needs
        // its own Close button, otherwise its mask lingers and the summary page's Cancel button
        // becomes ambiguous (both dialogs render a "Cancel" span at that point).
        if (await chooseBankDialog.isVisible().catch(() => false)) {
          await chooseBankDialog.getByRole('button', { name: 'Close' }).click();
          await chooseBankDialog.waitFor({ state: 'hidden', timeout: 10_000 });
        }

        await page.keyboard.press('Escape');
        await qrModal.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        if (await bankMandateDialog.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape');
          await bankMandateDialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
        }

        await buySummaryPage.cancelSipFlow();
      });
    },
  );
});
