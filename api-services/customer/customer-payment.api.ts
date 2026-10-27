import type { APIResponse } from '@playwright/test';
import type { CustomerApiClient } from '../core/customer-api-client';
import { CUSTOMER_ENDPOINTS } from './customer-endpoints';
import type { PaymentGatewayDetailsRequest } from './customer.types';

/** Authenticated (token + signature) customer payment calls. */
export class CustomerPaymentApi {
  constructor(private readonly client: CustomerApiClient) {}

  /** POST — the backend 404s a GET. `module` is required (400 "WHERE parameter \"module\"..." without it). */
  getPaymentGatewayDetails(payload: PaymentGatewayDetailsRequest): Promise<APIResponse> {
    return this.client.post(CUSTOMER_ENDPOINTS.paymentGatewayDetails, { ...payload });
  }
}
