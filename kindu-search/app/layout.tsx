import type { Metadata, Viewport } from 'next';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import './globals.css';

import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: {
    default: 'Kindu Search — Trouve tout à Kindu',
    template: '%s · Kindu Search',
  },
  description:
    "L'annuaire public des commerces, pharmacies, restos et services de Kindu, en RDC. Trouve un commerce, appelle-le ou écris-lui sur WhatsApp.",
  applicationName: 'Kindu Search',
  keywords: [
    'Kindu',
    'Kindu Search',
    'annuaire',
    'commerce',
    'pharmacie',
    'quincaillerie',
    'RDC',
    'Maniema',
  ],
  openGraph: {
    title: 'Kindu Search — Trouve tout à Kindu',
    description:
      "Commerces, pharmacies, restos et services vérifiés à Kindu, en RDC.",
    locale: 'fr_CD',
    type: 'website',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFC300',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex min-h-dvh flex-col bg-white font-sans text-ink antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
          Aller au contenu
        </a>
        <SiteHeader />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
