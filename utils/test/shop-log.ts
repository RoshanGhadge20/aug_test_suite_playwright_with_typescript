import { formatLogValue, valuesMatchForLog } from './test-case-logger';

const LOG_RED = '\x1b[31m';
const LOG_RESET = '\x1b[0m';

/** SIP-style shop logging — no testCaseId; fixed [Shop] prefix. */
export function shopLogGet(label: string, details: unknown): void {
  console.log(`[Shop] GET ${label}:`, details);
}

export function shopLogActualExpected(label: string, actual: unknown, expected: unknown): void {
  const pass = valuesMatchForLog(actual, expected);
  const msg = `[Shop] ${label} | Actual: ${formatLogValue(actual)} | Expected: ${formatLogValue(expected)}`;
  console.log(pass ? msg : `${LOG_RED}${msg}${LOG_RESET}`);
}
