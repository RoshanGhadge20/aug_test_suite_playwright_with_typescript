import { test, expect } from "../../fixtures/admin.fixture";

test.describe("TC25 re-KYC for the newly created customer @regression @admin @kyc", () => {
  //   test("appraiser: open Re KYC for the current customer from Applied KYC", async ({
  //     loginAs,
  //     reKyc,
  //     kyc,
  //     kycApproval,
  //     kycFilePaths,
  //     page,
  //   }) => {
  //     test.setTimeout(10 * 60_000);

  //     await test.step("appraiser: open Re KYC from Applied KYC", async () => {
  //       await loginAs("appraiser");
  //       const customerId = await reKyc.openReKycForCurrentCustomer();
  //       expect(customerId).toBeTruthy();
  //       await expect(
  //         page.locator("xpath=//*[normalize-space()='Customer KYC']").first(),
  //       ).toBeVisible();
  //     });

  //     await test.step("appraiser: complete the re-KYC wizard through Review & Submit", async () => {
  //       await reKyc.completeReKyc({
  //         signaturePath: kycFilePaths.signaturePath,
  //         panCardPath: kycFilePaths.panCardPath,
  //       });
  //     });

  //     await test.step("ops: approve the re-KYC", async () => {
  //       await loginAs("ops");
  //       const { selectedStatus, formClosed } =
  //         await kycApproval.performOpsRatingActions(kyc);
  //       expect.soft(selectedStatus).toBe("Approved");
  //       expect.soft(formClosed).toBe(true);
  //     });
  //   });

  test("appraiser: new customer + KYC, OPS approves, then re-KYC with new PAN and Aadhaar", async ({
    loginAs,
    customerManagement,
    kyc,
    kycApproval,
    reKyc,
    kycFilePaths,
    page,
  }) => {
    test.setTimeout(25 * 60_000);

    // await test.step("appraiser: create a new customer and complete KYC (manual PAN + auto Aadhaar)", async () => {
    //   await loginAs("appraiser");
    //   await customerManagement.clickOnCustomerManagementButton();
    //   await kyc.verifyManualPanWithAutoAadhaar(
    //     undefined,
    //     kycFilePaths.panCardPath,
    //     kycFilePaths.signaturePath,
    //   );
    // });

    // await test.step("ops: approve the first KYC", async () => {
    //   await page.waitForTimeout(5000);
    //   await loginAs("ops");
    //   const { selectedStatus } = await kycApproval.performOpsRatingActions(kyc);
    //   expect.soft(selectedStatus).toBe("Approved");
    // });

    await test.step("appraiser: open Re KYC for the new customer", async () => {
      await loginAs("appraiser");
      const customerId = await reKyc.openReKycForCurrentCustomer();
      expect(customerId).toBeTruthy();
      await expect(
        page.locator("xpath=//*[normalize-space()='Customer KYC']").first(),
      ).toBeVisible();
    });

    await test.step("appraiser: re-KYC — new PAN, new Aadhaar (XML each attempt), personal details", async () => {
      await reKyc.completeReKyc({
        signaturePath: kycFilePaths.signaturePath,
        panCardPath: kycFilePaths.panCardPath,
      });
    });

    await test.step("ops: approve the re-KYC", async () => {
      await loginAs("ops");
      const { selectedStatus, formClosed } =
        await kycApproval.performOpsRatingActions(kyc);
      expect.soft(selectedStatus).toBe("Approved");
      expect.soft(formClosed).toBe(true);
    });
  });

  const firstKycTypes = ["manual PAN + manual Aadhaar", "OVD"] as const;
  for (const firstKyc of firstKycTypes) {
    test(`re-KYC after ${firstKyc} KYC: ops rating Incomplete`, async ({
      loginAs,
      customerManagement,
      kyc,
      kycApproval,
      kycOvd,
      reKyc,
      kycFilePaths,
      page,
    }) => {
      test.setTimeout(25 * 60_000);

      await test.step(`appraiser: new customer + first KYC (${firstKyc})`, async () => {
        await loginAs("appraiser");
        if (firstKyc === "OVD") {
          await kycOvd.validateAddOvdDlDocumentWithAutoAadhaar(
            undefined,
            kycFilePaths.signaturePath,
          );
        } else {
          await customerManagement.clickOnCustomerManagementButton();
          await kyc.ClickonKyc(
            kycFilePaths.panCardPath,
            kycFilePaths.signaturePath,
            kycFilePaths.aadhaarPath,
          );
        }
      });

      await test.step("ops: approve the first KYC", async () => {
        await page.waitForTimeout(5000);
        await loginAs("ops");
        const { selectedStatus } = await kycApproval.performOpsRatingActions(kyc);
        expect.soft(selectedStatus).toBe("Approved");
      });

      await test.step("appraiser: re-KYC with new PAN and Aadhaar", async () => {
        await loginAs("appraiser");
        await reKyc.openReKycForCurrentCustomer();
        await reKyc.completeReKyc({
          signaturePath: kycFilePaths.signaturePath,
          panCardPath: kycFilePaths.panCardPath,
        });
      });

      await test.step("ops: rate the re-KYC as Incomplete", async () => {
        await loginAs("ops");
        await kyc.performOpsMarkIncomplete("More document needed.");
      });
    });
  }
});
