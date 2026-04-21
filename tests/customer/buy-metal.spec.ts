import { type Page } from '@playwright/test';
import { test, expect } from '../../fixtures/base.fixture';

const dataset = {
  profileName: 'Hi',
  oneTimeGoldAmount: '5000',
  oneTimeSilverAmount: '5000',
  contactNumber: '9561273901',
  cardHolderName: 'Test User',
  metalGold: 'Gold',
  metalSilver: 'Silver',
  cardNumber: '6521818104823671',
  cardExpiry: '12/26',
  cardCvv: '123',
  cardOtp: '123456',
};

function calculateAmounts(total: number, buyingRate: number, paidFromWallet: number) {
  const taxable = Number((total / 1.03).toFixed(2));
  const gst = Number((total - taxable).toFixed(2));
  const payable = Number((total - paidFromWallet).toFixed(2));
  const quantity = Number((taxable / buyingRate).toFixed(4));
  return { amount: taxable, tax: gst, total, payable, calcQuantity: quantity };
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

test.describe('customer buy metal flows', () => {
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
    let totalGoldBeforePurchase = 0;
    let uiQuantity = 0;
    let purchasedQuantity = 0;
    let buyingRate = 0;
    let tax = 0;
    let amount = 0;
    let payable = 0;

    await test.step('Get current gold value', async () => {
      await page.goto('/dashboard');
      totalGoldBeforePurchase = await dashboardPage.getTotalGoldValue();
      expect(totalGoldBeforePurchase).toBeGreaterThan(0);
    });

    await test.step('Get wallet balance from profile', async () => {
      await page.goto('/my-profile');
      await expect(page).toHaveURL(/my-profile/);
      const walletBalance = await dashboardPage.getWalletBalance();
      expect(walletBalance).toBeGreaterThanOrEqual(0);
    });

    await test.step('Navigate to Buy Gold and place order', async () => {
      await page.goto('/digital-gold');
      await buyMetalPage.enterAmount(dataset.oneTimeGoldAmount);
      await buyMetalPage.clickOnOneTime();
      await buyMetalPage.clickOnBuyGold();
    });

    await test.step('Verify summary values', async () => {
      await buySummaryPage.waitForValidForText();
      uiQuantity = await buySummaryPage.getQuantity();
      buyingRate = await buySummaryPage.getBuyingGoldRate();
      const investingAmount = await buySummaryPage.getInvestingAmount();
      expect(investingAmount).toBe(Number(dataset.oneTimeGoldAmount));
      expect(await buySummaryPage.isEditVisible()).toBe(true);

      amount = await buySummaryPage.getAmount();
      tax = await buySummaryPage.getTax();
      const total = await buySummaryPage.getTotalAmount();
      const paid = await buySummaryPage.getPaidFromWallet();
      payable = await buySummaryPage.getAmountPayable();
      const calculated = calculateAmounts(total, buyingRate, paid);
      expect(uiQuantity).toBeCloseTo(calculated.calcQuantity, 4);
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
      await buySummaryPage.waitForValidForText();
      await buySummaryPage.clickPayNowButton();
    });

    await test.step('Complete payment via netbanking', async () => {
      const razorpayAmount = await paymentPage.getPriceSummaryAmountFromFrame();
      expect(razorpayAmount).toBe(Number(dataset.oneTimeGoldAmount));
      await paymentPage.fillContactNumber(dataset.contactNumber);
      await paymentPage.selectNetbanking();
      await paymentPage.completeNetbankingPayment('HDFC Bank');
    });

    await test.step('Validate order details', async () => {
      await page.goto('/my-orders');
      await expect(page).toHaveURL(/my-orders/);

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const currentDate = `${dd}/${mm}/${yyyy}`;

      expect(await myOrderVerificationPage.getDate()).toBe(currentDate);
      expect(await myOrderVerificationPage.getTransactionId()).not.toBe('');
      expect(await myOrderVerificationPage.getTimeOfPurchase()).not.toBe('');

      const qty = await myOrderVerificationPage.getNarrationQuantity();
      purchasedQuantity = qty ?? 0;
      expect(purchasedQuantity).toBeCloseTo(uiQuantity, 3);
      const orderAmount = await myOrderVerificationPage.getAmount();
      expect(orderAmount).toBeCloseTo(Number(dataset.oneTimeGoldAmount), 2);
    });

    await test.step('Validate invoice download URL is reachable', async () => {
      await myOrderVerificationPage.waitForOrderRow();
      const pdfUrl = await myOrderVerificationPage.clickDownloadInvoiceAndGetUrl();
      expect(pdfUrl).toMatch(/\/public\/uploads\/invoice\/.+\.pdf/i);
      const response = await page.request.get(pdfUrl, {
        timeout: 15_000,
        failOnStatusCode: false,
      });
      expect(response.status(), `Invoice URL not reachable: ${pdfUrl}`).toBeLessThan(400);
    });

    await test.step('Validate total gold after purchase', async () => {
      await page.goto('/dashboard');
      const expectedGold = Number((totalGoldBeforePurchase + purchasedQuantity).toFixed(4));
      await expect.poll(async () => dashboardPage.getTotalGoldValue(), { timeout: 30_000 })
        .toBeCloseTo(expectedGold, 3);
    });
  });

  test('TC_002-Buy Silver one-time using Card', async ({
    page,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
  }) => {
    await test.step('Navigate to Buy Silver and place order', async () => {
      await page.goto('/digital-silver');
      const postRetryUrl = await waitAndRetryIfKycRedirect(page, '/digital-silver');
      test.skip(
        /\/kyc(?:\/|$|\?)/i.test(postRetryUrl),
        `Skipping card buy flow because user is redirected to KYC in this environment: ${postRetryUrl}`,
      );

      await buyMetalPage.waitForBuyFormReady();
      await buyMetalPage.enterAmount(dataset.oneTimeSilverAmount);
      await buyMetalPage.clickOnOneTime();
      await buyMetalPage.clickOnBuySilver();
    });

    await test.step('Verify summary and pay now', async () => {
      try {
        await buySummaryPage.waitForValidForText();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const redirectedToKyc = /redirected to KYC page/i.test(message) || /\/kyc(?:\/|$|\?)/i.test(page.url());
        test.skip(
          redirectedToKyc,
          `Skipping card buy flow because user is redirected to KYC in this environment: ${page.url()}`,
        );
        throw error;
      }
      expect(await buySummaryPage.isEditVisible()).toBe(true);
      const investingAmount = await buySummaryPage.getInvestingAmount();
      expect(investingAmount).toBe(Number(dataset.oneTimeSilverAmount));
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
  });

  test.skip('TC_003-Buy Silver one-time fully Payment using wallet', async () => {});
  test.skip('TC_004-Buy Gold one-time partial Payment using wallet and Netbanking', async () => {});
});
