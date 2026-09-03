import React, { useEffect, useState } from 'react';
import { api } from '../../api/supabaseApi.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LivreurOrders() {
  const { profil } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  function charger() {
    setChargement(true);
    api.getCommandes()
      .then((toutes) => {
        setCommandes(toutes.filter((c) => ['Prêt pour livraison', 'En cours de livraison'].includes(c.Statut)));
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  useEffect(charger, []);

  async function handleRecuperer(numero) {
    try {
      await api.updateStatutLivraison(numero, 'En cours de livraison');
      setErreur('');
      charger();
    } catch (err) {
      setErreur(err.message);
      charger();
    }
  }

  async function handleConfirmerLivraison(numero) {
    try {
      await api.updateStatutLivraison(numero, 'Livré');
      setErreur('');
      charger();
    } catch (err) {
      setErreur(err.message);
      charger();
    }
  }

  const aRecuperer = commandes.filter((c) => c.Statut === 'Prêt pour livraison');
  const enCours = commandes.filter((c) => c.Statut === 'En cours de livraison');

  return (
    <div>
      <h1>Mes livraisons</h1>
      {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}
      {chargement ? (
        <p>Chargement…</p>
      ) : (
        <>
          <section style={{ marginBottom: '2rem' }}>
            <h2>À récupérer ({aRecuperer.length})</h2>
            {aRecuperer.length === 0 ? (
              <p style={{ opacity: 0.6 }}>Rien à récupérer pour l'instant.</p>
            ) : (
              <div style={styles.liste}>
                {aRecuperer.map((c) => (
                  <CarteCommande key={c.NumeroCommande} c={c}>
                    <button className="btn btn-primary" onClick={() => handleRecuperer(c.NumeroCommande)}>
                      Récupérer
                    </button>
                  </CarteCommande>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2>En cours de livraison ({enCours.length})</h2>
            {enCours.length === 0 ? (
              <p style={{ opacity: 0.6 }}>Aucune livraison en cours.</p>
            ) : (
              <div style={styles.liste}>
                {enCours.map((c) => {
                  const estAMoi = c.NomLivreur === profil?.nom;
                  return (
                    <CarteCommande key={c.NumeroCommande} c={c}>
                      {estAMoi ? (
                        <button className="btn btn-primary" onClick={() => handleConfirmerLivraison(c.NumeroCommande)}>
                          Confirmer la livraison
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', opacity: 0.6, fontStyle: 'italic' }}>
                          Pris en charge par {c.NomLivreur}
                        </span>
                      )}
                    </CarteCommande>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function CarteCommande({ c, children }) {
  return (
    <div style={styles.carte}>
      <div>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.NumeroCommande}</p>
        <p style={{ margin: '0.3rem 0 0' }}>{c.Nom} — {c.Telephone}</p>
        <p style={{ margin: '0.2rem 0 0', opacity: 0.8 }}>{c.Quartier}</p>
        <p style={{ margin: '0.4rem 0 0' }} className="price-tag">{Number(c.MontantTotal).toLocaleString('fr-FR')} F CFA</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

const styles = {
  liste: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  carte: {
    background: 'var(--parchment-dark)', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
    padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
  },
};