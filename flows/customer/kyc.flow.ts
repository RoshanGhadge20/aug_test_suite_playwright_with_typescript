import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { KycDigiKycPage } from '../../pages/customer/kyc-digi-kyc.page';
import { removeEkycRecord } from '../../api-services/admin/ekyc-api';
import { TestDataFactory } from '../../utils/data/test-data.factory';
import {
  ALREADY_REGISTERED_PAN,
  ALREADY_REGISTERED_PAN_DOB,
} from '../../tests/customer/test-data/registration-data';

/**
 * Frees the shared ALREADY_REGISTERED_PAN via the e-KYC reset API, then runs it through the
 * in-app KARZA-mocked verification for the currently logged-in customer. Retries through the
 * KARZA mock's transient "429 Too Many Requests" dialog rather than failing outright —
 * confirmed live (see TC_Referral_003).
 */
export async function completeKycWithSharedPan(page: Page, emailTag: string): Promise<void> {
  const kycDigiKycPage = new KycDigiKycPage(page);

  await removeEkycRecord({ identityProofNumber: null, panCardNumber: ALREADY_REGISTERED_PAN });

  await kycDigiKycPage.open();
  await kycDigiKycPage.enterPan(ALREADY_REGISTERED_PAN);
  await kycDigiKycPage.setDateOfBirth(ALREADY_REGISTERED_PAN_DOB);
  await kycDigiKycPage.enterEmail(TestDataFactory.email(emailTag));
  await kycDigiKycPage.clickVerify();

  await expect(kycDigiKycPage.karzaModalHeadingLocator()).toBeVisible({ timeout: 10_000 });
  await kycDigiKycPage.clickProceedForPanVerification();

  const verificationErrorTryAgain = page.getByRole('button', { name: 'Try Again' });
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const verified = await kycDigiKycPage
      .verifiedModalHeadingLocator()
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    if (verified) break;

    const rateLimited = await verificationErrorTryAgain.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!rateLimited) break;

    await page.waitForTimeout(15_000 * attempt);
    await verificationErrorTryAgain.click();
  }

  await expect(kycDigiKycPage.verifiedModalHeadingLocator()).toBeVisible({ timeout: 20_000 });
  await kycDigiKycPage.acknowledgeVerifiedModal();
}
