import React, { useEffect, useState } from 'react';
import { api } from '../../api/supabaseApi.js';
import { exportCommandesToCsv } from '../../utils/csv.js';
import { SqueletteTableau } from '../../components/Squelettes.jsx';

const STATUTS = [
  'Nouvelle', 'Expédié', "En cours d'expédition", 'Prêt pour livraison',
  'Programmer le', 'Je vous rappel', 'Injoignable', 'Annulé / Rejeté', 'Client oiseau'
];

const STYLE_STATUT = {
  Nouvelle: { fond: 'var(--parchment)', bande: 'var(--line)' },
  'Livré': { fond: '#6FC768', bande: '#1F5D22' },
  'En cours de livraison': { fond: '#DCF3D8', bande: '#7CB679' },
  'Expédié': { fond: '#8FD189', bande: '#2F7A32' },
  'Prêt pour livraison': { fond: '#B2DFDB', bande: '#00695C' },
  "En cours d'expédition": { fond: '#EAF6E7', bande: '#A7CBA1' },
  'Programmer le': { fond: '#FBE29B', bande: '#B8790E' },
  'Je vous rappel': { fond: '#FDEFC0', bande: '#D1A23A' },
  'Injoignable': { fond: '#BBDEFB', bande: '#1565C0' },
  'Annulé / Rejeté': { fond: '#F1AC9E', bande: 'var(--danger)' },
  'Client oiseau': { fond: '#E57368', bande: '#8B1E12' },
};

export default function AdminOrders() {
  const [commandes, setCommandes] = useState([]);
  const [filtre, setFiltre] = useState('Toutes');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [commandeOuverte, setCommandeOuverte] = useState(null);
  const [confirmationVidage, setConfirmationVidage] = useState('');
  const [vidageOuvert, setVidageOuvert] = useState(false);

  function charger() {
    setChargement(true);
    api.getCommandes(filtre === 'Toutes' ? null : filtre)
      .then(setCommandes)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(charger, [filtre]);

  async function handleChangerStatut(numero, statut) {
    try {
      await api.updateStatutCommande(numero, statut);
      setErreur('');
      charger();
      if (commandeOuverte?.NumeroCommande === numero) {
        setCommandeOuverte((c) => ({ ...c, Statut: statut }));
      }
    } catch (err) {
      setErreur(err.message);
      charger();
    }
  }

  async function handleEnregistrerNote(numero, statutActuel, note) {
    try {
      await api.updateStatutCommande(numero, statutActuel, note);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
      charger();
    }
  }

  async function handleSupprimer(numero) {
    if (!confirm(`Supprimer la commande ${numero} ? Cette action est irréversible.`)) return;
    try {
      await api.deleteCommande(numero);
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  async function handleViderTout() {
    if (confirmationVidage !== 'SUPPRIMER') return;
    try {
      await api.clearAllCommandes();
      setVidageOuvert(false);
      setConfirmationVidage('');
      charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <div>
      <div style={styles.header}>
        <h1>Commandes</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)} style={styles.select}>
            <option value="Toutes">Tous les statuts</option>
            {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-outline btn" onClick={() => exportCommandesToCsv(commandes)} disabled={!commandes.length}>
            Exporter en CSV
          </button>
          <button
            className="btn-outline btn"
            onClick={() => setVidageOuvert(true)}
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
            disabled={!commandes.length}
          >
            Vider toutes les commandes
          </button>
        </div>
      </div>

      {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}

      {chargement ? (
        <SqueletteTableau colonnes={10} />
      ) : commandes.length === 0 ? (
        <p>Aucune commande{filtre !== 'Toutes' ? ` avec le statut « ${filtre} »` : ''}.</p>
      ) : (
        <div className="table-scroll">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Numéro</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Client</th>
              <th style={styles.th}>Téléphone</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>Traité par</th>
              <th style={styles.th}>Notes (interne)</th>
              <th style={styles.th}></th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((c) => {
              const style = STYLE_STATUT[c.Statut] || STYLE_STATUT.Nouvelle;
              return (
                <tr key={c.NumeroCommande} style={{ background: style.fond, borderLeft: `4px solid ${style.bande}` }}>
                  <td style={{ ...styles.td, fontFamily: 'var(--font-mono)' }}>{c.NumeroCommande}</td>
                  <td style={styles.td}>{new Date(c.DateHeure).toLocaleDateString('fr-FR')}</td>
                  <td style={styles.td}>{c.Nom}</td>
                  <td style={{ ...styles.td, fontFamily: 'var(--font-mono)' }}>{c.Telephone}</td>
                  <td style={{ ...styles.td, fontFamily: 'var(--font-mono)' }}>{Number(c.MontantTotal).toLocaleString('fr-FR')} F</td>
                  <td style={styles.td}>
                    {c.TraitePar === 'closer' ? (
                      <span style={styles.badgeVerrou}>{c.Statut}</span>
                    ) : (
                      <select
                        value={c.Statut}
                        onChange={(e) => handleChangerStatut(c.NumeroCommande, e.target.value)}
                        style={styles.selectInline}
                      >
                        {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </td>
                  <td style={{ ...styles.td, fontWeight: 600, color: 'var(--forest)' }}>
                    {c.NomCloser || <span style={{ opacity: 0.4, fontWeight: 400 }}>Non attribué</span>}
                  </td>
                  <td style={styles.td}>
                    {c.TraitePar === 'closer' ? (
                      <span style={{ ...styles.badgeVerrou, display: 'block' }}>{c.NotesCallCenter || '—'}</span>
                    ) : (
                      <textarea
                        key={c.NumeroCommande}
                        defaultValue={c.NotesCallCenter || ''}
                        onBlur={(e) => handleEnregistrerNote(c.NumeroCommande, c.Statut, e.target.value)}
                        placeholder="Ex: rappeler mardi, client hésite..."
                        rows={2}
                        style={styles.noteTextarea}
                      />
                    )}
                  </td>
                  <td style={styles.td}>
                    <button className="btn-ghost" onClick={() => setCommandeOuverte(c)}>Détail</button>
                  </td>
                  <td style={styles.td}>
                    <button className="btn-ghost" onClick={() => handleSupprimer(c.NumeroCommande)} style={{ color: 'var(--danger)' }}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      {commandeOuverte && (
        <div style={styles.overlay} onClick={() => setCommandeOuverte(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <span className="eyebrow">{commandeOuverte.NumeroCommande}</span>
            <h3 style={{ marginTop: '0.3rem' }}>{commandeOuverte.Nom}</h3>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{commandeOuverte.Telephone}</p>
            <p>{commandeOuverte.Quartier}</p>
            {commandeOuverte.Note && <p style={{ fontStyle: 'italic', opacity: 0.8 }}>« {commandeOuverte.Note} »</p>}
            <hr className="hairline" style={{ margin: '1rem 0' }} />
            <ul style={{ paddingLeft: '1.1rem' }}>
              {commandeOuverte.Produits.map((p, i) => (
                <li key={i}>{p.nom} × {p.quantite} — {(p.prix * p.quantite).toLocaleString('fr-FR')} F</li>
              ))}
            </ul>
            <p className="price-tag" style={{ fontSize: '1.1rem' }}>
              Total : {Number(commandeOuverte.MontantTotal).toLocaleString('fr-FR')} F CFA
            </p>
            <button className="btn-outline btn" onClick={() => setCommandeOuverte(null)} style={{ marginTop: '1rem' }}>Fermer</button>
          </div>
        </div>
      )}

      {vidageOuvert && (
        <div style={styles.overlay} onClick={() => setVidageOuvert(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--danger)' }}>⚠ Vider toutes les commandes</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.85 }}>
              Cette action supprime <strong>définitivement</strong> les {commandes.length} commande(s) actuellement enregistrées. Impossible à annuler.
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
              Tape <strong>SUPPRIMER</strong> pour confirmer :
            </p>
            <input
              value={confirmationVidage}
              onChange={(e) => setConfirmationVidage(e.target.value)}
              style={styles.confirmInput}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--danger)' }}
                disabled={confirmationVidage !== 'SUPPRIMER'}
                onClick={handleViderTout}
              >
                Confirmer la suppression
              </button>
              <button className="btn-outline btn" onClick={() => { setVidageOuvert(false); setConfirmationVidage(''); }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' },
  select: { padding: '0.5em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--parchment)' },
  selectInline: { padding: '0.3em 0.5em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--parchment)', fontSize: '0.85rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '0.7rem 0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.9rem', verticalAlign: 'top' },
  badgeVerrou: { fontSize: '0.82rem', opacity: 0.7, fontStyle: 'italic' },
  noteTextarea: {
    width: '180px', fontSize: '0.8rem', padding: '0.4em 0.5em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', resize: 'vertical', background: 'var(--parchment)',
  },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(11,77,30,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  modal: { background: 'var(--parchment)', padding: '1.5rem', borderRadius: 'var(--radius)', width: 'min(400px, 92vw)', maxHeight: '80vh', overflowY: 'auto' },
  confirmInput: { width: '100%', padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', marginTop: '0.5rem' },
};