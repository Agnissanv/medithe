import React, { useEffect, useState } from 'react';
import { api } from '../../api/supabaseApi.js';
import { useAuth } from '../../context/AuthContext.jsx';

const TARIF_PAR_COMMANDE = 500;

export default function AdminClosers() {
  const { session } = useAuth();
  const [stats, setStats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [filtreRole, setFiltreRole] = useState('Tous');

  const [formOuvert, setFormOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('closer');
  const [envoi, setEnvoi] = useState(false);

  function charger() {
    setChargement(true);
    api.getStatsClosers(dateDebut, dateFin)
      .then(setStats)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(charger, [dateDebut, dateFin]);

  async function handleCreerCompte(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur('');
    try {
      await api.createCompte(nom.trim(), email.trim(), password, role, session.access_token);
      setNom(''); setEmail(''); setPassword('');
      setFormOuvert(false);
      charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  function reinitialiserDates() {
    setDateDebut('');
    setDateFin('');
  }

  const statsFiltrees = filtreRole === 'Tous' ? stats : stats.filter((s) => s.role === filtreRole);
  const totalRemunerables = statsFiltrees.reduce((s, c) => s + c.commandesRemunerables, 0);
  const totalAPayer = statsFiltrees.reduce((s, c) => s + c.montantAPayer, 0);

  return (
    <div>
      <h1>Équipe</h1>

      {!formOuvert ? (
        <button className="btn btn-primary" onClick={() => setFormOuvert(true)} style={{ marginBottom: '1.5rem' }}>
          + Ajouter un membre de l'équipe
        </button>
      ) : (
        <form onSubmit={handleCreerCompte} style={styles.formAjout}>
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom (ex: Joël)" style={styles.input} required />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" style={styles.input} required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mot de passe" style={styles.input} required minLength={6} />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
            <option value="closer">Closer</option>
            <option value="livreur">Livreur</option>
          </select>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="btn btn-primary" type="submit" disabled={envoi}>{envoi ? 'Création…' : 'Créer le compte'}</button>
            <button type="button" className="btn-outline btn" onClick={() => setFormOuvert(false)}>Annuler</button>
          </div>
        </form>
      )}

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

      <div style={{ marginBottom: '1rem' }}>
        <select value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)} style={styles.input}>
          <option value="Tous">Tous les rôles</option>
          <option value="closer">Closers uniquement</option>
          <option value="livreur">Livreurs uniquement</option>
        </select>
      </div>

      {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}

      {chargement ? (
        <p>Chargement…</p>
      ) : statsFiltrees.length === 0 ? (
        <p>Aucun membre d'équipe enregistré pour l'instant.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Rôle</th>
              <th style={styles.th}>Commandes traitées</th>
              <th style={styles.th}>Rémunérables</th>
              <th style={styles.th}>Exclues</th>
              <th style={styles.th}>Montant généré</th>
              <th style={styles.th}>À payer</th>
            </tr>
          </thead>
          <tbody>
            {statsFiltrees.map((c) => (
              <tr key={c.nom}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{c.nom}</td>
                <td style={styles.td}>{c.role}</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)' }}>{c.traitees}</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{c.commandesRemunerables}</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', color: c.annulees > 0 ? 'var(--danger)' : 'inherit' }}>{c.annulees}</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)' }}>{c.montantGenere.toLocaleString('fr-FR')} F</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--copper-dark)' }}>
                  {c.montantAPayer.toLocaleString('fr-FR')} F
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
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

const styles = {
  formAjout: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' },
  input: { padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', background: 'var(--parchment)' },
  filtreDate: { display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '0.5rem' },
  labelDate: { display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 500 },
  inputDate: { padding: '0.5em 0.7em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', background: 'var(--parchment)' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '0.7rem 0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.9rem' },
};