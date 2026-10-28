'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Radio,
} from 'lucide-react';

import { PhotoGallery } from '@/components/photo-gallery';
import {
  CATEGORY_EMOJI,
  directionsHref,
  findPlace,
  formatAddress,
  formatCDF,
  formatPhone,
  formatStockAge,
  formatStockQuantity,
  getOpenStatus,
  getStockFreshness,
  isPlacePending,
  loadUserPlaces,
  phoneHref,
  USER_PLACES_EVENT,
  whatsappHref,
  type Place,
} from '@/lib/places';
import { usePlaces } from '@/lib/use-places';
import { useNow } from '@/lib/use-now';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <div className="map-loading">Chargement…</div>,
});

export default function PlacePage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const [userPlaces, setUserPlaces] = useState<Place[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { places, loading: placesLoading } = usePlaces();
  const now = useNow();

  useEffect(() => {
    const refreshUserPlaces = () => {
      setUserPlaces(loadUserPlaces());
      setLoaded(true);
    };
    refreshUserPlaces();
    window.addEventListener(USER_PLACES_EVENT, refreshUserPlaces);
    window.addEventListener('storage', refreshUserPlaces);
    return () => {
      window.removeEventListener(USER_PLACES_EVENT, refreshUserPlaces);
      window.removeEventListener('storage', refreshUserPlaces);
    };
  }, [id]);

  const place = useMemo(
    () => (id ? findPlace(id, userPlaces, places) : null),
    [id, userPlaces, places],
  );
  const mapPlaces = useMemo(() => (place ? [place] : []), [place]);

  if (!loaded || placesLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="h-5 w-32 animate-pulse rounded bg-line" />
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="h-[320px] animate-pulse rounded-3xl bg-line/60" />
          <div className="h-[320px] animate-pulse rounded-3xl bg-line/60" />
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-knd/15 text-ink">
          <MapPin size={28} strokeWidth={1.8} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
          Commerce introuvable
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Cette fiche n&apos;existe pas ou a été retirée de l&apos;annuaire.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-ink/85">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const status = getOpenStatus(place.hours, now);
  const stock = getStockFreshness(place, now);
  const stockAge = formatStockAge(place, now);
  const liveProducts = place.stockLive?.products ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="inline-flex h-12 items-center gap-1.5 rounded-full pr-3 text-sm font-semibold text-muted transition hover:text-ink">
        <ArrowLeft size={17} strokeWidth={2.2} />
        Tous les commerces
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <PhotoGallery place={place} />

          <div className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#F4F4F5] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">
                {place.category}
              </span>
              {place.pro ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-live px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                  <BadgeCheck size={12} strokeWidth={3} />
                  Pro
                </span>
              ) : null}
              {stock ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                    stock.live
                      ? 'bg-live text-white'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                  {stock.live ? <Radio size={12} strokeWidth={2.6} /> : null}
                  {stock.label}
                </span>
              ) : null}
              {isPlacePending(place) ? (
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-orange-700">
                  En attente
                </span>
              ) : null}
              {status ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    status.open
                      ? 'bg-live/10 text-green-700'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}>
                  <span
                    className={`size-1.5 rounded-full ${
                      status.open ? 'bg-live' : 'bg-zinc-400'
                    }`}
                  />
                  {status.label}
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-3xl">
              {place.name}
            </h1>

            <p className="mt-2 flex items-start gap-1.5 text-sm leading-6 text-muted">
              <MapPin size={15} strokeWidth={2.2} className="mt-1 shrink-0" />
              <span>
                {formatAddress(place)}
              </span>
            </p>

            <p className="mt-4 text-sm leading-6 text-muted">{place.description}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 lg:hidden">
              <a
                href={whatsappHref(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-whatsapp px-2 text-xs font-bold text-white">
                <MessageCircle size={16} strokeWidth={2.3} />
                WhatsApp
              </a>
              <a
                href={phoneHref(place)}
                className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-ink px-2 text-xs font-bold text-white">
                <Phone size={16} strokeWidth={2.3} />
                Appeler
              </a>
              <a
                href={directionsHref(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-ink bg-white px-2 text-xs font-bold text-ink">
                <Navigation size={16} strokeWidth={2.3} />
                Itinéraire
              </a>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-ink">Produits et services</h2>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {liveProducts.length > 0
                      ? 'Stock synchronisé depuis KND OS.'
                      : 'Produits cités par le commerce.'}
                  </p>
                </div>
                {stock?.live ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-live px-2.5 py-1 text-[10px] font-bold text-white">
                    <Radio size={11} strokeWidth={2.6} />
                    Stock vérifié Live
                  </span>
                ) : stock ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                    {stock.label}
                  </span>
                ) : place.pro ? (
                  <span className="rounded-full border border-knd/60 bg-knd/10 px-2.5 py-1 text-[10px] font-bold text-ink">
                    Stock live bientôt
                  </span>
                ) : null}
              </div>

              {liveProducts.length > 0 ? (
                <>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {liveProducts.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-xl border border-line bg-[#FAFAF9] px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 text-[13px] font-semibold leading-5 text-ink">
                            {product.name}
                          </span>
                          {product.price > 0 ? (
                            <span className="shrink-0 text-[11px] font-bold text-muted">
                              {formatCDF(product.price)}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${
                              stock?.live ? 'bg-live' : 'bg-amber-500'
                            }`}
                          />
                          <span
                            className={`font-semibold ${
                              stock?.live ? 'text-green-700' : 'text-amber-700'
                            }`}>
                            {product.stock > 0
                              ? `${formatStockQuantity(product.stock, product.unit)} en stock`
                              : 'Rupture de stock'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-muted">
                    Stock synchronisé depuis KND OS
                    {stockAge ? ` · mis à jour ${stockAge}` : ''}.
                  </p>
                </>
              ) : place.products.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {place.products.map((product) => (
                    <div
                      key={product}
                      className="flex items-center gap-2 rounded-xl border border-line bg-[#FAFAF9] px-3 py-2.5 text-[13px] font-medium text-ink">
                      <span aria-hidden="true" className="text-base">
                        {CATEGORY_EMOJI[place.category]}
                      </span>
                      <span className="min-w-0">{product}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">Aucun produit renseigné.</p>
              )}
            </div>

            {isPlacePending(place) ? (
              <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-xs leading-5 text-orange-800">
                Cette fiche est enregistrée sur cet appareil et attend la vérification de
                l&apos;équipe Kindu Search.
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-line bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
              <h2 className="text-sm font-extrabold text-ink">Localisation</h2>
              <a
                href={directionsHref(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-1 text-xs font-bold text-ink underline decoration-knd decoration-2 underline-offset-4">
                Itinéraire
                <ArrowUpRight size={13} strokeWidth={2.3} />
              </a>
            </div>
            <div className="h-[240px] overflow-hidden rounded-2xl border border-line">
              <MapView places={mapPlaces} />
            </div>
            <p className="px-1 pt-2 text-[10px] leading-4 text-muted">
              Position approximative. L&apos;équipe confirme
              l&apos;adresse lors de la vérification.
            </p>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          {place.pro ? (
            <div className="rounded-2xl border border-knd bg-knd/15 p-3.5 text-xs leading-5 text-ink">
              <div className="flex items-center gap-2 font-extrabold">
                <BadgeCheck size={16} strokeWidth={2.5} />
                Commerce Pro KND OS
              </div>
              {stock?.live && liveProducts.length > 0 ? (
                <>
                  <p className="mt-1 text-ink/65">
                    Stock vérifié {stockAge ? `· mis à jour ${stockAge}` : ''}.
                  </p>
                  <p className="mt-1 font-bold text-ink">
                    {liveProducts[0].name} :{' '}
                    {formatStockQuantity(liveProducts[0].stock, liveProducts[0].unit)}
                  </p>
                </>
              ) : stock ? (
                <p className="mt-1 text-ink/65">
                  {stock.label}. Vérifiez la disponibilité avant de vous déplacer.
                </p>
              ) : (
                <p className="mt-1 text-ink/65">
                  Fiche vérifiée. Le stock en temps réel n&apos;est pas encore activé.
                </p>
              )}
            </div>
          ) : null}

          <div className="rounded-3xl border border-line bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
              <Clock3 size={14} strokeWidth={2.2} />
              Horaires
            </div>
            <p className="mt-2 text-sm font-bold text-ink">{place.hours}</p>
            {status ? (
              <p
                className={`mt-0.5 text-[11px] font-semibold ${
                  status.open ? 'text-live' : 'text-muted'
                }`}>
                {status.label} maintenant
              </p>
            ) : null}

            <div className="my-4 h-px bg-line" />

            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
              <Phone size={14} strokeWidth={2.2} />
              Contact
            </div>
            <a
              href={phoneHref(place)}
              className="mt-2 block text-sm font-bold text-ink hover:underline">
              {formatPhone(place.whatsapp)}
            </a>

            <div className="mt-4 space-y-2.5">
              <a
                href={whatsappHref(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 text-sm font-bold text-white transition hover:brightness-95">
                <MessageCircle size={18} strokeWidth={2.3} />
                WhatsApp
              </a>
              <a
                href={phoneHref(place)}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white transition hover:bg-ink/85">
                <Phone size={18} strokeWidth={2.3} />
                Appeler
              </a>
              <a
                href={directionsHref(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-ink bg-white px-4 text-sm font-bold text-ink transition hover:bg-[#FAFAF9]">
                <Navigation size={18} strokeWidth={2.3} />
                Itinéraire
              </a>
            </div>

            <p className="mt-3 text-center text-[10px] text-muted">
              Message WhatsApp pré-rempli.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-[#FAFAF9] p-3.5 text-[11px] leading-5 text-muted">
            <strong className="text-ink">Kindu Search</strong> est un annuaire gratuit.
            Les commerces Pro sont vérifiés par l&apos;équipe avant publication.
          </div>
        </aside>
      </div>
    </div>
  );
}
