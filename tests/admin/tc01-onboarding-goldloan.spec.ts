import { test, expect } from "../../fixtures/admin.fixture";
import fs from "fs";
test.describe("TC01 onboarding to gold loan @regression @admin @loans", () => {
  test("customer onboarding through gold-loan disbursement", async ({
    customerManagement,
    kyc,
    kycApproval,
    createPacket,
    newGoldLoan,
    assignPacket,
    opsApproval,
    partnerApproval,
    packetSubmission,
    loginAs,
    page,
    kycFilePaths,
  }) => {
    test.setTimeout(15 * 60_000);
    await test.step("add customer", async () => {
      test.setTimeout(15 * 60_000);
      await loginAs("appraiser");
      await customerManagement.clickOnCustomerManagementButton();
    });
    // await test.step("validate Apply KYC button", async () => {
    //   test.setTimeout(15 * 60_000);
    //   const { isDisplayed, isEnabled } = await kyc.validateApplyKycButton();
    //   expect.soft(isDisplayed).toBe(true);
    //   expect.soft(isEnabled).toBe(true);
    // });

    // await test.step("customer KYC - OVD Auto Aadhaar", async () => {
    //   test.setTimeout(15 * 60_000);
    //   await kyc.applyOvdWithAutoAadhaar(
    //     "875302915562",
    //     kycFilePaths.signaturePath,
    //   );
    // });
    await test.step("customer KYC", async () => {
      test.setTimeout(15 * 60_000);
      await kyc.ClickonKyc(
        kycFilePaths.panCardPath,
        kycFilePaths.signaturePath,
        kycFilePaths.aadhaarPath,
      );
    });
    await test.step("KYC approval (OPS)", async () => {
      test.setTimeout(15 * 60_000);
      await loginAs("ops");
      await kycApproval.performOpsRatingActions(kyc);
    });
    // await test.step("create packet", async () => {
    //   test.setTimeout(15 * 60_000);
    //   await createPacket.validateNewPacket();
    // });
    await test.step("apply gold loan", async () => {
      test.setTimeout(15 * 60_000);
      await loginAs("appraiser");
      await newGoldLoan.validateGoldLoan();
    });
    await test.step("assign packet", async () => {
      test.setTimeout(15 * 60_000);
      await loginAs("admin");
      const code = await assignPacket.createAndAssignPacket();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(5000);
      await loginAs("appraiser");
      await assignPacket.validateAppraisalPacket(code);
    });
    // await test.step("BM approval", async () => {
    //   await loginAs("bm");
    //   await bmApproval.validateBranchManager();
    // });
    await test.step("OPS approval", async () => {
      test.setTimeout(15 * 60_000);
      await loginAs("ops");
      await opsApproval.opsAprroval();
    });
    await test.step("partner approval and disbursement", async () => {
      test.setTimeout(15 * 60_000);
      await loginAs("partner");
      await partnerApproval.partnerAprroval();
    });
    await test.step("packet submission", async () => {
      test.setTimeout(15 * 60_000);
      await loginAs("appraiser");
      await packetSubmission.packetSubmission();
    });
  });
});

//  test('customer onboarding through gold-loan disbursement', async ({customerManagement, loginAs }) => {
//  test.setTimeout(15 * 60_000); // long end-to-end chain

//     await test.step('add customer', async () => {
//        //await loginAs('admin');
//       await customerManagement.clickOnCustomerManagementButton();
//     });
//     });

// test.only('customer onboarding through gold-loan disbursement', async ({ createPacket, loginAs }) => {
//   test.setTimeout(15 * 60_000);

//   await test.step('login as admin', async () => {
//     await loginAs('admin');
//   });

//   await test.step('create packet', async () => {
//     await createPacket.validateNewPacket();
//   });
// });
// test.describe("TC01 onboarding to gold loan @regression @admin @loans", () => {
//   test("customer onboarding through gold-loan disbursement", async ({
//     newGoldLoan,
//     loginAs,
//   }) => {
//     test.setTimeout(15 * 60_000);

//     await test.step("validate gold loan", async () => {
//       await loginAs("appraiser");
//       await newGoldLoan.validateGoldLoan();
//     });
//   });
// });
// test.describe("TC01 onboarding to gold loan @regression @admin @loans", () => {
//   test("customer onboarding through gold-loan disbursement", async ({
//     assignPacket,
//     loginAs,
//   }) => {
//     test.setTimeout(15 * 60_000);

//     await test.step("assign packet", async () => {
//       const code = await assignPacket.createAndAssignPacket();
//       await loginAs("appraiser");
//       await assignPacket.validateAppraisalPacket(code);
//     });
//   });
// });
// test.describe('TC01 onboarding to gold loan @regression @admin @loans', () => {
// test('customer onboarding through gold-loan disbursement', async ({  opsApproval, loginAs }) => {
//   test.setTimeout(15 * 60_000);
//     await test.step('OPS approval', async () => {
//       await loginAs('ops');
//       await opsApproval.opsAprroval();
//     });
//   });

// });
// test.describe('TC01 onboarding to gold loan @regression @admin @loans', () => {
// test('customer onboarding through gold-loan disbursement', async ({partnerApproval, loginAs }) => {
//   test.setTimeout(15 * 60_000);
//  await test.step('partner approval and disbursement', async () => {
//       await loginAs('partner');
//       await partnerApproval.partnerAprroval();
//     });
//   });

// });
// test.describe('TC01 onboarding to gold loan @regression @admin @loans', () => {
// test('customer onboarding through gold-loan disbursement', async ({packetSubmission, loginAs }) => {
//   test.setTimeout(15 * 60_000);
//  await test.step('packet submission', async () => {
//       await loginAs('appraiser');
//       await packetSubmission.packetSubmission();
//     });
//   });

// });
