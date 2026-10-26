import type { APIRequestContext, APIResponse } from '@playwright/test';
import { pinLoginPayload, type CustomerPinLogin } from '../../utils/api/customer-api-client';
import { CUSTOMER_APP_HEADERS, CUSTOMER_ENDPOINTS } from './customer-endpoints';

/**
 * Unauthenticated customer auth calls. Returns raw responses so specs can assert both success and
 * failure. Note: a successful login here kills the shared `customerApi` session (one session per customer).
 */
export class CustomerAuthApi {
  constructor(private readonly request: APIRequestContext) {}

  pinLogin(creds: CustomerPinLogin): Promise<APIResponse> {
    return this.request.post(CUSTOMER_ENDPOINTS.pinLogin, {
      data: pinLoginPayload(creds),
      headers: CUSTOMER_APP_HEADERS,
    });
  }
}
