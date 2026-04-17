import { test as base, APIRequestContext, request as pwRequest } from '@playwright/test';
import { API_SERVICE_AUTH, API_SERVICE_URLS } from '../config/urls';
import type { ApiService } from '../config/constants';
import { fetchBearerToken, globalTokenCache } from '../utils/api/api-auth';

type ApiFixtures = {
  apiService: ApiService;
  authedRequest: APIRequestContext;
};

const FIVE_MINUTES = 5 * 60 * 1000;

function detectApiService(projectName: string | undefined): ApiService {
  if (projectName === 'api-backend' || projectName === 'api-emi' || projectName === 'api-lgd') return projectName;
  throw new Error(`api fixture used in non-api project: ${projectName ?? '<unknown>'}`);
}

export const apiTest = base.extend<ApiFixtures>({
  apiService: async ({}, use, testInfo) => {
    await use(detectApiService(testInfo.project.name));
  },
  authedRequest: async ({ apiService }, use) => {
    const baseURL = API_SERVICE_URLS[apiService];
    const auth = API_SERVICE_AUTH[apiService];
    const loginCtx = await pwRequest.newContext({ baseURL });
    const token = await globalTokenCache.get(
      `${apiService}:${auth.email}`,
      () => fetchBearerToken({
        request: loginCtx,
        loginPath: auth.loginPath,
        email: auth.email,
        password: auth.password,
        tokenJsonPath: auth.tokenJsonPath,
      }),
      FIVE_MINUTES,
    );
    await loginCtx.dispose();

    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
