import { WithdrawalPage } from '@pages/customer/withdrawal.page';
import { test, expect } from '../../../../fixtures/base.fixture';

const withdrawalQuantityInput = 0.1;

test.describe('TC_WITHDRAWAL_001 @customer-flows', () => {
    test(
        'TC_001-withdrawal from gold vault and amount transfer to bank account',
        async ({
            page,
            dashboardPage,
            withdrawalPage,
            withdrawDetailPage,
            withdrawAccountDetailPage,
            withdrawPamentPage,
        }) => {
            const TC_001 = (n: number): string => `TC001_${n}`;

            const logSub = (n: number, title: string): void => {
                console.log(`\n[${TC_001(n)}] ${title}`);
            };

            let portfolioValue = 0;
            let totalGoldBefore = 0;
            let metalPrice: number;

            await test.step(
                'TC001_1 | Login & Dashboard — capture portfolio and total gold',
                async () => {
                    logSub(1, 'Login & Dashboard');

                    await page.goto('/dashboard');

                    ({ portfolioValue, totalGold: totalGoldBefore } =
                        await dashboardPage.captureWithdrawalDashboardSnapshot({
                            requireGoldFd: false,
                        }));

                    console.log(
                        `[${TC_001(1)}] Portfolio Value:`,
                        portfolioValue
                    );
                    console.log(
                        `[${TC_001(1)}] Total Gold:`,
                        totalGoldBefore
                    );
                }
            );

            await test.step(
                'TC001_2 | verify two options are visible get cash and get coins and bars',
                async () => {
                    logSub(
                        2,
                        'verify two options are visible get cash and get coins and bars'
                    );

                    await dashboardPage.clickWithdrawInvestment();
                    await withdrawalPage.verifyGetCoinAndCashOptionVisible();
                    await withdrawalPage.clickGetCashOption();
                    await withdrawalPage.verifyGetCashNavigatesToInvestmentList();
                }
            );

            await test.step(
                'TC001_3 | Get Gold Summary from Investment List and validate Gold Value',
                async () => {
                    logSub(
                        3,
                        'Get Gold Summary from Investment List and validate Gold Value'
                    );

                    await withdrawDetailPage.clickGoldTab();

                    const goldSummary =
                        await withdrawalPage.getMetalSummary('Gold');

                    console.log('Gold Summary:', goldSummary);

                    expect(goldSummary.value).toBeCloseTo(
                        goldSummary.total * goldSummary.livePrice,
                        1
                    );
                }
            );

            await test.step(
                'TC001_4 | select Gold Vault for withdrawal and get vault detail',
                async () => {
                    logSub(
                        4,
                        'select Gold Vault for withdrawal and get vault detail'
                    );

                    const goldVault =
                        await withdrawalPage.getVaultDetailsAndClick('Gold');


                    console.log(
                        'Withdrawal Gold:',
                        goldVault.withdrawalMetal
                    );
                    console.log(
                        'Gold Vault Value:',
                        goldVault.vaultValue
                    );

                    expect(
                        goldVault.withdrawalMetal,
                        `Not enough quantity available for withdrawal. Available Gold: ${goldVault.withdrawalMetal} gm`
                      ).toBeGreaterThan(0);
                }
            );

            await test.step(
                'TC001_5 | proceed for withdrawal and get withdrawal detail',
                async () => {
                    logSub(
                        5,
                        'proceed for withdrawal and get withdrawal detail'
                    );

                    await withdrawalPage.clickProceed();

                    const withdrawalSummary =
                        await withdrawDetailPage.getWithdrawalSummary('Gold');

                    console.log(
                        'Total Value:',
                        withdrawalSummary.totalValue
                    );
                    console.log(
                        'Total Gold:',
                        withdrawalSummary.totalMetal
                    );

                    if (
                        withdrawalQuantityInput >
                        withdrawalSummary.totalMetal
                    ) {
                        throw new Error(
                            `Quantity is not enough for withdrawal. Available: ${withdrawalSummary.totalMetal} gm, Requested: ${withdrawalQuantityInput} gm`
                        );
                    }

                    await withdrawDetailPage.enterWithdrawalQuantity(
                        withdrawalQuantityInput
                    );

                    await withdrawDetailPage.clickWithdraw();

                    await expect(page).toHaveURL(
                        /\/withdraw\/account-details$/
                    );
                }
            );

            await test.step(
                'TC001_6 | get and validate Account Detail Page Summary',
                async () => {
                    logSub(
                        6,
                        'get and validate Account Detail Page Summary'
                    );

                    const accountDetails =
                        await withdrawAccountDetailPage.getAccountDetails();

                    expect(accountDetails.withdrawalFrom).toContain(
                        'Gold Vault'
                    );

                    expect(accountDetails.quantity).toBe(
                        withdrawalQuantityInput
                    );

                    console.log('account details', accountDetails);

                    await withdrawAccountDetailPage.validateTransferOptions();

                    await withdrawAccountDetailPage.clickBankAccount();

                    await withdrawAccountDetailPage.selectBank(
                        'ICICI BANK LIMITED'
                    );

                    await withdrawAccountDetailPage.getBankDetails(
                        'ICICI BANK LIMITED'
                    );

                    await withdrawAccountDetailPage.validateCounter();

                    metalPrice =
                        await withdrawAccountDetailPage.getLivePriceValue('Gold');

                    await withdrawDetailPage.clickWithdraw();
                }
            );

            await test.step(
                'TC001_7 | Withdrawal confirmation popup verify and select withdraw',
                async () => {
                    logSub(
                        7,
                        'Withdrawal confirmation popup verify and select withdraw'
                    );

                    await withdrawAccountDetailPage.validateWithdrawAndCancelOptions();

                    await withdrawAccountDetailPage.withdrawButtonClick();
                }
            );

            await test.step(
                'TC001_8 | Get and validate withdrawal success',
                async () => {
                    logSub(
                        8,
                        'Get and validate withdrawal success'
                    );

                    await withdrawPamentPage.validateSuccessPopup();

                    await withdrawPamentPage.validateSuccessPopupDetails(
                        withdrawalQuantityInput,
                        metalPrice,
                        'Gold'
                    );

                    await withdrawPamentPage.clickContinue();
                }
            );

            await test.step(
                'TC001_9 | Validate dashboard details after gold withdrawal',
                async () => {
                    logSub(
                        9,
                        'Validate Dashboard After Withdrawal'
                    );

                    await page.goto('/dashboard');

                    const dashboardAfter =
                        await dashboardPage.captureWithdrawalDashboardSnapshot({
                            requireGoldFd: false,
                        });

                    const expectedGold = Number(
                        (
                            totalGoldBefore -
                            withdrawalQuantityInput
                        ).toFixed(4)
                    );

                    console.log(
                        `[${TC_001(9)}] Total Gold Before: ${totalGoldBefore}`
                    );
                    console.log(
                        `[${TC_001(9)}] Withdrawal Quantity: ${withdrawalQuantityInput}`
                    );
                    console.log(
                        `[${TC_001(9)}] Expected Gold: ${expectedGold}`
                    );
                    console.log(
                        `[${TC_001(9)}] Actual Gold: ${dashboardAfter.totalGold}`
                    );

                    expect(
                        dashboardAfter.totalGold
                    ).toBeCloseTo(expectedGold, 4);
                }
            );
        }
    );
});