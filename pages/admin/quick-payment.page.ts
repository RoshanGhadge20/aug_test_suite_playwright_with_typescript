import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import customerData from "../../testdata/admin/documents/customerData.json";

/**
 * Port of Java: PO10_QuickPayment (locators) + Flow10_QuickPayment.quikPaymentsuccess()
 *               + Flow11_QuickPaymentFail.quikPaymentfail() / validateFailureResponse()
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator shared across TC02 flows (same XPath).
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `partPay` re-declares PO11_PartPayment.loc_partPay (same XPath) — used in quikPaymentfail.
 *   - `paymentAmount` re-declares PO11_PartPayment.loc_paymentAmount (same XPath) — used in quikPaymentfail.
 *   - `btnProcedPP` re-declares PO11_PartPayment.loc_btnProced (same XPath) — used in quikPaymentfail.
 *   - `btnNextduedateRadio` re-declares PO23_PartReleaseOffline.loc_btnNextduedateRadio (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow10_QuickPayment.quikPaymentsuccess() called Flow_LoginLogout.loginWithAppraiser() — OMITTED.
 *   - Flow11_QuickPaymentFail.quikPaymentfail() called Flow_LoginLogout.loginWithAppraiser() — OMITTED.
 *   Both methods require role = appraiser; caller must inject via loginAs('appraiser').
 *
 * Return value note:
 *   - validateFailureResponse() reads and returns the failure message text so the spec can assert it.
 */
export class QuickPaymentPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO10_QuickPayment) ─────────────────────────────────────

  private readonly loanDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  private readonly kebabMenu = () =>
    this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
  private readonly quickPay = () =>
    this.page.locator("xpath=//button[normalize-space()='Quick Pay']");
  private readonly btnProceed = () =>
    this.page.locator("xpath=//span[normalize-space()='Proceed']");
  private readonly netBanking = () =>
    this.page.locator("xpath=//img[@alt='netbanking']");
  private readonly btnConfirm = () =>
    this.page.locator("xpath=//span[normalize-space()='Confirm']");
  private readonly searchBank = () =>
    this.page.locator("xpath=//input[@placeholder='Search for Banks']");
  private readonly sbibank = () =>
    this.page.locator("xpath=(//span[contains(.,'State Bank of India')])[1]");
  private readonly btnPay = () =>
    this.page.locator("xpath=//button[contains(.,'Continue & Pay')]");
  private readonly btnSign = () =>
    this.page.locator("xpath=//button[@ng-reflect-disabled='false']");
  private readonly btnDone = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
  private readonly btnCancel = () =>
    this.page.locator("xpath=//span[normalize-space()='Cancel']");
  private readonly btnFilter = () =>
    this.page.locator("xpath=//span[normalize-space()='Filter']");
  private readonly customerUniqID = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
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
  // PO23_PartReleaseOffline.loc_btnNextduedateRadio
  private readonly btnNextduedateRadio = () =>
    this.page.locator(
      "xpath=(//mat-radio-button[@class='mat-radio-button mat-accent'])[1]",
    );
  // PO11_PartPayment.loc_partPay
  private readonly partPay = () =>
    this.page.locator("xpath=//button[normalize-space()='Part Payment']");
  // PO11_PartPayment.loc_paymentAmount
  private readonly paymentAmount = () =>
    this.page.locator("xpath=//input[@type='text']");
  // PO11_PartPayment.loc_btnProced
  private readonly btnProcedPP = () =>
    this.page.locator(
      "xpath=(//kt-button[@ng-reflect-value='Proceed']//button[@type='button'])[2]",
    );

  // ── Shared navigation helper ───────────────────────────────────────────────

  /** Navigate to Loan Details section (profile → branch → arrow → Loan Management → Loan Details → filter). */
  private async navigateToLoanDetails(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.customerUniqID().fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    //await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(2000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
  }

  // ── Actions (from Flow10_QuickPayment.quikPaymentsuccess) ─────────────────

  /**
   * Port of Java Flow10_QuickPayment.quikPaymentsuccess().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Loan Details, initiates Quick Pay with PAYMENT GATEWAY (net banking / SBI),
   * switches to Razorpay iframe and then to the bank simulator popup, clicks Success.
   */
  async quikPaymentsuccess(): Promise<void> {
    await this.navigateToLoanDetails();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.quickPay().click();
    // await this.page.waitForTimeout(2000);

    // await this.btnNextduedateRadio().click();
    await this.page.waitForTimeout(2000);
    await this.btnProceed().click();

    await this.selPayment().selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking().click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();

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

  // ── Actions (from Flow11_QuickPaymentFail.quikPaymentfail) ────────────────

  /**
   * Port of Java Flow11_QuickPaymentFail.quikPaymentfail().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Uses Part Payment with amount 200, selects PAYMENT GATEWAY, clicks Failure in the
   * bank simulator popup, then validates the failure message via validateFailureResponse().
   *
   * Returns the failure message text read from the Razorpay iframe (for spec assertion).
   */
  async quikPaymentfail(): Promise<string> {
    await this.navigateToLoanDetails();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.partPay().click();
    await this.waitForLoaderToDisappear();

    const ele = this.paymentAmount();
    await ele.clear();
    await this.page.waitForTimeout(2000);
    await ele.fill("200");
    await this.waitForLoaderToDisappear();

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();

    await this.selPayment().selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking().click();
    await this.page.waitForTimeout(2000);

    await this.jsClick(this.btnProcedPP());
    await this.page.waitForTimeout(2000);

    // Switch into Razorpay iframe
    const razorFrame = this.page.frameLocator(
      "xpath=//iframe[@class='razorpay-checkout-frame']",
    );
    await this.page.waitForTimeout(3000);
    await razorFrame
      .locator("xpath=//input[@placeholder='Search for Banks']")
      .fill("State Bank of India");
    await this.page.waitForTimeout(2000);
    await razorFrame
      .locator("xpath=(//span[contains(.,'State Bank of India')])[1]")
      .click();
    const popupPromise = this.page.context().waitForEvent("page");
    await razorFrame
      .locator("xpath=//button[contains(.,'Continue & Pay')]")
      .click();
    await this.page.waitForTimeout(10000);
    const popup = await popupPromise;
    await popup.waitForLoadState();

    const failureBtn = popup.getByRole("button", { name: "Failure" });

    await failureBtn.waitFor({ state: "visible", timeout: 5000 });
    await failureBtn.click();
    await this.page.waitForTimeout(2000);
    return this.validateFailureResponse();
  }

  /**
   * Port of Java Flow11_QuickPaymentFail.validateFailureResponse().
   *
   * Switches back to the Razorpay iframe and reads the failure message text.
   * Returns the message so the spec can assert (no assertion here).
   */
  async validateFailureResponse(): Promise<string> {
    await this.page.waitForTimeout(3000);
    await this.page.mainFrame().evaluate(() => {}); // ensure default content
    const razorFrame = this.page.frameLocator(
      "xpath=//iframe[@class='razorpay-checkout-frame']",
    );
    await this.page.waitForTimeout(5000);
    const msgEl = razorFrame.locator(
      "xpath=//div[contains(@class, 'text-center') and text()='Payment could not be completed']",
    );
    await msgEl.scrollIntoViewIfNeeded();
    return (await msgEl.innerText()).trim();
  }

  // ── Offline Quick Pay (TC04 additions) ────────────────────────────────────

  // Additional locators for offline payment (PO23_PartReleaseOffline locators re-declared locally)
  private readonly inputBankName = () =>
    this.page.locator("xpath=//input[@formcontrolname='bankName']");
  private readonly inputBranchName = () =>
    this.page.locator("xpath=//input[@formcontrolname='branchName']");
  private readonly inputBankTransactionID = () =>
    this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  private readonly btnYesOffline = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly selBranch = () =>
    this.page.locator(
      "xpath=//select[@formcontrolname='receivedAmountForBranchId']",
    );
  // PO45_Deposit locators re-declared
  private readonly btnEdit = () =>
    this.page.locator("xpath=//button[normalize-space()='Edit']");
  private readonly btndone = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  private readonly btnYesDeposit = () =>
    this.page.locator("xpath=//button[normalize-space()='Yes']");

  /**
   * Port of Java Flow28_QuickPaymentOffline.quickPayOffline().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Loan Details, opens Quick Pay, selects CASH, uploads file (optional/guarded),
   * selects Augmont branch, clicks Done → Confirm, then calls deposit().
   */
  async quickPayOffline(): Promise<void> {
    // Suppress window.print for the rest of this flow (Download AND Done->Confirm both
    // trigger Angular's window.print() for receipt/acknowledgement screens). Using
    // addInitScript instead of a one-off page.evaluate() keeps the override in place
    // across any in-flow Angular route change, so the native print preview never blocks
    // the later Confirm click.
    await this.page.addInitScript(() => {
      (window as any).print = () => {};
    });
    try {
      await this.page.evaluate(() => {
        (window as any).print = () => {};
      });
    } catch (_) {}

    await this.navigateToLoanDetails();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.quickPay().click();
    await this.page.waitForTimeout(2000);
    await this.btnNextduedateRadio().click();
    await this.page.waitForTimeout(2000);
    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.selPayment().click();

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
    );
    await selectStatusDropdown.selectOption({ label: "CASH" });
    await this.page.waitForTimeout(2000);

    // Upload cash receipt (required for CASH mode).
    // Two-step UI:
    //   (1) Click "Download" img — Angular calls window.print(). We suppress the dialog,
    //       start Page.printToPDF (600ms after click so Angular has time to render), and
    //       save the Cash Acknowledgement as a PDF.
    //   (2) Click the revealed "Cash Receipt" button, then upload via input[type="file"]
    //       directly (no file-chooser dialog needed).
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

      // Dismiss any print dialogs
      const dialogHandler = async (dialog: any) => {
        await dialog.dismiss();
      };
      this.page.on("dialog", dialogHandler);

      // Suppress window.print so Chrome doesn't open a print preview
      try {
        await this.page.evaluate(() => {
          (window as any).print = () => {};
        });
      } catch (_) {}

      // Start PDF capture non-blocking: wait 600ms for Angular to render the
      // Cash Acknowledgement, then call Page.printToPDF (same pattern as assign-packet.page.ts).
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

      // Click Download → Angular generates Cash Acknowledgement and fires window.print()
      await downloadImg.click();

      // Wait for PDF (max 12s)
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

    // After clicking Download the UI reveals a "Cash Receipt" upload button.
    // Click it to activate the file input, then upload via setInputFiles() directly.
    const cashReceiptBtn = this.page.locator(
      "xpath=//button[normalize-space()='Cash Receipt']",
    );
    if ((await cashReceiptBtn.count()) > 0) {
      await cashReceiptBtn.click();
      await this.page.waitForTimeout(500);

      const fileInputs = this.page.locator("xpath=//input[@type='file']");
      const inputCount = await fileInputs.count();
      if (inputCount > 0) {
        try {
          await fileInputs.nth(inputCount - 1).setInputFiles(uploadPdfPath);
          console.log(`✓ Cash Receipt uploaded: ${uploadPdfPath}`);
        } catch (err: any) {
          console.warn(`⚠ setInputFiles failed: ${err.message}`);
        }
        await this.page.waitForTimeout(1000);
      }
    }

    await this.selBranch().selectOption({ label: "Augmont" });
    await this.btnDone().click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Port of Java Flow28_QuickPaymentOffline.deposit() (shared with Flow31).
   *
   * Navigates to Funds and Approvals → Deposit, filters Pending, scrolls to Edit,
   * marks Completed, clicks Done → Yes.
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
    await this.page.waitForTimeout(2000);

    const ele1 = this.page.locator("xpath=//span[normalize-space()='Deposit']");
    await ele1.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(2000);
    await ele1.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);
    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@ng-reflect-name='depositStatus']",
    );
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: "Pending" });

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

    await this.btnEdit().click();
    await this.waitForLoaderToDisappear();

    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='depositStatus']",
    );
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: "Completed" });

    await this.btndone().click();
    await this.waitForLoaderToDisappear();
    await this.btnYesDeposit().click();
    await this.waitForLoaderToDisappear();
  }
}
