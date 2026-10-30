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

L'envoi d'images passe par `api/sign-upload.js`, réservé aux admins connectés. Variables Vercel nécessaires : `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` et `VITE_CLOUDINARY_CLOUD_NAME` (aucun preset non signé).

cd frontend
npm install
cp .env.example .env
npm run dev
