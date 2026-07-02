# Framework Execution Flow - Quick Visual Guide

## 🚀 One-Minute Overview

```
USER COMMAND
    ↓
npm run test:admin:uat
    ↓
Playwright loads config
    ↓
Environment variables loaded
    ↓
Browser launches (Chrome)
    ↓
Admin app URL opened
    ↓
Auto-login as appraiser
    ↓
Test steps execute
    ↓
Role switching (loginAs)
    ↓
Reports generated
```

---

## 🔄 Test Lifecycle

```
┌─────────────────────────────────────────┐
│  SETUP PHASE (1-2 seconds)              │
├─────────────────────────────────────────┤
│ ✓ Load playwright.config.ts             │
│ ✓ Read .env file                        │
│ ✓ Validate configuration                │
│ ✓ Launch Chrome                         │
│ ✓ Navigate to admin URL                 │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  LOGIN PHASE (2-3 seconds)              │
├─────────────────────────────────────────┤
│ ✓ Fill mobile field                     │
│ ✓ Fill OTP field                        │
│ ✓ Click login button                    │
│ ✓ Wait for dashboard                    │
│ ✓ Save session state to file            │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  FIXTURE INITIALIZATION (0.5 seconds)   │
├─────────────────────────────────────────┤
│ ✓ Create page objects                   │
│ ✓ Inject fixtures into test             │
│ ✓ Load file paths from .env             │
│ ✓ Ready all dependencies                │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  TEST EXECUTION (10-30+ seconds)        │
├─────────────────────────────────────────┤
│ ✓ test.step('add customer')             │
│ ✓ test.step('customer KYC')             │
│   • Upload PAN file                     │
│   • Upload Aadhaar file                 │
│   • Upload Signature file               │
│ ✓ test.step('assign branch')            │
│ ✓ test.step('KYC approval')             │
│   • loginAs('ops') role switch          │
│ ✓ test.step('create packet')            │
│ ... (more steps)                        │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  CLEANUP PHASE (1 second)               │
├─────────────────────────────────────────┤
│ ✓ Close browser                         │
│ ✓ Save artifacts                        │
│ ✓ Generate report                       │
└─────────────────────────────────────────┘
               ↓
            DONE
```

---

## 📦 Component Dependencies

```
┌─────────────────────────────────────────────────────────┐
│                    .env (Source)                        │
│  TEST_BASE_URL_ADMIN=https://...                        │
│  UAT_ADMIN_APPRAISER_MOBILE=9819228888                  │
│  UAT_PAN_CARD_PATH=testdata/...                         │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  config/env.ts      │
        │  (Validates)        │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  config/urls.ts     │
        │  (Builds URLs)      │
        └──────────┬──────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐  ┌─────▼─────┐  ┌────▼───┐
│fixtures│  │page-objs  │  │constants
│        │  │           │  │
└───┬────┘  └─────┬─────┘  └────┬───┘
    │             │             │
    └─────────────┼─────────────┘
                  │
        ┌─────────▼─────────┐
        │ tests/admin/tc01  │
        │ (Uses All)        │
        └───────────────────┘
```

---

## 🎬 Test Execution Steps

```
SINGLE TEST EXECUTION INSIDE OUT:

test('customer onboarding...', async ({ /* fixtures */ }) => {
  
  ├─ test.step('add customer', async () => {
  │  ├─ customerManagement (PageObject)
  │  ├─ clickOnCustomerManagementButton()
  │  │  ├─ page.locator("xpath=...")  (Locate element)
  │  │  ├─ wait for visible            (Wait for readiness)
  │  │  ├─ click()                     (Click element)
  │  │  └─ wait for loader             (Wait for result)
  │  └─ ✓ Step passes
  │
  ├─ test.step('customer KYC', async () => {
  │  ├─ kyc (PageObject)
  │  ├─ ClickonKyc(panCardPath, signaturePath, aadhaarPath)
  │  │  ├─ uploadFileWithValidation(panCardPath, selector, 'PAN')
  │  │  │  ├─ Check: file exists?
  │  │  │  ├─ Log: ↗ Uploading
  │  │  │  ├─ page.locator(selector).setInputFiles(path)
  │  │  │  └─ Log: ✓ Success
  │  │  ├─ uploadFileWithValidation(aadhaarPath, ...)
  │  │  └─ uploadFileWithValidation(signaturePath, ...)
  │  └─ ✓ Step passes
  │
  ├─ test.step('KYC approval (OPS)', async () => {
  │  ├─ loginAs('ops')  (Role switching)
  │  │  ├─ Get OPS credentials from .env
  │  │  ├─ Navigate to login page
  │  │  ├─ Fill form with OPS credentials
  │  │  └─ Wait for OPS dashboard
  │  ├─ kycApproval (PageObject with OPS role)
  │  ├─ performOpsRatingActions()
  │  └─ ✓ Step passes
  │
  └─ ✓ ALL STEPS PASSED → Test PASSES
});
```

---

## 🔐 Role Switching Flow

```
SINGLE ROLE SWITCH EXAMPLE (appraiser → ops → appraiser):

Initial State: Logged in as APPRAISER
│
├─ Step 1: loginAs('ops')
│  ├─ Get UAT_ADMIN_OPS_MOBILE from .env
│  ├─ Get UAT_ADMIN_OPS_OTP from .env
│  ├─ Navigate to login page
│  ├─ Fill form
│  ├─ Click login
│  └─ State: Now logged in as OPS
│
├─ Step 2: Perform OPS actions
│  ├─ kycApproval.performOpsRatingActions()
│  └─ State: Still OPS
│
├─ Step 3: loginAs('appraiser')
│  ├─ Get UAT_ADMIN_APPRAISER_MOBILE from .env
│  ├─ Get UAT_ADMIN_APPRAISER_OTP from .env
│  ├─ Navigate to login page
│  ├─ Fill form
│  ├─ Click login
│  └─ State: Now logged in as APPRAISER
│
└─ Continue testing as APPRAISER
```

---

## 📁 File Upload Flow

```
FILE UPLOAD EXECUTION:

.env contains:
  TEST_PAN_CARD_PATH=testdata/admin/documents/pan-sample.jpg
  │
  ├─ admin.fixture.ts reads via getKycFilePaths()
  │  ├─ Resolve relative path to absolute:
  │  │  d:\GitHub\augmont-test-suite\testdata\admin\documents\pan-sample.jpg
  │  └─ Return: kycFilePaths.panCardPath
  │
  ├─ test receives kycFilePaths
  │  └─ Pass to kyc.ClickonKyc(kycFilePaths.panCardPath, ...)
  │
  ├─ kyc.page.ts uploadFileWithValidation() called
  │  ├─ existsSync(path) → TRUE
  │  ├─ Log: "↗ Uploading PAN card: ..."
  │  ├─ page.locator(selector).setInputFiles(path)
  │  ├─ Wait for upload
  │  ├─ Log: "✓ PAN card uploaded successfully"
  │  └─ Continue test
  │
  └─ File uploaded!
```

---

## 🎯 Configuration Lookup Chain

```
LOOKING UP: baseURL for admin panel in UAT

User sets:  $env:TARGET_ENV='uat'
            ↓
playwright.config.ts reads TARGET_ENV
            ↓
Calls: panelUrl('admin', 'uat')
            ↓
config/urls.ts:
  - Looks up getTargetEnv() → 'uat'
  - Reads process.env.UAT_BASE_URL_ADMIN
  - Returns: 'https://ap.gfau.augmont.com'
            ↓
playwright.config.ts sets baseURL
            ↓
Admin project browser opens:
  https://ap.gfau.augmont.com
            ↓
Test executes in that URL
```

---

## 🔄 Complete Data Path Example

```
TRACING ONE VALUE FROM START TO USE:

START:
  .env file: UAT_ADMIN_APPRAISER_MOBILE=9819228888

STEP 1 - Validation:
  config/env.ts loads and validates
  ├─ Checks type = string ✓
  ├─ Checks non-empty ✓
  └─ Accepts value

STEP 2 - URL Building:
  config/urls.ts defines function
  ├─ adminRoleCreds('appraiser', 'uat')
  └─ Returns: { mobile: '9819228888', otp: '1234' }

STEP 3 - Fixture Setup:
  admin.fixture.ts page fixture uses value
  ├─ const creds = adminRoleCreds('appraiser', 'uat')
  ├─ const mobile = creds.mobile
  └─ Passes to AdminLoginPage

STEP 4 - Page Object:
  AdminLoginPage.fillMobile(mobile)
  ├─ this.page.locator("xpath=//input").fill(mobile)
  └─ Browser input field now has: 9819228888

STEP 5 - Test:
  test doesn't see this value, it's internal
  ├─ Test calls: adminLogin.fillMobile(creds.mobile)
  ├─ Value is used internally by PageObject
  └─ Test just sees: "I'm logged in"

RESULT:
  User successfully logged in with mobile 9819228888
  ✓ Single .env value used end-to-end
```

---

## 📊 Fixture Initialization Order

```
WHEN TEST STARTS, FIXTURES INITIALIZE IN THIS ORDER:

1. Base Fixtures (from Playwright)
   └─ page (Playwright's browser page)

2. Our Config Fixtures (async setup)
   ├─ kycFilePaths
   │  ├─ Read .env
   │  ├─ Resolve paths
   │  └─ Return paths object
   │
   └─ page (OVERRIDE to add login)
      ├─ Receive page from Playwright
      ├─ Navigate to admin URL
      ├─ Login with appraiser credentials
      ├─ Wait for dashboard
      ├─ Save session state
      └─ Return logged-in page

3. Page Object Fixtures (depend on 'page')
   ├─ customerManagement = new CustomerManagementPage(page)
   ├─ kyc = new KycPage(page)
   ├─ kycApproval = new KycApprovalPage(page)
   ├─ loginAs = function to switch roles
   └─ ... (50+ more page objects)

4. Test Receives All Fixtures
   ├─ page (already logged in as appraiser)
   ├─ kycFilePaths (paths resolved)
   ├─ All PageObjects (ready to use)
   └─ Test can now execute

⏱️ Total initialization time: ~2-3 seconds
```

---

## 🧪 Error Handling During Upload

```
UPLOAD ERROR SCENARIOS:

Scenario 1: File doesn't exist
  ├─ existsSync(path) → FALSE
  ├─ Log: ⚠ PAN card file not found: ...
  ├─ Upload: SKIPPED
  └─ Test: CONTINUES (not a failure)

Scenario 2: File exists but can't upload
  ├─ existsSync(path) → TRUE
  ├─ Try: page.locator().setInputFiles(path)
  ├─ Error thrown by Playwright
  ├─ Catch block executes
  ├─ Log: ✗ Failed to upload PAN card: ERROR_MESSAGE
  └─ Test: FAILS (with error details)

Scenario 3: File uploaded successfully
  ├─ existsSync(path) → TRUE
  ├─ setInputFiles(path) → SUCCESS
  ├─ Log: ✓ PAN card uploaded successfully
  └─ Test: CONTINUES

Scenario 4: No path configured in .env
  ├─ panCardPath = undefined
  ├─ Check: if (!panCardPath) return
  ├─ Log: ⊘ PAN card upload skipped
  └─ Test: CONTINUES
```

---

## 📈 Typical Test Execution Time Breakdown

```
TOTAL TEST TIME FOR TC01: ~10-15 minutes

├─ Startup                              1-2 seconds
│  ├─ Load config
│  ├─ Launch browser
│  └─ Navigate to URL
│
├─ Login                                2-3 seconds
│  ├─ Fill credentials
│  ├─ Click login
│  └─ Wait for dashboard
│
├─ Test.step('add customer')            5-10 seconds
│  ├─ Navigate to customer form
│  ├─ Fill form fields
│  └─ Submit
│
├─ Test.step('customer KYC')            20-30 seconds ⭐ LONGEST
│  ├─ Fill KYC form
│  ├─ Upload 3 files (~5s each)
│  ├─ Wait for processing
│  └─ Submit
│
├─ Test.step('assign branch')           5 seconds
├─ Test.step('KYC approval')            10 seconds
│  ├─ loginAs('ops')                   (3-5 seconds)
│  └─ Perform OPS actions
│
├─ Test.step('create packet')           10 seconds
├─ Test.step('apply gold loan')         10 seconds
├─ Test.step('assign packet')           15 seconds
│  ├─ loginAs('appraiser')              (3-5 seconds)
│  └─ Perform appraiser actions
│
├─ Test.step('BM approval')             10 seconds
│  ├─ loginAs('bm')
│  └─ Perform BM actions
│
├─ Test.step('OPS approval')            10 seconds
│  ├─ loginAs('ops')
│  └─ Perform OPS actions
│
├─ Test.step('partner approval')        10 seconds
│  ├─ loginAs('partner')
│  └─ Perform partner actions
│
├─ Test.step('packet submission')       5 seconds
│  └─ loginAs('appraiser')
│
└─ Report generation                    1-2 seconds
   ├─ Collect screenshots
   ├─ Save trace
   └─ Generate HTML
```

---

## 🎯 Quick Reference: Where Things Live

```
FINDING WHAT YOU NEED:

Need to change admin URL?
  → .env file: UAT_BASE_URL_ADMIN

Need to change credentials?
  → .env file: UAT_ADMIN_APPRAISER_MOBILE, OTP, etc.

Need to change file paths?
  → .env file: TEST_PAN_CARD_PATH, UAT_PAN_CARD_PATH, etc.

Need to understand test structure?
  → tests/admin/tc01-onboarding-goldloan.spec.ts

Need to see what clicks do?
  → pages/admin/*.page.ts (Page Objects)

Need to understand fixture setup?
  → fixtures/admin.fixture.ts

Need to understand config?
  → config/env.ts (validation)
  → config/urls.ts (URL building)
  → config/constants.ts (constants)

Need to add new PageObject?
  → Create pages/admin/new-feature.page.ts
  → Add to fixtures/admin.fixture.ts
  → Use in test

Need to debug file upload?
  → pages/admin/kyc.page.ts (uploadFileWithValidation method)

Need to see stored auth state?
  → storage/uat/admin.json

Need to view test report?
  → reports/html/index.html (open in browser)
  → reports/results.json (machine readable)
```

