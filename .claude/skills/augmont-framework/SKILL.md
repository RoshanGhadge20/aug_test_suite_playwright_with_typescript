---
name: augmont-framework
description: Load full context on the Augmont test suite's architecture, conventions, and known admin-UI locator quirks. Use at the start of any non-trivial task in this repo (new spec, page object, flow, or debugging a failing test) to get oriented before writing or investigating code.
---

# Augmont Test Suite — Framework Context

Playwright + TypeScript E2E suite for Augmont's gold/digital-gold platform, covering four web panels
(`admin`, `customer`, `business`, `new-admin`) and two backend APIs (`api-backend`, `api-emi`). The repo
also ships a REST runner API (`src/api/`) that triggers Playwright runs remotely. This is a TypeScript
reimplementation of an older Java Selenium suite (`RegresisonSuite`, referenced in migration docs) —
they are independent, do not cross-wire them.

**Read `CLAUDE.md` first** — it is the authoritative, always-loaded architecture doc (env/config layer,
Playwright projects, auth model, page object conventions, tags, gotchas). This skill exists to add two
things CLAUDE.md doesn't cover: a directory map for quick navigation, and hard-won admin-UI locator
quirks discovered through live UAT debugging that aren't written down anywhere else yet.

For deep dives beyond CLAUDE.md, root-level docs already exist — read the one that matches your need
instead of re-deriving it:
- `FRAMEWORK_DOCUMENTATION_INDEX.md` — index of the docs below, read this first to pick one
- `FRAMEWORK_STRUCTURE_FLOW.md` — full architecture walkthrough with diagrams (30-45 min read)
- `EXECUTION_FLOW_QUICK_REFERENCE.md` — one-minute visual overview of `npm run test:*` → browser
- `TROUBLESHOOTING_GUIDE.md` — symptom → cause → fix, for config/env-level issues
- `SETUP_FILE_UPLOADS.md` / `FILE_UPLOAD_FIX_COMPLETE.md` — KYC file-upload test data and fixes
- `docs/superpowers/plans/2026-05-30-java-to-playwright-admin-migration.md` — the Java→Playwright
  admin migration plan; has a table mapping every `pages/admin/*.page.ts` to its Java `PO##_*`/`Flow##_*`
  source class. Check this before assuming a page object's intended behavior — the Java source is the
  spec of record for admin flows.

## Directory map

```
config/            env.ts (Zod-validated .env), urls.ts (panelUrl/panelCreds/apiUrl/apiAuthConfig),
                    constants.ts (PANELS, storageStatePath)
pages/<panel>/      Page Objects: locators + single-page actions, no assertions. All extend
                    pages/shared/base.page.ts; admin ones extend pages/admin/admin-base.page.ts too
                    (adds waitForLoaderToDisappear, jsClick, expandSidebar).
flows/admin/        Reusable multi-page journeys (onboardCustomerThroughKyc, applyAndDisburseLoan,
                    createDisbursedLoan) — composed from page objects, used as setup steps in specs.
fixtures/           base.fixture.ts (page objects), admin.fixture.ts (adds loginAs(role), 4 admin
                    roles), api.fixture.ts (authedRequest for API specs)
tests/<panel>/      Playwright specs (*.spec.ts). Admin TC0x specs are one test() with test.step()
                    per Java method, sharing one page/session — see CLAUDE.md "Serial state model".
test/               Vitest UNIT tests for the runner API (different runner, different config — don't
                    confuse with tests/)
src/api/            Express runner API (POST /api/runs triggers `npx playwright test` as a subprocess)
```

## Fast orientation checklist for a new task

1. If touching an admin page object, check the migration plan doc's PO/Flow mapping table first —
   it tells you which Java class is the source of truth and which sibling page objects re-declare the
   same locators (a house convention: cross-page XPath re-declarations are intentional, not duplication
   to clean up).
2. If the task is "make TC0x pass" or "fix this admin flow", assume you'll need to **run it against
   live UAT and read the actual DOM** — locators ported from Java are frequently wrong for the current
   UI (see quirks below). Don't trust a locator's plausibility; verify it.
3. Default to `TARGET_ENV=uat` for admin flows that mutate loan state — the plain `test` env's
   appraiser OTP login has been unreliable (see Known Environment Issues in project memory).
4. A loan/customer used successfully by an admin flow (e.g. jewellery release) becomes ineligible for
   that same flow on rerun — its status changes server-side. Scan the filtered list for a row still
   offering the needed kebab-menu action rather than always taking the first row.

## Known admin-UI locator quirks (discovered via live UAT testing, 2026-07)

These are real, confirmed mismatches between the ported Java locators/assumptions and the current
admin UI. If you hit a similar symptom, check this list before re-deriving from scratch:

- **Scheme select is `formcontrolname='schemeId'`, not `'scheme'`.** Option labels carry a `[ALL] `
  prefix and stray whitespace (e.g. `" [ALL] ONLY_SECUAT_TS_32 (50000 - 500000) "`), so match by
  substring/regex, not exact label.
- **A scheme whose amount range excludes the loan's amount silently fails "Proceed"** with no visible
  validation error — the button stays clickable, the page just never advances. When auto-selecting a
  scheme, parse each option's `(min - max)` range and pick one that actually contains the loan amount;
  don't hard-code a scheme name.
- **Loan Purpose select is `formcontrolname='loanPurpose'`, not `'purpose'`**; its options only
  populate after a scheme is selected.
- **Custom checkboxes**: `<label class="custom-checkbox">` wraps a native `<input type=checkbox>` that
  is zero-size/hidden by CSS. Waiting for the input to be `visible` (e.g. via a `jsClick` helper that
  does `waitFor({state:'visible'})`) times out forever. Click the `<label>` instead — it natively
  toggles the nested input.
- **Some tables have no real `<table>`/`<th>`/`<td>` tags or explicit ARIA `role` attributes** — they're
  divs styled with CSS `display: table`, which the browser still resolves to implicit
  table/row/columnheader/cell accessibility roles. Playwright's `getByRole()` sees these correctly;
  raw `page.evaluate(() => document.querySelectorAll('table'))` finds nothing. Prefer
  `page.getByRole('row')` / `.getByRole('columnheader')` / `.getByRole('cell')` over raw DOM queries
  when scraping a summary table's values.
- **A bare `//span[normalize-space()='Confirm']`-style locator can match unrelated stray spans**
  elsewhere on the same page (strict-mode violation). Scope to the containing `//button[.//span[...]]`
  instead of a bare span whenever the button also has other spans nearby (icons, tooltips).
- **The "Loan Details" filter's `filterbtn().click()` needs a short settle wait after `.fill()`**
  (~5s) before clicking — without it, Playwright's click retries against an unstable element as the
  Angular table re-renders mid-filter and can time out. `part-payment.page.ts`'s flows already have
  this wait; add it to any new flow that filters this same screen.
- **Quick Pay's offline modal has a "receiving branch" select** (`formcontrolname='receivedAmountForBranchId'`)
  that **Part Payment's offline modal does not have** — don't copy that field across panels/flows that
  look similar; verify each modal's actual field set against a live screenshot.

## Where to look for more

- `MEMORY.md` (auto-memory, cross-session) tracks project-specific state like TC04's pass/fail history
  per environment and specific loan/partner data gaps encountered on UAT — check it before assuming a
  test's current status.
- When a locator seems wrong, the fastest path is: write a throwaway `test()` (or add a temporary
  `console.log` of `page.getByRole(...)`/`locator('option').allTextContents()` inside the real flow),
  run it against UAT, read the screenshot and/or the Playwright HTML error-context snapshot
  (`reports/test-artifacts/**/error-context.md`) which dumps the full accessibility tree at failure
  time — it's often faster than guessing from a screenshot alone.
