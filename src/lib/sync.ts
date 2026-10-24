import { getSupabaseClient } from './supabase';
import type { Product } from './types';

/** Snapshot envoyé à Kindu Search pour un commerce Pro. */
export interface StockLiveProduct {
  id: string;
  name: string;
  stock: number;
  unit: string;
  price: number;
}

export interface StockLiveSnapshot {
  updatedAt: string;
  products: StockLiveProduct[];
}

export type StockSyncTransport = 'supabase' | 'bridge' | 'offline';

export interface PushStockResult {
  ok: boolean;
  transport: StockSyncTransport;
  message?: string;
}

/**
 * Le stock live n'est activé que si le commerce est Pro et qu'une destination
 * est configurée. En production, ce drapeau viendra du profil commerçant
 * (docs/05-backend.md) et non d'une variable d'environnement.
 */
export function isStockSyncEnabled(): boolean {
  const isPro = process.env.EXPO_PUBLIC_KND_OS_PRO === 'true';
  const hasDestination = Boolean(
    getSupabaseClient() || process.env.EXPO_PUBLIC_STOCK_BRIDGE_URL,
  );
  return isPro && hasDestination;
}

export function createStockLiveSnapshot(
  products: Product[],
  updatedAt = new Date().toISOString(),
): StockLiveSnapshot {
  return {
    updatedAt,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      unit: product.unit,
      price: product.salePrice,
    })),
  };
}

function errorMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return 'Synchronisation impossible.';
}

export async function pushStockLive(
  merchantId: string,
  snapshot: StockLiveSnapshot,
): Promise<PushStockResult> {
  const token = process.env.EXPO_PUBLIC_KND_SYNC_TOKEN ?? '';
  const supabase = getSupabaseClient();

  if (supabase) {
    if (!token) {
      return {
        ok: false,
        transport: 'supabase',
        message: 'Jeton de synchronisation manquant.',
      };
    }

    const { error } = await supabase.rpc('update_merchant_stock_live', {
      p_merchant_id: merchantId,
      p_token: token,
      p_stock_live: snapshot,
    });

    if (error) {
      return { ok: false, transport: 'supabase', message: error.message };
    }
    return { ok: true, transport: 'supabase' };
  }

  const bridgeUrl = process.env.EXPO_PUBLIC_STOCK_BRIDGE_URL;
  if (bridgeUrl) {
    try {
      const response = await fetch(bridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Sync-Token': token,
        },
        body: JSON.stringify({ merchantId, stockLive: snapshot }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        return {
          ok: false,
          transport: 'bridge',
          message:
            body.trim() ||
            `Le pont de démonstration a répondu ${response.status}.`,
        };
      }
      return { ok: true, transport: 'bridge' };
    } catch (cause) {
      return { ok: false, transport: 'bridge', message: errorMessage(cause) };
    }
  }

  return {
    ok: false,
    transport: 'offline',
    message: 'Aucune destination de synchronisation configurée.',
  };
}
