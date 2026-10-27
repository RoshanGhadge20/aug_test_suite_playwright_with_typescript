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

/** Returns null when the cache file is usable, else a short reason why it is not. */
function sessionCacheRejection(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return "no saved session file";
  try {
    const state = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as StorageStateShape;
    const token = readUserDetailsToken(state);
    if (!token) return "saved session has no UserDetails token";
    const exp = decodeJwtExpiry(token);
    if (!exp) return "saved token has no readable expiry";
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (exp - EXPIRY_SAFETY_BUFFER_SECONDS <= nowSeconds) {
      return `saved token expired (${new Date(exp * 1000).toISOString()})`;
    }
    return null;
  } catch {
    return "saved session file is unreadable";
  }
}

/** True when the cache file exists, parses, and its token's exp is safely in the future. */
function isSessionCacheValid(filePath: string): boolean {
  return sessionCacheRejection(filePath) === null;
}

/** Token currently held by the page (localStorage UserDetails), or null. */
async function readPageToken(page: Page): Promise<string | null> {
  return page
    .evaluate(() => {
      try {
        const raw = window.localStorage.getItem("UserDetails");
        return raw ? ((JSON.parse(raw).Token as string) ?? null) : null;
      } catch {
        return null;
      }
    })
    .catch(() => null);
}

/**
 * True when the page is already signed in as `role` — its live token is the saved one for that
 * role, still unexpired, and the app is not on an /auth/* route. Lets callers skip the whole
 * logout/login round-trip when the right user is already in.
 */
export async function isAlreadySignedInAs(
  page: Page,
  role: AdminRole,
  env: EnvName,
): Promise<boolean> {
  const filePath = sessionCachePath(env, role);
  if (!isSessionCacheValid(filePath)) return false;
  if (page.url().toLowerCase().includes("/auth/")) return false;
  try {
    const saved = readUserDetailsToken(
      JSON.parse(fs.readFileSync(filePath, "utf8")) as StorageStateShape,
    );
    const live = await readPageToken(page);
    return !!saved && saved === live;
  } catch {
    return false;
  }
}

/**
 * Drops the browser-side session (localStorage, sessionStorage, cookies) WITHOUT clicking the
 * app's Sign Out. Sign Out calls the backend, which revokes the token we saved for that role, so
 * the next restore was always rejected and a fresh OTP login ran. A client-side clear leaves the
 * saved tokens valid on the server.
 */
export async function clearClientSession(page: Page): Promise<void> {
  await page
    .evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    })
    .catch(() => {});
  await page.context().clearCookies();
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
  const rejection = sessionCacheRejection(filePath);
  if (rejection) {
    console.log(`↻ Fresh login for role="${role}": ${rejection}.`);
    return false;
  }

  try {
    const state = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as StorageStateShape;
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
      console.log(
        `↻ Fresh login for role="${role}": the server rejected the saved token (redirected to /auth/).`,
      );
      return false;
    }

    const profileIcon = page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    const profileVisible = await profileIcon
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (!profileVisible) {
      console.log(
        `↻ Fresh login for role="${role}": dashboard profile icon did not appear after restoring the saved session.`,
      );
    }
    return profileVisible;
  } catch (err: any) {
    console.log(
      `↻ Fresh login for role="${role}": restoring the saved session failed (${err?.message ?? err}).`,
    );
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
