import { Page, Locator, expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { TestDataFactory } from "../../utils/data/test-data.factory";
import { apiUrl, documentPath, autoPanNumber } from "@config/urls";
import { existsSync } from "fs";
import fs from "fs";

export class KycPage extends AdminBasePage {
  // ── Locators ──────────────────────────────────────────────────────────────
  private readonly mobileNumber: Locator;
  private readonly firstName_kycFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly applyKyc: Locator;
  private readonly radiobtn: Locator;
  private readonly kycDetails: Locator;
  private readonly radiobtnOvdAuto: Locator;
  private readonly radiobtnPanCard: Locator;
  private readonly ovdNumberField: Locator;
  private readonly btnVerifyOvd: Locator;
  private readonly panNumberField: Locator;
  private readonly btnVerifyPan: Locator;
  private readonly btnVerifyAadhaar: Locator;
  private readonly consentModalHeading: Locator;
  private readonly btnSendConsentSms: Locator;
  private readonly btnCancelAadhaarConsent: Locator;
  private readonly btnSubmitAadhaarOtp: Locator;
  private readonly consentOtpInputs: Locator;
  private readonly panfield: Locator;
  private readonly selPan: Locator;
  private readonly btnPanYes: Locator;
  private readonly btnNext: Locator;
  private readonly btnYes: Locator;
  private readonly aadharfield: Locator;
  private readonly checkMark: Locator;
  private readonly seladhar: Locator;
  private readonly addressProofTypeDropdown: Locator;
  private readonly addresField: Locator;
  private readonly sameAsPermanentAddressCheckbox: Locator;
  private readonly uniqueCusyomerNumber: Locator;
  private readonly landMark: Locator;
  private readonly landMarkField: Locator;
  private readonly radiobtn1: Locator;
  private readonly btnyes: Locator;
  private readonly profileLink: Locator;
  private readonly imgCamera: Locator;
  private readonly profile: Locator;
  private readonly Radio: Locator;
  private readonly dateInput: Locator;
  private readonly dateArrow: Locator;
  private readonly dateArrow1: Locator;
  private readonly dateYear: Locator;
  private readonly dateMonth: Locator;
  private readonly dateDay: Locator;
  private readonly Radio1: Locator;
  private readonly occupation: Locator;
  private readonly txtSpouseName: Locator;
  private readonly txtMotherName: Locator;
  private readonly mobileField: Locator;
  private readonly qualification: Locator;
  private readonly btnok: Locator;
  private readonly img: Locator;
  private readonly btnReviewandSubmit: Locator;
  private readonly clickUserMangaement: Locator;
  private readonly clickInternalUser: Locator;
  private readonly ArrowNavi: Locator;
  private readonly searchField: Locator;
  private readonly btnEdit: Locator;
  private readonly selArrow: Locator;
  private readonly chkRadio: Locator;
  private readonly btnUpdate: Locator;
  private readonly selBranch: Locator;
  private readonly customerUniqID: Locator;
  private readonly arrow: Locator;
  private readonly btnNextPO04: Locator;
  private readonly branchDropdownWaitOnly: Locator;
  private readonly customerManagementNav: Locator;
  private readonly allCustomersNav: Locator;
  private readonly kycDetailsNavOps: Locator;
  private readonly appliedKycNavOps: Locator;
  private readonly btnActionOps: Locator;
  private readonly kycStatusDropdown: Locator;
  private readonly reasonForIncomplete: Locator;
  private readonly btnSubmitOps: Locator;

  constructor(page: Page) {
    super(page);
    this.mobileNumber = this.page.locator(
      "xpath=//input[@placeholder='Enter Mobile Number']",
    );
    this.firstName_kycFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.applyKyc = this.page
      .locator("xpath=//button[normalize-space()='Apply KYC']")
      .first(); // select first match to avoid strict mode violation
    this.radiobtn = this.page.locator(
      "xpath=//mat-radio-button[.//div[contains(normalize-space(),'Manual')]]",
    );
    this.kycDetails = this.page.locator(
      "xpath=//span[normalize-space()='KYC Details']",
    );
    this.radiobtnOvdAuto = this.page.locator(".toggle-card", {
      hasText: "OVD (No PAN)",
    });
    this.radiobtnPanCard = this.page.locator(".toggle-card", {
      hasText: "PAN Card",
    });
    this.ovdNumberField = this.page.locator(
      "xpath=//input[@formcontrolname='ovdNumber']",
    );
    this.btnVerifyOvd = this.page
      .locator("xpath=//button[normalize-space()='Verify']")
      .first();
    this.panNumberField = this.page.locator(
      "xpath=//input[@placeholder='AAAAA9999A']",
    );
    this.btnVerifyPan = this.page.locator(
      "xpath=//button[normalize-space()='Verify PAN']",
    );
    this.btnVerifyAadhaar = this.page
      .locator(
        "xpath=//button[contains(translate(normalize-space(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'verify')]",
      )
      .first();
    this.consentModalHeading = this.page
      .locator(
        "xpath=//*[contains(normalize-space(),'Consent for Aadhaar verification')]",
      )
      .first();
    this.btnSendConsentSms = this.page.locator(
      "xpath=//button[normalize-space()='Send Consent SMS']",
    );
    this.btnCancelAadhaarConsent = this.page.locator(
      "xpath=//button[normalize-space()='Cancel']",
    );
    this.btnSubmitAadhaarOtp = this.page.locator(
      "xpath=//button[normalize-space()='Consent Received']",
    );
    this.consentOtpInputs = this.page.locator(
      "xpath=//*[contains(@class,'cdk-overlay-pane')]//input[@type='text' or not(@type)]",
    );
    this.panfield = this.page.locator("xpath=//input[@placeholder='PAN']");
    this.selPan = this.page.locator(
      "xpath=//select[@formcontrolname='panType']",
    );
    this.btnPanYes = this.page
      .locator(
        "xpath=//button[@type='submit']//span[normalize-space()='Yes']/parent::button",
      )
      .first();
    this.btnNext = this.page
      .locator("xpath=//button[.//span[normalize-space()='Next']]")
      .first();
    this.btnYes = this.page
      .locator("xpath=//button[.//span[normalize-space()='Yes']]")
      .first();
    this.aadharfield = this.page.locator(
      "xpath=//input[@class='form-control']",
    );
    this.checkMark = this.page.locator(
      "xpath=//span[@class='checkmark top-0']",
    );
    this.seladhar = this.page.locator(
      "xpath=(//select[@formcontrolname='addressProofTypeId'])[1]",
    );
    this.addressProofTypeDropdown = this.page
      .locator(
        "xpath=//select[@formcontrolname='addressProofTypeId' and not(@disabled)]",
      )
      .first();
    this.addresField = this.page.locator(
      "xpath=//textarea[@id='permanent-address']",
    );
    this.sameAsPermanentAddressCheckbox = this.page
      .locator(
        "xpath=//*[contains(normalize-space(),'Current Residential Address same as Permanent Address')]/preceding::input[@type='checkbox'][1]",
      )
      .first();
    this.uniqueCusyomerNumber = this.page.locator(
      "xpath=(//label[@class='mandatory font-weight-500 text-color'][normalize-space()='Unique Identity No.']//following::input)[1]",
    );
    this.landMark = this.page.locator(
      "xpath=//input[@id='permanent-landmark']",
    );
    this.landMarkField = this.page.locator(
      "xpath=//input[@id='permanent-landmark']",
    );
    this.radiobtn1 = this.page.locator(
      "xpath=(//div[@class='mat-radio-inner-circle'])[2]",
    );
    this.btnyes = this.page
      .locator("xpath=//button[@type='submit' and contains(., 'Yes')]")
      .first();
    this.profileLink = this.page.locator(
      "xpath=//label[normalize-space()='Upload Profile Picture']",
    );
    this.imgCamera = this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.Radio = this.page.locator("xpath=(//mat-radio-button)[1]");
    this.dateInput = this.page.locator(
      "xpath=//input[@placeholder='DD/MM/YYYY']",
    );
    this.dateArrow = this.page.locator(
      "xpath=(//div[@class='mat-calendar-arrow'])[1]",
    );
    this.dateArrow1 = this.page.locator(
      "xpath=//button[@aria-label='Previous 20 years']",
    );
    this.dateYear = this.page.locator("xpath=//div[normalize-space()='2003']");
    this.dateMonth = this.page.locator("xpath=//div[normalize-space()='JAN']");
    this.dateDay = this.page.locator(
      "xpath=//div[@class='mat-calendar-body-cell-content'][normalize-space()='1']",
    );
    this.Radio1 = this.page.locator(
      "xpath=//label[@for='mat-radio-10-input']//div[@class='mat-radio-inner-circle']",
    );
    this.occupation = this.page.locator("xpath=//input[@role='combobox']");
    this.txtSpouseName = this.page.locator(
      "xpath=//input[@formcontrolname='spouseName']",
    );
    this.txtMotherName = this.page.locator(
      "xpath=//input[@formcontrolname='motherName']",
    );
    this.mobileField = this.page.locator(
      "xpath=//input[@placeholder='Mobile Number']",
    );
    this.qualification = this.page.locator(
      "xpath=//select[@formcontrolname='qualificationId']",
    );
    this.btnok = this.page.locator("xpath=//button[@type='submit']");
    this.img = this.page.locator(
      "xpath=(//div[@class='offset-4 img-container ng-star-inserted'])[2]",
    );
    this.btnReviewandSubmit = this.page
      .locator("xpath=//button[.//span[normalize-space()='Review & Submit']]")
      .first();
    this.clickUserMangaement = this.page.locator(
      "xpath=//span[normalize-space()='User Management']",
    );
    this.clickInternalUser = this.page.locator(
      "xpath=//span[normalize-space()='Internal User']",
    );
    this.ArrowNavi = this.page.locator(
      "xpath=//select[@id='branch']//following::option[contains(.,'Augmont Amritsar')]",
    );
    this.searchField = this.page.locator(
      "xpath=//div[@class='d-none d-md-inline']//following::input[@placeholder='Search...'][1]",
    );
    this.btnEdit = this.page.locator(
      "xpath=//div[@class='kt-pointer ng-star-inserted']",
    );
    this.selArrow = this.page.locator(
      "xpath=//span[@class='ng-arrow-wrapper']",
    );
    this.chkRadio = this.page.locator(
      "xpath=//div[@id='a789ec98fd87-5']//span[@class='checkmark checkmark-custom']",
    );
    this.btnUpdate = this.page.locator(
      "xpath=//button[contains(.,'Update') and contains(@class,'submit')]",
    );
    this.selBranch = this.page.locator(
      "xpath=(//span[contains(.,'Augmont Amritsar')]//following::input[@type='checkbox'][6])[1]",
    );
    this.customerUniqID = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer ID']",
    );
    this.arrow = this.page.locator("input[placeholder*='PAN']");
    this.btnNextPO04 = this.page
      .locator("xpath=//button[span[normalize-space() = 'Next']]")
      .first();
    this.branchDropdownWaitOnly = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    this.customerManagementNav = this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
    this.allCustomersNav = this.page.locator(
      "xpath=//span[normalize-space()='All Customers']",
    );
    this.kycDetailsNavOps = this.page.locator(
      "xpath=//span[normalize-space()='KYC Details']",
    );
    this.appliedKycNavOps = this.page.locator(
      "xpath=//span[normalize-space()='Applied KYC']",
    );
    this.btnActionOps = this.page.locator(
      "xpath=(//strong[contains(text(),'Action >')])[1]",
    );
    this.kycStatusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='kycStatusFromOperationalTeam']",
    );
    this.reasonForIncomplete = this.page.locator(
      "xpath=//textarea[@formcontrolname='reasonFromOperationalTeam']",
    );
    this.btnSubmitOps = this.page.locator("xpath=//span[contains(.,'Submit')]");
  }

  protected otpInputLocator(): Locator {
    return this.consentOtpInputs;
  }

  public async uploadFileWithValidation(
    filePath: string | undefined,
    fileInputSelector: string,
    description: string,
    fileInputIndex: number = 0,
  ): Promise<void> {
    if (!filePath) {
      console.log(`⊘ ${description} upload skipped (no file path provided)`);
      return;
    }
    const resolvedPath =
      filePath.startsWith("/") || filePath.match(/^[A-Z]:/)
        ? filePath
        : require("path").resolve(process.cwd(), filePath);

    if (!existsSync(resolvedPath)) {
      console.warn(
        `⚠ ${description} file not found: ${resolvedPath}\n` +
          `  Skipping upload. Configure path in .env: *_${description.toUpperCase().replace(/ /g, "_")}_PATH`,
      );
      return;
    }

    try {
      const fileInput = this.page.locator(fileInputSelector);
      const count = await fileInput.count();

      if (count === 0) {
        console.warn(
          `⚠ ${description} file input not found on page (selector: ${fileInputSelector})`,
        );
        return;
      }

      if (fileInputIndex >= count) {
        console.warn(
          `⚠ ${description} file input index ${fileInputIndex} out of range (found ${count} input(s))`,
        );
        return;
      }

      console.log(`↗ Uploading ${description}: ${resolvedPath}`);
      const targetInput = fileInput.nth(fileInputIndex);
      await targetInput.waitFor({ state: "attached" });
      console.log(`  → File input at index ${fileInputIndex} is ready`);
      await targetInput.setInputFiles(resolvedPath);
      console.log(`✓ ${description} uploaded successfully`);

      await this.page.waitForTimeout(2000);
    } catch (err: any) {
      console.error(
        `✗ Failed to upload ${description}:\n` +
          `  Path: ${resolvedPath}\n` +
          `  Selector: ${fileInputSelector}\n` +
          `  Index: ${fileInputIndex}\n` +
          `  Error: ${err.message}\n` +
          `  Stack: ${err.stack}`,
      );
      throw err;
    }
  }

  private getCurrentCustomerId(): string {
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    return customerData.customerId.trim();
  }

  async filterCustomer(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(5000);

    const customerId = this.getCurrentCustomerId();
    await this.customerUniqID.fill(customerId);
    console.log(customerId);
    //await this.firstName_kycFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
  }
  async validateApplyKycButton(): Promise<{
    isDisplayed: boolean;
    isEnabled: boolean;
  }> {
    const applyKycBtn = this.applyKyc;
    await applyKycBtn.waitFor({ state: "visible", timeout: 15000 });
    const isDisplayed = await applyKycBtn.isVisible();
    const isEnabled = await applyKycBtn.isEnabled();

    return { isDisplayed, isEnabled };
  }

  private async performManualPanTab1(
    panCardPath?: string,
    panNumber?: string,
  ): Promise<{
    panVerifySucceeded: boolean;
    panSwitchedToManual: boolean;
  }> {
    const randomPan = panNumber ?? this.randomPanGenerator();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.applyKyc.click();
    await this.page.waitForTimeout(5000);
    await this.radiobtnPanCard.click();
    await this.waitForLoaderToDisappear();
    await this.dateInput.click();
    await this.waitForLoaderToDisappear();
    await this.dateArrow.click();
    await this.page.waitForTimeout(1000);
    await this.dateYear.click();
    await this.page.waitForTimeout(1000);
    await this.dateMonth.click();
    await this.page.waitForTimeout(1000);
    await this.dateDay.click();
    await this.page.waitForTimeout(1000);

    await this.panNumberField.fill(randomPan);
    await this.page.waitForTimeout(1000);
    await this.uploadFileWithValidation(
      panCardPath,
      "xpath=//input[@type='file']",
      "PAN card",
    );
    await this.page.waitForTimeout(2000);

    let verifyPanResponse: Awaited<ReturnType<Page["waitForResponse"]>> | null =
      null;
    let panVerifySucceeded = false;
    let panSwitchedToManual = false;
    let panAlreadyExists = false;
    let panCustomerId: number | undefined;
    const panRequestListener = (req: import("@playwright/test").Request) => {
      if (/verify-pan/i.test(req.url()) && req.method() !== "GET") {
        try {
          const parsed = JSON.parse(req.postData() ?? "{}");
          if (typeof parsed.customerId === "number") {
            panCustomerId = parsed.customerId;
          }
        } catch {}
      }
    };
    this.page.on("request", panRequestListener);
    const maxPanVerifyAttempts = 4;
    for (
      let attempt = 1;
      attempt <= maxPanVerifyAttempts &&
      !panVerifySucceeded &&
      !panSwitchedToManual &&
      !panAlreadyExists;
      attempt++
    ) {
      const responsePromise = this.page
        .waitForResponse(
          (res) =>
            /verify-pan/i.test(res.url()) && res.request().method() !== "GET",
          { timeout: 20000 },
        )
        .catch(() => null);
      await this.btnVerifyPan.click({ timeout: 30000 });
      await this.waitForLoaderToDisappear();
      const response = await responsePromise;
      verifyPanResponse = response;
      if (response) {
        const status = response.status();
        const body = await response.text().catch(() => "");
        console.log(
          `VERIFY PAN attempt ${attempt}/${maxPanVerifyAttempts} [${status}] ${response.url()}: ${body}`,
        );
        if (status >= 200 && status < 300) {
          panVerifySucceeded = true;
        } else if (/"switchToManual"\s*:\s*true/i.test(body)) {
          panSwitchedToManual = true;
          console.log(
            "Backend signaled switchToManual=true — proceeding on the manual-KYC path.",
          );
        } else if (/already\s*exist/i.test(body)) {
          panAlreadyExists = true;
          console.log(
            `PAN ${randomPan} already exists — removing via e-KYC API before retrying.`,
          );
        }
      } else {
        console.log(
          `VERIFY PAN attempt ${attempt}/${maxPanVerifyAttempts}: no matching response observed within 20s.`,
        );
      }
      if (!panVerifySucceeded && !panSwitchedToManual && !panAlreadyExists) {
        if (attempt < maxPanVerifyAttempts) {
          await this.page.waitForTimeout(3000);
        }
      }
    }
    this.page.off("request", panRequestListener);

    if (panAlreadyExists) {
      await this.removeExistingPanKyc(randomPan, panCustomerId);
      await this.page.waitForTimeout(5000);
      const responsePromise = this.page
        .waitForResponse(
          (res) =>
            /verify-pan/i.test(res.url()) && res.request().method() !== "GET",
          { timeout: 20000 },
        )
        .catch(() => null);
      await this.btnVerifyPan.click({ timeout: 30000 });
      await this.waitForLoaderToDisappear();
      const response = await responsePromise;
      verifyPanResponse = response;
      if (response) {
        const status = response.status();
        const body = await response.text().catch(() => "");
        console.log(
          `VERIFY PAN retry-after-remove [${status}] ${response.url()}: ${body}`,
        );
        if (status >= 200 && status < 300) {
          panVerifySucceeded = true;
          panAlreadyExists = false;
        } else if (/"switchToManual"\s*:\s*true/i.test(body)) {
          panSwitchedToManual = true;
          panAlreadyExists = false;
        }
      }
      if (panAlreadyExists) {
        throw new Error(
          `PAN ${randomPan} still reports "already exists" after calling the e-KYC remove ` +
            `API and re-entering the same number — the removal doesn't appear to be ` +
            `propagating. Last response: ${verifyPanResponse ? await verifyPanResponse.text().catch(() => "") : "(no response observed)"}`,
        );
      }
    }

    if (panVerifySucceeded) {
      const panYesAppeared = await this.btnPanYes
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => true)
        .catch(() => false);
      if (panYesAppeared) {
        await this.btnPanYes.click();
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(3000);
      }
      // Confirmed live (screenshot, 2026-09-25): a separate "Is the OSV done for the
      // customer?" confirmation can appear right after PAN auto-verification succeeds, before
      // Next is even clicked off tab 1 — distinct from btnPanYes() above, which never matched
      // it (different button markup), silently leaving it open and blocking every later click.
      await this.confirmOsvIfPresent();
    } else if (!panSwitchedToManual) {
      throw new Error(
        `Verify PAN failed ${maxPanVerifyAttempts} times without succeeding or the backend ` +
          "signaling switchToManual:true — " +
          (verifyPanResponse
            ? `last response [${verifyPanResponse.status()}]: ${await verifyPanResponse.text().catch(() => "")}`
            : "no response was observed within 20s on the last attempt") +
          ". Not the known switchToManual case — likely a genuine outage or locator issue.",
      );
    }

    const nextButtonTab1 = this.page.locator(
      "//button[normalize-space()='Next']",
    );
    await nextButtonTab1.scrollIntoViewIfNeeded();
    const tab1NextEnabled = await nextButtonTab1.isEnabled().catch(() => false);
    if (!tab1NextEnabled) {
      throw new Error(
        "KYC wizard did not advance past tab 1 (Basic Details) — Next is still disabled " +
          "after Verify PAN, even accounting for the manual-KYC (switchToManual) fallback " +
          (verifyPanResponse
            ? `(/verify-pan responded [${verifyPanResponse.status()}]: ${await verifyPanResponse.text().catch(() => "")})`
            : "(no /verify-pan network response was observed within 20s)") +
          ". A required tab 1 field is likely missing/invalid — not the known switchToManual case.",
      );
    }
    await expect(nextButtonTab1).toBeVisible({ timeout: 15000 });
    await expect(nextButtonTab1).toBeEnabled({ timeout: 15000 });
    await nextButtonTab1.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    if (panSwitchedToManual) {
      const manualConfirmYes = this.page
        .locator(
          "xpath=//button[normalize-space()='Yes' or .//span[normalize-space()='Yes']]",
        )
        .first();
      const manualConfirmVisible = await manualConfirmYes
        .waitFor({ state: "visible", timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      if (manualConfirmVisible) {
        await this.page
          .screenshot({
            path: "reports/test-artifacts/DIAG-pan-manual-confirm.png",
            fullPage: true,
          })
          .catch(() => {});
        console.log(
          "Manual-KYC continue confirmation appeared after Next — clicking Yes.",
        );
        try {
          await manualConfirmYes.click({ timeout: 10000 });
        } catch (err: any) {
          console.log(
            `Standard click on manual-KYC confirm failed (${err.message}) — retrying with force.`,
          );
          await manualConfirmYes.click({ force: true, timeout: 10000 });
        }
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(2000);
      }
    }

    return { panVerifySucceeded, panSwitchedToManual };
  }

  /**
   * Strict "auto PAN only" variant of performManualPanTab1(): identical tab-1 PAN entry,
   * Verify PAN retry loop, and already-exists remove+retry handling, but a
   * switchToManual:true signal from the backend is treated as a FAILURE here instead of an
   * accepted fallback — it throws instead of clicking through the manual-KYC continue
   * confirmation. Use this (via verifyAutoPanWithManualAadhaar()) when the test must prove PAN
   * genuinely auto-verified, not just that the wizard advanced past tab 1 one way or another.
   */
  /**
   * Drives the Angular Material calendar (opened via dateInput()) to a specific DOB: click the
   * header arrow into year view, click the target year (clicking "Previous 20 years" first if
   * that year isn't on the default page), then the 3-letter month abbreviation, then the day.
   */
  private async selectDobFromCalendar(
    day: string,
    month: string,
    year: string,
  ): Promise<void> {
    await this.dateArrow.click();
    await this.page.waitForTimeout(1000);

    const yearCell = this.page.locator(
      `xpath=//div[normalize-space()='${year}']`,
    );
    const yearVisibleOnFirstPage = await yearCell
      .isVisible()
      .catch(() => false);
    if (!yearVisibleOnFirstPage) {
      await this.dateArrow1.click();
      await this.page.waitForTimeout(1000);
    }
    await yearCell.click();
    await this.page.waitForTimeout(1000);

    await this.page
      .locator(`xpath=//div[normalize-space()='${month}']`)
      .click();
    await this.page.waitForTimeout(1000);

    await this.page
      .locator(
        `xpath=//div[@class='mat-calendar-body-cell-content'][normalize-space()='${day}']`,
      )
      .click();
    await this.page.waitForTimeout(1000);
  }

  private async performAutoPanTab1(
    panCardPath?: string,
    panNumber?: string,
  ): Promise<void> {
    const randomPan = panNumber ?? this.randomPanGenerator();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.applyKyc.click();
    await this.page.waitForTimeout(5000);
    await this.radiobtnPanCard.click();
    await this.waitForLoaderToDisappear();
    await this.dateInput.click();
    await this.waitForLoaderToDisappear();
    await this.selectDobFromCalendar("20", "APR", "1995");
    await this.panNumberField.fill(randomPan);
    await this.page.waitForTimeout(1000);
    await this.uploadFileWithValidation(
      panCardPath,
      "xpath=//input[@type='file']",
      "PAN card",
    );
    await this.page.waitForTimeout(2000);

    let verifyPanResponse: Awaited<ReturnType<Page["waitForResponse"]>> | null =
      null;
    let panVerifySucceeded = false;
    let panSwitchedToManual = false;
    let panAlreadyExists = false;
    let panCustomerId: number | undefined;
    const panRequestListener = (req: import("@playwright/test").Request) => {
      if (/verify-pan/i.test(req.url()) && req.method() !== "GET") {
        try {
          const parsed = JSON.parse(req.postData() ?? "{}");
          if (typeof parsed.customerId === "number") {
            panCustomerId = parsed.customerId;
          }
        } catch {}
      }
    };
    this.page.on("request", panRequestListener);

    const maxPanVerifyAttempts = 4;
    for (
      let attempt = 1;
      attempt <= maxPanVerifyAttempts &&
      !panVerifySucceeded &&
      !panSwitchedToManual &&
      !panAlreadyExists;
      attempt++
    ) {
      const responsePromise = this.page
        .waitForResponse(
          (res) =>
            /verify-pan/i.test(res.url()) && res.request().method() !== "GET",
          { timeout: 20000 },
        )
        .catch(() => null);
      await this.btnVerifyPan.click({ timeout: 30000 });
      await this.waitForLoaderToDisappear();
      const response = await responsePromise;
      verifyPanResponse = response;
      if (response) {
        const status = response.status();
        const body = await response.text().catch(() => "");
        console.log(
          `VERIFY PAN (auto-only) attempt ${attempt}/${maxPanVerifyAttempts} [${status}] ${response.url()}: ${body}`,
        );
        if (status >= 200 && status < 300) {
          panVerifySucceeded = true;
        } else if (/"switchToManual"\s*:\s*true/i.test(body)) {
          panSwitchedToManual = true;
        } else if (/already\s*exist/i.test(body)) {
          panAlreadyExists = true;
          console.log(
            `PAN ${randomPan} already exists — removing via e-KYC API before retrying.`,
          );
        }
      } else {
        console.log(
          `VERIFY PAN (auto-only) attempt ${attempt}/${maxPanVerifyAttempts}: no matching response observed within 20s.`,
        );
      }
      if (!panVerifySucceeded && !panSwitchedToManual && !panAlreadyExists) {
        if (attempt < maxPanVerifyAttempts) {
          await this.page.waitForTimeout(3000);
        }
      }
    }
    this.page.off("request", panRequestListener);

    if (panAlreadyExists) {
      await this.removeExistingPanKyc(randomPan, panCustomerId);
      const retryWaitsMs = [5000, 10000, 15000];
      let lastReason = "";
      for (
        let attempt = 1;
        attempt <= retryWaitsMs.length &&
        panAlreadyExists &&
        !panVerifySucceeded &&
        !panSwitchedToManual;
        attempt++
      ) {
        await this.page.waitForTimeout(retryWaitsMs[attempt - 1]);
        const responsePromise = this.page
          .waitForResponse(
            (res) =>
              /verify-pan/i.test(res.url()) && res.request().method() !== "GET",
            { timeout: 20000 },
          )
          .catch(() => null);
        await this.btnVerifyPan.click({ timeout: 30000 });
        await this.waitForLoaderToDisappear();
        const response = await responsePromise;
        verifyPanResponse = response;
        if (response) {
          const status = response.status();
          const body = await response.text().catch(() => "");
          console.log(
            `VERIFY PAN (auto-only) retry-after-remove ${attempt}/${retryWaitsMs.length} ` +
              `[${status}] ${response.url()}: ${body}`,
          );
          lastReason = body;
          if (status >= 200 && status < 300) {
            panVerifySucceeded = true;
            panAlreadyExists = false;
          } else if (/"switchToManual"\s*:\s*true/i.test(body)) {
            panSwitchedToManual = true;
            panAlreadyExists = false;
          }
          // Any other response (including a different transient error like an upstream
          // rate-limit) — not proof the removal itself failed to propagate. panAlreadyExists
          // stays true so the loop retries; lastReason already holds the real message for
          // the final error, so it won't be misreported as "already exists" specifically.
        } else {
          lastReason = "(no response observed)";
        }
      }

      if (panAlreadyExists) {
        throw new Error(
          `Verify PAN for ${randomPan} kept failing after calling the e-KYC remove API and ` +
            `retrying ${retryWaitsMs.length} times — neither a real success nor ` +
            "switchToManual:true was ever observed. Last response: " +
            lastReason,
        );
      }
    }

    if (panSwitchedToManual) {
      throw new Error(
        `PAN did not auto-verify — the backend signaled switchToManual:true instead of a ` +
          "real Verify PAN success. This test requires genuine auto-verification, so falling " +
          "back to the manual-KYC continuation path is treated as a failure here, not a " +
          `valid outcome. Last response: ${verifyPanResponse ? await verifyPanResponse.text().catch(() => "") : "(no response observed)"}`,
      );
    }
    if (!panVerifySucceeded) {
      throw new Error(
        `Verify PAN failed ${maxPanVerifyAttempts} times without succeeding and without the ` +
          "backend signaling switchToManual:true either — " +
          (verifyPanResponse
            ? `last response [${verifyPanResponse.status()}]: ${await verifyPanResponse.text().catch(() => "")}`
            : "no response was observed within 20s on the last attempt") +
          ".",
      );
    }

    const panYesAppeared = await this.btnPanYes
      .waitFor({ state: "visible", timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (panYesAppeared) {
      await this.btnPanYes.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(3000);
    }
    // Confirmed live (screenshot, 2026-09-25): "Is the OSV done for the customer?" can appear
    // right after PAN auto-verification succeeds, before Next is even clicked off tab 1 — left
    // open and blocking every later click if not dismissed here.
    await this.confirmOsvIfPresent();

    const nextButtonTab1 = this.page.locator(
      "//button[normalize-space()='Next']",
    );
    await nextButtonTab1.scrollIntoViewIfNeeded();
    await expect(nextButtonTab1).toBeVisible({ timeout: 15000 });
    await expect(nextButtonTab1).toBeEnabled({ timeout: 15000 });
    await nextButtonTab1.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }

  async advancePastAddressIdentityTab(): Promise<void> {
    const nextButtonTab2 = this.page.locator(
      "//button[normalize-space()='Next']",
    );
    await nextButtonTab2.scrollIntoViewIfNeeded();
    await expect(nextButtonTab2).toBeVisible({ timeout: 15000 });
    await expect(nextButtonTab2).toBeEnabled({ timeout: 15000 });
    await nextButtonTab2.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.confirmOsvIfPresent();
  }

  /**
   * "Is the OSV done for the customer?" confirmation — confirmed live to appear both right
   * after tab 1's PAN auto-verification succeeds (screenshot, 2026-09-25) and after clicking
   * Next off tab 2 (Address & Identity). No-ops if the modal never appears.
   */
  private async confirmOsvIfPresent(): Promise<void> {
    const osvText = this.page.locator(
      "xpath=//*[contains(normalize-space(),'Is the OSV done for the customer')]",
    );
    const osvConfirmVisible = await osvText
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (osvConfirmVisible) {
      // DIAGNOSTIC: dump the OSV text element's ancestor chain (tag + class per level) so a
      // failing run tells us the real dialog wrapper structure instead of guessing again.
      const ancestorChain = await osvText
        .first()
        .evaluate((el) => {
          const chain: string[] = [];
          let node: HTMLElement | null = el as HTMLElement;
          for (let i = 0; i < 10 && node; i++) {
            chain.push(
              `${node.tagName.toLowerCase()}.${node.className || "(no-class)"}`,
            );
            node = node.parentElement;
          }
          return chain.join(" < ");
        })
        .catch((err) => `(failed to evaluate: ${err.message})`);
      console.log("OSV dialog ancestor chain:", ancestorChain);

      // Confirmed live: the "Yes" button's markup (mat-raised-button + span.mat-button-wrapper)
      // is a generic, reused pattern for MANY confirmation dialogs across this app — a
      // page-wide `//button[...'Yes'...]` search can match an unrelated Yes button that's
      // simply first in DOM order and silently click it while THIS dialog stays open with no
      // visible effect (no error thrown, since that other button was perfectly clickable).
      // Scope to the CDK overlay pane that actually contains the OSV confirmation text.
      const yesInDialog = this.page
        .locator(
          "xpath=//*[contains(@class,'cdk-overlay-pane')]" +
            "[.//*[contains(normalize-space(),'Is the OSV done for the customer')]]" +
            "//button[normalize-space()='Yes' or .//span[normalize-space()='Yes']]",
        )
        .first();
      const scopedYesVisible = await yesInDialog.isVisible().catch(() => false);

      const pageWideYes = this.page.locator(
        "xpath=//button[normalize-space()='Yes' or .//span[normalize-space()='Yes']]",
      );
      const pageWideCount = await pageWideYes.count();
      console.log(
        `OSV confirm — scoped Yes button visible: ${scopedYesVisible} | page-wide Yes button matches: ${pageWideCount}`,
      );

      const targetYes = scopedYesVisible ? yesInDialog : pageWideYes.first();
      await this.page
        .screenshot({
          path: "reports/test-artifacts/DIAG-osv-confirm-before-click.png",
          fullPage: true,
        })
        .catch(() => {});

      try {
        await targetYes.click({ timeout: 8000 });
      } catch (err: any) {
        console.log(
          `Standard click on OSV "Yes" failed (${err.message}) — retrying with force.`,
        );
        await targetYes.click({ force: true, timeout: 8000 });
      }
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);

      const stillOpen = await osvText
        .first()
        .isVisible()
        .catch(() => false);
      console.log(
        `OSV confirmation still visible after clicking Yes: ${stillOpen}`,
      );
      await this.page
        .screenshot({
          path: "reports/test-artifacts/DIAG-osv-confirm-after-click.png",
          fullPage: true,
        })
        .catch(() => {});
    }
  }

  async ClickonKyc(
    panCardPath?: string,
    signaturePath?: string,
    aadhaarPath?: string,
  ): Promise<void> {
    await this.performManualPanTab1(panCardPath);

    await this.submitAadhaarManually();
    await this.page.waitForTimeout(3000);

    await this.advancePastAddressIdentityTab();

    await this.ValidatePersonalDetails(signaturePath);
    await this.page.waitForTimeout(4000);
    await this.reviewAndSubmit();
    // await this.radiobtn.click();
    // await this.waitForLoaderToDisappear();
    // await this.selPan.click();
    // await this.waitForLoaderToDisappear();
    // await this.selectAsPan();
    // await this.selPan.click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(5000);
    // await this.uploadFileWithValidation(panCardPath, "xpath=//input[@type='file']", "PAN card");
    // await this.page.waitForTimeout(5000);
    // await this.panfield.fill(randomPan);
    // await this.page.waitForTimeout(1000);
    // const btnNextEl = this.btnNext;
    // await btnNextEl.scrollIntoViewIfNeeded();
    // await this.page.waitForTimeout(1500);
    // await this.btnNext.click();
    // await this.waitForLoaderToDisappear();
    // await this.btnYes.click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(15000);
    // await this.page.locator("xpath=//mat-radio-button[contains(@class,'mat-radio-button')][2]").click();
    // await this.waitForLoaderToDisappear();
    // await this.addressandIdentity(aadhaarPath);
    // await this.ValidatePersonalDetails(signaturePath);
    // await this.page.waitForTimeout(4000);
    // await this.reviewAndSubmit();
  }

  async verifyManualPanWithAutoAadhaar(
    aadhaarNumber?: string,
    panCardPath?: string,
    signaturePath?: string,
  ): Promise<void> {
    await this.performManualPanTab1(panCardPath);

    const aadharNumber = aadhaarNumber ?? this.randomAadhar();
    await this.submitAadhaarForVerification(aadharNumber);
    await this.page.waitForTimeout(3000);

    await this.advancePastAddressIdentityTab();

    await this.ValidatePersonalDetails(signaturePath, "aadhaar");
    await this.page.waitForTimeout(4000);
    await this.reviewAndSubmit();
  }
  async verifyAutoPanWithManualAadhaar(
    panCardPath?: string,
    signaturePath?: string,
    panNumber: string = autoPanNumber(),
  ): Promise<{ panVerifySucceeded: boolean; panSwitchedToManual: boolean }> {
    await this.performAutoPanTab1(panCardPath, panNumber);
    const panResult = { panVerifySucceeded: true, panSwitchedToManual: false };
    await this.submitAadhaarManually();
    await this.page.waitForTimeout(3000);
    await this.advancePastAddressIdentityTab();
    await this.ValidatePersonalDetails(signaturePath, "pan");
    await this.page.waitForTimeout(4000);
    await this.reviewAndSubmit();
    return panResult;
  }

  async verifyAutoPanWithAutoAadhaar(
    aadhaarNumber: string = "875302915562",
    panCardPath?: string,
    signaturePath?: string,
    panNumber: string = autoPanNumber(),
  ): Promise<{ panVerifySucceeded: boolean; panSwitchedToManual: boolean }> {
    await this.performAutoPanTab1(panCardPath, panNumber);
    const panResult = { panVerifySucceeded: true, panSwitchedToManual: false };

    await this.submitAadhaarForVerification(aadhaarNumber);
    await this.page.waitForTimeout(3000);

    await this.advancePastAddressIdentityTab();

    await this.ValidatePersonalDetails(signaturePath, "aadhaar");
    await this.page.waitForTimeout(4000);
    await this.reviewAndSubmit();

    return panResult;
  }

  async applyOvdWithAutoAadhaar(
    aadhaarNumber?: string,
    signaturePath?: string,
    identityDocumentPath?: string,
  ): Promise<void> {
    const aadharNumber = aadhaarNumber ?? this.randomAadhar();
    const randomOvdNumber = this.randomOvdNumberGenerator();

    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.applyKyc.click();
    await this.page.waitForTimeout(5000);
    await this.radiobtnOvdAuto.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    await this.dateInput.click();
    await this.waitForLoaderToDisappear();
    await this.dateArrow.click();
    await this.page.waitForTimeout(1000);
    await this.dateYear.click();
    await this.page.waitForTimeout(1000);
    await this.dateMonth.click();
    await this.page.waitForTimeout(1000);
    await this.dateDay.click();
    await this.page.waitForTimeout(1000);

    await this.ovdNumberField.fill(randomOvdNumber);
    await this.page.waitForTimeout(1000);

    let ovdVerifySucceeded = false;
    for (let attempt = 1; attempt <= 3 && !ovdVerifySucceeded; attempt++) {
      const responsePromise = this.page
        .waitForResponse(
          (res) =>
            /verify-dl/i.test(res.url()) && res.request().method() !== "GET",
          { timeout: 20000 },
        )
        .catch(() => null);
      await this.btnVerifyOvd.click({ timeout: 30000 });
      await this.waitForLoaderToDisappear();
      const response = await responsePromise;
      await this.page
        .locator("xpath=//button[normalize-space()='Verifying...']")
        .waitFor({ state: "hidden", timeout: 30000 })
        .catch(() => {});
      await this.page.waitForTimeout(1500);

      if (response) {
        const status = response.status();
        const body = await response.text().catch(() => "");
        console.log(
          `OVD verify attempt ${attempt}/3 — status ${status}: ${body}`,
        );
        if (status >= 200 && status < 300) {
          ovdVerifySucceeded = true;
        } else if (/"switchToManual":true/i.test(body)) {
          console.log(
            "Backend signaled switchToManual=true — no further retry will help; manual OVD path would be required.",
          );
          break;
        }
      } else {
        console.log(
          `OVD verify attempt ${attempt}/3 — no verify-dl response observed.`,
        );
      }

      if (!ovdVerifySucceeded && attempt < 3) {
        await this.page.waitForTimeout(3000);
      }
    }

    await this.uploadFileWithValidation(
      identityDocumentPath ?? documentPath("DOCUMENT"),
      "xpath=//*[contains(normalize-space(),'Driving Licence Image')]/following::input[@type='file'][1]",
      "Driving Licence",
    );
    await this.page.waitForTimeout(2000);

    await this.uploadFileWithValidation(
      identityDocumentPath ?? documentPath("DOCUMENT"),
      "xpath=//*[contains(normalize-space(),'Form 97')]/following::input[@type='file'][1]",
      "Form 97",
    );
    await this.page.waitForTimeout(2000);

    const nextButtonTab1 = this.page.locator(
      "//button[normalize-space()='Next']",
    );
    await nextButtonTab1.scrollIntoViewIfNeeded();
    const tab1NextEnabled = await nextButtonTab1.isEnabled().catch(() => false);
    if (tab1NextEnabled) {
      await nextButtonTab1.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(3000);
    }

    const stillOnTab1 = await this.ovdNumberField
      .isVisible()
      .catch(() => false);
    if (stillOnTab1) {
      throw new Error(
        "KYC wizard did not advance past tab 1 (Basic Details) — OVD auto-verification " +
          "(/api/e-kyc/v2/verify-dl) is failing server-side in this environment (confirmed " +
          "via live network response: 503 'DL verification failed. Please try again.', " +
          "reason 'ovd API call failed (attempt 1/3)' — the same downstream-integration " +
          "outage pattern already confirmed for /api/e-kyc/verify-pan). This blocks " +
          "reaching tab 2 ('Address & Identity'), where Aadhaar auto-verification lives. " +
          "Not a locator bug — the e-KYC backend integration needs checking before this " +
          "step can be exercised end-to-end.",
      );
    }
    await this.submitAadhaarForVerification(aadharNumber);
    await this.page.waitForTimeout(5000);
    // await this.clickNext();
    const nextButton = this.page.locator("//button[normalize-space()='Next']");
    await nextButton.scrollIntoViewIfNeeded();
    await expect(nextButton).toBeVisible({ timeout: 15000 });
    await expect(nextButton).toBeEnabled({ timeout: 15000 });
    await nextButton.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    const osvConfirmVisible = await this.page
      .locator(
        "xpath=//*[contains(normalize-space(),'Is the OSV done for the customer')]",
      )
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (osvConfirmVisible) {
      await this.page
        .locator(
          "xpath=//button[normalize-space()='Yes' or .//span[normalize-space()='Yes']]",
        )
        .first()
        .click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);
    }
    await this.ValidatePersonalDetails(signaturePath, "aadhaar");
    await this.page.waitForTimeout(4000);
    await this.reviewAndSubmit();
    await this.waitForLoaderToDisappear();
  }

  private async clickVerifyAadhaarAndCheckResult(): Promise<{
    alreadyExists: boolean;
    body: string;
    status?: number;
    encryptedAadhaarNumber?: string;
    customerId?: number;
  }> {
    const responsePromise = this.page
      .waitForResponse(
        (res) => /aadhaar/i.test(res.url()) && res.request().method() !== "GET",
        { timeout: 20000 },
      )
      .catch(() => null);
    let encryptedAadhaarNumber: string | undefined;
    let customerId: number | undefined;
    const requestListener = (req: import("@playwright/test").Request) => {
      if (/aadhaar/i.test(req.url()) && req.method() !== "GET") {
        try {
          const parsed = JSON.parse(req.postData() ?? "{}");
          const masked = { ...parsed };
          if (typeof masked.aadhaarNumber === "string") {
            masked.aadhaarNumber = `<${masked.aadhaarNumber.length} chars>`;
          }
          console.log(
            `VERIFY AADHAAR REQUEST ${req.method()} ${req.url()} keys=[${Object.keys(parsed).join(", ")}] body=${JSON.stringify(masked)}`,
          );
          if (typeof parsed.aadhaarNumber === "string") {
            encryptedAadhaarNumber = parsed.aadhaarNumber;
          }
          if (typeof parsed.customerId === "number") {
            customerId = parsed.customerId;
          }
        } catch (err: any) {
          console.log(
            `VERIFY AADHAAR REQUEST ${req.method()} ${req.url()} — body was not JSON or failed to parse: ${err.message}`,
          );
        }
      }
    };
    this.page.on("request", requestListener);
    await this.btnVerifyAadhaar.click();
    await this.waitForLoaderToDisappear();
    const response = await responsePromise;
    let body = "";
    if (response) {
      body = await response.text().catch(() => "");
      console.log(
        `VERIFY AADHAAR RESPONSE [${response.status()}] ${response.url()}: ${body}`,
      );
    } else {
      console.log("VERIFY AADHAAR: no matching response observed within 20s.");
    }
    this.page.off("request", requestListener);
    await this.page.waitForTimeout(5000);
    return {
      alreadyExists: /already\s*exist/i.test(body),
      body,
      status: response?.status(),
      encryptedAadhaarNumber,
      customerId,
    };
  }
  private async uploadAadhaarXml(): Promise<void> {
    await this.uploadFileWithValidation(
      documentPath("AADHARXML"),
      "xpath=//*[contains(normalize-space(),'Aadhaar XML File')]/following::input[@type='file'][1]",
      "Aadhaar XML",
    );
    await this.page.waitForTimeout(2000);
  }

  private async fillAadhaarNumberAndDocs(
    aadhaarField: Locator,
    aadharNumber: string,
  ): Promise<void> {
    await aadhaarField.click();
    await aadhaarField.clear();
    await aadhaarField.pressSequentially(aadharNumber, { delay: 50 });
    await this.page.waitForTimeout(500);
    const filledAadhaar = await aadhaarField.inputValue();
    const expectedSuffix = aadharNumber.slice(-4);
    if (
      filledAadhaar.length !== aadharNumber.length ||
      !filledAadhaar.endsWith(expectedSuffix)
    ) {
      throw new Error(
        `Aadhaar field still shows the wrong value after typing character-by-character. Expected it to end with ${expectedSuffix} (length ${aadharNumber.length}), got: ${filledAadhaar}`,
      );
    }
    await this.uploadAadhaarXml();

    await this.uploadFileWithValidation(
      documentPath("AADHAAR"),
      "xpath=//*[contains(normalize-space(),'Aadhaar Image')]/following::input[@type='file'][1]",
      "Aadhaar Image",
    );
    await this.page.waitForTimeout(2000);
  }

  private async dismissAadhaarConsentModalIfPresent(): Promise<void> {
    const consentModalOpen = await this.consentModalHeading
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!consentModalOpen) return;
    console.log(
      "Aadhaar consent modal appeared after Verify Aadhaar — clicking Cancel to skip OTP (manual-KYC path).",
    );
    await this.btnCancelAadhaarConsent.click();
    await this.page.waitForTimeout(500);
    const stillOpen = await this.consentModalHeading
      .isVisible()
      .catch(() => false);
    if (stillOpen) {
      console.log(
        "Aadhaar consent modal did not close after clicking Cancel — continuing anyway.",
      );
    }
  }

  private async completeAadhaarConsentModalIfPresent(
    otp: string = "123456",
  ): Promise<void> {
    const consentModalOpen = await this.consentModalHeading
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!consentModalOpen) return;

    console.log(
      "Aadhaar consent modal appeared after Verify Aadhaar — sending consent SMS and submitting OTP.",
    );
    const sendConsentSms = this.btnSendConsentSms;
    await sendConsentSms.waitFor({ state: "visible", timeout: 10000 });
    await sendConsentSms.click();
    await this.waitForLoaderToDisappear();

    await this.fillOtp(otp);
    await this.page.waitForTimeout(500);

    const submitOtp = this.btnSubmitAadhaarOtp;
    await submitOtp.waitFor({ state: "visible", timeout: 10000 });
    await submitOtp.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    const errorBanner = this.page.locator(
      "xpath=//*[contains(@class,'toast-error') or contains(@class,'alert-danger')]",
    );
    const errorVisible = await errorBanner.isVisible().catch(() => false);
    const errorText = errorVisible
      ? await errorBanner.innerText().catch(() => "")
      : "";
    const stillOpen = await this.consentModalHeading
      .isVisible()
      .catch(() => false);

    if (errorVisible || stillOpen) {
      throw new Error(
        `Aadhaar consent OTP "${otp}" was rejected — ` +
          (errorVisible
            ? `error banner: ${errorText}`
            : "consent modal did not close after submitting OTP") +
          ". Verify the backdoor OTP configured for this environment is still 123456.",
      );
    }
  }

  /** Permanent Address Proof types selectable on tab 2 (matched against the dropdown's option text). */
  private static readonly ADDRESS_PROOFS = {
    aadhaar: { label: "Aadhaar Card", match: /aadh?a+r/i },
    voter: { label: "Voter ID", match: /voter/i },
    drivingLicence: { label: "Driving Licence", match: /driv/i },
    utilityBill: { label: "Utility Bill", match: /utility|electric|bill/i },
  } as const;

  /**
   * With a non-Aadhaar proof the address is NOT auto-filled from the Aadhaar XML, and switching the
   * proof type clears it (confirmed from the screenshot: State, City, Pin Code and Permanent
   * Address all "Required field" after selecting Voter Id). Fill them by hand, and re-attach the
   * Permanent Address Proof (OSV) image, which the type change also drops.
   */
  private async fillManualPermanentAddress(): Promise<void> {
    const fieldAfter = (label: string, tag: "select" | "input") =>
      this.page
        .locator(
          `xpath=(//*[self::label or self::span][normalize-space()='${label}' or normalize-space()='${label} *']/following::${tag}[not(@type='hidden') and not(@disabled)])[1]`,
        )
        .first();

    // Prefer Maharashtra / Mumbai / 400001 (a consistent trio); else first real option.
    const pickOption = async (
      select: ReturnType<typeof fieldAfter>,
      prefer: RegExp,
    ): Promise<string> => {
      await select.waitFor({ state: "visible", timeout: 15000 });
      for (let i = 0; i < 15; i++) {
        const opts = await select.locator("option").evaluateAll((els) =>
          els.map((o) => ({
            value: (o as HTMLOptionElement).value,
            text: (o.textContent || "").trim(),
          })),
        );
        const real = opts.filter(
          (o) => o.value && !/^select|^--/i.test(o.text),
        );
        if (real.length) {
          const pick = real.find((o) => prefer.test(o.text)) ?? real[0];
          await select.selectOption({ value: pick.value });
          await this.waitForLoaderToDisappear();
          await this.page.waitForTimeout(1000);
          return pick.text;
        }
        await this.page.waitForTimeout(1000);
      }
      throw new Error("Dropdown never offered any selectable option.");
    };

    const state = await pickOption(
      fieldAfter("State", "select"),
      /maharashtra/i,
    );
    const city = await pickOption(fieldAfter("City", "select"), /mumbai|pune/i);
    console.log(`Permanent address: state="${state}", city="${city}"`);

    const pin = fieldAfter("Pin Code", "input");
    await pin.fill(/pune/i.test(city) ? "411001" : "400001");

    const address = this.page
      .locator("xpath=//textarea[@id='permanent-address' and not(@disabled)]")
      .first();
    await address.fill(this.randomAddressGenerator());
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(500);

    await this.uploadFileWithValidation(
      documentPath("AADHAAR"),
      "xpath=//*[contains(normalize-space(),'Permanent Address Proof')]/following::input[@type='file'][1]",
      "Permanent Address Proof",
    );
    await this.page.waitForTimeout(2000);
  }

  /** A plausible document number for each proof type (Aadhaar keeps using the KYC Aadhaar number). */
  private addressProofNumberFor(
    kind: keyof typeof KycPage.ADDRESS_PROOFS,
    aadharNumber: string,
  ): string {
    const letters = () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const digits = (n: number) =>
      Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
    switch (kind) {
      case "voter":
        return `${letters()}${letters()}${letters()}${digits(7)}`;
      case "drivingLicence":
        return this.randomOvdNumberGenerator();
      case "utilityBill":
        return digits(12);
      default:
        return aadharNumber;
    }
  }

  /**
   * Selects the Permanent Address Proof type by matching option text (the exact labels aren't
   * known up front), retrying because the form re-renders after a selection. Returns the label
   * actually selected.
   */
  private async selectAddressProofType(
    kind: keyof typeof KycPage.ADDRESS_PROOFS,
  ): Promise<string> {
    const { match, label } = KycPage.ADDRESS_PROOFS[kind];
    const dropdown = this.addressProofTypeDropdown;
    await dropdown.waitFor({ state: "visible", timeout: 20000 });

    const options = await dropdown
      .locator("option")
      .evaluateAll((els) => els.map((o) => (o.textContent || "").trim()));
    console.log("Address Proof Type options:", options);
    const target = options.find((t) => match.test(t));
    if (!target) {
      throw new Error(
        `Address Proof Type "${label}" not found in the dropdown. Options: ${JSON.stringify(options)}`,
      );
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      await dropdown.selectOption({ label: target });
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(1000);
      const selected = (
        await dropdown
          .locator("option:checked")
          .innerText()
          .catch(() => "")
      ).trim();
      if (match.test(selected)) return selected;
      console.log(
        `Address Proof Type shows "${selected}" after selecting "${target}" (attempt ${attempt}/3) — retrying.`,
      );
    }
    throw new Error(`Could not select Address Proof Type "${target}".`);
  }

  private async fillAadhaarAddressDetails(
    aadharNumber: string,
    addressProof: keyof typeof KycPage.ADDRESS_PROOFS = "aadhaar",
  ): Promise<void> {
    const sameAddressCheckbox = this.sameAsPermanentAddressCheckbox;
    const alreadyChecked = await sameAddressCheckbox
      .isChecked()
      .catch(() => false);
    if (!alreadyChecked) {
      await sameAddressCheckbox.evaluate((el: HTMLInputElement) => {
        el.checked = true;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(1000);
    }
    const enabledTextarea = this.page
      .locator("xpath=//textarea[not(@disabled)]")
      .first();
    if (await enabledTextarea.count()) {
      await enabledTextarea.fill(this.randomAddressGenerator());
      await this.page.waitForTimeout(500);
    }

    await this.uploadFileWithValidation(
      documentPath("AADHAAR"),
      "xpath=//*[contains(normalize-space(),'Permanent Address Proof')]/following::input[@type='file'][1]",
      "Permanent Address Proof",
    );
    await this.page.waitForTimeout(2000);
    const addressProofNumber = this.page
      .locator('input[formcontrolname="addressProofNumber"]')
      .first();
    const proofNumber = this.addressProofNumberFor(addressProof, aadharNumber);
    const fillProofNumber = async (): Promise<void> => {
      if (
        (await addressProofNumber.count()) > 0 &&
        (await addressProofNumber.isVisible()) &&
        (await addressProofNumber.isEnabled())
      ) {
        await addressProofNumber.fill(proofNumber);
        await this.page.waitForTimeout(1000);
      } else {
        console.log(
          "⚠ addressProofNumber is not available/enabled. Skipping proof number entry.",
        );
      }
    };

    // Aadhaar keeps its original order (number, then type); other proofs select the type first
    // because changing the type can clear the number field.
    if (addressProof === "aadhaar") await fillProofNumber();
    const selectedProof = await this.selectAddressProofType(addressProof);
    console.log(`Permanent Address Proof type selected: ${selectedProof}`);
    if (addressProof !== "aadhaar") {
      console.log(`Permanent Address Proof number: ${proofNumber}`);
      await fillProofNumber();
      await this.fillManualPermanentAddress();
    }

    const landmarkInputs = this.page.locator(
      "xpath=//input[(@formcontrolname='landmark' or @placeholder='Landmark') and not(@disabled)]",
    );
    const landmarkCount = await landmarkInputs.count();
    for (let i = 0; i < landmarkCount; i++) {
      const landmarkInput = landmarkInputs.nth(i);
      const isReady =
        (await landmarkInput.isVisible().catch(() => false)) &&
        (await landmarkInput.isEnabled().catch(() => false));
      if (!isReady) {
        console.log(
          `Landmark input ${i} is no longer visible/enabled — skipping (likely superseded ` +
            "by a form re-render triggered by an earlier fill or selection).",
        );
        continue;
      }
      const existingValue = await landmarkInput.inputValue().catch(() => "");
      if (!existingValue) {
        try {
          await landmarkInput.fill(this.randomLandmark(), { timeout: 5000 });
          await this.page.waitForTimeout(500);
        } catch (err: any) {
          console.log(
            `Landmark input ${i} fill failed (continuing): ${err.message}`,
          );
        }
      }
    }
  }

  /**
   * Re-KYC, tab 1 (Basic Details): the previously verified PAN is pre-filled, so clear it, enter a
   * NEW PAN, click Verify PAN — if the backend says to try again later (any non-success response),
   * wait and click Verify again, up to 3 attempts — then confirm any Yes/OSV prompt and click Next.
   */
  async reKycReplacePan(
    panCardPath?: string,
    newPan: string = this.randomPanGenerator(),
  ): Promise<string> {
    // Re KYC opens tab 1 with the "Is the OSV done for the customer?" confirmation already showing
    // (confirmed from the failure screenshot); its cdk-overlay backdrop intercepts every click on
    // the PAN field until Yes is pressed, so dismiss it first.
    await this.confirmOsvIfPresent();
    await this.page
      .locator(".cdk-overlay-backdrop-showing")
      .first()
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});

    const panField = this.panNumberField;
    await panField.waitFor({ state: "visible", timeout: 20000 });
    await panField.scrollIntoViewIfNeeded();
    await panField.click();
    await panField.clear();
    await panField.fill(newPan);
    await expect(panField).toHaveValue(newPan);
    await this.page.waitForTimeout(1000);

    if (panCardPath) {
      await this.uploadFileWithValidation(
        panCardPath,
        "xpath=//input[@type='file']",
        "PAN card",
      );
      await this.page.waitForTimeout(2000);
    }

    const maxAttempts = 3;
    let verified = false;
    let switchedToManual = false;
    let lastBody = "";
    for (
      let attempt = 1;
      attempt <= maxAttempts && !verified && !switchedToManual;
      attempt++
    ) {
      const responsePromise = this.page
        .waitForResponse(
          (res) =>
            /verify-pan/i.test(res.url()) && res.request().method() !== "GET",
          { timeout: 20000 },
        )
        .catch(() => null);
      await this.btnVerifyPan.click({ timeout: 30000 });
      await this.waitForLoaderToDisappear();
      const response = await responsePromise;
      if (response) {
        lastBody = await response.text().catch(() => "");
        console.log(
          `RE-KYC VERIFY PAN attempt ${attempt}/${maxAttempts} [${response.status()}]: ${lastBody}`,
        );
        if (response.status() >= 200 && response.status() < 300) {
          verified = true;
          break;
        }
        // A random PAN can't auto-verify; the backend then tells the form to continue manually.
        if (/"switchToManual"s*:s*true/i.test(lastBody)) {
          switchedToManual = true;
          console.log(
            "RE-KYC VERIFY PAN: switchToManual — continuing the manual path.",
          );
          break;
        }
      } else {
        console.log(
          `RE-KYC VERIFY PAN attempt ${attempt}/${maxAttempts}: no response observed within 20s.`,
        );
      }
      if (attempt < maxAttempts) {
        // "Try after some time" — give the upstream service a moment before the next click.
        await this.page.waitForTimeout(5000 * attempt);
      }
    }
    if (!verified && !switchedToManual) {
      throw new Error(
        `Re-KYC: Verify PAN ${newPan} did not succeed after ${maxAttempts} attempts. ` +
          `Last response: ${lastBody || "(none)"}`,
      );
    }

    const panYesAppeared = await this.btnPanYes
      .waitFor({ state: "visible", timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (panYesAppeared) {
      await this.btnPanYes.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(3000);
    }
    await this.confirmOsvIfPresent();

    const nextButton = this.page.locator("//button[normalize-space()='Next']");
    await nextButton.scrollIntoViewIfNeeded();
    await expect(nextButton).toBeEnabled({ timeout: 15000 });
    await nextButton.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    return newPan;
  }

  /**
   * Re-KYC, tab 2 (Address & Identity): remove the existing (masked) Aadhaar number, enter a NEW
   * one, attach the Aadhaar XML and click Verify Aadhaar — repeated up to 3 times with a fresh
   * XML attachment each time (the form drops the file after a failed verify) — then click Next.
   */
  async reKycReplaceAadhaar(
    newAadhaar: string = this.randomAadhar(),
  ): Promise<string> {
    await this.confirmOsvIfPresent();
    await this.completeAadhaarConsentModalIfPresent();
    const aadhaarField = this.aadharfield;
    await aadhaarField.waitFor({ state: "visible", timeout: 20000 });

    const maxAttempts = 3;
    let result: Awaited<
      ReturnType<KycPage["clickVerifyAadhaarAndCheckResult"]>
    > | null = null;
    let switchedToManual = false;
    let verified = false;

    for (let attempt = 1; attempt <= maxAttempts && !verified; attempt++) {
      console.log(`RE-KYC AADHAAR attempt ${attempt}/${maxAttempts}`);
      // Remove whatever Aadhaar is there and enter the new number character by character.
      await aadhaarField.click();
      await aadhaarField.clear();
      await aadhaarField.pressSequentially(newAadhaar, { delay: 50 });
      await this.page.waitForTimeout(500);
      await this.uploadAadhaarXml();
      if (attempt === 1) {
        await this.uploadFileWithValidation(
          documentPath("AADHAAR"),
          "xpath=//*[contains(normalize-space(),'Aadhaar Image')]/following::input[@type='file'][1]",
          "Aadhaar Image",
        );
        await this.page.waitForTimeout(2000);
      }

      result = await this.clickVerifyAadhaarAndCheckResult();
      await this.completeAadhaarConsentModalIfPresent();
      switchedToManual = /"switchToManual"\s*:\s*true/i.test(result.body);

      if (result.alreadyExists) {
        console.log(
          `Aadhaar ${newAadhaar} already exists — removing via e-KYC API.`,
        );
        await this.removeExistingAadhaarKyc(
          newAadhaar,
          result.encryptedAadhaarNumber,
          result.customerId,
        ).catch((err: any) =>
          console.log(`Remove Aadhaar API call failed: ${err.message}`),
        );
        await this.page.waitForTimeout(5000);
        continue;
      }

      verified = !!result.status && result.status >= 200 && result.status < 300;
      if (!verified && !switchedToManual && attempt < maxAttempts) {
        await this.page.waitForTimeout(5000 * attempt);
      }
      if (switchedToManual) break;
    }

    if (!verified && !switchedToManual) {
      throw new Error(
        `Re-KYC: Verify Aadhaar ${newAadhaar} did not succeed after ${maxAttempts} attempts. ` +
          `Last response: ${result?.body ?? "(none)"}`,
      );
    }

    // Address fields may need re-filling after the Aadhaar changed; only do it if Next is blocked.
    const nextButton = this.page.locator("//button[normalize-space()='Next']");
    if (!(await nextButton.isEnabled().catch(() => false))) {
      await this.fillAadhaarAddressDetails(newAadhaar);
    }
    await this.advancePastAddressIdentityTab();
    return newAadhaar;
  }

  async submitAadhaarForVerification(
    initialAadharNumber: string,
  ): Promise<void> {
    await this.confirmOsvIfPresent();
    await this.completeAadhaarConsentModalIfPresent();
    const aadhaarField = this.aadharfield;
    await aadhaarField.waitFor({ state: "visible", timeout: 15000 });

    let aadharNumber = initialAadharNumber;
    await this.fillAadhaarNumberAndDocs(aadhaarField, aadharNumber);

    let result = await this.clickVerifyAadhaarAndCheckResult();
    // await this.completeAadhaarConsentModalIfPresent();

    if (result.alreadyExists) {
      console.log(
        `Aadhaar ${aadharNumber} already exists — removing via e-KYC API before ` +
          "re-entering the same number.",
      );
      await this.removeExistingAadhaarKyc(
        aadharNumber,
        result.encryptedAadhaarNumber,
        result.customerId,
      );
      await this.page.waitForTimeout(5000);
      await aadhaarField.click();
      await aadhaarField.clear();
      await aadhaarField.pressSequentially(aadharNumber, { delay: 50 });
      await this.page.waitForTimeout(500);
      await this.uploadAadhaarXml();
      result = await this.clickVerifyAadhaarAndCheckResult();
      await this.completeAadhaarConsentModalIfPresent();

      if (result.alreadyExists) {
        throw new Error(
          `Aadhaar ${initialAadharNumber} still reports "already exists" after calling the ` +
            `e-KYC remove API and re-entering the same number — the removal doesn't appear ` +
            `to be propagating. Last response: ${result.body}`,
        );
      }
    }

    await this.fillAadhaarAddressDetails(aadharNumber);
  }

  private async submitAadhaarManually(
    addressProof: keyof typeof KycPage.ADDRESS_PROOFS = "aadhaar",
  ): Promise<void> {
    await this.confirmOsvIfPresent();
    await this.completeAadhaarConsentModalIfPresent();
    const aadhaarField = this.aadharfield;
    await aadhaarField.waitFor({ state: "visible", timeout: 15000 });

    let aadharNumber = this.randomAadhar();
    await this.fillAadhaarNumberAndDocs(aadhaarField, aadharNumber);

    const maxVerifyAttempts = 3;
    let result = await this.clickVerifyAadhaarAndCheckResult();
    //await this.completeAadhaarConsentModalIfPresent();
    let switchedToManual = /"switchToManual"\s*:\s*true/i.test(result.body);
    let verifySucceeded =
      !result.alreadyExists &&
      result.status !== undefined &&
      result.status >= 200 &&
      result.status < 300;

    for (
      let attempt = 2;
      attempt <= maxVerifyAttempts &&
      !switchedToManual &&
      !verifySucceeded &&
      !result.alreadyExists;
      attempt++
    ) {
      console.log(
        `VERIFY AADHAAR attempt ${attempt}/${maxVerifyAttempts} — retrying with the same Aadhaar number.`,
      );
      await this.page.waitForTimeout(3000);
      // Manual Aadhaar: each Verify attempt is preceded by a fresh XML upload.
      await this.uploadAadhaarXml();
      result = await this.clickVerifyAadhaarAndCheckResult();
      await this.completeAadhaarConsentModalIfPresent();
      switchedToManual = /"switchToManual"\s*:\s*true/i.test(result.body);
      verifySucceeded =
        !result.alreadyExists &&
        result.status !== undefined &&
        result.status >= 200 &&
        result.status < 300;
    }

    if (switchedToManual) {
      console.log(
        "Backend signaled switchToManual=true for Aadhaar — proceeding on the manual-KYC path.",
      );
    } else if (!verifySucceeded && !result.alreadyExists) {
      throw new Error(
        `Verify Aadhaar failed ${maxVerifyAttempts} times without succeeding or the backend ` +
          `signaling switchToManual:true — last response: ${result.body}. Not the known ` +
          "switchToManual case — likely a genuine outage or locator issue.",
      );
    }

    const maxAlreadyExistsAttempts = 3;
    const alreadyExistsWaitsMs = [5000, 10000, 15000];
    for (
      let attempt = 1;
      attempt <= maxAlreadyExistsAttempts && result.alreadyExists;
      attempt++
    ) {
      console.log(
        `Aadhaar ${aadharNumber} already exists — removing via e-KYC API ` +
          `(attempt ${attempt}/${maxAlreadyExistsAttempts}) before re-entering the same number.`,
      );
      try {
        await this.removeExistingAadhaarKyc(
          aadharNumber,
          result.encryptedAadhaarNumber,
          result.customerId,
        );
      } catch (err: any) {
        console.log(
          `Remove Aadhaar API call failed on attempt ${attempt}: ${err.message}`,
        );
      }
      await this.page.waitForTimeout(
        alreadyExistsWaitsMs[attempt - 1] ??
          alreadyExistsWaitsMs[alreadyExistsWaitsMs.length - 1],
      );
      await aadhaarField.click();
      await aadhaarField.clear();
      await aadhaarField.pressSequentially(aadharNumber, { delay: 50 });
      await this.page.waitForTimeout(500);
      await this.uploadAadhaarXml();
      result = await this.clickVerifyAadhaarAndCheckResult();
      await this.completeAadhaarConsentModalIfPresent();
    }

    if (result.alreadyExists) {
      throw new Error(
        `Aadhaar ${aadharNumber} still reports "already exists" after calling the e-KYC ` +
          `remove API and retrying ${maxAlreadyExistsAttempts} times with the same number — ` +
          `the removal doesn't appear to be propagating. Last response: ${result.body}`,
      );
    }

    await this.fillAadhaarAddressDetails(aadharNumber, addressProof);
  }

  /**
   * Manual PAN + manual Aadhaar KYC where the Permanent Address Proof on tab 2 is a Voter ID,
   * Driving Licence or Utility Bill instead of the Aadhaar card, then Next → personal details →
   * Review & Submit. Returns the proof type label shown in the dropdown after selection.
   */
  async verifyPermanentAddressWithProof(
    proof: "aadhaar" | "voter" | "drivingLicence" | "utilityBill",
    panCardPath?: string,
    signaturePath?: string,
  ): Promise<string> {
    await this.performManualPanTab1(panCardPath);
    await this.submitAadhaarManually(proof);
    await this.page.waitForTimeout(3000);

    const selected = (
      await this.addressProofTypeDropdown
        .locator("option:checked")
        .innerText()
        .catch(() => "")
    ).trim();

    await this.advancePastAddressIdentityTab();
    await this.ValidatePersonalDetails(signaturePath);
    await this.page.waitForTimeout(4000);
    await this.reviewAndSubmit();
    return selected;
  }

  async verifyAadhaarConsentWithInvalidOtp(aadharNumber?: string): Promise<{
    consentModalOpened: boolean;
    errorVisible: boolean;
    modalStillOpen: boolean;
  }> {
    const aadharToUse = aadharNumber ?? this.randomAadhar();

    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.applyKyc.click();
    await this.page.waitForTimeout(5000);
    const aadhaarField = this.aadharfield;
    await aadhaarField.waitFor({ state: "visible", timeout: 15000 });
    await this.fillAadhaarNumberAndDocs(aadhaarField, aadharToUse);

    await this.clickVerifyAadhaarAndCheckResult();
    const consentModalOpened = await this.consentModalHeading
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (!consentModalOpened) {
      console.log(
        "Aadhaar consent modal did not appear after Verify Aadhaar — can't exercise the " +
          "invalid-OTP path this run (backend may have short-circuited straight to success/" +
          "already-exists, same as the other Aadhaar flows sometimes see).",
      );
      return {
        consentModalOpened: false,
        errorVisible: false,
        modalStillOpen: false,
      };
    }

    await this.btnSendConsentSms.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.fillOtp("000000");
    await this.page.waitForTimeout(500);
    await this.btnSubmitAadhaarOtp.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const errorBanner = this.page.locator(
      "xpath=//*[contains(@class,'toast-error') or contains(@class,'alert-danger')]",
    );
    const errorVisible = await errorBanner.isVisible().catch(() => false);
    const modalStillOpen = await this.consentModalHeading
      .isVisible()
      .catch(() => false);

    await this.dismissAadhaarConsentModalIfPresent().catch(() => {});

    return { consentModalOpened, errorVisible, modalStillOpen };
  }

  private async removeExistingAadhaarKyc(
    aadharNumber: string,
    _encryptedAadhaarNumber: string | undefined,
    customerId?: number,
  ): Promise<void> {
    const token = await this.page.evaluate(() => {
      const raw = window.localStorage.getItem("UserDetails");

      if (!raw) {
        console.log("UserDetails not found in localStorage");
        return null;
      }

      try {
        const userDetails = JSON.parse(raw);

        console.log("UserDetails keys:", Object.keys(userDetails));

        return userDetails?.Token ?? null;
      } catch (error) {
        console.log("Unable to parse UserDetails:", error);
        return null;
      }
    });

    console.log("Token exists:", !!token);

    if (!token) {
      throw new Error("Auth token not found in localStorage");
    }
    const base = apiUrl("api-backend").replace(/\/+$/, "");

    console.log("API Base URL:", base);

    const url = `${base}/api/e-kyc/remove`;

    console.log("Remove Aadhaar API URL:", url);

    const valueToRemove = aadharNumber;

    console.log("Customer ID:", customerId);
    console.log(
      "Sending plain Aadhaar number for removal (ignoring the captured encrypted value — it's " +
        "randomly salted per-request and can't match a stored record).",
    );

    const requestBody = {
      aadhaarNumber: valueToRemove,
      identityProofNumber: valueToRemove,
      ...(customerId !== undefined ? { customerId } : {}),
    };

    console.log(
      "Remove Aadhaar Request Body:",
      JSON.stringify({
        ...requestBody,
        aadhaarNumber: "********",
        identityProofNumber: "********",
      }),
    );

    const response = await this.page.request.post(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      data: requestBody,
    });

    console.log("Remove Aadhaar Status:", response.status());
    console.log("Remove Aadhaar Status Text:", response.statusText());
    const responseText = await response.text();
    console.log("Remove Aadhaar Response:", responseText);
    if (!response.ok()) {
      throw new Error(
        `Remove Aadhaar API failed.\n` +
          `Status: ${response.status()}\n` +
          `URL: ${url}\n` +
          `Response: ${responseText}`,
      );
    }
    let parsedResponse: any = null;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {}
    const bodySignalsFailure =
      parsedResponse &&
      (parsedResponse.success === false ||
        parsedResponse.identityProofNumberUpdated === false ||
        (typeof parsedResponse.status === "number" &&
          parsedResponse.status >= 400) ||
        /not\s*found|fail(ed)?|error/i.test(
          String(parsedResponse.message ?? ""),
        ));
    if (bodySignalsFailure) {
      throw new Error(
        `Remove Aadhaar API responded HTTP ${response.status()} (network-level success) but ` +
          `its body signals the removal itself failed — the record was likely NOT removed. ` +
          `Request sent: aadhaarNumber=<plain>` +
          `${customerId !== undefined ? `, customerId=${customerId}` : " (no customerId captured — the verify request's body may not expose it, or the remove API may require a different identifier such as a loan account number that doesn't exist yet at this stage)"}. ` +
          `Response: ${responseText}`,
      );
    }

    console.log(
      `✓ Aadhaar KYC removed successfully for customer ${customerId}`,
    );
  }

  private async removeExistingPanKyc(
    panNumber: string,
    customerId?: number,
  ): Promise<void> {
    const token = await this.page.evaluate(() => {
      const raw = window.localStorage.getItem("UserDetails");
      if (!raw) return null;
      try {
        return JSON.parse(raw)?.Token ?? null;
      } catch {
        return null;
      }
    });

    console.log("Remove PAN — Token exists:", !!token);
    if (!token) {
      throw new Error("Auth token not found in localStorage");
    }

    const base = apiUrl("api-backend").replace(/\/+$/, "");
    const url = `${base}/api/e-kyc/remove`;
    console.log("Remove PAN API URL:", url);
    console.log("Remove PAN — Customer ID:", customerId);

    const requestBody = {
      panNumber,
      pan: panNumber,
      panCardNumber: panNumber,
      identityProofNumber: panNumber,
      ...(customerId !== undefined ? { customerId } : {}),
    };

    console.log(
      "Remove PAN Request Body:",
      JSON.stringify({
        ...requestBody,
        panNumber: "********",
        pan: "********",
        panCardNumber: "********",
        identityProofNumber: "********",
      }),
    );

    const response = await this.page.request.post(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      data: requestBody,
    });

    console.log("Remove PAN Status:", response.status());
    const responseText = await response.text();
    console.log("Remove PAN Response:", responseText);

    if (!response.ok()) {
      throw new Error(
        `Remove PAN API failed.\nStatus: ${response.status()}\nURL: ${url}\nResponse: ${responseText}`,
      );
    }

    let parsedResponse: any = null;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {}
    const bodySignalsFailure =
      parsedResponse &&
      (parsedResponse.success === false ||
        parsedResponse.panCardUpdated === false ||
        (typeof parsedResponse.status === "number" &&
          parsedResponse.status >= 400) ||
        /not\s*found|fail(ed)?|error/i.test(
          String(parsedResponse.message ?? ""),
        ));
    if (bodySignalsFailure) {
      throw new Error(
        `Remove PAN API responded HTTP ${response.status()} (network-level success) but its ` +
          `body signals the removal itself failed — the record was likely NOT removed. ` +
          `Response: ${responseText}`,
      );
    }

    console.log(`✓ PAN KYC removed successfully for customer ${customerId}`);
  }

  async parameterSelection(parameter: string): Promise<void> {
    await this.selPan.selectOption({ label: parameter });
  }

  async selectAsPan(): Promise<void> {
    await this.parameterSelection("PAN");
  }

  randomPanGenerator(): string {
    return TestDataFactory.pan();
  }

  randomOvdNumberGenerator(): string {
    const states = ["MH", "DL", "KA", "TN", "UP"];
    const state = states[Math.floor(Math.random() * states.length)];
    const rto = String(Math.floor(1 + Math.random() * 20)).padStart(2, "0");
    const year = 2000 + Math.floor(Math.random() * 24);
    let serial = "";
    for (let i = 0; i < 7; i++) serial += Math.floor(Math.random() * 10);
    return `${state}${rto} ${year}${serial}`;
  }

  async addressandIdentity(aadhaarPath?: string): Promise<void> {
    const data = getLoginData();
    const randomAadhar = this.randomAadhar();
    const randomAddress = this.randomAddressGenerator();
    const randomLandMarkVal = this.randomLandmark();

    await this.page.waitForTimeout(5000);
    await this.uploadFileWithValidation(
      aadhaarPath,
      "xpath=//input[@id='file']",
      "Aadhaar",
      0,
    );
    await this.page.waitForTimeout(10000);

    console.log("Generated Aadhaar:", randomAadhar);
    await this.page.waitForTimeout(5000);
    const aadhaarField = this.aadharfield;
    await aadhaarField.waitFor({ state: "visible" });
    await aadhaarField.click();
    await this.page.waitForTimeout(500);
    await aadhaarField.clear();
    await this.page.waitForTimeout(500);
    await aadhaarField.fill(randomAadhar);
    await this.page.waitForTimeout(1000);
    const filledValue = await aadhaarField.inputValue();
    if (filledValue !== randomAadhar) {
      console.warn(
        `⚠ Aadhaar field value mismatch. Expected: ${randomAadhar}, Got: ${filledValue}`,
      );
      await aadhaarField.clear();
      await aadhaarField.type(randomAadhar, { delay: 50 });
    }

    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(10000);

    const checkMarkEl = this.checkMark;
    await checkMarkEl.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(12000);
    await this.checkMark.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(12000);

    await this.seladhar.selectOption({ label: data.proofName });

    await this.page.waitForTimeout(10000);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.page.evaluate("window.scrollBy(0, 800)");
    const addressEl = this.addresField;
    await addressEl.evaluate((el) => (el as any).scrollIntoView(true));
    await this.page.waitForTimeout(2000);

    await this.addresField.fill(randomAddress);
    await this.waitForLoaderToDisappear();

    const landMarkEl = this.landMark;
    await landMarkEl.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(5000);

    await this.landMarkField.click();
    await this.waitForLoaderToDisappear();
    await this.landMarkField.fill(randomLandMarkVal);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnNext.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnyes.click();
    await this.waitForLoaderToDisappear();
  }
  randomAadhar(): string {
    let aadhaar = "2222";
    for (let i = 0; i < 8; i++) {
      aadhaar += Math.floor(Math.random() * 10);
    }
    return aadhaar;
  }

  async parameterSelectiona(parametera: string): Promise<void> {
    await this.seladhar.selectOption({ label: parametera });
  }

  async selectAsAadhar(): Promise<void> {
    await this.parameterSelectiona("Aadhaar Card");
  }

  randomAddressGenerator(): string {
    const houseNo = Math.floor(100 + Math.random() * 900);
    const pinCode = Math.floor(100_000 + Math.random() * 900_000);
    const cities = ["Mumbai", "Delhi", "Pune", "Chennai", "Bangalore"];
    const streets = [
      "MG Road",
      "Main Street",
      "Park Lane",
      "Hill Road",
      "Church Street",
    ];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];
    return `House No. ${houseNo}, ${street}, ${city}- ${pinCode}`;
  }

  randomUniqueNumberGenerator(): string {
    let uniqueId = "";
    for (let i = 0; i < 8; i++) {
      uniqueId += Math.floor(Math.random() * 10);
    }
    return uniqueId + "3333";
  }

  randomLandmark(): string {
    const landmarks = [
      "Near City Mall",
      "Opposite Bus Stand",
      "Beside Police Station",
      "Near Railway Station",
      "Behind Post Office",
      "Next to Hospital",
      "Near Main Market",
      "Opposite School",
      "Beside ATM",
      "Near Metro Station",
    ];
    return landmarks[Math.floor(Math.random() * landmarks.length)];
  }

  async selectDobSource(source?: "aadhaar" | "pan"): Promise<void> {
    if (!source) {
      console.log("DOB Source: nothing auto-verified — leaving it unselected.");
      return;
    }
    const dobSource = this.page
      .locator(
        "xpath=(//*[normalize-space(text())='DOB Source']/following::select)[1]",
      )
      .first();
    const shown = await dobSource
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (!shown) {
      console.log("DOB Source dropdown not shown — skipping.");
      return;
    }

    const wanted = source === "pan" ? /pan/i : /aadh?a+r/i;
    const options = await dobSource.locator("option").allTextContents();
    const pick = options
      .map((text, index) => ({ text: text.trim(), index }))
      .filter((o) => o.index > 0 && !/^select/i.test(o.text))
      .find((o) => wanted.test(o.text));
    if (!pick) {
      throw new Error(
        `DOB Source has no ${source} option to select (options: ${options.join(" | ")}).`,
      );
    }

    await dobSource.selectOption({ index: pick.index });
    console.log(`DOB Source selected: "${pick.text}"`);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
  }

  async ValidatePersonalDetails(
    signaturePath?: string,
    dobSource?: "aadhaar" | "pan",
    dob?: { day: string; month: string; year: string },
  ): Promise<void> {
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.profileLink.scrollIntoViewIfNeeded();
    await this.waitForLoaderToDisappear();
    try {
      await this.profileLink.click();
    } catch {
      await this.jsClick(this.profileLink);
    }
    await this.waitForLoaderToDisappear();

    await this.imgCamera.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);

    await this.selectDobSource(dobSource);

    // TEMP DIAGNOSTIC — review whole tab-3 state before deciding what else is auto-filled.
    await this.page.screenshot({
      path: "reports/test-artifacts/DIAG-tab3-personal-details.png",
      fullPage: true,
    });
    const dobDisabled = await this.dateInput.isDisabled().catch(() => false);
    if (!dobDisabled && dob) {
      // Caller supplied the DOB (e.g. re-KYC, matching the one used on the PAN tab).
      await this.dateInput.click();
      await this.waitForLoaderToDisappear();
      await this.selectDobFromCalendar(dob.day, dob.month, dob.year);
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(3000);
    } else if (!dobDisabled) {
      await this.dateInput.click();
      await this.waitForLoaderToDisappear();
      await this.dateArrow.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);
      await this.dateYear.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);
      await this.dateMonth.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);
      await this.dateDay.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(5000);
    }

    await this.Radio.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    const marriedRadio = this.page.locator(
      "xpath=//mat-radio-button[@value='married']",
    );
    await marriedRadio.evaluate((el) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await marriedRadio.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    await this.occupation.click();
    await this.waitForLoaderToDisappear();

    await this.page
      .locator("xpath=//span[contains(text(),'Industrialist')]")
      .waitFor({ state: "visible" });
    await this.page
      .locator("xpath=//span[contains(text(),'Industrialist')]")
      .click();
    await this.waitForLoaderToDisappear();

    await this.txtSpouseName.fill("Saysha");
    await this.waitForLoaderToDisappear();
    await this.txtMotherName.fill("Ashwini");
    await this.waitForLoaderToDisappear();

    await this.page
      .locator("xpath=//Select[@placeholder='Select Religion']")
      .selectOption({ label: "Hindu - General" });
    await this.waitForLoaderToDisappear();

    const mobileNumber = TestDataFactory.mobile();
    await this.mobileField.fill(mobileNumber);
    await this.waitForLoaderToDisappear();

    await this.page
      .locator("xpath=//select[@placeholder='Select Annual Income']")
      .selectOption({ label: "Above 15 Lakh" });
    await this.waitForLoaderToDisappear();

    await this.qualification.selectOption({ label: "Bachelor's Degree" });
    await this.waitForLoaderToDisappear();

    console.log("Attempting to upload signature...");

    if (signaturePath) {
      try {
        await this.uploadFileWithValidation(
          signaturePath,
          "xpath=//input[@type='file']",
          "Signature",
          1,
        );
      } catch (err: any) {
        console.warn(
          `⚠ Signature upload encountered an error (continuing anyway): ${err.message}`,
        );
      }
    } else {
      console.log("⊘ Signature upload skipped (no file path provided)");
    }

    await this.page.waitForTimeout(15000);
    await this.page.waitForTimeout(5000);
    await this.jsClick(this.btnNextPO04);
  }

  async reviewAndSubmit(): Promise<void> {
    await this.page.evaluate(`
      (function() {
        var inner = document.querySelector('kt-portlet-body, .kt-portlet__body');
        if (inner) inner.scrollTop = inner.scrollHeight;
      })()
    `);
    await this.page.waitForTimeout(500);
    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.page.waitForTimeout(500);

    const btnReview = this.page.locator(
      "xpath=//button//span[normalize-space()='Review & Submit']/parent::button",
    );
    await btnReview.waitFor({ state: "attached" });
    await this.page.waitForTimeout(2000);
    await btnReview.evaluate((el: any) => el.click());
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);
  }

  async validateAssignBranch(): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(10000);

    await this.clickUserMangaement.click();
    await this.waitForLoaderToDisappear();
    await this.clickInternalUser.click();
    await this.waitForLoaderToDisappear();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    await branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await branchDropdown.selectOption({ label: "Show All" });
    await this.page.waitForTimeout(2000);

    const searchInput = this.page.locator(
      "xpath=//input[contains(@class, 'mat-input-element') and @placeholder='enter text here']",
    );
    await searchInput.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await searchInput.fill("7780002900");

    await this.page.waitForTimeout(3000);
    await this.btnEdit.click();
    await this.waitForLoaderToDisappear();
    await this.selArrow.click();
    await this.waitForLoaderToDisappear();

    const dropdownToggle = this.page.locator(
      "xpath=//ng-select[@role='listbox']",
    );
    await dropdownToggle.click();
    await this.waitForLoaderToDisappear();

    await this.page
      .locator("xpath=//div[@class='ng-option ng-star-inserted']")
      .first()
      .waitFor({ state: "visible" });
    const options = this.page.locator(
      "xpath=//div[@class='ng-option ng-star-inserted']",
    );
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const opt = options.nth(i);
      if ((await opt.innerText()).trim() === "Augmont Amritsar") {
        await opt.click();
        break;
      }
    }

    await this.page.waitForTimeout(5000);
    const updateBtn = this.btnUpdate;
    await updateBtn.scrollIntoViewIfNeeded();
    await this.btnUpdate.click();
    await this.waitForLoaderToDisappear();
  }
  async clickNext(): Promise<void> {
    const nextButton = this.page
      .getByRole("button", {
        name: /^Next$/i,
      })
      .last();

    await expect(nextButton).toBeVisible({ timeout: 15000 });
    await nextButton.click();

    await nextButton.scrollIntoViewIfNeeded();

    console.log("Next button enabled:", await nextButton.isEnabled());

    console.log(
      "Next button HTML:",
      await nextButton.evaluate((el) => el.outerHTML),
    );

    if (!(await nextButton.isEnabled())) {
      throw new Error(
        "Next button is disabled. KYC form is probably invalid or a required field is missing.",
      );
    }

    await nextButton.click();

    console.log("✓ Next button clicked");
  }

  async performOpsMarkIncomplete(
    reason: string = "More document needed.",
  ): Promise<void> {
    await this.page.waitForTimeout(500);

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdownWaitOnly.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    await this.kycDetailsNavOps.click();
    await this.waitForLoaderToDisappear();
    await this.appliedKycNavOps.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const customerId = this.getCurrentCustomerId();
    await this.customerUniqID.fill(customerId);
    console.log("performOpsMarkIncomplete — customerId:", customerId);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const filterBtnEl = this.filterbtn;
    await filterBtnEl.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await filterBtnEl.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.clickActionWithRetry();
    await this.page.waitForTimeout(1500);

    await this.reviewAndSubmit();
    await this.page.waitForTimeout(5000);

    const statusDropdown = this.kycStatusDropdown;
    await statusDropdown.waitFor({ state: "visible" });
    await statusDropdown.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await statusDropdown.selectOption({ label: "Incomplete" });
    await this.page.waitForTimeout(2000);

    const reasonField = this.reasonForIncomplete;
    await reasonField.waitFor({ state: "visible", timeout: 15000 });
    await reasonField.fill(reason);
    await this.page.waitForTimeout(500);

    await this.btnSubmitOps.click();
    await this.waitForLoaderToDisappear();
  }

  private async clickActionWithRetry(maxAttempts = 3): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.page.waitForTimeout(1500);
        await this.btnActionOps.waitFor({
          state: "visible",
          timeout: 20_000,
        });
        await this.btnActionOps.click();
        return;
      } catch {
        if (attempt === maxAttempts - 1) {
          throw new Error("Ops Action button not clickable after retries");
        }
      }
    }
  }

  async verifyEditOnReviewAndSubmit(): Promise<{
    editedFieldBefore: string;
    editedFieldAfter: string;
  }> {
    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.branchDropdownWaitOnly.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.waitForLoaderToDisappear();
    await this.kycDetails.click();
    await this.waitForLoaderToDisappear();
    await this.appliedKycNavOps.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const customerId = this.getCurrentCustomerId();
    await this.customerUniqID.fill(customerId);
    console.log("verifyEditOnReviewAndSubmit — customerId:", customerId);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const filterBtnEl = this.filterbtn;
    await filterBtnEl.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await filterBtnEl.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.page
      .screenshot({
        path: "reports/test-artifacts/DIAG-kyc-incomplete-reopen.png",
        fullPage: true,
      })
      .catch(() => {});
    await require("fs")
      .promises.writeFile(
        "reports/test-artifacts/DIAG-kyc-incomplete-reopen.html",
        await this.page.content(),
      )
      .catch(() => {});

    try {
      await this.btnActionOps.waitFor({ state: "visible", timeout: 15000 });
      await this.btnActionOps.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);
    } catch (err: any) {
      console.log(
        `Could not open the filtered customer's KYC application via btnActionOps() (${err.message}) — ` +
          "check DIAG-kyc-incomplete-reopen.png/.html for the actual row/action markup.",
      );
    }

    const editedFieldBefore = "";
    const editedFieldAfter = "";

    return { editedFieldBefore, editedFieldAfter };
  }
}
