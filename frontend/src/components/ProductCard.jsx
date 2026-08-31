import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ produit }) {
  const { addItem } = useCart();
  const epuise = !produit.Disponible || produit.Stock <= 0;

  function handleAjouter(e) {
    e.preventDefault(); // empêche le lien de la carte de s'activer
    e.stopPropagation();
    addItem(produit, 1);
  }

  return (
    <Link to={`/produit/${produit.ID}`} style={styles.card} className="product-card">
      <div style={styles.imageZone}>
        {produit.Images?.[0] ? (
          <img src={produit.Images[0]} alt={produit.Nom} style={styles.image} />
        ) : (
          <div style={styles.placeholder}>◈</div>
        )}
        {epuise && <span style={styles.badgeEpuise}>Épuisé</span>}
      </div>

      <div style={styles.body}>
        <span className="eyebrow">{produit.Categorie}</span>
        <h3 style={styles.nom}>{produit.Nom}</h3>
        <div style={styles.footer}>
          <span className="price-tag">{produit.Prix.toLocaleString('fr-FR')} F CFA</span>
          {produit.PrixBarre > produit.Prix && (
            <span style={styles.prixBarre}>{produit.PrixBarre.toLocaleString('fr-FR')} F</span>
          )}
        </div>
        {!epuise && (
          <button className="btn btn-primary" onClick={handleAjouter} style={styles.boutonAjouter}>
            Ajouter au panier
          </button>
        )}
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--parchment-dark)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    color: 'var(--ink)',
  },
  imageZone: {
    position: 'relative',
    aspectRatio: '4 / 3',
    background: 'var(--sage-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { fontSize: '2rem', color: 'var(--sage)' },
  badgeEpuise: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'var(--forest)',
    color: 'var(--parchment)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    padding: '0.25em 0.6em',
    borderRadius: 'var(--radius)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  body: {
    padding: '1rem 1.1rem 1.2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    borderTop: '1px dashed var(--line)',
  },
  nom: { fontSize: '1.05rem', margin: 0 },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.4rem',
    flexWrap: 'wrap',
    gap: '0.3rem',
  },
  prixBarre: {
    textDecoration: 'line-through',
    opacity: 0.5,
    fontSize: '0.78rem',
    fontFamily: 'var(--font-mono)',
  },
  boutonAjouter: {
    marginTop: '0.6rem',
    width: '100%',
    justifyContent: 'center',
    fontSize: '0.85rem',
    padding: '0.6em 1em',
  },
};