import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { documentPath } from "../../config/urls";
import { existsSync } from "fs";
import { resolve } from "path";
import { expect } from "@playwright/test";

/**
 * Port of Java: PO05_AssignPacket (locators) + Flow05_AssignPacket (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` is an inline locator from Flow05.
 *   - `loanManagement` re-declares PO_Common.loc_loanManagement / PO03.loc_loanManagement (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `packetID` re-declares PO03_CreateNewPacket.loc_packetID (same XPath).
 *   - `selBranchPacket` re-declares PO03_CreateNewPacket.loc_selBranch (same XPath).
 *   - `btnNewpacket` re-declares PO03_CreateNewPacket.loc_btnNewpacket (same XPath).
 *   - `barCode` re-declares PO03_CreateNewPacket.loc_barCode (same XPath).
 *   - `btnAddPacketPO03` re-declares PO03_CreateNewPacket.loc_btnAddPacket (same XPath).
 *   - `btnEditPacket` re-declares PO03_CreateNewPacket.loc_btnEditPacket (same XPath).
 *   - `selUsertype` re-declares PO03_CreateNewPacket.loc_selUsertype (same XPath).
 *   - `btnUpdatePO03` re-declares PO03_CreateNewPacket.loc_btnUpdate (same XPath).
 *   - `imgCamera` re-declares inline camera button from Flow05.
 *
 * Omitted loginWith* calls:
 *   - Flow05_AssignPacket.validatePackets() called Flow_LoginLogout.loginWithAppraiser() mid-flow —
 *     OMITTED. Role switching must be handled by the caller via loginAs('appraiser').
 *
 * File upload TODOs:
 *   - validatePackets(): Three document uploads via sendKeys to (//input[@type='file'])[1/2/3] and
 *     a 6th input by index. Best-effort Playwright: setInputFiles(). Caller must supply documentPath.
 *     Flagged DONE_WITH_CONCERNS — paths must be wired from test config/env vars.
 */
export class AssignPacketPage extends AdminBasePage {
  /** Ring buffer of the most recent API responses — dumped when the session is found logged out. */
  private recentApi: string[] = [];

  constructor(page: Page) {
    super(page);
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

  // ── Locators (from PO05_AssignPacket) ─────────────────────────────────────

  private readonly AssignPacket = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='red-button'][normalize-space()='Assign Packet'])[1]",
    );
  private readonly selectPacket = () =>
    this.page.locator("xpath=//select[@formcontrolname='packetId']");
  private readonly btnAddPacket = () =>
    this.page.locator("xpath=//button[@type='submit']");
  private readonly ornamenttype = () =>
    this.page.locator("xpath=//span[@class='ng-arrow-wrapper']");
  private readonly btnSave = () =>
    this.page.locator("xpath=//span[contains(.,'Save')]");
  // Confirmed live via DOM dump: "Yes" confirmation dialogs in this app render as a real
  // <button normalize-space()='Yes'>, not a <span> — matches the already-working pattern
  // in digio.page.ts's btnYesSave(). The old //span[contains(.,'Yes')] locator is both the
  // wrong element type and a loose contains() match, prone to hitting unrelated stray text.
  private readonly btnYes = () =>
    this.page.locator("xpath=//button[normalize-space()='Yes']");
  private readonly btnUploadDocuments = () =>
    this.page.locator(
      "xpath=(//button[normalize-space(text())='UPLOAD DOCUMENTS'])[1]",
    );
  private readonly btnDigitalSign = () => this.page.locator("xpath=");
  private readonly btnSave1 = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='save']//button[@type='button']",
    );
  private readonly selLead = () =>
    this.page.locator("xpath=//select[@formcontrolname='leadConverterId']");
  private readonly btnDone = () =>
    this.page.locator("xpath=//span[contains(.,'Done')]");
  private readonly btnDownloadCashDeclaration = () =>
    this.page.locator(
      "xpath=//span[normalize-space(text())='Download Cash Declaration']",
    );
  private readonly btnDownloadReceipt = () =>
    this.page.locator(
      "xpath=//span[normalize-space(text())='Download Cash Receipt']",
    );
  // NOTE: class attribute is actually "custom-checkbox ng-star-inserted" — use contains(), not an
  // exact @class= match, or Angular's appended ng-star-inserted class breaks the match entirely.
  private readonly checkbox = () =>
    this.page.locator(
      "xpath=//label[contains(@class,'custom-checkbox')][contains(normalize-space(.),'Select All')]",
    );
  private readonly cashReceiptNumber = () =>
    this.page.locator("xpath=//input[@formcontrolname='receiptNumber']");
  private readonly consumptionSupporting = () =>
    this.page.locator("xpath=//i[@class='fas fa-file-upload']");
  private readonly fieldCkyc = () =>
    this.page.locator("xpath=//input[@placeholder='C-KYC00']");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  // Inline branch dropdown from Flow05
  private readonly branchDropdown = () =>
    this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () =>
    this.page.locator("xpath=//button[@type='submit']");
  // PO03_CreateNewPacket.loc_packetID
  private readonly packetID = () =>
    this.page.locator("xpath=//input[@formcontrolname='packetUniqueId']");
  // PO03_CreateNewPacket.loc_selBranch
  private readonly selBranchPacket = () =>
    this.page.locator("xpath=//select[@formcontrolname='internalUserBranch']");
  // PO03_CreateNewPacket.loc_btnNewpacket
  private readonly btnNewpacket = () =>
    this.page.locator(
      "xpath=//div[@class='mat-slide-toggle-bar mat-slide-toggle-bar-no-side-margin']",
    );
  // PO03_CreateNewPacket.loc_barCode
  private readonly barCode = () =>
    this.page.locator("xpath=//input[@formcontrolname='barcodeNumber']");
  // PO03_CreateNewPacket.loc_btnAddPacket
  private readonly btnAddPacketPO03 = () =>
    this.page.locator("xpath=//span[normalize-space()='Add']");
  // PO03_CreateNewPacket.loc_btnEditPacket
  private readonly btnEditPacket = () =>
    this.page.locator("xpath=(//div[@class='kt-pointer ng-star-inserted'])[1]");
  // PO03_CreateNewPacket.loc_selUsertype
  private readonly selUsertype = () =>
    this.page.locator("xpath=//select[@formcontrolname='userType']");
  // PO03_CreateNewPacket.loc_btnUpdate
  private readonly btnUpdatePO03 = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");
  // Inline appraiser dropdown from Flow05
  private readonly selAppraiserId = () =>
    this.page.locator("xpath=//select[@formcontrolname='appraiserId']");
  // Inline camera button from Flow05
  private readonly imgCamera = () =>
    this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );

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

    // Resolve relative paths from project root
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

      // Ensure the input is in the DOM and ready
      await targetInput.waitFor({ state: "attached" });
      console.log(`  → File input at index ${fileInputIndex} is ready`);

      // Attempt upload with error details
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

  // ── Upload Documents tab: label-based slots ───────────────────────────────
  // Layout (confirmed from the New Loan → Upload Documents screenshot): each slot is a label, a
  // "Select File" textbox showing the chosen filename, an Attach button (the real file input) and
  // a preview image. Labels: Gold Loan Application*, Loan Agreement Copy*, Pawn Ticket/Copy of
  // Pledge*, Gold Loan Deposit Receipt*, Form 97, Aadhar Card with OSV*, Pan Card with OSV*;
  // plus Cash Receipt (Download button), KFS* (Upload KFS button) and Consumption Supporting.

  private slotLabel = (label: string) =>
    `(//*[contains(normalize-space(text()),'${label}')])[1]`;
  private slotFileInput = (label: string) =>
    this.page.locator(
      `xpath=${this.slotLabel(label)}/following::input[@type='file'][1]`,
    );
  private slotFilenameBox = (label: string) =>
    this.page.locator(
      `xpath=${this.slotLabel(label)}/following::input[not(@type='file') and not(@type='hidden')][1]`,
    );

  /** Filename currently shown for a slot ('' when nothing is attached). */
  private async slotFilename(label: string): Promise<string> {
    return (
      (await this.slotFilenameBox(label)
        .inputValue({ timeout: 3000 })
        .catch(() => "")) ?? ""
    ).trim();
  }

  /**
   * True if a real (non-placeholder) preview image follows the slot's label. Needed because slots
   * attached earlier in the flow (Aadhaar / PAN with OSV come from KYC) show a preview but an
   * EMPTY "Select File" box (confirmed from the Upload Documents screenshot).
   */
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
        // ONLY the slot's own image (the first one after its label). Looking at the next few
        // images made "Gold Loan Application" / "Gold Loan Deposit Receipt" look filled because
        // the NEXT slots' previews (Loan Agreement, Form 97, Aadhaar…) matched, so they were
        // never uploaded.
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

  /** Slots pre-attached by the KYC flow: they show a preview but an empty "Select File" box. */
  private static readonly PREVIEW_ONLY_SLOTS = /OSV/i;

  private async slotIsFilled(label: string): Promise<boolean> {
    if (await this.slotFilename(label)) return true;
    // Every other slot shows its filename once attached, so a preview image alone proves nothing.
    return AssignPacketPage.PREVIEW_ONLY_SLOTS.test(label)
      ? this.slotHasPreview(label)
      : false;
  }

  /** Attaches `filePath` to the slot unless it already shows a file. Returns true if it uploaded. */
  private async uploadSlotIfEmpty(
    label: string,
    filePath: string,
  ): Promise<boolean> {
    if (await this.slotIsFilled(label)) {
      console.log(`✓ ${label}: already attached`);
      return false;
    }
    const input = this.slotFileInput(label);
    if (!(await input.count())) {
      console.warn(`⚠ ${label}: no file input found — skipped`);
      return false;
    }
    const info = await input
      .first()
      .evaluate((el: any) => ({
        name: el.getAttribute("formcontrolname") || el.name || el.id || "(none)",
        accept: el.accept || "(any)",
        disabled: el.disabled,
      }))
      .catch(() => null);
    console.log(
      `↗ Uploading ${label} (label matches: ${await this.page.locator(`xpath=//*[contains(normalize-space(text()),'${label}')]`).count()}, input: ${JSON.stringify(info)})`,
    );
    await input.first().setInputFiles(filePath);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);
    this.assertStillLoggedIn(`uploading "${label}"`);

    // setInputFiles only works if the page's change handler picked it up. Verify the slot really
    // shows the file now; if not, retry through the slot's own "Attach" button + file chooser.
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
    console.warn(`⚠ ${label}: not attached after setInputFiles — retrying via the Attach button.`);
    const attachBtn = this.page
      .locator(
        `xpath=${this.slotLabel(label)}/following::button[normalize-space()='Attach'][1]`,
      )
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
    throw new Error(
      `${label}: file did not attach (still empty after both upload methods).` +
        (toast ? ` Page message: ${toast.trim()}` : ""),
    );
  }

  /** Throws a clear error naming the step if the app bounced the session to the login page. */
  private assertStillLoggedIn(step: string): void {
    if (/\/auth\/|login/i.test(this.page.url())) {
      throw new Error(
        `Application logged out while ${step} (url: ${this.page.url()}).\n` +
          `Last API calls before the logout (time status method path):\n  ${this.recentApi.join("\n  ")}`,
      );
    }
  }

  /**
   * Checks every attachment slot on the Upload Documents tab and the downloaded Cash Receipt,
   * logs a table, and throws listing anything required that is still missing.
   */
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

    // Cash Receipt: the page only offers a Download button, so verify the PDF we generated.
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

  /**
   * Save is rejected with "cash receipt attachment is required" if it is pressed before the
   * receipt upload has finished (confirmed from the TC02 video). Wait until the Cash Receipt slot
   * shows the attachment ("Remove Cash Receipt"); if it never does, attach the PDF we generated
   * through the slot's "Upload Cash Receipt" button (a file chooser) and wait again.
   */
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

  /** Clicks the Cash Receipt slot's "Upload Cash Receipt" button and attaches `filePath` via its file chooser. */
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

  /** Path of the Cash Receipt PDF most recently generated by downloadAndUploadCashReceipt(). */
  public lastCashReceiptPath: string | null = null;

  public async downloadAndUploadCashReceipt(): Promise<void> {
    this.lastCashReceiptPath = null;
    this.assertStillLoggedIn("starting the Cash Receipt download");
    try {
      console.log("Starting Cash Receipt download and upload...");

      // Create CDP session to handle print-to-PDF without dialog
      const cdpSession = await this.page.context().newCDPSession(this.page);

      try {
        console.log("Clicking Download Cash Receipt button...");

        // Set up dialog handler to immediately dismiss any print dialogs
        const dialogHandler = async (dialog: any) => {
          console.log(
            `Dialog detected and dismissed: ${dialog.type()} - ${dialog.message()}`,
          );
          await dialog.dismiss();
        };
        this.page.on("dialog", dialogHandler);

        // Suppress print dialog via page evaluation

        // Wait for print preview to potentially appear
        // Prevent window.print from opening system print dialog
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

        // Set up to capture the PDF via CDP (non-blocking)
        const pdfPromise = (async () => {
          // Wait for page to stabilize
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

        // Click the button to trigger print
        await this.btnDownloadReceipt().click();

        // Wait for PDF to be generated
        const pdfData = (await Promise.race([
          pdfPromise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("PDF generation timeout")),
              12000,
            ),
          ),
        ])) as any;

        // Remove dialog handler
        this.page.off("dialog", dialogHandler);

        if (!pdfData || !pdfData.data) {
          console.warn("⚠ Failed to capture PDF data via CDP");
          return;
        }

        // Convert base64 PDF data to file
        const buffer = Buffer.from(pdfData.data, "base64");
        const filePath = require("path").join(
          require("os").tmpdir(),
          `receipt-${Date.now()}.pdf`,
        );
        require("fs").writeFileSync(filePath, buffer);

        this.lastCashReceiptPath = filePath;
        console.log(`✓ Cash Receipt saved to: ${filePath}`);

        // Upload through the Cash Receipt slot's own "Upload Cash Receipt" button. The old code
        // used the 7th <input type=file> by index, which on this tab is the "Pan Card with OSV"
        // slot (images only) — hence the "invalid file format" error on the PDF receipt.
        try {
          await this.uploadCashReceiptViaButton(filePath);
        } catch (err: any) {
          console.warn(`⚠ Could not upload Cash Receipt: ${err.message}`);
        }
      } catch (err: any) {
        console.warn(`⚠ Cash Receipt process failed: ${err.message}`);
      } finally {
        // Detach CDP session
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

  /**
   * Download Cash Declaration file and re-upload it to the form
   */
  public async downloadAndUploadCashDeclaration(): Promise<void> {
    try {
      console.log("Starting Cash Declaration download and upload...");

      // Create CDP session to handle print-to-PDF without dialog
      const cdpSession = await this.page.context().newCDPSession(this.page);

      try {
        console.log("Clicking Download Cash Declaration button...");

        // Set up dialog handler to immediately dismiss any print dialogs
        const dialogHandler = async (dialog: any) => {
          console.log(
            `Dialog detected and dismissed: ${dialog.type()} - ${dialog.message()}`,
          );
          await dialog.dismiss();
        };
        this.page.on("dialog", dialogHandler);

        // Suppress print dialog via page evaluation
        // Prevent window.print from opening system print dialog
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

        // Set up to capture the PDF via CDP (non-blocking)
        const pdfPromise = (async () => {
          // Wait for page to stabilize
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

        // Click the button to trigger print
        await this.btnDownloadCashDeclaration().click();

        // Wait for PDF to be generated
        const pdfData = (await Promise.race([
          pdfPromise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("PDF generation timeout")),
              12000,
            ),
          ),
        ])) as any;

        // Remove dialog handler
        this.page.off("dialog", dialogHandler);

        if (!pdfData || !pdfData.data) {
          console.warn("⚠ Failed to capture PDF data via CDP");
          return;
        }

        // Convert base64 PDF data to file
        const buffer = Buffer.from(pdfData.data, "base64");
        const filePath = require("path").join(
          require("os").tmpdir(),
          `declaration-${Date.now()}.pdf`,
        );
        require("fs").writeFileSync(filePath, buffer);

        console.log(`✓ Cash Declaration saved to: ${filePath}`);

        // Find and upload to the cash declaration file input (if exists)
        const fileInputs = this.page.locator("xpath=//input[@type='file']");
        const inputCount = await fileInputs.count();

        // Try to upload to the next remaining input slot
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
        // Detach CDP session
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

      // A kt-language-dropdown element intercepts pointer events over this button live on UAT
      // (confirmed: Playwright's actionability retry log shows it sitting on top) — force-click
      // via jsClick() rather than a plain .click(), the same fix used elsewhere in this codebase
      // for pointer-interception issues.
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

  /**
   * Phase A — port of Java Flow05_AssignPacket.validatePackets() lines 32–79.
   *
   * Creates a new packet, assigns it to the appraiser role, then returns the
   * generated packet code so the caller can pass it to validateAppraisalPacket()
   * after switching roles.
   *
   * NOTE: loginWithAppraiser() (Java line 80) is OMITTED here.
   * The caller must call loginAs('appraiser') before invoking validateAppraisalPacket().
   */
  async createAndAssignPacket(): Promise<string> {
    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.loanManagement().click();
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
    await this.packetID().fill(packetCode);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.selectPacketBranch("Augmont");
    await this.btnNewpacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.barCode().fill(packetCode);
    await this.waitForLoaderToDisappear();
    await this.barCode().click();
    await this.waitForLoaderToDisappear();
    await this.btnAddPacketPO03().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.jsClick(this.btnEditPacket());
    await this.page.waitForTimeout(5000);

    await this.selUsertype().selectOption({ label: "Appraiser" });
    await this.page.waitForTimeout(5000);
    // await this.selAppraiserId().selectOption({ label: 'Priyanka Thorat' });
    await this.page.waitForTimeout(5000);
    await expect(this.selAppraiserId()).toBeEnabled();
    await this.selAppraiserId().selectOption({ value: "2717" });
    await this.selAppraiserId().dispatchEvent("change");
    await this.btnUpdatePO03().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    return packetCode;
  }

  /**
   * Upload Documents tab: attaches every mandatory document — Loan Agreement, Pawn Ticket (printed
   * to PDF), Form 97, KFS (file chooser on the "Upload KFS" button), plus the required slots that
   * have no formcontrolname (Gold Loan Application, Gold Loan Deposit Receipt, Aadhaar/PAN OSV).
   * Scheme Confirmation is optional — the live tab no longer shows it. Shared by every flow that
   * reaches this tab (assign packet, top-up, renew + top-up) so they can't drift apart again.
   */
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

    // Diagnostic: the app force-logs-out on a rejected request (401/403). Log exactly which request
    // did it, so the offending upload is identified instead of surfacing later as a missing receipt.
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

    // KFS is a plain "Upload KFS" button (no formcontrolname text box) — it opens a file chooser.
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

  async validateAppraisalPacket(
    packetCode: string,
    docPath?: string,
  ): Promise<void> {
    // Auto-resolve document path from environment if not provided, then resolve to absolute
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
    await this.profile().click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.jsClick(this.filterbtn());
    await this.page.waitForTimeout(2000);
    await this.AssignPacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);

    await this.selectPacket().click();
    await this.waitForLoaderToDisappear();
    const code = packetCode.trim();

    const options = await this.selectPacket()
      .locator("option")
      .allTextContents();

    console.log("Packet Code:", code);
    console.log("Dropdown Options:", options);

    await this.selectPacket().selectOption({
      label: `${code} (${code})`,
    });
    await this.page.waitForTimeout(5000);

    await this.ornamenttype().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.checkbox().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnAddPacket().click();
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

    await this.btnSave().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const uploadDocsBtn = this.btnUploadDocuments();
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

    const ckycNumber = this.generateRandomCKYC();
    await this.fieldCkyc().fill(ckycNumber);
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

    // await this.btnYes().waitFor({ state: "visible", timeout: 5000 });
    // await expect(this.btnYes()).toBeEnabled({ timeout: 5000 }); // add this
    // await this.btnYes().click({ trial: true }); // dry-run actionability check without clicking
    // await this.btnYes().click();
    // await this.page
    //   .locator('kt-button button.submit[type="submit"]', { hasText: "Yes" })
    //   .click();
    await this.btnYes().click({ force: true });
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
    } catch {}
    await this.page.waitForTimeout(5000);
    if ((await dropdownEle.count()) > 0) {
      console.log("Visible:", await dropdownEle.first().isVisible());
    }
    await this.page.waitForTimeout(2000);
    await this.btnDone().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Add Packet form → Branch select. Options load asynchronously (and the label may carry extra
   * text), so wait until real options exist, match by partial text, and fall back to the first
   * real option. Never touches the header profile branch dropdown (forces a logout on UAT).
   */
  private async selectPacketBranch(branchName: string): Promise<void> {
    const select = this.selBranchPacket();
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
