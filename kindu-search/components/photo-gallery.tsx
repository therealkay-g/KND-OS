'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { Place } from '@/lib/places';
import { PlacePhoto } from './place-photo';

const SLIDES = [
  { label: 'Devanture', caption: 'Illustration' },
  { label: 'Intérieur', caption: 'Illustration' },
  { label: 'Produits', caption: 'Illustration' },
];

export function PhotoGallery({ place }: { place: Place }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const hasUploadedPhoto = Boolean(place.photo) && index === 0;

  const previous = () => setIndex((current) => (current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setIndex((current) => (current + 1) % SLIDES.length);

  return (
    <div className="relative h-[240px] overflow-hidden rounded-3xl border border-line bg-white shadow-sm sm:h-[320px]">
      <PlacePhoto place={place} variant="hero" slide={index} useUploaded={index === 0} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/60 to-transparent"
      />

      <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-3 text-white">
        <div>
          <p className="text-xs font-bold">{slide.label}</p>
          <p className="text-[10px] text-white/80">
            {hasUploadedPhoto ? 'Photo importée' : slide.caption}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {SLIDES.map((item, dotIndex) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setIndex(dotIndex)}
              aria-label={`Voir la photo ${dotIndex + 1} : ${item.label}`}
              aria-current={dotIndex === index}
              className="grid size-12 place-items-center rounded-full">
              <span
                className={`h-2 rounded-full transition-all ${
                  dotIndex === index ? 'w-6 bg-knd' : 'w-2 bg-white/60'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={previous}
        aria-label="Photo précédente"
        className="absolute left-2.5 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition hover:bg-white">
        <ChevronLeft size={20} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Photo suivante"
        className="absolute right-2.5 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition hover:bg-white">
        <ChevronRight size={20} strokeWidth={2.2} />
      </button>
    </div>
  );
}
