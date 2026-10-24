-- Étape 5 — KND OS → Kindu Search : stock live.
-- À exécuter dans le SQL Editor du projet Supabase (région eu-central-1).
--
-- La file `sync_queue` qui contient les payloads de ventes, clients et dettes
-- reste locale sur l'appareil (docs/05-backend.md) : elle transporte des données
-- personnelles. La table `sync_queue` créée ici n'est qu'un journal technique
-- sans payload, pour tracer les mises à jour de stock.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.places (
  id text primary key,
  name text not null,
  category text not null check (
    category in (
      'Resto', 'Hôtel', 'Pharmacie', 'Quincaillerie',
      'Magasin', 'Alimentation', 'Salon', 'Location'
    )
  ),
  commune text not null check (commune in ('Kasuku', 'Alunguli', 'Mikelenge')),
  address text not null,
  hours text not null,
  whatsapp text not null,
  phone text not null,
  lat double precision not null,
  lng double precision not null,
  tone text not null,
  description text not null,
  products jsonb not null default '[]'::jsonb,
  photo text,
  est_pro boolean not null default false,
  est_verifie boolean not null default false,
  merchant_id text,
  stock_live jsonb,
  stock_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists places_est_verifie_idx on public.places (est_verifie);
create index if not exists places_merchant_id_idx on public.places (merchant_id);

create table if not exists public.products (
  place_id text not null references public.places (id) on delete cascade,
  id text not null,
  merchant_id text,
  name text not null,
  sale_price numeric(12, 2) not null default 0,
  stock numeric(12, 2) not null default 0,
  unit text not null default 'PIECE',
  emoji text,
  molecule text,
  expiry_date date,
  prescription_required boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (place_id, id)
);

-- Jeton de synchronisation par commerce. Le hash n'est jamais lisible par anon.
create table if not exists public.place_sync_tokens (
  place_id text primary key references public.places (id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now()
);

-- Journal technique sans données personnelles (pas de payload de vente).
create table if not exists public.sync_queue (
  id bigint generated always as identity primary key,
  place_id text not null references public.places (id) on delete cascade,
  merchant_id text,
  action text not null default 'stock_live_update',
  status text not null default 'processed',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Mise à jour automatique de updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at
before update on public.places
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Recalcul de la table products à partir du snapshot stock_live
-- ---------------------------------------------------------------------------

create or replace function public.sync_products_from_stock_live()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.products where place_id = new.id;

  insert into public.products (
    place_id,
    id,
    merchant_id,
    name,
    sale_price,
    stock,
    unit,
    emoji,
    molecule,
    expiry_date,
    prescription_required,
    updated_at
  )
  select
    new.id,
    coalesce(nullif(item->>'id', ''), md5(item->>'name')),
    new.merchant_id,
    item->>'name',
    coalesce((item->>'price')::numeric, 0),
    coalesce((item->>'stock')::numeric, 0),
    coalesce(nullif(item->>'unit', ''), 'PIECE'),
    item->>'emoji',
    item->>'molecule',
    nullif(item->>'expiryDate', '')::date,
    coalesce((item->>'prescriptionRequired')::boolean, false),
    now()
  from jsonb_array_elements(coalesce(new.stock_live->'products', '[]'::jsonb)) as item
  where nullif(item->>'name', '') is not null;

  return new;
end;
$$;

drop trigger if exists places_sync_products on public.places;
create trigger places_sync_products
after insert or update of stock_live on public.places
for each row execute function public.sync_products_from_stock_live();

-- ---------------------------------------------------------------------------
-- RPC de synchronisation : KND OS envoie le snapshot complet du stock.
-- Le jeton est propre au commerce ; en production, il sera remplacé par
-- l'authentification commerçant Supabase (docs/05-backend.md).
-- ---------------------------------------------------------------------------

create or replace function public.update_merchant_stock_live(
  p_merchant_id text,
  p_token text,
  p_stock_live jsonb
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_place_id text;
  v_token_hash text;
  v_stock_live jsonb;
begin
  if p_merchant_id is null or length(trim(p_merchant_id)) = 0 then
    raise exception 'Commerce invalide.';
  end if;

  if p_token is null or length(p_token) < 8 then
    raise exception 'Jeton de synchronisation invalide.';
  end if;

  if p_stock_live is null or jsonb_typeof(p_stock_live) <> 'object' then
    raise exception 'Stock live invalide.';
  end if;

  if jsonb_typeof(p_stock_live->'products') <> 'array' then
    raise exception 'Liste de produits invalide.';
  end if;

  if jsonb_array_length(p_stock_live->'products') > 200 then
    raise exception 'Trop de produits dans le stock live.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_stock_live->'products') as item
    where nullif(item->>'name', '') is null
       or jsonb_typeof(item->'stock') <> 'number'
       or jsonb_typeof(item->'price') <> 'number'
       or nullif(item->>'unit', '') is null
  ) then
    raise exception 'Produit du stock live invalide.';
  end if;

  select p.id, t.token_hash
    into v_place_id, v_token_hash
  from public.places p
  join public.place_sync_tokens t on t.place_id = p.id
  where p.merchant_id = p_merchant_id
    and p.est_pro = true
    and p.est_verifie = true
  limit 1;

  if v_place_id is null then
    raise exception 'Commerce Pro introuvable pour ce marchand.';
  end if;

  if encode(digest(p_token, 'sha256'), 'hex') <> v_token_hash then
    raise exception 'Jeton de synchronisation invalide.';
  end if;

  -- L'heure serveur fait foi pour le badge « Stock vérifié Live ».
  v_stock_live := jsonb_set(p_stock_live, '{updatedAt}', to_jsonb(now()), true);

  update public.places
  set stock_live = v_stock_live,
      stock_updated_at = now()
  where id = v_place_id;

  insert into public.sync_queue (place_id, merchant_id, action, status)
  values (v_place_id, p_merchant_id, 'stock_live_update', 'processed');

  return v_place_id;
end;
$$;

revoke all on function public.update_merchant_stock_live(text, text, jsonb) from public;
grant execute on function public.update_merchant_stock_live(text, text, jsonb) to anon;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.places enable row level security;
alter table public.products enable row level security;
alter table public.place_sync_tokens enable row level security;
alter table public.sync_queue enable row level security;

grant select on public.places to anon, authenticated;

drop policy if exists places_public_read_verified on public.places;
create policy places_public_read_verified
on public.places
for select
to anon, authenticated
using (est_verifie = true);

-- Aucune policy publique sur products, place_sync_tokens et sync_queue :
-- anon ne peut ni les lire ni les écrire. Le RPC security definer contourne
-- RLS pour mettre à jour products via le trigger.
revoke all on public.products from public, anon, authenticated;
revoke all on public.place_sync_tokens from public, anon, authenticated;
revoke all on public.sync_queue from public, anon, authenticated;
revoke insert, update, delete on public.places from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime : Kindu Search écoute les changements de places.
-- ---------------------------------------------------------------------------

alter table public.places replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'places'
  ) then
    execute 'alter publication supabase_realtime add table public.places';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Données de démonstration (10 commerces de l'Étape 4).
-- Le stock de Mbuyi démarre à 44 sacs pour le scénario de recette 44 → 43.
-- ---------------------------------------------------------------------------

insert into public.places (
  id, name, category, commune, address, hours, whatsapp, phone, lat, lng,
  tone, description, products, est_pro, est_verifie, merchant_id,
  stock_live, stock_updated_at
)
values
  (
    'quincaillerie-mbuyi', 'Quincaillerie Mbuyi', 'Quincaillerie', 'Kasuku',
    'Avenue du Commerce, près du marché central', '07:30 – 18:00',
    '243970000101', '+243 970 000 101', -2.9475, 25.9535, 'amber',
    'Ciment, tôles, barres de fer et matériaux de construction pour vos chantiers.',
    '["Ciment Portland 50 kg", "Tôle ondulée", "Barre de fer 12 mm", "Clous"]'::jsonb,
    true, true, 'merchant-local',
    jsonb_build_object(
      'updatedAt', now(),
      'products', jsonb_build_array(
        jsonb_build_object('id', 'prod-ciment', 'name', 'Ciment CIMKO 50 kg', 'stock', 44, 'unit', 'SAC', 'price', 35000),
        jsonb_build_object('id', 'prod-barre-fer', 'name', 'Barre de fer 12mm', 'stock', 30, 'unit', 'BARRE 12m', 'price', 12000),
        jsonb_build_object('id', 'prod-tole', 'name', 'Tôle ondulée', 'stock', 30, 'unit', 'PIECE', 'price', 25000)
      )
    ),
    now()
  ),
  (
    'pharmacie-kasuku', 'Pharmacie Kasuku', 'Pharmacie', 'Kasuku',
    'Avenue Lumumba, face au marché', '08:00 – 20:00',
    '243970000102', '+243 970 000 102', -2.9438, 25.9582, 'green',
    'Médicaments essentiels, conseils et délivrance sur ordonnance.',
    '["Paracétamol 500 mg", "Amoxicilline", "Sirop contre la toux", "Vitamines"]'::jsonb,
    true, true, 'merchant-pharmacie',
    jsonb_build_object(
      'updatedAt', now(),
      'products', jsonb_build_array(
        jsonb_build_object('id', 'prod-paracetamol', 'name', 'Paracétamol 500 mg', 'stock', 20, 'unit', 'PIECE', 'price', 1000),
        jsonb_build_object('id', 'prod-amoxicilline', 'name', 'Amoxicilline 500 mg', 'stock', 12, 'unit', 'PIECE', 'price', 2500)
      )
    ),
    now()
  ),
  (
    'resto-le-baobab', 'Resto Le Baobab', 'Resto', 'Alunguli',
    'Avenue de la Paix, Alunguli', '10:00 – 22:00',
    '243970000103', '+243 970 000 103', -2.9585, 25.9405, 'rose',
    'Cuisine locale : riz, poulet, poisson et plantains.',
    '["Riz au poulet", "Poisson braisé", "Plantains", "Jus de bissap"]'::jsonb,
    false, true, null, null, null
  ),
  (
    'hotel-fleuve-congo', 'Hôtel Fleuve Congo', 'Hôtel', 'Mikelenge',
    'Boulevard du Fleuve, Mikelenge', '24h/24',
    '243970000104', '+243 970 000 104', -2.9365, 25.9445, 'blue',
    'Chambres climatisées, restaurant et vue sur le fleuve.',
    '["Chambre simple", "Chambre double", "Petit-déjeuner", "Salle de réunion"]'::jsonb,
    false, true, null, null, null
  ),
  (
    'magasin-umoja', 'Magasin Umoja', 'Magasin', 'Alunguli',
    'Marché d''Alunguli, allée 4', '07:00 – 19:00',
    '243970000105', '+243 970 000 105', -2.9558, 25.9338, 'violet',
    'Produits de première nécessité au meilleur prix.',
    '["Sucre 1 kg", "Riz 5 kg", "Huile de palme", "Savon"]'::jsonb,
    true, true, 'merchant-magasin',
    jsonb_build_object(
      'updatedAt', now(),
      'products', jsonb_build_array(
        jsonb_build_object('id', 'prod-sucre', 'name', 'Sucre 1 kg', 'stock', 15, 'unit', 'KG', 'price', 4000),
        jsonb_build_object('id', 'prod-riz', 'name', 'Riz 5 kg', 'stock', 8, 'unit', 'PIECE', 'price', 15000)
      )
    ),
    now()
  ),
  (
    'alimentation-mama-nzuzi', 'Alimentation Mama Nzuzi', 'Alimentation', 'Kasuku',
    'Avenue Kasuku, près de l''école', '06:30 – 18:30',
    '243970000106', '+243 970 000 106', -2.9512, 25.9468, 'orange',
    'Farine, haricots, arachides et produits frais du marché.',
    '["Farine de maïs", "Haricots", "Arachides", "Manioc"]'::jsonb,
    false, true, null, null, null
  ),
  (
    'salon-grace', 'Salon Grâce', 'Salon', 'Mikelenge',
    'Avenue de l''Indépendance, Mikelenge', '09:00 – 19:00',
    '243970000107', '+243 970 000 107', -2.9415, 25.9318, 'rose',
    'Coiffure, tresses, manucure et soins du visage.',
    '["Tresses", "Coupe femme", "Manucure", "Soin du visage"]'::jsonb,
    false, true, null, null, null
  ),
  (
    'location-mavuno', 'Location Mavuno', 'Location', 'Alunguli',
    'Avenue Mavuno, Alunguli', '08:00 – 17:00',
    '243970000108', '+243 970 000 108', -2.9622, 25.9472, 'teal',
    'Maisons, appartements et salles à louer pour tous les budgets.',
    '["Maison 2 chambres", "Appartement", "Salle de fête", "Terrain"]'::jsonb,
    true, true, null, null, null
  ),
  (
    'resto-les-palmiers', 'Resto Les Palmiers', 'Resto', 'Mikelenge',
    'Route de Kalima, Mikelenge', '11:00 – 23:00',
    '243970000109', '+243 970 000 109', -2.9468, 25.9528, 'amber',
    'Poisson du fleuve, frites et boissons fraîches.',
    '["Poisson frit", "Frites", "Boissons", "Brochettes"]'::jsonb,
    false, true, null, null, null
  ),
  (
    'quincaillerie-tumaini', 'Quincaillerie Tumaini', 'Quincaillerie', 'Mikelenge',
    'Avenue Tumaini, Mikelenge', '08:00 – 18:00',
    '243970000110', '+243 970 000 110', -2.9652, 25.9555, 'slate',
    'Peinture, vis, outils et petit matériel pour la maison.',
    '["Ciment 50 kg", "Peinture", "Vis et clous", "Marteau"]'::jsonb,
    false, true, null, null, null
  )
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  commune = excluded.commune,
  address = excluded.address,
  hours = excluded.hours,
  whatsapp = excluded.whatsapp,
  phone = excluded.phone,
  lat = excluded.lat,
  lng = excluded.lng,
  tone = excluded.tone,
  description = excluded.description,
  products = excluded.products,
  est_pro = excluded.est_pro,
  est_verifie = excluded.est_verifie,
  merchant_id = excluded.merchant_id,
  stock_live = coalesce(public.places.stock_live, excluded.stock_live),
  stock_updated_at = coalesce(public.places.stock_updated_at, excluded.stock_updated_at);

-- Jeton de démonstration : à remplacer par l'authentification commerçant
-- avant la mise en production (docs/05-backend.md).
insert into public.place_sync_tokens (place_id, token_hash)
values
  (
    'quincaillerie-mbuyi',
    encode(extensions.digest('demo-sync-token-kay', 'sha256'), 'hex')
  ),
  (
    'pharmacie-kasuku',
    encode(extensions.digest('demo-sync-token-kay', 'sha256'), 'hex')
  ),
  (
    'magasin-umoja',
    encode(extensions.digest('demo-sync-token-kay', 'sha256'), 'hex')
  )
on conflict (place_id) do update set token_hash = excluded.token_hash;
