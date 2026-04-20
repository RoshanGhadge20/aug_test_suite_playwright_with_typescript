import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { panelUrl, panelCreds } from '../config/urls';
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

setup('authenticate admin', async ({ browser }) => {
  const storagePath = storageStatePath(targetEnv, 'admin');
  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('admin', targetEnv) });
  const page = await ctx.newPage();
  const login = new AdminLoginPage(page);
  const { mobile, otp } = panelCreds('admin', targetEnv);
  await login.login(mobile, otp);
  await ctx.storageState({ path: storagePath });
  await ctx.close();
});

setup('authenticate customer', async ({ browser }) => {
  const storagePath = storageStatePath(targetEnv, 'customer');
  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('customer', targetEnv) });
  const page = await ctx.newPage();
  const login = new CustomerLoginPage(page);
  const { mobile, otp } = panelCreds('customer', targetEnv);
  await login.login(mobile, otp);
  await ctx.storageState({ path: storagePath });
  await ctx.close();
});

setup('authenticate business', async ({ browser }) => {
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
