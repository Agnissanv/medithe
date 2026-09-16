import React, { useEffect, useState } from 'react';
import { api } from '../../api/supabaseApi.js';
import ProductForm from './ProductForm.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';

export default function AdminProducts() {
  const confirmer = useConfirm();
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
      // edition.ID n'existe que pour une vraie modification ; 'nouveau' et une
      // duplication (produit copié sans ID) doivent tous les deux créer une nouvelle fiche.
      if (edition !== 'nouveau' && edition?.ID) {
        await api.updateProduit(edition.ID, data);
      } else {
        await api.createProduit(data);
      }
      setEdition(null);
      charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  function handleDupliquer(produit) {
    // Pré-remplit le formulaire "nouveau produit" avec les champs du produit source
    // (images, sections, prix, etc.) sans son ID, pour qu'Enregistrer crée une fiche
    // distincte plutôt que d'écraser l'originale.
    setEdition({ ...produit, ID: null, Nom: `${produit.Nom} (copie)`, _dupliqueDe: produit.Nom });
  }

  async function handleSupprimer(produit) {
    const ok = await confirmer(`Supprimer « ${produit.Nom} » ? Cette action est irréversible.`, {
      titre: 'Supprimer le produit', labelConfirmer: 'Supprimer',
    });
    if (!ok) return;
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
        <h1>
          {edition === 'nouveau'
            ? 'Nouveau produit'
            : edition.ID
            ? `Modifier « ${edition.Nom} »`
            : `Dupliquer « ${edition._dupliqueDe} »`}
        </h1>
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
      <div className="page-header-actions">
        <h1>Produits</h1>
        <button className="btn btn-primary" onClick={() => setEdition('nouveau')}>+ Ajouter un produit</button>
      </div>

      {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}

      {chargement ? (
        <p>Chargement…</p>
      ) : (
        <div className="table-scroll">
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
                  <button className="btn-ghost" onClick={() => handleDupliquer(p)}>Dupliquer</button>
                  <button className="btn-ghost" onClick={() => handleSupprimer(p)} style={{ color: 'var(--danger)' }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '0.7rem 0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.9rem' },
  badge: { fontFamily: 'var(--font-mono)', fontSize: '0.78rem' },
};