import { test, expect } from "../../fixtures/admin.fixture";

test.describe("TC20 verify Aadhaar consent with invalid OTP @regression @admin @kyc", () => {
  test("appraiser: Verify Aadhaar triggers consent modal, invalid OTP is rejected", async ({
    loginAs,
    kyc,
  }) => {
    test.setTimeout(15 * 60_000);

    await test.step("appraiser: verify Aadhaar consent with invalid OTP", async () => {
      await loginAs("appraiser");
      const result = await kyc.verifyAadhaarConsentWithInvalidOtp();

      expect
        .soft(
          result.consentModalOpened,
          "Aadhaar consent modal should open after Verify Aadhaar",
        )
        .toBe(true);
      expect
        .soft(
          result.errorVisible || result.modalStillOpen,
          "an invalid OTP should either show an error banner or keep the consent modal open, not silently succeed",
        )
        .toBe(true);
    });
  });

  const proofs = [
    { key: "aadhaar", name: "Aadhaar Card", match: /aadh?a+r/i },
    { key: "voter", name: "Voter ID", match: /voter/i },
    { key: "drivingLicence", name: "Driving Licence", match: /driv/i },
    {
      key: "utilityBill",
      name: "Utility Bill",
      match: /utility|electric|bill/i,
    },
  ] as const;

  for (const proof of proofs) {
    test(`appraiser: manual KYC with permanent address proof = ${proof.name}`, async ({
      loginAs,
      customerManagement,
      kyc,
      kycFilePaths,
    }) => {
      test.setTimeout(15 * 60_000);

      await test.step(`appraiser: create customer, manual KYC with ${proof.name} as permanent address proof`, async () => {
        await loginAs("appraiser");
        await customerManagement.clickOnCustomerManagementButton();
        const selectedProof = await kyc.verifyPermanentAddressWithProof(
          proof.key,
          kycFilePaths.panCardPath,
          kycFilePaths.signaturePath,
        );
        expect
          .soft(
            selectedProof,
            `Permanent Address Proof type should be ${proof.name} when the KYC is submitted`,
          )
          .toMatch(proof.match);
      });
    });
  }
});
