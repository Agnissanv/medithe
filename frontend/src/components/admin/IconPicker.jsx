import React from 'react';
import { ICONES_DISPONIBLES } from '../../utils/iconLibrary.js';

export default function IconPicker({ value, onChange }) {
  return (
    <div style={styles.grille}>
      {ICONES_DISPONIBLES.map(({ cle, Icone, label }) => (
        <button
          key={cle} type="button" title={label}
          onClick={() => onChange(cle)}
          style={{
            ...styles.bouton,
            borderColor: value === cle ? 'var(--copper)' : 'var(--line)',
            background: value === cle ? 'var(--sage-light)' : 'var(--parchment)',
          }}
        >
          <Icone size={18} />
        </button>
      ))}
    </div>
  );
}

const styles = {
  grille: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  bouton: {
    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--line)', borderRadius: 'var(--radius)', cursor: 'pointer',
  },
};