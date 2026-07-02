import path from 'path';
import * as XLSX from 'xlsx';

/** Admin test data workbook: `testdata/admin/admin-data.xlsx` */
export const ADMIN_DATA_DIR = path.resolve(process.cwd(), 'testdata', 'admin');
export const ADMIN_DATA_WORKBOOK = path.join(ADMIN_DATA_DIR, 'admin-data.xlsx');

const workbookCache = new Map<string, XLSX.WorkBook>();

function getWorkbook(filePath: string): XLSX.WorkBook {
  if (!workbookCache.has(filePath)) {
    workbookCache.set(filePath, XLSX.readFile(filePath));
  }
  return workbookCache.get(filePath)!;
}

function readSheetRows<T extends Record<string, unknown>>(
  sheetName: string,
  filePath = ADMIN_DATA_WORKBOOK,
): T[] {
  const workbook = getWorkbook(filePath);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in ${filePath}`);
  }
  return XLSX.utils.sheet_to_json<T>(sheet, {
    defval: '',
    raw: false,
  });
}

/**
 * Returns all non-empty trimmed values in the given column of `sheetLogin`.
 * Throws if the header is not found in the sheet.
 */
export function columnValues(field: string, filePath = ADMIN_DATA_WORKBOOK): string[] {
  const rows = readSheetRows<Record<string, unknown>>('sheetLogin', filePath);
  if (rows.length === 0) {
    throw new Error(`Sheet "sheetLogin" in ${filePath} has no data rows`);
  }
  if (!(field in rows[0])) {
    const available = Object.keys(rows[0]).join(', ');
    throw new Error(
      `Column header "${field}" not found in sheet "sheetLogin". Available: ${available}`,
    );
  }
  return rows
    .map((row) => String(row[field] ?? '').trim())
    .filter((v) => v !== '');
}

/** Memoised per-field random pick — stable within a run, varies across runs. */
const pickCache = new Map<string, string>();

export function pickFieldValue(field: string, filePath = ADMIN_DATA_WORKBOOK): string {
  const cacheKey = `${filePath}::${field}`;
  if (pickCache.has(cacheKey)) return pickCache.get(cacheKey)!;
  const values = columnValues(field, filePath);
  if (values.length === 0) {
    throw new Error(`Column "${field}" has no non-empty values in sheet "sheetLogin" of ${filePath}`);
  }
  const chosen = values[Math.floor(Math.random() * values.length)];
  pickCache.set(cacheKey, chosen);
  return chosen;
}

export interface AdminLoginData {
  firstName: string;
  lastName: string;
  state: string;
  city: string;
  branchName: string;
  leadName: string;
  proofName: string;
  ifsc: string;
  accountNumber: string;
  partnerNumber: string;
}

export function getLoginData(filePath = ADMIN_DATA_WORKBOOK): AdminLoginData {
  return {
    firstName:     pickFieldValue('FirstName', filePath),
    lastName:      pickFieldValue('LastName', filePath),
    state:         pickFieldValue('State', filePath),
    city:          pickFieldValue('City', filePath),
    branchName:    pickFieldValue('Branch Name', filePath),
    leadName:      pickFieldValue('Select Lead', filePath),
    proofName:     pickFieldValue('Select Proof', filePath),
    ifsc:          pickFieldValue('IFSC', filePath),
    accountNumber: pickFieldValue('Account Number', filePath),
    partnerNumber: pickFieldValue('Partner User', filePath),
  };
}

export interface InternalUserBranchData {
  branchName:       string;
  branchType:       string;
  partnerName:      string;
  address:          string;
  state:            string;
  city:             string;
  pincode:          string;
  auditor:          string;
  bankName:         string;
  bankBranchName:   string;
  ifsc:             string;
  acHolderName:     string;
  acNumber:         string;
  commission:       string;
  searchBranchName: string;
  oldUserCount:     string;
}

export interface PartnerBranchUserData {
  state:       string;
  city:        string;
  pincode:     string;
  emailDomain: string;
}

export function getPartnerBranchUserData(filePath = ADMIN_DATA_WORKBOOK): PartnerBranchUserData {
  const rows = readSheetRows<Record<string, unknown>>('sheetPartnerBranchUser', filePath);
  if (rows.length === 0) throw new Error('Sheet "sheetPartnerBranchUser" has no data rows');
  const r = rows[0];
  const str = (key: string) => String(r[key] ?? '').trim();
  return {
    state:       str('State'),
    city:        str('City'),
    pincode:     str('Pincode'),
    emailDomain: str('EmailDomain'),
  };
}

export function getInternalUserBranchData(filePath = ADMIN_DATA_WORKBOOK): InternalUserBranchData {
  const rows = readSheetRows<Record<string, unknown>>('sheetInternalUserBranch', filePath);
  if (rows.length === 0) throw new Error('Sheet "sheetInternalUserBranch" has no data rows');
  const r = rows[0];
  const str = (key: string) => String(r[key] ?? '').trim();
  return {
    branchName:       str('BranchName'),
    branchType:       str('BranchType'),
    partnerName:      str('PartnerName'),
    address:          str('Address'),
    state:            str('State'),
    city:             str('City'),
    pincode:          str('Pincode'),
    auditor:          str('Auditor'),
    bankName:         str('BankName'),
    bankBranchName:   str('BankBranchName'),
    ifsc:             str('IFSC'),
    acHolderName:     str('ACHolderName'),
    acNumber:         str('ACNumber'),
    commission:       str('Commission'),
    searchBranchName: str('SearchBranchName'),
    oldUserCount:     str('OldUserCount'),
  };
}
