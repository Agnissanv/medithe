# MEDITHE — Frontend

## Installation

```bash
npm install
cp .env.example .env   # puis renseigner VITE_API_URL
npm run dev
```

## Build de production

```bash
npm run build
```

Le dossier `dist/` généré peut être déployé tel quel sur Vercel ou Netlify.

## Sans API configurée

Tant que `VITE_API_URL` n'est pas renseignée dans `.env`, le catalogue affiche
des données de démonstration (`src/data/mockProduits.js`) pour permettre de
développer l'interface sans dépendre du backend.

## Pages

- `/` — Catalogue avec recherche, filtres catégorie/prix/disponibilité
- `/produit/:id` — Fiche produit détaillée
- `/panier` — Panier (persisté en localStorage)
- `/commande` — Tunnel de commande (formulaire + confirmation)
- `/suivi` — Suivi de commande par numéro

## Espace admin

- `/admin/login` — connexion (mot de passe défini côté Apps Script, voir `setAdminPassword` dans `Code.gs`)
- `/admin` — tableau de bord (chiffre d'affaires, top produits, alertes stock)
- `/admin/produits` — gestion des produits, upload d'images vers Cloudinary avec compression automatique côté navigateur
- `/admin/commandes` — liste des commandes, filtre par statut, mise à jour du statut, export CSV

Nécessite `VITE_CLOUDINARY_CLOUD_NAME` et `VITE_CLOUDINARY_UPLOAD_PRESET` dans `.env` pour l'upload d'images (voir `.env.example`). Le preset Cloudinary doit être configuré en **non signé** avec une limite de taille imposée côté Cloudinary (pas seulement côté formulaire).

cd frontend
npm install
cp .env.example .env
npm run dev
