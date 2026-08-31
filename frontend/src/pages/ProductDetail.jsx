import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truck, ShieldCheck, Leaf, PhoneCall } from 'lucide-react';
import { api } from '../api/sheetsApi.js';
import { fetchCatalogFromCdn } from '../utils/catalogSync.js';
import { mockProduits } from '../data/mockProduits.js';
import { useSEO } from '../hooks/useSEO.js';
import ProductGallery from '../components/ProductGallery.jsx';
import SectionRenderer from '../components/sections/SectionRenderer.jsx';
import InlineOrderForm from '../components/InlineOrderForm.jsx';

const ID_FORMULAIRE_DEFAUT = 'zone-commande-defaut';

export default function ProductDetail() {
  const { id } = useParams();
  const [produit, setProduit] = useState(null);

  useEffect(() => {
    let annule = false;

    fetchCatalogFromCdn()
      .then((data) => {
        if (annule) return;
        const trouve = data.find((p) => p.ID === id);
        if (trouve) { setProduit(trouve); return; }
        throw new Error('Produit absent du catalogue CDN');
      })
      .catch(() => {
        api.getProduit(id)
          .then((p) => { if (!annule) setProduit(p); })
          .catch(() => { if (!annule) setProduit(mockProduits.find((p) => p.ID === id) || null); });
      });

    return () => { annule = true; };
  }, [id]);

  useSEO({
    title: produit?.Nom,
    description: produit?.Description?.slice(0, 155),
    jsonLd: produit ? {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: produit.Nom,
      description: produit.Description,
      image: produit.Images?.[0],
      offers: {
        '@type': 'Offer',
        priceCurrency: 'XOF',
        price: produit.Prix,
        availability: produit.Disponible && produit.Stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    } : null,
  });

  if (!produit) return <div className="container" style={{ padding: '3rem 1.5rem' }}>Chargement…</div>;

  const epuise = !produit.Disponible || produit.Stock <= 0;
  const enPromo = produit.PrixBarre && produit.PrixBarre > produit.Prix;
  const economie = enPromo ? produit.PrixBarre - produit.Prix : 0;

  return (
    <div className="product-page-fond">
      <div className="product-page-carte">
        <div className="container" style={{ padding: '2rem 1.5rem' }}>
          <Link to="/" className="eyebrow">← Retour au catalogue</Link>

          {/* ZONE HAUTE — galerie + titre/prix/formulaire par défaut (fixe, non déplaçable) */}
          <div className="product-layout">
            <div>
              <ProductGallery images={produit.Images} videoUrl={produit.VideoUrl} nom={produit.Nom} />

              <div className="badges-confiance-grid">
                <BadgeConfiance icon={Truck} titre="Livraison à domicile" texte="Partout où vous êtes" />
                <BadgeConfiance icon={ShieldCheck} titre="Paiement à la livraison" texte="Aucun paiement en ligne" />
                <BadgeConfiance icon={Leaf} titre="100% Naturel" texte="Qualité garantie" />
                <BadgeConfiance icon={PhoneCall} titre="Confirmation téléphonique" texte="Un appel avant l'envoi" />
              </div>
            </div>

            <div>
              <span className="eyebrow">{produit.Categorie}</span>
              <h1 style={{ marginTop: '0.3rem', marginBottom: '0.3rem' }}>{produit.Nom}</h1>

              <div style={styles.prixLigne}>
                <span className="price-tag" style={{ fontSize: '1.4rem' }}>
                  {produit.Prix.toLocaleString('fr-FR')} F CFA
                </span>
                {enPromo && (
                  <div style={styles.prixBarreLigne}>
                    <span style={styles.prixBarre}>{produit.PrixBarre.toLocaleString('fr-FR')} F CFA</span>
                    <span style={styles.badgePromo}>-{economie.toLocaleString('fr-FR')} F</span>
                  </div>
                )}
              </div>

              {epuise ? (
                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger)', marginTop: '1rem' }}>
                  Actuellement épuisé
                </p>
              ) : (
                <>
                  {produit.Stock <= 5 && (
                    <p style={styles.urgence}>
                      Stock limité : {produit.Stock} unité{produit.Stock > 1 ? 's' : ''} restante{produit.Stock > 1 ? 's' : ''}
                    </p>
                  )}
                  <div style={{ marginTop: '1.2rem' }}>
                    <InlineOrderForm produit={produit} domId={ID_FORMULAIRE_DEFAUT} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ZONE BASSE — blocs entièrement gérés par l'admin, centrés pleine largeur */}
          <div className="product-sections-zone">
            {produit.Sections?.length > 0 && <hr className="hairline" style={{ margin: '2.5rem 0' }} />}
            {produit.Sections?.map((section) => (
              <SectionRenderer
                key={section.id}
                section={section}
                produit={produit}
                formulaireDomId={ID_FORMULAIRE_DEFAUT}
              />
            ))}
          </div>
        </div>
      </div>

      {!epuise && (
        <div className="sticky-cta">
          <span className="price-tag">{produit.Prix.toLocaleString('fr-FR')} F CFA</span>
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center', marginLeft: '1rem' }}
            onClick={() => document.getElementById(ID_FORMULAIRE_DEFAUT)?.scrollIntoView({ behavior: 'smooth' })}
          >
            Commander
          </button>
        </div>
      )}
    </div>
  );
}

function BadgeConfiance({ icon: Icon, titre, texte }) {
  return (
    <div style={styles.badgeItem}>
      <Icon size={18} color="var(--sage)" style={{ flexShrink: 0 }} />
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem', color: 'var(--forest)' }}>{titre}</p>
        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.65 }}>{texte}</p>
      </div>
    </div>
  );
}

const styles = {
  prixLigne: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' },
  prixBarreLigne: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  prixBarre: { textDecoration: 'line-through', opacity: 0.5, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' },
  badgePromo: { background: 'var(--danger)', color: 'white', fontSize: '0.72rem', fontWeight: 600, padding: '0.2em 0.6em', borderRadius: '50px', fontFamily: 'var(--font-mono)' },
  urgence: { color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: '0.8rem 0' },
  badgeItem: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--parchment-dark)', borderRadius: 'var(--radius)', padding: '0.6rem 0.7rem' },
};