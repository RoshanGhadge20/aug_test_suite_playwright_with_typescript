import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { AssignPacketPage } from "./assign-packet.page";
import { OpsApprovalPage } from "./ops-approval.page";
import { existsSync } from "fs";

export class IncompleteRatingPage extends AdminBasePage {
  private readonly loc_InputField: Locator;
  private readonly loc_SignDocuments: Locator;
  private readonly loc_SignDocument: Locator;

  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly appliedLoan: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly partnerApproval: Locator;
  private readonly checkClick: Locator;
  private readonly checkClick1: Locator;
  private readonly loanStatusForPartner: Locator;
  private readonly btnSubmit: Locator;
  private readonly btnNext: Locator;
  private readonly loanStatusForOps: Locator;
  private readonly commentByOperatinalTeam: Locator;
  private readonly btnUploadDocuments: Locator;
  private readonly selLead: Locator;
  private readonly btnDone: Locator;
  private readonly btnSave: Locator;
  private readonly btnDisbursement: Locator;
  private readonly transactionID: Locator;
  private readonly selPaymentType: Locator;
  private readonly btnDoneDisbursement: Locator;
  private readonly btnYesDisbursement: Locator;
  private readonly btnSubmitDisburse: Locator;

  constructor(page: Page) {
    super(page);
    this.loc_InputField = this.page.locator(
      "xpath=//textarea[@formcontrolname='commentByPartner']",
    );
    this.loc_SignDocuments = this.page.locator(
      "xpath=//button[@ng-reflect-disabled='false']",
    );
    this.loc_SignDocument = this.page.locator(
      "xpath=//button[@class='btn btn-sm w-100 mt-3']",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    this.loanManagement = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.partnerApproval = this.page.locator(
      "xpath=//button[normalize-space()='Partner Approval']",
    );
    this.checkClick = this.page.locator("xpath=//mat-checkbox[1]");
    this.checkClick1 = this.page.locator("xpath=//mat-checkbox[2]");
    this.loanStatusForPartner = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForPartner']",
    );
    this.btnSubmit = this.page.locator(
      "xpath=//button[normalize-space()='Submit']",
    );
    this.btnNext = this.page.locator(
      "xpath=//button[span[normalize-space() = 'Next']]",
    );
    this.loanStatusForOps = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForOperatinalTeam']",
    );
    this.commentByOperatinalTeam = this.page.locator(
      "xpath=//textarea[@formcontrolname='commentByOperatinalTeam']",
    );
    this.btnUploadDocuments = this.page.locator(
      "xpath=(//button[normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
    this.selLead = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );
    this.btnDone = this.page.locator(
      "xpath=//button[normalize-space()='Done']",
    );
    this.btnSave = this.page.locator(
      "xpath=//button[normalize-space()='Save']",
    );
    this.btnDisbursement = this.page.locator(
      "xpath=//button[normalize-space()='Disbursement']",
    );
    this.transactionID = this.page.locator(
      "xpath=//input[@formcontrolname='transactionId']",
    );
    this.selPaymentType = this.page.locator(
      "xpath=//select[@formcontrolname='paymentType']",
    );
    this.btnDoneDisbursement = this.page.locator(
      "xpath=//button[normalize-space()='Done']",
    );
    this.btnYesDisbursement = this.page.locator(
      "xpath=//button[normalize-space()='Yes']",
    );
    this.btnSubmitDisburse = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow27_IncompleteInRatingFunctionality.validatePackets() — appraiser segment.
   * Caller must first loginAs('appraiser').
   * File uploads are guarded optional params.
   */
  async validatePackets_appraiserPart(documentPath?: string): Promise<void> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
 
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnUploadDocuments.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

  
    if (documentPath && existsSync(documentPath)) {
      const uploadByControl = async (
        formControlName: string,
        description: string,
      ): Promise<void> => {
        const fileInput = this.page.locator(
          `//input[@formcontrolname='${formControlName}']/following::input[@type='file'][1]`,
        );
        await fileInput.waitFor({ state: "attached", timeout: 30000 });

        const responsePromise = this.page
          .waitForResponse(
            (r) =>
              r.url().includes("/upload-file") &&
              r.request().method() === "POST",
            { timeout: 30000 },
          )
          .catch(() => null);

        await fileInput.setInputFiles(documentPath);

        const response = await responsePromise;
        if (response && !response.ok()) {
          throw new Error(`${description} upload failed: ${response.status()}`);
        }

        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(1000);
      };

      await uploadByControl("loanAgreementImageName", "Loan Agreement");

      const assignPacketHelper = new AssignPacketPage(this.page);
      await assignPacketHelper.downloadAndUploadPawnCopy();

      await uploadByControl(
        "schemeConfirmationCopyImageName",
        "Scheme Confirmation",
      );
      await uploadByControl("form97Name", "Form97");
      await uploadByControl("identityProofName", "Aadhar Card");
      await uploadByControl("panImageName", "Pan Card");

      const consumptionInput = this.page.locator(
        "xpath=//i[@class='fas fa-file-upload']/parent::button/following-sibling::input[@type='file'][1]",
      );
      if (await consumptionInput.count()) {
        await consumptionInput.setInputFiles(documentPath);
        await this.page.waitForTimeout(1000);
      }

      await assignPacketHelper.downloadAndUploadCashReceipt();
      await this.page.waitForTimeout(2000);
      await assignPacketHelper.downloadAndUploadCashDeclaration();
      await this.page.waitForTimeout(2000);
    } else {
      await this.page.waitForTimeout(5000);
    }

    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.btnSave.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.btnSave.click();

    try {
      await this.btnYesDisbursement.waitFor({
        state: "visible",
        timeout: 15000,
      });
      await this.btnYesDisbursement.click();
    } catch {
      // No confirmation modal this time — proceed.
    }

  
    await this.page
      .locator("//div[contains(@class,'spinner')]")
      .waitFor({ state: "hidden", timeout: 30000 })
      .catch(() => {});

    await this.selLead.waitFor({ state: "visible", timeout: 30000 });
    await this.page.waitForTimeout(5000);
    await this.selLead.selectOption({ label: "Priyanka Thorat" });
    await this.page.waitForTimeout(2000);
    await this.btnDone.click();
    await this.waitForLoaderToDisappear();
  }


  async validatePackets_partnerIncomplete(): Promise<void> {
    const data = getLoginData();

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.partnerApproval.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.clickNextMultipleTimes(7);
    await this.page.waitForTimeout(5000);
    await this.checkClick.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.checkClick1.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanStatusForPartner.selectOption({ label: "Incomplete" });
    await this.page.waitForTimeout(2000);
    await this.loc_InputField.fill("Incomplete Documents");
    await this.btnSubmit.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
  }
  async validatePackets_opsPart(): Promise<void> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();
    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await new OpsApprovalPage(this.page).clickFirstUnlockedOpsTeamRating();
    await this.waitForLoaderToDisappear();
    await this.btnNext.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    for (let i = 0; i < 7; i++) {
      await this.btnNext.scrollIntoViewIfNeeded().catch(() => {});
      await this.page.waitForTimeout(500);
      await this.btnNext.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(500);
    }

    await this.loanStatusForOps.selectOption({ label: "Approved" });
    await this.page.waitForTimeout(2000);
    await this.btnSubmit.click();
    await this.waitForLoaderToDisappear();
  }

  async validatePackets_opsIncomplete(): Promise<void> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await new OpsApprovalPage(this.page).clickFirstUnlockedOpsTeamRating();
    await this.waitForLoaderToDisappear();

    await this.btnNext.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    for (let i = 0; i < 7; i++) {
      await this.btnNext.scrollIntoViewIfNeeded().catch(() => {});
      await this.page.waitForTimeout(500);
      await this.btnNext.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(500);
    }

    await this.loanStatusForOps.selectOption({ label: "Incomplete" });
    await this.page.waitForTimeout(2000);
    await this.commentByOperatinalTeam.fill("Incomplete Documents");
    await this.btnSubmit.click();
    await this.waitForLoaderToDisappear();
  }

  async validatePackets_partnerApproveDisburse(): Promise<void> {
    const data = getLoginData();

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.partnerApproval.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.clickNextMultipleTimes(7);
    await this.page.waitForTimeout(5000);
    await this.loanStatusForPartner.selectOption({ label: "Approved" });
    await this.page.waitForTimeout(2000);
    await this.btnSubmit.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    // Disbursement
    await this.btnDisbursement.click();
    await this.waitForLoaderToDisappear();
    await this.transactionID.fill(this.randomTransactionId(12));
    await this.btnSubmitDisburse.scrollIntoViewIfNeeded().catch(() => {});
    await this.selPaymentType.selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(2000);
    await this.btnDoneDisbursement.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnYesDisbursement.click();
    await this.waitForLoaderToDisappear();
  }
  async inspectOpsStatusOptions(): Promise<{
    options: string[];
    hasCommentBox: boolean;
  }> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await new OpsApprovalPage(this.page).clickFirstUnlockedOpsTeamRating();
    await this.waitForLoaderToDisappear();

    await this.btnNext.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    for (let i = 0; i < 7; i++) {
      await this.btnNext.scrollIntoViewIfNeeded().catch(() => {});
      await this.page.waitForTimeout(500);
      await this.btnNext.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(500);
    }

    const options = await this.loanStatusForOps
      .locator("option")
      .allTextContents();
    const hasCommentBox =
      (await this.page
        .locator("xpath=//textarea[@formcontrolname='commentByOperatinalTeam']")
        .count()) > 0;

    const html = await this.page.content();
    require("fs").writeFileSync(
      "C:/Users/Priyanka/AppData/Local/Temp/claude/d--GitHub-augmont-test-suite/5cfb5e05-03c1-4e17-b706-1059ff5360a4/scratchpad/ops-team-rating-page.html",
      html,
    );

    return { options: options.map((o) => o.trim()), hasCommentBox };
  }

  async validateViewFunctionalityForEveryRating_ops(): Promise<
    { option: string; hasCommentBox: boolean }[]
  > {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await new OpsApprovalPage(this.page).clickFirstUnlockedOpsTeamRating();
    await this.waitForLoaderToDisappear();

    await this.btnNext.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    for (let i = 0; i < 7; i++) {
      await this.btnNext.scrollIntoViewIfNeeded().catch(() => {});
      await this.page.waitForTimeout(500);
      await this.btnNext.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(500);
    }

    const statusDropdown = this.loanStatusForOps;
    const optionLabels = (
      await statusDropdown.locator("option").allTextContents()
    )
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    const results: { option: string; hasCommentBox: boolean }[] = [];
    for (const option of optionLabels) {
      await statusDropdown.selectOption({ label: option }).catch(() => {});
      await this.page.waitForTimeout(1000);
      const hasCommentBox = (await this.commentByOperatinalTeam.count()) > 0;
      results.push({ option, hasCommentBox });
    }

    return results;
  }

  async validateViewFunctionalityForEveryRating_partner(): Promise<
    { option: string; hasCommentBox: boolean }[]
  > {
    const data = getLoginData();

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.partnerApproval.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.clickNextMultipleTimes(7);
    await this.page.waitForTimeout(5000);

    const statusDropdown = this.loanStatusForPartner;
    const optionLabels = (
      await statusDropdown.locator("option").allTextContents()
    )
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    const results: { option: string; hasCommentBox: boolean }[] = [];
    for (const option of optionLabels) {
      await statusDropdown.selectOption({ label: option }).catch(() => {});
      await this.page.waitForTimeout(1000);
      const hasCommentBox = (await this.loc_InputField.count()) > 0;
      results.push({ option, hasCommentBox });
    }

    return results;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async clickNextMultipleTimes(numClicks: number): Promise<void> {
    const nextBtn = this.page.locator(
      "xpath=//button[span[normalize-space()='Next']]",
    );
    for (let i = 0; i < numClicks; i++) {
      try {
        await nextBtn.waitFor({ state: "visible", timeout: 10000 });
        await nextBtn.scrollIntoViewIfNeeded().catch(() => {});
        await this.page.waitForTimeout(500);
        await nextBtn.click().catch(async () => {
          await this.jsClick(nextBtn);
        });
        await this.page.waitForTimeout(1000);
      } catch {
        break;
      }
    }
  }

  private randomTransactionId(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++)
      result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
}
