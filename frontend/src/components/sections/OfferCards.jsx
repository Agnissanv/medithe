import React from 'react';

export default function OfferCards({ cartes = [], onChoisir }) {
  if (!cartes.length) return null;

  return (
    <div className="offres-grid">
      {cartes.map((c) => (
        <div key={c.id} className={`offre-carte ${c.miseEnAvant ? 'offre-carte-avant' : ''}`}>
          {c.miseEnAvant && c.badgeTexte && <span className="offre-badge">{c.badgeTexte}</span>}
          <span className="eyebrow">{c.eyebrow}</span>
          <div className="offre-prix">
            {c.prix}
            {c.suffixePrix && <span className="offre-prix-suffixe"> {c.suffixePrix}</span>}
          </div>
          {c.prixBarre && (
            <div className="offre-prix-barre-ligne">
              <span className="offre-prix-barre">{c.prixBarre} {c.suffixePrix}</span>
            </div>
          )}
          {c.description && (
            <div className="contenu-riche offre-description" dangerouslySetInnerHTML={{ __html: c.description }} />
          )}
          {c.fonctionnalites?.length > 0 && (
            <ul className="offre-liste">
              {c.fonctionnalites.map((f, i) => (
                <li key={i}><span className="offre-check">✓</span> {f}</li>
              ))}
            </ul>
          )}
          <button
            className={c.miseEnAvant ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
            onClick={() => onChoisir?.()}
          >
            {c.texteBouton || 'Choisir'}
          </button>
        </div>
      ))}
    </div>
  );
}