import { type Page } from '@playwright/test';
import { test, expect } from '../../fixtures/base.fixture';
import { getBuyMetalDataset } from '../../utils/data/customer-excel-data';
import * as pdfUtils from '../../utils/pdf-utils';

const dataset = getBuyMetalDataset();

function calculateAmounts(total: number, buyingRate: number, paidFromWallet: number) {
  const taxable = Number((total / 1.03).toFixed(2));
  const gst = Number((total - taxable).toFixed(2));
  const payable = Number((total - paidFromWallet).toFixed(2));
  const quantity = Number((taxable / buyingRate).toFixed(4));
  return { amount: taxable, tax: gst, total, payable, calcQuantity: quantity };
}

function logValidation(label: string, actual: unknown, expected: unknown): void {
  console.log(`[VALIDATION] ${label} | actual: ${String(actual)} | expected: ${String(expected)}`);
}

async function waitAndRetryIfKycRedirect(page: Page, targetPath: string): Promise<string> {
  const kycPattern = /\/kyc(?:\/|$|\?)/i;
  let url = page.url();
  if (!kycPattern.test(url)) return url;

  await page.waitForTimeout(3_000);
  await page.goto(targetPath);
  url = page.url();
  return url;
}

async function waitForBuyOutcome(page: Page): Promise<'summary' | 'kyc' | 'unknown'> {
  const summaryPattern = /digital-gold\/buy\/summary/i;
  const kycPattern = /\/kyc(?:\/|$|\?)/i;

  const outcome = await Promise.race([
    page.waitForURL(summaryPattern, { timeout: 15_000 }).then(() => 'summary' as const),
    page.waitForURL(kycPattern, { timeout: 15_000 }).then(() => 'kyc' as const),
    page.waitForTimeout(15_000).then(() => 'unknown' as const),
  ]);

  return outcome;
}

test.describe('customer buy metal flows @customer-flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    const url = await waitAndRetryIfKycRedirect(page, '/dashboard');
    if (/\/login(?:\/|$|\?)/i.test(url) || /\/kyc(?:\/|$|\?)/i.test(url)) {
      throw new Error(`Customer session is not valid (${url}). Run: npx playwright test --project=auth-setup`);
    }
  });

  test('TC_001-Buy Gold one-time using Netbanking + cancel + re-purchase flow', async ({
    page,
    dashboardPage,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(120_000);
    let totalGoldBeforePurchase = 0;
    let uiQuantity = 0;
    let purchasedQuantity = 0;
    let buyingRate = 0;
    let tax = 0;
    let amount = 0;
    let payable = 0;
    let paidAmount = 0;

    await test.step('Get current gold value', async () => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3_000);
      totalGoldBeforePurchase = await dashboardPage.getTotalGoldValue();
      console.log('Captured total gold before purchase (g):', totalGoldBeforePurchase);
      expect(totalGoldBeforePurchase).toBeGreaterThan(0);
    });

    await test.step('Get wallet balance from profile', async () => {
      await page.goto('/my-profile');
      await expect(page).toHaveURL(/my-profile/);
      const walletBalance = await dashboardPage.getWalletBalance();
      const expectedWalletBalance = 0;
      console.log(
        `Wallet balance validation | actual: ${walletBalance} | minimum expected: ${expectedWalletBalance}`,
      );
      expect(walletBalance).toBeGreaterThanOrEqual(expectedWalletBalance);
    });

    await test.step('Navigate to Buy Gold and place order', async () => {
      await page.goto('/digital-gold');
      await buyMetalPage.enterAmount(dataset.oneTimeGoldAmount);
      await buyMetalPage.clickOnOneTime();
      await page.waitForTimeout(10_000);
      await buyMetalPage.clickOnBuyGold();
    });

    await test.step('Verify summary values', async () => {
      await buySummaryPage.waitForValidForText();
      uiQuantity = await buySummaryPage.getQuantity();
      buyingRate = await buySummaryPage.getBuyingGoldRate();
      console.log('Buying gold rate:', buyingRate);
      const investingAmount = await buySummaryPage.getInvestingAmount();
      expect(investingAmount).toBe(Number(dataset.oneTimeGoldAmount));
      expect(await buySummaryPage.isEditVisible()).toBe(true);

      amount = await buySummaryPage.getAmount();
      tax = await buySummaryPage.getTax();
      const total = await buySummaryPage.getTotalAmount();
      const paid = await buySummaryPage.getPaidFromWallet();
      payable = await buySummaryPage.getAmountPayable();
      const calculated = calculateAmounts(total, buyingRate, paid);
      logValidation('Summary quantity', uiQuantity, calculated.calcQuantity);
      logValidation('Summary taxable amount', amount, calculated.amount);
      logValidation('Summary tax', tax, calculated.tax);
      logValidation('Summary payable', payable, calculated.payable);
      // Silver quantity UI can differ at 4th decimal because of rate/rounding timing.
      expect(uiQuantity).toBeCloseTo(calculated.calcQuantity, 3);
      expect(amount).toBeCloseTo(calculated.amount, 2);
      expect(tax).toBeCloseTo(calculated.tax, 2);
      expect(payable).toBeCloseTo(calculated.payable, 2);
      await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);
    });

    await test.step('Cancel flow then stay on summary', async () => {
      await buySummaryPage.clickCancel();
      await expect(page.getByText('Yes, Cancel', { exact: true })).toBeVisible();
      await expect(page.getByText('No, Complete Process', { exact: true })).toBeVisible();
      await buySummaryPage.clickNoCompleteProcess();
      await expect(page).toHaveURL(/summary/);
    });

    await test.step('Cancel and return to buy page', async () => {
      await buySummaryPage.clickCancel();
      await buySummaryPage.clickYesCancel();
      await expect(page).toHaveURL(/digital-gold/);
    });

    await test.step('Re-purchase after cancellation', async () => {
      await buyMetalPage.clickOnOneTimeRadioBtn();
      await buyMetalPage.enterAmount(dataset.oneTimeGoldAmount);
      await buyMetalPage.clickOnBuyGold();
      const outcome = await waitForBuyOutcome(page);
      if (outcome === 'kyc') {
        throw new Error(`Re-purchase flow redirected to KYC: ${page.url()}`);
      }
      await buySummaryPage.waitForValidForText();
      await buySummaryPage.clickPayNowButton();
    });

    await test.step('Complete payment via netbanking', async () => {
      const razorpayAmountRaw = await paymentPage.getPriceSummaryAmountFromFrame();
      const expectedAmount = Number(dataset.oneTimeGoldAmount);
      const razorpayAmountNormalized =
        razorpayAmountRaw > expectedAmount * 10
          ? Number((razorpayAmountRaw / 100).toFixed(2))
          : razorpayAmountRaw;
      paidAmount = razorpayAmountNormalized;
      console.log(
        `[TC_001 VALIDATION] razorpayAmount raw=${razorpayAmountRaw} normalized=${razorpayAmountNormalized} expected=${expectedAmount}`
      );
      expect(Math.abs(razorpayAmountNormalized - expectedAmount)).toBeLessThanOrEqual(1);
      await paymentPage.fillContactNumber(dataset.contactNumber);
      await paymentPage.selectNetbanking();
      await paymentPage.completeNetbankingPayment('HDFC Bank');
    });

    await test.step('Validate order details', async () => {
      await page.goto('/my-orders');
      await expect(page).toHaveURL(/my-orders/);
      await myOrderVerificationPage.waitForOrderRow();

// 1️⃣ Date
const date = await myOrderVerificationPage.getDate();
console.log('Date:', date);
const today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
const yyyy = today.getFullYear();
const currentDate = `${dd}/${mm}/${yyyy}`;
logValidation('Order date', date, currentDate);

expect(date).toBe(currentDate);

// 2️⃣ Transaction ID
const transactionId = await myOrderVerificationPage.getTransactionId();
console.log('Transaction ID:', transactionId);

// 3️⃣ Time of Purchase
const timeOfPurchase = await myOrderVerificationPage.getTimeOfPurchase();
console.log('Time of Purchase:', timeOfPurchase);

// 4️⃣ Narration
const narration = await myOrderVerificationPage.getNarration();
console.log('Narration:', narration);

const qty = await myOrderVerificationPage.getNarrationQuantity();
      purchasedQuantity = qty ?? 0;
logValidation('Order quantity', qty, uiQuantity);
expect(qty).toBeCloseTo(uiQuantity, 3);

// 5️⃣ Amount
const amount = await myOrderVerificationPage.getAmount();
const expectedAmount = paidAmount || Number(dataset.oneTimeGoldAmount);
logValidation('Order amount', amount, expectedAmount);
expect(Math.abs(amount - expectedAmount)).toBeLessThanOrEqual(1);
    });

    await test.step('Validate Invoice Detail', async () => {
      await myOrderVerificationPage.waitForOrderRow();

      const pdfUrl = await myOrderVerificationPage.clickDownloadInvoiceAndGetUrl();

      let response = await page.request.get(pdfUrl, { timeout: 30_000 });
      if (!response.ok()) {
        await page.waitForTimeout(2_000);
        response = await page.request.get(pdfUrl, { timeout: 30_000 });
      }
      expect(response.ok()).toBeTruthy();

      const pdfBuffer = await response.body();

      // Read & normalize PDF text
      const rawPdfText = await pdfUtils.readPdfFromBuffer(pdfBuffer);
      const pdfText = pdfUtils.normalizePdfText(rawPdfText);

      // ---------------- Invoice header ----------------
      const invoiceNo = pdfUtils.extractInvoiceNumber(pdfText);
      const invoiceDate = pdfUtils.extractInvoiceDate(pdfText);

      expect(invoiceNo).toBeTruthy();
      expect(invoiceDate).toBeTruthy();

      console.log('Invoice No:', invoiceNo);
      console.log('Invoice Date:', invoiceDate);

      // ---------------- GST & CIN ----------------
      const gstin = pdfUtils.extractGstin(pdfText);
      const cin = pdfUtils.extractCin(pdfText);

      expect(gstin).toBeTruthy();
      expect(cin).toBeTruthy();

      console.log('GSTIN:', gstin);
      console.log('CIN:', cin);

      // ---------------- Gold validation ----------------
      const pdfGrams = pdfUtils.extractGoldGrams(pdfText);
      const pdfRate = pdfUtils.extractGoldRate(pdfText);
      const invoiceAmount = pdfUtils.extractGoldAmount(pdfText);
      const netPayable = pdfUtils.extractNetPayableAmount(pdfText);
      const totalGst = pdfUtils.extractTotalGstAmount(pdfText);

      // ✅ GOLD GRAMS (round down to 4 decimals)
     // expect(pdfUtils.roundDown4(pdfGrams)).toBe(pdfUtils.roundDown4(uiQuantity));
     logValidation('Invoice grams', pdfGrams, uiQuantity);
     expect(pdfGrams).toBeCloseTo(uiQuantity, 3);

      // ✅ RATE
      logValidation('Invoice rate', pdfRate, buyingRate);
      expect(pdfRate).toBe(buyingRate);

      // ✅ TAXABLE AMOUNT
      logValidation('Invoice taxable amount', invoiceAmount, amount);
      expect(Math.abs(invoiceAmount - amount)).toBeLessThanOrEqual(1);

      // ✅ NET PAYABLE
      const expectedNetPayable = paidAmount || payable;
      logValidation('Invoice net payable', netPayable, expectedNetPayable);
      expect(Math.abs(netPayable - expectedNetPayable)).toBeLessThanOrEqual(1);

      // ✅ GST (allow rounding safety)
      const invoiceGst = Number(totalGst.toFixed(2));
      const expectedGst = Number(tax.toFixed(2));
      logValidation('Invoice total GST', invoiceGst, expectedGst);
      expect(Math.abs(invoiceGst - expectedGst)).toBeLessThanOrEqual(1);

      console.log({
        pdfGrams,
        pdfRate,
        invoiceAmount,
        netPayable,
        totalGst
      });
    });

    await test.step('Validate total gold after purchase', async () => {
      await page.goto('/dashboard');
      console.log('Total Gold before Pur(g):', totalGoldBeforePurchase);

      let totalGoldAfterPurchase = await dashboardPage.getTotalGoldValue();
      const expectedGold = Number(
        (totalGoldBeforePurchase + (purchasedQuantity || uiQuantity)).toFixed(4)
      );

      for (let attempt = 0; attempt < 4; attempt += 1) {
        if (Math.abs(totalGoldAfterPurchase - expectedGold) <= 0.001) {
          break;
        }
        await page.waitForTimeout(5_000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        totalGoldAfterPurchase = await dashboardPage.getTotalGoldValue();
      }

      console.log('Total Gold after Pur(g):', totalGoldAfterPurchase);

      logValidation('Total gold after purchase', totalGoldAfterPurchase, expectedGold);
      expect(totalGoldAfterPurchase).toBeCloseTo(expectedGold, 3);

    });
  });

  test('TC_002-Buy Silver one-time using Card', async ({
    page,
    dashboardPage,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(180_000);
    let totalSilverBeforePurchase = 0;
    let uiQuantity = 0;

    await test.step('Get current Silver value', async () => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3_000);
      totalSilverBeforePurchase = await dashboardPage.getTotalSilverValue();
      console.log('Captured total silver before purchase (g):', totalSilverBeforePurchase);
      expect(totalSilverBeforePurchase).toBeGreaterThan(0);
    });

    await test.step('Get wallet balance from profile', async () => {
      await page.goto('/my-profile');
      await expect(page).toHaveURL(/my-profile/);
      const walletBalance = await dashboardPage.getWalletBalance();
      const expectedWalletBalance = 0;
      console.log(
        `Wallet balance validation | actual: ${walletBalance} | minimum expected: ${expectedWalletBalance}`,
      );
      expect(walletBalance).toBeGreaterThanOrEqual(expectedWalletBalance);
    });


    await test.step('Navigate to Buy Silver and place order', async () => {
      await page.goto('/digital-silver');
      await buyMetalPage.waitForBuyFormReady();
      await buyMetalPage.enterAmount(dataset.oneTimeSilverAmount);
      await buyMetalPage.clickOnOneTime();
      await page.waitForTimeout(10_000)
      await buyMetalPage.clickOnBuySilver();
    });

    await test.step('Verify summary and pay now', async () => {
      await buySummaryPage.waitForValidForText();
      expect(await buySummaryPage.isEditVisible()).toBe(true);
      uiQuantity = await buySummaryPage.getQuantity();
      const buyingRate = await buySummaryPage.getBuyingGoldRate();
      console.log('Buying silver rate:', buyingRate);
      const investingAmount = await buySummaryPage.getInvestingAmount();
      const amount = await buySummaryPage.getAmount();
      const tax = await buySummaryPage.getTax();
      const total = await buySummaryPage.getTotalAmount();
      const paid = await buySummaryPage.getPaidFromWallet();
      const payable = await buySummaryPage.getAmountPayable();
      const calculated = calculateAmounts(total, buyingRate, paid);
      logValidation('TC002 Summary quantity', uiQuantity, calculated.calcQuantity);
      logValidation('TC002 Summary amount', amount, calculated.amount);
      logValidation('TC002 Summary tax', tax, calculated.tax);
      logValidation('TC002 Summary payable', payable, calculated.payable);
      logValidation('TC002 Summary investing amount', investingAmount, Number(dataset.oneTimeSilverAmount));

      expect(investingAmount).toBe(Number(dataset.oneTimeSilverAmount));
      expect(uiQuantity).toBeCloseTo(calculated.calcQuantity, 3);
      expect(amount).toBeCloseTo(calculated.amount, 2);
      expect(tax).toBeCloseTo(calculated.tax, 2);
      expect(payable).toBeCloseTo(calculated.payable, 2);
      await buySummaryPage.clickPayNowButton();
    });

    await test.step('Complete card payment flow', async () => {
      const razorpayAmount = await paymentPage.getPriceSummaryAmountFromFrame();
      expect(razorpayAmount).toBe(Number(dataset.oneTimeSilverAmount));
      await paymentPage.fillContactNumber(dataset.contactNumber);
      await paymentPage.selectCards();
      await paymentPage.enterCardNumber(dataset.cardNumber);
      await paymentPage.enterCardExpiry(dataset.cardExpiry);
      await paymentPage.enterCardCVV(dataset.cardCvv);
      await paymentPage.enterCardHolderName(dataset.cardHolderName);
      await paymentPage.clickCardContinue();
      await paymentPage.clickOnMaybeLaterButton();
      try {
        await paymentPage.enterOtp(dataset.cardOtp);
        await paymentPage.clickOnOtpContinueButton();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isGatewayCardRejection = /international cards are not supported|invalid card/i.test(message);
        test.skip(
          isGatewayCardRejection,
          `Skipping card flow due to gateway card rejection in this environment: ${message}`,
        );
        throw error;
      }
    });

    await test.step('Validate order details silver', async () => {
      await page.goto('/my-orders');
      await expect(page).toHaveURL(/my-orders/);
      await myOrderVerificationPage.waitForOrderRowByText('Silver Bought');

// 1️⃣ Date
const date = await myOrderVerificationPage.getDate();
console.log('Date:', date);
const today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
const yyyy = today.getFullYear();
const currentDate = `${dd}/${mm}/${yyyy}`;
logValidation('Order date', date, currentDate);

expect(date).toBe(currentDate);

// 2️⃣ Transaction ID
const transactionId = await myOrderVerificationPage.getTransactionId();
console.log('Transaction ID:', transactionId);

// 3️⃣ Time of Purchase
const timeOfPurchase = await myOrderVerificationPage.getTimeOfPurchase();
console.log('Time of Purchase:', timeOfPurchase);

// 4️⃣ Narration
const narration = await myOrderVerificationPage.getNarration();
console.log('Narration:', narration);

const qty = await myOrderVerificationPage.getNarrationQuantity();
logValidation('Order quantity', qty, uiQuantity);
expect(qty).toBeCloseTo(uiQuantity, 3);

// 5️⃣ Amount
const amount = await myOrderVerificationPage.getAmount();
const expectedAmount = Number(dataset.oneTimeSilverAmount);
logValidation('Order amount', amount, expectedAmount);
expect(amount).toBeCloseTo(expectedAmount, 2);

  });
  await test.step('Validate total Silver after purchase', async () => {
    await page.goto('/dashboard');
    console.log('Total Silver before Pur(g):', totalSilverBeforePurchase);

    let totalSilverAfterPurchase = await dashboardPage.getTotalSilverValue();
    const expectedSilver = Number(
      (totalSilverBeforePurchase + uiQuantity).toFixed(4)
    );

    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (Math.abs(totalSilverAfterPurchase - expectedSilver) <= 0.001) {
        break;
      }
      await page.waitForTimeout(5_000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      totalSilverAfterPurchase = await dashboardPage.getTotalSilverValue();
    }

    console.log('Total Silver after Pur(g):', totalSilverAfterPurchase);

    logValidation('Total silver after purchase', totalSilverAfterPurchase, expectedSilver);
    expect(totalSilverAfterPurchase).toBeCloseTo(expectedSilver, 3);

  });

  });

  test.skip('TC_003-Buy Silver one-time fully Payment using wallet', async () => {});
  test.skip('TC_004-Buy Gold one-time partial Payment using wallet and Netbanking', async () => {});
});
