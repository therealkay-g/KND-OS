import { DEMO_PENDING_PLACES } from './demo-pending';
import {
  DEMO_PLACES,
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

/** Fiches de démo encore en attente (non traitées dans ce navigateur). */
export function getDemoPendingPlaces(): Place[] {
  const decisions = loadAdminDecisions();
  return DEMO_PENDING_PLACES.filter(
    (place) =>
      !decisions.verified.includes(place.id) &&
      !decisions.refused.includes(place.id),
  );
}

/** Toutes les fiches visibles dans l'admin local : démo + fiches de l'appareil. */
export function loadAdminDemoPlaces(): Place[] {
  const places = new Map<string, Place>();
  for (const place of DEMO_PLACES) places.set(place.id, place);
  for (const place of getDemoPendingPlaces()) places.set(place.id, place);
  for (const place of loadUserPlaces()) places.set(place.id, place);
  return Array.from(places.values());
}

export function loadAdminPendingPlaces(): Place[] {
  return loadAdminDemoPlaces().filter(isPlacePending);
}
