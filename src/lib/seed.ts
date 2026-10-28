/**
 * Données initiales (06-plan.md) :
 * - Magasin : 6 produits fake de l'Étape 1.
 * - Pharmacie : 2 produits fake avec molécule, péremption et ordonnance.
 * 2 clients communs, aucune vente pour que le dashboard démarre à 0 CDF.
 */

import type { AppData, Client, Product } from './types';

const now = new Date().toISOString();

const products: Product[] = [
  {
    id: 'prod-coca',
    name: 'Coca-Cola 1.5L',
    barcode: '5449000000996',
    purchasePrice: 2000,
    salePrice: 3000,
    stock: 24,
    unit: 'PIECE',
    emoji: '🥤',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-fanta',
    name: 'Fanta Orange 1.5L',
    barcode: '5449000014535',
    purchasePrice: 2000,
    salePrice: 3000,
    stock: 18,
    unit: 'PIECE',
    emoji: '🍊',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-eau',
    name: 'Eau Mayi 1.5L',
    barcode: '6009802460014',
    purchasePrice: 800,
    salePrice: 1500,
    stock: 40,
    unit: 'PIECE',
    emoji: '💧',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-sucre',
    name: 'Sucre 1 kg',
    purchasePrice: 3000,
    salePrice: 4000,
    stock: 15,
    unit: 'KG',
    emoji: '🍬',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-riz',
    name: 'Riz 5 kg',
    purchasePrice: 12000,
    salePrice: 15000,
    stock: 8,
    unit: 'PIECE',
    emoji: '🍚',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-savon',
    name: 'Savon Kabeya',
    purchasePrice: 500,
    salePrice: 1000,
    stock: 4,
    unit: 'PIECE',
    emoji: '🧼',
    createdAt: now,
    updatedAt: now,
  },
];

/**
 * Catalogue initial du mode Pharmacie.
 * Les dates reprennent l'exemple de docs/06-plan.md (2026-11-20) et une date
 * plus proche pour illustrer l'alerte rouge (< 30 jours).
 */
export function createPharmacyProducts(): Product[] {
  const timestamp = new Date().toISOString();
  return [
    {
      id: 'prod-paracetamol',
      name: 'Paracétamol 500 mg',
      molecule: 'Paracétamol',
      expiryDate: '2026-11-20',
      purchasePrice: 500,
      salePrice: 1000,
      stock: 20,
      unit: 'PIECE',
      emoji: '💊',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'prod-amoxicilline',
      name: 'Amoxicilline 500 mg',
      molecule: 'Amoxicilline',
      expiryDate: '2026-11-05',
      prescriptionRequired: true,
      purchasePrice: 1500,
      salePrice: 2500,
      stock: 12,
      unit: 'PIECE',
      emoji: '💊',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

/**
 * Catalogue initial du mode Quincaillerie.
 * Les quantités du devis Chambre 4x4 (20 sacs + 15 barres + 20 tôles) sont
 * couvertes par ce stock. Seul le prix de 35 000 CDF/sac est documenté
 * (docs/03-design.md) ; les autres prix restent à confirmer [À CONFIRMER].
 */
export function createHardwareProducts(): Product[] {
  const timestamp = new Date().toISOString();
  return [
    {
      id: 'prod-ciment',
      name: 'Ciment CIMKO 50 kg',
      purchasePrice: 30000,
      salePrice: 35000,
      // Scénario de recette Étape 5 : 44 sacs → 43 après une vente.
      stock: 44,
      unit: 'SAC',
      emoji: '🧱',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'prod-barre-fer',
      name: 'Barre de fer 12mm',
      purchasePrice: 9000,
      salePrice: 12000,
      stock: 30,
      unit: 'BARRE 12m',
      emoji: '🔩',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'prod-tole',
      name: 'Tôle ondulée',
      purchasePrice: 20000,
      salePrice: 25000,
      stock: 30,
      unit: 'PIECE',
      emoji: '🛠️',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

const clients: Client[] = [
  {
    id: 'client-maman-georgette',
    name: 'Maman Georgette',
    phone: '970000001',
    createdAt: now,
  },
  {
    id: 'client-papa-kanda',
    name: 'Papa Kanda',
    phone: '970000002',
    createdAt: now,
  },
];

export function createInitialData(): AppData {
  return {
    version: 1,
    merchant: null,
    sessionActive: false,
    products,
    clients,
    sales: [],
    debtPayments: [],
    syncQueue: [],
  };
}
