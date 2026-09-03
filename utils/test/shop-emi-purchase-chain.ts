import * as fs from 'fs';
import * as path from 'path';
import type { ShopEmiPayNowOrderDetails } from '../../pages/customer/shop-emi-foreclose.page';
import { getTargetEnv } from '../../config/environments';

/**
 * State shared between a shop EMI purchase spec and its foreclose spec
 * (TC007 → TC008 → TC009, TC010 → TC011, TC017 → TC018).
 *
 * Persisted to a JSON file under `storage/<env>/` rather than kept in memory: Playwright
 * does not guarantee module state survives across spec files even with a single worker,
 * so an in-memory singleton silently resets between the purchase spec and the spec(s)
 * that depend on it. A file on disk is the one thing that reliably crosses that boundary.
 */
export interface ShopEmiPurchaseChainState {
  orderId: string;
  productName: string;
  payNowDetails: ShopEmiPayNowOrderDetails | null;
  /** Which chain this state belongs to — set by {@link getWorkerShopEmiPurchaseChainState}, used to know where to persist it. */
  chainId?: ShopEmiPurchaseChainId;
}

/** Purchase test id that seeds the chain (`007` = 9-month EMI, `009`/`017` = 3-month EMI). */
export type ShopEmiPurchaseChainId = '007' | '009' | '017';

export function createEmptyShopEmiPurchaseChainState(): ShopEmiPurchaseChainState {
  return { orderId: '', productName: '', payNowDetails: null };
}

type PersistedChains = Partial<Record<ShopEmiPurchaseChainId, ShopEmiPurchaseChainState>>;

function chainStateFilePath(): string {
  return path.join('storage', getTargetEnv(), 'shop-emi-purchase-chain.json');
}

function readPersistedChains(): PersistedChains {
  try {
    const raw = fs.readFileSync(chainStateFilePath(), 'utf-8');
    return JSON.parse(raw) as PersistedChains;
  } catch {
    return {};
  }
}

/** Reads the on-disk chain state for `chainId` (empty state if nothing was persisted yet). */
export function getWorkerShopEmiPurchaseChainState(
  chainId: ShopEmiPurchaseChainId = '009',
): ShopEmiPurchaseChainState {
  const state = readPersistedChains()[chainId] ?? createEmptyShopEmiPurchaseChainState();
  return { ...state, chainId };
}

/** Persists `state` (tagged with its `chainId` by {@link getWorkerShopEmiPurchaseChainState}) to disk. */
export function persistShopEmiPurchaseChainState(state: ShopEmiPurchaseChainState): void {
  if (!state.chainId) {
    throw new Error('[shop-emi-purchase-chain] Cannot persist state with no chainId.');
  }
  const filePath = chainStateFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const chains = readPersistedChains();
  chains[state.chainId] = state;
  fs.writeFileSync(filePath, JSON.stringify(chains, null, 2));
}

/** Foreclose spec: env override first, then state written by the purchase spec. */
export function resolveShopEmiOrderId(
  chain: ShopEmiPurchaseChainState,
  options?: { orderIdEnvKey?: string },
): string {
  const envKey = options?.orderIdEnvKey ?? 'SHOP_EMI_ORDER_ID';
  const fromEnv = process.env[envKey]?.trim().replace(/\D/g, '');
  return fromEnv || chain.orderId;
}

export function resolveShopEmiProductName(
  chain: ShopEmiPurchaseChainState,
  options?: { productNameEnvKey?: string },
): string {
  const envKey = options?.productNameEnvKey ?? 'SHOP_EMI_PRODUCT_NAME';
  return process.env[envKey]?.trim() || chain.productName;
}
