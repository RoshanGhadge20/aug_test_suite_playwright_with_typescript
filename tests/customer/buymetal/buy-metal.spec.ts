import { test, expect } from '../../../fixtures/base.fixture';
import { getTargetEnv } from '../../../config/environments';
import {
  getBuyMetalDataset,
  type BuyMetalType,
} from '../../../utils/data/customer-excel-data';
import type { OneTimeSummaryResult } from '../../../pages/customer/buy-summary.page';
import {
  logValidation,
  persistCustomerStorageState,
  restoreDefaultCustomerSession,
  resolveAltCustomerMobile,
  resolveAltCustomerOtp,
} from '../helpers/customer-alt-user.helpers';

const dataset = getBuyMetalDataset();

const paymentConfig = {
  contactNumber: dataset.contactNumber,
  netbankingBankName: dataset.netbankingBankName,
  cardNumber: dataset.cardNumber,
  cardExpiry: dataset.cardExpiry,
  cardCvv: dataset.cardCvv,
  cardHolderName: dataset.cardHolderName,
  cardOtp: dataset.cardOtp,
};

function buyOrderRowText(metalName: string): string {
  const label = metalName.charAt(0).toUpperCase() + metalName.slice(1).toLowerCase();
  return `${label} Bought`;
}

function metalAmount(metal: BuyMetalType): string {
  return metal === 'gold' ? dataset.oneTimeGoldAmount : dataset.oneTimeSilverAmount;
}

function metalName(metal: BuyMetalType): string {
  return metal === 'gold' ? dataset.metalGold : dataset.metalSilver;
}

test.describe('customer buy metal flows @customer-flows', () => {
  // TC_005 logs in with a different user — skip the default dashboard open.
  test.beforeEach(async ({ page }, testInfo) => {
    if (/TC_005/i.test(testInfo.title)) return;
    await page.goto('/dashboard');
  });

  test('TC_001-Buy Gold one-time using Netbanking + cancel + re-purchase flow', async ({
    dashboardPage,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(180_000);

    const tc001Data = {
      metal: 'gold' as const,
      amount: metalAmount('gold'),
      metalName: metalName('gold'),
      orderRowText: buyOrderRowText(dataset.metalGold),
    };

    let metalBeforeGrams = 0;
    let summary: OneTimeSummaryResult;
    let paidAmount = 0;
    let purchasedQuantity = 0;

    await test.step('captureBuyMetalGramsBeforePurchase', async () => {
      metalBeforeGrams = await dashboardPage.captureBuyMetalGramsBeforePurchase(tc001Data.metal);
    });

    await test.step('validateWalletBalanceOnProfile', async () => {
      await dashboardPage.validateWalletBalanceOnProfile(0);
    });

    await test.step('placeOneTimeOrder', async () => {
      await buyMetalPage.placeOneTimeOrder(tc001Data.metal, tc001Data.amount);
    });

    await test.step('validateOneTimeSummary', async () => {
      summary = await buySummaryPage.validateOneTimeSummary(tc001Data.amount);
    });

    await test.step('cancelBuyFlow', async () => {
      await buySummaryPage.cancelBuyFlow(tc001Data.metal);
    });

    await test.step('repurchaseOneTimeOrder', async () => {
      await buyMetalPage.repurchaseOneTimeOrder(tc001Data.metal, tc001Data.amount);
      await buySummaryPage.expectOnBuySummaryPage(tc001Data.metal);
    });

    await test.step('completeNetbankingBuyNowPayment', async () => {
      await buySummaryPage.clickPayNowButton();
      paidAmount = await paymentPage.completeNetbankingBuyNowPayment(
        paymentConfig.contactNumber,
        Number(tc001Data.amount),
        paymentConfig.netbankingBankName,
      );
    });

    await test.step('validateOneTimeBuyOrder', async () => {
      const order = await myOrderVerificationPage.validateOneTimeBuyOrder({
        orderRowText: tc001Data.orderRowText,
        narrationMatch: new RegExp(`${tc001Data.metalName} bought`, 'i'),
        expectedQuantity: summary!.quantity,
        expectedAmount: paidAmount || Number(tc001Data.amount),
      });
      purchasedQuantity = order.quantity;
    });

    await test.step('validateBuyMetalInvoice', async () => {
      await myOrderVerificationPage.validateBuyMetalInvoice({
        metal: tc001Data.metal,
        orderRowText: tc001Data.orderRowText,
        uiQuantity: summary!.quantity,
        buyingRate: summary!.buyingRate,
        taxableAmount: summary!.amount,
        tax: summary!.tax,
        payable: summary!.payable,
        paidAmount,
      });
    });

    await test.step('validateBuyMetalGramsAfterPurchase', async () => {
      await dashboardPage.validateBuyMetalGramsAfterPurchase(
        tc001Data.metal,
        metalBeforeGrams,
        purchasedQuantity || summary!.quantity,
      );
    });
  });

  test('TC_002-Buy Silver one-time using Card', async ({
    dashboardPage,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(180_000);

    const tc002Data = {
      metal: 'silver' as const,
      amount: metalAmount('silver'),
      metalName: metalName('silver'),
      orderRowText: buyOrderRowText(dataset.metalSilver),
    };

    let metalBeforeGrams = 0;
    let summary: OneTimeSummaryResult;
    let purchasedQuantity = 0;

    await test.step('captureBuyMetalGramsBeforePurchase', async () => {
      metalBeforeGrams = await dashboardPage.captureBuyMetalGramsBeforePurchase(tc002Data.metal);
    });

    await test.step('validateWalletBalanceOnProfile', async () => {
      await dashboardPage.validateWalletBalanceOnProfile(0);
    });

    await test.step('placeOneTimeOrder', async () => {
      await buyMetalPage.placeOneTimeOrder(tc002Data.metal, tc002Data.amount);
    });

    await test.step('validateOneTimeSummaryAndPayNow', async () => {
      summary = await buySummaryPage.validateOneTimeSummaryAndPayNow(tc002Data.amount);
    });

    await test.step('completeCardBuyNowPayment', async () => {
      try {
        await paymentPage.completeCardBuyNowPayment({
          contactNumber: paymentConfig.contactNumber,
          expectedAmount: Number(tc002Data.amount),
          cardNumber: paymentConfig.cardNumber,
          cardExpiry: paymentConfig.cardExpiry,
          cardCvv: paymentConfig.cardCvv,
          cardHolderName: paymentConfig.cardHolderName,
          cardOtp: paymentConfig.cardOtp,
        });
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

    await test.step('validateOneTimeBuyOrder', async () => {
      const order = await myOrderVerificationPage.validateOneTimeBuyOrder({
        orderRowText: tc002Data.orderRowText,
        narrationMatch: new RegExp(`${tc002Data.metalName} bought`, 'i'),
        expectedQuantity: summary!.quantity,
        expectedAmount: Number(tc002Data.amount),
        amountTolerance: 2,
        quantityPrecision: 2,
      });
      purchasedQuantity = order.quantity;
    });

    await test.step('validateBuyMetalGramsAfterPurchase', async () => {
      await dashboardPage.validateBuyMetalGramsAfterPurchase(
        tc002Data.metal,
        metalBeforeGrams,
        purchasedQuantity || summary!.quantity,
      );
    });
  });

  test.describe('TC_005 fresh session', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('TC_005-Buy Gold one-time — capture portfolio, purchase, validate portfolio', async ({
    page,
    customerLogin,
    dashboardPage,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(180_000);

    const tc005Data = {
      metal: 'gold' as const,
      amount: metalAmount('gold'),
      metalName: metalName('gold'),
      orderRowText: buyOrderRowText(dataset.metalGold),
    };

    let totalGoldBeforePurchase = 0;
    let summary: OneTimeSummaryResult;
    let purchasedQuantity = 0;
    let paidAmount = 0;
    let gBuyFromRatesApi = 0;

    const TC005 = (n: number): string => `TC005_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC005(n)}] ${title}`);
    };

    try {
    await test.step('clearStorageAndLogin', async () => {
      logSub(1, 'Fresh login (no preloaded storage state)');
      const mobile = resolveAltCustomerMobile();
      const otp = resolveAltCustomerOtp();
      console.log(
        `[${TC005(1)}] Logging in as ${mobile} using ${getTargetEnv().toUpperCase()} customer OTP.`,
      );
      await customerLogin.login(mobile, otp);
      await page.waitForLoadState('domcontentloaded');
      await persistCustomerStorageState(page);
    });

    await test.step('validateBuyMetalPortfolioBeforePurchase', async () => {
      logSub(2, 'Grams + digital-gold rates; UI vs calculated portfolio (before)');
      const snapshot = await dashboardPage.validateBuyMetalPortfolioBeforePurchase(TC005(2));
      totalGoldBeforePurchase = snapshot.totalGoldGrams;
    });

    await test.step('placeOneTimeOrder', async () => {
      logSub(3, 'Navigate to buy, rates API, open buy summary');
      await buyMetalPage.prepareOneTimeOrder(tc005Data.metal, tc005Data.amount);
      const spot = await dashboardPage.fetchDigitalMetalSpotRates();
      gBuyFromRatesApi = spot.gBuy;
      const outcome = await buyMetalPage.confirmOneTimeBuy(tc005Data.metal);
      if (outcome === 'kyc') {
        throw new Error(`[${TC005(3)}] Buy flow redirected to KYC: ${page.url()}`);
      }
      await buySummaryPage.waitForValidForText();
    });

    await test.step('validateOneTimeSummary', async () => {
      logSub(4, 'Verify summary lines, capture taxable amount');
      summary = await buySummaryPage.validateOneTimeSummary(tc005Data.amount);
      logValidation(`${TC005(4)} Summary API gBuy vs UI buying rate`, gBuyFromRatesApi, summary.buyingRate);
      expect(Math.abs(gBuyFromRatesApi - summary.buyingRate)).toBeLessThanOrEqual(3);
    });

    await test.step('completeNetbankingBuyNowPayment', async () => {
      logSub(5, 'Complete payment via netbanking');
      await buySummaryPage.clickPayNowButton();
      paidAmount = await paymentPage.completeNetbankingBuyNowPayment(
        paymentConfig.contactNumber,
        Number(tc005Data.amount),
        paymentConfig.netbankingBankName,
      );
    });

    await test.step('validateOneTimeBuyOrder', async () => {
      logSub(6, 'Read purchased quantity from My Orders');
      const order = await myOrderVerificationPage.validateOneTimeBuyOrder({
        orderRowText: tc005Data.orderRowText,
        narrationMatch: new RegExp(`${tc005Data.metalName} bought`, 'i'),
        expectedQuantity: summary!.quantity,
        expectedAmount: paidAmount || Number(tc005Data.amount),
      });
      purchasedQuantity = order.quantity;
    });

    await test.step('validateBuyMetalPortfolioAfterPurchase', async () => {
      logSub(7, 'Dashboard: UI portfolio vs formula (after) + total gold grams');
      const goldQty = purchasedQuantity || summary!.quantity;
      const expectedGold = Number((totalGoldBeforePurchase + goldQty).toFixed(4));
      await dashboardPage.validateBuyMetalPortfolioAfterPurchase(TC005(7), expectedGold, {
        minimumGoldGrams: totalGoldBeforePurchase === 0 ? goldQty : undefined,
      });
    });
    } finally {
      await test.step('restoreDefaultCustomerSession', async () => {
        logSub(8, 'Persist customer storage state for following tests');
        await restoreDefaultCustomerSession(page, customerLogin, TC005(8));
      });
    }
  });
  });

  test.skip('TC_003-Buy Silver one-time fully Payment using wallet', async () => {});
  test.skip('TC_004-Buy Gold one-time partial Payment using wallet and Netbanking', async () => {});
});
