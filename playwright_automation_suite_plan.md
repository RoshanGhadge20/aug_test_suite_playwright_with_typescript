# Playwright Automation Suite Plan (plan.md)

## 1. Objective

Build a scalable, maintainable end-to-end automation framework using Playwright + TypeScript to support multiple panels:

- Admin Panel
- Customer Panel
- Business Panel
- New Admin Panel

The framework should support:
- Reusability across panels
- Isolation of authentication/session
- Cross-panel workflows
- CI/CD execution
- Easy onboarding for new contributors

---

## 2. High-Level Architecture

- Single repository (monorepo-style)
- Multi-project configuration using Playwright
- Modular structure with shared and panel-specific layers

Architecture Layers:

1. Test Layer → Actual test cases
2. Page Object Layer → UI abstraction
3. Fixture Layer → Auth, setup, reusable context
4. Utility Layer → API, data, helpers
5. Config Layer → Environment + URLs

---

## 3. Project Structure (Planned)

```
playwright-automation/
│
├── tests/
│   ├── admin/
│   ├── customer/
│   ├── business/
│   └── new-admin/
│
├── pages/
│   ├── admin/
│   ├── customer/
│   ├── business/
│   ├── new-admin/
│   └── shared/
│
├── fixtures/
│   ├── auth/
│   ├── base.fixture.ts
│   └── test-data.fixture.ts
│
├── utils/
│   ├── api/
│   ├── data/
│   ├── logger/
│   └── helpers/
│
├── config/
│   ├── env.ts
│   ├── urls.ts
│   └── constants.ts
│
├── storage/
│   ├── admin.json
│   ├── customer.json
│   ├── business.json
│   └── new-admin.json
│
├── setup/
│   ├── global-setup.ts
│   └── auth.setup.ts
│
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

---

## 4. Environment Strategy

Support multiple environments:

- dev
- staging
- production (optional, restricted)

Approach:
- Use `.env` files
- Centralize config in `config/env.ts`

Example:
```
BASE_URL_ADMIN=
BASE_URL_CUSTOMER=
```

---

## 5. Playwright Project Configuration

Each panel will be a separate Playwright project.

Goals:
- Independent execution
- Separate base URLs
- Separate auth storage

Projects:
- admin
- customer
- business
- new-admin

---

## 6. Authentication Strategy

Problem:
- Shared backend → risk of session hijacking

Solution:
- Separate storage state per panel
- Dedicated login flows
- Pre-authentication via setup scripts

Flow:
1. Run auth setup
2. Save storage state
3. Reuse in tests

---

## 7. Test Design Strategy

### 7.1 Test Types

- Smoke Tests
- Regression Tests
- Integration (cross-panel)
- Negative/Security tests

### 7.2 Naming Convention

```
<feature>.spec.ts
```

Example:
```
login.spec.ts
user-management.spec.ts
```

### 7.3 Tagging Strategy

- @smoke
- @regression
- @admin
- @customer

---

## 8. Page Object Model Strategy

- One folder per panel
- Shared components in `/shared`

Rules:
- No assertions inside page objects
- Only UI actions + selectors

---

## 9. Fixtures Strategy

Custom fixtures for:

- Authenticated users
- API clients
- Test data setup

Benefits:
- Cleaner tests
- Reusability
- Centralized setup

---

## 10. Test Data Management

Options:

1. Static JSON
2. Dynamic via API
3. Factory-based generation

Recommended:
- Hybrid approach

---

## 11. API Layer Integration

Purpose:
- Pre-test setup
- Faster state creation

Examples:
- Create user via API
- Seed transactions

---

## 12. Logging & Debugging

- Structured logging utility
- Attach logs/screenshots on failure
- Enable Playwright trace viewer

---

## 13. Reporting

Tools:
- Playwright HTML report
- Optional: Allure

Artifacts:
- Screenshots
- Videos
- Traces

---

## 14. CI/CD & Docker Strategy

### Goal

Run full regression suite in a **Dockerized environment** before every release (one-time execution).

---

### 14.1 Dockerization Approach

- Entire test suite runs inside a Docker container
- No dependency on local machine setup
- Consistent execution across environments

Docker will include:
- Node.js
- Playwright + browsers
- Project code

---

### 14.2 Dockerfile Strategy

Base Image:
- Use official Playwright image (recommended)

Example:
```
FROM mcr.microsoft.com/playwright:v1.43.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx playwright install --with-deps

CMD ["npx", "playwright", "test"]
```

---

### 14.3 Execution Modes

#### Local Docker Run

```
docker build -t playwright-suite .
docker run --env-file=.env playwright-suite
```

#### CI/CD Run (Release Pipeline)

- Triggered only before release
- Runs full regression suite
- Fails build if tests fail

---

### 14.4 Environment Handling in Docker

- Use `.env` file
- Pass environment variables at runtime

Example:
```
docker run --env ENV=staging playwright-suite
```

---

### 14.5 Test Execution Strategy

- Run all projects in parallel:

```
npx playwright test
```

- Or controlled execution:

```
npx playwright test --project=admin --project=customer
```

---

### 14.6 One-Time Regression Before Release

Flow:

1. Code freeze
2. Build Docker image
3. Run full regression suite
4. Generate report
5. Approve/reject release

---

### 14.7 Reporting in Docker

Artifacts to persist:

- HTML report
- Screenshots
- Videos
- Traces

Mount volume:

```
docker run -v $(pwd)/reports:/app/playwright-report playwright-suite
```

---

### 14.8 Parallelization Strategy

- Use Playwright built-in parallel workers
- Scale using CI runners if needed

---

### 14.9 CI/CD Integration

Pipeline Steps:

1. Build Docker image
2. Run container
3. Collect reports
4. Mark build status

Example (conceptual):

```
stage: regression
script:
  - docker build -t playwright-suite .
  - docker run playwright-suite
```

---

### 14.10 Failure Handling

- Fail pipeline if any test fails
- Store artifacts for debugging
- Enable retries for flaky tests

---

## 15. Scalability Considerations

- Modular folder structure
- Avoid duplication
- Use shared utilities
- Keep tests independent

---

## 16. Security Considerations

- Isolate sessions per panel
- Avoid token reuse
- Mask sensitive logs

---

## 17. Future Enhancements

- Visual regression testing
- Performance checks
- Integration with monitoring tools
- Test flakiness dashboard

---

## 18. Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Session leakage | Separate storage states |
| Flaky tests | Retry + proper waits |
| Slow execution | Parallel runs |
| Data dependency | API-based setup |

---

## 19. Next Steps

1. Initialize Playwright + TypeScript project
2. Create folder structure
3. Configure Playwright projects
4. Implement auth setup
5. Build base fixtures
6. Add sample tests per panel
7. Setup CI pipeline

---

## 20. Success Criteria

- Tests run independently per panel
- Cross-panel scenarios supported
- Minimal duplication
- Easy to scale and maintain

