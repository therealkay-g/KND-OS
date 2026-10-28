'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MapPin, RotateCcw } from 'lucide-react';

import { CategoryGrid } from '@/components/category-grid';
import { CommuneFilter } from '@/components/commune-filter';
import { EmptyState } from '@/components/empty-state';
import { PlaceCard } from '@/components/place-card';
import { SearchBar } from '@/components/search-bar';
import { ViewToggle, type ViewMode } from '@/components/view-toggle';
import {
  QUICK_SEARCHES,
  USER_PLACES_EVENT,
  filterPlaces,
  loadUserPlaces,
  type Category,
  type Commune,
  type Place,
} from '@/lib/places';
import { usePlaces } from '@/lib/use-places';
import { useNow } from '@/lib/use-now';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <div className="map-loading">Chargement de la carte…</div>,
});

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'Toutes'>('Toutes');
  const [commune, setCommune] = useState<Commune | 'Toutes'>('Toutes');
  const [view, setView] = useState<ViewMode>('map');
  const [userPlaces, setUserPlaces] = useState<Place[]>([]);
  const { places, source } = usePlaces();
  const now = useNow();

  useEffect(() => {
    const refreshUserPlaces = () => setUserPlaces(loadUserPlaces());
    refreshUserPlaces();
    window.addEventListener(USER_PLACES_EVENT, refreshUserPlaces);
    window.addEventListener('storage', refreshUserPlaces);
    return () => {
      window.removeEventListener(USER_PLACES_EVENT, refreshUserPlaces);
      window.removeEventListener('storage', refreshUserPlaces);
    };
  }, []);

  const allPlaces = useMemo(() => [...places, ...userPlaces], [places, userPlaces]);

  const filtered = useMemo(
    () => filterPlaces(allPlaces, { query, category, commune }),
    [allPlaces, query, category, commune],
  );

  const hasFilters = query.trim() !== '' || category !== 'Toutes' || commune !== 'Toutes';
  const countLabel = `${filtered.length} ${filtered.length === 1 ? 'commerce' : 'commerces'}`;
  const sectionTitle = query.trim()
    ? `Résultats pour « ${query.trim()} »`
    : category !== 'Toutes'
      ? `${category} à Kindu`
      : 'Commerces à Kindu';
  const dataLabel =
    source === 'supabase'
      ? 'Stock live Supabase · OpenStreetMap'
      : source === 'bridge'
        ? 'Stock synchronisé · OpenStreetMap'
        : 'Annuaire Kindu · OpenStreetMap';

  const resetFilters = () => {
    setQuery('');
    setCategory('Toutes');
    setCommune('Toutes');
  };

  const applyQuickSearch = (term: string) => {
    setQuery(term);
    setCategory('Toutes');
    setCommune('Toutes');
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-line/70 bg-white">
        <div className="hero-glow" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-knd/50 bg-knd/15 px-3 py-1 text-xs font-semibold text-ink">
              <MapPin size={13} strokeWidth={2.5} />
              Kindu, RDC
            </span>

            <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">
              Trouve tout ce qu&apos;il te faut{' '}
              <span className="whitespace-nowrap underline decoration-knd decoration-4 underline-offset-4">
                à Kindu
              </span>
              .
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
              Commerces, pharmacies, restos et services vérifiés, près de chez toi.
            </p>

            <div className="mx-auto mt-6 max-w-2xl">
              <SearchBar
                value={query}
                onChange={setQuery}
                onClear={() => setQuery('')}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-muted">
              <span className="font-semibold">Essaie :</span>
              {QUICK_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => applyQuickSearch(term)}
                  className="inline-flex min-h-12 items-center rounded-full border border-line bg-white px-4 font-medium transition hover:border-knd hover:text-ink">
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink">
              Catégories
            </h2>
            <p className="mt-1 text-xs text-muted">Choisis un type de commerce.</p>
          </div>
          {category !== 'Toutes' ? (
            <button
              type="button"
              onClick={() => setCategory('Toutes')}
              className="inline-flex min-h-12 items-center text-xs font-semibold text-ink underline decoration-knd decoration-2 underline-offset-4">
              Tout afficher
            </button>
          ) : null}
        </div>
        <div className="mt-4">
          <CategoryGrid active={category} onSelect={setCategory} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-7 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)] sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Commune
            </span>
            <CommuneFilter active={commune} onSelect={setCommune} />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line/70 pt-3 lg:border-0 lg:pt-0">
            <span className="text-xs font-medium text-muted">
              {countLabel}
              {commune !== 'Toutes' ? ` · ${commune}` : ''}
            </span>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>
      </section>

      <section
        id="resultats"
        aria-live="polite"
        className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
              {sectionTitle}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {countLabel}
              {commune !== 'Toutes' ? ` · ${commune}` : ''}
              {category !== 'Toutes' ? ` · ${category}` : ''}
            </p>
          </div>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-[11px] font-semibold text-muted transition hover:border-knd hover:text-ink">
              <RotateCcw size={12} strokeWidth={2.2} />
              Réinitialiser
            </button>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : view === 'map' ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="relative z-0 h-[380px] overflow-hidden rounded-3xl border border-line bg-white shadow-sm sm:h-[460px] lg:h-[560px]">
              <MapView places={filtered} />
              <div className="pointer-events-none absolute right-3 top-3 z-[500] inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-ink shadow-sm backdrop-blur">
                <span className="size-2 rounded-full bg-live" />
                {countLabel} sur la carte
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium text-muted shadow-sm backdrop-blur">
                {dataLabel}
              </div>
            </div>

            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 lg:block lg:max-h-[560px] lg:space-y-3 lg:overflow-y-auto lg:pr-1">
              {filtered.map((place) => (
                <PlaceCard key={place.id} place={place} now={now} compact />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((place) => (
              <PlaceCard key={place.id} place={place} now={now} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-8 text-white sm:px-9 sm:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-knd/20 blur-2xl"
          />
          <div className="relative max-w-xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-knd">
              Commerçant ?
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Tu as un commerce à Kindu ?
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Ajoute ta fiche gratuitement. Kay la vérifie à moto sous 48h, puis les
              clients peuvent t&apos;appeler et t&apos;écrire sur WhatsApp.
            </p>
            <Link
              href="/ajouter"
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-knd px-5 text-sm font-extrabold text-ink transition hover:bg-knd/90">
              Ajouter mon commerce
              <ArrowRight size={16} strokeWidth={2.3} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
