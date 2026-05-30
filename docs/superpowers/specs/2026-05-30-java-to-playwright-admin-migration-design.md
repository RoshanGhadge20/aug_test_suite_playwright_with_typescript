# Java → Playwright/TypeScript Migration — Admin Panel

**Date:** 2026-05-30
**Status:** Approved design (pending spec review)
**Source:** `RegresisonSuite` (Java + Selenium + TestNG, gold-loan admin app)
**Target:** `augmont-test-suite` (Playwright + TypeScript), `admin` panel only

## Goal

Migrate the entire Java Selenium regression suite (TC01–TC06 and their ~70 supporting flow classes) into the Playwright/TypeScript `augmont-test-suite` project, scoped to the **admin panel**. The migrated tests join the project's existing `@regression` category and run via the `admin` Playwright project against the same gold-loan admin application the Java suite targets (`*.gfat`/`*.gfau` admin portal).

## Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Scope | All TC01–TC06 scenarios, one plan (internally phased for verifiability) |
| 2 | Test state/ordering | Serial — mirror Java exactly via `test.describe.serial()` |
| 3 | Locator strategy | Port Java XPath verbatim (`page.locator('xpath=...')`) |
| 4 | Test data location | `.env` for creds/URLs + `testdata/admin/admin-data.xlsx` for scenario data |
| 5 | Roles | 4 admin-role accounts (appraiser/primary, BM, OPS, partner); in-test role switching |
| 6 | Spec file layout | 6 files, 1:1 with the Java TC classes |
| 7 | Flow orchestration | Dedicated `flows/admin/*.flow.ts` layer (reusable journeys) |

## Architecture

Three layers, each with one responsibility:

```
pages/admin/*.page.ts     Locators (XPath, verbatim) + single-page atomic actions
flows/admin/*.flow.ts     Reusable multi-page journeys composing page objects + role switches
tests/admin/*.spec.ts     6 serial specs (1 per TC class), tagged @regression @admin
```

- **Page Objects** come from the Java `POxx` (locators) + the single-page methods of the matching `Flowxx`. Each extends a new `pages/admin/admin-base.page.ts` (itself extending the shared `pages/shared/base.page.ts`).
- **Flows** come from the Java `TCxx` chaining and shared preconditions. They exist to avoid duplication: every payment/renewal/release scenario requires a pre-existing disbursed loan, which a flow produces once and all specs reuse.
- **Specs** are thin: a `test.describe.serial()` block whose ordered `test()` steps mirror the Java `@Test` `priority` order, sharing module-scoped state (created customer name, loan id, etc.) exactly as the Java `static` fields did.

### Directory layout (new/changed files)

```
config/
  env.ts                       # EXTEND: add 4 admin role creds (TEST_/UAT_)
  urls.ts                      # EXTEND: expose admin role credentials
pages/admin/
  admin-base.page.ts           # NEW: waitForLoaderToDisappear, jsClick
  login.page.ts                # EXTEND: logout(), loginAs(role)
  customer-management.page.ts  # PO_CustomerManagement + Flow_CustomerManagement
  kyc.page.ts                  # PO01 + Flow01
  kyc-approval.page.ts         # PO02 + Flow02
  ...                          # one per PO/Flow pair (~48 page objects)
flows/admin/
  onboarding.flow.ts           # createCustomer → KYC → approval → assign branch
  gold-loan.flow.ts            # createPacket → applyLoan → BM/OPS/partner approve → disburse → submit
  payments.flow.ts             # quick / part / topup / renew / renew+topup / release building blocks
  partner.flow.ts              # partner & master-data journeys (TC05)
  bt-loan.flow.ts              # BT loan journeys (TC06)
fixtures/
  admin.fixture.ts             # NEW: inject admin page objects + loginAs(role) helper
setup/
  auth.setup.ts                # un-skip admin; seed appraiser (primary) storage state
tests/admin/
  tc01-onboarding-goldloan.spec.ts
  tc02-mode-of-payment.spec.ts
  tc03-customer-validations.spec.ts
  tc04-mode-of-payment-offline.spec.ts
  tc05-partner.spec.ts
  tc06-bt-loan.spec.ts
testdata/admin/
  admin-data.xlsx              # NEW: scenario data (sheets mirror Java sheetLogin fields)
utils/data/
  admin-excel-data.ts          # NEW: typed reader, mirrors customer-excel-data.ts
  test-data.factory.ts         # EXTEND: generateRandomMobile, randomString, randomPan
playwright.config.ts           # admin project: native geolocation + permissions
```

## Spec → Java mapping

| Spec file | Java class | Serial steps |
|---|---|---|
| `tc01-onboarding-goldloan.spec.ts` | TC01_AddCustomer | 11 — customer mgmt, KYC, assign branch, KYC approval, create packet, apply gold loan, assign packet, BM approval, OPS approval, partner approval+disburse, packet submission |
| `tc02-mode-of-payment.spec.ts` | TC02_ModeOfPayment | 8 — quick pay success, quick pay fail, part pay, top-up, renew, renew+top-up, part release, full release |
| `tc03-customer-validations.spec.ts` | TC03_ValidateAddCustomer | 15 — add btn, appraiser/customer request pages, Form60 KYC, view KYC, delete loan, incomplete-in-rating, partner loan, FIC page, bank verify, pown ticket, CPV (non-Arvog/Arvog), DigiO (non-Arvog/Arvog) |
| `tc04-mode-of-payment-offline.spec.ts` | TC04_ValidateModeOfPaymentOffline | 13 — offline quick/part pay, custom fn, proceed/cancel, view txn log, part/full release offline, renew cash-zero, loan view, waiver, manual charges, cancel button |
| `tc05-partner.spec.ts` | TC05_ValidatePartner | 11 — add partner, partner branch, internal user, internal user branch, gold rate, new scheme, lead+edit, karat+edit, waiver type+edit, loan defect edit/view |
| `tc06-bt-loan.spec.ts` | TC06_ValidateBTLoan | 4 — BT loan, advance/ZAH approval, incomplete flow, rejected flow |

**Total: 6 files, ~62 serial steps.**

## Common-function migration (Java `BrowserInitialize`)

Port only what Playwright / the existing project does not already provide.

### Skip — already available
| Java helper | Replacement |
|---|---|
| `waitforElementandClick/SendValue`, `scrollIntoView` | Playwright auto-waiting `locator.click()/fill()` (auto-scrolls) |
| `getTextValuefromElement`, `getAttributeValuefromElement`, `isDisplayed` | `innerText()`, `inputValue()`, `isVisible()` |
| `selectValuefromDropDown` | `locator.selectOption()` |
| `invisibilityofElement` | `locator.waitFor({ state: 'hidden' })` |
| `StringsCompare`, `CheckBoolean` (SoftAssert) | `expect.soft(...)` |
| `captureScreenshot` | config `screenshot: 'only-on-failure'` (already set) |
| `Reporterlog` | `test.step()` + existing winston `logger` |
| `validateFileExtension`, `fileTransferToDestination`, `deleteDirectory` | existing `utils/pdf-utils.ts` + Playwright `download` event |
| `threadSleep` | `page.waitForTimeout()` — ported only where a Java flow explicitly relied on a fixed wait |

### Port — not available, needed
| Java helper | New home |
|---|---|
| `waitForLoaderToDisappear()` (app `.spinner`) | `pages/admin/admin-base.page.ts` |
| `JavascriptClick()` (stubborn elements) | `pages/admin/admin-base.page.ts` `jsClick()` |
| `generateRandomMobile`, `generateRandomString`, `randomPanGenerator` | `utils/data/test-data.factory.ts` |
| Geolocation override (Java used DevTools v139) | Playwright-native: `geolocation` + `permissions: ['geolocation']` on the `admin` project in `playwright.config.ts` (not DevTools) |

## Authentication & roles

The Java flows operate as four users on the **same** admin app, switching via logout/login to advance the approval chain.

- **Config:** `config/env.ts` adds `TEST_ADMIN_APPRAISER_MOBILE/_OTP`, `TEST_ADMIN_BM_MOBILE/_OTP`, `TEST_ADMIN_OPS_MOBILE/_OTP`, `TEST_ADMIN_PARTNER_MOBILE/_OTP` (and the `UAT_` equivalents), Zod-validated like the rest. `.env.example` documents them.
- **Storage state:** `auth.setup.ts` is un-skipped for admin and seeds storage state for the **appraiser/primary** role (the default state the admin project loads).
- **Role switching:** `login.page.ts` gains `logout()` and `loginAs(role)`. A `loginAs(role)` helper on `admin.fixture.ts` performs logout → login as the requested role mid-scenario, the direct port of `loginWithBM/OPS/Partner`. OTP entry reuses `BasePage.fillOtp()`. All roles use the fixed test-env OTP (per `*_OTP`).

## Test data

- Credentials/URLs come from `.env` via the config layer (never read in tests directly).
- Scenario data lives in `testdata/admin/admin-data.xlsx`, read through a new typed `utils/data/admin-excel-data.ts` that mirrors `customer-excel-data.ts` (sheet-per-scenario, header-named columns, cached per file). Sheets cover the fields the Java flows read from `sheetLogin` (branch, lead, state, city, IFSC, account no., proof type, etc.). The QA team fills real values; the repo ships the workbook structure.

## Tagging (regression category)

- Every migrated `describe` title carries `@regression @admin`.
- Feature sub-tags added for filtering: `@kyc`, `@loans`, `@payments`, `@partner`, `@bt-loan`.
- The login/auth smoke check is additionally tagged `@smoke`.
- Run via `npm run test:regression`, `npx playwright test --project=admin --grep @regression`, or runner API `{"projects":["admin"],"grep":"@regression"}`.

## Implementation order (internal phasing)

Even as one plan, work lands in a verifiable order:

1. **Foundation** — `env.ts`/`urls.ts` role creds, `admin-base.page.ts`, `login.page.ts` (logout/loginAs), `admin.fixture.ts`, `test-data.factory.ts` extensions, `auth.setup.ts` admin seed, `playwright.config.ts` geolocation, `admin-excel-data.ts` + workbook skeleton.
2. **TC01 chain** — onboarding + gold-loan page objects + flows + `tc01` spec, proving the serial/role-switch pattern end-to-end.
3. **TC02–TC06** — remaining page objects, flows, and specs.
4. **Download-dependent flows** — pown ticket, receipts (reuse `pdf-utils`).

## Risks & assumptions

- **XPath fidelity:** ported XPaths assume the admin UI markup matches what the Java suite targets. If the panel has drifted, locators need live re-verification — not possible during plan authoring.
- **OTP backdoor:** assumes the fixed-OTP test login works for all four admin roles on the target env.
- **Excel/env values:** structure is delivered; real credentials and data values are filled by the team.
- **New `flows/` layer** diverges from the customer panel's inline convention; justified by cross-TC reuse of the onboarding+loan precondition.
- **Serial coupling:** within a spec, a failed early step fails/serial-skips later steps (intended — mirrors Java). The existing `RetryAnalyzer` (retry once) maps to per-project `retries`.

## Out of scope

- Other panels (customer/business/new-admin) — unchanged.
- Modernizing locators to role/testid.
- Making tests independent/parallel within a scenario.
- Migrating the Java HTML/Extent reporting (Playwright's reporter replaces it).
