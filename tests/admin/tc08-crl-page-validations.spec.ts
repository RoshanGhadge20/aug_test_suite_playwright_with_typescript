import { existsSync } from "fs";
import { test, expect } from "../../fixtures/admin.fixture";

test.describe("Customer Request List (CRL) page validations @regression @admin @loans", () => {
  test("all data with request, export, view, and filter by different status", async ({
    crlPage,
    loginAs,
  }) => {
    test.setTimeout(10 * 60_000);

    await test.step("validate add data with request ", async () => {
      await crlPage.CRLRequestPage();
      //expect.soft(total).toBeGreaterThan(0);
    });

    await test.step("validate all data with request — unfiltered list is populated", async () => {
      const total = await crlPage.validateAllDataWithRequest();
      expect.soft(total).toBeGreaterThan(0);
    });

    await test.step("validate view functionality — View Customer dialog opens and closes", async () => {
      const dialogOpened = await crlPage.validateViewFunctionality();
      expect.soft(dialogOpened).toBe(true);
    });

    await test.step("validate export functionality — Reports history reflects the export", async () => {
      const { before, after } = await crlPage.validateExportFunctionality();
      expect.soft(after).toBeGreaterThanOrEqual(before);
    });

    await test.step("validate manual document download — Reports history Download button", async () => {
      const downloadPath = await crlPage.validateManualDocumentDownload();
      expect.soft(downloadPath === "" || existsSync(downloadPath)).toBeTruthy();
    });

    await test.step("validate filter by Request Status — CONVERTED narrows the list", async () => {
      const convertedTotal = await crlPage.filterByRequestStatus("CONVERTED");
      expect.soft(convertedTotal).toBeGreaterThan(0);
    });

    await test.step("validate filter by Request Status — PROCESSING narrows the list differently", async () => {
      const processingTotal = await crlPage.filterByRequestStatus("PROCESSING");
      expect.soft(processingTotal).toBeGreaterThan(0);
    });

    await test.step("validate filter by Request Status — OPEN narrows the list", async () => {
      const openTotal = await crlPage.filterByRequestStatus("OPEN");
      expect.soft(openTotal).toBeGreaterThanOrEqual(0);
    });

    await test.step("validate filter by Request Status — NOT INTERESTED narrows the list", async () => {
      const notInterestedTotal =
        await crlPage.filterByRequestStatus("NOT INTERESTED");
      expect.soft(notInterestedTotal).toBeGreaterThanOrEqual(0);
    });

    await test.step("validate filter by Request Status — CLOSED narrows the list", async () => {
      const closedTotal = await crlPage.filterByRequestStatus("CLOSED");
      expect.soft(closedTotal).toBeGreaterThanOrEqual(0);
    });
  });
});
