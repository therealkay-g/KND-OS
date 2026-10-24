'use client';

import { COMMUNES, type Commune } from '@/lib/places';

interface CommuneFilterProps {
  active: Commune | 'Toutes';
  onSelect: (commune: Commune | 'Toutes') => void;
}

export function CommuneFilter({ active, onSelect }: CommuneFilterProps) {
  const options: Array<Commune | 'Toutes'> = ['Toutes', ...COMMUNES];

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Filtrer par commune">
      {options.map((commune) => {
        const selected = active === commune;
        return (
          <button
            key={commune}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(commune)}
            className={`h-12 rounded-full border px-4 text-[13px] font-semibold transition-colors ${
              selected
                ? 'border-knd bg-knd text-ink'
                : 'border-line bg-white text-muted hover:border-knd/70 hover:text-ink'
            }`}>
            {commune}
          </button>
        );
      })}
    </div>
  );
}
