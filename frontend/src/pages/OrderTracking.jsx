import React, { useState } from 'react';
import { api } from '../api/supabaseApi.js';

const ETAPES = ['Nouvelle', 'Contactée', 'Confirmée', 'Livrée'];

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

  const etapeActuelle = commande ? ETAPES.indexOf(commande.Statut) : -1;
  const estAnnulee = commande?.Statut === 'Annulée';

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '560px', margin: '0 auto' }}>
      <h1>Suivre ma commande</h1>
      <p style={{ opacity: 0.75 }}>Entrez le numéro reçu à la confirmation de votre commande.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="MED-260828-1234"
          style={styles.input}
        />
        <button className="btn btn-primary" type="submit" disabled={recherche || !numero.trim()}>
          {recherche ? '…' : 'Rechercher'}
        </button>
      </form>

      {erreur && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{erreur}</p>}

      {commande && (
        <div style={styles.resultat}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="eyebrow">Commande {commande.NumeroCommande}</span>
            <span className="eyebrow">{new Date(commande.DateHeure).toLocaleDateString('fr-FR')}</span>
          </div>

          {estAnnulee ? (
            <p style={{ color: 'var(--danger)', fontWeight: 500, marginTop: '1rem' }}>Commande annulée</p>
          ) : (
            <div style={styles.etapes}>
              {ETAPES.map((etape, i) => (
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
  input: {
    flex: 1, padding: '0.65em 0.8em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', background: 'var(--parchment-dark)',
  },
  resultat: {
    marginTop: '2rem', background: 'var(--parchment-dark)', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', padding: '1.3rem',
  },
  etapes: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.2rem' },
  etape: { display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' },
  puce: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' },
};
