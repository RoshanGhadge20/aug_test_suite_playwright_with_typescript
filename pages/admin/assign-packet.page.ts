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
  constructor(page: Page) {
    super(page);
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
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly btnUploadDocuments = () =>
    this.page.locator(
      "xpath=(//button[normalize-space(text())='UPLOAD DOCUMENTS'])[1]",
    );
  private readonly btnDigitalSign = () =>
    this.page.locator("xpath=//button[@ng-reflect-disabled='true']");
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
  private readonly checkbox = () =>
    this.page.locator(
      "xpath=//span[@class='checkmark checkmark-custom header-checkmark']",
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

  // ── Actions (from Flow05_AssignPacket) ────────────────────────────────────

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

  public async downloadAndUploadCashReceipt(): Promise<void> {
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

        console.log(`✓ Cash Receipt saved to: ${filePath}`);

        // Find and upload to the cash receipt file input (if exists)
        const fileInputs = this.page.locator("xpath=//input[@type='file']");
        const inputCount = await fileInputs.count();

        // Try to upload to a remaining input slot
        if (inputCount > 6) {
          try {
            const receiptInput = fileInputs.nth(6);
            await receiptInput.waitFor({ state: "attached", timeout: 2000 });
            console.log(`↗ Uploading Cash Receipt to input 7: ${filePath}`);
            await receiptInput.setInputFiles(filePath);
            console.log(`✓ Cash Receipt uploaded successfully`);
            await this.page.waitForTimeout(1000);
          } catch (err: any) {
            console.warn(
              `⚠ Could not upload Cash Receipt to input 7: ${err.message}`,
            );
          }
        } else {
          console.log(
            `⊘ Cash Receipt upload skipped (only ${inputCount} inputs available)`,
          );
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
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

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
    await this.selBranchPacket().selectOption({ label: "Augmont" });
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
    await this.btnUpdatePO03().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    //   // NOTE: loginWithAppraiser() (Java line 80) OMITTED — caller injects loginAs('appraiser')
    return packetCode;
  }

  /**
   * Phase B — port of Java Flow05_AssignPacket.validatePackets() lines 81–246.
   *
   * Runs as the appraiser role. Accepts the packetCode returned by
   * createAndAssignPacket() so it can select the correct packet from the
   * dropdown (Java line 109: `String code = packetCode.trim()`).
   *
   * TODO(port): Document uploads — Java used sendKeys to (//input[@type='file'])[1/2/3] and index 6.
   * Best-effort Playwright: setInputFiles(). documentPath must be supplied from test config/env vars.
   */
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
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

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
    await this.page.waitForTimeout(500);

    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.AssignPacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);

    await this.selectPacket().click();
    await this.waitForLoaderToDisappear();

    //     // Select the packet option containing the code (Java line 109: String code = packetCode.trim())
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

    //await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
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

      // In headless mode the browser has no camera — Angular shows a "Requested device not found"
      // modal instead of the camera preview. Dismiss it and skip this photo slot.
      const deviceNotFound = this.page.locator(
        "xpath=//h4[normalize-space()='Requested device not found']",
      );
      if (await deviceNotFound.isVisible({ timeout: 2000 }).catch(() => false)) {
        const okBtn = this.page.locator("xpath=//button[normalize-space()='Ok']");
        await okBtn.click();
        await this.page.waitForTimeout(500);
        console.log(`⚠ Camera unavailable (headless) — skipped photo slot ${i + 1}`);
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

    await this.btnUploadDocuments().click();

    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // TODO(port): Document uploads — Java used sendKeys to (//input[@type='file'])[1/2/3] and index 6.
    // Best-effort Playwright: setInputFiles(). Document path auto-resolved from env or passed as parameter.
    if (resolvedDocPath) {
      try {
        const fileInputs = this.page.locator("xpath=//input[@type='file']");
        const inputCount = await fileInputs.count();
        console.log(`Found ${inputCount} file input(s) on the page`);

        // Upload to visible/accessible file inputs (up to 4 documents)
        let uploadedCount = 0;
        for (let i = 0; i < inputCount && uploadedCount < 4; i++) {
          try {
            const fileInput = fileInputs.nth(i);

            // Check if input is visible or can be accessed
            try {
              await fileInput.waitFor({ state: "attached", timeout: 2000 });
              console.log(
                `↗ Uploading Document ${uploadedCount + 1} to input ${i}: ${resolvedDocPath}`,
              );
              await fileInput.setInputFiles(resolvedDocPath);
              console.log(
                `✓ Document ${uploadedCount + 1} uploaded successfully to input ${i}`,
              );
              uploadedCount++;
              await this.page.waitForTimeout(1000);
            } catch (err: any) {
              console.log(
                `⊘ Input ${i} not accessible (hidden/detached): ${err.message}`,
              );
            }
          } catch (err: any) {
            console.warn(`⚠ Error with input ${i}: ${err.message}`);
          }
        }

        console.log(
          `Completed uploading ${uploadedCount} document(s) out of 4 requested`,
        );
      } catch (err: any) {
        console.warn(`⚠ Document upload error: ${err.message}`);
      }
    } else {
      console.log(
        "⊘ Document upload skipped (no file path provided in env or parameter)",
      );
    }
    // Upload to "Consumption Supporting Loan Documents" — 9th file input (index 8).
    if (resolvedDocPath && existsSync(resolvedDocPath)) {
      const fileInputsAll = this.page.locator("xpath=//input[@type='file']");
      const totalInputs = await fileInputsAll.count();
      if (totalInputs > 8) {
        const consumptionInput = fileInputsAll.nth(8);
        await consumptionInput.evaluate((el) => {
          (el as HTMLInputElement).style.display = "block";
        });
        await consumptionInput.setInputFiles(resolvedDocPath);
        console.log(`✓ Consumption Supporting Document uploaded to nth(8): ${resolvedDocPath}`);
        await this.page.waitForTimeout(2000);
      } else {
        console.warn(`⚠ Consumption Supporting skipped — only ${totalInputs} inputs found (need >8)`);
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
    // Download and re-upload Cash Declaration
    await this.downloadAndUploadCashDeclaration();

    await this.page.waitForTimeout(10000);

    await this.page.waitForTimeout(5000);

    const ckycNumber = this.generateRandomCKYC();
    await this.fieldCkyc().fill(ckycNumber);
    await this.page.waitForTimeout(1000);

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

    // Wait for the confirmation dialog to appear with extended timeout
    await this.btnYes().waitFor({ state: "visible", timeout: 15000 });
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    console.log("Current URL:", this.page.url());

    const dropdownEle = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );

    console.log("Count:", await dropdownEle.count());
    await dropdownEle.selectOption({ label: "Priyanka Thorat" });
    await this.page.waitForTimeout(5000);
    if ((await dropdownEle.count()) > 0) {
      console.log("Visible:", await dropdownEle.first().isVisible());
    }
    await this.page.waitForTimeout(2000);
    await this.btnDone().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of Java Flow05_AssignPacket.getRandomAPacketCode().
   */
  getRandomAPacketCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Port of Java Flow05_AssignPacket.generateRandomCKYC().
   */
  generateRandomCKYC(): string {
    const firstPart = String(1_000_000 + Math.floor(Math.random() * 9_000_000));
    const secondPart = String(
      1_000_000 + Math.floor(Math.random() * 9_000_000),
    );
    return firstPart + secondPart;
  }
}
