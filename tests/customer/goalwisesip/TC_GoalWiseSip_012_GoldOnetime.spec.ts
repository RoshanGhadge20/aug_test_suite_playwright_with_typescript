import { test, expect } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { REGISTRATION_OTP } from '../test-data/registration-data';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Gold - Onetime';
const DESCRIPTION = 'Users who have made one-time (spot) gold purchases only.';

// New address fields for this brand-new customer (confirmed live: the "Add New Address" form has
// no saved cards yet, so it needs Address Line 1/2, State, City/District and Pincode — none of
// which exist on the shared ShopCheckoutPage's updateCustomerDetails(), which only edits an
// existing card's name/mobile/address-line — so they're filled directly here rather than guessed
// into the shared page object).
const ADDRESS_LINE_1 = '123 Test Street';
const ADDRESS_LINE_2 = 'Near Test Landmark';
const STATE = 'Maharashtra';
const CITY = 'Mumbai';
const PINCODE = '400001';

// Gold - Onetime: Users who have made one-time (spot) gold purchases only.
test.describe('TC_GoalWiseSip_012 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({
    page,
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    paymentPage,
  }) => {
    test.setTimeout(180_000);

    let mobile = '';

    await test.step('TC_GoalWiseSip_012_1 | Register with a unique, unregistered mobile number (no KYC — shop purchase works as a guest)', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_GoalWiseSip_012_2 | Buy a gold coin one-time from the shop', async () => {
      await shopPage.prepareGoldCoinListing(shopCartPage);
      await shopPage.verifyProductInCatalog();
      await shopPage.selectProductAndCaptureDetails();
      await shopPage.clickBuyNowFromPdp();
      await shopCartPage.clickProceedToPay();
    });

    await test.step('TC_GoalWiseSip_012_3 | Add a new billing address', async () => {
      // This account has zero saved addresses (confirmed live) — click through to the "Add New
      // Address" form rather than editing an existing card.
      await page.getByText(/^Add New Address$/i).first().click();

      // .fill() sets the DOM value but doesn't register with this app's Angular form validation
      // (same class of bug as the KYC date-of-birth input, see utils/calendar-helper.ts) — type
      // character-by-character instead so "required" errors actually clear. Confirmed live: the
      // first few keystrokes can still get dropped (e.g. "123 Test Street" landing as "st
      // Street") — verify the result and retry rather than trusting a single pass.
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

      // PrimeNG dropdown ("Option List" listbox) — State first, City/District is dependent on it.
      const selectDropdownOption = async (comboboxName: string, optionName: string): Promise<void> => {
        const combobox = page.getByRole('combobox', { name: comboboxName });
        const listbox = page.getByRole('listbox', { name: 'Option List' });

        for (let attempt = 1; attempt <= 3; attempt += 1) {
          await combobox.click();
          await listbox.waitFor({ state: 'visible', timeout: 10_000 });
          const option = listbox.getByRole('option', { name: optionName, exact: true }).first();
          await option.waitFor({ state: 'visible', timeout: 5_000 });
          await option.scrollIntoViewIfNeeded();
          // The listbox virtualizes/re-renders its rows (same class of issue as the KYC calendar
          // picker, see utils/calendar-helper.ts) — a plain click can land as the row gets
          // detached and re-rendered mid-click. force: true skips the actionability wait that
          // trips over this.
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

      // Let the "Choose Billing Address" list re-render with the newly created card before
      // interacting with it — confirmed live, clicking too soon after Save & Proceed left
      // "Billing to this Address" stuck in a pressed state with no visible error.
      const chooseBillingHeading = page.getByRole('heading', { name: 'Choose Billing Address', level: 2 });
      await chooseBillingHeading.waitFor({ state: 'visible', timeout: 15_000 });
      await page.waitForTimeout(1_500);
    });

    await test.step('TC_GoalWiseSip_012_4 | Select delivery address same as billing address', async () => {
      // The card's selection indicator is a PrimeIcons `<i class="pi pi-circle">` icon, not a
      // real `<input type="radio">` — confirmed live via the actual card markup.
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

      // confirmBillingAndDelivery() is the exact sequence the two specs that complete a full real
      // purchase (e.g. TC_Shop_ShopCheckout_001) use — it's the same 3 actions as
      // clickBillingToThisAddress/selectSameAsBillingAddress/clickDeliverToThisAddress individually,
      // but also presses Home between the checkbox and the deliver click, which those individual
      // calls don't do.
      await shopCheckoutPage.confirmBillingAndDelivery();
    });

    await test.step('TC_GoalWiseSip_012_5 | Verify OTP and pay via netbanking', async () => {
      await shopCheckoutPage.validateCheckoutOtp(mobile, REGISTRATION_OTP);
      await shopCheckoutPage.placeOrderViaNetbanking();
      const priceDetails = await shopCheckoutPage.getPriceDetails();
      await paymentPage.completeShopNetbankingPayment({
        expectedAmount: priceDetails.grandTotal,
      });
    });

    await test.step('TC_GoalWiseSip_012_6 | Confirm order placed and print the segment mobile number', async () => {
      const placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
      logSegment('TC_GoalWiseSip_012', USER_TYPE, DESCRIPTION, mobile, `placed one-time shop gold order ${placedOrderId}`);
    });
  });
});
