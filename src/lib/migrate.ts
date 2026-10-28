/**
 * Migrations locales.
 *
 * Le champ historique `neighborhood` a été renommé `commune` (entité
 * administrative de Kindu). Les données déjà enregistrées sur les appareils
 * (localStorage web, méta SQLite) utilisent encore l'ancien nom : on le renomme
 * à la lecture pour ne pas perdre les commerces existants.
 */

import { seedMerchantIdForMode, isSeedMerchantId } from './merchant-link';
import type { AppData, Commune, Merchant, SyncQueueItem } from './types';

const DEFAULT_COMMUNE: Commune = 'Kasuku';

type LegacyMerchant = Merchant & { neighborhood?: Commune };
type LegacyPayload = Record<string, unknown> & { neighborhood?: Commune };

export function migrateMerchant(merchant: Merchant | null): Merchant | null {
  if (!merchant) return null;

  const legacy = merchant as LegacyMerchant;
  let migrated: Merchant;

  if (legacy.commune) {
    if (!('neighborhood' in legacy)) {
      migrated = merchant;
    } else {
      const { neighborhood, ...rest } = legacy;
      migrated = { ...rest, commune: legacy.commune };
    }
  } else {
    const { neighborhood, ...rest } = legacy;
    migrated = { ...rest, commune: neighborhood ?? DEFAULT_COMMUNE };
  }

  // Les anciens profils initiaux partageaient `merchant-local`. On les relie
  // à la fiche Kindu Search correspondant à leur mode de commerce.
  if (isSeedMerchantId(migrated.id)) {
    const expectedId = seedMerchantIdForMode(migrated.mode);
    if (migrated.id !== expectedId) {
      migrated = { ...migrated, id: expectedId };
    }
  }

  return migrated;
}

function migrateSyncItem(item: SyncQueueItem): SyncQueueItem {
  if (item.tableName !== 'profiles') return item;

  const payload = item.payload as LegacyPayload;
  if (!('neighborhood' in payload)) return item;

  const { neighborhood, ...rest } = payload;
  return {
    ...item,
    payload: {
      ...rest,
      commune: (rest.commune as Commune | undefined) ?? neighborhood,
    },
  };
}

export function migrateAppData(data: AppData): AppData {
  return {
    ...data,
    merchant: migrateMerchant(data.merchant),
    syncQueue: data.syncQueue.map(migrateSyncItem),
  };
}
