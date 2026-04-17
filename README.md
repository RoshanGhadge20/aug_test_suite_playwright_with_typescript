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
