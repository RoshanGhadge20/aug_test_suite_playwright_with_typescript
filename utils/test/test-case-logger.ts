const LOG_RED = '\x1b[31m';
const LOG_RESET = '\x1b[0m';

export function formatLogValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  return JSON.stringify(value);
}

function compareNumeric(actual: number, op: '>' | '>=' | '<' | '<=', threshold: number): boolean {
  switch (op) {
    case '>':
      return actual > threshold;
    case '>=':
      return actual >= threshold;
    case '<':
      return actual < threshold;
    case '<=':
      return actual <= threshold;
  }
}

/**
 * Evaluate whether actual matches expected for console pass/fail coloring.
 * Playwright asserts in page objects/specs remain the source of truth.
 */
export function valuesMatchForLog(actual: unknown, expected: unknown): boolean {
  if (expected instanceof RegExp) {
    return expected.test(formatLogValue(actual));
  }

  if (typeof expected === 'string') {
    const numericActual = typeof actual === 'number' ? actual : Number(actual);
    const gt = expected.match(/^>\s*(-?\d+(?:\.\d+)?)$/);
    if (gt && Number.isFinite(numericActual)) {
      return compareNumeric(numericActual, '>', Number(gt[1]));
    }
    const gte = expected.match(/^>=\s*(-?\d+(?:\.\d+)?)$/);
    if (gte && Number.isFinite(numericActual)) {
      return compareNumeric(numericActual, '>=', Number(gte[1]));
    }
    if (/^non-empty$/i.test(expected)) {
      return formatLogValue(actual).trim().length > 0;
    }
    if (/^true$/i.test(expected)) {
      return actual === true;
    }
    if (/^false$/i.test(expected)) {
      return actual === false;
    }
    if (/[()]/.test(expected)) {
      return true;
    }
    if (typeof actual === 'string') {
      return actual === expected || actual.includes(expected) || expected.includes(actual);
    }
    return formatLogValue(actual) === expected;
  }

  if (Object.is(actual, expected)) {
    return true;
  }

  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) <= 0.01;
  }

  return JSON.stringify(actual) === JSON.stringify(expected);
}

export function logGet(testCaseId: string, label: string, details: unknown): void {
  console.log(`[${testCaseId}] GET ${label}:`, details);
}

export function logActualExpected(
  testCaseId: string,
  label: string,
  actual: unknown,
  expected: unknown,
): void {
  const pass = valuesMatchForLog(actual, expected);
  const msg = `[${testCaseId}] ${label} | Actual: ${formatLogValue(actual)} | Expected: ${formatLogValue(expected)}`;
  console.log(pass ? msg : `${LOG_RED}${msg}${LOG_RESET}`);
}

export type TestCaseLogger = {
  readonly id: string;
  stepId: (step?: number | string) => string;
  get: (label: string, details: unknown, step?: number | string) => void;
  actualExpected: (label: string, actual: unknown, expected: unknown, step?: number | string) => void;
  step: (step: number | string, title: string) => void;
  logActualExpected: (step: number | string, label: string, actual: unknown, expected: unknown) => void;
  log: (step: number | string, title: string) => void;
  tc: (step: number | string) => string;
};

const NOOP_LOGGER: TestCaseLogger = {
  id: '',
  stepId: () => '',
  get: () => {},
  actualExpected: () => {},
  step: () => {},
  logActualExpected: () => {},
  log: () => {},
  tc: () => '',
};

/** Pass testCaseId from the spec (withdrawal-style — no fixture/bind). No-op when omitted. */
export function createTestCaseLogger(testCaseId?: string): TestCaseLogger {
  if (!testCaseId) {
    return NOOP_LOGGER;
  }

  const stepId = (step?: number | string): string =>
    step === undefined ? testCaseId : `${testCaseId}_${step}`;

  return {
    id: testCaseId,
    stepId,
    get: (label, details, step) => logGet(stepId(step), label, details),
    actualExpected: (label, actual, expected, step) =>
      logActualExpected(stepId(step), label, actual, expected),
    step: (step, title) => console.log(`\n[${stepId(step)}] ${title}`),
    logActualExpected: (step, label, actual, expected) =>
      logActualExpected(stepId(step), label, actual, expected),
    log: () => {},
    tc: stepId,
  };
}

/** @deprecated Prefer {@link createTestCaseLogger} — kept for existing shop flows. */
export type StepLogger = {
  log: (n: number, title: string) => void;
  logActualExpected: (n: number, label: string, actual: unknown, expected: unknown) => void;
  tc: (n: number) => string;
};

/** @deprecated Prefer {@link createTestCaseLogger} — kept for existing shop flows. */
export function createStepLogger(testCaseId: string): StepLogger {
  const logger = createTestCaseLogger(testCaseId);
  return {
    tc: (n) => logger.stepId(n),
    log: (n, title) => logger.step(n, title),
    logActualExpected: (n, label, actual, expected) =>
      logger.actualExpected(label, actual, expected, n),
  };
}
