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
| `env`        | string     | `test` \| `uat` \| `production` (defaults to `DEFAULT_ENV` on server) |
| `projects`   | string[]   | Subset of `admin`, `customer`, `business`, `new-admin`, `api-backend`, `api-emi`, `api-lgd` |
| `grep`       | string     | Tag/pattern, e.g. `@smoke`                         |
| `grepInvert` | string     | Exclusion pattern                                  |
| `specFiles`  | string[]   | Relative paths, e.g. `tests/admin/login.spec.ts`   |
| `workers`    | integer    | 1–16                                               |
| `retries`    | integer    | 0–5                                                |
| `headed`     | boolean    | Default false (server = headless)                  |

Example:
```bash
curl -X POST http://<host>:3000/api/runs \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: <key>' \
  -d '{"env":"uat","projects":["admin","customer"],"grep":"@smoke","workers":2}'
```

Responses:
- `202` → run accepted, body is `RunRecord` with `id` and `status: "queued"`
- `400` → validation failure (zod issue list)
- `401` → missing/invalid API key
- `403` → `env: "production"` requested but `ALLOW_PRODUCTION_RUNS=false` on the server
- `429` → concurrency limit reached

### GET /api/runs

Returns all runs newest-first.

### GET /api/runs/:id

Returns single `RunRecord` with current status, exit code, stdout/stderr tails.

### GET /api/runs/:id/logs

Returns `{ stdoutTail, stderrTail }` (last ~10KB each).

### GET /api/runs/:id/report

Returns the Playwright HTML report for that run (only once run has finished writing to disk).

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

## API testing

Backend HTTP tests live under `tests/api/<service>/` and run via dedicated Playwright projects:

- `api-backend` → `gold-loan-backend-two` (URL: `<ENV>_BASE_URL_BACKEND`)
- `api-emi` → `emi-backend` (URL: `<ENV>_BASE_URL_EMI`)
- `api-lgd` → `LGD-backend` (URL: `<ENV>_BASE_URL_LGD`)

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

## Test conventions

### Tags

Every test should carry at least one suite tag and one scope tag.

| Tag | Meaning | Example |
|---|---|---|
| `@smoke` | Fast, critical-path — runs on every deploy | `tests/admin/login.spec.ts` |
| `@regression` | Deeper scenarios — runs before releases | `tests/admin/regression.spec.ts` |
| `@admin` | Admin panel scope | `admin navigation @regression @admin` |
| `@customer` | Customer panel scope | `customer profile @regression @customer` |
| `@business` | Agent/DSA panel scope | `business agent workflow @regression @business` |
| `@new-admin` | New admin panel scope | `new-admin settings @regression @new-admin` |
| `@api` | Backend HTTP test (no browser) | `backend users API @regression @api` |
| `@users`, `@loans`, `@emi`, `@lgd` | Optional feature-area filters | `@regression @api @loans` |

Tags live in the `test.describe` title and can be combined: `'backend users API @regression @api @users'`.

Filter by tag on the CLI or via the runner API:
```bash
npm run test:smoke                            # all @smoke
npm run test:regression                       # all @regression
npx playwright test --grep @admin             # only admin panel
npx playwright test --grep "@regression.*@api" # API regression only
npx playwright test --grep-invert @flaky      # exclude flakies
```

### Sample specs per tag

- `@smoke` → `tests/<panel>/login.spec.ts`, `tests/api/<service>/health.spec.ts`
- `@regression` → `tests/<panel>/regression.spec.ts`, `tests/api/<service>/regression.spec.ts`
- `@api` (authenticated) → `tests/api/backend/auth.spec.ts`, `tests/api/backend/regression.spec.ts`

### Structure

- File naming: `<feature>.spec.ts` under `tests/<panel>/` or `tests/api/<service>/`.
- Page Objects: `pages/<panel>/<feature>.page.ts`, extend `BasePage`, no assertions inside.
- Fixtures: extend `fixtures/base.fixture.ts` for UI, `fixtures/api.fixture.ts` for API (use `authedRequest` for auth-required calls).
- Auth: per-panel storage state auto-loaded via `playwright.config.ts`. Setup script runs as `auth-setup` project and is a dependency of every UI panel project. API projects skip `auth-setup` and obtain bearer tokens per-test via `authedRequest`.
