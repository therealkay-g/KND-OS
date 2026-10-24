'use client';

import { useEffect, useState } from 'react';

/**
 * Horloge locale pour les badges « Ouvert / Fermé ».
 * `null` au premier rendu pour éviter une différence serveur/client.
 */
export function useNow(intervalMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
