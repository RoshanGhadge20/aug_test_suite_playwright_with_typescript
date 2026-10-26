import { test as base } from '@playwright/test';
import { CustomerApiClient } from '../api-services/core/customer-api-client';
import { CustomerAuthApi } from '../api-services/customer/customer-auth.api';
import { CustomerProfileApi } from '../api-services/customer/customer-profile.api';

type CustomerApiWorkerFixtures = {
  customerApi: CustomerApiClient;
};

type CustomerApiTestFixtures = {
  customerAuthApi: CustomerAuthApi;
  customerProfileApi: CustomerProfileApi;
};

/**
 * `customerApi` — one PIN login per worker, shared by every test in it. Worker-scoped on purpose:
 * the backend allows one live session per customer, so a login per test would be wasteful and
 * parallel logins kill each other's tokens. Specs should call endpoints through the service
 * fixtures (`customerAuthApi`, `customerProfileApi`, ...), not raw paths on the client.
 * Use in `tests/api/backend/**` (project `api-backend`).
 */
export const customerApiTest = base.extend<CustomerApiTestFixtures, CustomerApiWorkerFixtures>({
  customerApi: [
    async ({}, use) => {
      const client = await CustomerApiClient.login();
      await use(client);
      await client.dispose();
    },
    { scope: 'worker' },
  ],
  customerAuthApi: async ({ request }, use) => {
    await use(new CustomerAuthApi(request));
  },
  customerProfileApi: async ({ customerApi }, use) => {
    await use(new CustomerProfileApi(customerApi));
  },
});

export { expect } from '@playwright/test';
