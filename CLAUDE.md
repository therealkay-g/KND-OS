CLAUDE.md - Règles pour le développement
Contexte
Projet : KND OS + Kindu Search pour Kindu, RDC
Auteur : Kay Nzogu
Date : Octobre 2026

Documents de référence (source de vérité)
Tous dans /docs/ :

01-prd.md : Ce que fait le produit, par fonction, objectifs, ce qu'on ne fait PAS
02-app-flow.md : Les pages et ce qui se passe au clic, flux KND OS et Kindu Search
03-design.md : Couleurs (#0A0A0A, #FFC300), polices (Inter), allure de chaque page
04-trd.md : Stack (React Native+Expo + Flutter en backup, Tauri desktop, Next.js PWA, Supabase eu-central-1)
05-backend.md : Données perso, où stockées (Francfort), qui lit/écrit, rétention
06-plan.md : Quoi construire, dans quel ordre, chaque étape vérifiable dans navigateur
Règle d'or : INTERDICTION DE CODER UNE FONCTIONNALITÉ ABSENTE DU PRD
Si une fonctionnalité n'est pas listée dans 01-prd.md, tu ne la codes PAS
Tu n'inventes pas de chiffre, pas d'outil, pas de fonction
Si tu doutes, écris [À CONFIRMER] et demande à Kay
Exemple : recherche vocale, paiement Mobile Money auto, livraison -> NON V1 car pas dans PRD
Méthode de travail
Avant chaque étape, relis 06-plan.md pour savoir quoi construire
Avant chaque page, relis 02-app-flow.md pour le clic exact
Avant chaque style, relis 03-design.md pour couleurs/polices
Avant chaque donnée, relis 05-backend.md pour RLS et rétention
Chaque étape = 1 session, se termine par URL vérifiable (localhost:5173 ou localhost:3000)
Stack validée
Mobile KND OS : React Native + Expo (principal) + Flutter [À CONFIRMER] backup
Desktop KND OS : Tauri
Kindu Search : Next.js PWA + Vercel + Leaflet OSM
Backend : Supabase eu-central-1 Francfort
Offline-first : SQLite local source de vérité, sync_queue
Données sensibles
Voir 05-backend.md pour chaque donnée perso, son emplacement, qui lit/écrit, rétention
Jamais exposer dettes clients sur Kindu Search
Lat/lng commerce domicile flouté [À CONFIRMER]
Vérification finale avant push
 Fonctionnalité listée dans 01-prd.md ?
 Flow respecté 02-app-flow.md ?
 Design respecté 03-design.md (couleurs #FFC300 #0A0A0A) ?
 Stack respectée 04-trd.md ?
 RLS et rétention respectés 05-backend.md ?
 Étape vérifiable dans navigateur comme 06-plan.md ?
Si NON à une case, ne pousse pas, corrige.

Langue
Docs et code en français pour Kay, commentaires en français
Variables en anglais (products, clients, places)