import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/supabaseApi.js';
import { trackInitiateCheckout, trackPurchase } from '../utils/tracking.js';

const TELEPHONE_REGEX = /^[0-9+()\s.-]{8,20}$/;

export default function InlineOrderForm({ produit, domId = 'formulaire-loohoo', titre, previsualisation = false }) {
  const paliers = produit.OffresQuantite?.length ? produit.OffresQuantite : null;
  const [quantite, setQuantite] = useState(1);
  const [palierSelectionne, setPalierSelectionne] = useState(paliers ? paliers[0].id : null);

  useEffect(() => {
    if (!previsualisation) trackInitiateCheckout([{ id: produit.ID }], produit.Prix);
  }, []);
  const [form, setForm] = useState({ nomComplet: '', telephone: '', adresse: '', note: '' });
  const [erreurs, setErreurs] = useState({});
  const [erreurGlobale, setErreurGlobale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const [codePromoInput, setCodePromoInput] = useState('');
  const [codePromoApplique, setCodePromoApplique] = useState(null);
  const [promoEnCours, setPromoEnCours] = useState(false);
  const [promoErreur, setPromoErreur] = useState('');

  // Un palier (ex: "3+1 offert") remplace le sélecteur +/- : la quantité réellement
  // livrée et le prix final viennent alors du palier choisi, pas d'un calcul prix × quantité.
  const palierActif = paliers ? paliers.find((p) => p.id === palierSelectionne) || paliers[0] : null;
  const quantiteEffective = palierActif ? palierActif.quantiteReelle : quantite;
  const montantAvantPromo = palierActif ? palierActif.prix : produit.Prix * quantite;
  const afficherCodePromo = produit.CodePromoActif !== false;

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleQuantiteChange(nouvelleQuantite) {
    setQuantite(nouvelleQuantite);
    if (codePromoApplique) {
      setCodePromoApplique(null);
      setPromoErreur('Quantité modifiée : réappliquez le code.');
    }
  }

  function handlePalierChange(id) {
    setPalierSelectionne(id);
    if (codePromoApplique) {
      setCodePromoApplique(null);
      setPromoErreur('Offre modifiée : réappliquez le code.');
    }
  }

  async function handleAppliquerPromo() {
    if (!codePromoInput.trim()) return;
    setPromoEnCours(true);
    setPromoErreur('');
    try {
      const res = await api.validerCodePromo(codePromoInput.trim(), montantAvantPromo);
      if (res.valide) {
        setCodePromoApplique({ code: codePromoInput.trim().toUpperCase(), reduction: res.reduction, nouveauTotal: res.nouveauTotal });
      } else {
        setCodePromoApplique(null);
        setPromoErreur(res.message);
      }
    } catch (err) {
      setPromoErreur(err.message || 'Impossible de vérifier ce code pour le moment.');
    } finally {
      setPromoEnCours(false);
    }
  }

  function handleRetirerPromo() {
    setCodePromoApplique(null);
    setCodePromoInput('');
    setPromoErreur('');
  }

  function valider() {
    const err = {};
    if (!form.nomComplet.trim()) err.nomComplet = 'Nom requis';
    if (!TELEPHONE_REGEX.test(form.telephone.trim())) err.telephone = 'Téléphone invalide';
    if (!form.adresse.trim()) err.adresse = 'Adresse requise';
    setErreurs(err);
    return Object.keys(err).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (previsualisation) return; // sécurité : aucune commande réelle ne doit partir en mode aperçu
    if (!valider()) return;
    setEnvoi(true);
    setErreurGlobale('');
    try {
      const commande = {
        nom: form.nomComplet, prenom: '', telephone: form.telephone,
        quartier: form.adresse, ville: '', note: form.note,
        produits: [{
          id: produit.ID, nom: produit.Nom,
          // Palier actif : on répartit son prix final sur la quantité réelle pour que
          // prix × quantité reconstitue exactement ce prix (créer_commande recalcule le total ainsi).
          prix: palierActif ? palierActif.prix / palierActif.quantiteReelle : produit.Prix,
          quantite: quantiteEffective,
          commissionCloser: produit.CommissionCloser || 0,
          commissionLivreur: produit.CommissionLivreur || 0,
        }],
        codePromo: codePromoApplique?.code || null,
        reductionPromo: codePromoApplique?.reduction || 0,
      };
      const resultat = await api.createCommande(commande);
      trackPurchase(resultat.numeroCommande, resultat.montantTotal);
      setConfirmation(resultat);
    } catch (err) {
      setErreurGlobale(err.message || 'Une erreur est survenue.');
    } finally {
      setEnvoi(false);
    }
  }

  if (confirmation) {
    return (
      <div id={domId} style={styles.ticket}>
        <span className="eyebrow" style={{ color: 'var(--copper)' }}>Commande enregistrée</span>
        <h3 style={{ color: 'var(--parchment)', margin: '0.4rem 0' }}>Merci {form.nomComplet} !</h3>
        <div style={styles.ticketNumero}>{confirmation.numeroCommande}</div>
        <p style={{ color: 'var(--parchment)', opacity: 0.85, fontSize: '0.9rem' }}>
          Nous vous appellerons au {form.telephone} pour confirmer.
        </p>
        <Link to="/suivi" className="btn btn-primary" style={{ marginTop: '1rem' }}>Suivre ma commande</Link>
      </div>
    );
  }

  return (
    <form id={domId} onSubmit={handleSubmit} style={styles.form}>
      <h3 style={{ marginTop: 0 }}>{titre || `Commander ${produit.Nom}`}</h3>

      {produit.CompteARebours?.actif && (produit.CompteARebours.type === 'boucle' ? produit.CompteARebours.dureeMinutes : produit.CompteARebours.echeance) && (
        <CompteARebours
          type={produit.CompteARebours.type}
          echeance={produit.CompteARebours.echeance}
          dureeMinutes={produit.CompteARebours.dureeMinutes}
          texte={produit.CompteARebours.texte}
        />
      )}

      {paliers ? (
        <div style={styles.paliersListe}>
          {paliers.map((p) => (
            <label
              key={p.id}
              style={{ ...styles.palierCarte, ...(palierSelectionne === p.id ? styles.palierCarteActive : {}) }}
            >
              {p.bandeau && <span style={styles.palierBandeau}>{p.bandeau}</span>}
              <input
                type="radio"
                name={`palier-${produit.ID}`}
                checked={palierSelectionne === p.id}
                onChange={() => handlePalierChange(p.id)}
                style={styles.palierRadio}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{p.label}</span>
                {p.badge && <span style={styles.palierBadge}>{p.badge}</span>}
              </span>
              <span className="price-tag">{p.prix.toLocaleString('fr-FR')} F CFA</span>
            </label>
          ))}
        </div>
      ) : (
        <div style={styles.quantiteLigne}>
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Quantité</span>
          <div style={styles.quantiteBox}>
            <button type="button" className="btn-ghost" onClick={() => handleQuantiteChange(Math.max(1, quantite - 1))}>−</button>
            <span style={{ fontFamily: 'var(--font-mono)', minWidth: '1.5ch', textAlign: 'center' }}>{quantite}</span>
            <button type="button" className="btn-ghost" onClick={() => handleQuantiteChange(Math.min(produit.Stock, quantite + 1))}>+</button>
          </div>
          <span className="price-tag" style={{ marginLeft: 'auto' }}>
            {(codePromoApplique ? codePromoApplique.nouveauTotal : montantAvantPromo).toLocaleString('fr-FR')} F CFA
          </span>
        </div>
      )}

      {afficherCodePromo && (
        <div style={styles.promoBox}>
          {!codePromoApplique ? (
            <>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Code promo"
                  value={codePromoInput}
                  onChange={(e) => setCodePromoInput(e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleAppliquerPromo}
                  disabled={promoEnCours || !codePromoInput.trim()}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {promoEnCours ? '…' : 'Appliquer'}
                </button>
              </div>
              {promoErreur && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{promoErreur}</span>}
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--success)' }}>Code {codePromoApplique.code} appliqué ✓ (-{codePromoApplique.reduction.toLocaleString('fr-FR')} F CFA)</span>
              <button type="button" className="btn-ghost" onClick={handleRetirerPromo}>Retirer</button>
            </div>
          )}
        </div>
      )}

      {paliers && (
        <p className="price-tag" style={{ textAlign: 'right', marginTop: '-0.6rem', marginBottom: '1rem' }}>
          Total : {(codePromoApplique ? codePromoApplique.nouveauTotal : montantAvantPromo).toLocaleString('fr-FR')} F CFA
        </p>
      )}

      <Champ label="Nom complet" name="nomComplet" value={form.nomComplet} onChange={handleChange} erreur={erreurs.nomComplet} />
      <Champ label="Téléphone" name="telephone" type="tel" value={form.telephone} onChange={handleChange} erreur={erreurs.telephone} />
      <Champ label="Adresse de livraison" name="adresse" value={form.adresse} onChange={handleChange} erreur={erreurs.adresse} />

      <div style={{ marginBottom: '0.8rem' }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>Note (optionnel)</label>
        <textarea
          name="note" value={form.note} onChange={handleChange} rows={2}
          style={styles.input}
        />
      </div>

      {erreurGlobale && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{erreurGlobale}</p>}

      <button
        className="btn btn-primary"
        type="submit"
        disabled={envoi || previsualisation}
        style={{ width: '100%', justifyContent: 'center', marginTop: '0.6rem', opacity: previsualisation ? 0.6 : 1 }}
      >
        {previsualisation ? 'Aperçu — commande désactivée' : envoi ? 'Envoi…' : 'Confirmer la commande'}
      </button>
      <p style={{ fontSize: '0.75rem', opacity: 0.6, textAlign: 'center', marginTop: '0.5rem' }}>
        Paiement à la livraison, après confirmation téléphonique.
      </p>
    </form>
  );
}

// Deux types de compte à rebours :
// - 'echeance' : vraie date/heure, identique pour tous les visiteurs, se cache une fois passée.
// - 'boucle' : minuteur de durée fixe qui redémarre tout seul à chaque fois qu'il atteint 0,
//   propre à chaque visite (pas partagé entre visiteurs). Calculé à partir de l'heure d'arrivée
//   sur la page modulo la durée, pour ne jamais dériver même si l'onglet est mis en pause.
function CompteARebours({ type, echeance, dureeMinutes, texte }) {
  const dureeSecondes = Math.max(0, Math.round((dureeMinutes || 0) * 60));
  const debutRef = useRef(Date.now());

  const calculerRestant = () => {
    if (type === 'boucle') {
      if (dureeSecondes <= 0) return 0;
      const ecoule = Math.floor((Date.now() - debutRef.current) / 1000) % dureeSecondes;
      return dureeSecondes - ecoule;
    }
    return Math.floor((new Date(echeance).getTime() - Date.now()) / 1000);
  };

  const [restant, setRestant] = useState(calculerRestant);

  useEffect(() => {
    const id = setInterval(() => setRestant(calculerRestant()), 1000);
    return () => clearInterval(id);
  }, [type, echeance, dureeSecondes]);

  if (type === 'boucle' ? dureeSecondes <= 0 : restant <= 0) return null;

  const totalSecondes = Math.max(0, restant);
  const jours = Math.floor(totalSecondes / 86400);
  const heures = Math.floor((totalSecondes % 86400) / 3600);
  const minutes = Math.floor((totalSecondes % 3600) / 60);
  const secondes = totalSecondes % 60;
  const deux = (n) => String(n).padStart(2, '0');
  const affichage = jours > 0
    ? `${jours}j ${deux(heures)}:${deux(minutes)}:${deux(secondes)}`
    : `${deux(heures)}:${deux(minutes)}:${deux(secondes)}`;

  return (
    <div style={styles.compteARebours}>
      <span>{texte || 'Dépêchez-vous ! Cette offre se termine bientôt ⏰'}</span>
      <div style={styles.compteAReboursChiffres}>{affichage}</div>
    </div>
  );
}

function Champ({ label, name, value, onChange, erreur, type = 'text' }) {
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        style={{ ...styles.input, borderColor: erreur ? 'var(--danger)' : 'var(--line)' }}
      />
      {erreur && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{erreur}</span>}
    </div>
  );
}

const styles = {
  form: { background: 'var(--parchment-dark)', border: '1px solid var(--line)', borderRadius: '12px', padding: '1.6rem', maxWidth: '480px', margin: '2rem auto' },
  compteARebours: {
    background: 'color-mix(in srgb, var(--danger) 8%, white)',
    border: '1px solid color-mix(in srgb, var(--danger) 25%, white)',
    borderRadius: 'var(--radius)', padding: '0.7rem 1rem', textAlign: 'center',
    marginBottom: '1.2rem', color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.4,
  },
  compteAReboursChiffres: { fontFamily: 'var(--font-mono)', fontSize: '1.15rem', marginTop: '0.2rem' },
  paliersListe: { display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.2rem' },
  palierCarte: {
    position: 'relative', display: 'flex', alignItems: 'center', gap: '0.6rem',
    border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.8rem 0.9rem',
    background: 'var(--parchment)', cursor: 'pointer',
  },
  palierCarteActive: { borderColor: 'var(--forest)', borderWidth: '2px', background: 'var(--sage-light)' },
  palierRadio: { width: '18px', height: '18px', accentColor: 'var(--forest)', flexShrink: 0 },
  palierBandeau: {
    position: 'absolute', top: '-0.7rem', right: '0.9rem', background: 'var(--copper)', color: 'white',
    fontSize: '0.7rem', fontWeight: 600, padding: '0.2em 0.7em', borderRadius: '50px',
  },
  palierBadge: {
    background: 'var(--danger)', color: 'white', fontSize: '0.7rem', fontWeight: 600,
    padding: '0.15em 0.6em', borderRadius: '50px', whiteSpace: 'nowrap',
  },
  quantiteLigne: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' },  quantiteBox: { display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.2rem 0.6rem' },
  promoBox: { marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--line)' },
  input: { width: '100%', padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--parchment)' },
  ticket: { background: 'var(--forest)', borderRadius: '12px', padding: '2rem', maxWidth: '480px', margin: '2rem auto', textAlign: 'center', border: '1px dashed var(--copper)' },
  ticketNumero: { fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: 'var(--copper)', margin: '0.8rem 0' },
};