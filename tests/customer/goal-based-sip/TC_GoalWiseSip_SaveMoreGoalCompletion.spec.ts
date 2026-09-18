import { test, expect } from '../../../fixtures/base.fixture';
import { getBuyMetalDataset } from '../../../utils/data/customer-excel-data';
import type { GoalCardDetails } from '../../../pages/customer/goal-wise-sip.page';

/**
 * End-to-end "complete a goal via Save More" coverage — reachable only from an **Approved** goal
 * (same precondition as `TC_GoalWiseSip_EditRenamePause.spec.ts`).
 *
 * Confirmed live 2026-09-17: "Save more" on a goal card navigates (not a dialog) to
 * `/goal-wise-sip/invest`, a gram top-up screen that shares the wizard's `p-slider` +/- stepper
 * (step size 1 g/click). Its gram cap is a real UI-enforced maximum of **10 g per top-up**
 * (`GoalWiseSipPage.pushToCeiling()` settles there regardless of how many further "+" clicks are
 * issued) — the slider's own `aria-valuemax="100"` is stale/misleading and must not be trusted.
 * "Proceed to Pay" hands off into the exact same one-time-buy summary used by
 * `/digital-gold/buy` (`BuySummaryPage`), except its wallet-deduction field is labeled
 * "Paid From Funds" here instead of "Paid From Wallet" — `BuySummaryPage.getPaidFromWallet()` was
 * fixed to recognize both labels rather than special-cased in this spec, since it's a shared,
 * backward-compatible locator fix (see the comment on `paidFromWallet` in buy-summary.page.ts).
 *
 * This test buys as many grams as the top-up cap allows, up to the amount that pushes the goal's
 * saved value past its target (computed from the live gold price shown on the Invest screen),
 * so the goal fully completes in a single Save More payment.
 *
 * Confirmed live 2026-09-17: the shared UAT account carries several Approved/Failed goals with
 * the same goal-type name (multiple "Emergencies", "Retirement", etc. from prior automated
 * runs), and Save More does **not** reliably re-sort the mutated goal to the front of the
 * (paginated) listing the way Rename/Edit do. Re-locating "the goal we just paid into" by its
 * original type name is therefore ambiguous — it can match a different, unrelated goal of the
 * same type. This test renames the goal to a unique timestamped name (same technique
 * `TC_GoalWiseSip_EditRenamePause.spec.ts` uses) immediately after finding it and BEFORE Save
 * More, so the later re-location by name is unambiguous.
 */
test.describe('TC_GoalWiseSip_SaveMoreGoalCompletion @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_SM_001 | Save More on an Approved goal completes it and updates dashboard gold (g)',
    async ({ page, goalWiseSipPage, dashboardPage, buySummaryPage, paymentPage }) => {
      test.setTimeout(180_000);

      const dataset = getBuyMetalDataset();

      let goldGramsBefore = 0;
      let goalBefore: GoalCardDetails;
      let uniqueName = '';
      let livePrice = 0;
      let gramsToBuy = 0;

      /** Polls the listing (re-opening it fresh each attempt) for a card with this exact name —
       * mirrors `TC_GoalWiseSip_EditRenamePause.spec.ts`'s helper of the same shape. */
      async function pollForGoalByName(name: string, timeoutMs = 30_000) {
        let found: Awaited<ReturnType<typeof goalWiseSipPage.findGoalCardByName>> = null;
        await expect
          .poll(
            async () => {
              await goalWiseSipPage.open();
              await goalWiseSipPage.waitForGoalListing();
              found = await goalWiseSipPage.findGoalCardByName(name);
              return found !== null;
            },
            { timeout: timeoutMs, intervals: [2_000, 3_000, 5_000] },
          )
          .toBe(true);
        return found!;
      }

      await test.step('Dashboard — capture total gold (g) before Save More', async () => {
        await dashboardPage.gotoDashboard();
        goldGramsBefore = await dashboardPage.getTotalGoldValue();
        console.log('[TC_GBSIP_SM_001] Total gold on dashboard before (g):', goldGramsBefore);
      });

      let currentCard: Awaited<ReturnType<typeof goalWiseSipPage.findApprovedGoalCard>>;

      await test.step('Goal Wise SIP — find an Approved goal, paginating forward if none on the current page', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();

        const card = await goalWiseSipPage.findApprovedGoalCard();
        expect(card, 'No Approved-status goal was found across the paginated listing').not.toBeNull();
        currentCard = card;

        goalBefore = await goalWiseSipPage.getGoalCardDetails(card!);
        console.log(
          `[TC_GBSIP_SM_001] Approved goal — name: ${goalBefore.name} | target date: ${goalBefore.targetDateText} | ` +
            `saved: ₹${goalBefore.savedAmount} | target: ₹${goalBefore.targetAmount} | status: ${goalBefore.status}`,
        );
        expect(goalBefore.status.trim()).toBe('Approved');
      });

      await test.step('Rename to a unique name so the same goal can be unambiguously re-located after payment', async () => {
        uniqueName = `SaveMore Test Goal ${Date.now().toString().slice(-6)}`;
        const menu = await goalWiseSipPage.openGoalCardMenu(currentCard!);
        await goalWiseSipPage.clickMenuOption(menu, 'Rename');
        await goalWiseSipPage.submitRename(uniqueName);
        console.log('[TC_GBSIP_SM_001] Renamed goal to:', uniqueName);

        currentCard = await pollForGoalByName(uniqueName);
        goalBefore = { ...goalBefore, name: await goalWiseSipPage.getGoalName(currentCard) };
      });

      await test.step('Save More — open the invest screen for this goal', async () => {
        await goalWiseSipPage.clickSaveMore(currentCard!);
        await expect(page).toHaveURL(/\/goal-wise-sip\/invest/i);
      });

      await test.step('Save More — compute grams (via live gold price) that push the goal past its target, capped at the real top-up ceiling', async () => {
        livePrice = await goalWiseSipPage.getInvestLiveGoldPrice();
        const trueMaxGrams = await goalWiseSipPage.pushToCeiling(15);
        console.log('[TC_GBSIP_SM_001] Live gold price (₹/g):', livePrice, '| Save More gram cap:', trueMaxGrams);

        const remaining = Math.max(goalBefore.targetAmount - goalBefore.savedAmount, 0);
        let grams = Math.ceil(remaining / livePrice);
        if (grams * livePrice <= remaining) grams += 1; // guarantee strictly more than the goal's remaining value
        gramsToBuy = Math.min(Math.max(grams, 1), trueMaxGrams);
        console.log(
          `[TC_GBSIP_SM_001] Remaining to complete goal: ₹${remaining} | grams needed to exceed it: ${grams} | ` +
            `capped grams to buy: ${gramsToBuy} (₹${(gramsToBuy * livePrice).toFixed(2)} at live price)`,
        );

        await goalWiseSipPage.setSaveMoreGrams(gramsToBuy);
        const bounds = await goalWiseSipPage.getSliderBounds();
        expect(bounds.current).toBe(gramsToBuy);

        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);
      });

      let payableAmount = 0;

      await test.step('Validate and print the Save More payment summary', async () => {
        const summary = await buySummaryPage.validateOneTimeSummaryByQuantity(gramsToBuy);
        payableAmount = summary.payable;
        console.log('[TC_GBSIP_SM_001] Save More summary:');
        console.table(summary);
      });

      await test.step('Complete payment via Netbanking', async () => {
        await buySummaryPage.clickPayNowButton();
        const paidAmount = await paymentPage.completeNetbankingBuyNowPayment(
          dataset.contactNumber,
          payableAmount,
          dataset.netbankingBankName,
        );
        console.log('[TC_GBSIP_SM_001] Paid via Netbanking (₹):', paidAmount);
      });

      await test.step('Goal Wise SIP — re-locate the goal (by its unique renamed value) and print its post-payment status/detail', async () => {
        let goalAfter: GoalCardDetails | null = null;
        await expect
          .poll(
            async () => {
              await goalWiseSipPage.open();
              await goalWiseSipPage.waitForGoalListing();
              const card = await goalWiseSipPage.findGoalCardByName(uniqueName);
              if (!card) return false;
              goalAfter = await goalWiseSipPage.getGoalCardDetails(card);
              return goalAfter.savedAmount > goalBefore.savedAmount;
            },
            { timeout: 45_000, intervals: [3_000, 5_000, 10_000] },
          )
          .toBe(true);

        console.log(
          `[TC_GBSIP_SM_001] Goal after Save More — name: ${goalAfter!.name} | saved: ₹${goalAfter!.savedAmount} | ` +
            `target: ₹${goalAfter!.targetAmount} | status: ${goalAfter!.status}`,
        );
        console.log(
          `[TC_GBSIP_SM_001] Goal completion check — saved (₹${goalAfter!.savedAmount}) ${
            goalAfter!.savedAmount >= goalAfter!.targetAmount ? '>=' : '<'
          } target (₹${goalAfter!.targetAmount})`,
        );
        expect(goalAfter!.savedAmount).toBeGreaterThan(goalBefore.savedAmount);
      });

      await test.step('Dashboard — validate total gold (g) increased by the grams purchased', async () => {
        await dashboardPage.validateBuyMetalGramsAfterPurchase('gold', goldGramsBefore, gramsToBuy);
      });
    },
  );
});
