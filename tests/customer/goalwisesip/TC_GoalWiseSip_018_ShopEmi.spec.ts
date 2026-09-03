import { test, expect } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { ShopEmiPage } from '../../../pages/customer/shop-emi.page';
import { REGISTRATION_OTP } from '../test-data/registration-data';
import { getShopDataset } from '../../../utils/data/customer-excel-data';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Shop EMI';
const DESCRIPTION = 'Users who have purchased shop / jewellery products on EMI.';

// New address fields for this brand-new customer — same "Add New Address" form structure
// confirmed live for TC_GoalWiseSip_012/015.
const ADDRESS_LINE_1 = '123 Test Street';
const ADDRESS_LINE_2 = 'Near Test Landmark';
const STATE = 'Maharashtra';
const CITY = 'Mumbai';
const PINCODE = '400001';

// Shop EMI: Users who have purchased shop / jewellery products on EMI.
test.describe('TC_GoalWiseSip_018 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({
    page,
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    shopEmiPage,
    paymentPage,
  }) => {
    test.setTimeout(180_000);

    const { productName } = getShopDataset();

    let mobile = '';
    let emiInitialPayment = 0;

    await test.step('TC_GoalWiseSip_018_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_GoalWiseSip_018_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'goalwisesip018');
    });

    await test.step('TC_GoalWiseSip_018_3 | Buy a shop product on EMI', async () => {
      // Same product + EMI-plan pattern as TC_Shop_EMI_002 ("Gold coin shop flow ... EMI 9
      // Months"), using the 3-month plan and the default product (already proven for
      // TC_GoalWiseSip_012's shop purchase).
      await shopPage.prepareFilteredListing(shopCartPage);
      await shopPage.verifyProductInCatalog(productName);
      await shopPage.selectProductAndCaptureDetails(productName);
      await shopPage.clickBuyWithEmi();
      const emiResult = await shopEmiPage.addProductViaEmiPlan(ShopEmiPage.planTenures.THREE_MONTHS);
      emiInitialPayment = emiResult.emiInitialPayment;
      await shopCartPage.validateEmiCart(productName, emiResult.emiLinePrice, emiResult.emiInitialPayment);
      await shopCartPage.clickProceedToPay();
    });

    await test.step('TC_GoalWiseSip_018_4 | Add a new billing address', async () => {
      // This account has zero saved addresses — click through to the "Add New Address" form
      // rather than editing an existing card (same as TC_GoalWiseSip_012/015).
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

      const chooseBillingHeading = page.getByRole('heading', { name: 'Choose Billing Address', level: 2 });
      await chooseBillingHeading.waitFor({ state: 'visible', timeout: 15_000 });
      await page.waitForTimeout(1_500);
    });

    await test.step('TC_GoalWiseSip_018_5 | Select delivery address same as billing address', async () => {
      const chooseBillingHeading = page.getByRole('heading', { name: 'Choose Billing Address', level: 2 });
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
    });

    await test.step('TC_GoalWiseSip_018_6 | Verify OTP and pay the EMI initial payment via netbanking', async () => {
      await shopCheckoutPage.validateCheckoutOtp(mobile, REGISTRATION_OTP);
      await shopCheckoutPage.placeOrderViaNetbanking();
      await paymentPage.completeShopNetbankingPayment({ expectedAmount: emiInitialPayment });
    });

    await test.step('TC_GoalWiseSip_018_7 | Confirm order placed and print the segment mobile number', async () => {
      const placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
      logSegment('TC_GoalWiseSip_018', USER_TYPE, DESCRIPTION, mobile, `placed shop EMI order ${placedOrderId} (3-month plan, initial payment ${emiInitialPayment})`);
    });
  });
});
