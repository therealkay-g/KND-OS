'use client';

import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function SearchBar({ value, onChange, onClear }: SearchBarProps) {
  return (
    <div className="relative">
      <label htmlFor="kindu-search" className="sr-only">
        Rechercher un commerce, un produit ou un service à Kindu
      </label>
      <Search
        size={21}
        strokeWidth={2.2}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        id="kindu-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Que cherches-tu ? ciment, paracétamol..."
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        aria-controls="resultats"
        className="h-14 w-full rounded-2xl border border-transparent bg-[#F4F4F5] pl-12 pr-14 text-[15px] font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-muted/80 focus:border-knd focus:bg-white focus:ring-4 focus:ring-knd/20 sm:h-16 sm:text-base"
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Effacer la recherche"
          className="absolute right-1.5 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-white hover:text-ink sm:right-2">
          <X size={18} strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
}
