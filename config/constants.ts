import type { EnvName } from './environments';

export const PANELS = ['admin', 'customer', 'business', 'new-admin'] as const;
export type Panel = typeof PANELS[number];

export const API_SERVICES = ['api-backend', 'api-emi', 'api-lgd'] as const;
export type ApiService = typeof API_SERVICES[number];

export type ProjectId = Panel | ApiService;
export const ALL_PROJECTS: readonly ProjectId[] = [...PANELS, ...API_SERVICES];

export function storageStatePath(envName: EnvName, panel: Panel): string {
  return `storage/${envName}/${panel}.json`;
}

export const DEFAULT_TIMEOUTS = {
  action: 15_000,
  navigation: 30_000,
  test: 60_000,
} as const;
