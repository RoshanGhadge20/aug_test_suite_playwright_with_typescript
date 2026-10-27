import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class CustomCancelPage extends AdminBasePage {
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly loanDetails: Locator;
  private readonly kebabMenu: Locator;
  private readonly quickPay: Locator;
  private readonly btnProceed: Locator;
  private readonly selPayment: Locator;
  private readonly netBanking: Locator;
  private readonly btnConfirm: Locator;
  private readonly btnCancel: Locator;
  private readonly btncutomRadio: Locator;
  private readonly paymentAmount: Locator;
  private readonly btnProced: Locator;
  private readonly renewMenu: Locator;
  private readonly renewButton: Locator;
  private readonly selPurpose: Locator;

  constructor(page: Page) {
    super(page);
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
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.loanDetails = this.page.locator(
      "xpath=//span[normalize-space()='Loan Details']",
    );
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.quickPay = this.page.locator(
      "xpath=//button[normalize-space()='Quick Pay']",
    );
    this.btnProceed = this.page.locator(
      "xpath=//span[normalize-space()='Proceed']",
    );
    this.selPayment = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
    );
    this.netBanking = this.page.locator("xpath=//img[@alt='netbanking']");
    this.btnConfirm = this.page.locator(
      "xpath=//span[normalize-space()='Confirm']",
    );
    this.btnCancel = this.page.locator(
      "xpath=//span[normalize-space()='Cancel']",
    );
    this.btncutomRadio = this.page.locator(
      "xpath=(//div[@class='mat-radio-inner-circle'])[3]",
    );
    this.paymentAmount = this.page.locator("xpath=//input[@type='text']");
    this.btnProced = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Proceed']]",
    );
    this.renewMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.renewButton = this.page.locator(
      "xpath=//button[normalize-space()='Renew Loan']",
    );
    this.selPurpose = this.page.locator(
      "xpath=//select[@formcontrolname='loanPurpose']",
    );
  }

  private async navigateToLoanDetails(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
  }

  private async openQuickPayWithCustomAmount(amount: string): Promise<void> {
    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.quickPay.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btncutomRadio.click();
    await this.page.waitForTimeout(2000);

    const element = this.paymentAmount;
    await element.clear();
    await this.page.waitForTimeout(2000);
    await element.fill(amount);
    await this.page.waitForTimeout(2000);

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
  }

  private async completePaymentGateway(): Promise<void> {
    const selectStatusDropdown = this.selPayment;
    await selectStatusDropdown.selectOption({ label: "PAYMENT GATEWAY" });
    await this.netBanking.click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm.click();
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

  async validateCustomFunctionality(): Promise<string> {
    await this.navigateToLoanDetails();
    await this.openQuickPayWithCustomAmount("0");

    const error = this.page.locator("xpath=//small[@class='text-danger']");
    const actualMsg = (await error.innerText()).trim();

    await this.completePaymentGateway();
    return actualMsg;
  }

  async validateMinAmount(): Promise<void> {
    await this.navigateToLoanDetails();
    await this.openQuickPayWithCustomAmount("10");
    await this.completePaymentGateway();
  }

  async validateWithNextDueDateAmount(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.quickPay.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btncutomRadio.click();
    await this.page.waitForTimeout(2000);

    const ele = this.page.locator(
      "xpath=(//td[contains(@class,'table-amount')]/span)[3]",
    );
    const str = (await ele.innerText()).trim();
    await this.page.waitForTimeout(2000);

    const element = this.paymentAmount;
    await element.clear();
    await this.page.waitForTimeout(2000);
    await element.fill(str);
    await this.page.waitForTimeout(2000);

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();

    await this.completePaymentGateway();
  }

  async validateNextDueAmontMax(): Promise<string> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.quickPay.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btncutomRadio.click();
    await this.page.waitForTimeout(2000);

    const ele = this.page.locator(
      "xpath=(//td[contains(@class,'table-amount')]/span)[3]",
    );
    const str = (await ele.innerText()).trim();
    await this.page.waitForTimeout(2000);

    const value = parseFloat(str.replace(/,/g, ""));
    const newValue = value + 1;
    const finalValue = newValue.toFixed(2);

    const element = this.paymentAmount;
    await element.clear();
    await this.page.waitForTimeout(2000);
    await element.fill(finalValue);
    await this.page.waitForTimeout(2000);

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();

    const error = this.page.locator(
      "xpath=//mat-error[contains(@class,'mat-error')]//small[contains(normalize-space(),'Part Payment option')]",
    );
    const actualMsg = (await error.innerText()).trim();
    return actualMsg;
  }

  async validateCancelButton(): Promise<void> {
    await this.navigateToLoanDetails();

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.quickPay.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnCancel.click();
    await this.waitForLoaderToDisappear();
  }

  async validateProceedButton(): Promise<[boolean, boolean, boolean]> {
    await this.navigateToLoanDetails();

    const menu = this.renewMenu;
    await menu.waitFor({ state: "visible", timeout: 30000 });
    await menu.click();

    const renewOption = this.renewButton;
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
    await this.selPurpose.selectOption({ label: "Business Expansion" });
    await this.page.waitForTimeout(2000);
    //await this.btnProceed.click();
    await this.page.waitForTimeout(2000);
    const proceedBtn = this.btnProced;
    const isProceedDisplayed = await proceedBtn.isVisible();
    const isProceedEnabled = await proceedBtn.isEnabled();

    await proceedBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const selectStatusDropdown = this.selPayment;
    await selectStatusDropdown.evaluate((el: any) =>
      el.scrollIntoView({ block: "nearest", inline: "center" }),
    );
    await selectStatusDropdown.click();
    await selectStatusDropdown.selectOption({ label: "PAYMENT GATEWAY" });
    await this.waitForLoaderToDisappear();

    await this.netBanking.click();
    await this.waitForLoaderToDisappear();

    const cancelBtn = this.btnCancel;
    const isCancelDisplayed = await cancelBtn.isVisible();
    await cancelBtn.scrollIntoViewIfNeeded();
    await cancelBtn.click();
    await this.waitForLoaderToDisappear();

    return [isProceedDisplayed, isProceedEnabled, isCancelDisplayed];
  }
}
