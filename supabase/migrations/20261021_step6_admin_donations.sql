-- Étape 6 — Don + Admin + Déploiement.
-- À exécuter dans le SQL Editor du projet Supabase (région eu-central-1).
--
-- Cette migration ajoute :
--   * les champs de vérification admin sur `places` ;
--   * la table `donations` (Mobile Money manuel V1) ;
--   * les policies RLS publiques / admin ;
--   * 2 fiches de démonstration en attente pour la recette /admin.
--
-- L'admin de production utilise le rôle `admin` dans `app_metadata` du JWT
-- Supabase. En attendant l'auth admin réelle, l'API Kindu Search utilise la clé
-- service_role côté serveur (jamais exposée au navigateur).

-- ---------------------------------------------------------------------------
-- Places : champs de vérification
-- ---------------------------------------------------------------------------

alter table public.places
  add column if not exists est_actif boolean not null default true,
  add column if not exists verifie_le timestamptz,
  add column if not exists verifie_par text,
  add column if not exists motif_refus text;

create index if not exists places_pending_idx
  on public.places (created_at)
  where est_verifie = false and est_actif = true;

-- ---------------------------------------------------------------------------
-- Admin : rôle dans le JWT Supabase
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() ->> 'role',
    ''
  ) = 'admin';
$$;

-- ---------------------------------------------------------------------------
-- Table donations
-- ---------------------------------------------------------------------------

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donateur_nom text,
  telephone text,
  montant numeric(12, 2) not null check (montant > 0),
  operateur text not null check (operateur in ('Airtel', 'Orange', 'M-Pesa')),
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'confirme', 'refuse')),
  preuve_url text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists donations_statut_idx on public.donations (statut);
create index if not exists donations_created_at_idx on public.donations (created_at desc);

alter table public.donations enable row level security;

-- Le donateur peut créer un don en attente. Il ne peut jamais le relire :
-- la lecture est réservée à l'admin (données personnelles, docs/05-backend.md).
grant insert on public.donations to anon;

drop policy if exists donations_public_insert on public.donations;
create policy donations_public_insert
on public.donations
for insert
to anon
with check (
  statut = 'en_attente'
  and confirmed_at is null
  and montant > 0
);

grant select, insert, update, delete on public.donations to authenticated;

drop policy if exists donations_admin_all on public.donations;
create policy donations_admin_all
on public.donations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Places : policies publiques et admin
-- ---------------------------------------------------------------------------

-- Une fiche vérifiée mais désactivée (fermeture demandée) n'est plus publique.
drop policy if exists places_public_read_verified on public.places;
create policy places_public_read_verified
on public.places
for select
to anon, authenticated
using (est_verifie = true and est_actif = true);

-- Le formulaire public peut créer une fiche en attente, sans jamais pouvoir
-- se déclarer Pro, vérifiée, active avec un stock ou liée à un marchand.
grant insert on public.places to anon;

drop policy if exists places_public_insert_pending on public.places;
create policy places_public_insert_pending
on public.places
for insert
to anon
with check (
  est_verifie = false
  and est_pro = false
  and est_actif = true
  and stock_live is null
  and merchant_id is null
);

grant select, insert, update, delete on public.places to authenticated;

drop policy if exists places_admin_all on public.places;
create policy places_admin_all
on public.places
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2 fiches de démonstration en attente pour /admin.
-- `on conflict do nothing` : une vérification déjà faite n'est pas écrasée
-- si la migration est rejouée.
-- ---------------------------------------------------------------------------

insert into public.places (
  id, name, category, commune, address, hours, whatsapp, phone, lat, lng,
  tone, description, products, est_pro, est_verifie, est_actif
)
values
  (
    'alimentation-beya', 'Alimentation Beya', 'Alimentation', 'Kasuku',
    'Avenue Kasuku, près du stade', '07:00 – 19:00',
    '243970000201', '+243 970 000 201', -2.9498, 25.9492, 'orange',
    'Farine, riz, huile et produits de première nécessité.',
    '["Farine de maïs", "Riz 5 kg", "Huile de palme", "Savon"]'::jsonb,
    false, false, true
  ),
  (
    'salon-mwamba', 'Salon Mwamba', 'Salon', 'Alunguli',
    'Avenue de la Paix, Alunguli', '09:00 – 20:00',
    '243970000202', '+243 970 000 202', -2.9601, 25.9428, 'rose',
    'Coiffure, tresses et soins pour femmes et enfants.',
    '["Tresses", "Coupe femme", "Manucure", "Soin du visage"]'::jsonb,
    false, false, true
  )
on conflict (id) do nothing;
