import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { panelUrl, panelCreds, adminRoleCreds } from '../config/urls';
import { storageStatePath } from '../config/constants';
import { getTargetEnv } from '../config/environments';
import { AdminLoginPage } from '../pages/admin/login.page';
import { CustomerLoginPage } from '../pages/customer/login.page';
import { BusinessLoginPage } from '../pages/business/login.page';
import { NewAdminLoginPage } from '../pages/new-admin/login.page';

const targetEnv = getTargetEnv();

function ensureStorageDir(storagePath: string): void {
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
}

/** Companion file that persists sessionStorage (not captured by Playwright's storageState). */
function sessionStorageSavePath(storagePath: string): string {
  return path.join(path.dirname(storagePath), 'admin-session-storage.json');
}

setup('authenticate admin', async ({ browser }) => {
  const storagePath = storageStatePath(targetEnv, 'admin');
  const ssPath = sessionStorageSavePath(storagePath);

  // Skip re-login only when BOTH files are present (regular state + sessionStorage).
  if (fs.existsSync(storagePath) && fs.existsSync(ssPath)) {
    console.log(`[auth-setup] Reusing cached admin session (${storagePath}); delete to force re-login`);
    return;
  }

  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('admin', targetEnv) });
  const page = await ctx.newPage();
  const login = new AdminLoginPage(page);
  const { mobile, otp } = adminRoleCreds('admin', targetEnv);
  await login.login(mobile, otp);

  // Save cookies + localStorage
  await ctx.storageState({ path: storagePath });

  // Save sessionStorage separately (Playwright storageState cannot capture it)
  const sessionData: Record<string, string> = await page.evaluate(() =>
    Object.fromEntries(Object.entries(window.sessionStorage)),
  );
  fs.writeFileSync(ssPath, JSON.stringify(sessionData, null, 2));

  await ctx.close();
});

setup('authenticate customer', async ({ browser }) => {
  const { mobile, otp } = panelCreds('customer', targetEnv);
  setup.skip(!mobile || !otp, `No customer credentials configured for ${targetEnv} — skipping`);
  const storagePath = storageStatePath(targetEnv, 'customer');
  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('customer', targetEnv) });
  const page = await ctx.newPage();
  const login = new CustomerLoginPage(page);
  console.log(`[customer login] env=${targetEnv} mobile=${mobile}`);
  await login.login(mobile, otp);
  await ctx.storageState({ path: storagePath });
  await ctx.close();
});

setup('authenticate business', async ({ browser }) => {
  setup.skip(true, 'Skipped due to TARGET_PANEL filter');
  const storagePath = storageStatePath(targetEnv, 'business');
  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('business', targetEnv) });
  const page = await ctx.newPage();
  const login = new BusinessLoginPage(page);
  const { mobile, otp } = panelCreds('business', targetEnv);
  await login.login(mobile, otp);
  await ctx.storageState({ path: storagePath });
  await ctx.close();
});

setup('authenticate new-admin', async ({ browser }) => {
  setup.skip(true, 'Skipped due to TARGET_PANEL filter');
  const storagePath = storageStatePath(targetEnv, 'new-admin');
  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('new-admin', targetEnv) });
  const page = await ctx.newPage();
  const login = new NewAdminLoginPage(page);
  const { mobile, otp } = panelCreds('new-admin', targetEnv);
  await login.login(mobile, otp);
  await ctx.storageState({ path: storagePath });
  await ctx.close();
});





























































































