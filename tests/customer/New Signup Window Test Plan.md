65-# New Signup / New Registration / KYC — Automation Test Plan

**Application:** Augmont Customer Portal (UAT) — `https://cp.gfau.augmont.com`
**Panel:** `customer` (this project's existing `pages/customer/*` / `tests/customer/*` layer)
**Prepared for:** Playwright + TypeScript automation (this repo)
**Status:** Ground-truth verified against the live UAT app on 2026-07-06 via a manual/scripted Playwright exploration (screenshots, DOM dumps, and a network-call log captured for every screen below). Not a spec written from assumptions.

---

## 1. Objective & Scope

Document the complete New Registration → KYC journey on the customer portal in enough functional detail that Playwright automation (page objects, fixtures, specs) can be implemented directly from this document, per this repo's existing conventions (see root `CLAUDE.md`): Page Objects hold locators/actions only, specs hold assertions, tests are tagged `@smoke`/`@regression` + `@customer` (+ feature tag), and OTP-based auth uses the environment's backdoor OTP (`UAT_CUSTOMER_USER_OTP`).

**Scope boundary (important, read before automating):** this app has **no separate "Sign Up" form**. Registration is implicit — see §2. The deepest point reachable in the KYC journey without touching a live third-party/government system is the **KARZA PAN-verification hand-off modal**; anything past "Proceed for PAN Verification" (KARZA, and presumably Aadhaar/DigiLocker beyond it) is **out of automation scope** and is documented here only as a UI/navigation boundary to assert against (button exists, click opens external redirect, do not follow it in CI).

---

## 2. Key Findings From Exploration (read first)

1. **No dedicated "New Registration" entry point exists.** The `/login` page has one field: mobile number. There is no "Sign up" / "Create account" link anywhere. Entering an **unregistered** mobile number and completing the same OTP flow used for login **silently creates a new account**. "Registration" and "Login" are the same code path, forking only on whether the mobile number pre-exists.
1b. **UPDATE (confirmed 2026-07-06, post-automation): where OTP verification lands for a brand-new number is not fixed.** The original exploration observed every fresh number going through `/login/verify-pin` (first-time PIN setup) before reaching `/dashboard`. Running the automated `TC_Registration_001` suite against live UAT the same day showed the opposite 4 times in a row: OTP verification called `POST /api/customer/sign-up` directly, skipped `/login/verify-pin` entirely, and landed the user — already authenticated — on a promotional page (`/digital-gold/buy`). Confirmed via network log (`sign-up` call, not `verify-customer-login`) and by successfully reaching `/dashboard` and `/kyc/digi-kyc` directly afterwards with no re-login prompt. **Both branches are real and automation must treat both as valid outcomes** — do not assume PIN-setup always appears for new accounts. Root cause (A/B rollout, timing, campaign parameter, etc.) is unconfirmed; `pages/customer/login.page.ts`'s `registerOrLoginCustomer()` handles this by waiting for "any URL other than `/login/verify-otp`" and only running PIN-setup if that screen actually appears, then explicitly navigating to `/dashboard` if the app didn't land there on its own.
2. **No upfront name/email/password form.** The new account is auto-populated with placeholder data (see §4, Screen 5) — name "test name", email `test<last4digitsOfMobile>@gmail.com`, gender `M`, DOB `20/06/2003`. This is a UAT-environment quirk, not a real registration form; production may differ, but automation must target what UAT actually does.
3. **The backdoor OTP `123456` works for brand-new/unregistered numbers too**, not just the pre-provisioned `UAT_CUSTOMER_USER_MOBILE`. Confirmed on two independently generated numbers.
4. **KYC (PAN + DOB collection) is the only in-app KYC step.** Submitting it opens a modal that hands off to a third party, **KARZA**, for actual PAN verification (and presumably Aadhaar/DigiLocker after that — never reached). No network call fires until "Proceed for PAN Verification" is clicked; that click was **not** exercised during exploration and should not be exercised in CI either, since it leaves the app under test.
5. **No CAPTCHA anywhere in the flow.**
6. **Two field-validation UX patterns exist and automation must distinguish them:**
   - *Silent-disable* fields (mobile number on login, email on profile-edit): invalid input never shows inline error text — the only observable signal is the submit/continue button staying `disabled`.
   - *Inline-error* fields (PAN, DOB-required, PIN-mismatch, OTP-incorrect): a visible red error message appears.
7. **PrimeNG `p-calendar` DOB inputs cannot be `.fill()`'d** — the Angular form control ignores a typed value even though the visible text updates, leaving the field in a "required" validation state. DOB must be set by driving the calendar widget's year → month → day click sequence (reference implementation captured in exploration artifacts, to be ported into a shared page-object helper — see §13).
8. **Session state survives both hard reload and browser back-button** at every point tested — no forced re-login. This simplifies negative-path design (no need to guard against surprise logouts during these interactions).
9. Full screen-by-screen inventory, validation copy, and network calls are in §4 below — all captured directly from the live app, not inferred.

---

## 3. Flow Diagram

```
Marketing Home (/)
  └─ "Log In / Sign Up" (header link)
Login — Mobile Entry (/login)
  └─ Continue  [same screen for unregistered numbers → this IS registration]
Login — Verify OTP (/login/verify-otp)
  └─ Verify OTP  [backdoor 123456 accepted for new numbers too]
       ├─ BRANCH A: Login — Set Security PIN (/login/verify-pin?isQuestionAsk=false)   [observed in original exploration]
       │    └─ Proceed → Dashboard
       └─ BRANCH B: already-authenticated, lands directly on a promotional page
            (e.g. /digital-gold/buy), PIN-setup skipped entirely   [observed 4/4 in automated re-run, 2026-07-06 — see §2 item 1b]
            └─ navigate to /dashboard manually to continue
Dashboard (/dashboard)                       ["KYC Pending" badge shown]
  └─ user menu → "Kyc"
KYC — Digi KYC / PAN Card Details (/kyc/digi-kyc)
  └─ Verify (PAN + DOB, client-side validation only)
       └─ Modal: "Experience Smooth KYC with KARZA"
            ├─ Cancel → back to form                              [in scope]
            └─ "Proceed for PAN Verification" → external redirect [OUT OF SCOPE]
User menu → "My Profile" (/my-profile)
  └─ pencil icon → edit modal (firstName/lastName/mobile[locked]/email/gender/DOB) → "Update Profile"
```

Side branch: OTP resend (SMS/Call) exercised independently on a second, throwaway mobile number.

---

## 4. Screen-by-Screen Documentation

### 4.1 Marketing Home

| | |
|---|---|
| **Purpose** | Public landing page; sole entry point into auth |
| **URL** | `https://cp.gfau.augmont.com/` |
| **Navigation path** | Direct load |
| **Key element** | Link "Log In / Sign Up" → `href="/login"` (hidden below `lg` breakpoint — desktop viewport required) |
| **Recommended locator** | `page.getByRole('link', { name: 'Log In / Sign Up' })` |
| **Mandatory/optional fields** | none |

---

### 4.2 Login / Mobile Number Entry *(doubles as registration entry)*

| | |
|---|---|
| **Purpose** | Single entry point for both existing-user login and new-user registration |
| **URL** | `/login` |
| **Navigation path** | Home → "Log In / Sign Up" |

**Fields**

| Field | Locator | Type | Mandatory | Validation rule | Error surfaced |
|---|---|---|---|---|---|
| Mobile Number | `#mobileNumber` | text, `maxLength=10`, static "+91" prefix | Yes | Must be 10 digits, first digit `6`–`9` (regex-equivalent, JS-only, no HTML `pattern`) | **None shown** — Continue button stays `disabled` |

**Buttons**

| Text | Locator | State rule |
|---|---|---|
| Back | `page.getByRole('button', { name: 'Back' })` | always enabled |
| Continue | `page.getByRole('button', { name: 'Continue' })` | disabled until valid mobile number entered |

**Static content:** "By proceeding, I accept T&Cs and consent to contact" (plain text, **not** a checkbox) + `T&Cs` link → `/terms-conditions`.

**Validation behavior (verified):**
- Blank → Continue disabled.
- `12345` (short) → Continue stays disabled, no error text.
- `1234567890` (10 digits, invalid leading digit) → Continue stays disabled, no error text.
- Valid number → Continue enables immediately, no blur/debounce needed.

**Network:** none until Continue is clicked → then `POST /api/customer/app/check-device-pin` (200).

---

### 4.3 OTP Verification

| | |
|---|---|
| **Purpose** | Verifies the mobile number entered in 4.2; identical for login and registration |
| **URL** | `/login/verify-otp` |
| **Navigation path** | Mobile Entry → Continue |

**Fields:** 6 unlabeled single-digit inputs, `type=text`, `maxLength=1`, no shared wrapper id/class beyond generic PrimeNG styling (`p-inputtext w-11 …`). **Do not assume `#pin input` works here** — verify against live DOM; scope by `page.locator('input')` on this screen (exactly 6 present) as a fallback.

**Buttons**

| Text | Notes |
|---|---|
| Back | enabled |
| `+91XXXXXXXXXX` (mobile number as link) | returns to edit the number |
| Verify OTP | disabled until all 6 digits filled |
| SMS / Call | **hidden until the countdown reaches 0** (~60s); these are the resend triggers |

**Helper/countdown text:** "OTP expires in 00:59" → on expiry replaced by "Didn't receive an OTP?" + SMS/Call buttons.

**Validation (verified):**
- Wrong OTP (e.g. `999999`) → **inline red banner: "Error — The OTP entered is incorrect."** Stays on same URL; inputs not auto-cleared.
- Correct backdoor OTP `123456` → proceeds to PIN setup (or straight to dashboard if PIN already set on a pre-existing account).
- Resend (SMS) → resets countdown to ~00:59; no cooldown/rate-limit message observed on a single resend attempt (untested beyond one resend).

**Network:** `POST /api/customer-otp/customer-send-otp` (send/resend), `POST /api/auth/verify-customer-login` (400 wrong OTP / 200 correct OTP).

---

### 4.4 Set Security PIN *(first-time / "password creation" equivalent)*

| | |
|---|---|
| **Purpose** | First-time 6-digit PIN setup for a newly created account — this app has no password field; the PIN is the closest analogue |
| **URL** | `/login/verify-pin?isQuestionAsk=false` |
| **Navigation path** | OTP Verification → Verify OTP (new account only) |

**Fields:** 12 unlabeled single-digit inputs (first 6 = new PIN, last 6 = confirm), same generic styling as OTP boxes, no stable wrapper id.

**Buttons**

| Text | State rule |
|---|---|
| Back | enabled |
| Proceed | disabled until both 6-digit groups filled **and** equal |

**Validation (verified):**
- Mismatched PIN groups → **live inline error "PINs do not match. Please try again"**, appears without submitting, Proceed stays disabled.
- Matching PIN groups → error clears, Proceed enables.
- Proceed → navigates directly to `/dashboard`. **No name/email/DOB/PAN is collected at this step.**

**Network:** `POST /api/customer/app/add-pin` (200).

---

### 4.5 Dashboard *(post-registration landing / "registration completion" screen)*

| | |
|---|---|
| **Purpose** | Confirms account creation; functions as this app's "Success screen" for registration |
| **URL** | `/dashboard` |
| **Navigation path** | Set Security PIN → Proceed |

**Auto-generated placeholder profile (UAT-only behavior, verify still true before relying on it in new environments):**

| Field | Observed value | Pattern |
|---|---|---|
| Name | "test name" | static placeholder |
| Email | `test9988@gmail.com` (for mobile ending `9988`) | `test<last4digitsOfMobile>@gmail.com` — spot-checked once, re-verify with a second number before hard-coding assumptions in tests |
| Gender | `M` | static |
| DOB | `20/06/2003` | static |

**Key elements:**
- `KYC Pending` badge — decorative amber pill, **not clickable** (confirmed via failed click, intercepted by banner).
- User menu trigger (top-right "T test name" pill, desktop viewport ≥ ~1024px only) → dropdown: **My Profile / My Orders / Cart / Customer Support / Kyc / Request Statement / Logout**.
  - Recommended locator: prefer a class/structural selector (e.g. `.user-dropdown`) over text — the display name is placeholder data and will vary per account.
- `Kyc` menu item → `/kyc/digi-kyc` directly; there is **no separate KYC hub page** (`/kyc` resolves to the same content).

**Network on load:** `GET /api/customer/app/config-detail`, `.../client-logo/web`, `.../gold-rate`, `/api/digital-gold/rates`, `.../login-screen-config`, `.../new-banner/web`, `.../customer-profile-detail`, `.../personal-info`, `.../customer-balance-info`, `.../customer-wallet/wallet-balance`, `/api/digital-gold/customer/passbook-details`, `/api/sip/sip-data/all-sip`, `.../referral-code`, `.../fd/scheme/passbook` (plus GA4/Firebase/Razorpay/YouTube third-party noise — filter these out of assertions).

---

### 4.6 KYC — Digi KYC / PAN Card Details

| | |
|---|---|
| **Purpose** | Only in-app KYC data-collection step; hands off to KARZA for actual verification |
| **URL** | `/kyc/digi-kyc` (breadcrumb: Home / Kyc / Digi KYC) |
| **Navigation path** | Dashboard → user menu → Kyc |

**Fields**

> **UPDATE (confirmed 2026-07-06, post-automation):** this screen now has **5 fields, not 2**. The original exploration only found PAN + DOB; automating against it surfaced **State**, **City/District**, and **Email** as additional mandatory fields, none of which are pre-filled (the "sample PAN pre-fill" behavior documented below was also not reproduced on later runs — treat pre-fill as unreliable, always explicit-fill in tests). See New Signup Window Test Plan.md §26 items 19-20.

| Field | Locator | Type | Mandatory | Pre-filled? | Validation rule | Error text |
|---|---|---|---|---|---|---|
| PAN Number | `#panCardNumber` | text, placeholder "Enter PAN Number" | Yes | Originally observed pre-filled with sample `DPHPK8795C`; **not reproduced on later runs** — do not rely on pre-fill | Standard PAN format (`AAAAA9999A`), Angular reactive-form validated (no HTML `pattern`) | "PAN Number is required" (blank) / "Enter a valid PAN Number" (bad format) |
| DOB | `#dateOfBirth` (PrimeNG `p-calendar`) | text-look, placeholder "Enter Date of Birth" | Yes | Originally observed pre-filled with `20/06/2003`; **not reproduced on later runs** | Must be selected via calendar widget; **`.fill()` does not register with the form control** | "DOB is required" |
| State | `div.p-dropdown` (1st of 2 on this form) | PrimeNG dropdown, placeholder "Enter State" | Yes | No | Click to open, click a `li[role="option"]` matching the state name (37 Indian states/UTs) | "Select a State" |
| City/District | `div.p-dropdown` (2nd of 2) | PrimeNG dropdown, placeholder "Enter City/District" | Yes | No | **Cascading on State** — its option list only populates after a State is selected (confirmed: selecting "Maharashtra" produced 52 Maharashtra cities) | "Select a City/District" |
| Email | `#email` | text, placeholder "Enter Email" | Yes | No | Standard email format | "Email is required" |

**Buttons:** `Verify` — no native `disabled` attribute was observed even with fields blank; clicking always triggers full-form validation, surfacing whichever fields are still invalid (State/City/Email errors appear independently of PAN/DOB state).

**Validation (verified):**
- Blank submit → "PAN Number is required" and "DOB is required" shown (and, now that they're documented, State/City/Email show their own required errors too).
- Invalid PAN format (e.g. `1234ABCD5`) → "Enter a valid PAN Number".
- Valid PAN + valid adult DOB + a selected State + a selected City + a valid email → no errors, Verify opens the modal.
- Verify click with valid data → **client-side only, no network call** — opens modal:
  - **"Experience Smooth KYC with KARZA"** / "You'll be redirected to a secure external link to complete your PAN verification."
  - **Cancel** → closes modal, returns to form (safe, in scope).
  - **"Proceed for PAN Verification"** → external redirect (**out of automation scope** — do not click in CI; assert only that the button exists/is visible).
- Underage/future-DOB business-rule rejection was **not** conclusively exercised (calendar UI allowed browsing to the current date with no visible guard) — **flag as an open item for manual/exploratory verification** before writing an automated boundary test for it.

**Reload/back-button (verified):**
- `page.reload()` → stays on `/kyc/digi-kyc`, session intact, form re-shows defaults (no "unsaved changes" warning).
- `page.goBack()` **depends on how you arrived**: via the dashboard user-menu (Dashboard → Kyc), the browser history has an intermediate `/kyc` entry (the Angular route that resolves to `/kyc/digi-kyc` as its default child), so `goBack()` lands on `/kyc`, rendering identically (no separate hub page) — matches the original exploration. Via a **direct** `page.goto('/kyc/digi-kyc')` (no intermediate `/kyc` history entry), `goBack()` instead returns to whatever page preceded that goto (e.g. `/dashboard`) — confirmed live, this is a navigation-history artifact, not a bug. Automated tests asserting this specific back-button behavior must navigate via the menu, not a direct goto.
- **Also confirmed live:** navigating to `/kyc/digi-kyc` right after `registerOrLoginCustomer()` (whether via direct goto or the dashboard menu) can hit the same post-registration "grace window" bounce-back documented for `/login` (§26 item 14) — landing briefly on `/kyc/digi-kyc` before redirecting to a promotional page (e.g. `/digital-gold/buy`) a moment later. `KycDigiKycPage.open()` now retries against a deadline with a settle-then-recheck pattern rather than trusting a single navigation.

---

### 4.7 My Profile (view) & Edit Modal *(closest equivalent to "Personal Details")*

| | |
|---|---|
| **Purpose** | View/edit the placeholder profile created at registration |
| **URL** | `/my-profile` |
| **Navigation path** | Dashboard → user menu → My Profile |

**View mode:** avatar initial, name, email (with green "Verified" badge), "My Funds ₹0.00" + Apply Coupon, Gender, DOB, Phone number, and zeroed stat tiles (Investment Value, Upcoming/Pending Payments, Active Loans, Gold Sold). Edit affordance: pencil icon (`.pi-pencil` class-based — **no accessible name; recommend requesting an `aria-label` from dev**).

**Edit modal fields**

| Field | Locator | Mandatory | Notes |
|---|---|---|---|
| First Name | `#firstName` | Yes | pre-filled "test" |
| Last Name | `#lastName` | Yes | pre-filled "name" |
| Mobile Number | `#mobileNumber` | — | **disabled**, shows "Verified" badge; change via separate "Change Mobile Number" link, not this modal |
| Email Id | `#email` | Yes (marked `*`) | pre-filled placeholder email |
| Gender | PrimeNG dropdown `.p-dropdown-trigger` | Yes | showed "Male"; options not enumerated in exploration — enumerate before writing a dropdown-selection test |
| DOB | `#dateOfBirth` (same calendar widget/limitation as §4.6) | Yes | pre-filled |

**Buttons:** `Update Profile` (disabled while any field invalid), avatar "Add +" (photo upload, unexplored), modal close `×`.

**Validation (verified):** invalid email (`not-an-email`) → **no inline error text**, `Update Profile` silently stays disabled (same silent-disable pattern as §4.2). No network call fires while merely typing invalid input.

---

### 4.8 Not Reached (documented as scope boundary only)

| Screen | Status |
|---|---|
| Email verification (dedicated) | Does not exist as a separate step in this app |
| Terms & Conditions (dedicated acceptance screen) | Does not exist — only static text + link on login screen, no checkbox to assert |
| Aadhaar Verification | Not reached — gated behind the KARZA redirect |
| CKYC / DigiLocker / eKYC | Not reached — presumably behind/after KARZA |
| Nominee Details | Not encountered anywhere in the explored flow |
| Bank Details | Not encountered in registration/KYC (exists elsewhere in the app for withdrawals, out of this flow's scope) |

Automation should assert these are *absent* where relevant (e.g., no separate email-verification route exists) rather than attempt to build tests against speculative screens.

---

## 5. Positive Test Scenarios

| # | Scenario |
|---|---|
| P1 | New unregistered mobile number → valid OTP → set matching PIN → lands on `/dashboard` with "KYC Pending" badge visible |
| P2 | Existing registered mobile number → valid OTP → skips PIN-setup (already set) → lands on `/dashboard` |
| P3 | From Dashboard, navigate to Kyc via user menu → lands on `/kyc/digi-kyc` with pre-filled sample data |
| P4 | Clear PAN/DOB, enter valid-format PAN + valid adult DOB (via calendar) → Verify → KARZA modal appears |
| P5 | KARZA modal → Cancel → returns to KYC form with fields intact |
| P6 | OTP screen → let timer expire → click SMS resend → new OTP round accepted with backdoor code |
| P7 | Dashboard → My Profile → view all placeholder fields render correctly |
| P8 | My Profile → edit modal → valid firstName/lastName/email edits → Update Profile enabled |
| P9 | Reload on `/kyc/digi-kyc` → session remains authenticated, form re-defaults |
| P10 | Browser back from `/kyc/digi-kyc` → lands on equivalent `/kyc` content, still authenticated |

## 6. Negative Test Scenarios

| # | Category (per spec) | Scenario | Expected (verified) behavior |
|---|---|---|---|
| N1 | Blank mandatory fields | Submit blank mobile | Continue stays disabled, no text error |
| N2 | Blank mandatory fields | Submit blank PAN + DOB on KYC | "PAN Number is required" + "DOB is required" shown |
| N3 | Invalid mobile number | 5-digit number | Continue stays disabled |
| N4 | Invalid mobile number | 10 digits, invalid leading digit (not 6–9) | Continue stays disabled |
| N5 | Existing mobile number | Enter an already-registered number | Skips PIN-setup step (goes straight to dashboard after OTP) — **not an error path**, a branch; assert the branch, not a failure |
| N6 | Invalid email | `not-an-email` in profile-edit modal | No inline error; Update Profile stays disabled |
| N7 | Existing email | *(not exercised — no dedicated email-registration field exists to test this against; flag as N/A for this app)* | N/A |
| N8 | Invalid OTP | Wrong 6-digit code | "Error — The OTP entered is incorrect." banner |
| N9 | Incorrect OTP (repeat attempts) | Multiple wrong submissions | Verify actual max-attempt/lockout behavior manually — **not exercised**, open item |
| N10 | Expired OTP | Wait past countdown, submit old code | **Not exercised** — open item; likely returns same "incorrect" error or a distinct "expired" message, verify manually before writing an automated assertion |
| N11 | OTP resend | Resend before timer expiry | SMS/Call buttons are hidden until timer hits 0 — assert their absence pre-expiry as well as presence post-expiry |
| N12 | Max OTP attempts | Repeated resends | **Not exercised** — open item; check for a resend-count cap |
| N13 | Weak password | *(no password field exists — see PIN below)* | N/A |
| N14 | Password mismatch (PIN) | Two different 6-digit PIN groups | Live inline "PINs do not match. Please try again", Proceed disabled |
| N15 | Invalid PAN | Bad format e.g. `1234ABCD5` | "Enter a valid PAN Number" |
| N16 | Invalid Aadhaar | *(unreachable — behind KARZA redirect)* | N/A / out of scope |
| N17 | Invalid DOB | Underage or future date | **Not conclusively exercised** (calendar allowed browsing to today with no visible guard) — open item, verify business rule manually |
| N18 | Invalid address | *(no address field encountered in this flow)* | N/A |
| N19 | Browser refresh | Reload mid-KYC-form | Session intact, form re-defaults, no data loss beyond re-defaulting |
| N20 | Browser back | Back button mid-KYC | Session intact, lands on equivalent route |
| N21 | Session timeout | Idle past token expiry | **Not exercised** — open item; needs a long-idle or token-manipulation test, likely via API-level token expiry rather than a 30+ minute UI wait |
| N22 | Network interruption | Offline mid-submit (e.g. `page.route` abort) | **Not exercised** — recommend `page.context().setOffline(true)` around the OTP-verify or Update-Profile call and assert a graceful error state, not a crash |
| N23 | Duplicate registration | Re-enter a number already fully registered | Same as N5 — routes to login, not a duplicate-account error |
| N24 | Invalid KYC details | Valid-format-but-fake PAN (e.g. `AAAAA9999A`) | Passes client-side validation (format-only check) — real validity is only checked after the KARZA hand-off, which is out of scope; document this as a client-vs-server validation gap |

## 7. Boundary Value Testing

| Field | Boundary cases |
|---|---|
| Mobile number | 9 digits / 10 digits / 11 digits; leading digit 5 (invalid) vs 6 (valid boundary) vs 9 (valid) |
| OTP | 5 digits / 6 digits / 7 digits (input `maxLength=1` per box caps this structurally — test via `pressSequentially` overflow) |
| PIN | Same as OTP — 6 boxes × 2 groups |
| PAN | 9 chars / 10 chars (valid) / 11 chars; correct pattern `AAAAA9999A` vs one character off in each position class (letter where digit expected, etc.) |
| DOB | Exactly 18 years old today (adult boundary — open item per N17), 1 day before 18th birthday, far-past date (e.g. 1900), today's date, future date |
| Name fields | Single character, very long string, non-Latin characters, leading/trailing whitespace |

## 8. Field Validation Testing

Covered inline per-field in §4 tables. Summary of the two validation UX classes to encode as reusable assertions:
- **Silent-disable class** (mobile number, profile-email): assert `expect(button).toBeDisabled()`.
- **Inline-error class** (PAN, DOB-required, PIN-mismatch, OTP-incorrect): assert `expect(errorLocator).toHaveText('<exact copy>')`.

## 9. UI Validation

- Verify pre-fill values render correctly on first KYC visit and My Profile view (name, email, gender, DOB, sample PAN).
- Verify "KYC Pending" badge visibility and non-interactivity.
- Verify user-menu items list matches: My Profile / My Orders / Cart / Customer Support / Kyc / Request Statement / Logout.
- Verify responsive behavior: header "Log In / Sign Up" link and user-menu trigger are hidden below the `lg` breakpoint — cross-check whether a mobile-nav equivalent exists (not explored; open item).
- Verify countdown timer text format and transition from "OTP expires in mm:ss" to "Didn't receive an OTP?".

## 10. Navigation Validation

- Direct deep-link to `/kyc` resolves to the same content as `/kyc/digi-kyc` (no dedicated hub route) — assert this equivalence explicitly.
- Direct deep-link to `/dashboard`, `/my-profile`, `/kyc/digi-kyc` while unauthenticated should redirect to `/login` — **not verified in this exploration; add as a required negative test** since it wasn't in scope of the registration walkthrough.
- Verify `Back` buttons on mobile-entry/OTP/PIN screens return to the expected prior step.

## 11. API Validation Points

| Endpoint | Method | When fired | Assert |
|---|---|---|---|
| `/api/customer/app/check-device-pin` | POST | Continue clicked (mobile entry) | 200, response shape indicates new vs existing device/PIN state |
| `/api/customer-otp/customer-send-otp` | POST | OTP send + resend | 200 |
| `/api/auth/verify-customer-login` | POST | Verify OTP click | 400 on wrong OTP (assert error body), 200 on correct |
| `/api/customer/app/add-pin` | POST | PIN Proceed click | 200 |
| `/api/customer/app/customer-profile-detail`, `/api/customer/app/personal-info` | GET | Dashboard/profile load | 200, shape matches displayed placeholder fields |
| `/api/customer/app/config-detail`, `/api/customer/app/gold-rate`, `/api/digital-gold/rates`, etc. | GET | App bootstrap / dashboard load | 200 — use `page.waitForResponse()` as a sync point, not as functional assertions (out of this feature's scope) |
| *(KARZA hand-off)* | — | Never fires client-side until "Proceed for PAN Verification" | Assert **no** network call is made merely by opening the modal — regression-guards against an accidental early redirect |

Recommend wiring these via the project's existing `authedRequest`/`apiAuthConfig` pattern (`fixtures/api.fixture.ts`, `utils/api/api-auth.ts`) for any pure-API-level registration tests, separate from the UI-driven specs.

## 12. Database Validation Points

Out of reach for this suite (no direct DB access documented in this repo's fixtures). Where relevant, validate indirectly via API responses instead:
- New account creation → confirm via `GET /api/customer/app/customer-profile-detail` returning the newly registered mobile number.
- PIN set → implied by `/add-pin` returning 200 and subsequent login (without PIN-setup) succeeding on the same number.
- KYC PAN submission (once KARZA hand-off is mockable/testable) → would need a `KYC Pending` → `KYC Verified`/`In Review` status transition check via profile/KYC-status API, not observed in this pass since the flow wasn't completed.

## 13. Security Validation

- Confirm mobile-number field cannot be scripted to bypass the `disabled` Continue button (e.g., forcing a submit event) — the app should still reject it server-side (`check-device-pin` / `send-otp` calls with a malformed number).
- Confirm OTP verification is rate-limited server-side even though this wasn't observed client-side (N9/N12 open items) — test by scripting rapid repeated wrong-OTP submissions via the API layer, not just UI.
- Confirm the mobile-number field on the profile-edit modal really is immutable (`disabled` attribute) and cannot be re-enabled via DOM manipulation to submit a changed value — attempt a direct API call to the profile-update endpoint with a different mobile number and confirm it's rejected/ignored server-side.
- Confirm session cookies/localStorage tokens are set with appropriate flags (HttpOnly/Secure) — inspect via `page.context().cookies()`.
- Confirm the KARZA redirect is over HTTPS and to an expected domain (verify the modal's actual redirect target once willing to click it in a controlled, non-CI environment).

## 14. Accessibility Considerations

- OTP/PIN inputs have **no associated `<label>` or `aria-label`** — flag as an a11y gap; automation should note this rather than assume screen-reader compatibility.
- Pencil edit icon on My Profile has no accessible name (`.pi-pencil` icon-only) — same gap.
- Verify color-only error states (red text) also carry text content (they do, per observed copy) — good baseline, but confirm sufficient contrast ratio.
- Verify keyboard-only navigation through mobile → OTP → PIN screens (tab order across 6/12 unlabeled inputs) — not exercised, recommend as an exploratory a11y pass before automating a strict keyboard-nav test.

## 15. Cross-Browser Considerations

- Exploration was performed on Chromium only. PrimeNG calendar click-sequences and disabled-button state timing should be re-verified on Firefox and WebKit (both already installed locally per this repo's Playwright setup) before enabling those projects for this flow.
- User-menu visibility is breakpoint-dependent (`lg`/`xl` classes) — explicitly set viewport size in tests rather than relying on default, and add a mobile-viewport variant once the hamburger-menu equivalent is investigated (open item, not explored).

---

## 16. Reusable Page Objects

| Page Object | Screens covered | Notes |
|---|---|---|
| `CustomerLoginPage` *(exists: `pages/customer/login.page.ts`)* | Mobile Entry, OTP, PIN | **Extend, don't duplicate** — add an `otpInputs()`/`pinInputs()` locator (scoped `input` on the respective screens, since no stable wrapper id exists) and a `setNewPin(pin)` method alongside the existing `login()`. Consider a `registerOrLoginCustomer(mobile, otp, pin?)` method name to reflect that it's one code path. |
| `DashboardPage` *(new)* | Dashboard | User-menu trigger + dropdown items, KYC-pending badge, placeholder-profile getters |
| `KycDigiKycPage` *(new)* | `/kyc/digi-kyc` | PAN input, DOB calendar helper, Verify button, KARZA modal (Cancel / Proceed-for-verification locator only, never click Proceed) |
| `MyProfilePage` *(new)* | `/my-profile` view + edit modal | Field getters for view mode, edit-modal locators, `updateProfile()` action |
| Shared: `PrimeCalendarHelper` *(new utility, not a page object)* | KYC + Profile-edit DOB fields | Encapsulate the year→month→day click sequence once, reused by both screens |

All should extend `pages/shared/base.page.ts` per existing convention, and be injected via `fixtures/base.fixture.ts` rather than `new`'d in specs.

## 17. Locator Strategy Per Page

| Page | Preferred locators |
|---|---|
| Marketing Home | `getByRole('link', { name: 'Log In / Sign Up' })` |
| Mobile Entry | `#mobileNumber` (id, matches existing convention); `getByRole('button', { name: 'Continue' \| 'Back' })` |
| OTP | Scoped `page.locator('input')` (exactly 6 present) — no better semantic hook exists; `getByRole('button', { name: 'Verify OTP' })`, `getByText(/Didn't receive an OTP/)` |
| PIN Setup | Scoped `page.locator('input')` (exactly 12 present); `getByRole('button', { name: 'Proceed' })`; `getByText('PINs do not match. Please try again')` |
| Dashboard | Structural/class selector for user-menu trigger (`.user-dropdown` or similar — avoid text-based since display name is placeholder data); `getByRole('menuitem', { name: 'Kyc' })` inside the opened dropdown; `getByText('KYC Pending')` for the badge |
| KYC | `#panCardNumber`; `#dateOfBirth` (calendar trigger only — do not `.fill()`); `getByRole('button', { name: 'Verify' })`; `getByText('Experience Smooth KYC with KARZA')` for the modal; `getByRole('button', { name: 'Cancel' })` / `getByRole('button', { name: 'Proceed for PAN Verification' })` (existence-check only) |
| My Profile | `#firstName`, `#lastName`, `#email`; `.p-dropdown-trigger` for gender (CSS fallback — no better hook found); `#dateOfBirth` (same calendar caveat); `getByRole('button', { name: 'Update Profile' })` |

XPath is not needed anywhere in this flow — every screen has either a stable `id`, a `getByRole` target, or (for the unlabeled OTP/PIN grids) a reliable structural count-based CSS/`locator('input')` fallback.

## 18. Synchronization Strategies

| Situation | Strategy |
|---|---|
| Navigating mobile → OTP → PIN → dashboard | `page.waitForURL(/\/login\/verify-otp/)`, then `/\/login\/verify-pin/`, then `/\/dashboard(?:\/|$|\?)/` (mirrors existing `login()` pattern) |
| Continue/Verify/Proceed enabling after valid input | `expect(button).toBeEnabled()` — do not `waitForTimeout`; these are synchronous Angular form-state changes |
| OTP/PIN verification round-trip | `page.waitForResponse(resp => resp.url().includes('/api/auth/verify-customer-login'))` before asserting success/error UI |
| KYC form submit → modal | `expect(page.getByText('Experience Smooth KYC with KARZA')).toBeVisible()` — no network call to wait for (confirmed client-side only) |
| Dashboard load | `page.waitForLoadState('networkidle')` is risky here (third-party analytics/polling calls never quiesce) — prefer `waitForResponse` on a specific first-party bootstrap call (e.g. `customer-profile-detail`) instead |
| Reload/back-button resilience checks | `page.reload({ waitUntil: 'domcontentloaded' })` / `page.goBack()` then assert `page.url()` and a known element's visibility, not a blanket idle wait |
| OTP countdown expiry (to reveal resend buttons) | Avoid a real ~60s sleep in every test run — isolate resend-button tests into a dedicated, explicitly-tagged (e.g. `@slow`) spec, or investigate whether the countdown is mockable via `page.clock` |

## 19. Screenshot Capture Points (for reporting)

- After landing on each new screen in the happy path (Mobile Entry, OTP, PIN Setup, Dashboard, KYC form, KARZA modal, My Profile).
- On every negative-scenario assertion (blank submit, invalid PAN, PIN mismatch, wrong OTP) — capture the error state, not just the initial state.
- Immediately before and after any `reload()`/`goBack()` resilience check.
- On any unexpected/failed assertion (standard Playwright trace/screenshot-on-failure config already covers this — confirm `playwright.config.ts` has `screenshot: 'only-on-failure'` or equivalent for this project set).

## 20. Soft Assertions

Use `expect.soft()` for:
- The full field/button inventory checks on first load of a new screen (e.g., KYC screen: PAN pre-fill value, DOB pre-fill value, Verify button state) — so one wrong pre-fill doesn't mask other inventory mismatches in the same test.
- My Profile view-mode field-by-field checks (name, email, badge, gender, DOB, phone, all four stat tiles) — a single stale stat tile shouldn't hide a broken email display.
- Multi-field blank-submit validation on KYC (PAN-required + DOB-required both expected simultaneously).

Use hard `expect()` for:
- Anything gating subsequent steps (URL after navigation, button-enabled state before clicking it, OTP/PIN correctness) — a failure here should stop the test immediately since later steps are meaningless otherwise.

## 21. Reusable Utility Methods

| Utility | Purpose |
|---|---|
| `registerOrLoginCustomer(page, mobile, otp, pin?)` | One call to drive mobile → OTP → (PIN-setup if new) → dashboard; branches internally on whether PIN-setup appears |
| `fillOtpGrid(page, code)` / `fillPinGrid(page, code)` | Scoped-`input`-count-based fillers for the unlabeled 6-box / 12-box grids |
| `setCalendarDate(page, calendarInputLocator, { day, month, year })` | Encapsulates the PrimeNG year→month→day click sequence for both the KYC and Profile-edit DOB fields |
| `generateUnregisteredMobile()` | Random valid-format (`6-9` leading digit) 10-digit number generator, for tests needing a guaranteed-fresh registration (extend `utils/data/test-data.factory.ts`'s existing `TestDataFactory.mobile()` if it doesn't already guarantee un-registeredness) |
| `generateValidFormatPan()` | Random `AAAAA9999A`-shaped string for format-only PAN tests (extend `TestDataFactory` similarly, alongside existing `.pan()` if present) |
| `expectSilentDisable(page, inputLocator, invalidValue, buttonLocator)` | Shared assertion helper for the "silent-disable" validation class (§8) |

## 22. Reusable Test Data Requirements

| Data | Source / notes |
|---|---|
| Fresh unregistered mobile numbers | Must be generated per-test-run (UAT numbers used during exploration, `9988776655` and `9911223344`, are now consumed/registered — do not reuse them as "unregistered" fixtures) |
| Backdoor OTP | `UAT_CUSTOMER_USER_OTP` (`.env`) — confirmed to work for both existing and brand-new numbers |
| Valid-format PAN | Synthetic, e.g. `AAAAA9999A` — format-valid only, not a real verifiable PAN (KARZA verification is out of scope) |
| Invalid-format PAN | `1234ABCD5` or similar |
| Valid adult DOB | e.g. `15/01/1995` — must be driven through the calendar helper, never `.fill()` |
| Boundary DOB (exactly 18 today) | Compute dynamically relative to test run date — do not hardcode, since "18 years ago today" moves every day |
| PIN pairs | Matching 6-digit pair for positive; deliberately mismatched pair for N14 |

## 23. Edge Cases

- Registering, then immediately re-navigating to `/login` and re-entering the same (now-registered) number — should route to the "existing user, skip PIN-setup" branch, not re-trigger registration.
- Opening the KARZA modal, clicking Cancel, then immediately re-clicking Verify without changing any field — confirm the modal re-opens cleanly (no stuck state).
- Rapid double-click on `Continue`/`Verify OTP`/`Proceed` buttons — confirm no duplicate API calls fire (button should disable on click, not just on validation state).
- Switching between two in-flight registrations in separate browser contexts (as exploration did for OTP-resend testing) — confirm no session bleed between contexts.
- Deep-linking directly to `/kyc/digi-kyc` in a fresh, unauthenticated context — expected redirect to `/login` (unverified — see §10, add as required test).
- Viewport resize mid-flow (desktop → narrow) hiding the user-menu trigger — confirm no dead-end if a test resizes after opening the dashboard.
- Locale/keyboard input of non-ASCII digits into the mobile/OTP/PIN fields — confirm rejection rather than silent miscount against `maxLength`.

---

## 24. Test Case Matrix

| TC ID | Feature | Scenario | Preconditions | Test Steps | Expected Result | Priority | Automation Status |
|---|---|---|---|---|---|---|---|
| TC_REG_001 | Registration | New user completes registration end-to-end | Fresh unregistered mobile number | 1. Enter mobile → Continue 2. Enter backdoor OTP → Verify 3. Enter matching PIN twice → Proceed | Lands on `/dashboard`, "KYC Pending" badge visible | High | Not automated |
| TC_REG_002 | Login/Registration fork | Existing registered mobile skips PIN setup | Mobile already registered | 1. Enter mobile → Continue 2. Enter OTP → Verify | Lands directly on `/dashboard`, no PIN screen shown | High | Not automated |
| TC_REG_003 | Mobile validation | Blank mobile keeps Continue disabled | On `/login` | Leave field blank, observe Continue | Continue remains disabled | Medium | Not automated |
| TC_REG_004 | Mobile validation | Short mobile number rejected | On `/login` | Enter `12345` | Continue remains disabled, no error text | Medium | Not automated |
| TC_REG_005 | Mobile validation | Invalid leading digit rejected | On `/login` | Enter `1234567890` | Continue remains disabled, no error text | Medium | Not automated |
| TC_REG_006 | OTP | Wrong OTP shows error | Past mobile-entry step | Enter `999999` → Verify OTP | "Error — The OTP entered is incorrect." shown | High | Not automated |
| TC_REG_007 | OTP | Correct OTP proceeds | Past mobile-entry step | Enter backdoor OTP → Verify OTP | Navigates to PIN setup (new) or dashboard (existing) | High | Not automated |
| TC_REG_008 | OTP resend | Resend button appears only after expiry | On OTP screen | Observe screen before/after ~60s countdown | SMS/Call buttons hidden pre-expiry, visible post-expiry | Medium | Not automated |
| TC_REG_009 | OTP resend | Resend resets countdown | Countdown expired | Click SMS | Countdown resets to ~00:59 | Medium | Not automated |
| TC_REG_010 | PIN setup | Mismatched PIN shows inline error | On PIN-setup screen | Enter two different 6-digit sequences | "PINs do not match. Please try again", Proceed disabled | High | Not automated |
| TC_REG_011 | PIN setup | Matching PIN enables Proceed | On PIN-setup screen | Enter two identical 6-digit sequences | Error clears, Proceed enabled | High | Not automated |
| TC_REG_012 | PIN setup | Proceed navigates to dashboard | Matching PIN entered | Click Proceed | Lands on `/dashboard` | High | Not automated |
| TC_REG_013 | Dashboard | Placeholder profile data renders | Freshly registered account | Load dashboard | Name/email/gender/DOB placeholders visible per §4.5 | Low | Not automated |
| TC_REG_014 | Dashboard | KYC badge is non-interactive | On dashboard | Attempt click on "KYC Pending" badge | No navigation occurs | Low | Not automated |
| TC_REG_015 | Dashboard | User menu navigates to KYC | On dashboard | Open user menu → click Kyc | Navigates to `/kyc/digi-kyc` | High | Not automated |
| TC_REG_016 | KYC | Pre-filled sample data shown on first visit | Fresh account, first KYC visit | Load `/kyc/digi-kyc` | PAN and DOB pre-filled with sample values | Medium | Not automated |
| TC_REG_017 | KYC | Blank submit shows both required errors | On KYC screen, fields cleared | Clear PAN & DOB → Verify | "PAN Number is required" and "DOB is required" both shown | High | Not automated |
| TC_REG_018 | KYC | Invalid PAN format rejected | On KYC screen | Enter `1234ABCD5` → Verify | "Enter a valid PAN Number" shown | High | Not automated |
| TC_REG_019 | KYC | Valid PAN + DOB opens KARZA modal | On KYC screen | Enter valid-format PAN, select valid adult DOB via calendar → Verify | "Experience Smooth KYC with KARZA" modal appears; no network call fires | High | Not automated |
| TC_REG_020 | KYC | Cancel on KARZA modal returns to form | Modal open | Click Cancel | Modal closes, form fields retained | Medium | Not automated |
| TC_REG_021 | KYC | "Proceed for PAN Verification" button exists but is not followed | Modal open | Assert button visible/enabled only | Button present; test does **not** click it | Low | Not automated (assert-existence only) |
| TC_REG_022 | KYC resilience | Reload preserves session | On `/kyc/digi-kyc` | `page.reload()` | Same URL, session intact, form re-defaults | Medium | Not automated |
| TC_REG_023 | KYC resilience | Back button preserves session | On `/kyc/digi-kyc` | `page.goBack()` | Lands on `/kyc`, renders identically, session intact | Medium | Not automated |
| TC_REG_024 | My Profile | View mode displays all fields | Registered account | Navigate to `/my-profile` | All fields per §4.7 render correctly | Low | Not automated |
| TC_REG_025 | My Profile | Invalid email silently disables Update | Edit modal open | Type `not-an-email` in Email field | No inline error; Update Profile stays disabled | Medium | Not automated |
| TC_REG_026 | My Profile | Mobile number field is locked | Edit modal open | Attempt to edit Mobile Number field | Field is disabled, shows "Verified" badge | Low | Not automated |
| TC_REG_027 | Security | Unauthenticated deep-link redirect | No active session | Navigate directly to `/kyc/digi-kyc` | Redirects to `/login` | High | Not automated — **needs manual verification first (open item)** |
| TC_REG_028 | Security | Repeated wrong-OTP attempts rate-limited | Past mobile-entry step | Submit wrong OTP repeatedly | Server-side lockout/backoff triggers | High | Not automated — **open item, verify behavior manually first** |
| TC_REG_029 | Boundary | Exactly-18-year-old DOB accepted on KYC | On KYC screen | Select DOB = (today − 18 years) via calendar → Verify | Accepted, no age-related error | Medium | Not automated — **business rule unconfirmed, verify manually first** |
| TC_REG_030 | Edge case | Double-click Continue does not double-submit | On `/login` | Rapidly double-click Continue with valid mobile | Only one `check-device-pin`/`send-otp` call fires | Low | Not automated |

*(This matrix is representative of full coverage per §5/§6/§7; expand rows 1:1 with any additional scenarios added during implementation — keep TC IDs sequential within the `TC_REG_` prefix, consistent with this repo's `TC_<Feature>_<Number>` naming convention seen under `tests/customer/withdrawal/`.)*

---

## 25. Recommended Playwright Folder Structure

```
tests/
└── customer/
    ├── registration/
    │   ├── TC_Registration_001_NewUser_EndToEnd.spec.ts
    │   ├── TC_Registration_002_ExistingUser_Login.spec.ts
    │   ├── TC_Registration_003_MobileValidation.spec.ts
    │   ├── TC_Registration_004_OtpVerification.spec.ts
    │   ├── TC_Registration_005_OtpResend.spec.ts
    │   ├── TC_Registration_006_PinSetup.spec.ts
    │   └── TC_Registration_007_SessionResilience.spec.ts
    ├── kyc/
    │   ├── TC_Kyc_001_PanDobValidation.spec.ts
    │   ├── TC_Kyc_002_KarzaHandoffModal.spec.ts
    │   └── TC_Kyc_003_KycFormResilience.spec.ts
    ├── test-data/
    │   └── registration-data.ts        # generateUnregisteredMobile(), generateValidFormatPan(), etc.
    └── New Signup Window Test Plan.md  # this document
```

Corresponding new Page Objects (per §16), to live alongside existing customer page objects:

```
pages/customer/
├── login.page.ts        (existing — extend, do not duplicate)
├── dashboard.page.ts     (new)
├── kyc-digi-kyc.page.ts  (new)
└── my-profile.page.ts    (new)

utils/
└── calendar-helper.ts    (new — PrimeNG p-calendar date-selection helper, shared by kyc + my-profile)
```

Tag every new spec `@regression @customer @registration` or `@regression @customer @kyc` per this repo's tagging convention, plus `@smoke` on the single most critical end-to-end happy-path test (TC_REG_001).

---

## 26. Open Items Requiring Manual Verification Before Full Automation

These were flagged throughout the document and are collected here for visibility:

1. Max OTP-attempt lockout behavior (N9/N12/TC_REG_028) — not exercised.
2. OTP expiry (true server-side expiry, not just the client countdown UI) behavior (N10) — not exercised.
3. Underage/future-DOB business-rule rejection on KYC (N17/TC_REG_029) — calendar UI showed no visible guard, but Verify was never submitted with a real under-18 DOB.
4. Unauthenticated deep-link redirect behavior for `/dashboard`, `/my-profile`, `/kyc/digi-kyc` (TC_REG_027) — assumed but not observed in this pass.
5. Session-timeout behavior on a genuinely idle/expired token (N21).
6. Network-interruption handling mid-submit (N22).
7. Gender dropdown's full option list on My Profile edit (not enumerated).
8. Mobile-viewport equivalent of the user-menu (hidden hamburger, not explored).
9. Email-uniqueness / existing-email rejection (N7) — no dedicated email-registration field exists to test this against in the current flow; re-check if that changes.
10. Whatever lies beyond the KARZA hand-off (actual PAN verification result, Aadhaar/DigiLocker, nominee/bank steps) — structurally out of reach without either a KARZA sandbox or willingness to exit the app under test.
11. **(Added 2026-07-06) The post-OTP destination for a brand-new registration is not fixed** — see §2 item 1b. Confirmed real via automated re-run (`POST /api/customer/sign-up` + landing on `/digital-gold/buy`, 4/4 times), contradicting the single `/login/verify-pin` path the original manual exploration observed. `registerOrLoginCustomer()` in `pages/customer/login.page.ts` now handles both branches. **Follow-up answered:** this is NOT new-account-only — `loginWithExistingPin()` (see item 13 below) observed the *same* `/digital-gold/buy` landing on a third login for an account that already had a PIN set. The redirect appears to be a general post-auth behavior (possibly session/cache/campaign-driven), not something tied to registration specifically. Root cause (which exact condition triggers it) is still unconfirmed.
12. **(Added 2026-07-06) A "second login" only skips PIN-setup once a PIN has actually been set.** Since item 11's skip-PIN branch means a brand-new account can reach `/dashboard` with **no PIN on file**, a subsequent login for that same number correctly shows `/login/verify-pin` again (not a bug — there's genuinely nothing to check yet). `TC_Registration_002` was redesigned around this: register → 2nd login (completes PIN setup, since none exists) → 3rd login (now genuinely skips it). The original single "register once, log in again, must skip PIN" test design only holds for accounts that got a PIN during their *first* login.
13. **(Added 2026-07-06) A third, previously-undocumented login path exists: mobile number with a PIN already set.** Entering such a mobile number and clicking Continue reveals a "6 digit security pin" section on the **same** `/login` page — no `/login/verify-otp` navigation, no OTP at all. This is a fast-path distinct from both the brand-new-number OTP flow (§4.3) and the no-PIN-yet `/login/verify-pin` screen (§4.4). It turns out this is exactly what the pre-existing `login(mobile, otp)` method in `login.page.ts` already implemented (its second parameter is actually a PIN, not an OTP, despite the name) — used successfully by `auth-setup` for the shared pre-provisioned `UAT_CUSTOMER_USER_MOBILE` account for as long as this repo has had it. Refactored into a reusable `loginWithExistingPin(mobile, pin)`. §4.2/§17 should be read with this third branch in mind.
14. **(Added 2026-07-06) Logging out a freshly-registered account is unreliable if attempted immediately.** Clearing storage/cookies and navigating to `/login` right after `registerOrLoginCustomer()` bounces straight back to `/dashboard` on a clear majority of attempts — confirmed live, reproducible, and **not resolved by a fixed wait** (tried up to 15s pre-wait with no reliable improvement, then discovered a *stacked* 16s wait across two diagnostic scripts happened to succeed by chance, not by crossing a real threshold). No session-identifying cookie, localStorage, or sessionStorage value was ever observed appearing/disappearing around the bounce, so the exact server-side mechanism is unconfirmed (possibly IP/device-fingerprint-based, possibly a perpetually-refreshing background poll rather than a fixed grace window). The reliable fix was a **deadline-based retry** of clear+navigate (`logoutAndReturnToMobileEntry()`, ~60s budget, polls every ~2s) rather than any fixed wait — resolved in ~5s in practice (2 attempts). Use this method instead of `open()` whenever a test needs to log out right after creating a new account.
15. **(Added 2026-07-06) PrimeNG calendar cells render padded text (`" 2001 "`, not `"2001"`), and Playwright's `hasText` RegExp matching does not trim/normalize whitespace the way its plain-string matching does.** The original `setPrimeCalendarDate()` used `^${value}$` anchors that silently matched zero elements, surfacing as a confusing "waiting for locator to be visible" timeout rather than a clear "0 matches" error. Fixed with a whitespace-tolerant `^\s*${value}\s*$` pattern — confirmed working live (`15/01/2001` set correctly). If this widget is ever touched again, prefer inspecting actual cell text via `.textContent()` over assuming exact-match regexes will work.
16. **(Observed 2026-07-06, root cause NOT fully confirmed) `KycDigiKycPage.clickVerify()` occasionally clicked before the Angular form had actually validated as complete**, even with valid PAN/DOB already set — the KARZA modal never appeared and no error was visible either. Possibly a race between `calendar-helper.ts`'s `force: true` day-cell click (which bypasses normal event dispatch) and Angular's own change-detection cycle updating the Verify button's validity. Mitigated by waiting for `toBeEnabled()` on Verify before clicking, but only observed once — not confirmed as fully resolved.
17. **(Observed 2026-07-06, likely environment throttling, NOT a code defect) A batch of `registerOrLoginCustomer()` calls started timing out waiting for `/login/verify-otp`** after this session made roughly 40-50+ live registration attempts against UAT within a few hours (exploration + diagnostics + repeated spec runs, all from the same IP). Screenshots at failure show the mobile-entry screen sitting inert after Continue is clicked, no error shown. This pattern appeared only late in a long, heavy testing session and is the most likely explanation, but was not conclusively isolated — if it recurs on a fresh run after a cooldown period, treat it as a real bug instead.
18. **(Added 2026-07-06) The OTP-incorrect error text renders in two places at once — a `role="alert"` element and a plain `<span>` in the form — a duplicate accessibility pattern, not a bug in the app.** `getByText('The OTP entered is incorrect')` without disambiguation is a Playwright strict-mode violation ("resolved to 2 elements"), not a "not found" failure. Fixed by scoping `otpErrorBanner()`/`pinMismatchError()` in `login.page.ts` to `.first()`. Confirmed live. Any new locator targeting on-screen validation text on the OTP/PIN screens should check for this same duplication before assuming a single match.
19. **(Added 2026-07-06) Item 17's "environment throttling" theory was wrong — these were real, fixable bugs, confirmed once retested after other fixes landed.** Re-running `TC_Kyc_002`/`TC_Kyc_003` later the same session (after `TC_Registration_004` ran clean in between) surfaced the actual root causes, all now fixed: (a) the KYC form has 3 more mandatory fields than documented — see item 20; (b) `/kyc/digi-kyc` itself is subject to the same post-registration "grace window" bounce-back as `/login` (item 14), just with a *delayed* redirect — it lands and stays long enough for the PAN input to become visible, then redirects to `/digital-gold/buy` a moment later, so a check performed immediately after "visible" isn't sufficient; (c) the PrimeNG calendar can silently reset back to its default day-view mid-sequence (likely a `force: true` click landing slightly off-target during an overlay transition), which no amount of patching individual steps fixed — solved by retrying the *entire* open-picker-through-day-click sequence from scratch, not individual steps; (d) `page.goBack()` from `/kyc/digi-kyc` lands on `/kyc` **only** when reached via the dashboard user-menu (which leaves an intermediate `/kyc` history entry) — reached via a direct `goto()`, it instead returns to whatever page preceded that goto. Lesson: don't reach for "environment/throttling" as an explanation before checking whether the failure is actually deterministic and re-testable — every one of these turned out to be a real, fixable issue once investigated to completion. See `KycDigiKycPage.open()`, `calendar-helper.ts`, and `TC_Kyc_003`'s menu-based navigation for the fixes.
20. **(Added 2026-07-06) The KYC form has 3 mandatory fields beyond PAN + DOB: State, City/District, and Email** — see §4.6 for full locator/behavior details. City's option list cascades from the selected State. None of the original exploration's documented pre-fill values (sample PAN, sample DOB) were reproduced on later runs either — treat the form as starting genuinely blank.
21. **(Added 2026-07-06) `TC_Registration_006` (PIN-setup screen tests) hit both the item 1b/12 skip-PIN branch and the item 11 promotional-redirect landing, in the same spec.** Its `beforeEach` assumed the PIN-setup screen always appears after the first login — when the first login instead skipped straight to `/digital-gold/buy` (no PIN on file), the test had nothing to interact with. Fixed by falling back to a second login attempt when the first one doesn't show `/login/verify-pin` (reliable, since a PIN-less account always asks for PIN-setup — same logic as `TC_Registration_002`). Separately, completing PIN-setup itself can also land on `/digital-gold/buy` instead of `/dashboard` — the "Matching PIN groups" test now normalizes to `/dashboard` the same way `registerOrLoginCustomer()` does. Confirmed live, both tests passing.

## 27. Implementation Status (added 2026-07-06)

Page objects, fixtures, and spec files for this plan have been implemented under the folder structure in §25 and verified to run against live UAT. Automation status per test case, cross-referenced against §24:

| TC ID(s) | Implemented in | Notes |
|---|---|---|
| TC_REG_001 | `tests/customer/registration/TC_Registration_001_NewUser_EndToEnd.spec.ts` | Passing live (6+ consecutive runs). Rewritten to branch on both post-OTP destinations (§2 item 1b); adds a `TC001_7` check that the header reads "guest user" for the not-yet-completed profile. |
| TC_REG_002 | `tests/customer/registration/TC_Registration_002_ExistingUser_Login.spec.ts` | Passing live. Rewritten from a 2-login to a 3-login design per §26 item 12 (2nd login completes PIN setup since none exists yet; 3rd login proves it's then skipped) and uses the new `loginWithExistingPin()` (§26 item 13) for that 3rd login. |
| TC_REG_003, TC_REG_004, TC_REG_005 | `tests/customer/registration/TC_Registration_003_MobileValidation.spec.ts` | Blank / short / invalid-leading-digit, one test each |
| TC_REG_006, TC_REG_007 | `tests/customer/registration/TC_Registration_004_OtpVerification.spec.ts` | |
| TC_REG_008, TC_REG_009 | `tests/customer/registration/TC_Registration_005_OtpResend.spec.ts` | Tagged `@slow` — waits out the real ~60s countdown |
| TC_REG_010, TC_REG_011, TC_REG_012 | `tests/customer/registration/TC_Registration_006_PinSetup.spec.ts` | Passing live, both tests. `beforeEach` falls back to a second login when the first skips PIN-setup (§26 item 21); "Matching PIN" test normalizes post-Proceed landing to `/dashboard` |
| TC_REG_031 *(new — Back-button on OTP screen, not in the original §24 matrix)* | `tests/customer/registration/TC_Registration_007_SessionResilience.spec.ts` | |
| TC_REG_017, TC_REG_018 | `tests/customer/kyc/TC_Kyc_001_PanDobValidation.spec.ts` | Passing live, all 3 tests (including the calendar-driven one) — confirms §26 item 15's whitespace-regex fix. Plus a third test asserting Verify enables with no errors on valid input |
| TC_REG_019, TC_REG_020, TC_REG_021 | `tests/customer/kyc/TC_Kyc_002_KarzaHandoffModal.spec.ts` | Passing live, all 3 tests. Required discovering and filling the 3 undocumented mandatory fields (§26 item 20) plus the `KycDigiKycPage.open()` bounce-back retry and whole-sequence calendar retry (§26 item 19) to get here — `karzaProceedButtonLocator()` still asserted visible only, never clicked |
| TC_REG_022, TC_REG_023 | `tests/customer/kyc/TC_Kyc_003_KycFormResilience.spec.ts` | Passing live, both tests. Rewritten to navigate via the dashboard user-menu (with its own bounce-back retry) instead of a direct goto, so the back-navigation test reproduces the real `/kyc` history entry — see §4.6 and §26 item 19d |
| TC_REG_013–016, 024–030 | Not automated | Left as documented in §24 — dashboard placeholder-field assertions, KYC-badge non-interactivity, menu-driven KYC navigation, KYC pre-fill assertions, My Profile field checks, and the three flagged-open-item cases (unauth redirect, OTP lockout, 18-year boundary) |

**Every implemented spec except `TC_Registration_003`, `005`, and `007` (`TC_Registration_001`/`002`/`004`/`006`, `TC_Kyc_001`/`002`/`003`) has now been confirmed passing against live UAT**, several after multiple rounds of live debugging that surfaced real app behavior not caught by the original manual exploration (see §26 items 11-21). `TC_Registration_003`, `005`, `007` compile cleanly (`npm run typecheck`) and share the same underlying page-object fixes, but were not individually re-executed live in this pass — recommend running them at least once (`npx playwright test --project=customer --grep "@registration|@kyc" --grep-invert @slow`) before fully trusting the suite in CI.
