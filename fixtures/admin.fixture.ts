import { test as base } from "@playwright/test";
import { AdminLoginPage } from "../pages/admin/login.page";
import { CustomerManagementPage } from "../pages/admin/customer-management.page";
import { KycPage } from "../pages/admin/kyc.page";
import { KycApprovalPage } from "../pages/admin/kyc-approval.page";
import { CreatePacketPage } from "../pages/admin/create-packet.page";
import { NewGoldLoanPage } from "../pages/admin/new-gold-loan.page";
import { AssignPacketPage } from "../pages/admin/assign-packet.page";
import { BmApprovalPage } from "../pages/admin/bm-approval.page";
import { OpsApprovalPage } from "../pages/admin/ops-approval.page";
import { PartnerApprovalPage } from "../pages/admin/partner-approval.page";
import { PacketSubmissionPage } from "../pages/admin/packet-submission.page";
import { QuickPaymentPage } from "../pages/admin/quick-payment.page";
import { PartPaymentPage } from "../pages/admin/part-payment.page";
import { TopUpPage } from "../pages/admin/top-up.page";
import { RenewLoanPage } from "../pages/admin/renew-loan.page";
import { RenewPlusTopupPage } from "../pages/admin/renew-plus-topup.page";
import { PartReleasePage } from "../pages/admin/part-release.page";
import { FullReleasePage } from "../pages/admin/full-release.page";
// TC03 page objects
import { AppraiserRequestPage } from "../pages/admin/appraiser-request.page";
import { CrlPagePage } from "../pages/admin/crl-page.page";
import { KycForm60Page } from "../pages/admin/kyc-form60.page";
import { KycOvdPage } from "../pages/admin/kyc-OVD.page";
import { ViewKycDetailsPage } from "../pages/admin/view-kyc-details.page";
import { ReKycPage } from "../pages/admin/re-kyc.page";
import { IndustryPage } from "../pages/admin/industry.page";
import { DeleteLoanPage } from "../pages/admin/delete-loan.page";
import { IncompleteRatingPage } from "../pages/admin/incomplete-rating.page";
import { PartnerLoanPage } from "../pages/admin/partner-loan.page";
import { FicPartnerPage } from "../pages/admin/fic-partner.page";
import { BankDetailsPage } from "../pages/admin/bank-details.page";
import { PownTicketPage } from "../pages/admin/pown-ticket.page";
import { CpvPage } from "../pages/admin/cpv.page";
import { DigioPage } from "../pages/admin/digio.page";
// TC04 page objects
import { PartReleaseOfflinePage } from "../pages/admin/part-release-offline.page";
import { FullReleaseOfflinePage } from "../pages/admin/full-release-offline.page";
import { RenewZeroPage } from "../pages/admin/renew-zero.page";
import { LoanViewPage } from "../pages/admin/loan-view.page";
import { WaiverPage } from "../pages/admin/waiver.page";
import { ManualChargesPage } from "../pages/admin/manual-charges.page";
import { CustomCancelPage } from "../pages/admin/custom-cancel.page";
// TC06 page objects
import { DepositPage } from "../pages/admin/deposit.page";
import { BtLoanPage } from "../pages/admin/bt-loan.page";
import { ZahReviewPage } from "../pages/admin/zah-review.page";
import { BtRejectedLoanPage } from "../pages/admin/bt-rejected-loan.page";
// TC05 page objects
import { AddPartnerPage } from "../pages/admin/add-partner.page";
import { EditPartnerBranchPage } from "../pages/admin/edit-partner-branch.page";
import { AddPartnerBranchPage } from "../pages/admin/add-partnerbranchuser.page";
import { InternalUserPage } from "../pages/admin/internal-user.page";
import { InternalUserBranchPage } from "../pages/admin/internal-user-branch.page";
import { GoldRatePage } from "../pages/admin/gold-rate.page";
import { AddSchemePage } from "../pages/admin/add-scheme.page";
import { UpdateRpgPage } from "../pages/admin/update-rpg.page";
import { AddLeadPage } from "../pages/admin/add-lead.page";
import { KaratPage } from "../pages/admin/karat.page";
import { UnapprovalReasonPage } from "../pages/admin/unapproval-reason.page";
import { WaiverTypePage } from "../pages/admin/waiver-type.page";
import { LoanDefectsPage } from "../pages/admin/loan-defects.page";
import type { AdminRole } from "../config/roles";
import { adminRoleCreds } from "../config/urls";
import { getTargetEnv } from "../config/environments";
import { getKycFilePaths } from "../utils/data/test-file-paths";
import { loginWithSessionCache } from "../utils/auth/admin-session-cache";

type AdminFixtures = {
  adminLogin: AdminLoginPage;
  loginAs: (role: AdminRole) => Promise<void>;
  kycFilePaths: {
    panCardPath?: string;
    aadhaarPath?: string;
    signaturePath?: string;
    imagePath?: string;
  };
  customerManagement: CustomerManagementPage;
  kyc: KycPage;
  kycApproval: KycApprovalPage;
  createPacket: CreatePacketPage;
  newGoldLoan: NewGoldLoanPage;
  assignPacket: AssignPacketPage;
  bmApproval: BmApprovalPage;
  opsApproval: OpsApprovalPage;
  partnerApproval: PartnerApprovalPage;
  packetSubmission: PacketSubmissionPage;
  quickPayment: QuickPaymentPage;
  partPayment: PartPaymentPage;
  topUp: TopUpPage;
  renewLoan: RenewLoanPage;
  renewPlusTopup: RenewPlusTopupPage;
  partRelease: PartReleasePage;
  fullRelease: FullReleasePage;
  // TC03
  appraiserRequest: AppraiserRequestPage;
  crlPage: CrlPagePage;
  kycForm60: KycForm60Page;
  kycOvd: KycOvdPage;
  viewKycDetails: ViewKycDetailsPage;
  reKyc: ReKycPage;
  industry: IndustryPage;
  deleteLoan: DeleteLoanPage;
  incompleteRating: IncompleteRatingPage;
  partnerLoan: PartnerLoanPage;
  ficPartner: FicPartnerPage;
  bankDetails: BankDetailsPage;
  pownTicket: PownTicketPage;
  cpv: CpvPage;
  digio: DigioPage;
  // TC04
  partReleaseOffline: PartReleaseOfflinePage;
  fullReleaseOffline: FullReleaseOfflinePage;
  renewZero: RenewZeroPage;
  loanView: LoanViewPage;
  waiver: WaiverPage;
  manualCharges: ManualChargesPage;
  customCancel: CustomCancelPage;
  // TC05
  addPartner: AddPartnerPage;
  editPartnerBranch: EditPartnerBranchPage;
  addPartnerBranchUser: AddPartnerBranchPage;
  internalUser: InternalUserPage;
  internalUserBranch: InternalUserBranchPage;
  goldRate: GoldRatePage;
  addScheme: AddSchemePage;
  updateRpg: UpdateRpgPage;
  addLead: AddLeadPage;
  karat: KaratPage;
  unapprovalReason: UnapprovalReasonPage;
  waiverType: WaiverTypePage;
  loanDefects: LoanDefectsPage;
  // TC06
  deposit: DepositPage;
  btLoan: BtLoanPage;
  zahReview: ZahReviewPage;
  btRejectedLoan: BtRejectedLoanPage;
};

export const test = base.extend<AdminFixtures>({
  page: [
    async ({ page }, use) => {
      const login = new AdminLoginPage(page);
      const { mobile, otp } = adminRoleCreds("admin");
      const env = getTargetEnv();
      await loginWithSessionCache(page, "admin", env, async () => {
        await login.login(mobile, otp);
      });
      await use(page);
    },
    { scope: "test", timeout: 90_000 },
  ],
  adminLogin: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  loginAs: async ({ adminLogin }, use) => {
    await use((role: AdminRole) => adminLogin.loginAs(role));
  },
  kycFilePaths: async ({}, use) => {
    const filePaths = getKycFilePaths();
    await use(filePaths);
  },
  customerManagement: async ({ page }, use) => {
    await use(new CustomerManagementPage(page));
  },
  kyc: async ({ page }, use) => {
    await use(new KycPage(page));
  },
  kycApproval: async ({ page }, use) => {
    await use(new KycApprovalPage(page));
  },
  createPacket: async ({ page }, use) => {
    await use(new CreatePacketPage(page));
  },
  newGoldLoan: async ({ page }, use) => {
    await use(new NewGoldLoanPage(page));
  },
  assignPacket: async ({ page }, use) => {
    await use(new AssignPacketPage(page));
  },
  bmApproval: async ({ page }, use) => {
    await use(new BmApprovalPage(page));
  },
  opsApproval: async ({ page }, use) => {
    await use(new OpsApprovalPage(page));
  },
  partnerApproval: async ({ page }, use) => {
    await use(new PartnerApprovalPage(page));
  },
  packetSubmission: async ({ page }, use) => {
    await use(new PacketSubmissionPage(page));
  },
  quickPayment: async ({ page }, use) => {
    await use(new QuickPaymentPage(page));
  },
  partPayment: async ({ page }, use) => {
    await use(new PartPaymentPage(page));
  },
  topUp: async ({ page }, use) => {
    await use(new TopUpPage(page));
  },
  renewLoan: async ({ page }, use) => {
    await use(new RenewLoanPage(page));
  },
  renewPlusTopup: async ({ page }, use) => {
    await use(new RenewPlusTopupPage(page));
  },
  partRelease: async ({ page }, use) => {
    await use(new PartReleasePage(page));
  },
  fullRelease: async ({ page }, use) => {
    await use(new FullReleasePage(page));
  },
  // TC03
  appraiserRequest: async ({ page }, use) => {
    await use(new AppraiserRequestPage(page));
  },
  crlPage: async ({ page }, use) => {
    await use(new CrlPagePage(page));
  },
  kycForm60: async ({ page }, use) => {
    await use(new KycForm60Page(page));
  },
  kycOvd: async ({ page }, use) => {
    await use(new KycOvdPage(page));
  },
  viewKycDetails: async ({ page }, use) => {
    await use(new ViewKycDetailsPage(page));
  },
  reKyc: async ({ page }, use) => {
    await use(new ReKycPage(page));
  },
  industry: async ({ page }, use) => {
    await use(new IndustryPage(page));
  },
  deleteLoan: async ({ page }, use) => {
    await use(new DeleteLoanPage(page));
  },
  incompleteRating: async ({ page }, use) => {
    await use(new IncompleteRatingPage(page));
  },
  partnerLoan: async ({ page }, use) => {
    await use(new PartnerLoanPage(page));
  },
  ficPartner: async ({ page }, use) => {
    await use(new FicPartnerPage(page));
  },
  bankDetails: async ({ page }, use) => {
    await use(new BankDetailsPage(page));
  },
  pownTicket: async ({ page }, use) => {
    await use(new PownTicketPage(page));
  },
  cpv: async ({ page }, use) => {
    await use(new CpvPage(page));
  },
  digio: async ({ page }, use) => {
    await use(new DigioPage(page));
  },
  // TC04
  partReleaseOffline: async ({ page }, use) => {
    await use(new PartReleaseOfflinePage(page));
  },
  fullReleaseOffline: async ({ page }, use) => {
    await use(new FullReleaseOfflinePage(page));
  },
  renewZero: async ({ page }, use) => {
    await use(new RenewZeroPage(page));
  },
  loanView: async ({ page }, use) => {
    await use(new LoanViewPage(page));
  },
  waiver: async ({ page }, use) => {
    await use(new WaiverPage(page));
  },
  manualCharges: async ({ page }, use) => {
    await use(new ManualChargesPage(page));
  },
  customCancel: async ({ page }, use) => {
    await use(new CustomCancelPage(page));
  },
  // TC05
  addPartner: async ({ page }, use) => {
    await use(new AddPartnerPage(page));
  },
  editPartnerBranch: async ({ page }, use) => {
    await use(new EditPartnerBranchPage(page));
  },
  addPartnerBranchUser: async ({ page }, use) => {
    await use(new AddPartnerBranchPage(page));
  },
  internalUser: async ({ page }, use) => {
    await use(new InternalUserPage(page));
  },
  internalUserBranch: async ({ page }, use) => {
    await use(new InternalUserBranchPage(page));
  },
  goldRate: async ({ page }, use) => {
    await use(new GoldRatePage(page));
  },
  addScheme: async ({ page }, use) => {
    await use(new AddSchemePage(page));
  },
  updateRpg: async ({ page }, use) => {
    await use(new UpdateRpgPage(page));
  },
  addLead: async ({ page }, use) => {
    await use(new AddLeadPage(page));
  },
  karat: async ({ page }, use) => {
    await use(new KaratPage(page));
  },
  unapprovalReason: async ({ page }, use) => {
    await use(new UnapprovalReasonPage(page));
  },
  waiverType: async ({ page }, use) => {
    await use(new WaiverTypePage(page));
  },
  loanDefects: async ({ page }, use) => {
    await use(new LoanDefectsPage(page));
  },
  // TC06
  deposit: async ({ page }, use) => {
    await use(new DepositPage(page));
  },
  btLoan: async ({ page }, use) => {
    await use(new BtLoanPage(page));
  },
  zahReview: async ({ page }, use) => {
    await use(new ZahReviewPage(page));
  },
  btRejectedLoan: async ({ page }, use) => {
    await use(new BtRejectedLoanPage(page));
  },
});

export { expect } from "@playwright/test";
