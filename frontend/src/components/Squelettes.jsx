import React from 'react';
import { Leaf } from 'lucide-react';

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


// Squelette de cartes commandes — pour les listes en cartes (livraison)
export function SqueletteCartesCommandes({ nombre = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      {Array.from({ length: nombre }).map((_, i) => (
        <div key={i} style={{
          background: 'var(--parchment-dark)', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
          padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div className="squelette-ligne" style={{ width: '35%', height: '12px' }} />
            <div className="squelette-ligne" style={{ width: '60%', height: '12px' }} />
            <div className="squelette-ligne" style={{ width: '45%', height: '12px' }} />
          </div>
          <div className="squelette-ligne" style={{ width: '120px', height: '38px', borderRadius: 'var(--radius)' }} />
        </div>
      ))}
    </div>
  );
}


// Squelette du tableau de bord — cartes stats + blocs statut/top produits
export function SqueletteTableauBord() {
  const blocLignes = [0, 1, 2, 3];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ background: 'var(--parchment-dark)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '1.2rem' }}>
            <div className="squelette-ligne" style={{ width: '55%', height: '10px' }} />
            <div className="squelette-ligne" style={{ width: '70%', height: '22px', marginTop: '0.6rem' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {[0, 1].map((bloc) => (
          <div key={bloc} style={{ background: 'var(--parchment-dark)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '1.3rem' }}>
            {blocLignes.map((i) => (
              <div key={i} className="squelette-ligne" style={{ height: '14px', width: `${80 - i * 10}%`, margin: '0.6rem 0' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}


// Loader plein écran — App.jsx (Suspense des routes) et RequireRole.jsx (vérification d'auth)
export function SqueletteEcranPlein() {
  return (
    <div className="ecran-plein-loader">
      <Leaf size={32} />
      <span>Chargement…</span>
    </div>
  );
}