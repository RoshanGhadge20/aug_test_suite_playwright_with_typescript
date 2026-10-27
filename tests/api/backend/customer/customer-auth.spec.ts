import { customerApiTest as test, expect } from '../../../../fixtures/customer-api.fixture';
import { customerPinCreds, pinLoginPayload } from '../../../../api-services/core/customer-api-client';
import { signedBackendHeaders } from '../../../../api-services/core/backend-api-signature';
import { CUSTOMER_APP_HEADERS, CUSTOMER_ENDPOINTS } from '../../../../api-services/customer/customer-endpoints';
import type { PersonalInfoResponse, PinLoginResponse } from '../../../../api-services/customer/customer.types';
import { TestDataFactory } from '../../../../utils/data/test-data.factory';
import { logApiCall } from '../../../../utils/test/api-log';

/**
 * Customer-panel (cp.<env>.augmont.com) backend auth: PIN-login token + HMAC signature.
 * Serial: the backend allows one session per customer, so these must not race each other (or a
 * customer UI run on the same account — that login kills this token and vice-versa).
 * Each TC logs its request/response to the console before asserting, so failures still show the call.
 */
test.describe.configure({ mode: 'serial' });

test.describe('customer API auth @smoke @api', () => {
  test('TC_CustApi_Auth_001 PIN login returns a bearer token', async ({ customerAuthApi }) => {
    const creds = customerPinCreds();
    const res = await customerAuthApi.pinLogin(creds);
    await logApiCall(
      'TC_CustApi_Auth_001',
      { method: 'POST', path: CUSTOMER_ENDPOINTS.pinLogin, headers: CUSTOMER_APP_HEADERS, payload: pinLoginPayload(creds) },
      res,
    );
    expect(res.status()).toBe(200);
    const body = (await res.json()) as PinLoginResponse;
    expect(body.message).toBe('Successfully Logged In');
    expect(body.token).toMatch(/^eyJ/);
  });

  test('TC_CustApi_Auth_002 PIN login rejects an unregistered mobile number', async ({ customerAuthApi }) => {
    const creds = { mobileNumber: TestDataFactory.mobile(), pin: '123456' };
    const res = await customerAuthApi.pinLogin(creds);
    await logApiCall(
      'TC_CustApi_Auth_002',
      { method: 'POST', path: CUSTOMER_ENDPOINTS.pinLogin, headers: CUSTOMER_APP_HEADERS, payload: pinLoginPayload(creds) },
      res,
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe('Customer not found');
  });

  test('TC_CustApi_Auth_003 customer endpoint rejects a call with no token or signature', async ({ request }) => {
    const res = await request.get(CUSTOMER_ENDPOINTS.personalInfo, { headers: CUSTOMER_APP_HEADERS });
    await logApiCall(
      'TC_CustApi_Auth_003',
      { method: 'GET', path: CUSTOMER_ENDPOINTS.personalInfo, headers: CUSTOMER_APP_HEADERS },
      res,
    );
    expect(res.status()).toBe(401);
  });

  test('TC_CustApi_Auth_004 token + signature authenticate a customer endpoint', async ({
    customerApi,
    customerProfileApi,
  }) => {
    // TC_001 opened a new session, which kills the worker's shared token if it already existed.
    await customerApi.relogin();
    const res = await customerProfileApi.getPersonalInfo();
    // Same headers the client sent — the HMAC is deterministic, so recomputing gives the identical signature.
    await logApiCall(
      'TC_CustApi_Auth_004',
      {
        method: 'GET',
        path: CUSTOMER_ENDPOINTS.personalInfo,
        headers: {
          ...CUSTOMER_APP_HEADERS,
          ...signedBackendHeaders(customerApi.token, 'GET', CUSTOMER_ENDPOINTS.personalInfo),
        },
      },
      res,
    );
    expect(res.status()).toBe(200);
    const body = (await res.json()) as PersonalInfoResponse;
    expect(body.data.mobileNumber).toBe(customerPinCreds().mobileNumber);
  });
});
