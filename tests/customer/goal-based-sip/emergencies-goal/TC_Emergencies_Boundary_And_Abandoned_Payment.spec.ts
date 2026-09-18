import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Negative-path coverage for the Emergencies Goal-Based SIP creation flow (GBSIP-001), mirroring
 * `TC_Wedding_Boundary_And_Abandoned_Payment.spec.ts` / `TC_Home_Boundary_And_Abandoned_Payment.spec.ts`
 * against `tests/customer/Goal-Based SIP Test Plan.md` TC_GBSIP_002/004/005/010.
 *
 * Uses the shared `customer` storage state (not a fresh registration) — goal tracking is
 * meaningless without the account's existing investment history, matching this repo's other SIP
 * flow specs (`tests/customer/sipflow/sip-flows.spec.ts`) rather than the KYC/registration specs'
 * always-blank-storageState pattern.
 */
test.describe('TC_GBSIP_Emergencies_Negative @regression @customer @goalwisesip', () => {
  // Confirmed live 2026-09-16: Emergencies asks for budget FIRST ("Set your emergency goal
  // amount"), then year ("How long do you want to save for?") — the reverse of the
  // Wedding/Home/Education wizard order, where year comes before budget.

  test('TC_GBSIP_Emergencies_004_005 | Emergencies budget selector range matches the CR (₹1,00,000 – ₹1,00,00,000)', async ({
    page,
    goalWiseSipPage,
  }) => {
    await test.step('Open Emergencies budget step', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.selectGoalType('emergencies');
    });

    await test.step('Slider ARIA bounds match the CR (₹1,00,000 min / ₹1,00,00,000 max)', async () => {
      const bounds = await goalWiseSipPage.getSliderBounds();
      console.log('[TC_GBSIP_Emergencies_004_005] Budget slider bounds:', bounds);
      expect(bounds.min).toBe(100_000);
      expect(bounds.max).toBe(10_000_000);
    });

    await test.step('A small "-" run moves the value down without going below the floor', async () => {
      const before = (await goalWiseSipPage.getSliderBounds()).current;
      const afterFloorAttempt = await goalWiseSipPage.pushToFloor(5);
      console.log('[TC_GBSIP_Emergencies_004_005] Budget before/after 5x "-":', before, afterFloorAttempt);
      expect(afterFloorAttempt).toBeLessThan(before);
      expect(afterFloorAttempt).toBeGreaterThanOrEqual(100_000);
    });
  });

  test('TC_GBSIP_Emergencies_002 | Emergencies year selector clamps to 2030-2050', async ({ page, goalWiseSipPage }) => {
    await test.step('Open Emergencies year step (via the budget step first)', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.selectGoalType('emergencies');
      await goalWiseSipPage.setBudget(150_000);
      await goalWiseSipPage.clickStartPlanning();
      await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/emergencies/i);
    });

    await test.step('Slider ARIA bounds match the CR (2030-2050)', async () => {
      const bounds = await goalWiseSipPage.getSliderBounds();
      console.log('[TC_GBSIP_Emergencies_002] Year slider bounds:', bounds);
      expect(bounds.min).toBe(2030);
      expect(bounds.max).toBe(2050);
    });

    await test.step('"-" clamps at the floor (2030), does not go below', async () => {
      const floor = await goalWiseSipPage.pushToFloor(30);
      console.log('[TC_GBSIP_Emergencies_002] Year after pushing to floor:', floor);
      expect(floor).toBe(2030);
    });

    await test.step('"+" clamps at the ceiling (2050), does not go above', async () => {
      const ceiling = await goalWiseSipPage.pushToCeiling(30);
      console.log('[TC_GBSIP_Emergencies_002] Year after pushing to ceiling:', ceiling);
      expect(ceiling).toBe(2050);
    });
  });

  test('TC_GBSIP_Emergencies_010 | Abandoning payment creates no Emergencies goal', async ({
    page,
    goalWiseSipPage,
    buySummaryPage,
  }) => {
    let emergenciesCountBefore = 0;

    await test.step('Capture existing Emergencies goal count', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.waitForGoalListing();
      emergenciesCountBefore = await goalWiseSipPage.goalCardsByName('Emergencies').count();
      console.log('[TC_GBSIP_Emergencies_010] Emergencies goal count before:', emergenciesCountBefore);
    });

    await test.step('Walk through goal creation to the payment summary', async () => {
      await goalWiseSipPage.selectGoalType('emergencies');
      await goalWiseSipPage.setBudget(150_000);
      await goalWiseSipPage.clickStartPlanning();
      await goalWiseSipPage.setYear(2035);
      // The year step's own continue button is labeled "Proceed to pay", not "Start planning".
      await goalWiseSipPage.clickProceedToPay();
      await goalWiseSipPage.selectFrequency('Daily');
      await goalWiseSipPage.clickProceedToPay();
      await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);
    });

    await test.step('Abandon via Cancel instead of paying', async () => {
      await buySummaryPage.cancelSipFlow();
    });

    await test.step('No new Emergencies goal was created', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.waitForGoalListing();
      const emergenciesCountAfter = await goalWiseSipPage.goalCardsByName('Emergencies').count();
      console.log('[TC_GBSIP_Emergencies_010] Emergencies goal count after:', emergenciesCountAfter);
      expect(emergenciesCountAfter).toBe(emergenciesCountBefore);
    });
  });
});
