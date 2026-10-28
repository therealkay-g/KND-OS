import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';

import { InstallApp } from './install-app';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-knd text-ink">
            <MapPin size={18} strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-ink">Kindu Search</p>
            <p className="text-xs text-muted">L&apos;annuaire public de Kindu, en RDC.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-0 text-xs font-medium text-muted">
          <Link href="/" className="inline-flex min-h-12 items-center transition-colors hover:text-ink">
            Accueil
          </Link>
          <Link href="/ajouter" className="inline-flex min-h-12 items-center transition-colors hover:text-ink">
            Ajouter mon commerce
          </Link>
          <Link
            href="/don"
            className="inline-flex min-h-12 items-center gap-1 transition-colors hover:text-ink">
            <Heart size={13} strokeWidth={2.2} className="fill-knd text-ink" />
            Soutenir
          </Link>
          <Link href="/admin" className="inline-flex min-h-12 items-center transition-colors hover:text-ink">
            Admin
          </Link>
          <InstallApp />
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center transition-colors hover:text-ink">
            OpenStreetMap
          </a>
          <span className="rounded-full border border-line px-2.5 py-1 text-[10px] uppercase tracking-wide">
            Démo
          </span>
        </div>
      </div>
      <div className="border-t border-line/70 px-4 py-3 text-center text-[10px] text-muted sm:px-6">
        Données de démonstration · 10 commerces fictifs · Aucun paiement en ligne
      </div>
    </footer>
  );
}
