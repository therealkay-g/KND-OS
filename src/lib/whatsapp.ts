/**
 * Liens WhatsApp (wa.me).
 *
 * Aucun envoi automatique : on ouvre WhatsApp avec un message pré-rempli,
 * puis l'utilisateur valide l'envoi. Compatible web, PWA et APK Capacitor.
 */

import { Linking, Platform } from 'react-native';

import { formatCDF, formatDateTime, formatQuantity, formatUnit } from './format';
import type { Sale } from './types';

/**
 * Normalise un numéro pour wa.me.
 * RD Congo : 9 chiffres (ex. 970000000) → 243970000000.
 */
export function whatsappNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 9) return `243${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `243${digits.slice(1)}`;
  if (digits.startsWith('243') && digits.length >= 11) return digits;
  if (digits.length >= 8) return digits;
  return null;
}

export function whatsappUrl(phone: string, message: string): string | null {
  const number = whatsappNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Ouvre WhatsApp. Retourne false si le numéro est invalide ou l'ouverture échoue. */
export async function openWhatsApp(phone: string, message: string): Promise<boolean> {
  const url = whatsappUrl(phone, message);
  if (!url) return false;

  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const capacitor = (
        window as unknown as {
          Capacitor?: { isNativePlatform?: () => boolean };
        }
      ).Capacitor;
      // WebView Capacitor : `window.open` n'ouvre pas de nouvel onglet. On
      // navigue vers l'URL externe, que Capacitor confie au système.
      if (capacitor?.isNativePlatform?.()) {
        window.location.assign(url);
        return true;
      }
      const popup = window.open(url, '_blank', 'noopener,noreferrer');
      if (popup) return true;
      window.location.assign(url);
      return true;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Message récapitulatif d'un ticket de vente. */
export function saleWhatsAppMessage(storeName: string, sale: Sale): string {
  const lines = sale.items.map((item) => {
    const quantity = `${formatQuantity(item.quantity)} ${formatUnit(item.unit, item.quantity > 1)}`;
    const lineTotal = formatCDF(Math.round(item.quantity * item.unitPrice));
    return `• ${item.name} — ${quantity} × ${formatCDF(item.unitPrice)} = ${lineTotal}`;
  });

  return [
    `*${storeName}*`,
    `Ticket du ${formatDateTime(sale.createdAt)}`,
    '',
    ...lines,
    '',
    `*TOTAL : ${formatCDF(sale.total)}*`,
    sale.paymentType === 'credit' ? 'Vente à crédit' : 'Payé en espèces',
    '',
    'Merci pour votre confiance !',
    'Kindu · RDC',
  ].join('\n');
}

/** Message de relance d'une dette client. */
export function debtReminderMessage(
  storeName: string,
  clientName: string,
  debt: number,
): string {
  return [
    `Bonjour ${clientName},`,
    '',
    `Un solde de *${formatCDF(debt)}* reste à régler chez *${storeName}*.`,
    'Merci de passer quand vous pouvez.',
    '',
    `${storeName} · Kindu`,
  ].join('\n');
}

/** Message de prise de contact simple. */
export function contactMessage(storeName: string, clientName: string): string {
  return [
    `Bonjour ${clientName},`,
    '',
    `Ici ${storeName} (Kindu). Nous restons à votre disposition.`,
    '',
    'Merci !',
  ].join('\n');
}
