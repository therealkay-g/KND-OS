import type { Place } from './places';

/**
 * Deux fiches initiales en attente, pour la recette locale de /admin.
 * Elles ne sont jamais affichées dans l'annuaire public tant qu'elles ne sont
 * pas vérifiées. La migration Supabase contient les mêmes deux fiches.
 */
export const SEED_PENDING_PLACES: Place[] = [
  {
    id: 'alimentation-beya',
    name: 'Alimentation Beya',
    category: 'Alimentation',
    commune: 'Kasuku',
    address: 'Avenue Kasuku, près du stade',
    hours: '07:00 – 19:00',
    whatsapp: '243970000201',
    phone: '+243 970 000 201',
    lat: -2.9498,
    lng: 25.9492,
    pro: false,
    tone: 'orange',
    description: 'Farine, riz, huile et produits de première nécessité.',
    products: ['Farine de maïs', 'Riz 5 kg', 'Huile de palme', 'Savon'],
    source: 'user',
    verified: false,
    createdAt: '2026-10-21T08:00:00.000Z',
  },
  {
    id: 'salon-mwamba',
    name: 'Salon Mwamba',
    category: 'Salon',
    commune: 'Alunguli',
    address: 'Avenue de la Paix, Alunguli',
    hours: '09:00 – 20:00',
    whatsapp: '243970000202',
    phone: '+243 970 000 202',
    lat: -2.9601,
    lng: 25.9428,
    pro: false,
    tone: 'rose',
    description: 'Coiffure, tresses et soins pour femmes et enfants.',
    products: ['Tresses', 'Coupe femme', 'Manucure', 'Soin du visage'],
    source: 'user',
    verified: false,
    createdAt: '2026-10-21T09:00:00.000Z',
  },
];
