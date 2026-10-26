import * as fs from 'fs';
import * as path from 'path';
import type { Browser } from '@playwright/test';
import { storageStatePath } from '../../../config/constants';
import { getTargetEnv } from '../../../config/environments';
import { panelCreds, panelUrl } from '../../../config/urls';
import { CustomerLoginPage } from '../../../pages/customer/login.page';

/**
 * The UAT customer account allows ONE active session. A spec that logs in again as the main
 * customer invalidates the session `auth-setup` saved, so every later spec loading
 * storage/<env>/customer.json lands on /login. Call this from `afterEach` in such specs: it logs
 * in again in a fresh context (same steps as auth-setup) and overwrites the saved storage state,
 * so later specs pick up the new valid session — whether the spec passed or failed.
 */
export async function refreshCustomerStorageState(browser: Browser): Promise<void> {
  const env = getTargetEnv();
  const { mobile, otp } = panelCreds('customer', env);
  const storagePath = storageStatePath(env, 'customer');
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  const ctx = await browser.newContext({ baseURL: panelUrl('customer', env) });
  try {
    const page = await ctx.newPage();
    await new CustomerLoginPage(page).login(mobile, otp);
    await ctx.storageState({ path: storagePath });
    console.log(`[customer session] re-saved ${storagePath} for ${mobile}`);
  } finally {
    await ctx.close();
  }
}
