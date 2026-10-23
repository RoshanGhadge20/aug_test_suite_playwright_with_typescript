/**
 * One-shot inspector: restores the admin session and reads the Auditor dropdown
 * options from the Add Internal Branch form.
 * Run: npx ts-node --project tsconfig.json scripts/inspect-auditor-options.ts
 */
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import { panelUrl, adminRoleCreds } from '../config/urls';
import { storageStatePath } from '../config/constants';
import { getTargetEnv } from '../config/environments';
import * as path from 'path';

(async () => {
  const env = getTargetEnv();
  const storagePath = storageStatePath(env, 'admin');
  const ssPath = path.join(path.dirname(storagePath), 'admin-session-storage.json');

  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ baseURL: panelUrl('admin', env) });
  const page = await ctx.newPage();

  if (fs.existsSync(ssPath)) {
    const sessionData: Record<string, string> = JSON.parse(fs.readFileSync(ssPath, 'utf-8'));
    await page.addInitScript((data: Record<string, string>) => {
      for (const [k, v] of Object.entries(data)) window.sessionStorage.setItem(k, v);
    }, sessionData);
    await page.goto('/');
    console.log('Session restored from file.');
  } else {
    const login = await import('../pages/admin/login.page');
    const loginPage = new login.AdminLoginPage(page);
    const { mobile, otp } = adminRoleCreds('admin', env);
    await loginPage.login(mobile, otp);
    console.log('Logged in fresh.');
  }

  // Wait for dashboard
  await page.waitForTimeout(7000);

  // Same navigation as navigateToInternalUserBranch():
  // 1. Open profile → select branch
  await page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']").click();
  const branchDd = page.locator("xpath=//select[@id='branch']");
  await branchDd.waitFor({ state: 'visible', timeout: 10000 });
  const opts = await branchDd.locator('option').allInnerTexts();
  console.log('Branch options:', opts);
  await branchDd.selectOption({ index: 1 }); // pick first real option
  await page.waitForTimeout(7000);

  // 2. Click arrow (sidebar toggle) → User Management → Internal User Branch
  await page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']").click();
  await page.waitForTimeout(1000);
  await page.locator("xpath=//span[normalize-space()='User Management']").click();
  await page.waitForTimeout(5000);
  await page.locator("xpath=//span[normalize-space()='Internal User Branch']").click();
  await page.waitForTimeout(3000);

  // Click Add Internal Branch
  await page.locator("xpath=//button[normalize-space()='Add Internal Branch']").click();
  await page.waitForTimeout(2000);

  // Select state first (may be needed to populate auditor options)
  await page.locator("xpath=//select[@formcontrolname='stateId']").selectOption({ label: 'Maharashtra' });
  await page.waitForTimeout(1000);

  // Read auditor options
  const auditorOptions = await page
    .locator("xpath=//select[@formcontrolname='auditorId'] option")
    .allInnerTexts();
  console.log('\n=== Auditor dropdown options ===');
  auditorOptions.forEach((o, i) => console.log(`  [${i}] "${o}"`));

  await browser.close();
})();
