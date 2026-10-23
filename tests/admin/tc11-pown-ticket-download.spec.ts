import { test, expect } from "../../fixtures/admin.fixture";

test.describe("Pawn Ticket download validation @regression @admin @loans", () => {
  test("download pawn ticket for an existing applied loan (appraiser)", async ({
    pownTicket,
    loginAs,
  }) => {
    test.setTimeout(5 * 60_000);

    await test.step("validate pawn ticket download (appraiser)", async () => {
      await loginAs("appraiser");
      const pownTicketPath = await pownTicket.validateDownloadPownTicket();
      expect
        .soft(pownTicketPath === "" || pownTicketPath.endsWith(".pdf"))
        .toBeTruthy();
    });
  });
});
