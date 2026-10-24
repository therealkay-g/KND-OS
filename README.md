# KND OS

Caisse mobile et desktop pour les commerçants de Kindu, RDC.
Projet de **Kay Nzogu** — octobre 2026.

> **Étapes 1-6 implémentées et recettées localement**
> Login OTP de démo, stock local, vente cash/crédit, clients et dettes, bénéfice du jour,
> péremption, molécules et ordonnances, unités décimales, devis chantier et ticket
> simulé (mode Quincaillerie).
> **Kindu Search** est une app **Next.js séparée** dans `kindu-search/` : carte Leaflet,
> 10 commerces fictifs, recherche, fiches commerce et ajout local.
> **Stock Live** : une vente KND OS met à jour le stock des commerces Pro sur
> Kindu Search via Supabase (ou le pont de démonstration local sans Supabase).
> **Étape 6** : page **Don** Mobile Money manuel, page **/admin** de vérification,
> **PWA installable** et configuration **EAS Build** pour l'APK. Le dépôt GitHub
> est publié sur `main` ; Vercel/EAS n'ont pas encore été déployés (voir
> [Déploiement](#déploiement)).

---

## Lancer le projet

### KND OS

```bash
npm install
npm run web
```

Ouvrir **http://localhost:5173**.

> Sous Windows PowerShell, si `npm` est bloqué par la politique d'exécution,
> utiliser `npm.cmd install` puis `npm.cmd run web`.

### Kindu Search (Étapes 4-6)

Kindu Search a son propre `package.json` et ses propres dépendances :

```bash
cd kindu-search
npm install
npm run dev
```

Ouvrir **http://localhost:3000** (ou **http://127.0.0.1:3000** si `localhost`
ne répond pas sur votre machine). Si le port 3000 est déjà pris par une autre
application Next, servir le build avec `npx next start -p 3001` et utiliser
`http://127.0.0.1:3001`.

Pour la recette **Stock Live** avec le pont local, utiliser plutôt le build de
production (`npm run build` puis `npm run start`) : le pont `/api/stock-live` est
alors servi par Next. Les variables Supabase sont décrites dans
[Vérification de l'Étape 5](#vérification-de-létape-5-stock-live).

| Commande (dans `kindu-search/`) | Effet |
| --- | --- |
| `npm run dev` | Next.js sur `http://localhost:3000` |
| `npm run build` | Build de production |
| `npm run start` | Sert le build sur le port 3000 |
| `npm run typecheck` | Vérification TypeScript de Kindu Search |

### Connexion de démonstration

1. Saisir un numéro WhatsApp à 9 chiffres, par exemple `970 000 000`.
2. Cliquer sur **Recevoir le code WhatsApp**.
3. Saisir le code **1234**.
4. Au premier lancement : nom du commerce, commune et mode
   **Magasin**, **Pharmacie** ou **Quincaillerie**.
5. Le dashboard s'ouvre avec **Vendu aujourd'hui : 0 CDF**.

Le bouton **Déconnexion** est dans les paramètres (icône engrenage du dashboard).

### Autres commandes

| Commande | Effet |
| --- | --- |
| `npm run web` | Expo Web sur `http://localhost:5173` |
| `npm start` | Serveur Expo (Expo Go / dev build) |
| `npm run android` | Ouvre Android avec Expo |
| `npm run typecheck` | Vérification TypeScript |
| `npm run export:web` | Build web de production dans `dist/` |
| `powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1` | Régénère les icônes KND |

---

## Vérification de l'Étape 1

Checklist alignée sur `docs/06-plan.md` :

- [x] Login OTP factice : téléphone + code `1234`.
- [x] Base locale avec les tables `products`, `clients`, `sales`, `sale_items`,
      `debt_payments`, `sync_queue` (SQLite sur mobile, localStorage sur le web de dev).
- [x] Dashboard : vendu aujourd'hui, bénéfice, nombre de ventes, alerte stock faible.
- [x] 6 produits de démonstration, tap sur un produit = ajout au panier.
- [x] Panier flottant, quantités +/−, total et bénéfice estimé.
- [x] Vente **Cash** : stock déduit, vente enregistrée, confirmation à l'écran.
- [x] Vente **Crédit** : choix/création d'un client, dette ajoutée.
- [x] Stock : liste, filtre stock faible, ajout et modification de produit.
- [x] Clients : liste, filtre « Clients qui doivent », fiche client, encaissement de dette.
- [x] Bénéfice : aujourd'hui / semaine / mois, graphique 7 jours, détail des ventes du jour.
- [x] Onglet Kindu Search : aperçu de la fiche publique du commerce + compteurs à 0.
- [x] Design KND OS : fond `#0A0A0A`, cartes `#1A1A1A`, accent `#FFC300`, Inter.
- [x] Responsive navigateur (mobile et desktop).

### Scénario de test conseillé

1. Dashboard : **Vendu aujourd'hui = 0 CDF**, une alerte « Stock faible » (Savon Kabeya, 4).
2. Aller dans **Vente** → taper **Coca-Cola 1.5L** → panier.
3. Ouvrir le panier → **Vendre Cash** → le stock Coca passe de 24 à 23.
4. Retour au dashboard : ventes et bénéfice mis à jour.
5. Aller dans **Clients / Dettes** → ouvrir **Maman Georgette** → **Encaisser dette**
   (après lui avoir vendu un produit à crédit).
6. Aller dans **Bénéfice** → le graphique et le détail du jour affichent la vente.

---

## Vérification de l'Étape 2 (Mode Pharmacie)

Checklist alignée sur `docs/06-plan.md` et `docs/01-prd.md` :

- [x] Choix du mode **Magasin / Pharmacie** au login (Quincaillerie ajoutée à l'Étape 3).
- [x] Champs produit pharmacie : **molécule**, **date de péremption** (AAAA-MM-JJ),
      **ordonnance requise**.
- [x] Badges péremption sur la liste stock : rouge sous 30 jours, orange de 30 à 60 jours
      (produit expiré = rouge).
- [x] Filtre « Périme bientôt » sur le stock + recherche par molécule dans la vente.
- [x] Popup **photo d'ordonnance** : la vente est bloquée sans photo si un produit l'exige.
- [x] Page **Alertes péremption**, accessible depuis l'alerte du dashboard en mode Pharmacie.
- [x] Dashboard : alerte « Péremption » quand un produit est à moins de 30 jours
      (ou déjà périmé).
- [x] Mode de commerce modifiable dans les **Paramètres** (`docs/02-app-flow.md`).
- [x] Catalogue de démo adapté au mode : 6 produits Magasin, ou 2 produits Pharmacie
      (Paracétamol et Amoxicilline avec ordonnance) à l'onboarding.

### Scénario de test conseillé (Pharmacie)

1. **Paramètres** → **Mode de commerce** → choisir **Pharmacie**.
2. **Stock** → **Ajouter** → « Paracétamol », molécule « Paracétamol », péremption
   `2026-11-20`, stock 20 → enregistrer.
3. La liste stock affiche le badge orange « Expire dans Xj » (X dépend de la date du
   jour ; ex. 32 j le 19/10/2026 — `docs/06-plan.md` cite 33 j, valeur du 18/10/2026).
4. **Dashboard** → alerte **Péremption** → page **Alertes péremption** (badge orange).
5. Ajouter un produit avec **Ordonnance requise** → le vendre en caisse → la vente
   ouvre la popup photo ; « Valider et continuer » reste bloqué tant qu'aucune photo
   n'est jointe.
6. **Vente** : la recherche trouve aussi par molécule.

---

## Vérification de l'Étape 3 (Mode Quincaillerie + Devis)

Checklist alignée sur `docs/06-plan.md` et `docs/01-prd.md` :

- [x] Mode **Quincaillerie** disponible au login et dans les Paramètres.
- [x] Unités **SAC, BARRE 12m, KG, METRE, ROULEAU, PIECE**, quantités décimales
      (`2,5` barres, `0,5` sac).
- [x] **Unité libre** (Magasin, Pharmacie et Quincaillerie) : en plus des 6 unités
      prédéfinies, choix **Autre…** et saisie manuelle (ex. `CARTON`, `BIDON`, `PAQUET`).
- [x] Affichage stock : `12,5 kg`, `45 sacs (2 250 kg)`, `30 barres (360 m)`.
- [x] Panier : incrément de 0,5 pour les unités décimales (2,5 barres = 3 clics sur +).
- [x] Page **Devis chantier** : Nouveau devis → Chambre 4x4 → liste auto
      (20 sacs ciment + 15 barres 12mm + 20 tôles) + total.
- [x] **Convertir en vente** : déduit le stock et enregistre une vente cash.
- [x] Ticket HTML simulé (impression Bluetooth factice) affiché après conversion.
- [x] Catalogue de démo Quincaillerie : ciment (45 sacs), barre 12mm (30 barres),
      tôle (30 pièces).

### Scénario de test conseillé (Quincaillerie)

1. Se déconnecter, vider la clé `knd-os:v1` du localStorage (ou nouvel appareil),
   refaire le login et choisir **Quincaillerie** à l'onboarding.
2. **Stock** : le ciment affiche **45 sacs (2 250 kg)**, la barre **30 barres (360 m)**.
3. **Stock** → **Ajouter** : « Barre fer 12m », prix de vente 10 000 CDF,
   stock **10**, unité **BARRE 12m**.
4. **Vente** → taper « Barre fer 12m » → panier → augmenter 3 fois (+0,5)
   → quantité **2,5** → **Vendre Cash**.
5. **Stock** : la barre affiche **7,5 barres (90 m)**.
6. **Dashboard** → **Devis chantier** → **Nouveau devis** → **Chambre 4x4** :
   20 sacs + 15 barres + 20 tôles, total **1 380 000 CDF** avec les prix de démo.
7. **Convertir en vente** → ticket simulé, puis stock : ciment **25 sacs**,
   barre 12mm **15 barres**, tôle **10 pièces**. Le devis est consommé après
   conversion ; le ticket reste affiché jusqu'à sa fermeture.

> Les modèles **Maison 2 chambres**, **Latrine** et **Dalle** sont visibles mais
> désactivés : leurs quantités de référence ne sont pas fournies (`[À CONFIRMER]`
> dans `docs/01-prd.md`). Seul **Chambre 4x4** est documenté.
> Prix de démo : seul le ciment à **35 000 CDF/sac** est documenté (`docs/03-design.md`) ;
> les prix de la barre et de la tôle sont provisoires `[À CONFIRMER]`.

### Tester une unité libre

1. **Stock** → **Ajouter** → renseigner le produit → sous **Unité**, choisir **Autre…**.
2. Saisir l'unité (ex. `PAQUET`), puis enregistrer : la liste affiche `20 paquets`.
3. La vente propose `5 000 CDF / paquet` et le stock se déduit normalement.
4. Modifier le produit : l'unité personnalisée est préremplie et reste modifiable.

---

## Vérification de l'Étape 4 (Kindu Search V1)

Kindu Search est une **app Next.js séparée** dans `kindu-search/`. Elle ne dépend
pas de l'app Expo et possède son propre `package.json`.

Checklist alignée sur `docs/06-plan.md` :

- [x] Accueil : recherche texte, **8 catégories** (Resto, Hôtel, Pharmacie,
      Quincaillerie, Magasin, Alimentation, Salon, Location), filtre **commune**
      (Kasuku, Alunguli, Mikelenge), toggle **Liste / Carte**.
- [x] Carte **Leaflet + OpenStreetMap** centrée sur Kindu (`-2.95, 25.95`), **10 pins**.
- [x] Cards : nom, catégorie, commune, badge **Pro**, statut ouvert/fermé.
- [x] Fiche commerce : galerie de photos, adresse, horaires, produits et boutons
      **WhatsApp / Appeler / Itinéraire**.
- [x] Page **Ajouter mon commerce** : formulaire, photo compressée, stockage local.
- [x] Recherche « ciment » : filtre la carte et la liste ; le tri met les commerces
      **Pro** en premier.
- [x] WhatsApp ouvre `wa.me` avec un message pré-rempli ; l'itinéraire ouvre Google Maps.
- [x] Design Kindu Search : fond blanc, accent `#FFC300`, Inter, cibles tactiles
      (boutons, filtres, liens d'action) ≥ 48 px.
- [x] **Données fictives uniquement** : aucune dette, aucun client et aucune vente
      de KND OS n'est exposé dans Kindu Search.
- [x] Terminologie corrigée : **commune** (entité administrative de Kindu) dans l'UI,
      les types, les données locales et la documentation.

> Les 10 commerces et leurs numéros WhatsApp sont **fictifs**. Les photos des fiches
> de démonstration sont des **illustrations locales** (dégradé + emoji) : aucune photo
> réelle n'est utilisée. L'upload de photo est disponible pour les fiches ajoutées.
>
> Catégories : les 8 catégories du design (`docs/03-design.md`) + le lien
> « Tout afficher », qui retire uniquement le filtre de catégorie. Le bouton
> « Réinitialiser » remet à zéro la recherche, la catégorie et la commune.
> Le PRD et l'app-flow mentionnent aussi « Tous » comme filtre ; il est représenté
> par ce mécanisme de réinitialisation.

### Scénario de test conseillé (Kindu Search)

1. Dans `kindu-search/`, lancer `npm run dev` puis ouvrir **http://localhost:3000**.
   La vue **Carte** s'ouvre sur Kindu avec **10 pins** et la liste des 10 commerces
   à droite (ou sous la carte sur mobile).
2. Rechercher **« ciment »** : la carte se recadre et affiche **2 quincailleries**
   (Mbuyi et Tumaini). Passer en **Liste** pour voir les deux cards.
3. Ouvrir **Quincaillerie Mbuyi** : la fiche affiche la galerie, l'adresse, les
   horaires et les produits. **WhatsApp** pointe vers `wa.me/243970000101` avec un
   message pré-rempli ; **Appeler** vers `tel:+243970000101` ; **Itinéraire** vers
   Google Maps.
4. Filtrer la commune **Alunguli** → 3 commerces ; ajouter la catégorie **Resto**
   → 1 commerce ; cliquer **Réinitialiser**.
5. **Ajouter mon commerce** : remplir le nom, la catégorie, la commune, le WhatsApp
   (9 chiffres), l'adresse et les horaires, puis envoyer. Le message « Kay va vérifier
   votre commerce à moto dans 48h » s'affiche ; la fiche est marquée **En attente**.
6. Recharger la page : la fiche ajoutée est toujours là (localStorage
   `kindu-search:places:v1`). Pour repartir de zéro :
   `localStorage.removeItem('kindu-search:places:v1')`.

> Version : Next.js 16 (le TRD cite Next 14 ; l'App Router et les conventions restent
> les mêmes). Le manifeste PWA et le service worker sont ajoutés à l'Étape 6
> (`public/sw.js`, icônes 192/512, bouton **Installer l'app**).

---

## Vérification de l'Étape 5 (Stock Live)

Objectif : une vente saisie dans **KND OS** met à jour le stock affiché sur
**Kindu Search** en moins de 5 secondes, pour un commerce **Pro**.

Checklist alignée sur `docs/06-plan.md` :

- [x] Schéma Supabase : `places`, `products`, `sync_queue` (journal sans payload),
      `place_sync_tokens`, RLS et publication Realtime.
- [x] KND OS envoie un snapshot du stock après une vente ou une modification de
      produit ; la file locale `sync_queue` reste la source de vérité hors ligne.
- [x] Kindu Search lit les commerces `est_verifie = true` depuis Supabase et écoute
      les mises à jour de `places` via Realtime.
- [x] Badge **Stock vérifié Live** (vert) si `est_pro = true` et mise à jour < 24 h ;
      sinon **Stock d'il y a X jours** (orange).
- [x] Les cards, la fiche et les popups Leaflet affichent les quantités live
      (ex. `44 sacs`) et les prix.
- [x] Mode de démonstration local sans Supabase : pont `/api/stock-live` + polling 2 s,
      pour la recette sur deux onglets.
- [x] Aucune donnée client, dette ou vente n'est exposée publiquement.

### Option A — Supabase (production)

1. Créer un projet Supabase en **eu-central-1 (Francfort)**.
2. Exécuter `supabase/migrations/20261020_step5_stock_live.sql` dans le SQL Editor.
3. Renseigner les variables :

   ```bash
   # .env.local à la racine (KND OS)
   EXPO_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<clé anon>
   EXPO_PUBLIC_KND_SYNC_TOKEN=<jeton du commerce>
   EXPO_PUBLIC_KND_OS_PRO=true

   # kindu-search/.env.local
   NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon>
   ```

4. Rebuilder les deux apps, puis vérifier le scénario 44 → 43 sacs ci-dessous.
5. Le jeton de démonstration publié dans la migration (`demo-sync-token-kay`) doit
   être remplacé avant toute mise en ligne. L'authentification commerçant réelle
   reste `[À CONFIRMER]` : l'Étape 6 ajoute l'admin et les dons, pas encore l'auth
   commerçant Supabase.

> Sans variables Supabase, Kindu Search reste sur les 10 fiches de démo : aucune
> requête réseau vers un projet inexistant n'est effectuée.

### Option B — Pont de démonstration local (sans Supabase)

La recette peut être faite entièrement en local. Le pont est un **fallback de démo** ;
il ne remplace pas Supabase en production.

```bash
# 1. Kindu Search : build + serveur (le pont a besoin du serveur Next)
cd kindu-search
npm run build
npm run start

# 2. kindu-search/.env.local (pont local)
DEMO_SYNC_TOKEN=demo-sync-token-kay
DEMO_BRIDGE_ENABLED=true
NEXT_PUBLIC_DEMO_BRIDGE=true

# 3. KND OS : .env.local à la racine
EXPO_PUBLIC_KND_OS_PRO=true
EXPO_PUBLIC_KND_SYNC_TOKEN=demo-sync-token-kay
EXPO_PUBLIC_STOCK_BRIDGE_URL=http://127.0.0.1:3000/api/stock-live

# 4. Rebuild de l'aperçu web KND OS
npm run export:web
# puis servir dist/ sur http://127.0.0.1:5173
```

### Scénario de recette 44 → 43

1. Ouvrir **http://127.0.0.1:5173** (KND OS, mode **Quincaillerie**) et
   **http://127.0.0.1:3000** (Kindu Search) dans deux onglets.
2. Sur Kindu Search, rechercher **« ciment »** : **Quincaillerie Mbuyi** affiche
   **44 sacs** et le badge **Stock vérifié Live**.
3. Sur KND OS, vendre **1 sac de Ciment CIMKO 50 kg**.
4. Kindu Search passe à **43 sacs** après le polling (≤ 2 s) ou la mise à jour
   Realtime Supabase (≤ 5 s). La fiche Mbuyi et le popup de la carte sont à jour.
5. Pour repartir de zéro, vider les données locales KND OS
   (`localStorage.removeItem('knd-os:v1')`) puis refaire l'onboarding.

> Le stock de démonstration du ciment est fixé à **44 sacs** dans `seed.ts` et dans
> `data/places.json` pour rendre ce scénario déterministe. Le PRD cite 45 sacs comme
> exemple ; il ne s'agit pas d'une valeur imposée.

### Résultat de la recette locale (21/10/2026)

Recette exécutée avec le pont de démonstration, sans projet Supabase :

- Kindu Search affichait **44 sacs** et le badge **Stock vérifié Live** sur la fiche
  **Quincaillerie Mbuyi**.
- Une vente de **1 sac de Ciment CIMKO 50 kg** dans KND OS a fait passer le stock
  local de **44 à 43**.
- Le pont `/api/stock-live` a reçu le snapshot **≈ 0,7 s** après la vente
  (`updatedAt` du snapshot : `10:50:35.709Z`, vente : `10:50:34.978Z`).
- La fiche Kindu Search affichait ensuite **43 sacs**, le badge Live et la mention
  « mis à jour à l'instant », dans le cycle de polling de 2 s.
- Les typechecks KND OS et Kindu Search passent. Le build de production Kindu
  Search a été généré puis démarré avec `next start` ; le pont local et
  l'affichage des **44 sacs** y ont été vérifiés.

> La validation sur un projet Supabase cloud reste à faire : aucun projet ni clés
> ne sont disponibles dans cet environnement. Le mode local valide le flux
> applicatif, pas la migration SQL ni Realtime en conditions réelles.

### Limites connues de l'Étape 5

- **File locale** : les payloads de ventes, clients et dettes restent dans
  `sync_queue` sur l'appareil (docs/05-backend.md). Seuls le stock et les produits
  sont envoyés à Supabase. Leur synchronisation complète reste hors périmètre de
  l'Étape 6 et devra être traitée avec l'authentification commerçant `[À CONFIRMER]`.
- **`sync_queue` Supabase** : la table du même nom ne contient qu'un journal
  technique (`place_id`, action, statut), jamais les données personnelles.
- **Auth** : le jeton de synchronisation est une solution de démonstration. La
  sécurité de production repose sur Supabase Auth (OTP) et RLS par commerçant.
- **Validation Supabase cloud** : non exécutée dans cet environnement, faute de
  projet et de clés. Le mode local et les builds sont vérifiés ; la migration SQL
  doit être appliquée puis testée sur le projet réel.

---

## Vérification de l'Étape 6 (Don + Admin + PWA)

Objectif : bouton don, vérification admin et mise en ligne. La partie applicative
est implémentée et recettée localement ; le déploiement public reste bloqué par
l'absence de comptes Vercel / Expo authentifiés.

Checklist alignée sur `docs/06-plan.md` :

- [x] **Page `/don`** : texte de soutien, **4 montants** (5 000, 10 000, 20 000 CDF
      et montant libre), boutons **Airtel Money / Orange Money / M-Pesa**.
- [x] Paiement **manuel V1** : chaque bouton ouvre `wa.me` avec le montant et
      l'opérateur dans le message. Aucun paiement en ligne réel.
- [x] Après le clic, un formulaire optionnel permet d'enregistrer le don
      (nom/téléphone optionnels) dans `donations` si Supabase est configuré,
      sinon dans `kindu-search:donations:v1` pour la démo.
- [x] **Page `/admin`** : login par code, cookie `HttpOnly`, carte Leaflet avec
      pins **gris** (en attente) / **verts** (vérifiés), liste « À vérifier »,
      boutons **Vérifier / Refuser**.
- [x] **2 commerces en attente** dans la démo : `Alimentation Beya` (Kasuku) et
      `Salon Mwamba` (Alunguli).
- [x] Formulaire public : si Supabase est configuré, la fiche est créée avec
      `est_verifie = false` et `est_pro = false` ; sinon elle reste locale.
- [x] Migration `supabase/migrations/20261021_step6_admin_donations.sql` :
      table `donations`, champs de vérification sur `places`, RLS admin/public,
      et les 2 fiches en attente.
- [x] **PWA installable** : manifeste, icônes 192/512, service worker
      (`public/sw.js`) et bouton **Installer l'app**.
- [x] Configuration **EAS Build** (`eas.json`, profil `preview` en APK).
- [ ] **Déploiement Vercel** : non exécuté, aucun compte/CLI authentifié.
- [ ] **APK EAS + lien direct** : non exécuté, aucun compte Expo authentifié.
- [ ] **Validation Supabase cloud** : non exécutée, aucun projet ni clés.

### Résultat de la recette locale (21/10/2026)

- `npm run typecheck` : OK.
- `npm run build` : OK avec Webpack (fallback WASM connu) ; build production
  servi sur **http://127.0.0.1:3001** (le port 3000 est occupé par une autre app
  dans cet environnement).
- `/don` : 4 montants, 3 opérateurs, liens `wa.me` corrects pour 20 000 CDF,
  enregistrement local du don vérifié.
- `/admin` : login `kay-demo`, **2 en attente / 10 vérifiés**, vérification de
  `Alimentation Beya` (**1 / 11**), refus de `Salon Mwamba` (**0 / 11**).
- Annuaire public : **11 commerces** après vérification, `Alimentation Beya`
  visible, `Salon Mwamba` absent ; la fiche de Beya n'affiche plus « En attente ».
- PWA : `/manifest.webmanifest` (200), icônes 192/512 (200), `sw.js` actif et
  bouton **Installer l'app** avec instructions Android/iPhone.
- Non testés : Supabase cloud, Vercel et EAS (comptes/clés absents).
- Dernier passage du 21/10/2026 : build final OK, titre `/don` =
  « Soutenir Kindu Search », cache service worker `kindu-search-v2`, démo remise
  à zéro (**2 en attente / 10 vérifiés**, aucun don de test conservé).

### Tester `/don`

1. Ouvrir **http://localhost:3000/don**.
2. Choisir **10 000 CDF** : les trois boutons affichent ce montant.
3. Choisir **Libre** et saisir **15 000** : les liens `wa.me` sont mis à jour.
4. Cliquer sur **Airtel Money**, **Orange Money** ou **M-Pesa** : WhatsApp s'ouvre
   avec le message pré-rempli, puis le message de remerciement s'affiche.
5. Facultatif : saisir un nom/téléphone et cliquer **Enregistrer mon don**. Sans
   Supabase, le don est stocké dans `kindu-search:donations:v1` ; avec Supabase,
   une ligne `donations` est créée avec `statut = en_attente`.
6. Le numéro de démonstration est `243970000101` ; il est **fictif** et doit être
   remplacé par le numéro Mobile Money de Kay `[À CONFIRMER]` via
   `NEXT_PUBLIC_DONATION_WHATSAPP`.
7. Pour effacer les dons de démo :
   `localStorage.removeItem('kindu-search:donations:v1')`.

### Tester `/admin`

1. Ouvrir **http://localhost:3000/admin**. En mode démo, le code est **`kay-demo`**
   (affiché sous le formulaire).
2. Après connexion : **2 en attente**, **10 vérifiés**, carte de Kindu et deux
   cards avec photos/illustrations, catégorie, commune, adresse et téléphone.
3. Cliquer **Vérifier** sur `Alimentation Beya` : la fiche passe à **11 vérifiés**,
   le pin devient vert et la fiche apparaît dans l'annuaire public après
   rechargement.
4. Cliquer **Refuser** sur `Salon Mwamba` : la fiche disparaît de la liste et
   n'est jamais publiée.
5. Pour recommencer la recette locale :

   ```js
   localStorage.removeItem('kindu-search:admin-decisions:v1');
   localStorage.removeItem('kindu-search:places:v1');
   ```

> En mode démo, les décisions restent dans le navigateur. En production, l'API
> admin utilise `SUPABASE_SERVICE_ROLE_KEY` **côté serveur uniquement** ; la clé
> ne doit jamais être préfixée `NEXT_PUBLIC_` ni exposée au navigateur.

### Migration Supabase Étape 6

Appliquer les migrations dans l'ordre :

```text
supabase/migrations/20261020_step5_stock_live.sql
supabase/migrations/20261021_step6_admin_donations.sql
```

Si le projet cloud contient déjà une ancienne table `public.places` avec les
colonnes françaises `nom` / `quartier`, exécuter plutôt le script consolidé
`supabase/cloud/20261021_kindu_search_apply.sql` dans le SQL Editor : il déplace
l'ancienne table dans le schéma privé `legacy` (sauvegarde, aucune donnée
supprimée), puis applique les Étapes 5 et 6.

Les nouvelles clés Supabase `sb_publishable_...` se placent dans
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou `EXPO_PUBLIC_SUPABASE_ANON_KEY`) ; la clé
`sb_secret_...` se place dans `SUPABASE_SERVICE_ROLE_KEY`, côté serveur
uniquement.

La migration Étape 6 ajoute :

- `places.est_actif`, `verifie_le`, `verifie_par`, `motif_refus` ;
- la table `donations` (`donateur_nom`, `telephone`, `montant`, `operateur`,
  `statut`, `preuve_url`, dates) ;
- les policies RLS : lecture publique des fiches vérifiées **et actives**,
  création publique d'une fiche en attente, admin via le rôle JWT
  `app_metadata.role = "admin"` ;
- deux fiches de démonstration en attente, insérées avec `on conflict do nothing`.

> L'admin de production doit être protégé par Supabase Auth (rôle `admin` dans
> `app_metadata`) `[À CONFIRMER]`. Le code `kay-demo` et la clé service_role sont
> des solutions de transition pour la recette, pas une authentification finale.

### PWA

- Manifeste : `app/manifest.ts` (nom, couleurs, `standalone`, icônes 192/512).
- Icônes : `public/icon-192.png`, `public/icon-512.png`, `app/icon.svg`.
- Service worker : `public/sw.js` (cache de l'accueil, `/don`, icônes et assets ;
  les routes `/api/*` et `/admin` ne sont jamais mises en cache).
- Enregistrement : `components/service-worker-register.tsx`, uniquement en
  production.
- Bouton **Installer l'app** : `components/install-app.tsx`, présent dans le
  footer et sur mobile ; affiche les instructions Android/iPhone si le navigateur
  ne fournit pas `beforeinstallprompt`.

L'installation réelle nécessite **HTTPS** (Vercel) ou `localhost`.

### Déploiement

Le dépôt est publié sur GitHub : **https://github.com/therealkay-g/KND-OS**
(branche `main`). Vercel et EAS restent à effectuer.

**Vercel (Kindu Search)**

1. Dans Vercel : **Add New → Project**, importer `therealkay-g/KND-OS`, puis
   choisir **Root Directory `kindu-search`** (Framework Preset : Next.js).
2. Définir les variables de production :

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon>
   SUPABASE_SERVICE_ROLE_KEY=<clé service_role>
   ADMIN_ACCESS_CODE=<code long>
   ADMIN_SESSION_SECRET=<secret aléatoire long>
   NEXT_PUBLIC_DONATION_WHATSAPP=<numéro Mobile Money de Kay>
   NEXT_PUBLIC_ADMIN_DEMO_HINT=false
   DEMO_BRIDGE_ENABLED=false
   NEXT_PUBLIC_DEMO_BRIDGE=false
   ```

   Pour une démo sans Supabase, laisser les variables Supabase vides : Kindu
   Search utilise `data/places.json` et le stock local. Garder
   `DEMO_BRIDGE_ENABLED=false` et `NEXT_PUBLIC_DEMO_BRIDGE=false`.

3. Cliquer sur **Deploy**. La CLI est une alternative :

   ```bash
   cd kindu-search
   npx vercel@latest --prod
   ```

L'URL cible `https://kindu-search.vercel.app` n'est obtenue que si le nom du
projet est disponible ; sinon Vercel ajoute un suffixe. Elle ne peut être
confirmée qu'après le déploiement effectif.

> Arrêter le serveur `next dev` avant `next build`. Next 16 génère des types
> différents pour le développement et la production ; garder les deux dans `.next`
> provoque une erreur de typecheck. En cas de doute, supprimer `.next` puis relancer
> le build.

**EAS Build (KND OS APK)**

`eas.json` contient un profil `preview` qui produit un **APK** :

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

EAS demandera de lier le projet Expo s'il ne l'est pas encore (`eas init`). Avant le
build, définir dans EAS les variables KND OS de production
(`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
`EXPO_PUBLIC_KND_SYNC_TOKEN`, `EXPO_PUBLIC_KND_OS_PRO=true`). EAS renvoie un lien
direct de téléchargement de l'APK. Cette commande n'a pas été exécutée : aucun
compte Expo authentifié n'est disponible.

**Build Android local (sans EAS)**

En l'absence de compte Expo/EAS, le script `scripts/build-android-local.ps1`
compile un APK release avec le SDK Android local :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-android-local.ps1
```

Le script utilise JDK 17, Android SDK 37, build-tools 37, NDK 27.1, **CMake 3.31.6**
et **Ninja 1.12.1** installés dans `%LOCALAPPDATA%\KND-Android`. Le chemin du dépôt
contient un espace (`KND OS`) ; CMake/Ninja produisent alors des chemins objets
`KND_OS` invalides et l'autolinking Expo ne trouve pas `package.json` à la racine
d'un lecteur `subst`. Le script copie donc le projet dans **`C:\KNDOS`** (copie
réelle, pas une jonction) et compile depuis ce chemin sans espace. Il produit
`dist/knd-os-0.1.0-release.apk` pour l'architecture **arm64-v8a**. L'APK est signé
avec le keystore debug généré par Expo : il s'installe par sideload, mais ne doit
pas être publié sur le Play Store. Pour un AAB de production, utiliser EAS avec un
keystore dédié.

Le Ninja livré avec le CMake 3.22.1 du SDK Android est **1.10.2** : il ne crée pas
les répertoires d'objets dont le chemin dépasse 260 caractères, alors que le plugin
Expo fixe `CMAKE_OBJECT_PATH_MAX=1024` et attend un Ninja récent. Le build échoue
alors sur `mkdir(...): No such file or directory` dans
`rngesturehandler_codegen_autolinked_build`. Il faut remplacer le `ninja.exe` de
`...\cmake-3.31.6\...\bin` par le binaire **1.12.1** :

```powershell
curl.exe -L -o ninja-win.zip https://github.com/ninja-build/ninja/releases/download/v1.12.1/ninja-win.zip
Expand-Archive ninja-win.zip -DestinationPath ninja-1.12.1 -Force
Copy-Item ninja-1.12.1\ninja.exe "$env:LOCALAPPDATA\KND-Android\cmake-3.31.6\cmake-3.31.6-windows-x86_64\bin\ninja.exe" -Force
& "$env:LOCALAPPDATA\KND-Android\cmake-3.31.6\cmake-3.31.6-windows-x86_64\bin\ninja.exe" --version
# doit afficher 1.12.1
```

> CMake 3.31.6 + Ninja >= 1.12 restent requis pour les chemins objets longs de Windows. La copie
> `C:\KNDOS` est un dossier de build temporaire : les sources de référence restent
> dans `C:\Users\dell\Downloads\KND OS`. Supprimer `C:\KNDOS` force une nouvelle
> copie au prochain build.

> Le SDK 37 preview s'installe dans `platforms\android-37.0`, alors qu'AGP cherche
> `platforms\android-37`. Le script crée automatiquement la jonction `android-37`
> nécessaire ; le build peut afficher un avertissement de chemin incohérent, sans
> incidence sur l'APK.

### Variables Étape 6

| Variable | Où | Rôle |
| --- | --- | --- |
| `ADMIN_ACCESS_CODE` | serveur Kindu Search | Code `/admin` ; défaut démo `kay-demo` `[À CONFIRMER]` |
| `ADMIN_SESSION_SECRET` | serveur Kindu Search | Signature du cookie admin ; défaut = code admin |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur Kindu Search | Lecture/écriture admin, jamais publique |
| `NEXT_PUBLIC_DONATION_WHATSAPP` | navigateur | Numéro WhatsApp des dons `[À CONFIRMER]` |
| `NEXT_PUBLIC_ADMIN_DEMO_HINT` | navigateur | Affiche le code démo sur `/admin` |
| `DEMO_BRIDGE_ENABLED` | serveur Kindu Search | Pont de stock local ; `false` en production |
| `NEXT_PUBLIC_DEMO_BRIDGE` | navigateur | Polling du pont local ; `false` en production |

### Limites connues de l'Étape 6

- **Auth admin** : code unique + cookie signé, sans compte nominatif. À remplacer
  par Supabase Auth et une policy `admin` en production `[À CONFIRMER]`.
- **Dons** : paiement Mobile Money manuel via WhatsApp. Le donateur peut
  enregistrer un don en attente (nom/téléphone optionnels), mais la confirmation
  du paiement reste manuelle par Kay dans Supabase en V1.
- **Numéro de don** : `243970000101` est un numéro de démonstration fictif.
- **PWA** : cache minimal (accueil, don, assets). Le cache IndexedDB complet des
  places (2 Mo) reste `[À CONFIRMER]`.
- **Déploiement** : Vercel, EAS et Supabase cloud non exécutés faute de comptes
  et de clés.

---

## Architecture

```
src/
  app/                     Routes Expo Router
    login.tsx              Téléphone + OTP démo
    code.tsx               Code 1234
    mode.tsx               Nom du commerce, commune, mode (Magasin / Pharmacie / Quincaillerie)
    (app)/                 Application connectée (pile + garde d'authentification)
      (tabs)/              Navigation à 5 onglets
        dashboard.tsx
        vente.tsx
        stock.tsx
        clients.tsx
        search.tsx         Aperçu Kindu Search
      client/[id].tsx      Fiche client + encaissement
      benefice.tsx
      alertes.tsx          Alertes péremption (mode Pharmacie)
      devis.tsx            Devis chantier + conversion en vente (mode Quincaillerie)
      settings.tsx
  components/              UI KND OS (boutons, champs, sheets, navigation)
  lib/
    data-provider.tsx      État global, mutations, file locale, envoi du stock live
    storage.ts             Persistance web (localStorage)
    storage.native.ts      Persistance mobile/desktop (expo-sqlite)
    supabase.ts            Client Supabase (clé anon, sans session)
    sync.ts                Snapshot de stock + transport Supabase / pont démo
    stats.ts               Bénéfice, dettes, série de 7 jours, alertes péremption
    format.ts              Montants, quantités, unités (sacs/kg, barres/m), dates
    modes.ts               Modes de commerce (Magasin / Pharmacie / Quincaillerie)
    prescription-photo.ts  Photo d'ordonnance (web : fichier + compression canvas)
    migrate.ts             Migration « neighborhood » -> « commune »
    types.ts               Types partagés
kindu-search/              App publique Next.js (Étapes 4-6)
  app/
    page.tsx               Accueil : recherche, catégories, commune, Liste/Carte
    place/[id]/page.tsx    Fiche commerce + stock live + contacts
    ajouter/page.tsx       Formulaire public (Supabase en attente ou local)
    don/page.tsx           Dons Mobile Money manuels via WhatsApp
    admin/page.tsx         Login, carte, vérification / refus
    admin/layout.tsx       Métadonnées noindex
    api/stock-live/route.ts Pont de démonstration local (sans Supabase)
    api/admin/session/     Cookie HttpOnly du code admin
    api/admin/places/      Liste admin + vérification/refus
  components/              Carte Leaflet, cards, galerie, filtres, PWA
  public/sw.js             Service worker PWA
  public/icon-192.png      Icônes PWA
  public/icon-512.png
  data/places.json         10 commerces fictifs + stock de démo
  lib/places.ts            Types, filtres, horaires, badges et formatage du stock
  lib/use-places.ts        Lecture Supabase/Realtime ou démo + pont local
  lib/supabase*.ts         Client public et mapping des lignes Supabase
  lib/admin*.ts            Auth admin, décisions locales, fiches en attente
  lib/demo-pending.ts      2 fiches de démonstration en attente
supabase/
  migrations/              Schéma places/products/sync_queue + dons + admin
scripts/
  build-android-local.ps1  Build APK Android local (sans EAS)
eas.json                   Profil EAS preview (APK)
docs/                      PRD, flows, design, TRD, backend, plan
CLAUDE.md                  Règles de développement
```

### Stack utilisée

- **React Native + Expo SDK 58** et **Expo Router**.
- **Expo SQLite** sur mobile/desktop (adaptateur `storage.native.ts`).
- **localStorage** uniquement pour la vérification web de développement
  (le WASM SQLite n'est pas nécessaire dans le navigateur à cette étape).
- **Supabase** (Étape 5) : `places`, `products`, `sync_queue` technique, RLS et
  Realtime. KND OS utilise la clé anon et un RPC protégé par jeton pour le stock ;
  Kindu Search lit uniquement les commerces vérifiés.
- **Mode démo local** : sans variables Supabase, Kindu Search utilise
  `data/places.json` et le pont `/api/stock-live` sur le serveur Next.
- **Lucide React Native**, **Inter**, **date-fns**, **expo-image-picker**
  (photo d'ordonnance).
- **Kindu Search** : Next.js 16 (App Router), React 19, Tailwind CSS 4,
  Leaflet 1.9 + OpenStreetMap, **lucide-react**, **Inter** (via `@fontsource/inter`).
- **PWA Kindu Search** : manifeste, icônes 192/512 et service worker minimal.
- **Admin Kindu Search** : cookie `HttpOnly`, API serveur et Supabase service_role
  (ou mode démo local à deux fiches en attente).
- **EAS Build** : profil `preview` pour générer un APK Android.
- **Build Android local** : script PowerShell + JDK 17 + Android SDK 37 + NDK 27.1
  + CMake 3.31.6 ; APK arm64 signé avec le keystore debug pour le sideload.

### Données et confidentialité

- Par défaut, les ventes, clients et dettes restent locales sur l'appareil.
- `sync_queue` conserve les payloads locaux ; seuls les snapshots de stock et les
  produits sont envoyés à Supabase (via RPC protégé).
- La table Supabase `sync_queue` est un journal technique sans données personnelles.
- Kindu Search ne lit que les commerces `est_verifie = true` et n'expose jamais les
  dettes, clients, ventes ou prix d'achat.
- Les dons (`donations`) contiennent le nom/téléphone éventuel du donateur : lecture
  réservée à l'admin, aucune liste publique de donateurs.
- Aucune donnée bancaire, aucun paiement Mobile Money réel : les dons V1 sont
  manuels via WhatsApp.

---

## Périmètre volontairement absent (étapes suivantes)

- Déploiement effectif Vercel / EAS et validation Supabase cloud : bloqués par
  l'absence de comptes et de clés dans cet environnement.
- Authentification commerçant réelle et synchronisation Supabase des
  ventes/clients/dettes : les payloads restent locaux pour l'instant `[À CONFIRMER]`.
- Paiement Mobile Money automatique : les dons V1 sont manuels via WhatsApp.
- Cache IndexedDB complet des places (2 Mo) : le service worker actuel cache
  l'accueil, `/don`, les icônes et les assets.
- Impression Bluetooth réelle : le ticket est simulé à l'écran ; l'impression
  physique reste à brancher.

> Règle appliquée : aucune fonctionnalité absente du PRD n'a été ajoutée.
> **Terminologie** : les entités administratives de Kindu sont des **communes**
> (Kasuku, Alunguli, Mikelenge). L'ancien champ local `neighborhood` est migré
> automatiquement vers `commune` à la lecture.
> Seuil de stock faible provisoire : **5 unités** `[À CONFIRMER]` dans `src/lib/stats.ts`.
> Alertes péremption : rouge sous 30 jours, orange de 30 à 60 jours (`docs/01-prd.md`).
> Unités : **1 sac = 50 kg** (déduit de l'exemple « 45 sacs (2250kg) » du PRD),
> **1 barre = 12 m**. Les unités libres sont affichées en minuscules avec un pluriel
> simple (cartons, bidons, paquets) ; les abréviations courtes restent inchangées.
> Devis : seul **Chambre 4x4** est documenté ; les autres modèles restent `[À CONFIRMER]`.
