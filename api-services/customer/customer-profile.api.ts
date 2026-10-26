import type { APIResponse } from '@playwright/test';
import type { CustomerApiClient } from '../../utils/api/customer-api-client';
import { CUSTOMER_ENDPOINTS } from './customer-endpoints';

/** Authenticated (token + signature) customer profile calls. */
export class CustomerProfileApi {
  constructor(private readonly client: CustomerApiClient) {}

  getPersonalInfo(): Promise<APIResponse> {
    return this.client.get(CUSTOMER_ENDPOINTS.personalInfo);
  }
}
