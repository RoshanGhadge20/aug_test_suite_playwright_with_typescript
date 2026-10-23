# Framework Structure Documentation Index

This folder contains comprehensive documentation explaining how the Augmont test suite framework works, how tests execute, and how to debug issues.

## 📚 Documentation Files

### 1. **FRAMEWORK_STRUCTURE_FLOW.md** (Comprehensive Reference)
   **Use this when:** You want a complete, detailed explanation
   
   Contains:
   - Architecture overview with diagrams
   - Initialization phase (step-by-step)
   - Test execution phase (detailed flow)
   - Fixture system explained
   - Data flow examples
   - Configuration layers
   - Component interactions
   - 10-minute overview section

   **Read time:** 30-45 minutes
   **Best for:** Understanding the complete system

---

### 2. **EXECUTION_FLOW_QUICK_REFERENCE.md** (Visual Guide)
   **Use this when:** You want quick visual reference
   
   Contains:
   - 1-minute overview
   - Test lifecycle diagram
   - Component dependencies
   - Test execution steps (code examples)
   - Role switching flow
   - File upload flow
   - Configuration lookup chain
   - Complete data path example
   - Fixture initialization order
   - Error handling scenarios
   - Time breakdown for each step
   - Quick reference for file locations

   **Read time:** 10-15 minutes
   **Best for:** Quick lookups and understanding flow

---

### 3. **TROUBLESHOOTING_GUIDE.md** (Problem Solver)
   **Use this when:** Something is broken
   
   Contains:
   - 8 common symptoms and how to debug them
   - Framework navigation flowchart
   - Debugging checklist
   - Key files by layer
   - Pro tips for debugging
   - Quick fixes cheat sheet
   - Which file to check for each issue

   **Read time:** 5-10 minutes per issue
   **Best for:** Fixing problems

---

## 🎯 Quick Navigation by Question

### "How does the framework work?"
→ Read: **FRAMEWORK_STRUCTURE_FLOW.md** (complete)
→ Then: **EXECUTION_FLOW_QUICK_REFERENCE.md** (visual confirmation)

### "I need to understand fixtures"
→ Read: **FRAMEWORK_STRUCTURE_FLOW.md** section 6 (Fixture System)
→ Then: **EXECUTION_FLOW_QUICK_REFERENCE.md** fixture initialization

### "How does file upload work?"
→ Read: **FRAMEWORK_STRUCTURE_FLOW.md** section 7 (Data Flow)
→ Then: **EXECUTION_FLOW_QUICK_REFERENCE.md** (File Upload Flow)

### "How does role switching work?"
→ Read: **EXECUTION_FLOW_QUICK_REFERENCE.md** (Role Switching Flow)
→ Debug: **TROUBLESHOOTING_GUIDE.md** (Symptom 7)

### "My test is failing - how do I debug?"
→ Go to: **TROUBLESHOOTING_GUIDE.md**
→ Find matching symptom
→ Follow debugging steps
→ Check "Which file to check" section

### "I want to understand one config value flow"
→ Read: **EXECUTION_FLOW_QUICK_REFERENCE.md** (Complete Data Path Example)

### "I need to trace execution step by step"
→ Read: **FRAMEWORK_STRUCTURE_FLOW.md** section 9 (Complete Timeline)

### "I'm new to the framework"
→ Start: **EXECUTION_FLOW_QUICK_REFERENCE.md** (1-minute overview)
→ Then: **FRAMEWORK_STRUCTURE_FLOW.md** (sections 1-3)
→ Finally: **TROUBLESHOOTING_GUIDE.md** (checklist)

---

## 📋 Document Structure

Each document follows this pattern:

```
FRAMEWORK_STRUCTURE_FLOW.md
├─ Architecture Overview
├─ Initialization Phase
├─ Test Execution Phase
├─ Fixture System
├─ Data Flow
├─ Configuration Layers
├─ Component Interactions
└─ Summary (TLDR)

EXECUTION_FLOW_QUICK_REFERENCE.md
├─ 1-Minute Overview
├─ Test Lifecycle
├─ Component Dependencies
├─ Test Execution Steps
├─ Role Switching Flow
├─ File Upload Flow
├─ Configuration Lookup
├─ Complete Data Path
├─ Fixture Initialization
├─ Error Handling
├─ Time Breakdown
└─ Quick Reference

TROUBLESHOOTING_GUIDE.md
├─ Symptom 1-8 (with debug steps)
├─ Framework Navigation Flowchart
├─ Debugging Checklist
├─ Key Files by Layer
├─ Pro Tips
├─ Quick Fixes Cheat Sheet
└─ Which File to Check
```

---

## 🔍 Framework Concepts Explained

### Core Concepts

**Fixtures**
- Dependency injection system
- Provide page objects to tests
- Handle setup/teardown
- See: FRAMEWORK_STRUCTURE_FLOW.md section 6

**Page Objects**
- Represent UI screens/features
- Encapsulate locators and actions
- Used via fixtures
- Examples: pages/admin/kyc.page.ts

**Configuration Layers**
- .env → env.ts → urls.ts → constants.ts → fixtures
- Each layer transforms previous layer
- See: FRAMEWORK_STRUCTURE_FLOW.md section 8

**Test Steps**
- Sequential blocks within test
- Each step can use fixtures
- Each step can fail independently
- See: FRAMEWORK_STRUCTURE_FLOW.md section 5

**Role Switching**
- loginAs(role) fixture function
- Switch between admin roles mid-test
- Each role has different credentials
- See: EXECUTION_FLOW_QUICK_REFERENCE.md (Role Switching)

**File Upload**
- uploadFileWithValidation() helper
- Validates file exists before upload
- Gracefully skips missing files
- See: EXECUTION_FLOW_QUICK_REFERENCE.md (File Upload)

---

## 🎓 Learning Path (Recommended)

### For Complete Beginners
1. Read: **EXECUTION_FLOW_QUICK_REFERENCE.md** (1-minute overview)
2. Read: **FRAMEWORK_STRUCTURE_FLOW.md** (section 1 only)
3. Run: `npm run test:admin:uat` (see it in action)
4. Read: **EXECUTION_FLOW_QUICK_REFERENCE.md** (test lifecycle)
5. Read: **FRAMEWORK_STRUCTURE_FLOW.md** (sections 2-3)

### For Intermediate Users
1. Review: **FRAMEWORK_STRUCTURE_FLOW.md** (full read)
2. Study: **EXECUTION_FLOW_QUICK_REFERENCE.md** (complete)
3. Reference: **TROUBLESHOOTING_GUIDE.md** (as needed)

### For Advanced Users
1. Reference: **TROUBLESHOOTING_GUIDE.md** (problems)
2. Quick lookup: **EXECUTION_FLOW_QUICK_REFERENCE.md**
3. Debug: Use Pro Tips section

---

## 🔗 Cross-References

### Framework Concepts Map

```
TEST STARTS
    ↓
playwright.config.ts (FRAMEWORK_STRUCTURE_FLOW.md section 2)
    ↓
config/env.ts validation (FRAMEWORK_STRUCTURE_FLOW.md section 8)
    ↓
Fixtures initialize (FRAMEWORK_STRUCTURE_FLOW.md section 6)
    ↓
Page fixture logs in (EXECUTION_FLOW_QUICK_REFERENCE.md fixture init)
    ↓
Test steps execute (FRAMEWORK_STRUCTURE_FLOW.md section 5)
    ↓
File uploads happen (EXECUTION_FLOW_QUICK_REFERENCE.md file upload)
    ↓
Role switching (EXECUTION_FLOW_QUICK_REFERENCE.md role switching)
    ↓
Results reported (FRAMEWORK_STRUCTURE_FLOW.md section 9)
    ↓
Reports generated (EXECUTION_FLOW_QUICK_REFERENCE.md time breakdown)
```

---

## 🛠️ How to Use These Docs for Common Tasks

### Task: "Add a new test step"
1. Check: FRAMEWORK_STRUCTURE_FLOW.md section 5 (test execution)
2. Reference: EXECUTION_FLOW_QUICK_REFERENCE.md (test execution steps)
3. Look at: tests/admin/tc01-onboarding-goldloan.spec.ts (example)

### Task: "Fix a failing selector"
1. Go to: TROUBLESHOOTING_GUIDE.md (Symptom 5 or 8)
2. Check: pages/admin/kyc.page.ts (update XPath)
3. Verify: Run test again

### Task: "Switch test to UAT environment"
1. Check: FRAMEWORK_STRUCTURE_FLOW.md section 2 (environment loading)
2. Set: `$env:TARGET_ENV='uat'`
3. Reference: EXECUTION_FLOW_QUICK_REFERENCE.md (configuration lookup)

### Task: "Debug file upload error"
1. Go to: TROUBLESHOOTING_GUIDE.md (Symptom 4)
2. Follow: Debugging steps
3. Check: EXECUTION_FLOW_QUICK_REFERENCE.md (file upload flow)
4. Fix: paths or file creation

### Task: "Understand how credentials flow"
1. Read: EXECUTION_FLOW_QUICK_REFERENCE.md (complete data path example)
2. Trace through: FRAMEWORK_STRUCTURE_FLOW.md (data flow section 7)

### Task: "Change credentials for a role"
1. Find: .env file (UAT_ADMIN_OPS_MOBILE)
2. Update: Set new mobile number
3. Verify: TROUBLESHOOTING_GUIDE.md (Symptom 3 - verify credentials)

---

## 📊 Quick Fact Sheet

```
Framework: Playwright 1.59.1
Language: TypeScript 5.9.3
Test Runner: Node.js / npm
Environments: TEST (local) and UAT (remote)
Panels: admin, customer, business, new-admin
APIs: api-backend, api-emi
Page Objects: 60+ (admin panel)
Test Fixtures: 50+ (admin panel)
Average Test Duration: 10-15 minutes
Reports: HTML, JSON, CLI
Auth Method: OTP-based
Session Storage: /storage/<env>/<panel>.json
Configuration: .env (35+ variables)
```

---

## 🎯 File Finding Quick Reference

```
NEED TO...                    LOOK IN...
─────────────────────────────────────────────────────────────
Understand config loading     config/env.ts
Build URLs from config        config/urls.ts
Define constants              config/constants.ts
Setup fixtures                fixtures/admin.fixture.ts
Find page objects             pages/admin/*.page.ts
Run a test                    tests/admin/*.spec.ts
Debug KYC flow               pages/admin/kyc.page.ts
Debug login                  pages/admin/login.page.ts
Fix role switching           fixtures/admin.fixture.ts
Resolve file paths           utils/data/test-file-paths.ts
Set credentials              .env file
Change timeouts              playwright.config.ts
View test report             reports/html/index.html
Check auth state             storage/<env>/<panel>.json
Debug infrastructure         TROUBLESHOOTING_GUIDE.md
```

---

## 🤔 FAQ - Which Doc to Read?

**Q: "I just want to run the test, what should I know?"**
A: Skim EXECUTION_FLOW_QUICK_REFERENCE.md (1-minute section), then run `npm run test:admin:uat`

**Q: "Why did my test fail?"**
A: Go to TROUBLESHOOTING_GUIDE.md, find matching symptom

**Q: "How do fixtures work?"**
A: Read FRAMEWORK_STRUCTURE_FLOW.md section 6, then check EXECUTION_FLOW_QUICK_REFERENCE.md fixture initialization

**Q: "What happens when I run npm test?"**
A: Read FRAMEWORK_STRUCTURE_FLOW.md section 9 (Complete Timeline)

**Q: "How do file uploads work?"**
A: Read EXECUTION_FLOW_QUICK_REFERENCE.md (File Upload Flow), then FRAMEWORK_STRUCTURE_FLOW.md (Data Flow)

**Q: "Where's the configuration?"**
A: .env file, explained in FRAMEWORK_STRUCTURE_FLOW.md section 3

**Q: "How do I add a new test?"**
A: See tests/admin/tc01-onboarding-goldloan.spec.ts as example, refer to FRAMEWORK_STRUCTURE_FLOW.md section 5

**Q: "Can I run tests in parallel?"**
A: Check FRAMEWORK_STRUCTURE_FLOW.md (architecture), see workers config in playwright.config.ts

---

## 📌 Key Takeaways

1. **Framework = Layers**: Config → URLs → Fixtures → PageObjects → Tests
2. **Fixtures = Dependency Injection**: Tests receive what they need automatically
3. **PageObjects = Encapsulation**: Each screen has its own file with locators and actions
4. **Tests = Sequential Steps**: Each test.step() runs after the previous one completes
5. **Roles = Dynamic**: Use loginAs() to switch roles within a test
6. **Uploads = Validated**: Files checked for existence before upload, errors logged
7. **Config = Centralized**: All secrets/URLs in .env, accessed via config/ layer
8. **Reports = Comprehensive**: HTML interactive report, JSON machine-readable, video/trace on failure

---

## 🔗 Related Documentation

Also see:
- **SETUP_FILE_UPLOADS.md** - How to set up file uploads (3 steps)
- **FILE_UPLOAD_FIX_COMPLETE.md** - Details on file upload implementation
- **CLAUDE.md** - High-level overview of test suite
- **README.md** - Project setup and usage

---

## 💬 Document Maintenance

These documents were created to explain:
- Framework structure and architecture
- Execution flow from start to finish
- How each component interacts
- How to debug common issues

**Last Updated:** June 2, 2026
**Documentation Version:** 1.0
**Framework Version:** Playwright 1.59.1

---

## 🎓 Next Steps

1. **For Setup**: Read SETUP_FILE_UPLOADS.md
2. **For Running Tests**: `npm run test:admin:uat`
3. **For Understanding**: Pick a doc from above and start reading
4. **For Debugging**: Go to TROUBLESHOOTING_GUIDE.md
5. **For Contributing**: Understand framework first, then check FRAMEWORK_STRUCTURE_FLOW.md

Happy testing! 🚀
