import * as path from 'path';

// Shared between TC_GoalWiseSip_010 (buy) and TC_GoalWiseSip_038 (withdraw) only — not used by
// any other goalwisesip TC, so it's fine to keep local to this pair rather than under utils/.
export interface PendingWithdrawalState {
  mobile: string;
  purchasedAt: number;
}

export const PENDING_WITHDRAWAL_STATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'reports',
  'goalwisesip',
  'tc010-pending-withdrawal.json',
);

// PIN scoped to this TC010/TC038 pair only (not the shared DEFAULT_TEST_PIN in
// registration-data.ts) — per feedback_goalwisesip_isolated_edits, a per-TC preference shouldn't
// change the shared constant every other registration/KYC/referral spec also relies on.
export const TEST_PIN = '123456';

// How long to wait, from the moment TC010 buys the gold, before TC038 attempts to withdraw it —
// the Gold Vault has intermittently shown 0g immediately after a purchase (confirmed live).
export const SETTLEMENT_WAIT_MS = 10 * 60 * 1000;
