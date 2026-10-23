import fs from "fs";
import path from "path";
import type { Page } from "@playwright/test";
import type { AdminRole } from "../../config/roles";
import type { EnvName } from "../../config/environments";

/**
 * Per-role session-state caching for the admin panel.
 *
 * FRAMEWORK_STRUCTURE_FLOW.md / a prior admin.fixture.ts comment both claim the admin app
 * stores auth in sessionStorage (which Playwright's storageState() can't capture, hence "not
 * persistable"). Confirmed live (2026-07-27) this is stale: the real auth token lives in
 * localStorage under the key "UserDetails" (a JSON blob with a "Token" JWT). sessionStorage
 * only holds unrelated Razorpay checkout tracking keys. localStorage + cookies ARE captured
 * by context.storageState(), so a real cache is viable here — this module is that cache.
 *
 * Safety net: every restore is verified (URL not on /auth/*, profile icon actually visible)
 * before being trusted. Any failure at any step — missing file, unparseable JSON, expired
 * JWT, failed verification — returns false/never throws, so the caller always has a clean
 * path to fall back to a full fresh login. This mirrors the exact failure mode a previous
 * caching attempt hit ("silently landed on /auth/login instead of dashboard").
 */

const SESSION_DIR = (env: EnvName) => path.join("storage", env);
const sessionCachePath = (env: EnvName, role: AdminRole) =>
  path.join(SESSION_DIR(env), `admin-${role}.json`);

interface StorageStateLocalStorageEntry {
  name: string;
  value: string;
}
interface StorageStateOrigin {
  origin: string;
  localStorage: StorageStateLocalStorageEntry[];
}
interface StorageStateShape {
  cookies: Array<Record<string, unknown>>;
  origins: StorageStateOrigin[];
}

/** Decodes a JWT's payload and returns its `exp` claim (Unix seconds), or null if unreadable. */
function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(payload, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

/** Don't reuse a token expiring within this many seconds — avoids racing expiry mid-test. */
const EXPIRY_SAFETY_BUFFER_SECONDS = 120;

function readUserDetailsToken(state: StorageStateShape): string | null {
  for (const origin of state.origins ?? []) {
    const entry = origin.localStorage?.find((e) => e.name === "UserDetails");
    if (!entry) continue;
    try {
      const parsed = JSON.parse(entry.value);
      if (typeof parsed?.Token === "string") return parsed.Token;
    } catch {
      // fall through — try other origins, if any
    }
  }
  return null;
}

/** True only if the cache file exists, parses, and its token's exp is safely in the future. */
function isSessionCacheValid(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  try {
    const state = JSON.parse(fs.readFileSync(filePath, "utf8")) as StorageStateShape;
    const token = readUserDetailsToken(state);
    if (!token) return false;
    const exp = decodeJwtExpiry(token);
    if (!exp) return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return exp - EXPIRY_SAFETY_BUFFER_SECONDS > nowSeconds;
  } catch {
    return false;
  }
}

/**
 * Attempts to restore a cached, still-valid session for `role` into `page`'s current
 * context. Returns true only after verifying the restore actually landed on a real
 * dashboard (not redirected to /auth/*, profile icon visible) — false in every other case,
 * including any parse/navigation error, so the caller can unconditionally fall back to a
 * fresh login.
 */
export async function tryRestoreCachedSession(
  page: Page,
  role: AdminRole,
  env: EnvName,
): Promise<boolean> {
  const filePath = sessionCachePath(env, role);
  if (!isSessionCacheValid(filePath)) return false;

  try {
    const state = JSON.parse(fs.readFileSync(filePath, "utf8")) as StorageStateShape;
    const origin = state.origins?.[0];
    if (!origin?.localStorage?.length) return false;

    await page.context().clearCookies();
    if (state.cookies?.length) {
      await page.context().addCookies(state.cookies as any);
    }

    // Seed localStorage ONCE for this navigation. This used to be page.addInitScript(), which
    // stays registered for the page's whole lifetime: it re-wrote the cached role's (stale)
    // "UserDetails" token into localStorage on EVERY later document load — including iframes and
    // popups such as print previews — overwriting a newer/fresh login's token. The next API call
    // then went out with the wrong token and the backend answered 401 "auth failed", forcing the
    // app back to /auth/login mid-flow (seen on the Upload Documents tab and on role switches).
    await page.goto("/");
    await page.evaluate((entries: StorageStateLocalStorageEntry[]) => {
      for (const { name, value } of entries) {
        window.localStorage.setItem(name, value);
      }
    }, origin.localStorage);
    await page.goto("/");
    await page.waitForTimeout(3000);

    if (page.url().toLowerCase().includes("/auth/")) {
      // Don't leave the rejected cached token behind for the fresh login that follows.
      await page.evaluate(() => window.localStorage.clear()).catch(() => {});
      return false;
    }

    const profileIcon = page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    const profileVisible = await profileIcon
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    return profileVisible;
  } catch {
    return false;
  }
}

/** Captures the current context's storageState and saves it as the cache for `role`. */
export async function saveSessionCache(
  page: Page,
  role: AdminRole,
  env: EnvName,
): Promise<void> {
  const filePath = sessionCachePath(env, role);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const state = await page.context().storageState();
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

export async function loginWithSessionCache(
  page: Page,
  role: AdminRole,
  env: EnvName,
  doFreshLogin: () => Promise<void>,
): Promise<void> {
  const restored = await tryRestoreCachedSession(page, role, env);
  if (restored) {
    console.log(`✓ Reused cached session for role="${role}" env="${env}"`);
    return;
  }

  await doFreshLogin();
  await saveSessionCache(page, role, env);
}
