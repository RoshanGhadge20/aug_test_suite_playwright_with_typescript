import { test, expect } from '../../fixtures/admin.fixture';
import { onboardCustomerThroughKyc } from '../../flows/admin/onboarding.flow';

/**
 * TC06 BT Loan
 *
 * Precondition choice:
 *   BT loan requires a KYC-approved customer (appraiser navigates to Customer Management and
 *   starts a new BT process). Flow67/69 both call Flow01_Kyc + Flow02_KycApproval internally,
 *   but those onboarding calls match onboardCustomerThroughKyc(). Flow70 had those calls
 *   commented out and navigates directly to Appraiser Requests, reusing the session state from
 *   prior steps. Therefore we call onboardCustomerThroughKyc(page) once as a shared precondition
 *   so the customer exists for all four @Test steps.
 *
 *   NOTE: A full disbursed loan (createDisbursedLoan) is NOT needed — BT loan is a separate
 *   product that requires only an onboarded customer, not an existing gold loan.
 */
test.describe('TC06 BT loan @regression @admin @bt-loan', () => {
  test('BT loan — full flow, ZAH review, incomplete flow, rejected flow', async ({
    page,
    loginAs,
    btLoan,
    zahReview,
    btRejectedLoan,
  }) => {
    test.setTimeout(25 * 60_000);

    // ── Precondition ────────────────────────────────────────────────────────
    await test.step('setup: onboard customer through KYC', async () => {
      await onboardCustomerThroughKyc(page);
    });

    // ── TC06 @Test priority=0: validateAddBTLoan ────────────────────────────
    // Flow67_ValidateForBTLoan.validateForBTLoan()
    await test.step('validate BT loan functionality (appraiser)', async () => {
      await loginAs('appraiser');
      await btLoan.validateForBTLoan();
    });

    // ── TC06 @Test priority=1: validateAdvanceApproval ──────────────────────
    // Flow68_ValidateZAHReview.validateZahReview()
    // NOTE: Flow68 was also called at the end of Flow67 when loanAmount > CEO_APPROVAL_THRESHOLD
    // (50 Lakhs). For the standard 10-Lakh path in validateForBTLoan, only RCH runs and
    // validateZahReview runs as this standalone @Test step (same appraiser session).
    await test.step('validate advance approval / ZAH review (appraiser)', async () => {
      await loginAs('appraiser');
      await zahReview.validateZahReview();
    });

    // ── TC06 @Test priority=2: validateIncompleteFlowForBT ──────────────────
    // Flow69_ValidateIncompleteFolwBTLoan.validateIncompleteBTLaon()
    await test.step('validate incomplete flow for BT loan (appraiser)', async () => {
      await loginAs('appraiser');
      await btLoan.validateIncompleteBTLaon();
    });

    // ── TC06 @Test priority=3: validateRejectFlowForBT ──────────────────────
    // Flow70_ValidateRejectedFlowBTLoan.validateRejectBTLaon()
    await test.step('validate rejected flow for BT loan (appraiser)', async () => {
      await loginAs('appraiser');
      await btRejectedLoan.validateRejectBTLaon();
    });
  });
});
