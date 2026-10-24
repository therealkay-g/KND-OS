/**
 * Stockage local web (Expo Web / vérification navigateur).
 * Sur mobile et desktop Tauri, c'est storage.native.ts (SQLite) qui est utilisé.
 * La clé contient une version pour permettre les migrations locales.
 */

import { migrateAppData } from './migrate';
import type { AppData } from './types';

const STORAGE_KEY = 'knd-os:v1';

export async function loadData(): Promise<AppData | null> {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || parsed.version !== 1) return null;
    return migrateAppData(parsed);
  } catch {
    return null;
  }
}

export async function saveData(data: AppData): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Le stockage peut être plein ou bloqué (navigation privée) : l'app continue
    // en mémoire, la sync locale sera retentée à la prochaine action.
  }
}

export async function clearData(): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
