import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

/**
 * Port of Java: PO09_PartnerLoanApproval (locators) + Flow08_PartnerLoanApprovalandDisbusrement (actions)
 *
 * Cross-page locator notes:
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *
 * Omitted loginWith* calls:
 *   - Flow08_PartnerLoanApprovalandDisbusrement.partnerAprroval() called
 *     Flow_LoginLogout.loginWithPartner() — OMITTED.
 *     Role switching must be handled by the caller via loginAs('partner').
 */
export class PartnerApprovalPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO09_PartnerLoanApproval) ──────────────────────────────

  private readonly checkClick = () =>
    this.page.locator(
      "xpath=(//img[@src='../../../../../../../assets/media/icons/incorrect.svg'])[1]",
    );
  private readonly checkClick1 = () =>
    this.page.locator("xpath=(//img[@class='ng-star-inserted'])[2]");
  private readonly partnerApproval = () =>
    this.page.locator("xpath=//button[normalize-space()='PARTNER APPROVAL']");
  private readonly btnDisbursement = () =>
    this.page.locator(
      "xpath=(//button[normalize-space()='Disburse Amount'])[1]",
    );
  private readonly transactionID = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='securedBankTransactionId']",
    );
  private readonly selPaymentType = () =>
    this.page.locator("xpath=//select[@formcontrolname='bankTransferType']");
  private readonly btnDone = () =>
    this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");

  // Cross-page re-declarations
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
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

  // ── Actions (from Flow08_PartnerLoanApprovalandDisbusrement) ───────────────

  /**
   * Port of Java Flow08_PartnerLoanApprovalandDisbusrement.partnerAprroval().
   *
   * NOTE: loginWithPartner() call is OMITTED.
   * Role switching must be handled by the caller via loginAs('partner').
   */
  async partnerAprroval(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(500);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2500);

    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.loanDisbursement();
  }

  /**
   * Port of Java Flow08_PartnerLoanApprovalandDisbusrement.clickNextMultipleTimes().
   */
  async clickNextMultipleTimes(numClicks: number): Promise<void> {
    const nextBtnLocator = this.page.locator(
      "xpath=//button[span[normalize-space()='Next']]",
    );

    for (let count = 0; count < numClicks; count++) {
      try {
        const nextBtn = nextBtnLocator;
        await nextBtn.waitFor({ state: "visible", timeout: 10_000 });
        await nextBtn.evaluate((el) =>
          (el as any).scrollIntoView({ behavior: "smooth", block: "center" }),
        );
        await this.page.waitForTimeout(500);
        try {
          await nextBtn.click();
        } catch {
          await this.jsClick(nextBtn);
        }
        await this.page.waitForTimeout(1000);
      } catch {
        break;
      }
    }
  }

  /**
   * Port of Java Flow08_PartnerLoanApprovalandDisbusrement.loanDisbursement().
   */
  async loanDisbursement(): Promise<void> {
    // Confirmed from the failure snapshot: the "Disburse Amount" button was focused but no dialog
    // opened. This Applied Loan table keeps re-rendering, so a click can land on a node that is
    // being replaced and get dropped. Re-click until the transaction-ID field appears.
    let dialogOpen = false;
    // Diagnostics: the video/snapshot show the click lands but nothing opens, so log what the app
    // does in response (API calls, console errors, toasts) to reveal why it refuses.
    const onResponse = (res: import("@playwright/test").Response) => {
      const req = res.request();
      if (req.method() !== "GET" || res.status() >= 400) {
        console.log(`DISBURSE NET [${res.status()}] ${req.method()} ${res.url()}`);
      }
    };
    const onConsole = (msg: import("@playwright/test").ConsoleMessage) => {
      if (msg.type() === "error") console.log(`DISBURSE CONSOLE ERROR: ${msg.text()}`);
    };
    this.page.on("response", onResponse);
    this.page.on("console", onConsole);
    for (let attempt = 1; attempt <= 4 && !dialogOpen; attempt++) {
      const btn = this.btnDisbursement();
      await btn.waitFor({ state: "attached", timeout: 15000 });
      // Bypass stability polling (table re-renders): scroll via evaluate, then vary the click.
      await btn.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await this.page.waitForTimeout(500);
      console.log(`Clicking Disburse Amount (attempt ${attempt}/4)...`);
      // DOM: <div class="kt-pointer position-relative"><button class="green-button">…</button>
      // The click handler may live on the kt-pointer wrapper, and the cell is a frozen
      // (sticky) column — try a real actionability-checked click first so any overlay
      // covering the button is reported in the log instead of silently swallowed.
      const wrapper = btn.locator("xpath=parent::div[contains(@class,'kt-pointer')]");
      if (attempt === 1) {
        await btn.click({ timeout: 10000 }).catch((e) => {
          console.log(`Disburse plain click failed: ${String(e.message).split("\n").slice(0, 6).join(" | ")}`);
        });
      } else if (attempt === 2) {
        await wrapper.click({ force: true, timeout: 5000 }).catch(() => {});
        await btn.dispatchEvent("click");
      } else if (attempt === 3) {
        await btn.evaluate((el) => (el as HTMLElement).click());
      } else {
        await btn.focus();
        await this.page.keyboard.press("Enter");
      }
      await this.waitForLoaderToDisappear();
      dialogOpen = await this.transactionID()
        .waitFor({ state: "visible", timeout: 8000 })
        .then(() => true)
        .catch(() => false);
    }
    this.page.off("response", onResponse);
    this.page.off("console", onConsole);
    if (!dialogOpen) {
      const popup = await this.page
        .locator(
          "xpath=//*[contains(@class,'toast') or contains(@class,'swal2') or contains(@class,'snack') or contains(@class,'alert') or @role='alert' or @role='dialog']",
        )
        .allInnerTexts()
        .catch(() => [] as string[]);
      console.log(`DISBURSE popups/toasts on page: ${JSON.stringify(popup)}`);
      throw new Error(
        "Disburse Amount dialog (securedBankTransactionId) did not open after 4 click strategies — " +
          "the button may be disabled/blocked by the app; check the screenshot.",
      );
    }

    await this.transactionID().fill(this.randomTransactionId(12));
    await this.waitForLoaderToDisappear();

    const submitButton = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    await submitButton.waitFor({ state: "attached" });
    await submitButton.evaluate((el) => (el as any).scrollIntoView(true));

    await this.selPaymentType().selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(2000);

    await submitButton.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.btnDone().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of Java Flow08_PartnerLoanApprovalandDisbusrement.randomTransactionId().
   */
  randomTransactionId(length: number): string {
    const alphanum = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
    }
    return result;
  }
}
