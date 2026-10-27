import { Locator, Page } from "@playwright/test";
import fs from "fs";
import { AdminBasePage } from "./admin-base.page";
import { KycPage } from "./kyc.page";

export class ReKycPage extends AdminBasePage {
  private readonly kycDetails: Locator;
  private readonly appliedKyc: Locator;
  private readonly customerIdFilter: Locator;
  private readonly filterBtn: Locator;
  private readonly reKycHeader: Locator;
  private readonly reKycButton: Locator;
  private readonly btnYes: Locator;
  private readonly wizardTitle: Locator;
  private readonly nextBtn: Locator;
  private readonly reviewSubmitBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.kycDetails = this.page.locator(
      "xpath=//span[normalize-space()='KYC Details']",
    );
    this.appliedKyc = this.page.locator(
      "xpath=//span[normalize-space()='Applied KYC']",
    );
    this.customerIdFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer ID']",
    );
    this.filterBtn = this.page.locator("xpath=//button[@type='submit']");
    this.reKycHeader = this.page.locator(
      "xpath=//*[normalize-space()='Re KYC']",
    );
    this.reKycButton = this.page
      .locator("xpath=//button[@mattooltip='Re KYC' and @type='button']")
      .first();
    this.btnYes = this.page
      .locator(
        "xpath=//button[normalize-space()='Yes' or .//span[normalize-space()='Yes']]",
      )
      .first();
    this.wizardTitle = this.page
      .locator("xpath=//*[normalize-space()='Customer KYC']")
      .first();
    this.nextBtn = this.page
      .locator("xpath=//button[normalize-space()='Next']")
      .first();
    this.reviewSubmitBtn = this.page
      .locator(
        "xpath=//button//span[normalize-space()='Review & Submit']/parent::button",
      )
      .first();
  }

  currentCustomerId(): string {
    return String(
      JSON.parse(
        fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
      ).customerId,
    ).trim();
  }

  async openAppliedKyc(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    if (!(await this.appliedKyc.isVisible().catch(() => false))) {
      await this.kycDetails.click();
      await this.waitForLoaderToDisappear();
    }
    await this.appliedKyc.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }

  async filterByCustomerId(customerId: string): Promise<void> {
    const field = this.customerIdFilter;
    await field.waitFor({ state: "visible", timeout: 15000 });
    await field.fill(customerId);
    await this.waitForLoaderToDisappear();
    const filterBtn = this.filterBtn.first();
    await filterBtn.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await filterBtn.click({ force: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
  }

  async openReKycForCurrentCustomer(): Promise<string> {
    const customerId = this.currentCustomerId();
    console.log(`Re-KYC for customer ${customerId}`);

    await this.openAppliedKyc();
    await this.filterByCustomerId(customerId);
    const noData = this.page
      .locator("xpath=//td[normalize-space()='No data found']")
      .or(
        this.page.locator("xpath=//*[normalize-space(text())='No data found']"),
      )
      .first();
    await this.reKycButton
      .or(noData)
      .first()
      .waitFor({ state: "visible", timeout: 20000 });
    if (await noData.isVisible().catch(() => false)) {
      const account = await this.page
        .locator("xpath=//div[contains(@class,'kt-header__topbar-user')]")
        .innerText()
        .catch(() => "");
      throw new Error(
        `Applied KYC shows "No data found" for customer ${customerId} — it isn't visible to the ` +
          `logged-in account (${account.trim() || "unknown"}). customerData.json holds the ` +
          "customer from a previous run; it must exist in this TARGET_ENV and be visible to the " +
          "appraiser's branch. Onboard a customer in this environment first, or update " +
          "customerData.json.",
      );
    }

    const reKyc = this.reKycButton;
    await reKyc.waitFor({ state: "visible", timeout: 20000 });
    await reKyc.scrollIntoViewIfNeeded();
    console.log("Clicking Re KYC button");
    try {
      await reKyc.click({ timeout: 8000 });
    } catch {
      await reKyc.evaluate((el: HTMLElement) => el.click());
    }
    await this.waitForLoaderToDisappear();

    if (
      await this.btnYes
        .waitFor({ state: "visible", timeout: 5000 })
        .then(() => true)
        .catch(() => false)
    ) {
      await this.btnYes.click();
      await this.waitForLoaderToDisappear();
    }
    await this.wizardTitle.waitFor({ state: "visible", timeout: 20000 });
    await this.page.waitForTimeout(2000);
    return customerId;
  }

  private async currentStep(): Promise<
    "pan" | "identity" | "personal" | "review" | "unknown"
  > {
    const visible = (xpath: string) =>
      this.page
        .locator(`xpath=${xpath}`)
        .first()
        .isVisible()
        .catch(() => false);
    if (await visible("//label[normalize-space()='Upload Profile Picture']"))
      return "personal";
    if (await visible("//input[@placeholder='AAAAA9999A']")) return "pan";
    if (
      (await visible("//*[normalize-space()='Identity Verification']")) ||
      (await visible("//*[normalize-space()='Aadhaar Details']"))
    )
      return "identity";
    if (await this.reviewSubmitBtn.isVisible().catch(() => false))
      return "review";
    return "unknown";
  }

  async completeReKyc(
    options: {
      signaturePath?: string;
      panCardPath?: string;
      dobSource?: "aadhaar" | "pan";
      dob?: { day: string; month: string; year: string };
    } = {},
  ): Promise<void> {
    const kyc = new KycPage(this.page);

    for (let step = 1; step <= 8; step++) {
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);
      const where = await this.currentStep();
      console.log(`Re-KYC step ${step}: ${where}`);
      await this.page
        .screenshot({
          path: `reports/test-artifacts/rekyc-step${step}-${where}.png`,
          fullPage: true,
        })
        .catch(() => {});

      if (where === "review") {
        const next = this.nextBtn;
        if (
          (await next.isVisible().catch(() => false)) &&
          (await next.isEnabled().catch(() => false))
        ) {
          console.log("Re-KYC: clicking Next on Review & Submit page.");
          await next.scrollIntoViewIfNeeded();
          await next.click();
          await this.waitForLoaderToDisappear();
          await this.page.waitForTimeout(2000);
        }
        if (await this.reviewSubmitBtn.isVisible().catch(() => false)) {
          await kyc.reviewAndSubmit();
        }
        return;
      }

      if (where === "pan") {
        await kyc.reKycReplacePan(options.panCardPath);
        continue;
      }

      if (where === "identity") {
        await kyc.reKycReplaceAadhaar();
        continue;
      }

      if (where === "personal") {
        await kyc.ValidatePersonalDetails(
          options.signaturePath,
          options.dobSource,
          options.dob ?? { day: "20", month: "APR", year: "1995" },
        );
        continue;
      }
      await this.nextBtn.scrollIntoViewIfNeeded();
      await this.nextBtn.click();
    }

    throw new Error(
      "Re-KYC did not reach Review & Submit within 8 steps — see reports/test-artifacts/rekyc-step*.png",
    );
  }
}
