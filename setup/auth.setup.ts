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
const targetPanel = process.env.TARGET_PANEL as
  | 'admin'
  | 'customer'
  | 'business'
  | 'new-admin'
  | undefined;

type AuthPanel = 'admin' | 'customer' | 'business' | 'new-admin';

/** When unset, skip business/new-admin. Skip admin when only the customer project is on the CLI. */
function shouldAuthenticate(panel: AuthPanel): boolean {
  if (targetPanel) return targetPanel === panel;
  const argv = process.argv.join(' ');
  const customerOnly =
    /--project(?:=|\s+)customer\b/.test(argv) &&
    !/--project(?:=|\s+)admin\b/.test(argv);
  const adminOnly =
    /--project(?:=|\s+)admin\b/.test(argv) &&
    !/--project(?:=|\s+)(?:customer|business|new-admin)\b/.test(argv);
  if (customerOnly && panel === 'admin') return false;
  // Running only the admin project: don't log in to the customer panel as a side effect.
  if (adminOnly && panel !== 'admin') return false;
  if (panel === 'business' || panel === 'new-admin') return false;
  return true;
}

function ensureStorageDir(storagePath: string): void {
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
}

setup('authenticate admin', async ({ browser }) => {
  setup.skip(!shouldAuthenticate('admin'), `Skipped admin auth (TARGET_PANEL=${targetPanel ?? 'customer-only run'})`);
  const storagePath = storageStatePath(targetEnv, 'admin');
  setup.skip(fs.existsSync(storagePath), `Reusing cached admin storage state (${storagePath}); delete it to force re-login`);
  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('admin', targetEnv) });
  const page = await ctx.newPage();
  const login = new AdminLoginPage(page);
  const { mobile, otp } = adminRoleCreds('appraiser', targetEnv);
  await login.login(mobile, otp);
  await ctx.storageState({ path: storagePath });
  await ctx.close();
});


setup('authenticate customer', async ({ browser }) => {
  setup.skip(!shouldAuthenticate('customer'), `Skipped customer auth (TARGET_PANEL=${targetPanel ?? 'n/a'})`);
  const { mobile, otp } = panelCreds('customer', targetEnv);
  setup.skip(!mobile || !otp, `No customer credentials configured for ${targetEnv} — skipping`);
  const storagePath = storageStatePath(targetEnv, 'customer');
 // setup.skip(fs.existsSync(storagePath), `Reusing cached customer storage state (${storagePath}); delete it to force re-login`);
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
  setup.skip(!shouldAuthenticate('business'), 'Skipped business auth (set TARGET_PANEL=business to enable)');
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
  setup.skip(!shouldAuthenticate('new-admin'), 'Skipped new-admin auth (set TARGET_PANEL=new-admin to enable)');
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





























































































