/**
 * MEDITHE — API Google Apps Script
 * Sert de backend pour le site e-commerce statique (produits + commandes)
 * À coller dans l'éditeur Apps Script lié au Google Sheet "MEDITHE_DB"
 *
 * Déploiement : Extensions > Apps Script > Déployer > Nouveau déploiement
 *   - Type : Application Web
 *   - Exécuter en tant que : Moi
 *   - Qui a accès : Tout le monde (nécessaire pour que le front public l'appelle)
 */

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

const SHEET_PRODUITS = 'Produits';
const SHEET_COMMANDES = 'Commandes';
const SHEET_ADMIN = 'Admin'; // colonne A : hash du mot de passe admin (voir plus bas)

const PRODUITS_HEADERS = [
  'ID', 'Nom', 'Description', 'Prix', 'Categorie',
  'Stock', 'Images', 'Disponible', 'DateAjout', 'DateModif'
];

const COMMANDES_HEADERS = [
  'NumeroCommande', 'DateHeure', 'Nom', 'Prenom', 'Telephone',
  'Quartier', 'Ville', 'Note', 'Produits', 'MontantTotal',
  'Statut', 'NotesCallCenter'
];

const STATUTS_VALIDES = ['Nouvelle', 'Contactée', 'Confirmée', 'Annulée', 'Livrée'];

// ------------------------------------------------------------------
// POINTS D'ENTRÉE
// ------------------------------------------------------------------

function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case 'getProduits':
        return jsonResponse({ success: true, data: getProduits() });

      case 'getProduit':
        return jsonResponse({ success: true, data: getProduitById(e.parameter.id) });

      case 'getCommande':
        return jsonResponse({ success: true, data: getCommandeByNumero(e.parameter.numero) });

      case 'getCommandes': // usage admin
        return jsonResponse({ success: true, data: getCommandes(e.parameter) });

      case 'getStats': // usage admin
        return jsonResponse({ success: true, data: getStats() });

      default:
        return jsonResponse({ success: false, error: 'Action GET inconnue: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    switch (action) {
      case 'createCommande':
        return jsonResponse(createCommande(body.commande));

      case 'updateStatutCommande': // usage admin
        requireAuth(body.token);
        return jsonResponse(updateStatutCommande(body.numero, body.statut, body.notes));

      case 'createProduit': // usage admin
        requireAuth(body.token);
        return jsonResponse(createProduit(body.produit));

      case 'updateProduit': // usage admin
        requireAuth(body.token);
        return jsonResponse(updateProduit(body.id, body.produit));

      case 'deleteProduit': // usage admin
        requireAuth(body.token);
        return jsonResponse(deleteProduit(body.id));

      case 'adminLogin':
        return jsonResponse(adminLogin(body.password));

      default:
        return jsonResponse({ success: false, error: 'Action POST inconnue: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ------------------------------------------------------------------
// PRODUITS
// ------------------------------------------------------------------

const CACHE_KEY_PRODUITS = 'produits_cache';
const CACHE_DURATION_SECONDES = 300; // 5 minutes

function getProduits() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY_PRODUITS);
  if (cached) return JSON.parse(cached);

  const sheet = getSheet(SHEET_PRODUITS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  const produits = rows
    .filter(r => r[0] !== '')
    .map(r => rowToObject(headers, r))
    .map(formatProduit);

  cache.put(CACHE_KEY_PRODUITS, JSON.stringify(produits), CACHE_DURATION_SECONDES);
  return produits;
}

function invalidateProduitsCache() {
  CacheService.getScriptCache().remove(CACHE_KEY_PRODUITS);
}

function getProduitById(id) {
  const produit = getProduits().find(p => String(p.ID) === String(id));
  if (!produit) throw new Error('Produit introuvable: ' + id);
  return produit;
}

function createProduit(data) {
  const sheet = getSheet(SHEET_PRODUITS);
  const id = Utilities.getUuid();
  const now = new Date();
  sheet.appendRow([
    id,
    data.nom,
    data.description || '',
    data.prix,
    data.categorie || '',
    data.stock || 0,
    (data.images || []).join(','),
    data.disponible !== false,
    now,
    now
  ]);
  invalidateProduitsCache();
  return { success: true, id: id };
}

function updateProduit(id, data) {
  const sheet = getSheet(SHEET_PRODUITS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('ID');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(id)) {
      const rowIndex = i + 1;
      if (data.nom !== undefined) sheet.getRange(rowIndex, headers.indexOf('Nom') + 1).setValue(data.nom);
      if (data.description !== undefined) sheet.getRange(rowIndex, headers.indexOf('Description') + 1).setValue(data.description);
      if (data.prix !== undefined) sheet.getRange(rowIndex, headers.indexOf('Prix') + 1).setValue(data.prix);
      if (data.categorie !== undefined) sheet.getRange(rowIndex, headers.indexOf('Categorie') + 1).setValue(data.categorie);
      if (data.stock !== undefined) sheet.getRange(rowIndex, headers.indexOf('Stock') + 1).setValue(data.stock);
      if (data.images !== undefined) sheet.getRange(rowIndex, headers.indexOf('Images') + 1).setValue(data.images.join(','));
      if (data.disponible !== undefined) sheet.getRange(rowIndex, headers.indexOf('Disponible') + 1).setValue(data.disponible);
      sheet.getRange(rowIndex, headers.indexOf('DateModif') + 1).setValue(new Date());
      invalidateProduitsCache();
      return { success: true };
    }
  }
  throw new Error('Produit introuvable: ' + id);
}

function deleteProduit(id) {
  const sheet = getSheet(SHEET_PRODUITS);
  const rows = sheet.getDataRange().getValues();
  const idCol = rows[0].indexOf('ID');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      invalidateProduitsCache();
      return { success: true };
    }
  }
  throw new Error('Produit introuvable: ' + id);
}

function formatProduit(p) {
  return {
    ID: p.ID,
    Nom: p.Nom,
    Description: p.Description,
    Prix: Number(p.Prix),
    Categorie: p.Categorie,
    Stock: Number(p.Stock),
    Images: p.Images ? String(p.Images).split(',').filter(Boolean) : [],
    Disponible: p.Disponible === true || p.Disponible === 'TRUE',
    DateAjout: p.DateAjout
  };
}

// ------------------------------------------------------------------
// COMMANDES
// ------------------------------------------------------------------

function createCommande(data) {
  // Validation stricte du téléphone (format local — à adapter selon le pays cible)
  if (!data.telephone || !/^[0-9+()\s.-]{8,20}$/.test(data.telephone)) {
    throw new Error('Numéro de téléphone invalide');
  }
  if (!data.nom || !data.prenom) {
    throw new Error('Nom et prénom requis');
  }
  if (!data.produits || !data.produits.length) {
    throw new Error('Le panier est vide');
  }

  const sheet = getSheet(SHEET_COMMANDES);
  const numeroCommande = generateOrderNumber();
  const montantTotal = data.produits.reduce((sum, p) => sum + (p.prix * p.quantite), 0);

  sheet.appendRow([
    numeroCommande,
    new Date(),
    data.nom,
    data.prenom,
    data.telephone,
    data.quartier || '',
    data.ville || '',
    data.note || '',
    JSON.stringify(data.produits),
    montantTotal,
    'Nouvelle',
    ''
  ]);

  notifyNewOrder(numeroCommande, data, montantTotal);

  return { success: true, numeroCommande: numeroCommande, montantTotal: montantTotal };
}

function getCommandeByNumero(numero) {
  const sheet = getSheet(SHEET_COMMANDES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  const found = rows.find(r => String(r[0]) === String(numero));
  if (!found) throw new Error('Commande introuvable: ' + numero);
  const cmd = rowToObject(headers, found);
  cmd.Produits = JSON.parse(cmd.Produits);
  return cmd;
}

function getCommandes(params) {
  const sheet = getSheet(SHEET_COMMANDES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  let commandes = rows
    .filter(r => r[0] !== '')
    .map(r => rowToObject(headers, r));

  if (params && params.statut) {
    commandes = commandes.filter(c => c.Statut === params.statut);
  }
  commandes.forEach(c => { c.Produits = JSON.parse(c.Produits); });
  return commandes.reverse(); // plus récentes en premier
}

function updateStatutCommande(numero, statut, notes) {
  if (STATUTS_VALIDES.indexOf(statut) === -1) {
    throw new Error('Statut invalide: ' + statut);
  }
  const sheet = getSheet(SHEET_COMMANDES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const numCol = headers.indexOf('NumeroCommande');
  const statutCol = headers.indexOf('Statut');
  const notesCol = headers.indexOf('NotesCallCenter');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][numCol]) === String(numero)) {
      sheet.getRange(i + 1, statutCol + 1).setValue(statut);
      if (notes !== undefined) sheet.getRange(i + 1, notesCol + 1).setValue(notes);
      return { success: true };
    }
  }
  throw new Error('Commande introuvable: ' + numero);
}

function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = ('0' + (date.getMonth() + 1)).slice(-2);
  const d = ('0' + date.getDate()).slice(-2);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MED-${y}${m}${d}-${rand}`;
}

// ------------------------------------------------------------------
// STATISTIQUES (admin)
// ------------------------------------------------------------------

function getStats() {
  const commandes = getCommandes({});
  const produits = getProduits();

  const parStatut = {};
  STATUTS_VALIDES.forEach(s => parStatut[s] = 0);

  let chiffreAffaires = 0;
  const ventesParProduit = {};

  commandes.forEach(c => {
    parStatut[c.Statut] = (parStatut[c.Statut] || 0) + 1;
    if (c.Statut !== 'Annulée') {
      chiffreAffaires += Number(c.MontantTotal);
      c.Produits.forEach(p => {
        ventesParProduit[p.nom] = (ventesParProduit[p.nom] || 0) + p.quantite;
      });
    }
  });

  const topProduits = Object.entries(ventesParProduit)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nom, qte]) => ({ nom, qte }));

  const stockFaible = produits.filter(p => p.Stock <= 5).map(p => ({ nom: p.Nom, stock: p.Stock }));

  return {
    chiffreAffaires,
    nombreCommandes: commandes.length,
    parStatut,
    topProduits,
    stockFaible
  };
}

// ------------------------------------------------------------------
// AUTHENTIFICATION ADMIN (basique — voir note de sécurité en bas de fichier)
// ------------------------------------------------------------------

function adminLogin(password) {
  const props = PropertiesService.getScriptProperties();
  const storedHash = props.getProperty('ADMIN_PASSWORD_HASH');
  const inputHash = hashPassword(password);

  if (inputHash !== storedHash) {
    throw new Error('Mot de passe incorrect');
  }

  const token = Utilities.getUuid();
  const expiry = new Date().getTime() + (4 * 60 * 60 * 1000); // 4h
  CacheService.getScriptCache().put('token_' + token, String(expiry), 4 * 60 * 60);

  return { success: true, token: token };
}

function requireAuth(token) {
  if (!token) throw new Error('Non authentifié');
  const cached = CacheService.getScriptCache().get('token_' + token);
  if (!cached) throw new Error('Session expirée, reconnectez-vous');
}

function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

// Fonction utilitaire à exécuter UNE FOIS manuellement depuis l'éditeur Apps Script
// pour définir le mot de passe admin (ne jamais committer le mot de passe en clair)
function setAdminPassword() {
  const password = 'CHANGE_MOI'; // ← remplacer avant exécution, puis effacer cette ligne
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD_HASH', hashPassword(password));
}

// ------------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------------

function notifyNewOrder(numero, data, montant) {
  const destinataire = PropertiesService.getScriptProperties().getProperty('EMAIL_CALL_CENTER');
  if (!destinataire) return; // notification non configurée

  const produitsListe = data.produits.map(p => `- ${p.nom} x${p.quantite} (${p.prix} F CFA)`).join('\n');

  MailApp.sendEmail({
    to: destinataire,
    subject: `Nouvelle commande MEDITHE — ${numero}`,
    body: `Nouvelle commande reçue.

Numéro: ${numero}
Client: ${data.prenom} ${data.nom}
Téléphone: ${data.telephone}
Adresse: ${data.quartier || ''}, ${data.ville || ''}

Produits:
${produitsListe}

Total: ${montant} F CFA

Merci d'appeler le client pour confirmer.`
  });
}

// ------------------------------------------------------------------
// UTILITAIRES
// ------------------------------------------------------------------

function getSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Feuille introuvable: ' + name);
  return sheet;
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => obj[h] = row[i]);
  return obj;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fonction à exécuter UNE FOIS manuellement pour initialiser les feuilles
 * si elles n'existent pas encore, avec les bons en-têtes.
 */
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss.getSheetByName(SHEET_PRODUITS)) {
    const s = ss.insertSheet(SHEET_PRODUITS);
    s.appendRow(PRODUITS_HEADERS);
  }
  if (!ss.getSheetByName(SHEET_COMMANDES)) {
    const s = ss.insertSheet(SHEET_COMMANDES);
    s.appendRow(COMMANDES_HEADERS);
  }
}
