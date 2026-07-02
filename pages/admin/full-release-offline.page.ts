import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO24_FullReleaseOffline (empty class) + Flow35_FullReleaseOffline (actions)
 *
 * Methods ported:
 *   - validateFullRelease()  ← Flow35.validateFullRelease()
 *   - deposit()              ← Flow35.deposit()
 *
 * Note: Flow35.validateFullRelease() calls Flow10_QuickPayment.quikPaymentsuccess() at the
 * start — that precondition is handled by the spec (createDisbursedLoan covers the pre-state).
 * The method continues with navigating to Jewellery Release Final Process → Final Full Release
 * → update(), which are implemented here.
 *
 * Cross-page locator notes:
 *   - All navigation locators re-declared locally.
 *   - PO08_PacketSubmissionAppraiser locators re-declared for update().
 *   - PO15_PartRelease / PO16_FullRelease locators re-declared as needed.
 *   - PO23_PartReleaseOffline.loc_updatebtn / loc_btupdate re-declared.
 *
 * Omitted loginWith* calls:
 *   - validateFullRelease() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *   - deposit() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *
 * C:\\ file paths in upload helpers omitted (guarded).
 */
export class FullReleaseOfflinePage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Cross-page re-declarations ────────────────────────────────────────────

  // PO_LoginLogout.loc_Profile
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  // Inline branch dropdown
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  // PO15_PartRelease.loc_btnJwellaryReleaseFinalProcess
  private readonly btnJwellaryReleaseFinalProcess = () => this.page.locator("xpath=//span[normalize-space()='Jewellery Release Final Process']");
  // PO16_FullRelease.loc_fullReleaseFinalProcess
  private readonly fullReleaseFinalProcess = () => this.page.locator("xpath=//span[normalize-space()='Final Full Release']");
  // PO16_FullRelease.loc_jwellaryReleaseApproval
  private readonly jwellaryReleaseApproval = () => this.page.locator("xpath=//span[normalize-space()='Jewellery Release Approval']");
  // PO16_FullRelease.loc_fullReleaseApproval
  private readonly fullReleaseApproval = () => this.page.locator("xpath=//span[normalize-space()='Full Release Approval']");
  // PO10_QuickPayment.loc_btnFilter
  private readonly btnFilter = () => this.page.locator("xpath=//span[normalize-space()='Filter']");
  // PO23_PartReleaseOffline.loc_updatebtn
  private readonly updatebtn = () => this.page.locator("xpath=(//button[contains(.,'Update')])[1] ");
  // PO23_PartReleaseOffline.loc_btupdate
  private readonly btupdate = () => this.page.locator("xpath=//span[contains(.,'Update')]");
  // PO15_PartRelease.loc_btnCollect
  private readonly btnCollect = () => this.page.locator("xpath=//button[normalize-space()='Collect']");
  // PO15_PartRelease.loc_customerHomeIn
  private readonly customerHomeIn = () => this.page.locator("xpath=//button[normalize-space()='Customer Home In']");
  // PO15_PartRelease.loc_btnCamera
  private readonly btnCamera = () => this.page.locator("xpath=//i[@class='fas fa-camera']");
  // PO15_PartRelease.loc_btnAttach
  private readonly btnAttach = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");
  // PO08_PacketSubmissionAppraiser locators (re-declared for update())
  private readonly inputField = () => this.page.locator("xpath=//input[@formcontrolname='Barcode']");
  private readonly btnVerify = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']");
  private readonly inputMobileNumber = () => this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly btnOTP = () => this.page.locator("xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']");
  private readonly inputOTP = () => this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnUpdateOTP = () => this.page.locator("xpath=//span[normalize-space()='Update']");
  // PO15_PartRelease.loc_btnUpdte (same XPath as btnUpdateOTP — separate reference for clarity)
  private readonly btnUpdte = () => this.page.locator("xpath=//span[normalize-space()='Update']");

  // ── Actions (from Flow35_FullReleaseOffline.validateFullRelease) ──────────

  /**
   * Port of Java Flow35_FullReleaseOffline.validateFullRelease().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   * NOTE: Flow10_QuickPayment.quikPaymentsuccess() call at start is OMITTED —
   *       precondition handled by createDisbursedLoan() in the spec.
   *
   * Navigates to Funds and Approvals (arrow click), then to Jewellery Release Final Process
   * → Final Full Release → update(). The heavily commented-out approval block is skipped.
   */
  async validateFullRelease(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);

    const element1 = this.page.locator("xpath=//span[normalize-space()='Funds and Approvals']");
    await element1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele1 = this.page.locator("xpath=//span[normalize-space()='Jewellery Release Final Process']");
    await ele1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(2000);
    await this.btnJwellaryReleaseFinalProcess().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.page.waitForTimeout(2000);
    await this.fullReleaseFinalProcess().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.update();
    await this.page.waitForTimeout(2000);
  }

  // ── Actions: update (from Flow35_FullReleaseOffline.update) ──────────────

  /**
   * Port of Java Flow35_FullReleaseOffline.update() (same as PO15/PO16 pattern).
   */
  async update(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    const element = this.btnCollect();
    await element.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element.waitFor({ state: 'visible' });
    await element.click();
    await this.waitForLoaderToDisappear();

    const eleme = this.page.locator("xpath=//div[@class='col-7 d-flex align-items-center']");
    const str1 = (await eleme.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.inputField().fill(str1);

    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.inputMobileNumber().fill(data.accountNumber);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP().fill('1234');
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdateOTP().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(500);
    const element1 = this.customerHomeIn();
    await element1.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await element1.waitFor({ state: 'visible' });
    await element1.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    const elemen = this.page.locator("xpath=//div[@class='col-7 d-flex align-items-center']");
    const strng1 = (await elemen.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.inputField().fill(strng1);

    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.btnCamera().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAttach().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP().fill('1234');
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdateOTP().click();
    await this.waitForLoaderToDisappear();
  }

  // ── Actions (from Flow35_FullReleaseOffline.deposit) ─────────────────────

  /**
   * Port of Java Flow35_FullReleaseOffline.deposit().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Funds and Approvals → Jewellery Release Approval → Full Release Approval,
   * filters Pending, scrolls to Update, marks Completed.
   */
  async deposit(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
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
    await this.fullReleaseApproval().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);
    const selectStatusDropdown = this.page.locator("xpath=//select[@ng-reflect-name='amountStatus']");
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: 'Pending' });

    await this.page.waitForTimeout(2000);
    const filterEl = this.btnFilter();
    await filterEl.evaluate((el: any) => el.scrollIntoView(true));
    filterEl.waitFor({ state: 'visible' });
    await this.page.mouse.dblclick(0, 0); // double-click as in Java (actions.doubleClick)
    // use explicit double click on the element
    const filterRect = await filterEl.boundingBox();
    if (filterRect) {
      await this.page.mouse.dblclick(filterRect.x + filterRect.width / 2, filterRect.y + filterRect.height / 2);
    }
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    const scrollDiv = this.page.locator("xpath=//div[@class='mat-table__wrapper']");
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => { el.scrollLeft = el.scrollWidth; });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press('Home');
    await this.page.waitForTimeout(3000);

    const elee = this.updatebtn();
    await elee.evaluate((el: any) => el.scrollIntoView({ block: 'center' }));
    await elee.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(3000);
    const selectStatusDropdown1 = this.page.locator("xpath=//select[@formcontrolname='amountStatus']");
    await selectStatusDropdown1.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown1.selectOption({ label: 'Completed' });
    await this.page.waitForTimeout(2000);
    await this.btupdate().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }
}
