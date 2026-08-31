import React, { useState } from 'react';

export default function FaqAccordion({ items = [] }) {
  const [ouvert, setOuvert] = useState(null);
  if (!items.length) return null;

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={styles.item}>
          <button onClick={() => setOuvert(ouvert === i ? null : i)} style={styles.question}>
            <span>{item.question}</span>
            <span>{ouvert === i ? '−' : '+'}</span>
          </button>
          {ouvert === i && (
            <div className="contenu-riche" style={styles.reponse} dangerouslySetInnerHTML={{ __html: item.reponse }} />
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  item: { borderBottom: '1px solid var(--line)' },
  question: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 0', background: 'transparent', textAlign: 'left', fontWeight: 500, fontSize: '0.95rem',
  },
  reponse: { paddingBottom: '1rem', opacity: 0.85, fontSize: '0.9rem', maxWidth: '640px' },
};