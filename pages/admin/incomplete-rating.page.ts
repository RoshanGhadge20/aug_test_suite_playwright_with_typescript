import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { AssignPacketPage } from "./assign-packet.page";
import { OpsApprovalPage } from "./ops-approval.page";
import { existsSync } from "fs";

/**
 * Port of Java: PO22_IncompleteInRating (locators) + Flow27_IncompleteInRatingFunctionality (actions)
 *
 * Role split:
 *   - validatePackets() has multiple role switches:
 *     1. loginWithAppraiser: navigate applied loan and upload documents.
 *     2. loginWithPartner (first time): set status to "Incomplete".
 *     3. loginWithOPS: approve, set status to "Approved".
 *     4. loginWithPartner (second time): approve, disburse.
 *   - SPLIT into segments matching each role boundary. Spec injects loginAs() before each.
 *
 * Cross-page locator notes:
 *   - `profile`, `arrow`, `branchDropdown`, `loanManagement`, `appliedLoan`,
 *     `firstNameFilter`, `filterbtn`, `partnerApproval`, `checkClick`, `checkClick1`,
 *     `btnSubmit`, `btnOPSTeam`, `btnNext`, `btnDisbursement`, `transactionID`, etc.
 *     re-declared from various PO files.
 *
 * File upload TODOs:
 *   - 3 file inputs (//input[@type='file'])[1..3] — Java used sendKeys("C:\\...").
 *     Playwright: setInputFiles() — guarded optional params.
 *   All paths must be supplied via env vars for live execution.
 */
export class IncompleteRatingPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO22_IncompleteInRating) ───────────────────────────────

  private readonly loc_InputField = () =>
    this.page.locator("xpath=//textarea[@formcontrolname='commentByPartner']");
  private readonly loc_SignDocuments = () =>
    this.page.locator("xpath=//button[@ng-reflect-disabled='false']");
  private readonly loc_SignDocument = () =>
    this.page.locator("xpath=//button[@class='btn btn-sm w-100 mt-3']");

  // Cross-page re-declarations
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  private readonly branchDropdown = () =>
    this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
  private readonly loanManagement = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  private readonly appliedLoan = () =>
    this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
  private readonly firstNameFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly filterbtn = () =>
    this.page.locator("xpath=//button[@type='submit']");
  private readonly partnerApproval = () =>
    this.page.locator("xpath=//button[normalize-space()='Partner Approval']");
  private readonly checkClick = () =>
    this.page.locator("xpath=//mat-checkbox[1]");
  private readonly checkClick1 = () =>
    this.page.locator("xpath=//mat-checkbox[2]");
  private readonly loanStatusForPartner = () =>
    this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForPartner']",
    );
  private readonly btnSubmit = () =>
    this.page.locator("xpath=//button[normalize-space()='Submit']");
  private readonly btnNext = () =>
    this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  private readonly loanStatusForOps = () =>
    this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForOperatinalTeam']",
    );
  // Re-declared from ops-approval.page.ts's txtArea/txtarea (same formcontrolname) — the
  // comment box required when the OPS team sets a loan's status to something other than
  // Approved (mirrors loc_InputField/commentByPartner on the partner side).
  private readonly commentByOperatinalTeam = () =>
    this.page.locator(
      "xpath=//textarea[@formcontrolname='commentByOperatinalTeam']",
    );
  // Confirmed live: the Actions-column button's rendered/accessible text is all-caps
  // "UPLOAD DOCUMENTS" (matches assign-packet.page.ts's already-working locator for the same
  // button) — the previous title-case 'Upload Documents' locator is a case-sensitive XPath
  // text match that can never match, causing a silent 10s timeout on every use of this method.
  private readonly btnUploadDocuments = () =>
    this.page.locator(
      "xpath=(//button[normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
  private readonly selLead = () =>
    this.page.locator("xpath=//select[@formcontrolname='leadConverterId']");
  private readonly btnDone = () =>
    this.page.locator("xpath=//button[normalize-space()='Done']");
  private readonly btnSave = () =>
    this.page.locator("xpath=//button[normalize-space()='Save']");
  private readonly btnDisbursement = () =>
    this.page.locator("xpath=//button[normalize-space()='Disbursement']");
  private readonly transactionID = () =>
    this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  private readonly selPaymentType = () =>
    this.page.locator("xpath=//select[@formcontrolname='paymentType']");
  private readonly btnDoneDisbursement = () =>
    this.page.locator("xpath=//button[normalize-space()='Done']");
  private readonly btnYesDisbursement = () =>
    this.page.locator("xpath=//button[normalize-space()='Yes']");
  private readonly btnSubmitDisburse = () =>
    this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow27_IncompleteInRatingFunctionality.validatePackets() — appraiser segment.
   * Caller must first loginAs('appraiser').
   * File uploads are guarded optional params.
   */
  async validatePackets_appraiserPart(documentPath?: string): Promise<void> {
    const data = getLoginData();

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — confirmed live (renew-zero.page.ts,
    // loan-defects.page.ts) that switching this account's branch scope gets the backend to
    // reject the session outright (403/401, forced redirect to /auth/login). Same fix applied
    // below in the ops part (validatePackets_opsPart) — the OPS role has been confirmed
    // affected too.
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    // noWaitAfter: this button is type="submit" inside a <form> — Playwright detects a real
    // navigation attempt from the native submit and hangs waiting for it to "finish" even
    // though Angular's (ngSubmit) handler already intercepted it client-side (same fix as
    // renew-zero.page.ts / manual-charges.page.ts / loan-view.page.ts / custom-cancel.page.ts
    // / waiver.page.ts / ops-approval.page.ts).
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // This "Upload Documents" tab is the same shared packet-image-upload dialog used by
    // assign-packet.page.ts (confirmed live: identical field set and route). The original port
    // here only filled 3 raw-positional file inputs and skipped Aadhar/Pan/Cash Receipt/Cash
    // Declaration/Consumption Supporting entirely — all of which are required fields — so Save
    // could never actually succeed (confirmed live: "Field Required"/"Required field" alerts
    // remained after Save). Reuses assign-packet.page.ts's already-working upload methods
    // (formcontrolname-based waits + Pawn Ticket print/re-upload + Cash Receipt/Declaration
    // download/re-upload) instead of re-deriving them here.
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

      // Pawn Ticket needs the print-then-re-upload flow (a "Print" action generates the
      // system-side document), not a direct attach — see assign-packet.page.ts's
      // downloadAndUploadPawnCopy() doc comment for the confirmed 401 this avoids.
      const assignPacketHelper = new AssignPacketPage(this.page);
      await assignPacketHelper.downloadAndUploadPawnCopy();

      await uploadByControl(
        "schemeConfirmationCopyImageName",
        "Scheme Confirmation",
      );
      await uploadByControl("form97Name", "Form97");
      await uploadByControl("identityProofName", "Aadhar Card");
      await uploadByControl("panImageName", "Pan Card");

      // Consumption Supporting Loan Documents — a hidden native file input (class="d-none")
      // sitting beside an upload-icon button, not tied to a reactive-form formcontrolname. The
      // icon is nested INSIDE the button, and the input is a sibling of the BUTTON, not of the
      // icon — following-sibling:: from the <i> itself matches nothing. Go up to the button
      // first, then to its following sibling input.
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
    await this.btnSave()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.btnSave().click();

    // Save triggers a "Confirmation" modal ("Is the OSV done for the customer?", Yes/No
    // buttons) — confirmed live via error-context.md page snapshot after this exact step
    // timed out. The leadConverterId dropdown never renders until it's dismissed. Reuses
    // btnYesDisbursement()'s locator (//button[normalize-space()='Yes']) since this is a
    // plain <button>, not the <span>-based Yes used in assign-packet.page.ts.
    try {
      await this.btnYesDisbursement().waitFor({
        state: "visible",
        timeout: 15000,
      });
      await this.btnYesDisbursement().click();
    } catch {
      // No confirmation modal this time — proceed.
    }

    // Not waitForLoaderToDisappear() here — its unconditional page.waitForLoadState('networkidle')
    // reliably times out at 30s after this heavy upload sequence (confirmed live, reproduced twice
    // in a row): background network chatter never fully quiets down. Wait for the spinner only,
    // then the actual next-state signal we need (the lead-converter dropdown) with a generous
    // timeout — same "wait for the UI you care about, not networkidle" pattern used elsewhere in
    // this suite (see tests/customer/login.spec.ts, fixtures/admin.fixture.ts).
    await this.page
      .locator("//div[contains(@class,'spinner')]")
      .waitFor({ state: "hidden", timeout: 30000 })
      .catch(() => {});

    await this.selLead().waitFor({ state: "visible", timeout: 30000 });
    await this.page.waitForTimeout(5000);
    await this.selLead().selectOption({ label: "Priyanka Thorat" });
    await this.page.waitForTimeout(2000);
    await this.btnDone().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of partner-first segment (sets status to Incomplete).
   * Caller must first loginAs('partner').
   */
  async validatePackets_partnerIncomplete(): Promise<void> {
    const data = getLoginData();

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.partnerApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.clickNextMultipleTimes(7);
    await this.page.waitForTimeout(5000);
    await this.checkClick().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.checkClick1().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanStatusForPartner().selectOption({ label: "Incomplete" });
    await this.page.waitForTimeout(2000);
    await this.loc_InputField().fill("Incomplete Documents");
    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
  }
  async validatePackets_opsPart(): Promise<void> {
    const data = getLoginData();

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();
    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await new OpsApprovalPage(this.page).clickFirstUnlockedOpsTeamRating();
    await this.waitForLoaderToDisappear();
    await this.btnNext()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.page.waitForTimeout(2000);
    for (let i = 0; i < 7; i++) {
      await this.btnNext()
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await this.page.waitForTimeout(500);
      await this.btnNext().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(500);
    }

    await this.loanStatusForOps().selectOption({ label: "Approved" });
    await this.page.waitForTimeout(2000);
    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
  }

  async validatePackets_opsIncomplete(): Promise<void> {
    const data = getLoginData();

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await new OpsApprovalPage(this.page).clickFirstUnlockedOpsTeamRating();
    await this.waitForLoaderToDisappear();

    await this.btnNext()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.page.waitForTimeout(2000);
    // Click Next 7 times per Java loop
    for (let i = 0; i < 7; i++) {
      await this.btnNext()
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await this.page.waitForTimeout(500);
      await this.btnNext().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(500);
    }

    await this.loanStatusForOps().selectOption({ label: "Incomplete" });
    await this.page.waitForTimeout(2000);
    await this.commentByOperatinalTeam().fill("Incomplete Documents");
    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
  }

  async validatePackets_partnerApproveDisburse(): Promise<void> {
    const data = getLoginData();

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.partnerApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.clickNextMultipleTimes(7);
    await this.page.waitForTimeout(5000);
    await this.loanStatusForPartner().selectOption({ label: "Approved" });
    await this.page.waitForTimeout(2000);
    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    // Disbursement
    await this.btnDisbursement().click();
    await this.waitForLoaderToDisappear();
    await this.transactionID().fill(this.randomTransactionId(12));
    await this.btnSubmitDisburse()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.selPaymentType().selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(2000);
    await this.btnDoneDisbursement().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnYesDisbursement().click();
    await this.waitForLoaderToDisappear();
  }
  async inspectOpsStatusOptions(): Promise<{
    options: string[];
    hasCommentBox: boolean;
  }> {
    const data = getLoginData();

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await new OpsApprovalPage(this.page).clickFirstUnlockedOpsTeamRating();
    await this.waitForLoaderToDisappear();

    await this.btnNext()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.page.waitForTimeout(2000);
    for (let i = 0; i < 7; i++) {
      await this.btnNext()
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await this.page.waitForTimeout(500);
      await this.btnNext().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(500);
    }

    const options = await this.loanStatusForOps()
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

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await new OpsApprovalPage(this.page).clickFirstUnlockedOpsTeamRating();
    await this.waitForLoaderToDisappear();

    await this.btnNext()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.page.waitForTimeout(2000);
    for (let i = 0; i < 7; i++) {
      await this.btnNext()
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await this.page.waitForTimeout(500);
      await this.btnNext().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(500);
    }

    const statusDropdown = this.loanStatusForOps();
    const optionLabels = (
      await statusDropdown.locator("option").allTextContents()
    )
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    const results: { option: string; hasCommentBox: boolean }[] = [];
    for (const option of optionLabels) {
      await statusDropdown.selectOption({ label: option }).catch(() => {});
      await this.page.waitForTimeout(1000);
      const hasCommentBox = (await this.commentByOperatinalTeam().count()) > 0;
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
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.partnerApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.clickNextMultipleTimes(7);
    await this.page.waitForTimeout(5000);

    const statusDropdown = this.loanStatusForPartner();
    const optionLabels = (
      await statusDropdown.locator("option").allTextContents()
    )
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    const results: { option: string; hasCommentBox: boolean }[] = [];
    for (const option of optionLabels) {
      await statusDropdown.selectOption({ label: option }).catch(() => {});
      await this.page.waitForTimeout(1000);
      const hasCommentBox = (await this.loc_InputField().count()) > 0;
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
