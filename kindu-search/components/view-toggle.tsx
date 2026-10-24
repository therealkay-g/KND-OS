'use client';

import { List, Map } from 'lucide-react';

export type ViewMode = 'map' | 'list';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="inline-flex h-14 items-center rounded-xl border border-line bg-[#F4F4F5] p-1"
      role="group"
      aria-label="Choisir la vue">
      <button
        type="button"
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
        className={`inline-flex h-12 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
          value === 'list' ? 'bg-knd text-ink shadow-sm' : 'text-muted hover:text-ink'
        }`}>
        <List size={16} strokeWidth={2.2} />
        Liste
      </button>
      <button
        type="button"
        aria-pressed={value === 'map'}
        onClick={() => onChange('map')}
        className={`inline-flex h-12 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
          value === 'map' ? 'bg-knd text-ink shadow-sm' : 'text-muted hover:text-ink'
        }`}>
        <Map size={16} strokeWidth={2.2} />
        Carte
      </button>
    </div>
  );
}
