# Guide — Backend Google Sheets / Apps Script (MEDITHE)

## 1. Mise en place du Google Sheet

Créer un Google Sheet nommé `MEDITHE_DB` avec deux feuilles (ou les laisser être créées automatiquement, voir §3).

### Feuille `Produits`

| ID | Nom | Description | Prix | Categorie | Stock | Images | Disponible | DateAjout | DateModif |
|---|---|---|---|---|---|---|---|---|---|

- `ID` : UUID généré automatiquement à la création
- `Images` : URLs Cloudinary séparées par des virgules
- `Disponible` : booléen (TRUE/FALSE)

### Feuille `Commandes`

| NumeroCommande | DateHeure | Nom | Prenom | Telephone | Quartier | Ville | Note | Produits | MontantTotal | Statut | NotesCallCenter |
|---|---|---|---|---|---|---|---|---|---|---|---|

- `NumeroCommande` : format `MED-AAMMJJ-XXXX` (généré par le script)
- `Produits` : JSON stringifié, ex. `[{"id":"...","nom":"Thé vert","prix":2500,"quantite":2}]`
- `Statut` : une valeur parmi `Nouvelle`, `Contactée`, `Confirmée`, `Annulée`, `Livrée`

## 2. Déploiement du script

1. Dans le Google Sheet : **Extensions > Apps Script**
2. Coller le contenu de `Code.gs`
3. Exécuter une fois la fonction `initSheets` (menu déroulant en haut > sélectionner `initSheets` > ▶ Exécuter) pour créer les feuilles avec les bons en-têtes si elles n'existent pas
4. Exécuter une fois la fonction `setAdminPassword` après avoir remplacé `CHANGE_MOI` par le vrai mot de passe admin, **puis effacer cette ligne du code** (le mot de passe ne doit jamais rester en clair dans le script)
5. (Optionnel) Dans **Propriétés du script** (icône ⚙️), ajouter une propriété `EMAIL_CALL_CENTER` avec l'adresse email qui doit recevoir les notifications de nouvelle commande
6. **Déployer > Nouveau déploiement**
   - Type : *Application Web*
   - Exécuter en tant que : *Moi*
   - Qui a accès : *Tout le monde*
7. Copier l'URL du déploiement (`https://script.google.com/macros/s/XXXXX/exec`) — c'est l'URL d'API à utiliser côté frontend

## 3. ⚠️ Point d'attention critique — CORS

Les Web Apps Apps Script ne gèrent pas les requêtes *preflight* `OPTIONS` du CORS. Conséquence concrète pour le frontend :

- **GET** : fonctionne normalement (pas de préflight)
- **POST** : le `fetch()` côté frontend doit envoyer le body avec `Content-Type: text/plain;charset=utf-8` (et non `application/json`), pour éviter que le navigateur déclenche un préflight `OPTIONS` que le script ne peut pas traiter. Le script lit quand même `e.postData.contents` et fait `JSON.parse()` dessus normalement — voir l'exemple d'appel côté frontend dans `src/api/sheetsApi.js`.

Ce n'est pas une option de confort, c'est une contrainte imposée par Apps Script : sans ce contournement, **toutes les requêtes POST échoueront silencieusement en préflight**.

## 4. Quotas à surveiller (compte Google gratuit)

| Ressource | Limite/jour |
|---|---|
| Temps d'exécution total du script | 90 min/jour |
| Emails envoyés via `MailApp` | 100/jour |
| Appels vers une Web App | pas de limite fixe documentée, mais chaque exécution consomme le quota de temps ci-dessus |

Si le volume de commandes dépasse largement les usages actuels, prévoir une migration vers Firebase (Firestore) ou un backend léger (Cloudflare Workers + D1), le frontend n'ayant qu'à changer l'URL d'API.

## 5. Sécurité de l'authentification admin

L'implémentation actuelle (`adminLogin` dans `Code.gs`) est volontairement simple :
- mot de passe unique haché en SHA-256, stocké dans les propriétés du script (jamais dans le Sheet ni dans le code)
- token de session temporaire (4h) stocké dans le cache du script

**C'est un premier niveau acceptable pour un MVP**, mais le cahier des charges recommande Firebase Auth pour une solution plus robuste (gestion multi-utilisateurs, expiration fine, révocation). À migrer si plusieurs personnes doivent accéder à l'admin avec des rôles différents.
