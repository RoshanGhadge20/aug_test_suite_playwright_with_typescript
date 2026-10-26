import { request as pwRequest } from '@playwright/test';
import { apiUrl } from '../../config/urls';
import { getTargetEnv } from '../../config/environments';
import { TestDataFactory } from '../../utils/data/test-data.factory';
import { getBackendAdminToken } from '../core/backend-admin-auth';
import { signedBackendHeaders } from '../core/backend-api-signature';

const COUPONS_PATH = '/api/coupons';
const DEFAULT_ALLOWED_MODULES = ['buy', 'emi'];

export interface WalletGiftCouponOptions {
  prefix?: string;
  amount?: number;
  startDate?: string;
  expiryDate?: string;
  allowedModules?: string[];
}

export interface WalletGiftCouponResult {
  code: string;
  amount: number;
}


export function walletGiftCouponPayload(
  code: string,
  options: WalletGiftCouponOptions = {}
) {
  const today = new Date();
  const expiry = new Date();
  expiry.setDate(today.getDate() + 7);

  const {
    amount = 100,
    startDate = `${today.toISOString().split('T')[0]}T00:00:00+05:30`,
    expiryDate = `${expiry.toISOString().split('T')[0]}T23:59:59+05:30`,
    allowedModules = DEFAULT_ALLOWED_MODULES,
  } = options;

  return {
    id: '',
    requestFor: 'single',
    code,
    params: {
      prefix: null,
      expiry: { startDate, expiryDate },
      eligibility: {
        merchantId: [0],
        customerId: [0],
        customerUniqueId: [],
        repeat: false,
      },
      usage: { customerId: [] },
      benefit: {
        name: 'giftOnWalletAmt',
        amount,
        minAmount: '',
        maxAmount: '',
        percentage: '',
        minOrderAmount: '',
        allowedModules,
      },
      maxAllowedCount: 10,
      noOfCoupons: 1,
    },
    notes: null,
  };
}






/** Admin API: create wallet gift coupon; reusable across shop, SIP, buy-metal specs. */
export async function createWalletGiftCoupon(
  options: WalletGiftCouponOptions = {},
): Promise<WalletGiftCouponResult> {
  const amount = options.amount ?? 100;
  const code = TestDataFactory.couponCode(options.prefix ?? 'SIN');
  const body = walletGiftCouponPayload(code, { ...options, amount });
  const token = await getBackendAdminToken();
  const baseURL = apiUrl('api-backend', getTargetEnv());
  const ctx = await pwRequest.newContext({ baseURL });

  try {
    const res = await ctx.post(COUPONS_PATH, {
      headers: signedBackendHeaders(token, 'POST', COUPONS_PATH, body),
      data: body,
    });
    const text = await res.text();
    if (!res.ok()) {
      throw new Error(`POST ${COUPONS_PATH} failed: ${res.status()} ${text}`);
    }
    return { code, amount };
  } finally {
    await ctx.dispose();
  }
}

export interface ExpiredCouponResult {
  code: string;
  amount: number;
  expiryDate: string;
}

/** Get latest expired coupon */
export async function getExpiredCoupon(): Promise<ExpiredCouponResult> {
  const token = await getBackendAdminToken();
  const baseURL = apiUrl('api-backend', getTargetEnv());

  const path = '/api/coupons?search=&from=1&to=200&type=single';

  const ctx = await pwRequest.newContext({ baseURL });

  try {
    const res = await ctx.get(path, {
      headers: signedBackendHeaders(token, 'GET', path),
    });

    const data = await res.json();

    const now = new Date();

    const expiredCoupon = data.couponDetails
    .filter((coupon: any) => {
      const expiryDate = new Date(coupon.params.expiry.expiryDate);
      return expiryDate < now;
    })
    .sort((a: any, b: any) => b.id - a.id)[0];
    
    return {
      code: expiredCoupon.code,
      amount: expiredCoupon.params.benefit.amount,
      expiryDate: expiredCoupon.params.expiry.expiryDate,
    };
  } finally {
    await ctx.dispose();
  }
}

const GENERATE_MULTIPLE_COUPONS_PATH = '/api/coupons/generate-multiple';

export interface MultipleCouponOptions {
  prefix?: string;
  amount?: number;
  noOfCoupons?: number;
  startDate?: string;
  expiryDate?: string;
  allowedModules?: string[];
}

export interface MultipleCouponResponse {
  couponCodes: string[];
  amount: number;
}

export function multipleWalletGiftCouponPayload(
  options: MultipleCouponOptions = {},
) {
  const today = new Date();
  const expiry = new Date();
  expiry.setDate(today.getDate() + 7);

  return {
    prefix: options.prefix ?? `MUL${Date.now()}`,
    benefit: {
      name: 'giftOnWalletAmt',
      amount: options.amount ?? 100,
      minAmount: '',
      maxAmount: '',
      percentage: '',
      minOrderAmount: '',
      allowedModules: options.allowedModules ?? DEFAULT_ALLOWED_MODULES,
    },
    noOfCoupons: options.noOfCoupons ?? 2,
    startDate:
      options.startDate ??
      `${today.toISOString().split('T')[0]}T00:00:00+05:30`,
    expiryDate:
      options.expiryDate ??
      `${expiry.toISOString().split('T')[0]}T23:59:59+05:30`,
    notes: null,
  };
}

export async function createMultipleWalletGiftCoupons(
  options: MultipleCouponOptions = {},
): Promise<MultipleCouponResponse> {
  const body = multipleWalletGiftCouponPayload(options);

  const token = await getBackendAdminToken();
  const baseURL = apiUrl('api-backend', getTargetEnv());

  const ctx = await pwRequest.newContext({ baseURL });

  try {
    const res = await ctx.post(GENERATE_MULTIPLE_COUPONS_PATH, {
      headers: signedBackendHeaders(
        token,
        'POST',
        GENERATE_MULTIPLE_COUPONS_PATH,
        body,
      ),
      data: body,
    });

    const responseText = await res.text();

    console.log('Status:', res.status());
    console.log('Generate Multiple Coupon Response:');
    console.log(responseText);

    if (!res.ok()) {
      throw new Error(
        `POST ${GENERATE_MULTIPLE_COUPONS_PATH} failed: ${res.status()} ${responseText}`,
      );
    }

    const response = JSON.parse(responseText);

    console.log('Success Message:', response.message);

    return {
      couponCodes:
        response.couponCodes ??
        response.data?.couponCodes ??
        response.result?.couponCodes ??
        [],
      amount: body.benefit.amount,
    };
  } finally {
    await ctx.dispose();
  }
}