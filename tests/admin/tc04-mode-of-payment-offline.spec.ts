import { AssignPacketPage } from "@pages/admin/assign-packet.page";
import { test, expect } from "../../fixtures/admin.fixture";
import { createDisbursedLoan } from "../../flows/admin/gold-loan.flow";
import { PartReleaseOfflinePage } from "@pages/admin/part-release-offline.page";
import { PacketSubmissionPage } from "@pages/admin/packet-submission.page";

// test.describe('TC04 mode of payment offline @regression @admin @payments', () => {
//   test('mode of payment — offline quick pay, custom validation, part pay, proceed/cancel, transaction log, part release, full release, renew offline, renew+topup offline, view loan, waiver, manual charges, cancel button', async ({
//     page,
//     loginAs,
//     quickPayment,
//     partPayment,
//     customCancel,
//     loanView,
//     partReleaseOffline,
//     fullReleaseOffline,
//     renewZero,
//     waiver,
//     manualCharges,
//   }) => {
//     test.setTimeout(25 * 60_000);

//     await test.step('setup: create disbursed loan', async () => {
//       await createDisbursedLoan(page);
//     });

//     await test.step('quick pay offline (appraiser)', async () => {
//       await loginAs('appraiser');
//       await quickPayment.quickPayOffline();

//     });

//     await test.step('quick pay with custom amount — validate zero amount (appraiser)', async () => {
//       await loginAs('appraiser');
//       const errorMsg = await customCancel.validateCustomFunctionality();
//       expect.soft(errorMsg).toContain('Amount should be atleast');
//     });

//     await test.step('quick pay with custom amount — validate min amount (appraiser)', async () => {
//       await loginAs('appraiser');
//       await customCancel.validateMinAmount();
//     });

//     await test.step('quick pay with custom amount — validate next due date amount (appraiser)', async () => {
//       await loginAs('appraiser');
//       await customCancel.validateWithNextDueDateAmount();
//     });

//     await test.step('quick pay with custom amount — validate max over next due date (appraiser)', async () => {
//       await loginAs('appraiser');
//       const errorMsg = await customCancel.validateNextDueAmontMax();
//       expect.soft(errorMsg).toContain('Please opt for Part Payment option to pay more amount');
//     });

//     await test.step('part pay offline deposit (appraiser)', async () => {
//       await loginAs('appraiser');
//       await partPayment.deposit();
//     });

//     await test.step('validate proceed and cancel button (appraiser)', async () => {
//       await loginAs('appraiser');
//       const [isProceedDisplayed, isProceedEnabled, isCancelDisplayed] = await customCancel.validateProceedButton();
//       expect.soft(isProceedDisplayed).toBe(true);
//       expect.soft(isProceedEnabled).toBe(true);
//       expect.soft(isCancelDisplayed).toBe(true);
//     });

//     await test.step('validate view transaction log (appraiser)', async () => {
//       await loginAs('appraiser');
//       await loanView.validateViewTransaction();
//     });

//     await test.step('part release offline — validate (appraiser)', async () => {
//       await loginAs('appraiser');
//       await partReleaseOffline.validatePartReleaseOffline();
//     });

//     await test.step('part release offline — deposit (appraiser)', async () => {
//       await loginAs('appraiser');
//       await partReleaseOffline.deposit();
//     });

//     await test.step('full release offline — validate (appraiser)', async () => {
//       await loginAs('appraiser');
//       await fullReleaseOffline.validateFullRelease();
//     });

//     await test.step('full release offline — deposit (appraiser)', async () => {
//       await loginAs('appraiser');
//       await fullReleaseOffline.deposit();
//     });

//     await test.step('renew loan offline (appraiser)', async () => {
//       await loginAs('appraiser');
//       await renewZero.validateRenewPaymentOffline();
//     });

//     await test.step('renew loan with top-up offline — deposit (appraiser)', async () => {
//       await loginAs('appraiser');
//       await renewZero.validateRenewLoanWithTopUpDeposit();
//     });

//     await test.step('validate view functionality of loan (appraiser)', async () => {
//       await loginAs('appraiser');
//       await loanView.viewFunctionality();
//     });

//     await test.step('validate waiver functionality of loan (appraiser)', async () => {
//       await loginAs('appraiser');
//       const [waiversName, wavierCharge] = await waiver.validateWavier();
//       expect.soft(waiversName.toLowerCase()).toBe('test3 ok');
//       expect.soft(wavierCharge).toBe('100.00');
//     });

//     await test.step('validate manual charges functionality (appraiser)', async () => {
//       await loginAs('appraiser');
//       const [chargeNameText, actualCharge] = await manualCharges.manualCharges();
//       expect.soft(chargeNameText).toBe('QA');
//       expect.soft(actualCharge).toBe('100.00');
//     });

//     await test.step('validate cancel button functionality (appraiser)', async () => {
//       await loginAs('appraiser');
//       await customCancel.validateCancelButton();
//     });
//   });
// });

// test.describe("TC04 mode of payment offline @regression @admin @payments", () => {
// test("mode of payment — offline quick pay, custom validation, part pay, proceed/cancel, transaction log, part release, full release, renew offline, renew+topup offline, view loan, waiver, manual charges, cancel button", async ({
//   page,
//   loginAs,
//   quickPayment,
//   partPayment,
//   customCancel,
//   loanView,
//   partReleaseOffline,
//   fullReleaseOffline,
//   renewZero,
//   waiver,
//   manualCharges,
// }) => {
//   test.setTimeout(25 * 60_000);

//     await test.step("part pay offline (appraiser)", async () => {
//       await loginAs("appraiser");
//    await partPayment.partPayOffline();
//     });

//   await test.step("part pay offline deposit (appraiser)", async () => {
//     await loginAs("appraiser");
//     await partPayment.deposit();
//   });
// });
// test("mode of payment — offline quick pay, custom validation, part pay, proceed/cancel, transaction log, part release, full release, renew offline, renew+topup offline, view loan, waiver, manual charges, cancel button", async ({
//   page,
//   loginAs,
//   quickPayment,
//   partPayment,
//   customCancel,
//   loanView,
//   partReleaseOffline,
//   fullReleaseOffline,
//   renewZero,
//   waiver,
//   manualCharges,
// }) => {
//   test.setTimeout(25 * 60_000);
//   await test.step("part release offline — validate (appraiser)", async () => {
//     await loginAs("appraiser");
//     await quickPayment.quikPaymentsuccess();
//     await partReleaseOffline.validatePartReleaseOffline();
//     await page.waitForLoadState("networkidle");
//     await page.waitForTimeout(5000);
//     await loginAs("admin");
//     const assignPacketPage = new AssignPacketPage(page);
//     const packetCode = await assignPacketPage.createAndAssignPacket();
//     await page.waitForLoadState("networkidle");
//     await page.waitForTimeout(5000);
//     await loginAs("appraiser");
//     await partReleaseOffline.assignPacket(packetCode);
//     await assignPacketPage.validateAppraisalPacket(packetCode);
//     await page.waitForLoadState("networkidle");
//     await page.waitForTimeout(5000);
//     await loginAs("partner");
//     await page.waitForLoadState("networkidle");
//     await page.waitForTimeout(5000);
//     await partReleaseOffline.partnerPartReleaseApproval();
//     await page.waitForLoadState("networkidle");
//     await page.waitForTimeout(5000);
//     await loginAs("appraiser");
//     const packetSubmissionPage = new PacketSubmissionPage(page);
//     await packetSubmissionPage.packetSubmission();

//   });
// });

// test.describe("TC02 mode of payment @regression @admin @payments", () => {
//   test("mode of payment — quick pay, part pay, top-up, renew, renew+topup, part release, full release", async ({
//     quickPayment,
//     partRelease,
//     page,
//     loginAs,
//   }) => {
//     test.setTimeout(20 * 60_000);
//     await test.step("part release (appraiser — delegates to packet submission)", async () => {
// await loginAs("appraiser");
// await quickPayment.quikPaymentsuccess();
// await partRelease.partReleaseLoan();
// await page.waitForLoadState("networkidle");
// await page.waitForTimeout(5000);
// await loginAs("admin");
// const assignPacketPage = new AssignPacketPage(page);
// const packetCode = await assignPacketPage.createAndAssignPacket();
// await page.waitForLoadState("networkidle");
// await page.waitForTimeout(5000);
// await loginAs("appraiser");
// await partRelease.assignPacket(packetCode);
// await assignPacketPage.validateAppraisalPacket(packetCode);
// await page.waitForLoadState("networkidle");
//       await page.waitForTimeout(5000);
//       await loginAs("partner");
//       await page.waitForLoadState("networkidle");
//       await page.waitForTimeout(5000);
//       await partRelease.partnerPartReleaseApproval();
//       await page.waitForLoadState("networkidle");
//       await page.waitForTimeout(5000);
//       await loginAs("appraiser");
//       const packetSubmissionPage = new PacketSubmissionPage(page);
//       await packetSubmissionPage.packetSubmission();
//     });
//   });
// });
// test("mode of payment offline — full release", async ({
//   page,
//   loginAs,
//   quickPayment,
//   partPayment,
//   customCancel,
//   loanView,
//   partReleaseOffline,
//   fullReleaseOffline,
//   renewZero,
//   waiver,
//   manualCharges,
// }) => {
//   test.setTimeout(25 * 60_000);

//   await test.step("full release offline — validate (appraiser)", async () => {
//     await loginAs("appraiser");
//     await fullReleaseOffline.validateFullRelease();
//     await page.waitForTimeout(5000);
//     await test.step('full release offline — validate (appraiser)', async () => {
//       await loginAs('appraiser');
//       await fullReleaseOffline.validateFullRelease();
//     });

//     await test.step('full release offline — deposit (appraiser)', async () => {
//       await loginAs('appraiser');
//       await fullReleaseOffline.deposit();
//     });
//   });
// });

// test("mode of payment offline — renew loan cash", async ({
//   loginAs,
//   renewZero,
// }) => {
//   test.setTimeout(15 * 60_000);

//   await test.step("renew loan offline with cash (appraiser)", async () => {
//     await loginAs("appraiser");
//     await renewZero.validateRenewPaymentOfflineCash();
//   });
// });
// test("mode of payment offline — renew loan cash", async ({
//   loginAs,
//   page,
//   loanView,
//   renewZero,
// }) => {
//   test.setTimeout(15 * 60_000);

//   await test.step("validate view transaction log (appraiser)", async () => {
//     await loginAs("appraiser");
//     await loanView.validateViewTransaction();
//     await page.waitForTimeout(5000);
//     await loanView.viewFunctionality();
//   });
// });

// test("mode of payment offline — renew loan cash", async ({
//   loginAs,
//   customCancel,
//   page,
//   loanView,
//   renewZero,
// }) => {
//   test.setTimeout(15 * 60_000);
//   await test.step("validate proceed and cancel button (appraiser)", async () => {
//     await loginAs("appraiser");
//     const [isProceedDisplayed, isProceedEnabled, isCancelDisplayed] =
//       await customCancel.validateProceedButton();
//     expect.soft(isProceedDisplayed).toBe(true);
//     expect.soft(isProceedEnabled).toBe(true);
//     expect.soft(isCancelDisplayed).toBe(true);
//   });
// });

// test("mode of payment offline — renew loan cash", async ({
//   loginAs,
//   waiver,
//   customCancel,
//   page,
//   loanView,
//   renewZero,
// }) => {
//   test.setTimeout(15 * 60_000);
//   await test.step("validate waiver functionality of loan (appraiser)", async () => {
//     await loginAs("appraiser");
//     const [waiversName, wavierCharge] = await waiver.validateWavier();
//     expect.soft(waiversName.toLowerCase()).toBe("test3 ok");
//     expect.soft(wavierCharge).toBe("100.00");
//   });
// });
