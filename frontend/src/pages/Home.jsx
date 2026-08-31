import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../api/sheetsApi.js';
import { mockProduits } from '../data/mockProduits.js';
import { fetchCatalogFromCdn } from '../utils/catalogSync.js';

export default function Home() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('Toutes');
  const [triPrix, setTriPrix] = useState('defaut');
  const [disponibleUniquement, setDisponibleUniquement] = useState(false);
  const catalogueRef = useRef(null);

  useEffect(() => {
    fetchCatalogFromCdn()
      .then((data) => {
        setProduits(data);
        setChargement(false);
      })
      .catch(() => {
        const { cached, fresh } = api.getProduitsRapide();
        if (cached) {
          setProduits(cached);
          setChargement(false);
        }
        fresh
          .then(setProduits)
          .catch(() => { if (!cached) setProduits(mockProduits); })
          .finally(() => setChargement(false));
      });
  }, []);

  const categories = useMemo(
    () => ['Toutes', ...new Set(produits.map((p) => p.Categorie))],
    [produits]
  );

  const vignettesCategories = useMemo(() => {
    const parCategorie = {};
    produits.forEach((p) => {
      if (!parCategorie[p.Categorie]) parCategorie[p.Categorie] = p;
    });
    return Object.entries(parCategorie).map(([nom, produit]) => ({
      nom,
      image: produit.Images?.[0] || null,
    }));
  }, [produits]);

  const produitDuMoment = useMemo(() => {
    const disponibles = produits.filter((p) => p.Disponible && p.Stock > 0);
    const liste = disponibles.length ? disponibles : produits;
    if (!liste.length) return null;
    return [...liste].sort((a, b) => new Date(b.DateAjout) - new Date(a.DateAjout))[0];
  }, [produits]);

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

  function allerAuCatalogue(cat) {
    if (cat) setCategorie(cat);
    catalogueRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div>
      {/* HERO */}
      <section className="hero-full">
        <img src="/brand/hero-produits.jpg" alt="Produits de soin MédiThé" className="hero-full-mobile-img" />
        <div className="container">
          <div className="hero-full-inner">
            <span className="eyebrow" style={{ color: 'var(--copper-dark)' }}>
              Distributeur officiel et exclusif en Afrique
            </span>
            <h1 style={{ color: 'var(--forest)', marginTop: '0.4rem', lineHeight: 1.15 }}>
              La santé à chaque gorgée de thé
            </h1>
            <p style={styles.heroText}>
              Des thés de soin 100 % naturels, sélectionnés pour accompagner votre corps
              au quotidien — articulations, reins, digestion, et plus encore.
            </p>
            <button className="btn btn-primary" onClick={() => allerAuCatalogue()} style={{ marginTop: '0.5rem' }}>
              Découvrir nos thés →
            </button>
          </div>
        </div>
      </section>

      {/* BANDEAU RÉASSURANCE */}
      <section style={styles.reassuranceBar}>
        <div className="container reassurance-row">
          <ReassuranceItem titre="Livraison à domicile" texte="Partout où vous êtes" />
          <ReassuranceItem titre="Paiement à la livraison" texte="Aucun paiement en ligne" />
          <ReassuranceItem titre="100% Naturel" texte="Qualité garantie" />
          <ReassuranceItem titre="Confirmation par téléphone" texte="Un appel avant chaque envoi" />
        </div>
      </section>

      {/* PAR CATÉGORIE */}
      {vignettesCategories.length > 0 && (
        <section className="container" style={{ padding: '3rem 1.5rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Nos catégories de soin</h2>
          <div style={styles.categoriesGrid}>
            {vignettesCategories.map((cat) => (
              <button key={cat.nom} onClick={() => allerAuCatalogue(cat.nom)} style={styles.categorieCarte}>
                <div style={styles.categorieImageZone}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.nom} style={styles.categorieImage} />
                  ) : (
                    <span style={{ fontSize: '1.5rem', color: 'var(--sage)' }}>◈</span>
                  )}
                </div>
                <span style={styles.categorieNom}>{cat.nom}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* PRODUIT DU MOMENT */}
      {produitDuMoment && (
        <section style={styles.moment}>
          <div className="container moment-grid">
            <div style={styles.momentImageZone}>
              {produitDuMoment.Images?.[0] ? (
                <img src={produitDuMoment.Images[0]} alt={produitDuMoment.Nom} style={styles.momentImage} />
              ) : (
                <span style={{ fontSize: '2.5rem', color: 'var(--sage)' }}>◈</span>
              )}
            </div>
            <div>
              <span className="eyebrow" style={{ color: 'var(--copper)' }}>Nouveauté</span>
              <h2 style={{ marginTop: '0.3rem' }}>{produitDuMoment.Nom}</h2>
              <p style={{ opacity: 0.8, maxWidth: '420px' }}>{produitDuMoment.Description}</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span className="price-tag" style={{ fontSize: '1.3rem' }}>
                  {produitDuMoment.Prix.toLocaleString('fr-FR')} F CFA
                </span>
                {produitDuMoment.PrixBarre > produitDuMoment.Prix && (
                  <span style={{ textDecoration: 'line-through', opacity: 0.5, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                    {produitDuMoment.PrixBarre.toLocaleString('fr-FR')} F CFA
                  </span>
                )}
              </p>
              <Link to={`/produit/${produitDuMoment.ID}`} className="btn btn-primary">
                Découvrir →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CATALOGUE COMPLET */}
      <section className="container" style={{ padding: '3rem 1.5rem' }} ref={catalogueRef} id="catalogue">
        <h2 style={{ marginBottom: '1.5rem' }}>Tous nos thés</h2>

        <div style={styles.filtres}>
          <input
            type="search"
            placeholder="Rechercher un thé…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={styles.input}
          />
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} style={styles.select}>
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
          <p>Chargement du catalogue…</p>
        ) : produitsFiltres.length === 0 ? (
          <p>Aucun thé ne correspond à cette recherche.</p>
        ) : (
          <div className="catalogue-grid">
            {produitsFiltres.map((p) => <ProductCard key={p.ID} produit={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function ReassuranceItem({ titre, texte }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--forest)' }}>{titre}</p>
      <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.7 }}>{texte}</p>
    </div>
  );
}

const styles = {
  heroText: {
    color: 'var(--ink)',
    opacity: 0.85,
    maxWidth: '440px',
    fontSize: '1.05rem',
    margin: '1rem 0',
  },
  reassuranceBar: {
    background: 'var(--parchment-dark)',
    padding: '1.1rem 0',
    borderBottom: '1px solid var(--line)',
  },
    categoriesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '1.5rem',
  },
    categorieCarte: {
    background: 'var(--parchment-dark)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: '1rem',
    width: '140px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.6rem',
  },
  categorieImageZone: {
    width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
    background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  categorieImage: { width: '100%', height: '100%', objectFit: 'cover' },
  categorieNom: { fontSize: '0.85rem', fontWeight: 500, textAlign: 'center' },
  moment: { background: 'var(--sage-light)', padding: '3rem 0' },
  momentImageZone: {
    aspectRatio: '4 / 3', background: 'var(--parchment)', borderRadius: 'var(--radius)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  momentImage: { width: '100%', height: '100%', objectFit: 'cover' },
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