# Augmont Test Suite - Framework Structure & Execution Flow

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Initialization Phase](#initialization-phase)
3. [Test Execution Phase](#test-execution-phase)
4. [Fixture System](#fixture-system)
5. [Data Flow](#data-flow)
6. [Configuration Layers](#configuration-layers)
7. [Component Interactions](#component-interactions)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUGMONT TEST SUITE ARCHITECTURE              │
└─────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │ Entry Point  │
                          │  npm script  │
                          └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐            ┌─────▼─────┐
              │ Global    │            │ Project   │
              │ Setup     │            │ Setup     │
              │ (optional)│            │ (once)    │
              └─────┬─────┘            └─────┬─────┘
                    │                        │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Playwright Config      │
                    │  Load & Validate        │
                    │  Projects Selection     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Auth-Setup (if needed) │
                    │  Login & Save State     │
                    └────────────┬────────────┘
                                 │
        ┌───────────┬────────────┼────────────┬───────────┐
        │           │            │            │           │
    ┌───▼──┐   ┌───▼──┐   ┌────▼──┐  ┌─────▼──┐  ┌────▼──┐
    │Admin │   │Cust. │   │Business│  │New-Adm │  │ API   │
    │Panel │   │Panel │   │ Panel  │  │ Panel  │  │Tests  │
    │Tests │   │Tests │   │ Tests  │  │ Tests  │  │       │
    └──────┘   └──────┘   └────────┘  └────────┘  └───────┘
        │           │            │            │           │
        └───────────┴────────────┼────────────┴───────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │          Run Tests (Parallel/Sequential)        │
        │  • Load Fixtures                                │
        │  • Setup Hooks (beforeEach)                     │
        │  • Execute Test Steps                           │
        │  • Collect Reports                              │
        │  • Cleanup Hooks (afterEach)                    │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │  Generate Reports                               │
        │  • HTML Report                                  │
        │  • JSON Results                                 │
        │  • Screenshots/Videos (on failure)              │
        └────────────────────────────────────────────────┘
```

---

## Initialization Phase

### 1️⃣ **Command Entry Point**

```bash
npm run test:admin:uat
  ↓
set TARGET_ENV=uat && set HEADLESS=true && npx playwright test --project=admin
```

**Environment Variables Set:**
- `TARGET_ENV=uat` → Use UAT environment URLs and credentials
- `HEADLESS=true` → Run browser in headless mode
- `PROJECT=admin` → Run only admin panel tests

---

### 2️⃣ **Playwright Configuration Loading**

**File: `playwright.config.ts`**

```typescript
┌─────────────────────────────────────────┐
│  Read Configuration                     │
└─────────────────────────────────────────┘
  │
  ├─ Get Target Environment
  │  └─ targetEnv = getTargetEnv() → reads $env:TARGET_ENV or DEFAULT_ENV
  │
  ├─ Define Projects
  │  ├─ auth-setup       (login & save storage state)
  │  ├─ admin            (admin panel tests)
  │  ├─ customer         (customer panel tests)
  │  ├─ business         (business panel tests)
  │  ├─ new-admin        (new admin panel tests)
  │  ├─ api-backend      (backend API tests)
  │  └─ api-emi          (EMI API tests)
  │
  ├─ Set Project Properties
  │  ├─ baseURL          (panel URL from config/urls.ts)
  │  ├─ storageState     (authentication state path)
  │  ├─ use.headless     (from HEADLESS env var)
  │  ├─ use.devices      (Desktop Chrome)
  │  ├─ use.trace        (on-first-retry)
  │  └─ use.screenshot   (only-on-failure)
  │
  ├─ Configure Reporters
  │  ├─ HTML report      (reports/html/index.html)
  │  ├─ JSON results     (reports/results.json)
  │  └─ CLI list         (console output)
  │
  └─ Set Timeouts & Retries
     ├─ timeout: 60s per test
     ├─ expect: 5s per assertion
     └─ retries: 2 (CI only)
```

**Key Config Values (admin project):**
```typescript
{
  name: 'admin',
  baseURL: 'https://ap.gfau.augmont.com',        // UAT admin URL
  testMatch: /tests\/admin\/.*\.spec\.ts/,       // Find test files
  use: {
    headless: true,                              // No browser window
    screenshot: 'only-on-failure',               // Save failures
    video: 'retain-on-failure',                  // Record on error
    trace: 'on-first-retry',                     // Debug trace
    actionTimeout: 10_000                        // 10s per action
  }
}
```

---

### 3️⃣ **Environment Configuration Loading**

**File: `config/env.ts`**

```
┌─ .env file loaded
│
├─ Zod validation schema applied
│
├─ TARGET_ENV checks which block to require
│  └─ If TARGET_ENV='uat' → require UAT_* vars
│
├─ Variables parsed:
│  ├─ TEST_BASE_URL_ADMIN=https://ap.gfat.augmont.com
│  ├─ UAT_BASE_URL_ADMIN=https://ap.gfau.augmont.com
│  ├─ UAT_ADMIN_APPRAISER_MOBILE=9819228888
│  ├─ UAT_ADMIN_APPRAISER_OTP=1234
│  ├─ UAT_PAN_CARD_PATH=testdata/admin/documents/pan-sample.jpg
│  └─ ... (30+ other variables)
│
└─ Invalid config → FAIL with error message
   (Missing or invalid vars caught immediately at import time)
```

---

## Test Execution Phase

### 4️⃣ **Auth-Setup Project (if needed)**

**File: `setup/auth.setup.ts`**

```typescript
┌─────────────────────────────────────────┐
│  Auth Setup Flow (Runs Once per Project)│
└─────────────────────────────────────────┘
  │
  ├─ for each panel (customer, business, etc.):
  │  │
  │  ├─ Create new browser context
  │  │
  │  ├─ Navigate to panel login page
  │  │  └─ URL: https://cp.gfau.augmont.com
  │  │
  │  ├─ Fill login form
  │  │  ├─ Mobile number (from .env UAT_CUSTOMER_USER_MOBILE)
  │  │  └─ OTP (from .env UAT_CUSTOMER_USER_OTP)
  │  │
  │  ├─ Click login button
  │  │
  │  ├─ Wait for dashboard to appear
  │  │
  │  ├─ Save authentication state
  │  │  └─ File: storage/<env>/<panel>.json
  │  │     Contains: cookies, localStorage, sessionStorage
  │  │
  │  └─ Close browser context
  │
  └─ All panels now have saved auth state
     ├─ storage/uat/customer.json  → Contains customer auth cookies
     ├─ storage/uat/business.json  → Contains business auth cookies
     └─ storage/uat/new-admin.json → Contains new-admin auth cookies

⚠️  NOTE: Admin panel does NOT use auth-setup
    └─ Admin app stores auth in sessionStorage (not persistable)
    └─ admin.fixture.ts logs in manually before each test
```

---

### 5️⃣ **Admin Panel Test Execution**

**File: `tests/admin/tc01-onboarding-goldloan.spec.ts`**

```typescript
┌──────────────────────────────────────────────────────────────┐
│                    TEST EXECUTION FLOW                       │
└──────────────────────────────────────────────────────────────┘

TEST START
  │
  ├─ test.describe('TC01 onboarding...')
  │  └─ Creates test suite with tags: @regression @admin @loans
  │
  ├─ test('customer onboarding...')
  │  └─ Define test with fixtures (dependency injection)
  │
  ├─ Initialize Fixtures
  │  │
  │  ├─ page fixture (from Playwright)
  │  │  └─ Fresh page for this test
  │  │
  │  ├─ Admin Fixtures (from admin.fixture.ts)
  │  │  ├─ adminLogin
  │  │  ├─ loginAs(role)
  │  │  ├─ kycFilePaths
  │  │  ├─ customerManagement
  │  │  ├─ kyc
  │  │  ├─ kycApproval
  │  │  ├─ ... (50+ page object fixtures)
  │  │
  │  ├─ Setup Hooks (beforeEach)
  │  │  └─ admin.fixture.ts 'page' fixture
  │  │     ├─ Navigate to admin app URL
  │  │     ├─ Login as 'appraiser' role
  │  │     ├─ Wait for dashboard
  │  │     ├─ Load file paths from .env
  │  │     └─ Save session state to storage/uat/admin.json
  │  │
  │  └─ All fixtures ready (injected into test)
  │
  ├─ Execute Test Steps (Sequential)
  │  │
  │  ├─ test.step('add customer')
  │  │  │
  │  │  ├─ customerManagement.clickOnCustomerManagementButton()
  │  │  │  ├─ Page Object locates button by XPath
  │  │  │  ├─ Waits for element to be visible/enabled
  │  │  │  ├─ Clicks button
  │  │  │  ├─ Takes screenshot on failure
  │  │  │  └─ Returns control to test
  │  │  │
  │  │  └─ Step completes → Report success
  │  │
  │  ├─ test.step('customer KYC')
  │  │  │
  │  │  ├─ kyc.ClickonKyc(panCardPath, signaturePath, aadhaarPath)
  │  │  │  │
  │  │  │  ├─ Wait for KYC form to appear
  │  │  │  ├─ Click Apply KYC button
  │  │  │  ├─ Select PAN as ID type
  │  │  │  ├─ UPLOAD FILE
  │  │  │  │  ├─ uploadFileWithValidation(panCardPath, selector, desc)
  │  │  │  │  ├─ Check file exists: existsSync(panCardPath)
  │  │  │  │  ├─ Log: "↗ Uploading PAN card: ..."
  │  │  │  │  ├─ Set file input: page.locator(selector).setInputFiles(path)
  │  │  │  │  ├─ Wait for upload to complete
  │  │  │  │  └─ Log: "✓ PAN card uploaded successfully"
  │  │  │  ├─ Fill PAN form fields
  │  │  │  ├─ Click next button
  │  │  │  ├─ Select Aadhaar option
  │  │  │  ├─ UPLOAD FILE (Aadhaar)
  │  │  │  ├─ Fill Aadhaar fields
  │  │  │  ├─ Select Signature option
  │  │  │  ├─ UPLOAD FILE (Signature)
  │  │  │  ├─ Fill signature fields
  │  │  │  └─ Submit KYC form
  │  │  │
  │  │  └─ Step completes → Report success
  │  │
  │  ├─ test.step('assign branch')
  │  │  └─ ... continue with next step
  │  │
  │  ├─ test.step('KYC approval (OPS)')
  │  │  │
  │  │  ├─ loginAs('ops')
  │  │  │  │
  │  │  │  ├─ Call fixture loginAs function
  │  │  │  ├─ Current page logs out (if applicable)
  │  │  │  ├─ Navigate to admin login page
  │  │  │  ├─ Fill mobile: UAT_ADMIN_OPS_MOBILE from .env
  │  │  │  ├─ Fill OTP: UAT_ADMIN_OPS_OTP from .env
  │  │  │  ├─ Click login
  │  │  │  ├─ Wait for new dashboard (OPS view)
  │  │  │  └─ Return control to test
  │  │  │
  │  │  ├─ kycApproval.performOpsRatingActions(kyc)
  │  │  │  └─ Perform OPS-specific KYC actions
  │  │  │
  │  │  └─ Step completes → Report success
  │  │
  │  ├─ test.step('create packet')
  │  │  └─ ... continue with remaining steps
  │  │
  │  └─ ... (more test.step blocks)
  │
  ├─ Cleanup Hooks (afterEach)
  │  ├─ Take screenshot if test failed
  │  ├─ Record video if test failed
  │  ├─ Save trace file for debugging
  │  ├─ Close browser page
  │  └─ Save test report data
  │
  └─ TEST COMPLETE
     ├─ All steps passed → Test PASSED ✓
     ├─ Any step failed → Test FAILED ✗
     └─ Artifacts saved to reports/
```

---

## Fixture System

### 6️⃣ **How Fixtures Work**

**File: `fixtures/admin.fixture.ts`**

```typescript
┌─────────────────────────────────────────┐
│      FIXTURE DEPENDENCY INJECTION       │
└─────────────────────────────────────────┘

export const test = base.extend<AdminFixtures>({
  
  // Fixture 1: kycFilePaths
  kycFilePaths: async ({}, use) => {
    const paths = getKycFilePaths();  // Read from .env + resolve paths
    await use(paths);                 // Inject into test
  },
  // Result: kycFilePaths = {
  //   panCardPath: 'd:\\project\\testdata\\admin\\documents\\pan-sample.jpg',
  //   aadhaarPath: 'd:\\project\\testdata\\admin\\documents\\aadhaar-sample.png',
  //   signaturePath: 'd:\\project\\testdata\\admin\\documents\\signature-sample.pdf'
  // }
  
  // Fixture 2: adminLogin (Page Object)
  adminLogin: async ({ page }, use) => {
    const login = new AdminLoginPage(page);
    await use(login);  // Inject into test
  },
  // Result: adminLogin = AdminLoginPage instance bound to page
  
  // Fixture 3: page (Auto-Login)
  page: async ({ page }, use) => {
    // Step 1: Navigate to admin app
    await page.goto('https://ap.gfau.augmont.com');
    
    // Step 2: Login as appraiser
    const adminLogin = new AdminLoginPage(page);
    const creds = adminRoleCreds('appraiser', 'uat');
    await adminLogin.fillMobile(creds.mobile);
    await adminLogin.fillOtp(creds.otp);
    await adminLogin.clickLogin();
    await adminLogin.waitForDashboard();
    
    // Step 3: Save session state to file
    const env = getTargetEnv();
    const storagePath = storageStatePath(env, 'admin');
    const dir = require('path').dirname(storagePath);
    mkdirSync(dir, { recursive: true });
    const state = await page.context().storageState();
    writeFileSync(storagePath, JSON.stringify(state, null, 2));
    console.log(`✓ Session saved: ${storagePath}`);
    
    // Step 4: Inject page into test (already logged in)
    await use(page);
  },
  // Result: page is ready to use in test (already logged in as appraiser)
  
  // Fixture 4: loginAs (Role Switching)
  loginAs: async ({ page }, use) => {
    const fn = async (role: AdminRole) => {
      // Logout (if applicable)
      await page.goto('https://ap.gfau.augmont.com');
      
      // Get credentials for new role
      const creds = adminRoleCreds(role, 'uat');
      
      // Login with new role
      const adminLogin = new AdminLoginPage(page);
      await adminLogin.fillMobile(creds.mobile);
      await adminLogin.fillOtp(creds.otp);
      await adminLogin.clickLogin();
      await adminLogin.waitForDashboard();
    };
    await use(fn);  // Inject function into test
  },
  // Result: loginAs = async function (role) => { /* switch role */ }
  
  // Fixture 5-N: Page Objects (All depend on 'page')
  customerManagement: async ({ page }, use) => {
    await use(new CustomerManagementPage(page));
  },
  kyc: async ({ page }, use) => {
    await use(new KycPage(page));
  },
  kycApproval: async ({ page }, use) => {
    await use(new KycApprovalPage(page));
  },
  // ... (50+ more page objects)
});
```

**Fixture Injection into Test:**

```typescript
test('customer onboarding...', async ({
  customerManagement,  // ← Injected from fixture
  kyc,                 // ← Injected from fixture
  kycApproval,         // ← Injected from fixture
  loginAs,             // ← Injected from fixture
  kycFilePaths,        // ← Injected from fixture
}) => {
  // All fixtures are ready to use
  // page already logged in as appraiser
  // All page objects bound to that page
  // File paths resolved from .env
});
```

---

## Data Flow

### 7️⃣ **Configuration Data Flow**

```
┌────────────────────────────────────────┐
│          .env File (Source)            │
└────────────────────────────────────────┘
  │
  ├─ TEST_BASE_URL_ADMIN
  ├─ UAT_BASE_URL_ADMIN
  ├─ TEST_ADMIN_APPRAISER_MOBILE
  ├─ UAT_ADMIN_APPRAISER_MOBILE
  ├─ TEST_ADMIN_APPRAISER_OTP
  ├─ UAT_ADMIN_APPRAISER_OTP
  ├─ UAT_PAN_CARD_PATH
  ├─ UAT_AADHAAR_PATH
  ├─ UAT_SIGNATURE_PATH
  └─ ... (30+ other variables)
  │
  ├─ dotenv.config() reads file
  │
  ├─ Zod schema validates ALL values
  │  ├─ TYPE checks (string, URL, etc.)
  │  ├─ REQUIRED checks (based on TARGET_ENV)
  │  └─ Throws error if validation fails
  │
  ├─ config/env.ts exposes validated vars
  │
  ├─ config/urls.ts transforms env vars into helper functions
  │  ├─ panelUrl(panel, env) → 'https://ap.gfau.augmont.com'
  │  ├─ panelCreds(panel, env) → { mobile: '9819228888', otp: '1234' }
  │  ├─ apiUrl(service, env) → 'https://api.gfau.augmont.com'
  │  └─ apiCreds(service, env) → { mobile: '...', otp: '...' }
  │
  ├─ config/constants.ts defines constants
  │  ├─ PANELS = ['admin', 'customer', 'business', 'new-admin']
  │  ├─ API_SERVICES = ['api-backend', 'api-emi']
  │  └─ storageStatePath(env, panel) → 'storage/uat/admin.json'
  │
  ├─ utils/data/test-file-paths.ts resolves file paths
  │  ├─ getKycFilePaths() → reads ENV vars
  │  ├─ Converts relative paths to absolute
  │  ├─ Checks file existence
  │  └─ Returns { panCardPath, aadhaarPath, signaturePath }
  │
  ├─ admin.fixture.ts receives kycFilePaths
  │  └─ Injects into test
  │
  ├─ test receives kycFilePaths
  │  └─ Passes to page object methods
  │
  ├─ kyc.page.ts receives file paths
  │  ├─ uploadFileWithValidation() validates
  │  ├─ Checks file exists
  │  └─ Uploads file via page.locator().setInputFiles(path)
  │
  └─ Test execution continues with uploaded files
```

---

## Configuration Layers

### 8️⃣ **Config Hierarchy**

```
┌──────────────────────────────────────────────────┐
│  LAYER 1: Environment Variables (.env)           │
│  Raw values from shell environment               │
│  Example: TEST_BASE_URL_ADMIN=https://...        │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│  LAYER 2: Zod Validation (config/env.ts)         │
│  Type-checked, required-checked, normalized      │
│  Throws immediately if any var is invalid        │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│  LAYER 3: URL Builders (config/urls.ts)          │
│  Transforms raw vars into helper functions       │
│  Example: panelUrl('admin', 'uat')               │
│          → 'https://ap.gfau.augmont.com'         │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│  LAYER 4: Constants (config/constants.ts)        │
│  Defines panels, services, paths                 │
│  Example: storageStatePath('uat', 'admin')       │
│          → 'storage/uat/admin.json'              │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│  LAYER 5: File Paths (utils/data/test-file-paths.ts)
│  Resolves and validates file paths               │
│  Example: getKycFilePaths()                      │
│          → { panCardPath: 'd:\\...\\pan.jpg', ...}
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│  LAYER 6: Fixtures (fixtures/admin.fixture.ts)   │
│  Injects config data into tests                  │
│  Binds page objects to Playwright page           │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│  LAYER 7: Test Code (tests/admin/*.spec.ts)      │
│  Uses injected fixtures and page objects         │
│  Makes assertions and interacts with app         │
└──────────────────────────────────────────────────┘
```

**Example: How One Config Value Flows**

```
.env:  UAT_ADMIN_APPRAISER_MOBILE=9819228888
  │
  ├─ env.ts validates as string, non-empty
  │
  ├─ urls.ts exposes via:
  │  └─ adminRoleCreds('appraiser', 'uat').mobile
  │
  ├─ admin.fixture.ts reads:
  │  ├─ const creds = adminRoleCreds('appraiser', 'uat');
  │  ├─ const mobile = creds.mobile;  // '9819228888'
  │
  ├─ admin.fixture.ts passes to LoginPage:
  │  └─ await adminLogin.fillMobile(creds.mobile);
  │
  ├─ LoginPage (pages/admin/login.page.ts):
  │  ├─ const mobileInput = this.page.locator("xpath=//input[@type='tel']");
  │  ├─ await mobileInput.fill('9819228888');
  │
  ├─ Playwright page fills browser input
  │
  └─ User is logged in with that mobile number
```

---

## Component Interactions

### 9️⃣ **Test Execution with All Components**

```
TEST EXECUTION TIMELINE
═══════════════════════════════════════════════════════════════════

T=0ms:  npm run test:admin:uat
        ↓
T=100ms: playwright test --project=admin
         ├─ Read playwright.config.ts
         ├─ Load config/env.ts (validate .env)
         ├─ Load config/urls.ts (build URLs)
         ├─ Load config/constants.ts
         └─ Select 'admin' project
        ↓
T=500ms: Launch browser
         ├─ Create new Chrome instance
         ├─ Set baseURL='https://ap.gfau.augmont.com'
         ├─ Enable headless mode
         └─ Set action timeout=10s
        ↓
T=1000ms: Discover tests
         ├─ Find tests/admin/tc01-*.spec.ts
         ├─ Parse test.describe() and test() blocks
         ├─ Read tags: @regression, @admin, @loans
         └─ Queue tests for execution
        ↓
T=1500ms: Fixture Setup
         ├─ admin.fixture.ts extends base test
         ├─ Prepare fixtures:
         │  ├─ kycFilePaths fixture
         │  ├─ page fixture
         │  ├─ loginAs fixture
         │  └─ 50+ page object fixtures
         └─ Wait for first test
        ↓
T=2000ms: Test starts: "TC01 onboarding..."
         ├─ Call test() function with fixture parameters
         ├─ All fixtures now initialize (in order of dependencies)
         │
         ├─ kycFilePaths fixture initializes:
         │  ├─ Call getKycFilePaths()
         │  ├─ Read from process.env (TEST_PAN_CARD_PATH, etc.)
         │  ├─ Resolve relative paths to absolute
         │  └─ Return paths object
         │
         ├─ page fixture initializes:
         │  ├─ Receive 'page' from Playwright
         │  ├─ Navigate to 'https://ap.gfau.augmont.com'
         │  ├─ Create AdminLoginPage(page)
         │  ├─ Get appraiser credentials from adminRoleCreds()
         │  ├─ Fill mobile field
         │  ├─ Fill OTP field
         │  ├─ Click login button
         │  ├─ Wait for dashboard to appear
         │  ├─ Get storageState from page.context()
         │  ├─ Write to storage/uat/admin.json
         │  └─ Return logged-in page
         │
         ├─ loginAs fixture initializes:
         │  └─ Create async function (loginAs) → ready to be called
         │
         ├─ customerManagement fixture initializes:
         │  └─ Create CustomerManagementPage(page) → ready to use
         │
         ├─ kyc fixture initializes:
         │  └─ Create KycPage(page) → ready to use
         │
         ├─ ... (all other page object fixtures initialize)
         │
         └─ All fixtures ready → proceed to test body
        ↓
T=5000ms: test.step('add customer')
         ├─ Create step in report
         ├─ Call customerManagement.clickOnCustomerManagementButton()
         │  ├─ Page Object locates element
         │  ├─ Waits for element to be visible
         │  ├─ Clicks element
         │  └─ Waits for loader to disappear
         ├─ Step completes successfully
         └─ Report: "add customer" ✓ passed
        ↓
T=7000ms: test.step('customer KYC')
         ├─ Call kyc.ClickonKyc(panCardPath, signaturePath, aadhaarPath)
         │  │
         │  ├─ Fill KYC form
         │  │
         │  ├─ uploadFileWithValidation(panCardPath, selector, 'PAN card')
         │  │  ├─ Check: if (!panCardPath) skip
         │  │  ├─ Resolve path: path.resolve(process.cwd(), panCardPath)
         │  │  ├─ Check: existsSync(resolvedPath)
         │  │  ├─ Log: "↗ Uploading PAN card: ..."
         │  │  ├─ Get file input: page.locator(xpath).first()
         │  │  ├─ Upload: fileInput.setInputFiles(resolvedPath)
         │  │  ├─ Wait 2s for upload
         │  │  └─ Log: "✓ PAN card uploaded successfully"
         │  │
         │  ├─ Fill PAN fields
         │  │
         │  ├─ uploadFileWithValidation(aadhaarPath, selector, 'Aadhaar')
         │  │  ├─ Same flow as PAN
         │  │  └─ Log: "✓ Aadhaar uploaded successfully"
         │  │
         │  ├─ Fill Aadhaar fields
         │  │
         │  ├─ uploadFileWithValidation(signaturePath, selector, 'Signature')
         │  │  ├─ Same flow as PAN
         │  │  └─ Log: "✓ Signature uploaded successfully"
         │  │
         │  ├─ Fill signature fields
         │  │
         │  └─ Submit KYC form
         │
         ├─ Step completes successfully
         └─ Report: "customer KYC" ✓ passed with 3 file uploads
        ↓
T=12000ms: test.step('assign branch')
         └─ ... continue with next step
        ↓
T=15000ms: test.step('KYC approval (OPS)')
         ├─ Call loginAs('ops')
         │  ├─ Get OPS credentials from adminRoleCreds('ops', 'uat')
         │  ├─ Navigate to login page
         │  ├─ Fill mobile: UAT_ADMIN_OPS_MOBILE
         │  ├─ Fill OTP: UAT_ADMIN_OPS_OTP
         │  ├─ Click login
         │  └─ Wait for OPS dashboard
         │
         ├─ Call kycApproval.performOpsRatingActions()
         │  └─ Perform OPS-specific actions
         │
         └─ Step completes
        ↓
T=20000ms: test.step('create packet')
         └─ ... continue with remaining steps
        ↓
T=45000ms: All steps completed
         ├─ Test passed ✓
         ├─ Close page
         ├─ Save trace file
         ├─ Save HTML artifacts
         └─ Proceed to next test (if any)
        ↓
T=50000ms: Test suite complete
         ├─ Generate HTML report
         ├─ Generate JSON results
         ├─ Print CLI summary
         └─ Exit code 0 (success)
```

---

## 🔟 **Visual Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLETE FRAMEWORK ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────────────┘

CONFIGURATION TIER
┌────────────┐     ┌──────────┐     ┌───────────┐     ┌──────────────┐
│ playwright │────▶│ config/  │────▶│ fixtures/ │────▶│ tests/admin/ │
│ .config.ts │     │ env.ts   │     │ *.fixture │     │ *.spec.ts    │
└────────────┘     └──────────┘     └───────────┘     └──────────────┘
     │                  │                  │                  │
     │ reads            │ validates        │ injects          │ uses
     ▼                  ▼                  ▼                  ▼
┌────────────┐     ┌──────────┐     ┌───────────┐     ┌──────────────┐
│   .env     │────▶│ config/  │────▶│ Page      │────▶│ PageObjects/ │
│   file     │     │ urls.ts  │     │ Objects   │     │ admin/*.page │
└────────────┘     └──────────┘     └───────────┘     └──────────────┘
                        │                                     │
                        │ builds helpers                      │
                        ▼                                     ▼
                   ┌──────────┐                        ┌──────────────┐
                   │ config/  │                        │ Playwright   │
                   │ constants│                        │ Browser API  │
                   └──────────┘                        └──────────────┘
                        │
                        │ defines paths
                        ▼
                   ┌──────────────────────┐
                   │ storage/<env>/<panel>│
                   │ .json (auth state)   │
                   └──────────────────────┘

EXECUTION TIER
┌─────────────────────────────────────────────────────────────────────┐
│  Playwright Test Runner                                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Test Execution Pipeline                                      │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │ 1. Load Config & Environment                          │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │ 2. Initialize Fixtures (Dependency Injection)         │   │  │
│  │  │    • kycFilePaths                                      │   │  │
│  │  │    • page (auto-login)                                │   │  │
│  │  │    • loginAs (role switching)                         │   │  │
│  │  │    • 50+ PageObjects                                  │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │ 3. Execute Test Steps (Sequential)                    │   │  │
│  │  │    • Each step waits for previous to complete         │   │  │
│  │  │    • Each step can interact with page                 │   │  │
│  │  │    • File uploads happen here                         │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │ 4. Collect Results & Artifacts                        │   │  │
│  │  │    • Screenshots on failure                           │   │  │
│  │  │    • Videos on failure                                │   │  │
│  │  │    • Trace files                                      │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

DATA FLOW DURING EXECUTION
┌─────────────────────────────────────────────────────────────────────┐
│  User Action → PageObject → Playwright Browser API → App Response   │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                     │
│  kyc.ClickonKyc(panCardPath, ...)                                  │
│    ↓                                                               │
│  uploadFileWithValidation(panCardPath, selector, 'PAN card')       │
│    ↓                                                               │
│  existsSync(panCardPath) → TRUE                                   │
│    ↓                                                               │
│  page.locator(selector).setInputFiles(panCardPath)                │
│    ↓                                                               │
│  Browser Form Input Element                                       │
│    ↓                                                               │
│  App Receives File Upload                                         │
│    ↓                                                               │
│  App Shows Success/Error                                          │
│    ↓                                                               │
│  Test Logs: "✓ PAN card uploaded successfully"                    │
│    ↓                                                               │
│  Test Continues to Next Step                                      │
└─────────────────────────────────────────────────────────────────────┘

OUTPUT TIER
┌─────────────────────────────────────────────────────────────────────┐
│  Reports & Artifacts                                                │
│  ├─ reports/html/index.html          (Interactive HTML report)      │
│  ├─ reports/results.json             (Machine-readable results)     │
│  ├─ reports/test-artifacts/          (Screenshots, videos, traces)  │
│  ├─ storage/<env>/<panel>.json       (Saved auth state)            │
│  └─ Console output                   (CLI summary)                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌────────────────────────────────────────────────────────────────────┐
│                    HOW EXECUTION WORKS (TLDR)                      │
└────────────────────────────────────────────────────────────────────┘

1. USER RUNS: npm run test:admin:uat

2. PLAYWRIGHT LOADS:
   - playwright.config.ts
   - Selects 'admin' project
   - Sets baseURL, timeout, reporters

3. CONFIG LOADS:
   - Reads .env file
   - Validates with Zod
   - Builds URLs and credentials
   - Defines constants

4. BROWSER STARTS:
   - Chrome launches (headless)
   - Navigates to admin app URL

5. FIXTURES INITIALIZE:
   - page fixture logs in
   - kycFilePaths resolved
   - 50+ page objects created
   - loginAs function ready

6. TEST EXECUTES:
   - test.step blocks run sequentially
   - Each step interacts with page
   - File uploads happen via helper
   - Assertions check results

7. ROLE SWITCHING:
   - loginAs('role') function called
   - Current user logs out
   - New user logs in
   - Test continues as new role

8. RESULTS COLLECTED:
   - Screenshots on failure
   - Videos on failure
   - Trace for debugging
   - Report generated

9. OUTPUT GENERATED:
   - HTML report
   - JSON results
   - Console summary
   - Exit code (0=success, 1=failure)

TOTAL EXECUTION TIME: 5-15 minutes (depending on test complexity)
```

