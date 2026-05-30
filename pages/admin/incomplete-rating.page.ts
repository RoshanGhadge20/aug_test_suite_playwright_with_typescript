import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

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
  constructor(page: Page) { super(page); }

  // ── Locators (from PO22_IncompleteInRating) ───────────────────────────────

  private readonly loc_InputField = () => this.page.locator("xpath=//textarea[@formcontrolname='commentByPartner']");
  private readonly loc_SignDocuments = () => this.page.locator("xpath=//button[@ng-reflect-disabled='false']");
  private readonly loc_SignDocument = () => this.page.locator("xpath=//button[@class='btn btn-sm w-100 mt-3']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  private readonly appliedLoan = () => this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly partnerApproval = () => this.page.locator("xpath=//button[normalize-space()='Partner Approval']");
  private readonly checkClick = () => this.page.locator("xpath=//mat-checkbox[1]");
  private readonly checkClick1 = () => this.page.locator("xpath=//mat-checkbox[2]");
  private readonly loanStatusForPartner = () => this.page.locator("xpath=//select[@formcontrolname='loanStatusForPartner']");
  private readonly btnSubmit = () => this.page.locator("xpath=//button[normalize-space()='Submit']");
  private readonly btnOPSTeam = () => this.page.locator("xpath=//button[normalize-space()='OPS Team']");
  private readonly btnNext = () => this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  private readonly loanStatusForOps = () => this.page.locator("xpath=//select[@formcontrolname='loanStatusForOperatinalTeam']");
  private readonly btnUploadDocuments = () => this.page.locator("xpath=//button[normalize-space()='Upload Documents']");
  private readonly selLead = () => this.page.locator("xpath=//select[@formcontrolname='leadConverterId']");
  private readonly btnDone = () => this.page.locator("xpath=//button[normalize-space()='Done']");
  private readonly btnSave = () => this.page.locator("xpath=//button[normalize-space()='Save']");
  private readonly fileInput1 = () => this.page.locator("xpath=(//input[@type='file'])[1]");
  private readonly fileInput2 = () => this.page.locator("xpath=(//input[@type='file'])[2]");
  private readonly fileInput3 = () => this.page.locator("xpath=(//input[@type='file'])[3]");
  private readonly btnDisbursement = () => this.page.locator("xpath=//button[normalize-space()='Disbursement']");
  private readonly transactionID = () => this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  private readonly selPaymentType = () => this.page.locator("xpath=//select[@formcontrolname='paymentType']");
  private readonly btnDoneDisbursement = () => this.page.locator("xpath=//button[normalize-space()='Done']");
  private readonly btnYesDisbursement = () => this.page.locator("xpath=//button[normalize-space()='Yes']");
  private readonly btnSubmitDisburse = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base']");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow27_IncompleteInRatingFunctionality.validatePackets() — appraiser segment.
   * Caller must first loginAs('appraiser').
   * File uploads are guarded optional params.
   */
  async validatePackets_appraiserPart(
    documentPath?: string,
  ): Promise<void> {
    const data = getLoginData();

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan().scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    if (documentPath) {
      await this.fileInput1().waitFor({ state: 'attached' });
      await this.page.waitForTimeout(15000);
      await this.fileInput1().setInputFiles(documentPath);
      await this.fileInput2().setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
      await this.fileInput3().setInputFiles(documentPath);
      await this.page.waitForTimeout(5000);
    } else {
      await this.page.waitForTimeout(5000);
    }

    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.btnSave().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.btnSave().click();
    await this.waitForLoaderToDisappear();

    await this.selLead().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(5000);
    await this.selLead().selectOption({ label: 'Priyanka Thorat' });
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

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan().scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click();
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

    await this.loanStatusForPartner().selectOption({ label: 'Incomplete' });
    await this.page.waitForTimeout(2000);
    await this.loc_InputField().fill('Incomplete Documents');
    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
  }

  /**
   * Port of OPS segment (sets status to Approved).
   * Caller must first loginAs('ops').
   */
  async validatePackets_opsPart(): Promise<void> {
    const data = getLoginData();

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan().scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnOPSTeam().click();
    await this.waitForLoaderToDisappear();

    await this.btnNext().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    // Click Next 7 times per Java loop
    for (let i = 0; i < 7; i++) {
      await this.btnNext().scrollIntoViewIfNeeded().catch(() => {});
      await this.page.waitForTimeout(500);
      await this.btnNext().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(500);
    }

    await this.loanStatusForOps().selectOption({ label: 'Approved' });
    await this.page.waitForTimeout(2000);
    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of partner-second segment (approves and disburses).
   * Caller must first loginAs('partner').
   */
  async validatePackets_partnerApproveDisburse(): Promise<void> {
    const data = getLoginData();

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan().scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan().click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.partnerApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.clickNextMultipleTimes(7);
    await this.page.waitForTimeout(5000);

    await this.loanStatusForPartner().selectOption({ label: 'Approved' });
    await this.page.waitForTimeout(2000);
    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    // Disbursement
    await this.btnDisbursement().click();
    await this.waitForLoaderToDisappear();
    await this.transactionID().fill(this.randomTransactionId(12));
    await this.btnSubmitDisburse().scrollIntoViewIfNeeded().catch(() => {});
    await this.selPaymentType().selectOption({ label: 'RTGS' });
    await this.page.waitForTimeout(2000);
    await this.btnDoneDisbursement().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnYesDisbursement().click();
    await this.waitForLoaderToDisappear();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async clickNextMultipleTimes(numClicks: number): Promise<void> {
    const nextBtn = this.page.locator("xpath=//button[span[normalize-space()='Next']]");
    for (let i = 0; i < numClicks; i++) {
      try {
        await nextBtn.waitFor({ state: 'visible', timeout: 10000 });
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
}
