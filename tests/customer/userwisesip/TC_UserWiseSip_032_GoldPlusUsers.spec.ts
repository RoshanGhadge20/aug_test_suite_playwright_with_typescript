import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { subscribeToGoldPlusWithEmi } from '../../../flows/customer/gold-plus.flow';
import { getBuyMetalDataset } from '../../../utils/data/customer-excel-data';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Gold Plus Users';
const DESCRIPTION = 'Users enrolled in the Gold Plus program / product.';

// Gold Plus Users: Users enrolled in the Gold Plus program / product.
test.describe('TC_UserWiseSip_032 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.setTimeout(180_000);

    const dataset = getBuyMetalDataset();

    let mobile = '';

    await test.step('TC_UserWiseSip_032_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_UserWiseSip_032_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'userwisesip032');
    });

    await test.step('TC_UserWiseSip_032_3 | Subscribe to Gold Plus (10gm, 3-month EMI, netbanking)', async () => {
      // No page object exists for Gold Plus yet — driven directly per the exact live steps
      // (see flows/customer/gold-plus.flow.ts). A settle wait right after KYC — confirmed live,
      // proceeding immediately bounced mid-flow to /kyc/digi-kyc even though KYC had just
      // completed, the same class of transient redirect BuyMetalPage already retries around.
      await page.waitForTimeout(3_000);
      await subscribeToGoldPlusWithEmi(page, {
        weightTab: '10 g',
        emiTenure: '3 months',
        contactNumber: dataset.contactNumber,
        bankName: dataset.netbankingBankName,
      });
    });

    await test.step('TC_UserWiseSip_032_4 | Validate the Gold Plus order in My Orders — Shop tab', async () => {
      // My Orders defaults to the BUY tab (confirmed live: showed "No Record Found" there) — the
      // Gold Plus order shows under the SHOP tab per the original steps.
      await page.goto('/my-orders');
      await page.waitForLoadState('domcontentloaded');
      await page.getByText('SHOP', { exact: true }).click();
      await page.getByText(/Gold Plus/i).first().waitFor({ state: 'visible', timeout: 20_000 });
    });

    await test.step('TC_UserWiseSip_032_5 | Print the segment mobile number', async () => {
      logSegment('TC_UserWiseSip_032', USER_TYPE, DESCRIPTION, mobile, 'subscribed to Gold Plus (10gm, 3-month EMI)');
    });
  });
});
