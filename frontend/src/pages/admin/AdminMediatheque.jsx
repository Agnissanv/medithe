import React, { useEffect, useState } from 'react';
import { api } from '../../api/supabaseApi.js';
import { uploadImageToCloudinary, slugifier } from '../../utils/cloudinary.js';

// Toutes les images de la médiathèque sont rangées dans ce dossier Cloudinary
// (visible dans le lien final : .../upload/v123/medithe/medias/mon-nom-a1b2.jpg),
// pour les distinguer des images produits qui restent à la racine.
const DOSSIER_MEDIATHEQUE = 'medithe/medias';

// Suffixe court pour éviter que deux images avec le même nom personnalisé se
// remplacent l'une l'autre sur Cloudinary — pas de garantie d'unicité sinon.
function suffixeUnique() {
  return Date.now().toString(36).slice(-4);
}

function obtenirDimensionsImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ largeur: img.naturalWidth, hauteur: img.naturalHeight });
    img.onerror = () => resolve({ largeur: null, hauteur: null });
    img.src = url;
  });
}

function formaterTaille(octets) {
  if (!octets) return '';
  if (octets < 1024) return `${octets} o`;
  const ko = octets / 1024;
  if (ko < 1024) return `${ko.toFixed(0)} Ko`;
  return `${(ko / 1024).toFixed(1)} Mo`;
}

export default function AdminMediatheque() {
  const [medias, setMedias] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [erreurUpload, setErreurUpload] = useState('');
  const [progression, setProgression] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [copieId, setCopieId] = useState(null);

  useEffect(() => { charger(); }, []);

  function charger() {
    setChargement(true);
    api.getMedias()
      .then(setMedias)
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setErreurUpload('');
    setUploadEnCours(true);
    const nouveaux = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const nomFichier = file.name.replace(/\.[^.]+$/, '');
        let baseSlug = slugifier(nomFichier);

        // Sur un seul fichier, on laisse la main pour choisir le nom qui apparaîtra
        // dans le lien. Sur plusieurs à la fois, demander un nom par fichier serait
        // lourd — on garde le nom du fichier original (slugifié) automatiquement.
        if (files.length === 1) {
          const saisie = window.prompt('Nom du fichier (apparaîtra dans le lien de l\'image)', baseSlug);
          if (saisie === null) { setUploadEnCours(false); return; } // annulé
          baseSlug = slugifier(saisie) || baseSlug;
        }

        setProgression(`Envoi ${i + 1}/${files.length}…`);
        try {
          // uploadImageToCloudinary compresse et respecte les limites de taille/format
          // déjà en place ailleurs sur le site (voir utils/cloudinary.js) : max 1600px,
          // ~2 Mo après compression progressive, JPG/PNG/WebP uniquement.
          const nomPersonnalise = `${baseSlug}-${suffixeUnique()}`;
          const url = await uploadImageToCloudinary(file, { nomPersonnalise, dossier: DOSSIER_MEDIATHEQUE });
          const { largeur, hauteur } = await obtenirDimensionsImage(url);
          const media = await api.createMedia({
            url,
            nom: nomFichier,
            largeur,
            hauteur,
            tailleOctets: file.size,
          });
          nouveaux.push(media);
        } catch (err) {
          setErreurUpload((prev) => prev ? `${prev} / ${file.name}: ${err.message}` : `${file.name}: ${err.message}`);
        }
      }
      if (nouveaux.length) setMedias((ms) => [...nouveaux, ...(ms || [])]);
    } finally {
      setUploadEnCours(false);
      setProgression(null);
      e.target.value = '';
    }
  }

  async function handleRenommer(id, nomActuel) {
    const nom = window.prompt('Nom du média', nomActuel);
    if (nom === null || nom === nomActuel) return;
    setMedias((ms) => ms.map((m) => (m.id === id ? { ...m, nom } : m)));
    try {
      await api.renommerMedia(id, nom);
    } catch (err) {
      setErreur(err.message);
      charger();
    }
  }

  async function handleSupprimer(id) {
    if (!window.confirm('Supprimer ce média ? Il restera visible partout où son lien a déjà été utilisé (produits, blocs...), seule la médiathèque perd la trace.')) return;
    try {
      await api.deleteMedia(id);
      setMedias((ms) => ms.filter((m) => m.id !== id));
    } catch (err) {
      setErreur(err.message);
    }
  }

  async function handleCopier(media) {
    try {
      await navigator.clipboard.writeText(media.url);
      setCopieId(media.id);
      setTimeout(() => setCopieId((c) => (c === media.id ? null : c)), 1800);
    } catch {
      window.prompt('Copiez ce lien :', media.url);
    }
  }

  if (chargement) return <p>Chargement…</p>;
  if (erreur && !medias) {
    return (
      <p style={{ color: 'var(--danger)' }}>
        {erreur.includes('does not exist') || erreur.includes('schema cache')
          ? "Cette section n'est pas encore activée sur la base de données. Demande le script SQL de mise en place."
          : erreur}
      </p>
    );
  }

  const filtres = (medias || []).filter((m) => !recherche.trim() || m.nom.toLowerCase().includes(recherche.trim().toLowerCase()));

  return (
    <div>
      <h1>Médiathèque</h1>
      <p style={{ opacity: 0.7, fontSize: '0.9rem', maxWidth: '600px' }}>
        Uploade des images à l'avance (logos, bannières, visuels réutilisables) pour les réutiliser
        ensuite sans les réimporter — copie le lien et colle-le où tu en as besoin.
        Compression et limites de taille identiques au reste du site (max ~1600px, ~2 Mo).
        Pour une seule image à la fois, le nom que tu donnes apparaît directement dans le lien
        (ex: .../medithe/medias/logo-boutique-a1b2.jpg) — "Renommer" ensuite ne change que
        l'étiquette affichée ici, pas le lien lui-même (une fois en ligne, un lien Cloudinary
        ne peut plus être renommé sans réuploader l'image).
      </p>

      <div style={styles.barreHaut}>
        <label className="btn btn-primary" style={{ cursor: uploadEnCours ? 'default' : 'pointer', opacity: uploadEnCours ? 0.7 : 1 }}>
          {uploadEnCours ? (progression || 'Envoi…') : '+ Ajouter des images'}
          <input
            type="file" accept="image/jpeg,image/png,image/webp" multiple
            onChange={handleFileChange} disabled={uploadEnCours} style={{ display: 'none' }}
          />
        </label>
        <input
          type="text" placeholder="Rechercher par nom…" value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ ...styles.input, maxWidth: '260px' }}
        />
      </div>
      {erreurUpload && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.5rem' }}>{erreurUpload}</p>}

      {filtres.length === 0 ? (
        <p style={{ opacity: 0.6, marginTop: '1.5rem' }}>
          {recherche ? 'Aucun média ne correspond à cette recherche.' : "Aucun média pour l'instant."}
        </p>
      ) : (
        <div style={styles.grille}>
          {filtres.map((m) => (
            <div key={m.id} style={styles.carte}>
              <div style={styles.imageZone}>
                <img src={m.url} alt={m.nom} style={styles.image} loading="lazy" />
              </div>
              <div style={styles.corps}>
                <button type="button" onClick={() => handleRenommer(m.id, m.nom)} style={styles.nomBouton} title="Renommer">
                  {m.nom || 'Sans nom'}
                </button>
                <span style={styles.meta}>
                  {m.largeur && m.hauteur ? `${m.largeur}×${m.hauteur}px` : ''}
                  {m.taille_octets ? ` · ${formaterTaille(m.taille_octets)}` : ''}
                </span>
                <div style={styles.actions}>
                  <button type="button" className="btn-ghost" onClick={() => handleCopier(m)} style={{ fontSize: '0.78rem' }}>
                    {copieId === m.id ? '✓ Copié' : 'Copier le lien'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => handleSupprimer(m.id)} style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  barreHaut: { display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '1.3rem' },
  input: {
    padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
    background: 'var(--parchment)', fontFamily: 'var(--font-body)', flex: 1,
  },
  grille: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '1rem', marginTop: '1.3rem',
  },
  carte: {
    border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden',
    background: 'var(--parchment-dark)', display: 'flex', flexDirection: 'column',
  },
  imageZone: { aspectRatio: '1 / 1', background: 'var(--sage-light)' },
  image: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  corps: { padding: '0.6rem 0.7rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  nomBouton: {
    background: 'none', border: 'none', padding: 0, textAlign: 'left', fontSize: '0.85rem',
    fontWeight: 500, cursor: 'pointer', color: 'var(--ink)', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  meta: { fontSize: '0.72rem', opacity: 0.6, fontFamily: 'var(--font-mono)' },
  actions: { display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' },
};
