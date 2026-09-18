import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Monthly-frequency SIP-amount boundary coverage for the Emergencies Goal-Based SIP creation flow
 * (GBSIP-001), mirroring `TC_Wedding_Monthly_MaxAmount.spec.ts` / `TC_Home_Monthly_MaxAmount.spec.ts`.
 * Pushes the Monthly SIP-amount slider to its ceiling and validates the amount-dependent SIP
 * Start Date rule: a Monthly SIP amount ≤ ₹99,999 starts the 1st of next month (see the sibling
 * positive spec), while an amount > ₹1,00,000 starts the 5th of next month instead. Also checks
 * whether the over-₹1,00,000 threshold forces the same Emandate-only routing observed for Weekly.
 */
test.describe('TC_GBSIP_Emergencies_Monthly_MaxAmount @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_Emergencies_Monthly_MaxAmount | Emergencies Monthly SIP-amount slider max amount starts on the 5th of next month',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'emergencies';
      const targetYear = 2035;
      const targetBudget = 150_000;
      const frequency = 'Monthly';

      console.log('[TC_GBSIP_Emergencies_Monthly_MaxAmount] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      await test.step('Select Emergencies from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        console.log('[TC_GBSIP_Emergencies_Monthly_MaxAmount] Entered goal type:', goalType);
        // Confirmed live 2026-09-16: Emergencies asks for budget first, year second — the
        // reverse of Wedding/Home/Education's wizard step order.
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/emergencies/i);
      });

      await test.step('Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        await goalWiseSipPage.setBudget(targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/emergencies/i);
      });

      await test.step('Select a valid year within 2030-2050', async () => {
        await goalWiseSipPage.setYear(targetYear);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetYear);
        // The year step's own continue button is labeled "Proceed to pay", not "Start planning".
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/emergencies/i);
      });

      let monthlyAmount = 0;

      await test.step('Select Monthly frequency and push the SIP-amount slider to its ceiling', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);

        const boundsBefore = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_Emergencies_Monthly_MaxAmount] SIP-amount slider bounds before selecting max:', boundsBefore);

        monthlyAmount = await goalWiseSipPage.jumpSliderToCeiling();
        console.log('[TC_GBSIP_Emergencies_Monthly_MaxAmount] SIP-amount slider value after selecting max:', monthlyAmount);
        expect(monthlyAmount).toBe(boundsBefore.max);
        expect(monthlyAmount).toBeGreaterThan(100_000);
      });

      await test.step('Summary reflects the goal-wizard selections and SIP Start Date', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        console.log('[TC_GBSIP_Emergencies_Monthly_MaxAmount] ==================== Summary page details ====================');
        console.table({
          goalType,
          targetYear,
          targetBudget,
          frequency,
          monthlyAmount,
        });

        await expect(page.locator('#sip-information').getByText('Emergencies', { exact: true })).toBeVisible();
        await expect(page.getByText('Monthly', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(`₹ ${monthlyAmount}`, { exact: false }).first()).toBeVisible();

        const today = new Date();
        const expectedStartDate = new Date(today.getFullYear(), today.getMonth() + 1, 5);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${expectedStartDate.getFullYear()}-${pad(expectedStartDate.getMonth() + 1)}-${pad(expectedStartDate.getDate())}`;

        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_Emergencies_Monthly_MaxAmount] SIP Start Date — amount', monthlyAmount, '> ₹1,00,000, expected (5th of next month):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('Amount over ₹1,00,000 payment-method routing', async () => {
        await buySummaryPage.clickProceedToPay();

        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        const chooseBankDialog = page.getByRole('dialog', { name: 'Choose Bank Account' });
        const qrModal = page.getByText('Payment QR Code', { exact: true });

        await expect(bankMandateDialog.or(chooseBankDialog).or(qrModal)).toBeVisible({ timeout: 15_000 });

        if (await bankMandateDialog.isVisible().catch(() => false)) {
          const secureUpiVisible = await page.getByRole('button', { name: 'Secure UPI' }).isVisible({ timeout: 2_000 }).catch(() => false);
          const emandateVisible = await page.getByRole('button', { name: 'Emandate' }).isVisible({ timeout: 2_000 }).catch(() => false);
          console.log('[TC_GBSIP_Emergencies_Monthly_MaxAmount] "Set Up Bank Mandate" dialog options — Secure UPI visible:', secureUpiVisible, '| Emandate visible:', emandateVisible);
          expect(emandateVisible).toBe(true);

          await expect(chooseBankDialog).toBeVisible({ timeout: 15_000 });
          console.log('[TC_GBSIP_Emergencies_Monthly_MaxAmount] Auto-advanced into Emandate — "Choose Bank Account" dialog confirmed.');
        } else if (await chooseBankDialog.isVisible().catch(() => false)) {
          console.log('[TC_GBSIP_Emergencies_Monthly_MaxAmount] No Secure UPI/Emandate choice shown — routed straight to Emandate\'s bank-account picker.');
        } else {
          console.log('[TC_GBSIP_Emergencies_Monthly_MaxAmount] Routed straight to the payment QR (no Emandate-only forcing observed for Monthly at this amount).');
        }
      });

      await test.step('Cleanup — close whatever dialog is open and cancel rather than leaving a stray pending payment', async () => {
        const chooseBankDialog = page.getByRole('dialog', { name: 'Choose Bank Account' });
        const qrModal = page.getByText('Payment QR Code', { exact: true });

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
