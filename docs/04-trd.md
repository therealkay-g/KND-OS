04-trd.md - Stack et services
Stack Mobile KND OS
Principal V1
React Native + Expo
Expo SDK 51+
Expo SQLite (source de vérité locale)
WatermelonDB ou expo-sqlite pour sync_queue
Expo Router pour navigation
Expo Barcode Scanner (caméra scan code-barres)
Secondaire / Exploration
Flutter : évalué comme alternative pour build Android plus léger pour Kindu (APK <15Mo)
Décision : React Native + Expo reste V1, Flutter en backup si APK trop lourd
Librairies
react-native-bluetooth-escpos-printer (impression ticket 58mm)
expo-secure-store (token OTP)
@supabase/supabase-js (sync)
browser-image-compression (compresse photos à 80ko avant upload)
date-fns (dates péremption)
Stack Desktop KND OS
Tauri (Rust + Webview) - remplace Electron
Raison : binaire <10Mo vs Electron 150Mo, important pour PC faibles à Kindu
Frontend : même codebase React (pas React Native) dans Tauri
SQLite local via tauri-plugin-sql
Stack Kindu Search
Next.js 14 App Router (PWA)
PWA : next-pwa, offline cache 2Mo (table places)
Hébergement : Vercel Free Tier
UI : Tailwind CSS + Lucide React + Inter font
Carte : Leaflet + OpenStreetMap (gratuit, pas Google Maps payant)
Image : next/image avec compression
Backend
Supabase
Postgres 15
Auth : OTP Phone (WhatsApp/SMS)
Storage : bucket photos commerces (compressées)
Realtime : sync stock_live vers Kindu Search
Région : eu-central-1 Francfort [- validé oui]
Plan : Free tier au début (500Mo)
Services externes
OTP : Supabase Auth phone + Twilio / Vonage pour SMS (WhatsApp OTP via Twilio si besoin)
Don Kindu Search : Airtel Money, Orange Money, M-Pesa API [ - intégration directe ou lien wa.me paiement manuel V1 ?]
Imprimante : Bluetooth ESC/POS 58mm, 25$ modèle XPrinter
Scan : caméra téléphone uniquement, pas de scanner hardware externe
Offline-First Architecture
SQLite local = source de vérité
Table sync_queue : id, table_name, action (insert/update/delete), payload JSON, created_at, synced bool
Sync trigger : quand navigator.onLine && signal >2 barres
Conflit : last-write-wins (updated_at le plus récent gagne)
Kindu Search PWA : IndexedDB cache places (2Mo) téléchargé au premier load
Build & Distribution
KND OS Android : EAS Build APK, distribution via lien direct (pas Play Store V1, trop cher/compliqué à Kindu)
KND OS Desktop : Tauri build .exe , lien direct
Kindu Search : vercel.app 
Versioning : semver 0.1.0 -> 1.0.0 après 10 payants
Monitoring V1 simple
Pas de Sentry compliqué V1
Logs : console + table logs dans Supabase (erreurs sync)
Stats : vues, clics WhatsApp dans table places (compteurs)
Uptime : Vercel + Supabase status gratuit
CI/CD complexe
Ce qu'on n'utilise PAS V1
Pas de Firebase (trop lourd, Google Maps payant)
Pas de AWS (complexe)
Pas de Play Store (distribution directe WhatsApp)