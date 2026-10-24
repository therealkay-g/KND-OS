/**
 * Formatage français : montants en CDF, quantités et dates.
 */

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/** 15000 -> "15 000 CDF" (espace simple, lisible sur petits écrans). */
export function formatCDF(amount: number): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  return `${formatNumber(rounded)} CDF`;
}

/** 1500 -> "1 500" */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** 2.5 -> "2,5" — 2 -> "2" */
export function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, '').replace('.', ',');
}

/** Affichage compact pour le graphique : 15000 -> "15k" */
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${formatQuantity(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(Math.round(amount));
}

/** "SAC" -> "sac"/"sacs", "BARRE 12m" -> "barre"/"barres", "KG" -> "kg"... */
export function formatUnit(unit: string, plural = false): string {
  switch (unit) {
    case 'PIECE':
      return plural ? 'pièces' : 'pièce';
    case 'SAC':
      return plural ? 'sacs' : 'sac';
    case 'BARRE 12m':
      return plural ? 'barres' : 'barre';
    case 'ROULEAU':
      return plural ? 'rouleaux' : 'rouleau';
    case 'KG':
      return 'kg';
    case 'METRE':
      return 'm';
    default: {
      // Unité libre : pluriel simple (cartons, bidons…), sans toucher aux
      // abréviations (L, M2) ni aux libellés de plusieurs mots.
      const label = unit.trim().toLowerCase();
      if (!plural || label.length <= 2 || label.includes(' ') || /[sxz]$/.test(label)) {
        return label;
      }
      if (/eau$/.test(label)) return `${label}x`;
      return `${label}s`;
    }
  }
}

/** 1 sac = 50 kg (docs/01-prd.md : « 45 sacs (2250kg) »). */
export const KG_PER_SAC = 50;
/** 1 barre = 12 m (unité « BARRE 12m »). */
export const METERS_PER_BAR = 12;

/**
 * 24 -> "24" ; 2.5 -> "2,5 kg" ; 7.5 barres -> "7,5 barres (90 m)" ;
 * 45 sacs -> "45 sacs (2 250 kg)" (docs/01-prd.md).
 */
export function formatStock(stock: number, unit: string): string {
  const quantity = formatQuantity(stock);
  if (unit === 'PIECE') return quantity;
  const label = `${quantity} ${formatUnit(unit, stock >= 2)}`;
  if (unit === 'BARRE 12m') {
    return `${label} (${formatQuantity(stock * METERS_PER_BAR)} m)`;
  }
  if (unit === 'SAC') {
    const kilograms = stock * KG_PER_SAC;
    const kgLabel = Number.isInteger(kilograms) ? formatNumber(kilograms) : formatQuantity(kilograms);
    return `${label} (${kgLabel} kg)`;
  }
  return label;
}

export function formatShortDate(iso: string): string {
  return format(new Date(iso), 'd MMM yyyy', { locale: fr });
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), "d MMM yyyy '·' HH:mm", { locale: fr });
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm', { locale: fr });
}

export function formatLongDate(date: Date = new Date()): string {
  const formatted = format(date, 'EEEE d MMMM', { locale: fr });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** "+243 97 000 0000" à partir de "970000000". */
export function formatPhone(phone?: string): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 9) return phone;
  return `+243 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatCountLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatQuantity(count)} ${count > 1 ? plural : singular}`;
}

/** "2026-11-20" -> "20 nov. 2026" (mode Pharmacie). */
export function formatExpiryDate(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy', { locale: fr });
}

/** "Expire dans 33j" / "Expire aujourd'hui" / "Expiré depuis 2j". */
export function formatExpiryLabel(days: number): string {
  if (days === 0) return "Expire aujourd'hui";
  if (days > 0) return `Expire dans ${days}j`;
  return `Expiré depuis ${Math.abs(days)}j`;
}
