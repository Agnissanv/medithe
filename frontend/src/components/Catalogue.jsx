import React, { useMemo, useState } from 'react';
import ProductCard from './ProductCard.jsx';
import { SqueletteGrilleProduits } from './Squelettes.jsx';

// Le catalogue et ses filtres, utilisés sur l'accueil et sur la page « Nos produits ».
// categorie vient du parent : sur l'accueil, les vignettes de catégories la choisissent aussi.
export default function Catalogue({ titre, Titre = 'h2', produits, chargement, erreur, onReessayer, categorie, onCategorie }) {
  const [recherche, setRecherche] = useState('');
  const [triPrix, setTriPrix] = useState('defaut');
  const [disponibleUniquement, setDisponibleUniquement] = useState(false);

  const categories = useMemo(
    () => ['Toutes', ...new Set(produits.map((p) => p.Categorie))],
    [produits]
  );

  const produitsFiltres = useMemo(() => {
    let liste = produits.filter((p) =>
      p.Nom.toLowerCase().includes(recherche.toLowerCase())
    );
    if (categorie !== 'Toutes') liste = liste.filter((p) => p.Categorie === categorie);
    if (disponibleUniquement) liste = liste.filter((p) => p.Disponible && p.Stock > 0);
    if (triPrix === 'croissant') liste = [...liste].sort((a, b) => a.Prix - b.Prix);
    if (triPrix === 'decroissant') liste = [...liste].sort((a, b) => b.Prix - a.Prix);
    return liste;
  }, [produits, recherche, categorie, triPrix, disponibleUniquement]);

  return (
    <section className="container" style={{ padding: '3rem 1.5rem' }}>
      <Titre style={{ marginBottom: '1.5rem' }}>{titre}</Titre>

      <div style={styles.filtres}>
        <input
          type="search"
          placeholder="Rechercher un thé…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={styles.input}
        />
        <select value={categorie} onChange={(e) => onCategorie(e.target.value)} style={styles.select}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={triPrix} onChange={(e) => setTriPrix(e.target.value)} style={styles.select}>
          <option value="defaut">Trier par prix</option>
          <option value="croissant">Prix croissant</option>
          <option value="decroissant">Prix décroissant</option>
        </select>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={disponibleUniquement}
            onChange={(e) => setDisponibleUniquement(e.target.checked)}
          />
          En stock uniquement
        </label>
      </div>

      <hr className="hairline" style={{ margin: '1.5rem 0' }} />

      {chargement ? (
        <SqueletteGrilleProduits />
      ) : erreur ? (
        <div role="alert" style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p>Le catalogue ne répond pas pour le moment. Vérifiez votre connexion, puis réessayez.</p>
          <button type="button" className="btn btn-primary" onClick={onReessayer}>Réessayer</button>
        </div>
      ) : produitsFiltres.length === 0 ? (
        <p>Aucun thé ne correspond à cette recherche.</p>
      ) : (
        <div className="catalogue-grid">
          {produitsFiltres.map((p) => <ProductCard key={p.ID} produit={p} />)}
        </div>
      )}
    </section>
  );
}

const styles = {
  filtres: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' },
  input: {
    flex: '1 1 220px', padding: '0.6em 0.9em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', background: 'var(--parchment-dark)',
  },
  select: {
    padding: '0.6em 0.9em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', background: 'var(--parchment-dark)', fontFamily: 'var(--font-body)',
  },
  checkbox: { display: 'flex', alignItems: 'center', gap: '0.5em', fontSize: '0.9rem' },
};
