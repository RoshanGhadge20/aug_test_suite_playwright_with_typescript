import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

export class CreatePacketPage extends AdminBasePage {
  private readonly loanManagement: Locator;
  private readonly btnPacket: Locator;
  private readonly btnAdd: Locator;
  private readonly packetID: Locator;
  private readonly selBranch: Locator;
  private readonly btnNewpacket: Locator;
  private readonly barCode: Locator;
  private readonly btnAddPacket: Locator;
  private readonly btnEditPacket: Locator;
  private readonly selUsertype: Locator;
  private readonly btnUpdate: Locator;
  private readonly btnDelete: Locator;
  private readonly btnYes: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly selAppraiserId: Locator;

  constructor(page: Page) {
    super(page);
    this.loanManagement = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.btnPacket = this.page.locator(
      "xpath=//span[normalize-space()='Packet']",
    );
    this.btnAdd = this.page.locator(
      "xpath=//span[normalize-space()='Add Packet']",
    );
    this.packetID = this.page.locator(
      "xpath=//input[@formcontrolname='packetUniqueId']",
    );
    this.selBranch = this.page.locator(
      "xpath=//select[@formcontrolname='internalUserBranch']",
    );
    this.btnNewpacket = this.page.locator(
      "xpath=//div[@class='mat-slide-toggle-bar mat-slide-toggle-bar-no-side-margin']",
    );
    this.barCode = this.page.locator(
      "xpath=//input[@formcontrolname='barcodeNumber']",
    );
    this.btnAddPacket = this.page.locator(
      "xpath=//span[normalize-space()='Add']",
    );
    this.btnEditPacket = this.page.locator(
      "xpath=(//div[@class='kt-pointer ng-star-inserted'])[1]",
    );
    this.selUsertype = this.page.locator(
      "xpath=//select[@formcontrolname='userType']",
    );
    this.btnUpdate = this.page.locator(
      "xpath=//span[normalize-space()='Update']",
    );
    this.btnDelete = this.page.locator(
      "xpath=//tbody/tr[2]/td[9]/div[1]/div[1]/div[3]/button[1]",
    );
    this.btnYes = this.page.locator("xpath=//span[normalize-space()='Yes']");
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    this.selAppraiserId = this.page.locator(
      "xpath=//select[@formcontrolname='appraiserId']",
    );
  }

  async validateNewPacket(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.btnPacket.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    await this.btnAdd.click();
    await this.waitForLoaderToDisappear();

    const packetCode = this.getRandomAPacketCode();
    await this.page.waitForTimeout(1500);
    await this.packetID.fill(packetCode);
    await this.waitForLoaderToDisappear();

    await this.selectOptionByLabel(this.selBranch, "Augmont");

    await this.btnNewpacket.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.barCode.fill(packetCode);
    await this.waitForLoaderToDisappear();

    await this.barCode.click();
    await this.waitForLoaderToDisappear();

    await this.btnAddPacket.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.btnEditPacket.click();
    await this.waitForLoaderToDisappear();

    await this.selectOptionByLabel(this.selUsertype, "Appraiser");
    await this.selectOptionByLabel(this.selAppraiserId, "Priyanka Thorat");

    await this.btnUpdate.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
  }

  getRandomAPacketCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async delete(): Promise<void> {
    await this.btnDelete.click();
    await this.waitForLoaderToDisappear();
    await this.btnYes.click();
    await this.waitForLoaderToDisappear();
  }

  private async selectOptionByLabel(
    locator: Locator,
    label: string,
    timeoutMs = 30_000,
  ): Promise<void> {
    await locator.waitFor({ state: "visible", timeout: timeoutMs });
    const normalize = (value: string) =>
      value
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const expected = normalize(label);

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const optionCount = await locator.locator("option").count();
      const optionValue = await locator
        .locator("option")
        .evaluateAll((options, expectedText) => {
          const normalizeOption = (value: string) =>
            value
              .replace(/\u00A0/g, " ")
              .replace(/\s+/g, " ")
              .trim();
          const match = options.find(
            (option: any) =>
              normalizeOption(option.textContent ?? "") === expectedText,
          );
          return match ? String((match as any).value ?? "") : "";
        }, expected);
      if (optionValue) {
        await locator.selectOption(
          { value: optionValue },
          { timeout: timeoutMs },
        );
        return;
      }
      if (optionCount > 1) {
        await this.page.waitForTimeout(500);
        continue;
      }
      await this.page.waitForTimeout(500);
    }

    const availableOptions = (await locator.locator("option").allTextContents())
      .map((text) => normalize(text))
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Option '${label}' was not available in the dropdown. Available options: ${availableOptions || "(none)"}`,
    );
  }
}
