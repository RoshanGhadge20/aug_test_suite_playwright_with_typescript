import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class RenewZeroPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO25_RenewLoanWithZero) ────────────────────────────────

  private readonly btnDone = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  private readonly btnAttach = () =>
    this.page.locator("xpath=//span[normalize-space()='Attach']");
  private readonly btnRenewal = () =>
    this.page.locator(
      "xpath=//span[contains(@class,'kt-menu__link-text') and normalize-space()='Renewal Loans']",
    );
  private readonly btnConfirm = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Confirm']]");
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly Renewal = () =>
    this.page.locator("xpath=//span[contains(.,'Renewal Loans')]");
  private readonly btnUpdate = () =>
    this.page.locator("xpath=(//button[contains(.,'Update')])[1]");
  private readonly btnUpdate1 = () =>
    this.page.locator("xpath=(//span[contains(.,'Update')])[1]");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
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
  // PO10_QuickPayment.loc_LoanDetails
  private readonly loanDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  // PO10_QuickPayment.loc_kebabMenu (renew uses different selector — dynamic re-declaration)
  private readonly renewMenu = () =>
    this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
  private readonly renewButton = () =>
    this.page.locator("xpath=//button[normalize-space()='Renew Loan']");
  // PO10_QuickPayment.loc_btnProceed — scoped to the containing <button>, since a bare
  // span[text()='Proceed'] also matches an unrelated stray span elsewhere on this page.
  private readonly btnProceed = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO11_PartPayment.loc_btnProced
  private readonly btnProced = () =>
    this.page.locator(
      "xpath=(//kt-button[@ng-reflect-value='Proceed']//button[@type='button'])[2]",
    );
  // PO16_FullRelease.loc_jwellaryReleaseApproval
  private readonly jwellaryReleaseApproval = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
  // PO23_PartReleaseOffline offline payment locators
  private readonly inputBankName = () =>
    this.page.locator("xpath=//input[@formcontrolname='bankName']");
  private readonly inputBranchName = () =>
    this.page.locator("xpath=//input[@formcontrolname='branchName']");
  private readonly inputBankTransactionID = () =>
    this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  private readonly btnPODone = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");

  // ── Helper ────────────────────────────────────────────────────────────────

  private generateTransactionId(): string {
    return "TXN-" + Math.random().toString(36).substring(2, 14).toUpperCase();
  }

  /** Port of Flow33_RenewLoanWithCashZero.safeClickLocal() — scroll+click with retry. */
  private async safeClickLocal(
    locator: () => import("@playwright/test").Locator,
  ): Promise<void> {
    const el = locator();
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
    await el.click().catch(async () => {
      await this.jsClick(el);
    });
  }

  // ── Actions (from Flow34_RenewPaymentOffline.validaterenewofflineWithIMPS) ─

  /**
   * Port of Java Flow34_RenewPaymentOffline.validaterenewofflineWithIMPS().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Loan Details, opens Renew Loan (renewal radio),
   * selects checkbox [3], proceeds, selects RTGS, fills offline fields, clicks Done → Proceed.
   */
  async validaterenewofflineWithIMPS(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — confirmed live that switching an
    // appraiser session to "Show All" gets the backend to reject the session outright
    // (403 on the next page load, 401 on unrelated APIs like /api/gold-rate), forcing a
    // redirect to /auth/login. Appraiser stays on its own default branch scope instead.
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();

    const renewalRadio = this.page.locator(
      "xpath=//input[@type='radio' and @value='renewal']",
    );
    const menu = this.renewMenu();
    await menu.waitFor({ state: "visible", timeout: 30000 });
    await menu.click();

    const renewOption = this.renewButton();
    await renewOption.waitFor({ state: "visible", timeout: 30000 });
    await renewOption.click();

    const renewalRadioBtn = this.page.locator(
      "xpath=//input[@type='radio' and @value='renewal']",
    );
    await renewalRadioBtn.waitFor({ state: "visible", timeout: 30000 });
    await renewalRadioBtn.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.jsClick(renewalRadioBtn);
    await this.page.waitForTimeout(5000);

    const checkbox = this.page.locator(
      "xpath=(//label[@class='custom-checkbox']//input[@type='checkbox'])[3]",
    );
    await checkbox.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.selPayment().click();
    await this.selPayment().selectOption({ label: "RTGS" });

    await this.inputBankName().fill("State bank of India");
    await this.page.waitForTimeout(2000);
    await this.inputBranchName().fill("Lower parel");
    await this.page.waitForTimeout(2000);
    await this.inputBankTransactionID().fill(this.generateTransactionId());
    await this.page.waitForTimeout(2000);
    await this.btnPODone().click();
    await this.waitForLoaderToDisappear();
    await this.btnProced().click();
    await this.waitForLoaderToDisappear();
  }

  // ── Actions: renew offline with Cash payment ──────────────────────────────

  /**
   * Cash-payment variant of validaterenewofflineWithIMPS(). Same navigation up to the
   * payment-mode select, but chooses "CASH" instead of RTGS, which opens a "Payment Mode"
   * modal requiring a downloaded+signed Cash Receipt and a Branch Name before Done.
   *
   * NOTE: Caller must loginAs('appraiser') first.
   */
  async validaterenewofflineWithCash(): Promise<string> {
    const data = getLoginData();

    // Suppress window.print for the whole flow — the Cash Receipt download step (and any
    // later acknowledgement screen) calls window.print(), which opens a native print
    // preview that blocks subsequent clicks. Same fix as quick-payment.page.ts's
    // quickPayOffline(); addInitScript keeps the override in place across route changes.
    await this.page.addInitScript(() => {
      (window as any).print = () => {};
    });
    try {
      await this.page.evaluate(() => {
        (window as any).print = () => {};
      });
    } catch (_) {}

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — confirmed live that switching an
    // appraiser session to "Show All" gets the backend to reject the session outright
    // (403 on the next page load, 401 on unrelated APIs like /api/gold-rate), forcing a
    // redirect to /auth/login. Appraiser stays on its own default branch scope instead.
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    // noWaitAfter: this button is type="submit" inside a <form> — Playwright detects a real
    // navigation attempt from the native submit and hangs waiting for it to "finish" even
    // though Angular's (ngSubmit) handler already intercepted it client-side (same fix as
    // full-release-offline.page.ts's initiateFullReleaseOffline()).
    await this.filterbtn().click({ noWaitAfter: true });
    await this.page.waitForTimeout(1000);
    await this.waitForLoaderToDisappear();

    await this.openRenewLoanForEligibleRow(data.firstName);
    const customerId = await this.readCustomerIdFromRenewWizard();

    const renewalRadioBtn = this.page.locator(
      "xpath=//input[@type='radio' and @value='renewal']",
    );
    await renewalRadioBtn.waitFor({ state: "visible", timeout: 30000 });
    await renewalRadioBtn.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.jsClick(renewalRadioBtn);
    await this.page.waitForTimeout(5000);

    const checkbox = this.page.locator(
      "xpath=(//label[@class='custom-checkbox']//input[@type='checkbox'])[3]",
    );
    await checkbox.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);

    // "Loan Purpose" populates once a scheme is checked and is required before Proceed
    // will submit — without selecting it, Proceed just re-renders the same form with a
    // "Field is required" error and the payment-mode select never appears.
    await this.selectFirstAvailableLoanPurpose();

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.selPayment().click();
    await this.selPayment().selectOption({ label: "CASH" });
    await this.page.waitForTimeout(2000);

    await this.uploadCashReceiptAndSelectBranch();

    await this.btnPODone().click();
    await this.waitForLoaderToDisappear();
    // NOTE: btnProced() (IMPS variant, copied from part-payment's kt-button wrapper
    // structure) doesn't match here — this screen's final confirm is the same plain
    // "Proceed" button as btnProceed() used earlier in this method.
    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();

    return customerId;
  }

  /**
   * Reads the "Customer ID" value off the Renew Loan wizard's implicit ARIA table (CSS
   * display:table, no real <table>/<th>/<td> tags — Playwright's role locators see the
   * computed roles even though raw DOM queries wouldn't). Needed to filter the Renewal
   * Loans approval grid down to this specific record later — it can hold 1000+ rows.
   */
  private async readCustomerIdFromRenewWizard(): Promise<string> {
    const headerRow = this.page.getByRole("row").first();
    const headers = await headerRow.getByRole("columnheader").allTextContents();
    const idx = headers.findIndex((h) => h.trim() === "Customer ID");
    if (idx === -1) return "";
    const dataRow = this.page.getByRole("row").nth(1);
    const cells = await dataRow.getByRole("cell").allTextContents();
    return (cells[idx] ?? "").trim();
  }

  /**
   * Fills the "Payment Mode" modal's Cash Receipt + Branch Name fields (CASH mode only).
   * Two-step Cash Receipt UI, same pattern as quick-payment.page.ts's quickPayOffline():
   *   (1) Click the download icon — Angular renders a Cash Acknowledgement and calls
   *       window.print() (suppressed). Capture it as a PDF via CDP's Page.printToPDF
   *       (600ms after the click, to give Angular time to render).
   *   (2) Click "Sign" (revealed after Download) to activate the file input, then upload
   *       the captured PDF via setInputFiles() directly — no file-chooser dialog appears.
   * Falls back to a pre-made signature-sample PDF if the capture fails for any reason.
   */
  private async uploadCashReceiptAndSelectBranch(): Promise<void> {
    const nodePath = require("path");
    const nodeFs = require("fs");
    const cashReceiptPdfPath = nodePath.resolve(
      process.cwd(),
      "testdata",
      "admin",
      "cash-receipt-download.pdf",
    );
    const fallbackPdfPath = nodePath.resolve(
      process.cwd(),
      "testdata",
      "admin",
      "singnature-sample.pdf",
    );
    let uploadPdfPath: string = fallbackPdfPath;

    const downloadImg = this.page.locator("xpath=//img[@alt='Download']");
    if ((await downloadImg.count()) > 0) {
      const cdpSession = await this.page.context().newCDPSession(this.page);

      const dialogHandler = async (dialog: any) => {
        await dialog.dismiss();
      };
      this.page.on("dialog", dialogHandler);

      try {
        await this.page.evaluate(() => {
          (window as any).print = () => {};
        });
      } catch (_) {}

      const pdfPromise = (async () => {
        await this.page.waitForTimeout(600);
        try {
          const pdf = await cdpSession.send("Page.printToPDF", {
            displayHeaderFooter: false,
            preferCSSPageSize: true,
            printBackground: true,
            paperWidth: 8.5,
            paperHeight: 11,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
          } as any);
          console.log("✓ Cash Acknowledgement captured as PDF");
          return pdf;
        } catch (err: any) {
          console.warn(`⚠ PDF capture failed: ${err.message}`);
          return null;
        }
      })();

      await downloadImg.click();

      const pdfData = await Promise.race([
        pdfPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
      ]);

      this.page.off("dialog", dialogHandler);

      if (pdfData && (pdfData as any).data) {
        nodeFs.writeFileSync(
          cashReceiptPdfPath,
          Buffer.from((pdfData as any).data, "base64"),
        );
        uploadPdfPath = cashReceiptPdfPath;
        console.log(`✓ Cash Receipt saved to: ${cashReceiptPdfPath}`);
      }

      await cdpSession.detach();
      await this.page.waitForTimeout(1000);
    }

    // "Sign" reveals/activates the file input after Download; quick-payment.page.ts's
    // equivalent modal instead labels this button "Cash Receipt" — try both.
    const signBtn = this.page
      .locator("xpath=//button[normalize-space()='Sign']")
      .or(
        this.page.locator("xpath=//button[normalize-space()='Cash Receipt']"),
      );
    if ((await signBtn.count()) > 0) {
      // Unlike quick-payment.page.ts's "Cash Receipt" button (which just reveals an
      // <input type="file"> for setInputFiles() to target directly), this modal's "Sign"
      // button calls the input's .click() itself, which opens a real OS file-picker dialog
      // that blocks the page until dismissed. Intercept the filechooser event before
      // clicking so Playwright answers it programmatically — no dialog ever appears.
      // NOTE: don't await waitForEvent unbounded; on the quick-payment flow it never fires
      // at all (Angular wraps that input differently) and would hang indefinitely.
      const fileChooserPromise = this.page
        .waitForEvent("filechooser", { timeout: 5000 })
        .catch(() => null);

      await signBtn.first().click();
      await this.page.waitForTimeout(500);

      const fileChooser = await fileChooserPromise;
      if (fileChooser) {
        try {
          await fileChooser.setFiles(uploadPdfPath);
          console.log(
            `✓ Cash Receipt uploaded via filechooser: ${uploadPdfPath}`,
          );
        } catch (err: any) {
          console.warn(`⚠ filechooser.setFiles failed: ${err.message}`);
        }
      } else {
        const fileInputs = this.page.locator("xpath=//input[@type='file']");
        const inputCount = await fileInputs.count();
        if (inputCount > 0) {
          try {
            await fileInputs.nth(inputCount - 1).setInputFiles(uploadPdfPath);
            console.log(`✓ Cash Receipt uploaded: ${uploadPdfPath}`);
          } catch (err: any) {
            console.warn(`⚠ setInputFiles failed: ${err.message}`);
          }
        }
      }
      await this.page.waitForTimeout(1000);
    }

    // Target by the dropdown's own placeholder option rather than a preceding label —
    // "Branch Name:" isn't necessarily a real <label> tied to the select via for/id.
    const branchNameSelect = this.page.locator(
      "xpath=//select[option[normalize-space()='Select Branch']]",
    );
    if ((await branchNameSelect.count()) > 0) {
      await branchNameSelect.selectOption({ label: "Augmont" });
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Scans the filtered Loan Details grid's kebab menus for the first row that offers
   * "Renew Loan" and opens it. The customer's loan list can hold many rows (24+ seen live)
   * where most only offer View Loan/Pawn Copy/FincareReport — always targeting the first
   * kebab menu (as the ported Java did) hits one of those non-renewable rows more often
   * than not. Same scan-and-skip pattern as the kebab-menu handling in
   * full-release-offline.page.ts.
   */
  private async openRenewLoanForEligibleRow(firstName: string): Promise<void> {
    const kebabButtons = this.page.locator(
      "xpath=//button[.//mat-icon[normalize-space(text())='more_vert']]",
    );
    const rowCount = await kebabButtons.count();
    for (let i = 0; i < rowCount; i++) {
      await kebabButtons.nth(i).click();
      await this.page.waitForTimeout(500);
      const renewOption = this.renewButton();
      if ((await renewOption.count()) > 0 && (await renewOption.isVisible())) {
        await renewOption.click();
        return;
      }
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(300);
    }
    throw new Error(
      `No loan row with "Renew Loan" available was found among ${rowCount} filtered rows for firstName="${firstName}".`,
    );
  }

  /**
   * Selects the first non-placeholder option in the "Loan Purpose" dropdown. Its options
   * depend on the scheme just checked, so there's no fixed label to target by name —
   * any concrete purpose is fine for test purposes, only the "Field is required" state matters.
   */
  private async selectFirstAvailableLoanPurpose(): Promise<void> {
    const loanPurposeDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanPurpose']",
    );
    await loanPurposeDropdown.waitFor({ state: "visible", timeout: 15000 });
    const options = await loanPurposeDropdown.locator("option").all();
    for (const option of options) {
      const value = await option.getAttribute("value");
      if (value) {
        await loanPurposeDropdown.selectOption(value);
        return;
      }
    }
    throw new Error(
      "Loan Purpose dropdown has no selectable (non-placeholder) options.",
    );
  }

  /**
   * Cash-payment variant of validateRenewPaymentOffline() — built on top of
   * validaterenewofflineWithCash() instead of the IMPS/RTGS flow, then shares the same
   * Jewellery Release Approval → Renewal Loans → Appraisal Request continuation.
   */
  async validateRenewPaymentOfflineCash(): Promise<void> {
    const customerId = await this.validaterenewofflineWithCash();
    await this.continueRenewApprovalFlow(customerId);
  }

  // ── Actions (from Flow34_RenewPaymentOffline.validateRenewPaymentOffline) ─

  /**
   * Port of Java Flow34_RenewPaymentOffline.validateRenewPaymentOffline().
   *
   * NOTE: loginWithAppraiser() is OMITTED in the commented-out block in Java.
   * The active code calls validaterenewofflineWithIMPS() then navigates to Jewellery Release Approval.
   * Document upload (C:\\ paths) omitted.
   */
  async validateRenewPaymentOffline(): Promise<void> {
    await this.validaterenewofflineWithIMPS();
    await this.continueRenewApprovalFlow();
  }

  /**
   * Shared continuation for validateRenewPaymentOffline() / validateRenewPaymentOfflineCash()
   * once the renewal payment itself has been submitted: Jewellery Release Approval →
   * Renewal Loans → mark Completed → Appraisal Request → Renew Loan wizard → Save.
   */
  private async continueRenewApprovalFlow(customerId?: string): Promise<void> {
    await this.page.reload();
    await this.page.waitForTimeout(10000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
    await ele.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval().click();
    await this.waitForLoaderToDisappear();
    await this.btnRenewal().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(3000);

    // Renewal Loans can hold 1000+ records (1620 seen live) — without filtering to this
    // specific customer, index [1] below grabs an arbitrary already-"Completed" row (whose
    // action button is labeled "Update Appraiser", not "Update") instead of our fresh
    // "Pending" one.
    if (customerId) {
      const custIdField = this.page.locator(
        "xpath=//input[contains(@placeholder,'Customer Unique')]",
      );
      if ((await custIdField.count()) > 0) {
        await custIdField.fill(customerId);
        await this.page.waitForTimeout(1000);
        await this.filterbtn().click({ noWaitAfter: true });
        await this.page.waitForTimeout(1000);
        await this.waitForLoaderToDisappear();
      }
    }

    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.page.waitForTimeout(5000);

    const scrollContainer = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollContainer.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);

    // Update → Completed. Scoped to exact text "Update" (contains(@class,...) instead of an
    // exact match, since Angular appends extra classes) so it can't match "Update Appraiser".
    const data = getLoginData();
    const updateBtn = this.page.locator(
      "xpath=(//button[contains(@class,'apply-kyc')][normalize-space()='Update'])[1]",
    );
    await updateBtn.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='amountStatus']",
    );
    await selStatus.selectOption({ label: "Completed" });
    await this.page.waitForTimeout(500);
    await this.page.locator("xpath=//span[normalize-space()='Update']").click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.page.reload();
    await this.page.waitForTimeout(10000);

    const ele1 = this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
    await ele1.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page
      .locator("xpath=(//span[normalize-space()='Customer Management'])[1]")
      .click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//span[normalize-space()='Appraisal Request']")
      .click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.firstNameFilter().fill(data.firstName);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);

    const kebabMenu2 = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    await kebabMenu2.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await kebabMenu2.dispatchEvent("click");
    await this.page.waitForTimeout(3000);

    const ele2 = this.page.locator(
      "xpath=//button[normalize-space()='Renew Loan']",
    );
    await this.jsClick(ele2);
    await this.page
      .locator("xpath=//button[.//span[normalize-space()='Ok']]")
      .click();

    // Safe clicks for Next × 3
    const btnNext = this.page.locator(
      "xpath=//button[span[normalize-space()='Next']]",
    );
    for (let i = 0; i < 3; i++) {
      await btnNext.scrollIntoViewIfNeeded().catch(() => {});
      await btnNext.click().catch(async () => {
        await this.jsClick(btnNext);
      });
      await this.page.waitForTimeout(i === 2 ? 5000 : 500);
    }

    const calculateBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Calculate']]",
    );
    await calculateBtn.waitFor({ state: "visible", timeout: 30000 });
    await this.page.waitForTimeout(3000);
    await calculateBtn.click();
    await this.page.waitForTimeout(200);
    await calculateBtn.click();
    await this.page.waitForTimeout(300);
    await calculateBtn.click();
    await this.page.waitForTimeout(3000);

    for (let i = 0; i < 2; i++) {
      await btnNext.scrollIntoViewIfNeeded().catch(() => {});
      await btnNext.click().catch(async () => {
        await this.jsClick(btnNext);
      });
      await this.page.waitForTimeout(2000);
    }

    // Upload docs — C:\\ paths omitted; just click Upload Documents
    await this.page
      .locator(
        "xpath=//kt-button[@ng-reflect-value='Upload Documents']//button",
      )
      .click()
      .catch(() => {});
    await this.page.waitForTimeout(5000);

    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    const saveBtn = this.page.locator(
      "xpath=//button[contains(@class,'mat-raised-button') and .//span[text()='Save']]",
    );
    await saveBtn.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.page
      .locator("xpath=//kt-button[@ng-reflect-value='Save']//button")
      .click()
      .catch(() => {});
    await this.waitForLoaderToDisappear();

    const dropd = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );
    await dropd.selectOption({ label: "Priyanka Thorat" }).catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.page
      .locator("xpath=//kt-button[@ng-reflect-value='Done']//button")
      .click()
      .catch(() => {});
    await this.waitForLoaderToDisappear();
  }

  // ── Actions (from Flow34_RenewPaymentOffline.deposit) ─────────────────────

  /**
   * Port of Java Flow34_RenewPaymentOffline.deposit().
   *
   * Navigates to Funds and Approvals → Jewellery Release Approval → Renewal Loans,
   * filters Pending, scrolls to Update, marks Completed.
   */
  async deposit(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
    await ele.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await ele.click();
    await this.waitForLoaderToDisappear();

    await this.Renewal().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@ng-reflect-name='amountStatus']",
    );
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: "Pending" });
    await this.page.waitForTimeout(2000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);

    const element = this.btnUpdate();
    await element.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await element.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='depositStatus']",
    );
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: "Completed" });
    await this.page.waitForTimeout(1000);
    await this.btnUpdate1().click();
    await this.waitForLoaderToDisappear();
  }

  // ── Actions (from Flow45_RenewPlusTopPaymentOffline.validaterenewofflineWithIMPS) ─

  /**
   * Port of Java Flow45_RenewPlusTopPaymentOffline.validaterenewofflineWithIMPS().
   *
   * Uses radio value='renewalPlusTopUp' and checkbox selector for [ALL] FLEXI 540-30.
   */
  async validaterenewPlusTopOfflineWithIMPS(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — confirmed live that switching an
    // appraiser session to "Show All" gets the backend to reject the session outright
    // (403 on the next page load, 401 on unrelated APIs like /api/gold-rate), forcing a
    // redirect to /auth/login. Appraiser stays on its own default branch scope instead.
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const menu = this.renewMenu();
    await menu.waitFor({ state: "visible", timeout: 30000 });
    await menu.click();

    const renewOption = this.renewButton();
    await renewOption.waitFor({ state: "visible", timeout: 30000 });
    await renewOption.click();

    const renewalRadioBtn = this.page.locator(
      "xpath=//input[@type='radio' and @value='renewalPlusTopUp']",
    );
    await renewalRadioBtn.waitFor({ state: "visible", timeout: 30000 });
    await renewalRadioBtn.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.jsClick(renewalRadioBtn);
    await this.page.waitForTimeout(2000);

    const checkbox = this.page.locator(
      "xpath=//td[text()='[ALL] FLEXI 540-30']/preceding-sibling::td//input[@type='checkbox']",
    );
    await checkbox.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.selPayment().click();
    await this.selPayment().selectOption({ label: "RTGS" });

    await this.inputBankName().fill("State bank of India");
    await this.page.waitForTimeout(2000);
    await this.inputBranchName().fill("Lower parel");
    await this.page.waitForTimeout(2000);
    await this.inputBankTransactionID().fill(this.generateTransactionId());
    await this.page.waitForTimeout(2000);
    await this.btnPODone().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Cash-payment variant of validaterenewPlusTopOfflineWithIMPS(). Same navigation and
   * radio value='renewalPlusTopUp' + "[ALL] FLEXI 540-30" checkbox, but chooses CASH
   * instead of RTGS and reuses the eligible-row scan / Loan Purpose / Cash Receipt
   * helpers already built for the plain-renewal Cash flow.
   *
   * NOTE: Caller must loginAs('appraiser') first. Returns the customer ID for the
   * caller to use when filtering the Renewal Loans approval grid.
   */
  async validaterenewPlusTopOfflineWithCash(): Promise<string> {
    const data = getLoginData();

    // Suppress window.print for the whole flow — see validaterenewofflineWithCash().
    await this.page.addInitScript(() => {
      (window as any).print = () => {};
    });
    try {
      await this.page.evaluate(() => {
        (window as any).print = () => {};
      });
    } catch (_) {}

    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — confirmed live (403 on the next page
    // load, 401 on unrelated APIs like /api/gold-rate, then a forced redirect to /auth/login)
    // that switching an appraiser session to "Show All" gets the backend to reject the
    // session outright. Appraiser stays on its own default branch scope instead.
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    // Fail fast with a clear diagnostic if the session was invalidated mid-flow — otherwise
    // this shows up several steps later as a confusing "Loan Management" locator timeout with
    // no hint that we'd been logged out. Known cause already avoided above (selecting "Show
    // All" branch scope as appraiser); this remains as a safety net for other causes, e.g. a
    // concurrent login as the same appraiser account from another test run.
    if (this.page.url().toLowerCase().includes("login")) {
      throw new Error(
        "Session was logged out before reaching Loan Management — possibly a concurrent login " +
          "as the same appraiser account from another test run invalidated this session. " +
          "Avoid running multiple appraiser-role tests at the same time.",
      );
    }
    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    // noWaitAfter: see validaterenewofflineWithCash() — this filter button is type="submit"
    // inside a <form> and hangs waiting for a navigation Angular already intercepted.
    await this.filterbtn().click({ noWaitAfter: true });
    await this.page.waitForTimeout(1000);
    await this.waitForLoaderToDisappear();

    await this.openRenewLoanForEligibleRow(data.firstName);
    const customerId = await this.readCustomerIdFromRenewWizard();

    const renewalPlusTopUpRadioBtn = this.page.locator(
      "xpath=//input[@type='radio' and @value='renewalPlusTopUp']",
    );
    await renewalPlusTopUpRadioBtn.waitFor({
      state: "visible",
      timeout: 30000,
    });
    await renewalPlusTopUpRadioBtn.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    // The native radio input is visually hidden/zero-size — its wrapping element is the
    // real clickable target (confirmed live: after jsClick on the input directly, the ARIA
    // snapshot showed neither radio as [checked] and no scheme table ever rendered). Click
    // the parent wrapper instead, same "click the label, not the input" pattern as this
    // app's custom checkboxes.
    await this.jsClick(
      this.page.locator(
        "xpath=//input[@type='radio' and @value='renewalPlusTopUp']/..",
      ),
    );
    await this.page.waitForTimeout(2000);

    const checkbox = this.page.locator(
      "xpath=//td[text()='[ALL] FLEXI 540-30']/preceding-sibling::td//input[@type='checkbox']",
    );
    await checkbox.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);

    // "Loan Purpose" is required before Proceed will submit — same gap as the plain
    // renewal flow (see validaterenewofflineWithCash()).
    await this.selectFirstAvailableLoanPurpose();

    // Wait for the persistent gold-rate-ticker spinner (ng-http-loader) to clear before each
    // Proceed click — confirmed live it intercepts pointer events here too (same as the
    // topbar profile/logout buttons) and can detach/re-render the button mid-retry, exhausting
    // the global 10s actionTimeout before Playwright's own retry loop would otherwise succeed.
    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.btnProceed().click({ timeout: 30_000 });
    await this.waitForLoaderToDisappear();
    await this.selPayment().click();
    await this.selPayment().selectOption({ label: "CASH" });
    await this.page.waitForTimeout(2000);

    await this.uploadCashReceiptAndSelectBranch();

    await this.btnPODone().click();
    await this.waitForLoaderToDisappear();
    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.btnProceed().click({ timeout: 30_000 });
    await this.waitForLoaderToDisappear();

    return customerId;
  }

  // ── Actions (from Flow45_RenewPlusTopPaymentOffline.deposit) ─────────────

  /**
   * Port of Java Flow45_RenewPlusTopPaymentOffline.deposit().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Funds and Approvals → Jewellery Release Approval → Renewal Loans,
   * filters Pending, scrolls Update, marks Completed.
   */
  async validateRenewLoanWithTopUpDeposit(customerId?: string): Promise<void> {
    await this.page.reload();
    await this.page.waitForTimeout(10000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
    await ele.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(5000);
    await ele.click();
    await this.waitForLoaderToDisappear();

    await this.Renewal().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    if (customerId) {
      const custIdField = this.page.locator(
        "xpath=//input[contains(@placeholder,'Customer Unique')]",
      );
      if ((await custIdField.count()) > 0) {
        await custIdField.fill(customerId);
      }
    }

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@ng-reflect-name='amountStatus']",
    );
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: "Pending" });
    await this.page.waitForTimeout(2000);
    await this.filterbtn().click({ noWaitAfter: true });
    await this.page.waitForTimeout(1000);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);

    const element = this.btnUpdate();
    await element.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await element.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='amountStatus']",
    );
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: "Completed" });
    await this.page.waitForTimeout(1000);
    await this.btnUpdate1().click();
    await this.waitForLoaderToDisappear();
  }
}
