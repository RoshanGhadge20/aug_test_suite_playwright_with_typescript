import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE_PATH } from './config/constants';
import { PANEL_URLS, API_SERVICE_URLS } from './config/urls';

const isCI = !!process.env.CI;
const headless = process.env.HEADLESS !== 'false';

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
    { name: 'auth-setup', testMatch: /setup\/auth\.setup\.ts/ },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS.admin, storageState: STORAGE_STATE_PATH.admin },
      dependencies: ['auth-setup'],
      testMatch: /tests\/admin\/.*\.spec\.ts/,
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS.customer, storageState: STORAGE_STATE_PATH.customer },
      dependencies: ['auth-setup'],
      testMatch: /tests\/customer\/.*\.spec\.ts/,
    },
    {
      name: 'business',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS.business, storageState: STORAGE_STATE_PATH.business },
      dependencies: ['auth-setup'],
      testMatch: /tests\/business\/.*\.spec\.ts/,
    },
    {
      name: 'new-admin',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS['new-admin'], storageState: STORAGE_STATE_PATH['new-admin'] },
      dependencies: ['auth-setup'],
      testMatch: /tests\/new-admin\/.*\.spec\.ts/,
    },
    {
      name: 'api-backend',
      use: { baseURL: API_SERVICE_URLS['api-backend'], extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/backend\/.*\.spec\.ts/,
    },
    {
      name: 'api-emi',
      use: { baseURL: API_SERVICE_URLS['api-emi'], extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/emi\/.*\.spec\.ts/,
    },
    {
      name: 'api-lgd',
      use: { baseURL: API_SERVICE_URLS['api-lgd'], extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/lgd\/.*\.spec\.ts/,
    },
  ],
});
