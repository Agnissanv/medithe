import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Cart() {
  const { items, updateQuantite, removeItem, sousTotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <h2>Votre panier est vide</h2>
        <p style={{ opacity: 0.75 }}>Parcourez le catalogue pour ajouter des thés.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Voir le catalogue</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <h1>Votre panier</h1>

      <div style={styles.liste}>
        {items.map((item) => (
          <div key={item.id} style={styles.ligne}>
            <div style={styles.infoZone}>
              <p style={{ margin: 0, fontWeight: 500 }}>{item.nom}</p>
              <span className="price-tag">{item.prix.toLocaleString('fr-FR')} F CFA</span>
            </div>
            <div style={styles.controles}>
              <div style={styles.quantiteBox}>
                <button className="btn-ghost" onClick={() => updateQuantite(item.id, item.quantite - 1)}>−</button>
                <span style={{ fontFamily: 'var(--font-mono)', minWidth: '2ch', textAlign: 'center' }}>{item.quantite}</span>
                <button className="btn-ghost" onClick={() => updateQuantite(item.id, item.quantite + 1)}>+</button>
              </div>
              <span className="price-tag">{(item.prix * item.quantite).toLocaleString('fr-FR')} F CFA</span>
              <button className="btn-ghost" onClick={() => removeItem(item.id)} aria-label={`Retirer ${item.nom}`}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <hr className="hairline" style={{ margin: '1.5rem 0' }} />

      <div style={styles.total}>
        <span>Sous-total</span>
        <span className="price-tag" style={{ fontSize: '1.2rem' }}>
          {sousTotal.toLocaleString('fr-FR')} F CFA
        </span>
      </div>
      <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>
        Le paiement se fait à la livraison, après confirmation téléphonique.
      </p>

      <button className="btn btn-primary" onClick={() => navigate('/commande')} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
        Passer la commande
      </button>
    </div>
  );
}

const styles = {
  liste: { display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' },
  ligne: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: 'var(--parchment-dark)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--line)',
  },
  infoZone: { minWidth: '140px', flex: '1 1 auto' },
  controles: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' },
  quantiteBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: '0.1rem 0.5rem',
  },
  total: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.05rem',
    fontWeight: 500,
  },
};