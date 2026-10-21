import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import { storageStatePath } from './config/constants';
import type { Panel } from './config/constants';
import { panelUrl, apiUrl } from './config/urls';
import { getTargetEnv, type EnvName } from './config/environments';

const targetEnv = getTargetEnv();
const isCI = !!process.env.CI;
const headless = process.env.HEADLESS !== 'false';

function storageStateIfExists(env: EnvName, panel: Panel): string | undefined {
  const p = storageStatePath(env, panel);
  if (fs.existsSync(p)) return p;
  console.warn(
    `[playwright.config] storage state for ${panel}@${env} not found at ${p}. ` +
    `Tests will run unauthenticated. Run the auth-setup project first: ` +
    `\`npx playwright test --project=auth-setup\`.`,
  );
  return undefined;
}

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : (isCI ? 2 : undefined),
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],
  outputDir: 'reports/test-artifacts',
  use: {
    headless,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: './setup/global-setup.ts',
  projects: [
    { name: 'auth-setup', testDir: './setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], baseURL: panelUrl('admin', targetEnv), storageState: storageStateIfExists(targetEnv, 'admin') },
      dependencies: ['auth-setup'],
      testMatch: /tests\/admin\/.*\.spec\.ts/,
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], baseURL: panelUrl('customer', targetEnv), storageState: storageStateIfExists(targetEnv, 'customer') },
      dependencies: ['auth-setup'],
      testMatch: /tests\/customer\/.*\.spec\.ts/,
    },
    {
      name: 'business',
      use: { ...devices['Desktop Chrome'], baseURL: panelUrl('business', targetEnv), storageState: storageStateIfExists(targetEnv, 'business') },
      dependencies: ['auth-setup'],
      testMatch: /tests\/business\/.*\.spec\.ts/,
    },
    {
      name: 'new-admin',
      use: { ...devices['Desktop Chrome'], baseURL: panelUrl('new-admin', targetEnv), storageState: storageStateIfExists(targetEnv, 'new-admin') },
      dependencies: ['auth-setup'],
      testMatch: /tests\/new-admin\/.*\.spec\.ts/,
    },
    {
      name: 'api-backend',
      use: { baseURL: apiUrl('api-backend', targetEnv), extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/backend\/.*\.spec\.ts/,
    },
    {
      name: 'api-emi',
      use: { baseURL: apiUrl('api-emi', targetEnv), extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/emi\/.*\.spec\.ts/,
    },
  ],
});
