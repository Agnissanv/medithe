import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/supabaseApi.js';
import { mockProduits } from '../data/mockProduits.js';
import { useSEO } from '../hooks/useSEO.js';
import { trackViewContent } from '../utils/tracking.js';
import ProductDetailContenu from '../components/ProductDetailContenu.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const [produit, setProduit] = useState(null);

  useEffect(() => {
    let annule = false;
    api.getProduit(id)
      .then((p) => { if (!annule) setProduit(p); })
      .catch(() => { if (!annule) setProduit(mockProduits.find((p) => p.ID === id) || null); });
    return () => { annule = true; };
  }, [id]);

  useEffect(() => {
    if (produit) trackViewContent(produit);
  }, [produit]);

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

  if (!produit) return <ProductDetailSquelette />;

  return <ProductDetailContenu produit={produit} />;
}

function ProductDetailSquelette() {
  return (
    <div className="product-page-fond">
      <div className="product-page-carte">
        <div className="container" style={{ padding: '2rem 1.5rem' }}>
          <div className="squelette-lien" />
          <div className="product-layout">
            <div>
              <div className="squelette-image" />
              <div className="badges-confiance-grid">
                {[0, 1, 2, 3].map((i) => <div key={i} className="squelette-badge" />)}
              </div>
            </div>
            <div>
              <div className="squelette-ligne" style={{ width: '30%', height: '14px' }} />
              <div className="squelette-ligne" style={{ width: '70%', height: '32px', marginTop: '0.6rem' }} />
              <div className="squelette-ligne" style={{ width: '40%', height: '24px', marginTop: '1rem' }} />
              <div className="squelette-formulaire" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
