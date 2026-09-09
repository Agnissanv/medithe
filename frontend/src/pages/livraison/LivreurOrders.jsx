import React, { useEffect, useState } from 'react';
import { api } from '../../api/supabaseApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { SqueletteCartesCommandes } from '../../components/Squelettes.jsx';

export default function LivreurOrders() {
  const { profil } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [echecOuvert, setEchecOuvert] = useState(null);
  const [motifEchec, setMotifEchec] = useState('');
  const [envoiEchec, setEnvoiEchec] = useState(false);

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

  async function handleConfirmerEchec() {
    if (!motifEchec.trim()) return;
    setEnvoiEchec(true);
    try {
      await api.marquerEchecLivraison(echecOuvert.NumeroCommande, motifEchec.trim());
      setErreur('');
      setEchecOuvert(null);
      setMotifEchec('');
      charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEchec(false);
    }
  }

  const aRecuperer = commandes.filter((c) => c.Statut === 'Prêt pour livraison');
  const enCours = commandes.filter((c) => c.Statut === 'En cours de livraison');

  return (
    <div>
      <h1>Mes livraisons</h1>
      {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}
      {chargement ? (
        <SqueletteCartesCommandes />
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
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <button className="btn btn-primary" onClick={() => handleConfirmerLivraison(c.NumeroCommande)}>
                            Confirmer la livraison
                          </button>
                          <button
                            className="btn-outline btn"
                            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            onClick={() => { setEchecOuvert(c); setMotifEchec(''); }}
                          >
                            Signaler un échec
                          </button>
                        </div>
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

      {echecOuvert && (
        <div style={styles.overlay} onClick={() => !envoiEchec && setEchecOuvert(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--danger)' }}>Signaler un échec de livraison</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.85, margin: '0.3rem 0 1rem' }}>
              Commande <strong style={{ fontFamily: 'var(--font-mono)' }}>{echecOuvert.NumeroCommande}</strong> —{' '}
              {echecOuvert.Nom}
            </p>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
              Motif (client absent, adresse introuvable, refus...)
            </label>
            <textarea
              value={motifEchec}
              onChange={(e) => setMotifEchec(e.target.value)}
              placeholder="Ex : client injoignable après 3 appels"
              rows={3}
              autoFocus
              style={styles.textareaMotif}
            />
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--danger)' }}
                disabled={!motifEchec.trim() || envoiEchec}
                onClick={handleConfirmerEchec}
              >
                {envoiEchec ? 'Envoi…' : "Confirmer l'échec"}
              </button>
              <button className="btn-outline btn" disabled={envoiEchec} onClick={() => setEchecOuvert(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CarteCommande({ c, children }) {
  return (
    <div style={styles.carte}>
      <div style={{ flex: '1 1 200px' }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.NumeroCommande}</p>
        <p style={{ margin: '0.3rem 0 0' }}>{c.Nom} — {c.Telephone}</p>
        <p style={{ margin: '0.2rem 0 0', opacity: 0.8 }}>{c.Quartier}</p>
        <p style={{ margin: '0.4rem 0 0' }} className="price-tag">{Number(c.MontantTotal).toLocaleString('fr-FR')} F CFA</p>
      </div>
      <div className="carte-livraison-action">{children}</div>
    </div>
  );
}

const styles = {
  liste: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  carte: {
    background: 'var(--parchment-dark)', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
    padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
  },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(11,77,30,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  modal: { background: 'var(--parchment)', padding: '1.5rem', borderRadius: 'var(--radius)', width: 'min(420px, 92vw)' },
  textareaMotif: {
    width: '100%', padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-body)', resize: 'vertical', background: 'var(--parchment-dark)',
  },
};
