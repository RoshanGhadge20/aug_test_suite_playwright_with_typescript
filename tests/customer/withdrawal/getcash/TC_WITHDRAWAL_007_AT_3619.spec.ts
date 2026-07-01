import { test, expect } from '../../../../fixtures/base.fixture';
const withdrawalQuantityInput = 0.1;

let upiID: any;

test.describe('TC_WITHDRAWAL_007 @customer-flows', () => {
    test(
        'TC_007-delete UPI account Functionality',
        async ({
            page,
            dashboardPage,
            withdrawalPage,
            withdrawDetailPage,
            withdrawAccountDetailPage,
            addNewBankWithdrawalPage
        }) => {
            const TC_007 = (n: number): string => `TC007_${n}`;
            const logSub = (n: number, title: string): void => {
                console.log(`\n[${TC_007(n)}] ${title}`);
            };

            await test.step(
                'TC007_1 | select get Cash Option',
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
                'TC007_2 | Get Silver Summary from Investment List and validate Silver Value',
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
                'TC007_3 | select Silver Vault for withdrawal and get vault detail',
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
                'TC007_4 | proceed for withdrawal and get withdrawal detail',
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
                'TC007_5 | get and validate Account Detail  Page Summary and select UPI',
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
                'TC007_6 | Delete UPI account validation',
                async () => {
                    logSub(6, 'Delete UPI account validation');
                    await addNewBankWithdrawalPage.clickDeleteUpi(upiID);
                    await addNewBankWithdrawalPage.verifyRemovePopup(
                        'Remove UPI ID',
                        'Are you sure you want to remove this UPI ID?'
                    );

                    await addNewBankWithdrawalPage.clickCancelRemove('Remove UPI ID');
                    await addNewBankWithdrawalPage.clickDeleteUpi(upiID);
                    await addNewBankWithdrawalPage.clickRemove('Remove UPI ID');
                    const errorMessage = addNewBankWithdrawalPage.messageLocator(
                        'Customer UPI details deleted successfully'
                    );

                    console.log('Deleted UPI message:', errorMessage.textContent());
                });

            await test.step('TC_007_8 add UPI Id', async () => {
                logSub(8, 'add UPI Id');
                await addNewBankWithdrawalPage.clickAddUpiButton();
                const errorMessage =
                    await addNewBankWithdrawalPage.validateUpiErrorMessage(
                        upiID,
                        '  Upi ID addedd successfully  '
                    );

                console.log('UPI ID Suceess message:', errorMessage);



            });
        });

});