# Email Report Notifications — How It Works

This doc explains the "send email report" feature added to the CI pipeline: what generates it, what sends it, and how it's wired into the GitHub Actions workflow. It's a companion to the main [README.md](../README.md) and [CLAUDE.md](../CLAUDE.md).

## What it does

After a Playwright run in CI, the workflow can optionally email an HTML summary report (pass/fail counts, failed test details, and attachments) to a configured recipient list. It's opt-in per run via the `send_email` workflow input.

## Pieces involved

| File | Role |
|---|---|
| `.github/workflows/playwright-docker.yml` | Orchestrates the steps below, in order |
| `.github/scripts/report-summary.js` | Parses `reports/results.json` → writes `reports/summary.json` |
| `.github/scripts/build-email.js` | Fills `email-template.html` with values from `summary.json` + GitHub env vars → writes `reports/email.html` |
| `.github/scripts/email-template.html` | Static HTML/CSS shell with `{{PLACEHOLDER}}` tokens |
| `.github/scripts/send-email.js` | Sends the email via `nodemailer` (SMTP), with report/zip/screenshots as attachments |
| `.env.email` | SMTP credentials (host, port, username, password, recipients) |

## Step-by-step flow (as run in `playwright-docker.yml`)

1. **Run tests** — Playwright runs inside the Docker container, producing `reports/results.json` (JSON reporter output) and `reports/html` (HTML report).
2. **`report-summary.js`** — reads `reports/results.json`, walks the nested `suites → specs → tests → results` tree, and tallies `total/passed/failed/skipped/timedOut/interrupted`, plus a `failedTests[]` array (title, file, error message). Writes `reports/summary.json`. Runs even if the test step failed (`if: always()`), and writes a zeroed-out summary if `results.json` is missing.
3. **`build-email.js`** — loads `reports/summary.json` and `.github/scripts/email-template.html`, then does a plain string `replaceAll` of every `{{TOKEN}}` in the template (status, counts, workflow/repo/branch/actor/commit from `GITHUB_*` env vars, and the failed-tests table rows). Writes `reports/email.html`.
4. **Zip the HTML report** — `reports/html` → `reports/html-report.zip`, for attaching to the email.
5. **Write `.env.email`** — *only if* the `send_email` input is `"true"`. The workflow writes the `EMAIL_ENV` GitHub secret to `.env.email` in the runner's working directory (this is the same trick used for the main `.env` file from the `DOT_ENV` secret).
6. **`send-email.js`** — *only if* `send_email` is `"true"`:
   - Loads `.env.email` via `dotenv` (skipped in `NODE_ENV=production`, since CI injects env vars directly instead).
   - Creates a `nodemailer` SMTP transporter from `SMTP_SERVER` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` (`secure: true` when port is `465`).
   - Calls `transporter.verify()` to confirm the SMTP connection before sending.
   - Reads `reports/email.html` as the message body (falls back to a plaintext "no report" message if missing).
   - Sets the subject to ✅ or ❌ based on `summary.json`'s `failed` count.
   - Attaches, if present: `reports/html-report.zip`, `reports/results.json`, and every file under `reports/test-artifacts/` (screenshots).
   - Sends to the comma-separated list in `EMAIL_TO`, from `"${EMAIL_FROM_NAME}" <SMTP_USERNAME>`.

## Required `.env.email` keys

```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=<sender mailbox>
SMTP_PASSWORD=<app password, not the account password>
EMAIL_TO=<comma-separated recipients>
EMAIL_FROM_NAME=Playwright Automation
```

For CI, these live in the `EMAIL_ENV` GitHub Actions secret and are materialized into `.env.email` by the workflow at run time. For local testing, create `.env.email` yourself with the same keys.

Gmail specifically requires an **app password** (16-char, no spaces), not the normal account password — this only works if 2FA is enabled on the sending account.

## Running it locally

```bash
# after a local playwright run has produced reports/results.json:
node .github/scripts/report-summary.js
node .github/scripts/build-email.js
node .github/scripts/send-email.js
```

`build-email.js` reads several `GITHUB_*` env vars (workflow, repo, branch, actor, sha, run id/server url) — outside CI these will just render blank in the email, which is harmless for testing SMTP connectivity.

## Known issue to fix

`.env.email` is currently **tracked in git and committed with a real SMTP credential** (see `git log -- .env.email`). The `.gitignore` entry intended to exclude it is corrupted (written as `. e n v . e m a i l`, one space between every character — likely a UTF-16-encoded write via `Out-File`/PowerShell redirection), so git does not actually ignore the file. Action items:
- Rotate the leaked Gmail app password immediately.
- Fix the `.gitignore` line to plain ASCII `.env.email`.
- Remove `.env.email` from git tracking (`git rm --cached .env.email`) and scrub it from history if this repo is or will be shared externally.
