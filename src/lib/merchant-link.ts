import type { StoreMode } from './types';

/**
 * Identifiants de démonstration relies aux fiches Kindu Search.
 * En production, l'identifiant vient de Supabase Auth / du profil commerçant.
 */
export const DEMO_MERCHANT_IDS = {
  quincaillerie: 'merchant-local',
  pharmacie: 'merchant-pharmacie',
  magasin: 'merchant-magasin',
} as const;

export function demoMerchantIdForMode(mode: StoreMode): string {
  if (mode === 'Pharmacie') return DEMO_MERCHANT_IDS.pharmacie;
  if (mode === 'Magasin') return DEMO_MERCHANT_IDS.magasin;
  return DEMO_MERCHANT_IDS.quincaillerie;
}

export function isDemoMerchantId(id: string): boolean {
  return Object.values(DEMO_MERCHANT_IDS).includes(
    id as (typeof DEMO_MERCHANT_IDS)[keyof typeof DEMO_MERCHANT_IDS],
  );
}
