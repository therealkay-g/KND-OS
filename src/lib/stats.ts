/**
 * Calculs locaux : bénéfice, dettes, séries de 7 jours.
 * Aucune donnée bancaire : le bénéfice est vente - achat (docs/01-prd.md).
 */

import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';

import type { AppData, Product, Sale } from './types';

export interface PeriodStats {
  total: number;
  profit: number;
  count: number;
}

export function isSaleToday(sale: Sale, reference: Date = new Date()): boolean {
  const created = new Date(sale.createdAt);
  return created >= startOfDay(reference) && created <= endOfDay(reference);
}

export function salesBetween(sales: Sale[], start: Date, end: Date): Sale[] {
  return sales.filter((sale) => {
    const created = new Date(sale.createdAt);
    return created >= start && created <= end;
  });
}

export function sumSales(sales: Sale[]): PeriodStats {
  return sales.reduce<PeriodStats>(
    (accumulator, sale) => ({
      total: accumulator.total + sale.total,
      profit: accumulator.profit + sale.profit,
      count: accumulator.count + 1,
    }),
    { total: 0, profit: 0, count: 0 },
  );
}

export function getTodayStats(sales: Sale[], reference: Date = new Date()): PeriodStats {
  return sumSales(sales.filter((sale) => isSaleToday(sale, reference)));
}

export function getWeekStats(sales: Sale[], reference: Date = new Date()): PeriodStats {
  const start = startOfWeek(reference, { weekStartsOn: 1 });
  return sumSales(salesBetween(sales, start, endOfDay(reference)));
}

export function getMonthStats(sales: Sale[], reference: Date = new Date()): PeriodStats {
  const start = startOfMonth(reference);
  return sumSales(salesBetween(sales, start, endOfDay(reference)));
}

export interface DayProfit {
  date: Date;
  label: string;
  profit: number;
  total: number;
}

const DAY_LABELS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

export function getLastSevenDays(sales: Sale[], reference: Date = new Date()): DayProfit[] {
  const today = startOfDay(reference);
  const days = eachDayOfInterval({ start: subDays(today, 6), end: today });
  return days.map((day) => {
    const daySales = salesBetween(sales, startOfDay(day), endOfDay(day));
    const totals = sumSales(daySales);
    return {
      date: day,
      label: DAY_LABELS[day.getDay()],
      profit: totals.profit,
      total: totals.total,
    };
  });
}

export function getClientDebt(data: Pick<AppData, 'sales' | 'debtPayments'>, clientId: string): number {
  const credit = data.sales
    .filter((sale) => sale.clientId === clientId && sale.paymentType === 'credit')
    .reduce((sum, sale) => sum + sale.total, 0);
  const paid = data.debtPayments
    .filter((payment) => payment.clientId === clientId)
    .reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(0, Math.round(credit - paid));
}

export function getTotalDebt(data: Pick<AppData, 'sales' | 'debtPayments'>, clients: AppData['clients']): number {
  return clients.reduce((sum, client) => sum + getClientDebt(data, client.id), 0);
}

export function countClientsWithDebt(
  data: Pick<AppData, 'sales' | 'debtPayments'>,
  clients: AppData['clients'],
): number {
  return clients.filter((client) => getClientDebt(data, client.id) > 0).length;
}

/**
 * Seuil d'alerte provisoire : le PRD ne fixe pas de seuil.
 * [À CONFIRMER] auprès de Kay — 5 unités pour la V1 test Kasuku.
 */
export const LOW_STOCK_THRESHOLD = 5;

export function isLowStock(stock: number): boolean {
  return stock <= LOW_STOCK_THRESHOLD;
}

export function getLowStockProducts(products: AppData['products']): AppData['products'] {
  return products.filter((product) => isLowStock(product.stock));
}

/**
 * Alerte péremption (docs/01-prd.md) : rouge sous 30 jours, orange de 30 à 60 jours.
 * Un produit déjà périmé reste en rouge.
 */
export type ExpiryLevel = 'expired' | 'critical' | 'soon';

export interface ExpiryStatus {
  /** Jours restants (négatif si déjà périmé). */
  days: number;
  level: ExpiryLevel;
}

export const EXPIRY_RED_DAYS = 30;
export const EXPIRY_ORANGE_DAYS = 60;

export function getExpiryStatus(
  expiryDate?: string,
  reference: Date = new Date(),
): ExpiryStatus | null {
  if (!expiryDate) return null;
  const parsed = parseISO(expiryDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const days = differenceInCalendarDays(parsed, startOfDay(reference));
  if (days < 0) return { days, level: 'expired' };
  if (days < EXPIRY_RED_DAYS) return { days, level: 'critical' };
  if (days < EXPIRY_ORANGE_DAYS) return { days, level: 'soon' };
  return null;
}

export interface ExpiringProduct {
  product: Product;
  status: ExpiryStatus;
}

/** Produits en alerte péremption (< 60 jours), les plus urgents d'abord. */
export function getExpiringProducts(
  products: Product[],
  reference: Date = new Date(),
): ExpiringProduct[] {
  return products
    .map((product) => {
      const status = getExpiryStatus(product.expiryDate, reference);
      return status ? { product, status } : null;
    })
    .filter((entry): entry is ExpiringProduct => entry !== null)
    .sort((a, b) => a.status.days - b.status.days);
}

/** Nombre de produits en alerte rouge : périmés ou à moins de 30 jours (dashboard). */
export function countExpiringSoon(products: Product[], reference: Date = new Date()): number {
  return products.filter((product) => {
    const status = getExpiryStatus(product.expiryDate, reference);
    return status !== null && status.level !== 'soon';
  }).length;
}
