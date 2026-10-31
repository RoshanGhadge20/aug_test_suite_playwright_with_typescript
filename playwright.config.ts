import { defineConfig, devices } from "@playwright/test";
import * as fs from "fs";
import { execFileSync } from "child_process";
import { storageStatePath } from "./config/constants";
import type { Panel } from "./config/constants";
import { panelUrl, apiUrl } from "./config/urls";
import { getTargetEnv, type EnvName } from "./config/environments";

const targetEnv = getTargetEnv();

// setup/auth.setup.ts runs inside a worker, whose process.argv does NOT contain the CLI flags,
// so it can't tell which project was requested. Decide it here, in the main process (env set
// before workers fork is inherited): a run of ONLY the admin project must not also log in to
// the customer / business / new-admin panels via the shared auth-setup project.
{
  const argv = process.argv.join(" ");
  const names = [...argv.matchAll(/--project(?:=|\s+)([\w-]+)/g)].map(
    (m) => m[1],
  );
  if (
    !process.env.TARGET_PANEL &&
    names.length > 0 &&
    names.every((n) => n === "admin" || n === "auth-setup")
  ) {
    process.env.TARGET_PANEL = "admin";
  }
}
const isCI = !!process.env.CI;
const headless = process.env.HEADLESS !== "false";

function getPrimaryScreenSize(): { width: number; height: number } {
  try {
    const out = execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        "$v = Get-CimInstance -ClassName Win32_VideoController | " +
          "Where-Object { $_.CurrentHorizontalResolution -gt 0 } | " +
          'Select-Object -First 1; "$($v.CurrentHorizontalResolution)x$($v.CurrentVerticalResolution)"',
      ],
      { encoding: "utf-8", timeout: 5000 },
    ).trim();
    const [width, height] = out.split("x").map(Number);
    if (width > 0 && height > 0) return { width, height };
  } catch {
    // Non-Windows host or PowerShell unavailable — fall through to the default below.
  }
  return { width: 1920, height: 1080 };
}

const { width: screenWidth, height: screenHeight } = getPrimaryScreenSize();

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
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: process.env.PW_WORKERS
    ? Number(process.env.PW_WORKERS)
    : isCI
      ? 2
      : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html", open: "never" }],
    ["json", { outputFile: "reports/results.json" }],
    [
      "allure-playwright",
      {
        resultsDir: "reports/allure-results",
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          Environment: targetEnv,
          Panel: process.env.TARGET_PANEL ?? "all",
          Headless: String(headless),
          CI: String(isCI),
          OS: process.platform,
          Node: process.version,
        },
      },
    ],
  ],
  outputDir: "reports/test-artifacts",
  use: {
    headless,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    geolocation: { latitude: 18.5204, longitude: 73.8567 },
    permissions: ["geolocation", "camera", "microphone"],
    viewport: null,
    deviceScaleFactor: undefined,
    launchOptions: {
      args: [
        "--start-maximized",
        `--window-size=${screenWidth},${screenHeight}`,
        "--window-position=0,0",
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
      ],
    },
  },
  globalSetup: "./setup/global-setup.ts",
  projects: [
    { name: "auth-setup", testDir: "./setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "admin",
      use: {
        ...devices["Desktop Chrome"],
        viewport: null,
        deviceScaleFactor: undefined,
        baseURL: panelUrl("admin", targetEnv),
      },
      workers: 1,
      fullyParallel: false,
      dependencies: ["auth-setup"],
      testMatch: /tests\/admin\/.*\.spec\.ts/,
    },
    {
      name: "customer",
      use: {
        ...devices["Desktop Chrome"],
        viewport: null,
        deviceScaleFactor: undefined,
        baseURL: panelUrl("customer", targetEnv),
        storageState: storageStateIfExists(targetEnv, "customer"),
      },
      workers: 1,
      fullyParallel: false,
      dependencies: ["auth-setup"],
      testMatch: /tests\/customer\/.*\.spec\.ts/,
    },
    {
      name: "business",
      use: {
        ...devices["Desktop Chrome"],
        viewport: null,
        deviceScaleFactor: undefined,
        baseURL: panelUrl("business", targetEnv),
        storageState: storageStateIfExists(targetEnv, "business"),
      },
      dependencies: ["auth-setup"],
      testMatch: /tests\/business\/.*\.spec\.ts/,
    },
    {
      name: "new-admin",
      use: {
        ...devices["Desktop Chrome"],
        viewport: null,
        deviceScaleFactor: undefined,
        baseURL: panelUrl("new-admin", targetEnv),
        storageState: storageStateIfExists(targetEnv, "new-admin"),
      },
      dependencies: ["auth-setup"],
      testMatch: /tests\/new-admin\/.*\.spec\.ts/,
    },
    {
      name: "api-backend",
      use: {
        baseURL: apiUrl("api-backend", targetEnv),
        extraHTTPHeaders: { "Content-Type": "application/json" },
      },
      testMatch: /tests\/api\/backend\/.*\.spec\.ts/,
    },
    {
      name: "api-emi",
      use: {
        baseURL: apiUrl("api-emi", targetEnv),
        extraHTTPHeaders: { "Content-Type": "application/json" },
      },
      testMatch: /tests\/api\/emi\/.*\.spec\.ts/,
    },
  ],
});
