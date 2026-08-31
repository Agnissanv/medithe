import React from 'react';

function initiales(nom) {
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase())
    .join('');
}

export function noteMoyenne(avis) {
  if (!avis?.length) return null;
  const somme = avis.reduce((s, a) => s + Number(a.note || 0), 0);
  return (somme / avis.length).toFixed(1);
}

export default function AvisList({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="avis-grid">
      {items.map((avis, i) => (
        <div key={i} style={styles.carte}>
          <div style={styles.entete}>
            <span style={styles.avatar}>{initiales(avis.nom)}</span>
            <div>
              <p style={styles.nom}>{avis.nom}</p>
              <div style={styles.etoiles}>{'★'.repeat(avis.note)}{'☆'.repeat(5 - avis.note)}</div>
            </div>
          </div>
          <p style={styles.commentaire}>{avis.commentaire}</p>
        </div>
      ))}
    </div>
  );
}

const styles = {
  carte: {
    background: 'var(--parchment-dark)', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', padding: '1.2rem',
  },
  entete: { display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.7rem' },
  avatar: {
    width: '38px', height: '38px', borderRadius: '50%', background: 'var(--sage-light)',
    color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
  },
  nom: { margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--forest)' },
  etoiles: { color: 'var(--copper)', fontSize: '0.85rem' },
  commentaire: { fontSize: '0.9rem', opacity: 0.85, margin: 0 },
};