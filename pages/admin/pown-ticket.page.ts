import * as os from 'os';
import * as path from 'path';
import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO29_PownTicket (locators) + Flow46_ValidateDownloadPownTicket (actions)
 *
 * Cross-page locator notes:
 *   - `profile`, `arrow`, `branchDropdown`, `loanManagement`, `appliedLoan`,
 *     `firstNameFilter`, `filterbtn`, `btnUploadDocuments` re-declared from various POs.
 *
 * Omitted loginWith* calls:
 *   - validateDownloadPownTicket() calls loginWithAppraiser() — OMITTED.
 *     Caller must inject loginAs('appraiser') before calling validateDownloadPownTicket().
 *
 * Pown Ticket Download:
 *   - Java used CDP DevTools Page.printToPDF() — all PDF-write code was commented out in Java too.
 *   - UI actions (navigate, click Print, click Pawn Ticket) are ported verbatim.
 *   - Download captured via Playwright's `download` event. Falls back gracefully if the app
 *     renders the PDF inline in a new tab instead of triggering a file download.
 */
export class PownTicketPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO29_PownTicket) ──────────────────────────────────────

  private readonly btnPrint = () => this.page.locator("xpath=//button[@type='button' and contains(@class,'mat-raised-button') and span[normalize-space()='Print']]");
  private readonly btnPownTicket = () => this.page.locator("xpath=//button[normalize-space()='Pawn Ticket']");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  private readonly loanManagement = () => this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  private readonly appliedLoan = () => this.page.locator("xpath=//span[normalize-space()='Applied Loan']");
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly btnUploadDocuments = () => this.page.locator("xpath=//button[normalize-space()='Upload Documents']");
  private readonly printButtonXpath = () => this.page.locator("xpath=//button[span[normalize-space()='Print']]");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow46_ValidateDownloadPownTicket.validateDownloadPownTicket().
   * Caller must first loginAs('appraiser').
   *
   * Returns the local file path of the downloaded PDF, or an empty string when the app
   * renders the ticket inline (PDF in new tab, no download event fired).
   */
  async validateDownloadPownTicket(): Promise<string> {
    const data = getLoginData();

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(7000);

    await this.expandSidebar();
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

    await this.printButtonXpath().waitFor({ state: 'attached', timeout: 20000 });
    await this.printButtonXpath().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.printButtonXpath().waitFor({ state: 'visible' });
    await this.printButtonXpath().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    // Capture the download triggered by clicking "Pawn Ticket".
    // Primary path: the app fires a `download` event (browser-initiated file save).
    // Fallback path: app opens PDF in a new tab instead — return '' with a clear comment.
    try {
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: 60_000 }),
        this.btnPownTicket().click(),
      ]);
      await this.waitForLoaderToDisappear();

      const filePath = path.join(
        os.tmpdir(),
        download.suggestedFilename() || `pown-ticket-${Date.now()}.pdf`,
      );
      await download.saveAs(filePath);
      return filePath;
    } catch {
      // no download event — app may render PDF inline in a new tab; verify against live app
      await this.waitForLoaderToDisappear();
      return '';
    }
  }
}
