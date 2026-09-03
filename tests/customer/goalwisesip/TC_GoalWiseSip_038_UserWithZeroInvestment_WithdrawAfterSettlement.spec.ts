import * as fs from 'fs';
import { test, expect } from '../../../fixtures/base.fixture';
import { CustomerLoginPage } from '../../../pages/customer/login.page';
import { logSegment } from './goalwisesip.helpers';
import {
  PENDING_WITHDRAWAL_STATE_PATH,
  SETTLEMENT_WAIT_MS,
  TEST_PIN,
  type PendingWithdrawalState,
} from './tc010-pending-withdrawal';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'User with Zero Investment';
const DESCRIPTION =
  'Users whose current balance is zero — invested earlier but fully sold / withdrawn.';

// Real, verified ICICI account used as a fallback bank when this brand-new customer has none linked
// yet (same fallback account used by TC_Withdrawal_GetCash_014).
const BANK_NAME = 'ICICI BANK LIMITED';
const ICICI_ACCOUNT_NUMBER = '624401537051';
const ICICI_IFSC_CODE = 'ICIC0006244';

// User with Zero Investment (Part B — withdraw): the second half of TC_GoalWiseSip_010's persona.
// Numbered 038 (one past the last real persona, 037) purely so it sorts and runs after every
// other goalwisesip TC — giving the ₹500 gold TC010 buys time to settle before this attempts to
// withdraw it (confirmed live: the Gold Vault can show 0g immediately after a purchase). Also
// waits out any remaining time itself, so this still works if run standalone soon after TC010.
test.describe('TC_GoalWiseSip_038 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION} (withdraw)`, async ({
    page,
    dashboardPage,
    withdrawalPage,
    withdrawDetailPage,
    withdrawAccountDetailPage,
    withdrawPamentPage,
    addNewBankWithdrawalPage,
  }) => {
    test.setTimeout(SETTLEMENT_WAIT_MS + 5 * 60_000);

    let mobile = '';
    let fullGoldQuantity = 0;
    let metalPrice = 0;

    await test.step('TC_GoalWiseSip_038_1 | Load the mobile number TC_GoalWiseSip_010 registered and bought gold for', async () => {
      if (!fs.existsSync(PENDING_WITHDRAWAL_STATE_PATH)) {
        throw new Error(
          `No pending withdrawal state at ${PENDING_WITHDRAWAL_STATE_PATH} — run TC_GoalWiseSip_010 first.`,
        );
      }
      const state = JSON.parse(fs.readFileSync(PENDING_WITHDRAWAL_STATE_PATH, 'utf-8')) as PendingWithdrawalState;
      mobile = state.mobile;

      const elapsedMs = Date.now() - state.purchasedAt;
      const remainingMs = SETTLEMENT_WAIT_MS - elapsedMs;
      console.log(
        `[TC_GoalWiseSip_038] mobile=${mobile}, elapsed since purchase=${Math.round(elapsedMs / 1000)}s`,
      );
      if (remainingMs > 0) {
        console.log(`[TC_GoalWiseSip_038] Waiting ${Math.round(remainingMs / 1000)}s more for settlement.`);
        await page.waitForTimeout(remainingMs);
      }
    });

    await test.step('TC_GoalWiseSip_038_2 | Log in with the existing PIN', async () => {
      // TC010 already set a PIN during registration, so a returning login shows the inline
      // "Enter 6 digit security pin" field directly on /login (confirmed live), not the OTP screen.
      const customerLogin = new CustomerLoginPage(page);
      await customerLogin.open();
      await customerLogin.loginWithExistingPin(mobile, TEST_PIN);
    });

    await test.step('TC_GoalWiseSip_038_3 | Withdraw the full Gold Vault balance (same pattern as TC_Withdrawal_GetCash_014)', async () => {
      const customerLogin = new CustomerLoginPage(page);

      // Confirmed live: saving a new bank mid-withdrawal can bounce the session back to
      // /login?redirectTo=%2Fdashboard instead of a stable /dashboard. Re-login whenever this happens.
      const ensureLoggedIn = async (): Promise<void> => {
        await page.waitForTimeout(2_000);
        if (/\/login(?:\/|$|\?)/i.test(page.url())) {
          await page.goto('/login');
          await customerLogin.loginWithExistingPin(mobile, TEST_PIN);
        }
      };

      // Reused twice: once to reach the account-details page, and again after linking a new
      // bank (confirmed live: saving a new bank mid-withdrawal re-prompts for the login PIN and
      // redirects straight to /dashboard, losing the withdrawal session — see below).
      const navigateToAccountDetails = async (): Promise<number> => {
        await ensureLoggedIn();
        await dashboardPage.clickWithdrawInvestment();
        await withdrawalPage.clickGetCashOption();
        await withdrawDetailPage.clickGoldTab();

        const goldVault = await withdrawalPage.getVaultDetailsAndClick('Gold');
        expect(
          goldVault.withdrawalMetal,
          `No Gold quantity available for withdrawal: ${goldVault.withdrawalMetal}`,
        ).toBeGreaterThan(0);

        await withdrawalPage.clickProceed();

        const withdrawalSummary = await withdrawDetailPage.getWithdrawalSummary('Gold');
        const quantity = withdrawalSummary.totalMetal;
        expect(quantity, 'No Gold quantity available for withdrawal.').toBeGreaterThan(0);

        await withdrawDetailPage.tickWithdrawFullBalanceCheckbox();
        await withdrawDetailPage.clickWithdraw();

        await expect(page).toHaveURL(/\/withdraw\/account-details$/);

        const accountDetails = await withdrawAccountDetailPage.getAccountDetails();
        expect(accountDetails.withdrawalFrom).toContain('Gold Vault');
        expect(accountDetails.quantity).toBe(quantity);

        return quantity;
      };

      fullGoldQuantity = await navigateToAccountDetails();

      await withdrawAccountDetailPage.validateTransferOptions();
      await withdrawAccountDetailPage.clickBankAccount();

      const bankAvailable = await withdrawAccountDetailPage.isBankAvailable(BANK_NAME);
      if (!bankAvailable) {
        await addNewBankWithdrawalPage.addBankDetails(ICICI_ACCOUNT_NUMBER, ICICI_IFSC_CODE);
        await addNewBankWithdrawalPage.clickSaveBank();

        // Confirmed live: saving asks to re-enter the login PIN, then redirects to /dashboard
        // rather than returning to the withdrawal flow with a "bank added" toast.
        const pinInputs = page.locator('#pin input');
        const pinPromptShown = await pinInputs.first().isVisible({ timeout: 8_000 }).catch(() => false);
        if (pinPromptShown) {
          await pinInputs.first().pressSequentially(TEST_PIN);
          await page.getByRole('button', { name: /^continue$/i }).click();
        }
        await page.waitForURL(
          (url) => /\/dashboard(?:\/|$|\?)/i.test(url.pathname) || /\/login(?:\/|$|\?)/i.test(url.pathname),
          { timeout: 30_000 },
        );
        await ensureLoggedIn();

        // Bank is now linked — re-enter the withdrawal flow from Get Cash.
        fullGoldQuantity = await navigateToAccountDetails();
        await withdrawAccountDetailPage.validateTransferOptions();
        await withdrawAccountDetailPage.clickBankAccount();
      }

      await withdrawAccountDetailPage.selectBank(BANK_NAME);
      await withdrawAccountDetailPage.getBankDetails(BANK_NAME);
      await withdrawAccountDetailPage.validateCounter();
      metalPrice = await withdrawAccountDetailPage.getLivePriceValue('Gold');

      await withdrawDetailPage.clickWithdraw();
      await withdrawAccountDetailPage.withdrawButtonClick();

      await withdrawPamentPage.validateSuccessPopup();
      await withdrawPamentPage.validateSuccessPopupDetails(fullGoldQuantity, metalPrice, 'Gold');
      await withdrawPamentPage.clickContinue();
    });

    await test.step('TC_GoalWiseSip_038_4 | Print the segment mobile number', async () => {
      logSegment(
        'TC_GoalWiseSip_010/038',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `bought and then fully withdrew ${fullGoldQuantity}g gold, balance now zero`,
      );
      // Clear the handoff file so a later standalone re-run of this spec doesn't reuse a mobile
      // that's already been withdrawn.
      fs.rmSync(PENDING_WITHDRAWAL_STATE_PATH, { force: true });
    });
  });
});
