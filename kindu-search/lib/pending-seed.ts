import type { Place } from './places';

/**
 * Aucune fiche initiale en attente : l'annuaire part vide.
 * Les fiches seront ajoutées par les commerçants via le formulaire public
 * ou créées dans Supabase.
 */
export const SEED_PENDING_PLACES: Place[] = [];
