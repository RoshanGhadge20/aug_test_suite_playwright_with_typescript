import { test, expect } from '../../../../fixtures/base.fixture';
const withdrawalQuantityInput = 0.1;
const withdrawalQuantityInputZero = 0;
let withdrawalSummary: any;

test.describe('TC_Withdrawal_GetCash_008 @customer-flows', () => {
    test(
        'TC_008-withdrawal from gold vault And validate minimum and maxmimaun amount withdrwal and different error message ',
        async ({
            page,
            dashboardPage,
            withdrawalPage,
            withdrawDetailPage,
        }) => {
            const TC_008 = (n: number): string => `TC008_${n}`;

            const logSub = (n: number, title: string): void => {
                console.log(`\n[${TC_008(n)}] ${title}`);
            };


            await test.step(
                'TC008_1 | Withdrwal Process ',
                async () => {
                    logSub(1, 'Withdrwal Process');

                    await page.goto('/dashboard');
                    await dashboardPage.clickWithdrawInvestment();
                    await withdrawalPage.clickGetCashOption();
                    await withdrawalPage.verifyGetCashNavigatesToInvestmentList();



                }
            );



            await test.step(
                'TC008_2 | Get Gold Summary from Investment List and validate Gold Value',
                async () => {
                    logSub(
                        2,
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
                'TC008_3 | select Gold Vault for withdrawal and get vault detail',
                async () => {
                    logSub(
                        3,
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
                'TC008_4 | validate for 0 amount Withdraw Button is disable',
                async () => {
                    logSub(
                        4,
                        'validate for 0 amount Withdraw Button is disable'
                    );

                    await withdrawalPage.clickProceed();

                    withdrawalSummary =
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
                        withdrawalQuantityInputZero
                    );

                    await withdrawDetailPage.validateWithdrawButtonDisabled();


                }
            );

            await test.step(
                'TC008_6 | validate for  amount more than vault amount and get error message',
                async () => {
                    logSub(
                        6,
                        'validate for  amount more than vault amount and get error message'
                    );

                    const amountMorethanGoldValue = withdrawalSummary.totalMetal + 1;
                    console.log(amountMorethanGoldValue);
                    const error = await withdrawDetailPage.enterWithdrawalQuantityGetErrorMessage(
                        amountMorethanGoldValue
                    );

                    if (await error.isVisible()) {
                        const errorMessage = (await error.textContent())?.trim();

                        console.log('Error message:', errorMessage);

                        await expect(error).toContainText('Enter value below or equal to');
                    }

                }
            );


        }
    );
});