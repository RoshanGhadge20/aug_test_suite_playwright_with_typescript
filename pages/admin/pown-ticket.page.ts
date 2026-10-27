import * as os from "os";
import * as path from "path";
import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class PownTicketPage extends AdminBasePage {
  private readonly btnPrint: Locator;
  private readonly btnPownTicket: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly appliedLoan: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly btnUploadDocuments: Locator;
  private readonly printButtonXpath: Locator;

  constructor(page: Page) {
    super(page);
    this.btnPrint = this.page.locator(
      "xpath=//button[@type='button' and contains(@class,'mat-raised-button') and span[normalize-space()='Print']]",
    );
    this.btnPownTicket = this.page.locator(
      "xpath=//button[normalize-space()='Pawn Ticket']",
    );
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
    this.appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.btnUploadDocuments = this.page.locator(
      "xpath=//button[normalize-space()='UPLOAD DOCUMENTS']",
    );
    this.printButtonXpath = this.page.locator(
      "xpath=//button[span[normalize-space()='Print']]",
    );
  }

  private async clickFirstAvailableUploadDocuments(): Promise<void> {
    const buttons = this.btnUploadDocuments;
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      try {
        await buttons.nth(i).click({ timeout: 5000 });
        return;
      } catch {}
    }
    throw new Error(
      `No clickable "UPLOAD DOCUMENTS" button found among ${count} candidates.`,
    );
  }
  async validateDownloadPownTicket(): Promise<string> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.appliedLoan.scrollIntoViewIfNeeded().catch(() => {});
    await this.appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.page.waitForTimeout(500);
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.clickFirstAvailableUploadDocuments();
    await this.waitForLoaderToDisappear();

    await this.printButtonXpath.waitFor({
      state: "attached",
      timeout: 20000,
    });
    await this.printButtonXpath.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.printButtonXpath.waitFor({ state: "visible" });
    await this.printButtonXpath.click({ force: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    try {
      const [download] = await Promise.all([
        this.page.waitForEvent("download", { timeout: 60_000 }),
        this.btnPownTicket.click(),
      ]);
      await this.waitForLoaderToDisappear();

      const filePath = path.join(
        os.tmpdir(),
        download.suggestedFilename() || `pown-ticket-${Date.now()}.pdf`,
      );
      await download.saveAs(filePath);
      return filePath;
    } catch {
      await this.waitForLoaderToDisappear();
      return "";
    }
  }
}
