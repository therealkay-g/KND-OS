/**
 * Stockage local mobile/desktop : SQLite (expo-sqlite), source de vérité hors ligne.
 * Le web de développement utilise storage.ts (localStorage) car le bundle WASM
 * de SQLite n'est pas nécessaire pour la vérification navigateur.
 *
 * Tables créées conformément à 06-plan.md : products, clients, ventes (sales),
 * sale_items, debt_payments et sync_queue.
 */

import * as SQLite from 'expo-sqlite';

import { migrateAppData } from './migrate';
import type { AppData, Merchant, Product, Sale, SaleItem, SyncQueueItem } from './types';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const database = await SQLite.openDatabaseAsync('knd-os.db');
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          barcode TEXT,
          purchase_price REAL NOT NULL,
          sale_price REAL NOT NULL,
          stock REAL NOT NULL,
          unit TEXT NOT NULL,
          emoji TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY NOT NULL,
          client_id TEXT,
          total REAL NOT NULL,
          cost REAL NOT NULL,
          profit REAL NOT NULL,
          payment_type TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sale_items (
          id TEXT PRIMARY KEY NOT NULL,
          sale_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          name TEXT NOT NULL,
          emoji TEXT NOT NULL,
          quantity REAL NOT NULL,
          unit_price REAL NOT NULL,
          unit_cost REAL NOT NULL,
          unit TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS debt_payments (
          id TEXT PRIMARY KEY NOT NULL,
          client_id TEXT NOT NULL,
          amount REAL NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY NOT NULL,
          table_name TEXT NOT NULL,
          action TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL,
          synced INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
        CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
        CREATE INDEX IF NOT EXISTS idx_debt_payments_client_id ON debt_payments(client_id);
      `);
      return database;
    })();
  }
  return databasePromise;
}

interface MetaRow {
  key: string;
  value: string;
}

interface ProductRow {
  id: string;
  name: string;
  barcode: string | null;
  purchase_price: number;
  sale_price: number;
  stock: number;
  unit: Product['unit'];
  emoji: string;
  created_at: string;
  updated_at: string;
}

interface ClientRow {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
}

interface SaleRow {
  id: string;
  client_id: string | null;
  total: number;
  cost: number;
  profit: number;
  payment_type: Sale['paymentType'];
  created_at: string;
}

interface SaleItemRow {
  id: string;
  sale_id: string;
  product_id: string;
  name: string;
  emoji: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  unit: SaleItem['unit'];
}

interface DebtPaymentRow {
  id: string;
  client_id: string;
  amount: number;
  created_at: string;
}

interface SyncQueueRow {
  id: string;
  table_name: string;
  action: SyncQueueItem['action'];
  payload: string;
  created_at: string;
  synced: number;
}

export async function loadData(): Promise<AppData | null> {
  const database = await getDatabase();
  const metaRows = await database.getAllAsync<MetaRow>('SELECT key, value FROM meta');
  const meta = new Map(metaRows.map((row) => [row.key, row.value]));

  if (meta.get('initialized') !== '1') return null;

  const merchantValue = meta.get('merchant');
  const merchant: Merchant | null = merchantValue ? (JSON.parse(merchantValue) as Merchant) : null;

  const productRows = await database.getAllAsync<ProductRow>('SELECT * FROM products ORDER BY created_at ASC');
  const clientRows = await database.getAllAsync<ClientRow>('SELECT * FROM clients ORDER BY created_at ASC');
  const saleRows = await database.getAllAsync<SaleRow>('SELECT * FROM sales ORDER BY created_at ASC');
  const saleItemRows = await database.getAllAsync<SaleItemRow>('SELECT * FROM sale_items ORDER BY rowid ASC');
  const debtRows = await database.getAllAsync<DebtPaymentRow>(
    'SELECT * FROM debt_payments ORDER BY created_at ASC',
  );
  const queueRows = await database.getAllAsync<SyncQueueRow>(
    'SELECT * FROM sync_queue ORDER BY created_at ASC',
  );

  const itemsBySale = new Map<string, SaleItem[]>();
  for (const row of saleItemRows) {
    const item: SaleItem = {
      productId: row.product_id,
      name: row.name,
      emoji: row.emoji,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      unitCost: row.unit_cost,
      unit: row.unit,
    };
    const current = itemsBySale.get(row.sale_id) ?? [];
    current.push(item);
    itemsBySale.set(row.sale_id, current);
  }

  return migrateAppData({
    version: 1,
    merchant,
    sessionActive: meta.get('session_active') === '1',
    products: productRows.map((row) => ({
      id: row.id,
      name: row.name,
      barcode: row.barcode ?? undefined,
      purchasePrice: row.purchase_price,
      salePrice: row.sale_price,
      stock: row.stock,
      unit: row.unit,
      emoji: row.emoji,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    clients: clientRows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone ?? undefined,
      createdAt: row.created_at,
    })),
    sales: saleRows.map((row) => ({
      id: row.id,
      clientId: row.client_id ?? undefined,
      total: row.total,
      cost: row.cost,
      profit: row.profit,
      paymentType: row.payment_type,
      items: itemsBySale.get(row.id) ?? [],
      createdAt: row.created_at,
    })),
    debtPayments: debtRows.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      amount: row.amount,
      createdAt: row.created_at,
    })),
    syncQueue: queueRows.map((row) => ({
      id: row.id,
      tableName: row.table_name,
      action: row.action,
      payload: JSON.parse(row.payload) as Record<string, unknown>,
      createdAt: row.created_at,
      synced: row.synced === 1,
    })),
  });
}

/**
 * Snapshot transactionnel. Les volumes de l'Étape 1 sont faibles ; la sync
 * incrémentale sera ajoutée à l'Étape 5 avec Supabase.
 */
export async function saveData(data: AppData): Promise<void> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM sale_items');
    await database.runAsync('DELETE FROM sales');
    await database.runAsync('DELETE FROM debt_payments');
    await database.runAsync('DELETE FROM products');
    await database.runAsync('DELETE FROM clients');
    await database.runAsync('DELETE FROM sync_queue');

    for (const product of data.products) {
      await database.runAsync(
        `INSERT INTO products
          (id, name, barcode, purchase_price, sale_price, stock, unit, emoji, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        product.id,
        product.name,
        product.barcode ?? null,
        product.purchasePrice,
        product.salePrice,
        product.stock,
        product.unit,
        product.emoji,
        product.createdAt,
        product.updatedAt,
      );
    }

    for (const client of data.clients) {
      await database.runAsync(
        'INSERT INTO clients (id, name, phone, created_at) VALUES (?, ?, ?, ?)',
        client.id,
        client.name,
        client.phone ?? null,
        client.createdAt,
      );
    }

    for (const sale of data.sales) {
      await database.runAsync(
        `INSERT INTO sales (id, client_id, total, cost, profit, payment_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        sale.id,
        sale.clientId ?? null,
        sale.total,
        sale.cost,
        sale.profit,
        sale.paymentType,
        sale.createdAt,
      );
      for (const [index, item] of sale.items.entries()) {
        await database.runAsync(
          `INSERT INTO sale_items
            (id, sale_id, product_id, name, emoji, quantity, unit_price, unit_cost, unit)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          `${sale.id}-item-${index}`,
          sale.id,
          item.productId,
          item.name,
          item.emoji,
          item.quantity,
          item.unitPrice,
          item.unitCost,
          item.unit,
        );
      }
    }

    for (const payment of data.debtPayments) {
      await database.runAsync(
        'INSERT INTO debt_payments (id, client_id, amount, created_at) VALUES (?, ?, ?, ?)',
        payment.id,
        payment.clientId,
        payment.amount,
        payment.createdAt,
      );
    }

    for (const item of data.syncQueue) {
      await database.runAsync(
        `INSERT INTO sync_queue (id, table_name, action, payload, created_at, synced)
         VALUES (?, ?, ?, ?, ?, ?)`,
        item.id,
        item.tableName,
        item.action,
        JSON.stringify(item.payload),
        item.createdAt,
        item.synced ? 1 : 0,
      );
    }

    const meta: Array<[string, string]> = [
      ['initialized', '1'],
      ['merchant', data.merchant ? JSON.stringify(data.merchant) : ''],
      ['session_active', data.sessionActive ? '1' : '0'],
    ];
    for (const [key, value] of meta) {
      await database.runAsync(
        'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key,
        value,
      );
    }
  });
}

export async function clearData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM sale_items;
    DELETE FROM sales;
    DELETE FROM debt_payments;
    DELETE FROM products;
    DELETE FROM clients;
    DELETE FROM sync_queue;
    DELETE FROM meta;
  `);
}
