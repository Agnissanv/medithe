import React from 'react';

// Squelette de la grille catalogue (Home.jsx) — même animation que ProductDetailSquelette
export function SqueletteGrilleProduits({ nombre = 8 }) {
  return (
    <div className="catalogue-grid">
      {Array.from({ length: nombre }).map((_, i) => (
        <div key={i} className="squelette-carte-produit">
          <div className="squelette-image" />
          <div className="squelette-carte-corps">
            <div className="squelette-ligne" style={{ width: '40%', height: '10px' }} />
            <div className="squelette-ligne" style={{ width: '80%', height: '16px' }} />
            <div className="squelette-ligne" style={{ width: '50%', height: '14px', marginTop: '0.2rem' }} />
          </div>
        </div>
      ))}
    </div>
  );
}