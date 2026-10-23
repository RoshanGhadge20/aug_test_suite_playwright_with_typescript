import { test, expect } from "../../fixtures/admin.fixture";
import { onboardCustomerThroughKyc } from "../../flows/admin/onboarding.flow";
import { createDisbursedLoan } from "../../flows/admin/gold-loan.flow";

test.describe("TC03 customer validations @regression @admin @kyc", () => {
  test("customer validations — add button, appraiser request, CRL, KYC form60, view KYC, delete loan, incomplete rating, partner loan, FIC, bank details, pown ticket, CPV arvog, CPV non-arvog, digio, digio arvog", async ({
    page,
    loginAs,
    customerManagement,
    kyc,
    kycApproval,
    appraiserRequest,
    crlPage,
    kycForm60,
    kycOvd,
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

    // await test.step("setup: create disbursed loan (precondition)", async () => {
    //   await createDisbursedLoan(page);
    // });

    // await test.step("validate add button — duplicate mobile (appraiser)", async () => {
    //   await loginAs("appraiser");
    //   const errorText = await customerManagement.validateDuplicateMobile();
    //   expect.soft(errorText).toContain("already exist");
    // });

    // await test.step("validate appraiser request page (ops)", async () => {
    //   await loginAs("ops");
    //   await appraiserRequest.validateAppraiserRequest();
    // });

    // await test.step("validate customer request page — CRL (appraiser)", async () => {
    //   await loginAs("appraiser");
    //   await crlPage.CRLRequestPage();
    //   await kyc.ClickonKyc();
    //   await loginAs("ops");
    //   await kycApproval.performOpsRatingActions(kyc);
    //   await loginAs("appraiser");
    //   await crlPage.viewFunctionality();
    // });

    // await test.step("validate customer KYC with Form60 — autoKycWithPan (appraiser)", async () => {
    //   await loginAs("appraiser");
    //   await kycForm60.autoKycWithPan();
    //   await page.waitForLoadState("networkidle");
    //   await page.waitForTimeout(5000);
    //   await loginAs("ops");
    //   const approvalResult = await kycApproval.performOpsRatingActions(kyc);
    //   expect.soft(approvalResult.selectedStatus).toBe("Approved");
    //   expect.soft(approvalResult.formClosed).toBe(true);
    // });
    // await test.step("validate Add OVD (DL) document with Auto Aadhaar (appraiser)", async () => {
    //   await loginAs("appraiser");
    //   await kycOvd.validateAddOvdDlDocumentWithAutoAadhaar();
    //   await page.waitForLoadState("networkidle");
    //   await page.waitForTimeout(5000);
    //   await loginAs("ops");
    //   const ovdApprovalResult = await kycApproval.performOpsRatingActions(kyc);
    //   expect.soft(ovdApprovalResult.selectedStatus).toBe("Approved");
    //   expect.soft(ovdApprovalResult.formClosed).toBe(true);
    // });
    await test.step("validate customer view KYC — appraiser part", async () => {
      await loginAs("appraiser");
      const kycValues = await viewKycDetails.validateViewKyc_appraiserPart();

      await test.step("validate customer view KYC — ops part", async () => {
        // await loginAs("ops");
        const viewValues = await viewKycDetails.validateViewKyc_opsPart();
        expect.soft(viewValues.viewName).toBe(kycValues.enteredFirstName);
        expect.soft(viewValues.viewLastName).toBe(kycValues.enteredLastName);
        expect.soft(viewValues.viewMobile).toBe(kycValues.enteredMobile);
        expect.soft(viewValues.viewPan).toBe(kycValues.enteredPan);
        await kycApproval.performOpsRatingActions(kyc);
      });
    });
    
    await test.step("validate delete loan functionality (appraiser)", async () => {
      await loginAs("appraiser");
      await deleteLoan.validateDeleteLoan();
    });
    await test.step("validate incomplete in rating — appraiser upload docs", async () => {
      await loginAs("appraiser");
      await incompleteRating.validatePackets_appraiserPart();
    });
    await test.step("validate incomplete in rating — partner sets Incomplete", async () => {
      await loginAs("partner");
      await incompleteRating.validatePackets_partnerIncomplete();
    });
    await test.step("validate incomplete in rating — ops approves", async () => {
      await loginAs("ops");
      await incompleteRating.validatePackets_opsPart();
    });
    await test.step("validate incomplete in rating — partner approves and disburses", async () => {
      await loginAs("partner");
      await incompleteRating.validatePackets_partnerApproveDisburse();
    });
    await test.step("validate incomplete in rating — packet submission (appraiser)", async () => {
      await loginAs("appraiser");
      await packetSubmission.packetSubmission();
    });
    await test.step("validate loan with partner — onboarding precondition", async () => {
      await onboardCustomerThroughKyc(page);
    });
    await test.step("validate loan with partner — appraiser applies loan with ARVOG partner", async () => {
      await loginAs("appraiser");
      await partnerLoan.validateLoanwithPartner_appraiserPart();
    });
    await test.step("validate loan with partner — ops assign packet + approval", async () => {
      await loginAs("ops");
      await opsApproval.opsAprroval();
    });
    await test.step("validate loan with partner — BM approval", async () => {
      await loginAs("bm");
      await bmApproval.validateBranchManager();
    });
    await test.step("validate loan with partner — ops loan approval", async () => {
      await loginAs("ops");
      await opsApproval.opsAprroval();
    });
    await test.step("validate loan with partner — partner approval + disbursement", async () => {
      await loginAs("partner");
      await partnerApproval.partnerAprroval();
    });
    await test.step("validate loan with partner — packet submission (appraiser)", async () => {
      await loginAs("appraiser");
      await packetSubmission.packetSubmission();
    });
    await test.step("validate FIC page with partner and scheme (appraiser)", async () => {
      await loginAs("appraiser");
      await ficPartner.validateGoldLoan();
    });
    await test.step("validate bank details — ops creates packet", async () => {
      await loginAs("ops");
      const packetCode = await bankDetails.validateBankDetails_opsPart();
      await test.step("validate bank details — appraiser assigns packet and uploads", async () => {
        await loginAs("appraiser");
        await bankDetails.validateBankDetails_appraiserPart(packetCode);
      });
    });
    await test.step("validate bank details — ops loan approval", async () => {
      await loginAs("ops");
      await opsApproval.opsAprroval();
    });
    await test.step("validate bank details — partner approval + disbursement", async () => {
      await loginAs("partner");
      await partnerApproval.partnerAprroval();
    });
    await test.step("validate bank details — packet submission (appraiser)", async () => {
      await loginAs("appraiser");
      await packetSubmission.packetSubmission();
    });
    await test.step("validate pawn ticket download (appraiser)", async () => {
      await loginAs("appraiser");
      const pownTicketPath = await pownTicket.validateDownloadPownTicket();
      expect
        .soft(pownTicketPath === "" || pownTicketPath.endsWith(".pdf"))
        .toBeTruthy();
    });
    await test.step("validate CPV with Arvog — onboarding precondition", async () => {
      await onboardCustomerThroughKyc(page);
    });
    await test.step("validate CPV with Arvog — appraiser applies loan", async () => {
      await loginAs("appraiser");
      await cpv.validateAddCPVAndAttchCpv_appraiserApplyLoan();
    });
    await test.step("validate CPV with Arvog — ops creates packet", async () => {
      await loginAs("ops");
      const packetCodeCpvArvog =
        await cpv.validateAddCPVAndAttchCpv_opsPacket();
      await test.step("validate CPV with Arvog — appraiser assigns packet", async () => {
        await loginAs("appraiser");
        await cpv.validateAddCPVAndAttchCpv_appraiserAssignPacket(
          packetCodeCpvArvog,
        );
      });
    });
    await test.step("validate CPV with Arvog — BM approval", async () => {
      await loginAs("bm");
      await bmApproval.validateBranchManager();
    });
    await test.step("validate CPV with Arvog — appraiser upload docs", async () => {
      await loginAs("appraiser");
      await cpv.validateAddCPVAndAttchCpv_appraiserUploadDocs();
    });
    await test.step("validate CPV with Arvog — ops approval", async () => {
      await loginAs("ops");
      await opsApproval.opsAprroval();
    });
    await test.step("validate CPV with Arvog — Arvog partner approval + disbursement", async () => {
      await loginAs("partner");
      await partnerApproval.partnerAprroval();
    });
    await test.step("validate CPV with Arvog — packet submission (appraiser)", async () => {
      await loginAs("appraiser");
      await cpv.packetSubmission();
    });
    await test.step("validate CPV with Arvog — CPV attachment visibility (appraiser)", async () => {
      await loginAs("appraiser");
      const isVisible = await cpv.valiadateCPVAttachment();
      expect.soft(isVisible).toBe(true);
    });

    await test.step("validate CPV non-Arvog — kycApproval precondition (ops)", async () => {
      await loginAs("ops");
      await kycApproval.performOpsRatingActions(kyc);
    });
    await test.step("validate CPV non-Arvog — appraiser applies loan", async () => {
      await loginAs("appraiser");
      await cpv.validateAddCPVAndAttached_appraiserApplyLoan();
    });
    await test.step("validate CPV non-Arvog — ops creates packet", async () => {
      await loginAs("ops");
      const packetCodeCpvNonArvog =
        await cpv.validateAddCPVAndAttchCpv_opsPacket();
      await test.step("validate CPV non-Arvog — appraiser assigns packet", async () => {
        await loginAs("appraiser");
        await cpv.validateAddCPVAndAttchCpv_appraiserAssignPacket(
          packetCodeCpvNonArvog,
        );
      });
    });
    await test.step("validate CPV non-Arvog — BM approval", async () => {
      await loginAs("bm");
      await bmApproval.validateBranchManager();
    });
    await test.step("validate CPV non-Arvog — appraiser upload docs", async () => {
      await loginAs("appraiser");
      await cpv.validateAddCPVAndAttchCpv_appraiserUploadDocs();
    });
    await test.step("validate CPV non-Arvog — ops approval", async () => {
      await loginAs("ops");
      await opsApproval.opsAprroval();
    });
    await test.step("validate CPV non-Arvog — Arvog partner approval + disbursement + packet submission + CPV", async () => {
      await loginAs("partner");
      await partnerApproval.partnerAprroval();
      await loginAs("appraiser");
      await cpv.packetSubmission();
      const isVisible = await cpv.valiadateCPVAttachment();
      expect.soft(isVisible).toBe(true);
    });

    await test.step("validate DigiO — onboarding + gold loan precondition (appraiser)", async () => {
      await onboardCustomerThroughKyc(page);
      await loginAs("appraiser");
      await newGoldLoan.validateGoldLoan();
    });
    await test.step("validate DigiO — ops creates packet + appraiser assigns and uploads DigiO docs", async () => {
      await loginAs("ops");
      await digio.validateDigiO();
    });
    await test.step("validate DigiO — ops loan approval", async () => {
      await loginAs("ops");
      await opsApproval.opsAprroval();
    });
    await test.step("validate DigiO — partner approval + disbursement", async () => {
      await loginAs("partner");
      await partnerApproval.partnerAprroval();
    });
    await test.step("validate DigiO — packet submission (appraiser)", async () => {
      await loginAs("appraiser");
      await packetSubmission.packetSubmission();
    });

    await test.step("validate DigiO Arvog — appraiser applies loan + creates packet", async () => {
      await loginAs("appraiser");
      await digio.validateDigiOFunctionality();
    });
    await test.step("validate DigiO Arvog — BM approval", async () => {
      await loginAs("bm");
      await bmApproval.validateBranchManager();
    });
    await test.step("validate DigiO Arvog — appraiser upload docs with DigiO sign", async () => {
      await loginAs("appraiser");
      await digio.validateDigiOFunctionality_appraiserUploadDocs();
    });
    await test.step("validate DigiO Arvog — ops approval", async () => {
      await loginAs("ops");
      await opsApproval.opsAprroval();
    });
    await test.step("validate DigiO Arvog — Arvog partner approval + disbursement", async () => {
      await loginAs("partner");
      await partnerApproval.partnerAprroval();
    });
    await test.step("validate DigiO Arvog — packet submission (appraiser)", async () => {
      await loginAs("appraiser");
      await packetSubmission.packetSubmission();
    });
  });
});
