import { test as base, APIRequestContext } from '@playwright/test';
import type { ApiService } from '../config/constants';
import { createAuthedApiContext } from '../utils/api/api-auth';

type ApiFixtures = {
  apiService: ApiService;
  authedRequest: APIRequestContext;
};

function detectApiService(projectName: string | undefined): ApiService {
  if (projectName === 'api-backend' || projectName === 'api-emi') return projectName;
  throw new Error(`api fixture used in non-api project: ${projectName ?? '<unknown>'}`);
}

export const apiTest = base.extend<ApiFixtures>({
  apiService: async ({}, use, testInfo) => {
    await use(detectApiService(testInfo.project.name));
  },
  authedRequest: async ({ apiService }, use) => {
    const ctx = await createAuthedApiContext(apiService);
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
