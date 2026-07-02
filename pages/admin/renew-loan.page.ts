import { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import customerData from "../../testdata/admin/documents/customerData.json";
import { AssignPacketPage } from "./assign-packet.page";
import { documentPath } from "@config/urls";
import { existsSync } from "fs";
import { resolve } from "path";
import { AdminLoginPage } from "./login.page";

/**
 * Port of Java: PO13_RenewLoan (locators) + Flow15_RenewLoan.renew() (actions)
 *
 * The active (non-commented) Flow15_RenewLoan.renew() method:
 *   1. Logs in as appraiser, sets branch to Show All (OMITTED — loginWithAppraiser omitted).
 *   2. Navigates to Loan Management → Applied Loan, filters by firstName.
 *   3. Clicks Upload Documents, refreshes, uploads 3 (+ optional 6th) file inputs.
 *   4. Fills CKYC, saves, selects leadConverter, clicks Done.
 *   5. Switches to partner, navigates Applied Loan, clicks Partner Approval, next×7, checkboxes, Approved, Submit.
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator (same XPath as other TC02 flows).
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `fieldCkyc` inline re-declaration from Flow05_AssignPacket.
 *   - `btnYesAssign` re-declares PO05_AssignPacket.loc_btnYes (same XPath).
 *   - `btnDoneAssign` re-declares PO05_AssignPacket.loc_btnDone (same XPath).
 *   - `partnerApproval` re-declares PO07_OpsTeamLoanApproval.loc_partnerApproval (same XPath).
 *   - `checkClick` re-declares PO07_OpsTeamLoanApproval.loc_checkClick (same XPath).
 *   - `checkClick1` re-declares PO07_OpsTeamLoanApproval.loc_checkClick1 (same XPath).
 *   - `btnSubmitOps` re-declares PO07_OpsTeamLoanApproval.loc_btnSubmit (same XPath).
 *   - `btnNextLoop` re-declares PO04_NewGoldLoan.loc_btnNext (same XPath) — used in clickNextSafely.
 *
 * Omitted loginWith* calls:
 *   - Flow15_RenewLoan.renew() called Flow_LoginLogout.loginWithAppraiser() — OMITTED.
 *     Role = appraiser; caller must inject via loginAs('appraiser').
 *   - Flow15_RenewLoan.renew() called Flow_LoginLogout.loginWithPartner() — OMITTED.
 *     Role = partner; caller must inject via loginAs('partner') at the appropriate step.
 *
 * File upload note:
 *   - uploadFileToInput(): uses setInputFiles(); caller may supply documentPath.
 *     Defaults to skipping when no path provided (consistent with other TC02 POs).
 */
export class RenewLoanPage extends AdminBasePage {
  private assignPacketPage: AssignPacketPage;
  private adminLoginPage: AdminLoginPage;
  constructor(page: Page) {
    super(page);

    this.assignPacketPage = new AssignPacketPage(page);
    this.adminLoginPage = new AdminLoginPage(page);
  }

  // ── Locators (from PO13_RenewLoan) ────────────────────────────────────────

  private readonly btnUploadDocuments = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
  private readonly btnProceed = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  private readonly btnRenewLoan = () =>
    this.page.locator("xpath=//button[contains(.,'Renew Loan')]");
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly upfrontID = () =>
    this.page.locator("xpath=//input[@formcontrolname='upfrontTransactionId']");
  private readonly loanDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  private readonly renewButton = () =>
    this.page.locator(
      "xpath=//button[@role='menuitem' and normalize-space()='Renew Loan']",
    );
  private readonly btnNext = () =>
    this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  // PO10_QuickPayment.loc_kebabMenu
  private readonly kebabMenu = () =>
    this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  private readonly btnYesAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
  // PO05_AssignPacket.loc_btnDone
  private readonly btnDoneAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO07_OpsTeamLoanApproval.loc_partnerApproval
  private readonly partnerApproval = () =>
    this.page.locator("xpath=//button[contains(.,'PARTNER APPROVAL')]");
  // PO07_OpsTeamLoanApproval.loc_checkClick
  private readonly checkClick = () =>
    this.page.locator(
      "xpath=//img[contains(@name,'incorrectApplicationFormForOperatinalTeam')]",
    );
  // PO07_OpsTeamLoanApproval.loc_checkClick1
  private readonly checkClick1 = () =>
    this.page.locator(
      "xpath=//img[contains(@name,'incorrectGoldValuationForOperatinalTeam')]",
    );
  // PO07_OpsTeamLoanApproval.loc_btnSubmit
  private readonly btnSubmitOps = () =>
    this.page.locator("xpath=//button[span[normalize-space()='Submit']]");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  // Inline branch dropdown
  private readonly branchDropdown = () =>
    this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () =>
    this.page.locator("xpath=//button[@type='submit']");
  // PO05_AssignPacket.loc_fieldCkyc (inline in Java)
  private readonly appraisalRequest = () =>
    this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
  private readonly selectAppraiser = () =>
    this.page.locator("xpath=//select[@formcontrolname='appraiserId']");
  private readonly textField = () =>
    this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly customerManagementBtn = () =>
    this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
  private readonly fieldCkyc = () =>
    this.page.locator("xpath=//input[@formcontrolname='ckycNumber']");
  // PO05_AssignPacket.loc_btnYes

  private readonly kebabMenu1 = () =>
    this.page.locator(
      "xpath=(//mat-row[.//*[contains(text(),'New Loan')]]//mat-icon[normalize-space()='more_vert'])[1]",
    );
  private readonly kebabMenu2 = () =>
    this.page.locator(
      "xpath=(//mat-row[.//*[contains(text(),'Renew Loan')]]//mat-icon[normalize-space()='more_vert'])[1]",
    );
  private readonly applyLoan = () =>
    this.page.locator(
      "xpath=//button[contains(@class,'mat-menu-item') and normalize-space(text())='Apply Loan']",
    );
  private readonly btnOk = () =>
    this.page.locator("xpath=//button[@type='submit']");
  // PO04_NewGoldLoan.loc_btnNext (re-declared for clickNextSafely)
  private readonly btnNextLoop = () =>
    this.page.locator("xpath=//button[span[normalize-space()='Next']]");
  private readonly customerUniqID = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
  private readonly transactionID = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='securedBankTransactionId']",
    );
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO09_PartnerLoanApproval.loc_selPaymentType
  private readonly selPaymentType = () =>
    this.page.locator("xpath=//select[@formcontrolname='bankTransferType']");
  // PO09_PartnerLoanApproval.loc_btnDone
  private readonly btnDonePartner = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO09_PartnerLoanApproval.loc_btnYes
  private readonly btnYesPartner = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
  private readonly selPurpose = () =>
    this.page.locator("xpath=//select[@formcontrolname='loanPurpose']");
  private readonly netBanking = () =>
    this.page.locator("xpath=//img[@alt='netbanking']");
  private readonly btnConfirm = () =>
    this.page.locator(
      "xpath=//button[contains(@class,'mat')][.//span[normalize-space()='Confirm']]",
    );
  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Port of Flow05_AssignPacket.generateRandomCKYC() — inline. */
  generateRandomCKYC(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 14; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  randomTransactionId(length: number): string {
    const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let sb = "";
    for (let i = 0; i < length; i++) {
      sb += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
    }
    return sb;
  }
  async clickNextSafely(times: number = 1) {
    for (let i = 0; i < times; i++) {
      // Re-locate each iteration so a page re-render doesn't cause stale element errors.
      const nextBtn = this.page
        .locator("//button[span[normalize-space()='Next']]")
        .first();

      await nextBtn.waitFor({ state: "visible", timeout: 30000 });

      console.log(`Clicking Next button: ${i + 1}`);

      try {
        await nextBtn.scrollIntoViewIfNeeded();
      } catch {
        // Element may have been replaced by Angular re-render; relocate and proceed.
      }

      await this.page
        .locator("//button[span[normalize-space()='Next']]")
        .first()
        .click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(1000);
    }
  }
  // ── Actions (from Flow15_RenewLoan.renew — active section) ───────────────

  /**
   * Port of Java Flow15_RenewLoan.renew() — active (non-commented) section.
   *
   * NOTE: loginWithAppraiser() and loginWithPartner() are OMITTED.
   * The caller must:
   *   1. loginAs('appraiser') before calling renew().
   *   2. The method internally navigates to Applied Loan as appraiser, uploads docs,
   *      fills CKYC, saves, then switches to partner (caller must loginAs('partner')
   *      before the partner-approval section — this method calls partnerRenewApproval()
   *      which the spec wires with an explicit loginAs call).
   *
   * This method covers the appraiser portion only (upload docs → save → done).
   * Call partnerRenewApproval() (as partner) for the partner approval step.
   *
   * File upload: documentPath param optional — skip when not provided.
   */
  async renew(documentPath?: string): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.waitForLoaderToDisappear();
    //await this.renewOnlinePay();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);

    // Navigate to Appraiser Requests and filter by customer ID.
    // await this.customerManagementBtn().click();
    // await this.waitForLoaderToDisappear();
    // await this.appraisalRequest().waitFor({ state: "visible" });
    // await this.appraisalRequest().click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(5000);
    // await this.textField().fill(customerData.customerId.trim());
    // console.log(customerData.customerId);
    // await this.page.waitForTimeout(5000);

    // // Click the kebab button whose menu contains "Renew Loan".
    // // The table uses mat-row/mat-cell (ARIA grid), not tr/td. Only "Processing" rows have a kebab.
    // {
    //   const allKebabs = this.page.locator(
    //     "xpath=//button[contains(@class,'mat-menu-trigger')]",
    //   );
    //   const kebabCount = await allKebabs.count();
    //   let renewClicked = false;
    //   for (let k = 0; k < kebabCount; k++) {
    //     const kebab = allKebabs.nth(k);
    //     if (!(await kebab.isVisible().catch(() => false))) continue;
    //     await kebab.scrollIntoViewIfNeeded();
    //     await kebab.click();
    //     await this.page.waitForTimeout(800);
    //     const menuItem = this.page.getByRole("menuitem", { name: "Renew Loan" });
    //     if ((await menuItem.count()) > 0 && (await menuItem.isVisible().catch(() => false))) {
    //       await menuItem.click();
    //       renewClicked = true;
    //       break;
    //     }
    //     await this.page.keyboard.press("Escape");
    //     await this.page.waitForTimeout(400);
    //   }
    //   if (!renewClicked) {
    //     throw new Error("No kebab with 'Renew Loan' found - loan may need to be in Processing state");
    //   }
    // }

    // await this.page.waitForTimeout(2000);
    // await this.btnOk().click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(3000);

    // // The renew form opens on "Bank Details" (pre-filled tabs skip forward).
    // // Click "Final Interest Calculator" tab directly to run calculation first.
    // const finalInterestTab = this.page.getByRole("tab", { name: "Final Interest Calculator" });
    // await finalInterestTab.waitFor({ state: "visible", timeout: 15000 });
    // await finalInterestTab.click();
    // await this.page.waitForTimeout(2000);

    // const calculateBtn = this.page.locator(
    //   "xpath=//button[.//span[normalize-space(text())='Calculate']]",
    // );
    // await calculateBtn.waitFor({ state: "visible", timeout: 30000 });
    // console.log("Calculate visible:", await calculateBtn.isVisible());
    // await calculateBtn.scrollIntoViewIfNeeded();
    // try {
    //   await calculateBtn.click({ timeout: 10000 });
    // } catch {
    //   await calculateBtn.click({ force: true });
    // }
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(2000);

    // // Navigate to Bank Details tab and handle upload.
    // const bankDetailsTab = this.page.getByRole("tab", { name: "Bank Details" });
    // await bankDetailsTab.click();
    // await this.page.waitForTimeout(2000);

    // const upfrontReceiptLabel = this.page.locator(
    //   "xpath=//*[contains(text(),'Upload Upfront Receipt')]",
    // );
    // if (await upfrontReceiptLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
    //   console.log("Upload Upfront Receipt step - uploading file");
    //   const pdfPath = resolve(process.cwd(), "testdata/admin/singnature-sample.pdf");
    //   const fileInputs = this.page.locator("xpath=//input[@type='file']");
    //   const fileCount = await fileInputs.count();
    //   if (fileCount > 0) {
    //     const lastInput = fileInputs.nth(fileCount - 1);
    //     await lastInput.evaluate((el) => { (el as HTMLInputElement).style.display = "block"; });
    //     await lastInput.setInputFiles(pdfPath);
    //     console.log("Upfront Receipt uploaded: " + pdfPath);
    //     await this.page.waitForTimeout(1500);
    //   }
    //   const txnIdInput = this.page.locator(
    //     "xpath=//input[@placeholder='Upfront Transaction Id']",
    //   );
    //   if (await txnIdInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    //     const existing = await txnIdInput.inputValue();
    //     if (!existing) {
    //       await txnIdInput.fill("UPFR" + String(Date.now()).slice(-8));
    //     }
    //   }
    //   await this.btnNext().click();
    //   await this.waitForLoaderToDisappear();
    //   await this.page.waitForTimeout(2000);
    // }

    // await this.page.waitForTimeout(3000);
    // // "Loan Status Approval" may or may not have a Next button. Only click if visible.
    // const postBankNext = this.page.locator("//button[span[normalize-space()='Next']]").first();
    // if (await postBankNext.isVisible({ timeout: 5000 }).catch(() => false)) {
    //   await postBankNext.click();
    //   await this.waitForLoaderToDisappear();
    // }
    await this.page.waitForTimeout(3000);
    const loanMgmt = this.loanManagement();
    await loanMgmt.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.waitFor({ state: "visible" });
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID().fill(customerData.customerId.trim());
    console.log(customerData.customerId);

    await this.page.waitForTimeout(1000);
    await this.filterbtn().click();
    await this.page.waitForTimeout(5000);
    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    await this.validateUploadDocumnets();
    await this.page.waitForTimeout(5000);
    const saveBtn = this.page.locator(
      "xpath=//button[normalize-space()='Save']",
    );
    await saveBtn.waitFor({ state: "attached", timeout: 30000 });
    await this.page.waitForTimeout(1000);
    await this.jsClick(saveBtn);
    await this.page.waitForTimeout(2000);
    await this.waitForLoaderToDisappear();

    // // Yes
    await this.btnYesAssign().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // // Lead converter dropdown
    const dropdownEle = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );
    await dropdownEle.waitFor({ state: "visible", timeout: 30000 });
    await this.page.waitForTimeout(1000);
    try {
      await dropdownEle.selectOption({ label: "Priyanka Thorat" });
    } catch {
      // option not available — skip
    }
    await this.page.waitForTimeout(1000);
    await this.btnDoneAssign().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    //await this.adminLoginPage.logout();
    await this.page.waitForTimeout(5000);
  }

  async renewOnlinePay(): Promise<void> {
    const data = getLoginData();
    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    const loanMgmt = this.loanManagement();
    await loanMgmt.click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails();

    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.customerUniqID().fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    //await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const kebab = this.kebabMenu();
    await kebab.scrollIntoViewIfNeeded();
    try {
      await this.page.waitForTimeout(5000);
      await kebab.click();
    } catch {
      await this.jsClick(kebab);
    }
    await this.page.waitForTimeout(5000);
    await this.btnRenewLoan().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const renewLoan = this.page.getByText("Renew Loan", { exact: true });

    console.log("Visible:", await renewLoan.isVisible());

    await renewLoan.highlight();

    await renewLoan.click();
    await this.page.waitForTimeout(5000);
    await this.page.getByText("Renewal", { exact: true }).click();
    await this.page.waitForTimeout(2000);

    const checkbox = this.page.locator(
      "xpath=//td[text()='[ALL] SK_RBL_06']/preceding-sibling::td//input[@type='checkbox']",
    );

    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(2000);
    await this.selPurpose().selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
    await this.btnProceed().click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.selPayment().selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking().click();
    await this.waitForLoaderToDisappear();
    await expect(this.btnConfirm()).toBeVisible();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
    await this.btnYesAssign().click();
    await this.page.waitForTimeout(5000);
    // Switch into Razorpay iframe
    const iframeEl = this.page.locator(
      "xpath=//iframe[@class='razorpay-checkout-frame']",
    );
    await iframeEl.waitFor({ state: "attached" });
    const frame =
      this.page.frame({ url: /razorpay/ }) ??
      this.page.frames().find((f) => f.url().includes("razorpay"));
    if (frame) {
      await frame.waitForTimeout(5000);
      await frame.fill(
        "xpath=//input[@placeholder='Search for Banks']",
        "State Bank of India",
      );
      await frame.waitForTimeout(5000);
      await frame.click("xpath=(//span[contains(.,'State Bank of India')])[1]");
      const popupPromise = this.page.context().waitForEvent("page");
      await frame.click("xpath=//button[contains(.,'Continue & Pay')]");
      const popup = await popupPromise;
      await popup.waitForLoadState();

      const successBtn = popup.getByRole("button", { name: "Success" });

      await successBtn.waitFor({ state: "visible", timeout: 5000 });

      await successBtn.click();
    } else {
      // fallback: use frameLocator
      const razorFrame = this.page.frameLocator(
        "xpath=//iframe[@class='razorpay-checkout-frame']",
      );
      await this.page.waitForTimeout(5000);
      await razorFrame
        .locator("xpath=//input[@placeholder='Search for Banks']")
        .fill("State Bank of India");
      await this.page.waitForTimeout(5000);
      await razorFrame
        .locator("xpath=(//span[contains(.,'State Bank of India')])[1]")
        .click();
      const popupPromise = this.page.context().waitForEvent("page");
      await razorFrame
        .locator("xpath=//button[contains(.,'Continue & Pay')]")
        .click();
      const popup = await popupPromise;
      await popup.waitForLoadState();

      const successBtn = popup.getByRole("button", { name: "Success" });

      await successBtn.waitFor({ state: "visible", timeout: 5000 });

      await successBtn.click();
    }
    await this.page.waitForTimeout(2000);
  }
  async validateUploadDocumnets(docPath?: string): Promise<void> {
    // Auto-resolve document path from environment if not provided, then resolve to absolute
    const envPath = docPath || documentPath("DOCUMENT");
    let resolvedDocPath: string | undefined;

    if (envPath) {
      const cwd = process.cwd();
      console.log(`Current working directory: ${cwd}`);
      console.log(`Environment path: ${envPath}`);

      resolvedDocPath =
        envPath.startsWith("/") || envPath.match(/^[A-Z]:/)
          ? envPath
          : resolve(cwd, envPath);

      console.log(`Resolved document path: ${resolvedDocPath}`);
      console.log(`File exists: ${existsSync(resolvedDocPath)}`);

      // Fallback: try resolving from __dirname
      if (!existsSync(resolvedDocPath)) {
        const fallbackPath = resolve(__dirname, "../../..", envPath);
        console.log(`Trying fallback path: ${fallbackPath}`);
        console.log(`Fallback file exists: ${existsSync(fallbackPath)}`);
        if (existsSync(fallbackPath)) {
          resolvedDocPath = fallbackPath;
          console.log(`Using fallback path: ${resolvedDocPath}`);
        }
      }
    }
    if (resolvedDocPath) {
      try {
        const fileInputs = this.page.locator("xpath=//input[@type='file']");
        const inputCount = await fileInputs.count();
        console.log(`Found ${inputCount} file input(s) on the page`);

        // Upload to visible/accessible file inputs (up to 4 documents)
        let uploadedCount = 0;
        for (let i = 0; i < inputCount && uploadedCount < 4; i++) {
          try {
            const fileInput = fileInputs.nth(i);

            // Check if input is visible or can be accessed
            try {
              await fileInput.waitFor({ state: "attached", timeout: 2000 });
              console.log(
                `↗ Uploading Document ${uploadedCount + 1} to input ${i}: ${resolvedDocPath}`,
              );
              await fileInput.setInputFiles(resolvedDocPath);
              console.log(
                `✓ Document ${uploadedCount + 1} uploaded successfully to input ${i}`,
              );
              uploadedCount++;
              await this.page.waitForTimeout(1000);
            } catch (err: any) {
              console.log(
                `⊘ Input ${i} not accessible (hidden/detached): ${err.message}`,
              );
            }
          } catch (err: any) {
            console.warn(`⚠ Error with input ${i}: ${err.message}`);
          }
        }

        console.log(
          `Completed uploading ${uploadedCount} document(s) out of 4 requested`,
        );
      } catch (err: any) {
        console.warn(`⚠ Document upload error: ${err.message}`);
      }
    } else {
      console.log(
        "⊘ Document upload skipped (no file path provided in env or parameter)",
      );
    }
    // Upload to "Consumption Supporting Loan Documents" — 9th file input (index 8).
    if (resolvedDocPath && existsSync(resolvedDocPath)) {
      const fileInputsAll = this.page.locator("xpath=//input[@type='file']");
      const totalInputs = await fileInputsAll.count();
      if (totalInputs > 8) {
        const consumptionInput = fileInputsAll.nth(8);
        await consumptionInput.evaluate((el) => {
          (el as HTMLInputElement).style.display = "block";
        });
        await consumptionInput.setInputFiles(resolvedDocPath);
        console.log(
          `✓ Consumption Supporting Document uploaded to nth(8): ${resolvedDocPath}`,
        );
        await this.page.waitForTimeout(2000);
      } else {
        console.warn(
          `⚠ Consumption Supporting skipped — only ${totalInputs} inputs found (need >8)`,
        );
      }
    } else {
      console.log(
        resolvedDocPath
          ? `⊘ Consumption Supporting upload skipped (file not found: ${resolvedDocPath})`
          : "⊘ Consumption Supporting upload skipped (no file path provided)",
      );
    }
  }

  /**
   * Port of the partner-approval section inside Flow15_RenewLoan.renew().
   *
   * NOTE: loginWithPartner() is OMITTED. Caller must loginAs('partner') before calling this.
   *
   * Navigates to Applied Loan as partner, clicks Partner Approval, Next×7,
   * checks boxes, selects Approved, submits.
   */
  async partnerRenewApproval(): Promise<void> {
    const data = getLoginData();

    await this.expandSidebar();
    await this.page.waitForTimeout(5000);
    const loanMgmt = this.loanManagement();
    await loanMgmt.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan2 = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan2.waitFor({ state: "visible", timeout: 30000 });
    await appliedLoan2.click();
    await this.waitForLoaderToDisappear();
    await this.customerUniqID().fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    await this.page.waitForTimeout(1000);
    await this.filterbtn().click();
    await this.page.waitForTimeout(2000);

    await this.partnerApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.clickNextSafely(7);
    await this.page.waitForTimeout(2000);

    await this.checkClick().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.checkClick1().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const statusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForPartner']",
    );
    await statusDropdown.selectOption({ label: "Approved" });
    await this.page.waitForTimeout(1000);

    await this.btnSubmitOps().click();
    await this.waitForLoaderToDisappear();
  }
}
