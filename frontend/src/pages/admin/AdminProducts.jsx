import React, { useEffect, useState } from 'react';
import { api } from '../../api/supabaseApi.js';
import ProductForm from './ProductForm.jsx';

export default function AdminProducts() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [edition, setEdition] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  function charger() {
    setChargement(true);
    api.getProduits().then(setProduits).catch((e) => setErreur(e.message)).finally(() => setChargement(false));
  }

  useEffect(charger, []);

  async function handleSubmit(data) {
    setEnvoi(true);
    setErreur('');
    try {
      if (edition === 'nouveau') {
        await api.createProduit(data);
      } else {
        await api.updateProduit(edition.ID, data);
      }
      setEdition(null);
      charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  async function handleSupprimer(produit) {
    if (!confirm(`Supprimer « ${produit.Nom} » ? Cette action est irréversible.`)) return;
    try {
      await api.deleteProduit(produit.ID);
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  if (edition) {
    return (
      <div style={{ maxWidth: '640px' }}>
        <h1>{edition === 'nouveau' ? 'Nouveau produit' : `Modifier « ${edition.Nom} »`}</h1>
        {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}
        <ProductForm
          produitInitial={edition === 'nouveau' ? null : edition}
          onSubmit={handleSubmit}
          onAnnuler={() => setEdition(null)}
          envoi={envoi}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <h1>Produits</h1>
        <button className="btn btn-primary" onClick={() => setEdition('nouveau')}>+ Ajouter un produit</button>
      </div>

      {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}

      {chargement ? (
        <p>Chargement…</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Catégorie</th>
              <th style={styles.th}>Prix</th>
              <th style={styles.th}>Stock</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {produits.map((p) => (
              <tr key={p.ID}>
                <td style={styles.td}>{p.Nom}</td>
                <td style={styles.td}>{p.Categorie}</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)' }}>{p.Prix.toLocaleString('fr-FR')} F</td>
                <td style={{ ...styles.td, color: p.Stock <= 5 ? 'var(--danger)' : 'inherit' }}>{p.Stock}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, opacity: p.Disponible ? 1 : 0.5 }}>
                    {p.Disponible ? 'Visible' : 'Masqué'}
                  </span>
                </td>
                <td style={{ ...styles.td, display: 'flex', gap: '0.6rem' }}>
                  <button className="btn-ghost" onClick={() => setEdition(p)}>Modifier</button>
                  <button className="btn-ghost" onClick={() => handleSupprimer(p)} style={{ color: 'var(--danger)' }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '0.7rem 0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.9rem' },
  badge: { fontFamily: 'var(--font-mono)', fontSize: '0.78rem' },
};