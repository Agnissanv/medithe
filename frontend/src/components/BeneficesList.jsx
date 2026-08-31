import React from 'react';
import { getIconeParCle } from '../utils/iconLibrary.js';

export default function BeneficesList({ items = [], titre }) {
  if (!items.length) return null;

  return (
    <section className="section-generique">
      {titre && <h2 style={{ textAlign: 'center' }}>{titre}</h2>}
      <div className="benefices-grid">
        {items.map((b) => {
          const Icone = getIconeParCle(b.icone);
          return (
            <div key={b.id} className="benefice-carte">
              <span className="benefice-icone"><Icone size={22} /></span>
              <p className="benefice-texte">{b.texte}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}