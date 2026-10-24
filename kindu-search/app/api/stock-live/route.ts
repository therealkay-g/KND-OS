import { NextResponse } from 'next/server';

import {
  DEMO_PLACES,
  isValidStockLive,
  type StockLive,
} from '@/lib/places';

export const dynamic = 'force-dynamic';

/**
 * Pont de démonstration local, utilisé uniquement quand Supabase n'est pas
 * configuré. Il permet de vérifier le scénario 44 → 43 sacs entre KND OS
 * (port 5173) et Kindu Search (port 3000) sans projet Supabase.
 *
 * En production, le temps réel passe par Supabase Realtime.
 */
const globalStore = globalThis as typeof globalThis & {
  __kinduDemoStock?: Map<string, StockLive>;
};

const stockStore = globalStore.__kinduDemoStock ?? new Map<string, StockLive>();
globalStore.__kinduDemoStock = stockStore;

const merchantToPlace = new Map(
  DEMO_PLACES.filter((place) => place.merchantId).map((place) => [
    place.merchantId as string,
    place.id,
  ]),
);

const demoToken = process.env.DEMO_SYNC_TOKEN ?? 'demo-sync-token-kay';
const bridgeEnabled =
  process.env.DEMO_BRIDGE_ENABLED === 'true' ||
  process.env.NODE_ENV !== 'production';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Demo-Sync-Token',
  'Cache-Control': 'no-store',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  if (!bridgeEnabled) {
    return NextResponse.json(
      { ok: false, message: 'Pont de démonstration désactivé.' },
      { status: 404, headers: corsHeaders },
    );
  }

  return NextResponse.json(
    {
      mode: 'demo-bridge',
      places: Array.from(stockStore.entries()).map(([placeId, stockLive]) => ({
        placeId,
        stockLive,
      })),
    },
    { headers: corsHeaders },
  );
}

export async function POST(request: Request) {
  if (!bridgeEnabled) {
    return NextResponse.json(
      { ok: false, message: 'Pont de démonstration désactivé.' },
      { status: 404, headers: corsHeaders },
    );
  }

  const token = request.headers.get('x-demo-sync-token') ?? '';
  if (token !== demoToken) {
    return NextResponse.json(
      { ok: false, message: 'Jeton de démonstration invalide.' },
      { status: 401, headers: corsHeaders },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Corps JSON invalide.' },
      { status: 400, headers: corsHeaders },
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { ok: false, message: 'Payload invalide.' },
      { status: 400, headers: corsHeaders },
    );
  }

  const payload = body as Record<string, unknown>;
  const merchantId = payload.merchantId;
  const stockLive = payload.stockLive;

  if (typeof merchantId !== 'string' || !isValidStockLive(stockLive)) {
    return NextResponse.json(
      { ok: false, message: 'Commerce ou stock invalide.' },
      { status: 400, headers: corsHeaders },
    );
  }

  const placeId = merchantToPlace.get(merchantId);
  if (!placeId) {
    return NextResponse.json(
      { ok: false, message: 'Aucune fiche de démonstration liée à ce commerce.' },
      { status: 404, headers: corsHeaders },
    );
  }

  const nextStock: StockLive = {
    ...stockLive,
    updatedAt: new Date().toISOString(),
  };

  stockStore.set(placeId, nextStock);

  return NextResponse.json(
    { ok: true, placeId, stockLive: nextStock },
    { headers: corsHeaders },
  );
}
