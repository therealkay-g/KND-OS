import Link from 'next/link';
import { Heart, MapPin, Plus } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <Link
          href="/"
          aria-label="Kindu Search, retour à l'accueil"
          className="group flex min-h-12 items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-knd text-ink shadow-sm transition-transform group-hover:-rotate-3">
            <MapPin size={21} strokeWidth={2.4} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">
            Kindu <span className="text-muted">Search</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted lg:flex">
            <span className="size-1.5 rounded-full bg-live" />
            Kindu, RDC
          </span>
          <Link
            href="/don"
            aria-label="Soutenir Kindu Search"
            className="inline-flex h-12 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-ink transition-colors hover:border-knd hover:bg-knd/10">
            <Heart size={16} strokeWidth={2.2} className="fill-knd text-ink" />
            <span className="hidden sm:inline">Don</span>
          </Link>
          <Link
            href="/ajouter"
            className="hidden h-12 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink/85 sm:flex">
            <Plus size={16} strokeWidth={2.4} />
            Ajouter mon commerce
          </Link>
          <Link
            href="/ajouter"
            aria-label="Ajouter mon commerce"
            className="grid size-12 place-items-center rounded-xl bg-ink text-white transition-colors hover:bg-ink/85 sm:hidden">
            <Plus size={19} strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </header>
  );
}
