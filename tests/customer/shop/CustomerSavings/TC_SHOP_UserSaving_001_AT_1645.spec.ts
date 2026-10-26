import { test } from '../../../../fixtures/base.fixture';
import { getShopDataset } from '../../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../../pages/customer/shop.page';
import type { ShopBillingAddressDetails } from '../../../../pages/customer/shop-checkout.page';

test.describe('TC_SHOP_UserSaving_001 @customer-flows', () => {
  // TEMP: User Savings is disabled in the customer UI (2026-10-26). Remove this skip once it is re-enabled.
  test.skip(true, 'User Savings is temporarily disabled in the UI');
  test('TC_SHOP_UserSaving_001|AT-1645 - Shop gold coin flow fully paid payment by saving-spotorder', async ({
    dashboardPage,
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(480_000);

    const TC001 = (n: number): string => `TC001_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC001(n)}] ${title}`);
    };

    const productName = getShopDataset().productName;

    let productDetails: ShopProductDetails;
    let savedBillingAddress: ShopBillingAddressDetails;
    let placedOrderId = '';
    let cartNetWeight = '';
    let cartSavingsAmount = 0;
    let getTotalSilverbeforePurchase = 0;
    let getTotalGoldbeforePurchase = 0;
    let getcurrentValuebeforePurchase = 0;

    await test.step('TC001_1 | Dashboard — get portfolio before purchase', async () => {
      logSub(1, 'Dashboard — get portfolio before purchase');
        await dashboardPage.gotoDashboard();
       getcurrentValuebeforePurchase = await dashboardPage.getCurrentValue();
       getTotalGoldbeforePurchase = await dashboardPage.getTotalGold();
       getTotalSilverbeforePurchase = await dashboardPage.getTotalSilver();
      
      console.log('currentValuebeforePurchase', getcurrentValuebeforePurchase); 
      console.log('totalGoldbeforePurchase', getTotalGoldbeforePurchase);    
      console.log('totalSilverbeforePurchase', getTotalSilverbeforePurchase);  
    });

    await test.step('TC001_2 | Prepare gold coin listing', async () => {
      logSub(2, 'Prepare gold coin listing');
      await shopPage.prepareGoldCoinListing(shopCartPage);
    });

    await test.step('TC001_3 | Create savings purchase — catalog, cart', async () => {
      logSub(3, 'Create savings purchase — catalog, cart');
      await shopPage.verifyProductInCatalog(productName);
      productDetails = await shopPage.selectProductAndCaptureDetails(productName);
      await shopPage.clickBuyNowFromPdp();
      const cart = await shopCartPage.validateBuyNowCartWithFullSavings(productDetails, productName);
      cartNetWeight = cart.netWeight;
      cartSavingsAmount = cart.cartSavingsAmount;
    });

    await test.step('TC001_4 | Checkout with full savings', async () => {
      logSub(4, 'Checkout with full savings');
      await shopCartPage.clickProceedToPay();
      savedBillingAddress = await shopCheckoutPage.validateBillingWithFullSavingsAndConfirm(
        cartSavingsAmount,
      );
      await shopCheckoutPage.validateCheckoutOtp();
      await shopCheckoutPage.validateFullSavingsOrderSummaryAndPay({
        productName,
        productDetails,
        cartSavingsAmount,
      });
    });

    await test.step('TC001_5 | Confirm Buy Now order placed', async () => {
      logSub(5, 'Confirm Buy Now order placed');
      placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
    });

    await test.step('TC001_6 | My Orders — validate Buy Now order on list', async () => {
      logSub(6, 'My Orders — validate Buy Now order on list');
      await myOrderVerificationPage.openAndValidateShopBuyNowOrderOnList({
        productName,
        productDetails,
        placedOrderId,
      });
    });

    await test.step('TC001_7 | My Orders — validate Buy Now order detail', async () => {
      logSub(7, 'My Orders — validate Buy Now order detail');
      await myOrderVerificationPage.validateShopBuyNowOrderDetailSummary({
        productName,
        productDetails,
        placedOrderId,
      });
    });

    await test.step('TC001_8 | My Orders — validate Buy Now invoice', async () => {
      logSub(8, 'My Orders — validate Buy Now invoice');
      await myOrderVerificationPage.validateShopBuyNowInvoice({
        productDetails,
        placedOrderId,
        productName,
      });
    });

    await test.step('TC001_9 | Dashboard — validate portfolio after purchase', async () => {
      logSub(9, 'Dashboard — validate portfolio after purchase');
      await dashboardPage.validateShopPortfolioAfterFullSavingsPurchase({
        productName,
        productDetails,
        cartNetWeight,
        getTotalGoldbeforePurchase,
        getTotalSilverbeforePurchase,
        getcurrentValuebeforePurchase,
        savingsAmount: cartSavingsAmount,
      });
    });
  });
});
