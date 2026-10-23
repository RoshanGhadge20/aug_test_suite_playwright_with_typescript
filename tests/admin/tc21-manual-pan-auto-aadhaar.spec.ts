import { test, expect } from "../../fixtures/admin.fixture";

test.describe("TC21 verify manual PAN with auto Aadhaar @regression @admin @kyc", () => {
  test("appraiser: manual PAN identity + auto-verified Aadhaar completes KYC", async ({
    loginAs,
    customerManagement,
    kyc,
    kycFilePaths,
  }) => {
    test.setTimeout(15 * 60_000);

    await test.step("appraiser: create customer, manual PAN + auto Aadhaar KYC", async () => {
      await loginAs("appraiser");
      await customerManagement.clickOnCustomerManagementButton();
      await kyc.verifyManualPanWithAutoAadhaar(
        undefined,
        kycFilePaths.panCardPath,
        kycFilePaths.signaturePath,
      );
    });
  });
});
