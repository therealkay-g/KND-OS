import Link from 'next/link';
import { BadgeCheck, ChevronRight, MapPin } from 'lucide-react';

import {
  getOpenStatus,
  getLiveStockSummary,
  getStockFreshness,
  isPlacePending,
  type Place,
} from '@/lib/places';
import { PlacePhoto } from './place-photo';

interface PlaceCardProps {
  place: Place;
  now: Date | null;
  compact?: boolean;
}

export function PlaceCard({ place, now, compact = false }: PlaceCardProps) {
  const status = getOpenStatus(place.hours, now);
  const stock = getStockFreshness(place, now);
  const stockSummary = getLiveStockSummary(place);
  const productsLine = place.products.length
    ? place.products.slice(0, 3).join(' · ')
    : place.description;

  return (
    <Link
      href={`/place/${place.id}`}
      aria-label={`Voir la fiche de ${place.name}`}
      className={`group flex items-start gap-3 rounded-2xl border border-line bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-knd/60 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] ${
        compact ? 'min-w-[300px] shrink-0 lg:min-w-0' : ''
      }`}>
      <PlacePhoto place={place} />

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-[10px] font-extrabold uppercase tracking-[0.13em] text-muted">
            {place.category}
          </span>
          {place.pro ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-live px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
              <BadgeCheck size={10} strokeWidth={3} />
              Pro
            </span>
          ) : isPlacePending(place) ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-orange-700">
              En attente
            </span>
          ) : null}
        </div>

        <h3 className="mt-1 truncate text-[15px] font-bold leading-5 text-ink">{place.name}</h3>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-4 text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} strokeWidth={2.2} />
            {place.commune}
          </span>
          <span className="text-zinc-300">·</span>
          {status ? (
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                status.open ? 'text-live' : 'text-muted'
              }`}>
              <span
                className={`size-1.5 rounded-full ${status.open ? 'bg-live' : 'bg-zinc-400'}`}
              />
              {status.label}
            </span>
          ) : (
            <span>{place.hours}</span>
          )}
        </div>

        <p className="mt-1 truncate text-[11px] leading-4 text-muted/90">{productsLine}</p>

        {stock ? (
          <div
            className={`mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              stock.live
                ? 'bg-live/10 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
            <span
              className={`size-1.5 shrink-0 rounded-full ${
                stock.live ? 'bg-live' : 'bg-amber-500'
              }`}
            />
            <span className="truncate">{stockSummary ?? stock.label}</span>
            <span className="shrink-0 text-[9px] uppercase tracking-wide">
              {stock.live ? 'Live' : stock.shortLabel}
            </span>
          </div>
        ) : null}
      </div>

      <ChevronRight
        size={16}
        strokeWidth={2.2}
        aria-hidden="true"
        className="mt-5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </Link>
  );
}
