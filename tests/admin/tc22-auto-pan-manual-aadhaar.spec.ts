import { test, expect } from "../../fixtures/admin.fixture";

test.describe("TC22 verify auto PAN with manual Aadhaar @regression @admin @kyc", () => {
  test("appraiser: auto-verified PAN + manual Aadhaar completes KYC", async ({
    loginAs,
    customerManagement,
    kyc,
    kycFilePaths,
  }) => {
    test.setTimeout(15 * 60_000);

    await test.step("appraiser: create customer, auto PAN + manual Aadhaar KYC", async () => {
      await loginAs("appraiser");
      // await customerManagement.clickOnCustomerManagementButton();
      const result = await kyc.verifyAutoPanWithManualAadhaar(
        kycFilePaths.panCardPath,
        kycFilePaths.signaturePath,
      );

      expect
        .soft(
          result.panVerifySucceeded,
          "PAN should auto-verify against the real backend, not fall back to manual continuation",
        )
        .toBe(true);
      expect.soft(result.panSwitchedToManual).toBe(false);
    });
  });
});
