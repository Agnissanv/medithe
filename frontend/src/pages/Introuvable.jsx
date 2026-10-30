import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO.js';

export default function Introuvable() {
  useSEO({ title: 'Page introuvable' });
  return (
    <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
      <h1>Cette page n'existe pas</h1>
      <p style={{ opacity: 0.75 }}>Le lien est peut-être erroné, ou le produit n'est plus proposé.</p>
      <Link to="/" className="btn btn-primary">Voir tous nos thés</Link>
    </div>
  );
}
