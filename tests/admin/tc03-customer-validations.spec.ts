import { test, expect } from '../../fixtures/admin.fixture';
import { onboardCustomerThroughKyc } from '../../flows/admin/onboarding.flow';
import { createDisbursedLoan } from '../../flows/admin/gold-loan.flow';

/**
 * TC03 customer validations
 *
 * Precondition choice:
 *   - Steps 1–5 (validateAddBtn, validateAppraiserRequestPage, validateCustomerRequestPage,
 *     validateCustomerKycWithForm60, validateCustomerViewKyc) require a customer in the system
 *     but not necessarily a disbursed loan.
 *   - Steps 6 (validateDeleteLoanFunctionality) needs an applied loan to delete.
 *   - Steps 7–14 (incomplete rating, partner loan, FIC, bank details, pown ticket, CPV, DigiO)
 *     require a full disbursed loan as a starting point.
 *   - CHOICE: Use createDisbursedLoan(page) so the entire suite can run self-contained.
 *     This provides a customer + KYC-approved + disbursed loan from the start.
 *     For steps requiring a fresh customer (e.g., CRL, KYC w/ form 60), those flows
 *     internally create their own customers / navigate to existing ones.
 */
test.describe('TC03 customer validations @regression @admin @kyc', () => {
  test('customer validations — add button, appraiser request, CRL, KYC form60, view KYC, delete loan, incomplete rating, partner loan, FIC, bank details, pown ticket, CPV arvog, CPV non-arvog, digio, digio arvog', async ({
    page,
    loginAs,
    customerManagement,
    kyc,
    kycApproval,
    appraiserRequest,
    crlPage,
    kycForm60,
    viewKycDetails,
    deleteLoan,
    incompleteRating,
    partnerLoan,
    ficPartner,
    bankDetails,
    opsApproval,
    bmApproval,
    partnerApproval,
    packetSubmission,
    pownTicket,
    cpv,
    digio,
    newGoldLoan,
  }) => {
    test.setTimeout(25 * 60_000);

    // ── Precondition ────────────────────────────────────────────────────────
    // Creates a full customer → KYC → loan → disburse chain so every subsequent
    // step can reference an existing customer and loan.
    await test.step('setup: create disbursed loan (precondition)', async () => {
      await createDisbursedLoan(page);
    });

    // ── TC03 @Test priority=1: validateAddBtn ────────────────────────────────
    // Java: Flow19_AddCustomer.validateDuplicateMobile()
    await test.step('validate add button — duplicate mobile (appraiser)', async () => {
      await loginAs('appraiser');
      const errorText = await customerManagement.validateDuplicateMobile();
      // Java softAssert.assertTrue(error.getText().contains("already exists"))
      expect.soft(errorText).toContain('already exist');
    });

    // ── TC03 @Test priority=2: validateAppraiserRequestPage ─────────────────
    // Java: Flow20_AppraiserRequestPage.validateAppraiserRequest() — starts as OPS
    await test.step('validate appraiser request page (ops)', async () => {
      await loginAs('ops');
      await appraiserRequest.validateAppraiserRequest();
    });

    // ── TC03 @Test priority=3: validateCustomerRequestPage ──────────────────
    // Java: Flow21_CRLPage.CRLRequestPage() + viewFunctionality()
    await test.step('validate customer request page — CRL (appraiser)', async () => {
      await loginAs('appraiser');
      await crlPage.CRLRequestPage();
      // After CRLRequestPage, Java calls Flow01_Kyc.ClickonKyc() and Flow02_KycApproval.performOpsRatingActions()
      // Handled here:
      await kyc.ClickonKyc();
      await loginAs('ops');
      await kycApproval.performOpsRatingActions(kyc);
      // viewFunctionality — return to appraiser session; CRL page navigated by viewFunctionality itself
      await loginAs('appraiser');
      await crlPage.viewFunctionality();
    });

    // ── TC03 @Test priority=4: validateCustomerKycWithForm60 ────────────────
    // Java: Flow22_KycWithForm60.autoKycWithPan() (only active call; clickOnKyc and autoKycWithForm60 commented out)
    await test.step('validate customer KYC with Form60 — autoKycWithPan (appraiser)', async () => {
      await loginAs('appraiser');
      await kycForm60.autoKycWithPan();
      // Java calls Flow02_KycApproval.performOpsRatingActions() at end
      await loginAs('ops');
      await kycApproval.performOpsRatingActions(kyc);
    });

    // ── TC03 @Test priority=5: validateCustomerViewKyc ──────────────────────
    // Java: Flow23_ViewKycDetails.validateViewKyc()
    // Split: appraiser part (KYC entry) + OPS part (view + incomplete review)
    await test.step('validate customer view KYC — appraiser part', async () => {
      await loginAs('appraiser');
      const kycValues = await viewKycDetails.validateViewKyc_appraiserPart();
      // Store for ops step below — using closure
      await test.step('validate customer view KYC — ops part', async () => {
        await loginAs('ops');
        const viewValues = await viewKycDetails.validateViewKyc_opsPart();
        // Java had softAssert.assertEquals on these values
        expect.soft(viewValues.viewName).toBe(kycValues.enteredFirstName);
        expect.soft(viewValues.viewLastName).toBe(kycValues.enteredLastName);
        expect.soft(viewValues.viewMobile).toBe(kycValues.enteredMobile);
        expect.soft(viewValues.viewPan).toBe(kycValues.enteredPan);
        // Java calls Flow02_KycApproval.performOpsRatingActions() at end
        await kycApproval.performOpsRatingActions(kyc);
      });
    });

    // ── TC03 @Test priority=6: validateDeleteLoanFunctionality ──────────────
    // Java: Flow24_DeleteLoan.validateDeleteLoan() — starts as appraiser
    await test.step('validate delete loan functionality (appraiser)', async () => {
      await loginAs('appraiser');
      await deleteLoan.validateDeleteLoan();
    });

    // ── TC03 @Test priority=7: validateIncompleteInRatingFunctionality ───────
    // Java: Flow27_IncompleteInRatingFunctionality.validatePackets()
    // Role sequence: appraiser → partner (incomplete) → ops (approve) → partner (approve+disburse) → packet submission
    await test.step('validate incomplete in rating — appraiser upload docs', async () => {
      await loginAs('appraiser');
      await incompleteRating.validatePackets_appraiserPart();
    });
    await test.step('validate incomplete in rating — partner sets Incomplete', async () => {
      await loginAs('partner');
      await incompleteRating.validatePackets_partnerIncomplete();
    });
    await test.step('validate incomplete in rating — ops approves', async () => {
      await loginAs('ops');
      await incompleteRating.validatePackets_opsPart();
    });
    await test.step('validate incomplete in rating — partner approves and disburses', async () => {
      await loginAs('partner');
      await incompleteRating.validatePackets_partnerApproveDisburse();
    });
    await test.step('validate incomplete in rating — packet submission (appraiser)', async () => {
      await loginAs('appraiser');
      await packetSubmission.packetSubmission();
    });

    // ── TC03 @Test priority=8: validateLoanWithPartner ───────────────────────
    // Java: Flow25_ApplyLoanWithPartnerLoan.validateLoanwithPartner()
    // Precondition: new customer+KYC via onboardCustomerThroughKyc, then appraiser applies loan
    await test.step('validate loan with partner — onboarding precondition', async () => {
      await onboardCustomerThroughKyc(page);
    });
    await test.step('validate loan with partner — appraiser applies loan with ARVOG partner', async () => {
      await loginAs('appraiser');
      await partnerLoan.validateLoanwithPartner_appraiserPart();
    });
    await test.step('validate loan with partner — ops assign packet + approval', async () => {
      await loginAs('ops');
      await opsApproval.opsAprroval();
    });
    await test.step('validate loan with partner — BM approval', async () => {
      await loginAs('bm');
      await bmApproval.validateBranchManager();
    });
    await test.step('validate loan with partner — ops loan approval', async () => {
      await loginAs('ops');
      await opsApproval.opsAprroval();
    });
    await test.step('validate loan with partner — partner approval + disbursement', async () => {
      await loginAs('partner');
      await partnerApproval.partnerAprroval();
    });
    await test.step('validate loan with partner — packet submission (appraiser)', async () => {
      await loginAs('appraiser');
      await packetSubmission.packetSubmission();
    });

    // ── TC03 @Test priority=9a: validateManualFunctionality ──────────────────
    // Java: Flow26_FICPagewithPartner.validateGoldLoan()
    await test.step('validate FIC page with partner and scheme (appraiser)', async () => {
      await loginAs('appraiser');
      await ficPartner.validateGoldLoan();
    });

    // ── TC03 @Test priority=9b: validateVerifyBankdetailsFunctionality ────────
    // Java: Flow44_VerifyBankDetails.validateBankDetails()
    // Role sequence: ops creates packet → appraiser assigns + uploads → ops approval → partner approval → packet submission
    await test.step('validate bank details — ops creates packet', async () => {
      await loginAs('ops');
      const packetCode = await bankDetails.validateBankDetails_opsPart();
      await test.step('validate bank details — appraiser assigns packet and uploads', async () => {
        await loginAs('appraiser');
        await bankDetails.validateBankDetails_appraiserPart(packetCode);
      });
    });
    await test.step('validate bank details — ops loan approval', async () => {
      await loginAs('ops');
      await opsApproval.opsAprroval();
    });
    await test.step('validate bank details — partner approval + disbursement', async () => {
      await loginAs('partner');
      await partnerApproval.partnerAprroval();
    });
    await test.step('validate bank details — packet submission (appraiser)', async () => {
      await loginAs('appraiser');
      await packetSubmission.packetSubmission();
    });

    // ── TC03 @Test priority=10: validatePownTicketFunctionality ──────────────
    // Java: Flow46_ValidateDownloadPownTicket.validateDownloadPownTicket()
    await test.step('validate pawn ticket download (appraiser)', async () => {
      await loginAs('appraiser');
      const pownTicketPath = await pownTicket.validateDownloadPownTicket();
      // Empty string means app rendered PDF inline (no download event) — both outcomes are valid.
      expect.soft(pownTicketPath === '' || pownTicketPath.endsWith('.pdf')).toBeTruthy();
    });

    // ── TC03 @Test priority=11: validateAddCPVAndAttchCpv (Arvog) ────────────
    // Java: Flow51_ValidateAddCpvAndAttchedCpvWithArvogPartner.validateAddCPVAndAttchCpv()
    // Precondition: new KYC via onboarding
    await test.step('validate CPV with Arvog — onboarding precondition', async () => {
      await onboardCustomerThroughKyc(page);
    });
    await test.step('validate CPV with Arvog — appraiser applies loan', async () => {
      await loginAs('appraiser');
      await cpv.validateAddCPVAndAttchCpv_appraiserApplyLoan();
    });
    await test.step('validate CPV with Arvog — ops creates packet', async () => {
      await loginAs('ops');
      const packetCodeCpvArvog = await cpv.validateAddCPVAndAttchCpv_opsPacket();
      await test.step('validate CPV with Arvog — appraiser assigns packet', async () => {
        await loginAs('appraiser');
        await cpv.validateAddCPVAndAttchCpv_appraiserAssignPacket(packetCodeCpvArvog);
      });
    });
    await test.step('validate CPV with Arvog — BM approval', async () => {
      await loginAs('bm');
      await bmApproval.validateBranchManager();
    });
    await test.step('validate CPV with Arvog — appraiser upload docs', async () => {
      await loginAs('appraiser');
      await cpv.validateAddCPVAndAttchCpv_appraiserUploadDocs();
    });
    await test.step('validate CPV with Arvog — ops approval', async () => {
      await loginAs('ops');
      await opsApproval.opsAprroval();
    });
    await test.step('validate CPV with Arvog — Arvog partner approval + disbursement', async () => {
      // NOTE: Flow51 uses hardcoded credentials (8846651348 / Admin@123) for Arvog partner
      // In the TS port, loginAs('partner') is used — wire the Arvog partner credentials via env vars
      await loginAs('partner');
      await partnerApproval.partnerAprroval();
    });
    await test.step('validate CPV with Arvog — packet submission (appraiser)', async () => {
      await loginAs('appraiser');
      await cpv.packetSubmission();
    });
    await test.step('validate CPV with Arvog — CPV attachment visibility (appraiser)', async () => {
      await loginAs('appraiser');
      const isVisible = await cpv.valiadateCPVAttachment();
      expect.soft(isVisible).toBe(true);
    });

    // ── TC03 @Test priority=12: validateAddCPVAndAttchCpvWithNonArvog ────────
    // Java: Flow39_ValidateAddCPVAndAttachedWithNonArvogPartner.validateAddCPVAndAttached()
    // Precondition: KYC ops approval already done (Flow02 is called first in Java)
    await test.step('validate CPV non-Arvog — kycApproval precondition (ops)', async () => {
      await loginAs('ops');
      await kycApproval.performOpsRatingActions(kyc);
    });
    await test.step('validate CPV non-Arvog — appraiser applies loan', async () => {
      await loginAs('appraiser');
      await cpv.validateAddCPVAndAttached_appraiserApplyLoan();
    });
    await test.step('validate CPV non-Arvog — ops creates packet', async () => {
      await loginAs('ops');
      const packetCodeCpvNonArvog = await cpv.validateAddCPVAndAttchCpv_opsPacket();
      await test.step('validate CPV non-Arvog — appraiser assigns packet', async () => {
        await loginAs('appraiser');
        await cpv.validateAddCPVAndAttchCpv_appraiserAssignPacket(packetCodeCpvNonArvog);
      });
    });
    await test.step('validate CPV non-Arvog — BM approval', async () => {
      await loginAs('bm');
      await bmApproval.validateBranchManager();
    });
    await test.step('validate CPV non-Arvog — appraiser upload docs', async () => {
      await loginAs('appraiser');
      await cpv.validateAddCPVAndAttchCpv_appraiserUploadDocs();
    });
    await test.step('validate CPV non-Arvog — ops approval', async () => {
      await loginAs('ops');
      await opsApproval.opsAprroval();
    });
    await test.step('validate CPV non-Arvog — Arvog partner approval + disbursement + packet submission + CPV', async () => {
      await loginAs('partner');
      await partnerApproval.partnerAprroval();
      await loginAs('appraiser');
      await cpv.packetSubmission();
      const isVisible = await cpv.valiadateCPVAttachment();
      expect.soft(isVisible).toBe(true);
    });

    // ── TC03 @Test priority=13: validateDigiFunctionality ────────────────────
    // Java: Flow40_ValidateDigiOfunctionality.validateDigiO()
    // Java order: Flow04_NewGoldLoan.validateGoldLoan() (appraiser) → validatePackets() (ops→appraiser)
    await test.step('validate DigiO — onboarding + gold loan precondition (appraiser)', async () => {
      await onboardCustomerThroughKyc(page);
      await loginAs('appraiser');
      await newGoldLoan.validateGoldLoan();
    });
    await test.step('validate DigiO — ops creates packet + appraiser assigns and uploads DigiO docs', async () => {
      await loginAs('ops');
      await digio.validateDigiO();
    });
    await test.step('validate DigiO — ops loan approval', async () => {
      await loginAs('ops');
      await opsApproval.opsAprroval();
    });
    await test.step('validate DigiO — partner approval + disbursement', async () => {
      await loginAs('partner');
      await partnerApproval.partnerAprroval();
    });
    await test.step('validate DigiO — packet submission (appraiser)', async () => {
      await loginAs('appraiser');
      await packetSubmission.packetSubmission();
    });

    // ── TC03 @Test priority=14: validateDigiFunctionalityWithArvog ───────────
    // Java: Flow41_ValidateDigiOFunctionalityArvog.validateDigiOFunctionality()
    // Uses fixed customer ID "MHOE12GL"
    await test.step('validate DigiO Arvog — appraiser applies loan + creates packet', async () => {
      await loginAs('appraiser');
      await digio.validateDigiOFunctionality();
    });
    await test.step('validate DigiO Arvog — BM approval', async () => {
      await loginAs('bm');
      await bmApproval.validateBranchManager();
    });
    await test.step('validate DigiO Arvog — appraiser upload docs with DigiO sign', async () => {
      await loginAs('appraiser');
      await digio.validateDigiOFunctionality_appraiserUploadDocs();
    });
    await test.step('validate DigiO Arvog — ops approval', async () => {
      await loginAs('ops');
      await opsApproval.opsAprroval();
    });
    await test.step('validate DigiO Arvog — Arvog partner approval + disbursement', async () => {
      await loginAs('partner');
      await partnerApproval.partnerAprroval();
    });
    await test.step('validate DigiO Arvog — packet submission (appraiser)', async () => {
      await loginAs('appraiser');
      await packetSubmission.packetSubmission();
    });
  });
});
