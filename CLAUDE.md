# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Playwright + TypeScript end-to-end test suite for **Augmont's gold/digital-gold platform**, covering four web panels (`admin`, `customer`, `business`, `new-admin`) and two backend HTTP APIs (`api-backend` = gold-loan-backend, `api-emi` = EMI service). It ships **two deliverables from one repo**:

1. **The test suite** — Playwright specs under `tests/`, driven by Page Objects and fixtures.
2. **A REST runner API** (`src/api/`, Express) — lets you trigger Playwright runs remotely (`POST /api/runs`), poll status, and fetch the HTML report. Packaged as a single Docker image for EC2.

> This is a newer TypeScript reimplementation of the Java Selenium suite in the sibling `RegresisonSuite` workspace folder. They are independent — don't cross-wire them. `README.md` is detailed and authoritative on API usage, deployment, and tag conventions; read it for anything this file doesn't cover.

## Admin gold-loan regression suite (migrated from Java)

The Java Selenium `RegresisonSuite` (TC01–TC06) has been ported into the `admin` panel here. Design + plan: `docs/superpowers/specs/2026-05-30-java-to-playwright-admin-migration-design.md` and `docs/superpowers/plans/2026-05-30-java-to-playwright-admin-migration.md`.

- **Layers:** `pages/admin/*.page.ts` (locators ported verbatim as XPath + single-page actions, extending `pages/admin/admin-base.page.ts`), `flows/admin/*.flow.ts` (reusable journeys — `onboardCustomerThroughKyc`, `applyAndDisburseLoan`, `createDisbursedLoan`), `tests/admin/tc0[1-6]-*.spec.ts` (one spec per Java TC class).
- **Serial state model:** each spec is **one `test()` with a `test.step()` per Java method**, sharing a single page/session (Playwright gives each `test()` a fresh page, so multiple tests would lose state). TC02/03/04/06 call a flow as a setup step to build their precondition (e.g. `createDisbursedLoan`).
- **Multi-role auth:** the admin app uses four roles. `.env` holds `TEST_/UAT_ADMIN_{APPRAISER,BM,OPS,PARTNER}_{MOBILE,OTP}` (validated in `config/env.ts`, resolved via `adminRoleCreds` in `config/urls.ts`, role names in `config/roles.ts`). `auth-setup` seeds the **appraiser** storage state; specs switch roles mid-test via the `loginAs(role)` fixture (`fixtures/admin.fixture.ts`), which logs out and back in.
- **Test data:** `testdata/admin/admin-data.xlsx` via `utils/data/admin-excel-data.ts` (`getLoginData()`); random values via `TestDataFactory.mobile()/.pan()/.stamp()`.
- **Tags:** all migrated specs are `@regression @admin` plus a feature tag — `@loans` (TC01), `@payments` (TC02/TC04), `@kyc` (TC03), `@partner` (TC05), `@bt-loan` (TC06). Run via `npx playwright test --project=admin --grep @regression` or the runner API `{"projects":["admin"],"grep":"@regression"}`.
- **Running for real needs:** a populated `.env` with the four role accounts + a reachable admin app. The ports are verified to compile/typecheck and are collected by Playwright; **locators (verbatim Java XPath) still need validation against the live admin UI**, and file-upload steps take optional path params (skipped until wired). Pown-ticket download uses Playwright's `download` event with an inline-PDF fallback.

## Commands

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env            # required: env validation fails fast without it (see config/env.ts)

# Playwright (UI + API e2e)
npm test                        # full run, all projects
npm run test:smoke              # @smoke only      | npm run test:regression  @regression only
npm run test:admin              # one panel        | test:customer / test:business / test:new-admin
npm run test:api                # both API services| test:api:backend / test:api:emi
npx playwright test --project=customer --grep @smoke
TARGET_ENV=uat npx playwright test --project=admin     # pick env per-run (default: DEFAULT_ENV from .env)

# Vitest (unit tests for the API server + utils, under test/)
npm run test:unit               # NOTE: sets SKIP_ENV_VALIDATION=true so .env isn't needed
npm run test:unit -- test/api/runs.routes.test.ts      # single file

# Runner API server
npm run api:dev                 # tsx watch on :3000  (curl :3000/health)
npm run build && npm run api:start

# Quality gates
npm run typecheck               # tsc --noEmit, strict mode
```

**Two distinct test layers, do not confuse them:** `tests/**/*.spec.ts` are **Playwright** e2e (run with `playwright test`). `test/**/*.test.ts` are **Vitest** unit tests for the runner API and utilities (run with `vitest`). They use different runners and different config files (`playwright.config.ts` vs `vitest.config.ts`).

## Architecture

### Environment & config layer (`config/`)
The spine everything else reads from. Two target environments, `test` and `uat`, selected at runtime by `TARGET_ENV` (falls back to `DEFAULT_ENV`, then `'test'`) via `getTargetEnv()`.

- **`env.ts`** — Zod-validated `process.env`. Every URL/credential is required and validated at import time; a missing field throws immediately. Escape hatch: `SKIP_ENV_VALIDATION=true` returns an empty env (used by unit tests). All keys are prefixed `TEST_` / `UAT_`.
- **`urls.ts`** — builds per-env "bundles" of panel URLs, panel login creds, API URLs, and API creds from those prefixed env vars. Use `panelUrl()`, `panelCreds()`, `apiUrl()`, `apiCreds()`, `apiAuthConfig()` — never read `process.env` directly in tests.
- **`constants.ts`** — `PANELS`, `API_SERVICES`, `ProjectId` types, and `storageStatePath(env, panel)` → `storage/<env>/<panel>.json`.

### Playwright projects (`playwright.config.ts`)
One project per panel + per API service. Key wiring:
- **UI panel projects** (`admin`/`customer`/`business`/`new-admin`) each declare `dependencies: ['auth-setup']` and load `storageState` from `storage/<env>/<panel>.json`. If that file is missing the config warns and runs unauthenticated.
- **`auth-setup`** project (`setup/auth.setup.ts`) logs in per panel via the panel's `LoginPage` and saves storage state. **Currently only the `customer` setup runs — admin/business/new-admin call `setup.skip(true, ...)`.** Re-enable those skips when working on those panels.
- **API projects** (`api-backend`/`api-emi`) launch **no browser**; they do not depend on `auth-setup`.

### Authentication — two completely separate mechanisms
- **UI auth** = storage state. `auth-setup` performs an OTP login once and persists cookies/localStorage per `<env>/<panel>`; specs reuse it.
- **API auth** = bearer token via `authedRequest` fixture (`fixtures/api.fixture.ts` → `utils/api/api-auth.ts`). It POSTs `mobile` to `/api/v1/auth/send-otp`, then `{mobile, otp}` to `/api/v1/auth/verify-otp`, extracts the token at JSON path `data.token`, and caches it **5 minutes per worker** keyed by `env:service:mobile`.
- **All logins are OTP-based with a fixed "backdoor" OTP** that the test/uat environments accept (configured per user via `*_USER_OTP`). There are no passwords.

### Page Objects (`pages/`)
`pages/<panel>/<feature>.page.ts`, all extend `pages/shared/base.page.ts` (`BasePage`). `BasePage` provides `goto`, `waitForUrl`, `byTestId`/`byRole` helpers, `parseAmount` (strips ₹/commas), and a robust `fillOtp` that auto-detects single-input vs per-digit OTP layouts. **Page Objects hold locators and actions, no assertions** (assertions belong in specs). UI specs get Page Objects injected via the `base.fixture.ts` fixture (extend it, don't `new` page objects in tests).

### Test data (`testdata/`, `utils/data/`)
Customer flows read from an **Excel workbook** `testdata/customer/customer-data.xlsx` via `utils/data/customer-excel-data.ts` (uses the `xlsx` lib, sheet-per-scenario, header-named columns, cached per file). Some helpers also write computed values back into the workbook. `utils/data/test-data.factory.ts` generates synthetic data.

### Runner API (`src/api/`)
Express app assembled in `server.ts`: `express.json` → public `health.routes` → `/api` guarded by `createAuthMiddleware(API_KEY)` (header `X-API-Key`) → `runs.routes` → `error.middleware`.
- **`RunManager`** (`services/run-manager.service.ts`) — in-memory `Map` of `RunRecord`s (status, exit code, stdout/stderr tails capped at 10KB, artifact dir). **State is not persisted** — restarting the server loses run history. Enforces `maxConcurrent` (default 2) → `POST /api/runs` returns `429` when at capacity.
- **`executePlaywright`** (`services/playwright-executor.service.ts`) — `buildPlaywrightArgs()` translates a validated `RunRequest` into `playwright test` CLI args, then `spawn('npx', ['playwright', ...])` with `TARGET_ENV`/`HEADLESS` and per-run report paths in the env. Runs fire asynchronously via `setImmediate`; the POST returns `202` immediately. **Security: `specFiles` are rejected if absolute or containing `..` (path-traversal guard) — preserve this when editing.**
- Request validation is Zod (`schemas/run-request.schema.ts`); types in `types/run.types.ts`.

## Conventions

- **Tags** live in the `test.describe` title. Every test should carry a suite tag (`@smoke` / `@regression`) and a scope tag (`@admin`/`@customer`/`@business`/`@new-admin`/`@api`); optional feature tags `@users`/`@loans`/`@emi`. Filter via `--grep`/`--grep-invert` or the `grep` field on `POST /api/runs`. See README "Test conventions" for the full table.
- **Path aliases** are defined in `tsconfig.json` (`@config/*`, `@pages/*`, `@fixtures/*`, `@utils/*`, `@api/*`) — note specs currently use relative imports; both work.
- **Writing an API test:** `import { apiTest as test, expect } from '../../../fixtures/api.fixture'` and use the `authedRequest` context for authenticated calls.
- Reports/artifacts go to `reports/` (gitignored). Per-run API artifacts go to `reports/runs/<id>/`.

## Gotchas / known rough edges

- **Playwright version mismatch:** `package.json` pins `@playwright/test@^1.59.1`, but `Dockerfile` builds on the `mcr.microsoft.com/playwright:v1.47.0-jammy` image. Bump the image to match when touching Docker.
- **Docker `CMD` runs tests, not the API server:** the Dockerfile's `CMD` is `npx playwright test --project=customer`; the `node dist/src/api/index.js` server entrypoint is commented out, even though the README presents the API server as the deployment. Decide intent before relying on either.
- **`auth-setup` only authenticates `customer`** (see above) — admin/business/new-admin specs will run unauthenticated until their `setup.skip` lines are removed.
- `setup/global-setup.ts` logs `process.env.ENV`, but the env selector is `TARGET_ENV`/`DEFAULT_ENV` — the log line is cosmetic, not the source of truth.
- Some customer spec files have a UTF-8 BOM / mojibake in comments (e.g. `tests/customer/shop.spec.ts`); harmless but don't propagate it.
