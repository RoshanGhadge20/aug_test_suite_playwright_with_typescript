import { test, expect } from '../../../../fixtures/base.fixture';

const withdrawalQuantityInput = 0.1;

test.describe('TC_Withdrawal_GetCash_005 @customer-flows', () => {
    test(
        'TC_005-Withdraw Bank Delete Functionality',
        async ({
            page,
            dashboardPage,
            withdrawalPage,
            withdrawDetailPage,
            withdrawAccountDetailPage,
            addNewBankWithdrawalPage,
        }) => {
            const TC_005 = (n: number): string => `TC005_${n}`;
            const logSub = (n: number, title: string): void => {
                console.log(`\n[${TC_005(n)}] ${title}`);
            };

            let bankDetails: {
                bankName: string;
                accountHolder: string;
                accountNumber: string;
                ifscCode: string;
            };

            await test.step('TC005_1 | select get Cash Option', async () => {
                logSub(1, 'select get Cash Option');
                await page.goto('/dashboard');
                await dashboardPage.clickWithdrawInvestment();
                await withdrawalPage.clickGetCashOption();
                await withdrawalPage.verifyGetCashNavigatesToInvestmentList();
            });

            await test.step(
                'TC005_2 | Get Gold Summary from Investment List and validate Gold Value',
                async () => {
                    logSub(2, 'Get Gold Summary from Investment List and validate Gold Value');

                    await withdrawDetailPage.clickGoldTab();

                    const goldSummary = await withdrawalPage.getMetalSummary('Gold');

                    console.log('Gold Summary:', goldSummary);

                    expect(goldSummary.value).toBeCloseTo(
                        goldSummary.total * goldSummary.livePrice,
                        1,
                    );
                },
            );

            await test.step(
                'TC005_3 | select Gold Vault for withdrawal and get vault detail',
                async () => {
                    logSub(3, 'select Gold Vault for withdrawal and get vault detail');

                    const goldVault = await withdrawalPage.getVaultDetailsAndClick('Gold');

                    console.log('Withdrawal Gold:', goldVault.withdrawalMetal);
                    console.log('Gold Vault Value:', goldVault.vaultValue);

                    expect(
                        goldVault.withdrawalMetal,
                        `Not enough quantity available for withdrawal. Available Gold: ${goldVault.withdrawalMetal} gm`,
                    ).toBeGreaterThan(0);
                },
            );

            await test.step(
                'TC005_4 | proceed for withdrawal and get withdrawal detail',
                async () => {
                    logSub(4, 'proceed for withdrawal and get withdrawal detail');

                    await withdrawalPage.clickProceed();

                    const withdrawalSummary = await withdrawDetailPage.getWithdrawalSummary('Gold');

                    console.log('Total Value:', withdrawalSummary.totalValue);
                    console.log('Total Gold:', withdrawalSummary.totalMetal);

                    if (withdrawalQuantityInput > withdrawalSummary.totalMetal) {
                        throw new Error(
                            `Quantity is not enough for withdrawal. Available: ${withdrawalSummary.totalMetal} gm, Requested: ${withdrawalQuantityInput} gm`,
                        );
                    }

                    await withdrawDetailPage.enterWithdrawalQuantity(withdrawalQuantityInput);
                    await withdrawDetailPage.clickWithdraw();

                    await expect(page).toHaveURL(/\/withdraw\/account-details$/);
                },
            );

            await test.step(
                'TC005_5 | get and validate Account Detail Page Summary and select Bank',
                async () => {
                    logSub(5, 'get and validate Account Detail Page Summary and select Bank');

                    const accountDetails = await withdrawAccountDetailPage.getAccountDetails();

                    expect(accountDetails.withdrawalFrom).toContain('Gold Vault');
                    expect(accountDetails.quantity).toBe(withdrawalQuantityInput);

                    console.log('account details', accountDetails);

                    await withdrawAccountDetailPage.clickBankAccount();
                    await withdrawAccountDetailPage.selectFirstBank();

                    bankDetails = await withdrawAccountDetailPage.getSelectedBankDetails();
                    console.log(bankDetails);
                },
                
            );


            await test.step('TC005_6 | Delete bank account validation', async () => {
                logSub(6, 'Delete bank account validation');
                await addNewBankWithdrawalPage.clickFirstBankDelete();
                await addNewBankWithdrawalPage.verifyRemovePopup(
                    'Remove Account',
                    'Are you sure you want to remove this bank account?'
                );
                console.log('Remove Account popup is displayed');
                console.log('Remove button is visible');
                console.log('Cancel button is visible');
                await addNewBankWithdrawalPage.clickCancelRemove('Remove Account');
                console.log('Clicked Cancel');
                await addNewBankWithdrawalPage.clickFirstBankDelete();
                console.log('Remove Account popup displayed again');
                await addNewBankWithdrawalPage.clickRemove('Remove Account');
                console.log('Clicked Remove');
                const title = await addNewBankWithdrawalPage.getSuccessToastTitle();
                const message = await addNewBankWithdrawalPage.getSuccessToastMessage();
                console.log('Toast Title:', title);
                console.log('Toast Message:', message);
                expect(title).toBe('Success');
                expect(message).toBe('Customer Bank details deleted successfully');
                await addNewBankWithdrawalPage.closeToast();
            });

            await test.step('TC_005_7 Add new bank',async()=>{
                logSub(7,'Add new bank');
                await addNewBankWithdrawalPage.addBankDetails(bankDetails.accountNumber,
                    bankDetails.ifscCode);
                await addNewBankWithdrawalPage.clickSaveBank();
   
            })

        },
    );
});