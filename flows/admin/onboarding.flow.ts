import type { Page } from "@playwright/test";
import { AdminLoginPage } from "../../pages/admin/login.page";
import { CustomerManagementPage } from "../../pages/admin/customer-management.page";
import { KycPage } from "../../pages/admin/kyc.page";
import { KycApprovalPage } from "../../pages/admin/kyc-approval.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { getKycFilePaths } from "../../utils/data/test-file-paths";

export interface OnboardingResult {
  customerFirstName: string;
}

export async function onboardCustomerThroughKyc(
  page: Page,
): Promise<OnboardingResult> {
  const login = new AdminLoginPage(page);
  const customerManagement = new CustomerManagementPage(page);
  const kyc = new KycPage(page);
  const kycApproval = new KycApprovalPage(page);
  await login.loginAs("appraiser");

  await customerManagement.clickOnCustomerManagementButton();

  const { panCardPath, aadhaarPath, signaturePath } = getKycFilePaths();
  await page.waitForTimeout(5000);
  await kyc.ClickonKyc(panCardPath, signaturePath, aadhaarPath);

  await page.waitForTimeout(5000);
  await login.loginAs("ops");
  await kycApproval.performOpsRatingActions(kyc);

  return { customerFirstName: getLoginData().firstName };
}
