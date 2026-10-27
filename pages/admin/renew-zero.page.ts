import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class RenewZeroPage extends AdminBasePage {
  private readonly btnDone: Locator;
  private readonly btnAttach: Locator;
  private readonly btnRenewal: Locator;
  private readonly btnConfirm: Locator;
  private readonly btnYes: Locator;
  private readonly Renewal: Locator;
  private readonly btnUpdate: Locator;
  private readonly btnUpdate1: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly loanDetails: Locator;
  private readonly renewMenu: Locator;
  private readonly renewButton: Locator;
  private readonly btnProceed: Locator;
  private readonly selPayment: Locator;
  private readonly btnProced: Locator;
  private readonly jwellaryReleaseApproval: Locator;
  private readonly inputBankName: Locator;
  private readonly inputBranchName: Locator;
  private readonly inputBankTransactionID: Locator;
  private readonly btnPODone: Locator;

  constructor(page: Page) {
    super(page);
    this.btnDone = this.page.locator("xpath=//span[normalize-space()='Done']");
    this.btnAttach = this.page.locator(
      "xpath=//span[normalize-space()='Attach']",
    );
    this.btnRenewal = this.page.locator(
      "xpath=//span[contains(@class,'kt-menu__link-text') and normalize-space()='Renewal Loans']",
    );
    this.btnConfirm = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Confirm']]",
    );
    this.btnYes = this.page.locator("xpath=//span[contains(.,'Yes')]");
    this.Renewal = this.page.locator(
      "xpath=//span[contains(.,'Renewal Loans')]",
    );
    this.btnUpdate = this.page.locator(
      "xpath=(//button[contains(.,'Update')])[1]",
    );
    this.btnUpdate1 = this.page.locator(
      "xpath=(//span[contains(.,'Update')])[1]",
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
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.loanDetails = this.page.locator(
      "xpath=//span[normalize-space()='Loan Details']",
    );
    this.renewMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.renewButton = this.page.locator(
      "xpath=//button[normalize-space()='Renew Loan']",
    );
    this.btnProceed = this.page.locator(
      "xpath=//button[.//span[normalize-space()='Proceed']]",
    );
    this.selPayment = this.page.locator(
      "xpath=//select[@name='showPaymentValue']",
    );
    this.btnProced = this.page.locator(
      "xpath=(//kt-button[@ng-reflect-value='Proceed']//button[@type='button'])[2]",
    );
    this.jwellaryReleaseApproval = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
    this.inputBankName = this.page.locator(
      "xpath=//input[@formcontrolname='bankName']",
    );
    this.inputBranchName = this.page.locator(
      "xpath=//input[@formcontrolname='branchName']",
    );
    this.inputBankTransactionID = this.page.locator(
      "xpath=//input[@formcontrolname='transactionId']",
    );
    this.btnPODone = this.page.locator(
      "xpath=//span[normalize-space()='Done']",
    );
  }


  private generateTransactionId(): string {
    return "TXN-" + Math.random().toString(36).substring(2, 14).toUpperCase();
  }

  private async safeClickLocal(
    locator: () => import("@playwright/test").Locator,
  ): Promise<void> {
    const el = locator();
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
    await el.click().catch(async () => {
      await this.jsClick(el);
    });
  }

  async validaterenewofflineWithIMPS(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();

    const renewalRadio = this.page.locator(
      "xpath=//input[@type='radio' and @value='renewal']",
    );
    const menu = this.renewMenu;
    await menu.waitFor({ state: "visible", timeout: 30000 });
    await menu.click();

    const renewOption = this.renewButton;
    await renewOption.waitFor({ state: "visible", timeout: 30000 });
    await renewOption.click();

    const renewalRadioBtn = this.page.locator(
      "xpath=//input[@type='radio' and @value='renewal']",
    );
    await renewalRadioBtn.waitFor({ state: "visible", timeout: 30000 });
    await renewalRadioBtn.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.jsClick(renewalRadioBtn);
    await this.page.waitForTimeout(5000);

    const checkbox = this.page.locator(
      "xpath=(//label[@class='custom-checkbox']//input[@type='checkbox'])[3]",
    );
    await checkbox.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.selPayment.click();
    await this.selPayment.selectOption({ label: "RTGS" });

    await this.inputBankName.fill("State bank of India");
    await this.page.waitForTimeout(2000);
    await this.inputBranchName.fill("Lower parel");
    await this.page.waitForTimeout(2000);
    await this.inputBankTransactionID.fill(this.generateTransactionId());
    await this.page.waitForTimeout(2000);
    await this.btnPODone.click();
    await this.waitForLoaderToDisappear();
    await this.btnProced.click();
    await this.waitForLoaderToDisappear();
  }

  async validaterenewofflineWithCash(): Promise<string> {
    const data = getLoginData();

    await this.page.addInitScript(() => {
      (window as any).print = () => {};
    });
    try {
      await this.page.evaluate(() => {
        (window as any).print = () => {};
      });
    } catch (_) {}

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.page.waitForTimeout(1000);
    await this.waitForLoaderToDisappear();

    await this.openRenewLoanForEligibleRow(data.firstName);
    const customerId = await this.readCustomerIdFromRenewWizard();

    const renewalRadioBtn = this.page.locator(
      "xpath=//input[@type='radio' and @value='renewal']",
    );
    await renewalRadioBtn.waitFor({ state: "visible", timeout: 30000 });
    await renewalRadioBtn.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.jsClick(renewalRadioBtn);
    await this.page.waitForTimeout(5000);

    const checkbox = this.page.locator(
      "xpath=(//label[@class='custom-checkbox']//input[@type='checkbox'])[3]",
    );
    await checkbox.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);
    await this.selectFirstAvailableLoanPurpose();

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.selPayment.click();
    await this.selPayment.selectOption({ label: "CASH" });
    await this.page.waitForTimeout(2000);

    await this.uploadCashReceiptAndSelectBranch();

    await this.btnPODone.click();
    await this.waitForLoaderToDisappear();
    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();

    return customerId;
  }

  private async readCustomerIdFromRenewWizard(): Promise<string> {
    const headerRow = this.page.getByRole("row").first();
    const headers = await headerRow.getByRole("columnheader").allTextContents();
    const idx = headers.findIndex((h) => h.trim() === "Customer ID");
    if (idx === -1) return "";
    const dataRow = this.page.getByRole("row").nth(1);
    const cells = await dataRow.getByRole("cell").allTextContents();
    return (cells[idx] ?? "").trim();
  }


  private async uploadCashReceiptAndSelectBranch(): Promise<void> {
    const nodePath = require("path");
    const nodeFs = require("fs");
    const cashReceiptPdfPath = nodePath.resolve(
      process.cwd(),
      "testdata",
      "admin",
      "cash-receipt-download.pdf",
    );
    const fallbackPdfPath = nodePath.resolve(
      process.cwd(),
      "testdata",
      "admin",
      "singnature-sample.pdf",
    );
    let uploadPdfPath: string = fallbackPdfPath;

    const downloadImg = this.page.locator("xpath=//img[@alt='Download']");
    if ((await downloadImg.count()) > 0) {
      const cdpSession = await this.page.context().newCDPSession(this.page);

      const dialogHandler = async (dialog: any) => {
        await dialog.dismiss();
      };
      this.page.on("dialog", dialogHandler);

      try {
        await this.page.evaluate(() => {
          (window as any).print = () => {};
        });
      } catch (_) {}

      const pdfPromise = (async () => {
        await this.page.waitForTimeout(600);
        try {
          const pdf = await cdpSession.send("Page.printToPDF", {
            displayHeaderFooter: false,
            preferCSSPageSize: true,
            printBackground: true,
            paperWidth: 8.5,
            paperHeight: 11,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
          } as any);
          console.log("✓ Cash Acknowledgement captured as PDF");
          return pdf;
        } catch (err: any) {
          console.warn(`⚠ PDF capture failed: ${err.message}`);
          return null;
        }
      })();

      await downloadImg.click();

      const pdfData = await Promise.race([
        pdfPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
      ]);

      this.page.off("dialog", dialogHandler);

      if (pdfData && (pdfData as any).data) {
        nodeFs.writeFileSync(
          cashReceiptPdfPath,
          Buffer.from((pdfData as any).data, "base64"),
        );
        uploadPdfPath = cashReceiptPdfPath;
        console.log(`✓ Cash Receipt saved to: ${cashReceiptPdfPath}`);
      }

      await cdpSession.detach();
      await this.page.waitForTimeout(1000);
    }


    const signBtn = this.page
      .locator("xpath=//button[normalize-space()='Sign']")
      .or(
        this.page.locator("xpath=//button[normalize-space()='Cash Receipt']"),
      );
    if ((await signBtn.count()) > 0) {
   
      const fileChooserPromise = this.page
        .waitForEvent("filechooser", { timeout: 5000 })
        .catch(() => null);

      await signBtn.first().click();
      await this.page.waitForTimeout(500);

      const fileChooser = await fileChooserPromise;
      if (fileChooser) {
        try {
          await fileChooser.setFiles(uploadPdfPath);
          console.log(
            `✓ Cash Receipt uploaded via filechooser: ${uploadPdfPath}`,
          );
        } catch (err: any) {
          console.warn(`⚠ filechooser.setFiles failed: ${err.message}`);
        }
      } else {
        const fileInputs = this.page.locator("xpath=//input[@type='file']");
        const inputCount = await fileInputs.count();
        if (inputCount > 0) {
          try {
            await fileInputs.nth(inputCount - 1).setInputFiles(uploadPdfPath);
            console.log(`✓ Cash Receipt uploaded: ${uploadPdfPath}`);
          } catch (err: any) {
            console.warn(`⚠ setInputFiles failed: ${err.message}`);
          }
        }
      }
      await this.page.waitForTimeout(1000);
    }

    const branchNameSelect = this.page.locator(
      "xpath=//select[option[normalize-space()='Select Branch']]",
    );
    if ((await branchNameSelect.count()) > 0) {
      await branchNameSelect.selectOption({ label: "Augmont" });
      await this.page.waitForTimeout(1000);
    }
  }

  private async openRenewLoanForEligibleRow(firstName: string): Promise<void> {
    const kebabButtons = this.page.locator(
      "xpath=//button[.//mat-icon[normalize-space(text())='more_vert']]",
    );
    const rowCount = await kebabButtons.count();
    for (let i = 0; i < rowCount; i++) {
      await kebabButtons.nth(i).click();
      await this.page.waitForTimeout(500);
      const renewOption = this.renewButton;
      if ((await renewOption.count()) > 0 && (await renewOption.isVisible())) {
        await renewOption.click();
        return;
      }
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(300);
    }
    throw new Error(
      `No loan row with "Renew Loan" available was found among ${rowCount} filtered rows for firstName="${firstName}".`,
    );
  }
  private async selectFirstAvailableLoanPurpose(): Promise<void> {
    const loanPurposeDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanPurpose']",
    );
    await loanPurposeDropdown.waitFor({ state: "visible", timeout: 15000 });
    const options = await loanPurposeDropdown.locator("option").all();
    for (const option of options) {
      const value = await option.getAttribute("value");
      if (value) {
        await loanPurposeDropdown.selectOption(value);
        return;
      }
    }
    throw new Error(
      "Loan Purpose dropdown has no selectable (non-placeholder) options.",
    );
  }
  async validateRenewPaymentOfflineCash(): Promise<void> {
    const customerId = await this.validaterenewofflineWithCash();
    await this.continueRenewApprovalFlow(customerId);
  }
  async validateRenewPaymentOffline(): Promise<void> {
    await this.validaterenewofflineWithIMPS();
    await this.continueRenewApprovalFlow();
  }
  private async continueRenewApprovalFlow(customerId?: string): Promise<void> {
    await this.page.reload();
    await this.page.waitForTimeout(10000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
    await ele.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval.click();
    await this.waitForLoaderToDisappear();
    await this.btnRenewal.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(3000);
    if (customerId) {
      const custIdField = this.page.locator(
        "xpath=//input[contains(@placeholder,'Customer Unique')]",
      );
      if ((await custIdField.count()) > 0) {
        await custIdField.fill(customerId);
        await this.page.waitForTimeout(1000);
        await this.filterbtn.click({ noWaitAfter: true });
        await this.page.waitForTimeout(1000);
        await this.waitForLoaderToDisappear();
      }
    }

    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.page.waitForTimeout(5000);

    const scrollContainer = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollContainer.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);

    const data = getLoginData();
    const updateBtn = this.page.locator(
      "xpath=(//button[contains(@class,'apply-kyc')][normalize-space()='Update'])[1]",
    );
    await updateBtn.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='amountStatus']",
    );
    await selStatus.selectOption({ label: "Completed" });
    await this.page.waitForTimeout(500);
    await this.page.locator("xpath=//span[normalize-space()='Update']").click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.page.reload();
    await this.page.waitForTimeout(10000);

    const ele1 = this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
    await ele1.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page
      .locator("xpath=(//span[normalize-space()='Customer Management'])[1]")
      .click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//span[normalize-space()='Appraisal Request']")
      .click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.firstNameFilter.fill(data.firstName);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);

    const kebabMenu2 = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    await kebabMenu2.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await kebabMenu2.dispatchEvent("click");
    await this.page.waitForTimeout(3000);

    const ele2 = this.page.locator(
      "xpath=//button[normalize-space()='Renew Loan']",
    );
    await this.jsClick(ele2);
    await this.page
      .locator("xpath=//button[.//span[normalize-space()='Ok']]")
      .click();

    // Safe clicks for Next × 3
    const btnNext = this.page.locator(
      "xpath=//button[span[normalize-space()='Next']]",
    );
    for (let i = 0; i < 3; i++) {
      await btnNext.scrollIntoViewIfNeeded().catch(() => {});
      await btnNext.click().catch(async () => {
        await this.jsClick(btnNext);
      });
      await this.page.waitForTimeout(i === 2 ? 5000 : 500);
    }

    const calculateBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Calculate']]",
    );
    await calculateBtn.waitFor({ state: "visible", timeout: 30000 });
    await this.page.waitForTimeout(3000);
    await calculateBtn.click();
    await this.page.waitForTimeout(200);
    await calculateBtn.click();
    await this.page.waitForTimeout(300);
    await calculateBtn.click();
    await this.page.waitForTimeout(3000);

    for (let i = 0; i < 2; i++) {
      await btnNext.scrollIntoViewIfNeeded().catch(() => {});
      await btnNext.click().catch(async () => {
        await this.jsClick(btnNext);
      });
      await this.page.waitForTimeout(2000);
    }

    // Upload docs — C:\\ paths omitted; just click Upload Documents
    await this.page
      .locator(
        "xpath=//kt-button[@ng-reflect-value='Upload Documents']//button",
      )
      .click()
      .catch(() => {});
    await this.page.waitForTimeout(5000);

    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    const saveBtn = this.page.locator(
      "xpath=//button[contains(@class,'mat-raised-button') and .//span[text()='Save']]",
    );
    await saveBtn.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.page
      .locator("xpath=//kt-button[@ng-reflect-value='Save']//button")
      .click()
      .catch(() => {});
    await this.waitForLoaderToDisappear();

    const dropd = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );
    await dropd.selectOption({ label: "Priyanka Thorat" }).catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.page
      .locator("xpath=//kt-button[@ng-reflect-value='Done']//button")
      .click()
      .catch(() => {});
    await this.waitForLoaderToDisappear();
  }

  // ── Actions (from Flow34_RenewPaymentOffline.deposit) ─────────────────────

  /**
   * Port of Java Flow34_RenewPaymentOffline.deposit().
   *
   * Navigates to Funds and Approvals → Jewellery Release Approval → Renewal Loans,
   * filters Pending, scrolls to Update, marks Completed.
   */
  async deposit(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
    await ele.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await ele.click();
    await this.waitForLoaderToDisappear();

    await this.Renewal.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@ng-reflect-name='amountStatus']",
    );
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: "Pending" });
    await this.page.waitForTimeout(2000);
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);

    const element = this.btnUpdate;
    await element.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await element.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='depositStatus']",
    );
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: "Completed" });
    await this.page.waitForTimeout(1000);
    await this.btnUpdate1.click();
    await this.waitForLoaderToDisappear();
  }

  async validaterenewPlusTopOfflineWithIMPS(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(7000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const menu = this.renewMenu;
    await menu.waitFor({ state: "visible", timeout: 30000 });
    await menu.click();

    const renewOption = this.renewButton;
    await renewOption.waitFor({ state: "visible", timeout: 30000 });
    await renewOption.click();

    const renewalRadioBtn = this.page.locator(
      "xpath=//input[@type='radio' and @value='renewalPlusTopUp']",
    );
    await renewalRadioBtn.waitFor({ state: "visible", timeout: 30000 });
    await renewalRadioBtn.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.jsClick(renewalRadioBtn);
    await this.page.waitForTimeout(2000);

    const checkbox = this.page.locator(
      "xpath=//td[text()='[ALL] FLEXI 540-30']/preceding-sibling::td//input[@type='checkbox']",
    );
    await checkbox.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);

    await this.btnProceed.click();
    await this.waitForLoaderToDisappear();
    await this.selPayment.click();
    await this.selPayment.selectOption({ label: "RTGS" });

    await this.inputBankName.fill("State bank of India");
    await this.page.waitForTimeout(2000);
    await this.inputBranchName.fill("Lower parel");
    await this.page.waitForTimeout(2000);
    await this.inputBankTransactionID.fill(this.generateTransactionId());
    await this.page.waitForTimeout(2000);
    await this.btnPODone.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnConfirm.click();
    await this.waitForLoaderToDisappear();
    await this.btnYes.click();
    await this.waitForLoaderToDisappear();
  }


   
  async validaterenewPlusTopOfflineWithCash(): Promise<string> {
    const data = getLoginData();

    await this.page.addInitScript(() => {
      (window as any).print = () => {};
    });
    try {
      await this.page.evaluate(() => {
        (window as any).print = () => {};
      });
    } catch (_) {}

    await this.page.waitForTimeout(7000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
   
    if (this.page.url().toLowerCase().includes("login")) {
      throw new Error(
        "Session was logged out before reaching Loan Management — possibly a concurrent login " +
          "as the same appraiser account from another test run invalidated this session. " +
          "Avoid running multiple appraiser-role tests at the same time.",
      );
    }
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);

    const el = this.loanDetails;
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.filterbtn.click({ noWaitAfter: true });
    await this.page.waitForTimeout(1000);
    await this.waitForLoaderToDisappear();

    await this.openRenewLoanForEligibleRow(data.firstName);
    const customerId = await this.readCustomerIdFromRenewWizard();

    const renewalPlusTopUpRadioBtn = this.page.locator(
      "xpath=//input[@type='radio' and @value='renewalPlusTopUp']",
    );
    await renewalPlusTopUpRadioBtn.waitFor({
      state: "visible",
      timeout: 30000,
    });
    await renewalPlusTopUpRadioBtn.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.jsClick(
      this.page.locator(
        "xpath=//input[@type='radio' and @value='renewalPlusTopUp']/..",
      ),
    );
    await this.page.waitForTimeout(2000);

    const checkbox = this.page.locator(
      "xpath=//td[text()='[ALL] FLEXI 540-30']/preceding-sibling::td//input[@type='checkbox']",
    );
    await checkbox.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(5000);
    await checkbox.dispatchEvent("click");
    await this.page.waitForTimeout(2000);

    await this.selectFirstAvailableLoanPurpose();

    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.btnProceed.click({ timeout: 30_000 });
    await this.waitForLoaderToDisappear();
    await this.selPayment.click();
    await this.selPayment.selectOption({ label: "CASH" });
    await this.page.waitForTimeout(2000);

    await this.uploadCashReceiptAndSelectBranch();

    await this.btnPODone.click();
    await this.waitForLoaderToDisappear();
    await this.page
      .locator("xpath=//div[@id='spinner']")
      .waitFor({ state: "hidden" })
      .catch(() => {});
    await this.btnProceed.click({ timeout: 30_000 });
    await this.waitForLoaderToDisappear();

    return customerId;
  }
  async validateRenewLoanWithTopUpDeposit(customerId?: string): Promise<void> {
    await this.page.reload();
    await this.page.waitForTimeout(10000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
    await ele.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(5000);
    await ele.click();
    await this.waitForLoaderToDisappear();

    await this.Renewal.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    if (customerId) {
      const custIdField = this.page.locator(
        "xpath=//input[contains(@placeholder,'Customer Unique')]",
      );
      if ((await custIdField.count()) > 0) {
        await custIdField.fill(customerId);
      }
    }

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@ng-reflect-name='amountStatus']",
    );
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: "Pending" });
    await this.page.waitForTimeout(2000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.page.waitForTimeout(1000);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);

    const element = this.btnUpdate;
    await element.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await element.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const selStatus = this.page.locator(
      "xpath=//select[@formcontrolname='amountStatus']",
    );
    await selStatus.evaluate((el: any) => el.scrollIntoView(true));
    await selStatus.selectOption({ label: "Completed" });
    await this.page.waitForTimeout(1000);
    await this.btnUpdate1.click();
    await this.waitForLoaderToDisappear();
  }
}
