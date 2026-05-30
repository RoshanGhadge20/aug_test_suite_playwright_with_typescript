import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO25_RenewLoanWithZero (locators) + Flow34_RenewPaymentOffline (actions)
 *               + Flow45_RenewPlusTopPaymentOffline.deposit() (deposit for renew+topup offline)
 *
 * Methods ported:
 *   - validateRenewPaymentOffline()         ← Flow34.validateRenewPaymentOffline()
 *   - validaterenewofflineWithIMPS()        ← Flow34.validaterenewofflineWithIMPS()
 *   - deposit() [renew]                     ← Flow34.deposit()
 *   - validateRenewPlusTopUpPaymentDeposit() ← Flow45.deposit()
 *   - validaterenewPlusTopOfflineWithIMPS() ← Flow45.validaterenewofflineWithIMPS()
 *
 * Cross-page locator notes:
 *   - All navigation locators re-declared locally.
 *   - PO23_PartReleaseOffline offline-payment locators re-declared.
 *   - PO16_FullRelease.loc_jwellaryReleaseApproval re-declared.
 *   - Flow34 calls Flow33_RenewLoanWithCashZero.safeClick — implemented as local safeClick helper.
 *
 * Omitted loginWith* calls:
 *   - validaterenewofflineWithIMPS() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *   - deposit() called no login (session assumed). Role = appraiser.
 *   - validateRenewPlusTopUpPaymentDeposit() no login. Role = appraiser.
 *
 * C:\\ file paths omitted.
 */
export class RenewZeroPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO25_RenewLoanWithZero) ────────────────────────────────

  private readonly btnDone = () => this.page.locator("xpath=//span[normalize-space()='Done']");
  private readonly btnAttach = () => this.page.locator("xpath=//span[normalize-space()='Attach']");
  private readonly btnRenewal = () => this.page.locator("xpath=//span[contains(@class,'kt-menu__link-text') and normalize-space()='Renewal Loans']");
  private readonly btnConfirm = () => this.page.locator("xpath=//button[.//span[normalize-space()='Confirm']]");
  private readonly btnYes = () => this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly Renewal = () => this.page.locator("xpath=//span[contains(.,'Renewal Loans')]");
  private readonly btnUpdate = () => this.page.locator("xpath=(//button[contains(.,'Update')])[1]");
  private readonly btnUpdate1 = () => this.page.locator("xpath=(//span[contains(.,'Update')])[1]");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  // PO10_QuickPayment.loc_LoanDetails
  private readonly loanDetails = () => this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  // PO10_QuickPayment.loc_kebabMenu (renew uses different selector — dynamic re-declaration)
  private readonly renewMenu = () => this.page.locator("xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]");
  private readonly renewButton = () => this.page.locator("xpath=//button[normalize-space()='Renew Loan']");
  // PO10_QuickPayment.loc_btnProceed
  private readonly btnProceed = () => this.page.locator("xpath=//span[normalize-space()='Proceed']");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () => this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO11_PartPayment.loc_btnProced
  private readonly btnProced = () => this.page.locator("xpath=(//kt-button[@ng-reflect-value='Proceed']//button[@type='button'])[2]");
  // PO16_FullRelease.loc_jwellaryReleaseApproval
  private readonly jwellaryReleaseApproval = () => this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
  // PO23_PartReleaseOffline offline payment locators
  private readonly inputBankName = () => this.page.locator("xpath=//input[@formcontrolname='bankName']");
  private readonly inputBranchName = () => this.page.locator("xpath=//input[@formcontrolname='branchName']");
  private readonly inputBankTransactionID = () => this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  private readonly btnPODone = () => this.page.locator("xpath=//span[normalize-space()='Done']");

  // ── Helper ────────────────────────────────────────────────────────────────

  private generateTransactionId(): string {
    return 'TXN-' + Math.random().toString(36).substring(2, 14).toUpperCase();
  }

  /** Port of Flow33_RenewLoanWithCashZero.safeClick() — scroll+click with retry. */
  private async safeClick(locator: () => import('@playwright/test').Locator): Promise<void> {
    const el = locator();
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    await el.click().catch(async () => { await this.jsClick(el); });
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

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(3000);

    await this.page.locator("xpath=//div[@id='spinner']").waitFor({ state: 'hidden' }).catch(() => {});
    await this.arrow().click();
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

    const renewalRadio = this.page.locator("xpath=//input[@type='radio' and @value='renewal']");
    const menu = this.renewMenu();
    await menu.waitFor({ state: 'visible', timeout: 30000 });
    await menu.click();

    const renewOption = this.renewButton();
    await renewOption.waitFor({ state: 'visible', timeout: 30000 });
    await renewOption.click();

    const renewalRadioBtn = this.page.locator("xpath=//input[@type='radio' and @value='renewal']");
    await renewalRadioBtn.waitFor({ state: 'visible', timeout: 30000 });
    await renewalRadioBtn.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.jsClick(renewalRadioBtn);
    await this.page.waitForTimeout(5000);

    const checkbox = this.page.locator("xpath=(//label[@class='custom-checkbox']//input[@type='checkbox'])[3]");
    await checkbox.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent('click');
    await this.page.waitForTimeout(2000);

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.selPayment().click();
    await this.selPayment().selectOption({ label: 'RTGS' });

    await this.inputBankName().fill('State bank of India');
    await this.page.waitForTimeout(2000);
    await this.inputBranchName().fill('Lower parel');
    await this.page.waitForTimeout(2000);
    await this.inputBankTransactionID().fill(this.generateTransactionId());
    await this.page.waitForTimeout(2000);
    await this.btnPODone().click();
    await this.waitForLoaderToDisappear();
    await this.btnProced().click();
    await this.waitForLoaderToDisappear();
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

    await this.page.reload();
    await this.page.waitForTimeout(10000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator("xpath=//span[normalize-space()='Funds and Approvals']");
    await element1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
    await ele.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval().click();
    await this.waitForLoaderToDisappear();
    await this.btnRenewal().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(3000);
    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(5000);

    const scrollContainer = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollContainer.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);

    // Update → Completed
    const data = getLoginData();
    const updateBtn = this.page.locator("xpath=(//button[@class='apply-kyc ng-star-inserted'][normalize-space()='Update'])[1]");
    await updateBtn.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    const selStatus = this.page.locator("xpath=//select[@formcontrolname='amountStatus']");
    await selStatus.selectOption({ label: 'Completed' });
    await this.page.waitForTimeout(500);
    await this.page.locator("xpath=//span[normalize-space()='Update']").click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Navigate to appraisal request
    await this.page.reload();
    await this.page.waitForTimeout(10000);

    const ele1 = this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
    await ele1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]").click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.page.locator("xpath=//span[normalize-space()='Appraisal Request']").click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.firstNameFilter().fill(data.firstName);

    const scrollDiv = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(3000);

    const kebabMenu2 = this.page.locator("xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]");
    await kebabMenu2.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await kebabMenu2.dispatchEvent('click');
    await this.page.waitForTimeout(3000);

    const ele2 = this.page.locator("xpath=//button[normalize-space()='Renew Loan']");
    await this.jsClick(ele2);
    await this.page.locator("xpath=//button[.//span[normalize-space()='Ok']]").click();

    // Safe clicks for Next × 3
    const btnNext = this.page.locator("xpath=//button[span[normalize-space()='Next']]");
    for (let i = 0; i < 3; i++) {
      await btnNext.scrollIntoViewIfNeeded().catch(() => {});
      await btnNext.click().catch(async () => { await this.jsClick(btnNext); });
      await this.page.waitForTimeout(i === 2 ? 5000 : 500);
    }

    const calculateBtn = this.page.locator("xpath=//button[.//span[normalize-space(text())='Calculate']]");
    await calculateBtn.waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForTimeout(3000);
    await calculateBtn.click();
    await this.page.waitForTimeout(200);
    await calculateBtn.click();
    await this.page.waitForTimeout(300);
    await calculateBtn.click();
    await this.page.waitForTimeout(3000);

    for (let i = 0; i < 2; i++) {
      await btnNext.scrollIntoViewIfNeeded().catch(() => {});
      await btnNext.click().catch(async () => { await this.jsClick(btnNext); });
      await this.page.waitForTimeout(2000);
    }

    // Upload docs — C:\\ paths omitted; just click Upload Documents
    await this.page.locator("xpath=//kt-button[@ng-reflect-value='Upload Documents']//button").click().catch(() => {});
    await this.page.waitForTimeout(5000);

    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    const saveBtn = this.page.locator("xpath=//button[contains(@class,'mat-raised-button') and .//span[text()='Save']]");
    await saveBtn.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.page.locator("xpath=//kt-button[@ng-reflect-value='Save']//button").click().catch(() => {});
    await this.waitForLoaderToDisappear();

    const dropd = this.page.locator("xpath=//select[@formcontrolname='leadConverterId']");
    await dropd.selectOption({ label: 'Priyanka Thorat' }).catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.page.locator("xpath=//kt-button[@ng-reflect-value='Done']//button").click().catch(() => {});
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
    await this.arrow().click();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator("xpath=//span[normalize-space()='Funds and Approvals']");
    await element1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
    await ele.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await ele.click();
    await this.waitForLoaderToDisappear();

    await this.Renewal().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selectStatusDropdown = this.page.locator("xpath=//select[@ng-reflect-name='amountStatus']");
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: 'Pending' });
    await this.page.waitForTimeout(2000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const scrollDiv = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(3000);

    const element = this.btnUpdate();
    await element.evaluate((el: any) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await element.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selStatus = this.page.locator("xpath=//select[@formcontrolname='depositStatus']");
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: 'Completed' });
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

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(3000);

    await this.page.locator("xpath=//div[@id='spinner']").waitFor({ state: 'hidden' }).catch(() => {});
    await this.arrow().click();
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
    await menu.waitFor({ state: 'visible', timeout: 30000 });
    await menu.click();

    const renewOption = this.renewButton();
    await renewOption.waitFor({ state: 'visible', timeout: 30000 });
    await renewOption.click();

    const renewalRadioBtn = this.page.locator("xpath=//input[@type='radio' and @value='renewalPlusTopUp']");
    await renewalRadioBtn.waitFor({ state: 'visible', timeout: 30000 });
    await renewalRadioBtn.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.jsClick(renewalRadioBtn);
    await this.page.waitForTimeout(2000);

    const checkbox = this.page.locator("xpath=//td[text()='[ALL] FLEXI 540-30']/preceding-sibling::td//input[@type='checkbox']");
    await checkbox.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent('click');
    await this.page.waitForTimeout(2000);

    await this.btnProceed().click();
    await this.waitForLoaderToDisappear();
    await this.selPayment().click();
    await this.selPayment().selectOption({ label: 'RTGS' });

    await this.inputBankName().fill('State bank of India');
    await this.page.waitForTimeout(2000);
    await this.inputBranchName().fill('Lower parel');
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

  // ── Actions (from Flow45_RenewPlusTopPaymentOffline.deposit) ─────────────

  /**
   * Port of Java Flow45_RenewPlusTopPaymentOffline.deposit().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Funds and Approvals → Jewellery Release Approval → Renewal Loans,
   * filters Pending, scrolls Update, marks Completed.
   */
  async validateRenewLoanWithTopUpDeposit(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator("xpath=//span[normalize-space()='Funds and Approvals']");
    await element1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
    await ele.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(5000);
    await ele.click();
    await this.waitForLoaderToDisappear();

    await this.Renewal().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selectStatusDropdown = this.page.locator("xpath=//select[@ng-reflect-name='amountStatus']");
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: 'Pending' });
    await this.page.waitForTimeout(2000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const scrollDiv = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(3000);

    const element = this.btnUpdate();
    await element.evaluate((el: any) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await element.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selStatus = this.page.locator("xpath=//select[@formcontrolname='amountStatus']");
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: 'Completed' });
    await this.page.waitForTimeout(1000);
    await this.btnUpdate1().click();
    await this.waitForLoaderToDisappear();
  }
}
