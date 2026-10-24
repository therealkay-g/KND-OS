# Supabase — Étape 5 (Stock Live)

La migration `migrations/20261020_step5_stock_live.sql` crée :

| Table | Rôle |
| --- | --- |
| `places` | Fiches publiques Kindu Search + snapshot `stock_live` |
| `products` | Produits du stock live, recalculés par trigger |
| `place_sync_tokens` | Hash du jeton de synchronisation par commerce |
| `sync_queue` | Journal technique des mises à jour de stock, sans payload |

## Mise en place

1. Créer un projet Supabase en **eu-central-1 (Francfort)**.
2. SQL Editor → coller et exécuter la migration.
3. Renseigner les variables d'environnement :

```bash
# KND OS (.env.local à la racine)
EXPO_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<clé publishable sb_publishable_...>
EXPO_PUBLIC_KND_SYNC_TOKEN=<jeton du commerce>
EXPO_PUBLIC_KND_OS_PRO=true

# Kindu Search (kindu-search/.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé publishable sb_publishable_...>
SUPABASE_SERVICE_ROLE_KEY=<clé secrète sb_secret_..., serveur uniquement>
```

Si le projet contient déjà l'ancien schéma `places` (`nom`, `quartier`, ...),
utiliser `cloud/20261021_kindu_search_apply.sql` : l'ancienne table est déplacée
dans le schéma privé `legacy` avant l'application des Étapes 5 et 6.

## Vérifier le stock

```sql
select id, merchant_id, stock_live, stock_updated_at
from public.places
where id = 'quincaillerie-mbuyi';
```

Le seed démarre avec **44 sacs** de ciment. Après une vente KND OS, le RPC
`update_merchant_stock_live` met à jour `places.stock_live` et le trigger
recalcule `products`.

## Sécurité

- `places` : lecture publique limitée à `est_verifie = true`.
- `products`, `place_sync_tokens`, `sync_queue` : aucun accès anon.
- Écriture uniquement via le RPC `update_merchant_stock_live` (security definer),
  protégé par un jeton par commerce.
- Le jeton `demo-sync-token-kay` du seed est **de démonstration**. Il doit être
  remplacé par l'authentification commerçant Supabase (OTP) avant la production
  (`docs/05-backend.md`).

## Notes

- La file `sync_queue` **locale** de KND OS garde les payloads de ventes, clients
  et dettes sur l'appareil. La table Supabase du même nom ne stocke qu'un journal
  technique sans données personnelles.
- Kindu Search écoute `places` via Realtime ; la publication
  `supabase_realtime` est configurée par la migration.
- Sans variables Supabase, les apps utilisent le mode démo local et le pont
  `/api/stock-live` de Kindu Search.
