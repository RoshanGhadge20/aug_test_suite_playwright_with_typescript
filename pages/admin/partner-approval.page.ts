import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class PartnerApprovalPage extends AdminBasePage {
  private readonly checkClick: Locator;
  private readonly checkClick1: Locator;
  private readonly partnerApproval: Locator;
  private readonly btnDisbursement: Locator;
  private readonly transactionID: Locator;
  private readonly selPaymentType: Locator;
  private readonly btnDone: Locator;
  private readonly btnYes: Locator;
  private readonly arrow: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;

  constructor(page: Page) {
    super(page);
    this.checkClick = this.page.locator(
      "xpath=(//img[@src='../../../../../../../assets/media/icons/incorrect.svg'])[1]",
    );
    this.checkClick1 = this.page.locator(
      "xpath=(//img[@class='ng-star-inserted'])[2]",
    );
    this.partnerApproval = this.page.locator(
      "xpath=//button[normalize-space()='PARTNER APPROVAL']",
    );
    this.btnDisbursement = this.page.locator(
      "xpath=(//button[normalize-space()='Disburse Amount'])[1]",
    );
    this.transactionID = this.page.locator(
      "xpath=//input[@formcontrolname='securedBankTransactionId']",
    );
    this.selPaymentType = this.page.locator(
      "xpath=//select[@formcontrolname='bankTransferType']",
    );
    this.btnDone = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.btnYes = this.page.locator("xpath=//span[contains(.,'Yes')]");
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.loanManagement = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
  }

  async partnerAprroval(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(500);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2500);

    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.loanDisbursement();
  }

  async clickNextMultipleTimes(numClicks: number): Promise<void> {
    const nextBtnLocator = this.page.locator(
      "xpath=//button[span[normalize-space()='Next']]",
    );

    for (let count = 0; count < numClicks; count++) {
      try {
        const nextBtn = nextBtnLocator;
        await nextBtn.waitFor({ state: "visible", timeout: 10_000 });
        await nextBtn.evaluate((el) =>
          (el as any).scrollIntoView({ behavior: "smooth", block: "center" }),
        );
        await this.page.waitForTimeout(500);
        try {
          await nextBtn.click();
        } catch {
          await this.jsClick(nextBtn);
        }
        await this.page.waitForTimeout(1000);
      } catch {
        break;
      }
    }
  }

  async loanDisbursement(): Promise<void> {
    let dialogOpen = false;

    const onResponse = (res: import("@playwright/test").Response) => {
      const req = res.request();
      if (req.method() !== "GET" || res.status() >= 400) {
        console.log(
          `DISBURSE NET [${res.status()}] ${req.method()} ${res.url()}`,
        );
      }
    };
    const onConsole = (msg: import("@playwright/test").ConsoleMessage) => {
      if (msg.type() === "error")
        console.log(`DISBURSE CONSOLE ERROR: ${msg.text()}`);
    };
    this.page.on("response", onResponse);
    this.page.on("console", onConsole);
    for (let attempt = 1; attempt <= 4 && !dialogOpen; attempt++) {
      const btn = this.btnDisbursement;
      await btn.waitFor({ state: "attached", timeout: 15000 });
      await btn.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await this.page.waitForTimeout(500);
      console.log(`Clicking Disburse Amount (attempt ${attempt}/4)...`);
      const wrapper = btn.locator(
        "xpath=parent::div[contains(@class,'kt-pointer')]",
      );
      if (attempt === 1) {
        await btn.click({ timeout: 10000 }).catch((e) => {
          console.log(
            `Disburse plain click failed: ${String(e.message).split("\n").slice(0, 6).join(" | ")}`,
          );
        });
      } else if (attempt === 2) {
        await wrapper.click({ force: true, timeout: 5000 }).catch(() => {});
        await btn.dispatchEvent("click");
      } else if (attempt === 3) {
        await btn.evaluate((el) => (el as HTMLElement).click());
      } else {
        await btn.focus();
        await this.page.keyboard.press("Enter");
      }
      await this.waitForLoaderToDisappear();
      dialogOpen = await this.transactionID
        .waitFor({ state: "visible", timeout: 8000 })
        .then(() => true)
        .catch(() => false);
    }
    this.page.off("response", onResponse);
    this.page.off("console", onConsole);
    if (!dialogOpen) {
      const popup = await this.page
        .locator(
          "xpath=//*[contains(@class,'toast') or contains(@class,'swal2') or contains(@class,'snack') or contains(@class,'alert') or @role='alert' or @role='dialog']",
        )
        .allInnerTexts()
        .catch(() => [] as string[]);
      console.log(`DISBURSE popups/toasts on page: ${JSON.stringify(popup)}`);
      throw new Error(
        "Disburse Amount dialog (securedBankTransactionId) did not open after 4 click strategies — " +
          "the button may be disabled/blocked by the app; check the screenshot.",
      );
    }

    await this.transactionID.fill(this.randomTransactionId(12));
    await this.waitForLoaderToDisappear();

    const submitButton = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    await submitButton.waitFor({ state: "attached" });
    await submitButton.evaluate((el) => (el as any).scrollIntoView(true));

    await this.selPaymentType.selectOption({ label: "RTGS" });
    await this.page.waitForTimeout(2000);

    await submitButton.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.btnDone.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnYes.click();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
  }

  randomTransactionId(length: number): string {
    const alphanum = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
    }
    return result;
  }
}
