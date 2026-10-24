/**
 * Types partagés entre l'interface, le stockage local et la future sync Supabase.
 * Les noms de variables restent en anglais (règle CLAUDE.md).
 */

export type StoreMode = 'Magasin' | 'Pharmacie' | 'Quincaillerie';

/** Communes de Kindu (entité administrative). */
export type Commune = 'Kasuku' | 'Alunguli' | 'Mikelenge';

export type PaymentType = 'cash' | 'credit';

/** Unités prédéfinies du PRD (docs/01-prd.md). */
export type PresetUnit = 'PIECE' | 'KG' | 'SAC' | 'BARRE 12m' | 'METRE' | 'ROULEAU';

/**
 * Unité d'un produit : prédéfinie ou libre, saisie par le commerçant.
 * `string & {}` conserve l'autocomplétion des unités prédéfinies.
 */
export type Unit = PresetUnit | (string & {});

export interface Merchant {
  id: string;
  phone: string;
  storeName: string;
  ownerName?: string;
  commune: Commune;
  mode: StoreMode;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  unit: Unit;
  emoji: string;
  /** Mode Pharmacie (docs/01-prd.md) — molécule du médicament. */
  molecule?: string;
  /** Mode Pharmacie — date de péremption au format AAAA-MM-JJ. */
  expiryDate?: string;
  /** Mode Pharmacie — photo d'ordonnance obligatoire pour vendre. */
  prescriptionRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  emoji: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  unit: Unit;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  cost: number;
  profit: number;
  paymentType: PaymentType;
  clientId?: string;
  /** Photo de l'ordonnance (data URL ou URI locale) — requise si un produit l'exige. */
  prescriptionPhoto?: string;
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  clientId: string;
  amount: number;
  createdAt: string;
}

export type SyncAction = 'insert' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  tableName: string;
  action: SyncAction;
  payload: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
}

export interface AppData {
  version: 1;
  merchant: Merchant | null;
  sessionActive: boolean;
  products: Product[];
  clients: Client[];
  sales: Sale[];
  debtPayments: DebtPayment[];
  syncQueue: SyncQueueItem[];
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface ProductInput {
  name: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  unit: Unit;
  emoji?: string;
  molecule?: string;
  expiryDate?: string;
  prescriptionRequired?: boolean;
}

export interface ClientInput {
  name: string;
  phone?: string;
}
