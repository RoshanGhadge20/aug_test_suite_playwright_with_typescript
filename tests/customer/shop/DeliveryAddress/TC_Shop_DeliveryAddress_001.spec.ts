import { test, expect } from '../../../../fixtures/base.fixture';
import { getShopDataset } from '../../../../utils/data/customer-excel-data';
import type { ShopBillingAddressDetails } from '../../../../pages/customer/shop-checkout.page';

test.describe('TC_Shop_DeliveryAddress_001 @customer-flows', () => {
  test('TC_Shop_DeliveryAddress_001-Edit billing address on checkout, pay and validate invoice', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC001 = (n: number): string => `TC001_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC001(n)}] ${title}`);
    };

    const { productName } = getShopDataset();
    let productAmount = 0;
    let payableAmount = 0;
    let placedOrderId = '';
    let savedBillingAddress: ShopBillingAddressDetails;

    await test.step('TC001_1 | Prepare gold coin listing', async () => {
      logSub(1, 'Prepare gold coin listing');
      await shopPage.prepareGoldCoinListing(shopCartPage);
    });

    await test.step('TC001_2 | Buy Now — select product and validate cart', async () => {
      logSub(2, 'Buy Now — select product and validate cart');
      await shopPage.verifyProductInCatalog();
      await shopPage.selectProduct(productName);
      productAmount = (await shopPage.getProductDetails()).grandTotal;
      console.log(`[${TC001(2)}] productName=${productName} | amount=${productAmount}`);
      await shopPage.clickBuyNowFromPdp();
      const cartItem = await shopCartPage.getCartItemDetails(productName);
      expect(cartItem.productName).toContain(productName);
      expect(cartItem.itemPrice).toBe(productAmount);
    });

    await test.step('TC001_3 | Proceed to checkout and validate address step', async () => {
      logSub(3, 'Proceed to checkout and validate address step');
      await shopCartPage.clickProceedToPay();
      await shopCheckoutPage.validateChooseBillingAddressCheckoutPage();
    });

    await test.step('TC001_4 | Select first address card and click Edit', async () => {
      logSub(4, 'Select first address card and click Edit');
      await shopCheckoutPage.selectBillingAddressCardByIndex(0);
      await shopCheckoutPage.clickEditOnBillingAddressCard(0);
      await shopCheckoutPage.updateCustomerDetails(
        'pragna',
        'diwan',
        '8141143966',
        'Satyamev vista'
      );
      await shopCheckoutPage.clickSetAsDefaultCheckbox();
    });

    await test.step('TC001_5 | Click Save and Continue', async () => {
      logSub(5, 'Click Save and Continue');
      await shopCheckoutPage.clickSaveAndContinue();
    });

    await test.step('TC001_6 | Verify edited card is selected and marked Default', async () => {
      logSub(6, 'Verify edited card is selected and marked Default');
      await shopCheckoutPage.verifyBillingAddressCardIsSelectedDefault(0, {
        fullName: 'pragna diwan',
        mobile: '8141143966',
        address: 'Satyamev vista',
      });
      savedBillingAddress = await shopCheckoutPage.getBillingAddress(0);
    });

    await test.step('TC001_7 | Billing to this address and same as billing', async () => {
      logSub(7, 'Billing to this address and same as billing');
      await shopCheckoutPage.clickBillingToThisAddress();
      await shopCheckoutPage.selectSameAsBillingAddress();
      await shopCheckoutPage.clickDeliverToThisAddress();
    });

    await test.step('TC001_8 | Checkout OTP verification', async () => {
      logSub(8, 'Checkout OTP verification');
      await shopCheckoutPage.validateCheckoutOtp();
    });

    await test.step('TC001_9 | Validate checkout Address Details', async () => {
      logSub(9, 'Validate checkout Address Details');
      await shopCheckoutPage.validateCheckoutAddressDetails(savedBillingAddress);
      const checkoutPrice = await shopCheckoutPage.getPriceDetails();
      // My Funds are auto-applied when balance > 0; Razorpay pays product total minus funds.
      payableAmount = productAmount - checkoutPrice.paidFromFunds;
      console.log(
        `[${TC001(9)}] productAmount=${productAmount} | paidFromFunds=${checkoutPrice.paidFromFunds} | payableAmount=${payableAmount}`,
      );
      expect(checkoutPrice.grandTotal).toBeCloseTo(payableAmount, 0);
    });

    await test.step('TC001_10 | Pay via netbanking', async () => {
      logSub(10, 'Pay via netbanking');
      await shopCheckoutPage.placeOrderViaNetbanking();
      await paymentPage.completeShopNetbankingPayment({ expectedAmount: payableAmount });
    });

    await test.step('TC001_11 | Confirm order placed', async () => {
      logSub(11, 'Confirm order placed');
      placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
    });

    await test.step('TC001_12 | Validate invoice — address, product name and amount', async () => {
      logSub(12, 'Validate invoice — address, product name and amount');
      await myOrderVerificationPage.validateShopBuyNowInvoiceAddressProductAndAmount({
        productName,
        amount: productAmount,
        billingAddress: savedBillingAddress,
        orderId: placedOrderId,
      });
    });
  });
});
