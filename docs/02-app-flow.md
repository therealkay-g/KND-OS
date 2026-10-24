02-app-flow.md - Pages et clics
KND OS - App Mobile + Desktop
1. Login
Page : champ tel + bouton "Recevoir code WhatsApp"
Clic Recevoir : envoie OTP, page code 4 chiffres
Clic Valider : va au Dashboard
Si nouveau : choix mode : Magasin / Pharmacie / Quincaillerie
2. Dashboard (Écran principal)
Affiche : Vendu aujourd'hui (CDF), Bénéfice aujourd'hui, Nombre ventes
Alertes : Stock faible (X produits), Péremption <30j (si pharma)
4 boutons gros :
Vente rapide
Stock
Clients / Dettes
Bénéfice
Menu bas : Dashboard / Vente / Stock / Clients / Search
3. Vente
Grille produits avec photo + nom + prix + stock
Barre recherche + scan code-barres caméra (icône)
Tap produit : ajoute au panier (panier flotte en bas)
Panier : liste + qté +/- + total + bénéfice estimé
2 boutons :
Vendre Cash : déduit stock, enregistre vente, imprime ticket Bluetooth
Vendre Crédit : ouvre liste clients > choisir client > ajoute dette
Après vente : toast "Vente 15.000 CDF OK" + retour grille
4. Stock
Liste produits : nom, stock, prix_vente, alerte couleur
Tap produit : fiche édition (prix_achat, prix_vente, stock, date_peremption si pharma, unité si quincaillerie)
Bouton + : Ajouter produit (nom, code_barres scan, prix_achat, prix_vente, stock, unité, photo optionnelle)
Filtre : Tous / Stock faible / Périme bientôt
5. Clients / Dettes
Liste clients : nom, dette totale
Tap client : historique dettes + ventes + bouton "Encaisser dette"
Bouton + : Nouveau client (nom, tel)
Bouton "Clients qui doivent" : filtre dette >0
6. Bénéfice
Affiche : Aujourd'hui, Cette semaine, Ce mois
Liste ventes du jour avec bénéfice par vente
Graph simple barres 7 jours
7. Paramètres
Mode commerce : Magasin / Pharmacie / Quincaillerie (changeable)
Imprimante Bluetooth : bouton Connecter
Sync status : Dernière sync il y a Xh, bouton Forcer sync
Déconnexion
8. Kindu Search intégré (onglet dans KND OS)
Ouvre vue de son propre commerce comme client le voit sur Kindu Search
Affiche : vues, clics WhatsApp reçus depuis Kindu Search
Bouton "Voir sur la carte"
Kindu Search - PWA Publique
1. Accueil
Header : logo Kindu Search + champ recherche "Que cherches-tu ? ciment, paracétamol..."
Sous recherche : 8 catégories icônes : Resto, Hôtel, Pharmacie, Quincaillerie, Magasin, Salon, Location, Tous
Filtre commune : Kasuku, Alunguli, Mikelenge
2 vues : Liste / Carte (toggle)
Liste : cards commerce avec nom, catégorie, commune, badge Live si Pro, distance si GPS
Carte : pins sur carte Kindu, tap pin = popup nom + badge
2. Résultats
Après recherche "ciment" : liste filtrée
Tri : Stock Vérifié Live en haut, puis vérifiés, puis non vérifiés
Chaque card : nom, stock live si Pro (ex: 45 sacs), commune, ouvert/fermé
3. Fiche Commerce
Clic card > Fiche
Photos swipe, nom, catégorie, commune, adresse, horaires
Si Pro KND OS : stock live affiché (ex: Ciment 45 sacs - 35.000 CDF)
Sinon : pas de stock live
Boutons gros : WhatsApp (ouvre wa.me avec message pré-rempli), Appeler, Itinéraire (ouvre Google Maps)
Section "Autres produits de ce commerce" si Pro
Compteur vues incrémenté
4. Ajouter mon commerce
Bouton flottant "+" : "Ajouter mon commerce"
Form : nom, catégorie, commune, tel WhatsApp, photo 1, horaires
Soumet : va en attente vérification admin
Message : "Merci, Kay va vérifier à moto dans 48h"
5. Page Don
Bouton Don dans header / footer : "Soutenir Kindu Search ❤️"
Page : texte "Aidez-nous à cartographier Kindu" + montants : 5.000 CDF, 10.000 CDF, 20.000 CDF, Libre
Boutons : Airtel Money, Orange Money, M-Pesa
Après don : merci + nom dans liste donateurs
6. Admin (toi)
/admin : login
Carte Kindu avec points : vert vérifié, gris en attente
Liste "Nouveaux commerces à vérifier"
Tap commerce : voir photos, bouton Vérifier / Refuser
Vérifier = passe est_verifie=true, visible pour tous
Flux croisés
KND OS vente > sync_queue > Supabase > Kindu Search stock_live mis à jour
Kindu Search clic WhatsApp > compteur places.clics_whatsapp++
KND OS onglet Search > ouvre Fiche commerce propre avec stats vues/clics