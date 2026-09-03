import React, { useEffect, useState } from 'react';
import { api } from '../../api/supabaseApi.js';
import { useAdmin } from '../../context/AdminContext.jsx';

const TARIF_PAR_COMMANDE = 500;

export default function AdminClosers() {
  const { token } = useAdmin();
  const [stats, setStats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [nouveauNom, setNouveauNom] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  function charger() {
    setChargement(true);
    api.getStatsClosers(dateDebut, dateFin)
      .then(setStats)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(charger, [dateDebut, dateFin]);

  async function handleAjouter(e) {
    e.preventDefault();
    if (!nouveauNom.trim()) return;
    setEnvoi(true);
    setErreur('');
    try {
      await api.addCloser(nouveauNom.trim());
      setNouveauNom('');
      charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  async function handleRetirer(nom) {
    if (!confirm(`Retirer « ${nom} » de la liste des closers ? Son historique de commandes reste conservé.`)) return;
    try {
      await api.removeCloser(nom);
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  function reinitialiserDates() {
    setDateDebut('');
    setDateFin('');
  }

  const totalRemunerables = stats.reduce((s, c) => s + c.commandesRemunerables, 0);
  const totalAPayer = stats.reduce((s, c) => s + c.montantAPayer, 0);

  return (
    <div>
      <h1>Closers</h1>

      <form onSubmit={handleAjouter} style={styles.formAjout}>
        <input
          value={nouveauNom}
          onChange={(e) => setNouveauNom(e.target.value)}
          placeholder="Nom du closer (ex: Joël)"
          style={styles.input}
        />
        <button className="btn btn-primary" type="submit" disabled={envoi || !nouveauNom.trim()}>
          + Ajouter un closer
        </button>
      </form>

      <div style={styles.filtreDate}>
        <div>
          <label style={styles.labelDate}>Depuis</label>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} style={styles.inputDate} />
        </div>
        <div>
          <label style={styles.labelDate}>Jusqu'au</label>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} style={styles.inputDate} />
        </div>
        {(dateDebut || dateFin) && (
          <button className="btn-ghost" onClick={reinitialiserDates} style={{ alignSelf: 'flex-end' }}>Réinitialiser</button>
        )}
      </div>

      <p style={{ fontSize: '0.82rem', opacity: 0.65, marginTop: '-0.5rem' }}>
        Tarif : {TARIF_PAR_COMMANDE} F CFA par commande rémunérable (hors Injoignable, Annulé/Rejeté, Client oiseau).
      </p>

      {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}

      {chargement ? (
        <p>Chargement…</p>
      ) : stats.length === 0 ? (
        <p>Aucun closer enregistré pour l'instant.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Closer</th>
              <th style={styles.th}>Commandes traitées</th>
              <th style={styles.th}>Rémunérables</th>
              <th style={styles.th}>Exclues</th>
              <th style={styles.th}>Montant généré</th>
              <th style={styles.th}>À payer</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {stats.map((c) => (
              <tr key={c.nom}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{c.nom}</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)' }}>{c.traitees}</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{c.commandesRemunerables}</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', color: c.annulees > 0 ? 'var(--danger)' : 'inherit' }}>{c.annulees}</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)' }}>{c.montantGenere.toLocaleString('fr-FR')} F</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--copper-dark)' }}>
                  {c.montantAPayer.toLocaleString('fr-FR')} F
                </td>
                <td style={styles.td}>
                  <button className="btn-ghost" onClick={() => handleRetirer(c.nom)} style={{ color: 'var(--danger)' }}>
                    Retirer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Total</td>
              <td></td>
              <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{totalRemunerables}</td>
              <td></td>
              <td></td>
              <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--copper-dark)' }}>
                {totalAPayer.toLocaleString('fr-FR')} F
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

const styles = {
  formAjout: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', maxWidth: '420px' },
  input: {
    flex: 1, padding: '0.6em 0.8em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', background: 'var(--parchment)',
  },
  filtreDate: { display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '0.5rem' },
  labelDate: { display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 500 },
  inputDate: {
    padding: '0.5em 0.7em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', background: 'var(--parchment)',
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '0.7rem 0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.9rem' },
};