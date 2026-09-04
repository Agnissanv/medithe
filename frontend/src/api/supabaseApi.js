import { supabase } from '../lib/supabaseClient.js';

const STATUTS_EXCLUS_CA = ['Annulé / Rejeté', 'Client oiseau', 'Injoignable'];

// --- Traduction snake_case (base) -> PascalCase (déjà utilisé partout dans l'app) ---
function mapProduit(p) {
  return {
    ID: p.id,
    Nom: p.nom,
    Description: p.description,
    Prix: Number(p.prix),
    PrixBarre: p.prix_barre ? Number(p.prix_barre) : null,
    CommissionCloser: Number(p.commission_closer),
    CommissionLivreur: Number(p.commission_livreur),
    Categorie: p.categorie,
    Stock: p.stock,
    Images: p.images || [],
    Disponible: p.disponible,
    VideoUrl: p.video_url || '',
    Sections: p.sections || [],
    DateAjout: p.date_ajout,
  };
}

function mapCommande(c) {
  return {
    NumeroCommande: c.numero_commande,
    DateHeure: c.date_heure,
    Nom: c.nom,
    Telephone: c.telephone,
    Quartier: c.adresse,
    Note: c.note,
    Produits: c.produits,
    MontantTotal: Number(c.montant_total),
    Statut: c.statut,
    NotesCallCenter: c.notes_interne,
    TraitePar: c.role_traitant,
    NomCloser: c.nom_traitant,
    NomLivreur: c.nom_livreur,
  };
}

export const api = {
  // ---------------- PRODUITS ----------------
  async getProduits() {
    const { data, error } = await supabase.from('produits').select('*').order('date_ajout', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map(mapProduit);
  },

  async getProduit(id) {
    const { data, error } = await supabase.from('produits').select('*').eq('id', id).single();
    if (error) throw new Error('Produit introuvable');
    return mapProduit(data);
  },

  async createProduit(produit) {
    const { data, error } = await supabase.from('produits').insert({
      nom: produit.nom,
      description: produit.description,
      prix: produit.prix,
      prix_barre: produit.prixBarre,
      commission_closer: produit.commissionCloser,
      commission_livreur: produit.commissionLivreur,
      categorie: produit.categorie,
      stock: produit.stock,
      images: produit.images,
      disponible: produit.disponible,
      video_url: produit.videoUrl,
      sections: produit.sections,
    }).select().single();
    if (error) throw new Error(error.message);
    return { success: true, id: data.id };
  },

  async updateProduit(id, produit) {
    const { error } = await supabase.from('produits').update({
      nom: produit.nom,
      description: produit.description,
      prix: produit.prix,
      prix_barre: produit.prixBarre,
      categorie: produit.categorie,
      stock: produit.stock,
      images: produit.images,
      disponible: produit.disponible,
      video_url: produit.videoUrl,
      sections: produit.sections,
      date_modif: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  async deleteProduit(id) {
    const { error } = await supabase.from('produits').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  // ---------------- COMMANDES ----------------
  async createCommande(commande) {
    const { data, error } = await supabase.rpc('creer_commande', {
      p_nom: commande.nom,
      p_telephone: commande.telephone,
      p_adresse: commande.quartier,
      p_note: commande.note || '',
      p_produits: commande.produits,
      p_montant_total: commande.produits.reduce((s, p) => s + p.prix * p.quantite, 0),
    }).single();
    if (error) throw new Error(error.message);
    return { success: true, numeroCommande: data.numero_commande, montantTotal: Number(data.montant_total) };
  },

  async getCommandeByNumero(numero) {
    const { data, error } = await supabase.from('commandes').select('*').eq('numero_commande', numero).single();
    if (error) throw new Error('Commande introuvable');
    return mapCommande(data);
  },

  async getCommandes(statut) {
    let requete = supabase.from('commandes').select('*').order('date_heure', { ascending: false });
    if (statut) requete = requete.eq('statut', statut);
    const { data, error } = await requete;
    if (error) throw new Error(error.message);
    return data.map(mapCommande);
  },

  async updateStatutCommande(numero, statut, notes) {
    const { error } = await supabase.rpc('update_statut_commande', {
      p_numero: numero, p_statut: statut, p_notes: notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  },

    async updateStatutLivraison(numero, statut) {
    const { error } = await supabase.rpc('update_statut_livraison', { p_numero: numero, p_statut: statut });
    if (error) throw new Error(error.message);
    return { success: true };
  },

  async deleteCommande(numero) {
    const { error } = await supabase.from('commandes').delete().eq('numero_commande', numero);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  async clearAllCommandes() {
    const { error } = await supabase.from('commandes').delete().neq('numero_commande', '');
    if (error) throw new Error(error.message);
    return { success: true };
  },

  // ---------------- STATISTIQUES (calculées ici, plus besoin d'Apps Script) ----------------
  async getStats(dateDebut, dateFin) {
    const commandes = await this.getCommandes();
    const filtrees = commandes.filter((c) => {
      const d = new Date(c.DateHeure);
      if (dateDebut && d < new Date(dateDebut)) return false;
      if (dateFin && d > new Date(dateFin + 'T23:59:59')) return false;
      return true;
    });

    const produits = await this.getProduits();
    const parStatut = {};
    let chiffreAffaires = 0;
    const ventesParProduit = {};

    filtrees.forEach((c) => {
      parStatut[c.Statut] = (parStatut[c.Statut] || 0) + 1;
      if (!STATUTS_EXCLUS_CA.includes(c.Statut)) {
        chiffreAffaires += c.MontantTotal;
        c.Produits.forEach((p) => { ventesParProduit[p.nom] = (ventesParProduit[p.nom] || 0) + p.quantite; });
      }
    });

    const topProduits = Object.entries(ventesParProduit).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([nom, qte]) => ({ nom, qte }));
    const stockFaible = produits.filter((p) => p.Stock <= 5).map((p) => ({ nom: p.Nom, stock: p.Stock }));

    return { chiffreAffaires, nombreCommandes: filtrees.length, parStatut, topProduits, stockFaible };
  },

  async getStatsClosers(dateDebut, dateFin) {
    const { data: profils, error } = await supabase.from('profiles').select('*').in('role', ['closer', 'livreur']);
    if (error) throw new Error(error.message);

    let commandes = await this.getCommandes();
    commandes = commandes.filter((c) => {
      const d = new Date(c.DateHeure);
      if (dateDebut && d < new Date(dateDebut)) return false;
      if (dateFin && d > new Date(dateFin + 'T23:59:59')) return false;
      return true;
    });

    return profils.map((p) => {
      if (p.role === 'livreur') {
        // Le livreur est payé uniquement sur les commandes effectivement livrées
        const cmdsLivrees = commandes.filter((c) => c.NomLivreur === p.nom && c.Statut === 'Livré');
        const commission = cmdsLivrees.reduce((total, c) => {
          return total + c.Produits.reduce((s, item) => s + (item.quantite * (item.commissionLivreur || 0)), 0);
        }, 0);
        return {
          nom: p.nom,
          role: p.role,
          traitees: cmdsLivrees.length,
          commandesRemunerables: cmdsLivrees.length,
          annulees: 0,
          montantGenere: cmdsLivrees.reduce((s, c) => s + c.MontantTotal, 0),
          montantAPayer: commission,
        };
      }

      // Closer : commission sur toute commande qui n'a pas échoué
      const cmds = commandes.filter((c) => c.NomCloser === p.nom);
      const nonExclues = cmds.filter((c) => !STATUTS_EXCLUS_CA.includes(c.Statut));
      const commission = nonExclues.reduce((total, c) => {
        return total + c.Produits.reduce((s, item) => s + (item.quantite * (item.commissionCloser || 0)), 0);
      }, 0);

      return {
        nom: p.nom,
        role: p.role,
        traitees: cmds.length,
        commandesRemunerables: nonExclues.length,
        annulees: cmds.length - nonExclues.length,
        montantGenere: nonExclues.reduce((s, c) => s + c.MontantTotal, 0),
        montantAPayer: commission,
      };
    });
  },

  // ---------------- GESTION DES COMPTES (closers/livreurs) ----------------
  async createCompte(nom, email, password, role, accessToken) {
    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, password, role, accessToken }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Échec de la création du compte');
    return json;
  },

  async removeCompte(userId) {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};