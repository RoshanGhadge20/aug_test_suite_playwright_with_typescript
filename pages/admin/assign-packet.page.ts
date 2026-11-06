import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { documentPath } from "../../config/urls";
import { existsSync } from "fs";
import { resolve } from "path";
import { expect } from "@playwright/test";

export class AssignPacketPage extends AdminBasePage {
  private recentApi: string[] = [];
  private readonly AssignPacket: Locator;
  private readonly selectPacket: Locator;
  private readonly btnAddPacket: Locator;
  private readonly ornamenttype: Locator;
  private readonly btnSave: Locator;
  private readonly btnYes: Locator;
  private readonly btnUploadDocuments: Locator;
  private readonly btnDigitalSign: Locator;
  private readonly btnSave1: Locator;
  private readonly selLead: Locator;
  private readonly btnDone: Locator;
  private readonly btnDownloadCashDeclaration: Locator;
  private readonly btnDownloadReceipt: Locator;
  private readonly checkbox: Locator;
  private readonly cashReceiptNumber: Locator;
  private readonly consumptionSupporting: Locator;
  private readonly fieldCkyc: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly packetID: Locator;
  private readonly selBranchPacket: Locator;
  private readonly btnNewpacket: Locator;
  private readonly barCode: Locator;
  private readonly btnAddPacketPO03: Locator;
  private readonly btnEditPacket: Locator;
  private readonly selUsertype: Locator;
  private readonly btnUpdatePO03: Locator;
  private readonly selAppraiserId: Locator;
  private readonly imgCamera: Locator;

  constructor(page: Page) {
    super(page);
    this.AssignPacket = this.page.locator(
      "xpath=(//button[@ng-reflect-klass='red-button'][normalize-space()='Assign Packet'])[1]",
    );
    this.selectPacket = this.page.locator(
      "xpath=//select[@formcontrolname='packetId']",
    );
    this.btnAddPacket = this.page.locator("xpath=//button[@type='submit']");
    this.ornamenttype = this.page.locator(
      "xpath=//span[@class='ng-arrow-wrapper']",
    );
    this.btnSave = this.page.locator("xpath=//span[contains(.,'Save')]");
    this.btnYes = this.page.locator("xpath=//button[normalize-space()='Yes']");
    this.btnUploadDocuments = this.page.locator(
      "xpath=(//button[normalize-space(text())='UPLOAD DOCUMENTS'])[1]",
    );
    this.btnDigitalSign = this.page.locator("xpath=");
    this.btnSave1 = this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='save']//button[@type='button']",
    );
    this.selLead = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );
    this.btnDone = this.page.locator(
      "xpath=//button[normalize-space()='Done'] | //span[normalize-space()='Done']",
    );
    this.btnDownloadCashDeclaration = this.page.locator(
      "xpath=//span[normalize-space(text())='Download Cash Declaration']",
    );
    this.btnDownloadReceipt = this.page.locator(
      "xpath=//span[normalize-space(text())='Download Cash Receipt']",
    );
    this.checkbox = this.page.locator(
      "xpath=//label[contains(@class,'custom-checkbox')][contains(normalize-space(.),'Select All')]",
    );
    this.cashReceiptNumber = this.page.locator(
      "xpath=//input[@formcontrolname='receiptNumber']",
    );
    this.consumptionSupporting = this.page.locator(
      "xpath=//i[@class='fas fa-file-upload']",
    );
    this.fieldCkyc = this.page.locator("xpath=//input[@placeholder='C-KYC00']");
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
    this.packetID = this.page.locator(
      "xpath=//input[@formcontrolname='packetUniqueId']",
    );
    this.selBranchPacket = this.page.locator(
      "xpath=//select[@formcontrolname='internalUserBranch']",
    );
    this.btnNewpacket = this.page.locator(
      "xpath=//div[@class='mat-slide-toggle-bar mat-slide-toggle-bar-no-side-margin']",
    );
    this.barCode = this.page.locator(
      "xpath=//input[@formcontrolname='barcodeNumber']",
    );
    this.btnAddPacketPO03 = this.page.locator(
      "xpath=//span[normalize-space()='Add']",
    );
    this.btnEditPacket = this.page.locator(
      "xpath=(//div[@class='kt-pointer ng-star-inserted'])[1]",
    );
    this.selUsertype = this.page.locator(
      "xpath=//select[@formcontrolname='userType']",
    );
    this.btnUpdatePO03 = this.page.locator(
      "xpath=//span[normalize-space()='Update']",
    );
    this.selAppraiserId = this.page.locator(
      "xpath=//select[@formcontrolname='appraiserId']",
    );
    this.imgCamera = this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
    page.on("response", (res) => {
      const req = res.request();
      if (req.resourceType() !== "xhr" && req.resourceType() !== "fetch")
        return;
      this.recentApi.push(
        `${new Date().toISOString().slice(11, 19)} ${res.status()} ${req.method()} ${res.url().replace(/^https?:\/\/[^/]+/, "")}`,
      );
      if (this.recentApi.length > 25) this.recentApi.shift();
    });
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
        : resolve(process.cwd(), filePath);

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

  private slotLabelVisible = (label: string) =>
    this.page
      .locator(`xpath=//*[contains(normalize-space(text()),'${label}')]`)
      .filter({ visible: true })
      .first();
  /**
   * The top slots (Gold Loan Application … Form 97) render ALL their labels in one row and ALL
   * their input boxes in a separate row below it, so "the first input after the label" is always
   * slot 1's input — Deposit Receipt was reported "already attached" from slot 1's filename and its
   * own box stayed empty ("Field Required"). Pair them by position instead: the Nth label in the
   * label row owns the Nth child of the next sibling row. The matching child is tagged with a
   * data-slot attribute so every locator below can scope to it. Returns null for layouts where the
   * label already sits inside its own slot (the OSV slots), which use the fallbacks.
   */
  private async slotScope(label: string): Promise<Locator | null> {
    const tagged = await this.page
      .evaluate((text) => {
        document
          .querySelectorAll(`[data-slot="${text}"]`)
          .forEach((el) => el.removeAttribute("data-slot"));
        const visible = (el: Element) => el.getClientRects().length > 0;
        const labelEl = Array.from(document.querySelectorAll("*")).find(
          (el) =>
            visible(el) &&
            Array.from(el.childNodes).some(
              (n) => n.nodeType === 3 && (n.textContent ?? "").includes(text),
            ),
        );
        if (!labelEl) return false;
        for (
          let cell: Element | null = labelEl;
          cell?.parentElement;
          cell = cell.parentElement
        ) {
          const row = cell.parentElement;
          const inputsRow = row.nextElementSibling;
          if (
            inputsRow &&
            !row.querySelector("input[type=file]") &&
            inputsRow.querySelector("input[type=file]") &&
            inputsRow.children.length === row.children.length
          ) {
            const slot =
              inputsRow.children[Array.from(row.children).indexOf(cell)];
            slot?.setAttribute("data-slot", text);
            return !!slot;
          }
        }
        return false;
      }, label)
      .catch(() => false);
    return tagged ? this.page.locator(`[data-slot="${label}"]`) : null;
  }

  private async slotFileInput(label: string): Promise<Locator> {
    const scope = await this.slotScope(label);
    if (scope) return scope.locator("input[type=file]").first();
    const own = this.slotLabelVisible(label).locator(
      "xpath=ancestor::*[count(.//input[@type='file'])=1][1]//input[@type='file']",
    );
    if (await own.count()) return own.first();
    return this.slotLabelVisible(label)
      .locator("xpath=following::input[@type='file'][1]")
      .first();
  }
  private async slotFilenameBox(label: string): Promise<Locator> {
    const scope = await this.slotScope(label);
    if (scope) {
      return scope.locator("input:not([type=file]):not([type=hidden])").first();
    }
    return this.slotLabelVisible(label).locator(
      "xpath=following::input[not(@type='file') and not(@type='hidden')][1]",
    );
  }

  private async slotFilename(label: string): Promise<string> {
    const box = await this.slotFilenameBox(label);
    return (
      (await box.inputValue({ timeout: 3000 }).catch(() => "")) ?? ""
    ).trim();
  }

  private async slotHasPreview(label: string): Promise<boolean> {
    return this.page
      .evaluate((text) => {
        const xr = document.evaluate(
          `(//*[contains(normalize-space(text()),'${text}')])[1]`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const start = xr.singleNodeValue as Element | null;
        if (!start) return false;
        const imgs = Array.from(document.images);
        const after = imgs.filter(
          (img) =>
            start.compareDocumentPosition(img) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );

        const own = after[0];
        return (
          !!own &&
          own.naturalWidth > 50 &&
          own.naturalHeight > 50 &&
          !/placeholder|camera|cancel|close/i.test(own.src)
        );
      }, label)
      .catch(() => false);
  }

  private static readonly PREVIEW_ONLY_SLOTS = /OSV/i;

  private async slotIsFilled(label: string): Promise<boolean> {
    if (await this.slotFilename(label)) return true;

    return AssignPacketPage.PREVIEW_ONLY_SLOTS.test(label)
      ? this.slotHasPreview(label)
      : false;
  }

  private async uploadSlotIfEmpty(
    label: string,
    filePath: string,
  ): Promise<boolean> {
    if (await this.slotIsFilled(label)) {
      console.log(`✓ ${label}: already attached`);
      return false;
    }
    await this.waitForLoaderToDisappear();
    await this.page.waitForLoadState("networkidle").catch(() => {});
    const labelEl = this.slotLabelVisible(label);
    await labelEl.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
    await labelEl.scrollIntoViewIfNeeded().catch(() => {});
    const input = await this.slotFileInput(label);
    if (!(await input.count())) {
      throw new Error(
        `${label}: slot not found on the Upload Documents tab (no visible label, or no file input after it).`,
      );
    }
    const info = await input
      .first()
      .evaluate((el: any) => ({
        name:
          el.getAttribute("formcontrolname") || el.name || el.id || "(none)",
        accept: el.accept || "(any)",
        disabled: el.disabled,
      }))
      .catch(() => null);
    console.log(
      `↗ Uploading ${label} (label matches: ${await this.page.locator(`xpath=//*[contains(normalize-space(text()),'${label}')]`).count()}, input: ${JSON.stringify(info)})`,
    );
    // Record the upload request(s) this slot triggers: when a slot stays empty the usual reason is
    // the backend rejecting the upload (the UI then just clears the box), not a locator problem.
    const uploadResponses: string[] = [];
    const onResponse = async (res: import("@playwright/test").Response) => {
      if (
        ["POST", "PUT"].includes(res.request().method()) &&
        /upload|file|document|image|attach/i.test(res.url())
      ) {
        const body = await res.text().catch(() => "");
        uploadResponses.push(
          `${res.status()} ${res.request().method()} ${res.url()} ${body.slice(0, 150)}`,
        );
      }
    };
    this.page.on("response", onResponse);
    try {
      return await this.attachToSlot(label, filePath, input);
    } finally {
      this.page.off("response", onResponse);
      console.log(
        `  ${label}: upload requests → ${uploadResponses.length ? uploadResponses.join(" | ") : "none seen"}`,
      );
    }
  }

  private async attachToSlot(
    label: string,
    filePath: string,
    input: Locator,
  ): Promise<boolean> {
    await input.first().setInputFiles(filePath);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);
    this.assertStillLoggedIn(`uploading "${label}"`);
    const attached = async () => {
      for (let i = 0; i < 6; i++) {
        if (await this.slotIsFilled(label)) return true;
        await this.page.waitForTimeout(1000);
      }
      return false;
    };
    if (await attached()) {
      console.log(`✓ ${label}: attached`);
      return true;
    }
    console.warn(
      `⚠ ${label}: not attached after setInputFiles — retrying via the Attach button.`,
    );
    const scope = await this.slotScope(label);
    const attachBtn = scope
      ? scope.getByText("Attach", { exact: true }).first()
      : this.slotLabelVisible(label)
          .locator("xpath=following::button[normalize-space()='Attach'][1]")
          .first();
    try {
      await attachBtn.scrollIntoViewIfNeeded();
      const [chooser] = await Promise.all([
        this.page.waitForEvent("filechooser", { timeout: 10000 }),
        attachBtn.click(),
      ]);
      await chooser.setFiles(filePath);
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(1500);
      this.assertStillLoggedIn(`uploading "${label}" via the Attach button`);
    } catch (err: any) {
      console.warn(`⚠ ${label}: Attach-button upload failed: ${err.message}`);
    }
    if (await attached()) {
      console.log(`✓ ${label}: attached via the Attach button`);
      return true;
    }
    const toast = await this.page
      .locator(".ngx-toastr, .toast-error, .alert-danger")
      .first()
      .innerText({ timeout: 1000 })
      .catch(() => "");
    // Dump every file input with its form control / accept / disabled state and the text around
    // it, so a mismatch between the slot label and its input is visible in the failure itself.
    const inputs = await this.page
      .locator("xpath=//input[@type='file']")
      .evaluateAll((els: any[]) =>
        els.map((el) => ({
          name:
            el.getAttribute("formcontrolname") || el.name || el.id || "(none)",
          accept: el.accept || "(any)",
          disabled: el.disabled,
          near: (el.closest("div")?.parentElement?.innerText || "")
            .replace(/\s+/g, " ")
            .slice(0, 80),
        })),
      )
      .catch(() => []);
    throw new Error(
      `${label}: file did not attach (still empty after both upload methods).` +
        (toast ? ` Page message: ${toast.trim()}` : "") +
        ` File inputs on page: ${JSON.stringify(inputs)}`,
    );
  }
  private assertStillLoggedIn(step: string): void {
    if (/\/auth\/|login/i.test(this.page.url())) {
      throw new Error(
        `Application logged out while ${step} (url: ${this.page.url()}).\n` +
          `Last API calls before the logout (time status method path):\n  ${this.recentApi.join("\n  ")}`,
      );
    }
  }

  public async verifyDocumentsAttached(): Promise<void> {
    const slots: { label: string; required: boolean }[] = [
      { label: "Gold Loan Application", required: true },
      { label: "Loan Agreement Copy", required: true },
      { label: "Pawn Ticket/Copy of Pledge", required: true },
      { label: "Gold Loan Deposit Receipt", required: true },
      { label: "Form 97", required: false },
      { label: "Aadhar Card with OSV", required: true },
      { label: "Pan Card with OSV", required: true },
    ];

    const rows: string[] = [];
    const missing: string[] = [];
    for (const { label, required } of slots) {
      const filename = await this.slotFilename(label);
      const hasPreview =
        !filename &&
        AssignPacketPage.PREVIEW_ONLY_SLOTS.test(label) &&
        (await this.slotHasPreview(label));
      const filled = !!filename || hasPreview;
      rows.push(
        `${filled ? "✓" : required ? "✗" : "–"} ${label}${required ? "*" : ""}: ` +
          (filename || (hasPreview ? "(preview shown)" : "(nothing attached)")),
      );
      if (!filled && required) missing.push(label);
    }

    const { existsSync, statSync } = require("fs") as typeof import("fs");
    const receipt = this.lastCashReceiptPath;
    if (receipt && existsSync(receipt) && statSync(receipt).size > 0) {
      rows.push(
        `✓ Cash Receipt downloaded: ${receipt} (${statSync(receipt).size} bytes)`,
      );
    } else {
      rows.push("✗ Cash Receipt: not downloaded");
      missing.push("Cash Receipt (download)");
    }

    console.log("Upload Documents check:\n  " + rows.join("\n  "));
    await this.page
      .screenshot({
        path: "reports/test-artifacts/upload-documents-verified.png",
        fullPage: true,
      })
      .catch(() => {});

    if (missing.length) {
      throw new Error(
        `Upload Documents: required attachment(s) missing — ${missing.join(", ")}.\n${rows.join("\n")}`,
      );
    }
  }

  public async ensureCashReceiptAttached(): Promise<void> {
    this.assertStillLoggedIn("waiting for the Cash Receipt to attach");
    const attached = this.page
      .locator("xpath=//*[normalize-space()='Remove Cash Receipt']")
      .first();
    const isAttached = (timeout: number) =>
      attached
        .waitFor({ state: "visible", timeout })
        .then(() => true)
        .catch(() => false);

    if (await isAttached(20000)) {
      console.log("✓ Cash Receipt attached");
      return;
    }
    const receipt = this.lastCashReceiptPath;
    const uploadBtn = this.page
      .locator("xpath=//button[normalize-space()='Upload Cash Receipt']")
      .first();
    if (receipt && (await uploadBtn.isVisible().catch(() => false))) {
      console.log(
        "Cash Receipt not attached yet — uploading via the Upload Cash Receipt button.",
      );
      const [chooser] = await Promise.all([
        this.page.waitForEvent("filechooser", { timeout: 15000 }),
        uploadBtn.click(),
      ]);
      await chooser.setFiles(receipt);
      await this.waitForLoaderToDisappear();
      if (await isAttached(20000)) {
        console.log("✓ Cash Receipt attached via the Upload button");
        return;
      }
    }
    throw new Error(
      "Cash Receipt never showed as attached (no 'Remove Cash Receipt') — Save would be rejected.",
    );
  }

  private async uploadCashReceiptViaButton(filePath: string): Promise<void> {
    const uploadBtn = this.page
      .locator("xpath=//button[normalize-space()='Upload Cash Receipt']")
      .first();
    await uploadBtn.waitFor({ state: "visible", timeout: 15000 });
    console.log(
      `↗ Uploading Cash Receipt via the Upload Cash Receipt button: ${filePath}`,
    );
    const [chooser] = await Promise.all([
      this.page.waitForEvent("filechooser", { timeout: 15000 }),
      uploadBtn.click(),
    ]);
    await chooser.setFiles(filePath);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
  }

  public lastCashReceiptPath: string | null = null;

  public async downloadAndUploadCashReceipt(): Promise<void> {
    this.lastCashReceiptPath = null;
    this.assertStillLoggedIn("starting the Cash Receipt download");
    try {
      console.log("Starting Cash Receipt download and upload...");

      const cdpSession = await this.page.context().newCDPSession(this.page);

      try {
        console.log("Clicking Download Cash Receipt button...");

        const dialogHandler = async (dialog: any) => {
          console.log(
            `Dialog detected and dismissed: ${dialog.type()} - ${dialog.message()}`,
          );
          await dialog.dismiss();
        };
        this.page.on("dialog", dialogHandler);

        try {
          await this.page.addInitScript(() => {
            (globalThis as any).print = () => {
              console.log("Print prevented by automation");
            };
          });

          await this.page.evaluate(() => {
            (globalThis as any).print = () => {
              console.log("Print prevented by automation");
            };
          });

          console.log("✓ Print dialog suppression enabled");
        } catch (err: any) {
          console.log(`Print override setup note: ${err.message}`);
        }

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

            console.log("✓ PDF generated via CDP");
            return pdf;
          } catch (err: any) {
            console.warn(`⚠ CDP PDF generation failed: ${err.message}`);
            return null;
          }
        })();
        await this.btnDownloadReceipt.click();
        const pdfData = (await Promise.race([
          pdfPromise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("PDF generation timeout")),
              12000,
            ),
          ),
        ])) as any;

        this.page.off("dialog", dialogHandler);

        if (!pdfData || !pdfData.data) {
          console.warn("⚠ Failed to capture PDF data via CDP");
          return;
        }

        const buffer = Buffer.from(pdfData.data, "base64");
        const filePath = require("path").join(
          require("os").tmpdir(),
          `receipt-${Date.now()}.pdf`,
        );
        require("fs").writeFileSync(filePath, buffer);

        this.lastCashReceiptPath = filePath;
        console.log(`✓ Cash Receipt saved to: ${filePath}`);
        try {
          await this.uploadCashReceiptViaButton(filePath);
        } catch (err: any) {
          console.warn(`⚠ Could not upload Cash Receipt: ${err.message}`);
        }
      } catch (err: any) {
        console.warn(`⚠ Cash Receipt process failed: ${err.message}`);
      } finally {
        try {
          await cdpSession.detach();
        } catch (err: any) {
          console.log(`Note: CDP detach - ${err.message}`);
        }
      }
    } catch (err: any) {
      console.warn(`⚠ Cash Receipt download/upload failed: ${err.message}`);
    }
  }

  public async downloadAndUploadCashDeclaration(): Promise<void> {
    try {
      console.log("Starting Cash Declaration download and upload...");
      const cdpSession = await this.page.context().newCDPSession(this.page);

      try {
        console.log("Clicking Download Cash Declaration button...");
        const dialogHandler = async (dialog: any) => {
          console.log(
            `Dialog detected and dismissed: ${dialog.type()} - ${dialog.message()}`,
          );
          await dialog.dismiss();
        };
        this.page.on("dialog", dialogHandler);
        try {
          await this.page.addInitScript(() => {
            (globalThis as any).print = () => {
              console.log("Print prevented by automation");
            };
          });

          await this.page.evaluate(() => {
            (globalThis as any).print = () => {
              console.log("Print prevented by automation");
            };
          });

          console.log("✓ Print dialog suppression enabled");
        } catch (err: any) {
          console.log(`Print override setup note: ${err.message}`);
        }

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

            console.log("✓ PDF generated via CDP");
            return pdf;
          } catch (err: any) {
            console.warn(`⚠ CDP PDF generation failed: ${err.message}`);
            return null;
          }
        })();

        await this.btnDownloadCashDeclaration.click();

        const pdfData = (await Promise.race([
          pdfPromise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("PDF generation timeout")),
              12000,
            ),
          ),
        ])) as any;

        this.page.off("dialog", dialogHandler);

        if (!pdfData || !pdfData.data) {
          console.warn("⚠ Failed to capture PDF data via CDP");
          return;
        }

        const buffer = Buffer.from(pdfData.data, "base64");
        const filePath = require("path").join(
          require("os").tmpdir(),
          `declaration-${Date.now()}.pdf`,
        );
        require("fs").writeFileSync(filePath, buffer);

        console.log(`✓ Cash Declaration saved to: ${filePath}`);

        const fileInputs = this.page.locator("xpath=//input[@type='file']");
        const inputCount = await fileInputs.count();
        if (inputCount > 7) {
          try {
            const declarationInput = fileInputs.nth(7);
            await declarationInput.waitFor({
              state: "attached",
              timeout: 2000,
            });
            console.log(`↗ Uploading Cash Declaration to input 8: ${filePath}`);
            await declarationInput.setInputFiles(filePath);
            console.log(`✓ Cash Declaration uploaded successfully`);
            await this.page.waitForTimeout(1000);
          } catch (err: any) {
            console.warn(
              `⚠ Could not upload Cash Declaration to input 8: ${err.message}`,
            );
          }
        } else {
          console.log(
            `⊘ Cash Declaration upload skipped (only ${inputCount} inputs available)`,
          );
        }
      } catch (err: any) {
        console.warn(`⚠ Cash Declaration process failed: ${err.message}`);
      } finally {
        try {
          await cdpSession.detach();
        } catch (err: any) {
          console.log(`Note: CDP detach - ${err.message}`);
        }
      }
    } catch (err: any) {
      console.warn(`⚠ Cash Declaration download/upload failed: ${err.message}`);
    }
  }

  public async downloadAndUploadPawnCopy(): Promise<void> {
    console.log("Starting Pawn Copy (Pawn Ticket) print and upload...");

    const cdpSession = await this.page.context().newCDPSession(this.page);
    const dialogHandler = async (dialog: any) => {
      console.log(
        `Dialog detected and dismissed: ${dialog.type()} - ${dialog.message()}`,
      );
      await dialog.dismiss();
    };

    try {
      this.page.on("dialog", dialogHandler);

      try {
        await this.page.addInitScript(() => {
          (globalThis as any).print = () => {
            console.log("Print prevented by automation");
          };
        });
        await this.page.evaluate(() => {
          (globalThis as any).print = () => {
            console.log("Print prevented by automation");
          };
        });
      } catch (err: any) {
        console.log(`Print override setup note: ${err.message}`);
      }

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
          console.log("✓ Pawn Ticket PDF generated via CDP");
          return pdf;
        } catch (err: any) {
          console.warn(`⚠ CDP PDF generation failed: ${err.message}`);
          return null;
        }
      })();

      await this.jsClick(
        this.page.locator("xpath=//button[normalize-space()='Print']").first(),
      );

      const pdfData = (await Promise.race([
        pdfPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PDF generation timeout")), 12000),
        ),
      ])) as any;

      this.page.off("dialog", dialogHandler);

      if (!pdfData || !pdfData.data) {
        throw new Error("Failed to capture Pawn Ticket PDF via CDP");
      }

      const buffer = Buffer.from(pdfData.data, "base64");
      const filePath = require("path").join(
        require("os").tmpdir(),
        `pawn-copy-${Date.now()}.pdf`,
      );
      require("fs").writeFileSync(filePath, buffer);
      console.log(`✓ Pawn Ticket saved to: ${filePath}`);

      const fileInput = this.page.locator(
        "//input[@formcontrolname='pawnCopyImageName']/following::input[@type='file'][1]",
      );
      await fileInput.waitFor({ state: "attached", timeout: 30000 });

      const responsePromise = this.page
        .waitForResponse(
          (response) =>
            response.url().includes("/upload-file") &&
            response.request().method() === "POST",
          { timeout: 30000 },
        )
        .catch(() => null);

      await fileInput.setInputFiles(filePath);

      const response = await responsePromise;
      if (response && !response.ok()) {
        const body = await response.text().catch(() => "");
        console.error(
          `✗ Pawn Copy upload failed\n  Status: ${response.status()}\n  Body: ${body}`,
        );
        throw new Error(`Pawn Copy upload failed: ${response.status()}`);
      }

      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(1000);

      if (this.page.url().includes("login")) {
        throw new Error("Application logged out after uploading Pawn Copy");
      }

      console.log("✓ Pawn Copy uploaded successfully");
    } finally {
      try {
        await cdpSession.detach();
      } catch (err: any) {
        console.log(`Note: CDP detach - ${err.message}`);
      }
    }
  }

  async createAndAssignPacket(): Promise<string> {
    await this.page.waitForTimeout(7000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();
    await this.page.locator("xpath=//span[normalize-space()='Packet']").click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.page
      .locator("xpath=//span[normalize-space()='Add Packet']")
      .click();
    await this.waitForLoaderToDisappear();

    const packetCode = this.getRandomAPacketCode();
    await this.page.waitForTimeout(1500);
    await this.packetID.fill(packetCode);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.selectPacketBranch("Augmont");
    await this.btnNewpacket.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.barCode.fill(packetCode);
    await this.waitForLoaderToDisappear();
    await this.barCode.click();
    await this.waitForLoaderToDisappear();
    await this.btnAddPacketPO03.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.jsClick(this.btnEditPacket);
    await this.page.waitForTimeout(5000);

    await this.selUsertype.selectOption({ label: "Appraiser" });
    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(5000);
    await expect(this.selAppraiserId).toBeEnabled();
    await this.selAppraiserId.selectOption({ value: "2717" });
    await this.selAppraiserId.dispatchEvent("change");
    await this.btnUpdatePO03.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    return packetCode;
  }

  public async uploadMandatoryDocuments(
    resolvedDocPath: string,
  ): Promise<void> {
    const uploadDocumentByControl = async (
      formControlName: string,
      documentName: string,
      optional = false,
    ): Promise<void> => {
      console.log(`Uploading ${documentName}...`);

      const fileInput = this.page.locator(
        `//input[@formcontrolname='${formControlName}']/following::input[@type='file'][1]`,
      );

      if (optional) {
        const present = await fileInput
          .waitFor({ state: "attached", timeout: 5000 })
          .then(() => true)
          .catch(() => false);
        if (!present) {
          console.log(
            `⊘ ${documentName} upload skipped — no '${formControlName}' field on this screen.`,
          );
          return;
        }
      } else {
        await fileInput.waitFor({ state: "attached", timeout: 50000 });
      }

      await fileInput.setInputFiles(resolvedDocPath);
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(1000);

      if (this.page.url().includes("login")) {
        throw new Error(
          `Application logged out after uploading ${documentName}`,
        );
      }

      console.log(`${documentName} uploaded successfully`);
    };

    const authFailureListener = async (
      res: import("@playwright/test").Response,
    ) => {
      if (res.status() === 401 || res.status() === 403) {
        const body = await res.text().catch(() => "");
        console.log(
          `✗ HTTP ${res.status()} ${res.request().method()} ${res.url()} — ${body.slice(0, 200)}`,
        );
      }
    };
    this.page.on("response", authFailureListener);
    try {
      await this.uploadMandatoryDocumentsInner(
        resolvedDocPath,
        uploadDocumentByControl,
      );
    } finally {
      this.page.off("response", authFailureListener);
    }
  }

  private async uploadMandatoryDocumentsInner(
    resolvedDocPath: string,
    uploadDocumentByControl: (
      formControlName: string,
      documentName: string,
      optional?: boolean,
    ) => Promise<void>,
  ): Promise<void> {
    await uploadDocumentByControl("loanAgreementImageName", "Loan Agreement");
    await this.downloadAndUploadPawnCopy();
    this.assertStillLoggedIn("uploading the Pawn Ticket");

    await uploadDocumentByControl(
      "schemeConfirmationCopyImageName",
      "Scheme Confirmation",
      true,
    );
    await uploadDocumentByControl("form97Name", "Form97");
    console.log("Uploading KFS...");
    const kfsButton = this.page.locator(
      "xpath=//button[normalize-space()='Upload KFS']",
    );
    await kfsButton.scrollIntoViewIfNeeded();
    const [kfsChooser] = await Promise.all([
      this.page.waitForEvent("filechooser", { timeout: 15000 }),
      kfsButton.click(),
    ]);
    await kfsChooser.setFiles(resolvedDocPath);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    console.log("KFS uploaded successfully");
    this.assertStillLoggedIn("uploading KFS");

    await this.uploadSlotIfEmpty("Gold Loan Application", resolvedDocPath);
    await this.uploadSlotIfEmpty("Gold Loan Deposit Receipt", resolvedDocPath);
    await this.uploadSlotIfEmpty("Aadhar Card with OSV", resolvedDocPath);
    await this.uploadSlotIfEmpty("Pan Card with OSV", resolvedDocPath);

    console.log("All mandatory documents uploaded successfully.");
  }

  /**
   * Upload Documents tab → "LIP Assessment" → Fill Form. The Liquid Income Program modal opens
   * with only the required fields blank (Occupation Type (if Others), Years in Current Occupation,
   * Household Living Expenses); everything else is prefilled or optional. Skipped when the
   * Fill Form button isn't on the screen.
   */
  public async fillLipAssessment(): Promise<void> {
    const fillFormBtn = this.page
      .locator("xpath=//button[normalize-space()='Fill Form']")
      .first();
    if (!(await fillFormBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(
        "⊘ LIP Assessment skipped (no Fill Form button on this screen)",
      );
      return;
    }
    await fillFormBtn.scrollIntoViewIfNeeded();
    await fillFormBtn.click();
    await this.waitForLoaderToDisappear();

    // The LIP popup is a plain container (no 'modal' class / dialog role). The <h3> title sits in a
    // header wrapper, so its direct parent holds no inputs — scope to the nearest ancestor that
    // contains both the form inputs and the popup's own Save button.
    const modal = this.page
      .locator(
        "xpath=//h3[contains(normalize-space(.),'Liquid Income Program')]/ancestor::*[.//input and .//button[normalize-space()='Save']][1]",
      )
      .last();
    await modal.waitFor({ state: "visible", timeout: 15000 });

    const fieldByLabel = (label: string) =>
      modal
        .locator(
          `xpath=.//*[contains(normalize-space(text()),'${label}')]/following::input[1]`,
        )
        .first();

    const fill = async (label: string, value: string) => {
      const input = fieldByLabel(label);
      await input.scrollIntoViewIfNeeded();
      await input.fill(value);
    };

    await fill("Occupation Type (if Others)", "consumption");
    await fill("Years in Current Occupation", "15");
    await fill("Household Living Expenses", "20000");
    // Salary is optional on its own, but with no income the form computes Net Monthly Income < 0 and
    // shows "Not Eligible – expenses are higher than obligation", which blocks Save. Income must
    // exceed expenses (20000) for the assessment to be accepted.
    await fill("Salary", "100000");

    const stillInvalid = await modal
      .locator("xpath=.//*[normalize-space(text())='Field Required']")
      .count();
    if (stillInvalid) {
      throw new Error(
        `LIP Assessment: ${stillInvalid} mandatory field(s) still show "Field Required".`,
      );
    }
    await this.page.waitForTimeout(1000);

    const submitBtn = modal
      .locator(
        "xpath=.//button[normalize-space()='Submit' or normalize-space()='Save']",
      )
      .last();
    await submitBtn.scrollIntoViewIfNeeded();
    await this.jsClick(submitBtn);
    await this.waitForLoaderToDisappear();
    await modal.waitFor({ state: "hidden", timeout: 15000 });
    this.assertStillLoggedIn("submitting the LIP Assessment");
    console.log("✓ LIP Assessment filled and submitted");
  }

  async validateAppraisalPacket(
    packetCode: string,
    docPath?: string,
  ): Promise<void> {
    const envPath = docPath || documentPath("DOCUMENT");
    let resolvedDocPath: string | undefined;

    if (envPath) {
      const cwd = process.cwd();
      console.log(`Current working directory: ${cwd}`);
      console.log(`Environment path: ${envPath}`);

      resolvedDocPath =
        envPath.startsWith("/") || envPath.match(/^[A-Z]:/)
          ? envPath
          : resolve(cwd, envPath);

      console.log(`Resolved document path: ${resolvedDocPath}`);
      console.log(`File exists: ${existsSync(resolvedDocPath)}`);

      // Fallback: try resolving from __dirname
      if (!existsSync(resolvedDocPath)) {
        const fallbackPath = resolve(__dirname, "../../..", envPath);
        console.log(`Trying fallback path: ${fallbackPath}`);
        console.log(`Fallback file exists: ${existsSync(fallbackPath)}`);
        if (existsSync(fallbackPath)) {
          resolvedDocPath = fallbackPath;
          console.log(`Using fallback path: ${resolvedDocPath}`);
        }
      }
    }

    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.jsClick(this.filterbtn);
    await this.page.waitForTimeout(2000);
    await this.AssignPacket.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);

    await this.selectPacket.click();
    await this.waitForLoaderToDisappear();
    const code = packetCode.trim();

    const options = await this.selectPacket.locator("option").allTextContents();

    console.log("Packet Code:", code);
    console.log("Dropdown Options:", options);

    await this.selectPacket.selectOption({
      label: `${code} (${code})`,
    });
    await this.page.waitForTimeout(5000);

    await this.ornamenttype.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.checkbox.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnAddPacket.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);

    for (let i = 0; i < 4; i++) {
      const placeholder = this.page
        .locator("//img[contains(@src,'image-placeholder.png')]")
        .first();

      await placeholder.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await placeholder.click();
      await this.page.waitForTimeout(1500);

      const deviceNotFound = this.page.locator(
        "xpath=//h4[normalize-space()='Requested device not found']",
      );
      if (
        await deviceNotFound.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        const okBtn = this.page.locator(
          "xpath=//button[normalize-space()='Ok']",
        );
        await okBtn.click();
        await this.page.waitForTimeout(500);
        console.log(
          `⚠ Camera unavailable (headless) — skipped photo slot ${i + 1}`,
        );
        continue;
      }

      const cameraBtn = this.page.locator("//img[contains(@src,'camera.svg')]");

      await cameraBtn.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await cameraBtn.click();

      await this.page.waitForTimeout(5000);
    }

    await this.page.waitForTimeout(2000);

    await this.btnSave.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.btnYes.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const uploadDocsBtn = this.btnUploadDocuments;
    await uploadDocsBtn.waitFor({ state: "visible", timeout: 15000 });
    await uploadDocsBtn.evaluate((el) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await uploadDocsBtn.click();
    await this.waitForLoaderToDisappear();

    if (resolvedDocPath && existsSync(resolvedDocPath)) {
      await this.uploadMandatoryDocuments(resolvedDocPath);
    }

    if (resolvedDocPath && existsSync(resolvedDocPath)) {
      const consumptionInput = this.page.locator(
        "xpath=//i[@class='fas fa-file-upload']/parent::button/following-sibling::input[@type='file'][1]",
      );
      if (await consumptionInput.count()) {
        await consumptionInput.setInputFiles(resolvedDocPath);
        console.log("✓ Consumption Supporting Document uploaded");
        await this.page.waitForTimeout(2000);
      } else {
        console.warn(
          "⚠ Consumption Supporting file input not found next to the upload icon",
        );
      }
    } else {
      console.log(
        resolvedDocPath
          ? `⊘ Consumption Supporting upload skipped (file not found: ${resolvedDocPath})`
          : "⊘ Consumption Supporting upload skipped (no file path provided)",
      );
    }

    // Download and re-upload Cash Receipt
    await this.downloadAndUploadCashReceipt();
    await this.page.waitForTimeout(5000);
    await this.ensureCashReceiptAttached();
    await this.verifyDocumentsAttached();

    // await this.downloadAndUploadCashDeclaration();

    await this.page.waitForTimeout(10000);

    await this.page.waitForTimeout(5000);

    await this.fillLipAssessment();

    const ckycNumber = this.generateRandomCKYC();
    await this.fieldCkyc.fill(ckycNumber);
    await this.page.waitForTimeout(5000);

    const saveBtn = this.page.locator(
      "xpath=//button[normalize-space()='Save']",
    );
    await saveBtn.waitFor({ state: "attached" });
    await saveBtn.evaluate((el) =>
      (el as any).scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(1000);
    await this.jsClick(saveBtn);
    await this.page.waitForTimeout(3000);
    await this.waitForLoaderToDisappear();

    // await this.btnYes.waitFor({ state: "visible", timeout: 5000 });
    // await expect(this.btnYes).toBeEnabled({ timeout: 5000 }); // add this
    // await this.btnYes.click({ trial: true }); // dry-run actionability check without clicking
    // await this.btnYes.click();
    // await this.page
    //   .locator('kt-button button.submit[type="submit"]', { hasText: "Yes" })
    //   .click();
    await this.btnYes.click({ force: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    console.log("Current URL:", this.page.url());

    const dropdownEle = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );

    await dropdownEle
      .waitFor({ state: "visible", timeout: 20000 })
      .catch(() => {});
    console.log("Count:", await dropdownEle.count());
    try {
      await dropdownEle.selectOption({ label: "Priyanka Thorat" });
    } catch (err: any) {
      console.warn(`⚠ Lead converter not selected: ${err.message}`);
    }
    await this.page.waitForTimeout(5000);
    if ((await dropdownEle.count()) > 0) {
      console.log("Visible:", await dropdownEle.first().isVisible());
    }
    await this.page.waitForTimeout(2000);

    // Done: an exact-text match on the button (the old //span[contains(.,'Done')] also matched every
    // ancestor span containing the word), restricted to the visible one, and verified after the click.
    const doneBtn = this.btnDone.filter({ visible: true }).first();
    await doneBtn.waitFor({ state: "visible", timeout: 20000 });
    await expect(doneBtn).toBeEnabled({ timeout: 10000 });
    await doneBtn.scrollIntoViewIfNeeded();
    console.log("Clicking Done button...");
    await doneBtn.click();
    await this.waitForLoaderToDisappear();
    await doneBtn.waitFor({ state: "hidden", timeout: 20000 });
    this.assertStillLoggedIn("clicking Done after assigning the packet");
    console.log("✓ Done clicked — Assign Packet completed");
  }

  /**
   * Add Packet form → Branch select. Options load asynchronously (and the label may carry extra
   * text), so wait until real options exist, match by partial text, and fall back to the first
   * real option. Never touches the header profile branch dropdown (forces a logout on UAT).
   */
  private async selectPacketBranch(branchName: string): Promise<void> {
    const select = this.selBranchPacket;
    await select.waitFor({ state: "visible", timeout: 30000 });

    let options: { value: string; text: string }[] = [];
    for (let i = 0; i < 20; i++) {
      options = await select.locator("option").evaluateAll((els) =>
        els.map((o) => ({
          value: (o as HTMLOptionElement).value,
          text: (o.textContent || "").trim(),
        })),
      );
      if (options.some((o) => o.value && o.text && !/^select/i.test(o.text)))
        break;
      await this.page.waitForTimeout(1000);
    }
    console.log(
      "Packet branch options:",
      options.map((o) => o.text),
    );

    const real = options.filter((o) => o.value && !/^select/i.test(o.text));
    const target =
      real.find((o) => o.text.toLowerCase() === branchName.toLowerCase()) ??
      real.find((o) =>
        o.text.toLowerCase().includes(branchName.toLowerCase()),
      ) ??
      real[0];
    if (!target) {
      throw new Error(
        `No selectable branch in the Add Packet form (options: ${JSON.stringify(options)})`,
      );
    }
    if (!target.text.toLowerCase().includes(branchName.toLowerCase())) {
      console.warn(
        `⚠ Branch "${branchName}" not found — using "${target.text}"`,
      );
    }
    await select.selectOption({ value: target.value });
    await select.dispatchEvent("change");
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

  generateRandomCKYC(): string {
    const firstPart = String(1_000_000 + Math.floor(Math.random() * 9_000_000));
    const secondPart = String(
      1_000_000 + Math.floor(Math.random() * 9_000_000),
    );
    return firstPart + secondPart;
  }
}
