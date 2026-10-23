/**
 * One-time script: adds the "sheetInternalUserBranch" sheet to admin-data.xlsx.
 * Run once: node scripts/add-internal-user-branch-sheet.js
 */
const path = require("path");
const XLSX = require("xlsx");

const workbookPath = path.resolve(
  __dirname,
  "../testdata/admin/admin-data.xlsx",
);
const SHEET_NAME = "sheetInternalUserBranch";

const wb = XLSX.readFile(workbookPath);

if (wb.SheetNames.includes(SHEET_NAME)) {
  console.log(`Sheet "${SHEET_NAME}" already exists — skipping.`);
  process.exit(0);
}

const rows = [
  {
    BranchName: "Augmont",
    BranchType: "Augmont Branch",
    Address: "Mumbai",
    State: "Maharashtra",
    City: "Mumbai",
    Pincode: "435005",
    Auditor: "regression test",
    BankName: "SBI",
    BankBranchName: "Main Branch",
    IFSC: "SBIN0000000",
    ACHolderName: "Priyanka Thorat",
    ACNumber: "999988887777",
    Commission: "1%",
    SearchBranchName: "Main Branch",
    OldUserCount: "5",
  },
];

const ws = XLSX.utils.json_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
XLSX.writeFile(wb, workbookPath);

console.log(`Sheet "${SHEET_NAME}" added to ${workbookPath}`);
