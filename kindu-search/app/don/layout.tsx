import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { absolute: 'Soutenir Kindu Search' },
  description:
    'Soutenez Kindu Search avec un don Mobile Money manuel via Airtel Money, Orange Money ou M-Pesa.',
};

export default function DonLayout({ children }: { children: ReactNode }) {
  return children;
}
