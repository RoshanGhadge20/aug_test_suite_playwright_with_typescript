import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { KycPage } from "./kyc.page";
import fs from "fs";
/**
 * Port of Java: PO02_KycApproval (locators) + Flow02_KycApproval (actions)
 *
 * Cross-page locator notes:
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `firstName_kycFilter` and `filterbtn` re-declare PO01_KycSel locators (same XPaths).
 *   - `reviewAndSubmit()` delegates to KycPage.reviewAndSubmit() — matching
 *     Java's Flow02_KycApproval calling Flow01_Kyc.reviewAndSubmit().
 *
 * Login note:
 *   Flow02_KycApproval.performOpsRatingActions() calls Flow_LoginLogout.loginWithOPS(),
 *   which is a separate login flow. In the TypeScript suite the caller (spec/fixture) should
 *   use AdminLoginPage.loginAs('ops') before invoking performOpsRatingActions().
 *   performOpsRatingActions() therefore does NOT re-login internally; remove that step
 *   from calling specs that already handle auth via the loginAs fixture.
 */
export class KycApprovalPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO02_KycApproval) ───────────────────────────────────────

  private readonly kycDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='KYC Details']");
  private readonly applyKyc = () =>
    this.page.locator("xpath=//span[normalize-space()='Applied KYC']");
  private readonly textSearchField = () =>
    this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly btnAction = () =>
    this.page.locator("xpath=(//strong[contains(text(),'Action >')])[1]");
  private readonly btnReviewandSubmit = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Review & Submit']//button[@type='button']",
    );
  private readonly selStatus = () =>
    this.page.locator(
      "xpath=//select[@class='form-control ng-pristine ng-valid ng-touched']",
    );
  private readonly btnSubmit = () =>
    this.page.locator("xpath=//span[contains(.,'Submit')]");
  private readonly customerUniqID = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer ID']");

  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );

  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );

  private readonly firstName_kycFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");

  private readonly filterbtn = () =>
    this.page.locator("xpath=//button[@type='submit']");

  async performOpsRatingActions(
    kycPage: KycPage,
  ): Promise<{ selectedStatus: string; formClosed: boolean }> {
    const data = getLoginData();

    await this.page.waitForTimeout(500);

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    await branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.kycDetails().click();
    await this.waitForLoaderToDisappear();
    await this.applyKyc().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    await this.customerUniqID().fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    //await this.firstName_kycFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Scroll to filter button then click (Java used scrollIntoView + direct click)
    const filterBtnEl = this.filterbtn();
    await filterBtnEl.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await filterBtnEl.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(500);

    // clickWithRetry equivalent
    await this.clickWithRetry();
    await this.page.waitForTimeout(1500);

    // Flow01_Kyc.reviewAndSubmit() — delegated to KycPage
    await kycPage.reviewAndSubmit();
    await this.page.waitForTimeout(5000);

    const kycStatusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='kycStatusFromOperationalTeam']",
    );
    await kycStatusDropdown.waitFor({ state: "visible" });
    await kycStatusDropdown.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await kycStatusDropdown.evaluate((el: any) => el.click());
    await kycStatusDropdown.selectOption({ label: "Approved" });
    const selectedStatus = await kycStatusDropdown
      .evaluate((el: HTMLSelectElement) => el.options[el.selectedIndex]?.text.trim() ?? "")
      .catch(() => "");
    await this.page.waitForTimeout(5000);

    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();

    // The status dropdown belongs to the Review & Submit panel — it disappearing after
    // submit is the signal the approval actually persisted, not just that we clicked.
    const formClosed = !(await kycStatusDropdown.isVisible().catch(() => false));

    return { selectedStatus, formClosed };
  }

  async clickWithRetry(maxAttempts = 3): Promise<void> {
    const actionLocator = this.page.locator(
      "xpath=(//strong[contains(text(),'Action >')])[1]",
    );
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.page.waitForTimeout(1500);
        await actionLocator.waitFor({ state: "visible", timeout: 20_000 });
        await actionLocator.click();
        return;
      } catch {
        if (attempt === maxAttempts - 1) {
          throw new Error("Action button not clickable after retries");
        }
      }
    }
  }
  async performOpsRatingActionRejected(kycPage: KycPage): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(500);

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    await branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.kycDetails().click();
    await this.waitForLoaderToDisappear();
    await this.applyKyc().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    await this.customerUniqID().fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    //await this.firstName_kycFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Scroll to filter button then click (Java used scrollIntoView + direct click)
    const filterBtnEl = this.filterbtn();
    await filterBtnEl.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await filterBtnEl.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(500);

    // clickWithRetry equivalent
    await this.clickWithRetry();
    await this.page.waitForTimeout(1500);

    // Flow01_Kyc.reviewAndSubmit() — delegated to KycPage
    await kycPage.reviewAndSubmit();
    await this.page.waitForTimeout(5000);

    const kycStatusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='kycStatusFromOperationalTeam']",
    );
    await kycStatusDropdown.waitFor({ state: "visible" });
    await kycStatusDropdown.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await kycStatusDropdown.evaluate((el: any) => el.click());
    await kycStatusDropdown.selectOption({ label: "Rejected" });
    await this.page.waitForTimeout(5000);

    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();
  }
}
