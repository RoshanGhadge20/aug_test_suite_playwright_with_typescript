export const PANELS = ['admin', 'customer', 'business', 'new-admin'] as const;
export type Panel = typeof PANELS[number];

export const STORAGE_STATE_PATH: Record<Panel, string> = {
  admin: 'storage/admin.json',
  customer: 'storage/customer.json',
  business: 'storage/business.json',
  'new-admin': 'storage/new-admin.json',
};

export const DEFAULT_TIMEOUTS = {
  action: 15_000,
  navigation: 30_000,
  test: 60_000,
} as const;
