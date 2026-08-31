import React, { useEffect, useState } from 'react';
import { api } from '../../api/sheetsApi.js';
import { useAdmin } from '../../context/AdminContext.jsx';

export default function AdminDashboard() {
  const { token } = useAdmin();
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.getStats(token).then(setStats).catch((e) => setErreur(e.message));
  }, []);

  if (erreur) return <p style={{ color: 'var(--danger)' }}>{erreur}</p>;
  if (!stats) return <p>Chargement…</p>;

  const maxVentes = Math.max(...stats.topProduits.map((p) => p.qte), 1);

  return (
    <div>
      <h1>Tableau de bord</h1>

      <div style={styles.cartes}>
        <Carte label="Chiffre d'affaires" valeur={`${stats.chiffreAffaires.toLocaleString('fr-FR')} F CFA`} />
        <Carte label="Commandes" valeur={stats.nombreCommandes} />
        <Carte label="Alertes stock faible" valeur={stats.stockFaible.length} accent={stats.stockFaible.length > 0} />
      </div>

      <div style={styles.grid2}>
        <section style={styles.bloc}>
          <h3>Commandes par statut</h3>
          {Object.entries(stats.parStatut).map(([statut, n]) => (
            <div key={statut} style={styles.ligneStatut}>
              <span>{statut}</span>
              <span className="price-tag">{n}</span>
            </div>
          ))}
        </section>

        <section style={styles.bloc}>
          <h3>Produits les plus vendus</h3>
          {stats.topProduits.length === 0 ? (
            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Pas encore de ventes confirmées.</p>
          ) : (
            stats.topProduits.map((p) => (
              <div key={p.nom} style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{p.nom}</span>
                  <span className="price-tag">{p.qte}</span>
                </div>
                <div style={styles.barreFond}>
                  <div style={{ ...styles.barre, width: `${(p.qte / maxVentes) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {stats.stockFaible.length > 0 && (
        <section style={{ ...styles.bloc, marginTop: '1.5rem', borderColor: 'var(--danger)' }}>
          <h3 style={{ color: 'var(--danger)' }}>Stock faible (≤ 5)</h3>
          {stats.stockFaible.map((p) => (
            <div key={p.nom} style={styles.ligneStatut}>
              <span>{p.nom}</span>
              <span className="price-tag" style={{ color: 'var(--danger)' }}>{p.stock} restants</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Carte({ label, valeur, accent }) {
  return (
    <div style={{ ...styles.carte, borderColor: accent ? 'var(--danger)' : 'var(--line)' }}>
      <span className="eyebrow">{label}</span>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', margin: '0.3rem 0 0', color: accent ? 'var(--danger)' : 'var(--forest)' }}>
        {valeur}
      </p>
    </div>
  );
}

const styles = {
  cartes: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' },
  carte: { background: 'var(--parchment-dark)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '1.2rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  bloc: { background: 'var(--parchment-dark)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '1.3rem' },
  ligneStatut: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed var(--line)', fontSize: '0.9rem' },
  barreFond: { height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' },
  barre: { height: '100%', background: 'var(--copper)' },
};
