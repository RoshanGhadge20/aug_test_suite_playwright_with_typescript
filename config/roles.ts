export const ADMIN_ROLES = ['appraiser', 'bm', 'ops', 'partner'] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

export function isAdminRole(v: unknown): v is AdminRole {
  return typeof v === 'string' && (ADMIN_ROLES as readonly string[]).includes(v);
}

const ROLE_SEGMENT: Record<AdminRole, string> = {
  appraiser: 'APPRAISER',
  bm: 'BM',
  ops: 'OPS',
  partner: 'PARTNER',
};

export function roleMobileKey(role: AdminRole, prefix: 'TEST' | 'UAT'): string {
  const seg = ROLE_SEGMENT[role];
  return `${prefix}_ADMIN_${seg}_MOBILE`;
}
