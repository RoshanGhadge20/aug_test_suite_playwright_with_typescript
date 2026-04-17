import { test as setup, expect } from '@playwright/test';
import { PANEL_URLS, PANEL_CREDENTIALS } from '../config/urls';
import { STORAGE_STATE_PATH } from '../config/constants';
import { AdminLoginPage } from '../pages/admin/login.page';
import { CustomerLoginPage } from '../pages/customer/login.page';
import { BusinessLoginPage } from '../pages/business/login.page';
import { NewAdminLoginPage } from '../pages/new-admin/login.page';

setup('authenticate admin', async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: PANEL_URLS.admin });
  const page = await ctx.newPage();
  const login = new AdminLoginPage(page);
  const { email, password } = PANEL_CREDENTIALS.admin;
  await login.login(email, password);
  await ctx.storageState({ path: STORAGE_STATE_PATH.admin });
  await ctx.close();
});

setup('authenticate customer', async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: PANEL_URLS.customer });
  const page = await ctx.newPage();
  const login = new CustomerLoginPage(page);
  const { email, password } = PANEL_CREDENTIALS.customer;
  await login.login(email, password);
  await ctx.storageState({ path: STORAGE_STATE_PATH.customer });
  await ctx.close();
});

setup('authenticate business', async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: PANEL_URLS.business });
  const page = await ctx.newPage();
  const login = new BusinessLoginPage(page);
  const { email, password } = PANEL_CREDENTIALS.business;
  await login.login(email, password);
  await ctx.storageState({ path: STORAGE_STATE_PATH.business });
  await ctx.close();
});

setup('authenticate new-admin', async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: PANEL_URLS['new-admin'] });
  const page = await ctx.newPage();
  const login = new NewAdminLoginPage(page);
  const { email, password } = PANEL_CREDENTIALS['new-admin'];
  await login.login(email, password);
  await ctx.storageState({ path: STORAGE_STATE_PATH['new-admin'] });
  await ctx.close();
});
