import { test, expect } from "../../fixtures/base.fixture";
import { AdminLoginPage } from "../../pages/admin/login.page";
import {
  adminRoleCreds,
  adminPasswordCreds,
  adminInactiveUserCreds,
} from "../../config/urls";
import { getTargetEnv } from "../../config/environments";

// Uses the saved admin session from auth-setup (storageState in playwright.config.ts).
test.describe("admin @smoke", () => {
  test("lands on dashboard after storageState is loaded", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/auth\/login/i, { timeout: 15_000 });
  });

  test("header shows authenticated user menu", async ({ page }) => {
    await page.goto("/");
    const userMenu = page.getByRole("button", {
      name: /profile|account|logout/i,
    });
    await expect(userMenu.first()).toBeVisible();
  });
});

// Negative-path login tests on the userId/password form. These must start logged out,
// so the saved admin session is cleared for this block only.
test.describe("admin login negative paths @regression @admin @auth", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const env = getTargetEnv();

  test("rejects login with a wrong User ID and a correct password", async ({
    page,
  }) => {
    const adminLogin = new AdminLoginPage(page);
    const { password } = adminPasswordCreds(env);
    const wrongUserId = "0000000000";

    await adminLogin.loginWithPassword(wrongUserId, password ?? "Test@1234");

    expect(await adminLogin.getLoginErrorMessage()).toBeTruthy();
    await expect(page).toHaveURL(/\/auth\/login/i);
  });

  test("rejects login with a valid User ID and an incorrect password", async ({
    page,
  }) => {
    const { mobile } = adminRoleCreds("appraiser", env);
    test.skip(
      !mobile,
      `No appraiser mobile configured for env '${env}' — set UAT_ADMIN_APPRAISER_MOBILE / TEST_ADMIN_APPRAISER_MOBILE.`,
    );

    const adminLogin = new AdminLoginPage(page);
    await adminLogin.loginWithPassword(mobile!, "WrongPassword@123");

    expect(await adminLogin.getLoginErrorMessage()).toBeTruthy();
    await expect(page).toHaveURL(/\/auth\/login/i);
  });

  test("rejects login for an inactive customer account", async ({ page }) => {
    const { userId, password } = adminInactiveUserCreds(env);
    test.skip(
      !userId || !password,
      `No inactive-account test data configured for env '${env}' — set ${env === "uat" ? "UAT" : "TEST"}_ADMIN_INACTIVE_USER_EMAIL / _PASSWORD to enable this test.`,
    );

    const adminLogin = new AdminLoginPage(page);
    await adminLogin.loginWithPassword(userId!, password!);

    // App shows the same generic error for wrong ID, wrong password and inactive accounts,
    // so this only asserts rejection.
    expect(await adminLogin.getLoginErrorMessage()).toBeTruthy();
    await expect(page).toHaveURL(/\/auth\/login/i);
  });

  test("forgot password link opens the reset flow", async ({ page }) => {
    const adminLogin = new AdminLoginPage(page);
    await adminLogin.openForgotPassword(); // does not submit, to avoid a real reset SMS/email
    await expect(page).toHaveURL(/forgot-password/i);
  });
});
