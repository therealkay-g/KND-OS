05-backend.md - Données, emplacement, accès
Résumé stockage
Tout stocké chez Supabase, région eu-central-1 Francfort, Allemagne (EU)
Aucune donnée stockée physiquement en RDC V1
Backup automatique Supabase quotidien, rétention 7 jours Free, 30 jours Pro
SQLite local sur téléphone commerçant (chiffré via Expo SecureStore pour token)
Tables et données personnelles
1. Table auth.users (Supabase Auth)
Données perso : phone (tel WhatsApp), otp, created_at
Stockage : Supabase Auth eu-central-1 Francfort
Lecture : user lui-même (son propre tel), Admin Kay (tout)
Écriture : user lui-même (création compte), Supabase (OTP)
Rétention : tant que compte actif + 6 mois après suppression
Suppression : soft delete puis hard delete après 6 mois
2. Table commerçants / profiles
Données perso : id, nom_commerce, nom_propriétaire, tel WhatsApp (perso), commune, adresse, photo_profil (optionnelle), mode (Magasin/Pharmacie/Quincaillerie)
Stockage : Supabase Postgres eu-central-1 Francfort, bucket Storage photos-commerces même région
Lecture : propriétaire (ses données), Admin Kay (tout), Client Kindu Search (nom_commerce, commune, tel WhatsApp public, photo seulement si est_verifie=true)
Écriture : propriétaire (ses données), Admin Kay (vérification)
Rétention : tant que compte actif + 6 mois après suppression, photos supprimées avec compte
3. Table products (KND OS)
Données perso : non perso (produits), mais lié au commerçant_id
Stockage : Supabase Postgres eu-central-1 Francfort + SQLite local téléphone
Lecture : commerçant propriétaire seulement, Admin Kay (support)
Écriture : commerçant propriétaire, sync depuis SQLite local
Rétention : 2 ans après dernière vente, puis archive
4. Table clients (dettes)
Données perso : nom_client (ex: Maman Georgette), tel_client (perso), dette (montant), commerçant_id
Stockage : Supabase Postgres eu-central-1 Francfort + SQLite local
Lecture : commerçant propriétaire seulement, Admin Kay NON (confidentiel dettes)
Écriture : commerçant propriétaire seulement
Rétention : tant que dette >0 + 1 an après dette soldée, puis anonymisé (nom -> Client X)
Sensibilité : haute, ne jamais exposer sur Kindu Search
5. Table ventes + vente_lignes
Données perso : non perso mais contient client_id si crédit, total, bénéfice
Stockage : Supabase Postgres eu-central-1 + SQLite local
Lecture : commerçant propriétaire, Admin Kay (stats agrégées seulement, pas détail client)
Écriture : commerçant propriétaire
Rétention : 2 ans (obligation compta simple), puis agrégé par jour, détail supprimé
Bénéfice : calculé localement, pas de donnée bancaire réelle
6. Table places (Kindu Search - commerces publics)
Données perso : nom commerce, tel WhatsApp public, lat/lng (localisation perso si commerce à domicile), photos, commune, catégorie
Stockage : Supabase Postgres eu-central-1 + Storage photos-places même région + cache IndexedDB navigateur client (2Mo)
Lecture : PUBLIC (tout le monde peut lire si est_verifie=true), Admin Kay (tout y compris non vérifiés)
Écriture : Admin Kay (vérification), commerçant Pro via KND OS (stock_live, photos, horaires), public via formulaire "Ajouter mon commerce" -> crée en est_verifie=false, Admin valide
Rétention : tant que commerce existe + 6 mois après fermeture signalée
Lat/lng : considéré perso si commerce = domicile, flouté à 100m sur carte publique [À CONFIRMER]
7. Table donations
Données perso : tel Mobile Money donateur (perso), montant, date, opérateur (Airtel/Orange/M-Pesa), nom donateur si fourni
Stockage : Supabase Postgres eu-central-1 Francfort
Lecture : Admin Kay seulement (pas public), donateur peut voir son propre don
Écriture : donateur (création), Admin Kay (validation manuelle V1)
Rétention : 3 ans (traçabilité), puis anonymisé (tel -> hash)
V1 : paiement manuel via wa.me, pas d'API auto, donc stockage = preuve screenshot + saisie manuelle
8. Table sync_queue
Données perso : contient payload des tables ci-dessus (peut inclure tel, nom)
Stockage : SQLite local téléphone seulement, pas Supabase (queue avant envoi)
Lecture : app locale seulement
Écriture : app locale
Rétention : supprimé après sync réussi, max 7 jours si échec sync (retry)
9. Table logs / stats
Données perso : vues, clics WhatsApp, IP anonymisée (pas stockée V1), user_agent
Stockage : Supabase Postgres eu-central-1
Lecture : Admin Kay
Écriture : système (trigger sur clic)
Rétention : 1 an, puis agrégé
Accès par rôle (RLS Supabase)
Client Kindu Search anonyme : SELECT places WHERE est_verifie=true, SELECT places.stock_live si est_pro=true
Commerçant authentifié (OTP) : SELECT/INSERT/UPDATE/DELETE products WHERE commerçant_id=auth.uid(), même pour clients, ventes
Admin Kay (role admin) : ALL sur toutes tables SAUF clients (dettes) où SELECT seulement agrégé, pas noms complets
Service role (backend) : ALL pour sync Realtime stock_live
Sécurité
RLS activé sur toutes tables
Photos : bucket public pour places vérifiées, privé pour profiles non vérifiés
Tel WhatsApp public : visible
Chiffrement : SQLite local non chiffré V1 (téléphone verrouillé), SecureStore pour token OTP
Pas de mot de passe stocké, OTP uniquement
Suppression / Droit à l'oubli
Commerçant demande suppression : Admin met est_actif=false, données gardées 6 mois puis DELETE CASCADE
Client dette demande suppression : commerçant doit solder dette d'abord, puis anonymise nom
Donateur : demande suppression tel -> hash + garde montant pour compta