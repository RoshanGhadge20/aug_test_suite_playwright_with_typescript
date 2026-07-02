import { test, expect } from "../../fixtures/admin.fixture";

// test.describe("TC05 partner and master data @regression @admin @partner", () => {
//   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
//     addPartner,
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

//     // ── TC05 @Test priority=0: validateAddPartner ────────────────────────────
//     // Flow42_ValidateAddNewPartner.validateAddNewPartner() + validateEdit() + validateDeletePartner()
//     await test.step("validate add partner — add, edit, delete", async () => {
//       const { firstName, lastName, email, mobile } =
//         await addPartner.validateAddNewPartner();
//       expect.soft(firstName).toBeTruthy();
//       expect.soft(lastName).toBeTruthy();
//       expect.soft(email).toContain("@");
//       expect.soft(mobile).toMatch(/^[6-9]\d{9}$/);
// await addPartner.validateEdit();
// await addPartner.validateDeletePartner();
//     });

//     // ── TC05 @Test priority=1: validateAddPartnerBranch ─────────────────────
//     // Flow55_ValidateEditPartnerBranch.validateDeletePartnerBranch()
//     await test.step("validate add partner branch — delete partner branch", async () => {
//       await editPartnerBranch.validateDeletePartnerBranch();
//     });

//     // ── TC05 @Test priority=2: validateAddInternalUser ──────────────────────
//     // Flow56_ValidateInternalUser.validateOldeInternalUser()
//     await test.step("validate add internal user — verify existing user", async () => {
//       const actualUser = await internalUser.validateOldeInternalUser();
//       expect.soft(actualUser).toBe("Priyanka Thorat");
//     });

//     // ── TC05 @Test priority=3: validateAddInternalUserBranch ────────────────
//     // Flow57_InternalUserBranch.valiadateOdlInternalBranchUser()
//     await test.step("validate add internal user branch — update old branch user", async () => {
//       const { isDisplayed, isEnabled } =
//         await internalUserBranch.valiadateOdlInternalBranchUser();
//       expect.soft(isDisplayed).toBe(true);
//       expect.soft(isEnabled).toBe(true);
//     });

//     // ── TC05 @Test priority=4: validateGoldRate ──────────────────────────────
//     // Flow58_ValidatingGoldRate.validatingGoldRate()
//     await test.step("validate gold rate — set and verify rate 9600", async () => {
//       const actualOldRate = await goldRate.validatingGoldRate();
//       expect.soft(actualOldRate).toBe("9600");
//     });

//     // ── TC05 @Test priority=5: validateNewScheme ─────────────────────────────
//     // Flow59_ValidateAddNewScheme.validateAddNewScheme()
//     await test.step("validate add new scheme — add scheme configuration", async () => {
//       await addScheme.validateAddNewScheme();
//     });

//     // ── TC05 @Test priority=6: validateAddLeadAndEdit ───────────────────────
//     // Flow62_ValidatingAddLeadWithEditFunctionality.validateAddLeadWithEdit()
//     await test.step("validate add lead with edit functionality", async () => {
//       const { isDisplayed, isEnabled } =
//         await addLead.validateAddLeadWithEdit();
//       expect.soft(isDisplayed).toBe(true);
//       expect.soft(isEnabled).toBe(true);
//     });

//     // ── TC05 @Test priority=7: validateAddKaratAndEdit ──────────────────────
//     // Flow63_ValidateAddKaratFunctionality.deleteKarat()
//     await test.step("validate add karat and edit — delete karat", async () => {
//       await karat.deleteKarat();
//     });

//     // ── TC05 @Test priority=8: validateAddAndEditUnapprovedReason ────────────
//     // Flow64_ValidateAddApprovalReason.validateDeleteUnapprovalReason()
//     await test.step("validate add and edit unapproved reason — delete unapproval reason", async () => {
//       await unapprovalReason.validateDeleteUnapprovalReason();
//     });

//     // ── TC05 @Test priority=9: validateAddAndEditWavierType ─────────────────
//     // Flow65_ValidateAddAndEditWavierType.validateDeleteWavierType()
//     await test.step("validate add and edit waiver type — delete waiver type", async () => {
//       await waiverType.validateDeleteWavierType();
//     });

//     // ── TC05 @Test priority=10: validateAddAndEditLoanDefect ─────────────────
//     // Flow66_ValidateEditAndViewLoanDefects.validateEditLoanDefect()
//     await test.step("validate add loan defect with edit and view — edit loan defect", async () => {
//       await loanDefects.validateEditLoanDefect();
//     });
//   });
// });
// test.describe("TC05 partner and master data @regression @admin @partner", () => {
//   test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
//     editPartnerBranch,
//     //     internalUser,
//     //     internalUserBranch,
//     //     goldRate,
//     //     addScheme,
//     //     addLead,
//     //     karat,
//     //     unapprovalReason,
//     //     waiverType,
//     //     loanDefects,
//   }) => {
//     test.setTimeout(20 * 60_000);
//     await test.step("validate add partner branch — delete partner branch", async () => {
//       await editPartnerBranch.navigateToPartnerBranch();
//     });
//   });
// });
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
//     await test.step("validate add internal user — verify existing user", async () => {
//       await internalUser.validateInternalUser();
//       const actualUser = await internalUser.validateOldeInternalUser();
//       expect.soft(actualUser).toBe("Priyanka Thorat");
//     });
//   });
// });
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
// }) => {
//   test.setTimeout(20 * 60_000);
//   await test.step("validate old internal user — edit and view branches", async () => {
//     const actualUser = await internalUser.validateOldeInternalUser();
//     expect.soft(actualUser).not.toBe("");
//   });
// await test.step("validate internal user branch — view, edit, update old branch user", async () => {
//   await internalUserBranch.validateInternalUserBranch();
//   const { isDisplayed, isEnabled } =
//     await internalUserBranch.valiadateOdlInternalBranchUser();
//   expect.soft(isDisplayed).toBe(true);
//   expect.soft(isEnabled).toBe(true);
// });
//   });
// });

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
test.describe("TC05 partner and master data @regression @admin @partner", () => {
  test("partner management, internal users, gold rate, scheme, lead, karat, unapproval reason, waiver type, loan defects", async ({
    addPartnerBranchUser,
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
  }) => {
    test.setTimeout(20 * 60_000);
    await test.step("validate add partner branch user — fill and submit Add User form", async () => {
      const { firstName, lastName, mobile } =
        await addPartnerBranchUser.validateAddPartnerBranchUser();
      expect.soft(firstName).not.toBe("");
      expect.soft(lastName).not.toBe("");
      expect.soft(mobile).toMatch(/^[6-9]\d{9}$/);
    });
  });
});
