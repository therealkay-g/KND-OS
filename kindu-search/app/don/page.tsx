'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Heart,
  Loader2,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';

import { formatCDF } from '@/lib/places';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const AMOUNTS = [5_000, 10_000, 20_000, 0] as const;

const OPERATORS = [
  {
    name: 'Airtel Money',
    operator: 'Airtel',
    className: 'bg-[#E30613] text-white hover:bg-[#c40511]',
  },
  {
    name: 'Orange Money',
    operator: 'Orange',
    className: 'bg-[#FF7900] text-white hover:bg-[#e66d00]',
  },
  {
    name: 'M-Pesa',
    operator: 'M-Pesa',
    className: 'bg-[#00A651] text-white hover:bg-[#009247]',
  },
] as const;

type Operator = (typeof OPERATORS)[number]['operator'];

const donationWhatsApp = (
  process.env.NEXT_PUBLIC_DONATION_WHATSAPP ?? '243970000101'
).replace(/\D/g, '');

export default function DonPage() {
  const [amount, setAmount] = useState<number>(10_000);
  const [customAmount, setCustomAmount] = useState('');
  const [sent, setSent] = useState(false);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const remoteDonations = isSupabaseConfigured;

  const selectedAmount =
    amount === 0 ? Math.max(0, Number(customAmount) || 0) : amount;
  const amountLabel = selectedAmount > 0 ? formatCDF(selectedAmount) : 'montant libre';

  const message = `Bonjour Kay, je souhaite soutenir Kindu Search avec un don de ${amountLabel}. Merci !`;
  const whatsappHref = donationWhatsApp
    ? `https://wa.me/${donationWhatsApp}?text=${encodeURIComponent(message)}`
    : undefined;

  const handleSaveDonation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError('');

    if (!operator || selectedAmount <= 0) {
      setSaveError('Choisissez un montant et un opérateur avant d’enregistrer.');
      return;
    }

    setSaving(true);
    const donation = {
      donateur_nom: donorName.trim() || null,
      telephone: donorPhone.trim() || null,
      montant: selectedAmount,
      operateur: operator,
      statut: 'en_attente' as const,
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('donations').insert(donation);
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    } else {
      // Le don reste dans ce navigateur, en attendant Supabase.
      try {
        const key = 'kindu-search:donations:v1';
        const raw = window.localStorage.getItem(key);
        const existing = raw ? (JSON.parse(raw) as unknown) : [];
        const next = [
          { ...donation, created_at: new Date().toISOString() },
          ...(Array.isArray(existing) ? existing : []),
        ];
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        setSaveError('Le stockage local est indisponible.');
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="inline-flex min-h-12 items-center gap-1.5 rounded-full pr-3 text-sm font-semibold text-muted transition hover:text-ink">
        <ArrowLeft size={17} strokeWidth={2.2} />
        Retour à l&apos;annuaire
      </Link>

      <div className="mt-4 rounded-3xl border border-line bg-white p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-9">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-knd/20 text-ink">
          <Heart size={32} strokeWidth={2.1} className="fill-knd" />
        </span>

        <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
          Kindu Search · projet local
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-3xl">
          Soutenir Kindu Search
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
          Aidez-nous à cartographier Kindu : vérification des commerces à moto,
          photos, mise à jour du stock et accès gratuit pour tous.
        </p>

        <div className="mt-6 text-left">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">
            Choisir un montant
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {AMOUNTS.map((value) => {
              const active = amount === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAmount(value);
                    setSent(false);
                    setSaved(false);
                    setSaveError('');
                  }}
                  aria-pressed={active}
                  className={`min-h-12 rounded-xl border px-3 text-sm font-extrabold transition ${
                    active
                      ? 'border-knd bg-knd text-ink'
                      : 'border-line bg-white text-ink hover:border-knd'
                  }`}>
                  {value === 0 ? 'Libre' : formatCDF(value)}
                </button>
              );
            })}
          </div>

          {amount === 0 ? (
            <label className="mt-3 block text-left">
              <span className="text-xs font-semibold text-muted">
                Montant libre en CDF
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={500}
                step={500}
                value={customAmount}
                onChange={(event) => {
                  setCustomAmount(event.target.value);
                  setSent(false);
                  setSaved(false);
                  setSaveError('');
                }}
                placeholder="Ex. 15 000"
                className="mt-1 h-12 w-full rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-muted/70 focus:border-knd focus:ring-4 focus:ring-knd/20"
              />
            </label>
          ) : null}
        </div>

        <div className="mt-6 text-left">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">
            Payer par Mobile Money
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Paiement manuel V1 : le bouton ouvre WhatsApp avec le montant. Kay
            confirme le don après réception de la capture de paiement.
          </p>

          <div className="mt-3 space-y-2">
            {OPERATORS.map((item) => (
              <a
                key={item.operator}
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setOperator(item.operator);
                  setSent(true);
                  setSaved(false);
                  setSaveError('');
                }}
                aria-disabled={!whatsappHref}
                className={`flex min-h-[52px] items-center justify-between gap-3 rounded-xl px-4 text-sm font-extrabold transition ${item.className} ${
                  whatsappHref ? '' : 'pointer-events-none opacity-50'
                }`}>
                <span className="inline-flex items-center gap-2">
                  <MessageCircle size={18} strokeWidth={2.3} />
                  {item.name}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold opacity-90">
                  {amountLabel}
                  <ExternalLink size={14} strokeWidth={2.2} />
                </span>
              </a>
            ))}
          </div>

          {!whatsappHref ? (
            <p className="mt-2 text-xs font-semibold text-orange-700">
              Numéro Mobile Money à confirmer : configurez
              {' '}
              <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_DONATION_WHATSAPP</code>.
            </p>
          ) : null}
        </div>

        {sent ? (
          <div className="mt-6 rounded-2xl border border-live/30 bg-live/10 p-4 text-left">
            <p className="flex items-center gap-2 text-sm font-extrabold text-green-800">
              <ShieldCheck size={17} strokeWidth={2.4} />
              Merci pour votre soutien !
            </p>
            <p className="mt-1 text-xs leading-5 text-green-900/80">
              Envoyez la capture de paiement sur WhatsApp. Kay confirmera le don
              manuellement{operator ? ` (${operator})` : ''}.
            </p>

            {saved ? (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-green-800">
                <CheckCircle2 size={15} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                {remoteDonations
                  ? 'Don enregistré. Kay confirmera après réception de la capture.'
                  : 'Don enregistré localement. Aucune donnée n’est envoyée.'}
              </p>
            ) : (
              <form onSubmit={handleSaveDonation} className="mt-3 space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={donorName}
                    onChange={(event) => setDonorName(event.target.value)}
                    placeholder="Votre nom (optionnel)"
                    className="h-12 w-full rounded-xl border border-white/70 bg-white px-3 text-xs font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-muted/70 focus:border-knd focus:ring-4 focus:ring-knd/20"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={donorPhone}
                    onChange={(event) => setDonorPhone(event.target.value)}
                    placeholder="Téléphone (optionnel)"
                    className="h-12 w-full rounded-xl border border-white/70 bg-white px-3 text-xs font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-muted/70 focus:border-knd focus:ring-4 focus:ring-knd/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving || !operator || selectedAmount <= 0}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-xs font-extrabold text-white transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50">
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} strokeWidth={2.5} />
                  )}
                  {saving ? 'Enregistrement…' : 'Enregistrer mon don'}
                </button>
                {saveError ? (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                    {saveError}
                  </p>
                ) : null}
                <p className="text-[10px] leading-4 text-green-900/70">
                  Nom et téléphone restent privés. Ils servent uniquement à Kay
                  pour confirmer le don.
                </p>
              </form>
            )}
          </div>
        ) : null}

        <p className="mt-6 text-[10px] leading-5 text-muted">
          Aucun paiement en ligne n&apos;est effectué sur ce site. Les numéros
          Mobile Money sont à confirmer avant la mise en production.
        </p>
      </div>
    </div>
  );
}
