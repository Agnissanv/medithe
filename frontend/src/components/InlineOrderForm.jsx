import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/supabaseApi.js';
import { trackInitiateCheckout, trackPurchase } from '../utils/tracking.js';

const TELEPHONE_REGEX = /^[0-9+()\s.-]{8,20}$/;

export default function InlineOrderForm({ produit, domId = 'formulaire-loohoo', titre, previsualisation = false }) {
  const [quantite, setQuantite] = useState(1);

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

  async function handleAppliquerPromo() {
    if (!codePromoInput.trim()) return;
    setPromoEnCours(true);
    setPromoErreur('');
    try {
      const res = await api.validerCodePromo(codePromoInput.trim(), produit.Prix * quantite);
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
          id: produit.ID, nom: produit.Nom, prix: produit.Prix, quantite,
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

      <div style={styles.quantiteLigne}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Quantité</span>
        <div style={styles.quantiteBox}>
          <button type="button" className="btn-ghost" onClick={() => handleQuantiteChange(Math.max(1, quantite - 1))}>−</button>
          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '1.5ch', textAlign: 'center' }}>{quantite}</span>
          <button type="button" className="btn-ghost" onClick={() => handleQuantiteChange(Math.min(produit.Stock, quantite + 1))}>+</button>
        </div>
        <span className="price-tag" style={{ marginLeft: 'auto' }}>
          {(codePromoApplique ? codePromoApplique.nouveauTotal : produit.Prix * quantite).toLocaleString('fr-FR')} F CFA
        </span>
      </div>

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
  quantiteLigne: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' },  quantiteBox: { display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.2rem 0.6rem' },
  promoBox: { marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--line)' },
  input: { width: '100%', padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--parchment)' },
  ticket: { background: 'var(--forest)', borderRadius: '12px', padding: '2rem', maxWidth: '480px', margin: '2rem auto', textAlign: 'center', border: '1px dashed var(--copper)' },
  ticketNumero: { fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: 'var(--copper)', margin: '0.8rem 0' },
};