import { createMultipleWalletGiftCoupons } from '../../../../api-services/admin/create-wallet-gift-coupon';

import { test, expect } from '@playwright/test';

test('TC_Shop_Coupon_004-Generate multiple wallet gift coupons', async () => {
    const result = await createMultipleWalletGiftCoupons({
      prefix: 'MULCOUPON',
      amount: 100,
      noOfCoupons: 3,
      //startDate: '2026-06-23T00:00:00+05:30',
      //expiryDate: '2026-06-26T23:59:59+05:30',
      allowedModules: ['buy', 'emi'],
    });
  
    console.log('Multiple Coupon Response:', JSON.stringify(result, null, 2));
  
  });
  
