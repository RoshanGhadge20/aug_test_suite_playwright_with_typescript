import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";

export class IndustryPage extends AdminBasePage {
  // ── Locators ──────────────────────────────────────────────────────────────
  private readonly profile: Locator;
  private readonly branchDropdown: Locator;
  private readonly adminSetting: Locator;
  private readonly masters: Locator;
  private readonly industries: Locator;
  private readonly addIndustryBtn: Locator;
  private readonly dialog: Locator;
  private readonly nameInput: Locator;
  private readonly lastPageBtn: Locator;
  private readonly dialogAddBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.branchDropdown = this.page.locator("xpath=//select[@id='branch']");
    this.adminSetting = this.page.locator(
      "xpath=//span[normalize-space()='Admin Settings']",
    );
    this.masters = this.page.locator(
      "xpath=//span[normalize-space()='Masters']",
    );
    this.industries = this.page.locator(
      "xpath=//span[normalize-space()='Industries']",
    );
    this.addIndustryBtn = this.page
      .locator(
        "xpath=//*[self::button or self::span][starts-with(normalize-space(),'Add') and contains(normalize-space(),'Industr')]",
      )
      .first();
    this.dialog = this.page
      .locator("xpath=//*[contains(@class,'cdk-overlay-pane')]")
      .last();
    this.nameInput = this.dialog
      .locator(
        "xpath=.//input[not(@type='hidden') and not(@type='file') and not(@disabled)]",
      )
      .first();
    this.lastPageBtn = this.page
      .locator("xpath=//button[@aria-label='Last page' or @title='Last page']")
      .first();
    this.dialogAddBtn = this.dialog
      .locator(
        "xpath=.//button[normalize-space()='Add' or .//span[normalize-space()='Add']]",
      )
      .first();
  }
  private readonly dialogSelect = (label: string) =>
    this.dialog
      .locator(
        `xpath=.//*[contains(normalize-space(text()),'${label}')]/following::select[1]`,
      )
      .first();

  async navigateToIndustries(): Promise<void> {
    await this.page.waitForTimeout(7000);
    await this.profile.click();
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);

    const settingsEle = this.page.locator(
      "xpath=//div[@id='kt_aside_menu']//span[normalize-space()='Settings']",
    );
    await this.jsClick(settingsEle);
    await this.page.waitForTimeout(1000);
    await this.adminSetting.click();
    await this.masters.click();
    await this.page.waitForTimeout(500);
    await this.industries.waitFor({ state: "attached", timeout: 30000 });
    await this.industries.evaluate((el: HTMLElement) => {
      el.scrollIntoView({ block: "center" });
      el.click();
    });
    await this.waitForLoaderToDisappear();
    await this.addIndustryBtn.waitFor({ state: "visible", timeout: 20000 });
  }

  private async pickFirstOption(label: string): Promise<string> {
    const select = this.dialogSelect(label);
    await select.waitFor({ state: "visible", timeout: 15000 });
    await this.page.waitForFunction(
      (el) => (el as HTMLSelectElement).options.length > 1,
      await select.elementHandle(),
      { timeout: 15000 },
    );
    const options = await select.locator("option").evaluateAll((opts) =>
      (opts as HTMLOptionElement[]).map((o) => ({
        text: (o.textContent ?? "").trim(),
        disabled: o.disabled,
        value: o.value,
      })),
    );
    const index = options.findIndex(
      (o) => !o.disabled && o.text && !/^select/i.test(o.text),
    );
    if (index < 0) {
      throw new Error(
        `${label}: no selectable option (options: ${options.map((o) => o.text).join(" | ")})`,
      );
    }
    await select.selectOption({ index });
    console.log(`${label} selected: "${options[index].text}"`);
    return options[index].text;
  }

  async addIndustryCategory(
    name: string = `Test Industry ${Date.now().toString().slice(-6)}`,
  ): Promise<{ name: string; category: string; risk: string }> {
    await this.navigateToIndustries();

    await this.addIndustryBtn.click();
    await this.page.waitForTimeout(1000);
    await this.nameInput.waitFor({ state: "visible", timeout: 15000 });
    await this.nameInput.fill(name);

    const category = await this.pickFirstOption("Category");
    const risk = await this.pickFirstOption("Risk");
    await this.page.waitForTimeout(500);
    await this.page
      .screenshot({ path: "reports/test-artifacts/industry-add-form.png" })
      .catch(() => {});

    await this.dialogAddBtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    await this.dialog.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {
      throw new Error(
        "Add Industry dialog is still open after Add — validation rejected it " +
          `(name="${name}", category="${category}", risk="${risk}").`,
      );
    });

    const row = this.page
      .locator("xpath=//*[@role='row' or self::tr]")
      .filter({ hasText: name })
      .first();
    let listed = await row
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!listed && (await this.lastPageBtn.isEnabled().catch(() => false))) {
      await this.lastPageBtn.click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);
      listed = await row
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => true)
        .catch(() => false);
    }
    if (!listed) {
      throw new Error(`Industry "${name}" was added but isn't in the list.`);
    }
    const rowText = (await row.innerText()).replace(/s+/g, " ");
    console.log(`Industry listed: ${rowText}`);
    return { name, category, risk };
  }
}
