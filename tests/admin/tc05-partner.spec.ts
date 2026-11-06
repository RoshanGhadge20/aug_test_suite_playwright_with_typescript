import { test, expect } from "../../fixtures/admin.fixture";

test.describe("TC05 partner and master data @regression @admin @partner", () => {
  test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    addPartner,
    editPartnerBranch,
    addPartnerBranchUser,
    internalUser,
    internalUserBranch,
    goldRate,
    addScheme,
    addLead,
    karat,
    unapprovalReason,
    waiverType,
    loanDefects,
  }) => {
    test.setTimeout(20 * 60_000);

    // await test.step("validate add partner — add, edit, delete", async () => {
    //   const { firstName, lastName, email, mobile } =
    //     await addPartner.validateAddNewPartner();
    //   expect.soft(firstName).toBeTruthy();
    //   expect.soft(lastName).toBeTruthy();
    //   expect.soft(email).toContain("@");
    //   expect.soft(mobile).toMatch(/^[6-9]\d{9}$/);
    //   await addPartner.validateEdit();
    //  // await addPartner.validateDeletePartner();
    //   await addPartner.crossCheckOldPartner();
    //   await addPartner.updateOldPartner();
    // });

    // await test.step("validate add partner branch — add,view,edit anddelete partner branch", async () => {
    //   await editPartnerBranch.navigateToPartnerBranch();
    // });
    // await test.step("validate add partner branch user — add,view,edit and delete partner branch user", async () => {
    //   await addPartnerBranchUser.runPartnerBranchUserFullCycle();
    // });

    // await test.step("validate add internal user — verify existing user", async () => {
    //   await internalUser.validateInternalUser();
    //   const actualUser = await internalUser.validateOldeInternalUser();
    //   expect.soft(actualUser).toBe("Priyanka Thorat");
    // });

    // await test.step("validate add internal user branch — update old branch user", async () => {
    //   await internalUserBranch.validateInternalUserBranch();
    //   const { isDisplayed, isEnabled } =
    //     await internalUserBranch.valiadateOdlInternalBranchUser();
    //   expect.soft(isDisplayed).toBe(true);
    //   expect.soft(isEnabled).toBe(true);
    // });

    // await test.step("validate gold rate — set and verify rate 9600", async () => {
    //   const actualOldRate = await goldRate.validatingGoldRate();
    //   expect.soft(actualOldRate).toBe("9600");
    // });

    // await test.step("validate add new scheme — add scheme configuration", async () => {
    //   await addScheme.validateAddNewScheme();
    // });

    // await test.step("validate add lead with edit functionality", async () => {
    //   const { isDisplayed, isEnabled } =
    //     await addLead.validateAddLeadWithEdit();
    //   expect.soft(isDisplayed).toBe(true);
    //   expect.soft(isEnabled).toBe(true);
    // });

    // await test.step("validate add karat and edit — delete karat", async () => {
    //   await karat.deleteKarat();
    // });

    // await test.step("validate add and edit unapproved reason — delete unapproval reason", async () => {
    //   await unapprovalReason.validateDeleteUnapprovalReason();
    // });

    // await test.step("validate add and edit waiver type — delete waiver type", async () => {
    //   await waiverType.validateAddWavierType();
    // });

    // await test.step("validate add loan defect with edit and view — edit loan defect", async () => {
    //   await loanDefects.validateEditLoanDefect();
    // });
    // });
    // });
    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    //   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    //     editPartnerBranch,
    //     internalUser,
    //     internalUserBranch,
    //     goldRate,
    //     addScheme,
    //     addLead,
    //     karat,
    //     unapprovalReason,
    //     waiverType,
    //     loanDefects,
    //   }) => {
    //     test.setTimeout(20 * 60_000);
    //     await test.step("validate add partner branch — delete partner branch", async () => {
    //       await editPartnerBranch.navigateToPartnerBranch();
    //     });
    //   });
    // });
    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    // test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    //   internalUser,
    //   internalUserBranch,
    //   goldRate,
    //   addScheme,
    //   addLead,
    //   karat,
    //   unapprovalReason,
    //   waiverType,
    //   loanDefects,
    // }) => {
    //   test.setTimeout(20 * 60_000);
    //   await test.step("validate add internal user — verify existing user", async () => {
    //     await internalUser.validateInternalUser();
    //     const actualUser = await internalUser.validateOldeInternalUser();
    //     expect.soft(actualUser).toBe("Priyanka Thorat");
    //   });
    // });
    // });
    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    // test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    //   internalUser,
    //   internalUserBranch,
    //   goldRate,
    //   addScheme,
    //   addLead,
    //   karat,
    //   unapprovalReason,
    //   waiverType,
    //   loanDefects,
    // }) => {
    //   test.setTimeout(20 * 60_000);
    //   await test.step("validate old internal user — edit and view branches", async () => {
    //     const actualUser = await internalUser.validateOldeInternalUser();
    //     expect.soft(actualUser).not.toBe("");
    //   });
    //   await test.step("validate internal user branch — view, edit, update old branch user", async () => {
    //     await internalUserBranch.validateInternalUserBranch();
    //     const { isDisplayed, isEnabled } =
    //       await internalUserBranch.valiadateOdlInternalBranchUser();
    //     expect.soft(isDisplayed).toBe(true);
    //     expect.soft(isEnabled).toBe(true);
    //   });
    // });
    //});

    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    //   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    //     internalUser,
    //     internalUserBranch,
    //     goldRate,
    //     addScheme,
    //     addLead,
    //     karat,
    //     unapprovalReason,
    //     waiverType,
    //     loanDefects,
    //   }) => {
    //     test.setTimeout(20 * 60_000);
    //     await test.step("validate gold rate — set and verify rate 9600", async () => {
    //       const actualOldRate = await goldRate.validatingGoldRate();
    //       expect.soft(actualOldRate).toBe("9600");
    //     });
    //   });
    // });
    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    // test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    //   addPartnerBranchUser,
    //     editPartnerBranch,
    //     internalUser,
    //     internalUserBranch,
    //     goldRate,
    //     addScheme,
    //     addLead,
    //     karat,
    //     unapprovalReason,
    //     waiverType,
    //     loanDefects,
    // }) => {
    //   test.setTimeout(20 * 60_000);
    //   await test.step("validate add partner branch user — fill and submit Add User form", async () => {
    //     const { firstName, lastName, mobile } =
    //       await addPartnerBranchUser.validateAddPartnerBranchUser();
    //     expect.soft(firstName).not.toBe("");
    //     expect.soft(lastName).not.toBe("");
    //     expect.soft(mobile).toMatch(/^[6-9]\d{9}$/);
    //   });
    // });
    // });
    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    //   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    //     // addPartnerBranchUser,
    //     //     editPartnerBranch,
    //     //     internalUser,
    //     //     internalUserBranch,
    //     goldRate,
    //     //     addScheme,
    //     //     addLead,
    //     //     karat,
    //     //     unapprovalReason,
    //     //     waiverType,
    //     //     loanDefects,
    //   }) => {
    //     test.setTimeout(20 * 60_000);
    //     await test.step("validate add partner branch user — fill and submit Add User form", async () => {
    //       await test.step("validate gold rate — set and verify rate 9600", async () => {
    //         const actualOldRate = await goldRate.validatingGoldRate();
    //         expect.soft(actualOldRate).toBe("9600");
    //       });
    //     });
    //   });
    // });
    //test.describe("TC05 partner and master data @regression @admin @partner", () => {
    //   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({

    //     page,
    //     addScheme,

    //   }) => {
    //     test.setTimeout(20 * 60_000);
    //     await test.step("validate add new scheme — add scheme configuration", async () => {
    //       await addScheme.validateAddNewScheme();
    //       await page.waitForTimeout(5000);
    //       await addScheme.validateViewScheme();
    //     });
    //     await test.step("validate edit scheme", async () => {
    //       await page.waitForTimeout(5000);
    //       await addScheme.validateEditScheme("Automation_Test");
    //     });
    //   });
    // });
    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    //   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    //    page,
    //addLead,
    //   }) => {
    //     test.setTimeout(20 * 60_000);
    //     await test.step("validate add lead with edit functionality", async () => {
    //       const { isDisplayed, isEnabled } =
    //         await addLead.validateAddLeadWithEdit();
    //       expect.soft(isDisplayed).toBe(true);
    //       expect.soft(isEnabled).toBe(true);
    //     });
    //   });
    // });
    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    //   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    //     //     // addPartnerBranchUser,
    //     //     //     editPartnerBranch,
    //     //     //     internalUser,
    //     //     //     internalUserBranch,
    //     //     goldRate,
    //     //     addScheme,
    //     //addLead,
    //     page,
    //     karat,
    //     //     //     unapprovalReason,
    //     //     //     waiverType,
    //     //     //     loanDefects,
    //   }) => {
    //     test.setTimeout(20 * 60_000);
    //     await test.step("validate add karat and edit — delete karat", async () => {
    //       await karat.validateAddKarat();
    //       await page.waitForTimeout(5000);
    //       await karat.validateEditKarat();
    //       await page.waitForTimeout(5000);
    //       await karat.deleteKarat();
    //     });
    //   });
    // });
    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    //   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({

    //     page,
    //     waiverType,

    //   }) => {
    //     test.setTimeout(20 * 60_000);
    //     await test.step("validate add and edit waiver type — delete waiver type", async () => {
    //       await waiverType.validateAddWavierType();
    //       await page.waitForTimeout(5000);
    //       await waiverType.validateEditType();
    //       await page.waitForTimeout(5000);
    //       await waiverType.validateDeleteWavierType();
    //     });
    //   });
    // });
    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    //   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({

    //     page,
    //     loanDefects,
    //   }) => {
    //     test.setTimeout(20 * 60_000);
    //     await test.step("validate add loan defect with edit and view — edit loan defect", async () => {
    //       await loanDefects.validatAddLoanDefects();
    //       await page.waitForLoadState("networkidle");
    //       await page.waitForTimeout(5000);
    //       await loanDefects.validateEditLoanDefect();
    //     });
    //   });
    // });
    // test.describe("TC05 partner and master data @regression @admin @partner", () => {
    //   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    //     waiverType,
    //     page,
    //     loanDefects,
    //   }) => {
    //     test.setTimeout(20 * 60_000);
    //     await test.step("validate add loan defect with edit and view — edit loan defect", async () => {
    //       await test.step("validate add and edit waiver type — delete waiver type", async () => {
    //         await waiverType.validateAddWavierType();
    //         await waiverType.validateDeleteWavierType();
    //       });
    //     });
  });

  //   test("verify add industry category in masters", async ({ industry }) => {
  //     test.setTimeout(10 * 60_000);

  //     await test.step("masters: add an industry category and verify it is listed", async () => {
  //       const { name, category, risk } = await industry.addIndustryCategory();
  //       expect(name).toBeTruthy();
  //       expect(category).toBeTruthy();
  //       expect(risk).toBeTruthy();
  //     });
  //   });
});
