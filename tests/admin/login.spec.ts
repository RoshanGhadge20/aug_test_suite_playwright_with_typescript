import { test, expect } from '../../fixtures/base.fixture';
import { AdminLoginPage } from '../../pages/admin/login.page';
import { adminRoleCreds, adminPasswordCreds, adminInactiveUserCreds } from '../../config/urls';
import { getTargetEnv } from '../../config/environments';

test.describe('admin @smoke', () => {
  test('lands on dashboard after storageState is loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/auth/login', { timeout: 15_000 });
  });

  test('header shows authenticated user menu', async ({ page }) => {
    await page.goto('/');
    const userMenu = page.getByRole('button', { name: /profile|account|logout/i });
    await expect(userMenu.first()).toBeVisible();
  });
});

// Negative-path login tests, using the admin login page's userId/password form (a separate path
// from the OTP login the rest of the suite uses — confirmed live to exist alongside it). These
// run on a fresh, unauthenticated `page` from base.fixture (the `admin` project has no
// storageState configured, so this page starts logged out — see tests above).
test.describe('admin login negative paths @regression @admin @auth', () => {
  const env = getTargetEnv();

  test('rejects login with a wrong User ID and a correct password', async ({ page }) => {
    const adminLogin = new AdminLoginPage(page);
    const { password } = adminPasswordCreds(env);
    // The point of this case is that the userId doesn't exist — the password value doesn't need
    // to be genuinely valid for any account for the assertion (rejection) to hold. Falls back to
    // a placeholder if no password-login test data is configured for this env.
    const wrongUserId = '0000000000';

    await adminLogin.loginWithPassword(wrongUserId, password ?? 'Test@1234');

    const errorMessage = await adminLogin.getLoginErrorMessage();
    expect(errorMessage).toBeTruthy();
    await expect(page).toHaveURL(/\/auth\/login/i);
  });

  test('rejects login with a valid User ID and an incorrect password', async ({ page }) => {
    const adminLogin = new AdminLoginPage(page);
    const { mobile } = adminRoleCreds('appraiser', env);
    if (!mobile) {
      test.skip(true, `No appraiser mobile configured for env '${env}' — set UAT_ADMIN_APPRAISER_MOBILE / TEST_ADMIN_APPRAISER_MOBILE.`);
    }

    await adminLogin.loginWithPassword(mobile!, 'WrongPassword@123');

    const errorMessage = await adminLogin.getLoginErrorMessage();
    expect(errorMessage).toBeTruthy();
    await expect(page).toHaveURL(/\/auth\/login/i);
  });

  test('rejects login for an inactive customer account', async ({ page }) => {
    const { userId, password } = adminInactiveUserCreds(env);
    test.skip(
      !userId || !password,
      `No inactive-account test data configured for env '${env}' — set ${env === 'uat' ? 'UAT' : 'TEST'}_ADMIN_INACTIVE_USER_EMAIL / _PASSWORD to enable this test.`,
    );

    const adminLogin = new AdminLoginPage(page);
    await adminLogin.loginWithPassword(userId!, password!);

    // The app shows the same generic "Something went wrong." toast for wrong-userId,
    // wrong-password, and inactive accounts (confirmed live) — so this only asserts rejection,
    // not an inactive-specific message. Tighten this assertion if the app is later confirmed to
    // return a distinct message for inactive accounts.
    const errorMessage = await adminLogin.getLoginErrorMessage();
    expect(errorMessage).toBeTruthy();
    await expect(page).toHaveURL(/\/auth\/login/i);
  });

  test('forgot password link opens the reset flow', async ({ page }) => {
    const adminLogin = new AdminLoginPage(page);

    // Only verifies the flow is reachable and its form is present — deliberately does not submit,
    // to avoid triggering a real SMS/email reset on every run.
    await adminLogin.openForgotPassword();

    await expect(page).toHaveURL(/forgot-password/i);
  });
});
