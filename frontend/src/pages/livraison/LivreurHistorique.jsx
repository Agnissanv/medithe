import React, { useEffect, useState } from 'react';
import { api } from '../../api/supabaseApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { SqueletteCartesCommandes } from '../../components/Squelettes.jsx';

function dateDuJour() {
  return new Date().toISOString().slice(0, 10);
}

export default function LivreurHistorique() {
  const { profil } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [dateDebut, setDateDebut] = useState(dateDuJour());
  const [dateFin, setDateFin] = useState(dateDuJour());

  function charger() {
    setChargement(true);
    api.getCommandes('Livré')
      .then((toutes) => {
        setCommandes(toutes.filter((c) => c.NomLivreur === profil?.nom));
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(charger, [profil]);

  function estDansLaPeriode(c) {
    const jour = new Date(c.DateHeure).toISOString().slice(0, 10);
    if (dateDebut && jour < dateDebut) return false;
    if (dateFin && jour > dateFin) return false;
    return true;
  }

  function filtrerAujourdhui() {
    setDateDebut(dateDuJour());
    setDateFin(dateDuJour());
  }

  function reinitialiser() {
    setDateDebut('');
    setDateFin('');
  }

  const filtrees = commandes.filter(estDansLaPeriode);
  const totalPeriode = filtrees.reduce((s, c) => s + Number(c.MontantTotal), 0);

  return (
    <div>
      <h1>Historique de mes livraisons</h1>

      <div style={styles.filtres}>
        <div>
          <label style={styles.label}>Depuis</label>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} style={styles.inputDate} />
        </div>
        <div>
          <label style={styles.label}>Jusqu'au</label>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} style={styles.inputDate} />
        </div>
        <button className="btn-outline btn" onClick={filtrerAujourdhui}>Aujourd'hui</button>
        {(dateDebut || dateFin) && (
          <button className="btn-ghost" onClick={reinitialiser}>Réinitialiser</button>
        )}
      </div>

      {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}

      {chargement ? (
        <SqueletteCartesCommandes />
      ) : filtrees.length === 0 ? (
        <p style={{ opacity: 0.6 }}>Aucune livraison sur cette période.</p>
      ) : (
        <>
          <p style={{ opacity: 0.75, marginBottom: '1rem' }}>
            {filtrees.length} commande{filtrees.length > 1 ? 's' : ''} livrée{filtrees.length > 1 ? 's' : ''} —{' '}
            <strong>{totalPeriode.toLocaleString('fr-FR')} F CFA</strong> au total
          </p>
          <div style={styles.liste}>
            {filtrees.map((c) => (
              <div key={c.NumeroCommande} style={styles.carte}>
                <div style={{ flex: '1 1 200px' }}>
                  <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.NumeroCommande}</p>
                  <p style={{ margin: '0.3rem 0 0' }}>{c.Nom} — {c.Telephone}</p>
                  <p style={{ margin: '0.2rem 0 0', opacity: 0.8 }}>{c.Quartier}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="price-tag" style={{ margin: 0 }}>{Number(c.MontantTotal).toLocaleString('fr-FR')} F CFA</p>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', opacity: 0.65 }}>
                    {new Date(c.DateHeure).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  filtres: { display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem', flexWrap: 'wrap' },
  label: { display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', fontWeight: 500 },
  inputDate: { padding: '0.5em 0.7em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', background: 'var(--parchment)' },
  liste: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  carte: {
    background: 'var(--parchment-dark)', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
    padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
  },
};
