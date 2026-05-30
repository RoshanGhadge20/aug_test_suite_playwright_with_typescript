import type { Page } from '@playwright/test';
import { onboardCustomerThroughKyc } from './onboarding.flow';
import { AdminLoginPage } from '../../pages/admin/login.page';
import { CreatePacketPage } from '../../pages/admin/create-packet.page';
import { NewGoldLoanPage } from '../../pages/admin/new-gold-loan.page';
import { AssignPacketPage } from '../../pages/admin/assign-packet.page';
import { BmApprovalPage } from '../../pages/admin/bm-approval.page';
import { OpsApprovalPage } from '../../pages/admin/ops-approval.page';
import { PartnerApprovalPage } from '../../pages/admin/partner-approval.page';
import { PacketSubmissionPage } from '../../pages/admin/packet-submission.page';

/**
 * Steps 5–11: create packet → gold loan → assign + appraise packet → BM → OPS → partner → submission.
 *
 * Assumes onboarding is already done and the session is currently logged in as OPS (as left
 * by onboardCustomerThroughKyc). Role switches are injected at the points where the Java flow
 * called loginWith*.
 */
export async function applyAndDisburseLoan(page: Page): Promise<void> {
  const login = new AdminLoginPage(page);
  const createPacket = new CreatePacketPage(page);
  const newGoldLoan = new NewGoldLoanPage(page);
  const assignPacket = new AssignPacketPage(page);
  const bmApproval = new BmApprovalPage(page);
  const opsApproval = new OpsApprovalPage(page);
  const partnerApproval = new PartnerApprovalPage(page);
  const packetSubmission = new PacketSubmissionPage(page);

  // Step 5 — ops (no role switch; stays on OPS from kycApproval): create a new packet
  await createPacket.validateNewPacket();

  // Step 6 — switch to appraiser: apply for a new Gold Loan
  await login.loginAs('appraiser');
  await newGoldLoan.validateGoldLoan();

  // Step 7 — assign packet (still appraiser — createAndAssignPacket runs as appraiser)
  // Phase A: create & assign the packet, capturing the generated code
  const code = await assignPacket.createAndAssignPacket();
  // Java line 80: loginWithAppraiser() after createAndAssignPacket — switch to appraiser
  await login.loginAs('appraiser');
  // Phase B: validate/appraise the packet as appraiser
  await assignPacket.validateAppraisalPacket(code);

  // Step 8 — switch to BM: branch manager approval
  await login.loginAs('bm');
  await bmApproval.validateBranchManager();

  // Step 9 — switch to OPS: ops team loan approval
  await login.loginAs('ops');
  await opsApproval.opsAprroval();

  // Step 10 — switch to partner: partner approval + disbursement
  await login.loginAs('partner');
  await partnerApproval.partnerAprroval();

  // Step 11 — switch to appraiser: submit the packet
  await login.loginAs('appraiser');
  await packetSubmission.packetSubmission();
}

/**
 * Full TC01 happy-path: onboarding (steps 1–4) + loan apply/disburse (steps 5–11).
 * Reusable precondition for TC02–TC06.
 */
export async function createDisbursedLoan(page: Page): Promise<void> {
  await onboardCustomerThroughKyc(page);
  await applyAndDisburseLoan(page);
}
