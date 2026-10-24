'use client';

import {
  Apple,
  BedDouble,
  Home,
  Pill,
  Scissors,
  ShoppingBag,
  Utensils,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { CATEGORIES, type Category } from '@/lib/places';

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Resto: Utensils,
  Hôtel: BedDouble,
  Pharmacie: Pill,
  Quincaillerie: Wrench,
  Magasin: ShoppingBag,
  Alimentation: Apple,
  Salon: Scissors,
  Location: Home,
};

interface CategoryGridProps {
  active: Category | 'Toutes';
  onSelect: (category: Category) => void;
}

export function CategoryGrid({ active, onSelect }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8">
      {CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category];
        const selected = active === category;

        return (
          <button
            key={category}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(category)}
            className={`group flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 transition duration-200 ${
              selected
                ? 'border-knd bg-knd text-ink shadow-[0_6px_16px_rgba(255,195,0,0.25)]'
                : 'border-line bg-white text-ink hover:-translate-y-0.5 hover:border-knd/70 hover:bg-knd/5'
            }`}>
            <span
              className={`grid size-10 place-items-center rounded-full transition-colors ${
                selected ? 'bg-white/70' : 'bg-[#F4F4F5] group-hover:bg-white'
              }`}>
              <Icon size={21} strokeWidth={1.9} />
            </span>
            <span className="text-[11px] font-semibold leading-none">{category}</span>
          </button>
        );
      })}
    </div>
  );
}
