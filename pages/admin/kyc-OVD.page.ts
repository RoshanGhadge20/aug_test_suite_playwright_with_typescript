import { Locator, Page, expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { KycPage } from "./kyc.page";

export class KycOvdPage extends AdminBasePage {
  private readonly kyc: KycPage;
  private readonly profile: Locator;
  private readonly branchDropdown: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly allCustomers: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly applyKyc: Locator;
  private readonly radiobtnOvdAuto: Locator;
  private readonly ovdNumberField: Locator;
  private readonly btnVerifyOvd: Locator;
  private readonly btnNext: Locator;
  private readonly osvConfirmText: Locator;
  private readonly osvConfirmYes: Locator;

  constructor(page: Page) {
    super(page);
    this.kyc = new KycPage(page);
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.branchDropdown = this.page.locator("xpath=//select[@id='branch']");
    this.customerManagementBtn = this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
    this.allCustomers = this.page.locator(
      "xpath=//span[normalize-space()='All Customers']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.applyKyc = this.page
      .locator("xpath=//button[normalize-space()='Apply KYC']")
      .first();
    this.radiobtnOvdAuto = this.page.locator(".toggle-card", {
      hasText: "OVD (No PAN)",
    });
    this.ovdNumberField = this.page.locator(
      "xpath=//input[@formcontrolname='ovdNumber']",
    );
    this.btnVerifyOvd = this.page
      .locator("xpath=//button[normalize-space()='Verify']")
      .first();
    this.btnNext = this.page.locator("//button[normalize-space()='Next']");
    this.osvConfirmText = this.page
      .locator(
        "xpath=//*[contains(normalize-space(),'Is the OSV done for the customer')]",
      )
      .first();
    this.osvConfirmYes = this.page
      .locator(
        "xpath=//button[normalize-space()='Yes' or .//span[normalize-space()='Yes']]",
      )
      .first();
  }

  async validateAddOvdDlDocumentWithAutoAadhaar(
    aadhaarNumber?: string,
    signaturePath?: string,
    identityDocumentPath?: string,
  ): Promise<void> {
    const aadharNumber = aadhaarNumber ?? this.kyc.randomAadhar();

    await this.page.waitForTimeout(7000);
    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.customerManagementBtn.click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers.click();
    await this.waitForLoaderToDisappear();
    await this.firstNameFilter.fill("Priyanka");
    await this.waitForLoaderToDisappear();
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.applyKyc.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.radiobtnOvdAuto.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    await this.ovdNumberField.fill(
      identityDocumentPath ? identityDocumentPath : this.kyc.randomOvdNumberGenerator(),
    );
    await this.page.waitForTimeout(1000);
    await this.btnVerifyOvd.click({ timeout: 30000 });
    await this.waitForLoaderToDisappear();
    await this.kyc.uploadFileWithValidation(
      identityDocumentPath,
      "xpath=//*[contains(normalize-space(),'Driving Licence Image')]/following::input[@type='file'][1]",
      "Driving Licence",
    );
    await this.kyc.uploadFileWithValidation(
      identityDocumentPath,
      "xpath=//*[contains(normalize-space(),'Form 97')]/following::input[@type='file'][1]",
      "Form 97",
    );
    await this.jsClick(this.btnNext);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    await this.kyc.submitAadhaarForVerification(aadharNumber);
    await this.page.waitForTimeout(5000);

    await this.btnNext.scrollIntoViewIfNeeded();
    await expect(this.btnNext).toBeVisible({ timeout: 15000 });
    await expect(this.btnNext).toBeEnabled({ timeout: 15000 });
    await this.btnNext.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const osvConfirmVisible = await this.osvConfirmText
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (osvConfirmVisible) {
      await this.osvConfirmYes.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);
    }

    await this.kyc.ValidatePersonalDetails(signaturePath, "aadhaar");
    await this.page.waitForTimeout(4000);
    await this.kyc.reviewAndSubmit();
    await this.waitForLoaderToDisappear();
  }
}
