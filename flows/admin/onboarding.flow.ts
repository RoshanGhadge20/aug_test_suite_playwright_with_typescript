import type { Page } from '@playwright/test';
import { AdminLoginPage } from '../../pages/admin/login.page';
import { CustomerManagementPage } from '../../pages/admin/customer-management.page';
import { KycPage } from '../../pages/admin/kyc.page';
import { KycApprovalPage } from '../../pages/admin/kyc-approval.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

export interface OnboardingResult {
  customerFirstName: string;
}

/**
 * Steps 1–4: create customer, KYC, assign branch, OPS KYC approval.
 *
 * Switches into appraiser at the start, creates the customer/KYC record, then ends logged in as OPS.
 *
 * NOTE (file uploads): KycPage.ClickonKyc() accepts optional panCardPath, signaturePath, and
 * aadhaarPath. All params are guarded in the page object — uploads are skipped when paths are
 * omitted. Wire runtime paths via env vars or test-config before live execution.
 */
export async function onboardCustomerThroughKyc(page: Page): Promise<OnboardingResult> {
  const login = new AdminLoginPage(page);
  const customerManagement = new CustomerManagementPage(page);
  const kyc = new KycPage(page);
  const kycApproval = new KycApprovalPage(page);
  // Start from whatever the fixture seeded (admin) and switch into appraiser for the onboarding flow.
  await login.loginAs('appraiser');

  // Step 1 — appraiser: navigate to Customer Management and add a customer
  await customerManagement.clickOnCustomerManagementButton();

  // Step 2 — appraiser: perform full KYC (PAN → address → personal → review)
  // ClickonKyc chains addressandIdentity(), ValidatePersonalDetails(), reviewAndSubmit() internally.
  // All upload params are optional and guarded; wire file paths via env var / test config for live runs.
  await kyc.ClickonKyc();

  // Step 3 — appraiser: assign branch to the OPS team
  // await kyc.validateAssignBranch();

  // Step 4 — switch to OPS, then approve KYC (delegates reviewAndSubmit to kycPage)
  await login.loginAs('ops');
  await kycApproval.performOpsRatingActions(kyc);

  return { customerFirstName: getLoginData().firstName };
}
