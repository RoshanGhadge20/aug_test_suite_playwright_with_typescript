import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { MyProfilePage } from '../../pages/customer/my-profile.page';
import { TestDataFactory } from '../../utils/data/test-data.factory';
import { REGISTRATION_OTP } from '../../tests/customer/test-data/registration-data';

/**
 * Fills + verifies an email and selects Gender on /my-profile. Confirmed live: KYC only touches
 * PAN/DOB/State/City/its-own-email-field, never this record — and SIP creation redirects to
 * /my-profile instead of the buy page while Gender/email are unset here. No page-object support
 * yet for the "Verify Your Email" OTP button or the Gender dropdown (only discovered live), so
 * driven directly per the exact live steps rather than guessed locators in MyProfilePage.
 * Ends with a settle wait — the save can still be read as stale by SIP creation immediately
 * after (see `createSipRetryingProfileBounce`).
 */
export async function completeProfileEmailAndGender(
  page: Page,
  myProfilePage: MyProfilePage,
  emailTag: string,
): Promise<void> {
  await myProfilePage.open();
  await myProfilePage.openEditModal();
  await myProfilePage.enterEmail(TestDataFactory.email(emailTag));

  const verifyEmailButton = page.getByRole('button', { name: /verify your email/i });
  await expect(verifyEmailButton).toBeVisible({ timeout: 10_000 });
  await verifyEmailButton.click();

  // "Verify Your Email" opens an "OTP Verification" dialog (confirmed live) — same backdoor
  // OTP as mobile login (REGISTRATION_OTP) works for it. The dialog's accessible role=dialog
  // name isn't "OTP Verification" (that's just an inner heading), so match on content instead.
  const otpDialog = page.getByRole('dialog').filter({ hasText: /otp verification/i });
  await expect(otpDialog).toBeVisible({ timeout: 10_000 });
  const otpInputs = otpDialog.locator('input');
  for (let i = 0; i < REGISTRATION_OTP.length; i++) {
    await otpInputs.nth(i).fill(REGISTRATION_OTP[i]);
  }
  await otpDialog.getByRole('button', { name: /verify otp/i }).click();
  await expect(otpDialog).toBeHidden({ timeout: 10_000 });

  // Gender is also required (confirmed live: shows placeholder "Enter Gender", unset for a
  // freshly registered account) — same PrimeNG dropdown pattern as State/City on the KYC form
  // (kyc-digi-kyc.page.ts). The form briefly re-renders right after OTP submission (confirmed
  // live: the dropdown's wrapper can still carry `.p-disabled` for a moment) — settle first.
  await page.locator('div.p-blockui[aria-busy="true"]').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  // PrimeNG renamed `div.p-dropdown` to `p-select`; match the role instead (live: combobox "Enter Gender").
  const genderDropdown = page.getByRole('combobox', { name: /gender/i }).filter({ visible: true }).first();
  await expect(genderDropdown).toBeEnabled({ timeout: 15_000 });
  await genderDropdown.click();
  const genderOption = page.locator('li[role="option"]').first();
  await genderOption.waitFor({ state: 'visible', timeout: 10_000 });
  await genderOption.click();

  await expect(myProfilePage.updateProfileButtonLocator()).toBeEnabled({ timeout: 10_000 });
  await myProfilePage.updateProfileButtonLocator().click();

  // Let the Gender/email save actually commit server-side before touching SIP creation —
  // confirmed live the SIP flow can still intermittently bounce to /my-profile right after this
  // save if it reads a stale "incomplete profile" state too soon.
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(3_000);
}
