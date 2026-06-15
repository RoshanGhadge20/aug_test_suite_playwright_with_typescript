import { request as pwRequest } from '@playwright/test';
import { apiUrl } from '../../config/urls';
import { getTargetEnv } from '../../config/environments';
import { TestDataFactory } from '../data/test-data.factory';
import { getBackendAdminToken } from './backend-admin-auth';
import { signedBackendHeaders } from './backend-api-signature';

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

export function walletGiftCouponPayload(code: string, options: WalletGiftCouponOptions = {}) {
  const {
    amount = 100,
    startDate = '2026-06-09T00:00:00+05:30',
    expiryDate = '2026-06-17T23:59:59+05:30',
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
