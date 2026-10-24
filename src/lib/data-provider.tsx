/**
 * État global de KND OS (Étape 1).
 * Toutes les mutations sont enregistrées localement puis ajoutées à sync_queue.
 * Aucun appel réseau : la sync Supabase arrive à l'Étape 5.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createId } from './id';
import { demoMerchantIdForMode, isDemoMerchantId } from './merchant-link';
import {
  createHardwareDemoProducts,
  createInitialData,
  createPharmacyDemoProducts,
} from './seed';
import {
  getClientDebt,
  getLowStockProducts,
  getTodayStats,
  isLowStock,
  type PeriodStats,
} from './stats';
import { loadData, saveData } from './storage';
import {
  createStockLiveSnapshot,
  isStockSyncEnabled,
  pushStockLive,
  type StockSyncTransport,
} from './sync';
import type {
  AppData,
  CartLine,
  Client,
  ClientInput,
  DebtPayment,
  Merchant,
  Commune,
  PaymentType,
  Product,
  ProductInput,
  Sale,
  SaleItem,
  StoreMode,
  SyncAction,
  SyncQueueItem,
} from './types';

export const DEV_OTP_CODE = '1234';

interface ActionResult {
  ok: boolean;
  message?: string;
}

interface SellResult extends ActionResult {
  sale?: Sale;
}

interface AddClientResult extends ActionResult {
  client?: Client;
}

export type StockSyncState = 'disabled' | 'idle' | 'syncing' | 'live' | 'error';

export interface StockSyncStatus {
  state: StockSyncState;
  /** Opérations stock (places/products) pas encore envoyées. */
  pendingStock: number;
  lastSyncedAt?: string;
  transport?: StockSyncTransport;
  message?: string;
}

interface AppContextValue {
  data: AppData;
  hydrated: boolean;
  isLoggedIn: boolean;
  pendingPhone: string | null;
  todayStats: PeriodStats;
  lowStockProducts: Product[];
  stockSync: StockSyncStatus;
  requestOtp: (phone: string) => void;
  verifyOtp: (code: string) => boolean;
  completeOnboarding: (input: {
    phone: string;
    storeName: string;
    commune: Commune;
    mode: StoreMode;
  }) => void;
  login: () => void;
  logout: () => void;
  updateMode: (mode: StoreMode) => void;
  addProduct: (input: ProductInput) => Product;
  updateProduct: (id: string, input: ProductInput) => ActionResult;
  addClient: (input: ClientInput) => AddClientResult;
  sell: (
    paymentType: PaymentType,
    cart: CartLine[],
    clientId?: string,
    prescriptionPhoto?: string,
  ) => SellResult;
  payDebt: (clientId: string, amount: number) => ActionResult;
  getDebt: (clientId: string) => number;
  syncStockNow: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function createQueueItem(
  tableName: string,
  action: SyncAction,
  payload: Record<string, unknown>,
): SyncQueueItem {
  return {
    id: createId('sync'),
    tableName,
    action,
    payload,
    createdAt: new Date().toISOString(),
    synced: false,
  };
}

function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * File une mise à jour du stock live. Le snapshot est stocké dans la file,
 * mais la synchronisation reconstruit toujours l'état courant des produits.
 */
function createStockQueueItem(
  merchantId: string | undefined,
  products: Product[],
  updatedAt?: string,
): SyncQueueItem | null {
  if (!merchantId || !isStockSyncEnabled()) return null;
  return createQueueItem('places', 'update', {
    merchantId,
    stockLive: createStockLiveSnapshot(products, updatedAt),
  });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => createInitialData());
  const [hydrated, setHydrated] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const dataRef = useRef(data);
  const [stockSync, setStockSync] = useState<StockSyncStatus>(() => ({
    state: isStockSyncEnabled() ? 'idle' : 'disabled',
    pendingStock: 0,
  }));
  const syncInFlight = useRef(false);
  const syncQueued = useRef(false);

  const commit = useCallback((updater: (previous: AppData) => AppData) => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setData(next);
    return next;
  }, []);

  const syncableCount = useMemo(
    () =>
      data.syncQueue.filter(
        (item) =>
          !item.synced && (item.tableName === 'places' || item.tableName === 'products'),
      ).length,
    [data.syncQueue],
  );

  const runStockSync = useCallback(async () => {
    if (!isStockSyncEnabled()) {
      setStockSync((previous) => ({ ...previous, state: 'disabled' }));
      return;
    }

    if (!dataRef.current.merchant) {
      setStockSync((previous) => ({
        ...previous,
        state: previous.state === 'disabled' ? 'disabled' : 'idle',
      }));
      return;
    }

    if (syncInFlight.current) {
      syncQueued.current = true;
      return;
    }

    syncInFlight.current = true;
    let failed = false;

    try {
      let guard = 0;
      while (guard < 10) {
        const current = dataRef.current;
        const pending = current.syncQueue.filter(
          (item) =>
            !item.synced &&
            (item.tableName === 'places' || item.tableName === 'products'),
        );

        if (!current.merchant || pending.length === 0) break;

        setStockSync((previous) => ({
          ...previous,
          state: 'syncing',
          pendingStock: pending.length,
        }));

        const snapshot = createStockLiveSnapshot(current.products);
        const result = await pushStockLive(current.merchant.id, snapshot);

        if (!result.ok) {
          failed = true;
          setStockSync((previous) => ({
            ...previous,
            state: 'error',
            pendingStock: pending.length,
            transport: result.transport,
            message: result.message,
          }));
          break;
        }

        const syncedIds = new Set(pending.map((item) => item.id));
        commit((previous) => ({
          ...previous,
          syncQueue: previous.syncQueue.map((item) =>
            syncedIds.has(item.id) ? { ...item, synced: true } : item,
          ),
        }));

        setStockSync((previous) => ({
          ...previous,
          state: 'live',
          pendingStock: 0,
          lastSyncedAt: new Date().toISOString(),
          transport: result.transport,
          message: undefined,
        }));

        guard += 1;
      }

      if (!failed) {
        setStockSync((previous) => ({
          ...previous,
          state: previous.lastSyncedAt ? 'live' : 'idle',
          pendingStock: 0,
        }));
      }
    } finally {
      syncInFlight.current = false;
      if (syncQueued.current) {
        syncQueued.current = false;
        void runStockSync();
      }
    }
  }, [commit]);

  const syncStockNow = useCallback(() => {
    void runStockSync();
  }, [runStockSync]);

  useEffect(() => {
    setStockSync((previous) => {
      if (previous.state === 'syncing') return previous;
      const nextState: StockSyncState = !isStockSyncEnabled()
        ? 'disabled'
        : previous.state === 'error'
          ? 'error'
          : previous.state === 'live'
            ? 'live'
            : 'idle';
      if (previous.pendingStock === syncableCount && previous.state === nextState) {
        return previous;
      }
      return { ...previous, pendingStock: syncableCount, state: nextState };
    });
  }, [syncableCount]);

  useEffect(() => {
    if (!hydrated || !isStockSyncEnabled() || syncableCount === 0) return;
    const timeout = setTimeout(() => {
      void runStockSync();
    }, 500);
    return () => clearTimeout(timeout);
  }, [hydrated, syncableCount, data.merchant?.id, runStockSync]);

  useEffect(() => {
    if (!hydrated || !isStockSyncEnabled()) return;
    if (typeof window === 'undefined' || !window.addEventListener) return;
    const onOnline = () => {
      void runStockSync();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [hydrated, runStockSync]);


  useEffect(() => {
    let alive = true;
    loadData()
      .then((stored) => {
        if (!alive) return;
        const initial = stored ?? createInitialData();
        dataRef.current = initial;
        setData(initial);
        setHydrated(true);
      })
      .catch(() => {
        if (!alive) return;
        const initial = createInitialData();
        dataRef.current = initial;
        setData(initial);
        setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Sauvegarde locale différée pour ne pas écrire à chaque frappe.
  useEffect(() => {
    if (!hydrated) return;
    const timeout = setTimeout(() => {
      saveData(data).catch(() => {
        // L'app continue en mémoire ; la prochaine action retentera la sauvegarde.
      });
    }, 120);
    return () => clearTimeout(timeout);
  }, [data, hydrated]);

  const requestOtp = useCallback((phone: string) => {
    setPendingPhone(phone);
  }, []);

  const verifyOtp = useCallback((code: string) => code.trim() === DEV_OTP_CODE, []);

  const completeOnboarding = useCallback(
    (input: { phone: string; storeName: string; commune: Commune; mode: StoreMode }) => {
      const merchant: Merchant = {
        id: demoMerchantIdForMode(input.mode),
        phone: input.phone,
        storeName: input.storeName.trim(),
        commune: input.commune,
        mode: input.mode,
        createdAt: new Date().toISOString(),
      };
      commit((previous) => {
        const nextProducts =
          input.mode === 'Pharmacie'
            ? createPharmacyDemoProducts()
            : input.mode === 'Quincaillerie'
              ? createHardwareDemoProducts()
              : previous.products;
        const stockItem = createStockQueueItem(
          merchant.id,
          nextProducts,
          merchant.createdAt,
        );
        return {
          ...previous,
          merchant,
          sessionActive: true,
          products: nextProducts,
          syncQueue: [
            ...previous.syncQueue,
            createQueueItem('profiles', 'insert', merchant as unknown as Record<string, unknown>),
            ...(stockItem ? [stockItem] : []),
          ],
        };
      });
    },
    [commit],
  );

  const login = useCallback(() => {
    commit((previous) => (previous.merchant ? { ...previous, sessionActive: true } : previous));
  }, [commit]);

  const logout = useCallback(() => {
    setPendingPhone(null);
    commit((previous) => ({ ...previous, sessionActive: false }));
  }, [commit]);

  const updateMode = useCallback(
    (mode: StoreMode) => {
      const current = dataRef.current;
      if (!current.merchant || current.merchant.mode === mode) return;
      const merchant: Merchant = {
        ...current.merchant,
        mode,
        id: isDemoMerchantId(current.merchant.id)
          ? demoMerchantIdForMode(mode)
          : current.merchant.id,
      };
      commit((previous) => ({
        ...previous,
        merchant,
        syncQueue: [
          ...previous.syncQueue,
          createQueueItem('profiles', 'update', merchant as unknown as Record<string, unknown>),
        ],
      }));
    },
    [commit],
  );

  const addProduct = useCallback(
    (input: ProductInput): Product => {
      const now = new Date().toISOString();
      const product: Product = {
        id: createId('prod'),
        name: input.name.trim(),
        barcode: input.barcode?.trim() || undefined,
        purchasePrice: Math.round(input.purchasePrice),
        salePrice: Math.round(input.salePrice),
        stock: roundQuantity(input.stock),
        unit: input.unit,
        emoji: input.emoji || '📦',
        molecule: input.molecule?.trim() || undefined,
        expiryDate: input.expiryDate?.trim() || undefined,
        prescriptionRequired: input.prescriptionRequired ? true : undefined,
        createdAt: now,
        updatedAt: now,
      };
      commit((previous) => {
        const nextProducts = [product, ...previous.products];
        const stockItem = createStockQueueItem(previous.merchant?.id, nextProducts, now);
        return {
          ...previous,
          products: nextProducts,
          syncQueue: [
            ...previous.syncQueue,
            createQueueItem('products', 'insert', product as unknown as Record<string, unknown>),
            ...(stockItem ? [stockItem] : []),
          ],
        };
      });
      return product;
    },
    [commit],
  );

  const updateProduct = useCallback(
    (id: string, input: ProductInput): ActionResult => {
      const current = dataRef.current;
      if (!current.products.some((product) => product.id === id)) {
        return { ok: false, message: 'Produit introuvable.' };
      }
      const updatedAt = new Date().toISOString();
      const updatedProduct: Product = {
        id,
        name: input.name.trim(),
        barcode: input.barcode?.trim() || undefined,
        purchasePrice: Math.round(input.purchasePrice),
        salePrice: Math.round(input.salePrice),
        stock: roundQuantity(input.stock),
        unit: input.unit,
        emoji: input.emoji || '📦',
        molecule: input.molecule?.trim() || undefined,
        expiryDate: input.expiryDate?.trim() || undefined,
        prescriptionRequired: input.prescriptionRequired ? true : undefined,
        createdAt:
          current.products.find((product) => product.id === id)?.createdAt ?? updatedAt,
        updatedAt,
      };
      commit((previous) => {
        const nextProducts = previous.products.map((product) =>
          product.id === id ? updatedProduct : product,
        );
        const stockItem = createStockQueueItem(
          previous.merchant?.id,
          nextProducts,
          updatedAt,
        );
        return {
          ...previous,
          products: nextProducts,
          syncQueue: [
            ...previous.syncQueue,
            createQueueItem(
              'products',
              'update',
              updatedProduct as unknown as Record<string, unknown>,
            ),
            ...(stockItem ? [stockItem] : []),
          ],
        };
      });
      return { ok: true };
    },
    [commit],
  );

  const addClient = useCallback(
    (input: ClientInput): AddClientResult => {
      const name = input.name.trim();
      if (!name) return { ok: false, message: 'Le nom du client est obligatoire.' };

      const phone = input.phone?.replace(/\D/g, '') || '';
      const current = dataRef.current;
      if (phone && current.clients.some((client) => client.phone === phone)) {
        return { ok: false, message: 'Un client avec ce numéro existe déjà.' };
      }

      const client: Client = {
        id: createId('client'),
        name,
        phone: phone || undefined,
        createdAt: new Date().toISOString(),
      };
      commit((previous) => ({
        ...previous,
        clients: [client, ...previous.clients],
        syncQueue: [
          ...previous.syncQueue,
          createQueueItem('clients', 'insert', client as unknown as Record<string, unknown>),
        ],
      }));
      return { ok: true, client };
    },
    [commit],
  );

  const sell = useCallback(
    (
      paymentType: PaymentType,
      cart: CartLine[],
      clientId?: string,
      prescriptionPhoto?: string,
    ): SellResult => {
      const current = dataRef.current;
      const lines = cart.filter((line) => line.quantity > 0);
      if (lines.length === 0) return { ok: false, message: 'Le panier est vide.' };

      const saleItems: SaleItem[] = [];
      const updatedProducts = [...current.products];
      let requiresPrescription = false;

      for (const line of lines) {
        const index = updatedProducts.findIndex((product) => product.id === line.productId);
        if (index < 0) return { ok: false, message: 'Un produit du panier est introuvable.' };
        const product = updatedProducts[index];
        if (line.quantity > product.stock) {
          return {
            ok: false,
            message: `Stock insuffisant pour ${product.name} (${product.stock} disponible${
              product.stock > 1 ? 's' : ''
            }).`,
          };
        }
        if (product.prescriptionRequired) requiresPrescription = true;
        saleItems.push({
          productId: product.id,
          name: product.name,
          emoji: product.emoji,
          quantity: line.quantity,
          unitPrice: product.salePrice,
          unitCost: product.purchasePrice,
          unit: product.unit,
        });
        updatedProducts[index] = {
          ...product,
          stock: roundQuantity(product.stock - line.quantity),
          updatedAt: new Date().toISOString(),
        };
      }

      // Blocage si ordonnance requise et photo manquante (docs/01-prd.md).
      if (requiresPrescription && !prescriptionPhoto) {
        return { ok: false, message: "Photo de l’ordonnance requise pour valider cette vente." };
      }

      if (paymentType === 'credit') {
        if (!clientId) return { ok: false, message: 'Choisissez un client pour la vente à crédit.' };
        if (!current.clients.some((client) => client.id === clientId)) {
          return { ok: false, message: 'Client introuvable.' };
        }
      }

      const total = Math.round(saleItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
      const cost = Math.round(saleItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0));
      const sale: Sale = {
        id: createId('sale'),
        items: saleItems,
        total,
        cost,
        profit: total - cost,
        paymentType,
        clientId: paymentType === 'credit' ? clientId : undefined,
        prescriptionPhoto: prescriptionPhoto || undefined,
        createdAt: new Date().toISOString(),
      };

      const queueItems: SyncQueueItem[] = [
        createQueueItem('ventes', 'insert', {
          ...sale,
          client_id: sale.clientId ?? null,
          prescription_photo: sale.prescriptionPhoto ?? null,
        }),
        ...saleItems.map((item) => {
          const product = updatedProducts.find((entry) => entry.id === item.productId);
          return createQueueItem('products', 'update', {
            id: item.productId,
            stock: product?.stock ?? 0,
            updated_at: product?.updatedAt ?? sale.createdAt,
          });
        }),
      ];

      const stockItem = createStockQueueItem(
        current.merchant?.id,
        updatedProducts,
        sale.createdAt,
      );

      commit((previous) => ({
        ...previous,
        products: updatedProducts,
        sales: [sale, ...previous.sales],
        syncQueue: [
          ...previous.syncQueue,
          ...queueItems,
          ...(stockItem ? [stockItem] : []),
        ],
      }));

      return { ok: true, sale };
    },
    [commit],
  );

  const payDebt = useCallback(
    (clientId: string, amount: number): ActionResult => {
      const current = dataRef.current;
      if (!current.clients.some((client) => client.id === clientId)) {
        return { ok: false, message: 'Client introuvable.' };
      }
      const debt = getClientDebt(current, clientId);
      const roundedAmount = Math.round(amount);
      if (roundedAmount <= 0) return { ok: false, message: 'Entrez un montant supérieur à 0.' };
      if (roundedAmount > debt) {
        return { ok: false, message: 'Le montant dépasse la dette du client.' };
      }

      const payment: DebtPayment = {
        id: createId('payment'),
        clientId,
        amount: roundedAmount,
        createdAt: new Date().toISOString(),
      };
      commit((previous) => ({
        ...previous,
        debtPayments: [payment, ...previous.debtPayments],
        syncQueue: [
          ...previous.syncQueue,
          createQueueItem(
            'debt_payments',
            'insert',
            payment as unknown as Record<string, unknown>,
          ),
        ],
      }));
      return { ok: true };
    },
    [commit],
  );

  const getDebt = useCallback(
    (clientId: string) => getClientDebt(dataRef.current, clientId),
    [],
  );

  const todayStats = useMemo(() => getTodayStats(data.sales), [data.sales]);
  const lowStockProducts = useMemo(() => getLowStockProducts(data.products), [data.products]);
  const isLoggedIn = Boolean(data.merchant && data.sessionActive);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      hydrated,
      isLoggedIn,
      pendingPhone,
      todayStats,
      lowStockProducts,
      stockSync,
      requestOtp,
      verifyOtp,
      completeOnboarding,
      login,
      logout,
      updateMode,
      addProduct,
      updateProduct,
      addClient,
      sell,
      payDebt,
      getDebt,
      syncStockNow,
    }),
    [
      data,
      hydrated,
      isLoggedIn,
      pendingPhone,
      todayStats,
      lowStockProducts,
      stockSync,
      requestOtp,
      verifyOtp,
      completeOnboarding,
      login,
      logout,
      updateMode,
      addProduct,
      updateProduct,
      addClient,
      sell,
      payDebt,
      getDebt,
      syncStockNow,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp doit être utilisé dans AppProvider.');
  return context;
}

export { isLowStock };
