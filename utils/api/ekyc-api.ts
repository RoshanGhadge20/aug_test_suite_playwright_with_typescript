import { request as pwRequest } from '@playwright/test';
import { apiUrl } from '../../config/urls';
import { getTargetEnv } from '../../config/environments';

const EKYC_REMOVE_PATH = '/api/e-kyc/remove';

export interface RemoveEkycPayload {
  identityProofNumber: string | null;
  panCardNumber: string;
}

/**
 * Resets a customer's e-KYC record via the gold-loan-backend API so a previously-verified PAN
 * can go through the in-app KYC flow again. No auth required — confirmed live (2026-07-07) that
 * this endpoint takes the plain payload with no bearer token. Throws immediately with the
 * response status/body on failure — callers should let that propagate and fail the test rather
 * than continuing into a KYC flow whose precondition didn't hold.
 */
export async function removeEkycRecord(payload: RemoveEkycPayload): Promise<void> {
  console.log(`[E-KYC RESET] Starting reset for panCardNumber=${payload.panCardNumber}`);
  console.log(`[E-KYC RESET] Request payload: ${JSON.stringify(payload)}`);

  const ctx = await pwRequest.newContext({ baseURL: apiUrl('api-backend', getTargetEnv()) });
  try {
    const res = await ctx.post(EKYC_REMOVE_PATH, { data: payload });
    const bodyText = await res.text();
    console.log(`[E-KYC RESET] Response status: ${res.status()}`);
    console.log(`[E-KYC RESET] Response body: ${bodyText}`);

    if (!res.ok()) {
      throw new Error(
        `[E-KYC RESET] Reset failed for panCardNumber=${payload.panCardNumber}: ${res.status()} ${bodyText}`,
      );
    }

    console.log(`[E-KYC RESET] Reset completed successfully for panCardNumber=${payload.panCardNumber}`);
  } finally {
    await ctx.dispose();
  }
}
