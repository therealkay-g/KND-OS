import seedData from '@/data/places.json';

export type Category =
  | 'Resto'
  | 'Hôtel'
  | 'Pharmacie'
  | 'Quincaillerie'
  | 'Magasin'
  | 'Alimentation'
  | 'Salon'
  | 'Location';

export type Commune = 'Kasuku' | 'Alunguli' | 'Mikelenge';

export type Tone =
  | 'amber'
  | 'green'
  | 'rose'
  | 'blue'
  | 'violet'
  | 'orange'
  | 'teal'
  | 'slate';

export interface StockLiveProduct {
  id: string;
  name: string;
  stock: number;
  unit: string;
  price: number;
}

export interface StockLive {
  /** Date ISO de la dernière mise à jour du stock. */
  updatedAt: string;
  products: StockLiveProduct[];
}

export type PlaceSource = 'seed' | 'supabase' | 'user';

export interface Place {
  id: string;
  name: string;
  category: Category;
  commune: Commune;
  address: string;
  hours: string;
  /** Numéro WhatsApp au format international, sans « + » (ex. 243970000101). */
  whatsapp: string;
  phone: string;
  lat: number;
  lng: number;
  pro: boolean;
  tone: Tone;
  description: string;
  products: string[];
  /** Photo importée par le commerçant (data URL), optionnelle. */
  photo?: string;
  source?: PlaceSource;
  createdAt?: string;
  /** Identifiant du commerce dans KND OS. */
  merchantId?: string;
  /** Snapshot de stock envoyé par KND OS (commerces Pro). */
  stockLive?: StockLive | null;
  updatedAt?: string;
  /** Fiche vérifiée par l'admin Kay. Les fiches initiales sont vérifiées. */
  verified?: boolean;
}

export const CATEGORIES: Category[] = [
  'Resto',
  'Hôtel',
  'Pharmacie',
  'Quincaillerie',
  'Magasin',
  'Alimentation',
  'Salon',
  'Location',
];

export const COMMUNES: Commune[] = ['Kasuku', 'Alunguli', 'Mikelenge'];

export const CATEGORY_EMOJI: Record<Category, string> = {
  Resto: '🍽️',
  Hôtel: '🛏️',
  Pharmacie: '💊',
  Quincaillerie: '🔧',
  Magasin: '🛍️',
  Alimentation: '🍎',
  Salon: '✂️',
  Location: '🏠',
};

export const CATEGORY_TONE: Record<Category, Tone> = {
  Resto: 'rose',
  Hôtel: 'blue',
  Pharmacie: 'green',
  Quincaillerie: 'amber',
  Magasin: 'violet',
  Alimentation: 'orange',
  Salon: 'rose',
  Location: 'teal',
};

export const TONES: Tone[] = [
  'amber',
  'green',
  'rose',
  'blue',
  'violet',
  'orange',
  'teal',
  'slate',
];

export const KINDU_CENTER: [number, number] = [-2.95, 25.95];

const COMMUNE_CENTERS: Record<Commune, [number, number]> = {
  Kasuku: [-2.948, 25.953],
  Alunguli: [-2.958, 25.94],
  Mikelenge: [-2.944, 25.938],
};

/** 10 commerces de départ (06-plan.md, Étape 4). */
const SEED_STOCK_UPDATED_AT = new Date().toISOString();

export const SEED_PLACES: Place[] = (seedData as unknown as Place[]).map((place) => ({
  ...place,
  source: 'seed',
  verified: true,
  // Les fiches initiales n'ont pas de backend : leur stock est considéré comme
  // frais à l'ouverture, pour illustrer le badge « Stock vérifié Live ».
  stockLive: place.stockLive
    ? { ...place.stockLive, updatedAt: SEED_STOCK_UPDATED_AT }
    : undefined,
}));

/**
 * Une fiche est en attente tant que l'admin ne l'a pas vérifiée. Les anciennes
 * fiches locales (Étape 4) n'ont pas encore le drapeau : elles restent en attente.
 */
export function isPlacePending(place: Place): boolean {
  return place.verified === false || (place.verified === undefined && place.source === 'user');
}

export const USER_PLACES_KEY = 'kindu-search:places:v1';
export const USER_PLACES_EVENT = 'kindu-search:places-updated';

export const QUICK_SEARCHES = ['ciment', 'paracétamol', 'riz', 'tresses'];

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesQuery(place: Place, query: string): boolean {
  const normalized = normalizeText(query);
  if (!normalized) return true;

  const haystack = normalizeText(
    [
      place.name,
      place.category,
      place.commune,
      place.address,
      place.description,
      ...place.products,
      ...(place.stockLive?.products.map((product) => product.name) ?? []),
    ].join(' '),
  );

  return normalized.split(/\s+/).every((token) => haystack.includes(token));
}

export interface PlaceFilters {
  query: string;
  category: Category | 'Toutes';
  commune: Commune | 'Toutes';
}

export function filterPlaces(places: Place[], filters: PlaceFilters): Place[] {
  return [...places]
    .filter((place) => {
      if (filters.category !== 'Toutes' && place.category !== filters.category) return false;
      if (filters.commune !== 'Toutes' && place.commune !== filters.commune) return false;
      return matchesQuery(place, filters.query);
    })
    .sort((a, b) => {
      const rank = (place: Place) => {
        if (place.source === 'user') return 3;
        if (place.pro && place.stockLive) return 0;
        if (place.pro) return 1;
        return 2;
      };
      return rank(a) - rank(b) || a.name.localeCompare(b.name, 'fr');
    });
}

export interface OpenStatus {
  open: boolean;
  label: string;
}

export interface StockFreshness {
  live: boolean;
  ageDays: number;
  label: string;
  shortLabel: string;
}

const STOCK_LIVE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function formatStockQuantity(stock: number, unit: string): string {
  const quantity = Number.isInteger(stock)
    ? String(stock)
    : stock.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
  const plural = stock >= 2;

  switch (unit) {
    case 'PIECE':
      return `${quantity} ${plural ? 'pièces' : 'pièce'}`;
    case 'SAC':
      return `${quantity} ${plural ? 'sacs' : 'sac'}`;
    case 'BARRE 12m':
      return `${quantity} ${plural ? 'barres' : 'barre'}`;
    case 'ROULEAU':
      return `${quantity} ${plural ? 'rouleaux' : 'rouleau'}`;
    case 'KG':
      return `${quantity} kg`;
    case 'METRE':
      return `${quantity} m`;
    default: {
      const label = unit.trim().toLowerCase();
      if (!plural || label.length <= 2 || label.includes(' ') || /[sxz]$/.test(label)) {
        return `${quantity} ${label}`;
      }
      return `${quantity} ${label}s`;
    }
  }
}

/** 35000 -> « 35 000 CDF ». */
export function formatCDF(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${digits} CDF`;
}

export function isValidStockLive(value: unknown): value is StockLive {
  if (!value || typeof value !== 'object') return false;
  const stock = value as Record<string, unknown>;
  if (typeof stock.updatedAt !== 'string' || !Array.isArray(stock.products)) return false;

  return stock.products.every((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const product = entry as Record<string, unknown>;
    return (
      typeof product.id === 'string' &&
      typeof product.name === 'string' &&
      typeof product.stock === 'number' &&
      typeof product.unit === 'string' &&
      typeof product.price === 'number'
    );
  });
}

/**
 * Badge docs/01-prd.md : « Stock Vérifié Live » vert si Pro + MAJ < 24h,
 * sinon « Stock d'il y a X jours ».
 */
export function getStockFreshness(place: Place, now: Date | null): StockFreshness | null {
  if (!place.pro || !place.stockLive || !isValidStockLive(place.stockLive) || !now) {
    return null;
  }

  const updatedAt = Date.parse(place.stockLive.updatedAt);
  if (!Number.isFinite(updatedAt)) {
    return { live: false, ageDays: 0, label: 'Stock non daté', shortLabel: 'Non daté' };
  }

  const ageMs = Math.max(0, now.getTime() - updatedAt);
  if (ageMs < STOCK_LIVE_MAX_AGE_MS) {
    return { live: true, ageDays: 0, label: 'Stock vérifié Live', shortLabel: 'Live' };
  }

  const ageDays = Math.max(1, Math.floor(ageMs / DAY_MS));
  return {
    live: false,
    ageDays,
    label: `Stock d'il y a ${ageDays} jour${ageDays > 1 ? 's' : ''}`,
    shortLabel: `${ageDays} j`,
  };
}

/** Résumé court pour les cards et popups : « 44 sacs · 30 barres ». */
export function getLiveStockSummary(place: Place, maxProducts = 2): string | null {
  const products = place.stockLive?.products.filter((product) => product.stock > 0) ?? [];
  if (products.length === 0) return null;
  return products
    .slice(0, maxProducts)
    .map((product) => formatStockQuantity(product.stock, product.unit))
    .join(' · ');
}

export function formatStockAge(place: Place, now: Date | null): string | null {
  if (!place.stockLive || !now) return null;
  const updatedAt = Date.parse(place.stockLive.updatedAt);
  if (!Number.isFinite(updatedAt)) return null;

  const minutes = Math.max(0, Math.floor((now.getTime() - updatedAt) / 60_000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
}

/**
 * Horaires simples « 08:00 – 18:00 » ou « 24h/24 ».
 * Kindu est à UTC+2 (heure d'Afrique centrale).
 */
export function getOpenStatus(hours: string, now: Date | null): OpenStatus | null {
  if (!now) return null;
  if (/24\s*h/i.test(hours)) return { open: true, label: 'Ouvert 24h/24' };

  const match = hours.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  const kinduTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const minutes = kinduTime.getUTCHours() * 60 + kinduTime.getUTCMinutes();
  const open =
    start <= end
      ? minutes >= start && minutes < end
      : minutes >= start || minutes < end;

  return { open, label: open ? 'Ouvert' : 'Fermé' };
}

export function formatPhone(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  const local = digits.startsWith('243') ? digits.slice(3) : digits;
  if (local.length !== 9) return whatsapp;
  return `+243 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 9)}`;
}

/** Évite de répéter la commune ou Kindu si l'adresse les contient déjà. */
export function formatAddress(place: Place): string {
  const address = place.address.trim().replace(/,\s*$/, '');
  const normalized = normalizeText(address);
  const parts: string[] = address ? [address] : [];
  if (!normalized.includes(normalizeText(place.commune))) parts.push(place.commune);
  if (!normalized.includes('kindu')) parts.push('Kindu');
  return parts.join(', ');
}

export function whatsappHref(place: Place): string {
  const message = `Bonjour ${place.name}, je vous ai trouvé sur Kindu Search. Êtes-vous disponible ?`;
  return `https://wa.me/${place.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

export function phoneHref(place: Place): string {
  return `tel:+${place.whatsapp.replace(/\D/g, '')}`;
}

export function directionsHref(place: Place): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
}

/** Accepte 9 chiffres locaux, 0 + 9 chiffres ou 243 + 9 chiffres. */
export function normalizeWhatsAppInput(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('243')) local = local.slice(3);
  if (local.startsWith('0')) local = local.slice(1);
  if (local.length !== 9) return null;
  return `243${local}`;
}

export function approximateCoordinates(commune: Commune): { lat: number; lng: number } {
  const [lat, lng] = COMMUNE_CENTERS[commune];
  return {
    lat: lat + (Math.random() - 0.5) * 0.006,
    lng: lng + (Math.random() - 0.5) * 0.006,
  };
}

export function createPlaceId(): string {
  return `place-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function isPlace(value: unknown): value is Place {
  if (!value || typeof value !== 'object') return false;
  const place = value as Record<string, unknown>;

  return (
    typeof place.id === 'string' &&
    typeof place.name === 'string' &&
    typeof place.category === 'string' &&
    CATEGORIES.includes(place.category as Category) &&
    typeof place.commune === 'string' &&
    COMMUNES.includes(place.commune as Commune) &&
    typeof place.address === 'string' &&
    typeof place.hours === 'string' &&
    typeof place.whatsapp === 'string' &&
    typeof place.phone === 'string' &&
    typeof place.lat === 'number' &&
    typeof place.lng === 'number' &&
    typeof place.pro === 'boolean' &&
    typeof place.tone === 'string' &&
    TONES.includes(place.tone as Tone) &&
    typeof place.description === 'string' &&
    Array.isArray(place.products) &&
    place.products.every((product) => typeof product === 'string') &&
    (place.photo === undefined || typeof place.photo === 'string') &&
    (place.merchantId === undefined || typeof place.merchantId === 'string') &&
    (place.stockLive === undefined ||
      place.stockLive === null ||
      isValidStockLive(place.stockLive)) &&
    (place.verified === undefined || typeof place.verified === 'boolean')
  );
}

export function loadUserPlaces(): Place[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USER_PLACES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isPlace)
      .map((place) => ({
        ...place,
        source: 'user',
        verified: place.verified === true,
      }));
  } catch {
    return [];
  }
}

export function saveUserPlace(place: Place): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const existing = loadUserPlaces().filter((item) => item.id !== place.id);
    window.localStorage.setItem(
      USER_PLACES_KEY,
      JSON.stringify([
        { ...place, source: 'user', verified: place.verified === true },
        ...existing,
      ]),
    );
    window.dispatchEvent(new Event(USER_PLACES_EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Marque une fiche locale comme vérifiée (ou de nouveau en attente). */
export function setUserPlaceVerified(id: string, verified: boolean): boolean {
  const place = loadUserPlaces().find((item) => item.id === id);
  if (!place) return false;
  return saveUserPlace({ ...place, verified });
}

/** Retire une fiche locale (refus admin ou suppression). */
export function removeUserPlace(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const next = loadUserPlaces().filter((item) => item.id !== id);
    window.localStorage.setItem(USER_PLACES_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(USER_PLACES_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function findPlace(
  id: string,
  userPlaces: Place[],
  places: Place[] = SEED_PLACES,
): Place | null {
  return (
    places.find((place) => place.id === id) ??
    userPlaces.find((place) => place.id === id) ??
    null
  );
}
