'use client';

import { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallAppProps {
  variant?: 'icon' | 'link';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function InstallApp({ variant = 'link' }: InstallAppProps) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (!promptEvent) {
      setShowHelp(true);
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setPromptEvent(null);
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Installer l'application"
          className="grid size-12 place-items-center rounded-xl border border-line bg-white text-ink transition-colors hover:border-knd">
          <Download size={18} strokeWidth={2.2} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex min-h-12 items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink">
          <Download size={14} strokeWidth={2.2} />
          Installer l&apos;app
        </button>
      )}

      {showHelp ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Installer Kindu Search"
          className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-10 place-items-center rounded-2xl bg-knd text-ink">
                  <Download size={19} strokeWidth={2.3} />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-ink">Installer Kindu Search</p>
                  <p className="text-[11px] text-muted">Accès rapide depuis l&apos;écran d&apos;accueil.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Fermer"
                className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-zinc-100 hover:text-ink">
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <p>
                <strong className="text-ink">Android / Chrome :</strong> menu{' '}
                <span className="font-semibold text-ink">⋮</span> puis{' '}
                <span className="font-semibold text-ink">Installer l&apos;application</span>{' '}
                ou <span className="font-semibold text-ink">Ajouter à l&apos;écran d&apos;accueil</span>.
              </p>
              <p className="flex items-start gap-2">
                <Share2 size={16} strokeWidth={2.2} className="mt-1 shrink-0" />
                <span>
                  <strong className="text-ink">iPhone / Safari :</strong> bouton Partager,
                  puis <span className="font-semibold text-ink">Sur l&apos;écran d&apos;accueil</span>.
                </span>
              </p>
              <p className="text-[11px] text-muted/80">
                L&apos;installation nécessite HTTPS (ou localhost). Sur Vercel, elle est
                disponible dès le premier chargement.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-5 h-12 w-full rounded-xl bg-ink text-sm font-bold text-white transition hover:bg-ink/85">
              Compris
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
