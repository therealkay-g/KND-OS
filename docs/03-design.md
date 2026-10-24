03-design.md - Couleurs, polices, allure
Palette
KND OS
Fond principal : #0A0A0A (noir)
Cartes : #1A1A1A (gris très foncé)
Accent primaire : #FFC300 (jaune KND)
Texte principal : #FFFFFF (blanc)
Texte secondaire : #A1A1AA (gris clair)
Alerte rouge : #EF4444
Alerte orange : #F97316
Succès vert : #22C55E (badge Stock Vérifié Live)
Bordure : #27272A
Kindu Search
Fond principal : #FFFFFF (blanc)
Cartes : #FFFFFF avec ombre légère
Accent primaire : #FFC300 (même jaune)
Accent secondaire : #0A0A0A (noir pour boutons)
Texte principal : #0A0A0A
Texte secondaire : #71717A
Fond catégorie active : #FFC300
Badge Live : vert #22C55E + texte blanc
Polices
Famille : Inter (sans serif moderne, lisible faible résolution)
Alternative : Sora si Inter non dispo
Poids : Regular 400, Medium 500, Bold 700, ExtraBold 800 pour KND logo
Tailles KND OS : Titre 20px bold, Produit nom 16px medium, Prix 14px bold, Secondaire 12px
Tailles Kindu Search : Titre commerce 18px bold, Adresse 13px regular, Prix stock 14px bold
Icônes
Librairie : Lucide React (simple, lisible)
Taille : 20px standard, 24px pour navigation, 32px pour catégories accueil
Style : outline, pas filled
Catégories : Pharmacie (pill), Quincaillerie (wrench), Resto (utensils), Hôtel (bed), Magasin (shopping-bag), Alimentation (apple), Salon (scissors), Location (home)
KND OS - Allure par page
Login
Fond noir, logo KND OS centré grand (transparent PNG)
Champ tel : fond #1A1A1A, bordure #27272A, focus #FFC300
Bouton jaune #FFC300 texte noir bold, arrondi 12px, hauteur 52px
Texte secondaire petit gris
Dashboard
Header : logo petit + nom commerce + mode (Magasin) badge jaune
Cards stats : fond #1A1A1A, bordure #27272A, arrondi 16px, padding 16px
Valeur CDF grosse 24px bold jaune, label 12px gris
Alertes : card rouge #EF4444/10 fond avec bordure rouge si stock faible
Boutons action : 2x2 grille, bouton carré 80x80, icône 32px jaune, label 12px
Vente
Barre recherche : fond #1A1A1A, icône scan à droite jaune
Grille produits : 2 colonnes, card 160px haut, image 80px, nom 14px, prix jaune 14px bold, stock 11px gris
Panier flottant bas : fond #1A1A1A, bordure top #FFC300 2px, total 18px bold
Boutons Vendre : Cash = jaune #FFC300 noir, Crédit = noir bordure jaune, hauteur 48px, arrondi 12px
Stock
Liste : item 64px haut, image 48px carré arrondi 8px, nom 15px, stock à droite badge vert/rouge
Tap : ouvre bottom sheet édition, fond #1A1A1A
Clients
Liste client : avatar initiale fond jaune, nom 15px, dette rouge si >0
Kindu Search intégré
Même design que PWA Kindu Search mais dans thème sombre
Kindu Search - Allure par page
Accueil
Header blanc : logo Kindu Search (noir + jaune), bouton Don ❤️ petit arrondi
Barre recherche : fond gris clair #F4F4F5, arrondi 24px, icône loupe, hauteur 48px, ombre légère
Catégories : scroll horizontal, bouton rond 64px, icône 28px noir, label 11px sous, actif = fond jaune
Filtre commune : chips arrondis 32px haut, fond blanc bordure gris, actif jaune
Toggle Liste/Carte : segmented control gris clair / jaune actif
Card commerce liste : fond blanc, arrondi 16px, ombre, padding 12px, image gauche 64px, nom 16px bold, catégorie 12px gris, badge Live vert 10px, commune 12px
Fiche Commerce
Photos : carousel hauteur 240px, dots jaune
Infos : padding 16px, nom 20px bold, catégorie + commune 13px gris, horaires badge vert si ouvert
Stock live : card jaune clair #FFFBEB bordure jaune #FFC300 si Pro, texte "45 sacs disponibles - 35.000 CDF/sac"
Boutons action : WhatsApp = vert #25D366 blanc, Appeler = noir blanc, Itinéraire = blanc bordure noir, hauteur 48px, arrondi 12px, icône gauche
Section produits : grille 2 colonnes si Pro
Page Don
Fond blanc, icône cœur jaune grand 64px centré
Titre 22px bold, texte 14px gris centré
Boutons montants : 4 boutons grille 2x2, fond blanc bordure, actif jaune
Boutons Mobile Money : Airtel (rouge), Orange (orange), M-Pesa (vert), hauteur 52px
Admin
Fond gris clair #F4F4F5, cards blanches
Carte : hauteur 400px, pins vert/gris
Liste attente : card blanche avec photo, boutons Vérifier vert / Refuser rouge
Règles générales
Arrondi standard : 12px boutons, 16px cards
Ombre : légère 0 2px 8px rgba(0,0,0,0.08) pour Kindu Search, aucune pour KND OS (flat)
Hauteur min bouton touch : 48px (doigts poussiéreux)
Pas d'animation lourde (connexion faible)
Images compressées 80ko max, affichées avec blur placeholder