import { CATEGORY_EMOJI, type Place } from '@/lib/places';

interface PlacePhotoProps {
  place: Place;
  variant?: 'card' | 'hero' | 'thumb';
  slide?: number;
  useUploaded?: boolean;
  className?: string;
}

/**
 * Illustration (dégradé + emoji) ou photo importée.
 * Les fiches initiales n'ont pas de photos réelles : on l'indique dans la galerie.
 */
export function PlacePhoto({
  place,
  variant = 'card',
  slide = 0,
  useUploaded = true,
  className = '',
}: PlacePhotoProps) {
  const showUploaded = useUploaded && Boolean(place.photo);
  const sizeClass =
    variant === 'card'
      ? 'size-16 shrink-0 rounded-2xl'
      : variant === 'thumb'
        ? 'size-16 shrink-0 rounded-xl'
        : 'h-full w-full';

  return (
    <div
      className={`relative overflow-hidden tone-${place.tone} ${sizeClass} ${className}`}
      style={
        showUploaded
          ? undefined
          : {
              backgroundImage: `linear-gradient(${135 + slide * 40}deg, var(--tone-from), var(--tone-to))`,
            }
      }
      role={showUploaded ? undefined : 'img'}
      aria-label={showUploaded ? undefined : `Illustration de ${place.name}`}>
      {showUploaded ? (
        <img
          src={place.photo}
          alt={`Photo de ${place.name}`}
          className="size-full object-cover"
        />
      ) : (
        <>
          <span
            aria-hidden="true"
            className="absolute -right-4 -top-4 size-16 rounded-full bg-white/20"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-5 -left-3 size-20 rounded-full bg-black/10"
          />
          <span
            aria-hidden="true"
            className={`relative z-10 flex size-full items-center justify-center drop-shadow-sm ${
              variant === 'hero' ? 'text-6xl' : 'text-2xl'
            }`}>
            {CATEGORY_EMOJI[place.category]}
          </span>
        </>
      )}
    </div>
  );
}
