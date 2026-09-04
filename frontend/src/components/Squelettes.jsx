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


// Squelette de tableau générique — réutilisé sur tous les écrans à listes (Admin*, Closer*)
export function SqueletteTableau({ colonnes = 5, lignes = 5 }) {
  return (
    <div className="table-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {Array.from({ length: lignes }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: colonnes }).map((_, j) => (
                <td key={j} style={{ padding: '0.7rem 0.6rem', borderBottom: '1px solid var(--line)' }}>
                  <div className="squelette-ligne" style={{ height: '12px', width: j === 0 ? '70%' : '85%' }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}