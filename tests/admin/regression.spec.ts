import { test, expect } from "../../fixtures/base.fixture";

test.describe("admin navigation @regression @admin", () => {
  test("side navigation renders primary menu items", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation").first();
    await expect(nav).toBeVisible();
  });

  test("can navigate to users section @users", async ({ page }) => {
    await page.goto("/");
    const usersLink = page.getByRole("link", {
      name: /users|user management/i,
    });
    await usersLink.first().click();
    await expect(page).toHaveURL(/users/i);
  });

  test("logout returns to login page", async ({ page }) => {
    await page.goto("/");
    const logoutButton = page.getByRole("button", {
      name: /log ?out|sign ?out/i,
    });
    await logoutButton.first().click();
    await expect(page).toHaveURL(/login/i, { timeout: 15_000 });
  });
});
