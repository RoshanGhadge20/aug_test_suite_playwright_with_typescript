import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

/**
 * Port of Java: Flow29_ValidateCustomFunctionality + Flow30_ValidateCancelButtonFunctionality
 *               + Flow53_ValidateProceedAndCancle
 *
 * Methods ported:
 *   - validateCustomFunctionality()      ← Flow29.validateCustomFunctionality()
 *   - validateMinAmount()                ← Flow29.validateMinAmount()
 *   - validateWithNextDueDateAmount()    ← Flow29.validateWithNextDueDateAmount()
 *   - validateNextDueAmontMax()          ← Flow29.validateNextDueAmontMax()
 *   - validateCancelButton()             ← Flow30.validateCancelButton()
 *   - validateProceedButton()            ← Flow53.validateProceedButton()
 *
 * Cross-page locator notes:
 *   - All navigation locators re-declared locally.
 *   - PO23_PartReleaseOffline locators re-declared for custom radio and payment amount.
 *   - PO10_QuickPayment locators re-declared for kebab, quickPay, proceed, cancel, selPayment, etc.
 *   - PO16_FullRelease.loc_btnProced re-declared for validateProceedButton (renew path).
 *
 * Omitted loginWith* calls:
 *   - All methods called loginWithAppraiser() — OMITTED. Role = appraiser.
 *
 * SoftAssert translated to return values:
 *   - validateCustomFunctionality() returns errorMsg so spec can expect.soft().
 *   - validateNextDueAmontMax() returns errorMsg so spec can expect.soft().
 *   - validateProceedButton() returns [isProceedDisplayed, isProceedEnabled, isCancelDisplayed].
 */
export class CustomCancelPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Cross-page locator re-declarations ────────────────────────────────────

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
  // PO10_QuickPayment.loc_kebabMenu
  private readonly kebabMenu = () =>
    this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
  // PO10_QuickPayment.loc_quickPay
  private readonly quickPay = () =>
    this.page.locator("xpath=//button[normalize-space()='Quick Pay']");
  // PO10_QuickPayment.loc_btnProceed
  private readonly btnProceed = () =>
    this.page.locator("xpath=//span[normalize-space()='Proceed']");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO10_QuickPayment.loc_netBanking
  private readonly netBanking = () =>
    this.page.locator("xpath=//img[@alt='netbanking']");
  // PO10_QuickPayment.loc_btnConfirm
  private readonly btnConfirm = () =>
    this.page.locator("xpath=//span[normalize-space()='Confirm']");
  // PO10_QuickPayment.loc_btnCancel
  private readonly btnCancel = () =>
    this.page.locator("xpath=//span[normalize-space()='Cancel']");
  // PO23_PartReleaseOffline.loc_btncutomRadio
  private readonly btncutomRadio = () =>
    this.page.locator("xpath=(//div[@class='mat-radio-inner-circle'])[3]");
  // PO23_PartReleaseOffline.loc_paymentAmount
  private readonly paymentAmount = () =>
    this.page.locator("xpath=//input[@type='text']");
  // PO16_FullRelease.loc_btnProced (for renew loan path in validateProceedButton)
  private readonly btnProced = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  // Renew loan locators (for validateProceedButton — Flow53)
  private readonly renewMenu = () =>
    this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
  private readonly renewButton = () =>
    this.page.locator("xpath=//button[normalize-space()='Renew Loan']");
  private readonly selPurpose = () =>
    this.page.locator("xpath=//select[@formcontrolname='loanPurpose']");
  // ── Private navigation helper ─────────────────────────────────────────────

  private async navigateToLoanDetails(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // Confirmed live: selecting any branch scope other than the appraiser account's own
    // assigned branch gets the session force-logged-out on UAT within ~3s (backend rejects
    // subsequent calls with 401/403, Angular's http interceptor redirects to /auth/login).
    // Leave the account on its default branch scope instead of calling selectOption().
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
    // noWaitAfter: this button is type="submit" inside a <form> — Playwright detects a real
    // navigation attempt from the native submit and hangs waiting for it to "finish" even
    // though Angular's (ngSubmit) handler already intercepted it client-side (same fix as
    // renew-zero.page.ts / full-release-offline.page.ts / manual-charges.page.ts / loan-view.page.ts).
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
  }

  /** Open Quick Pay → custom radio → clear and fill amount → Proceed. */
  private async openQuickPayWithCustomAmount(amount: string): Promise<void> {
    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.quickPay().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btncutomRadio().click();
    await this.page.waitForTimeout(2000);

    const element = this.paymentAmount();
    await element.clear();
    await this.page.waitForTimeout(2000);
    await element.fill(amount);
    await this.page.waitForTimeout(2000);

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
  }

  /** Common steps after Proceed: select PAYMENT GATEWAY → netBanking → Confirm → iframe SBI → Success. */
  private async completePaymentGateway(): Promise<void> {
    const selectStatusDropdown = this.selPayment();
    await selectStatusDropdown.selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking().click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();

    const iframeEl = this.page.locator(
      "xpath=//iframe[@class='razorpay-checkout-frame']",
    );
    await iframeEl.waitFor({ state: "attached" });
    const razorFrame = this.page.frameLocator(
      "xpath=//iframe[@class='razorpay-checkout-frame']",
    );
    await this.page.waitForTimeout(2000);
    await razorFrame
      .locator("xpath=//input[@placeholder='Search for Banks']")
      .fill("State Bank of India");
    await this.page.waitForTimeout(2000);
    await razorFrame
      .locator("xpath=(//span[contains(.,'State Bank of India')])[1]")
      .click();
    await razorFrame
      .locator("xpath=//button[contains(.,'Continue & Pay')]")
      .click();
    await this.page.waitForTimeout(2000);

    const [popup] = await Promise.all([
      this.page
        .context()
        .waitForEvent("page", { timeout: 15000 })
        .catch(() => null),
      Promise.resolve(),
    ]);
    if (popup) {
      const successBtn = popup.locator(
        "xpath=//button[contains(text(),'Success')]",
      );
      await successBtn.waitFor({ state: "visible", timeout: 10000 });
      await successBtn.click();
      await popup.waitForEvent("close", { timeout: 10000 }).catch(() => {});
    } else {
      const successBtn = this.page.locator(
        "xpath=//button[contains(text(),'Success')]",
      );
      await successBtn.waitFor({ state: "visible", timeout: 10000 });
      await successBtn.click();
    }
  }

  // ── Actions (from Flow29_ValidateCustomFunctionality.validateCustomFunctionality) ─

  /**
   * Port of Java Flow29_ValidateCustomFunctionality.validateCustomFunctionality().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Opens Quick Pay with custom amount 0, proceeds, reads error message, then
   * selects PAYMENT GATEWAY / SBI / Success.
   *
   * Returns the error message text — spec asserts with expect.soft().
   */
  async validateCustomFunctionality(): Promise<string> {
    await this.navigateToLoanDetails();
    await this.openQuickPayWithCustomAmount("0");

    const error = this.page.locator("xpath=//small[@class='text-danger']");
    const actualMsg = (await error.innerText()).trim();

    await this.completePaymentGateway();
    return actualMsg;
  }

  // ── Actions (from Flow29_ValidateCustomFunctionality.validateMinAmount) ───

  /**
   * Port of Java Flow29_ValidateCustomFunctionality.validateMinAmount().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Opens Quick Pay with custom amount 10, proceeds, then completes PAYMENT GATEWAY.
   */
  async validateMinAmount(): Promise<void> {
    await this.navigateToLoanDetails();
    await this.openQuickPayWithCustomAmount("10");
    await this.completePaymentGateway();
  }

  // ── Actions (from Flow29_ValidateCustomFunctionality.validateWithNextDueDateAmount) ─

  /**
   * Port of Java Flow29_ValidateCustomFunctionality.validateWithNextDueDateAmount().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Opens Quick Pay, reads the 3rd column table-amount span, fills as custom amount,
   * proceeds, completes PAYMENT GATEWAY.
   */
  async validateWithNextDueDateAmount(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // Confirmed live: selecting any branch scope other than the appraiser account's own
    // assigned branch gets the session force-logged-out on UAT within ~3s (backend rejects
    // subsequent calls with 401/403, Angular's http interceptor redirects to /auth/login).
    // Leave the account on its default branch scope instead of calling selectOption().
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
    // noWaitAfter: see navigateToLoanDetails() above.
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.quickPay().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btncutomRadio().click();
    await this.page.waitForTimeout(2000);

    const ele = this.page.locator(
      "xpath=(//td[contains(@class,'table-amount')]/span)[3]",
    );
    const str = (await ele.innerText()).trim();
    await this.page.waitForTimeout(2000);

    const element = this.paymentAmount();
    await element.clear();
    await this.page.waitForTimeout(2000);
    await element.fill(str);
    await this.page.waitForTimeout(2000);

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();

    await this.completePaymentGateway();
  }

  // ── Actions (from Flow29_ValidateCustomFunctionality.validateNextDueAmontMax) ─

  /**
   * Port of Java Flow29_ValidateCustomFunctionality.validateNextDueAmontMax().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Opens Quick Pay, reads 3rd column amount, adds 1, fills as custom amount, proceeds,
   * reads max-amount error message.
   *
   * Returns the error message text — spec asserts with expect.soft().
   */
  async validateNextDueAmontMax(): Promise<string> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // Confirmed live: selecting any branch scope other than the appraiser account's own
    // assigned branch gets the session force-logged-out on UAT within ~3s (backend rejects
    // subsequent calls with 401/403, Angular's http interceptor redirects to /auth/login).
    // Leave the account on its default branch scope instead of calling selectOption().
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
    // noWaitAfter: see navigateToLoanDetails() above.
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.quickPay().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btncutomRadio().click();
    await this.page.waitForTimeout(2000);

    const ele = this.page.locator(
      "xpath=(//td[contains(@class,'table-amount')]/span)[3]",
    );
    const str = (await ele.innerText()).trim();
    await this.page.waitForTimeout(2000);

    const value = parseFloat(str.replace(/,/g, ""));
    const newValue = value + 1;
    const finalValue = newValue.toFixed(2);

    const element = this.paymentAmount();
    await element.clear();
    await this.page.waitForTimeout(2000);
    await element.fill(finalValue);
    await this.page.waitForTimeout(2000);

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();

    const error = this.page.locator(
      "xpath=//mat-error[contains(@class,'mat-error')]//small[contains(normalize-space(),'Part Payment option')]",
    );
    const actualMsg = (await error.innerText()).trim();
    return actualMsg;
  }

  // ── Actions (from Flow30_ValidateCancelButtonFunctionality.validateCancelButton) ─

  /**
   * Port of Java Flow30_ValidateCancelButtonFunctionality.validateCancelButton().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Opens Quick Pay, clicks Proceed, clicks Cancel.
   */
  async validateCancelButton(): Promise<void> {
    await this.navigateToLoanDetails();

    await this.kebabMenu().click();
    await this.waitForLoaderToDisappear();
    await this.quickPay().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnCancel().click();
    await this.waitForLoaderToDisappear();
  }

  // ── Actions (from Flow53_ValidateProceedAndCancle.validateProceedButton) ───

  /**
   * Port of Java Flow53_ValidateProceedAndCancle.validateProceedButton().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Opens Renew Loan (renewal radio), selects FLEXI 540-30 checkbox, checks Proceed button
   * is displayed/enabled, proceeds, selects PAYMENT GATEWAY, selects netBanking,
   * checks Cancel is visible, then clicks Cancel.
   *
   * Returns [isProceedDisplayed, isProceedEnabled, isCancelDisplayed] — spec can assert.
   */
  async validateProceedButton(): Promise<[boolean, boolean, boolean]> {
    await this.navigateToLoanDetails();

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
    //await this.btnProceed().click();
    await this.page.waitForTimeout(2000);
    const proceedBtn = this.btnProced();
    const isProceedDisplayed = await proceedBtn.isVisible();
    const isProceedEnabled = await proceedBtn.isEnabled();

    await proceedBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const selectStatusDropdown = this.selPayment();
    await selectStatusDropdown.evaluate((el: any) =>
      el.scrollIntoView({ block: "nearest", inline: "center" }),
    );
    await selectStatusDropdown.click();
    await selectStatusDropdown.selectOption({ label: "PAYMENT GATEWAY" });
    await this.waitForLoaderToDisappear();

    await this.netBanking().click();
    await this.waitForLoaderToDisappear();

    const cancelBtn = this.btnCancel();
    const isCancelDisplayed = await cancelBtn.isVisible();
    await cancelBtn.scrollIntoViewIfNeeded();
    await cancelBtn.click();
    await this.waitForLoaderToDisappear();

    return [isProceedDisplayed, isProceedEnabled, isCancelDisplayed];
  }
}
