import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/sheetsApi.js';

const TELEPHONE_REGEX = /^[0-9+()\s.-]{8,20}$/;

export default function InlineOrderForm({ produit, domId = 'zone-commande', titre }) {
  const [quantite, setQuantite] = useState(1);
  const [form, setForm] = useState({ nomComplet: '', telephone: '', adresse: '', note: '' });
  const [erreurs, setErreurs] = useState({});
  const [erreurGlobale, setErreurGlobale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
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
    if (!valider()) return;
    setEnvoi(true);
    setErreurGlobale('');
    try {
      const commande = {
        nom: form.nomComplet, prenom: '', telephone: form.telephone,
        quartier: form.adresse, ville: '', note: form.note,
        produits: [{ id: produit.ID, nom: produit.Nom, prix: produit.Prix, quantite }],
      };
      const resultat = await api.createCommande(commande);
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
          <button type="button" className="btn-ghost" onClick={() => setQuantite((q) => Math.max(1, q - 1))}>−</button>
          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '1.5ch', textAlign: 'center' }}>{quantite}</span>
          <button type="button" className="btn-ghost" onClick={() => setQuantite((q) => Math.min(produit.Stock, q + 1))}>+</button>
        </div>
        <span className="price-tag" style={{ marginLeft: 'auto' }}>
          {(produit.Prix * quantite).toLocaleString('fr-FR')} F CFA
        </span>
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

      <button className="btn btn-primary" type="submit" disabled={envoi} style={{ width: '100%', justifyContent: 'center', marginTop: '0.6rem' }}>
        {envoi ? 'Envoi…' : 'Confirmer la commande'}
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
  quantiteLigne: { display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' },
  quantiteBox: { display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.2rem 0.6rem' },
  input: { width: '100%', padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--parchment)' },
  ticket: { background: 'var(--forest)', borderRadius: '12px', padding: '2rem', maxWidth: '480px', margin: '2rem auto', textAlign: 'center', border: '1px dashed var(--copper)' },
  ticketNumero: { fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: 'var(--copper)', margin: '0.8rem 0' },
};