import { test } from '../../../fixtures/base.fixture';
import { existingKycVerifiedCustomerCreds } from '../test-data/registration-data';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'All Users';
const DESCRIPTION = 'Every registered user on the platform, regardless of activity or investment status.';

// All Users: Every registered user on the platform, regardless of activity or investment status.
test.describe('TC_UserWiseSip_001 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async () => {
    const { mobile } = existingKycVerifiedCustomerCreds();
    logSegment('TC_UserWiseSip_001', USER_TYPE, DESCRIPTION, mobile);
  });
});
