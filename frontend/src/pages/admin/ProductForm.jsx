import React, { useState } from 'react';
import { uploadImageToCloudinary, MAX_IMAGES_PAR_PRODUIT } from '../../utils/cloudinary.js';
import SectionsEditor from './SectionsEditor.jsx';
import { nettoyerTexteRiche } from '../../utils/richTextClean.js';

const CATEGORIES = ['Thé vert', 'Thé noir', 'Thé blanc', 'Rooibos', 'Tisane', 'Autre'];

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
  });
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [erreurUpload, setErreurUpload] = useState('');

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
        const url = await uploadImageToCloudinary(file);
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
    });
  }

  return (
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

      <SectionsEditor sections={form.sections} onChange={(sections) => setForm((f) => ({ ...f, sections }))} produitInitial={produitInitial} />

      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
        <button className="btn btn-primary" type="submit" disabled={envoi || uploadEnCours}>
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn-outline btn" onClick={onAnnuler}>Annuler</button>
      </div>
    </form>
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
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  row: { display: 'flex', gap: '1rem' },
  label: { display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 500 },
  input: {
    width: '100%', padding: '0.6em 0.8em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', background: 'var(--parchment)',
  },
  imagesGrid: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' },
  imageThumb: { position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--line)' },
  imageRemove: { position: 'absolute', top: '2px', right: '2px', background: 'var(--forest)', color: 'var(--parchment)', width: '20px', height: '20px', fontSize: '0.7rem', borderRadius: '50%' },
  imageUpload: {
    width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px dashed var(--line)', borderRadius: 'var(--radius)', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center', color: 'var(--sage)',
  },
};