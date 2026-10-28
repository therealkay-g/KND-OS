'use client';

import { useEffect, useState } from 'react';

import {
  SEED_PLACES,
  isValidStockLive,
  type Place,
  type StockLive,
} from './places';
import {
  fetchPlaceById,
  fetchVerifiedPlaces,
  mapPlaceRow,
} from './supabase-places';
import { getSupabaseClient } from './supabase';

export type PlacesSource = 'seed' | 'bridge' | 'supabase';

export interface UsePlacesResult {
  places: Place[];
  source: PlacesSource;
  loading: boolean;
  error: string | null;
  bridgeActive: boolean;
}

const BRIDGE_POLL_MS = 2_000;
const bridgePollingEnabled =
  process.env.NEXT_PUBLIC_BRIDGE === 'true' ||
  process.env.NODE_ENV === 'development';

type Row = Record<string, unknown>;

/**
 * Source de vérité de Kindu Search :
 * 1. Supabase si les variables NEXT_PUBLIC_SUPABASE_* sont présentes ;
 * 2. sinon les 10 fiches initiales, enrichies par le pont local /api/stock-live
 *    quand KND OS tourne sans Supabase (recette locale).
 */
export function usePlaces(): UsePlacesResult {
  const supabase = getSupabaseClient();
  const [places, setPlaces] = useState<Place[]>(SEED_PLACES);
  const [source, setSource] = useState<PlacesSource>('seed');
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(null);
  const [bridgeActive, setBridgeActive] = useState(false);

  useEffect(() => {
    if (supabase) {
      let active = true;
      setLoading(true);

      fetchVerifiedPlaces(supabase)
        .then((rows) => {
          if (!active) return;
          setPlaces(rows);
          setSource('supabase');
          setError(null);
        })
        .catch((cause) => {
          if (!active) return;
          setError(
            cause instanceof Error
              ? cause.message
              : 'Supabase indisponible, données locales affichées.',
          );
          setSource('seed');
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      const channel = supabase
        .channel('kindu-search-places')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'places' },
          (payload) => {
            if (!active) return;

            if (payload.eventType === 'DELETE') {
              const oldRow = payload.old as Row;
              if (typeof oldRow.id === 'string') {
                setPlaces((previous) => previous.filter((place) => place.id !== oldRow.id));
              }
              return;
            }

            const row = payload.new as Row;
            if (typeof row.id !== 'string') return;

            if (row.est_verifie === false) {
              setPlaces((previous) => previous.filter((place) => place.id !== row.id));
              return;
            }

            const mapped = row.est_verifie === true ? mapPlaceRow(row) : null;
            if (mapped) {
              setSource('supabase');
              setPlaces((previous) => {
                const exists = previous.some((place) => place.id === mapped.id);
                return exists
                  ? previous.map((place) => (place.id === mapped.id ? mapped : place))
                  : [...previous, mapped];
              });
              return;
            }

            // Payload partiel : on recharge la fiche complète.
            void fetchPlaceById(supabase, row.id)
              .then((fetched) => {
                if (!active || !fetched) return;
                setSource('supabase');
                setPlaces((previous) => {
                  const exists = previous.some((place) => place.id === fetched.id);
                  return exists
                    ? previous.map((place) => (place.id === fetched.id ? fetched : place))
                    : [...previous, fetched];
                });
              })
              .catch(() => {
                // Le prochain événement ou rechargement corrigera l'état.
              });
          },
        )
        .subscribe((status) => {
          if (!active) return;
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setError('Temps réel Supabase indisponible, actualisez la page.');
          }
        });

      return () => {
        active = false;
        void supabase.removeChannel(channel);
      };
    }

    if (!bridgePollingEnabled) {
      setLoading(false);
      return;
    }

    let active = true;

    const pollBridge = async () => {
      try {
        const response = await fetch('/api/stock-live', { cache: 'no-store' });
        if (!response.ok) throw new Error('Pont de démonstration indisponible.');

        const payload = (await response.json()) as {
          places?: Array<{ placeId?: unknown; stockLive?: unknown }>;
        };

        if (!active) return;

        const updates = new Map<string, StockLive>();
        for (const entry of payload.places ?? []) {
          if (
            typeof entry.placeId === 'string' &&
            isValidStockLive(entry.stockLive)
          ) {
            updates.set(entry.placeId, entry.stockLive);
          }
        }

        if (updates.size > 0) {
          setBridgeActive(true);
          setSource('bridge');
          setPlaces((previous) =>
            previous.map((place) => {
              const stockLive = updates.get(place.id);
              return stockLive ? { ...place, stockLive } : place;
            }),
          );
        }

        setError(null);
      } catch {
        if (active) {
          setError('Pont de démonstration indisponible.');
        }
      }
    };

    void pollBridge();
    const timer = window.setInterval(() => {
      void pollBridge();
    }, BRIDGE_POLL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [supabase]);

  return { places, source, loading, error, bridgeActive };
}
