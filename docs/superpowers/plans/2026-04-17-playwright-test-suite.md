# Augmont Playwright Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript + Playwright end-to-end test framework for Augmont's four panels (admin, customer, business, new-admin), dockerized for headless EC2 deployment, with an HTTP API to trigger test runs remotely.

**Architecture:**
A single monorepo contains (a) a Playwright test project with multi-project config per panel, Page Object Model, storage-state auth isolation, and tag-driven suites, and (b) an Express.js runner API that spawns Playwright as a child process to execute parameterized runs asynchronously. The whole stack runs in one Docker image on EC2; the API is the only inbound surface (port 3000), while Playwright runs headless using the official `mcr.microsoft.com/playwright` base image. Run artifacts (HTML report, traces, videos) are persisted to a mounted volume and retrievable via the API.

**Tech Stack:**
- Node.js 20 LTS, TypeScript 5.x
- Playwright 1.47+ with `@playwright/test` runner
- Express.js 4, zod (validation), winston (logging), uuid, dotenv
- Vitest for unit-testing the API layer (keep Playwright reserved for browser tests)
- Docker + docker-compose, `mcr.microsoft.com/playwright:v1.47.0-jammy` base
- GitHub Actions for CI

---

## Prerequisites & Assumptions

1. The working directory is `/Users/divyeshpatel/augmont/github/augmont-test-suite` and currently contains only `playwright_automation_suite_plan.md` (the source spec for this plan).
2. The four panels map as follows (URLs supplied at runtime via env):
   - `admin` → gold-admin-frontend
   - `customer` → augmont-customer-portal
   - `business` → augmont-agent-portal
   - `new-admin` → the newer admin panel (URL TBD, supplied via env)
3. Login uses email + password via form submission. Any panel needing a different flow (OTP, SSO) can extend `BaseLoginPage` later — out of scope for this plan.
4. The API runs on port 3000 and authenticates callers via a single shared `X-API-Key` header. This is sufficient for an internal EC2 service behind a security group; rotate the key via env var.
5. TDD applies to **non-test** code (config, services, API handlers, utilities). The Playwright specs themselves are the tests — they don't need meta-tests.

---

## File Structure

```
augmont-test-suite/
├── src/
│   └── api/
│       ├── server.ts                       # express app wiring
│       ├── index.ts                        # bootstraps server
│       ├── middleware/
│       │   ├── auth.middleware.ts
│       │   └── error.middleware.ts
│       ├── routes/
│       │   ├── health.routes.ts
│       │   └── runs.routes.ts
│       ├── services/
│       │   ├── run-manager.service.ts      # in-memory registry of runs
│       │   └── playwright-executor.service.ts  # spawns playwright
│       ├── schemas/
│       │   └── run-request.schema.ts       # zod schema for POST body
│       └── types/
│           └── run.types.ts
│
├── tests/
│   ├── admin/
│   │   └── login.spec.ts
│   ├── customer/
│   │   └── login.spec.ts
│   ├── business/
│   │   └── login.spec.ts
│   └── new-admin/
│       └── login.spec.ts
│
├── pages/
│   ├── shared/
│   │   └── base.page.ts
│   ├── admin/
│   │   └── login.page.ts
│   ├── customer/
│   │   └── login.page.ts
│   ├── business/
│   │   └── login.page.ts
│   └── new-admin/
│       └── login.page.ts
│
├── fixtures/
│   └── base.fixture.ts
│
├── setup/
│   ├── global-setup.ts
│   └── auth.setup.ts                       # runs per panel, writes storage/
│
├── config/
│   ├── env.ts                              # zod-validated env loader
│   ├── urls.ts                             # panel → base URL map
│   └── constants.ts
│
├── utils/
│   ├── logger/
│   │   └── logger.ts
│   ├── api/
│   │   └── api-client.ts                   # for seeding test data
│   └── data/
│       └── test-data.factory.ts
│
├── storage/                                # gitignored, auth states
│   └── .gitkeep
│
├── reports/                                # gitignored, run artifacts
│   └── .gitkeep
│
├── test/                                   # vitest tests for API code
│   ├── api/
│   │   ├── auth.middleware.test.ts
│   │   ├── run-manager.service.test.ts
│   │   ├── playwright-executor.service.test.ts
│   │   ├── runs.routes.test.ts
│   │   └── health.routes.test.ts
│   ├── config/
│   │   └── env.test.ts
│   └── utils/
│       ├── logger.test.ts
│       └── test-data.factory.test.ts
│
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── .env.example
├── playwright.config.ts
├── vitest.config.ts
├── tsconfig.json
├── package.json
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

Each file owns one responsibility. Express code lives under `src/api/`; Playwright code lives at the root (`tests/`, `pages/`, `fixtures/`, `setup/`) so Playwright's default discovery works without custom `testDir` gymnastics.

---

## Task 1: Initialize Node.js project + git

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git and npm**

Run:
```bash
cd /Users/divyeshpatel/augmont/github/augmont-test-suite
git init
npm init -y
```

- [ ] **Step 2: Install runtime dependencies**

Run:
```bash
npm install express@4 zod dotenv winston uuid
```

- [ ] **Step 3: Install dev dependencies**

Run:
```bash
npm install -D typescript@5 @types/node @types/express @types/uuid \
  @playwright/test vitest supertest @types/supertest \
  ts-node tsx
npx playwright install --with-deps chromium
```

- [ ] **Step 4: Create .gitignore**

Create `.gitignore`:
```
node_modules/
dist/
.env
.env.local
storage/*
!storage/.gitkeep
reports/*
!reports/.gitkeep
playwright-report/
test-results/
*.log
.DS_Store
.vscode/
coverage/
```

- [ ] **Step 5: Add npm scripts to package.json**

Edit `package.json` `scripts` section:
```json
{
  "scripts": {
    "test": "playwright test",
    "test:admin": "playwright test --project=admin",
    "test:customer": "playwright test --project=customer",
    "test:business": "playwright test --project=business",
    "test:new-admin": "playwright test --project=new-admin",
    "test:smoke": "playwright test --grep @smoke",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "api:dev": "tsx watch src/api/index.ts",
    "api:start": "node dist/api/index.js",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: initialize node project with playwright + express deps"
```

---

## Task 2: TypeScript configuration

**Files:**
- Create: `tsconfig.json`

- [ ] **Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@config/*": ["config/*"],
      "@pages/*": ["pages/*"],
      "@fixtures/*": ["fixtures/*"],
      "@utils/*": ["utils/*"],
      "@api/*": ["src/api/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*", "pages/**/*", "fixtures/**/*", "setup/**/*", "config/**/*", "utils/**/*", "test/**/*", "playwright.config.ts", "vitest.config.ts"],
  "exclude": ["node_modules", "dist", "reports", "storage"]
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors (no source files yet).

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add TypeScript config with path aliases"
```

---

## Task 3: Directory scaffolding

**Files:**
- Create: `storage/.gitkeep`, `reports/.gitkeep`
- Create: empty dirs for `tests/{admin,customer,business,new-admin}`, `pages/{admin,customer,business,new-admin,shared}`, `fixtures`, `setup`, `config`, `utils/{api,data,logger}`, `src/api/{middleware,routes,services,schemas,types}`, `test/{api,config,utils}`, `.github/workflows`

- [ ] **Step 1: Create all directories**

Run:
```bash
mkdir -p tests/admin tests/customer tests/business tests/new-admin \
         pages/admin pages/customer pages/business pages/new-admin pages/shared \
         fixtures setup config \
         utils/api utils/data utils/logger \
         src/api/middleware src/api/routes src/api/services src/api/schemas src/api/types \
         test/api test/config test/utils \
         storage reports .github/workflows
touch storage/.gitkeep reports/.gitkeep
```

- [ ] **Step 2: Verify structure**

Run: `ls -la tests pages fixtures setup config utils src/api test storage reports`
Expected: All listed dirs exist.

- [ ] **Step 3: Commit**

```bash
git add storage/.gitkeep reports/.gitkeep
git commit -m "chore: scaffold directory structure"
```

---

## Task 4: Environment config with zod validation

**Files:**
- Create: `.env.example`
- Create: `config/env.ts`
- Test: `test/config/env.test.ts`

- [ ] **Step 1: Create .env.example**

```
# Panel base URLs
BASE_URL_ADMIN=http://localhost:4202
BASE_URL_CUSTOMER=http://localhost:4200
BASE_URL_BUSINESS=http://localhost:4201
BASE_URL_NEW_ADMIN=http://localhost:4203

# Credentials per panel (email/password)
ADMIN_USER_EMAIL=
ADMIN_USER_PASSWORD=
CUSTOMER_USER_EMAIL=
CUSTOMER_USER_PASSWORD=
BUSINESS_USER_EMAIL=
BUSINESS_USER_PASSWORD=
NEW_ADMIN_USER_EMAIL=
NEW_ADMIN_USER_PASSWORD=

# Execution
ENV=dev
HEADLESS=true

# API server
API_PORT=3000
API_KEY=change-me-before-deploy
LOG_LEVEL=info
```

- [ ] **Step 2: Write failing test for env loader**

Create `test/config/env.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { loadEnv } from '../../config/env';

describe('loadEnv', () => {
  const valid = {
    BASE_URL_ADMIN: 'http://a', BASE_URL_CUSTOMER: 'http://c',
    BASE_URL_BUSINESS: 'http://b', BASE_URL_NEW_ADMIN: 'http://n',
    ADMIN_USER_EMAIL: 'a@x', ADMIN_USER_PASSWORD: 'p',
    CUSTOMER_USER_EMAIL: 'c@x', CUSTOMER_USER_PASSWORD: 'p',
    BUSINESS_USER_EMAIL: 'b@x', BUSINESS_USER_PASSWORD: 'p',
    NEW_ADMIN_USER_EMAIL: 'n@x', NEW_ADMIN_USER_PASSWORD: 'p',
    ENV: 'dev', HEADLESS: 'true',
    API_PORT: '3000', API_KEY: 'secret', LOG_LEVEL: 'info',
  };

  it('parses a valid env object', () => {
    const result = loadEnv(valid);
    expect(result.BASE_URL_ADMIN).toBe('http://a');
    expect(result.API_PORT).toBe(3000);
    expect(result.HEADLESS).toBe(true);
  });

  it('throws when a required variable is missing', () => {
    const missing = { ...valid } as Record<string, string>;
    delete missing.API_KEY;
    expect(() => loadEnv(missing)).toThrow(/API_KEY/);
  });

  it('rejects invalid ENV value', () => {
    expect(() => loadEnv({ ...valid, ENV: 'mars' })).toThrow();
  });
});
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test:unit -- test/config/env.test.ts`
Expected: FAIL — `Cannot find module '../../config/env'`.

- [ ] **Step 5: Implement env loader**

Create `config/env.ts`:
```typescript
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  BASE_URL_ADMIN: z.string().url(),
  BASE_URL_CUSTOMER: z.string().url(),
  BASE_URL_BUSINESS: z.string().url(),
  BASE_URL_NEW_ADMIN: z.string().url(),

  ADMIN_USER_EMAIL: z.string().min(1),
  ADMIN_USER_PASSWORD: z.string().min(1),
  CUSTOMER_USER_EMAIL: z.string().min(1),
  CUSTOMER_USER_PASSWORD: z.string().min(1),
  BUSINESS_USER_EMAIL: z.string().min(1),
  BUSINESS_USER_PASSWORD: z.string().min(1),
  NEW_ADMIN_USER_EMAIL: z.string().min(1),
  NEW_ADMIN_USER_PASSWORD: z.string().min(1),

  ENV: z.enum(['dev', 'staging', 'production']).default('dev'),
  HEADLESS: z.string().transform((v) => v !== 'false').default('true'),

  API_PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().min(8),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}

export const env = (() => {
  try {
    return loadEnv();
  } catch (err) {
    if (process.env.SKIP_ENV_VALIDATION === 'true') {
      return {} as AppEnv;
    }
    throw err;
  }
})();
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:unit -- test/config/env.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add .env.example config/env.ts test/config/env.test.ts vitest.config.ts
git commit -m "feat: add zod-validated environment config loader"
```

---

## Task 5: URL and panel constants

**Files:**
- Create: `config/urls.ts`
- Create: `config/constants.ts`

- [ ] **Step 1: Create panel constants**

Create `config/constants.ts`:
```typescript
export const PANELS = ['admin', 'customer', 'business', 'new-admin'] as const;
export type Panel = typeof PANELS[number];

export const STORAGE_STATE_PATH: Record<Panel, string> = {
  admin: 'storage/admin.json',
  customer: 'storage/customer.json',
  business: 'storage/business.json',
  'new-admin': 'storage/new-admin.json',
};

export const DEFAULT_TIMEOUTS = {
  action: 15_000,
  navigation: 30_000,
  test: 60_000,
} as const;
```

- [ ] **Step 2: Create URL map**

Create `config/urls.ts`:
```typescript
import { env } from './env';
import type { Panel } from './constants';

export const PANEL_URLS: Record<Panel, string> = {
  admin: env.BASE_URL_ADMIN,
  customer: env.BASE_URL_CUSTOMER,
  business: env.BASE_URL_BUSINESS,
  'new-admin': env.BASE_URL_NEW_ADMIN,
};

export const PANEL_CREDENTIALS: Record<Panel, { email: string; password: string }> = {
  admin: { email: env.ADMIN_USER_EMAIL, password: env.ADMIN_USER_PASSWORD },
  customer: { email: env.CUSTOMER_USER_EMAIL, password: env.CUSTOMER_USER_PASSWORD },
  business: { email: env.BUSINESS_USER_EMAIL, password: env.BUSINESS_USER_PASSWORD },
  'new-admin': { email: env.NEW_ADMIN_USER_EMAIL, password: env.NEW_ADMIN_USER_PASSWORD },
};
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add config/urls.ts config/constants.ts
git commit -m "feat: add panel URL and credential mapping"
```

---

## Task 6: Logger utility

**Files:**
- Create: `utils/logger/logger.ts`
- Test: `test/utils/logger.test.ts`

- [ ] **Step 1: Write failing test**

Create `test/utils/logger.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createLogger } from '../../utils/logger/logger';

describe('createLogger', () => {
  it('creates a logger with info/error/warn/debug methods', () => {
    const logger = createLogger({ level: 'info', name: 'test' });
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('masks sensitive fields in logged metadata', () => {
    const logger = createLogger({ level: 'debug', name: 'test' });
    const masked = logger.maskSensitive({ email: 'a@b.com', password: 'pw', apiKey: 'x', nested: { token: 't' } });
    expect(masked.email).toBe('a@b.com');
    expect(masked.password).toBe('***');
    expect(masked.apiKey).toBe('***');
    expect((masked.nested as { token: string }).token).toBe('***');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- test/utils/logger.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement logger**

Create `utils/logger/logger.ts`:
```typescript
import winston from 'winston';

const SENSITIVE_KEYS = new Set(['password', 'apiKey', 'api_key', 'token', 'authorization', 'secret']);

export type Logger = winston.Logger & {
  maskSensitive: (obj: Record<string, unknown>) => Record<string, unknown>;
};

export function createLogger(opts: { level: string; name: string }): Logger {
  const base = winston.createLogger({
    level: opts.level,
    defaultMeta: { service: opts.name },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
  });

  const maskSensitive = (obj: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(k)) out[k] = '***';
      else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = maskSensitive(v as Record<string, unknown>);
      else out[k] = v;
    }
    return out;
  };

  (base as Logger).maskSensitive = maskSensitive;
  return base as Logger;
}

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  name: 'augmont-test-suite',
});
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:unit -- test/utils/logger.test.ts`
Expected: Both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/logger/logger.ts test/utils/logger.test.ts
git commit -m "feat: add winston logger with sensitive field masking"
```

---

## Task 7: Test data factory

**Files:**
- Create: `utils/data/test-data.factory.ts`
- Test: `test/utils/test-data.factory.test.ts`

- [ ] **Step 1: Write failing test**

Create `test/utils/test-data.factory.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { TestDataFactory } from '../../utils/data/test-data.factory';

describe('TestDataFactory', () => {
  it('generates a unique email each call', () => {
    const a = TestDataFactory.email();
    const b = TestDataFactory.email();
    expect(a).not.toBe(b);
    expect(a).toMatch(/@augmont\.test$/);
  });

  it('generates a phone number with 10 digits', () => {
    expect(TestDataFactory.phone()).toMatch(/^[6-9]\d{9}$/);
  });

  it('generates a user payload with deterministic prefix when passed', () => {
    const u = TestDataFactory.user({ prefix: 'smoke' });
    expect(u.email.startsWith('smoke-')).toBe(true);
    expect(u.password.length).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- test/utils/test-data.factory.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement factory**

Create `utils/data/test-data.factory.ts`:
```typescript
import { randomUUID } from 'crypto';

export const TestDataFactory = {
  email(prefix = 'user'): string {
    return `${prefix}-${randomUUID().slice(0, 8)}@augmont.test`;
  },
  phone(): string {
    const first = 6 + Math.floor(Math.random() * 4);
    let rest = '';
    for (let i = 0; i < 9; i++) rest += Math.floor(Math.random() * 10);
    return `${first}${rest}`;
  },
  password(length = 12): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
    let out = '';
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  },
  user(opts: { prefix?: string } = {}) {
    return {
      email: this.email(opts.prefix),
      password: this.password(),
      phone: this.phone(),
      firstName: 'Test',
      lastName: 'User',
    };
  },
};
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:unit -- test/utils/test-data.factory.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/data/test-data.factory.ts test/utils/test-data.factory.test.ts
git commit -m "feat: add test data factory"
```

---

## Task 8: API helper client (for test data seeding)

**Files:**
- Create: `utils/api/api-client.ts`

- [ ] **Step 1: Implement API client wrapper**

Create `utils/api/api-client.ts`:
```typescript
import { request as pwRequest, APIRequestContext } from '@playwright/test';
import { logger } from '../logger/logger';

export class ApiClient {
  private ctx!: APIRequestContext;

  static async create(baseURL: string, authToken?: string): Promise<ApiClient> {
    const client = new ApiClient();
    client.ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    return client;
  }

  async get<T>(path: string): Promise<T> {
    const res = await this.ctx.get(path);
    if (!res.ok()) throw new Error(`GET ${path} failed: ${res.status()}`);
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    logger.debug('api.post', { path });
    const res = await this.ctx.post(path, { data });
    if (!res.ok()) throw new Error(`POST ${path} failed: ${res.status()}`);
    return res.json() as Promise<T>;
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add utils/api/api-client.ts
git commit -m "feat: add Playwright-based API client for test data seeding"
```

---

## Task 9: Playwright config with multi-project setup

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Create playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE_PATH } from './config/constants';
import { PANEL_URLS } from './config/urls';

const isCI = !!process.env.CI;
const headless = process.env.HEADLESS !== 'false';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : (isCI ? 2 : undefined),
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],
  outputDir: 'reports/test-artifacts',
  use: {
    headless,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: './setup/global-setup.ts',
  projects: [
    {
      name: 'auth-setup',
      testMatch: /setup\/auth\.setup\.ts/,
    },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS.admin, storageState: STORAGE_STATE_PATH.admin },
      dependencies: ['auth-setup'],
      testMatch: /tests\/admin\/.*\.spec\.ts/,
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS.customer, storageState: STORAGE_STATE_PATH.customer },
      dependencies: ['auth-setup'],
      testMatch: /tests\/customer\/.*\.spec\.ts/,
    },
    {
      name: 'business',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS.business, storageState: STORAGE_STATE_PATH.business },
      dependencies: ['auth-setup'],
      testMatch: /tests\/business\/.*\.spec\.ts/,
    },
    {
      name: 'new-admin',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS['new-admin'], storageState: STORAGE_STATE_PATH['new-admin'] },
      dependencies: ['auth-setup'],
      testMatch: /tests\/new-admin\/.*\.spec\.ts/,
    },
  ],
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No errors. (auth.setup.ts, global-setup.ts, and tests don't exist yet — that's fine, Playwright resolves at runtime.)

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "feat: configure Playwright with 4 panel projects + auth-setup dependency"
```

---

## Task 10: Global setup

**Files:**
- Create: `setup/global-setup.ts`

- [ ] **Step 1: Implement global setup**

Create `setup/global-setup.ts`:
```typescript
import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import { logger } from '../utils/logger/logger';

export default async function globalSetup(_config: FullConfig): Promise<void> {
  for (const dir of ['storage', 'reports']) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  logger.info('global setup complete', { env: process.env.ENV, headless: process.env.HEADLESS });
}
```

- [ ] **Step 2: Commit**

```bash
git add setup/global-setup.ts
git commit -m "feat: add Playwright global setup"
```

---

## Task 11: Base Page Object

**Files:**
- Create: `pages/shared/base.page.ts`

- [ ] **Step 1: Implement BasePage**

Create `pages/shared/base.page.ts`:
```typescript
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async waitForUrl(pattern: RegExp | string, timeoutMs = 15_000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout: timeoutMs });
  }

  protected byTestId(id: string): Locator {
    return this.page.getByTestId(id);
  }

  protected byRole(role: Parameters<Page['getByRole']>[0], options?: Parameters<Page['getByRole']>[1]): Locator {
    return this.page.getByRole(role, options);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add pages/shared/base.page.ts
git commit -m "feat: add BasePage abstraction for POMs"
```

---

## Task 12: Login Page Objects per panel

**Files:**
- Create: `pages/admin/login.page.ts`
- Create: `pages/customer/login.page.ts`
- Create: `pages/business/login.page.ts`
- Create: `pages/new-admin/login.page.ts`

> **NOTE TO IMPLEMENTER:** Selectors below use role/label/placeholder queries as defaults. Replace with actual selectors (test-ids preferred) from the real apps once you have them. All four pages follow the same structure; adjust per-panel URL path and selector differences.

- [ ] **Step 1: Create admin login page**

Create `pages/admin/login.page.ts`:
```typescript
import { Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class AdminLoginPage extends BasePage {
  constructor(page: Page) { super(page); }

  private readonly emailInput = () => this.page.getByLabel(/email/i);
  private readonly passwordInput = () => this.page.getByLabel(/password/i);
  private readonly submitButton = () => this.page.getByRole('button', { name: /log ?in|sign ?in/i });

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.open();
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
    await this.waitForUrl(/dashboard|home/i);
  }
}
```

- [ ] **Step 2: Create customer login page**

Create `pages/customer/login.page.ts` — identical structure, only class name changes:
```typescript
import { Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class CustomerLoginPage extends BasePage {
  constructor(page: Page) { super(page); }

  private readonly emailInput = () => this.page.getByLabel(/email|mobile/i);
  private readonly passwordInput = () => this.page.getByLabel(/password/i);
  private readonly submitButton = () => this.page.getByRole('button', { name: /log ?in|sign ?in/i });

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.open();
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
    await this.waitForUrl(/dashboard|home|account/i);
  }
}
```

- [ ] **Step 3: Create business login page**

Create `pages/business/login.page.ts`:
```typescript
import { Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class BusinessLoginPage extends BasePage {
  constructor(page: Page) { super(page); }

  private readonly emailInput = () => this.page.getByLabel(/email|agent id/i);
  private readonly passwordInput = () => this.page.getByLabel(/password/i);
  private readonly submitButton = () => this.page.getByRole('button', { name: /log ?in|sign ?in/i });

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.open();
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
    await this.waitForUrl(/dashboard|home/i);
  }
}
```

- [ ] **Step 4: Create new-admin login page**

Create `pages/new-admin/login.page.ts`:
```typescript
import { Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class NewAdminLoginPage extends BasePage {
  constructor(page: Page) { super(page); }

  private readonly emailInput = () => this.page.getByLabel(/email/i);
  private readonly passwordInput = () => this.page.getByLabel(/password/i);
  private readonly submitButton = () => this.page.getByRole('button', { name: /log ?in|sign ?in/i });

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.open();
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
    await this.waitForUrl(/dashboard|home/i);
  }
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add pages/admin pages/customer pages/business pages/new-admin
git commit -m "feat: add login Page Objects for all 4 panels"
```

---

## Task 13: Auth setup script

**Files:**
- Create: `setup/auth.setup.ts`

- [ ] **Step 1: Implement auth setup**

Create `setup/auth.setup.ts`:
```typescript
import { test as setup, expect } from '@playwright/test';
import { PANEL_URLS, PANEL_CREDENTIALS } from '../config/urls';
import { STORAGE_STATE_PATH } from '../config/constants';
import { AdminLoginPage } from '../pages/admin/login.page';
import { CustomerLoginPage } from '../pages/customer/login.page';
import { BusinessLoginPage } from '../pages/business/login.page';
import { NewAdminLoginPage } from '../pages/new-admin/login.page';

setup('authenticate admin', async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: PANEL_URLS.admin });
  const page = await ctx.newPage();
  const login = new AdminLoginPage(page);
  const { email, password } = PANEL_CREDENTIALS.admin;
  await login.login(email, password);
  await ctx.storageState({ path: STORAGE_STATE_PATH.admin });
  await ctx.close();
});

setup('authenticate customer', async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: PANEL_URLS.customer });
  const page = await ctx.newPage();
  const login = new CustomerLoginPage(page);
  const { email, password } = PANEL_CREDENTIALS.customer;
  await login.login(email, password);
  await ctx.storageState({ path: STORAGE_STATE_PATH.customer });
  await ctx.close();
});

setup('authenticate business', async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: PANEL_URLS.business });
  const page = await ctx.newPage();
  const login = new BusinessLoginPage(page);
  const { email, password } = PANEL_CREDENTIALS.business;
  await login.login(email, password);
  await ctx.storageState({ path: STORAGE_STATE_PATH.business });
  await ctx.close();
});

setup('authenticate new-admin', async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: PANEL_URLS['new-admin'] });
  const page = await ctx.newPage();
  const login = new NewAdminLoginPage(page);
  const { email, password } = PANEL_CREDENTIALS['new-admin'];
  await login.login(email, password);
  await ctx.storageState({ path: STORAGE_STATE_PATH['new-admin'] });
  await ctx.close();
});
```

- [ ] **Step 2: Commit**

```bash
git add setup/auth.setup.ts
git commit -m "feat: add per-panel auth setup with storageState persistence"
```

---

## Task 14: Base fixture

**Files:**
- Create: `fixtures/base.fixture.ts`

- [ ] **Step 1: Implement base fixture**

Create `fixtures/base.fixture.ts`:
```typescript
import { test as base } from '@playwright/test';
import { AdminLoginPage } from '../pages/admin/login.page';
import { CustomerLoginPage } from '../pages/customer/login.page';
import { BusinessLoginPage } from '../pages/business/login.page';
import { NewAdminLoginPage } from '../pages/new-admin/login.page';

type PageObjectFixtures = {
  adminLogin: AdminLoginPage;
  customerLogin: CustomerLoginPage;
  businessLogin: BusinessLoginPage;
  newAdminLogin: NewAdminLoginPage;
};

export const test = base.extend<PageObjectFixtures>({
  adminLogin: async ({ page }, use) => { await use(new AdminLoginPage(page)); },
  customerLogin: async ({ page }, use) => { await use(new CustomerLoginPage(page)); },
  businessLogin: async ({ page }, use) => { await use(new BusinessLoginPage(page)); },
  newAdminLogin: async ({ page }, use) => { await use(new NewAdminLoginPage(page)); },
});

export { expect } from '@playwright/test';
```

- [ ] **Step 2: Commit**

```bash
git add fixtures/base.fixture.ts
git commit -m "feat: add base Playwright fixture exposing POMs"
```

---

## Task 15: Sample smoke specs (admin + customer)

**Files:**
- Create: `tests/admin/login.spec.ts`
- Create: `tests/customer/login.spec.ts`

- [ ] **Step 1: Admin login smoke spec**

Create `tests/admin/login.spec.ts`:
```typescript
import { test, expect } from '../../fixtures/base.fixture';

test.describe('admin @smoke', () => {
  test('lands on dashboard after storageState is loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/dashboard|home/i, { timeout: 15_000 });
  });

  test('header shows authenticated user menu', async ({ page }) => {
    await page.goto('/');
    const userMenu = page.getByRole('button', { name: /profile|account|logout/i });
    await expect(userMenu.first()).toBeVisible();
  });
});
```

- [ ] **Step 2: Customer login smoke spec**

Create `tests/customer/login.spec.ts`:
```typescript
import { test, expect } from '../../fixtures/base.fixture';

test.describe('customer @smoke', () => {
  test('lands on account/home after storageState is loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/dashboard|home|account/i, { timeout: 15_000 });
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add tests/admin/login.spec.ts tests/customer/login.spec.ts
git commit -m "test: add smoke specs for admin + customer panels"
```

---

## Task 16: Sample smoke specs (business + new-admin)

**Files:**
- Create: `tests/business/login.spec.ts`
- Create: `tests/new-admin/login.spec.ts`

- [ ] **Step 1: Business spec**

Create `tests/business/login.spec.ts`:
```typescript
import { test, expect } from '../../fixtures/base.fixture';

test.describe('business @smoke', () => {
  test('lands on dashboard after storageState is loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/dashboard|home/i, { timeout: 15_000 });
  });
});
```

- [ ] **Step 2: New-admin spec**

Create `tests/new-admin/login.spec.ts`:
```typescript
import { test, expect } from '../../fixtures/base.fixture';

test.describe('new-admin @smoke', () => {
  test('lands on dashboard after storageState is loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/dashboard|home/i, { timeout: 15_000 });
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add tests/business/login.spec.ts tests/new-admin/login.spec.ts
git commit -m "test: add smoke specs for business + new-admin panels"
```

---

## Task 17: Run types for API layer

**Files:**
- Create: `src/api/types/run.types.ts`

- [ ] **Step 1: Define types**

Create `src/api/types/run.types.ts`:
```typescript
export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'error' | 'cancelled';

export type Panel = 'admin' | 'customer' | 'business' | 'new-admin';

export interface RunRequest {
  projects?: Panel[];
  grep?: string;
  grepInvert?: string;
  specFiles?: string[];
  env?: 'dev' | 'staging' | 'production';
  workers?: number;
  retries?: number;
  headed?: boolean;
}

export interface RunRecord {
  id: string;
  status: RunStatus;
  request: RunRequest;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  stdoutTail?: string;
  stderrTail?: string;
  artifactDir: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/types/run.types.ts
git commit -m "feat(api): add RunRequest/RunRecord types"
```

---

## Task 18: Zod request schema for API

**Files:**
- Create: `src/api/schemas/run-request.schema.ts`
- Test: `test/api/run-request.schema.test.ts`

- [ ] **Step 1: Write failing test**

Create `test/api/run-request.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { RunRequestSchema } from '../../src/api/schemas/run-request.schema';

describe('RunRequestSchema', () => {
  it('accepts empty body with defaults', () => {
    const parsed = RunRequestSchema.parse({});
    expect(parsed.workers).toBeUndefined();
  });

  it('accepts valid projects list', () => {
    const parsed = RunRequestSchema.parse({ projects: ['admin', 'customer'] });
    expect(parsed.projects).toEqual(['admin', 'customer']);
  });

  it('rejects unknown project name', () => {
    expect(() => RunRequestSchema.parse({ projects: ['hacker'] })).toThrow();
  });

  it('rejects negative workers', () => {
    expect(() => RunRequestSchema.parse({ workers: -1 })).toThrow();
  });

  it('rejects non-string grep', () => {
    expect(() => RunRequestSchema.parse({ grep: 123 })).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- test/api/run-request.schema.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement schema**

Create `src/api/schemas/run-request.schema.ts`:
```typescript
import { z } from 'zod';

export const RunRequestSchema = z.object({
  projects: z.array(z.enum(['admin', 'customer', 'business', 'new-admin'])).optional(),
  grep: z.string().min(1).max(200).optional(),
  grepInvert: z.string().min(1).max(200).optional(),
  specFiles: z.array(z.string().min(1).max(500)).max(50).optional(),
  env: z.enum(['dev', 'staging', 'production']).optional(),
  workers: z.number().int().min(1).max(16).optional(),
  retries: z.number().int().min(0).max(5).optional(),
  headed: z.boolean().optional(),
}).strict();

export type ValidatedRunRequest = z.infer<typeof RunRequestSchema>;
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:unit -- test/api/run-request.schema.test.ts`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/schemas/run-request.schema.ts test/api/run-request.schema.test.ts
git commit -m "feat(api): add zod schema for POST /api/runs body"
```

---

## Task 19: Auth middleware

**Files:**
- Create: `src/api/middleware/auth.middleware.ts`
- Test: `test/api/auth.middleware.test.ts`

- [ ] **Step 1: Write failing test**

Create `test/api/auth.middleware.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { createAuthMiddleware } from '../../src/api/middleware/auth.middleware';
import type { Request, Response, NextFunction } from 'express';

const mkReq = (headers: Record<string, string> = {}) => ({ headers } as unknown as Request);
const mkRes = () => {
  const res = { statusCode: 200, body: undefined as unknown } as unknown as Response & { body: unknown };
  (res as any).status = (c: number) => { (res as any).statusCode = c; return res; };
  (res as any).json = (b: unknown) => { (res as any).body = b; return res; };
  return res as Response & { body: unknown };
};

describe('authMiddleware', () => {
  it('passes through with correct key', () => {
    const mw = createAuthMiddleware('secret');
    const next = vi.fn();
    mw(mkReq({ 'x-api-key': 'secret' }), mkRes(), next as NextFunction);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects missing key', () => {
    const mw = createAuthMiddleware('secret');
    const res = mkRes();
    const next = vi.fn();
    mw(mkReq(), res, next as NextFunction);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('rejects wrong key', () => {
    const mw = createAuthMiddleware('secret');
    const res = mkRes();
    const next = vi.fn();
    mw(mkReq({ 'x-api-key': 'other' }), res, next as NextFunction);
    expect(res.statusCode).toBe(401);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- test/api/auth.middleware.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement middleware**

Create `src/api/middleware/auth.middleware.ts`:
```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';

export function createAuthMiddleware(expectedKey: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const provided = req.headers['x-api-key'];
    if (typeof provided !== 'string' || provided !== expectedKey) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:unit -- test/api/auth.middleware.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/middleware/auth.middleware.ts test/api/auth.middleware.test.ts
git commit -m "feat(api): add X-API-Key auth middleware"
```

---

## Task 20: Error middleware

**Files:**
- Create: `src/api/middleware/error.middleware.ts`

- [ ] **Step 1: Implement error handler**

Create `src/api/middleware/error.middleware.ts`:
```typescript
import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../../utils/logger/logger';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'validation_failed', issues: err.issues });
    return;
  }
  logger.error('unhandled error', { path: req.path, message: (err as Error).message });
  res.status(500).json({ error: 'internal_server_error' });
};
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/middleware/error.middleware.ts
git commit -m "feat(api): add error middleware handling Zod + generic errors"
```

---

## Task 21: Run manager service

**Files:**
- Create: `src/api/services/run-manager.service.ts`
- Test: `test/api/run-manager.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `test/api/run-manager.service.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { RunManager } from '../../src/api/services/run-manager.service';

describe('RunManager', () => {
  let mgr: RunManager;
  beforeEach(() => { mgr = new RunManager({ maxConcurrent: 2 }); });

  it('creates a run with unique id and queued status', () => {
    const r = mgr.create({ projects: ['admin'] });
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.status).toBe('queued');
    expect(r.artifactDir.endsWith(r.id)).toBe(true);
  });

  it('gets run by id', () => {
    const r = mgr.create({});
    expect(mgr.get(r.id)?.id).toBe(r.id);
    expect(mgr.get('nope')).toBeUndefined();
  });

  it('updates status and finishedAt', () => {
    const r = mgr.create({});
    mgr.updateStatus(r.id, 'running');
    expect(mgr.get(r.id)?.status).toBe('running');
    mgr.markFinished(r.id, 0);
    expect(mgr.get(r.id)?.status).toBe('passed');
    expect(mgr.get(r.id)?.finishedAt).toBeDefined();
    expect(mgr.get(r.id)?.exitCode).toBe(0);
  });

  it('exit code !=0 maps to failed', () => {
    const r = mgr.create({});
    mgr.markFinished(r.id, 1);
    expect(mgr.get(r.id)?.status).toBe('failed');
  });

  it('enforces maxConcurrent', () => {
    mgr.create({}); mgr.updateStatus(mgr.create({}).id, 'running');
    mgr.updateStatus(mgr.create({}).id, 'running');
    expect(mgr.runningCount()).toBe(2);
    expect(mgr.canStartAnother()).toBe(false);
  });

  it('lists runs newest-first', () => {
    const a = mgr.create({});
    const b = mgr.create({});
    const list = mgr.list();
    expect(list[0].id).toBe(b.id);
    expect(list[1].id).toBe(a.id);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- test/api/run-manager.service.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement RunManager**

Create `src/api/services/run-manager.service.ts`:
```typescript
import { randomUUID } from 'crypto';
import * as path from 'path';
import type { RunRecord, RunRequest, RunStatus } from '../types/run.types';

export interface RunManagerOptions {
  maxConcurrent?: number;
  reportsRoot?: string;
}

export class RunManager {
  private runs = new Map<string, RunRecord>();
  private readonly maxConcurrent: number;
  private readonly reportsRoot: string;

  constructor(opts: RunManagerOptions = {}) {
    this.maxConcurrent = opts.maxConcurrent ?? 2;
    this.reportsRoot = opts.reportsRoot ?? path.resolve('reports', 'runs');
  }

  create(request: RunRequest): RunRecord {
    const id = randomUUID();
    const record: RunRecord = {
      id,
      status: 'queued',
      request,
      startedAt: new Date().toISOString(),
      artifactDir: path.join(this.reportsRoot, id),
    };
    this.runs.set(id, record);
    return record;
  }

  get(id: string): RunRecord | undefined {
    return this.runs.get(id);
  }

  list(): RunRecord[] {
    return Array.from(this.runs.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  updateStatus(id: string, status: RunStatus): void {
    const r = this.runs.get(id);
    if (r) r.status = status;
  }

  appendStdoutTail(id: string, chunk: string): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.stdoutTail = ((r.stdoutTail ?? '') + chunk).slice(-10_000);
  }

  appendStderrTail(id: string, chunk: string): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.stderrTail = ((r.stderrTail ?? '') + chunk).slice(-10_000);
  }

  markFinished(id: string, exitCode: number): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.exitCode = exitCode;
    r.finishedAt = new Date().toISOString();
    r.status = exitCode === 0 ? 'passed' : 'failed';
  }

  markError(id: string): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.finishedAt = new Date().toISOString();
    r.status = 'error';
  }

  runningCount(): number {
    return Array.from(this.runs.values()).filter((r) => r.status === 'running').length;
  }

  canStartAnother(): boolean {
    return this.runningCount() < this.maxConcurrent;
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:unit -- test/api/run-manager.service.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/services/run-manager.service.ts test/api/run-manager.service.test.ts
git commit -m "feat(api): add RunManager with in-memory registry + concurrency cap"
```

---

## Task 22: Playwright executor service

**Files:**
- Create: `src/api/services/playwright-executor.service.ts`
- Test: `test/api/playwright-executor.service.test.ts`

- [ ] **Step 1: Write failing test**

Create `test/api/playwright-executor.service.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { buildPlaywrightArgs } from '../../src/api/services/playwright-executor.service';

describe('buildPlaywrightArgs', () => {
  it('uses test as default command', () => {
    expect(buildPlaywrightArgs({})).toEqual(['test']);
  });

  it('adds --project flags', () => {
    const args = buildPlaywrightArgs({ projects: ['admin', 'customer'] });
    expect(args).toContain('--project=admin');
    expect(args).toContain('--project=customer');
  });

  it('adds --grep and --grep-invert', () => {
    const args = buildPlaywrightArgs({ grep: '@smoke', grepInvert: '@flaky' });
    expect(args).toContain('--grep=@smoke');
    expect(args).toContain('--grep-invert=@flaky');
  });

  it('adds --workers and --retries', () => {
    const args = buildPlaywrightArgs({ workers: 4, retries: 2 });
    expect(args).toContain('--workers=4');
    expect(args).toContain('--retries=2');
  });

  it('adds spec file args at end', () => {
    const args = buildPlaywrightArgs({ specFiles: ['tests/admin/login.spec.ts'] });
    expect(args[args.length - 1]).toBe('tests/admin/login.spec.ts');
  });

  it('rejects spec files with path traversal', () => {
    expect(() => buildPlaywrightArgs({ specFiles: ['../../etc/passwd'] })).toThrow(/traversal/);
  });

  it('rejects spec files with absolute path', () => {
    expect(() => buildPlaywrightArgs({ specFiles: ['/etc/passwd'] })).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- test/api/playwright-executor.service.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement executor**

Create `src/api/services/playwright-executor.service.ts`:
```typescript
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { RunRequest } from '../types/run.types';
import type { RunManager } from './run-manager.service';
import { logger } from '../../../utils/logger/logger';

export function buildPlaywrightArgs(req: RunRequest): string[] {
  const args: string[] = ['test'];
  if (req.projects) {
    for (const p of req.projects) args.push(`--project=${p}`);
  }
  if (req.grep) args.push(`--grep=${req.grep}`);
  if (req.grepInvert) args.push(`--grep-invert=${req.grepInvert}`);
  if (typeof req.workers === 'number') args.push(`--workers=${req.workers}`);
  if (typeof req.retries === 'number') args.push(`--retries=${req.retries}`);
  if (req.headed) args.push('--headed');

  if (req.specFiles) {
    for (const f of req.specFiles) {
      if (f.includes('..')) throw new Error(`spec file path traversal not allowed: ${f}`);
      if (path.isAbsolute(f)) throw new Error(`spec file absolute path not allowed: ${f}`);
      args.push(f);
    }
  }
  return args;
}

export interface ExecuteOptions {
  runId: string;
  request: RunRequest;
  runManager: RunManager;
  artifactDir: string;
  cwd?: string;
  extraEnv?: NodeJS.ProcessEnv;
}

export async function executePlaywright(opts: ExecuteOptions): Promise<number> {
  fs.mkdirSync(opts.artifactDir, { recursive: true });
  const args = buildPlaywrightArgs(opts.request);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...opts.extraEnv,
    HEADLESS: opts.request.headed ? 'false' : 'true',
    ...(opts.request.env ? { ENV: opts.request.env } : {}),
    PLAYWRIGHT_HTML_REPORT: path.join(opts.artifactDir, 'html'),
    PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(opts.artifactDir, 'results.json'),
  };

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['playwright', ...args], {
      cwd: opts.cwd ?? process.cwd(),
      env,
    });
    const stdoutLog = fs.createWriteStream(path.join(opts.artifactDir, 'stdout.log'));
    const stderrLog = fs.createWriteStream(path.join(opts.artifactDir, 'stderr.log'));

    child.stdout.on('data', (chunk) => {
      stdoutLog.write(chunk);
      opts.runManager.appendStdoutTail(opts.runId, chunk.toString());
    });
    child.stderr.on('data', (chunk) => {
      stderrLog.write(chunk);
      opts.runManager.appendStderrTail(opts.runId, chunk.toString());
    });
    child.on('error', (err) => {
      logger.error('playwright spawn error', { runId: opts.runId, err: err.message });
      reject(err);
    });
    child.on('close', (code) => {
      stdoutLog.end();
      stderrLog.end();
      resolve(code ?? 1);
    });
  });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:unit -- test/api/playwright-executor.service.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/services/playwright-executor.service.ts test/api/playwright-executor.service.test.ts
git commit -m "feat(api): add playwright executor with arg builder + subprocess spawn"
```

---

## Task 23: Health route

**Files:**
- Create: `src/api/routes/health.routes.ts`
- Test: `test/api/health.routes.test.ts`

- [ ] **Step 1: Write failing test**

Create `test/api/health.routes.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { healthRouter } from '../../src/api/routes/health.routes';

describe('GET /health', () => {
  const app = express().use(healthRouter);

  it('returns 200 + ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- test/api/health.routes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement router**

Create `src/api/routes/health.routes.ts`:
```typescript
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:unit -- test/api/health.routes.test.ts`
Expected: Test PASSES.

- [ ] **Step 5: Commit**

```bash
git add src/api/routes/health.routes.ts test/api/health.routes.test.ts
git commit -m "feat(api): add /health route"
```

---

## Task 24: Runs routes (create + list + get + report)

**Files:**
- Create: `src/api/routes/runs.routes.ts`
- Test: `test/api/runs.routes.test.ts`

- [ ] **Step 1: Write failing test**

Create `test/api/runs.routes.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRunsRouter } from '../../src/api/routes/runs.routes';
import { RunManager } from '../../src/api/services/run-manager.service';
import { errorMiddleware } from '../../src/api/middleware/error.middleware';

const makeApp = (mgr: RunManager, exec: () => Promise<number>) => {
  const app = express();
  app.use(express.json());
  app.use('/api', createRunsRouter({ runManager: mgr, executePlaywright: exec }));
  app.use(errorMiddleware);
  return app;
};

describe('runs routes', () => {
  it('POST /api/runs creates a queued run and returns 202', async () => {
    const mgr = new RunManager();
    const exec = vi.fn().mockResolvedValue(0);
    const res = await request(makeApp(mgr, exec)).post('/api/runs').send({ projects: ['admin'] });
    expect(res.status).toBe(202);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('queued');
  });

  it('POST /api/runs rejects invalid project', async () => {
    const mgr = new RunManager();
    const exec = vi.fn();
    const res = await request(makeApp(mgr, exec)).post('/api/runs').send({ projects: ['hacker'] });
    expect(res.status).toBe(400);
  });

  it('GET /api/runs/:id returns 404 for unknown', async () => {
    const mgr = new RunManager();
    const res = await request(makeApp(mgr, vi.fn())).get('/api/runs/unknown');
    expect(res.status).toBe(404);
  });

  it('GET /api/runs/:id returns run for known id', async () => {
    const mgr = new RunManager();
    const created = mgr.create({});
    const res = await request(makeApp(mgr, vi.fn())).get(`/api/runs/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
  });

  it('GET /api/runs lists runs', async () => {
    const mgr = new RunManager();
    mgr.create({}); mgr.create({});
    const res = await request(makeApp(mgr, vi.fn())).get('/api/runs');
    expect(res.status).toBe(200);
    expect(res.body.runs.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- test/api/runs.routes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement router**

Create `src/api/routes/runs.routes.ts`:
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { RunRequestSchema } from '../schemas/run-request.schema';
import type { RunManager } from '../services/run-manager.service';
import type { ExecuteOptions } from '../services/playwright-executor.service';
import { logger } from '../../../utils/logger/logger';

type ExecuteFn = (opts: ExecuteOptions) => Promise<number>;

export interface RunsRouterDeps {
  runManager: RunManager;
  executePlaywright: ExecuteFn;
}

export function createRunsRouter(deps: RunsRouterDeps): Router {
  const router = Router();
  const { runManager, executePlaywright } = deps;

  router.post('/runs', (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = RunRequestSchema.parse(req.body ?? {});
      if (!runManager.canStartAnother()) {
        res.status(429).json({ error: 'concurrency_limit_reached' });
        return;
      }
      const record = runManager.create(parsed);

      setImmediate(async () => {
        runManager.updateStatus(record.id, 'running');
        try {
          const exitCode = await executePlaywright({
            runId: record.id,
            request: parsed,
            runManager,
            artifactDir: record.artifactDir,
          });
          runManager.markFinished(record.id, exitCode);
          logger.info('run finished', { runId: record.id, exitCode });
        } catch (err) {
          runManager.markError(record.id);
          logger.error('run errored', { runId: record.id, err: (err as Error).message });
        }
      });

      res.status(202).json(record);
    } catch (err) { next(err); }
  });

  router.get('/runs', (_req, res) => {
    res.json({ runs: runManager.list() });
  });

  router.get('/runs/:id', (req, res) => {
    const r = runManager.get(req.params.id);
    if (!r) { res.status(404).json({ error: 'not_found' }); return; }
    res.json(r);
  });

  router.get('/runs/:id/report', (req, res) => {
    const r = runManager.get(req.params.id);
    if (!r) { res.status(404).json({ error: 'not_found' }); return; }
    const reportIndex = path.join(r.artifactDir, 'html', 'index.html');
    if (!fs.existsSync(reportIndex)) {
      res.status(404).json({ error: 'report_not_ready', runStatus: r.status });
      return;
    }
    res.sendFile(path.resolve(reportIndex));
  });

  router.get('/runs/:id/logs', (req, res) => {
    const r = runManager.get(req.params.id);
    if (!r) { res.status(404).json({ error: 'not_found' }); return; }
    res.json({
      stdoutTail: r.stdoutTail ?? '',
      stderrTail: r.stderrTail ?? '',
    });
  });

  return router;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:unit -- test/api/runs.routes.test.ts`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/routes/runs.routes.ts test/api/runs.routes.test.ts
git commit -m "feat(api): add runs routes (create/list/get/report/logs)"
```

---

## Task 25: Server wiring

**Files:**
- Create: `src/api/server.ts`
- Create: `src/api/index.ts`

- [ ] **Step 1: Create server factory**

Create `src/api/server.ts`:
```typescript
import express, { Express } from 'express';
import { createAuthMiddleware } from './middleware/auth.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { healthRouter } from './routes/health.routes';
import { createRunsRouter } from './routes/runs.routes';
import { RunManager } from './services/run-manager.service';
import { executePlaywright } from './services/playwright-executor.service';

export interface ServerConfig {
  apiKey: string;
  maxConcurrentRuns?: number;
}

export function createServer(config: ServerConfig): { app: Express; runManager: RunManager } {
  const app = express();
  const runManager = new RunManager({ maxConcurrent: config.maxConcurrentRuns ?? 2 });

  app.use(express.json({ limit: '256kb' }));
  app.use(healthRouter);
  app.use('/api', createAuthMiddleware(config.apiKey));
  app.use('/api', createRunsRouter({ runManager, executePlaywright }));
  app.use(errorMiddleware);

  return { app, runManager };
}
```

- [ ] **Step 2: Create entry point**

Create `src/api/index.ts`:
```typescript
import { env } from '../../config/env';
import { createServer } from './server';
import { logger } from '../../utils/logger/logger';

const { app } = createServer({ apiKey: env.API_KEY, maxConcurrentRuns: 2 });

const server = app.listen(env.API_PORT, () => {
  logger.info('api listening', { port: env.API_PORT, env: env.ENV });
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    logger.info('shutting down', { signal: sig });
    server.close(() => process.exit(0));
  });
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 4: Smoke test — start server locally**

Run (in one terminal):
```bash
cp .env.example .env
# Fill in API_KEY=localtest at minimum; placeholder credentials are fine for server boot
npm run api:dev
```

In another terminal:
```bash
curl http://localhost:3000/health
# Expect: {"status":"ok","uptime":...}
curl -X POST http://localhost:3000/api/runs \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: localtest' \
  -d '{"projects":["admin"],"grep":"@smoke"}'
# Expect: 202 with {"id":"...","status":"queued",...}
```

Stop the server with Ctrl-C.

- [ ] **Step 5: Commit**

```bash
git add src/api/server.ts src/api/index.ts
git commit -m "feat(api): wire express server with all routes + middleware"
```

---

## Task 26: Dockerfile

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Create .dockerignore**

```
node_modules
dist
reports
storage
.env
.env.local
.git
.github
coverage
*.log
.DS_Store
docs
```

- [ ] **Step 2: Create multi-stage Dockerfile**

Create `Dockerfile`:
```dockerfile
# ---- Stage 1: build ----
FROM mcr.microsoft.com/playwright:v1.47.0-jammy AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM mcr.microsoft.com/playwright:v1.47.0-jammy
WORKDIR /app
ENV NODE_ENV=production
ENV HEADLESS=true
ENV CI=true

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY playwright.config.ts ./
COPY tsconfig.json ./
COPY config ./config
COPY pages ./pages
COPY fixtures ./fixtures
COPY setup ./setup
COPY tests ./tests
COPY utils ./utils
COPY src ./src

RUN mkdir -p storage reports

EXPOSE 3000
CMD ["node", "dist/src/api/index.js"]
```

- [ ] **Step 3: Build image**

Run:
```bash
docker build -t augmont-test-suite:dev .
```
Expected: Build succeeds. May take several minutes on first build.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "build: add multi-stage Dockerfile using Playwright base image"
```

---

## Task 27: docker-compose for local runs

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create compose file**

```yaml
services:
  test-suite:
    build: .
    image: augmont-test-suite:dev
    container_name: augmont-test-suite
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "3000:3000"
    volumes:
      - ./reports:/app/reports
      - ./storage:/app/storage
    ipc: host
```

- [ ] **Step 2: Smoke test — run with compose**

Run:
```bash
docker compose up -d
sleep 3
curl http://localhost:3000/health
docker compose logs --tail=50 test-suite
docker compose down
```
Expected: Health endpoint returns 200.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "build: add docker-compose for local API + report volumes"
```

---

## Task 28: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  unit:
    name: Unit tests + typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test:unit

  docker:
    name: Build Docker image
    runs-on: ubuntu-latest
    needs: unit
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -t augmont-test-suite:ci .

  regression:
    name: Playwright regression (manual)
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    needs: docker
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -t augmont-test-suite:ci .
      - name: Run regression
        env:
          BASE_URL_ADMIN: ${{ secrets.BASE_URL_ADMIN }}
          BASE_URL_CUSTOMER: ${{ secrets.BASE_URL_CUSTOMER }}
          BASE_URL_BUSINESS: ${{ secrets.BASE_URL_BUSINESS }}
          BASE_URL_NEW_ADMIN: ${{ secrets.BASE_URL_NEW_ADMIN }}
          ADMIN_USER_EMAIL: ${{ secrets.ADMIN_USER_EMAIL }}
          ADMIN_USER_PASSWORD: ${{ secrets.ADMIN_USER_PASSWORD }}
          CUSTOMER_USER_EMAIL: ${{ secrets.CUSTOMER_USER_EMAIL }}
          CUSTOMER_USER_PASSWORD: ${{ secrets.CUSTOMER_USER_PASSWORD }}
          BUSINESS_USER_EMAIL: ${{ secrets.BUSINESS_USER_EMAIL }}
          BUSINESS_USER_PASSWORD: ${{ secrets.BUSINESS_USER_PASSWORD }}
          NEW_ADMIN_USER_EMAIL: ${{ secrets.NEW_ADMIN_USER_EMAIL }}
          NEW_ADMIN_USER_PASSWORD: ${{ secrets.NEW_ADMIN_USER_PASSWORD }}
          API_KEY: regression-ci
        run: |
          docker run --rm \
            -e BASE_URL_ADMIN -e BASE_URL_CUSTOMER -e BASE_URL_BUSINESS -e BASE_URL_NEW_ADMIN \
            -e ADMIN_USER_EMAIL -e ADMIN_USER_PASSWORD \
            -e CUSTOMER_USER_EMAIL -e CUSTOMER_USER_PASSWORD \
            -e BUSINESS_USER_EMAIL -e BUSINESS_USER_PASSWORD \
            -e NEW_ADMIN_USER_EMAIL -e NEW_ADMIN_USER_PASSWORD \
            -e API_KEY -e HEADLESS=true -e CI=true \
            -v ${{ github.workspace }}/reports:/app/reports \
            augmont-test-suite:ci \
            npx playwright test
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: reports/
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow (unit + docker + manual regression)"
```

---

## Task 29: README with usage + EC2 deployment

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:
````markdown
# Augmont Test Suite

Playwright + TypeScript end-to-end tests for Augmont's four panels (admin, customer, business, new-admin), with a REST API to trigger runs remotely. Ships as a single Docker image for EC2 deployment.

## Local setup

```bash
npm ci
cp .env.example .env     # fill in URLs, credentials, API_KEY
npx playwright install --with-deps chromium
npm run test:unit        # unit tests for API/utilities
npm test                 # full Playwright run
npm run test:smoke       # only @smoke-tagged tests
npm run test:admin       # only admin panel
```

## API server (local)

```bash
npm run api:dev          # starts on :3000 with hot reload
curl http://localhost:3000/health
```

## Docker (local)

```bash
docker compose up -d
docker compose logs -f test-suite
docker compose down
```

## API reference

All `/api/*` requests require header `X-API-Key: <API_KEY>`.

### POST /api/runs — trigger a run

Request body (all fields optional):

| Field        | Type       | Description                                        |
|--------------|------------|----------------------------------------------------|
| `projects`   | string[]   | Subset of `admin`, `customer`, `business`, `new-admin` |
| `grep`       | string     | Tag/pattern, e.g. `@smoke`                         |
| `grepInvert` | string     | Exclusion pattern                                  |
| `specFiles`  | string[]   | Relative paths, e.g. `tests/admin/login.spec.ts`   |
| `env`        | string     | `dev` \| `staging` \| `production`                |
| `workers`    | integer    | 1–16                                               |
| `retries`    | integer    | 0–5                                                |
| `headed`     | boolean    | Default false (server = headless)                  |

Example:
```bash
curl -X POST http://<host>:3000/api/runs \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: <key>' \
  -d '{"projects":["admin","customer"],"grep":"@smoke","workers":2}'
```

Responses:
- `202` → run accepted, body is `RunRecord` with `id` and `status: "queued"`
- `400` → validation failure (zod issue list)
- `401` → missing/invalid API key
- `429` → concurrency limit reached

### GET /api/runs

Returns all runs newest-first.

### GET /api/runs/:id

Returns single `RunRecord` with current status, exit code, stdout/stderr tails.

### GET /api/runs/:id/logs

Returns `{ stdoutTail, stderrTail }` (last ~10KB each).

### GET /api/runs/:id/report

Returns the Playwright HTML report for that run (only once run has finished writing to disk).

## EC2 deployment

**Prereqs:** Amazon Linux 2023 or Ubuntu 22.04 EC2 instance, Docker installed, security group opens inbound TCP 3000 to the trusted CIDR only.

1. Clone the repo (or copy the image from ECR):
   ```bash
   git clone <repo-url> /opt/augmont-test-suite
   cd /opt/augmont-test-suite
   ```
2. Create the env file with real values:
   ```bash
   cp .env.example .env
   vi .env           # fill every field; set a strong API_KEY
   chmod 600 .env
   ```
3. Build and start:
   ```bash
   sudo docker compose up -d --build
   sudo docker compose logs -f test-suite
   ```
4. Verify health from your workstation:
   ```bash
   curl http://<ec2-public-ip>:3000/health
   ```
5. Trigger a smoke run:
   ```bash
   curl -X POST http://<ec2-public-ip>:3000/api/runs \
     -H 'Content-Type: application/json' \
     -H "X-API-Key: $API_KEY" \
     -d '{"grep":"@smoke"}'
   ```
6. Restart policy (`unless-stopped`) keeps the API up across reboots.

**Security notes:**
- Do not expose port 3000 publicly without a reverse proxy + TLS. Prefer placing it behind an internal ALB or restricting the SG to the bastion/office CIDR.
- Rotate `API_KEY` periodically; the server only supports one active key. If you need multi-tenant access, upgrade auth before exposing publicly.
- Reports may contain screenshots with sensitive UI data; treat the `reports/` volume as sensitive.

## Test conventions

- Tags: `@smoke`, `@regression`, `@admin`, `@customer`, `@business`, `@new-admin`.
- File naming: `<feature>.spec.ts` under `tests/<panel>/`.
- Page Objects: `pages/<panel>/<feature>.page.ts`, extend `BasePage`, no assertions inside.
- Fixtures: extend `fixtures/base.fixture.ts`; add new POMs there.
- Auth: per-panel storage state auto-loaded via `playwright.config.ts`. Setup script runs as `auth-setup` project and is a dependency of every panel project.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with API reference and EC2 deployment guide"
```

---

## Task 30: End-to-end smoke verification

**Files:** None created; this is a verification task.

- [ ] **Step 1: Build the image from scratch**

Run:
```bash
docker build -t augmont-test-suite:verify .
```
Expected: Build succeeds.

- [ ] **Step 2: Run the API container**

Run:
```bash
docker run -d --name aug-verify -p 3000:3000 \
  --env-file .env \
  -v "$(pwd)/reports:/app/reports" \
  augmont-test-suite:verify
sleep 5
curl -sS http://localhost:3000/health
```
Expected: `{"status":"ok",...}`.

- [ ] **Step 3: Trigger a run and poll status**

Run:
```bash
RUN_ID=$(curl -sS -X POST http://localhost:3000/api/runs \
  -H 'Content-Type: application/json' \
  -H "X-API-Key: $API_KEY" \
  -d '{"grep":"@smoke","projects":["admin"]}' | jq -r .id)
echo "runId=$RUN_ID"

for _ in $(seq 1 30); do
  STATUS=$(curl -sS -H "X-API-Key: $API_KEY" http://localhost:3000/api/runs/$RUN_ID | jq -r .status)
  echo "status=$STATUS"
  [ "$STATUS" = "passed" ] || [ "$STATUS" = "failed" ] || [ "$STATUS" = "error" ] && break
  sleep 5
done
```
Expected: status transitions queued → running → passed (assuming real credentials + reachable URLs). If the env points at unreachable apps, status will be `failed` — that's fine, it proves the pipeline works.

- [ ] **Step 4: Fetch the report**

Run:
```bash
curl -sS -H "X-API-Key: $API_KEY" http://localhost:3000/api/runs/$RUN_ID/report -o /tmp/report.html
ls -l /tmp/report.html
```
Expected: HTML file exists and is non-empty.

- [ ] **Step 5: Cleanup**

Run:
```bash
docker rm -f aug-verify
```

- [ ] **Step 6: Commit verification (no code changes)**

If nothing changed, skip. Otherwise:
```bash
git status
git commit -am "chore: verify end-to-end docker smoke"
```

---

## Phase 2 — Backend API Testing

Tasks 31–36 add a second test surface: **HTTP API tests** against the three Augmont backends (`gold-loan-backend-two`, `emi-backend`, `LGD-backend`). These run alongside UI tests in the same Playwright harness, use Playwright's built-in `request` fixture (no browser), and are selectable via the runner API as `api-backend`, `api-emi`, `api-lgd`.

**Design notes:**
- API tests live under `tests/api/<service>/` and are independent of the auth-setup project (they don't use `storageState`). Auth is handled per-fixture by calling each backend's login endpoint and caching the bearer token in memory per worker.
- The `Panel` type is renamed to `ProjectId` in T31 — a union of UI panels and API services. All downstream types/schemas update accordingly.
- API tests are faster and less flaky than UI tests, so they're a good candidate for the `@smoke` layer run on every deploy.

---

## Task 31: Extend env + constants for backend services

**Files:**
- Modify: `.env.example`
- Modify: `config/env.ts`
- Modify: `config/constants.ts`
- Modify: `config/urls.ts`
- Modify: `test/config/env.test.ts`
- Modify: `src/api/types/run.types.ts`
- Modify: `src/api/schemas/run-request.schema.ts`
- Modify: `test/api/run-request.schema.test.ts`

- [ ] **Step 1: Extend .env.example**

Append to `.env.example`:
```
# Backend API base URLs
BASE_URL_BACKEND=http://localhost:3001
BASE_URL_EMI=http://localhost:3002
BASE_URL_LGD=http://localhost:3003

# Backend API credentials (used by api test auth fixtures)
BACKEND_USER_EMAIL=
BACKEND_USER_PASSWORD=
EMI_USER_EMAIL=
EMI_USER_PASSWORD=
LGD_USER_EMAIL=
LGD_USER_PASSWORD=
```

- [ ] **Step 2: Extend env schema in config/env.ts**

Inside the `envSchema = z.object({ ... })` call in `config/env.ts`, add these fields (alongside the existing `BASE_URL_*` block):
```typescript
  BASE_URL_BACKEND: z.string().url(),
  BASE_URL_EMI: z.string().url(),
  BASE_URL_LGD: z.string().url(),

  BACKEND_USER_EMAIL: z.string().min(1),
  BACKEND_USER_PASSWORD: z.string().min(1),
  EMI_USER_EMAIL: z.string().min(1),
  EMI_USER_PASSWORD: z.string().min(1),
  LGD_USER_EMAIL: z.string().min(1),
  LGD_USER_PASSWORD: z.string().min(1),
```

- [ ] **Step 3: Update env.test.ts valid fixture**

Edit `test/config/env.test.ts` — extend the `valid` object to include the new keys:
```typescript
  const valid = {
    BASE_URL_ADMIN: 'http://a', BASE_URL_CUSTOMER: 'http://c',
    BASE_URL_BUSINESS: 'http://b', BASE_URL_NEW_ADMIN: 'http://n',
    BASE_URL_BACKEND: 'http://back', BASE_URL_EMI: 'http://emi', BASE_URL_LGD: 'http://lgd',
    ADMIN_USER_EMAIL: 'a@x', ADMIN_USER_PASSWORD: 'p',
    CUSTOMER_USER_EMAIL: 'c@x', CUSTOMER_USER_PASSWORD: 'p',
    BUSINESS_USER_EMAIL: 'b@x', BUSINESS_USER_PASSWORD: 'p',
    NEW_ADMIN_USER_EMAIL: 'n@x', NEW_ADMIN_USER_PASSWORD: 'p',
    BACKEND_USER_EMAIL: 'bk@x', BACKEND_USER_PASSWORD: 'p',
    EMI_USER_EMAIL: 'em@x', EMI_USER_PASSWORD: 'p',
    LGD_USER_EMAIL: 'lg@x', LGD_USER_PASSWORD: 'p',
    ENV: 'dev', HEADLESS: 'true',
    API_PORT: '3000', API_KEY: 'secret', LOG_LEVEL: 'info',
  };
```

- [ ] **Step 4: Replace config/constants.ts**

Overwrite `config/constants.ts`:
```typescript
export const PANELS = ['admin', 'customer', 'business', 'new-admin'] as const;
export type Panel = typeof PANELS[number];

export const API_SERVICES = ['api-backend', 'api-emi', 'api-lgd'] as const;
export type ApiService = typeof API_SERVICES[number];

export type ProjectId = Panel | ApiService;
export const ALL_PROJECTS: readonly ProjectId[] = [...PANELS, ...API_SERVICES];

export const STORAGE_STATE_PATH: Record<Panel, string> = {
  admin: 'storage/admin.json',
  customer: 'storage/customer.json',
  business: 'storage/business.json',
  'new-admin': 'storage/new-admin.json',
};

export const DEFAULT_TIMEOUTS = {
  action: 15_000,
  navigation: 30_000,
  test: 60_000,
} as const;
```

- [ ] **Step 5: Extend config/urls.ts**

Overwrite `config/urls.ts`:
```typescript
import { env } from './env';
import type { Panel, ApiService } from './constants';

export const PANEL_URLS: Record<Panel, string> = {
  admin: env.BASE_URL_ADMIN,
  customer: env.BASE_URL_CUSTOMER,
  business: env.BASE_URL_BUSINESS,
  'new-admin': env.BASE_URL_NEW_ADMIN,
};

export const PANEL_CREDENTIALS: Record<Panel, { email: string; password: string }> = {
  admin: { email: env.ADMIN_USER_EMAIL, password: env.ADMIN_USER_PASSWORD },
  customer: { email: env.CUSTOMER_USER_EMAIL, password: env.CUSTOMER_USER_PASSWORD },
  business: { email: env.BUSINESS_USER_EMAIL, password: env.BUSINESS_USER_PASSWORD },
  'new-admin': { email: env.NEW_ADMIN_USER_EMAIL, password: env.NEW_ADMIN_USER_PASSWORD },
};

export const API_SERVICE_URLS: Record<ApiService, string> = {
  'api-backend': env.BASE_URL_BACKEND,
  'api-emi': env.BASE_URL_EMI,
  'api-lgd': env.BASE_URL_LGD,
};

export interface ApiServiceAuthConfig {
  loginPath: string;
  email: string;
  password: string;
  tokenJsonPath: string;
}

export const API_SERVICE_AUTH: Record<ApiService, ApiServiceAuthConfig> = {
  'api-backend': {
    loginPath: '/api/v1/auth/login',
    email: env.BACKEND_USER_EMAIL,
    password: env.BACKEND_USER_PASSWORD,
    tokenJsonPath: 'data.token',
  },
  'api-emi': {
    loginPath: '/api/v1/auth/login',
    email: env.EMI_USER_EMAIL,
    password: env.EMI_USER_PASSWORD,
    tokenJsonPath: 'data.token',
  },
  'api-lgd': {
    loginPath: '/api/v1/auth/login',
    email: env.LGD_USER_EMAIL,
    password: env.LGD_USER_PASSWORD,
    tokenJsonPath: 'data.token',
  },
};
```

> **NOTE:** `loginPath` and `tokenJsonPath` default to patterns common in the Augmont Node backends. Adjust if a service uses a different login endpoint or response shape. `tokenJsonPath` is a dotted path (`data.token` means `response.data.token`).

- [ ] **Step 6: Update src/api/types/run.types.ts**

Replace the `Panel` type and `RunRequest` declaration:
```typescript
export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'error' | 'cancelled';

export type UiPanel = 'admin' | 'customer' | 'business' | 'new-admin';
export type ApiService = 'api-backend' | 'api-emi' | 'api-lgd';
export type ProjectId = UiPanel | ApiService;

export interface RunRequest {
  projects?: ProjectId[];
  grep?: string;
  grepInvert?: string;
  specFiles?: string[];
  env?: 'dev' | 'staging' | 'production';
  workers?: number;
  retries?: number;
  headed?: boolean;
}

export interface RunRecord {
  id: string;
  status: RunStatus;
  request: RunRequest;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  stdoutTail?: string;
  stderrTail?: string;
  artifactDir: string;
}
```

- [ ] **Step 7: Update src/api/schemas/run-request.schema.ts**

Replace the projects enum:
```typescript
import { z } from 'zod';

export const RunRequestSchema = z.object({
  projects: z.array(z.enum([
    'admin', 'customer', 'business', 'new-admin',
    'api-backend', 'api-emi', 'api-lgd',
  ])).optional(),
  grep: z.string().min(1).max(200).optional(),
  grepInvert: z.string().min(1).max(200).optional(),
  specFiles: z.array(z.string().min(1).max(500)).max(50).optional(),
  env: z.enum(['dev', 'staging', 'production']).optional(),
  workers: z.number().int().min(1).max(16).optional(),
  retries: z.number().int().min(0).max(5).optional(),
  headed: z.boolean().optional(),
}).strict();

export type ValidatedRunRequest = z.infer<typeof RunRequestSchema>;
```

- [ ] **Step 8: Add schema tests for new project values**

Edit `test/api/run-request.schema.test.ts` — append these two test cases inside the existing `describe` block:
```typescript
  it('accepts api service projects', () => {
    const parsed = RunRequestSchema.parse({ projects: ['api-backend', 'api-emi', 'api-lgd'] });
    expect(parsed.projects).toEqual(['api-backend', 'api-emi', 'api-lgd']);
  });

  it('accepts mix of ui and api projects', () => {
    const parsed = RunRequestSchema.parse({ projects: ['admin', 'api-backend'] });
    expect(parsed.projects).toHaveLength(2);
  });
```

- [ ] **Step 9: Run tests**

Run:
```bash
npm run test:unit -- test/config/env.test.ts test/api/run-request.schema.test.ts
npm run typecheck
```
Expected: All tests PASS. Typecheck clean.

- [ ] **Step 10: Commit**

```bash
git add .env.example config/env.ts config/constants.ts config/urls.ts \
        src/api/types/run.types.ts src/api/schemas/run-request.schema.ts \
        test/config/env.test.ts test/api/run-request.schema.test.ts
git commit -m "feat: extend types/config for backend API test projects"
```

---

## Task 32: API auth service (token acquisition + cache)

**Files:**
- Create: `utils/api/api-auth.ts`
- Test: `test/utils/api-auth.test.ts`

- [ ] **Step 1: Write failing test**

Create `test/utils/api-auth.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { extractToken, TokenCache } from '../../utils/api/api-auth';

describe('extractToken', () => {
  it('reads top-level field', () => {
    expect(extractToken({ token: 'abc' }, 'token')).toBe('abc');
  });

  it('reads dotted path', () => {
    expect(extractToken({ data: { token: 'abc' } }, 'data.token')).toBe('abc');
  });

  it('throws on missing path', () => {
    expect(() => extractToken({ data: {} }, 'data.token')).toThrow(/token not found/i);
  });

  it('throws on non-string value', () => {
    expect(() => extractToken({ data: { token: 123 } }, 'data.token')).toThrow();
  });
});

describe('TokenCache', () => {
  it('returns cached token if still valid', async () => {
    const cache = new TokenCache();
    let calls = 0;
    const fetcher = async () => { calls++; return 'tkn'; };
    expect(await cache.get('k', fetcher, 60_000)).toBe('tkn');
    expect(await cache.get('k', fetcher, 60_000)).toBe('tkn');
    expect(calls).toBe(1);
  });

  it('refetches after ttl expiry', async () => {
    const cache = new TokenCache();
    let calls = 0;
    const fetcher = async () => { calls++; return `tkn-${calls}`; };
    expect(await cache.get('k', fetcher, 1)).toBe('tkn-1');
    await new Promise((r) => setTimeout(r, 10));
    expect(await cache.get('k', fetcher, 1)).toBe('tkn-2');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- test/utils/api-auth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement api-auth**

Create `utils/api/api-auth.ts`:
```typescript
import type { APIRequestContext } from '@playwright/test';

export function extractToken(body: unknown, dottedPath: string): string {
  const parts = dottedPath.split('.');
  let cur: unknown = body;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      throw new Error(`token not found at path '${dottedPath}'`);
    }
  }
  if (typeof cur !== 'string' || cur.length === 0) {
    throw new Error(`token at path '${dottedPath}' is not a non-empty string`);
  }
  return cur;
}

export class TokenCache {
  private store = new Map<string, { token: string; expiresAt: number }>();

  async get(key: string, fetcher: () => Promise<string>, ttlMs: number): Promise<string> {
    const now = Date.now();
    const hit = this.store.get(key);
    if (hit && hit.expiresAt > now) return hit.token;
    const token = await fetcher();
    this.store.set(key, { token, expiresAt: now + ttlMs });
    return token;
  }

  clear(): void {
    this.store.clear();
  }
}

export const globalTokenCache = new TokenCache();

export interface FetchTokenArgs {
  request: APIRequestContext;
  loginPath: string;
  email: string;
  password: string;
  tokenJsonPath: string;
}

export async function fetchBearerToken(args: FetchTokenArgs): Promise<string> {
  const res = await args.request.post(args.loginPath, {
    data: { email: args.email, password: args.password },
  });
  if (!res.ok()) {
    throw new Error(`login ${args.loginPath} failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return extractToken(body, args.tokenJsonPath);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:unit -- test/utils/api-auth.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add utils/api/api-auth.ts test/utils/api-auth.test.ts
git commit -m "feat: add api auth helper with token cache"
```

---

## Task 33: API test fixture

**Files:**
- Create: `fixtures/api.fixture.ts`

- [ ] **Step 1: Implement api fixture**

Create `fixtures/api.fixture.ts`:
```typescript
import { test as base, APIRequestContext, request as pwRequest } from '@playwright/test';
import { API_SERVICE_AUTH, API_SERVICE_URLS } from '../config/urls';
import type { ApiService } from '../config/constants';
import { fetchBearerToken, globalTokenCache } from '../utils/api/api-auth';

type ApiFixtures = {
  apiService: ApiService;
  authedRequest: APIRequestContext;
};

const FIVE_MINUTES = 5 * 60 * 1000;

function detectApiService(projectName: string | undefined): ApiService {
  if (projectName === 'api-backend' || projectName === 'api-emi' || projectName === 'api-lgd') return projectName;
  throw new Error(`api fixture used in non-api project: ${projectName ?? '<unknown>'}`);
}

export const apiTest = base.extend<ApiFixtures>({
  apiService: async ({}, use, testInfo) => {
    await use(detectApiService(testInfo.project.name));
  },
  authedRequest: async ({ apiService }, use) => {
    const baseURL = API_SERVICE_URLS[apiService];
    const auth = API_SERVICE_AUTH[apiService];
    const loginCtx = await pwRequest.newContext({ baseURL });
    const token = await globalTokenCache.get(
      `${apiService}:${auth.email}`,
      () => fetchBearerToken({
        request: loginCtx,
        loginPath: auth.loginPath,
        email: auth.email,
        password: auth.password,
        tokenJsonPath: auth.tokenJsonPath,
      }),
      FIVE_MINUTES,
    );
    await loginCtx.dispose();

    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add fixtures/api.fixture.ts
git commit -m "feat: add api test fixture with cached bearer auth"
```

---

## Task 34: Sample API specs (health + auth) per service

**Files:**
- Create: `tests/api/backend/health.spec.ts`
- Create: `tests/api/backend/auth.spec.ts`
- Create: `tests/api/emi/health.spec.ts`
- Create: `tests/api/lgd/health.spec.ts`

- [ ] **Step 1: Create tests/api directory**

Run:
```bash
mkdir -p tests/api/backend tests/api/emi tests/api/lgd
```

- [ ] **Step 2: Backend health spec (unauthenticated)**

Create `tests/api/backend/health.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('backend health @smoke @api', () => {
  test('GET / returns 2xx', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/v1/health returns ok', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toEqual(expect.objectContaining({ status: expect.any(String) }));
  });
});
```

- [ ] **Step 3: Backend auth spec (uses authed fixture)**

Create `tests/api/backend/auth.spec.ts`:
```typescript
import { apiTest as test, expect } from '../../../fixtures/api.fixture';

test.describe('backend auth @smoke @api', () => {
  test('authenticated /api/v1/me returns current user', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/v1/me');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('rejects missing bearer', async ({ request }) => {
    const res = await request.get('/api/v1/me');
    expect(res.status()).toBe(401);
  });
});
```

> **NOTE:** Replace `/api/v1/me` and `/api/v1/health` with real backend endpoints once confirmed. Search `gold-loan-backend-two/routes/` for `router.get('/health'` or equivalent.

- [ ] **Step 4: EMI health spec**

Create `tests/api/emi/health.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('emi health @smoke @api', () => {
  test('GET /api/v1/health returns ok', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.ok()).toBeTruthy();
  });
});
```

- [ ] **Step 5: LGD health spec**

Create `tests/api/lgd/health.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('lgd health @smoke @api', () => {
  test('GET /api/v1/health returns ok', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.ok()).toBeTruthy();
  });
});
```

- [ ] **Step 6: Commit**

```bash
git add tests/api
git commit -m "test: add sample api health + auth specs per backend service"
```

---

## Task 35: Extend playwright.config.ts with API projects

**Files:**
- Modify: `playwright.config.ts`

- [ ] **Step 1: Replace playwright.config.ts**

Overwrite `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE_PATH } from './config/constants';
import { PANEL_URLS, API_SERVICE_URLS } from './config/urls';

const isCI = !!process.env.CI;
const headless = process.env.HEADLESS !== 'false';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : (isCI ? 2 : undefined),
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],
  outputDir: 'reports/test-artifacts',
  use: {
    headless,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: './setup/global-setup.ts',
  projects: [
    {
      name: 'auth-setup',
      testMatch: /setup\/auth\.setup\.ts/,
    },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS.admin, storageState: STORAGE_STATE_PATH.admin },
      dependencies: ['auth-setup'],
      testMatch: /tests\/admin\/.*\.spec\.ts/,
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS.customer, storageState: STORAGE_STATE_PATH.customer },
      dependencies: ['auth-setup'],
      testMatch: /tests\/customer\/.*\.spec\.ts/,
    },
    {
      name: 'business',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS.business, storageState: STORAGE_STATE_PATH.business },
      dependencies: ['auth-setup'],
      testMatch: /tests\/business\/.*\.spec\.ts/,
    },
    {
      name: 'new-admin',
      use: { ...devices['Desktop Chrome'], baseURL: PANEL_URLS['new-admin'], storageState: STORAGE_STATE_PATH['new-admin'] },
      dependencies: ['auth-setup'],
      testMatch: /tests\/new-admin\/.*\.spec\.ts/,
    },
    {
      name: 'api-backend',
      use: { baseURL: API_SERVICE_URLS['api-backend'], extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/backend\/.*\.spec\.ts/,
    },
    {
      name: 'api-emi',
      use: { baseURL: API_SERVICE_URLS['api-emi'], extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/emi\/.*\.spec\.ts/,
    },
    {
      name: 'api-lgd',
      use: { baseURL: API_SERVICE_URLS['api-lgd'], extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/lgd\/.*\.spec\.ts/,
    },
  ],
});
```

- [ ] **Step 2: Add npm scripts for api projects**

Edit `package.json` `scripts` — insert after the panel-specific `test:*` entries:
```json
    "test:api": "playwright test --project=api-backend --project=api-emi --project=api-lgd",
    "test:api:backend": "playwright test --project=api-backend",
    "test:api:emi": "playwright test --project=api-emi",
    "test:api:lgd": "playwright test --project=api-lgd",
```

- [ ] **Step 3: Smoke test — list projects**

Run: `npx playwright test --list --project=api-backend`
Expected: Lists the two specs under `tests/api/backend/`. Lists no auth-setup (api projects have no dependency).

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts package.json
git commit -m "feat: register api-backend/api-emi/api-lgd playwright projects"
```

---

## Task 36: Update README + end-to-end verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Extend README**

Inside `README.md`, find the `## Test conventions` section and insert this section **before** it:

````markdown
## API testing

Backend HTTP tests live under `tests/api/<service>/` and run via dedicated Playwright projects:

- `api-backend` → `gold-loan-backend-two` (URL: `BASE_URL_BACKEND`)
- `api-emi` → `emi-backend` (URL: `BASE_URL_EMI`)
- `api-lgd` → `LGD-backend` (URL: `BASE_URL_LGD`)

These projects use Playwright's `request` fixture — no browser is launched, so they're fast and headless by nature. They do not depend on `auth-setup`; each auth-required test uses the `authedRequest` fixture from `fixtures/api.fixture.ts`, which calls the service's `/api/v1/auth/login`, caches the bearer token for 5 minutes per worker, and injects it as `Authorization: Bearer <token>`.

Commands:
```bash
npm run test:api                # all 3 services
npm run test:api:backend        # only gold-loan-backend-two
npm run test:api:emi
npm run test:api:lgd
```

Via the runner API — trigger a mixed UI + API smoke:
```bash
curl -X POST http://<host>:3000/api/runs \
  -H 'Content-Type: application/json' \
  -H "X-API-Key: $API_KEY" \
  -d '{"projects":["admin","api-backend"],"grep":"@smoke"}'
```

Writing a new API test:
```typescript
import { apiTest as test, expect } from '../../../fixtures/api.fixture';

test('creates a loan @regression @api', async ({ authedRequest }) => {
  const res = await authedRequest.post('/api/v1/loans', { data: { amount: 10_000 } });
  expect(res.ok()).toBeTruthy();
});
```
````

Also in the `### POST /api/runs — trigger a run` table, update the `projects` row description:
```
| `projects`   | string[]   | Subset of `admin`, `customer`, `business`, `new-admin`, `api-backend`, `api-emi`, `api-lgd` |
```

- [ ] **Step 2: Re-run end-to-end verification for API project**

Run:
```bash
docker compose up -d --build
sleep 5
RUN_ID=$(curl -sS -X POST http://localhost:3000/api/runs \
  -H 'Content-Type: application/json' \
  -H "X-API-Key: $API_KEY" \
  -d '{"projects":["api-backend"],"grep":"@smoke"}' | jq -r .id)
echo "runId=$RUN_ID"

for _ in $(seq 1 30); do
  STATUS=$(curl -sS -H "X-API-Key: $API_KEY" http://localhost:3000/api/runs/$RUN_ID | jq -r .status)
  echo "status=$STATUS"
  case "$STATUS" in passed|failed|error) break;; esac
  sleep 3
done
docker compose down
```
Expected: Run transitions queued → running → passed (assuming backend is reachable from the container — if running backend locally, Docker needs `host.docker.internal` URL, see note below). `failed` is acceptable if the backend URLs aren't reachable from the container; the point is proving the api project registers + executes.

> **NOTE:** On Linux EC2, localhost inside a container is not the host. Use the EC2 private IP or DNS in `BASE_URL_BACKEND` (e.g. `http://10.0.1.20:3001`). On macOS Docker Desktop, use `http://host.docker.internal:3001` to reach host services.

- [ ] **Step 3: Commit README**

```bash
git add README.md
git commit -m "docs: document API test suites + mixed ui/api run example"
```

---

## Phase 3 — Multi-environment support (test / uat / production)

Tasks 37–38 make every URL and credential environment-aware. The caller picks both **panel** (`projects` param) and **target environment** (`env` param) on each `POST /api/runs`. All three environments' URLs + credentials are loaded at server boot from a single `.env` file on the EC2 host; the runner passes `TARGET_ENV=<value>` to the Playwright subprocess, and Playwright's config selects the correct URL/credential/storage-state set for that run.

**Design notes:**
- Environments: `test`, `uat`, `production` (replaces earlier `dev`/`staging`/`production` placeholders).
- `.env` uses flat prefixed keys (`TEST_BASE_URL_ADMIN`, `UAT_BASE_URL_ADMIN`, …). No per-env .env files — single file, all envs loaded at once.
- `production` is gated: the runner API refuses runs against `production` unless `ALLOW_PRODUCTION_RUNS=true` is set on the server. Safety rail for an EC2 service that could otherwise be tricked into pounding prod.
- Storage state paths are env-namespaced: `storage/test/admin.json`, `storage/uat/admin.json`, … auth-setup writes into the correct folder based on `TARGET_ENV`.
- Bearer-token cache keys include the env so tokens from different environments never collide.

---

## Task 37: Refactor env + config layer for multi-environment

**Files:**
- Modify: `.env.example`
- Create: `config/environments.ts`
- Modify: `config/env.ts`
- Modify: `config/constants.ts`
- Modify: `config/urls.ts`
- Modify: `test/config/env.test.ts`
- Create: `test/config/urls.test.ts`

- [ ] **Step 1: Rewrite .env.example**

Overwrite `.env.example`:
```
# ============================================================
# Default environment for runs with no explicit `env` parameter
# ============================================================
DEFAULT_ENV=test
# Safety gate: set to "true" to allow runs targeting production
ALLOW_PRODUCTION_RUNS=false

# ============================================================
# TEST environment
# ============================================================
TEST_BASE_URL_ADMIN=
TEST_BASE_URL_CUSTOMER=
TEST_BASE_URL_BUSINESS=
TEST_BASE_URL_NEW_ADMIN=
TEST_BASE_URL_BACKEND=
TEST_BASE_URL_EMI=
TEST_BASE_URL_LGD=

TEST_ADMIN_USER_EMAIL=
TEST_ADMIN_USER_PASSWORD=
TEST_CUSTOMER_USER_EMAIL=
TEST_CUSTOMER_USER_PASSWORD=
TEST_BUSINESS_USER_EMAIL=
TEST_BUSINESS_USER_PASSWORD=
TEST_NEW_ADMIN_USER_EMAIL=
TEST_NEW_ADMIN_USER_PASSWORD=
TEST_BACKEND_USER_EMAIL=
TEST_BACKEND_USER_PASSWORD=
TEST_EMI_USER_EMAIL=
TEST_EMI_USER_PASSWORD=
TEST_LGD_USER_EMAIL=
TEST_LGD_USER_PASSWORD=

# ============================================================
# UAT environment
# ============================================================
UAT_BASE_URL_ADMIN=
UAT_BASE_URL_CUSTOMER=
UAT_BASE_URL_BUSINESS=
UAT_BASE_URL_NEW_ADMIN=
UAT_BASE_URL_BACKEND=
UAT_BASE_URL_EMI=
UAT_BASE_URL_LGD=

UAT_ADMIN_USER_EMAIL=
UAT_ADMIN_USER_PASSWORD=
UAT_CUSTOMER_USER_EMAIL=
UAT_CUSTOMER_USER_PASSWORD=
UAT_BUSINESS_USER_EMAIL=
UAT_BUSINESS_USER_PASSWORD=
UAT_NEW_ADMIN_USER_EMAIL=
UAT_NEW_ADMIN_USER_PASSWORD=
UAT_BACKEND_USER_EMAIL=
UAT_BACKEND_USER_PASSWORD=
UAT_EMI_USER_EMAIL=
UAT_EMI_USER_PASSWORD=
UAT_LGD_USER_EMAIL=
UAT_LGD_USER_PASSWORD=

# ============================================================
# PRODUCTION environment (gated by ALLOW_PRODUCTION_RUNS)
# ============================================================
PRODUCTION_BASE_URL_ADMIN=
PRODUCTION_BASE_URL_CUSTOMER=
PRODUCTION_BASE_URL_BUSINESS=
PRODUCTION_BASE_URL_NEW_ADMIN=
PRODUCTION_BASE_URL_BACKEND=
PRODUCTION_BASE_URL_EMI=
PRODUCTION_BASE_URL_LGD=

PRODUCTION_ADMIN_USER_EMAIL=
PRODUCTION_ADMIN_USER_PASSWORD=
PRODUCTION_CUSTOMER_USER_EMAIL=
PRODUCTION_CUSTOMER_USER_PASSWORD=
PRODUCTION_BUSINESS_USER_EMAIL=
PRODUCTION_BUSINESS_USER_PASSWORD=
PRODUCTION_NEW_ADMIN_USER_EMAIL=
PRODUCTION_NEW_ADMIN_USER_PASSWORD=
PRODUCTION_BACKEND_USER_EMAIL=
PRODUCTION_BACKEND_USER_PASSWORD=
PRODUCTION_EMI_USER_EMAIL=
PRODUCTION_EMI_USER_PASSWORD=
PRODUCTION_LGD_USER_EMAIL=
PRODUCTION_LGD_USER_PASSWORD=

# ============================================================
# Runtime flags
# ============================================================
HEADLESS=true

# ============================================================
# Runner API
# ============================================================
API_PORT=3000
API_KEY=change-me-before-deploy
LOG_LEVEL=info
```

- [ ] **Step 2: Create config/environments.ts**

Create `config/environments.ts`:
```typescript
export const ENVIRONMENTS = ['test', 'uat', 'production'] as const;
export type EnvName = typeof ENVIRONMENTS[number];

export function isEnvName(v: unknown): v is EnvName {
  return v === 'test' || v === 'uat' || v === 'production';
}

export function getTargetEnv(processEnv: NodeJS.ProcessEnv = process.env): EnvName {
  const requested = processEnv.TARGET_ENV;
  if (isEnvName(requested)) return requested;
  const fallback = processEnv.DEFAULT_ENV;
  if (isEnvName(fallback)) return fallback;
  return 'test';
}
```

- [ ] **Step 3: Rewrite config/env.ts**

Overwrite `config/env.ts`:
```typescript
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { ENVIRONMENTS } from './environments';

dotenv.config();

const nonEmpty = z.string().min(1);
const url = z.string().url();

function envBlock(prefix: string) {
  return {
    [`${prefix}_BASE_URL_ADMIN`]: url,
    [`${prefix}_BASE_URL_CUSTOMER`]: url,
    [`${prefix}_BASE_URL_BUSINESS`]: url,
    [`${prefix}_BASE_URL_NEW_ADMIN`]: url,
    [`${prefix}_BASE_URL_BACKEND`]: url,
    [`${prefix}_BASE_URL_EMI`]: url,
    [`${prefix}_BASE_URL_LGD`]: url,
    [`${prefix}_ADMIN_USER_EMAIL`]: nonEmpty,
    [`${prefix}_ADMIN_USER_PASSWORD`]: nonEmpty,
    [`${prefix}_CUSTOMER_USER_EMAIL`]: nonEmpty,
    [`${prefix}_CUSTOMER_USER_PASSWORD`]: nonEmpty,
    [`${prefix}_BUSINESS_USER_EMAIL`]: nonEmpty,
    [`${prefix}_BUSINESS_USER_PASSWORD`]: nonEmpty,
    [`${prefix}_NEW_ADMIN_USER_EMAIL`]: nonEmpty,
    [`${prefix}_NEW_ADMIN_USER_PASSWORD`]: nonEmpty,
    [`${prefix}_BACKEND_USER_EMAIL`]: nonEmpty,
    [`${prefix}_BACKEND_USER_PASSWORD`]: nonEmpty,
    [`${prefix}_EMI_USER_EMAIL`]: nonEmpty,
    [`${prefix}_EMI_USER_PASSWORD`]: nonEmpty,
    [`${prefix}_LGD_USER_EMAIL`]: nonEmpty,
    [`${prefix}_LGD_USER_PASSWORD`]: nonEmpty,
  } as const;
}

const envSchema = z.object({
  ...envBlock('TEST'),
  ...envBlock('UAT'),
  ...envBlock('PRODUCTION'),

  DEFAULT_ENV: z.enum(ENVIRONMENTS).default('test'),
  ALLOW_PRODUCTION_RUNS: z.string().transform((v) => v === 'true').default('false'),
  HEADLESS: z.string().transform((v) => v !== 'false').default('true'),

  API_PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().min(8),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}

export const env = (() => {
  try { return loadEnv(); } catch (err) {
    if (process.env.SKIP_ENV_VALIDATION === 'true') return {} as AppEnv;
    throw err;
  }
})();
```

- [ ] **Step 4: Update env.test.ts**

Overwrite `test/config/env.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { loadEnv } from '../../config/env';

function buildEnvBlock(prefix: string): Record<string, string> {
  return {
    [`${prefix}_BASE_URL_ADMIN`]: `http://${prefix.toLowerCase()}-admin`,
    [`${prefix}_BASE_URL_CUSTOMER`]: `http://${prefix.toLowerCase()}-cust`,
    [`${prefix}_BASE_URL_BUSINESS`]: `http://${prefix.toLowerCase()}-biz`,
    [`${prefix}_BASE_URL_NEW_ADMIN`]: `http://${prefix.toLowerCase()}-nad`,
    [`${prefix}_BASE_URL_BACKEND`]: `http://${prefix.toLowerCase()}-back`,
    [`${prefix}_BASE_URL_EMI`]: `http://${prefix.toLowerCase()}-emi`,
    [`${prefix}_BASE_URL_LGD`]: `http://${prefix.toLowerCase()}-lgd`,
    [`${prefix}_ADMIN_USER_EMAIL`]: 'a@x', [`${prefix}_ADMIN_USER_PASSWORD`]: 'p',
    [`${prefix}_CUSTOMER_USER_EMAIL`]: 'c@x', [`${prefix}_CUSTOMER_USER_PASSWORD`]: 'p',
    [`${prefix}_BUSINESS_USER_EMAIL`]: 'b@x', [`${prefix}_BUSINESS_USER_PASSWORD`]: 'p',
    [`${prefix}_NEW_ADMIN_USER_EMAIL`]: 'n@x', [`${prefix}_NEW_ADMIN_USER_PASSWORD`]: 'p',
    [`${prefix}_BACKEND_USER_EMAIL`]: 'bk@x', [`${prefix}_BACKEND_USER_PASSWORD`]: 'p',
    [`${prefix}_EMI_USER_EMAIL`]: 'em@x', [`${prefix}_EMI_USER_PASSWORD`]: 'p',
    [`${prefix}_LGD_USER_EMAIL`]: 'lg@x', [`${prefix}_LGD_USER_PASSWORD`]: 'p',
  };
}

const valid = {
  ...buildEnvBlock('TEST'),
  ...buildEnvBlock('UAT'),
  ...buildEnvBlock('PRODUCTION'),
  DEFAULT_ENV: 'test',
  ALLOW_PRODUCTION_RUNS: 'false',
  HEADLESS: 'true',
  API_PORT: '3000',
  API_KEY: 'secretXYZ',
  LOG_LEVEL: 'info',
};

describe('loadEnv (multi-env)', () => {
  it('parses all three environment blocks', () => {
    const cfg = loadEnv(valid);
    expect(cfg.TEST_BASE_URL_ADMIN).toBe('http://test-admin');
    expect(cfg.UAT_BASE_URL_ADMIN).toBe('http://uat-admin');
    expect(cfg.PRODUCTION_BASE_URL_ADMIN).toBe('http://production-admin');
    expect(cfg.DEFAULT_ENV).toBe('test');
    expect(cfg.ALLOW_PRODUCTION_RUNS).toBe(false);
  });

  it('rejects invalid DEFAULT_ENV', () => {
    expect(() => loadEnv({ ...valid, DEFAULT_ENV: 'mars' })).toThrow();
  });

  it('fails when a UAT url is missing', () => {
    const missing = { ...valid } as Record<string, string>;
    delete missing.UAT_BASE_URL_ADMIN;
    expect(() => loadEnv(missing)).toThrow(/UAT_BASE_URL_ADMIN/);
  });

  it('coerces ALLOW_PRODUCTION_RUNS=true', () => {
    const cfg = loadEnv({ ...valid, ALLOW_PRODUCTION_RUNS: 'true' });
    expect(cfg.ALLOW_PRODUCTION_RUNS).toBe(true);
  });
});
```

- [ ] **Step 5: Rewrite config/constants.ts**

Overwrite `config/constants.ts`:
```typescript
import type { EnvName } from './environments';

export const PANELS = ['admin', 'customer', 'business', 'new-admin'] as const;
export type Panel = typeof PANELS[number];

export const API_SERVICES = ['api-backend', 'api-emi', 'api-lgd'] as const;
export type ApiService = typeof API_SERVICES[number];

export type ProjectId = Panel | ApiService;
export const ALL_PROJECTS: readonly ProjectId[] = [...PANELS, ...API_SERVICES];

export function storageStatePath(envName: EnvName, panel: Panel): string {
  return `storage/${envName}/${panel}.json`;
}

export const DEFAULT_TIMEOUTS = {
  action: 15_000,
  navigation: 30_000,
  test: 60_000,
} as const;
```

- [ ] **Step 6: Rewrite config/urls.ts**

Overwrite `config/urls.ts`:
```typescript
import { env } from './env';
import type { Panel, ApiService } from './constants';
import type { EnvName } from './environments';
import { getTargetEnv } from './environments';

interface Credential { email: string; password: string; }

interface EnvBundle {
  panels: Record<Panel, string>;
  panelCreds: Record<Panel, Credential>;
  apis: Record<ApiService, string>;
  apiCreds: Record<ApiService, Credential>;
}

function buildBundle(prefix: 'TEST' | 'UAT' | 'PRODUCTION'): EnvBundle {
  const e = env as Record<string, string>;
  return {
    panels: {
      admin: e[`${prefix}_BASE_URL_ADMIN`],
      customer: e[`${prefix}_BASE_URL_CUSTOMER`],
      business: e[`${prefix}_BASE_URL_BUSINESS`],
      'new-admin': e[`${prefix}_BASE_URL_NEW_ADMIN`],
    },
    panelCreds: {
      admin: { email: e[`${prefix}_ADMIN_USER_EMAIL`], password: e[`${prefix}_ADMIN_USER_PASSWORD`] },
      customer: { email: e[`${prefix}_CUSTOMER_USER_EMAIL`], password: e[`${prefix}_CUSTOMER_USER_PASSWORD`] },
      business: { email: e[`${prefix}_BUSINESS_USER_EMAIL`], password: e[`${prefix}_BUSINESS_USER_PASSWORD`] },
      'new-admin': { email: e[`${prefix}_NEW_ADMIN_USER_EMAIL`], password: e[`${prefix}_NEW_ADMIN_USER_PASSWORD`] },
    },
    apis: {
      'api-backend': e[`${prefix}_BASE_URL_BACKEND`],
      'api-emi': e[`${prefix}_BASE_URL_EMI`],
      'api-lgd': e[`${prefix}_BASE_URL_LGD`],
    },
    apiCreds: {
      'api-backend': { email: e[`${prefix}_BACKEND_USER_EMAIL`], password: e[`${prefix}_BACKEND_USER_PASSWORD`] },
      'api-emi': { email: e[`${prefix}_EMI_USER_EMAIL`], password: e[`${prefix}_EMI_USER_PASSWORD`] },
      'api-lgd': { email: e[`${prefix}_LGD_USER_EMAIL`], password: e[`${prefix}_LGD_USER_PASSWORD`] },
    },
  };
}

const BUNDLES: Record<EnvName, EnvBundle> = {
  test: buildBundle('TEST'),
  uat: buildBundle('UAT'),
  production: buildBundle('PRODUCTION'),
};

export function panelUrl(panel: Panel, envName: EnvName = getTargetEnv()): string {
  return BUNDLES[envName].panels[panel];
}

export function panelCreds(panel: Panel, envName: EnvName = getTargetEnv()): Credential {
  return BUNDLES[envName].panelCreds[panel];
}

export function apiUrl(service: ApiService, envName: EnvName = getTargetEnv()): string {
  return BUNDLES[envName].apis[service];
}

export function apiCreds(service: ApiService, envName: EnvName = getTargetEnv()): Credential {
  return BUNDLES[envName].apiCreds[service];
}

export interface ApiServiceAuthConfig {
  loginPath: string;
  email: string;
  password: string;
  tokenJsonPath: string;
}

export function apiAuthConfig(service: ApiService, envName: EnvName = getTargetEnv()): ApiServiceAuthConfig {
  const creds = apiCreds(service, envName);
  return {
    loginPath: '/api/v1/auth/login',
    email: creds.email,
    password: creds.password,
    tokenJsonPath: 'data.token',
  };
}
```

> **NOTE:** Login path + token shape remain hard-coded to `/api/v1/auth/login` + `data.token`. If environments diverge (prod uses a different path), promote `loginPath`/`tokenJsonPath` into per-env config in `.env` and read them the same way URL/creds are read.

- [ ] **Step 7: Create test/config/urls.test.ts**

Create `test/config/urls.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

function setEnv(prefix: string) {
  for (const key of [
    'BASE_URL_ADMIN', 'BASE_URL_CUSTOMER', 'BASE_URL_BUSINESS', 'BASE_URL_NEW_ADMIN',
    'BASE_URL_BACKEND', 'BASE_URL_EMI', 'BASE_URL_LGD',
  ]) process.env[`${prefix}_${key}`] = `http://${prefix.toLowerCase()}-${key.toLowerCase()}`;
  for (const who of ['ADMIN', 'CUSTOMER', 'BUSINESS', 'NEW_ADMIN', 'BACKEND', 'EMI', 'LGD']) {
    process.env[`${prefix}_${who}_USER_EMAIL`] = `${prefix.toLowerCase()}-${who.toLowerCase()}@x`;
    process.env[`${prefix}_${who}_USER_PASSWORD`] = 'p';
  }
}

beforeAll(() => {
  setEnv('TEST'); setEnv('UAT'); setEnv('PRODUCTION');
  process.env.DEFAULT_ENV = 'test';
  process.env.ALLOW_PRODUCTION_RUNS = 'false';
  process.env.API_KEY = 'secretXYZ';
});

afterAll(() => {
  for (const k of Object.keys(process.env)) if (!(k in ORIGINAL_ENV)) delete process.env[k];
  Object.assign(process.env, ORIGINAL_ENV);
});

describe('urls (env-aware)', () => {
  it('panelUrl returns the test URL when TARGET_ENV=test', async () => {
    process.env.TARGET_ENV = 'test';
    const mod = await import('../../config/urls');
    expect(mod.panelUrl('admin')).toBe('http://test-base_url_admin');
  });

  it('panelUrl switches on explicit env param', async () => {
    const mod = await import('../../config/urls');
    expect(mod.panelUrl('admin', 'uat')).toBe('http://uat-base_url_admin');
    expect(mod.panelUrl('admin', 'production')).toBe('http://production-base_url_admin');
  });

  it('apiAuthConfig returns env-specific credentials', async () => {
    const mod = await import('../../config/urls');
    expect(mod.apiAuthConfig('api-backend', 'uat').email).toBe('uat-backend@x');
    expect(mod.apiAuthConfig('api-backend', 'production').email).toBe('production-backend@x');
  });
});
```

- [ ] **Step 8: Run tests + typecheck**

Run:
```bash
npm run test:unit -- test/config/env.test.ts test/config/urls.test.ts
npm run typecheck
```
Expected: All tests PASS, no type errors.

- [ ] **Step 9: Commit**

```bash
git add .env.example config/environments.ts config/env.ts config/constants.ts config/urls.ts \
        test/config/env.test.ts test/config/urls.test.ts
git commit -m "feat: multi-environment (test/uat/production) config layer"
```

---

## Task 38: Thread TARGET_ENV through Playwright + runner API

**Files:**
- Modify: `setup/auth.setup.ts`
- Modify: `fixtures/api.fixture.ts`
- Modify: `playwright.config.ts`
- Modify: `src/api/types/run.types.ts`
- Modify: `src/api/schemas/run-request.schema.ts`
- Modify: `test/api/run-request.schema.test.ts`
- Modify: `src/api/services/playwright-executor.service.ts`
- Modify: `test/api/playwright-executor.service.test.ts`
- Modify: `src/api/services/run-manager.service.ts`
- Modify: `test/api/run-manager.service.test.ts`
- Modify: `src/api/routes/runs.routes.ts`
- Modify: `test/api/runs.routes.test.ts`
- Modify: `src/api/server.ts`
- Modify: `src/api/index.ts`
- Modify: `README.md`

- [ ] **Step 1: Update RunRequest types**

Overwrite `src/api/types/run.types.ts`:
```typescript
export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'error' | 'cancelled';

export type UiPanel = 'admin' | 'customer' | 'business' | 'new-admin';
export type ApiService = 'api-backend' | 'api-emi' | 'api-lgd';
export type ProjectId = UiPanel | ApiService;

export type TargetEnv = 'test' | 'uat' | 'production';

export interface RunRequest {
  projects?: ProjectId[];
  env?: TargetEnv;
  grep?: string;
  grepInvert?: string;
  specFiles?: string[];
  workers?: number;
  retries?: number;
  headed?: boolean;
}

export interface RunRecord {
  id: string;
  status: RunStatus;
  request: RunRequest;
  resolvedEnv: TargetEnv;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  stdoutTail?: string;
  stderrTail?: string;
  artifactDir: string;
}
```

- [ ] **Step 2: Update RunRequest schema**

Overwrite `src/api/schemas/run-request.schema.ts`:
```typescript
import { z } from 'zod';

export const RunRequestSchema = z.object({
  projects: z.array(z.enum([
    'admin', 'customer', 'business', 'new-admin',
    'api-backend', 'api-emi', 'api-lgd',
  ])).optional(),
  env: z.enum(['test', 'uat', 'production']).optional(),
  grep: z.string().min(1).max(200).optional(),
  grepInvert: z.string().min(1).max(200).optional(),
  specFiles: z.array(z.string().min(1).max(500)).max(50).optional(),
  workers: z.number().int().min(1).max(16).optional(),
  retries: z.number().int().min(0).max(5).optional(),
  headed: z.boolean().optional(),
}).strict();

export type ValidatedRunRequest = z.infer<typeof RunRequestSchema>;
```

- [ ] **Step 3: Update schema tests**

Overwrite `test/api/run-request.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { RunRequestSchema } from '../../src/api/schemas/run-request.schema';

describe('RunRequestSchema', () => {
  it('accepts empty body', () => {
    expect(RunRequestSchema.parse({})).toEqual({});
  });

  it('accepts test/uat/production env values', () => {
    for (const e of ['test', 'uat', 'production'] as const) {
      expect(RunRequestSchema.parse({ env: e }).env).toBe(e);
    }
  });

  it('rejects legacy dev/staging env values', () => {
    expect(() => RunRequestSchema.parse({ env: 'dev' })).toThrow();
    expect(() => RunRequestSchema.parse({ env: 'staging' })).toThrow();
  });

  it('accepts api service projects', () => {
    const p = RunRequestSchema.parse({ projects: ['api-backend', 'api-emi', 'api-lgd'] });
    expect(p.projects).toEqual(['api-backend', 'api-emi', 'api-lgd']);
  });

  it('accepts mixed projects + env', () => {
    const p = RunRequestSchema.parse({ projects: ['admin', 'api-backend'], env: 'uat' });
    expect(p.projects).toHaveLength(2);
    expect(p.env).toBe('uat');
  });

  it('rejects unknown project', () => {
    expect(() => RunRequestSchema.parse({ projects: ['hacker'] })).toThrow();
  });

  it('rejects negative workers', () => {
    expect(() => RunRequestSchema.parse({ workers: -1 })).toThrow();
  });
});
```

- [ ] **Step 4: Update auth.setup.ts for env-aware storage**

Overwrite `setup/auth.setup.ts`:
```typescript
import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { panelUrl, panelCreds } from '../config/urls';
import { storageStatePath } from '../config/constants';
import { getTargetEnv } from '../config/environments';
import { AdminLoginPage } from '../pages/admin/login.page';
import { CustomerLoginPage } from '../pages/customer/login.page';
import { BusinessLoginPage } from '../pages/business/login.page';
import { NewAdminLoginPage } from '../pages/new-admin/login.page';

const targetEnv = getTargetEnv();

function ensureStorageDir(storagePath: string): void {
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
}

setup('authenticate admin', async ({ browser }) => {
  const storagePath = storageStatePath(targetEnv, 'admin');
  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('admin', targetEnv) });
  const page = await ctx.newPage();
  const login = new AdminLoginPage(page);
  const { email, password } = panelCreds('admin', targetEnv);
  await login.login(email, password);
  await ctx.storageState({ path: storagePath });
  await ctx.close();
});

setup('authenticate customer', async ({ browser }) => {
  const storagePath = storageStatePath(targetEnv, 'customer');
  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('customer', targetEnv) });
  const page = await ctx.newPage();
  const login = new CustomerLoginPage(page);
  const { email, password } = panelCreds('customer', targetEnv);
  await login.login(email, password);
  await ctx.storageState({ path: storagePath });
  await ctx.close();
});

setup('authenticate business', async ({ browser }) => {
  const storagePath = storageStatePath(targetEnv, 'business');
  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('business', targetEnv) });
  const page = await ctx.newPage();
  const login = new BusinessLoginPage(page);
  const { email, password } = panelCreds('business', targetEnv);
  await login.login(email, password);
  await ctx.storageState({ path: storagePath });
  await ctx.close();
});

setup('authenticate new-admin', async ({ browser }) => {
  const storagePath = storageStatePath(targetEnv, 'new-admin');
  ensureStorageDir(storagePath);
  const ctx = await browser.newContext({ baseURL: panelUrl('new-admin', targetEnv) });
  const page = await ctx.newPage();
  const login = new NewAdminLoginPage(page);
  const { email, password } = panelCreds('new-admin', targetEnv);
  await login.login(email, password);
  await ctx.storageState({ path: storagePath });
  await ctx.close();
});
```

- [ ] **Step 5: Update fixtures/api.fixture.ts**

Overwrite `fixtures/api.fixture.ts`:
```typescript
import { test as base, APIRequestContext, request as pwRequest } from '@playwright/test';
import { apiAuthConfig, apiUrl } from '../config/urls';
import { getTargetEnv } from '../config/environments';
import type { ApiService } from '../config/constants';
import { fetchBearerToken, globalTokenCache } from '../utils/api/api-auth';

type ApiFixtures = {
  apiService: ApiService;
  authedRequest: APIRequestContext;
};

const FIVE_MINUTES = 5 * 60 * 1000;

function detectApiService(projectName: string | undefined): ApiService {
  if (projectName === 'api-backend' || projectName === 'api-emi' || projectName === 'api-lgd') return projectName;
  throw new Error(`api fixture used in non-api project: ${projectName ?? '<unknown>'}`);
}

export const apiTest = base.extend<ApiFixtures>({
  apiService: async ({}, use, testInfo) => {
    await use(detectApiService(testInfo.project.name));
  },
  authedRequest: async ({ apiService }, use) => {
    const envName = getTargetEnv();
    const baseURL = apiUrl(apiService, envName);
    const auth = apiAuthConfig(apiService, envName);
    const loginCtx = await pwRequest.newContext({ baseURL });
    const token = await globalTokenCache.get(
      `${envName}:${apiService}:${auth.email}`,
      () => fetchBearerToken({
        request: loginCtx,
        loginPath: auth.loginPath,
        email: auth.email,
        password: auth.password,
        tokenJsonPath: auth.tokenJsonPath,
      }),
      FIVE_MINUTES,
    );
    await loginCtx.dispose();

    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
```

- [ ] **Step 6: Rewrite playwright.config.ts**

Overwrite `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';
import { storageStatePath } from './config/constants';
import { panelUrl, apiUrl } from './config/urls';
import { getTargetEnv } from './config/environments';

const targetEnv = getTargetEnv();
const isCI = !!process.env.CI;
const headless = process.env.HEADLESS !== 'false';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : (isCI ? 2 : undefined),
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],
  outputDir: 'reports/test-artifacts',
  use: {
    headless,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: './setup/global-setup.ts',
  projects: [
    { name: 'auth-setup', testMatch: /setup\/auth\.setup\.ts/ },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], baseURL: panelUrl('admin', targetEnv), storageState: storageStatePath(targetEnv, 'admin') },
      dependencies: ['auth-setup'],
      testMatch: /tests\/admin\/.*\.spec\.ts/,
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], baseURL: panelUrl('customer', targetEnv), storageState: storageStatePath(targetEnv, 'customer') },
      dependencies: ['auth-setup'],
      testMatch: /tests\/customer\/.*\.spec\.ts/,
    },
    {
      name: 'business',
      use: { ...devices['Desktop Chrome'], baseURL: panelUrl('business', targetEnv), storageState: storageStatePath(targetEnv, 'business') },
      dependencies: ['auth-setup'],
      testMatch: /tests\/business\/.*\.spec\.ts/,
    },
    {
      name: 'new-admin',
      use: { ...devices['Desktop Chrome'], baseURL: panelUrl('new-admin', targetEnv), storageState: storageStatePath(targetEnv, 'new-admin') },
      dependencies: ['auth-setup'],
      testMatch: /tests\/new-admin\/.*\.spec\.ts/,
    },
    {
      name: 'api-backend',
      use: { baseURL: apiUrl('api-backend', targetEnv), extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/backend\/.*\.spec\.ts/,
    },
    {
      name: 'api-emi',
      use: { baseURL: apiUrl('api-emi', targetEnv), extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/emi\/.*\.spec\.ts/,
    },
    {
      name: 'api-lgd',
      use: { baseURL: apiUrl('api-lgd', targetEnv), extraHTTPHeaders: { 'Content-Type': 'application/json' } },
      testMatch: /tests\/api\/lgd\/.*\.spec\.ts/,
    },
  ],
});
```

- [ ] **Step 7: Update executor to pass TARGET_ENV**

Overwrite `src/api/services/playwright-executor.service.ts`:
```typescript
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { RunRequest, TargetEnv } from '../types/run.types';
import type { RunManager } from './run-manager.service';
import { logger } from '../../../utils/logger/logger';

export function buildPlaywrightArgs(req: RunRequest): string[] {
  const args: string[] = ['test'];
  if (req.projects) {
    for (const p of req.projects) args.push(`--project=${p}`);
  }
  if (req.grep) args.push(`--grep=${req.grep}`);
  if (req.grepInvert) args.push(`--grep-invert=${req.grepInvert}`);
  if (typeof req.workers === 'number') args.push(`--workers=${req.workers}`);
  if (typeof req.retries === 'number') args.push(`--retries=${req.retries}`);
  if (req.headed) args.push('--headed');

  if (req.specFiles) {
    for (const f of req.specFiles) {
      if (f.includes('..')) throw new Error(`spec file path traversal not allowed: ${f}`);
      if (path.isAbsolute(f)) throw new Error(`spec file absolute path not allowed: ${f}`);
      args.push(f);
    }
  }
  return args;
}

export interface ExecuteOptions {
  runId: string;
  request: RunRequest;
  resolvedEnv: TargetEnv;
  runManager: RunManager;
  artifactDir: string;
  cwd?: string;
  extraEnv?: NodeJS.ProcessEnv;
}

export async function executePlaywright(opts: ExecuteOptions): Promise<number> {
  fs.mkdirSync(opts.artifactDir, { recursive: true });
  const args = buildPlaywrightArgs(opts.request);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...opts.extraEnv,
    TARGET_ENV: opts.resolvedEnv,
    HEADLESS: opts.request.headed ? 'false' : 'true',
    PLAYWRIGHT_HTML_REPORT: path.join(opts.artifactDir, 'html'),
    PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(opts.artifactDir, 'results.json'),
  };

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['playwright', ...args], { cwd: opts.cwd ?? process.cwd(), env });
    const stdoutLog = fs.createWriteStream(path.join(opts.artifactDir, 'stdout.log'));
    const stderrLog = fs.createWriteStream(path.join(opts.artifactDir, 'stderr.log'));

    child.stdout.on('data', (chunk) => {
      stdoutLog.write(chunk);
      opts.runManager.appendStdoutTail(opts.runId, chunk.toString());
    });
    child.stderr.on('data', (chunk) => {
      stderrLog.write(chunk);
      opts.runManager.appendStderrTail(opts.runId, chunk.toString());
    });
    child.on('error', (err) => {
      logger.error('playwright spawn error', { runId: opts.runId, err: err.message });
      reject(err);
    });
    child.on('close', (code) => {
      stdoutLog.end(); stderrLog.end();
      resolve(code ?? 1);
    });
  });
}
```

- [ ] **Step 8: Update executor tests**

Overwrite `test/api/playwright-executor.service.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { buildPlaywrightArgs } from '../../src/api/services/playwright-executor.service';

describe('buildPlaywrightArgs', () => {
  it('uses test as default command', () => {
    expect(buildPlaywrightArgs({})).toEqual(['test']);
  });

  it('adds --project flags', () => {
    const args = buildPlaywrightArgs({ projects: ['admin', 'customer'] });
    expect(args).toContain('--project=admin');
    expect(args).toContain('--project=customer');
  });

  it('adds --grep and --grep-invert', () => {
    const args = buildPlaywrightArgs({ grep: '@smoke', grepInvert: '@flaky' });
    expect(args).toContain('--grep=@smoke');
    expect(args).toContain('--grep-invert=@flaky');
  });

  it('adds --workers and --retries', () => {
    const args = buildPlaywrightArgs({ workers: 4, retries: 2 });
    expect(args).toContain('--workers=4');
    expect(args).toContain('--retries=2');
  });

  it('does NOT include env in CLI args (env is passed via TARGET_ENV process var)', () => {
    const args = buildPlaywrightArgs({ env: 'uat' });
    expect(args.some((a) => a.includes('uat'))).toBe(false);
  });

  it('rejects spec files with path traversal', () => {
    expect(() => buildPlaywrightArgs({ specFiles: ['../../etc/passwd'] })).toThrow(/traversal/);
  });

  it('rejects spec files with absolute path', () => {
    expect(() => buildPlaywrightArgs({ specFiles: ['/etc/passwd'] })).toThrow();
  });
});
```

- [ ] **Step 9: Update RunManager.create signature**

Overwrite `src/api/services/run-manager.service.ts`:
```typescript
import { randomUUID } from 'crypto';
import * as path from 'path';
import type { RunRecord, RunRequest, RunStatus, TargetEnv } from '../types/run.types';

export interface RunManagerOptions {
  maxConcurrent?: number;
  reportsRoot?: string;
}

export class RunManager {
  private runs = new Map<string, RunRecord>();
  private readonly maxConcurrent: number;
  private readonly reportsRoot: string;

  constructor(opts: RunManagerOptions = {}) {
    this.maxConcurrent = opts.maxConcurrent ?? 2;
    this.reportsRoot = opts.reportsRoot ?? path.resolve('reports', 'runs');
  }

  create(request: RunRequest, resolvedEnv: TargetEnv): RunRecord {
    const id = randomUUID();
    const record: RunRecord = {
      id,
      status: 'queued',
      request,
      resolvedEnv,
      startedAt: new Date().toISOString(),
      artifactDir: path.join(this.reportsRoot, id),
    };
    this.runs.set(id, record);
    return record;
  }

  get(id: string): RunRecord | undefined { return this.runs.get(id); }

  list(): RunRecord[] {
    return Array.from(this.runs.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  updateStatus(id: string, status: RunStatus): void {
    const r = this.runs.get(id);
    if (r) r.status = status;
  }

  appendStdoutTail(id: string, chunk: string): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.stdoutTail = ((r.stdoutTail ?? '') + chunk).slice(-10_000);
  }

  appendStderrTail(id: string, chunk: string): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.stderrTail = ((r.stderrTail ?? '') + chunk).slice(-10_000);
  }

  markFinished(id: string, exitCode: number): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.exitCode = exitCode;
    r.finishedAt = new Date().toISOString();
    r.status = exitCode === 0 ? 'passed' : 'failed';
  }

  markError(id: string): void {
    const r = this.runs.get(id);
    if (!r) return;
    r.finishedAt = new Date().toISOString();
    r.status = 'error';
  }

  runningCount(): number {
    return Array.from(this.runs.values()).filter((r) => r.status === 'running').length;
  }

  canStartAnother(): boolean {
    return this.runningCount() < this.maxConcurrent;
  }
}
```

- [ ] **Step 10: Update RunManager tests**

Overwrite `test/api/run-manager.service.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { RunManager } from '../../src/api/services/run-manager.service';

describe('RunManager', () => {
  let mgr: RunManager;
  beforeEach(() => { mgr = new RunManager({ maxConcurrent: 2 }); });

  it('creates a run with unique id, queued status, resolvedEnv', () => {
    const r = mgr.create({ projects: ['admin'] }, 'test');
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.status).toBe('queued');
    expect(r.resolvedEnv).toBe('test');
    expect(r.artifactDir.endsWith(r.id)).toBe(true);
  });

  it('stores different resolvedEnv per run', () => {
    const a = mgr.create({}, 'test');
    const b = mgr.create({}, 'uat');
    expect(mgr.get(a.id)?.resolvedEnv).toBe('test');
    expect(mgr.get(b.id)?.resolvedEnv).toBe('uat');
  });

  it('gets run by id', () => {
    const r = mgr.create({}, 'test');
    expect(mgr.get(r.id)?.id).toBe(r.id);
    expect(mgr.get('nope')).toBeUndefined();
  });

  it('updates status and finishedAt', () => {
    const r = mgr.create({}, 'test');
    mgr.updateStatus(r.id, 'running');
    expect(mgr.get(r.id)?.status).toBe('running');
    mgr.markFinished(r.id, 0);
    expect(mgr.get(r.id)?.status).toBe('passed');
    expect(mgr.get(r.id)?.finishedAt).toBeDefined();
  });

  it('exit code !=0 maps to failed', () => {
    const r = mgr.create({}, 'test');
    mgr.markFinished(r.id, 1);
    expect(mgr.get(r.id)?.status).toBe('failed');
  });

  it('enforces maxConcurrent', () => {
    mgr.updateStatus(mgr.create({}, 'test').id, 'running');
    mgr.updateStatus(mgr.create({}, 'test').id, 'running');
    expect(mgr.runningCount()).toBe(2);
    expect(mgr.canStartAnother()).toBe(false);
  });

  it('lists runs newest-first', () => {
    const a = mgr.create({}, 'test');
    const b = mgr.create({}, 'uat');
    const list = mgr.list();
    expect(list[0].id).toBe(b.id);
    expect(list[1].id).toBe(a.id);
  });
});
```

- [ ] **Step 11: Update runs.routes.ts to resolve env + gate production**

Overwrite `src/api/routes/runs.routes.ts`:
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { RunRequestSchema } from '../schemas/run-request.schema';
import type { RunManager } from '../services/run-manager.service';
import type { ExecuteOptions } from '../services/playwright-executor.service';
import type { TargetEnv } from '../types/run.types';
import { logger } from '../../../utils/logger/logger';

type ExecuteFn = (opts: ExecuteOptions) => Promise<number>;

export interface RunsRouterDeps {
  runManager: RunManager;
  executePlaywright: ExecuteFn;
  defaultEnv: TargetEnv;
  allowProductionRuns: boolean;
}

export function createRunsRouter(deps: RunsRouterDeps): Router {
  const router = Router();
  const { runManager, executePlaywright, defaultEnv, allowProductionRuns } = deps;

  router.post('/runs', (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = RunRequestSchema.parse(req.body ?? {});
      const resolvedEnv: TargetEnv = parsed.env ?? defaultEnv;

      if (resolvedEnv === 'production' && !allowProductionRuns) {
        res.status(403).json({
          error: 'production_runs_disabled',
          hint: 'Set ALLOW_PRODUCTION_RUNS=true on the server to enable.',
        });
        return;
      }

      if (!runManager.canStartAnother()) {
        res.status(429).json({ error: 'concurrency_limit_reached' });
        return;
      }
      const record = runManager.create(parsed, resolvedEnv);

      setImmediate(async () => {
        runManager.updateStatus(record.id, 'running');
        try {
          const exitCode = await executePlaywright({
            runId: record.id,
            request: parsed,
            resolvedEnv,
            runManager,
            artifactDir: record.artifactDir,
          });
          runManager.markFinished(record.id, exitCode);
          logger.info('run finished', { runId: record.id, env: resolvedEnv, exitCode });
        } catch (err) {
          runManager.markError(record.id);
          logger.error('run errored', { runId: record.id, env: resolvedEnv, err: (err as Error).message });
        }
      });

      res.status(202).json(record);
    } catch (err) { next(err); }
  });

  router.get('/runs', (_req, res) => { res.json({ runs: runManager.list() }); });

  router.get('/runs/:id', (req, res) => {
    const r = runManager.get(req.params.id);
    if (!r) { res.status(404).json({ error: 'not_found' }); return; }
    res.json(r);
  });

  router.get('/runs/:id/report', (req, res) => {
    const r = runManager.get(req.params.id);
    if (!r) { res.status(404).json({ error: 'not_found' }); return; }
    const reportIndex = path.join(r.artifactDir, 'html', 'index.html');
    if (!fs.existsSync(reportIndex)) {
      res.status(404).json({ error: 'report_not_ready', runStatus: r.status });
      return;
    }
    res.sendFile(path.resolve(reportIndex));
  });

  router.get('/runs/:id/logs', (req, res) => {
    const r = runManager.get(req.params.id);
    if (!r) { res.status(404).json({ error: 'not_found' }); return; }
    res.json({ stdoutTail: r.stdoutTail ?? '', stderrTail: r.stderrTail ?? '' });
  });

  return router;
}
```

- [ ] **Step 12: Update runs.routes tests**

Overwrite `test/api/runs.routes.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRunsRouter } from '../../src/api/routes/runs.routes';
import { RunManager } from '../../src/api/services/run-manager.service';
import { errorMiddleware } from '../../src/api/middleware/error.middleware';
import type { TargetEnv } from '../../src/api/types/run.types';

const makeApp = (opts: { mgr?: RunManager; exec?: () => Promise<number>; allowProd?: boolean; defaultEnv?: TargetEnv } = {}) => {
  const mgr = opts.mgr ?? new RunManager();
  const exec = opts.exec ?? (async () => 0);
  const app = express();
  app.use(express.json());
  app.use('/api', createRunsRouter({
    runManager: mgr,
    executePlaywright: exec,
    defaultEnv: opts.defaultEnv ?? 'test',
    allowProductionRuns: opts.allowProd ?? false,
  }));
  app.use(errorMiddleware);
  return { app, mgr };
};

describe('runs routes', () => {
  it('POST /api/runs creates queued run with default env', async () => {
    const { app } = makeApp({ defaultEnv: 'uat' });
    const res = await request(app).post('/api/runs').send({ projects: ['admin'] });
    expect(res.status).toBe(202);
    expect(res.body.resolvedEnv).toBe('uat');
    expect(res.body.status).toBe('queued');
  });

  it('POST /api/runs honors explicit env', async () => {
    const { app } = makeApp({ defaultEnv: 'test' });
    const res = await request(app).post('/api/runs').send({ env: 'uat' });
    expect(res.body.resolvedEnv).toBe('uat');
  });

  it('POST /api/runs blocks production when gate is off', async () => {
    const { app } = makeApp({ allowProd: false });
    const res = await request(app).post('/api/runs').send({ env: 'production' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('production_runs_disabled');
  });

  it('POST /api/runs allows production when gate is on', async () => {
    const { app } = makeApp({ allowProd: true });
    const res = await request(app).post('/api/runs').send({ env: 'production' });
    expect(res.status).toBe(202);
    expect(res.body.resolvedEnv).toBe('production');
  });

  it('POST /api/runs rejects invalid env value', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/runs').send({ env: 'staging' });
    expect(res.status).toBe(400);
  });

  it('GET /api/runs/:id returns 404 for unknown', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/runs/unknown');
    expect(res.status).toBe(404);
  });

  it('GET /api/runs/:id returns run', async () => {
    const { app, mgr } = makeApp();
    const r = mgr.create({}, 'test');
    const res = await request(app).get(`/api/runs/${r.id}`);
    expect(res.body.id).toBe(r.id);
  });

  it('GET /api/runs lists runs', async () => {
    const { app, mgr } = makeApp();
    mgr.create({}, 'test'); mgr.create({}, 'uat');
    const res = await request(app).get('/api/runs');
    expect(res.body.runs.length).toBe(2);
  });
});
```

- [ ] **Step 13: Wire server.ts + index.ts with new config**

Overwrite `src/api/server.ts`:
```typescript
import express, { Express } from 'express';
import { createAuthMiddleware } from './middleware/auth.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { healthRouter } from './routes/health.routes';
import { createRunsRouter } from './routes/runs.routes';
import { RunManager } from './services/run-manager.service';
import { executePlaywright } from './services/playwright-executor.service';
import type { TargetEnv } from './types/run.types';

export interface ServerConfig {
  apiKey: string;
  defaultEnv: TargetEnv;
  allowProductionRuns: boolean;
  maxConcurrentRuns?: number;
}

export function createServer(config: ServerConfig): { app: Express; runManager: RunManager } {
  const app = express();
  const runManager = new RunManager({ maxConcurrent: config.maxConcurrentRuns ?? 2 });

  app.use(express.json({ limit: '256kb' }));
  app.use(healthRouter);
  app.use('/api', createAuthMiddleware(config.apiKey));
  app.use('/api', createRunsRouter({
    runManager,
    executePlaywright,
    defaultEnv: config.defaultEnv,
    allowProductionRuns: config.allowProductionRuns,
  }));
  app.use(errorMiddleware);

  return { app, runManager };
}
```

Overwrite `src/api/index.ts`:
```typescript
import { env } from '../../config/env';
import { createServer } from './server';
import { logger } from '../../utils/logger/logger';

const { app } = createServer({
  apiKey: env.API_KEY,
  defaultEnv: env.DEFAULT_ENV,
  allowProductionRuns: env.ALLOW_PRODUCTION_RUNS,
  maxConcurrentRuns: 2,
});

const server = app.listen(env.API_PORT, () => {
  logger.info('api listening', {
    port: env.API_PORT,
    defaultEnv: env.DEFAULT_ENV,
    allowProductionRuns: env.ALLOW_PRODUCTION_RUNS,
  });
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    logger.info('shutting down', { signal: sig });
    server.close(() => process.exit(0));
  });
}
```

- [ ] **Step 14: Run full unit suite + typecheck**

Run:
```bash
npm run typecheck
npm run test:unit
```
Expected: Zero type errors. All unit tests PASS.

- [ ] **Step 15: Update README with env docs**

Edit `README.md`:

**A.** Replace the `### POST /api/runs — trigger a run` parameter table with:
```
| Field        | Type       | Description                                        |
|--------------|------------|----------------------------------------------------|
| `env`        | string     | `test` \| `uat` \| `production` (defaults to `DEFAULT_ENV` on server) |
| `projects`   | string[]   | Subset of `admin`, `customer`, `business`, `new-admin`, `api-backend`, `api-emi`, `api-lgd` |
| `grep`       | string     | Tag/pattern, e.g. `@smoke`                         |
| `grepInvert` | string     | Exclusion pattern                                  |
| `specFiles`  | string[]   | Relative paths, e.g. `tests/admin/login.spec.ts`   |
| `workers`    | integer    | 1–16                                               |
| `retries`    | integer    | 0–5                                                |
| `headed`     | boolean    | Default false (server = headless)                  |
```

**B.** Update the example curl immediately below the table:
```bash
curl -X POST http://<host>:3000/api/runs \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: <key>' \
  -d '{"env":"uat","projects":["admin","customer"],"grep":"@smoke","workers":2}'
```

**C.** Add a `403` entry to the response-code list under the same section:
```
- `403` → `env: "production"` requested but `ALLOW_PRODUCTION_RUNS=false` on the server
```

**D.** Insert a new top-level section between `## API reference` and `## EC2 deployment`:
````markdown
## Environments

Three target environments are supported: `test`, `uat`, `production`. All three URL sets + credentials are loaded from `.env` at server boot (keys are prefixed `TEST_`, `UAT_`, `PRODUCTION_`). Each `POST /api/runs` picks which env to run against via the `env` parameter; if omitted, `DEFAULT_ENV` is used.

**Production safety:** requests with `env: "production"` are refused with `403 production_runs_disabled` unless the server was started with `ALLOW_PRODUCTION_RUNS=true`. This is a blast-radius safeguard — leave it off by default and flip it only for release smoke.

Examples:

```bash
# UAT — admin panel smoke
curl -X POST http://<host>:3000/api/runs \
  -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"env":"uat","projects":["admin"],"grep":"@smoke"}'

# Test env — mixed UI + API regression
curl -X POST http://<host>:3000/api/runs \
  -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"env":"test","projects":["admin","api-backend"],"grep":"@regression"}'

# Production smoke (requires ALLOW_PRODUCTION_RUNS=true on server)
curl -X POST http://<host>:3000/api/runs \
  -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"env":"production","projects":["api-backend"],"grep":"@smoke"}'
```

Storage state for UI auth is namespaced per env: `storage/<env>/<panel>.json`. The `auth-setup` project re-logs-in for each env the first time it's used and reuses cached state on subsequent runs.

Local CLI usage targeting a specific env:
```bash
TARGET_ENV=uat npx playwright test --project=admin --grep=@smoke
TARGET_ENV=test npm run test:api
```
````

- [ ] **Step 16: End-to-end verify multi-env**

Run (image must be built and `.env` populated for at least test + uat):
```bash
docker compose up -d --build
sleep 5

curl -sS -X POST http://localhost:3000/api/runs \
  -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"projects":["admin"],"grep":"@smoke"}' | jq '{id, resolvedEnv, status}'
# Expect resolvedEnv == "test"

curl -sS -X POST http://localhost:3000/api/runs \
  -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"env":"uat","projects":["admin"],"grep":"@smoke"}' | jq '{id, resolvedEnv, status}'
# Expect resolvedEnv == "uat"

curl -sS -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/runs \
  -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"env":"production"}'
# Expect 403

docker compose down
```

- [ ] **Step 17: Commit**

```bash
git add setup/auth.setup.ts fixtures/api.fixture.ts playwright.config.ts \
        src/api/types/run.types.ts src/api/schemas/run-request.schema.ts \
        src/api/services/playwright-executor.service.ts \
        src/api/services/run-manager.service.ts \
        src/api/routes/runs.routes.ts src/api/server.ts src/api/index.ts \
        test/api/run-request.schema.test.ts \
        test/api/playwright-executor.service.test.ts \
        test/api/run-manager.service.test.ts \
        test/api/runs.routes.test.ts \
        README.md
git commit -m "feat: thread TARGET_ENV through playwright + runner API (test/uat/production)"
```

---

## Self-Review Notes

- **Spec coverage vs. `playwright_automation_suite_plan.md`:** All 20 sections of the source plan map to tasks — multi-project config (T9, T35, T38), auth isolation via storage states (T13; env-namespaced in T37–T38), POMs (T11–T12), fixtures (T14, T33, T38), test types/tagging (T15–T16, T34), Dockerization (T26–T27), env handling (T4, T26, T31, T37–T38), parallelization (T9 via `workers`), reporting volumes (T27), CI/CD (T28). New additions beyond the base plan: runner API (T17–T25), EC2 deployment guide (T29), end-to-end verification (T30, T36, T38), **backend API test suites** (T31–T36), **multi-environment support test/uat/production** (T37–T38).
- **Placeholder scan:** No TBD/TODO left in tasks. Login page selectors (T12), backend endpoint paths (T34), and per-env login path / token shape (T37) are explicitly flagged with NOTE comments for the implementer to replace with real values.
- **Type consistency:** `RunRequest`/`RunRecord`/`ProjectId`/`TargetEnv` defined once in T38's `run.types.ts` and reused by schema, manager, executor, router, server. `EnvName` in `config/environments.ts` and `TargetEnv` in `src/api/types/run.types.ts` are kept as separate types deliberately — one is the Playwright-side concept, the other is the runner-API concept; the server bridges them by passing `resolvedEnv` into `TARGET_ENV` at subprocess spawn time.
- **Known compromises (intentional):** In-memory run registry (T21) — restart wipes run history. In-memory token cache (T32) — tokens cached per-worker, env name is part of the cache key so test/uat tokens never collide. Single static API key (T19) — upgrade to rotating JWT or IAM-backed auth before exposing outside a trusted VPC. Login path / token shape hard-coded in `apiAuthConfig` (T37) — acceptable while all three backends share the same auth contract; promote to per-env `.env` keys when that stops being true.

---

Plan complete and saved to `docs/superpowers/plans/2026-04-17-playwright-test-suite.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
