import { test, expect } from '../../../../fixtures/base.fixture';
import { getSipFlowsDataset } from '../../../../utils/data/customer-excel-data';

/**
 * Monthly-frequency >₹1,00,000 SIP-amount coverage for the Home Goal-Based SIP creation flow
 * (GBSIP-001), sibling to `TC_Home_Monthly_MaxAmount.spec.ts` (same ceiling amount, but that spec
 * only verifies the routing/date rules and cancels) and `TC_Home_CreateGoal_Positive_Weekly.spec.ts`'s
 * `TC_GBSIP_Home_Weekly_Emandate` test (same completion pattern, Weekly instead of Monthly).
 *
 * Pushes the Monthly SIP-amount slider to its ₹9,99,999 ceiling — confirmed live this drops
 * Secure UPI entirely (Emandate-only) and shifts the start date to the 5th of next month instead
 * of the 1st — then actually completes the Emandate payment (bank selection, demo Aadhaar OTP,
 * Razorpay-style authorization) to a real dashboard redirect, same as the Weekly >₹1,00,000 test.
 */
test.describe('TC_GBSIP_Home_Monthly_MaxAmount_Emandate @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_Home_Monthly_MaxAmount_Emandate | Monthly Home goal SIP above ₹1,00,000 completes payment via Emandate, starting the 5th of next month',
    async ({ page, goalWiseSipPage, buySummaryPage, paymentPage, addNewBankPage }) => {
      test.setTimeout(180_000);

      const goalType = 'home';
      const targetYear = 2035;
      const targetBudget = 150_000;
      const frequency = 'Monthly';
      const dataset = getSipFlowsDataset();
      const bankDetails = {
        bankName: dataset.BankName,
        accountHolderName: dataset.AccountHolderName,
        accountNumber: dataset.AccountNumber,
        ifscCode: dataset.IFSCCode,
        accountType: dataset.AccountType,
      };

      console.log('[TC_GBSIP_Home_Monthly_MaxAmount_Emandate] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      let goalCountBefore = 0;

      await test.step('Capture existing Home goal count', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();
        goalCountBefore = await goalWiseSipPage.goalCardsByName('Home').count();
        console.log('[TC_GBSIP_Home_Monthly_MaxAmount_Emandate] Home goal count before:', goalCountBefore);
      });

      await test.step('Select Home from the goal-type grid', async () => {
        await goalWiseSipPage.selectGoalType(goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/home/i);
      });

      await test.step('Select a valid year within 2030-2050', async () => {
        await goalWiseSipPage.setYear(targetYear);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetYear);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/home/i);
      });

      await test.step('Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        await goalWiseSipPage.setBudget(targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/home/i);
      });

      let monthlyAmount = 0;

      await test.step('Select Monthly frequency and push the SIP-amount slider to its ceiling (forces Emandate-only routing)', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);

        const boundsBefore = await goalWiseSipPage.getSliderBounds();
        console.log('[TC_GBSIP_Home_Monthly_MaxAmount_Emandate] SIP-amount slider bounds before selecting max:', boundsBefore);

        monthlyAmount = await goalWiseSipPage.jumpSliderToCeiling();
        console.log('[TC_GBSIP_Home_Monthly_MaxAmount_Emandate] SIP-amount slider value after selecting max:', monthlyAmount);
        expect(monthlyAmount).toBe(boundsBefore.max);
        expect(monthlyAmount).toBeGreaterThan(100_000);
      });

      await test.step('Summary reflects the goal-wizard selections and the 5th-of-next-month start date', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        await expect(page.locator('#sip-information').getByText('Home', { exact: true })).toBeVisible();
        await expect(page.getByText('Monthly', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(new RegExp(`₹\\s?${monthlyAmount}(?![\\d,])`)).first()).toBeVisible();

        // Confirmed live for Wedding/Home (TC_Home_Monthly_MaxAmount.spec.ts): a Monthly SIP
        // amount > ₹1,00,000 starts on the 5th of next month, instead of the 1st-of-next-month
        // rule that applies below the ceiling.
        const today = new Date();
        const expectedStartDate = new Date(today.getFullYear(), today.getMonth() + 1, 5);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${expectedStartDate.getFullYear()}-${pad(expectedStartDate.getMonth() + 1)}-${pad(expectedStartDate.getDate())}`;

        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_Home_Monthly_MaxAmount_Emandate] SIP Start Date — amount', monthlyAmount, '> ₹1,00,000, expected (5th of next month):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('Amount over ₹1,00,000 routes to Emandate — complete the full bank-mandate payment', async () => {
        await buySummaryPage.clickProceedToPay();

        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        const chooseBankDialog = page.getByRole('dialog', { name: 'Choose Bank Account' });
        await expect(bankMandateDialog.or(chooseBankDialog)).toBeVisible({ timeout: 15_000 });

        if (await bankMandateDialog.isVisible().catch(() => false)) {
          const secureUpiVisible = await page.getByRole('button', { name: 'Secure UPI' }).isVisible({ timeout: 2_000 }).catch(() => false);
          console.log('[TC_GBSIP_Home_Monthly_MaxAmount_Emandate] "Set Up Bank Mandate" shown — Secure UPI visible:', secureUpiVisible, '(expected false above ₹1,00,000)');
          expect(secureUpiVisible).toBe(false);
          // Deliberately no click here: with only one option (Emandate) shown, this dialog
          // auto-advances to "Choose Bank Account" on its own — confirmed live via
          // TC_Wedding_Weekly_MaxAmount.spec.ts / TC_Home_CreateGoal_Positive_Weekly.spec.ts.
          // Clicking the Emandate button races against that auto-transition and fails with
          // "element detached from the DOM".
        } else {
          console.log('[TC_GBSIP_Home_Monthly_MaxAmount_Emandate] Routed straight to Emandate\'s bank-account picker — no Secure UPI/Emandate choice shown.');
        }

        const hasExistingBank = await paymentPage.selectBankOrAddNew();
        console.log('[TC_GBSIP_Home_Monthly_MaxAmount_Emandate] Existing saved bank found:', hasExistingBank);
        if (!hasExistingBank) {
          await addNewBankPage.fillAndSubmitBankForm(bankDetails);
        }
        await paymentPage.clickPayButton();
        await paymentPage.completeEmandatePayment(dataset.ContactNumber, dataset.EmandateBankName);
        console.log('[TC_GBSIP_Home_Monthly_MaxAmount_Emandate] Emandate payment completed — redirected to dashboard.');
      });

      await test.step('A new Home goal now exists', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();
        const goalCountAfter = await goalWiseSipPage.goalCardsByName('Home').count();
        console.log('[TC_GBSIP_Home_Monthly_MaxAmount_Emandate] Home goal count after:', goalCountAfter, '(before:', goalCountBefore, ')');
        expect(goalCountAfter).toBe(goalCountBefore + 1);
      });
    },
  );
});
