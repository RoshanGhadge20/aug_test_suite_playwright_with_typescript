import type { APIResponse } from '@playwright/test';
import type { CustomerApiClient } from '../core/customer-api-client';
import { CUSTOMER_ENDPOINTS } from './customer-endpoints';
import type { CustomerIdentity, SipApplicationRequest, SipSubmitRequest } from './customer.types';

/** Local date as YYYY-MM-DD, `offsetDays` from today. */
export function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The app's default plan name for a cycle date: '2026-10-28' → 'Saving Plan - 28th Oct, 2026'. */
export function sipPlanName(sipCycleDate: string): string {
  const [y, m, d] = sipCycleDate.split('-').map(Number);
  const suffix = d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th';
  const month = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' });
  return `Saving Plan - ${d}${suffix} ${month}, ${y}`;
}

/** Daily ₹100 gold SIP via yesbank UPI autopay starting tomorrow (the earliest date the backend allows). */
export function sipApplicationPayload(
  customer: CustomerIdentity,
  overrides: Partial<SipApplicationRequest> = {},
): SipApplicationRequest {
  const sipCycleDate = overrides.sipCycleDate ?? isoDate(1);
  return {
    applicationDate: isoDate(),
    customerId: customer.id,
    customerUniqueId: customer.customerUniqueId,
    email: customer.email,
    investmentAmount: 100,
    investmentType: 'daily',
    isEditSip: true,
    isFdEnable: false,
    isStepUp: false,
    mandate: 'upi',
    metalType: 'gold',
    mobileNumber: customer.mobileNumber,
    planName: sipPlanName(sipCycleDate),
    sipCycleDate,
    sipInvestmentTenureId: 1,
    transactionType: 'sip',
    gatewayName: 'yesbank',
    ...overrides,
  };
}

/**
 * Authenticated (token + signature) customer SIP calls: create temp application → submit (returns the
 * mandate QR) → status. Status stays 404 until the customer scans the QR; an unscanned SIP flips to
 * `failed` once the mandate expires (~1h on UAT), so a successful SIP can't be reached without a scan.
 */
export class CustomerQuickSaveSipApi {
  constructor(private readonly client: CustomerApiClient) {}

  createApplication(payload: SipApplicationRequest | Record<string, unknown>): Promise<APIResponse> {
    return this.client.post(CUSTOMER_ENDPOINTS.sipApplicationDetails, { ...payload });
  }

  submit(payload: SipSubmitRequest | Record<string, unknown>): Promise<APIResponse> {
    return this.client.post(CUSTOMER_ENDPOINTS.sipSubmit, { ...payload });
  }

  getStatus(tempSipId: number | string): Promise<APIResponse> {
    return this.client.get(CUSTOMER_ENDPOINTS.sipStatus(tempSipId));
  }
}
