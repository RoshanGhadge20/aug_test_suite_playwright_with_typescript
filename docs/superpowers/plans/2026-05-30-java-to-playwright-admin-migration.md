# Admin Panel Java→Playwright Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Java Selenium/TestNG gold-loan regression suite (TC01–TC06 + ~70 flow classes) into the `augmont-test-suite` Playwright/TypeScript project as the `admin` panel, tagged `@regression @admin`.

**Architecture:** Three layers — `pages/admin/*.page.ts` (XPath locators + single-page actions, ported verbatim from Java `POxx`+`Flowxx`), `flows/admin/*.flow.ts` (reusable multi-page journeys + role switches), `tests/admin/*.spec.ts` (6 serial specs, one per Java TC class). Multi-role auth via `.env` credentials + in-test logout/login. Serial state mirrors the Java `static`-field chaining via `test.describe.serial()`.

**Tech Stack:** Playwright `@playwright/test`, TypeScript (strict), Zod (env validation), `xlsx` (test data), Vitest (unit tests for utils), Express runner API (unchanged).

**Design spec:** `docs/superpowers/specs/2026-05-30-java-to-playwright-admin-migration-design.md`
**Java source root:** `/Users/divyeshpatel/Downloads/RegresisonSuite/src/main/java`

---

## How to use this plan

The plan has two kinds of tasks:

1. **Foundation tasks (Phase 1–2)** — full code is provided. Follow TDD: write the test, watch it fail, implement, watch it pass, commit.
2. **Port tasks (Phase 3–5)** — mechanical verbatim ports of Java files. Each task names the **exact Java source file** to read and the **recipe** (below) to apply. The Java file is the source of truth; do not invent locators. Verification for these is a typecheck + a smoke run of the owning spec, not a unit test (page objects are UI glue, unit-tested only where pure logic exists).

### Porting recipe (apply to every `pages/admin/*.page.ts`)

For a Java pair `POxx_Name.java` (locators) + `Flowxx_Name.java` (actions) → `pages/admin/<kebab-name>.page.ts`:

1. Class `extends AdminBasePage` (from Phase 1), constructor `(page: Page) { super(page); }`.
2. Each Java `public static By loc_x = By.xpath("…")` becomes a private locator getter:
   `private readonly x = () => this.page.locator("xpath=…");` — **copy the XPath string verbatim**, only escaping `"`/`'` for TS.
3. Each Java `public static void method()` in the Flow becomes `async method(): Promise<void>`:
   - `waitforElementandClick(loc)` → `await this.x().click(); await this.waitForLoaderToDisappear();`
   - `waitforElementandSendValue(loc, v)` → `await this.x().fill(v); await this.waitForLoaderToDisappear();`
   - `waitforElementandJavaScriptClick(loc)` → `await this.jsClick(this.x());`
   - `selectValuefromDropDown(loc, text)` → `await this.x().selectOption({ label: text });`
   - `getTextValuefromElement(loc)` → `return (await this.x().innerText()).trim();`
   - `getAttributeValuefromElement(loc)` → `return (await this.x().inputValue()).trim();`
   - `isDisplayed(loc)` → `return await this.x().isVisible();`
   - `threadSleep(n)` → `await this.page.waitForTimeout(n);` (keep only where Java used it)
   - `Reporterlog(msg)` → wrap the action in `await test.step('msg', async () => { … })` where it adds clarity; otherwise drop.
   - `StringsCompare/CheckBoolean` assertions → leave the *reading* in the page object, move the `expect.soft(...)` **into the spec** (page objects hold no assertions).
   - Random data (`generateRandomMobile`, `randomPanGenerator`, `generateRandomString`) → call `TestDataFactory.*` (Phase 1).
4. Methods that return a value (Java returns `String`/`Boolean`) → type the return accordingly.
5. Do not port commented-out Java code.

---

## File structure

**Create (Phase 1 foundation):**
- `pages/admin/admin-base.page.ts` — `AdminBasePage` (loader wait, jsClick)
- `fixtures/admin.fixture.ts` — page-object fixtures + `loginAs(role)`
- `config/roles.ts` — `AdminRole` type + role→cred resolver
- `utils/data/admin-excel-data.ts` — typed Excel reader
- `testdata/admin/admin-data.xlsx` — workbook (created via script in Task 1.9)

**Modify (Phase 1 foundation):**
- `config/env.ts` — add 8 role-cred keys (×2 envs = 16) to the Zod schema
- `config/urls.ts` — `adminRoleCreds(role, env)`
- `pages/admin/login.page.ts` — real XPath login + `logout()` + `loginAs(role)`
- `utils/data/test-data.factory.ts` — `mobile()` (already `phone()`), `pan()`, `stamp()`
- `setup/auth.setup.ts` — un-skip admin, seed appraiser state
- `playwright.config.ts` — admin project `geolocation` + `permissions`
- `.env.example` — document the new keys

**Create (Phase 3–5 ports):** ~48 `pages/admin/*.page.ts`, 5 `flows/admin/*.flow.ts`, 6 `tests/admin/*.spec.ts`.

---

## Page-object inventory (Java → TS)

| TS page object | Java source pair |
|---|---|
| `customer-management.page.ts` | `PO_CustomerManagement` + `Flow_CustomerManagement` |
| `kyc.page.ts` | `PO01_KycSel` + `Flow01_Kyc` |
| `kyc-approval.page.ts` | `PO02_KycApproval` + `Flow02_KycApproval` |
| `create-packet.page.ts` | `PO03_CreateNewPacket` + `Flow03_CreateNewPacket` |
| `new-gold-loan.page.ts` | `PO04_NewGoldLoan` + `Flow04_NewGoldLoan` |
| `assign-packet.page.ts` | `PO05_AssignPacket` + `Flow05_AssignPacket` |
| `bm-approval.page.ts` | `PO06_BranchManagerApproval` + `Flow06_BranchManagerApproval` |
| `ops-approval.page.ts` | `PO07_OpsTeamLoanApproval` + `Flow07_OpsLoanpproval` |
| `partner-approval.page.ts` | `PO09_PartnerLoanApproval` + `Flow08_PartnerLoanApprovalandDisbusrement` |
| `packet-submission.page.ts` | `PO08_PacketSubmissionAppraiser` + `Flow09_PacketSubmission` |
| `quick-payment.page.ts` | `PO10_QuickPayment` + `Flow10_QuickPayment`/`Flow11_QuickPaymentFail`/`Flow28_QuickPaymentOffline` |
| `part-payment.page.ts` | `PO11_PartPayment` + `Flow12_PartPayment`/`Flow31_PartPaymentOffline` |
| `top-up.page.ts` | `PO12_TopUp` + `Flow14_TopUp` |
| `renew-loan.page.ts` | `PO13_RenewLoan` + `Flow15_RenewLoan`/`Flow33_RenewLoanWithCashZero`/`Flow34_RenewPaymentOffline` |
| `renew-plus-topup.page.ts` | `PO14_RenewPlusTopUp` + `Flow16_RenewPlusTopUpLoan`/`Flow45_RenewPlusTopPaymentOffline` |
| `part-release.page.ts` | `PO15_PartRelease` + `Flow17_PartReleaseLoan`/`Flow36_PartReleaseOffline` |
| `full-release.page.ts` | `PO16_FullRelease` + `Flow18_FullReleaseLoan`/`Flow35_FullReleaseOffline` |
| `appraiser-request.page.ts` | `PO17_AppraiserRequestPage` + `Flow20_AppraiserRequestPage` |
| `crl-page.page.ts` | `PO18_CRLPage` + `Flow21_CRLPage` |
| `kyc-form60.page.ts` | `PO19_KycWithForm60` + `Flow22_KycWithForm60` |
| `view-kyc-details.page.ts` | `PO20_ViewKycDetails` + `Flow23_ViewKycDetails` |
| `delete-loan.page.ts` | `PO21_DeleteLoan` + `Flow24_DeleteLoan` |
| `incomplete-rating.page.ts` | `PO22_IncompleteInRating` + `Flow27_IncompleteInRatingFunctionality` |
| `part-release-offline.page.ts` | `PO23_PartReleaseOffline` (+ offline flows above) |
| `full-release-offline.page.ts` | `PO24_FullReleaseOffline` |
| `renew-zero.page.ts` | `PO25_RenewLoanWithZero` + `Flow33` |
| `loan-view.page.ts` | `PO26_ViewFunctionalityLoan` + `Flow49_ViewFunctionalityLoan` |
| `waiver.page.ts` | `PO27_WavierFunctionalityLoan` + `Flow50_WavierFunctionalityLoan` |
| `manual-charges.page.ts` | `PO28_ManualChargesFunctionality` + `Flow38_ManualChargesFunctionality` |
| `pown-ticket.page.ts` | `PO29_PownTicket` + `Flow46_ValidateDownloadPownTicket` |
| `cpv.page.ts` | `PO30_CPVAddAndAttach` + `Flow39`/`Flow51` |
| `digio.page.ts` | `PO31_DigiOFunctionality` + `Flow40`/`Flow41` |
| `add-partner.page.ts` | `PO32_AddPartner` + `Flow42_ValidateAddNewPartner` |
| `part-release-cash-zero.page.ts` | `PO33_PartReleaseCashwithZero` + `Flow47` |
| `edit-partner-branch.page.ts` | `PO34_EditPartnerBranch` + `Flow54`/`Flow55` |
| `internal-user.page.ts` | `PO35_InternalUser` + `Flow56_ValidateInternalUser` |
| `internal-user-branch.page.ts` | `PO36_InternalUserBranch` + `Flow57_InternalUserBranch` |
| `gold-rate.page.ts` | `PO37_GoldRateFunctionality` + `Flow58_ValidatingGoldRate` |
| `add-scheme.page.ts` | `PO38_AddNewScheme` + `Flow59_ValidateAddNewScheme` |
| `update-rpg.page.ts` | `PO39_UpdateRPG` + `Flow60_ValidateRPG` |
| `add-lead.page.ts` | `PO40_AddLeadAndEdit` + `Flow62_ValidatingAddLeadWithEditFunctionality` |
| `karat.page.ts` | `PO41_AddAndEditKarat` + `Flow63_ValidateAddKaratFunctionality` |
| `unapproval-reason.page.ts` | `PO42_AddAndEditUnApprovalReason` + `Flow64_ValidateAddApprovalReason` |
| `waiver-type.page.ts` | `PO43_AddAndEditWavierType` + `Flow65_ValidateAddAndEditWavierType` |
| `loan-defects.page.ts` | `PO44_EditAndViewLoanDefects` + `Flow66_ValidateEditAndViewLoanDefects` |
| `deposit.page.ts` | `PO45_Deposit` |
| `bt-loan.page.ts` | `PO46_BTLoan` + `Flow67_ValidateForBTLoan`/`Flow69`/`Flow70` |
| `zah-review.page.ts` | `PO47_ZAHReview` + `Flow68_ValidateZAHReview` |
| `bt-rejected-loan.page.ts` | `PO48_BTRejectedLoan` + `Flow70_ValidateRejectedFlowBTLoan` |
| `bank-details.page.ts` | (locators in flow) `Flow44_VerifyBankDetails` |
| `custom-cancel.page.ts` | `Flow29`/`Flow30`/`Flow48`/`Flow52`/`Flow53` proceed/cancel validations |
| `transaction-log.page.ts` | `Flow32_ValidateViewTransctionLog` |

---

## Phase 1 — Foundation

### Task 1.1: Admin role config

**Files:**
- Create: `config/roles.ts`
- Test: `test/config/roles.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// test/config/roles.test.ts
import { describe, it, expect } from 'vitest';
import { ADMIN_ROLES, isAdminRole, roleEnvKeys } from '../../config/roles';

describe('admin roles', () => {
  it('lists the four roles', () => {
    expect([...ADMIN_ROLES]).toEqual(['appraiser', 'bm', 'ops', 'partner']);
  });
  it('type-guards role names', () => {
    expect(isAdminRole('ops')).toBe(true);
    expect(isAdminRole('nope')).toBe(false);
  });
  it('builds env keys per role and env prefix', () => {
    expect(roleEnvKeys('bm', 'TEST')).toEqual({
      mobile: 'TEST_ADMIN_BM_MOBILE',
      otp: 'TEST_ADMIN_BM_OTP',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `SKIP_ENV_VALIDATION=true npx vitest run test/config/roles.test.ts`
Expected: FAIL — cannot find module `../../config/roles`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// config/roles.ts
export const ADMIN_ROLES = ['appraiser', 'bm', 'ops', 'partner'] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

export function isAdminRole(v: unknown): v is AdminRole {
  return typeof v === 'string' && (ADMIN_ROLES as readonly string[]).includes(v);
}

const ROLE_SEGMENT: Record<AdminRole, string> = {
  appraiser: 'APPRAISER',
  bm: 'BM',
  ops: 'OPS',
  partner: 'PARTNER',
};

export function roleEnvKeys(role: AdminRole, prefix: 'TEST' | 'UAT'): { mobile: string; otp: string } {
  const seg = ROLE_SEGMENT[role];
  return { mobile: `${prefix}_ADMIN_${seg}_MOBILE`, otp: `${prefix}_ADMIN_${seg}_OTP` };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `SKIP_ENV_VALIDATION=true npx vitest run test/config/roles.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add config/roles.ts test/config/roles.test.ts
git commit -m "feat(admin): add admin role definitions and env-key resolver"
```

### Task 1.2: Extend env schema with role credentials

**Files:**
- Modify: `config/env.ts`
- Test: `test/config/env.test.ts` (extend existing)

- [ ] **Step 1: Write the failing test** — append to `test/config/env.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { loadEnv } from '../../config/env';

function baseEnv(): Record<string, string> {
  // minimal valid env; reuse the existing helper in this file if present.
  const e: Record<string, string> = {};
  for (const p of ['TEST', 'UAT']) {
    for (const u of ['ADMIN', 'CUSTOMER', 'BUSINESS', 'NEW_ADMIN', 'BACKEND', 'EMI']) {
      e[`${p}_BASE_URL_${u}`] = 'https://example.com';
    }
    for (const u of ['ADMIN', 'CUSTOMER', 'BUSINESS', 'NEW_ADMIN', 'BACKEND', 'EMI']) {
      e[`${p}_${u}_USER_MOBILE`] = '9999999999';
      e[`${p}_${u}_USER_OTP`] = '1234';
    }
    for (const r of ['APPRAISER', 'BM', 'OPS', 'PARTNER']) {
      e[`${p}_ADMIN_${r}_MOBILE`] = '9999999999';
      e[`${p}_ADMIN_${r}_OTP`] = '1234';
    }
  }
  e.API_KEY = 'supersecret';
  return e;
}

describe('admin role env', () => {
  it('parses admin role credentials', () => {
    const env = loadEnv(baseEnv());
    expect(env.TEST_ADMIN_OPS_MOBILE).toBe('9999999999');
    expect(env.UAT_ADMIN_PARTNER_OTP).toBe('1234');
  });
  it('rejects a missing role credential', () => {
    const e = baseEnv();
    delete e.TEST_ADMIN_BM_MOBILE;
    expect(() => loadEnv(e)).toThrow(/TEST_ADMIN_BM_MOBILE/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `SKIP_ENV_VALIDATION=true npx vitest run test/config/env.test.ts`
Expected: FAIL — `TEST_ADMIN_OPS_MOBILE` is `undefined` (schema strips unknown keys).

- [ ] **Step 3: Write minimal implementation** — in `config/env.ts`, add to the `envSchema` object (after the existing `*_USER_OTP` lines, both TEST and UAT blocks):

```typescript
  // Admin role credentials (TEST)
  TEST_ADMIN_APPRAISER_MOBILE: nonEmpty, TEST_ADMIN_APPRAISER_OTP: nonEmpty,
  TEST_ADMIN_BM_MOBILE: nonEmpty,        TEST_ADMIN_BM_OTP: nonEmpty,
  TEST_ADMIN_OPS_MOBILE: nonEmpty,       TEST_ADMIN_OPS_OTP: nonEmpty,
  TEST_ADMIN_PARTNER_MOBILE: nonEmpty,   TEST_ADMIN_PARTNER_OTP: nonEmpty,
  // Admin role credentials (UAT)
  UAT_ADMIN_APPRAISER_MOBILE: nonEmpty,  UAT_ADMIN_APPRAISER_OTP: nonEmpty,
  UAT_ADMIN_BM_MOBILE: nonEmpty,         UAT_ADMIN_BM_OTP: nonEmpty,
  UAT_ADMIN_OPS_MOBILE: nonEmpty,        UAT_ADMIN_OPS_OTP: nonEmpty,
  UAT_ADMIN_PARTNER_MOBILE: nonEmpty,    UAT_ADMIN_PARTNER_OTP: nonEmpty,
```

Also extend the `AppEnv` type: add `Record<'TEST_ADMIN_APPRAISER_MOBILE' | ... all 16 keys, string>` to the intersection, or simplest — add an index-friendly mapped type. Minimal explicit approach: add a second `& Record<...>` block listing the 16 keys.

- [ ] **Step 4: Run test to verify it passes**

Run: `SKIP_ENV_VALIDATION=true npx vitest run test/config/env.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
SKIP_ENV_VALIDATION=true npm run typecheck
git add config/env.ts test/config/env.test.ts
git commit -m "feat(admin): validate admin role credentials in env schema"
```

### Task 1.3: Expose role creds via urls.ts

**Files:**
- Modify: `config/urls.ts`
- Test: `test/config/urls.test.ts` (extend existing)

- [ ] **Step 1: Write the failing test** — append:

```typescript
import { adminRoleCreds } from '../../config/urls';
// (uses the real `env` import indirectly; run with SKIP_ENV_VALIDATION + a stubbed env is not
// straightforward here, so assert the function shape against a direct call when env is present.)
describe('adminRoleCreds', () => {
  it('returns mobile+otp for a role/env', () => {
    const c = adminRoleCreds('ops', 'test');
    expect(c).toHaveProperty('mobile');
    expect(c).toHaveProperty('otp');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/config/urls.test.ts`
Expected: FAIL — `adminRoleCreds` is not exported. (If env validation throws, ensure `.env` exists or skip this file under `SKIP_ENV_VALIDATION=true` and assert export existence.)

- [ ] **Step 3: Write minimal implementation** — add to `config/urls.ts`:

```typescript
import { type AdminRole, roleEnvKeys } from './roles';

export function adminRoleCreds(role: AdminRole, envName: EnvName = getTargetEnv()): Credential {
  const e = env as unknown as Record<string, string>;
  const prefix = envName === 'uat' ? 'UAT' : 'TEST';
  const keys = roleEnvKeys(role, prefix);
  return { mobile: e[keys.mobile], otp: e[keys.otp] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/config/urls.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add config/urls.ts test/config/urls.test.ts
git commit -m "feat(admin): resolve admin role credentials by env"
```

### Task 1.4: Extend TestDataFactory (mobile/pan/stamp)

**Files:**
- Modify: `utils/data/test-data.factory.ts`
- Test: `test/utils/test-data.factory.test.ts` (extend existing)

- [ ] **Step 1: Write the failing test** — append:

```typescript
import { TestDataFactory } from '../../utils/data/test-data.factory';
describe('admin data generators', () => {
  it('mobile is 10 digits starting 6-9', () => {
    expect(TestDataFactory.mobile()).toMatch(/^[6-9]\d{9}$/);
  });
  it('pan matches AAAAA9999A shape', () => {
    expect(TestDataFactory.pan()).toMatch(/^[A-Z]{5}\d{4}[A-Z]$/);
  });
  it('stamp is unique-ish and filename-safe', () => {
    expect(TestDataFactory.stamp()).toMatch(/^_[A-Za-z0-9_]+$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/utils/test-data.factory.test.ts`
Expected: FAIL — `mobile`/`pan`/`stamp` not a function.

- [ ] **Step 3: Write minimal implementation** — add methods to `TestDataFactory`:

```typescript
  mobile(): string {
    return this.phone();
  },
  pan(): string {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letters = (n: number) => Array.from({ length: n }, () => L[Math.floor(Math.random() * 26)]).join('');
    const digits = String(Math.floor(1000 + Math.random() * 9000));
    return `${letters(5)}${digits}${letters(1)}`;
  },
  stamp(): string {
    return `_${randomUUID().slice(0, 8)}`;
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/utils/test-data.factory.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/data/test-data.factory.ts test/utils/test-data.factory.test.ts
git commit -m "feat(admin): add mobile/pan/stamp generators"
```

### Task 1.5: AdminBasePage (loader wait + jsClick)

**Files:**
- Create: `pages/admin/admin-base.page.ts`

No unit test (UI glue). Verified by typecheck and downstream specs.

- [ ] **Step 1: Implement**

```typescript
// pages/admin/admin-base.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export abstract class AdminBasePage extends BasePage {
  constructor(page: Page) { super(page); }

  /** Port of Java BrowserInitialize.waitForLoaderToDisappear() — app spinner. */
  async waitForLoaderToDisappear(timeoutMs = 300_000): Promise<void> {
    const spinner = this.page.locator("xpath=//div[@class='spinner']");
    if (await spinner.count() > 0) {
      await spinner.first().waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});
    }
  }

  /** Port of Java JavascriptClick(). */
  async jsClick(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.evaluate((el: HTMLElement) => el.click());
    await this.waitForLoaderToDisappear();
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `SKIP_ENV_VALIDATION=true npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/admin-base.page.ts
git commit -m "feat(admin): add AdminBasePage with loader wait and jsClick"
```

### Task 1.6: Rewrite AdminLoginPage with real XPath + logout + loginAs

**Files:**
- Modify: `pages/admin/login.page.ts`
- Java refs: `PO_LoginLogout.java`, `Flow_LoginLogout.java`

- [ ] **Step 1: Implement** (replace file contents)

```typescript
// pages/admin/login.page.ts
import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { adminRoleCreds } from '../../config/urls';
import { getTargetEnv } from '../../config/environments';
import type { AdminRole } from '../../config/roles';

export class AdminLoginPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  private readonly userId = () => this.page.locator("xpath=//input[@placeholder='Email ID / Mobile Number']");
  private readonly signInWithOtp = () => this.page.locator("xpath=//button[normalize-space()='Sign In With OTP']");
  private readonly otpOne = () => this.page.locator("xpath=//input[@formcontrolname='one']");
  private readonly otpTwo = () => this.page.locator("xpath=//input[@formcontrolname='two']");
  private readonly otpThree = () => this.page.locator("xpath=//input[@formcontrolname='three']");
  private readonly otpFour = () => this.page.locator("xpath=//input[@formcontrolname='four']");
  private readonly submitOtp = () => this.page.locator("xpath=//button[contains(.,'Submit OTP')]");
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly logoutBtn = () => this.page.locator("xpath=//span[@class='mat-button-wrapper']");

  async open(): Promise<void> { await this.goto('/auth/login'); }

  /** mobile + 4-digit OTP (Java entered digit-by-digit into formcontrolname one..four). */
  async login(mobile: string, otp: string): Promise<void> {
    await this.open();
    await this.userId().fill(mobile);
    await this.signInWithOtp().click();
    const inputs = [this.otpOne(), this.otpTwo(), this.otpThree(), this.otpFour()];
    for (let i = 0; i < 4; i++) await inputs[i].fill(otp[i] ?? '');
    await this.submitOtp().click();
    await this.waitForLoaderToDisappear();
  }

  /** Port of Java logout(): open profile menu → logout. */
  async logout(): Promise<void> {
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.logoutBtn().click();
    await this.waitForLoaderToDisappear();
  }

  /** Port of loginWithBM/OPS/Partner/Appraiser: logout then login as the requested role. */
  async loginAs(role: AdminRole): Promise<void> {
    await this.logout();
    const { mobile, otp } = adminRoleCreds(role, getTargetEnv());
    await this.login(mobile, otp);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `SKIP_ENV_VALIDATION=true npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add pages/admin/login.page.ts
git commit -m "feat(admin): real OTP login with logout and role switching"
```

### Task 1.7: Admin fixture

**Files:**
- Create: `fixtures/admin.fixture.ts`

- [ ] **Step 1: Implement** (start minimal — login only; extended per port task)

```typescript
// fixtures/admin.fixture.ts
import { test as base } from '@playwright/test';
import { AdminLoginPage } from '../pages/admin/login.page';
import type { AdminRole } from '../config/roles';

type AdminFixtures = {
  adminLogin: AdminLoginPage;
  loginAs: (role: AdminRole) => Promise<void>;
};

export const test = base.extend<AdminFixtures>({
  adminLogin: async ({ page }, use) => { await use(new AdminLoginPage(page)); },
  loginAs: async ({ adminLogin }, use) => {
    await use((role: AdminRole) => adminLogin.loginAs(role));
  },
});

export { expect } from '@playwright/test';
```

> As page objects are created in later phases, add a fixture line per page object here (`kyc: async ({ page }, use) => { await use(new KycPage(page)); }`).

- [ ] **Step 2: Typecheck + commit**

```bash
SKIP_ENV_VALIDATION=true npm run typecheck
git add fixtures/admin.fixture.ts
git commit -m "feat(admin): add admin test fixture with role login"
```

### Task 1.8: Native geolocation on the admin project

**Files:**
- Modify: `playwright.config.ts`

- [ ] **Step 1: Implement** — in the `admin` project's `use` block add:

```typescript
      geolocation: { latitude: 18.5204, longitude: 73.8567 },
      permissions: ['geolocation'],
```

(So the admin project `use` becomes `{ ...devices['Desktop Chrome'], baseURL: panelUrl('admin', targetEnv), storageState: storageStateIfExists(targetEnv, 'admin'), geolocation: { latitude: 18.5204, longitude: 73.8567 }, permissions: ['geolocation'] }`.)

- [ ] **Step 2: Typecheck + commit**

```bash
SKIP_ENV_VALIDATION=true npm run typecheck
git add playwright.config.ts
git commit -m "feat(admin): grant geolocation to admin project (Pune coords)"
```

### Task 1.9: Admin Excel data reader + workbook skeleton

**Files:**
- Create: `utils/data/admin-excel-data.ts`
- Create: `testdata/admin/admin-data.xlsx` (via one-off script)
- Test: `test/utils/admin-excel-data.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// test/utils/admin-excel-data.test.ts
import { describe, it, expect } from 'vitest';
import { getLoginData } from '../../utils/data/admin-excel-data';

describe('admin excel data', () => {
  it('reads the login sheet row', () => {
    const d = getLoginData();
    expect(d).toHaveProperty('branchName');
    expect(d).toHaveProperty('state');
    expect(typeof d.firstName).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/utils/admin-excel-data.test.ts`
Expected: FAIL — module/file not found.

- [ ] **Step 3: Create the workbook** — run this one-off Node script (uses the installed `xlsx`), then delete the script:

```bash
node -e "
const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();
const login = XLSX.utils.aoa_to_sheet([
  ['firstName','lastName','state','city','branchName','leadName','proofName','ifsc','accountNumber'],
  ['Auto','Test','Maharashtra','Pune','','','','','']
]);
XLSX.utils.book_append_sheet(wb, login, 'sheetLogin');
require('fs').mkdirSync('testdata/admin', { recursive: true });
XLSX.writeFile(wb, 'testdata/admin/admin-data.xlsx');
console.log('workbook written');
"
```

- [ ] **Step 4: Implement reader**

```typescript
// utils/data/admin-excel-data.ts
import path from 'path';
import * as XLSX from 'xlsx';

export const ADMIN_DATA_WORKBOOK = path.resolve(process.cwd(), 'testdata', 'admin', 'admin-data.xlsx');
const cache = new Map<string, XLSX.WorkBook>();

function workbook(file = ADMIN_DATA_WORKBOOK): XLSX.WorkBook {
  if (!cache.has(file)) cache.set(file, XLSX.readFile(file));
  return cache.get(file)!;
}

function firstRow<T extends Record<string, unknown>>(sheet: string, file = ADMIN_DATA_WORKBOOK): T {
  const ws = workbook(file).Sheets[sheet];
  if (!ws) throw new Error(`Sheet "${sheet}" not found in ${file}`);
  const rows = XLSX.utils.sheet_to_json<T>(ws, { defval: '', raw: false });
  if (!rows.length) throw new Error(`Sheet "${sheet}" has no data rows`);
  return rows[0];
}

export interface AdminLoginData {
  firstName: string; lastName: string; state: string; city: string;
  branchName: string; leadName: string; proofName: string; ifsc: string; accountNumber: string;
}

export function getLoginData(): AdminLoginData {
  return firstRow<AdminLoginData>('sheetLogin');
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run test/utils/admin-excel-data.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add utils/data/admin-excel-data.ts test/utils/admin-excel-data.test.ts testdata/admin/admin-data.xlsx
git commit -m "feat(admin): add admin excel data reader and workbook skeleton"
```

### Task 1.10: Un-skip admin auth setup

**Files:**
- Modify: `setup/auth.setup.ts`
- Modify: `.env.example`

- [ ] **Step 1: Implement** — in `setup/auth.setup.ts`, change the `authenticate admin` block:
  - Remove the line `setup.skip(true, 'Skipped due to TARGET_PANEL filter');`
  - Replace `panelCreds('admin', targetEnv)` usage with the appraiser role:
    ```typescript
    import { adminRoleCreds } from '../config/urls';
    // ...
    const { mobile, otp } = adminRoleCreds('appraiser', targetEnv);
    ```

- [ ] **Step 2: Document env keys** — append to `.env.example` under the TEST and UAT blocks:

```
# Admin panel role accounts (all OTP-based; test env accepts a fixed OTP)
TEST_ADMIN_APPRAISER_MOBILE=
TEST_ADMIN_APPRAISER_OTP=1234
TEST_ADMIN_BM_MOBILE=
TEST_ADMIN_BM_OTP=1234
TEST_ADMIN_OPS_MOBILE=
TEST_ADMIN_OPS_OTP=1234
TEST_ADMIN_PARTNER_MOBILE=
TEST_ADMIN_PARTNER_OTP=1234
# (repeat the four with UAT_ prefix)
UAT_ADMIN_APPRAISER_MOBILE=
UAT_ADMIN_APPRAISER_OTP=1234
UAT_ADMIN_BM_MOBILE=
UAT_ADMIN_BM_OTP=1234
UAT_ADMIN_OPS_MOBILE=
UAT_ADMIN_OPS_OTP=1234
UAT_ADMIN_PARTNER_MOBILE=
UAT_ADMIN_PARTNER_OTP=1234
```

- [ ] **Step 3: Typecheck + commit**

```bash
SKIP_ENV_VALIDATION=true npm run typecheck
git add setup/auth.setup.ts .env.example
git commit -m "feat(admin): seed appraiser storage state in auth-setup; document role env"
```

### Task 1.11: Foundation gate

- [ ] **Step 1: Full unit suite + typecheck**

Run: `SKIP_ENV_VALIDATION=true npm run test:unit && SKIP_ENV_VALIDATION=true npm run typecheck`
Expected: all green.

- [ ] **Step 2: (Manual, needs real .env) verify admin login** — with a populated `.env`:

Run: `npx playwright test --project=auth-setup`
Expected: `storage/test/admin.json` is written without error. If selectors mismatch the live app, fix the XPaths in `login.page.ts` before proceeding (this is the first real-UI checkpoint).

---

## Phase 2 — TC01 onboarding → gold loan (proves the pattern)

This phase ports the core chain and the first spec end-to-end. Once green, the remaining TCs follow the same shape.

### Task 2.1: Onboarding page objects

**Files (create, porting recipe + Java source):**
- `pages/admin/customer-management.page.ts` ← `PO_CustomerManagement` + `Flow_CustomerManagement`
- `pages/admin/kyc.page.ts` ← `PO01_KycSel` + `Flow01_Kyc`
- `pages/admin/kyc-approval.page.ts` ← `PO02_KycApproval` + `Flow02_KycApproval`

- [ ] **Step 1: Port each file** using the **Porting recipe** above. Read each Java pair under `/Users/divyeshpatel/Downloads/RegresisonSuite/src/main/java/{pageLocators,flow,common}/` and reproduce every non-commented `public static` method as an `async` method, copying XPath strings verbatim. Random data via `TestDataFactory`; Excel values via `getLoginData()`.

- [ ] **Step 2: Register fixtures** — add to `fixtures/admin.fixture.ts`:

```typescript
  customerManagement: async ({ page }, use) => { await use(new CustomerManagementPage(page)); },
  kyc: async ({ page }, use) => { await use(new KycPage(page)); },
  kycApproval: async ({ page }, use) => { await use(new KycApprovalPage(page)); },
```
(plus the imports and the `AdminFixtures` type entries).

- [ ] **Step 3: Typecheck + commit**

```bash
SKIP_ENV_VALIDATION=true npm run typecheck
git add pages/admin/customer-management.page.ts pages/admin/kyc.page.ts pages/admin/kyc-approval.page.ts fixtures/admin.fixture.ts
git commit -m "feat(admin): port onboarding/KYC page objects"
```

### Task 2.2: Gold-loan page objects

**Files (create):**
- `pages/admin/create-packet.page.ts` ← `PO03` + `Flow03`
- `pages/admin/new-gold-loan.page.ts` ← `PO04` + `Flow04`
- `pages/admin/assign-packet.page.ts` ← `PO05` + `Flow05`
- `pages/admin/bm-approval.page.ts` ← `PO06` + `Flow06`
- `pages/admin/ops-approval.page.ts` ← `PO07` + `Flow07`
- `pages/admin/partner-approval.page.ts` ← `PO09` + `Flow08`
- `pages/admin/packet-submission.page.ts` ← `PO08` + `Flow09`

- [ ] **Step 1: Port each** per recipe; register all in `fixtures/admin.fixture.ts`.
- [ ] **Step 2: Typecheck + commit**

```bash
SKIP_ENV_VALIDATION=true npm run typecheck
git add pages/admin/*.page.ts fixtures/admin.fixture.ts
git commit -m "feat(admin): port gold-loan lifecycle page objects"
```

### Task 2.3: Onboarding + gold-loan flows

**Files (create):**
- `flows/admin/onboarding.flow.ts`
- `flows/admin/gold-loan.flow.ts`

- [ ] **Step 1: Implement onboarding flow** — composes the page objects in Java `TC01` order. Shape:

```typescript
// flows/admin/onboarding.flow.ts
import type { Page } from '@playwright/test';
import { CustomerManagementPage } from '../../pages/admin/customer-management.page';
import { KycPage } from '../../pages/admin/kyc.page';
import { KycApprovalPage } from '../../pages/admin/kyc-approval.page';
import { AdminLoginPage } from '../../pages/admin/login.page';

export interface OnboardingResult { customerFirstName: string; }

export async function onboardCustomerThroughKyc(page: Page): Promise<OnboardingResult> {
  const cm = new CustomerManagementPage(page);
  const kyc = new KycPage(page);
  const approval = new KycApprovalPage(page);
  const login = new AdminLoginPage(page);

  await cm.clickOnCustomerManagementButton();
  await kyc.clickOnKyc();
  await kyc.validateAssignBranch();
  await login.loginAs('ops');     // Java kycApproval runs as OPS
  await approval.performOpsRatingActions();
  return { customerFirstName: cm.lastCreatedFirstName ?? '' };
}
```
(Method names must match what Task 2.1 produced; adjust to the actual ported names. Role switches mirror the Java `loginWith*` calls inside the flows.)

- [ ] **Step 2: Implement gold-loan flow** — `createDisbursedLoan(page)` chaining create-packet → new-gold-loan → assign-packet → BM approve (`loginAs('bm')`) → OPS approve (`loginAs('ops')`) → partner approve+disburse (`loginAs('partner')`) → packet submission (`loginAs('appraiser')`), returning any loan identifier the specs need.

- [ ] **Step 3: Typecheck + commit**

```bash
SKIP_ENV_VALIDATION=true npm run typecheck
git add flows/admin/onboarding.flow.ts flows/admin/gold-loan.flow.ts
git commit -m "feat(admin): onboarding and gold-loan reusable flows"
```

### Task 2.4: TC01 spec (serial)

**Files (create):** `tests/admin/tc01-onboarding-goldloan.spec.ts`

- [ ] **Step 1: Implement** — serial describe with steps mirroring `TC01_AddCustomer` priorities:

```typescript
// tests/admin/tc01-onboarding-goldloan.spec.ts
import { test, expect } from '../../fixtures/admin.fixture';

test.describe.serial('TC01 onboarding to gold loan @regression @admin @loans', () => {
  test('add customer @smoke', async ({ customerManagement }) => {
    await customerManagement.clickOnCustomerManagementButton();
    expect(await customerManagement.isCustomerAdded()).toBeTruthy(); // use the boolean the PO exposes
  });

  test('customer KYC', async ({ kyc }) => {
    await kyc.clickOnKyc();
  });

  test('assign branch', async ({ kyc }) => {
    await kyc.validateAssignBranch();
  });

  test('KYC approval (OPS)', async ({ loginAs, kycApproval }) => {
    await loginAs('ops');
    await kycApproval.performOpsRatingActions();
  });

  test('create packet', async ({ createPacket }) => { await createPacket.validateNewPacket(); });
  test('apply gold loan', async ({ newGoldLoan }) => { await newGoldLoan.validateGoldLoan(); });
  test('assign packet', async ({ assignPacket }) => { await assignPacket.validatePackets(); });
  test('BM approval', async ({ loginAs, bmApproval }) => { await loginAs('bm'); await bmApproval.validateBranchManager(); });
  test('OPS approval', async ({ loginAs, opsApproval }) => { await loginAs('ops'); await opsApproval.opsAprroval(); });
  test('partner approval + disburse', async ({ loginAs, partnerApproval }) => { await loginAs('partner'); await partnerApproval.partnerAprroval(); });
  test('packet submission', async ({ loginAs, packetSubmission }) => { await loginAs('appraiser'); await packetSubmission.packetSubmission(); });
});
```
(Assertions move here from the Java `StringsCompare`/`CheckBoolean` calls — use `expect.soft(...)` where the Java used SoftAssert.)

- [ ] **Step 2: Smoke-run the spec** (needs real `.env` + storage state):

Run: `npx playwright test --project=admin tests/admin/tc01-onboarding-goldloan.spec.ts`
Expected: serial run completes; failures point to specific XPaths to fix. Iterate on locators until green. **This is the key checkpoint that validates the whole pattern.**

- [ ] **Step 3: Commit**

```bash
git add tests/admin/tc01-onboarding-goldloan.spec.ts
git commit -m "test(admin): TC01 onboarding to gold-loan serial spec"
```

---

## Phase 3 — TC02–TC06 page objects, flows, specs

Repeat the Phase-2 shape for each remaining TC. For each TC below: (a) port the page objects in its row of the **Page-object inventory** table via the recipe, (b) add fixture lines, (c) build the flow module if the TC needs a shared precondition (all of TC02/03/04 call `createDisbursedLoan` first), (d) write the serial spec mirroring the Java `@Test` order, moving assertions into the spec, (e) typecheck, (f) smoke-run + iterate, (g) commit.

### Task 3.1: TC02 — mode of payment
- [ ] Page objects: `quick-payment`, `part-payment`, `top-up`, `renew-loan`, `renew-plus-topup`, `part-release`, `full-release` (Java `Flow10–18`, `PO10–16`).
- [ ] Flow: `flows/admin/payments.flow.ts` (building blocks reused by TC04 offline too).
- [ ] Spec: `tests/admin/tc02-mode-of-payment.spec.ts` — serial, 8 steps (quick pay success, quick pay fail, part pay, top-up, renew, renew+topup, part release, full release), `beforeAll`/first step calls `createDisbursedLoan`. Tags `@regression @admin @payments`.
- [ ] Typecheck, smoke-run, commit (`test(admin): TC02 mode of payment`).

### Task 3.2: TC03 — customer validations
- [ ] Page objects: `appraiser-request`, `crl-page`, `kyc-form60`, `view-kyc-details`, `delete-loan`, `incomplete-rating`, `cpv`, `digio`, `bank-details`, `pown-ticket` (Java `Flow20–27`, `Flow39–41`, `Flow44`, `Flow46`; `PO17–22`, `PO29–31`).
- [ ] Spec: `tests/admin/tc03-customer-validations.spec.ts` — serial, 15 steps in `TC03_ValidateAddCustomer` order. Tags `@regression @admin @kyc`.
- [ ] Typecheck, smoke-run, commit.

### Task 3.3: TC04 — mode of payment offline
- [ ] Page objects: `quick-payment` (offline methods from `Flow28`), `custom-cancel` (`Flow29/30/48/52/53`), `part-payment` (offline `Flow31`), `transaction-log` (`Flow32`), `part-release-offline` (`PO23`), `full-release-offline` (`PO24`), `renew-zero` (`PO25`,`Flow33`), `loan-view` (`PO26`,`Flow49`), `waiver` (`PO27`,`Flow50`), `manual-charges` (`PO28`,`Flow38`).
- [ ] Spec: `tests/admin/tc04-mode-of-payment-offline.spec.ts` — serial, 13 steps. Tags `@regression @admin @payments`.
- [ ] Typecheck, smoke-run, commit.

### Task 3.4: TC05 — partner & master data
- [ ] Page objects: `add-partner`, `edit-partner-branch`, `internal-user`, `internal-user-branch`, `gold-rate`, `add-scheme`, `add-lead`, `karat`, `waiver-type`, `loan-defects`, `update-rpg` (Java `Flow42`, `Flow54–66`, `Flow60`; `PO32`,`PO34–44`,`PO39`).
- [ ] Spec: `tests/admin/tc05-partner.spec.ts` — serial, 11 steps. Tags `@regression @admin @partner`.
- [ ] Typecheck, smoke-run, commit.

### Task 3.5: TC06 — BT loan
- [ ] Page objects: `bt-loan` (`PO46`,`Flow67/69`), `zah-review` (`PO47`,`Flow68`), `bt-rejected-loan` (`PO48`,`Flow70`), `deposit` (`PO45`).
- [ ] Spec: `tests/admin/tc06-bt-loan.spec.ts` — serial, 4 steps. Tags `@regression @admin @bt-loan`.
- [ ] Typecheck, smoke-run, commit.

---

## Phase 4 — Download-dependent flows

### Task 4.1: Pown ticket / receipt downloads
- [ ] Wire `pown-ticket.page.ts` (and any receipt downloads) to Playwright's `download` event and the existing `utils/pdf-utils.ts` / `utils/shop-pdf-utils.ts` for PDF assertions, replacing the Java `validateFileExtension`/`fileTransferToDestination` Windows file-move logic. No `C:\` paths — use Playwright `download.saveAs(path.join(testInfo.outputDir, name))`.
- [ ] Verify within the TC03 pown-ticket step; commit.

---

## Phase 5 — Wire-up & regression gate

### Task 5.1: Confirm regression tagging & runner
- [ ] **Step 1:** List collected admin regression tests:

Run: `npx playwright test --project=admin --grep @regression --list`
Expected: all 6 specs and their steps appear.

- [ ] **Step 2:** Confirm the runner API can target them — no code change expected (`admin` is already in the project enum). Spot-check by building args mentally: `{"projects":["admin"],"grep":"@regression"}` → `playwright test --project=admin --grep=@regression`.

- [ ] **Step 3:** Update `CLAUDE.md` (admin section) and `README.md` test-conventions table if any new tag (`@kyc`,`@loans`,`@payments`,`@partner`,`@bt-loan`) needs documenting. Commit.

### Task 5.2: Final gate
- [ ] `SKIP_ENV_VALIDATION=true npm run typecheck` → PASS
- [ ] `SKIP_ENV_VALIDATION=true npm run test:unit` → PASS
- [ ] (with real `.env`) `npx playwright test --project=admin --grep @regression` → triage and fix locator drift until green
- [ ] Final commit / open PR.

---

## Self-review notes

- **Spec coverage:** every spec section maps to a task — env/roles (1.1–1.3, 1.10), common-function ports (1.4–1.5), auth/role switch (1.6–1.7, 1.10), geolocation (1.8), test data (1.9), the 6 TC specs (2.4, 3.1–3.5), downloads (4.1), tagging (5.1). The page-object inventory table covers all 48 `POxx` and the flow-only pages.
- **Placeholders:** foundation tasks carry complete code; port tasks intentionally defer to the named Java source file as the source of truth (verbatim XPath copy) rather than fabricating locators — the file path + recipe is the complete instruction.
- **Type consistency:** `AdminRole` (`config/roles.ts`) is used identically across `urls.ts`, `login.page.ts`, `admin.fixture.ts`. `AdminBasePage.waitForLoaderToDisappear`/`jsClick` are referenced by the recipe. Page-object method names in the example specs (`validateNewPacket`, `opsAprroval`, etc.) must be reconciled to the actual ported names during each port task — flagged in Task 2.3/2.4 notes.
- **Known soft spot:** example spec/flow method names are taken from the Java method names; the porting agent must keep PO method names identical to the Java method names so the flows/specs line up (recipe step 3 enforces this).
