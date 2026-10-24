import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CATEGORIES,
  COMMUNES,
  TONES,
  type Category,
  type Commune,
  type Place,
  type StockLive,
  type StockLiveProduct,
  type Tone,
} from './places';

type Row = Record<string, unknown>;

function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && CATEGORIES.includes(value as Category);
}

function isCommune(value: unknown): value is Commune {
  return typeof value === 'string' && COMMUNES.includes(value as Commune);
}

function isTone(value: unknown): value is Tone {
  return typeof value === 'string' && TONES.includes(value as Tone);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function mapStockLive(value: unknown, fallbackUpdatedAt: unknown): StockLive | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Row;
  if (!Array.isArray(raw.products)) return null;

  const products: StockLiveProduct[] = [];
  for (const entry of raw.products) {
    if (!entry || typeof entry !== 'object') continue;
    const product = entry as Row;
    if (
      typeof product.id !== 'string' ||
      typeof product.name !== 'string' ||
      typeof product.stock !== 'number' ||
      typeof product.unit !== 'string' ||
      typeof product.price !== 'number'
    ) {
      continue;
    }
    products.push({
      id: product.id,
      name: product.name,
      stock: product.stock,
      unit: product.unit,
      price: product.price,
    });
  }

  const updatedAt =
    typeof raw.updatedAt === 'string'
      ? raw.updatedAt
      : typeof fallbackUpdatedAt === 'string'
        ? fallbackUpdatedAt
        : null;

  if (!updatedAt) return null;
  return { updatedAt, products };
}

/** Convertit une ligne Supabase (snake_case) vers le modèle Kindu Search. */
export function mapPlaceRow(row: Row): Place | null {
  if (
    typeof row.id !== 'string' ||
    typeof row.name !== 'string' ||
    !isCategory(row.category) ||
    !isCommune(row.commune) ||
    !isTone(row.tone) ||
    typeof row.address !== 'string' ||
    typeof row.hours !== 'string' ||
    typeof row.whatsapp !== 'string' ||
    typeof row.phone !== 'string' ||
    typeof row.lat !== 'number' ||
    typeof row.lng !== 'number' ||
    typeof row.description !== 'string'
  ) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    commune: row.commune,
    address: row.address,
    hours: row.hours,
    whatsapp: row.whatsapp,
    phone: row.phone,
    lat: row.lat,
    lng: row.lng,
    pro: row.est_pro === true,
    tone: row.tone,
    description: row.description,
    products: toStringArray(row.products),
    photo: typeof row.photo === 'string' ? row.photo : undefined,
    source: 'supabase',
    createdAt: typeof row.created_at === 'string' ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : undefined,
    merchantId: typeof row.merchant_id === 'string' ? row.merchant_id : undefined,
    stockLive: mapStockLive(row.stock_live, row.stock_updated_at),
    verified: row.est_verifie === true,
  };
}

export async function fetchVerifiedPlaces(supabase: SupabaseClient): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('est_verifie', true)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => mapPlaceRow(row as Row))
    .filter((place): place is Place => place !== null);
}

export async function fetchPlaceById(
  supabase: SupabaseClient,
  id: string,
): Promise<Place | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .eq('est_verifie', true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapPlaceRow(data as Row) : null;
}

/**
 * Crée une fiche publique en attente. La policy RLS `places_public_insert_pending`
 * interdit de la déclarer Pro, vérifiée ou liée à un marchand.
 */
export async function insertPendingPlace(
  supabase: SupabaseClient,
  place: Place,
): Promise<void> {
  const { error } = await supabase.from('places').insert({
    id: place.id,
    name: place.name,
    category: place.category,
    commune: place.commune,
    address: place.address,
    hours: place.hours,
    whatsapp: place.whatsapp,
    phone: place.phone,
    lat: place.lat,
    lng: place.lng,
    tone: place.tone,
    description: place.description,
    products: place.products,
    photo: place.photo ?? null,
    est_pro: false,
    est_verifie: false,
    est_actif: true,
  });

  if (error) throw new Error(error.message);
}
