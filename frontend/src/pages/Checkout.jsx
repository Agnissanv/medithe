import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../api/supabaseApi.js';
import { fetchCatalogFromCdn } from '../utils/catalogSync.js';
import ProductCard from '../components/ProductCard.jsx';
import { trackInitiateCheckout, trackPurchase } from '../utils/tracking.js';

const TELEPHONE_REGEX = /^[0-9+()\s.-]{8,20}$/;

export default function Checkout() {
  const { items, sousTotal, clearCart } = useCart();
  const [form, setForm] = useState({ nomComplet: '', telephone: '', adresse: '', note: '' });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [erreurGlobale, setErreurGlobale] = useState('');
  const [commandeConfirmee, setCommandeConfirmee] = useState(null);
  const [itemsCommandes, setItemsCommandes] = useState([]);
  const [catalogue, setCatalogue] = useState([]);

  useEffect(() => {
    fetchCatalogFromCdn().then(setCatalogue).catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length) trackInitiateCheckout(items, sousTotal);
  }, []);

  if (items.length === 0 && !commandeConfirmee) {
    return <Navigate to="/panier" replace />;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function valider() {
    const err = {};
    if (!form.nomComplet.trim()) err.nomComplet = 'Nom requis';
    if (!TELEPHONE_REGEX.test(form.telephone.trim())) err.telephone = 'Numéro de téléphone invalide';
    if (!form.adresse.trim()) err.adresse = 'Adresse de livraison requise';
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
        nom: form.nomComplet,
        prenom: '',
        telephone: form.telephone,
        quartier: form.adresse,
        ville: '',
        note: form.note,
        produits: items.map((i) => ({
          id: i.id, nom: i.nom, prix: i.prix, quantite: i.quantite,
          commissionCloser: i.commissionCloser || 0,
          commissionLivreur: i.commissionLivreur || 0,
        })),
      };
      const resultat = await api.createCommande(commande);
      trackPurchase(resultat.numeroCommande, resultat.montantTotal);
      setItemsCommandes(items);
      setCommandeConfirmee(resultat);
      clearCart();
    } catch (err) {
      setErreurGlobale(err.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  function ProduitsComplementaires() {
    const categoriesAchetees = new Set(
      itemsCommandes
        .map((i) => catalogue.find((p) => p.ID === i.id)?.Categorie)
        .filter(Boolean)
    );
    const idsAchetes = new Set(itemsCommandes.map((i) => i.id));
    const suggestions = catalogue
      .filter((p) => categoriesAchetees.has(p.Categorie) && !idsAchetes.has(p.ID))
      .slice(0, 4);

    if (!suggestions.length) return null;

    return (
      <div className="container" style={{ padding: '2rem 1.5rem 3rem', textAlign: 'center' }}>
        <h2>Envie d'en profiter encore plus ?</h2>
        <p style={{ opacity: 0.7, maxWidth: '480px', margin: '0 auto 1.5rem' }}>
          Ces thés se marient bien avec votre commande. Ajoutez-les en quelques clics —
          notre équipe regroupera tout lors de l'appel de confirmation.
        </p>
        <div style={styles.suggestionsGrid}>
          {suggestions.map((p) => <ProductCard key={p.ID} produit={p} />)}
        </div>
      </div>
    );
  }

  if (commandeConfirmee) {
    return (
      <div>
        <div className="container" style={{ padding: '3rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={styles.ticket}>
            <span className="eyebrow" style={{ color: 'var(--copper)' }}>Commande enregistrée</span>
            <h1 style={{ color: 'var(--parchment)', margin: '0.4rem 0' }}>Merci {form.nomComplet} !</h1>
            <div style={styles.ticketNumero}>{commandeConfirmee.numeroCommande}</div>
            <p style={styles.ticketText}>
              Notre équipe vous appellera au <strong>{form.telephone}</strong> pour confirmer votre commande
              et organiser la livraison. Conservez ce numéro pour suivre son statut.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <Link to="/suivi" className="btn btn-primary">Suivre ma commande</Link>
              <Link to="/" className="btn-ghost" style={{ color: 'var(--parchment)' }}>Retour au catalogue</Link>
            </div>
          </div>
        </div>
        <ProduitsComplementaires />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <h1>Finaliser la commande</h1>

      <div style={styles.layout}>
        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <Champ label="Nom complet" name="nomComplet" value={form.nomComplet} onChange={handleChange} erreur={erreurs.nomComplet} />
          <Champ
            label="Téléphone"
            name="telephone"
            value={form.telephone}
            onChange={handleChange}
            erreur={erreurs.telephone}
            aide="Utilisé uniquement pour la confirmation de la commande"
            type="tel"
          />
          <Champ
            label="Adresse de livraison"
            name="adresse"
            value={form.adresse}
            onChange={handleChange}
            erreur={erreurs.adresse}
            aide="Quartier, ville, repère éventuel"
          />
          <div>
            <label style={styles.label}>Note (optionnel)</label>
            <textarea name="note" value={form.note} onChange={handleChange} rows={3} style={styles.textarea} />
          </div>

          {erreurGlobale && <p style={{ color: 'var(--danger)' }}>{erreurGlobale}</p>}

          <button className="btn btn-primary" type="submit" disabled={envoi}>
            {envoi ? 'Envoi en cours…' : 'Confirmer la commande'}
          </button>
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            Aucun paiement n'est demandé maintenant. Le règlement se fait à la livraison.
          </p>
        </form>

        <aside style={styles.recap}>
          <h3>Récapitulatif</h3>
          {items.map((i) => (
            <div key={i.id} style={styles.recapLigne}>
              <span>{i.nom} × {i.quantite}</span>
              <span className="price-tag">{(i.prix * i.quantite).toLocaleString('fr-FR')} F CFA</span>
            </div>
          ))}
          <hr className="hairline" style={{ margin: '0.8rem 0' }} />
          <div style={{ ...styles.recapLigne, fontWeight: 600 }}>
            <span>Total</span>
            <span className="price-tag">{sousTotal.toLocaleString('fr-FR')} F CFA</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Champ({ label, name, value, onChange, erreur, aide, type = 'text' }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        style={{ ...styles.input, borderColor: erreur ? 'var(--danger)' : 'var(--line)' }}
        aria-invalid={!!erreur}
      />
      {erreur && <span style={styles.erreur}>{erreur}</span>}
      {aide && !erreur && <span style={styles.aide}>{aide}</span>}
    </div>
  );
}

const styles = {
  layout: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2.5rem', marginTop: '1.5rem', alignItems: 'start' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  label: { display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 500 },
  input: {
    width: '100%', padding: '0.65em 0.8em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', background: 'var(--parchment-dark)',
  },
  textarea: {
    width: '100%', padding: '0.65em 0.8em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', background: 'var(--parchment-dark)', resize: 'vertical',
  },
  erreur: { color: 'var(--danger)', fontSize: '0.78rem' },
  aide: { color: 'var(--sage)', fontSize: '0.78rem' },
  recap: {
    background: 'var(--parchment-dark)', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', padding: '1.3rem',
  },
  recapLigne: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', margin: '0.4rem 0' },
  ticket: {
    background: 'var(--forest)', color: 'var(--parchment)', padding: '2.5rem',
    borderRadius: 'var(--radius)', maxWidth: '480px', textAlign: 'center',
    border: '1px dashed var(--copper)',
  },
  ticketNumero: {
    fontFamily: 'var(--font-mono)', fontSize: '1.6rem', letterSpacing: '0.05em',
    color: 'var(--copper)', margin: '1rem 0', padding: '0.6rem', border: '1px solid var(--line-dark)',
  },
  ticketText: { opacity: 0.85, fontSize: '0.95rem' },
  suggestionsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.2rem', maxWidth: '900px', margin: '0 auto', textAlign: 'left',
  },
};