import type { ShopEmiPayNowOrderDetails } from '../../pages/customer/shop-emi-foreclose.page';

/**
 * Worker-scoped state shared between a shop EMI purchase spec and its foreclose spec
 * (TC007 → TC008 → TC009, TC010 → TC011, TC017 → TC018).
 */
export interface ShopEmiPurchaseChainState {
  orderId: string;
  productName: string;
  payNowDetails: ShopEmiPayNowOrderDetails | null;
}

/** Purchase test id that seeds the chain (`007` = 9-month EMI, `009`/`017` = 3-month EMI). */
export type ShopEmiPurchaseChainId = '007' | '009' | '017';

export function createEmptyShopEmiPurchaseChainState(): ShopEmiPurchaseChainState {
  return { orderId: '', productName: '', payNowDetails: null };
}

const workerShopEmiPurchaseChains: Partial<
  Record<ShopEmiPurchaseChainId, ShopEmiPurchaseChainState>
> = {};

/** One chain state object per worker per purchase→foreclose pair. */
export function getWorkerShopEmiPurchaseChainState(
  chainId: ShopEmiPurchaseChainId = '009',
): ShopEmiPurchaseChainState {
  workerShopEmiPurchaseChains[chainId] ??= createEmptyShopEmiPurchaseChainState();
  return workerShopEmiPurchaseChains[chainId]!;
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
