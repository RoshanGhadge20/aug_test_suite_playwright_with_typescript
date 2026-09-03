import type { Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { ShopCheckoutPage } from '../../../pages/customer/shop-checkout.page';
import { ShopEmiPage } from '../../../pages/customer/shop-emi.page';
import { REGISTRATION_OTP } from '../test-data/registration-data';
import { getShopDataset } from '../../../utils/data/customer-excel-data';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Shop Spot + EMI';
const DESCRIPTION = 'Users who have both spot and EMI shop purchases.';

// New address fields for this brand-new customer — same "Add New Address" form structure
// confirmed live for TC_GoalWiseSip_012/015/018/019.
const ADDRESS_LINE_1 = '123 Test Street';
const ADDRESS_LINE_2 = 'Near Test Landmark';
const STATE = 'Maharashtra';
const CITY = 'Mumbai';
const PINCODE = '400001';

/**
 * Fills a brand-new billing address only if no card exists yet, then always selects the first
 * card and confirms billing + delivery. Shared between TC20_1 and TC20_2 below — the first
 * purchase creates the address, the second reuses the card it saved rather than filling the
 * "Add New Address" form again.
 */
async function ensureBillingAddressAndConfirmDelivery(
  page: Page,
  shopCheckoutPage: ShopCheckoutPage,
): Promise<void> {
  const chooseBillingHeading = page.getByRole('heading', { name: 'Choose Billing Address', level: 2 });
  await chooseBillingHeading.waitFor({ state: 'visible', timeout: 15_000 });

  const existingCard = chooseBillingHeading
    .locator('xpath=following-sibling::*[1]/*')
    .filter({ has: page.getByRole('button', { name: 'Edit' }) })
    .first();
  const hasExistingCard = await existingCard.isVisible({ timeout: 3_000 }).catch(() => false);

  if (!hasExistingCard) {
    await page.getByText(/^Add New Address$/i).first().click();

    const typeIntoField = async (placeholder: string, value: string): Promise<void> => {
      const field = page.getByPlaceholder(placeholder);
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await field.click();
        await field.press('Control+A');
        await field.press('Backspace');
        await field.pressSequentially(value, { delay: 30 });
        const actual = await field.inputValue().catch(() => '');
        if (actual === value) return;
      }
      throw new Error(`Failed to type "${value}" into the "${placeholder}" field after 3 attempts.`);
    };

    await typeIntoField('Enter Address Line 1', ADDRESS_LINE_1);
    await typeIntoField('Enter Address Line 2', ADDRESS_LINE_2);
    await typeIntoField('Enter Pincode', PINCODE);

    const selectDropdownOption = async (comboboxName: string, optionName: string): Promise<void> => {
      const combobox = page.getByRole('combobox', { name: comboboxName });
      const listbox = page.getByRole('listbox', { name: 'Option List' });

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await combobox.click();
        await listbox.waitFor({ state: 'visible', timeout: 10_000 });
        const option = listbox.getByRole('option', { name: optionName, exact: true }).first();
        await option.waitFor({ state: 'visible', timeout: 5_000 });
        await option.scrollIntoViewIfNeeded();
        await option.click({ force: true });
        await page.waitForTimeout(500);
        const stillOpen = await listbox.isVisible().catch(() => false);
        if (!stillOpen) return;
      }
      throw new Error(`Failed to select "${optionName}" from the ${comboboxName} dropdown after 3 attempts.`);
    };

    await selectDropdownOption('Enter State', STATE);
    await selectDropdownOption('Enter City/District', CITY);

    const saveAndProceed = page.getByRole('button', { name: /^Save\s*&\s*Proceed$/i });
    await expect(saveAndProceed).toBeEnabled({ timeout: 10_000 });
    await saveAndProceed.click();

    await chooseBillingHeading.waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(1_500);
  }

  // The card's selection indicator is a PrimeIcons `<i class="pi pi-circle">` icon, not a real
  // `<input type="radio">` — confirmed live for TC_GoalWiseSip_012.
  const addressCard = chooseBillingHeading
    .locator('xpath=following-sibling::*[1]/*')
    .filter({ has: page.getByRole('button', { name: 'Edit' }) })
    .first();
  const selectionIcon = addressCard.locator('i.pi-circle, i[class*="pi-circle"]').first();
  if (await selectionIcon.isVisible().catch(() => false)) {
    await selectionIcon.click();
  } else {
    await addressCard.click();
  }

  await shopCheckoutPage.confirmBillingAndDelivery();
}

// Shop Spot + EMI: Users who have both spot and EMI shop purchases.
test.describe('TC_GoalWiseSip_020 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({
    page,
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    shopEmiPage,
    paymentPage,
  }) => {
    test.setTimeout(240_000);

    const { productName } = getShopDataset();

    let mobile = '';
    let spotOrderId = '';
    let emiOrderId = '';
    let emiInitialPayment = 0;

    await test.step('TC_GoalWiseSip_020_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_GoalWiseSip_020_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'goalwisesip020');
    });

    await test.step('TC_GoalWiseSip_020_3 | TC20_1 — Buy Now a shop product outright (spot)', async () => {
      // Same proven flow as TC_Shop_DeliveryAddress_001 / TC20_2 below — the plain (unfiltered)
      // listing doesn't surface this product (confirmed live: it shows 10Gm coins, not the
      // 0.1Gm variant); prepareGoldCoinListing's price filters are what actually surface it.
      await shopPage.prepareGoldCoinListing(shopCartPage);
      await shopPage.verifyProductInCatalog(productName);
      await shopPage.selectProduct(productName);
      await shopPage.clickBuyNowFromPdp();
      // Buy Now lands on the Cart step (confirmed live) — same as TC_Shop_DeliveryAddress_001,
      // Proceed to Pay is what actually advances to the Address step.
      await shopCartPage.clickProceedToPay();

      await ensureBillingAddressAndConfirmDelivery(page, shopCheckoutPage);

      await shopCheckoutPage.validateCheckoutOtp(mobile, REGISTRATION_OTP);
      await shopCheckoutPage.placeOrderViaNetbanking();
      const priceDetails = await shopCheckoutPage.getPriceDetails();
      await paymentPage.completeShopNetbankingPayment({ expectedAmount: priceDetails.grandTotal });
      spotOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
    });

    await test.step('TC_GoalWiseSip_020_4 | TC20_2 — Buy a shop product on EMI', async () => {
      await shopPage.prepareFilteredListing(shopCartPage);
      await shopPage.verifyProductInCatalog(productName);
      await shopPage.selectProductAndCaptureDetails(productName);
      await shopPage.clickBuyWithEmi();
      const emiResult = await shopEmiPage.addProductViaEmiPlan(ShopEmiPage.planTenures.THREE_MONTHS);
      emiInitialPayment = emiResult.emiInitialPayment;
      await shopCartPage.validateEmiCart(productName, emiResult.emiLinePrice, emiResult.emiInitialPayment);
      await shopCartPage.clickProceedToPay();

      await ensureBillingAddressAndConfirmDelivery(page, shopCheckoutPage);

      await shopCheckoutPage.validateCheckoutOtp(mobile, REGISTRATION_OTP);
      await shopCheckoutPage.placeOrderViaNetbanking();
      await paymentPage.completeShopNetbankingPayment({ expectedAmount: emiInitialPayment });
      emiOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
    });

    await test.step('TC_GoalWiseSip_020_5 | Print the segment mobile number', async () => {
      logSegment(
        'TC_GoalWiseSip_020',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `placed shop spot order ${spotOrderId} and shop EMI order ${emiOrderId} (3-month plan, initial payment ${emiInitialPayment})`,
      );
    });
  });
});
