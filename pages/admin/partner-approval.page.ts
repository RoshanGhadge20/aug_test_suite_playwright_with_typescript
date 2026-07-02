import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

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
  constructor(page: Page) { super(page); }

  // ── Locators (from PO09_PartnerLoanApproval) ──────────────────────────────

  private readonly checkClick = () => this.page.locator("xpath=(//img[@src='../../../../../../../assets/media/icons/incorrect.svg'])[1]");
  private readonly checkClick1 = () => this.page.locator("xpath=(//img[@class='ng-star-inserted'])[2]");
  private readonly partnerApproval = () => this.page.locator("xpath=//button[normalize-space()='PARTNER APPROVAL']");
  private readonly btnDisbursement = () => this.page.locator("xpath=//button[@class='green-button']");
  private readonly transactionID = () => this.page.locator("xpath=//input[@formcontrolname='securedBankTransactionId']");
  private readonly selPaymentType = () => this.page.locator("xpath=//select[@formcontrolname='bankTransferType']");
  private readonly btnDone = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");
  private readonly btnYes = () => this.page.locator("xpath=//span[contains(.,'Yes')]");

  // Cross-page re-declarations
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");

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

    const appliedLoan = this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
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
    const nextBtnLocator = this.page.locator("xpath=//button[span[normalize-space()='Next']]");

    for (let count = 0; count < numClicks; count++) {
      try {
        const nextBtn = nextBtnLocator;
        await nextBtn.waitFor({ state: 'visible', timeout: 10_000 });
        await nextBtn.evaluate((el) => (el as any).scrollIntoView({ behavior: 'smooth', block: 'center' }));
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
    await this.btnDisbursement().click();
    await this.waitForLoaderToDisappear();

    await this.transactionID().fill(this.randomTransactionId(12));
    await this.waitForLoaderToDisappear();

    const submitButton = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    await submitButton.waitFor({ state: 'attached' });
    await submitButton.evaluate((el) => (el as any).scrollIntoView(true));

    await this.selPaymentType().selectOption({ label: 'RTGS' });
    await this.page.waitForTimeout(2000);

    await submitButton.waitFor({ state: 'visible' });
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
    const alphanum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
    }
    return result;
  }
}
