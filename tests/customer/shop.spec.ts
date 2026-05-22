
import { test, expect } from '../../fixtures/base.fixture';
import { getTargetEnv } from '../../config/environments';
import { getShopDataset, getShopTc002Dataset, getShopTc003Dataset } from '../../utils/data/customer-excel-data';
import * as altCustomer from './helpers/customer-alt-user.helpers';
import type { ShopProductDetails } from '../../pages/customer/shop.page';
import type { ShopEmiDetails } from '../../pages/customer/shop-emi.page';
import type { ShopPlacedOrders } from '../../pages/customer/shop-checkout.page';
import * as pdfUtils from '../../utils/pdf-utils';
import * as shopPdfUtils from '../../utils/shop-pdf-utils';

const shopDataset = getShopDataset();
const shopTc002Dataset = getShopTc002Dataset();
const shopTc003Dataset = getShopTc003Dataset();

const weightGramsFromText = (value: string): number => Number(value.match(/[\d.]+/)?.[0] ?? 0);

/** TC_SHOP_002 only â€” PDP weight can read as "gram" only; fall back to cart or product name. */
const expectedShopWeightGrams = (
  productName: string,
  pdp: ShopProductDetails,
  cartNetWeight: string,
): number => {
  const fromPdp = weightGramsFromText(pdp.productWeight);
  if (fromPdp > 0) return fromPdp;
  const fromCart = weightGramsFromText(cartNetWeight);
  if (fromCart > 0) return fromCart;
  return Number(productName.match(/(\d+(?:\.\d+)?)\s*gm/i)?.[1] ?? 0);
};

test.describe('customer shop flows @customer-flows', () => {
  /**
   * TC_SHOP_001 â€” single-product baseline (Excel `ShopTc001*`, `getOrderPlacedDetails`, full PDP + EMI).
   * Keep this testâ€™s steps, assertions, and data sources stable unless intentionally changing TC001 scope.
   */
  test('TC_SHOP_001 - Gold coin shop flow: filter, cart validation and checkout billing', async ({
    page,
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    paymentPage,
    dashboardPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC = (n: number): string => `TC_SHOP_001_${n}`;
    const log = (n: number, title: string): void => console.log(`\n[${TC(n)}] ${title}`);
    const logActualExpected = (n: number, label: string, actual: unknown, expected: unknown): void => {
      console.log(`[${TC(n)}] ${label} | Actual:`, actual, '| Expected:', expected);
    };

    const productName = shopDataset.productName;
    let productDetails: Awaited<ReturnType<typeof shopPage.getProductDetails>>;
    let savedBillingAddress: Awaited<ReturnType<typeof shopCheckoutPage.getBillingAddress>>;
    let placedOrderId = '';
    let placedOrderSuccessMessage = '';
    let placedPaymentMethod = '';
    let shopOrderFromStep12: Awaited<ReturnType<typeof myOrderVerificationPage.getShopOrderDetails>>;
    let cartNetWeight = '';

    await test.step('TC_SHOP_001_1 | Clear cart', async () => {
      log(1, 'Clear cart from dashboard shop');
      await page.goto('/shop-new/cart');
      const removed = await shopCartPage.removeAllCartItems();
      console.log(`[${TC(1)}] Removed products:`, removed.join(' | ') || '(none)');
      expect(await shopCartPage.getCartItemCount()).toBe(0);
    });

    await test.step('TC_SHOP_001_2 | Open shop product listing', async () => {
      log(2, 'Open shop product listing');
      await shopPage.open();
      await expect(page).toHaveURL(/shop-new\/product/i);
    });

    await test.step('TC_SHOP_001_3 | Apply Gold Coin and price filters', async () => {
      log(3, 'Apply Gold Coin and price filters');
      await shopPage.clickGoldCoinCheckbox();
      await shopPage.clickPriceRangeRadio();
    });

    await test.step('TC_SHOP_001_4 | Verify Excel product in filtered list', async () => {
      log(4, 'Get filtered product list and verify Excel product');
      console.log(`[${TC(4)}] Product from testdata/customer/customer-data.xlsx:`, productName);
      const { count, names } = await shopPage.scrollDownAndGetProducts();
      console.log(`[${TC(4)}] UI results count:`, count);
      console.log(`[${TC(4)}] Product names:`, names.join(' | '));
      expect(count).toBeGreaterThan(0);
      expect(names).toContain(productName);
    });

    await test.step('TC_SHOP_001_5 | Select product and capture details', async () => {
      log(5, 'Select product and capture product details');
      await shopPage.selectProduct(productName);
      productDetails = await shopPage.getProductDetails();
      console.log(`[${TC(5)}] Product Name:`, productDetails.productName);
      console.log(`[${TC(5)}] Price:`, productDetails.price);
      console.log(`[${TC(5)}] MRP Note:`, productDetails.mrpNote);
      console.log(`[${TC(5)}] EMI:`, productDetails.emiText);
      console.log(`[${TC(5)}] Quantity:`, productDetails.quantity);
      console.log(`[${TC(5)}] SKU:`, productDetails.sku);
      console.log(`[${TC(5)}] Metal Type:`, productDetails.metalType);
      console.log(`[${TC(5)}] Purity:`, productDetails.purity);
      console.log(`[${TC(5)}] Product Weight:`, productDetails.productWeight);
      console.log(`[${TC(5)}] 24 KT Gold Price:`, productDetails.goldPrice);
      console.log(`[${TC(5)}] Making & Delivery Charges:`, productDetails.makingAndDeliveryCharges);
      console.log(`[${TC(5)}] TAX:`, productDetails.tax);
      console.log(`[${TC(5)}] Grand Total:`, productDetails.grandTotal);
      console.log(`[${TC(5)}] Returns Policy:`, productDetails.returnsPolicy);
      console.log(`[${TC(5)}] Trust Badges:`, productDetails.trustBadges.join(' | '));
      expect(productDetails.productName).toContain(productName);
      expect(productDetails.grandTotal).toBeGreaterThan(0);
    });

    await test.step('TC_SHOP_001_6 | Buy Now adds product to cart', async () => {
      log(6, 'Verify Buy with EMI and Buy Now, add product to cart');
      await expect(shopPage.buyWithEmi).toBeVisible();
      await expect(shopPage.buyNow).toBeVisible();
      console.log(`[${TC(6)}] Buy with EMI button is displayed`);
      console.log(`[${TC(6)}] Buy Now button is displayed`);
      await shopPage.clickBuyNow();
      console.log(`[${TC(6)}] Clicked Buy Now button`);
    });

    await test.step('TC_SHOP_001_7 | Validate cart against product', async () => {
      log(7, 'Validate cart item and price details against product');
      const cartItem = await shopCartPage.getCartItemDetails(productName);
      cartNetWeight = cartItem.netWeight;
      const cartPrice = await shopCartPage.getCartPriceDetails();
      console.log(`[${TC(7)}] Cart Product Name:`, cartItem.productName);
      console.log(`[${TC(7)}] Cart Net Weight:`, cartItem.netWeight);
      console.log(`[${TC(7)}] Cart Quantity:`, cartItem.quantity);
      console.log(`[${TC(7)}] Cart Item Price:`, cartItem.itemPrice);
      console.log(`[${TC(7)}] Cart Metal Price:`, cartPrice.metalPrice);
      console.log(`[${TC(7)}] Cart Making & Delivery:`, cartPrice.makingAndDeliveryCharges);
      console.log(`[${TC(7)}] Cart Tax:`, cartPrice.tax);
      console.log(`[${TC(7)}] Cart Grand Total:`, cartPrice.grandTotal);
      expect(cartItem.productName).toContain(productName);
      expect(cartItem.itemPrice).toBe(productDetails.grandTotal);
      expect(cartPrice.metalPrice).toBe(productDetails.goldPrice);
      expect(cartPrice.makingAndDeliveryCharges).toBe(productDetails.makingAndDeliveryCharges);
      expect(cartPrice.tax).toBe(productDetails.tax);
      expect(cartPrice.grandTotal).toBe(productDetails.grandTotal);
    });

    await test.step('TC_SHOP_001_8 | Checkout billing and delivery', async () => {
      log(8, 'Checkout prices, billing address and confirm billing');
      await shopCartPage.clickProceedToPay();
      await shopCheckoutPage.waitForCheckoutPage();

      const checkoutPrice = await shopCheckoutPage.getPriceDetails();
      const checkoutPriceSum = shopCheckoutPage.getCalculatedGrandTotal(checkoutPrice);
      console.log(`[${TC(8)}] Checkout Metal Price:`, checkoutPrice.metalPrice);
      console.log(`[${TC(8)}] Checkout Making & Delivery:`, checkoutPrice.makingAndDeliveryCharges);
      console.log(`[${TC(8)}] Checkout Paid From Funds:`, checkoutPrice.paidFromFunds);
      console.log(`[${TC(8)}] Checkout Tax:`, checkoutPrice.tax);
      console.log(`[${TC(8)}] Checkout Price Sum:`, checkoutPriceSum);
      console.log(`[${TC(8)}] Checkout Grand Total:`, checkoutPrice.grandTotal);
      expect(checkoutPrice.grandTotal).toBe(productDetails.grandTotal);
      expect(checkoutPrice.paidFromFunds).toBe(0);

      savedBillingAddress = await shopCheckoutPage.getBillingAddress();
      console.log(`[${TC(8)}] Selected billing full name:`, savedBillingAddress.fullName);
      console.log(`[${TC(8)}] Selected billing address:`, savedBillingAddress.address);
      console.log(`[${TC(8)}] Selected billing pincode:`, savedBillingAddress.pincode);
      console.log(`[${TC(8)}] Selected billing mobile:`, savedBillingAddress.mobile || '(not shown)');
      expect(savedBillingAddress.address).toBeTruthy();
      expect(savedBillingAddress.pincode).toMatch(/^\d{6}$/);

      await shopCheckoutPage.confirmBillingAndDelivery();
      console.log(`[${TC(8)}] Confirmed billing and delivery address`);
    });

    await test.step('TC_SHOP_001_9 | OTP verify', async () => {
      log(9, 'Verify OTP sent to mobile, enter OTP and click Verify');
      const sentToText = await shopCheckoutPage.getOtpSentToText();
      console.log(`[${TC(9)}] OTP Sent to text:`, sentToText);
      console.log(`[${TC(9)}] Expected mobile (shop sheet):`, shopDataset.mobile);
      expect(sentToText.replace(/\D/g, '').slice(-10)).toBe(shopDataset.mobile.replace(/\D/g, '').slice(-10));
      await shopCheckoutPage.submitOtp(shopDataset.otp);
      console.log(`[${TC(9)}] OTP entered:`, shopDataset.otp);
      console.log(`[${TC(9)}] Clicked Verify button`);
    });

    await test.step('TC_SHOP_001_10 | Summary cart, prices and addresses', async () => {
      log(10, 'Verify cart details and billing/delivery address after OTP');
      await shopCheckoutPage.waitForOrderSummary();

      const orderItem = await shopCheckoutPage.getOrderItemDetails(productName);
      const checkoutPrice = await shopCheckoutPage.getPriceDetails();
      console.log(`[${TC(10)}] Order Product Name:`, orderItem.productName);
      console.log(`[${TC(10)}] Order Quantity:`, orderItem.quantity);
      console.log(`[${TC(10)}] Order Item Price:`, orderItem.itemPrice);
      console.log(`[${TC(10)}] Checkout Metal Price:`, checkoutPrice.metalPrice);
      console.log(`[${TC(10)}] Checkout Tax:`, checkoutPrice.tax);
      console.log(`[${TC(10)}] Checkout Grand Total:`, checkoutPrice.grandTotal);
      expect(orderItem.productName).toContain(productName);
      expect(orderItem.itemPrice).toBe(productDetails.grandTotal);
      expect(checkoutPrice.grandTotal).toBe(productDetails.grandTotal);

      const deliveryAddress = await shopCheckoutPage.getDeliveryAddress();
      const billingAddress = await shopCheckoutPage.getBilledToAddress();
      console.log(`[${TC(10)}] Delivery Full Name:`, deliveryAddress.fullName);
      console.log(`[${TC(10)}] Delivery Address:`, deliveryAddress.address);
      console.log(`[${TC(10)}] Delivery Pincode:`, deliveryAddress.pincode);
      console.log(`[${TC(10)}] Billing Full Name:`, billingAddress.fullName);
      console.log(`[${TC(10)}] Billing Address:`, billingAddress.address);
      console.log(`[${TC(10)}] Billing Pincode:`, billingAddress.pincode);

      console.log(`[${TC(10)}] Validate step 8 selected billing vs summary delivery`);
      expect(deliveryAddress.fullName).toBe(savedBillingAddress.fullName);
      expect(deliveryAddress.address).toBe(savedBillingAddress.address);
      expect(deliveryAddress.pincode).toBe(savedBillingAddress.pincode);

      console.log(`[${TC(10)}] Validate step 8 selected billing vs summary billed-to`);
      expect(billingAddress.fullName).toBe(savedBillingAddress.fullName);
      expect(billingAddress.address).toBe(savedBillingAddress.address);
      expect(billingAddress.pincode).toBe(savedBillingAddress.pincode);

      if (savedBillingAddress.mobile) {
        expect(deliveryAddress.mobile).toBe(savedBillingAddress.mobile);
        expect(billingAddress.mobile).toBe(savedBillingAddress.mobile);
        console.log(`[${TC(10)}] Mobile matches step 8:`, savedBillingAddress.mobile);
      }

      expect(deliveryAddress.pincode).toBe(billingAddress.pincode);
    });

    await test.step('TC_SHOP_001_11 | Netbanking payment via Razorpay', async () => {
      log(11, 'Select Netbanking, Pay and complete Razorpay netbanking');
      placedPaymentMethod = 'Netbanking';
      await shopCheckoutPage.selectNetbanking();
      console.log(`[${TC(11)}] Selected payment method:`, placedPaymentMethod);
      await shopCheckoutPage.clickPay();
      console.log(`[${TC(11)}] Clicked Pay button`);

      const razorpayAmountRaw = await paymentPage.getPriceSummaryAmountFromFrame();
      const expectedAmount = productDetails.grandTotal;
      const razorpayAmountNormalized =
        razorpayAmountRaw > expectedAmount * 10
          ? Number((razorpayAmountRaw / 100).toFixed(2))
          : razorpayAmountRaw;
      console.log(`[${TC(11)}] Razorpay amount raw:`, razorpayAmountRaw);
      console.log(`[${TC(11)}] Razorpay amount normalized:`, razorpayAmountNormalized);
      console.log(`[${TC(11)}] Expected grand total:`, expectedAmount);
      expect(Math.abs(razorpayAmountNormalized - expectedAmount)).toBeLessThanOrEqual(1);

      await paymentPage.fillContactNumber(shopDataset.mobile);
      console.log(`[${TC(11)}] Razorpay contact number:`, shopDataset.mobile);
      await paymentPage.clickRazorpayContinue();
      await paymentPage.selectNetbanking();
      console.log(`[${TC(11)}] Selected Netbanking in Razorpay`);
      await paymentPage.completeNetbankingPayment('HDFC Bank');
      console.log(`[${TC(11)}] Completed HDFC Bank netbanking payment`);

      const orderPlaced = await shopCheckoutPage.getOrderPlacedDetails();
      placedOrderId = orderPlaced.orderId;
      placedOrderSuccessMessage = orderPlaced.successMessage;
      console.log(`[${TC(11)}] Order success message:`, placedOrderSuccessMessage);
      console.log(`[${TC(11)}] Order ID:`, placedOrderId);
      expect(placedOrderId).toMatch(/^\d+$/);
      expect(orderPlaced.successMessage).toMatch(/booked/i);
      await shopCheckoutPage.dismissOrderPlacedDialog();
    });

    await test.step('TC_SHOP_001_12 | My orders SHOP tab validate order vs product', async () => {
      log(12, 'My Orders SHOP tab â€” validate order against product details');
      await myOrderVerificationPage.goToMyOrders();
      await myOrderVerificationPage.clickShopTabSingleOrder();

      shopOrderFromStep12 = await myOrderVerificationPage.getShopOrderDetails(productName);
      const orderDate = await myOrderVerificationPage.getShopOrderDate(productName);

      console.log(`[${TC(12)}] My Orders Product Name:`, shopOrderFromStep12.productName);
      console.log(`[${TC(12)}] My Orders Order Id:`, shopOrderFromStep12.orderId);
      console.log(`[${TC(12)}] My Orders Status:`, shopOrderFromStep12.status);
      console.log(`[${TC(12)}] My Orders Quantity:`, shopOrderFromStep12.quantity);
      console.log(`[${TC(12)}] My Orders Price:`, shopOrderFromStep12.priceAmount);
      console.log(`[${TC(12)}] Ordered On Date:`, orderDate);
      console.log(`[${TC(12)}] Order is on date:`, myOrderVerificationPage.isOrderedOnToday(orderDate));

      console.log(`[${TC(12)}] Validate my orders vs product details from step 5`);
      logActualExpected(12, 'Product name', shopOrderFromStep12.productName, productName);
      logActualExpected(12, 'Quantity', shopOrderFromStep12.quantity, Number(productDetails.quantity) || 1);
      logActualExpected(12, 'Price', shopOrderFromStep12.priceAmount, productDetails.grandTotal);
      logActualExpected(12, 'Order Id', shopOrderFromStep12.orderId, placedOrderId);
      logActualExpected(12, 'Order Date', orderDate, 'ORDERED ON (today)');
      logActualExpected(
        12,
        'Order date is today',
        myOrderVerificationPage.isOrderedOnToday(orderDate),
        true,
      );
      expect(shopOrderFromStep12.productName).toContain(productName);
      expect(shopOrderFromStep12.quantity).toBe(Number(productDetails.quantity) || 1);
      expect(shopOrderFromStep12.priceAmount).toBe(productDetails.grandTotal);
      expect(shopOrderFromStep12.orderId).toBe(placedOrderId);
      expect(shopOrderFromStep12.status).toMatch(/payment received/i);
      expect(orderDate).toMatch(/^ORDERED ON/i);
      expect(shopOrderFromStep12.orderedOn).toBe(orderDate);
      expect(myOrderVerificationPage.isOrderedOnToday(orderDate)).toBe(true);
    });

    await test.step('TC_SHOP_001_13 | View Detail validate order product vs step 5', async () => {
      log(13, 'View Detail â€” validate product, properties, addresses and payment');
      await myOrderVerificationPage.openShopOrderDetailSingle(productName);

      const detail = await myOrderVerificationPage.getShopOrderDetailView();
      const expectedNetWeightGm = expectedShopWeightGrams(productName, productDetails, cartNetWeight);
      logActualExpected(13, 'Detail product name', detail.productName, productName);
      logActualExpected(13, 'Detail net weight (g)', weightGramsFromText(detail.netWeight), expectedNetWeightGm);
      logActualExpected(13, 'Detail quantity', detail.quantity, Number(productDetails.quantity) || 1);
      logActualExpected(13, 'Detail price', detail.priceAmount, productDetails.grandTotal);
      expect(detail.productName).toContain(productName);
      expect(weightGramsFromText(detail.netWeight)).toBe(expectedNetWeightGm);
      expect(detail.quantity).toBe(Number(productDetails.quantity) || 1);
      expect(detail.priceAmount).toBe(productDetails.grandTotal);

      const props = await myOrderVerificationPage.getShopOrderProductProperties();
      console.log(`[${TC(13)}] Product Properties SKU:`, props.sku);
      console.log(`[${TC(13)}] Product Properties Metal Type:`, props.metalType);
      console.log(`[${TC(13)}] Product Properties Purity:`, props.purity);
      console.log(`[${TC(13)}] Product Properties Product Weight:`, props.productWeight);
      console.log(`[${TC(13)}] Step 5 SKU:`, productDetails.sku);
      console.log(`[${TC(13)}] Step 5 Metal Type:`, productDetails.metalType);
      console.log(`[${TC(13)}] Step 5 Purity:`, productDetails.purity);
      console.log(`[${TC(13)}] Step 5 Product Weight:`, productDetails.productWeight);
      if (productDetails.sku) {
        logActualExpected(13, 'SKU', props.sku, productDetails.sku);
        expect(props.sku).toBe(productDetails.sku);
      } else {
        logActualExpected(13, 'SKU (PDP empty)', props.sku, '(non-empty on order detail)');
        expect(props.sku, 'order detail should show SKU when PDP capture missed it').toBeTruthy();
      }
      logActualExpected(13, 'Metal Type', props.metalType, productDetails.metalType);
      logActualExpected(13, 'Purity', props.purity, productDetails.purity);
      logActualExpected(13, 'Product Weight (g)', weightGramsFromText(props.productWeight), expectedNetWeightGm);
      expect(props.metalType).toBe(productDetails.metalType);
      expect(props.purity).toBe(productDetails.purity);
      expect(weightGramsFromText(props.productWeight)).toBe(expectedNetWeightGm);

      const receivedAt = await myOrderVerificationPage.getShopOrderAddress('received');
      const billedAt = await myOrderVerificationPage.getShopOrderAddress('billed');
      console.log(`[${TC(13)}] Received At:`, receivedAt.fullName, receivedAt.pincode);
      console.log(`[${TC(13)}] Billed At:`, billedAt.fullName, billedAt.pincode);
      logActualExpected(13, 'Received At full name', receivedAt.fullName, savedBillingAddress.fullName);
      logActualExpected(13, 'Received At pincode', receivedAt.pincode, savedBillingAddress.pincode);
      logActualExpected(13, 'Billed At full name', billedAt.fullName, savedBillingAddress.fullName);
      logActualExpected(13, 'Billed At pincode', billedAt.pincode, savedBillingAddress.pincode);
      expect(receivedAt.fullName).toBe(savedBillingAddress.fullName);
      expect(receivedAt.address).toBe(savedBillingAddress.address);
      expect(receivedAt.pincode).toBe(savedBillingAddress.pincode);
      expect(billedAt.fullName).toBe(savedBillingAddress.fullName);
      expect(billedAt.address).toBe(savedBillingAddress.address);
      expect(billedAt.pincode).toBe(savedBillingAddress.pincode);

      const paymentMethod = await myOrderVerificationPage.getShopOrderPaymentMethod();
      logActualExpected(13, 'Payment method', paymentMethod, placedPaymentMethod);
      expect(paymentMethod).toMatch(new RegExp(placedPaymentMethod, 'i'));

      const orderStatusAndDate = await myOrderVerificationPage.getShopOrderDetailStatusAndDate();
      console.log(`[${TC(13)}] Order Id:`, orderStatusAndDate.orderId);
      console.log(`[${TC(13)}] Order Status:`, orderStatusAndDate.status);
      console.log(`[${TC(13)}] Ordered On Date:`, orderStatusAndDate.orderedOn);
      console.log(
        `[${TC(13)}] Order is on date:`,
        myOrderVerificationPage.isOrderedOnToday(orderStatusAndDate.orderedOn),
      );

      const orderDateTime = await myOrderVerificationPage.getShopOrderDetailDateTime();
      console.log(`[${TC(13)}] Order Date Time:`, orderDateTime.dateTimeText);
      console.log(`[${TC(13)}] Order Date:`, orderDateTime.orderDate);
      console.log(`[${TC(13)}] Order Time:`, orderDateTime.orderTime);
      console.log(
        `[${TC(13)}] Detail order is on date:`,
        myOrderVerificationPage.isOrderDateToday(orderDateTime.orderDate),
      );

      console.log(`[${TC(13)}] Step 12 Order Id:`, shopOrderFromStep12.orderId);
      console.log(`[${TC(13)}] Step 12 Status:`, shopOrderFromStep12.status);
      logActualExpected(13, 'Order Id', orderStatusAndDate.orderId, shopOrderFromStep12.orderId);
      logActualExpected(13, 'Order Status', orderStatusAndDate.status, shopOrderFromStep12.status);
      logActualExpected(13, 'Ordered On', orderStatusAndDate.orderedOn, shopOrderFromStep12.orderedOn);
      logActualExpected(13, 'Order Date Time', orderDateTime.dateTimeText, 'date | time format');
      logActualExpected(13, 'Order Date', orderDateTime.orderDate, 'today');
      logActualExpected(13, 'Order Time', orderDateTime.orderTime, 'HH:MM AM/PM');
      logActualExpected(
        13,
        'Detail order date is today',
        myOrderVerificationPage.isOrderDateToday(orderDateTime.orderDate),
        true,
      );
      expect(orderStatusAndDate.orderId).toBe(shopOrderFromStep12.orderId);
      expect(orderStatusAndDate.status).toBe(shopOrderFromStep12.status);
      expect(myOrderVerificationPage.isOrderedOnToday(orderStatusAndDate.orderedOn)).toBe(true);
      expect(myOrderVerificationPage.isOrderedOnToday(shopOrderFromStep12.orderedOn)).toBe(true);
      expect(orderDateTime.orderTime).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
      expect(myOrderVerificationPage.isOrderDateToday(orderDateTime.orderDate)).toBe(true);
    });

    await test.step('TC_SHOP_001_14 | Download invoice and validate', async () => {
      await test.step('14 setup â€” ensure order detail is open for invoice', async () => {
        log(14, `Ensure order detail for "${productName}"`);
        await myOrderVerificationPage.ensureShopOrderDetailForInvoice(productName);
      });

      await test.step('14a â€” Open invoice (see [Shop Invoice] logs)', async () => {
        log(14, 'Open shop invoice PDF â€” steps 1â€“6 logged by page object');
        await myOrderVerificationPage.clickShopInvoice({
          maxAttempts: 4,
          captureTimeoutMs: 12_000,
          productName,
        });
      });

      await test.step('14b â€” Unlock PDF with mobile password', async () => {
        log(14, 'Submit invoice PDF password â€” steps 7â€“9 logged by page object');
        await myOrderVerificationPage.submitShopInvoicePassword(shopDataset.mobile);
      });

      await test.step('14c â€” Download PDF and validate fields', async () => {
        const invoicePassword = shopDataset.mobile.replace(/\D/g, '').slice(-4);
        log(14, 'Download and parse PDF â€” step 10 logged by page object');
        const pdfUrl = await myOrderVerificationPage.getShopInvoicePdfUrl();
        console.log(`[${TC(14)}] Invoice PDF URL:`, pdfUrl);

        let response = await page.request.get(pdfUrl, { timeout: 30_000 });
        if (!response.ok()) {
          console.log(`[${TC(14)}] PDF download retry when response not OK`);
          await expect
            .poll(
              async () => {
                const retry = await page.request.get(pdfUrl, { timeout: 15_000 });
                if (retry.ok()) {
                  response = retry;
                  return true;
                }
                return false;
              },
              { timeout: 20_000, intervals: [500, 1000, 2000] },
            )
            .toBeTruthy();
        }
        logActualExpected(14, 'PDF response OK', response.ok(), true);
        expect(response.ok()).toBeTruthy();

        const pdfBuffer = await response.body();
        const rawPdfText = await shopPdfUtils.readShopInvoicePdf(pdfBuffer, invoicePassword);
        const pdfText = pdfUtils.normalizePdfText(rawPdfText);

        const invoiceNo = shopPdfUtils.extractShopInvoiceNumber(pdfText);
        const invoiceDate = shopPdfUtils.extractShopInvoiceDate(pdfText);
        const gstin = pdfUtils.extractGstin(pdfText);
        const cin = pdfUtils.extractCin(pdfText);
        const netPayable = shopPdfUtils.extractShopNetPayable(pdfText);
        const pdfHasOrderId = shopPdfUtils.shopPdfContainsOrderReference(pdfText, placedOrderId);
        const pdfHasProduct =
          shopPdfUtils.shopPdfContainsProductName(pdfText, productName) ||
          shopPdfUtils.shopPdfContainsProductName(pdfText, productDetails.productName);
        const invoiceDateMissingInPdf = shopPdfUtils.isShopInvoiceDateMissingInPdf(pdfText);
        const gstDetails = shopPdfUtils.extractShopInvoiceGstDetails(pdfText);
        const gstValidation = shopPdfUtils.validateShopInvoiceGst({
          taxableAmount: gstDetails.taxableAmount,
          netPayable,
          igstAmount: gstDetails.igstAmount,
          cgstAmount: gstDetails.cgstAmount,
          sgstAmount: gstDetails.sgstAmount,
          igstRatePercent: gstDetails.igstRatePercent ?? 3,
        });

        console.log(`[${TC(14)}] Invoice No:`, invoiceNo);
        console.log(`[${TC(14)}] Invoice Date:`, invoiceDate);
        console.log(`[${TC(14)}] GSTIN:`, gstin);
        console.log(`[${TC(14)}] CIN:`, cin);
        console.log(`[${TC(14)}] Net Payable:`, netPayable);
        console.log(`[${TC(14)}] Taxable (Net Total):`, gstDetails.taxableAmount);
        console.log(`[${TC(14)}] IGST:`, gstDetails.igstAmount, `@ ${gstDetails.igstRatePercent ?? 3}%`);
        console.log(`[${TC(14)}] CGST:`, gstDetails.cgstAmount ?? '(not in PDF)');
        console.log(`[${TC(14)}] SGST:`, gstDetails.sgstAmount ?? '(not in PDF)');

        logActualExpected(14, 'Invoice No', invoiceNo, 'non-empty');
        logActualExpected(14, 'Invoice Date', invoiceDate || (invoiceDateMissingInPdf ? 'NOT_IN_PDF' : ''), 'non-empty or NOT_IN_PDF');
        logActualExpected(14, 'GSTIN', gstin, 'non-empty');
        logActualExpected(14, 'CIN', cin, 'non-empty');
        logActualExpected(14, 'Order / Transaction ref in PDF', pdfHasOrderId, true);
        logActualExpected(14, 'Product name in PDF', pdfHasProduct, productName);
        logActualExpected(14, 'Net payable', netPayable, productDetails.grandTotal);

        if (gstDetails.igstAmount != null && gstDetails.igstAmount > 0) {
          const expectedIgst = Math.round(gstDetails.taxableAmount * ((gstDetails.igstRatePercent ?? 3) / 100) * 100) / 100;
          logActualExpected(14, 'IGST amount', gstDetails.igstAmount, expectedIgst);
        }
        if (gstDetails.cgstAmount != null && gstDetails.cgstAmount > 0) {
          const expectedCgst = Math.round(gstDetails.taxableAmount * 0.015 * 100) / 100;
          logActualExpected(14, 'CGST amount', gstDetails.cgstAmount, expectedCgst);
        }
        if (gstDetails.sgstAmount != null && gstDetails.sgstAmount > 0) {
          const expectedSgst = Math.round(gstDetails.taxableAmount * 0.015 * 100) / 100;
          logActualExpected(14, 'SGST amount', gstDetails.sgstAmount, expectedSgst);
        }
        logActualExpected(14, 'GST breakdown vs payable', gstValidation.ok, true);
        if (!gstValidation.ok) {
          console.log(`[${TC(14)}] GST validation notes:`, gstValidation.messages.join(' | '));
        }

        expect(invoiceNo).toBeTruthy();
        expect(invoiceDate || invoiceDateMissingInPdf).toBeTruthy();
        expect(gstin).toBeTruthy();
        expect(cin).toBeTruthy();
        expect(pdfHasOrderId).toBe(true);
        expect(pdfHasProduct).toBe(true);
        expect(Math.abs(netPayable - productDetails.grandTotal)).toBeLessThanOrEqual(1);
        if (gstDetails.igstAmount != null && gstDetails.igstAmount > 0) {
          expect(gstValidation.ok, gstValidation.messages.join('; ')).toBe(true);
        }
      });
    });
  });

  /**
   * TC_SHOP_002 â€” multi-product checkout; extends shared page objects only in backward-compatible ways.
   * Do not change TC_SHOP_001 above to satisfy TC002; add TC002-only logic here or in helpers with TC001-safe defaults.
   */
  test('TC_SHOP_002 - Multi-product gold coin shop flow: filter, cart, checkout and invoice', async ({
    page,
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(420_000);

    const TC = (n: number): string => `TC_SHOP_002_${n}`;
    const log = (n: number, title: string): void => console.log(`\n[${TC(n)}] ${title}`);
    const logActualExpected = (n: number, label: string, actual: unknown, expected: unknown): void => {
      console.log(`[${TC(n)}] ${label} | Actual:`, actual, '| Expected:', expected);
    };

    const productNames = shopTc002Dataset.productNames;
    /** Step 5 PDP fields, one object per Excel product name â€” use for later steps (cart, my orders, invoice). */
    const productDetailsByName: Record<string, ShopProductDetails> = {};
    const productLinePrices: Record<string, number> = {};
    const cartNetWeightByName: Record<string, string> = {};
    let savedBillingAddress: Awaited<ReturnType<typeof shopCheckoutPage.getBillingAddress>>;
    let placedOrders: ShopPlacedOrders;
    const orderIdByProduct: Record<string, string> = {};
    const shopOrdersByName: Record<
      string,
      Awaited<ReturnType<typeof myOrderVerificationPage.getShopOrderDetails>>
    > = {};
    let placedPaymentMethod = '';
    let combinedGrandTotal = 0;

    await test.step('TC_SHOP_002_1 | Clear cart', async () => {
      log(1, 'Clear cart from dashboard shop');
      await page.goto('/shop-new/cart');
      const removed = await shopCartPage.removeAllCartItems();
      console.log(`[${TC(1)}] Removed products:`, removed.join(' | ') || '(none)');
      expect(await shopCartPage.getCartItemCount()).toBe(0);
    });

    await test.step('TC_SHOP_002_2 | Open shop product listing', async () => {
      log(2, 'Open shop product listing');
      await shopPage.open();
      await expect(page).toHaveURL(/shop-new\/product/i);
    });

    await test.step('TC_SHOP_002_3 | Apply Gold Coin and price filters', async () => {
      log(3, 'Apply Gold Coin and price filters');
      await shopPage.clickGoldCoinCheckbox();
      await shopPage.clickPriceRangeRadio();
    });

    await test.step('TC_SHOP_002_4 | Verify Excel products in filtered list', async () => {
      log(4, 'Get filtered product list and verify Excel product');
      console.log(`[${TC(4)}] Product from testdata/customer/customer-data.xlsx:`, productNames.join(' | '));
      const { count, names } = await shopPage.scrollDownAndGetProducts();
      console.log(`[${TC(4)}] UI results count:`, count);
      console.log(`[${TC(4)}] Product names:`, names.join(' | '));
      expect(count).toBeGreaterThan(0);
      for (const name of productNames) {
        expect(names).toContain(name);
      }
    });

    await test.step('TC_SHOP_002_5 | Select products and capture details', async () => {
      log(5, 'Select product and capture product details');
      for (let i = 0; i < productNames.length; i++) {
        const name = productNames[i];
        // Same path for every product: listing â†’ Gold Coin + price filters â†’ PDP â†’ details (as TC_001 step 2â€“5).
        await shopPage.open();
        await shopPage.clickGoldCoinCheckbox();
        await shopPage.clickPriceRangeRadio();
        await shopPage.selectProduct(name);

        const details = await shopPage.getProductDetails();
        productDetailsByName[name] = details;

        await expect(shopPage.buyNow).toBeVisible();
        if (i === 0) {
          await expect(shopPage.buyWithEmi).toBeVisible();
          console.log(`[${TC(5)}] [${name}] Buy with EMI button is displayed`);
        } else if (await shopPage.buyWithEmi.isVisible().catch(() => false)) {
          console.log(`[${TC(5)}] [${name}] Buy with EMI button is displayed`);
        } else {
          console.log(`[${TC(5)}] [${name}] Buy with EMI not shown on this PDP`);
        }

        const tag = `Product ${i + 1}`;
        console.log(`[${TC(5)}] ${tag} Name:`, details.productName);
        console.log(`[${TC(5)}] ${tag} Price:`, details.price);
        console.log(`[${TC(5)}] ${tag} MRP Note:`, details.mrpNote);
        console.log(`[${TC(5)}] ${tag} EMI:`, details.emiText || '(not shown)');
        console.log(`[${TC(5)}] ${tag} Quantity:`, details.quantity);
        console.log(`[${TC(5)}] ${tag} SKU:`, details.sku);
        console.log(`[${TC(5)}] ${tag} Metal Type:`, details.metalType);
        console.log(`[${TC(5)}] ${tag} Purity:`, details.purity);
        console.log(`[${TC(5)}] ${tag} Product Weight:`, details.productWeight);
        console.log(`[${TC(5)}] ${tag} 24 KT Gold Price:`, details.goldPrice);
        console.log(`[${TC(5)}] ${tag} Making & Delivery Charges:`, details.makingAndDeliveryCharges);
        console.log(`[${TC(5)}] ${tag} TAX:`, details.tax);
        console.log(`[${TC(5)}] ${tag} Grand Total:`, details.grandTotal);
        console.log(`[${TC(5)}] ${tag} Returns Policy:`, details.returnsPolicy);
        console.log(`[${TC(5)}] ${tag} Trust Badges:`, details.trustBadges.join(' | '));
        expect(details.productName).toContain(name);
        expect(details.grandTotal).toBeGreaterThan(0);
      }

      expect(
        productNames.every((n) => productDetailsByName[n] != null),
        'Each Excel product must have its own PDP snapshot for later validation',
      ).toBe(true);
      const [name1, name2] = productNames;
      const pdp1 = productDetailsByName[name1];
      const pdp2 = productDetailsByName[name2];
      expect(pdp2, 'TC_SHOP_002 expects at least two products in Excel').toBeTruthy();
      console.log(`[${TC(5)}] Separate PDP stores (by product):`, {
        [name1]: { sku: pdp1.sku, grandTotal: pdp1.grandTotal },
        [name2]: { sku: pdp2.sku, grandTotal: pdp2.grandTotal },
      });
    });

    await test.step('TC_SHOP_002_6 | Add all products to cart', async () => {
      log(6, 'Verify Buy with EMI and Buy Now, add each product via Buy Now');

      for (let i = 0; i < productNames.length; i++) {
        if (i > 0) {
          await shopCartPage.continueShopping();
        } else {
          await shopPage.open();
        }
        await shopPage.clickGoldCoinCheckbox();
        await shopPage.clickPriceRangeRadio();
        await shopPage.selectProduct(productNames[i]);
        await expect(shopPage.buyNow).toBeVisible();
        await expect(shopPage.buyNow).toBeEnabled();
        if (i === 0) {
          await expect(shopPage.buyWithEmi).toBeVisible();
          console.log(`[${TC(6)}] Buy with EMI button is displayed`);
        }
        console.log(`[${TC(6)}] Buy Now button is displayed — product ${i + 1}:`, productNames[i]);
        await shopPage.clickBuyNow();
        console.log(`[${TC(6)}] Clicked Buy Now — product ${i + 1}:`, productNames[i]);
      }

      await page.goto('/shop-new/cart');
      await shopCartPage.waitForCart();
      const cartNames = await shopCartPage.getAllCartProductNames();
      console.log(`[${TC(6)}] Cart products:`, cartNames.join(' | '));
      expect(await shopCartPage.getCartItemCount()).toBe(productNames.length);
      for (const name of productNames) {
        expect(cartNames.some((cartName) => cartName.includes(name) || name.includes(cartName))).toBe(true);
      }
    });

    await test.step('TC_SHOP_002_7 | Validate cart for all products', async () => {
      log(7, 'Validate cart item and price details against product');
      let lineTotalSum = 0;

      for (let i = 0; i < productNames.length; i++) {
        const name = productNames[i];
        const cartItem = await shopCartPage.getCartItemDetails(name);
        console.log(`[${TC(7)}] Cart Product Name:`, cartItem.productName);
        console.log(`[${TC(7)}] Cart Net Weight:`, cartItem.netWeight);
        console.log(`[${TC(7)}] Cart Quantity:`, cartItem.quantity);
        console.log(`[${TC(7)}] Cart Item Price:`, cartItem.itemPrice);
        expect(cartItem.productName).toContain(name);
        expect(cartItem.itemPrice).toBe(productDetailsByName[name].grandTotal);
        cartNetWeightByName[name] = cartItem.netWeight;
        productLinePrices[name] = cartItem.itemPrice;
        lineTotalSum += cartItem.itemPrice;
      }

      const cartPrice = await shopCartPage.getCartPriceDetails();
      combinedGrandTotal = cartPrice.grandTotal;
      console.log(`[${TC(7)}] Cart Metal Price:`, cartPrice.metalPrice);
      console.log(`[${TC(7)}] Cart Making & Delivery:`, cartPrice.makingAndDeliveryCharges);
      console.log(`[${TC(7)}] Cart Tax:`, cartPrice.tax);
      console.log(`[${TC(7)}] Cart Grand Total:`, cartPrice.grandTotal);
      console.log(`[${TC(7)}] Sum of line items:`, lineTotalSum);
      expect(cartPrice.grandTotal).toBe(lineTotalSum);
      expect(cartPrice.grandTotal).toBeGreaterThan(productDetailsByName[productNames[0]].grandTotal);
    });

    await test.step('TC_SHOP_002_8 | Checkout billing and delivery', async () => {
      log(8, 'Checkout prices, billing address and confirm billing');
      await shopCartPage.clickProceedToPay();
      await shopCheckoutPage.waitForCheckoutPage();

      const checkoutPrice = await shopCheckoutPage.getPriceDetails();
      const checkoutPriceSum = shopCheckoutPage.getCalculatedGrandTotal(checkoutPrice);
      console.log(`[${TC(8)}] Checkout Metal Price:`, checkoutPrice.metalPrice);
      console.log(`[${TC(8)}] Checkout Making & Delivery:`, checkoutPrice.makingAndDeliveryCharges);
      console.log(`[${TC(8)}] Checkout Paid From Funds:`, checkoutPrice.paidFromFunds);
      console.log(`[${TC(8)}] Checkout Tax:`, checkoutPrice.tax);
      console.log(`[${TC(8)}] Checkout Price Sum:`, checkoutPriceSum);
      console.log(`[${TC(8)}] Checkout Grand Total:`, checkoutPrice.grandTotal);
      expect(checkoutPrice.grandTotal).toBe(combinedGrandTotal);
      expect(checkoutPrice.paidFromFunds).toBe(0);

      savedBillingAddress = await shopCheckoutPage.getBillingAddress();
      console.log(`[${TC(8)}] Selected billing full name:`, savedBillingAddress.fullName);
      console.log(`[${TC(8)}] Selected billing address:`, savedBillingAddress.address);
      console.log(`[${TC(8)}] Selected billing pincode:`, savedBillingAddress.pincode);
      console.log(`[${TC(8)}] Selected billing mobile:`, savedBillingAddress.mobile || '(not shown)');
      expect(savedBillingAddress.address).toBeTruthy();
      expect(savedBillingAddress.pincode).toMatch(/^\d{6}$/);

      await shopCheckoutPage.confirmBillingAndDelivery();
      console.log(`[${TC(8)}] Confirmed billing and delivery address`);
    });

    await test.step('TC_SHOP_002_9 | OTP verify', async () => {
      log(9, 'Verify OTP sent to mobile, enter OTP and click Verify');
      const sentToText = await shopCheckoutPage.getOtpSentToText();
      console.log(`[${TC(9)}] OTP Sent to text:`, sentToText);
      console.log(`[${TC(9)}] Expected mobile (shop sheet):`, shopDataset.mobile);
      expect(sentToText.replace(/\D/g, '').slice(-10)).toBe(shopDataset.mobile.replace(/\D/g, '').slice(-10));
      await shopCheckoutPage.submitOtp(shopDataset.otp);
      console.log(`[${TC(9)}] OTP entered:`, shopDataset.otp);
      console.log(`[${TC(9)}] Clicked Verify button`);
    });

    await test.step('TC_SHOP_002_10 | Summary cart, prices and addresses', async () => {
      log(10, 'Verify cart details and billing/delivery address after OTP');
      await shopCheckoutPage.waitForOrderSummary();

      for (let i = 0; i < productNames.length; i++) {
        const name = productNames[i];
        const orderItem = await shopCheckoutPage.getOrderItemDetails(name);
        const expectedPrice = productDetailsByName[name].grandTotal;
        console.log(`[${TC(10)}] Order Product Name:`, orderItem.productName);
        console.log(`[${TC(10)}] Order Quantity:`, orderItem.quantity);
        console.log(`[${TC(10)}] Order Item Price:`, orderItem.itemPrice);
        expect(orderItem.productName).toContain(name);
        expect(orderItem.itemPrice).toBe(expectedPrice);
      }

      const checkoutPrice = await shopCheckoutPage.getPriceDetails();
      console.log(`[${TC(10)}] Checkout Metal Price:`, checkoutPrice.metalPrice);
      console.log(`[${TC(10)}] Checkout Tax:`, checkoutPrice.tax);
      console.log(`[${TC(10)}] Checkout Grand Total:`, checkoutPrice.grandTotal);
      expect(checkoutPrice.grandTotal).toBe(combinedGrandTotal);

      const deliveryAddress = await shopCheckoutPage.getDeliveryAddress();
      const billingAddress = await shopCheckoutPage.getBilledToAddress();
      console.log(`[${TC(10)}] Delivery Full Name:`, deliveryAddress.fullName);
      console.log(`[${TC(10)}] Delivery Address:`, deliveryAddress.address);
      console.log(`[${TC(10)}] Delivery Pincode:`, deliveryAddress.pincode);
      console.log(`[${TC(10)}] Billing Full Name:`, billingAddress.fullName);
      console.log(`[${TC(10)}] Billing Address:`, billingAddress.address);
      console.log(`[${TC(10)}] Billing Pincode:`, billingAddress.pincode);

      console.log(`[${TC(10)}] Validate step 8 selected billing vs summary delivery`);
      expect(deliveryAddress.fullName).toBe(savedBillingAddress.fullName);
      expect(deliveryAddress.address).toBe(savedBillingAddress.address);
      expect(deliveryAddress.pincode).toBe(savedBillingAddress.pincode);

      console.log(`[${TC(10)}] Validate step 8 selected billing vs summary billed-to`);
      expect(billingAddress.fullName).toBe(savedBillingAddress.fullName);
      expect(billingAddress.address).toBe(savedBillingAddress.address);
      expect(billingAddress.pincode).toBe(savedBillingAddress.pincode);

      if (savedBillingAddress.mobile) {
        expect(deliveryAddress.mobile).toBe(savedBillingAddress.mobile);
        expect(billingAddress.mobile).toBe(savedBillingAddress.mobile);
        console.log(`[${TC(10)}] Mobile matches step 8:`, savedBillingAddress.mobile);
      }

      expect(deliveryAddress.pincode).toBe(billingAddress.pincode);
    });

    await test.step('TC_SHOP_002_11 | Netbanking payment via Razorpay', async () => {
      log(11, 'Select Netbanking, Pay and complete Razorpay netbanking');
      placedPaymentMethod = 'Netbanking';
      await shopCheckoutPage.selectNetbanking();
      console.log(`[${TC(11)}] Selected payment method:`, placedPaymentMethod);
      await shopCheckoutPage.clickPay();
      console.log(`[${TC(11)}] Clicked Pay button`);

      const razorpayAmountRaw = await paymentPage.getPriceSummaryAmountFromFrame();
      const expectedAmount = combinedGrandTotal;
      const razorpayAmountNormalized =
        razorpayAmountRaw > expectedAmount * 10
          ? Number((razorpayAmountRaw / 100).toFixed(2))
          : razorpayAmountRaw;
      console.log(`[${TC(11)}] Razorpay amount raw:`, razorpayAmountRaw);
      console.log(`[${TC(11)}] Razorpay amount normalized:`, razorpayAmountNormalized);
      console.log(`[${TC(11)}] Expected grand total:`, expectedAmount);
      expect(Math.abs(razorpayAmountNormalized - expectedAmount)).toBeLessThanOrEqual(1);

      await paymentPage.fillContactNumber(shopDataset.mobile);
      console.log(`[${TC(11)}] Razorpay contact number:`, shopDataset.mobile);
      await paymentPage.clickRazorpayContinue();
      await paymentPage.selectNetbanking();
      console.log(`[${TC(11)}] Selected Netbanking in Razorpay`);
      await paymentPage.completeNetbankingPayment('HDFC Bank');
      console.log(`[${TC(11)}] Completed HDFC Bank netbanking payment`);

      placedOrders = await shopCheckoutPage.getPlacedOrders(productNames.length);
      console.log(
        `[${TC(11)}] Order ID mode:`,
        placedOrders.isSingleSharedOrder ? 'single shared order' : 'one order per product',
      );
      console.log(`[${TC(11)}] Order success message:`, placedOrders.successMessage);
      console.log(`[${TC(11)}] Order ID:`, placedOrders.displayText);
      shopCheckoutPage.assertPlacedOrders(placedOrders, productNames.length);
      expect(placedOrders.successMessage).toMatch(/booked/i);
      await shopCheckoutPage.dismissOrderPlacedDialog();
    });

    await test.step('TC_SHOP_002_12 | My orders SHOP tab validate each product', async () => {
      log(12, 'My Orders SHOP tab â€” validate order against product details');
      await myOrderVerificationPage.goToMyOrders();
      await myOrderVerificationPage.clickShopTabMultiProduct();

      log(
        12,
        `Shop tab: ${productNames.length} products â€” expect one order row per product (separate Shop entries when checkout issues one order id per line item)`,
      );

      for (let i = 0; i < productNames.length; i++) {
        const name = productNames[i];
        const shopOrder = await myOrderVerificationPage.getShopOrderDetails(name);
        const orderDate = await myOrderVerificationPage.getShopOrderDate(name);
        orderIdByProduct[name] = shopOrder.orderId;
        shopOrdersByName[name] = shopOrder;

        console.log(`[${TC(12)}] Shop row ${i + 1}/${productNames.length} â€” product:`, name);
        console.log(`[${TC(12)}] My Orders Product Name:`, shopOrder.productName);
        console.log(`[${TC(12)}] My Orders Order Id:`, shopOrder.orderId);
        console.log(`[${TC(12)}] My Orders Status:`, shopOrder.status);
        console.log(`[${TC(12)}] My Orders Quantity:`, shopOrder.quantity);
        console.log(`[${TC(12)}] My Orders Price:`, shopOrder.priceAmount);
        console.log(`[${TC(12)}] Ordered On Date:`, orderDate);
        console.log(`[${TC(12)}] Order is on date:`, myOrderVerificationPage.isOrderedOnToday(orderDate));

        const expectedOrderId = placedOrders.isSingleSharedOrder
          ? placedOrders.orderIds[0]
          : `one of ${placedOrders.displayText}`;
        const expectedQty = Number(productDetailsByName[name].quantity) || 1;
        const expectedGrand = productDetailsByName[name].grandTotal;

        console.log(`[${TC(12)}] Validate my orders vs product details from step 5`);
        logActualExpected(12, 'Product name', shopOrder.productName, name);
        logActualExpected(12, 'Quantity', shopOrder.quantity, expectedQty);
        logActualExpected(12, 'Price', shopOrder.priceAmount, expectedGrand);
        logActualExpected(12, 'Order Id', shopOrder.orderId, expectedOrderId);
        logActualExpected(12, 'Order Date', orderDate, 'ORDERED ON (today)');
        logActualExpected(
          12,
          'Order date is today',
          myOrderVerificationPage.isOrderedOnToday(orderDate),
          true,
        );

        shopCheckoutPage.assertOrderIdForProduct(shopOrder.orderId, placedOrders);

        expect(shopOrder.productName).toContain(name);
        expect(shopOrder.quantity).toBe(expectedQty);
        expect(shopOrder.priceAmount).toBe(expectedGrand);
        expect(shopOrder.status).toMatch(/payment received/i);
        expect(orderDate).toMatch(/^ORDERED ON/i);
        expect(shopOrder.orderedOn).toBe(orderDate);
        expect(myOrderVerificationPage.isOrderedOnToday(orderDate)).toBe(true);
      }

      const orderIdsOnTab = productNames.map((n) => orderIdByProduct[n]);
      console.log(
        `[${TC(12)}] Shop tab summary â€” order id per product:`,
        productNames.map((n) => `${n} â†’ ${orderIdByProduct[n]}`).join(' | '),
      );

      if (!placedOrders.isSingleSharedOrder) {
        logActualExpected(
          12,
          'Distinct Shop-tab order entries (unique order id per product)',
          new Set(orderIdsOnTab).size,
          productNames.length,
        );
        expect(
          new Set(orderIdsOnTab).size,
          'Shop tab should list a different order id for each product when checkout returns multiple ids',
        ).toBe(productNames.length);
      } else {
        log(
          12,
          `Single shared order id from checkout (${placedOrders.displayText}) â€” each Shop row should show the same order id`,
        );
        for (const n of productNames) {
          logActualExpected(12, `Order Id on row (${n})`, orderIdByProduct[n], placedOrders.orderIds[0]);
          expect(orderIdByProduct[n]).toBe(placedOrders.orderIds[0]);
        }
      }
    });

    await test.step('TC_SHOP_002_13 | View Detail validate order product vs step 5', async () => {
      log(13, 'View Detail â€” validate product, properties, addresses and payment');

      for (let i = 0; i < productNames.length; i++) {
        const name = productNames[i];
        const pd = productDetailsByName[name];
        const shopOrderFromStep12 = shopOrdersByName[name];
        const p = `Product ${i + 1}/${productNames.length}`;
        const expectedNetWeightGm = expectedShopWeightGrams(name, pd, cartNetWeightByName[name] ?? '');

        console.log(`\n[${TC(13)}] ${p} â€” ${name}`);
        await myOrderVerificationPage.openShopOrderDetailMulti(name);

        const detail = await myOrderVerificationPage.getShopOrderDetailView();
        logActualExpected(13, `${p} Detail product name`, detail.productName, name);
        logActualExpected(
          13,
          `${p} Detail net weight (g)`,
          weightGramsFromText(detail.netWeight),
          expectedNetWeightGm,
        );
        logActualExpected(13, `${p} Detail quantity`, detail.quantity, Number(pd.quantity) || 1);
        logActualExpected(13, `${p} Detail price`, detail.priceAmount, pd.grandTotal);
        expect(detail.productName).toContain(name);
        expect(weightGramsFromText(detail.netWeight)).toBe(expectedNetWeightGm);
        expect(detail.quantity).toBe(Number(pd.quantity) || 1);
        expect(detail.priceAmount).toBe(pd.grandTotal);

        const props = await myOrderVerificationPage.getShopOrderProductProperties();
        console.log(`[${TC(13)}] ${p} Product Properties SKU:`, props.sku);
        console.log(`[${TC(13)}] ${p} Product Properties Metal Type:`, props.metalType);
        console.log(`[${TC(13)}] ${p} Product Properties Purity:`, props.purity);
        console.log(`[${TC(13)}] ${p} Product Properties Product Weight:`, props.productWeight);
        console.log(`[${TC(13)}] ${p} Step 5 SKU:`, pd.sku);
        console.log(`[${TC(13)}] ${p} Step 5 Metal Type:`, pd.metalType);
        console.log(`[${TC(13)}] ${p} Step 5 Purity:`, pd.purity);
        console.log(`[${TC(13)}] ${p} Step 5 Product Weight:`, pd.productWeight);
        if (pd.sku) {
          logActualExpected(13, `${p} SKU`, props.sku, pd.sku);
          expect(props.sku).toBe(pd.sku);
        } else {
          logActualExpected(13, `${p} SKU (PDP empty)`, props.sku, '(non-empty on order detail)');
          expect(props.sku, `${p} order detail should show SKU when PDP capture missed it`).toBeTruthy();
        }
        logActualExpected(13, `${p} Metal Type`, props.metalType, pd.metalType);
        logActualExpected(13, `${p} Purity`, props.purity, pd.purity);
        logActualExpected(13, `${p} Product Weight (g)`, weightGramsFromText(props.productWeight), expectedNetWeightGm);
        expect(props.metalType).toBe(pd.metalType);
        expect(props.purity).toBe(pd.purity);
        expect(weightGramsFromText(props.productWeight)).toBe(expectedNetWeightGm);

        const receivedAt = await myOrderVerificationPage.getShopOrderAddress('received');
        const billedAt = await myOrderVerificationPage.getShopOrderAddress('billed');
        console.log(`[${TC(13)}] ${p} Received At:`, receivedAt.fullName, receivedAt.pincode);
        console.log(`[${TC(13)}] ${p} Billed At:`, billedAt.fullName, billedAt.pincode);
        logActualExpected(13, `${p} Received At full name`, receivedAt.fullName, savedBillingAddress.fullName);
        logActualExpected(13, `${p} Received At pincode`, receivedAt.pincode, savedBillingAddress.pincode);
        logActualExpected(13, `${p} Billed At full name`, billedAt.fullName, savedBillingAddress.fullName);
        logActualExpected(13, `${p} Billed At pincode`, billedAt.pincode, savedBillingAddress.pincode);
        expect(receivedAt.fullName).toBe(savedBillingAddress.fullName);
        expect(receivedAt.address).toBe(savedBillingAddress.address);
        expect(receivedAt.pincode).toBe(savedBillingAddress.pincode);
        expect(billedAt.fullName).toBe(savedBillingAddress.fullName);
        expect(billedAt.address).toBe(savedBillingAddress.address);
        expect(billedAt.pincode).toBe(savedBillingAddress.pincode);

        const paymentMethod = await myOrderVerificationPage.getShopOrderPaymentMethod();
        logActualExpected(13, `${p} Payment method`, paymentMethod, placedPaymentMethod);
        expect(paymentMethod).toMatch(new RegExp(placedPaymentMethod, 'i'));

        const orderStatusAndDate = await myOrderVerificationPage.getShopOrderDetailStatusAndDate();
        console.log(`[${TC(13)}] ${p} Order Id:`, orderStatusAndDate.orderId);
        console.log(`[${TC(13)}] ${p} Order Status:`, orderStatusAndDate.status);
        console.log(`[${TC(13)}] ${p} Ordered On Date:`, orderStatusAndDate.orderedOn);
        console.log(
          `[${TC(13)}] ${p} Order is on date:`,
          myOrderVerificationPage.isOrderedOnToday(orderStatusAndDate.orderedOn),
        );

        const orderDateTime = await myOrderVerificationPage.getShopOrderDetailDateTime();
        console.log(`[${TC(13)}] ${p} Order Date Time:`, orderDateTime.dateTimeText);
        console.log(`[${TC(13)}] ${p} Order Date:`, orderDateTime.orderDate);
        console.log(`[${TC(13)}] ${p} Order Time:`, orderDateTime.orderTime);
        console.log(
          `[${TC(13)}] ${p} Detail order is on date:`,
          myOrderVerificationPage.isOrderDateToday(orderDateTime.orderDate),
        );

        console.log(`[${TC(13)}] ${p} Step 12 Order Id:`, shopOrderFromStep12.orderId);
        console.log(`[${TC(13)}] ${p} Step 12 Status:`, shopOrderFromStep12.status);
        logActualExpected(13, `${p} Order Id`, orderStatusAndDate.orderId, shopOrderFromStep12.orderId);
        logActualExpected(13, `${p} Order Status`, orderStatusAndDate.status, shopOrderFromStep12.status);
        logActualExpected(13, `${p} Ordered On`, orderStatusAndDate.orderedOn, shopOrderFromStep12.orderedOn);
        logActualExpected(13, `${p} Order Date Time`, orderDateTime.dateTimeText, 'date | time format');
        logActualExpected(13, `${p} Order Date`, orderDateTime.orderDate, 'today');
        logActualExpected(13, `${p} Order Time`, orderDateTime.orderTime, 'HH:MM AM/PM');
        logActualExpected(
          13,
          `${p} Detail order date is today`,
          myOrderVerificationPage.isOrderDateToday(orderDateTime.orderDate),
          true,
        );
        expect(orderStatusAndDate.orderId).toBe(shopOrderFromStep12.orderId);
        expect(orderStatusAndDate.status).toBe(shopOrderFromStep12.status);
        expect(myOrderVerificationPage.isOrderedOnToday(orderStatusAndDate.orderedOn)).toBe(true);
        expect(myOrderVerificationPage.isOrderedOnToday(shopOrderFromStep12.orderedOn)).toBe(true);
        expect(orderDateTime.orderTime).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
        expect(myOrderVerificationPage.isOrderDateToday(orderDateTime.orderDate)).toBe(true);
      }
    });

    await test.step('TC_SHOP_002_14 | Download invoice and validate', async () => {
      const invoiceTargets = placedOrders.isSingleSharedOrder ? [productNames[0]] : [...productNames];

      for (let inv = 0; inv < invoiceTargets.length; inv++) {
        const invoiceProductName = invoiceTargets[inv];
        const ordinal = `${inv + 1}/${invoiceTargets.length}`;

        await test.step(`14 (${ordinal}) ${invoiceProductName}`, async () => {
          if (inv > 0) {
            await myOrderVerificationPage.resetShopInvoiceSession();
          }

          await test.step('14 setup â€” ensure order detail is open for invoice', async () => {
            log(14, `[${ordinal}] Ensure order detail for "${invoiceProductName}"`);
            await myOrderVerificationPage.ensureShopOrderDetailForInvoice(invoiceProductName, {
              requireMatchingProduct: true,
            });
          });

          await test.step('14a â€” Open invoice (see [Shop Invoice] logs)', async () => {
            log(14, `[${ordinal}] Open shop invoice PDF â€” steps 1â€“6 logged by page object`);
            await myOrderVerificationPage.clickShopInvoice({
              maxAttempts: 4,
              captureTimeoutMs: 12_000,
              productName: invoiceProductName,
            });
          });

          await test.step('14b â€” Unlock PDF with mobile password', async () => {
            log(14, `[${ordinal}] Submit invoice PDF password â€” steps 7â€“9 logged by page object`);
            await myOrderVerificationPage.submitShopInvoicePassword(shopDataset.mobile);
          });

          await test.step('14c â€” Download PDF and validate fields', async () => {
            const invoicePassword = shopDataset.mobile.replace(/\D/g, '').slice(-4);
            log(14, `[${ordinal}] Download and parse PDF â€” step 10 logged by page object`);
            const pdfUrl = await myOrderVerificationPage.getShopInvoicePdfUrl();
            console.log(`[${TC(14)}] [${ordinal}] Invoice PDF URL:`, pdfUrl);

            let response = await page.request.get(pdfUrl, { timeout: 30_000 });
            if (!response.ok()) {
              console.log(`[${TC(14)}] [${ordinal}] PDF download retry after 2s`);
              await page.waitForTimeout(2_000);
              response = await page.request.get(pdfUrl, { timeout: 30_000 });
            }
            logActualExpected(14, `[${ordinal}] PDF response OK`, response.ok(), true);
            expect(response.ok()).toBeTruthy();

            const pdfBuffer = await response.body();
            const rawPdfText = await shopPdfUtils.readShopInvoicePdf(pdfBuffer, invoicePassword);
            const pdfText = pdfUtils.normalizePdfText(rawPdfText);

            const invoiceNo = shopPdfUtils.extractShopInvoiceNumber(pdfText);
            const invoiceDate = shopPdfUtils.extractShopInvoiceDate(pdfText);
            const gstin = pdfUtils.extractGstin(pdfText);
            const cin = pdfUtils.extractCin(pdfText);
            const netPayable = shopPdfUtils.extractShopNetPayable(pdfText);
            const invoiceOrderId = shopCheckoutPage.getInvoiceOrderId(
              placedOrders,
              orderIdByProduct[invoiceProductName],
            );
            const pdfHasOrderId = shopPdfUtils.shopPdfContainsOrderReference(pdfText, invoiceOrderId);
            const linePrice =
              productLinePrices[invoiceProductName] ?? productDetailsByName[invoiceProductName].grandTotal;
            const expectedInvoiceNetPayable = shopCheckoutPage.getExpectedInvoiceNetPayable(
              placedOrders,
              combinedGrandTotal,
              linePrice,
            );
            const pdfProductNames = placedOrders.isSingleSharedOrder
              ? shopCheckoutPage.getInvoiceProductNames(placedOrders, productNames)
              : [invoiceProductName];
            const invoiceDateMissingInPdf = shopPdfUtils.isShopInvoiceDateMissingInPdf(pdfText);
            const gstDetails = shopPdfUtils.extractShopInvoiceGstDetails(pdfText);
            const gstValidation = shopPdfUtils.validateShopInvoiceGst({
              taxableAmount: gstDetails.taxableAmount,
              netPayable,
              igstAmount: gstDetails.igstAmount,
              cgstAmount: gstDetails.cgstAmount,
              sgstAmount: gstDetails.sgstAmount,
              igstRatePercent: gstDetails.igstRatePercent ?? 3,
            });

            console.log(`[${TC(14)}] [${ordinal}] Invoice No:`, invoiceNo);
            console.log(`[${TC(14)}] [${ordinal}] Invoice Date:`, invoiceDate);
            console.log(`[${TC(14)}] [${ordinal}] GSTIN:`, gstin);
            console.log(`[${TC(14)}] [${ordinal}] CIN:`, cin);
            console.log(`[${TC(14)}] [${ordinal}] Net Payable:`, netPayable);
            console.log(`[${TC(14)}] [${ordinal}] Taxable (Net Total):`, gstDetails.taxableAmount);
            console.log(`[${TC(14)}] [${ordinal}] IGST:`, gstDetails.igstAmount, `@ ${gstDetails.igstRatePercent ?? 3}%`);
            console.log(`[${TC(14)}] [${ordinal}] CGST:`, gstDetails.cgstAmount ?? '(not in PDF)');
            console.log(`[${TC(14)}] [${ordinal}] SGST:`, gstDetails.sgstAmount ?? '(not in PDF)');

            for (const name of pdfProductNames) {
              const pdfHasProduct = shopPdfUtils.shopPdfContainsProductName(pdfText, name);
              logActualExpected(14, `[${ordinal}] Product name in PDF (${name})`, pdfHasProduct, true);
              expect(pdfHasProduct).toBe(true);
            }

            logActualExpected(14, `[${ordinal}] Invoice No`, invoiceNo, 'non-empty');
            logActualExpected(
              14,
              `[${ordinal}] Invoice Date`,
              invoiceDate || (invoiceDateMissingInPdf ? 'NOT_IN_PDF' : ''),
              'non-empty or NOT_IN_PDF',
            );
            logActualExpected(14, `[${ordinal}] GSTIN`, gstin, 'non-empty');
            logActualExpected(14, `[${ordinal}] CIN`, cin, 'non-empty');
            logActualExpected(14, `[${ordinal}] Order / Transaction ref in PDF`, pdfHasOrderId, true);
            logActualExpected(14, `[${ordinal}] Net payable`, netPayable, expectedInvoiceNetPayable);

            if (gstDetails.igstAmount != null && gstDetails.igstAmount > 0) {
              const expectedIgst =
                Math.round(gstDetails.taxableAmount * ((gstDetails.igstRatePercent ?? 3) / 100) * 100) / 100;
              logActualExpected(14, `[${ordinal}] IGST amount`, gstDetails.igstAmount, expectedIgst);
            }
            if (gstDetails.cgstAmount != null && gstDetails.cgstAmount > 0) {
              const expectedCgst = Math.round(gstDetails.taxableAmount * 0.015 * 100) / 100;
              logActualExpected(14, `[${ordinal}] CGST amount`, gstDetails.cgstAmount, expectedCgst);
            }
            if (gstDetails.sgstAmount != null && gstDetails.sgstAmount > 0) {
              const expectedSgst = Math.round(gstDetails.taxableAmount * 0.015 * 100) / 100;
              logActualExpected(14, `[${ordinal}] SGST amount`, gstDetails.sgstAmount, expectedSgst);
            }
            logActualExpected(14, `[${ordinal}] GST breakdown vs payable`, gstValidation.ok, true);
            if (!gstValidation.ok) {
              console.log(`[${TC(14)}] [${ordinal}] GST validation notes:`, gstValidation.messages.join(' | '));
            }

            expect(invoiceNo).toBeTruthy();
            expect(invoiceDate || invoiceDateMissingInPdf).toBeTruthy();
            expect(gstin).toBeTruthy();
            expect(cin).toBeTruthy();
            expect(pdfHasOrderId).toBe(true);
            expect(Math.abs(netPayable - expectedInvoiceNetPayable)).toBeLessThanOrEqual(2);
            if (gstDetails.igstAmount != null && gstDetails.igstAmount > 0) {
              expect(gstValidation.ok, gstValidation.messages.join('; ')).toBe(true);
            }
          });
        });
      }
    });
  });
  /** TC_SHOP_003 — product 1: EMI Pay and add to cart; product 2: Buy Now; checkout same as TC002. */
  test('TC_SHOP_003 - Two-product shop: EMI(3 Months) Pay Now + Buy Now checkout @customer-flows', async ({
    page,
    shopPage,
    shopCartPage,
    shopEmiPage,
    shopCheckoutPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(420_000);

    const TC = (n: number): string => `TC_SHOP_003_${n}`;
    const log = (n: number, title: string): void => console.log(`\n[${TC(n)}] ${title}`);
    const logActualExpected = (n: number, label: string, actual: unknown, expected: unknown): void => {
      console.log(`[${TC(n)}] ${label} | Actual:`, actual, '| Expected:', expected);
    };

    const productNames = [shopTc003Dataset.emiProductName, shopTc003Dataset.buyNowProductName];
    const emiProductName = productNames[0];
    const buyNowProductName = productNames[1];
    const emiPlanTenure = '3 Months';
    const productDetailsByName: Record<string, ShopProductDetails> = {};
    const productLinePrices: Record<string, number> = {};
    const cartNetWeightByName: Record<string, string> = {};
    let savedBillingAddress: Awaited<ReturnType<typeof shopCheckoutPage.getBillingAddress>>;
    let placedOrders: ShopPlacedOrders;
    const orderIdByProduct: Record<string, string> = {};
    const shopOrdersByName: Record<
      string,
      Awaited<ReturnType<typeof myOrderVerificationPage.getShopOrderDetails>>
    > = {};
    let combinedGrandTotal = 0;
    let placedPaymentMethod = '';
    let emiPlanDetails: ShopEmiDetails | undefined;

    await test.step('TC_SHOP_003_1 | Clear cart', async () => {
      log(1, 'Clear cart');
      await shopCartPage.clearCart();
      expect(await shopCartPage.getCartItemCount()).toBe(0);
    });

    await test.step('TC_SHOP_003_2 | Open listing with filters', async () => {
      log(2, 'Open shop listing and apply filters');
      await shopPage.openListingWithFilters();
      await expect(page).toHaveURL(/shop-new\/product/i);
    });

    await test.step('TC_SHOP_003_3 | Verify Excel products in list', async () => {
      log(3, 'Verify EMI and Buy Now products from Excel');
      await shopPage.expectProductsListed(productNames);
    });

    await test.step(
      'TC_SHOP_003_4 | EMI product PDP — print details, scroll to Buy with EMI',
      async () => {
        log(4, `Open EMI product PDP: ${emiProductName}`);
        await shopPage.openProduct(emiProductName);
        productDetailsByName[emiProductName] = await shopPage.getProductDetails();
        shopPage.printProductDetails(`[${TC(4)}] EMI product`, productDetailsByName[emiProductName]);
        expect(productDetailsByName[emiProductName].productName).toContain(emiProductName);
        expect(productDetailsByName[emiProductName].emiText).toMatch(/EMI/i);
        expect(productDetailsByName[emiProductName].grandTotal).toBeGreaterThan(0);
        await shopPage.scrollToBuyWithEmi();
        await shopPage.expectPdpBuyButtons(true);
        console.log(`[${TC(4)}] Buy with EMI is visible and enabled`);
      },
    );

    await test.step('TC_SHOP_003_5 | Product 1 EMI plan 3 Months, Pay, add to cart', async () => {
      log(5, 'Buy with EMI, choose EMI plan 3 Months, verify details and Pay amount, add to cart');
      await shopPage.clickBuyWithEmi();
      await shopEmiPage.selectPlan(emiPlanTenure);
      const emi = await shopEmiPage.getDetails();
      console.log(`[${TC(5)}] EMI plan selected:`, emiPlanTenure);
      console.log(`[${TC(5)}] EMI details:`, emi);
      expect(emi.emiScheme).toBe(emiPlanTenure);
      logActualExpected(5, 'Pay amount', emi.payButtonAmount, shopEmiPage.expectedPayAmount(emi));
      shopEmiPage.expectPayButtonMatchesInitialPayment(emi);
      emiPlanDetails = emi;
      await shopEmiPage.payAndAddToCart();
      await shopPage.openListingWithFilters();
    });

    await test.step('TC_SHOP_003_6 | Product 2 Buy Now to cart', async () => {
      log(6, `Open Buy Now product PDP: ${buyNowProductName}`);
      await shopPage.openProduct(buyNowProductName);
      productDetailsByName[buyNowProductName] = await shopPage.getProductDetails();
      shopPage.printProductDetails(`[${TC(6)}] Product 2`, productDetailsByName[buyNowProductName]);
      expect(productDetailsByName[buyNowProductName].productName).toContain(buyNowProductName);
      expect(productDetailsByName[buyNowProductName].grandTotal).toBeGreaterThan(0);
      expect(productDetailsByName[buyNowProductName].grandTotal).not.toBe(
        productDetailsByName[emiProductName].grandTotal,
      );
      await shopPage.expectPdpBuyButtons();
      await shopPage.clickBuyNow();
      await shopCartPage.expectCartHasProducts(productNames);
    });

    await test.step('TC_SHOP_003_7 | Validate cart for all products', async () => {
      log(7, 'Validate cart item and price details against product');
      expect(emiPlanDetails).toBeDefined();

      const buyNowCart = await shopCartPage.getCartItemDetails(buyNowProductName);
      console.log(`[${TC(7)}] Cart Product Name:`, buyNowCart.productName);
      console.log(`[${TC(7)}] Cart Net Weight:`, buyNowCart.netWeight);
      console.log(`[${TC(7)}] Cart Quantity:`, buyNowCart.quantity);
      console.log(`[${TC(7)}] Cart Item Price:`, buyNowCart.itemPrice);
      expect(buyNowCart.productName).toContain(buyNowProductName);
      expect(buyNowCart.itemPrice).toBe(productDetailsByName[buyNowProductName].grandTotal);
      cartNetWeightByName[buyNowProductName] = buyNowCart.netWeight;
      productLinePrices[buyNowProductName] = buyNowCart.itemPrice;

      const expectedEmiLinePrice = shopEmiPage.expectedNetPayableAmount(emiPlanDetails!);
      const emiCart = await shopCartPage.expectEmiCartItemMatchesNetPayable(
        emiProductName,
        expectedEmiLinePrice,
      );
      console.log(`[${TC(7)}] Cart Product Name:`, emiCart.productName);
      console.log(`[${TC(7)}] Cart Net Weight:`, emiCart.netWeight);
      console.log(`[${TC(7)}] Cart Item Price (EMI):`, emiCart.itemPrice);
      logActualExpected(7, `${emiProductName} line price`, emiCart.itemPrice, expectedEmiLinePrice);
      cartNetWeightByName[emiProductName] = emiCart.netWeight;
      productLinePrices[emiProductName] = emiCart.itemPrice;

      const cartPrice = await shopCartPage.getEmiMixedCartPriceDetails();
      combinedGrandTotal = cartPrice.grandTotal;

      const buyNowLineTotal = buyNowCart.itemPrice;
      const emiInitialPayment = shopEmiPage.expectedPayAmount(emiPlanDetails!);
      const expectedCartGrandTotal = buyNowLineTotal + emiInitialPayment;

      console.log(`[${TC(7)}] Cart Metal Price:`, cartPrice.metalPrice);
      console.log(`[${TC(7)}] Cart Making & Delivery:`, cartPrice.makingAndDeliveryCharges);
      console.log(`[${TC(7)}] Cart Tax:`, cartPrice.tax);
      logActualExpected(7, 'Buy Now line total', buyNowLineTotal, productDetailsByName[buyNowProductName].grandTotal);
      logActualExpected(7, 'Initial Payment (price panel)', cartPrice.initialPayment, emiInitialPayment);
      logActualExpected(
        7,
        'Cart Grand Total (Buy Now + Initial Payment)',
        cartPrice.grandTotal,
        expectedCartGrandTotal,
      );

      expect(cartPrice.initialPayment).toBe(emiInitialPayment);
      expect(cartPrice.grandTotal).toBe(buyNowLineTotal + cartPrice.initialPayment);
      expect(cartPrice.grandTotal).toBe(expectedCartGrandTotal);
    });

    await test.step('TC_SHOP_003_8 | Checkout billing and delivery', async () => {
      log(8, 'Checkout prices, billing address and confirm billing');
      await shopCartPage.clickProceedToPay();
      await shopCheckoutPage.waitForCheckoutPage();

      const checkoutPrice = await shopCheckoutPage.getEmiMixedCheckoutPriceDetails();
      const buyNowLineTotal = productLinePrices[buyNowProductName];
      const emiInitialPayment = shopEmiPage.expectedPayAmount(emiPlanDetails!);
      const expectedCheckoutGrandTotal = buyNowLineTotal + emiInitialPayment;
      console.log(`[${TC(8)}] Checkout Metal Price:`, checkoutPrice.metalPrice);
      console.log(`[${TC(8)}] Checkout Initial Payment:`, checkoutPrice.initialPayment);
      console.log(`[${TC(8)}] Checkout EMI Scheme:`, checkoutPrice.emiScheme);
      console.log(`[${TC(8)}] Checkout EMI Amount per month:`, checkoutPrice.emiPerMonth);
      console.log(`[${TC(8)}] Checkout TAX:`, checkoutPrice.tax);
      console.log(`[${TC(8)}] Checkout Making & Delivery:`, checkoutPrice.makingAndDeliveryCharges);
      console.log(`[${TC(8)}] Checkout Grand Total:`, checkoutPrice.grandTotal);
      logActualExpected(8, 'Initial Payment', checkoutPrice.initialPayment, emiInitialPayment);
      logActualExpected(8, 'EMI Scheme', checkoutPrice.emiScheme, emiPlanDetails!.emiScheme);
      logActualExpected(
        8,
        'EMI Amount per month',
        checkoutPrice.emiPerMonth,
        shopEmiPage.expectedEmiPerMonthAmount(emiPlanDetails!),
      );
      logActualExpected(8, 'Checkout Grand Total (Buy Now + Initial Payment)', checkoutPrice.grandTotal, expectedCheckoutGrandTotal);
      expect(checkoutPrice.initialPayment).toBe(emiInitialPayment);
      expect(checkoutPrice.emiScheme).toBe(emiPlanDetails!.emiScheme);
      expect(checkoutPrice.emiPerMonth).toBe(shopEmiPage.expectedEmiPerMonthAmount(emiPlanDetails!));
      expect(checkoutPrice.grandTotal).toBe(buyNowLineTotal + checkoutPrice.initialPayment);
      expect(checkoutPrice.grandTotal).toBe(combinedGrandTotal);
      expect(checkoutPrice.savings).toBe(0);
      expect(checkoutPrice.paidFromFunds).toBe(0);

      savedBillingAddress = await shopCheckoutPage.getBillingAddress();
      console.log(`[${TC(8)}] Selected billing full name:`, savedBillingAddress.fullName);
      console.log(`[${TC(8)}] Selected billing address:`, savedBillingAddress.address);
      console.log(`[${TC(8)}] Selected billing pincode:`, savedBillingAddress.pincode);
      console.log(`[${TC(8)}] Selected billing mobile:`, savedBillingAddress.mobile || '(not shown)');
      expect(savedBillingAddress.address).toBeTruthy();
      expect(savedBillingAddress.pincode).toMatch(/^\d{6}$/);

      await shopCheckoutPage.confirmBillingAndDelivery();
      console.log(`[${TC(8)}] Confirmed billing and delivery address`);
    });

    await test.step('TC_SHOP_003_9 | OTP verify', async () => {
      log(9, 'Verify OTP sent to mobile, enter OTP and click Verify');
      const sentToText = await shopCheckoutPage.getOtpSentToText();
      console.log(`[${TC(9)}] OTP Sent to text:`, sentToText);
      console.log(`[${TC(9)}] Expected mobile (shop sheet):`, shopDataset.mobile);
      expect(sentToText.replace(/\D/g, '').slice(-10)).toBe(shopDataset.mobile.replace(/\D/g, '').slice(-10));
      await shopCheckoutPage.submitOtp(shopDataset.otp);
      console.log(`[${TC(9)}] OTP entered:`, shopDataset.otp);
      console.log(`[${TC(9)}] Clicked Verify button`);
    });

    await test.step('TC_SHOP_003_10 | Summary cart, prices and addresses', async () => {
      log(10, 'Verify cart details and billing/delivery address after OTP');
      await shopCheckoutPage.waitForOrderSummary();

      for (let i = 0; i < productNames.length; i++) {
        const name = productNames[i];
        const orderItem = await shopCheckoutPage.getOrderItemDetails(name);
        const expectedPrice = productLinePrices[name];
        console.log(`[${TC(10)}] Order Product Name:`, orderItem.productName);
        console.log(`[${TC(10)}] Order Quantity:`, orderItem.quantity);
        console.log(`[${TC(10)}] Order Item Price:`, orderItem.itemPrice);
        expect(orderItem.productName).toContain(name);
        logActualExpected(10, `${name} summary line price`, orderItem.itemPrice, expectedPrice);
        expect(orderItem.itemPrice).toBe(expectedPrice);
      }

      expect(emiPlanDetails).toBeDefined();
      const emiSummary = await shopCheckoutPage.getEmiSummaryPriceDetails();
      const emiInitialPayment = shopEmiPage.expectedPayAmount(emiPlanDetails!);
      console.log(`[${TC(10)}] EMI Summary Down Payment:`, emiSummary.downPayment);
      console.log(`[${TC(10)}] EMI Summary Total Amount:`, emiSummary.totalAmount);
      console.log(`[${TC(10)}] EMI Summary EMI Scheme:`, emiSummary.emiScheme);
      console.log(`[${TC(10)}] EMI Summary EMI per month:`, emiSummary.emiPerMonth);
      console.log(`[${TC(10)}] EMI Summary TAX:`, emiSummary.tax);
      console.log(`[${TC(10)}] EMI Summary Making & Delivery:`, emiSummary.makingAndDeliveryCharges);
      console.log(`[${TC(10)}] EMI Summary Savings:`, emiSummary.savings);
      console.log(`[${TC(10)}] EMI Summary Paid From Funds:`, emiSummary.paidFromFunds);
      console.log(`[${TC(10)}] EMI Summary Grand Total:`, emiSummary.grandTotal);
      logActualExpected(10, 'Down Payment', emiSummary.downPayment, emiInitialPayment);
      logActualExpected(10, 'EMI Scheme', emiSummary.emiScheme, emiPlanDetails!.emiScheme);
      logActualExpected(
        10,
        'EMI Amount per month',
        emiSummary.emiPerMonth,
        shopEmiPage.expectedEmiPerMonthAmount(emiPlanDetails!),
      );
      logActualExpected(10, 'Summary Grand Total', emiSummary.grandTotal, combinedGrandTotal);
      expect(emiSummary.downPayment).toBe(emiInitialPayment);
      expect(emiSummary.emiScheme).toBe(emiPlanDetails!.emiScheme);
      expect(emiSummary.emiPerMonth).toBe(shopEmiPage.expectedEmiPerMonthAmount(emiPlanDetails!));
      expect(emiSummary.savings).toBe(0);
      expect(emiSummary.paidFromFunds).toBe(0);
      expect(emiSummary.grandTotal).toBe(combinedGrandTotal);

      const deliveryAddress = await shopCheckoutPage.getDeliveryAddress();
      const billingAddress = await shopCheckoutPage.getBilledToAddress();
      console.log(`[${TC(10)}] Delivery Full Name:`, deliveryAddress.fullName);
      console.log(`[${TC(10)}] Delivery Address:`, deliveryAddress.address);
      console.log(`[${TC(10)}] Delivery Pincode:`, deliveryAddress.pincode);
      console.log(`[${TC(10)}] Billing Full Name:`, billingAddress.fullName);
      console.log(`[${TC(10)}] Billing Address:`, billingAddress.address);
      console.log(`[${TC(10)}] Billing Pincode:`, billingAddress.pincode);

      console.log(`[${TC(10)}] Validate step 8 selected billing vs summary delivery`);
      expect(deliveryAddress.fullName).toBe(savedBillingAddress.fullName);
      expect(deliveryAddress.address).toBe(savedBillingAddress.address);
      expect(deliveryAddress.pincode).toBe(savedBillingAddress.pincode);

      console.log(`[${TC(10)}] Validate step 8 selected billing vs summary billed-to`);
      expect(billingAddress.fullName).toBe(savedBillingAddress.fullName);
      expect(billingAddress.address).toBe(savedBillingAddress.address);
      expect(billingAddress.pincode).toBe(savedBillingAddress.pincode);

      if (savedBillingAddress.mobile) {
        expect(deliveryAddress.mobile).toBe(savedBillingAddress.mobile);
        expect(billingAddress.mobile).toBe(savedBillingAddress.mobile);
        console.log(`[${TC(10)}] Mobile matches step 8:`, savedBillingAddress.mobile);
      }

      expect(deliveryAddress.pincode).toBe(billingAddress.pincode);
    });

    await test.step('TC_SHOP_003_11 | Netbanking payment via Razorpay', async () => {
      log(11, 'Select Netbanking, Pay and complete Razorpay netbanking');
      placedPaymentMethod = 'Netbanking';
      await shopCheckoutPage.selectNetbanking();
      console.log(`[${TC(11)}] Selected payment method:`, placedPaymentMethod);
      await shopCheckoutPage.clickPay();
      console.log(`[${TC(11)}] Clicked Pay button`);

      const razorpayAmountRaw = await paymentPage.getPriceSummaryAmountFromFrame();
      const expectedAmount = combinedGrandTotal;
      const razorpayAmountNormalized =
        razorpayAmountRaw > expectedAmount * 10
          ? Number((razorpayAmountRaw / 100).toFixed(2))
          : razorpayAmountRaw;
      console.log(`[${TC(11)}] Razorpay amount raw:`, razorpayAmountRaw);
      console.log(`[${TC(11)}] Razorpay amount normalized:`, razorpayAmountNormalized);
      console.log(`[${TC(11)}] Expected grand total:`, expectedAmount);
      expect(Math.abs(razorpayAmountNormalized - expectedAmount)).toBeLessThanOrEqual(1);

      await paymentPage.fillContactNumber(shopDataset.mobile);
      console.log(`[${TC(11)}] Razorpay contact number:`, shopDataset.mobile);
      await paymentPage.clickRazorpayContinue();
      await paymentPage.selectNetbanking();
      console.log(`[${TC(11)}] Selected Netbanking in Razorpay`);
      await paymentPage.completeNetbankingPayment('HDFC Bank');
      console.log(`[${TC(11)}] Completed HDFC Bank netbanking payment`);

      placedOrders = await shopCheckoutPage.getPlacedOrders(productNames.length);
      console.log(
        `[${TC(11)}] Order ID mode:`,
        placedOrders.isSingleSharedOrder ? 'single shared order' : 'one order per product',
      );
      console.log(`[${TC(11)}] Order success message:`, placedOrders.successMessage);
      console.log(`[${TC(11)}] Order ID:`, placedOrders.displayText);
      shopCheckoutPage.assertPlacedOrders(placedOrders, productNames.length);
      expect(placedOrders.successMessage).toMatch(/booked/i);
      await shopCheckoutPage.dismissOrderPlacedDialog();
    });

    await test.step('TC_SHOP_003_12 | My orders SHOP tab validate each product', async () => {
      log(12, 'My Orders SHOP tab — validate order against product details');
      await myOrderVerificationPage.goToMyOrders();
      await myOrderVerificationPage.clickShopTabMultiProduct();

      log(
        12,
        `Shop tab: ${productNames.length} products — expect one order row per product (separate Shop entries when checkout issues one order id per line item)`,
      );

      for (let i = 0; i < productNames.length; i++) {
        const name = productNames[i];
        const shopOrder =
          name === emiProductName
            ? await myOrderVerificationPage.getShopEmiOrderDetails(name)
            : await myOrderVerificationPage.getShopOrderDetails(name);
        const orderDate = await myOrderVerificationPage.getShopOrderDate(name);
        orderIdByProduct[name] = shopOrder.orderId;
        shopOrdersByName[name] = shopOrder;

        console.log(`[${TC(12)}] Shop row ${i + 1}/${productNames.length} — product:`, name);
        console.log(`[${TC(12)}] My Orders Product Name:`, shopOrder.productName);
        console.log(`[${TC(12)}] My Orders Order Id:`, shopOrder.orderId);
        console.log(`[${TC(12)}] My Orders Status:`, shopOrder.status);
        console.log(`[${TC(12)}] My Orders Quantity:`, shopOrder.quantity);
        console.log(`[${TC(12)}] My Orders Price:`, shopOrder.priceAmount);
        console.log(`[${TC(12)}] Ordered On Date:`, orderDate);
        console.log(`[${TC(12)}] Order is on date:`, myOrderVerificationPage.isOrderedOnToday(orderDate));

        const expectedOrderId = placedOrders.isSingleSharedOrder
          ? placedOrders.orderIds[0]
          : `one of ${placedOrders.displayText}`;
        const expectedQty = Number(productDetailsByName[name].quantity) || 1;
        const expectedPrice = productLinePrices[name];

        console.log(`[${TC(12)}] Validate my orders vs cart line price from step 7`);
        logActualExpected(12, 'Product name', shopOrder.productName, name);
        logActualExpected(12, 'Quantity', shopOrder.quantity, expectedQty);
        logActualExpected(12, 'Price', shopOrder.priceAmount, expectedPrice);
        logActualExpected(12, 'Order Id', shopOrder.orderId, expectedOrderId);
        logActualExpected(12, 'Order Date', orderDate, 'ORDERED ON (today)');
        logActualExpected(
          12,
          'Order date is today',
          myOrderVerificationPage.isOrderedOnToday(orderDate),
          true,
        );

        shopCheckoutPage.assertOrderIdForProduct(shopOrder.orderId, placedOrders);

        expect(shopOrder.productName).toContain(name);
        expect(shopOrder.quantity).toBe(expectedQty);
        expect(shopOrder.priceAmount).toBe(expectedPrice);
        if (name === emiProductName) {
          expect(shopOrder.status).toMatch(/booked/i);
        } else {
          expect(shopOrder.status).toMatch(/payment received/i);
        }
        expect(orderDate).toMatch(/^ORDERED ON/i);
        expect(shopOrder.orderedOn).toBe(orderDate);
        expect(myOrderVerificationPage.isOrderedOnToday(orderDate)).toBe(true);
      }

      const orderIdsOnTab = productNames.map((n) => orderIdByProduct[n]);
      console.log(
        `[${TC(12)}] Shop tab summary — order id per product:`,
        productNames.map((n) => `${n} → ${orderIdByProduct[n]}`).join(' | '),
      );

      if (!placedOrders.isSingleSharedOrder) {
        logActualExpected(
          12,
          'Distinct Shop-tab order entries (unique order id per product)',
          new Set(orderIdsOnTab).size,
          productNames.length,
        );
        expect(
          new Set(orderIdsOnTab).size,
          'Shop tab should list a different order id for each product when checkout returns multiple ids',
        ).toBe(productNames.length);
      } else {
        log(
          12,
          `Single shared order id from checkout (${placedOrders.displayText}) — each Shop row should show the same order id`,
        );
        for (const n of productNames) {
          logActualExpected(12, `Order Id on row (${n})`, orderIdByProduct[n], placedOrders.orderIds[0]);
          expect(orderIdByProduct[n]).toBe(placedOrders.orderIds[0]);
        }
      }
    });

    await test.step('TC_SHOP_003_13 | View Detail validate order product vs step 4', async () => {
      log(13, 'View Detail — validate product, properties, addresses and payment');

      for (let i = 0; i < productNames.length; i++) {
        const name = productNames[i];
        const pd = productDetailsByName[name];
        const shopOrderFromStep12 = shopOrdersByName[name];
        const p = `Product ${i + 1}/${productNames.length}`;
        const expectedNetWeightGm = expectedShopWeightGrams(name, pd, cartNetWeightByName[name] ?? '');

        console.log(`\n[${TC(13)}] ${p} — ${name}`);
        const expectedDetailPrice = productLinePrices[name] ?? pd.grandTotal;

        if (name === emiProductName) {
          await myOrderVerificationPage.openShopEmiOrderDetail(name);
          const emiDetail = await myOrderVerificationPage.getShopEmiOrderDetailView();
          console.log(`[${TC(13)}] ${p} EMI Due On:`, emiDetail.dueOn);
          logActualExpected(13, `${p} EMI Detail product name`, emiDetail.productName, name);
          logActualExpected(
            13,
            `${p} EMI Detail net weight (g)`,
            weightGramsFromText(emiDetail.netWeight),
            expectedNetWeightGm,
          );
          logActualExpected(13, `${p} EMI Detail quantity`, emiDetail.quantity, Number(pd.quantity) || 1);
          logActualExpected(13, `${p} EMI Detail price`, emiDetail.priceAmount, expectedDetailPrice);
          logActualExpected(13, `${p} EMI Due On`, emiDetail.dueOn, /DUE ON/i);
          expect(emiDetail.productName).toContain(name);
          expect(weightGramsFromText(emiDetail.netWeight)).toBe(expectedNetWeightGm);
          expect(emiDetail.quantity).toBe(Number(pd.quantity) || 1);
          expect(emiDetail.priceAmount).toBe(expectedDetailPrice);
          expect(emiDetail.dueOn).toMatch(/^DUE ON/i);
          logActualExpected(13, `${p} Step 12 list price`, emiDetail.priceAmount, shopOrderFromStep12.priceAmount);
          expect(emiDetail.priceAmount).toBe(shopOrderFromStep12.priceAmount);
          continue;
        }

        await myOrderVerificationPage.openShopOrderDetailMulti(name);
        const detail = await myOrderVerificationPage.getShopOrderDetailView();
        logActualExpected(13, `${p} Detail product name`, detail.productName, name);
        logActualExpected(
          13,
          `${p} Detail net weight (g)`,
          weightGramsFromText(detail.netWeight),
          expectedNetWeightGm,
        );
        logActualExpected(13, `${p} Detail quantity`, detail.quantity, Number(pd.quantity) || 1);
        logActualExpected(13, `${p} Detail price`, detail.priceAmount, expectedDetailPrice);
        expect(detail.productName).toContain(name);
        expect(weightGramsFromText(detail.netWeight)).toBe(expectedNetWeightGm);
        expect(detail.quantity).toBe(Number(pd.quantity) || 1);
        expect(detail.priceAmount).toBe(expectedDetailPrice);

        const props = await myOrderVerificationPage.getShopOrderProductProperties();
        const pdpStep = 6;
        console.log(`[${TC(13)}] ${p} Product Properties SKU:`, props.sku);
        console.log(`[${TC(13)}] ${p} Product Properties Metal Type:`, props.metalType);
        console.log(`[${TC(13)}] ${p} Product Properties Purity:`, props.purity);
        console.log(`[${TC(13)}] ${p} Product Properties Product Weight:`, props.productWeight);
        console.log(`[${TC(13)}] ${p} Step ${pdpStep} SKU:`, pd.sku);
        console.log(`[${TC(13)}] ${p} Step ${pdpStep} Metal Type:`, pd.metalType);
        console.log(`[${TC(13)}] ${p} Step ${pdpStep} Purity:`, pd.purity);
        console.log(`[${TC(13)}] ${p} Step ${pdpStep} Product Weight:`, pd.productWeight);
        if (pd.sku) {
          logActualExpected(13, `${p} SKU`, props.sku, pd.sku);
          expect(props.sku).toBe(pd.sku);
        } else {
          logActualExpected(13, `${p} SKU (PDP empty)`, props.sku, '(non-empty on order detail)');
          expect(props.sku, `${p} order detail should show SKU when PDP capture missed it`).toBeTruthy();
        }
        logActualExpected(13, `${p} Metal Type`, props.metalType, pd.metalType);
        logActualExpected(13, `${p} Purity`, props.purity, pd.purity);
        logActualExpected(13, `${p} Product Weight (g)`, weightGramsFromText(props.productWeight), expectedNetWeightGm);
        expect(props.metalType).toBe(pd.metalType);
        expect(props.purity).toBe(pd.purity);
        expect(weightGramsFromText(props.productWeight)).toBe(expectedNetWeightGm);

        const receivedAt = await myOrderVerificationPage.getShopOrderAddress('received');
        const billedAt = await myOrderVerificationPage.getShopOrderAddress('billed');
        console.log(`[${TC(13)}] ${p} Received At:`, receivedAt.fullName, receivedAt.pincode);
        console.log(`[${TC(13)}] ${p} Billed At:`, billedAt.fullName, billedAt.pincode);
        logActualExpected(13, `${p} Received At full name`, receivedAt.fullName, savedBillingAddress.fullName);
        logActualExpected(13, `${p} Received At pincode`, receivedAt.pincode, savedBillingAddress.pincode);
        logActualExpected(13, `${p} Billed At full name`, billedAt.fullName, savedBillingAddress.fullName);
        logActualExpected(13, `${p} Billed At pincode`, billedAt.pincode, savedBillingAddress.pincode);
        expect(receivedAt.fullName).toBe(savedBillingAddress.fullName);
        expect(receivedAt.address).toBe(savedBillingAddress.address);
        expect(receivedAt.pincode).toBe(savedBillingAddress.pincode);
        expect(billedAt.fullName).toBe(savedBillingAddress.fullName);
        expect(billedAt.address).toBe(savedBillingAddress.address);
        expect(billedAt.pincode).toBe(savedBillingAddress.pincode);

        const paymentMethod = await myOrderVerificationPage.getShopOrderPaymentMethod();
        logActualExpected(13, `${p} Payment method`, paymentMethod, placedPaymentMethod);
        expect(paymentMethod).toMatch(new RegExp(placedPaymentMethod, 'i'));

        const orderStatusAndDate = await myOrderVerificationPage.getShopOrderDetailStatusAndDate();
        console.log(`[${TC(13)}] ${p} Order Id:`, orderStatusAndDate.orderId);
        console.log(`[${TC(13)}] ${p} Order Status:`, orderStatusAndDate.status);
        console.log(`[${TC(13)}] ${p} Ordered On Date:`, orderStatusAndDate.orderedOn);
        console.log(
          `[${TC(13)}] ${p} Order is on date:`,
          myOrderVerificationPage.isOrderedOnToday(orderStatusAndDate.orderedOn),
        );

        const orderDateTime = await myOrderVerificationPage.getShopOrderDetailDateTime();
        console.log(`[${TC(13)}] ${p} Order Date Time:`, orderDateTime.dateTimeText);
        console.log(`[${TC(13)}] ${p} Order Date:`, orderDateTime.orderDate);
        console.log(`[${TC(13)}] ${p} Order Time:`, orderDateTime.orderTime);
        console.log(
          `[${TC(13)}] ${p} Detail order is on date:`,
          myOrderVerificationPage.isOrderDateToday(orderDateTime.orderDate),
        );

        console.log(`[${TC(13)}] ${p} Step 12 Order Id:`, shopOrderFromStep12.orderId);
        console.log(`[${TC(13)}] ${p} Step 12 Status:`, shopOrderFromStep12.status);
        logActualExpected(13, `${p} Order Id`, orderStatusAndDate.orderId, shopOrderFromStep12.orderId);
        logActualExpected(13, `${p} Order Status`, orderStatusAndDate.status, shopOrderFromStep12.status);
        logActualExpected(13, `${p} Ordered On`, orderStatusAndDate.orderedOn, shopOrderFromStep12.orderedOn);
        logActualExpected(13, `${p} Order Date Time`, orderDateTime.dateTimeText, 'date | time format');
        logActualExpected(13, `${p} Order Date`, orderDateTime.orderDate, 'today');
        logActualExpected(13, `${p} Order Time`, orderDateTime.orderTime, 'HH:MM AM/PM');
        logActualExpected(
          13,
          `${p} Detail order date is today`,
          myOrderVerificationPage.isOrderDateToday(orderDateTime.orderDate),
          true,
        );
        expect(orderStatusAndDate.orderId).toBe(shopOrderFromStep12.orderId);
        expect(orderStatusAndDate.status).toBe(shopOrderFromStep12.status);
        expect(myOrderVerificationPage.isOrderedOnToday(orderStatusAndDate.orderedOn)).toBe(true);
        expect(myOrderVerificationPage.isOrderedOnToday(shopOrderFromStep12.orderedOn)).toBe(true);
        expect(orderDateTime.orderTime).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
        expect(myOrderVerificationPage.isOrderDateToday(orderDateTime.orderDate)).toBe(true);
      }
    });

    await test.step('TC_SHOP_003_14 | Download invoice and validate', async () => {
      const invoiceTargets = placedOrders.isSingleSharedOrder ? [productNames[0]] : [...productNames];

      for (let inv = 0; inv < invoiceTargets.length; inv++) {
        const invoiceProductName = invoiceTargets[inv];
        const ordinal = `${inv + 1}/${invoiceTargets.length}`;

        await test.step(`TC_SHOP_003_14 (${ordinal}) ${invoiceProductName}`, async () => {
          if (inv > 0) {
            await myOrderVerificationPage.resetShopInvoiceSession();
          }

          await test.step('TC_SHOP_003_14 setup — ensure order detail is open for invoice', async () => {
            log(14, `[${ordinal}] Ensure order detail for "${invoiceProductName}"`);
            if (invoiceProductName === emiProductName) {
              await myOrderVerificationPage.ensureShopEmiOrderDetailForInvoice(invoiceProductName, {
                requireMatchingProduct: true,
              });
            } else {
              await myOrderVerificationPage.ensureShopOrderDetailForInvoice(invoiceProductName, {
                requireMatchingProduct: true,
              });
            }
          });

          await test.step('TC_SHOP_003_14a — Open invoice (see [Shop Invoice] logs)', async () => {
            log(14, `[${ordinal}] Open shop invoice PDF — steps 1–6 logged by page object`);
            await myOrderVerificationPage.clickShopInvoice({
              maxAttempts: 4,
              captureTimeoutMs: 12_000,
              productName: invoiceProductName,
              useEmiOrderDetail: invoiceProductName === emiProductName,
            });
          });

          await test.step('TC_SHOP_003_14b — Unlock PDF with mobile password', async () => {
            log(14, `[${ordinal}] Submit invoice PDF password — steps 7–9 logged by page object`);
            await myOrderVerificationPage.submitShopInvoicePassword(shopDataset.mobile);
          });

          await test.step('TC_SHOP_003_14c — Download PDF and validate fields', async () => {
            const invoicePassword = shopDataset.mobile.replace(/\D/g, '').slice(-4);
            log(14, `[${ordinal}] Download and parse PDF — step 10 logged by page object`);
            const pdfUrl = await myOrderVerificationPage.getShopInvoicePdfUrl();
            console.log(`[${TC(14)}] [${ordinal}] Invoice PDF URL:`, pdfUrl);

            let response = await page.request.get(pdfUrl, { timeout: 30_000 });
            if (!response.ok()) {
              console.log(`[${TC(14)}] [${ordinal}] PDF download retry after 2s`);
              await page.waitForTimeout(2_000);
              response = await page.request.get(pdfUrl, { timeout: 30_000 });
            }
            logActualExpected(14, `[${ordinal}] PDF response OK`, response.ok(), true);
            expect(response.ok()).toBeTruthy();

            const pdfBuffer = await response.body();
            const rawPdfText = await shopPdfUtils.readShopInvoicePdf(pdfBuffer, invoicePassword);
            const pdfText = pdfUtils.normalizePdfText(rawPdfText);

            const isEmiInvoice =
              invoiceProductName === emiProductName || shopPdfUtils.isShopEmiProformaInvoicePdf(pdfUrl);
            const invoiceNo = shopPdfUtils.extractShopInvoiceNumber(pdfText);
            const invoiceDate = shopPdfUtils.extractShopInvoiceDate(pdfText);
            const gstin = pdfUtils.extractGstin(pdfText);
            const cin = pdfUtils.extractCin(pdfText);
            const invoiceOrderId = shopCheckoutPage.getInvoiceOrderId(
              placedOrders,
              orderIdByProduct[invoiceProductName],
            );
            const pdfHasOrderId = shopPdfUtils.shopPdfContainsOrderReference(pdfText, invoiceOrderId);
            const linePrice =
              productLinePrices[invoiceProductName] ?? productDetailsByName[invoiceProductName].grandTotal;

            let netPayable: number;
            let expectedInvoiceNetPayable: number;
            let gstDetails: ReturnType<typeof shopPdfUtils.extractShopInvoiceGstDetails>;
            let gstValidation: { ok: boolean; messages: string[] };

            if (isEmiInvoice) {
              expect(emiPlanDetails).toBeDefined();
              expectedInvoiceNetPayable = linePrice;
              netPayable = shopPdfUtils.extractShopEmiProformaNetPayable(pdfText, expectedInvoiceNetPayable);
              gstDetails = shopPdfUtils.extractShopInvoiceGstDetails(pdfText);
              gstValidation = { ok: true, messages: [] };
              console.log(`[${TC(14)}] [${ordinal}] EMI proforma invoice — expect net payable:`, expectedInvoiceNetPayable);
            } else {
              netPayable = shopPdfUtils.extractShopNetPayable(pdfText);
              expectedInvoiceNetPayable = shopCheckoutPage.getExpectedInvoiceNetPayable(
                placedOrders,
                combinedGrandTotal,
                linePrice,
              );
              gstDetails = shopPdfUtils.extractShopInvoiceGstDetails(pdfText);
              gstValidation = shopPdfUtils.validateShopInvoiceGst({
                taxableAmount: gstDetails.taxableAmount,
                netPayable,
                igstAmount: gstDetails.igstAmount,
                cgstAmount: gstDetails.cgstAmount,
                sgstAmount: gstDetails.sgstAmount,
                igstRatePercent: gstDetails.igstRatePercent ?? 3,
              });
            }

            const pdfProductNames = placedOrders.isSingleSharedOrder
              ? shopCheckoutPage.getInvoiceProductNames(placedOrders, productNames)
              : [invoiceProductName];
            const invoiceDateMissingInPdf = shopPdfUtils.isShopInvoiceDateMissingInPdf(pdfText);

            console.log(`[${TC(14)}] [${ordinal}] Invoice No:`, invoiceNo);
            console.log(`[${TC(14)}] [${ordinal}] Invoice Date:`, invoiceDate);
            console.log(`[${TC(14)}] [${ordinal}] GSTIN:`, gstin);
            console.log(`[${TC(14)}] [${ordinal}] CIN:`, cin);
            console.log(`[${TC(14)}] [${ordinal}] Net Payable:`, netPayable);
            console.log(`[${TC(14)}] [${ordinal}] Taxable (Net Total):`, gstDetails.taxableAmount);
            console.log(`[${TC(14)}] [${ordinal}] IGST:`, gstDetails.igstAmount, `@ ${gstDetails.igstRatePercent ?? 3}%`);
            console.log(`[${TC(14)}] [${ordinal}] CGST:`, gstDetails.cgstAmount ?? '(not in PDF)');
            console.log(`[${TC(14)}] [${ordinal}] SGST:`, gstDetails.sgstAmount ?? '(not in PDF)');

            for (const name of pdfProductNames) {
              const pdfHasProduct = shopPdfUtils.shopPdfContainsProductName(pdfText, name);
              logActualExpected(14, `[${ordinal}] Product name in PDF (${name})`, pdfHasProduct, true);
              expect(pdfHasProduct).toBe(true);
            }

            logActualExpected(14, `[${ordinal}] Invoice No`, invoiceNo, 'non-empty');
            logActualExpected(
              14,
              `[${ordinal}] Invoice Date`,
              invoiceDate || (invoiceDateMissingInPdf ? 'NOT_IN_PDF' : ''),
              'non-empty or NOT_IN_PDF',
            );
            logActualExpected(14, `[${ordinal}] GSTIN`, gstin, 'non-empty');
            logActualExpected(14, `[${ordinal}] CIN`, cin, 'non-empty');
            logActualExpected(14, `[${ordinal}] Order / Transaction ref in PDF`, pdfHasOrderId, true);
            logActualExpected(14, `[${ordinal}] Net payable`, netPayable, expectedInvoiceNetPayable);

            if (gstDetails.igstAmount != null && gstDetails.igstAmount > 0) {
              const expectedIgst =
                Math.round(gstDetails.taxableAmount * ((gstDetails.igstRatePercent ?? 3) / 100) * 100) / 100;
              logActualExpected(14, `[${ordinal}] IGST amount`, gstDetails.igstAmount, expectedIgst);
            }
            if (gstDetails.cgstAmount != null && gstDetails.cgstAmount > 0) {
              const expectedCgst = Math.round(gstDetails.taxableAmount * 0.015 * 100) / 100;
              logActualExpected(14, `[${ordinal}] CGST amount`, gstDetails.cgstAmount, expectedCgst);
            }
            if (gstDetails.sgstAmount != null && gstDetails.sgstAmount > 0) {
              const expectedSgst = Math.round(gstDetails.taxableAmount * 0.015 * 100) / 100;
              logActualExpected(14, `[${ordinal}] SGST amount`, gstDetails.sgstAmount, expectedSgst);
            }
            if (!isEmiInvoice) {
              logActualExpected(14, `[${ordinal}] GST breakdown vs payable`, gstValidation.ok, true);
              if (!gstValidation.ok) {
                console.log(`[${TC(14)}] [${ordinal}] GST validation notes:`, gstValidation.messages.join(' | '));
              }
            }

            expect(invoiceNo).toBeTruthy();
            expect(invoiceDate || invoiceDateMissingInPdf).toBeTruthy();
            expect(gstin).toBeTruthy();
            expect(cin).toBeTruthy();
            expect(pdfHasOrderId).toBe(true);
            expect(Number.isFinite(netPayable)).toBe(true);
            expect(Math.abs(netPayable - expectedInvoiceNetPayable)).toBeLessThanOrEqual(2);
            if (!isEmiInvoice && gstDetails.igstAmount != null && gstDetails.igstAmount > 0) {
              expect(gstValidation.ok, gstValidation.messages.join('; ')).toBe(true);
            }
          });
        });
      }
    });
  });

  /**
   * TC_SHOP_004 — Alt customer login + dashboard portfolio before shop (1–2), TC001 shop flow (3–16),
   * dashboard portfolio after shop (17, same pattern as buy-metal TC005_7). Savings checkout, My Orders,
   * View Detail, and invoice.
   */
  test('TC_SHOP_004 - Alt customer login + shop gold coin flow @customer-flows', async ({
    page,
    customerLogin,
    dashboardPage,
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(480_000);

    const TC = (n: number): string => `TC_SHOP_004_${n}`;
    const log = (n: number, title: string): void => console.log(`\n[${TC(n)}] ${title}`);
    const logActualExpected = (n: number, label: string, actual: unknown, expected: unknown): void => {
      console.log(`[${TC(n)}] ${label} | Actual:`, actual, '| Expected:', expected);
    };

    const productName = shopDataset.productName;
    const checkoutMobile = altCustomer.resolveAltCustomerMobile();
    const checkoutOtp = altCustomer.resolveAltCustomerOtp();
    let productDetails: Awaited<ReturnType<typeof shopPage.getProductDetails>>;
    let savedBillingAddress: Awaited<ReturnType<typeof shopCheckoutPage.getBillingAddress>>;
    let placedOrderId = '';
    let placedOrderSuccessMessage = '';
    let shopOrderFromStep14: Awaited<ReturnType<typeof myOrderVerificationPage.getShopOrderDetails>>;
    let cartNetWeight = '';
    let cartSavingsAmount = 0;
    let summaryPayableSum = 0;
    let goldBeforePurchase = 0;
    let silverBeforePurchase = 0;
    let portfolioBeforePurchase = 0;

    const checkoutUserLabel = `alt customer (${checkoutMobile})`;

    await test.step('TC_SHOP_004_1 | Clear storage + login (TC005 user)', async () => {
      log(1, 'Session: clear storage + customer login (same as buy-metal TC005_1)');
      console.log(
        `[${TC(1)}] Logging in as ${checkoutMobile} using ${getTargetEnv().toUpperCase()} customer OTP.`,
      );
      await altCustomer.clearCustomerBrowserStorage(page);
      await customerLogin.login(checkoutMobile, checkoutOtp);
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      const url = await altCustomer.waitAndRetryIfKycRedirect(page, '/dashboard');
      if (/\/login(?:\/|$|\?)/i.test(url) || /\/kyc(?:\/|$|\?)/i.test(url)) {
        throw new Error(
          `[${TC(1)}] Session invalid after login (${url}). Check ${checkoutMobile} is registered on UAT.`,
        );
      }
    });

    await test.step('TC_SHOP_004_2 | Dashboard portfolio before shop ', async () => {
      log(2, 'Grams + digital-gold rates; UI vs calculated portfolio (before)');
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/dashboard/i, { timeout: 8_000 });
      await dashboardPage.waitForDashboardPortfolioSection(12_000);
      const spot = await altCustomer.fetchDigitalMetalSpotRates(page);
      const { totalGoldGrams: totalGold, totalSilverGrams: totalSilver, portfolioInr: uiPortfolio } =
        await dashboardPage.readPortfolioMetrics({ skipPortfolioWait: true });
      goldBeforePurchase = totalGold;
      silverBeforePurchase = totalSilver;
      portfolioBeforePurchase = uiPortfolio;
      const calculatedPortfolio = altCustomer.portfolioFromMetalGramsAndSellRates(totalGold, totalSilver, spot);
      console.log(`[${TC(2)}] Total gold (g):`, totalGold);
      console.log(`[${TC(2)}] Total silver (g):`, totalSilver);
      console.log(
        `[${TC(2)}] UI portfolio: ₹${uiPortfolio} | calculated: ₹${calculatedPortfolio} (gold×gSell + silver×sSell)`,
      );
      expect(totalGold).toBeGreaterThan(0);
      expect(totalSilver).toBeGreaterThanOrEqual(0);
      expect(uiPortfolio).toBeGreaterThan(0);
      altCustomer.logValidation(`${TC(2)} UI portfolio vs formula`, uiPortfolio, calculatedPortfolio);
      expect(uiPortfolio).toBeCloseTo(calculatedPortfolio, 2);
    });

    await test.step('TC_SHOP_004_3 | Clear cart', async () => {
      log(3, 'Clear cart from dashboard shop (same as TC001 step 1)');
      await page.goto('/shop-new/cart');
      const removed = await shopCartPage.removeAllCartItems();
      console.log(`[${TC(3)}] Removed products:`, removed.join(' | ') || '(none)');
      expect(await shopCartPage.getCartItemCount()).toBe(0);
    });

    await test.step('TC_SHOP_004_4 | Open shop product listing', async () => {
      log(4, 'Open shop product listing (same as TC001 step 2)');
      await shopPage.open();
      await expect(page).toHaveURL(/shop-new\/product/i);
    });

    await test.step('TC_SHOP_004_5 | Apply Gold Coin and price filters', async () => {
      log(5, 'Apply Gold Coin and price filters (same as TC001 step 3)');
      await shopPage.clickGoldCoinCheckbox();
      await shopPage.clickPriceRangeRadio();
    });

    await test.step('TC_SHOP_004_6 | Verify Excel product in filtered list', async () => {
      log(6, 'Get filtered product list and verify Excel product (same as TC001 step 4)');
      console.log(`[${TC(6)}] Product from testdata/customer/customer-data.xlsx:`, productName);
      const { count, names } = await shopPage.scrollDownAndGetProducts();
      console.log(`[${TC(6)}] UI results count:`, count);
      console.log(`[${TC(6)}] Product names:`, names.join(' | '));
      expect(count).toBeGreaterThan(0);
      expect(names).toContain(productName);
    });

    await test.step('TC_SHOP_004_7 | Select product and capture details', async () => {
      log(7, 'Select product and capture product details (same as TC001 step 5)');
      await shopPage.selectProduct(productName);
      productDetails = await shopPage.getProductDetails();
      console.log(`[${TC(7)}] Product Name:`, productDetails.productName);
      console.log(`[${TC(7)}] Price:`, productDetails.price);
      console.log(`[${TC(7)}] MRP Note:`, productDetails.mrpNote);
      console.log(`[${TC(7)}] EMI:`, productDetails.emiText);
      console.log(`[${TC(7)}] Quantity:`, productDetails.quantity);
      console.log(`[${TC(7)}] SKU:`, productDetails.sku);
      console.log(`[${TC(7)}] Metal Type:`, productDetails.metalType);
      console.log(`[${TC(7)}] Purity:`, productDetails.purity);
      console.log(`[${TC(7)}] Product Weight:`, productDetails.productWeight);
      console.log(`[${TC(7)}] 24 KT Gold Price:`, productDetails.goldPrice);
      console.log(`[${TC(7)}] Making & Delivery Charges:`, productDetails.makingAndDeliveryCharges);
      console.log(`[${TC(7)}] TAX:`, productDetails.tax);
      console.log(`[${TC(7)}] Grand Total:`, productDetails.grandTotal);
      console.log(`[${TC(7)}] Returns Policy:`, productDetails.returnsPolicy);
      console.log(`[${TC(7)}] Trust Badges:`, productDetails.trustBadges.join(' | '));
      expect(productDetails.productName).toContain(productName);
      expect(productDetails.grandTotal).toBeGreaterThan(0);
    });

    await test.step('TC_SHOP_004_8 | Buy Now adds product to cart', async () => {
      log(8, 'Verify Buy with EMI and Buy Now, add product to cart (same as TC001 step 6)');
      await expect(shopPage.buyWithEmi).toBeVisible();
      await expect(shopPage.buyNow).toBeVisible();
      console.log(`[${TC(8)}] Buy with EMI button is displayed`);
      console.log(`[${TC(8)}] Buy Now button is displayed`);
      await shopPage.clickBuyNow();
      console.log(`[${TC(8)}] Clicked Buy Now button`);
    });

    await test.step('TC_SHOP_004_9 | Validate cart, Use Saving checkbox and savings amount', async () => {
      log(9, 'Validate cart item and price details; click Use Saving and read savings');
      const cartItem = await shopCartPage.getCartItemDetails(productName);
      cartNetWeight = cartItem.netWeight;
      const cartPrice = await shopCartPage.getCartPriceDetails();
      console.log(`[${TC(9)}] Cart Product Name:`, cartItem.productName);
      console.log(`[${TC(9)}] Cart Net Weight:`, cartItem.netWeight);
      console.log(`[${TC(9)}] Cart Quantity:`, cartItem.quantity);
      console.log(`[${TC(9)}] Cart Item Price:`, cartItem.itemPrice);
      console.log(`[${TC(9)}] Cart Metal Price:`, cartPrice.metalPrice);
      console.log(`[${TC(9)}] Cart Making & Delivery:`, cartPrice.makingAndDeliveryCharges);
      console.log(`[${TC(9)}] Cart Tax:`, cartPrice.tax);
      console.log(`[${TC(9)}] Cart Grand Total:`, cartPrice.grandTotal);
      expect(cartItem.productName).toContain(productName);
      expect(cartItem.itemPrice).toBe(productDetails.grandTotal);
      expect(cartPrice.metalPrice).toBe(productDetails.goldPrice);
      expect(cartPrice.makingAndDeliveryCharges).toBe(productDetails.makingAndDeliveryCharges);
      expect(cartPrice.tax).toBe(productDetails.tax);
      console.log(`[${TC(9)}] Cart Grand Total:`, cartPrice.grandTotal);
      expect(cartPrice.grandTotal).toBe(productDetails.grandTotal);
      await shopCartPage.clickUseSavingCheckbox();
      cartSavingsAmount = await shopCartPage.getAppliedCartSavingsAmount();
      if (cartSavingsAmount === 0) {
        cartSavingsAmount = productDetails.grandTotal;
      }
      console.log(`[${TC(9)}] Cart Savings (Use Savings checked):`, cartSavingsAmount);
      
    });

    await test.step('TC_SHOP_004_10 | Checkout billing and delivery', async () => {
      log(10, 'Checkout prices, billing address and confirm billing (same as TC001 step 8)');
      await shopCartPage.clickProceedToPay();
      await shopCheckoutPage.waitForCheckoutPage();
      const checkoutPrice = await shopCheckoutPage.getPriceDetailsWithSavings();
      console.log(`[${TC(10)}] Checkout Metal Price:`, checkoutPrice.metalPrice);
      console.log(`[${TC(10)}] Checkout Making & Delivery:`, checkoutPrice.makingAndDeliveryCharges);
      console.log(`[${TC(10)}] Checkout Savings:`, checkoutPrice.savings);
      console.log(`[${TC(10)}] Checkout Paid From Funds:`, checkoutPrice.paidFromFunds);
      console.log(`[${TC(10)}] Checkout Tax:`, checkoutPrice.tax);
      console.log(`[${TC(10)}] Checkout Grand Total:`, checkoutPrice.grandTotal);
      expect(checkoutPrice.savings).toBe(cartSavingsAmount);
      expect(checkoutPrice.paidFromFunds).toBe(0);

      savedBillingAddress = await shopCheckoutPage.getBillingAddress();
      console.log(`[${TC(10)}] Selected billing full name:`, savedBillingAddress.fullName);
      console.log(`[${TC(10)}] Selected billing address:`, savedBillingAddress.address);
      console.log(`[${TC(10)}] Selected billing pincode:`, savedBillingAddress.pincode);
      console.log(`[${TC(10)}] Selected billing mobile:`, savedBillingAddress.mobile || '(not shown)');
      expect(savedBillingAddress.address).toBeTruthy();
      expect(savedBillingAddress.pincode).toMatch(/^\d{6}$/);

      await shopCheckoutPage.confirmBillingAndDelivery();
      console.log(`[${TC(10)}] Confirmed billing and delivery address`);
    });

    await test.step('TC_SHOP_004_11 | OTP verify', async () => {
      log(11, `Verify OTP sent to ${checkoutUserLabel}, enter OTP and click Verify (same as TC001 step 9)`);
      const sentToText = await shopCheckoutPage.getOtpSentToText();
      console.log(`[${TC(11)}] OTP Sent to text:`, sentToText);
      console.log(`[${TC(11)}] Expected mobile:`, checkoutMobile);
      expect(sentToText.replace(/\D/g, '').slice(-10)).toBe(checkoutMobile.replace(/\D/g, '').slice(-10));
      await shopCheckoutPage.submitOtp(checkoutOtp);
      console.log(`[${TC(11)}] OTP entered:`, checkoutOtp);
      console.log(`[${TC(11)}] Clicked Verify button`);
    });

    await test.step('TC_SHOP_004_12 | Summary cart and prices', async () => {
      log(12, 'Verify order summary cart and prices after OTP (TC004 — no address validation)');
      await shopCheckoutPage.waitForOrderSummary();

      const orderItem = await shopCheckoutPage.getOrderItemDetails(productName);
      const checkoutPrice = await shopCheckoutPage.getPriceDetailsWithSavings();
      console.log(`[${TC(12)}] Order Product Name:`, orderItem.productName);
      console.log(`[${TC(12)}] Order Quantity:`, orderItem.quantity);
      console.log(`[${TC(12)}] Order Item Price:`, orderItem.itemPrice);
      console.log(`[${TC(12)}] Checkout Metal Price:`, checkoutPrice.metalPrice);
      console.log(`[${TC(12)}] Checkout Making & Delivery:`, checkoutPrice.makingAndDeliveryCharges);
      console.log(`[${TC(12)}] Checkout Tax:`, checkoutPrice.tax);
      console.log(`[${TC(12)}] Checkout Savings:`, checkoutPrice.savings);
      console.log(`[${TC(12)}] Checkout Paid From Funds:`, checkoutPrice.paidFromFunds);
      summaryPayableSum = altCustomer.expectShopCheckoutGrandTotalWithSavings(checkoutPrice, cartSavingsAmount);
      console.log(
        `[${TC(12)}] Grand Total = metal + M&D + tax − savings − funds:`,
        summaryPayableSum,
        '| UI:',
        checkoutPrice.grandTotal,
      );
      expect(orderItem.productName).toContain(productName);
      expect(orderItem.itemPrice).toBe(productDetails.grandTotal);
      expect(summaryPayableSum, 'TC004 requires zero payable after Use Saving').toBe(0);
      expect(checkoutPrice.grandTotal).toBe(0);
      await shopCheckoutPage.clickPay();
      console.log(`[${TC(12)}] summaryPayableSum=0 — clicked Pay (no Razorpay)`);
    });

    await test.step('TC_SHOP_004_13 | Order Placed success screen', async () => {
      if (summaryPayableSum !== 0) {
        throw new Error(
          `[${TC(13)}] Skipped — summaryPayableSum must be 0 before Order Placed validation (got ${summaryPayableSum})`,
        );
      }
      log(13, 'Validate Order Placed dialog — success message and order ID (TC004, zero payable)');

      const orderPlaced = await shopCheckoutPage.getOrderPlacedDetails();
      placedOrderId = orderPlaced.orderId;
      placedOrderSuccessMessage = orderPlaced.successMessage;
      console.log(`[${TC(13)}] Order success message:`, placedOrderSuccessMessage);
      console.log(`[${TC(13)}] Order ID:`, placedOrderId);
      expect(placedOrderId).toMatch(/^\d+$/);
      expect(orderPlaced.successMessage).toMatch(/booked/i);
      await shopCheckoutPage.dismissOrderPlacedDialog();
    });

    await test.step('TC_SHOP_004_14 | My orders SHOP tab — main list values', async () => {
      log(14, 'SHOP tab list — product name, amount, order id only (TC004)');
      await myOrderVerificationPage.goToMyOrders();
      await myOrderVerificationPage.clickShopTabSingleOrder();

      shopOrderFromStep14 = await myOrderVerificationPage.getShopOrderDetails(productName);

      console.log(`[${TC(14)}] Product name:`, shopOrderFromStep14.productName);
      console.log(`[${TC(14)}] Amount:`, shopOrderFromStep14.priceAmount);
      console.log(`[${TC(14)}] Order Id:`, shopOrderFromStep14.orderId);

      logActualExpected(14, 'Product name', shopOrderFromStep14.productName, productName);
      logActualExpected(14, 'Amount', shopOrderFromStep14.priceAmount, productDetails.grandTotal);
      logActualExpected(14, 'Order Id', shopOrderFromStep14.orderId, placedOrderId);
      altCustomer.expectShopOrderListMainFields(shopOrderFromStep14, {
        productName,
        priceAmount: productDetails.grandTotal,
        orderId: placedOrderId,
      });
    });

    await test.step('TC_SHOP_004_15 | View Detail — main values only', async () => {
      log(15, 'View Detail — product name, amount, order id only (TC004)');
      await myOrderVerificationPage.openShopOrderDetailSingle(productName);

      const detail = await myOrderVerificationPage.getShopOrderDetailView();
      const orderMeta = await myOrderVerificationPage.getShopOrderDetailStatusAndDate();

      console.log(`[${TC(15)}] Detail product name:`, detail.productName);
      console.log(`[${TC(15)}] Detail amount:`, detail.priceAmount);
      console.log(`[${TC(15)}] Detail order id:`, orderMeta.orderId);

      logActualExpected(15, 'Product name', detail.productName, productName);
      logActualExpected(15, 'Amount', detail.priceAmount, productDetails.grandTotal);
      logActualExpected(15, 'Order Id', orderMeta.orderId, placedOrderId);
      altCustomer.expectShopOrderDetailMainFields(
        detail,
        orderMeta,
        {
          productName,
          priceAmount: productDetails.grandTotal,
          orderId: placedOrderId,
        },
      );
    });

    await test.step('TC_SHOP_004_16 | Invoice — main values only', async () => {
      await test.step('16 setup — ensure order detail is open for invoice', async () => {
        log(16, `Ensure order detail for "${productName}"`);
        await myOrderVerificationPage.ensureShopOrderDetailForInvoice(productName, { flow: 'single' });
      });

      await test.step('16a — Open invoice (see [Shop Invoice] logs)', async () => {
        log(16, `Open shop invoice PDF (${checkoutUserLabel}) — steps 1–6 logged by page object`);
        await myOrderVerificationPage.clickShopInvoice({
          maxAttempts: 4,
          captureTimeoutMs: 20_000,
          productName,
          orderId: placedOrderId,
        });
      });

      await test.step('16b — Unlock PDF with mobile password', async () => {
        log(16, `Submit invoice PDF password (${checkoutUserLabel}) — steps 7–9 logged by page object`);
        await myOrderVerificationPage.submitShopInvoicePassword(checkoutMobile);
      });

      await test.step('16c — Download PDF and validate main fields', async () => {
        const invoicePassword = checkoutMobile.replace(/\D/g, '').slice(-4);
        const expectedNetPayable = productDetails.grandTotal;
        log(16, 'Invoice PDF — order ref, product name, net payable (product value) only (TC004)');
        const pdfUrl = await myOrderVerificationPage.getShopInvoicePdfUrl();
        console.log(`[${TC(16)}] Invoice PDF URL:`, pdfUrl);

        let response = await page.request.get(pdfUrl, { timeout: 30_000 });
        if (!response.ok()) {
          await expect
            .poll(
              async () => {
                const retry = await page.request.get(pdfUrl, { timeout: 15_000 });
                if (retry.ok()) {
                  response = retry;
                  return true;
                }
                return false;
              },
              { timeout: 25_000, intervals: [500, 1000, 2000] },
            )
            .toBeTruthy();
        }
        expect(response.ok()).toBeTruthy();

        const pdfBuffer = await response.body();
        const rawPdfText = await shopPdfUtils.readShopInvoicePdf(pdfBuffer, invoicePassword);
        const pdfText = pdfUtils.normalizePdfText(rawPdfText);

        const netPayable = shopPdfUtils.extractShopNetPayable(pdfText);
        const pdfHasOrderId = shopPdfUtils.shopPdfContainsOrderReference(pdfText, placedOrderId);
        const pdfHasProduct =
          shopPdfUtils.shopPdfContainsProductName(pdfText, productName) ||
          shopPdfUtils.shopPdfContainsProductName(pdfText, productDetails.productName);

        console.log(`[${TC(16)}] Order ref in PDF:`, pdfHasOrderId);
        console.log(`[${TC(16)}] Product in PDF:`, pdfHasProduct);
        console.log(`[${TC(16)}] Net payable:`, netPayable, '| Expected:', expectedNetPayable);

        logActualExpected(16, 'Order ref in PDF', pdfHasOrderId, true);
        logActualExpected(16, 'Product name in PDF', pdfHasProduct, productName);
        logActualExpected(16, 'Net payable', netPayable, expectedNetPayable);
        altCustomer.expectShopInvoiceMainFields(
          { hasOrderId: pdfHasOrderId, hasProduct: pdfHasProduct, netPayable },
          { orderId: placedOrderId, productName, netPayable: expectedNetPayable },
        );
      });
    });

    await test.step('TC_SHOP_004_17 | Dashboard portfolio after shop', async () => {
      const productWeightGrams = expectedShopWeightGrams(productName, productDetails, cartNetWeight);
      const expectedGoldGrams = Number((goldBeforePurchase - productWeightGrams).toFixed(4));
      log(
        17,
        `Expected gold (g) = goldBeforePurchase − productWeight = ${goldBeforePurchase} − ${productWeightGrams} = ${expectedGoldGrams}`,
      );
      altCustomer.logValidation(
        `${TC(17)} expectedGold = goldBeforePurchase − productWeight`,
        expectedGoldGrams,
        goldBeforePurchase - productWeightGrams,
      );
      const portfolioSnapshot = await altCustomer.assertDashboardPortfolioWithRetry(page, dashboardPage, {
        logLabel: TC(17),
        gramExpectations: {
          expectedGoldGrams,
          expectedSilverGrams: silverBeforePurchase,
        },
      });

      const portfolioAfter = portfolioSnapshot.uiPortfolioInr;
      const expectedPortfolioAfter = Number(
        (portfolioBeforePurchase - productDetails.grandTotal).toFixed(2),
      );
      const portfolioChange = Number((portfolioAfter - portfolioBeforePurchase).toFixed(2));
      const portfolioDiffVsExpected = Number((portfolioAfter - expectedPortfolioAfter).toFixed(2));
      const portfolioDiffAbs = Math.abs(portfolioDiffVsExpected);
      const portfolioDeltaTolerance = Math.max(100, productDetails.grandTotal * 0.05);

      console.log(`[${TC(17)}] Portfolio before shop: ₹${portfolioBeforePurchase}`);
      console.log(`[${TC(17)}] Portfolio after shop: ₹${portfolioAfter}`);
      console.log(`[${TC(17)}] Portfolio change (after − before): ₹${portfolioChange}`);
      console.log(`[${TC(17)}] Grand total (product / savings): ₹${productDetails.grandTotal}`);
      console.log(`[${TC(17)}] Expected after (before − grandTotal): ₹${expectedPortfolioAfter}`);
      console.log(
        `[${TC(17)}] Diff (actual after − expected after): ₹${portfolioDiffVsExpected} | |diff|: ₹${portfolioDiffAbs} (tolerance ±₹${portfolioDeltaTolerance})`,
      );
      altCustomer.logValidation(
        `${TC(17)} portfolioAfter vs portfolioBefore − grandTotal`,
        portfolioAfter,
        expectedPortfolioAfter,
      );
      altCustomer.logValidation(`${TC(17)} |portfolio diff| vs tolerance`, portfolioDiffAbs, portfolioDeltaTolerance);
      expect(portfolioDiffAbs).toBeLessThanOrEqual(portfolioDeltaTolerance);
    });
  });
});
