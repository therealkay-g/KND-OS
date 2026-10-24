'use client';

import { SearchX } from 'lucide-react';

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center shadow-sm">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-knd/15 text-ink">
        <SearchX size={28} strokeWidth={1.8} />
      </span>
      <h2 className="mt-4 text-lg font-extrabold text-ink">Aucun commerce trouvé</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
        Essaie un autre mot-clé ou élargis la commune et la catégorie.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex h-12 items-center justify-center rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-ink/85">
        Effacer les filtres
      </button>
    </div>
  );
}
