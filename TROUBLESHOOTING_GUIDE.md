# Framework Structure - Troubleshooting Guide

When something goes wrong in your test, here's how to trace through the framework to find the issue.

## 🔍 Diagnosing Issues by Symptoms

### Symptom 1: "Target environment variable not recognized"

**Where it happens:**
```
playwright.config.ts → Line: const targetEnv = getTargetEnv();
                            ↓
config/environments.ts → Function: getTargetEnv()
```

**How to debug:**
1. Check what you set: `$env:TARGET_ENV='uat'` ← Did you set this?
2. Check .env file has that env block: `UAT_BASE_URL_ADMIN=...`
3. Check spelling: `TARGET_ENV` (not `TARGETENV` or `Target_Env`)
4. PowerShell syntax: Must use `$env:VAR`, not `VAR=value`

**Quick check:**
```powershell
# What's currently set?
$env:TARGET_ENV
# If empty, set it:
$env:TARGET_ENV='uat'
```

---

### Symptom 2: "Expected URL but got undefined"

**Where it happens:**
```
.env file → config/env.ts (validation) → config/urls.ts (building) → playwright.config.ts (using)
```

**How to debug:**
```
1. Check .env exists in project root
   → ls .env
   
2. Check it has the required section:
   → grep UAT_BASE_URL_ADMIN .env
   
3. Check it's valid URL format:
   → Must start with https://
   → Check for typos
   
4. Check playwright.config.ts can read it:
   → Look at line: panelUrl('admin', targetEnv)
   → This calls: config/urls.ts:panelUrl()
   → Which returns: process.env.UAT_BASE_URL_ADMIN
```

**Quick fix:**
```bash
# Verify all required vars are in .env
npm run typecheck  # Type-checks config loading
```

---

### Symptom 3: "Cannot login - wrong credentials"

**Where it happens:**
```
.env (credentials)
  ↓
config/urls.ts → adminRoleCreds('appraiser', 'uat')
  ↓
admin.fixture.ts → page fixture initialization
  ↓
AdminLoginPage → fillMobile() + fillOtp()
  ↓
Browser form
  ↓
Test fails with "invalid credentials"
```

**How to debug:**
```
1. Which role is failing? Check the error message
   → "invalid credentials" = wrong mobile or OTP
   
2. Check .env has that role's credentials:
   → grep UAT_ADMIN_OPS_MOBILE .env
   → grep UAT_ADMIN_OPS_OTP .env
   
3. Verify values are not empty:
   → cat .env | grep MOBILE
   → Should see: UAT_ADMIN_OPS_MOBILE=8930900124
   
4. Check if credentials are valid for target env:
   → TEST (local server) uses different creds than UAT
   → Make sure $env:TARGET_ENV matches .env block
```

**Quick check:**
```powershell
# View current environment
$env:TARGET_ENV  # Should be 'uat' or 'test'

# View credentials from .env
# Open .env file and look for:
# UAT_ADMIN_APPRAISER_MOBILE=...
# UAT_ADMIN_APPRAISER_OTP=...
```

---

### Symptom 4: "File not found" in upload

**Where it happens:**
```
.env (file path)
  ↓
utils/data/test-file-paths.ts → getKycFilePaths()
  ↓
admin.fixture.ts → kycFilePaths fixture
  ↓
test receives kycFilePaths
  ↓
kyc.page.ts → uploadFileWithValidation()
  ↓
existsSync(path) → FALSE ⚠️ FILE NOT FOUND
```

**How to debug:**
```
1. Check .env has file path:
   → grep TEST_PAN_CARD_PATH .env
   → Should see: TEST_PAN_CARD_PATH=testdata/...
   
2. Check file actually exists:
   → dir testdata\admin\documents\
   → Look for: pan-sample.jpg
   
3. Check path format is correct:
   → Relative path from project root: testdata/admin/documents/pan-sample.jpg
   → NOT absolute path
   → NOT with drive letter
   
4. Check file was created:
   → npm run setup:test-docs
   → This creates the test files
   
5. View resolved path in console:
   → Test logs: "Uploading PAN card: d:\project\testdata\..."
   → Copy that path into Windows Explorer
   → Verify file exists there
```

**Quick fix:**
```bash
# Regenerate test files
npm run setup:test-docs

# Verify they exist
ls testdata/admin/documents/
```

---

### Symptom 5: "Strict mode violation: locator resolved to 2 elements"

**Where it happens:**
```
pages/admin/*.page.ts → XPath selector
                           ↓
page.locator("xpath=//button[...}")
  ↓
Playwright finds 2 elements instead of 1 ⚠️ STRICT MODE ERROR
```

**How to debug:**
```
1. Find which page and locator:
   → Error message shows: "in kyc.page.ts line 32"
   → Opens that file
   
2. Look at the XPath:
   → "xpath=//button[normalize-space()='Apply KYC']"
   
3. Fix options:
   Option A: Add .first()
      → .locator(...).first()
      
   Option B: Make XPath more specific
      → xpath=//div[@id='form']//button[normalize-space()='Apply KYC']
      
   Option C: Use different selector
      → byTestId('apply-kyc-btn')
      → byRole('button', { name: 'Apply KYC' })
```

**To verify fix:**
```bash
# Run test again
npm run test:admin:uat

# No "strict mode violation" error = fixed ✓
```

---

### Symptom 6: "Timeout waiting for dashboard"

**Where it happens:**
```
admin.fixture.ts → page fixture
  ├─ adminLogin.clickLogin()
  ├─ adminLogin.waitForDashboard()  ← TIMEOUT HERE
  └─ Error: "Timeout waiting for element"
```

**How to debug:**
```
1. Is the app reachable?
   → Open browser manually: https://ap.gfau.augmont.com
   → Can you see login page?
   
2. Are credentials correct?
   → Check .env mobile and OTP
   → Manually try logging in
   
3. Is OTP field appearing?
   → After entering mobile, does OTP field appear?
   → Might be server-side issue
   
4. Check app is running:
   → admin app might be down
   → Try in browser directly
   
5. Network issues?
   → Check internet connection
   → Check firewall blocking URL
   
6. Timeout too short?
   → default: 30 seconds
   → May need to increase for slow servers
```

**To check infrastructure:**
```powershell
# Test if URL is reachable
$response = Invoke-WebRequest -Uri "https://ap.gfau.augmont.com" -UseBasicParsing
$response.StatusCode  # Should be 200
```

---

### Symptom 7: "Role switching fails - wrong dashboard"

**Where it happens:**
```
test.step('KYC approval')
  ├─ loginAs('ops')  ← Meant to switch to OPS
  │  ├─ Get UAT_ADMIN_OPS_MOBILE from .env
  │  ├─ Get UAT_ADMIN_OPS_OTP from .env
  │  ├─ Login
  │  └─ Wait for dashboard
  └─ Still shows APPRAISER dashboard ⚠️ WRONG ROLE
```

**How to debug:**
```
1. Check credentials for the role:
   → grep OPS .env
   → Verify UAT_ADMIN_OPS_MOBILE exists
   → Verify UAT_ADMIN_OPS_OTP exists
   
2. Check loginAs fixture:
   → fixtures/admin.fixture.ts
   → Look at loginAs definition
   → Verify it's creating new AdminLoginPage
   
3. Check role name spelling:
   → loginAs('ops') not loginAs('OPS')
   → Roles: 'appraiser', 'bm', 'ops', 'partner'
   
4. Check wait logic:
   → After login, it waits for element
   → Make sure wait condition is role-specific
   
5. Check app actually supports role:
   → Try manually logging in with OPS credentials
   → See if OPS dashboard is different
```

---

### Symptom 8: "All tests pass locally, fail in CI"

**Where it happens:**
```
Local (HEADLESS=false)
  ├─ You see browser window
  ├─ Wait times work
  └─ Tests pass ✓

CI (HEADLESS=true)
  ├─ No browser window (headless)
  ├─ Different timing
  ├─ Network conditions different
  └─ Tests fail ✗
```

**How to debug:**
```
1. Run locally in headless mode to reproduce:
   → $env:HEADLESS='true'
   → npm run test:admin
   
2. Check timeout values:
   → May be too short for headless
   → Increase: test.setTimeout(20 * 60_000)
   
3. Check wait conditions:
   → Headless may render differently
   → Use more specific locators
   
4. Check network:
   → CI might have slower network
   → Increase actionTimeout
   
5. Check environment:
   → CI might use different .env
   → Verify CI has all needed env vars
```

---

## 🧭 Framework Navigation Flowchart

```
PROBLEM STARTS HERE
        ↓
┌─────────────────────────────────────────┐
│ Where did error occur?                  │
└─────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  During which phase?                                      │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ├─ STARTUP?      → Check playwright.config.ts           │
│  │                  Check .env                            │
│  │                  Check config/env.ts                   │
│  │                                                        │
│  ├─ LOGIN?        → Check admin.fixture.ts               │
│  │                  Check pages/admin/login.page.ts       │
│  │                  Check .env credentials               │
│  │                                                        │
│  ├─ TEST STEP?    → Check tests/admin/tc01.spec.ts       │
│  │                  Check relevant pages/admin/*.page     │
│  │                  Check fixture injection               │
│  │                                                        │
│  ├─ FILE UPLOAD?  → Check pages/admin/kyc.page.ts        │
│  │                  Check utils/data/test-file-paths.ts   │
│  │                  Check .env file paths                 │
│  │                                                        │
│  ├─ ROLE SWITCH?  → Check fixtures/admin.fixture.ts      │
│  │                  Check loginAs() function             │
│  │                  Check .env role credentials          │
│  │                                                        │
│  └─ REPORT GEN?   → Check playwright.config.ts reporter  │
│                     Check reports/ directory             │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 📋 Checklist for Common Issues

```
SETUP ISSUES?
☐ .env file exists
☐ TARGET_ENV set correctly ($env:TARGET_ENV='uat')
☐ All required variables in .env
☐ npm dependencies installed (npm ci)
☐ TypeScript compiles (npm run typecheck)

LOGIN ISSUES?
☐ Credentials in .env are correct
☐ App is reachable (https://ap.gfau.augmont.com)
☐ OTP field appears after mobile entry
☐ Test environment has proper auth setup

EXECUTION ISSUES?
☐ Page objects exist for what you're testing
☐ Selectors (XPath) are correct and specific
☐ Wait conditions are appropriate
☐ Timeout values are reasonable

FILE UPLOAD ISSUES?
☐ Test files exist (npm run setup:test-docs)
☐ Paths in .env are correct
☐ File paths are relative to project root
☐ File extensions match config (.jpg, .png, .pdf)

ROLE SWITCHING ISSUES?
☐ Role name is lowercase ('ops', not 'OPS')
☐ Role credentials in .env
☐ loginAs() called at right time
☐ Wait for dashboard after role switch

CI/CD ISSUES?
☐ HEADLESS=true works locally
☐ Environment variables passed to CI
☐ Timeout values adequate for CI
☐ Artifacts directory accessible
```

---

## 🔗 Key Files for Debugging

```
BY LAYER:

CONFIGURATION LAYER:
  .env                          ← All secrets and credentials
  .env.example                  ← Documentation
  config/env.ts                 ← Validation schema
  config/urls.ts                ← URL builders
  config/constants.ts           ← Constants
  config/environments.ts        ← Environment selector
  config/roles.ts               ← Role definitions

SETUP LAYER:
  playwright.config.ts          ← Main config
  setup/global-setup.ts         ← Global hooks
  setup/auth.setup.ts           ← Login setup

FIXTURE LAYER:
  fixtures/admin.fixture.ts     ← Admin fixtures
  fixtures/base.fixture.ts      ← Base fixtures
  utils/data/test-file-paths.ts ← File path resolution

PAGE OBJECT LAYER:
  pages/admin/kyc.page.ts       ← KYC workflow
  pages/admin/login.page.ts     ← Login
  pages/admin/*.page.ts         ← All page objects
  pages/shared/base.page.ts     ← Base helpers

TEST LAYER:
  tests/admin/tc01-*.spec.ts    ← Actual tests
  tests/admin/*.spec.ts         ← All test files

UTILITY LAYER:
  utils/data/*                  ← Test data helpers
  utils/logger/*                ← Logging
  api-services/*                ← API helpers (core/, customer/, admin/)

OUTPUT LAYER:
  reports/html/                 ← HTML reports
  reports/results.json          ← Machine readable
  storage/<env>/                ← Saved auth state
```

---

## 💡 Pro Tips for Debugging

```
TIP 1: Enable Verbose Logging
  → Open any *.page.ts file
  → Add: console.log() statements
  → Re-run test
  → Check console output

TIP 2: Run Single Test Step
  → Use test.only() to isolate one step
  → Focus on that one section
  → Easier to debug in isolation

TIP 3: Use Playwright Inspector
  → Set: $env:PWDEBUG='1'
  → Run test
  → Interact with step-by-step debugger

TIP 4: Check HTML Report
  → Run: npm run test:admin:uat
  → Open: reports/html/index.html
  → View screenshots, videos, traces

TIP 5: Save Artifacts
  → Traces automatically saved on failure
  → Videos automatically saved on failure
  → Check reports/test-artifacts/

TIP 6: Check Browser DevTools
  → Run with headless=false
  → See what elements exist
  → Copy correct XPath
  → Update page object

TIP 7: Read Error Messages Carefully
  → "locator resolved to 2 elements" = XPath issue
  → "timeout waiting for element" = selector wrong or element late
  → "invalid credentials" = check .env
  → "file not found" = check paths

TIP 8: Verify Step-by-Step
  → Comment out test.step blocks one at a time
  → Find which one fails
  → Debug that specific step
```

---

## 🚨 Quick Fixes Cheat Sheet

```
ISSUE                          QUICK FIX
─────────────────────────────────────────────────────────────
"Module not found"             → npm ci

"Command not recognized"        → Use $env:VAR (PowerShell)

"strict mode violation"         → Add .first() to locator

"file not found"               → npm run setup:test-docs

"invalid credentials"          → Check .env MOBILE and OTP

"timeout"                      → Increase test.setTimeout()

"wrong environment"            → Check $env:TARGET_ENV

"can't find element"           → Update XPath in page object

"role switch not working"      → Check role name is lowercase

"no storage state"             → Run auth-setup first
```

---

## 📞 When to Check Each File

```
"Test won't start"
  → playwright.config.ts (syntax error)
  → setup/global-setup.ts (hook error)

"Can't login"
  → .env (wrong credentials)
  → admin.fixture.ts (fixture setup)
  → pages/admin/login.page.ts (selectors)

"Step fails"
  → tests/admin/*.spec.ts (test code)
  → pages/admin/*.page.ts (selectors)
  → fixtures/admin.fixture.ts (fixture injection)

"File upload fails"
  → pages/admin/kyc.page.ts (upload logic)
  → utils/data/test-file-paths.ts (path resolution)
  → .env (file paths)

"Report is empty"
  → playwright.config.ts (reporter config)
  → reports/ directory (check permissions)

"Performance slow"
  → playwright.config.ts (timeouts)
  → pages/admin/*.page.ts (wait logic)
  → .env (network issues?)
```

