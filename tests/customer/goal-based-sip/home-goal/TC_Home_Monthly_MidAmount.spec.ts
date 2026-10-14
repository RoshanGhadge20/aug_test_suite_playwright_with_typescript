import { test, expect } from '../../../../fixtures/base.fixture';
import { getSipFlowsDataset } from '../../../../utils/data/customer-excel-data';

/**
 * Monthly-frequency mid-range SIP-amount coverage for the Home Goal-Based SIP creation flow
 * (GBSIP-001), sibling to `TC_Home_CreateGoal_Positive_Monthly.spec.ts` (amount ≈ ₹1,389, both
 * rails offered) and `TC_Home_Monthly_MaxAmount.spec.ts` (amount pushed to the ₹9,99,999 ceiling,
 * Secure UPI dropped). This closes the gap between those two: confirmed live 2026-09-15, a
 * Monthly SIP amount strictly between ₹15,000 and ₹99,999 still offers **both** Secure UPI and
 * Emandate (the "UPI dropped above a threshold" rule seen at the ceiling hasn't kicked in yet at
 * this amount), and completing it via Emandate still starts on the **1st of next month** — not
 * the 5th, which only applies at the much higher ceiling amount.
 */
test.describe('TC_GBSIP_Home_Monthly_MidAmount @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_Home_Monthly_MidAmount | Monthly Home goal SIP between ₹15,000-₹99,999 offers both UPI and Emandate, completes via Emandate starting 1st of next month',
    async ({ page, goalWiseSipPage, buySummaryPage, paymentPage, addNewBankPage }) => {
      test.setTimeout(180_000);

      const goalType = 'home';
      const targetYear = 2035;
      const targetBudget = 150_000;
      const frequency = 'Monthly';
      const targetMidAmount = 50_000;
      const dataset = getSipFlowsDataset();
      const bankDetails = {
        bankName: dataset.BankName,
        accountHolderName: dataset.AccountHolderName,
        accountNumber: dataset.AccountNumber,
        ifscCode: dataset.IFSCCode,
        accountType: dataset.AccountType,
      };

      console.log('[TC_GBSIP_Home_Monthly_MidAmount] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      let goalCountBefore = 0;

      await test.step('Capture existing Home goal count', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();
        goalCountBefore = await goalWiseSipPage.goalCardsByName('Home').count();
        console.log('[TC_GBSIP_Home_Monthly_MidAmount] Home goal count before:', goalCountBefore);
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

      await test.step('Select a budget sized so the computed Monthly amount lands between ₹15,000-₹99,999', async () => {
        await goalWiseSipPage.setBudget(targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/home/i);
      });

      let monthlyAmount = 0;

      await test.step('Select Monthly frequency and push the SIP-amount slider into the ₹15,000-₹99,999 mid-range', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);

        const defaultAmount = await goalWiseSipPage.getComputedSipAmount();
        console.log('[TC_GBSIP_Home_Monthly_MidAmount] Default computed Monthly SIP amount:', defaultAmount);

        // The per-click step size for this slider isn't documented for Monthly (unlike Daily's
        // confirmed ₹10 and Budget's confirmed ₹500), so discover it live with a single click
        // rather than guessing a budget large enough to force it there — guessing wrong costs a
        // 100s+ timeout clicking the wrong slider (confirmed live 2026-09-15: a ₹30L budget target
        // needed ~5,700 clicks and blew a 180s test timeout).
        const afterOneClick = await goalWiseSipPage.pushToCeiling(1);
        const step = afterOneClick - defaultAmount;
        console.log('[TC_GBSIP_Home_Monthly_MidAmount] Detected SIP-amount slider step:', step);
        expect(step).toBeGreaterThan(0);

        const remaining = targetMidAmount - afterOneClick;
        const clicksNeeded = Math.max(0, Math.round(remaining / step));
        console.log('[TC_GBSIP_Home_Monthly_MidAmount] Clicking "+" ', clicksNeeded, 'more times to reach ~₹', targetMidAmount);
        monthlyAmount = clicksNeeded > 0 ? await goalWiseSipPage.pushToCeiling(clicksNeeded) : afterOneClick;

        console.log('[TC_GBSIP_Home_Monthly_MidAmount] Computed Monthly SIP amount:', monthlyAmount);
        expect(monthlyAmount).toBeGreaterThan(15_000);
        expect(monthlyAmount).toBeLessThan(99_999);
      });

      await test.step('Summary reflects the goal-wizard selections and the 1st-of-next-month start date', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        await expect(page.locator('#sip-information').getByText('Home', { exact: true })).toBeVisible();
        await expect(page.getByText('Monthly', { exact: true }).first()).toBeVisible();
        await expect(page.getByText(new RegExp(`₹\\s?${monthlyAmount}(?![\\d,])`)).first()).toBeVisible();

        // The key assertion for this scenario: at this mid-range amount, the start date is still
        // the 1st of next month — the "5th of next month" rule only kicks in at the much higher
        // ceiling amount (see TC_Home_Monthly_MaxAmount.spec.ts).
        const today = new Date();
        const nextMonthFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${nextMonthFirst.getFullYear()}-${pad(nextMonthFirst.getMonth() + 1)}-${pad(nextMonthFirst.getDate())}`;
        const actualSipStartDate = await buySummaryPage.getSipStartDate();
        console.log('[TC_GBSIP_Home_Monthly_MidAmount] SIP Start Date — amount', monthlyAmount, '(mid-range), expected (1st of next month):', expectedSipStartDate, '| actual:', actualSipStartDate);
        expect(actualSipStartDate).toBe(expectedSipStartDate);
      });

      await test.step('Both Secure UPI and Emandate are offered at this mid-range amount', async () => {
        await buySummaryPage.clickProceedToPay();

        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        await expect(bankMandateDialog).toBeVisible({ timeout: 10_000 });

        const { secureUpi, emandate } = await paymentPage.verifyUpiAndEmandateOptionsVisible();
        console.log('[TC_GBSIP_Home_Monthly_MidAmount] Set Up Bank Mandate options — Secure UPI visible:', secureUpi, '| Emandate visible:', emandate);
        expect(secureUpi).toBe(true);
        expect(emandate).toBe(true);
      });

      await test.step('Choose Emandate and complete the full bank-mandate payment', async () => {
        await paymentPage.clickEmandate();

        const hasExistingBank = await paymentPage.selectBankOrAddNew();
        console.log('[TC_GBSIP_Home_Monthly_MidAmount] Existing saved bank found:', hasExistingBank);
        if (!hasExistingBank) {
          await addNewBankPage.fillAndSubmitBankForm(bankDetails);
        }
        await paymentPage.clickPayButton();
        await paymentPage.completeEmandatePayment(dataset.ContactNumber, dataset.EmandateBankName);
        console.log('[TC_GBSIP_Home_Monthly_MidAmount] Emandate payment completed — redirected to dashboard.');
      });

      await test.step('A new Home goal now exists', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();
        const goalCountAfter = await goalWiseSipPage.goalCardsByName('Home').count();
        console.log('[TC_GBSIP_Home_Monthly_MidAmount] Home goal count after:', goalCountAfter, '(before:', goalCountBefore, ')');
        expect(goalCountAfter).toBe(goalCountBefore + 1);
      });
    },
  );
});
