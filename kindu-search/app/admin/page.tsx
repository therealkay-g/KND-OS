'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock3,
  Loader2,
  LockKeyhole,
  LogOut,
  MapPin,
  ShieldCheck,
  X,
} from 'lucide-react';

import { PlacePhoto } from '@/components/place-photo';
import {
  ADMIN_DECISIONS_EVENT,
  loadAdminDemoPlaces,
  recordAdminDecision,
} from '@/lib/admin-local';
import {
  isPlacePending,
  removeUserPlace,
  saveUserPlace,
  type Place,
} from '@/lib/places';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <div className="map-loading">Chargement de la carte…</div>,
});

type AdminMode = 'demo' | 'supabase';

interface PlacesResponse {
  mode?: AdminMode;
  places?: Place[];
  message?: string;
}

const demoHintVisible =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_ADMIN_DEMO_HINT === 'true';

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [mode, setMode] = useState<AdminMode | null>(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = useMemo(() => places.filter(isPlacePending), [places]);
  const verifiedCount = places.length - pending.length;

  const loadPlaces = async () => {
    setLoadingPlaces(true);
    setError('');
    try {
      const response = await fetch('/api/admin/places', { cache: 'no-store' });
      const payload = (await response.json()) as PlacesResponse;

      if (response.status === 401) {
        setAuthenticated(false);
        setPlaces([]);
        return;
      }
      if (!response.ok) {
        setError(payload.message ?? 'Impossible de charger les commerces.');
        return;
      }

      const nextMode = payload.mode === 'supabase' ? 'supabase' : 'demo';
      setMode(nextMode);
      if (nextMode === 'demo') {
        setPlaces(loadAdminDemoPlaces());
      } else {
        setPlaces(
          (payload.places ?? []).map((place) => ({
            ...place,
            verified: place.verified === true,
          })),
        );
      }
    } catch {
      setError('Connexion à l’admin impossible.');
    } finally {
      setLoadingPlaces(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store' });
        const payload = (await response.json()) as { authenticated?: boolean };
        if (!active) return;
        if (payload.authenticated) {
          setAuthenticated(true);
          await loadPlaces();
        }
      } catch {
        if (active) setLoginError('Session admin indisponible.');
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
    // La session est vérifiée une seule fois à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== 'demo') return;
    const refresh = () => setPlaces(loadAdminDemoPlaces());
    window.addEventListener(ADMIN_DECISIONS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(ADMIN_DECISIONS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [mode]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError('');
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setLoginError(payload.message ?? 'Code admin incorrect.');
        return;
      }
      setAuthenticated(true);
      setCode('');
      await loadPlaces();
    } catch {
      setLoginError('Connexion à l’admin impossible.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined);
    setAuthenticated(false);
    setPlaces([]);
    setMode(null);
    setMessage('');
    setError('');
  };

  const handleAction = async (place: Place, action: 'verify' | 'refuse') => {
    setBusyId(place.id);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/admin/places/${encodeURIComponent(place.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        if (response.status === 401) setAuthenticated(false);
        setError(payload.message ?? 'Action admin impossible.');
        return;
      }

      if (mode === 'demo') {
        if (action === 'verify') {
          if (!saveUserPlace({ ...place, verified: true })) {
            setError(
              'Le stockage local est indisponible : la fiche n’a pas pu être publiée.',
            );
            return;
          }
          recordAdminDecision(place.id, 'verified');
        } else {
          removeUserPlace(place.id);
          recordAdminDecision(place.id, 'refused');
        }
      }

      if (action === 'verify') {
        setPlaces((previous) =>
          previous.map((entry) =>
            entry.id === place.id ? { ...entry, verified: true } : entry,
          ),
        );
        setMessage(`La fiche de ${place.name} est vérifiée et visible publiquement.`);
      } else {
        setPlaces((previous) => previous.filter((entry) => entry.id !== place.id));
        setMessage(`La fiche de ${place.name} a été refusée.`);
      }

      if (mode === 'supabase') {
        await loadPlaces();
      }
    } catch {
      setError('Action admin impossible.');
    } finally {
      setBusyId(null);
    }
  };

  if (checking) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-[#F4F4F5]">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
          <Loader2 size={18} className="animate-spin" />
          Vérification de la session…
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="grid min-h-[calc(100dvh-140px)] place-items-center bg-[#F4F4F5] px-4 py-10">
        <div className="w-full max-w-sm rounded-3xl border border-line bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)] sm:p-8">
          <span className="grid size-14 place-items-center rounded-2xl bg-knd/20 text-ink">
            <LockKeyhole size={26} strokeWidth={2.1} />
          </span>
          <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
            Espace réservé
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
            Admin Kindu Search
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Entrez le code de Kay pour vérifier les commerces en attente.
          </p>

          <form onSubmit={handleLogin} className="mt-5 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted">Code admin</span>
              <input
                type="password"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="current-password"
                placeholder="Code"
                className="mt-1 h-12 w-full rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-muted/70 focus:border-knd focus:ring-4 focus:ring-knd/20"
              />
            </label>

            {loginError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {loginError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loginBusy || code.trim().length === 0}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-extrabold text-white transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50">
              {loginBusy ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
              {loginBusy ? 'Connexion…' : 'Entrer dans l’admin'}
            </button>
          </form>

          {demoHintVisible ? (
            <p className="mt-4 rounded-xl bg-knd/15 px-3 py-2 text-[11px] leading-5 text-ink">
              Mode démo : code <strong>kay-demo</strong>. En production, définissez
              {' '}
              <code className="rounded bg-white/70 px-1">ADMIN_ACCESS_CODE</code>.
            </p>
          ) : null}

          <Link
            href="/"
            className="mt-4 inline-flex min-h-12 items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink">
            <ArrowLeft size={14} strokeWidth={2.2} />
            Retour à l&apos;annuaire
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-140px)] bg-[#F4F4F5] px-4 py-7 sm:px-6 sm:py-9">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
              Kindu Search · Admin
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Vérification des commerces
            </h1>
            <p className="mt-1 text-sm text-muted">
              {mode === 'supabase'
                ? 'Connecté à Supabase · les décisions sont enregistrées.'
                : 'Mode démo local · les décisions restent dans ce navigateur.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-ink transition hover:border-knd">
            <LogOut size={15} strokeWidth={2.2} />
            Déconnexion
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">
              En attente
            </p>
            <p className="mt-1 text-2xl font-extrabold text-ink">{pending.length}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">
              Vérifiés
            </p>
            <p className="mt-1 text-2xl font-extrabold text-ink">{verifiedCount}</p>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="mt-4 rounded-xl bg-live/10 px-4 py-3 text-sm font-semibold text-green-800">
            {message}
          </p>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">Carte de Kindu</h2>
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-muted">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-live" /> Vérifié
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-zinc-400" /> En attente
              </span>
            </span>
          </div>
          <div className="h-[400px]">
            {loadingPlaces ? (
              <div className="map-loading">Chargement des commerces…</div>
            ) : (
              <MapView places={places} variant="admin" />
            )}
          </div>
        </div>

        <section className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-ink">
                Nouveaux commerces à vérifier
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {pending.length === 0
                  ? 'Aucune fiche en attente.'
                  : `${pending.length} fiche${pending.length > 1 ? 's' : ''} à vérifier.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadPlaces()}
              disabled={loadingPlaces}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-[11px] font-semibold text-muted transition hover:border-knd hover:text-ink disabled:opacity-50">
              {loadingPlaces ? <Loader2 size={13} className="animate-spin" /> : null}
              Actualiser
            </button>
          </div>

          {pending.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-line bg-white p-8 text-center">
              <BadgeCheck size={28} strokeWidth={1.8} className="mx-auto text-live" />
              <p className="mt-2 text-sm font-bold text-ink">Tout est vérifié</p>
              <p className="mt-1 text-xs text-muted">
                Les nouvelles fiches apparaîtront ici après le formulaire public.
              </p>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {pending.map((place) => (
                <article
                  key={place.id}
                  className="rounded-2xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex items-start gap-3">
                    <PlacePhoto place={place} variant="thumb" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted">
                          {place.category}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-zinc-600">
                          <Clock3 size={9} strokeWidth={2.5} />
                          En attente
                        </span>
                      </div>
                      <h3 className="mt-1 truncate text-base font-extrabold text-ink">
                        {place.name}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                        <MapPin size={11} strokeWidth={2.2} />
                        {place.commune} · {place.address}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">{place.phone}</p>
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                    {place.description}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAction(place, 'verify')}
                      disabled={busyId === place.id}
                      className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-live text-xs font-extrabold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60">
                      {busyId === place.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Check size={15} strokeWidth={2.8} />
                      )}
                      Vérifier
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAction(place, 'refuse')}
                      disabled={busyId === place.id}
                      className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-red-600 text-xs font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                      {busyId === place.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <X size={15} strokeWidth={2.8} />
                      )}
                      Refuser
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
