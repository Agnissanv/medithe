import React, { useEffect, useState } from 'react';
import { api } from '../../api/supabaseApi.js';

const VIDE = { code: '', typeReduction: 'pourcentage', valeur: '', dateExpiration: '', utilisationMax: '' };

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [form, setForm] = useState(VIDE);
  const [creation, setCreation] = useState(false);
  const [erreurCreation, setErreurCreation] = useState('');

  useEffect(() => { charger(); }, []);

  function charger() {
    setChargement(true);
    api.getCodesPromo()
      .then(setCodes)
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }

  async function handleCreer(e) {
    e.preventDefault();
    if (!form.code.trim() || !form.valeur) return;
    setCreation(true);
    setErreurCreation('');
    try {
      await api.createCodePromo({
        code: form.code,
        typeReduction: form.typeReduction,
        valeur: Number(form.valeur),
        dateExpiration: form.dateExpiration ? new Date(form.dateExpiration).toISOString() : null,
        utilisationMax: form.utilisationMax ? Number(form.utilisationMax) : null,
      });
      setForm(VIDE);
      charger();
    } catch (err) {
      setErreurCreation(err.message || 'Ce code existe peut-être déjà.');
    } finally {
      setCreation(false);
    }
  }

  async function handleToggle(id, actif) {
    setCodes((cs) => cs.map((c) => (c.id === id ? { ...c, actif } : c)));
    try {
      await api.toggleCodePromo(id, actif);
    } catch (err) {
      setErreur(err.message);
      charger();
    }
  }

  async function handleSupprimer(id) {
    if (!window.confirm('Supprimer ce code promo ? Cette action est définitive.')) return;
    try {
      await api.deleteCodePromo(id);
      setCodes((cs) => cs.filter((c) => c.id !== id));
    } catch (err) {
      setErreur(err.message);
    }
  }

  if (chargement) return <p>Chargement…</p>;
  if (erreur && !codes) {
    return (
      <p style={{ color: 'var(--danger)' }}>
        {erreur.includes('does not exist') || erreur.includes('schema cache')
          ? "Cette section n'est pas encore activée sur la base de données. Demande le script SQL de mise en place."
          : erreur}
      </p>
    );
  }

  return (
    <div>
      <h1>Codes promo</h1>
      <p style={{ opacity: 0.7, fontSize: '0.9rem', maxWidth: '600px' }}>
        Crée des codes de réduction utilisables sur la page de commande. Un code peut avoir une date
        d'expiration et/ou un nombre d'utilisations maximum, optionnels.
      </p>

      <form onSubmit={handleCreer} style={styles.form}>
        <div style={styles.ligne}>
          <label style={styles.champ}>
            <span style={styles.label}>Code</span>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="BIENVENUE10"
              style={styles.input}
            />
          </label>
          <label style={styles.champ}>
            <span style={styles.label}>Type</span>
            <select
              value={form.typeReduction}
              onChange={(e) => setForm((f) => ({ ...f, typeReduction: e.target.value }))}
              style={styles.input}
            >
              <option value="pourcentage">Pourcentage (%)</option>
              <option value="montant">Montant fixe (F CFA)</option>
            </select>
          </label>
          <label style={styles.champ}>
            <span style={styles.label}>Valeur</span>
            <input
              type="number"
              min="1"
              value={form.valeur}
              onChange={(e) => setForm((f) => ({ ...f, valeur: e.target.value }))}
              placeholder={form.typeReduction === 'pourcentage' ? '10' : '1000'}
              style={styles.input}
            />
          </label>
        </div>
        <div style={styles.ligne}>
          <label style={styles.champ}>
            <span style={styles.label}>Expiration (optionnel)</span>
            <input
              type="date"
              value={form.dateExpiration}
              onChange={(e) => setForm((f) => ({ ...f, dateExpiration: e.target.value }))}
              style={styles.input}
            />
          </label>
          <label style={styles.champ}>
            <span style={styles.label}>Nombre d'utilisations max (optionnel)</span>
            <input
              type="number"
              min="1"
              value={form.utilisationMax}
              onChange={(e) => setForm((f) => ({ ...f, utilisationMax: e.target.value }))}
              placeholder="Illimité"
              style={styles.input}
            />
          </label>
        </div>
        {erreurCreation && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{erreurCreation}</p>}
        <button className="btn btn-primary" type="submit" disabled={creation} style={{ alignSelf: 'flex-start' }}>
          {creation ? 'Création…' : 'Créer le code'}
        </button>
      </form>

      <h3 style={{ marginTop: '2.5rem' }}>Codes existants</h3>
      {codes.length === 0 ? (
        <p style={{ opacity: 0.6 }}>Aucun code promo pour l'instant.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Réduction</th>
                <th style={styles.th}>Expiration</th>
                <th style={styles.th}>Utilisations</th>
                <th style={styles.th}>Actif</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id}>
                  <td style={styles.td}><span style={{ fontFamily: 'var(--font-mono)' }}>{c.code}</span></td>
                  <td style={styles.td}>
                    {c.type_reduction === 'pourcentage' ? `${c.valeur}%` : `${Number(c.valeur).toLocaleString('fr-FR')} F CFA`}
                  </td>
                  <td style={styles.td}>{c.date_expiration ? new Date(c.date_expiration).toLocaleDateString('fr-FR') : '—'}</td>
                  <td style={styles.td}>{c.utilisation_actuelle}{c.utilisation_max ? ` / ${c.utilisation_max}` : ''}</td>
                  <td style={styles.td}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" checked={c.actif} onChange={(e) => handleToggle(c.id, e.target.checked)} />
                    </label>
                  </td>
                  <td style={styles.td}>
                    <button className="btn-ghost" onClick={() => handleSupprimer(c.id)} style={{ color: 'var(--danger)' }}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  form: {
    display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem',
    background: 'var(--parchment-dark)', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
    padding: '1.3rem', maxWidth: '680px',
  },
  ligne: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  champ: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 180px' },
  label: { fontSize: '0.82rem', fontWeight: 500 },
  input: {
    padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
    background: 'var(--parchment)', fontFamily: 'var(--font-body)',
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '0.7rem 0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.9rem', verticalAlign: 'top' },
};
