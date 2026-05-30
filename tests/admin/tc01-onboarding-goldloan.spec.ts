import { test } from '../../fixtures/admin.fixture';

test.describe('TC01 onboarding to gold loan @regression @admin @loans', () => {
  test('customer onboarding through gold-loan disbursement', async ({
    customerManagement, kyc, kycApproval, createPacket, newGoldLoan,
    assignPacket, bmApproval, opsApproval, partnerApproval, packetSubmission, loginAs,
  }) => {
    test.setTimeout(15 * 60_000); // long end-to-end chain

    await test.step('add customer', async () => {
      await customerManagement.clickOnCustomerManagementButton();
    });
    await test.step('customer KYC', async () => {
      await kyc.ClickonKyc();
    });
    await test.step('assign branch', async () => {
      await kyc.validateAssignBranch();
    });
    await test.step('KYC approval (OPS)', async () => {
      await loginAs('ops');
      await kycApproval.performOpsRatingActions(kyc);
    });
    await test.step('create packet', async () => {
      await createPacket.validateNewPacket();
    });
    await test.step('apply gold loan', async () => {
      await loginAs('appraiser');
      await newGoldLoan.validateGoldLoan();
    });
    await test.step('assign packet', async () => {
      const code = await assignPacket.createAndAssignPacket();
      await loginAs('appraiser');
      await assignPacket.validateAppraisalPacket(code);
    });
    await test.step('BM approval', async () => {
      await loginAs('bm');
      await bmApproval.validateBranchManager();
    });
    await test.step('OPS approval', async () => {
      await loginAs('ops');
      await opsApproval.opsAprroval();
    });
    await test.step('partner approval and disbursement', async () => {
      await loginAs('partner');
      await partnerApproval.partnerAprroval();
    });
    await test.step('packet submission', async () => {
      await loginAs('appraiser');
      await packetSubmission.packetSubmission();
    });
  });
});
