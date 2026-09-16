import React, { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { uploadImageToCloudinary, MAX_IMAGES_PAR_PRODUIT } from '../../utils/cloudinary.js';
import SectionsEditor from './SectionsEditor.jsx';
import { nettoyerTexteRiche } from '../../utils/richTextClean.js';
import ProductDetailContenu from '../../components/ProductDetailContenu.jsx';

const CATEGORIES = ['Thé vert', 'Thé noir', 'Thé blanc', 'Rooibos', 'Tisane', 'Autre'];

// L'input <input type="datetime-local"> attend "AAAA-MM-JJTHH:mm" en heure LOCALE
// du navigateur — jamais toISOString() qui est toujours en UTC et décalerait
// l'heure affichée à l'admin si son fuseau n'est pas UTC+0.
function versDatetimeLocal(dateIso) {
  if (!dateIso) return '';
  const d = new Date(dateIso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ProductForm({ produitInitial, onSubmit, onAnnuler, envoi }) {
  const [form, setForm] = useState({
    nom: produitInitial?.Nom || '',
    description: produitInitial?.Description || '',
    prix: produitInitial?.Prix || '',
    prixBarre: produitInitial?.PrixBarre || '',
    commissionCloser: produitInitial?.CommissionCloser ?? '',
    commissionLivreur: produitInitial?.CommissionLivreur ?? '',
    categorie: produitInitial?.Categorie || CATEGORIES[0],
    stock: produitInitial?.Stock ?? '',
    disponible: produitInitial?.Disponible ?? true,
    images: produitInitial?.Images || [],
    videoUrl: produitInitial?.VideoUrl || '',
    sections: produitInitial?.Sections?.length ? produitInitial.Sections : [],
    offresQuantite: produitInitial?.OffresQuantite?.length ? produitInitial.OffresQuantite : [],
    codePromoActif: produitInitial?.CodePromoActif ?? true,
    compteARebours: {
      actif: produitInitial?.CompteARebours?.actif || false,
      // datetime-local attend "AAAA-MM-JJTHH:mm" en heure locale, pas un ISO UTC avec "Z"
      echeance: versDatetimeLocal(produitInitial?.CompteARebours?.echeance),
      texte: produitInitial?.CompteARebours?.texte || '',
    },
  });
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [erreurUpload, setErreurUpload] = useState('');
  const [apercuOuvert, setApercuOuvert] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const placesRestantes = MAX_IMAGES_PAR_PRODUIT - form.images.length;
    if (placesRestantes <= 0) {
      setErreurUpload(`Maximum ${MAX_IMAGES_PAR_PRODUIT} images par fiche produit.`);
      return;
    }
    setErreurUpload('');
    setUploadEnCours(true);
    try {
      const aTraiter = files.slice(0, placesRestantes);
      const urls = [];
      for (const file of aTraiter) {
        const { url } = await uploadImageToCloudinary(file);
        urls.push(url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      setErreurUpload(err.message);
    } finally {
      setUploadEnCours(false);
      e.target.value = '';
    }
  }

  function retirerImage(url) {
    setForm((f) => ({ ...f, images: f.images.filter((i) => i !== url) }));
  }

  const MAX_PALIERS = 3;

  function ajouterPalier() {
    if (form.offresQuantite.length >= MAX_PALIERS) return;
    setForm((f) => ({
      ...f,
      offresQuantite: [
        ...f.offresQuantite,
        { id: crypto.randomUUID(), bandeau: '', label: '', quantiteReelle: 1, prix: '', badge: '' },
      ],
    }));
  }

  function modifierPalier(id, champ, valeur) {
    setForm((f) => ({
      ...f,
      offresQuantite: f.offresQuantite.map((p) => (p.id === id ? { ...p, [champ]: valeur } : p)),
    }));
  }

  function retirerPalier(id) {
    setForm((f) => ({ ...f, offresQuantite: f.offresQuantite.filter((p) => p.id !== id) }));
  }

  function handleCompteARebours(champ, valeur) {
    setForm((f) => ({ ...f, compteARebours: { ...f.compteARebours, [champ]: valeur } }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const sections = form.sections.map((s) => {
      if (s.type === 'texte') {
        return { ...s, contenuHtml: nettoyerTexteRiche(s.contenuHtml) };
      }
      if (s.type === 'accordeon') {
        return { ...s, items: (s.items || []).map((it) => ({ ...it, reponse: nettoyerTexteRiche(it.reponse) })) };
      }
      if (s.type === 'offre') {
        return {
          ...s,
          cartes: (s.cartes || []).map((c) => ({
            ...c,
            description: nettoyerTexteRiche(c.description),
            fonctionnalites: (c.fonctionnalitesTexte || '').split('\n').map((f) => f.trim()).filter(Boolean),
          })),
        };
      }
      return s;
    });

    // Un palier n'est retenu que s'il est réellement rempli (libellé + prix + quantité) —
    // une ligne ajoutée puis laissée vide par le vendeur ne doit pas polluer le formulaire public.
    const offresQuantite = form.offresQuantite
      .filter((p) => p.label.trim() && Number(p.prix) > 0 && Number(p.quantiteReelle) > 0)
      .map((p) => ({
        id: p.id,
        bandeau: (p.bandeau || '').trim(),
        label: p.label.trim(),
        quantiteReelle: Number(p.quantiteReelle),
        prix: Number(p.prix),
        badge: (p.badge || '').trim(),
      }));

    const compteARebours = form.compteARebours.actif && form.compteARebours.echeance
      ? {
          actif: true,
          echeance: new Date(form.compteARebours.echeance).toISOString(),
          texte: form.compteARebours.texte.trim(),
        }
      : { actif: false, echeance: null, texte: '' };

    onSubmit({
      nom: form.nom,
      description: form.description,
      prix: Number(form.prix),
      prixBarre: form.prixBarre ? Number(form.prixBarre) : null,
      commissionCloser: Number(form.commissionCloser),
      commissionLivreur: Number(form.commissionLivreur),
      categorie: form.categorie,
      stock: Number(form.stock),
      disponible: form.disponible,
      images: form.images,
      videoUrl: form.videoUrl.trim(),
      sections,
      offresQuantite,
      codePromoActif: form.codePromoActif,
      compteARebours,
    });
  }

  const produitApercu = {
    ID: produitInitial?.ID || 'apercu',
    Nom: form.nom || 'Nom du produit',
    Description: form.description,
    Prix: Number(form.prix) || 0,
    PrixBarre: form.prixBarre ? Number(form.prixBarre) : null,
    CommissionCloser: Number(form.commissionCloser) || 0,
    CommissionLivreur: Number(form.commissionLivreur) || 0,
    Categorie: form.categorie,
    Stock: Number(form.stock) || 0,
    Images: form.images,
    Disponible: form.disponible,
    VideoUrl: form.videoUrl,
    Sections: form.sections,
    OffresQuantite: form.offresQuantite.filter((p) => p.label.trim() && Number(p.prix) > 0),
    CodePromoActif: form.codePromoActif,
    CompteARebours: form.compteARebours.actif && form.compteARebours.echeance
      ? { actif: true, echeance: new Date(form.compteARebours.echeance).toISOString(), texte: form.compteARebours.texte }
      : null,
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setApercuOuvert(true)}
        style={styles.boutonApercu}
      >
        <Eye size={16} /> Aperçu
      </button>

      {apercuOuvert && (
        <div style={styles.apercuOverlay}>
          <div style={styles.apercuBarre}>
            <span className="eyebrow" style={{ color: 'var(--parchment)' }}>Mode aperçu — commande et suivi publicitaire désactivés</span>
            <button type="button" className="btn-ghost" onClick={() => setApercuOuvert(false)} style={{ color: 'var(--parchment)' }}>
              <X size={20} />
            </button>
          </div>
          <div style={styles.apercuContenu}>
            <ProductDetailContenu produit={produitApercu} previsualisation />
          </div>
        </div>
      )}

    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.row}>
        <Champ label="Nom" name="nom" value={form.nom} onChange={handleChange} required />
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Catégorie</label>
          <select name="categorie" value={form.categorie} onChange={handleChange} style={styles.input}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={styles.label}>Description courte (résumé, affiché en haut de la fiche)</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={2} style={styles.input} />
      </div>

      <div style={styles.row}>
        <Champ label="Prix (F CFA)" name="prix" type="number" value={form.prix} onChange={handleChange} required />
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Prix barré (optionnel)</label>
          <input type="number" name="prixBarre" value={form.prixBarre} onChange={handleChange} style={styles.input} />
        </div>
      </div>

      <div style={styles.row}>
        <Champ label="Commission closer par unité vendue (F CFA)" name="commissionCloser" type="number" value={form.commissionCloser} onChange={handleChange} required />
        <Champ label="Commission livreur par unité livrée (F CFA)" name="commissionLivreur" type="number" value={form.commissionLivreur} onChange={handleChange} required />
      </div>

      <Champ label="Stock" name="stock" type="number" value={form.stock} onChange={handleChange} required />

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5em', fontSize: '0.9rem' }}>
        <input type="checkbox" name="disponible" checked={form.disponible} onChange={handleChange} />
        Visible sur le site
      </label>

      <div>
        <label style={styles.label}>
          Images ({form.images.length}/{MAX_IMAGES_PAR_PRODUIT}) — JPG, PNG ou WebP, compressées automatiquement
        </label>
        <div style={styles.imagesGrid}>
          {form.images.map((url) => (
            <div key={url} style={styles.imageThumb}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" onClick={() => retirerImage(url)} style={styles.imageRemove}>✕</button>
            </div>
          ))}
          {form.images.length < MAX_IMAGES_PAR_PRODUIT && (
            <label style={styles.imageUpload}>
              {uploadEnCours ? '…' : '+ Ajouter'}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} disabled={uploadEnCours} style={{ display: 'none' }} />
            </label>
          )}
        </div>
        {erreurUpload && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{erreurUpload}</p>}
      </div>

      <div>
        <label style={styles.label}>Lien vidéo (YouTube ou Vimeo, optionnel)</label>
        <input type="url" name="videoUrl" value={form.videoUrl} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=..." style={styles.input} />
      </div>

      <hr className="hairline" style={{ margin: '0.5rem 0' }} />

      <div>
        <h3 style={{ margin: '0 0 0.3rem' }}>Formulaire de commande</h3>
        <p style={{ fontSize: '0.82rem', opacity: 0.7, margin: '0 0 1rem' }}>
          Tout ce qui suit est optionnel et propre à cette fiche produit.
        </p>

        <div style={{ marginBottom: '1.2rem' }}>
          <label style={styles.label}>
            Paliers de quantité ({form.offresQuantite.length}/{MAX_PALIERS}) — remplace le sélecteur +/-
            par des choix du type « 1 unité », « 2 Unités -20% », « 3+1 offert »
          </label>
          {form.offresQuantite.length === 0 && (
            <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '0 0 0.6rem' }}>
              Aucun palier : le client verra le sélecteur de quantité classique.
            </p>
          )}
          {form.offresQuantite.map((p, index) => (
            <div key={p.id} style={styles.palierBloc}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.8rem' }}>Palier {index + 1}</strong>
                <button type="button" className="btn-ghost" onClick={() => retirerPalier(p.id)} style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                  Retirer
                </button>
              </div>
              <div style={styles.row}>
                <Champ
                  label="Libellé affiché (ex: 3+1 offert)" value={p.label}
                  onChange={(e) => modifierPalier(p.id, 'label', e.target.value)}
                />
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Quantité réellement livrée</label>
                  <input
                    type="number" min="1" value={p.quantiteReelle}
                    onChange={(e) => modifierPalier(p.id, 'quantiteReelle', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Prix final (F CFA)</label>
                  <input
                    type="number" min="0" value={p.prix}
                    onChange={(e) => modifierPalier(p.id, 'prix', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <Champ
                  label="Badge (optionnel, ex: Éco 20%)" value={p.badge}
                  onChange={(e) => modifierPalier(p.id, 'badge', e.target.value)}
                />
              </div>
              <Champ
                label="Bandeau au-dessus (optionnel, ex: Offre prevention +)" value={p.bandeau}
                onChange={(e) => modifierPalier(p.id, 'bandeau', e.target.value)}
              />
            </div>
          ))}
          {form.offresQuantite.length < MAX_PALIERS && (
            <button type="button" className="btn-outline btn" onClick={ajouterPalier}>+ Ajouter un palier</button>
          )}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5em', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
          <input
            type="checkbox" checked={form.codePromoActif}
            onChange={(e) => setForm((f) => ({ ...f, codePromoActif: e.target.checked }))}
          />
          Afficher le champ « Code promo » sur cette fiche
        </label>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5em', fontSize: '0.9rem', marginBottom: '0.6rem' }}>
            <input
              type="checkbox" checked={form.compteARebours.actif}
              onChange={(e) => handleCompteARebours('actif', e.target.checked)}
            />
            Afficher un compte à rebours (urgence)
          </label>
          {form.compteARebours.actif && (
            <div style={{ paddingLeft: '1.6rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ maxWidth: '280px' }}>
                <label style={styles.label}>Échéance</label>
                <input
                  type="datetime-local" value={form.compteARebours.echeance}
                  onChange={(e) => handleCompteARebours('echeance', e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Message (optionnel)</label>
                <input
                  type="text" value={form.compteARebours.texte}
                  onChange={(e) => handleCompteARebours('texte', e.target.value)}
                  placeholder="Dépêchez-vous ! Cette offre se termine bientôt"
                  style={styles.input}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="hairline" style={{ margin: '0.5rem 0' }} />

      <SectionsEditor sections={form.sections} onChange={(sections) => setForm((f) => ({ ...f, sections }))} produitInitial={produitInitial} />

      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
        <button className="btn btn-primary" type="submit" disabled={envoi || uploadEnCours}>
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn-outline btn" onClick={onAnnuler}>Annuler</button>
      </div>
    </form>
    </>
  );
}

function Champ({ label, name, value, onChange, type = 'text', required }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={styles.label}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} style={styles.input} />
    </div>
  );
}

const styles = {
  boutonApercu: {
    position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 35,
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
  },
  apercuOverlay: {
    position: 'fixed', inset: 0, zIndex: 50, background: 'var(--parchment)',
    display: 'flex', flexDirection: 'column',
  },
  apercuBarre: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--forest)', padding: '0.9rem 1.2rem', flexShrink: 0,
  },
  apercuContenu: { flex: 1, overflowY: 'auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  label: { display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 500 },
  input: {
    width: '100%', padding: '0.6em 0.8em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', background: 'var(--parchment)',
  },
  palierBloc: {
    display: 'flex', flexDirection: 'column', gap: '0.6rem',
    border: '1px dashed var(--line)', borderRadius: 'var(--radius)',
    padding: '0.8rem', marginBottom: '0.7rem', background: 'var(--parchment-dark)',
  },
  imagesGrid: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' },
  imageThumb: { position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--line)' },
  imageRemove: { position: 'absolute', top: '2px', right: '2px', background: 'var(--forest)', color: 'var(--parchment)', width: '20px', height: '20px', fontSize: '0.7rem', borderRadius: '50%' },
  imageUpload: {
    width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px dashed var(--line)', borderRadius: 'var(--radius)', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center', color: 'var(--sage)',
  },
};