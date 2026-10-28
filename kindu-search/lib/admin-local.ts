import { SEED_PENDING_PLACES } from './pending-seed';
import {
  SEED_PLACES,
  isPlacePending,
  loadUserPlaces,
  type Place,
} from './places';

export const ADMIN_DECISIONS_KEY = 'kindu-search:admin-decisions:v1';
export const ADMIN_DECISIONS_EVENT = 'kindu-search:admin-decisions-updated';

export interface AdminDecisions {
  verified: string[];
  refused: string[];
}

function emptyDecisions(): AdminDecisions {
  return { verified: [], refused: [] };
}

export function loadAdminDecisions(): AdminDecisions {
  if (typeof window === 'undefined') return emptyDecisions();
  try {
    const raw = window.localStorage.getItem(ADMIN_DECISIONS_KEY);
    if (!raw) return emptyDecisions();
    const parsed = JSON.parse(raw) as Partial<AdminDecisions>;
    return {
      verified: Array.isArray(parsed.verified)
        ? parsed.verified.filter((id): id is string => typeof id === 'string')
        : [],
      refused: Array.isArray(parsed.refused)
        ? parsed.refused.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return emptyDecisions();
  }
}

export function recordAdminDecision(id: string, decision: 'verified' | 'refused'): void {
  if (typeof window === 'undefined') return;
  const current = loadAdminDecisions();
  const next: AdminDecisions = {
    verified: current.verified.filter((entry) => entry !== id),
    refused: current.refused.filter((entry) => entry !== id),
  };
  next[decision].push(id);
  try {
    window.localStorage.setItem(ADMIN_DECISIONS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(ADMIN_DECISIONS_EVENT));
  } catch {
    // Le stockage local peut être plein : la fiche reste en attente.
  }
}

/** Fiches initiales encore en attente (non traitées dans ce navigateur). */
export function getSeedPendingPlaces(): Place[] {
  const decisions = loadAdminDecisions();
  return SEED_PENDING_PLACES.filter(
    (place) =>
      !decisions.verified.includes(place.id) &&
      !decisions.refused.includes(place.id),
  );
}

/** Toutes les fiches visibles dans l'admin local : initiales + fiches de l'appareil. */
export function loadAdminPlaces(): Place[] {
  const places = new Map<string, Place>();
  for (const place of SEED_PLACES) places.set(place.id, place);
  for (const place of getSeedPendingPlaces()) places.set(place.id, place);
  for (const place of loadUserPlaces()) places.set(place.id, place);
  return Array.from(places.values());
}

export function loadAdminPendingPlaces(): Place[] {
  return loadAdminPlaces().filter(isPlacePending);
}
