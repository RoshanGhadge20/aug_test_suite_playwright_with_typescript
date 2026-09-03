import { recordSegmentResult } from './goalwisesip-results';

/** Consistent console output + Excel row for every TC_GoalWiseSip_0XX spec: TC id, user type,
 * its plain-English segment definition, and the mobile number of the account that ended up in
 * that segment. Also appends/updates a row in testdata/customer/goalwisesip-results.xlsx. */
export function logSegment(
  tcId: string,
  userType: string,
  description: string,
  mobile: string,
  extra?: string,
): void {
  const suffix = extra ? ` | ${extra}` : '';
  console.log(`[GoalWiseSip] ${tcId} — ${userType} — ${description} | Mobile: ${mobile}${suffix}`);
  recordSegmentResult(tcId, userType, description, mobile, extra);
}
