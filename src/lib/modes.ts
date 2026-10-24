/**
 * Modes de commerce (docs/01-prd.md, docs/02-app-flow.md).
 * Magasin, Pharmacie et Quincaillerie sont actifs (Étapes 1-3).
 */

import { Pill, Store, Wrench, type LucideIcon } from 'lucide-react-native';

import type { StoreMode } from './types';

export interface StoreModeOption {
  value: StoreMode;
  icon: LucideIcon;
  description: string;
  available: boolean;
}

export const STORE_MODES: StoreModeOption[] = [
  {
    value: 'Magasin',
    icon: Store,
    description: 'Vente rapide, stock et crédits clients',
    available: true,
  },
  {
    value: 'Pharmacie',
    icon: Pill,
    description: 'Péremption, molécules et ordonnances',
    available: true,
  },
  {
    value: 'Quincaillerie',
    icon: Wrench,
    description: 'Unités complexes et devis chantier',
    available: true,
  },
];
