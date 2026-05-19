import { test, expect } from '../../fixtures/base.fixture';
import { getShopDataset } from '../../utils/data/customer-excel-data';
import * as pdfUtils from '../../utils/pdf-utils';
import * as shopPdfUtils from '../../utils/shop-pdf-utils';
import {
  attachShopTc001InvoiceValidation,
  attachShopTc001OrderPlaced,
  configureShopTc001Allure,
} from '../../utils/allure/shop-tc001-allure';

const shopDataset = getShopDataset();

test.describe('customer shop flows @customer-flows', () => {
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
    await configureShopTc001Allure();

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
      console.log(`[${TC(8)}] Checkout Savings:`, checkoutPrice.savings);
      console.log(`[${TC(8)}] Checkout Paid From Funds:`, checkoutPrice.paidFromFunds);
      console.log(`[${TC(8)}] Checkout Tax:`, checkoutPrice.tax);
      console.log(`[${TC(8)}] Checkout Price Sum:`, checkoutPriceSum);
      console.log(`[${TC(8)}] Checkout Grand Total:`, checkoutPrice.grandTotal);
      expect(checkoutPrice.grandTotal).toBe(productDetails.grandTotal);
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
      await attachShopTc001OrderPlaced({
        orderId: placedOrderId,
        productName,
        grandTotal: productDetails.grandTotal,
        paymentMethod: placedPaymentMethod,
        successMessage: placedOrderSuccessMessage,
      });
      await shopCheckoutPage.dismissOrderPlacedDialog();
    });

    await test.step('TC_SHOP_001_12 | My orders SHOP tab validate order vs product', async () => {
      log(12, 'My Orders SHOP tab — validate order against product details');
      await myOrderVerificationPage.goToMyOrders();
      await myOrderVerificationPage.clickShopTab();

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
      log(13, 'View Detail — validate product, properties, addresses and payment');
      await myOrderVerificationPage.openShopOrderDetail(productName);

      const detail = await myOrderVerificationPage.getShopOrderDetailView();
      const weightGrams = (value: string): number => Number(value.match(/[\d.]+/)?.[0] ?? 0);
      logActualExpected(13, 'Detail product name', detail.productName, productName);
      logActualExpected(13, 'Detail net weight (g)', weightGrams(detail.netWeight), weightGrams(productDetails.productWeight));
      logActualExpected(13, 'Detail quantity', detail.quantity, Number(productDetails.quantity) || 1);
      logActualExpected(13, 'Detail price', detail.priceAmount, productDetails.grandTotal);
      expect(detail.productName).toContain(productName);
      expect(weightGrams(detail.netWeight)).toBe(weightGrams(productDetails.productWeight));
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
      logActualExpected(13, 'SKU', props.sku, productDetails.sku);
      logActualExpected(13, 'Metal Type', props.metalType, productDetails.metalType);
      logActualExpected(13, 'Purity', props.purity, productDetails.purity);
      logActualExpected(13, 'Product Weight', props.productWeight, productDetails.productWeight);
      expect(props.sku).toBe(productDetails.sku);
      expect(props.metalType).toBe(productDetails.metalType);
      expect(props.purity).toBe(productDetails.purity);
      expect(props.productWeight).toBe(productDetails.productWeight);

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
      await test.step('14 setup — ensure order detail is open for invoice', async () => {
        log(14, `Ensure order detail for "${productName}"`);
        await myOrderVerificationPage.ensureShopOrderDetailForInvoice(productName);
      });

      await test.step('14a — Open invoice (see [Shop Invoice] logs)', async () => {
        log(14, 'Open shop invoice PDF — steps 1–6 logged by page object');
        await myOrderVerificationPage.clickShopInvoice({
          maxAttempts: 4,
          retryDelayMs: 3_000,
          captureTimeoutMs: 12_000,
          productName,
        });
      });

      await test.step('14b — Unlock PDF with mobile password', async () => {
        log(14, 'Submit invoice PDF password — steps 7–9 logged by page object');
        await myOrderVerificationPage.submitShopInvoicePassword(shopDataset.mobile);
      });

      await test.step('14c — Download PDF and validate fields', async () => {
        const invoicePassword = shopDataset.mobile.replace(/\D/g, '').slice(-4);
        log(14, 'Download and parse PDF — step 10 logged by page object');
        const pdfUrl = await myOrderVerificationPage.getShopInvoicePdfUrl();
        console.log(`[${TC(14)}] Invoice PDF URL:`, pdfUrl);

        let response = await page.request.get(pdfUrl, { timeout: 30_000 });
        if (!response.ok()) {
          console.log(`[${TC(14)}] PDF download retry after 2s`);
          await page.waitForTimeout(2_000);
          response = await page.request.get(pdfUrl, { timeout: 30_000 });
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

        await attachShopTc001InvoiceValidation({
          orderId: placedOrderId,
          invoiceNo,
          invoiceDate: invoiceDate || (invoiceDateMissingInPdf ? 'NOT_IN_PDF' : ''),
          gstin,
          cin,
          netPayable,
          taxableAmount: gstDetails.taxableAmount,
          igstAmount: gstDetails.igstAmount,
          igstRatePercent: gstDetails.igstRatePercent,
          cgstAmount: gstDetails.cgstAmount,
          sgstAmount: gstDetails.sgstAmount,
          gstValidationOk: gstValidation.ok,
          gstValidationMessages: gstValidation.messages,
          pdfUrl,
        });
      });
    });
  });
});
