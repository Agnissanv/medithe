import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

/**
 * Fournit une fonction `confirmer(message, options)` qui retourne une Promise<boolean>,
 * pour remplacer les confirm() natifs du navigateur par une modale aux couleurs du site.
 *
 * Usage : const confirmer = useConfirm();
 *         const ok = await confirmer('Supprimer ce produit ?', { titre: 'Supprimer', labelConfirmer: 'Supprimer' });
 *         if (!ok) return;
 */
export function ConfirmProvider({ children }) {
  const [dialogue, setDialogue] = useState(null);
  const resolveRef = useRef(null);

  const confirmer = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialogue({
        message,
        titre: options.titre || 'Confirmer',
        labelConfirmer: options.labelConfirmer || 'Confirmer',
        labelAnnuler: options.labelAnnuler || 'Annuler',
        danger: options.danger !== false,
      });
    });
  }, []);

  function repondre(valeur) {
    setDialogue(null);
    resolveRef.current?.(valeur);
    resolveRef.current = null;
  }

  return (
    <ConfirmContext.Provider value={confirmer}>
      {children}
      {dialogue && (
        <div style={styles.overlay} onClick={() => repondre(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: dialogue.danger ? 'var(--danger)' : 'var(--forest)', marginTop: 0 }}>
              {dialogue.titre}
            </h3>
            <p style={{ fontSize: '0.92rem', opacity: 0.85, margin: '0.6rem 0 1.4rem' }}>{dialogue.message}</p>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={dialogue.danger ? { background: 'var(--danger)' } : undefined}
                onClick={() => repondre(true)}
                autoFocus
              >
                {dialogue.labelConfirmer}
              </button>
              <button className="btn-outline btn" onClick={() => repondre(false)}>
                {dialogue.labelAnnuler}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm() doit être utilisé à l'intérieur de <ConfirmProvider>");
  return ctx;
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(11,77,30,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem',
  },
  modal: {
    background: 'var(--parchment)', padding: '1.6rem', borderRadius: 'var(--radius)',
    width: 'min(420px, 92vw)', boxShadow: '0 8px 30px rgba(11,77,30,0.25)',
  },
};
