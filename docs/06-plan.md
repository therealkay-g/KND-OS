06-plan.md - Quoi construire, dans quel ordre
Principe
Chaque étape = 1 session de 3-4h
Chaque étape se termine par une URL vérifiable dans le navigateur (localhost ou Vercel)
Pas de code hors PRD
Étape 1 : KND OS Mode Magasin MVP (Caisse 3 clics)
But : vendre cash/crédit offline
Construire :
Login OTP fake (tel input + code 1234 pour dev)
SQLite local : tables products, clients, ventes, sync_queue
Écran Vente : grille 6 produits fake, tap ajoute panier, boutons Cash/Crédit
Écran Stock : liste + ajout produit (nom, prix_achat, prix_vente, stock)
Écran Clients : liste + ajout client + dette
Bénéfice jour calculé
Vérifiable : http://localhost:5173 (Expo web) affiche Dashboard avec "Vendu aujourd'hui 0 CDF", tu peux ajouter produit "Coca" et vendre cash, stock déduit
Données : fake locales, pas encore Supabase
Étape 2 : KND OS Mode Pharmacie
But : péremption + molécule
Construire :
Choix mode Magasin/Pharmacie au login
Si Pharma : champs date_peremption, molécule, ordonnance_requise dans ajout produit
Badge alerte : <30j rouge, <60j orange sur liste stock
Recherche par molécule
Popup photo ordonnance si ordonnance_requise=true
Page Alertes péremption
Vérifiable : http://localhost:5173 -> mode Pharmacie, ajoute "Paracétamol" molécule Paracétamol péremption 2026-11-20, apparaît en orange "Expire dans 33j" dans alertes
Données : SQLite local
Étape 3 : KND OS Mode Quincaillerie + Devis
But : unités complexes + devis chantier
Construire :
Unités : SAC, BARRE 12m, KG, METRE, ROULEAU, PIECE avec décimale
Affichage stock "12.5 kg" "30 barres (360m)"
Page Devis : bouton Nouveau Devis > choix type (Chambre 4x4, Maison 2 chambres, Latrine)
Génère liste auto fake : Chambre 4x4 = 20 sacs ciment + 15 barres 12mm + 20 tôles + total
Bouton Convertir en Vente
Impression ticket Bluetooth mock (affiche ticket HTML)
Vérifiable : http://localhost:5173 -> mode Quincaillerie, ajoute barre fer 12m 10 barres, vend 2.5 barres, stock affiche 7.5 barres (90m)
Données : SQLite local
Étape 4 : Kindu Search V1 - Annuaire type Google Maps
But : PWA qui affiche commerces Kindu
Construire :
Next.js app kindu-search : page Accueil avec barre recherche, 8 catégories icônes, filtre commune Kasuku/Alunguli/Mikelenge, toggle Liste/Carte
Carte Leaflet OSM centrée Kindu (-2.95, 25.95), pins fake 10 commerces
Liste cards : nom, catégorie, commune, badge si Pro
Page Fiche commerce : photos, tel, boutons WhatsApp/Appeler/Itinéraire
Page Ajouter mon commerce (formulaire -> stockage local)
Vérifiable : http://localhost:3000 affiche carte Kindu avec 10 pins, recherche "ciment" filtre liste, clic ouvre fiche avec bouton WhatsApp qui ouvre wa.me
Données : JSON fake 10 commerces dans /data/places.json, pas encore Supabase
Étape 5 : Liaison KND OS -> Kindu Search (Stock Live)
But : stock KND OS remonte live sur Kindu Search
Construire :
Supabase projet : tables places, products, sync_queue
KND OS : branche Supabase, sync_queue envoie ventes -> update places.stock_live
Kindu Search : fetch Supabase places WHERE est_verifie=true, affiche stock_live si est_pro=true avec badge "Stock Vérifié Live vert"
Realtime Supabase : quand vente dans KND OS, stock live bouge sur Kindu Search en <5 sec
Vérifiable : 2 onglets : http://localhost:5173 (KND OS) vend 1 sac ciment, http://localhost:3000 (Kindu Search) affiche "44 sacs" -> passe à "43 sacs Live" après refresh/realtime
Données : Supabase eu-central-1 Francfort
Étape 6 : Don + Admin + Déploiement
But : bouton don + vérification admin + mise en ligne
Construire :
Kindu Search Page Don : texte soutien + 4 montants + boutons Airtel/Orange/M-Pesa (liens wa.me paiement manuel V1)
Page /admin : login simple (code Kay), carte avec pins gris (non vérifiés) / vert (vérifiés), liste "À vérifier", boutons Vérifier/Refuser
Déploiement : Kindu Search sur Vercel (vercel.app), KND OS APK via EAS Build lien direct
PWA installable
Vérifiable : https://kindusearch.vercel.app accessible sur téléphone à Kindu, page /admin affiche 2 commerces en attente, page /don affiche boutons Mobile Money, bouton "Installer l'app" sur mobile
Données : Supabase prod, donations table
Étape 7 : Test Terrain Kasuku (Optionnel mais recommandé)
But : tester avec 2 vrais commerçants
Construire :
Rien de nouveau, juste utiliser les apps déployées
Script test : installer APK KND OS sur 2 téléphones, créer commerce, vendre 3 produits, vérifier stock live sur Kindu Search sur autre téléphone
Fix bugs remontés
Vérifiable : Vidéo 30 sec WhatsApp : vente sur tel A -> stock live change sur tel B, avec 2 commerçants réels de Kasuku
Ordre final validé
Magasin MVP
Pharmacie
Quincaillerie + Devis
Kindu Search
Liaison Stock Live
Don + Admin + Deploy
Test Kasuku
Chaque étape dépend de la précédente, pas de saut.