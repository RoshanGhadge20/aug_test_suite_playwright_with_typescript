import { test, expect } from "../../fixtures/admin.fixture";

test.describe("Customer Management @regression @admin", () => {
  test("Add customer successfully", async ({ loginAs, customerManagement }) => {
    test.setTimeout(10 * 60_000);

    await test.step("appraiser: add a new customer", async () => {
      await loginAs("appraiser");
      const customerId = await customerManagement.addCustomerWithStatus(
        "Future Perspective",
      );
      expect(customerId, "a customer ID should be returned").toBeTruthy();
    });
  });
});
