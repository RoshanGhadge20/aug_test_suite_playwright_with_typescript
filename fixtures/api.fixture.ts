import { test as base, APIRequestContext, request as pwRequest } from '@playwright/test';
import { apiAuthConfig, apiUrl } from '../config/urls';
import { getTargetEnv } from '../config/environments';
import type { ApiService } from '../config/constants';
import { fetchBearerToken, globalTokenCache } from '../utils/api/api-auth';

type ApiFixtures = {
  apiService: ApiService;
  authedRequest: APIRequestContext;
};

const FIVE_MINUTES = 5 * 60 * 1000;

function detectApiService(projectName: string | undefined): ApiService {
  if (projectName === 'api-backend' || projectName === 'api-emi') return projectName;
  throw new Error(`api fixture used in non-api project: ${projectName ?? '<unknown>'}`);
}

export const apiTest = base.extend<ApiFixtures>({
  apiService: async ({}, use, testInfo) => {
    await use(detectApiService(testInfo.project.name));
  },
  authedRequest: async ({ apiService }, use) => {
    const envName = getTargetEnv();
    const baseURL = apiUrl(apiService, envName);
    const auth = apiAuthConfig(apiService, envName);
    const loginCtx = await pwRequest.newContext({ baseURL });
    const token = await globalTokenCache.get(
      `${envName}:${apiService}:${auth.mobile}`,
      () => fetchBearerToken({
        request: loginCtx,
        sendOtpPath: auth.sendOtpPath,
        verifyOtpPath: auth.verifyOtpPath,
        mobile: auth.mobile,
        otp: auth.otp,
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
