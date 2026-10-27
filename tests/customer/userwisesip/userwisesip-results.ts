import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const RESULTS_DIR = path.resolve(process.cwd(), 'testdata', 'customer');
const RESULTS_WORKBOOK = path.join(RESULTS_DIR, 'userwisesip-results.xlsx');
const SHEET_NAME = 'UserWiseSip';
const HEADERS = ['TC', 'User Type', 'Description', 'Mobile Number', 'Extra', 'Recorded At'];

function loadOrCreateWorkbook(): XLSX.WorkBook {
  if (fs.existsSync(RESULTS_WORKBOOK)) {
    return XLSX.readFile(RESULTS_WORKBOOK);
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([HEADERS]), SHEET_NAME);
  return workbook;
}

/**
 * Appends one row per call to testdata/customer/userwisesip-results.xlsx, replacing any prior
 * row for the same TC (so re-running a spec updates its row instead of duplicating it).
 *
 * Read-modify-write against a single shared file — safe under `--workers=1`/serial execution,
 * not under parallel workers (a concurrent writer can lose or corrupt another's row). Run the
 * userwisesip project serially if all 37 TCs are expected to land in this sheet reliably.
 */
export function recordSegmentResult(
  tc: string,
  userType: string,
  description: string,
  mobile: string,
  extra?: string,
): void {
  const workbook = loadOrCreateWorkbook();
  const sheet = workbook.Sheets[SHEET_NAME];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });

  const dataRows = rows.slice(1).filter((row) => row[0] !== tc);
  dataRows.push([tc, userType, description, mobile, extra ?? '', new Date().toISOString()]);

  const updated = XLSX.utils.aoa_to_sheet([HEADERS, ...dataRows]);
  // writeFile only emits sheets listed in SheetNames — an existing workbook without this sheet
  // (e.g. one holding only GoalWiseSip) would otherwise drop the row silently.
  if (workbook.SheetNames.includes(SHEET_NAME)) workbook.Sheets[SHEET_NAME] = updated;
  else XLSX.utils.book_append_sheet(workbook, updated, SHEET_NAME);

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  XLSX.writeFile(workbook, RESULTS_WORKBOOK);
}

/** Mobile number last recorded for `tc` in userwisesip-results.xlsx, or undefined if it has no row. */
export function getRecordedMobile(tc: string): string | undefined {
  if (!fs.existsSync(RESULTS_WORKBOOK)) return undefined;
  const sheet = XLSX.readFile(RESULTS_WORKBOOK).Sheets[SHEET_NAME];
  if (!sheet) return undefined;
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });
  const row = rows.slice(1).find((r) => r[0] === tc);
  return row?.[3] ? String(row[3]) : undefined;
}
