import { test, expect } from '../../fixtures/admin.fixture';
import { createDisbursedLoan } from '../../flows/admin/gold-loan.flow';

test.describe('TC02 mode of payment @regression @admin @payments', () => {
  test('mode of payment — quick pay, part pay, top-up, renew, renew+topup, part release, full release', async ({
    page,
    loginAs,
    quickPayment,
    partPayment,
    topUp,
    renewLoan,
    renewPlusTopup,
    partRelease,
    fullRelease,
    opsApproval,
    packetSubmission,
  }) => {
    test.setTimeout(20 * 60_000);

    // ── Precondition ────────────────────────────────────────────────────────
    await test.step('setup: create disbursed loan', async () => {
      await createDisbursedLoan(page);
    });

    // ── TC02 @Test priority=0: validateQuickPaymentSuccess ──────────────────
    await test.step('quick payment success (appraiser)', async () => {
      await loginAs('appraiser');
      await quickPayment.quikPaymentsuccess();
    });

    // ── TC02 @Test priority=1: validateQuickPaymentFail ─────────────────────
    await test.step('quick payment fail (appraiser)', async () => {
      await loginAs('appraiser');
      const failureMsg = await quickPayment.quikPaymentfail();
      expect.soft(failureMsg).toBe('Payment could not be completed');
    });

    // ── TC02 @Test priority=2: validatePartPaymentSucess ────────────────────
    await test.step('part payment success (appraiser)', async () => {
      await loginAs('appraiser');
      await partPayment.partPaySuccess();
    });

    // ── TC02 @Test priority=4: validateTopUpSuccess ──────────────────────────
    // (priority=3 was commented out in Java — skipped per instructions)
    await test.step('top-up (partner)', async () => {
      await loginAs('partner');
      await topUp.topUp();
    });

    // ── TC02 @Test priority=5: validateRenewLoan ────────────────────────────
    await test.step('renew loan — appraiser portion', async () => {
      await loginAs('appraiser');
      await renewLoan.renew();
    });
    await test.step('renew loan — partner approval', async () => {
      await loginAs('partner');
      await renewLoan.partnerRenewApproval();
    });

    // ── TC02 @Test priority=6: validateRenewPlusTopUpLoan ───────────────────
    await test.step('renew plus top-up — appraiser portion', async () => {
      await loginAs('appraiser');
      await renewPlusTopup.renewPlusTopUp();
    });
    await test.step('renew plus top-up — ops approval', async () => {
      await loginAs('ops');
      await opsApproval.opsAprroval();
    });
    await test.step('renew plus top-up — partner approval + disbursement', async () => {
      await loginAs('partner');
      await renewPlusTopup.partnerRenewPlusTopupApproval();
    });

    // ── TC02 @Test priority=7: validatePartReleaseLoan ───────────────────────
    await test.step('part release (appraiser — delegates to packet submission)', async () => {
      await loginAs('appraiser');
      await partRelease.partReleaseLoan();
      await packetSubmission.packetSubmission();
    });

    // ── TC02 @Test priority=8: validateFullReleaseLoan ───────────────────────
    await test.step('full release (appraiser)', async () => {
      await loginAs('appraiser');
      await fullRelease.fullRelease();
    });
  });
});
