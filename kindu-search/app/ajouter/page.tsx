'use client';

import Link from 'next/link';
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Send,
  Trash2,
} from 'lucide-react';

import { CategoryGrid } from '@/components/category-grid';
import { compressImage } from '@/lib/image';
import { getSupabaseClient } from '@/lib/supabase';
import { insertPendingPlace } from '@/lib/supabase-places';
import {
  CATEGORY_TONE,
  COMMUNES,
  approximateCoordinates,
  createPlaceId,
  formatPhone,
  normalizeWhatsAppInput,
  saveUserPlace,
  type Category,
  type Commune,
  type Place,
} from '@/lib/places';

interface FormState {
  name: string;
  category: Category;
  commune: Commune;
  whatsapp: string;
  address: string;
  hours: string;
  description: string;
  products: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const inputClass =
  'h-12 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-knd focus:ring-4 focus:ring-knd/20';

export default function AddPlacePage() {
  const [form, setForm] = useState<FormState>({
    name: '',
    category: 'Magasin',
    commune: 'Kasuku',
    whatsapp: '',
    address: '',
    hours: '08:00 – 18:00',
    description: '',
    products: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [photo, setPhoto] = useState<string | undefined>();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitBusy, setSubmitBusy] = useState(false);
  const [created, setCreated] = useState<Place | null>(null);
  const remoteEnabled = Boolean(getSupabaseClient());

  const updateField = <K extends keyof FormState,>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Choisissez une image JPG ou PNG.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('Image trop lourde (8 Mo maximum).');
      return;
    }

    setPhotoBusy(true);
    setPhotoError('');
    try {
      setPhoto(await compressImage(file));
    } catch {
      setPhotoError("Impossible de lire cette image. Essayez une autre photo.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    const nextErrors: FormErrors = {};
    const whatsapp = normalizeWhatsAppInput(form.whatsapp);

    if (form.name.trim().length < 2) nextErrors.name = 'Entrez le nom du commerce.';
    if (!whatsapp) nextErrors.whatsapp = 'Numéro invalide : 9 chiffres, ex. 970 000 001.';
    if (form.address.trim().length < 3) nextErrors.address = 'Entrez une adresse ou un repère.';
    if (!form.hours.trim()) nextErrors.hours = 'Entrez les horaires.';
    if (!form.description.trim() && !form.products.trim()) {
      nextErrors.description = 'Décrivez votre commerce ou ses produits.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !whatsapp) return;

    const coordinates = approximateCoordinates(form.commune);
    const place: Place = {
      id: createPlaceId(),
      name: form.name.trim(),
      category: form.category,
      commune: form.commune,
      address: form.address.trim(),
      hours: form.hours.trim(),
      whatsapp,
      phone: formatPhone(whatsapp),
      lat: coordinates.lat,
      lng: coordinates.lng,
      pro: false,
      tone: CATEGORY_TONE[form.category],
      description:
        form.description.trim() || `Commerce à ${form.commune}, Kindu.`,
      products: form.products
        .split(',')
        .map((product) => product.trim())
        .filter(Boolean)
        .slice(0, 8),
      photo,
      source: 'user',
      createdAt: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      setSubmitBusy(true);
      try {
        await insertPendingPlace(supabase, place);
      } catch (cause) {
        setSubmitError(
          cause instanceof Error
            ? cause.message
            : "L'envoi de la fiche a échoué. Réessayez dans un instant.",
        );
        setSubmitBusy(false);
        return;
      }
      setSubmitBusy(false);
    }

    const savedLocally = saveUserPlace(place);
    if (!savedLocally && !supabase) {
      setSubmitError(
        "Le stockage local est indisponible ou plein. Essayez sans photo, ou vérifiez que le navigateur autorise le stockage.",
      );
      return;
    }

    setCreated(place);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (created) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-3xl border border-line bg-white p-7 text-center shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-live/10 text-live">
            <CheckCircle2 size={32} strokeWidth={2} />
          </span>
          <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
            Fiche enregistrée
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Merci, {created.name} !
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            Kay va vérifier votre commerce à moto dans 48h.{' '}
            {remoteEnabled
              ? 'Votre fiche a été envoyée pour vérification.'
              : 'En attendant, la fiche reste enregistrée sur cet appareil et apparaît comme « en attente ».'}
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={`/place/${created.id}`}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-ink/85">
              Voir ma fiche
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-bold text-ink transition hover:border-knd">
              Retour à l&apos;accueil
            </Link>
          </div>

          <p className="mt-4 text-[10px] text-muted">
            {remoteEnabled
              ? 'Fiche envoyée à Kindu Search · vérification manuelle sous 48h.'
              : 'Aucune donnée n’est envoyée à un serveur.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="inline-flex h-12 items-center gap-1.5 rounded-full pr-3 text-sm font-semibold text-muted transition hover:text-ink">
        <ArrowLeft size={17} strokeWidth={2.2} />
        Retour à l&apos;annuaire
      </Link>

      <div className="mt-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
          Gratuit · Vérification sous 48h
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-3xl">
          Ajouter mon commerce
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Remplis les informations de ton commerce. Kay vérifie chaque fiche à moto
          avant publication.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 space-y-5 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
        <Field label="Nom du commerce" htmlFor="name" required error={errors.name}>
          <input
            id="name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Ex. Alimentation Beya"
            autoComplete="organization"
            className={inputClass}
          />
        </Field>

        <div>
          <span className="text-xs font-bold text-ink">
            Catégorie <span className="text-red-500">*</span>
          </span>
          <div className="mt-2">
            <CategoryGrid
              active={form.category}
              onSelect={(category) => updateField('category', category)}
            />
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-ink">
            Commune <span className="text-red-500">*</span>
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMMUNES.map((commune) => {
              const selected = form.commune === commune;
              return (
                <button
                  key={commune}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateField('commune', commune)}
                  className={`h-12 rounded-full border px-4 text-[13px] font-semibold transition-colors ${
                    selected
                      ? 'border-knd bg-knd text-ink'
                      : 'border-line bg-white text-muted hover:border-knd/70 hover:text-ink'
                  }`}>
                  {commune}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Téléphone WhatsApp"
            htmlFor="whatsapp"
            required
            error={errors.whatsapp}
            helper="9 chiffres, ex. 970 000 001.">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                +243
              </span>
              <input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(event) => updateField('whatsapp', event.target.value)}
                placeholder="970 000 001"
                inputMode="tel"
                autoComplete="tel"
                style={{ paddingLeft: 72 }}
                className={inputClass}
              />
            </div>
          </Field>

          <Field label="Horaires" htmlFor="hours" required error={errors.hours}>
            <input
              id="hours"
              value={form.hours}
              onChange={(event) => updateField('hours', event.target.value)}
              placeholder="08:00 – 18:00"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Adresse" htmlFor="address" required error={errors.address}>
          <input
            id="address"
            value={form.address}
            onChange={(event) => updateField('address', event.target.value)}
            placeholder="Avenue, repère visible"
            autoComplete="street-address"
            className={inputClass}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          error={errors.description}
          helper="Une phrase pour présenter votre commerce.">
          <textarea
            id="description"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows={3}
            placeholder="Ex. Produits de première nécessité, ouvert tous les jours."
            className="w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-knd focus:ring-4 focus:ring-knd/20"
          />
        </Field>

        <Field
          label="Produits et services"
          htmlFor="products"
          helper="Séparez par des virgules (8 maximum).">
          <input
            id="products"
            value={form.products}
            onChange={(event) => updateField('products', event.target.value)}
            placeholder="Ciment, tôles, barres de fer..."
            className={inputClass}
          />
        </Field>

        <div>
          <span className="text-xs font-bold text-ink">Photo (optionnelle)</span>
          <p className="mt-0.5 text-[11px] text-muted">
            JPG ou PNG, 8 Mo maximum. Elle est compressée sur votre appareil.
          </p>

          <div className="mt-2 flex items-center gap-3">
            {photo ? (
              <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-line">
                <img src={photo} alt="Aperçu de la photo" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto(undefined)}
                  aria-label="Retirer la photo"
                  className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/70 text-white transition hover:bg-black">
                  <Trash2 size={13} strokeWidth={2.2} />
                </button>
              </div>
            ) : (
              <label className="flex size-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-[#FAFAF9] text-muted transition hover:border-knd hover:text-ink">
                <ImagePlus size={20} strokeWidth={1.8} />
                <span className="text-[10px] font-semibold">Ajouter</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto}
                  className="sr-only"
                />
              </label>
            )}

            <div className="text-[11px] leading-5 text-muted">
              <p>Une photo de la devanture aide les clients à vous trouver.</p>
              {photoBusy ? (
                <p className="mt-1 inline-flex items-center gap-1 font-semibold text-ink">
                  <Loader2 size={12} className="animate-spin" />
                  Compression…
                </p>
              ) : null}
              {photoError ? (
                <p className="mt-1 font-semibold text-red-600">{photoError}</p>
              ) : null}
            </div>
          </div>
        </div>

        {submitError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={photoBusy || submitBusy}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60">
          {submitBusy ? (
            <>
              Envoi…
              <Loader2 size={16} strokeWidth={2.3} className="animate-spin text-knd" />
            </>
          ) : (
            <>
              Envoyer ma fiche
              <Send size={16} strokeWidth={2.3} className="text-knd" />
            </>
          )}
        </button>

        <p className="text-center text-[10px] leading-4 text-muted">
          En envoyant, vous acceptez d&apos;être contacté sur WhatsApp.{' '}
          {remoteEnabled
            ? 'Votre fiche sera vérifiée sous 48h.'
            : 'La fiche reste sur cet appareil.'}
        </p>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: ReactNode;
}

function Field({ label, htmlFor, required, error, helper, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-xs font-bold text-ink">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1 text-[11px] font-semibold text-red-600">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-[11px] text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
