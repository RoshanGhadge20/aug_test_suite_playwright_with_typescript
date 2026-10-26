# Goal-Based SIP — Automation Test Plan

**Application:** Augmont Customer Portal (UAT) — `https://cp.gfau.augmont.com/goal-wise-sip`
**Source CRs:** three user stories — GBSIP-001 (Wedding / Education / Home), GBSIP-002 (Gold Coins), GBSIP-003 (Silver) — pasted into this session, not yet filed as separate tracked documents.
**Status:** Grounded in live exploration on 2026-09-01 against the existing `Retirement01092026` account (KYC-verified, storage state `customer`). First automation landed the same day: `pages/customer/goal-wise-sip.page.ts` + two specs under `tests/customer/goal-based-sip/` covering Wedding's positive and negative paths (§6). Coverage has since grown to include Special Ones, Home, and Education, each in their own subfolder.

## 1. Objective & Scope

Document the Goal-Based SIP feature (goal creation, tracking, Save More, Withdraw, Rename, Delete) in enough functional detail that Playwright automation can be implemented directly from it, per this repo's conventions (`CLAUDE.md`): Page Objects hold locators/actions only, specs hold assertions, tests tagged `@smoke`/`@regression` + `@customer` + `@goalwisesip`.

**Naming collision, resolved 2026-09-16:** this feature used to share `tests/customer/goalwisesip/` with 38 unrelated `TC_GoalWiseSip_0XX` user-segment stub specs (dashboard user cohorts, no browser interaction — see `[[feedback_goalwisesip_isolated_edits]]`), which made the `@goalwisesip` tag ambiguous between two entirely different concepts. Those 38 stubs have been renamed to `TC_UserWiseSip_0XX` and moved to `tests/customer/userwisesip/` under the `@userwisesip` tag; this feature now lives on its own at `tests/customer/goal-based-sip/`, one subfolder per goal type (`wedding-goal/`, `special-ones-goal/`, `home-goal/`, `education-goal/`), and `@goalwisesip` unambiguously means this feature going forward.

## 2. Live Exploration Findings (confirmed 2026-09-01)

### 2.1 Goal-type selection screen (`/goal-wise-sip`)

"Choose your savings goal" renders **6 cards**, not the 3 (Wedding/Education/Home) implied by GBSIP-001 alone:

| Position | Goal type | In a CR? |
|---|---|---|
| 1 | Wedding | GBSIP-001 |
| 2 | Education | GBSIP-001 |
| 3 | Home | GBSIP-001 |
| 4 | Emergencies | Not in any CR provided |
| 5 | Special Ones | Not in any CR provided |
| 6 | Retirement | Not in any CR provided |

**Gold Coins (GBSIP-002) and Silver (GBSIP-003) goal types do not appear anywhere on this screen.** **Confirmed with the team (2026-09-01): these are not available** — not yet built, not a testing gap. GBSIP-002/003 automation is deferred until the feature ships; §3.2/3.3 below are written from the CR text only as a placeholder.

**Automation gotcha:** each goal-type card is a bare `<img alt="">` inside `<div class="cursor-pointer">` — the label ("WEDDING" etc.) is baked into the banner image file itself, not real text. `getByText(...)`/`getByRole(...)` find **nothing** for these cards; they can only be selected positionally:
```ts
page.locator('app-goals div.cursor-pointer').nth(0)  // Wedding
```
This is also a real accessibility defect worth its own test/finding: these 6 primary navigation controls have no accessible name at all for a screen reader.

### 2.2 Goal creation flow — confirmed live for Wedding

Route pattern: `/goal-wise-sip/select-year/{type}` → `/goal-wise-sip/select-amount/{type}` → `/goal-wise-sip/select-investment-type/{type}`. Breadcrumb trail: `Home > Goal Wise Sip > {step label}` (step labels seen: "Select Year", "Sip Amount", "Sip Type Selection" — inconsistent capitalization/naming versus the CR's own screen titles, cosmetic but worth a consistency note).

**Step 1 — Select Year** (`"When is your wedding?"`, matches CR §2 heading pattern)
- Controls: `-` / `+` buttons and a slider, default **2031**.
- Boundary confirmed live: floor **2030**, ceiling **2050** — exactly matches CR (`Minimum Year: 2030` / `Maximum Year: 2050`). ✅
- Button: **Start planning** (not "Proceed" — CR doesn't name this button).

**Step 2 — Select Budget** (`"Set your wedding goal"`)
- Controls: `-` / `+` and slider, default **₹130,000**.
- Displayed as a raw number (`₹ 130000`), **not** the abbreviated `₹1 L` / `₹5 L` / `₹1 Cr` format the CR explicitly specifies in §3. **Discrepancy — flag for product.**
- Step size per click is ₹500. **Resolved 2026-09-01:** the underlying PrimeNG `p-slider` handle exposes its bounds directly as ARIA attributes (`role="slider" aria-valuemin aria-valuemax aria-valuenow`) — read `aria-valuemin="100000"` / `aria-valuemax="10000000"`, **exactly matching the CR's ₹1,00,000 / ₹1,00,00,000 range**. Automated as `TC_GBSIP_004_005` (passing) — reads the bounds via `GoalWiseSipPage.getSliderBounds()` rather than clicking to a boundary.

**Step 3 — Select SIP Frequency** (`"Save [Daily ▾]"`)
- Default **Daily**; a live SIP amount is computed and shown (e.g. `72`/`42` for ₹150,000-ish goals at different years — reads as ₹/day, illustrative-only per the CR's own example). Matches CR §4 conceptually.
- Button: **Proceed to pay**.
- **Resolved 2026-09-01 — dropdown mechanics:** "Save Daily" is a plain `<h3>` with a `pi-angle-down` icon, **not** a real combobox/select. Clicking the heading text does nothing; only the icon (`i.pi-angle-down`) opens a PrimeNG popover (`role="dialog"`) containing a `p-radiobutton` group with Daily/Weekly/Monthly options. `GoalWiseSipPage.selectFrequency()` automates this. Weekly/Monthly recalculation itself is still unverified — only Daily has been exercised.
- **Resolved 2026-09-01 — the payment step, but not the way expected.** Clicking the goal wizard's "Proceed to pay" hands off into the plain `/digital-gold/buy/summary` flow (same `BuySummaryPage`; "Investment Purpose: Wedding" is the only goal-specific marker). But clicking **that** page's own "Proceed To Pay" goes straight to a **UPI QR-code checkout** — confirmed by two failed attempts reusing `flows/customer/sip-emandate.flow.ts`'s `paySipWithNewBankEmandate` (the same helper `tests/customer/sipflow/sip-flows.spec.ts` TC_001 uses successfully for a *non-goal* SIP against this same account): the "Secure UPI"/"Emandate" choice screen that helper depends on never appears, and `paymentPage.clickEmandate()` times out waiting for a button that isn't there. **A QR code can't be completed headlessly** (it needs a phone to scan and authorize), so full payment completion — and therefore verifying Pending status, goal-listing appearance, and everything downstream of it — remains blocked. `TC_GBSIP_001` (positive) instead stops at "payment QR generated with the correct goal/frequency/amount," which is as far as automation can currently verify.

### 2.3 Goal status lifecycle (confirmed with the team, 2026-09-01)

A newly-created goal starts **Pending**. It must move to **Approved** before **Save More** or **Withdraw** become available. (Presumably an approval step happens server-side/admin-side after the first successful SIP payment — exact trigger not yet confirmed, see open items.) **Failed** and **Paused**, observed live, are additional states outside that happy path (a failed approval/payment, and a since-paused SIP, respectively).

This directly explains what was observed on the goal cards below: every one of the 8 existing goals on this account is **Failed** or **Paused** — none **Pending** or **Approved** — so `Save more`/`Withdraw` being disabled on all of them is expected given their state, not a bug. To exercise the happy path (Approved goal, enabled actions, Goal Details, Manage/Rename/Delete) a fresh goal needs to be created and carried through to Approved — see the open payment-automation question in §2.2.

### 2.4 Goal listing & card (`Your Savings` section on `/goal-wise-sip`)

Card contents (confirmed via DOM dump):
- Goal name (plain, non-interactive `<p>` — styled as a colored pill)
- "You've saved ₹X" + an info icon (`pi-info-circle`, tooltip: *"The final withdrawal amount is based on the current selling rate of gold, which may be different from your purchase rate"*)
- "of ₹Y • by {date}"
- A PrimeNG `p-progressbar`
- Status pill (Failed / Paused observed live; Pending / Approved not yet seen)
- `Save more` / `Withdraw` buttons (disabled outside Approved — see §2.3)

**Real bug found:** on the one goal that's over-funded (`Retirement01092026`, ₹215,053.64 saved against a ₹100,000 target), the progress bar renders `aria-valuenow="215"` against a **hardcoded `aria-valuemax="100"`**, and its width style is literally `215%`. That's an invalid ARIA state (`valuenow` must not exceed `valuemax`) and, depending on the container's overflow handling, a real visual bug too. **File as a defect; also worth its own boundary test** (goal progress display when saved amount exceeds target).

**Not found anywhere on the card, and no click-through to a details screen either:** the CR describes "Selecting the goal opens the detailed goal screen" (§6/§7) and a "Manage" bottom sheet with Rename/Delete (§Manage Goal). Neither was found in this exploration — the goal name isn't clickable (no handler, no router-link) and there's no visible kebab-menu/Manage affordance on any card seen. Given §2.3, this is most likely gated behind Approved status rather than missing outright — **re-check once a goal can be carried to Approved before treating this as a gap to raise with product.**

### 2.5 What wasn't reached in this pass

- Save More flow (gram/rupee selector, live price, payment) — blocked by no Approved goal existing.
- Withdraw from a goal — CR says this reuses the existing withdrawal flow (already covered by `tests/customer/withdrawal/`), so once reachable this should be a thin integration check, not new withdrawal-flow coverage.
- Goal Details screen — not found; likely gated behind Approved status (§2.3).
- Rename / Delete — not found; likely gated behind Approved status (§2.3).
- Education, Home, Emergencies, Special Ones, Retirement creation flows — only Wedding was walked end-to-end. Given all 6 cards render through the same `app-goals` component and route pattern (`/goal-wise-sip/select-year/{type}`), the mechanics are very likely identical; each still needs at least one confirmatory pass per type since the CR's business rules (min/max year, min/max budget) are written per-goal-type and could differ once verified.
- Gold Coins and Silver goal types — confirmed not available (§2.1), out of scope until shipped.

## 3. Test Case Plan

IDs use `TC_GBSIP_0XX`. "Live status" reflects what this pass actually confirmed vs. what still needs verification before automating.

### 3.1 GBSIP-001 — Wedding / Education / Home

| ID | AC | Scenario | Live status |
|---|---|---|---|
| TC_GBSIP_001 | AC-1 | Goal-type grid shows 6 cards; selecting Wedding navigates to `/goal-wise-sip/select-year/wedding`; wizard reaches a correctly-generated payment QR with the right goal/frequency/amount | **Automated, passing** — `TC_Wedding_CreateGoal_Positive.spec.ts` |
| TC_GBSIP_002 | AC-2 | Year selector defaults sensibly, `−`/`+`/slider work, floor clamps at 2030, ceiling clamps at 2050 | **Automated, passing** — `TC_Wedding_Boundary_And_Abandoned_Payment.spec.ts` (Wedding only; ARIA bounds + push-to-floor/ceiling) |
| TC_GBSIP_003 | AC-2 | Direct slider drag to an out-of-range position still clamps to 2030/2050 | Not verified — only `−`/`+` tested |
| TC_GBSIP_004_005 | AC-3 | Budget selector range is exactly ₹1,00,000–₹1,00,00,000 | **Automated, passing** — resolved via `aria-valuemin`/`aria-valuemax`, exact CR match |
| TC_GBSIP_006 | AC-3 | Budget displays in the CR's abbreviated format (₹1 L / ₹5 L / ... / ₹1 Cr) | **Fails today** — live app shows raw `₹130000`; confirm with product whether the CR or the implementation is authoritative before writing this as a hard assertion |
| TC_GBSIP_007 | AC-4 | Frequency dropdown offers exactly Daily / Weekly / Monthly | Daily selection automated and passing; Weekly/Monthly options not yet enumerated/asserted |
| TC_GBSIP_008 | AC-5 | Changing frequency recalculates the displayed SIP amount | Daily's computed amount read and asserted `>0`; cross-frequency recalculation not yet verified |
| TC_GBSIP_009 | AC-6 | Successful payment creates the SIP, links it to the goal, goal starts in **Pending** status, lands on a success screen | **Blocked — confirmed UPI-QR-only checkout, not completable headlessly** (see §2.2 Step 3). `TC_GBSIP_001` verifies up to a correctly-generated QR instead. |
| TC_GBSIP_009b | AC-6 | Goal transitions Pending → Approved (trigger TBD — see open items), at which point Save More/Withdraw enable | Blocked on TC_GBSIP_009 |
| TC_GBSIP_010 | AC-14 | Abandoning/failing payment creates no SIP and the goal never reaches Pending | **Automated, passing** — `TC_Wedding_Boundary_And_Abandoned_Payment.spec.ts`, mirrors the pattern from `TC_Withdrawal_ConvertToProduct_009` (walks to the payment summary, cancels via `buySummaryPage.cancelSipFlow()`, asserts the Wedding goal count is unchanged) |
| TC_GBSIP_011 | AC-7 | New goal appears under "Your Savings" (as Pending) after successful creation | Blocked on TC_GBSIP_009 |
| TC_GBSIP_012 | AC-8 | Goal card shows saved amount, target, "by {date}", progress bar, status | Confirmed shape of the card (name/saved/target/date/progress/status/buttons); values not independently verified against a known-good goal |
| TC_GBSIP_012b | — | Progress bar `aria-valuenow`/width don't exceed `aria-valuemax`/100% when saved amount exceeds target | **Currently fails** (215%/max 100 observed on `Retirement01092026`) — file as defect, write as a regression test |
| TC_GBSIP_013 | AC-8 | Selecting a goal opens a Goal Details screen with portfolio value, invested amount, market value, returns, target, progress | Blocked — likely gated behind Approved status (§2.3); re-check once an Approved goal exists |
| TC_GBSIP_014 | AC-9/AC-10 | Save More: gram selector 0.010–10 gm, live price, payable amount updates, successful payment updates portfolio/progress | Blocked — no Approved goal available to reach this screen from |
| TC_GBSIP_015 | AC-11 | Withdraw redirects into the existing withdrawal flow unmodified | Blocked — same reason; once reachable, assert only the redirect + entry point, not withdrawal internals (already covered elsewhere) |
| TC_GBSIP_016 | AC-12 | Rename: mandatory, 30-char max, trims leading/trailing spaces, duplicates allowed, success toast, name updates everywhere | Blocked — likely gated behind Approved status; no Manage control located on a Failed/Paused goal |
| TC_GBSIP_017 | AC-13 | Delete: confirmation dialog, Yes deletes only the goal association (cancels linked SIP, keeps gold holdings), Cancel is a no-op | Blocked — same as above |
| TC_GBSIP_018–021 | AC-1..5 | Repeat TC_GBSIP_001–008 for Education and Home (2× goal types) | Not started — only Wedding walked |

### 3.2 GBSIP-002 — Gold Coins Goal — **confirmed not available, out of scope**

Confirmed with the team 2026-09-01: Gold Coins goals are not implemented. Do not automate; revisit if/when shipped. Left here as a placeholder written from the CR text only, for reference:

| ID | AC | Scenario |
|---|---|---|
| TC_GBSIP_101 | AC-1 | "Gold Coins" appears as a selectable goal type with 10/20/25/50 gm coin cards |
| TC_GBSIP_102–112 | AC-2..12 | (Mirror of GBSIP-001's frequency/payment/tracking/rename/delete ACs, substituting coin-weight selection for year+budget) |

### 3.3 GBSIP-003 — Silver Goal — **confirmed not available, out of scope**

Confirmed with the team 2026-09-01: Silver goals are not implemented. Do not automate; revisit if/when shipped. Left here as a placeholder written from the CR text only, for reference:

| ID | AC | Scenario |
|---|---|---|
| TC_GBSIP_201 | AC-1 | "Silver" appears as a selectable goal type with target-quantity (100 gm – 10,000 gm) and tenure (1–10 yr) selectors |
| TC_GBSIP_202–212 | AC-2..12 | (Mirror of GBSIP-001's frequency/payment/tracking/rename/delete ACs, substituting quantity+tenure for year+budget; Save More range is 10–1,000 gm here, not 0.010–10 gm) |

## 4. Cross-Cutting Automation Notes

- **Page Object:** `pages/customer/goal-wise-sip.page.ts` (`GoalWiseSipPage`, fixture key `goalWiseSipPage`, wired into `fixtures/base.fixture.ts`). Covers goal-type selection, year/budget slider bounds + stepping, frequency selection, Proceed to pay, and goal-listing lookups. Locators/actions only, no assertions, per convention.
- **Storage state:** both new specs use the shared `customer` storage state (no `test.use({ storageState: blank })` override) — matches `tests/customer/sipflow/sip-flows.spec.ts` rather than the KYC/registration specs' always-fresh-account pattern, since goal tracking is meaningless without the account's existing investment history.
- **Positional selectors for the 6 goal-type cards** (§2.1) are centralized in `GoalWiseSipPage.selectGoalType()` — the only place the fragile index mapping lives.
- **Slider bounds are read via ARIA attributes, not click-counting:** `GoalWiseSipPage.getSliderBounds()` reads `aria-valuemin`/`aria-valuemax`/`aria-valuenow` off the PrimeNG `p-slider` handle directly — this is what let TC_GBSIP_004_005 confirm the exact ₹1L–₹1Cr budget range in seconds instead of ~19,800 clicks. Reuse this approach for any future slider-boundary test in this app.
- **Payment/mandate completion is still the single biggest open risk**, now for a more specific reason than originally thought: it's not a "should we do this safely" question, it's that **the reachable checkout method (UPI QR) cannot be completed headlessly at all**. Every Approved-goal-dependent test case (§3.1 TC_GBSIP_009b/011/013/014/015/016/017) is blocked on this, not just on team process — resolving it needs either a non-QR payment path being made reachable for goal SIPs, or a UAT-side way to force-approve a Pending goal outside the UI (an API call, a backdoor, admin action) the way `api-services/admin/ekyc-api.ts`'s `removeEkycRecord()` does for KYC state.

## 5. Open Items Requiring Product/Dev Confirmation

1. ~~Are Gold Coins/Silver goals implemented?~~ **Resolved 2026-09-01: confirmed not available**, GBSIP-002/003 deferred.
2. ~~Confirm the exact budget boundaries.~~ **Resolved 2026-09-01: confirmed exactly ₹1,00,000–₹1,00,00,000 via ARIA attributes**, matches the CR precisely. Automated as TC_GBSIP_004_005.
3. **New, 2026-09-01: how can a goal-linked SIP payment actually be completed in an automated UAT run?** The reachable checkout is UPI-QR-only (no Emandate/bank-choice screen, unlike the plain Buy-Metal SIP flow) and a QR code needs a phone to authorize — see §2.2 Step 3 and §4. This is now the single blocker on almost everything below it.
4. Emergencies, Special Ones, and Retirement are live goal types with no corresponding CR in this batch — is documentation for them expected separately, or should GBSIP-001's rules be assumed to extend to all "simple" (year+budget) goal types uniformly?
5. What actually drives the Pending → Approved transition (§2.3)? Automatic once the first SIP payment clears, a background/batch job, manual admin action, something else? Moot until item 3 is resolved, since no automated run can get a goal to Pending in the first place yet.
6. Once a goal is Approved: confirm the Goal Details screen and the Manage → Rename/Delete bottom sheet actually exist and are reachable from the goal card (not found on any Pending/Failed/Paused goal in this pass — see §2.3/§2.4).
7. Is the raw-number budget display (`₹130000`) intentional, or should it use the CR's `₹1 L`/`₹5 L`/.../`₹1 Cr` abbreviated format?
8. Progress-bar-over-100%-of-target bug (§2.4) — confirm whether this is a known issue or new, and whether `aria-valuemax` should scale dynamically (e.g. to the saved amount) rather than staying fixed at 100.

## 6. What's Automated So Far (2026-09-01)

`tests/customer/goal-based-sip/` (both passing, run together and individually):

- **`TC_Wedding_Boundary_And_Abandoned_Payment.spec.ts`** (negative) — year slider clamps exactly to 2030/2050 via both ARIA read and push-to-floor/ceiling; budget slider's ARIA bounds match the CR's ₹1,00,000–₹1,00,00,000 exactly; abandoning payment at the summary screen (via `buySummaryPage.cancelSipFlow()`) creates no new Wedding goal.
- **`TC_Wedding_CreateGoal_Positive.spec.ts`** (positive) — walks goal type → year → budget → Daily frequency → computed SIP amount → Proceed to pay, confirms the `/digital-gold/buy/summary` page correctly reflects the goal's name/frequency/amount, and confirms Proceed To Pay generates a valid payment QR. Stops there per the blocker in item 3 above; does not (and currently cannot) complete payment or verify the goal reaching Pending/appearing under Your Savings.

`tests/customer/goal-based-sip/special-ones-goal/` (both passing live against UAT, run together and individually):

**Correction to §2.5's assumption:** Special Ones is *not* a clone of the year+budget wizard used elsewhere. Confirmed live 2026-09-03: its step 1 (`/goal-wise-sip/select-date/special-ones`, "When is the special day?") is a `p-datepicker` free-text date input — the same PrimeNG widget `setPrimeCalendarDate` (`utils/calendar-helper.ts`) already drives for KYC/profile DOB fields, now reused via `GoalWiseSipPage.setSpecialDate()`. Its continue button is labeled "Select amount", not "Start planning". From the budget step onward (`/goal-wise-sip/select-amount/special-ones`) the mechanics match: same `p-slider`, same confirmed ₹1,00,000–₹1,00,00,000 bounds, "Start planning"/frequency/payment steps, and "Special Ones" is the Investment Purpose label on the payment summary. Per-goal-type mechanics do differ, as the plan's own open item #4 flagged as a possibility — Emergencies/Retirement still need their own confirmatory pass.

- **`TC_SpecialOnes_CreateGoal_Positive.spec.ts`** (positive, Daily) — walks goal type → pick a special date from the calendar → budget → Daily frequency → computed SIP amount → Proceed to pay → QR, asserting the confirmed ₹1,00,000–₹1,00,00,000 budget bounds and the "Special Ones" summary label. Stops at a generated payment QR since a goal-linked SIP checkout is UPI-QR-only and cannot be authorized headlessly.
- **`TC_SpecialOnes_CreateGoal_Positive_Weekly.spec.ts`** (positive, Weekly) — same wizard walk with Weekly frequency; since Special Ones' tenure is a picked date rather than a target year, the expected weekly amount is computed from the exact today→special-date day count (not a year-only approximation) and confirmed to match the live-computed amount within tolerance.
- **`TC_SpecialOnes_CreateGoal_Positive_Monthly.spec.ts`** (positive, Monthly) — same wizard walk with Monthly frequency, expected amount computed from the exact today→special-date calendar-month count. Confirms Monthly's distinct behavior also holds for this goal type: SIP starts the 1st of next month (not next-day), and payment first shows a "Set Up Bank Mandate" dialog (Secure UPI pre-selected / Emandate) before the QR.
- **`TC_SpecialOnes_Weekly_MaxAmount.spec.ts`** (boundary) — pushes the Weekly SIP-amount slider to its ceiling (₹9,99,999) and confirms the same amount-dependent payment rules hold as for Wedding: over ₹1,00,000 starts 5 calendar days out (not next-day) and is routed straight into Emandate's bank-account picker with Secure UPI unavailable.
- **`TC_SpecialOnes_Monthly_MaxAmount.spec.ts`** (boundary) — pushes the Monthly SIP-amount slider to its ceiling (₹9,99,999) and confirms it starts on the 5th of next month (not the 1st, which applies at/below ₹99,999) and auto-advances into Emandate's "Choose Bank Account" dialog — same rules confirmed for Wedding.
- **`TC_SpecialOnes_Boundary_And_Abandoned_Payment.spec.ts`** (negative) — confirms the calendar picker can be driven to a specific date and that date carries into the input (no min/max is asserted for it — the datepicker exposes no ARIA bounds to read, unlike a slider), confirms the budget slider's bounds and floor guard, and confirms abandoning payment at the summary screen creates no new "Special Ones" goal.

Not yet automated: Education/Home/Emergencies/Retirement goal types, Weekly/Monthly frequency selection, everything gated behind an Approved goal (§3.1).
