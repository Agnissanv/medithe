import React, { useEffect, useState } from 'react';
import { api } from '../api/supabaseApi.js';
import ProductCard from './ProductCard.jsx';

export default function ProduitsSimilaires({ categorie, excludeId, titre, nombre = 4 }) {
  const [produits, setProduits] = useState(null);

  useEffect(() => {
    if (!categorie) { setProduits([]); return; }
    api.getProduits()
      .then((tous) => {
        const filtres = tous
          .filter((p) => p.Categorie === categorie && p.ID !== excludeId && p.Disponible)
          .slice(0, nombre);
        setProduits(filtres);
      })
      .catch(() => setProduits([]));
  }, [categorie, excludeId, nombre]);

  // Rien tant que ça charge (évite un flash de section vide), et rien du tout si
  // aucun autre produit de la même catégorie n'existe.
  if (!produits || produits.length === 0) return null;

  return (
    <section className="section-generique">
      {titre && <h2>{titre}</h2>}
      <div style={styles.grille}>
        {produits.map((p) => <ProductCard key={p.ID} produit={p} />)}
      </div>
    </section>
  );
}

const styles = {
  grille: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.2rem',
  },
};
