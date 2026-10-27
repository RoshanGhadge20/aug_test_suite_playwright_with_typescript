import type { APIResponse } from '@playwright/test';
import { customerApiTest, expect } from '../../../../fixtures/customer-api.fixture';
import { signedBackendHeaders } from '../../../../api-services/core/backend-api-signature';
import { CustomerApiClient, ensureCustomerPin } from '../../../../api-services/core/customer-api-client';
import { CUSTOMER_APP_HEADERS, CUSTOMER_ENDPOINTS } from '../../../../api-services/customer/customer-endpoints';
import type { CustomerPaymentApi } from '../../../../api-services/customer/customer-payment.api';
import { type CustomerQuickSaveSipApi, isoDate, sipApplicationPayload } from '../../../../api-services/customer/customer-quick-save-sip.api';
import type {
  CustomerIdentity,
  PaymentGatewayDetailsRequest,
  PaymentGatewayDetailsResponse,
  PersonalInfoResponse,
  SipApplicationResponse,
  SipInvestmentType,
  SipSubmitResponse,
} from '../../../../api-services/customer/customer.types';
import { logApiCall } from '../../../../utils/test/api-log';
import { getRecordedMobile } from '../../../customer/userwisesip/userwisesip-results';

/**
 * Runs as the One Time Investor built by TC_UserWiseSip_003 (new customer → AQHPM2512Q reset + KYC →
 * one-time gold buy): its mobile is read from testdata/customer/userwisesip-results.xlsx and logged in
 * with NEW_CUSTOMER_PIN, which is set first via OTP login if the customer has no PIN yet (registration
 * never sets one). Run that spec (project `customer`) first.
 *
 * Customer-app SIP purchase over the API: PIN login (worker `customerApi`) → payment-gateway-details →
 * sip-application/details (temp SIP) → submit-sip (UPI autopay mandate QR) → status.
 *
 * Stops at "QR issued": a SIP only turns successful after the customer scans the QR and approves the
 * mandate in a UPI app. Until then status is 404, and an unscanned SIP flips to `failed` (~1h on UAT).
 * Each run leaves one pending temp SIP on the configured customer.
 *
 * Serial: TC_004→006 share the temp SIP, and the backend allows one session per customer.
 */
const ONE_TIME_INVESTOR_TC = 'TC_UserWiseSip_003';
/** PIN every newly registered UAT customer logs in with. */
const NEW_CUSTOMER_PIN = '123456';

const test = customerApiTest.extend({
  customerApi: [
    async ({}, use) => {
      const mobileNumber = getRecordedMobile(ONE_TIME_INVESTOR_TC);
      if (!mobileNumber) {
        throw new Error(`No ${ONE_TIME_INVESTOR_TC} row in userwisesip-results.xlsx — run that spec (project customer) first`);
      }
      console.log(`[CustApi SIP] using ${ONE_TIME_INVESTOR_TC} customer ${mobileNumber}`);
      const creds = { mobileNumber, pin: NEW_CUSTOMER_PIN };
      await ensureCustomerPin(creds);
      const client = await CustomerApiClient.login(creds);
      await use(client);
      await client.dispose();
    },
    { scope: 'worker' },
  ],
});

test.describe.configure({ mode: 'serial' });

/** A different UAT customer (8141144444) whose SIP 8079 already resolved to `failed` — for cross-customer checks. */
const OTHER_CUSTOMER = { id: 20409, customerUniqueId: 'MT18ZYY8', tempSipId: 8079 };

let customer: CustomerIdentity;
let gatewayId: number;
let tempSipId: number;

const sipGatewayPayload = (investmentType: SipInvestmentType = 'daily'): PaymentGatewayDetailsRequest => ({
  module: 'SIP',
  investmentType,
  sipCycleDate: isoDate(1),
  investmentAmount: 100,
  isStepUpSip: false,
});

/** Logs a signed customer call (same headers the client sent — the HMAC is deterministic). */
async function log(
  tcId: string,
  token: string,
  method: 'GET' | 'POST',
  path: string,
  res: APIResponse,
  payload?: Record<string, unknown>,
): Promise<void> {
  await logApiCall(
    tcId,
    { method, path, headers: { ...CUSTOMER_APP_HEADERS, ...signedBackendHeaders(token, method, path, payload) }, payload },
    res,
  );
}

/** TC_001–003: the gateway list for an SIP of `investmentType` includes yesbank UPI; stores its id for TC_004. */
async function expectSipGatewayOffered(
  tcId: string,
  customerApi: CustomerApiClient,
  customerPaymentApi: CustomerPaymentApi,
  investmentType: SipInvestmentType,
): Promise<void> {
  const payload = sipGatewayPayload(investmentType);
  const res = await customerPaymentApi.getPaymentGatewayDetails(payload);
  await log(tcId, customerApi.token, 'POST', CUSTOMER_ENDPOINTS.paymentGatewayDetails, res, { ...payload });
  expect(res.status()).toBe(200);
  const body = (await res.json()) as PaymentGatewayDetailsResponse;
  expect(body.message).toBe('success.');
  for (const group of body.data) {
    expect(group.gateways.length).toBeGreaterThan(0);
    for (const g of group.gateways) expect(g.paymentGateway).toBe(group.paymentGateway);
  }
  expect(body.gatewayDeatils).toEqual(body.data.flatMap((group) => group.gateways));
  // SIP is collected by UPI autopay; the SIP application must reference this gateway.
  const upi = body.gatewayDeatils.find((g) => g.paymentGateway === 'yesbank' && g.mode === 'upi');
  expect(upi, 'yesbank UPI gateway offered').toBeDefined();
  gatewayId = upi!.id;
}

/** TC_010–012: sip-application/details refuses an amount below the ₹10 minimum. */
async function expectSipAmountRejected(
  tcId: string,
  customerApi: CustomerApiClient,
  customerQuickSaveSipApi: CustomerQuickSaveSipApi,
  investmentAmount: number,
): Promise<void> {
  const payload = sipApplicationPayload(customer, { investmentAmount });
  const res = await customerQuickSaveSipApi.createApplication(payload);
  await log(tcId, customerApi.token, 'POST', CUSTOMER_ENDPOINTS.sipApplicationDetails, res, { ...payload });
  expect(res.status()).toBe(400);
  expect((await res.json()).message).toBe('Minimum SIP amount allowed is ₹10.');
}

test.describe('customer API SIP @regression @api @sip', () => {
  test.beforeAll(async ({ customerApi }) => {
    // Another spec on this worker may have opened a new session, killing the shared token.
    await customerApi.relogin();
    const res = await customerApi.get(CUSTOMER_ENDPOINTS.personalInfo);
    expect(res.status(), 'personal-info for SIP payloads').toBe(200);
    customer = ((await res.json()) as PersonalInfoResponse).data as unknown as CustomerIdentity;
  });

  // ---------------------------------------------------------------- positive

  test('TC_CustApi_Sip_001 payment-gateway-details offers yesbank UPI for a daily SIP', async ({
    customerApi,
    customerPaymentApi,
  }) => {
    await expectSipGatewayOffered('TC_CustApi_Sip_001', customerApi, customerPaymentApi, 'daily');
  });

  test('TC_CustApi_Sip_002 payment-gateway-details offers yesbank UPI for a weekly SIP', async ({
    customerApi,
    customerPaymentApi,
  }) => {
    await expectSipGatewayOffered('TC_CustApi_Sip_002', customerApi, customerPaymentApi, 'weekly');
  });

  test('TC_CustApi_Sip_003 payment-gateway-details offers yesbank UPI for a monthly SIP', async ({
    customerApi,
    customerPaymentApi,
  }) => {
    await expectSipGatewayOffered('TC_CustApi_Sip_003', customerApi, customerPaymentApi, 'monthly');
  });

  test('TC_CustApi_Sip_004 sip-application/details creates a temp SIP for the logged-in customer', async ({
    customerApi,
    customerQuickSaveSipApi,
  }) => {
    const payload = sipApplicationPayload(customer);
    const res = await customerQuickSaveSipApi.createApplication(payload);
    await log('TC_CustApi_Sip_004', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.sipApplicationDetails, res, { ...payload });
    expect(res.status()).toBe(200);
    const { message, data } = (await res.json()) as SipApplicationResponse;
    expect(message).toBe('success');
    expect(data.id).toBeGreaterThan(0);
    expect(data.sipApplicationUniqueId.startsWith(`SIP${customer.customerUniqueId}`)).toBe(true);
    expect(data).toMatchObject({
      customerId: customer.id,
      customerUniqueId: customer.customerUniqueId,
      investmentAmount: payload.investmentAmount,
      investmentType: payload.investmentType,
      metalType: payload.metalType,
      sipCycleDate: payload.sipCycleDate,
      sipStartDate: payload.sipCycleDate,
      planName: payload.planName.toLowerCase(),
      paymentGatewayId: gatewayId,
      isSipCreated: false,
      isActive: true,
    });
    tempSipId = data.id;
  });

  test('TC_CustApi_Sip_005 submit-sip issues a UPI autopay mandate QR', async ({ customerApi, customerQuickSaveSipApi }) => {
    const payload = { emandate: true, tempSipId };
    const res = await customerQuickSaveSipApi.submit(payload);
    await log('TC_CustApi_Sip_005', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.sipSubmit, res, payload);
    expect(res.status()).toBe(200);
    const { message, data } = (await res.json()) as SipSubmitResponse;
    expect(message).toBe('success');
    expect(data.razorpayOrderId).toBeTruthy();
    expect(data.qrCode).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]{100,}$/);
  });

  test('TC_CustApi_Sip_006 status is not found while the mandate QR is unscanned', async ({ customerApi, customerQuickSaveSipApi }) => {
    const res = await customerQuickSaveSipApi.getStatus(tempSipId);
    await log('TC_CustApi_Sip_006', customerApi.token, 'GET', CUSTOMER_ENDPOINTS.sipStatus(tempSipId), res);
    expect(res.status()).toBe(404);
    expect((await res.json()).message).toBe('Data not found');
  });

  // ---------------------------------------------------------------- negative: payment-gateway-details

  test('TC_CustApi_Sip_007 payment-gateway-details without module is rejected', async ({ customerApi, customerPaymentApi }) => {
    const payload = { investmentType: 'daily' };
    const res = await customerPaymentApi.getPaymentGatewayDetails(payload as unknown as PaymentGatewayDetailsRequest);
    await log('TC_CustApi_Sip_007', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.paymentGatewayDetails, res, payload);
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe('WHERE parameter "module" has invalid "undefined" value');
  });

  test('TC_CustApi_Sip_008 payment-gateway-details for an unknown module offers no gateways', async ({
    customerApi,
    customerPaymentApi,
  }) => {
    const payload = { ...sipGatewayPayload(), module: 'XYZ' };
    const res = await customerPaymentApi.getPaymentGatewayDetails(payload);
    await log('TC_CustApi_Sip_008', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.paymentGatewayDetails, res, { ...payload });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as PaymentGatewayDetailsResponse;
    expect(body.data).toEqual([]);
    expect(body.gatewayDeatils).toEqual([]);
  });

  test('TC_CustApi_Sip_009 payment-gateway-details without a token is rejected', async ({ request }) => {
    const payload = sipGatewayPayload();
    const res = await request.post(CUSTOMER_ENDPOINTS.paymentGatewayDetails, { data: payload, headers: CUSTOMER_APP_HEADERS });
    await logApiCall(
      'TC_CustApi_Sip_009',
      { method: 'POST', path: CUSTOMER_ENDPOINTS.paymentGatewayDetails, headers: CUSTOMER_APP_HEADERS, payload },
      res,
    );
    expect(res.status()).toBe(401);
    expect((await res.json()).message).toBe('please login first');
  });

  // ---------------------------------------------------------------- negative: sip-application/details

  test('TC_CustApi_Sip_010 sip-application/details rejects amount ₹0 (minimum ₹10)', async ({ customerApi, customerQuickSaveSipApi }) => {
    await expectSipAmountRejected('TC_CustApi_Sip_010', customerApi, customerQuickSaveSipApi, 0);
  });

  test('TC_CustApi_Sip_011 sip-application/details rejects amount ₹9 (minimum ₹10)', async ({ customerApi, customerQuickSaveSipApi }) => {
    await expectSipAmountRejected('TC_CustApi_Sip_011', customerApi, customerQuickSaveSipApi, 9);
  });

  test('TC_CustApi_Sip_012 sip-application/details rejects amount ₹-100 (minimum ₹10)', async ({ customerApi, customerQuickSaveSipApi }) => {
    await expectSipAmountRejected('TC_CustApi_Sip_012', customerApi, customerQuickSaveSipApi, -100);
  });

  test('TC_CustApi_Sip_013 sip-application/details rejects a past SIP start date', async ({ customerApi, customerQuickSaveSipApi }) => {
    const payload = sipApplicationPayload(customer, { sipCycleDate: isoDate(-1) });
    const res = await customerQuickSaveSipApi.createApplication(payload);
    await log('TC_CustApi_Sip_013', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.sipApplicationDetails, res, { ...payload });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe(`Please select a SIP start date on or after ${isoDate(1)}`);
  });

  test('TC_CustApi_Sip_014 sip-application/details rejects an invalid metal type', async ({ customerApi, customerQuickSaveSipApi }) => {
    const payload = sipApplicationPayload(customer, { metalType: 'platinum' });
    const res = await customerQuickSaveSipApi.createApplication(payload);
    await log('TC_CustApi_Sip_014', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.sipApplicationDetails, res, { ...payload });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe('Invalid value for metal type');
  });

  test('TC_CustApi_Sip_015 sip-application/details rejects an unknown gateway', async ({ customerApi, customerQuickSaveSipApi }) => {
    const payload = sipApplicationPayload(customer, { gatewayName: 'nogateway' });
    const res = await customerQuickSaveSipApi.createApplication(payload);
    await log('TC_CustApi_Sip_015', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.sipApplicationDetails, res, { ...payload });
    // Backend answers 400 with an empty body `{}` — no message to assert.
    expect(res.status()).toBe(400);
  });

  test('TC_CustApi_Sip_016 sip-application/details rejects an empty body', async ({ customerApi, customerQuickSaveSipApi }) => {
    const res = await customerQuickSaveSipApi.createApplication({});
    await log('TC_CustApi_Sip_016', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.sipApplicationDetails, res, {});
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe('planName is required');
  });

  test('TC_CustApi_Sip_017 sip-application/details without a token is rejected', async ({ request }) => {
    const payload = sipApplicationPayload(customer);
    const res = await request.post(CUSTOMER_ENDPOINTS.sipApplicationDetails, { data: payload, headers: CUSTOMER_APP_HEADERS });
    await logApiCall(
      'TC_CustApi_Sip_017',
      { method: 'POST', path: CUSTOMER_ENDPOINTS.sipApplicationDetails, headers: CUSTOMER_APP_HEADERS, payload: { ...payload } },
      res,
    );
    expect(res.status()).toBe(401);
    expect((await res.json()).message).toBe('please login first');
  });

  test('TC_CustApi_Sip_018 sip-application/details refuses to create a SIP for another customer', async ({
    customerApi,
    customerQuickSaveSipApi,
  }) => {
    test.skip(customer.id === OTHER_CUSTOMER.id, 'logged in as OTHER_CUSTOMER — not a cross-customer call');
    // KNOWN DEFECT (UAT, 2026-10-27): the backend trusts customerId/customerUniqueId from the body and
    // answers 200, creating a temp SIP on the other customer's account (so each run leaves one there).
    // Remove test.fail() once fixed — Playwright then reports this test as "unexpectedly passed".
    test.fail(true, 'Backend accepts a SIP application for another customer (IDOR)');
    const payload = sipApplicationPayload(customer, {
      customerId: OTHER_CUSTOMER.id,
      customerUniqueId: OTHER_CUSTOMER.customerUniqueId,
    });
    const res = await customerQuickSaveSipApi.createApplication(payload);
    await log('TC_CustApi_Sip_018', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.sipApplicationDetails, res, { ...payload });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  // ---------------------------------------------------------------- negative: submit-sip / status

  test('TC_CustApi_Sip_019 submit-sip rejects a tempSipId that does not exist', async ({ customerApi, customerQuickSaveSipApi }) => {
    const payload = { emandate: true, tempSipId: 99999999 };
    const res = await customerQuickSaveSipApi.submit(payload);
    await log('TC_CustApi_Sip_019', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.sipSubmit, res, payload);
    expect(res.status()).toBe(422);
    expect((await res.json()).message).toBe('data not found');
  });

  test('TC_CustApi_Sip_020 submit-sip without tempSipId is rejected', async ({ customerApi, customerQuickSaveSipApi }) => {
    const payload = { emandate: true };
    const res = await customerQuickSaveSipApi.submit(payload);
    await log('TC_CustApi_Sip_020', customerApi.token, 'POST', CUSTOMER_ENDPOINTS.sipSubmit, res, payload);
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe('tempSipId is required');
  });

  test('TC_CustApi_Sip_021 status for a SIP id that does not exist is not found', async ({ customerApi, customerQuickSaveSipApi }) => {
    const res = await customerQuickSaveSipApi.getStatus(99999999);
    await log('TC_CustApi_Sip_021', customerApi.token, 'GET', CUSTOMER_ENDPOINTS.sipStatus(99999999), res);
    expect(res.status()).toBe(404);
    expect((await res.json()).message).toBe('Data not found');
  });

  test('TC_CustApi_Sip_022 status of a SIP owned by another customer is forbidden', async ({ customerApi, customerQuickSaveSipApi }) => {
    test.skip(customer.id === OTHER_CUSTOMER.id, 'logged in as OTHER_CUSTOMER — not a cross-customer call');
    const res = await customerQuickSaveSipApi.getStatus(OTHER_CUSTOMER.tempSipId);
    await log('TC_CustApi_Sip_022', customerApi.token, 'GET', CUSTOMER_ENDPOINTS.sipStatus(OTHER_CUSTOMER.tempSipId), res);
    expect(res.status()).toBe(403);
    expect((await res.json()).message).toBe('Forbidden');
  });
});
