import { test, expect } from "../../fixtures/admin.fixture";
import { documentPath } from "../../config/urls";

test.describe("isolated incomplete-rating partner flow check", () => {
  test("appraiser upload docs then partner marks Incomplete", async ({
    page,
    loginAs,
    incompleteRating,
  }) => {
    test.setTimeout(15 * 60_000);

    await test.step("appraiser: upload docs", async () => {
      await loginAs("appraiser");
      try {
        await incompleteRating.validatePackets_appraiserPart(
          documentPath("DOCUMENT"),
        );
      } catch (err) {
        const html = await page.content();
        require("fs").writeFileSync(
          "C:/Users/Priyanka/AppData/Local/Temp/claude/d--GitHub-augmont-test-suite/5cfb5e05-03c1-4e17-b706-1059ff5360a4/scratchpad/upload-docs-tab.html",
          html,
        );
        throw err;
      }
    });
    await test.step("ops: inspect status dropdown", async () => {
      await loginAs("ops");
      const dump = await incompleteRating.inspectOpsStatusOptions();
      require("fs").writeFileSync(
        "C:/Users/Priyanka/AppData/Local/Temp/claude/d--GitHub-augmont-test-suite/5cfb5e05-03c1-4e17-b706-1059ff5360a4/scratchpad/ops-status-options.json",
        JSON.stringify(dump, null, 2),
      );
    });
    await test.step("partner: mark Incomplete", async () => {
      await loginAs("partner");
      await incompleteRating.validatePackets_partnerIncomplete();
    });
  });

  test("view functionality for every rating option (ops and partner)", async ({
    loginAs,
    incompleteRating,
  }) => {
    test.setTimeout(15 * 60_000);

    await test.step("ops: view every rating option", async () => {
      await loginAs("ops");
      const results = await incompleteRating.validateViewFunctionalityForEveryRating_ops();
      console.log("OPS rating options:", results);
      expect.soft(results.length).toBeGreaterThan(0);
    });

    await test.step("partner: view every rating option", async () => {
      await loginAs("partner");
      const results =
        await incompleteRating.validateViewFunctionalityForEveryRating_partner();
      console.log("Partner rating options:", results);
      expect.soft(results.length).toBeGreaterThan(0);
    });
  });
});
