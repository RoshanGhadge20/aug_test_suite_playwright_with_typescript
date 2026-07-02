import { test, expect } from '../../../../fixtures/base.fixture';

import { getTargetEnv } from '../../../../config/environments';

import { panelCreds } from '../../../../config/urls';
import { getBuyMetalDataset } from '../../../../utils/data/customer-excel-data';


import { createWalletGiftCoupon } from '../../../../utils/api/create-wallet-gift-coupon';

import type { ShopProductDetails } from '../../../../pages/customer/shop.page';

import type { ShopBillingAddressDetails } from '../../../../pages/customer/shop-checkout.page';

import {

  clearCustomerBrowserStorage,

  persistCustomerStorageState,

  resolveAltCustomerMobile,

  resolveAltCustomerOtp,

} from '../../helpers/customer-alt-user.helpers';



const TC005_COUPON_AMOUNT = 100;

const TC005_GOLD_SETUP_AMOUNT = '500';


test.describe('TC_SHOP_UserSaving_005 @customer-flows', () => {

  test.describe('TC_SHOP_UserSaving_005 alt customer session', () => {

    test.use({ storageState: { cookies: [], origins: [] } });



    test('TC_SHOP_UserSaving_005 - Shop Buy Now: coupon ₹100 + partial User Savings, Razorpay remainder > 0', async ({

      page,

      customerLogin,
      dashboardPage,
      buyMetalPage,
      buySummaryPage,
      shopPage,
      shopCartPage,
      shopCheckoutPage,
      paymentPage,
      myOrderVerificationPage,

    }) => {

      test.setTimeout(420_000);



      const TC005 = (n: number): string => `TC005_${n}`;

      const logSub = (n: number, title: string): void => {

        console.log(`\n[${TC005(n)}] ${title}`);

      };



      let couponCode = '';

      let productName = '';

      let productDetails: ShopProductDetails;

      let placedOrderId = '';

      let cartNetWeight = '';

      let billingAddress: ShopBillingAddressDetails;

      const altCustomerMobile = resolveAltCustomerMobile();

      const altCustomerOtp = resolveAltCustomerOtp();
      const { netbankingBankName } = getBuyMetalDataset();



      await test.step('TC005_0 | Login alt customer', async () => {
        logSub(0, 'Fresh login as alt customer');
        console.log(
          `[${TC005(0)}] Logging in as ${altCustomerMobile} using ${getTargetEnv().toUpperCase()} customer OTP.`,
        );
        await customerLogin.login(altCustomerMobile, altCustomerOtp);
        let withdrawVisible = await dashboardPage.isWithdrawVisibleOnDashboard(20_000);
        if (!withdrawVisible) {
          console.log(
            `[${TC005(0)}] Withdraw not visible — buying ₹${TC005_GOLD_SETUP_AMOUNT} gold via Buy Now.`,
          );
          await buyMetalPage.placeOneTimeOrder('gold', TC005_GOLD_SETUP_AMOUNT);
          await buySummaryPage.clickPayNowButton();
          await paymentPage.completeNetbankingBuyNowPayment(
            altCustomerMobile,
            Number(TC005_GOLD_SETUP_AMOUNT),
            netbankingBankName,
          );
          withdrawVisible = await dashboardPage.isWithdrawVisibleOnDashboard(25_000);
        }
        expect(
          withdrawVisible,
          'Withdraw button should be visible on dashboard after netbanking setup in TC005_0',
        ).toBe(true);
      });



      await test.step('TC005_1 | Create partial savings + coupon purchase — cart, checkout, Razorpay pay', async () => {

        logSub(1, 'Create partial savings + coupon purchase — cart, checkout, Razorpay pay');

        const selected = await shopPage.addBuyNowProductForPartialSavingsWithCoupon(

          shopCartPage,

          TC005_COUPON_AMOUNT,

        );

        productName = selected.productName;

        productDetails = selected.productDetails;

        shopCartPage.assertTc016CouponPartialSavingsPreconditions(

          productDetails.grandTotal,

          selected.availableSavings,

          TC005_COUPON_AMOUNT,

        );



        const coupon = await createWalletGiftCoupon({ amount: TC005_COUPON_AMOUNT });

        couponCode = coupon.code;

        console.log('[coupon]', couponCode, '| amount', coupon.amount);

        expect(couponCode).toMatch(/^SIN[0-9a-f]+$/i);

        expect(coupon.amount).toBe(TC005_COUPON_AMOUNT);



        await shopCartPage.applyCouponCode(couponCode);
        await shopCartPage.clickUseSavingCheckbox();
        const cartItem = await shopCartPage.getCartItemDetails(productName);

        cartNetWeight = cartItem.netWeight;



        await shopCartPage.clickProceedToPay();

        const partial = await shopCheckoutPage.validatePartialSavingsCouponCheckout({

          productDetails,

          couponAmount: TC005_COUPON_AMOUNT,

        });

        billingAddress = await shopCheckoutPage.getBillingAddress();

        await shopCheckoutPage.confirmBillingAndDelivery();

        await shopCheckoutPage.validateCheckoutOtp(altCustomerMobile, altCustomerOtp);

        const payableAmount = await shopCheckoutPage.validatePartialSavingsCouponOrderSummary({

          productDetails,

          cartSavingsAmount: partial.cartSavingsAmount,

          couponAmount: TC005_COUPON_AMOUNT,

        });

        expect(payableAmount).toBeGreaterThan(0);

        await shopCheckoutPage.placeOrderViaNetbanking();

        await paymentPage.completeShopNetbankingPayment({ expectedAmount: payableAmount });

      });



      await test.step('TC005_2 | Confirm Buy Now order placed', async () => {

        logSub(2, 'Confirm Buy Now order placed');

        placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();

      });



      await test.step('TC005_3 | My Orders — validate Buy Now order on list', async () => {

        logSub(3, 'My Orders — validate Buy Now order on list');

        await myOrderVerificationPage.openAndValidateShopBuyNowOrderOnList({

          productName,

          productDetails,

          placedOrderId,

        });

      });



      await test.step('TC005_4 | My Orders — validate Buy Now order detail', async () => {

        logSub(4, 'My Orders — validate Buy Now order detail');

        const shopOrder = await myOrderVerificationPage.getShopOrderDetails(productName);

        await myOrderVerificationPage.validateShopBuyNowOrderDetail({

          productDetails,

          cartNetWeight,

          savedBillingAddress: billingAddress,

          shopOrder,

          productName,

          placedPaymentMethod: 'Netbanking',

        });

      });



      await test.step('TC005_5 | My Orders — validate Buy Now invoice', async () => {

        logSub(5, 'My Orders — validate Buy Now invoice');

        await myOrderVerificationPage.validateShopBuyNowInvoice({

          productDetails,

          placedOrderId,

          productName,

          invoicePassword: altCustomerMobile.replace(/\D/g, '').slice(-4),

        });

      });



      await test.step('TC005_6 | Restore default customer session', async () => {

        logSub(6, 'Persist default customer storage state for following tests');

        const { mobile: defaultMobile, otp } = panelCreds('customer', getTargetEnv());

        const altMobile = resolveAltCustomerMobile();



        if (defaultMobile !== altMobile) {

          console.log(

            `[${TC005(6)}] Switching from alt ${altMobile} to default ${defaultMobile}.`,

          );

          await clearCustomerBrowserStorage(page);

          await customerLogin.login(defaultMobile, otp);

          await page.goto('/dashboard');

        } else {

          console.log(

            `[${TC005(6)}] Alt user matches default (${defaultMobile}); skipping re-login.`,

          );

        }

        await persistCustomerStorageState(page);

      });

    });

  });

});


