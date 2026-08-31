# Cahier des charges — Site e-commerce MEDITHE

## 1. Présentation du projet

**MEDITHE** est une entreprise spécialisée en diététique, vendant des thés. L'objectif est de développer un site e-commerce complet permettant la présentation et la vente en ligne des produits, sans intégration de moyen de paiement en ligne (le règlement se fait à la livraison, après confirmation téléphonique).

## 2. Architecture technique globale

Le site doit être **100% statique**, sans backend traditionnel, pour minimiser les coûts d'hébergement et de maintenance :

- **Frontend** : HTML/CSS/JS ou React, hébergé sur Vercel
- **Base de données produits** : Google Sheets, exposé via Google Apps Script (Web App) faisant office d'API pour la lecture et l'écriture de données
- **Stockage des images/vidéos** : Cloudinary (upload direct depuis le navigateur, sans passer par un lien externe)
- **Aucune passerelle de paiement** à intégrer

## 3. Fonctionnalités côté client (vitrine publique)

- Catalogue des produits (thés) sous forme de grille, avec fiche produit détaillée (nom, description, prix, images, disponibilité)
- Filtres et recherche par catégorie / prix / disponibilité
- Panier d'achat persistant (localStorage), modifiable (quantités, suppression)
- **Tunnel de commande** :
  1. Le client ajoute des produits à son panier
  2. Il valide son panier (récapitulatif affiché : produits, quantités, sous-total)
  3. Il remplit un formulaire de commande (nom, prénom, téléphone — obligatoire et validé au format local —, adresse/quartier, ville, note optionnelle)
  4. Il confirme sa commande → la commande est considérée comme validée à cette étape (pas de paiement en ligne)
  5. Un numéro de commande unique est généré et affiché au client
- Page "Suivre ma commande" (le client entre son numéro de commande pour consulter son statut)
- Site responsive (mobile-first, la majorité du trafic attendu étant mobile) et optimisé SEO de base (meta tags, sitemap, données structurées produit)

## 4. Traitement des commandes (back-office fonctionnel)

- Chaque commande validée est envoyée automatiquement vers une feuille Google Sheet "Commandes" via l'Apps Script, avec au minimum les colonnes suivantes :
  - Numéro de commande (auto-généré)
  - Date et heure
  - Nom, prénom, téléphone, adresse, ville
  - Détail des produits commandés (nom, quantité, prix unitaire)
  - Montant total
  - Statut (valeurs : *Nouvelle* → *Contactée* → *Confirmée* / *Annulée* → *Livrée*)
  - Colonne notes libres pour le call center
- Une notification doit être envoyée à l'équipe (call center) à chaque nouvelle commande (email automatique via Apps Script, ou webhook vers un canal Slack/WhatsApp — à définir avec le développeur selon la solution la plus simple à maintenir)
- **Le call center est un service externe/humain** qui appelle chaque client pour confirmer la commande et programmer la livraison. Le site doit uniquement fournir les données nécessaires à cet appel (téléphone, adresse, détail commande) et permettre la mise à jour du statut.

## 5. Interface d'administration

L'espace admin doit être protégé par authentification (mot de passe sécurisé, idéalement via Firebase Auth ou vérification côté Apps Script — à éviter : simple mot de passe côté client sans vérification serveur).

Fonctionnalités attendues :

- **Gestion des produits** :
  - Ajout / modification / suppression de produits, à tout moment, par l'administrateur
  - Formulaire avec : nom, description, prix, catégorie, stock, images/vidéos
  - **Upload direct de fichiers image/vidéo depuis l'ordinateur ou le téléphone de l'administrateur** (pas de saisie de lien externe) — envoi vers Cloudinary via upload preset non signé
  - Compression automatique des images côté navigateur avant envoi, pour limiter la consommation du quota Cloudinary
  - Limite de taille imposée : ~1-2 Mo par image après compression, formats acceptés restreints (jpg/png/webp)
  - Pour les vidéos : privilégier un embed YouTube/Vimeo non-listé plutôt qu'un upload direct, afin de préserver le quota de stockage
  - Maximum recommandé : 5 images par fiche produit

- **Gestion des commandes** :
  - Liste des commandes avec filtres par statut
  - Mise à jour manuelle du statut par le call center/l'admin
  - Export CSV pour la comptabilité

- **Tableau de bord statistiques**, calculé à partir des données du Sheet :
  - Chiffre d'affaires (par période)
  - Produits les plus vendus
  - Nombre de commandes par statut
  - Alertes de stock faible

## 6. Contraintes et points de vigilance à respecter

- **Sécurité de l'authentification admin** : ne pas se limiter à un mot de passe stocké côté client — prévoir une vérification serveur (Apps Script ou Firebase Auth)
- **Configuration Cloudinary** : upload preset non signé avec limite de taille imposée côté serveur Cloudinary (pas seulement côté formulaire JS, pour éviter tout contournement)
- **Quotas Google Apps Script** : être attentif aux limites d'exécution journalières ; prévoir une architecture qui reste fonctionnelle si le volume de commandes augmente
- **Pas de moyen de paiement à intégrer** — le site s'arrête à la validation de commande, le paiement se négocie à la livraison
- **Validation stricte du téléphone client** dans le formulaire de commande, car c'est l'unique canal de contact utilisé par le call center

## 7. Stack technique recommandée (résumé)

| Brique | Solution |
|---|---|
| Frontend | HTML/CSS/JS ou React |
| Hébergement | Vercel ou Netlify |
| Données (produits + commandes) | Google Sheets + Google Apps Script (API) |
| Stockage images | Cloudinary |
| Authentification admin | Firebase Auth (ou équivalent sécurisé) |
| Notifications commandes | Email (Apps Script) ou webhook WhatsApp/Slack |
| Statistiques trafic (optionnel) | Umami ou Plausible |

## 8. Livrables attendus

- Site vitrine complet et responsive
- Interface d'administration fonctionnelle et sécurisée
- Documentation de base sur la structure du Google Sheet et le fonctionnement de l'Apps Script
- Formation rapide ou guide d'utilisation pour l'équipe MEDITHE (ajout de produits, suivi des commandes)
