import { TestDataFactory } from '../../../utils/data/test-data.factory';
import { panelCreds } from '../../../config/urls';
import type { CalendarDate } from '../../../utils/calendar-helper';

/** Fresh, syntactically-valid (6-9 leading digit) 10-digit mobile number, generated per call. */
export function generateUnregisteredMobile(): string {
  return TestDataFactory.mobile();
}

/** Syntactically valid PAN (`AAAAA9999A`) — format-only, not a real verifiable PAN. */
export function generateValidFormatPan(): string {
  return TestDataFactory.pan();
}

/** Format-only Aadhaar-shaped number for the /api/e-kyc/remove payload — that endpoint is keyed off panCardNumber, so this only needs to be well-formed. */
export function generateIdentityProofNumber(): string {
  return TestDataFactory.aadhaar();
}

export const INVALID_FORMAT_PAN = '1234ABCD5';
export const INVALID_MOBILE_SHORT = '12345';
export const INVALID_MOBILE_BAD_PREFIX = '1234567890';
export const WRONG_OTP = '999999';

/** Same backdoor OTP this repo's customer `auth-setup` uses — confirmed to also work for brand-new numbers. */
export const REGISTRATION_OTP = panelCreds('customer').otp;

export const DEFAULT_TEST_PIN = '135790';
export const MISMATCHED_TEST_PIN = '246810';

/** DOB `years` ago on the 15th of January — clear of any leap-day edge case, always a valid adult date. */
export function adultDobYearsAgo(years = 25): CalendarDate {
  return { day: 15, month: 1, year: new Date().getFullYear() - years };
}

/** DOB for someone turning exactly 18 today — the age-boundary case flagged as an open item in the test plan. */
export function exactlyEighteenYearsAgo(): CalendarDate {
  const now = new Date();
  return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() - 18 };
}

/**
 * A real PAN already linked to another account on this environment, and its matching DOB —
 * used to exercise the "PAN Card already exists!" duplicate-PAN error on the KYC form. Fixed
 * (not generated), since the whole point is that it's already registered.
 */
export const ALREADY_REGISTERED_PAN = 'AQHPM2512Q';
export const ALREADY_REGISTERED_PAN_DOB: CalendarDate = { day: 2, month: 6, year: 1982 };

/**
 * The repo's shared pre-provisioned customer account (`UAT_CUSTOMER_USER_MOBILE`) — the same one
 * `auth-setup` uses. Its `otp` field is actually a PIN (see `loginWithExistingPin` in
 * `login.page.ts` and New Signup Window Test Plan.md §26 item 13). This account is assumed to
 * already have completed KYC with `ALREADY_REGISTERED_PAN`, for testing the duplicate-PAN
 * resubmission error.
 */
export function existingKycVerifiedCustomerCreds(): { mobile: string; pin: string } {
  const creds = panelCreds('customer');
  return { mobile: creds.mobile, pin: creds.otp };
}
