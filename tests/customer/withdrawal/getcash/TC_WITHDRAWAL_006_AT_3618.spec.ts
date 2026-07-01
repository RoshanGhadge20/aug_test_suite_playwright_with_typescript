import { test, expect } from '../../../../fixtures/base.fixture';
const withdrawalQuantityInput = 0.1;

let upiID: any;

test.describe('TC_WITHDRAWAL_006 @customer-flows', () => {
    test(
        'TC_006-Withdraw from Silver Vault with Add UPI validation and error message checks',
        async ({
            page,
            dashboardPage,
            withdrawalPage,
            withdrawDetailPage,
            withdrawAccountDetailPage,
            addNewBankWithdrawalPage
        }) => {
            const TC_006 = (n: number): string => `TC004_${n}`;
            const logSub = (n: number, title: string): void => {
                console.log(`\n[${TC_006(n)}] ${title}`);
            };

            await test.step(
                'TC006_1 | select get Cash Option',
                async () => {
                    logSub(
                        1,
                        'select get Cash Option'
                    );
                    await page.goto('/dashboard');
                    await dashboardPage.clickWithdrawInvestment();
                    await withdrawalPage.clickGetCashOption();
                    await withdrawalPage.verifyGetCashNavigatesToInvestmentList();
                }
            );

            await test.step(
                'TC004_2 | Get Silver Summary from Investment List and validate Silver Value',
                async () => {
                    logSub(2,
                        'Get Silver Summary from Investment List and validate Silver Value'
                    );
                    await withdrawDetailPage.clickSilverTab();
                    const goldSummary =
                        await withdrawalPage.getMetalSummary('Silver');
                    console.log('Silver Summary:', goldSummary);
                    expect(goldSummary.value).toBeCloseTo(
                        goldSummary.total * goldSummary.livePrice,
                        1
                    );
                }
            );

            await test.step(
                'TC006_3 | select Silver Vault for withdrawal and get vault detail',
                async () => {
                    logSub(
                        3,
                        'select Silver Vault for withdrawal and get vault detail');
                    const silverVault =
                        await withdrawalPage.getVaultDetailsAndClick('Silver');
                    console.log(
                        'Withdrawal Silver:',
                        silverVault.withdrawalMetal
                    );
                    console.log(
                        'Gold Vault Value:',
                        silverVault.vaultValue
                    );

                    expect(
                        silverVault.withdrawalMetal,
                        `Not enough quantity available for withdrawal. Available Gold: ${silverVault.withdrawalMetal} gm`
                    ).toBeGreaterThan(0);
                }
            );

            await test.step(
                'TC006_4 | proceed for withdrawal and get withdrawal detail',
                async () => {
                    logSub(
                        4,
                        'proceed for withdrawal and get withdrawal detail'
                    );

                    await withdrawalPage.clickProceed();

                    const withdrawalSummary =
                        await withdrawDetailPage.getWithdrawalSummary('Silver');

                    console.log(
                        'Total Value:',
                        withdrawalSummary.totalValue
                    );
                    console.log(
                        'Total Silver:',
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
                'TC006_5 | get and validate Account Detail  Page Summary and select UPI',
                async () => {
                    logSub(
                        5,
                        'get and validate Account Detail  Page Summary and select UPI'
                    );

                    const accountDetails =
                        await withdrawAccountDetailPage.getAccountDetails();
                    expect(accountDetails.withdrawalFrom).toContain(
                        'Silver Vault'
                    );

                    expect(accountDetails.quantity).toBe(
                        withdrawalQuantityInput
                    );
                    console.log('account details', accountDetails);
                    await withdrawAccountDetailPage.clickUPI();
                    upiID = await withdrawAccountDetailPage.selectUpi();
                    console.log(upiID);
                }
            );

            await test.step(
                'TC004_6 | Add New UPI with Invalid UPI ID',
                async () => {
                    logSub(6, 'Add New UPI with Wrong UPI ID');
                    await addNewBankWithdrawalPage.clickAddUpiButton();
                    const invalidUPI = upiID + '1';
                    const errorMessage =
                        await addNewBankWithdrawalPage.validateUpiErrorMessage(
                            invalidUPI,
                            'Wrong UPI ID, Please try again!'
                        );

                    console.log('Error message:', errorMessage);
                });
            await test.step(
                'TC006_6 | Validate Save button disabled for blank UPI ID',
                async () => {
                    await addNewBankWithdrawalPage.enterUpiIdAndValidateDoneButton('', false);
                }
            );

            await test.step(
                'TC006_7 | Validate save Button disable for UPI ID with invalid characters',
                async () => {
                    await addNewBankWithdrawalPage.enterUpiIdAndValidateDoneButton('aaaaaq', false);

                }
            );

            await test.step(
                'TC006_8 | Validate error message for Already Added UPI ID ',
                async () => {
                    const errorMessage =
                        await addNewBankWithdrawalPage.validateUpiErrorMessage(
                            upiID,
                            ' Customer vpa is already exists '
                        );

                    console.log('Error message:', errorMessage);
                    await addNewBankWithdrawalPage.clickCancel();

                }
            );



        });
});