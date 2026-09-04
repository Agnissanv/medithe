import React, { useState } from 'react';
import { api } from '../api/supabaseApi.js';

const ETAPES_PUBLIQUES = ['Commande reçue', 'Confirmée', 'En cours de livraison', 'Livrée'];

const STATUT_VERS_ETAPE = {
  'Nouvelle': 0,
  'Programmer le': 0,
  'Je vous rappel': 0,
  'Injoignable': 0,
  'Expédié': 1,
  "En cours d'expédition": 1,
  'Prêt pour livraison': 1,
  'En cours de livraison': 2,
  'Livré': 3,
};

const STATUTS_ANNULES = ['Annulé / Rejeté', 'Client oiseau'];

export default function OrderTracking() {
  const [numero, setNumero] = useState('');
  const [commande, setCommande] = useState(null);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setRecherche(true);
    setErreur('');
    setCommande(null);
    try {
      const data = await api.getCommande(numero.trim());
      setCommande(data);
    } catch (err) {
      setErreur("Commande introuvable. Vérifiez le numéro saisi.");
    } finally {
      setRecherche(false);
    }
  }

  const estAnnulee = commande && STATUTS_ANNULES.includes(commande.Statut);
  const etapeActuelle = commande ? (STATUT_VERS_ETAPE[commande.Statut] ?? 0) : -1;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '560px', margin: '0 auto' }}>
      <h1>Suivre ma commande</h1>
      <p style={{ opacity: 0.75 }}>Entrez le numéro reçu à la confirmation de votre commande.</p>

      <form onSubmit={handleSubmit} style={styles.formulaire}>
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="MED-260828-1234"
          style={styles.input}
        />
        <button className="btn btn-primary" type="submit" disabled={recherche || !numero.trim()} style={styles.boutonRecherche}>
          {recherche && <span className="spinner-bouton" />}
          {recherche ? 'Recherche…' : 'Rechercher'}
        </button>
      </form>

      {erreur && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{erreur}</p>}

      {commande && (
        <div style={styles.resultat}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="eyebrow">Commande {commande.NumeroCommande}</span>
            <span className="eyebrow">{new Date(commande.DateHeure).toLocaleDateString('fr-FR')}</span>
          </div>

          {estAnnulee ? (
            <p style={{ color: 'var(--danger)', fontWeight: 500, marginTop: '1rem' }}>
              Cette commande a été annulée. N'hésitez pas à en repasser une nouvelle si vous le souhaitez.
            </p>
          ) : (
            <div style={styles.etapes}>
              {ETAPES_PUBLIQUES.map((etape, i) => (
                <div key={etape} style={styles.etape}>
                  <span style={{
                    ...styles.puce,
                    background: i <= etapeActuelle ? 'var(--copper)' : 'var(--line)',
                  }} />
                  <span style={{ opacity: i <= etapeActuelle ? 1 : 0.5 }}>{etape}</span>
                </div>
              ))}
            </div>
          )}

          <hr className="hairline" style={{ margin: '1.2rem 0' }} />

          <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
            {commande.Produits.map((p, i) => (
              <li key={i}>{p.nom} × {p.quantite}</li>
            ))}
          </ul>
          <p className="price-tag" style={{ marginTop: '0.8rem' }}>
            Total : {Number(commande.MontantTotal).toLocaleString('fr-FR')} F CFA
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  formulaire: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' },
  input: {
    flex: '1 1 220px', padding: '0.65em 0.8em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', background: 'var(--parchment-dark)',
  },
  boutonRecherche: { flexShrink: 0 },
  resultat: {
    marginTop: '2rem', background: 'var(--parchment-dark)', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', padding: '1.3rem',
  },
  etapes: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.2rem' },
  etape: { display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' },
  puce: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
};