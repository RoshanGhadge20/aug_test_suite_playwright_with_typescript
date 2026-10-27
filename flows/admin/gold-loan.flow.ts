import type { Page } from "@playwright/test";
import { onboardCustomerThroughKyc } from "./onboarding.flow";
import { AdminLoginPage } from "../../pages/admin/login.page";
import { CreatePacketPage } from "../../pages/admin/create-packet.page";
import { NewGoldLoanPage } from "../../pages/admin/new-gold-loan.page";
import { AssignPacketPage } from "../../pages/admin/assign-packet.page";
import { BmApprovalPage } from "../../pages/admin/bm-approval.page";
import { OpsApprovalPage } from "../../pages/admin/ops-approval.page";
import { PartnerApprovalPage } from "../../pages/admin/partner-approval.page";
import { PacketSubmissionPage } from "../../pages/admin/packet-submission.page";

export async function applyAndDisburseLoan(page: Page): Promise<void> {
  const login = new AdminLoginPage(page);
  const createPacket = new CreatePacketPage(page);
  const newGoldLoan = new NewGoldLoanPage(page);
  const assignPacket = new AssignPacketPage(page);
  const bmApproval = new BmApprovalPage(page);
  const opsApproval = new OpsApprovalPage(page);
  const partnerApproval = new PartnerApprovalPage(page);
  const packetSubmission = new PacketSubmissionPage(page);

  await login.loginAs("admin");
  await createPacket.validateNewPacket();
  await login.loginAs("appraiser");
  await newGoldLoan.validateGoldLoan();
  const code = await assignPacket.createAndAssignPacket();
  await login.loginAs("appraiser");
  await assignPacket.validateAppraisalPacket(code);
  await login.loginAs("bm");
  await bmApproval.validateBranchManager();
  await login.loginAs("ops");
  await opsApproval.opsAprroval();
  await login.loginAs("partner");
  await partnerApproval.partnerAprroval();
  await login.loginAs("appraiser");
  await packetSubmission.packetSubmission();
}

export async function createDisbursedLoan(page: Page): Promise<void> {
  await onboardCustomerThroughKyc(page);
  await applyAndDisburseLoan(page);
}
