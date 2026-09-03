import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { uploadImageToCloudinary } from '../../utils/cloudinary.js';
import RichTextField from '../../components/admin/RichTextField.jsx';
import IconPicker from '../../components/admin/IconPicker.jsx';

const TYPES = [
  { value: 'texte', label: 'Texte enrichi' },
  { value: 'image_titre', label: 'Image + titre + sous-titre' },
  { value: 'beneficies', label: 'Bénéfices (liste à icônes)' },
  { value: 'avis', label: 'Témoignages' },
  { value: 'accordeon', label: 'Accordéon / FAQ' },
  { value: 'offre', label: 'Offres / tarifs' },
  { value: 'formulaire_achat', label: "Formulaire d'achat" },
  { value: 'cta', label: 'Bouton CTA' },
];

function creerBlocParDefaut(type) {
  const id = crypto.randomUUID();
  switch (type) {
    case 'texte': return { id, type, titre: '', contenuHtml: '' };
    case 'image_titre': return { id, type, image: '', titre: '', sousTitre: '' };
    case 'beneficies': return { id, type, titreSection: '', items: [] };
    case 'avis': return { id, type, titreSection: '', items: [] };
    case 'accordeon': return { id, type, titreSection: '', items: [] };
    case 'offre': return { id, type, titreSection: '', cartes: [], cibleType: 'scroll', cibleFormulaireId: '' };
    case 'formulaire_achat': return { id, type, titre: '' };
    case 'cta': return { id, type, texte: 'Commander maintenant' };
    default: return { id, type };
  }
}

export default function SectionsEditor({ sections, onChange, produitInitial }) {
  function ajouterBloc(type) {
    onChange([...sections, creerBlocParDefaut(type)]);
  }
  function mettreAJour(id, patch) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function supprimer(id) {
    onChange(sections.filter((s) => s.id !== id));
  }
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    onChange(arrayMove(sections, oldIndex, newIndex));
  }

  function importerAnciensChamps() {
    const nouveaux = [];
    if (produitInitial?.Beneficies?.length) {
      nouveaux.push({
        id: crypto.randomUUID(), type: 'beneficies', titreSection: 'Pourquoi ce produit ?',
        items: produitInitial.Beneficies.map((texte) => ({ id: crypto.randomUUID(), texte, icone: 'leaf' })),
      });
    }
    if (produitInitial?.Composition) {
      nouveaux.push({ id: crypto.randomUUID(), type: 'texte', titre: 'Composition & bienfaits', contenuHtml: `<p>${produitInitial.Composition}</p>` });
    }
    if (produitInitial?.Preparation) {
      nouveaux.push({ id: crypto.randomUUID(), type: 'texte', titre: 'Comment le préparer', contenuHtml: `<p>${produitInitial.Preparation}</p>` });
    }
    if (produitInitial?.Faq?.length) {
      nouveaux.push({ id: crypto.randomUUID(), type: 'accordeon', titreSection: 'Questions fréquentes', items: produitInitial.Faq });
    }
    if (produitInitial?.Avis?.length) {
      nouveaux.push({ id: crypto.randomUUID(), type: 'avis', titreSection: "Ce qu'en disent nos clients", items: produitInitial.Avis });
    }
    if (!nouveaux.length) {
      alert('Aucun ancien champ à importer sur ce produit.');
      return;
    }
    onChange([...sections, ...nouveaux]);
  }

  function insererBloc(index, type) {
    const nouveau = creerBlocParDefaut(type);
    const copie = [...sections];
    copie.splice(index, 0, nouveau);
    onChange(copie);
  }

  return (
    <div>
      <label style={styles.label}>Blocs de la fiche produit</label>
      <p style={{ fontSize: '0.78rem', opacity: 0.65, marginBottom: '0.8rem' }}>
        Glissez la poignée ⠿ pour réordonner, ou cliquez le "+" à l'endroit exact où insérer un nouveau bloc.
      </p>

      {produitInitial && (
        <button type="button" className="btn-outline btn" onClick={importerAnciensChamps} style={{ marginBottom: '1rem' }}>
          Importer les anciens champs
        </button>
      )}

      <PointInsertion index={0} onInserer={insererBloc} />

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section, index) => (
            <React.Fragment key={section.id}>
              <BlocTrie section={section}>
                <BlocContenu
                  section={section}
                  sections={sections}
                  onChange={(patch) => mettreAJour(section.id, patch)}
                  onSupprimer={() => supprimer(section.id)}
                />
              </BlocTrie>
              <PointInsertion index={index + 1} onInserer={insererBloc} />
            </React.Fragment>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function PointInsertion({ index, onInserer }) {
  const [ouvert, setOuvert] = React.useState(false);

  if (!ouvert) {
    return (
      <div style={styles.ligneInsertion}>
        <button type="button" onClick={() => setOuvert(true)} style={styles.boutonInsertion} aria-label="Ajouter un bloc ici">
          +
        </button>
      </div>
    );
  }

  return (
    <div style={styles.paletteInsertion}>
      {TYPES.map((t) => (
        <button
          key={t.value} type="button" className="btn-outline btn"
          onClick={() => { onInserer(index, t.value); setOuvert(false); }}
        >
          + {t.label}
        </button>
      ))}
      <button type="button" className="btn-ghost" onClick={() => setOuvert(false)}>Annuler</button>
    </div>
  );
}

function BlocTrie({ section, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={{ ...style, ...blocTrieStyle }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <button type="button" className="bloc-poignee" {...attributes} {...listeners}>⠿</button>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function BlocContenu({ section, sections, onChange, onSupprimer }) {
  const label = TYPES.find((t) => t.value === section.type)?.label;

  return (
    <div>
      <div style={styles.sectionHeader}>
        <strong>{label}</strong>
        <button type="button" className="btn-ghost" onClick={onSupprimer} style={{ color: 'var(--danger)' }}>Supprimer</button>
      </div>

      {section.type === 'texte' && (
        <div>
          <input
            type="text" placeholder="Titre (optionnel)" value={section.titre}
            onChange={(e) => onChange({ titre: e.target.value })} style={{ ...styles.input, marginBottom: '0.6rem' }}
          />
          <RichTextField value={section.contenuHtml} onChange={(html) => onChange({ contenuHtml: html })} />
        </div>
      )}

      {section.type === 'image_titre' && <ImageTitreForm section={section} onChange={onChange} />}
      {section.type === 'beneficies' && <BeneficesForm section={section} onChange={onChange} />}
      {section.type === 'avis' && <AvisForm section={section} onChange={onChange} />}
      {section.type === 'accordeon' && <AccordeonForm section={section} onChange={onChange} />}
      {section.type === 'offre' && <OffreForm section={section} sections={sections} onChange={onChange} />}

      {section.type === 'formulaire_achat' && (
        <input
          type="text" placeholder="Titre affiché (optionnel)"
          value={section.titre} onChange={(e) => onChange({ titre: e.target.value })} style={styles.input}
        />
      )}

      {section.type === 'cta' && (
        <input
          type="text" placeholder="Texte du bouton" value={section.texte}
          onChange={(e) => onChange({ texte: e.target.value })} style={styles.input}
        />
      )}
    </div>
  );
}

function BeneficesForm({ section, onChange }) {
  function ajouter() {
    onChange({ items: [...(section.items || []), { id: crypto.randomUUID(), texte: '', icone: 'check' }] });
  }
  function modifier(id, patch) {
    onChange({ items: section.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  }
  function retirer(id) {
    onChange({ items: section.items.filter((it) => it.id !== id) });
  }

  return (
    <div>
      <input
        type="text" placeholder="Titre de la section (optionnel)" value={section.titreSection}
        onChange={(e) => onChange({ titreSection: e.target.value })} style={{ ...styles.input, marginBottom: '0.6rem' }}
      />
      {(section.items || []).map((it) => (
        <div key={it.id} style={styles.repeaterItem}>
          <input
            type="text" placeholder="Bénéfice (ex: Riche en antioxydants)" value={it.texte}
            onChange={(e) => modifier(it.id, { texte: e.target.value })} style={{ ...styles.input, marginBottom: '0.5rem' }}
          />
          <IconPicker value={it.icone} onChange={(cle) => modifier(it.id, { icone: cle })} />
          <button type="button" onClick={() => retirer(it.id)} style={{ ...styles.repeaterRemove, marginTop: '0.5rem' }}>Retirer</button>
        </div>
      ))}
      <button type="button" className="btn-outline btn" onClick={ajouter}>+ Ajouter un bénéfice</button>
    </div>
  );
}

function AvisForm({ section, onChange }) {
  function ajouter() {
    onChange({ items: [...(section.items || []), { nom: '', note: 5, commentaire: '' }] });
  }
  function modifier(i, champ, val) {
    onChange({ items: section.items.map((it, idx) => (idx === i ? { ...it, [champ]: val } : it)) });
  }
  function retirer(i) {
    onChange({ items: section.items.filter((_, idx) => idx !== i) });
  }

  return (
    <div>
      <input
        type="text" placeholder="Titre de la section" value={section.titreSection}
        onChange={(e) => onChange({ titreSection: e.target.value })} style={{ ...styles.input, marginBottom: '0.6rem' }}
      />
      {(section.items || []).map((it, i) => (
        <div key={i} style={styles.repeaterItem}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <input placeholder="Nom" value={it.nom} onChange={(e) => modifier(i, 'nom', e.target.value)} style={{ ...styles.input, flex: 2 }} />
            <select value={it.note} onChange={(e) => modifier(i, 'note', Number(e.target.value))} style={{ ...styles.input, flex: 1 }}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} étoiles</option>)}
            </select>
          </div>
          <textarea placeholder="Commentaire" value={it.commentaire} rows={2} onChange={(e) => modifier(i, 'commentaire', e.target.value)} style={styles.input} />
          <button type="button" onClick={() => retirer(i)} style={styles.repeaterRemove}>Retirer cet avis</button>
        </div>
      ))}
      <button type="button" className="btn-outline btn" onClick={ajouter}>+ Ajouter un avis</button>
    </div>
  );
}

function ImageTitreForm({ section, onChange }) {
  const [uploadEnCours, setUploadEnCours] = React.useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadEnCours(true);
    try {
      const url = await uploadImageToCloudinary(file);
      onChange({ image: url });
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadEnCours(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {section.image && <img src={section.image} alt="" style={{ width: '160px', borderRadius: 'var(--radius)' }} />}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} disabled={uploadEnCours} />
      <input type="text" placeholder="Titre" value={section.titre} onChange={(e) => onChange({ titre: e.target.value })} style={styles.input} />
      <input type="text" placeholder="Sous-titre" value={section.sousTitre} onChange={(e) => onChange({ sousTitre: e.target.value })} style={styles.input} />
    </div>
  );
}

function AccordeonForm({ section, onChange }) {
  function ajouter() {
    onChange({ items: [...(section.items || []), { question: '', reponse: '' }] });
  }
  function modifier(i, champ, val) {
    onChange({ items: section.items.map((it, idx) => (idx === i ? { ...it, [champ]: val } : it)) });
  }
  function retirer(i) {
    onChange({ items: section.items.filter((_, idx) => idx !== i) });
  }

  return (
    <div>
      <input
        type="text" placeholder="Titre de la section (ex: FAQ, Garantie...)"
        value={section.titreSection} onChange={(e) => onChange({ titreSection: e.target.value })}
        style={{ ...styles.input, marginBottom: '0.6rem' }}
      />
      {(section.items || []).map((it, i) => (
        <div key={i} style={styles.repeaterItem}>
          <input
            type="text" placeholder="Question / titre" value={it.question}
            onChange={(e) => modifier(i, 'question', e.target.value)} style={{ ...styles.input, marginBottom: '0.4rem' }}
          />
          <RichTextField value={it.reponse} onChange={(html) => modifier(i, 'reponse', html)} placeholder="Réponse / contenu" />
          <button type="button" onClick={() => retirer(i)} style={{ ...styles.repeaterRemove, marginTop: '0.5rem' }}>Retirer</button>
        </div>
      ))}
      <button type="button" className="btn-outline btn" onClick={ajouter}>+ Ajouter un item</button>
    </div>
  );
}

function OffreForm({ section, sections, onChange }) {
  const formulairesSupplementaires = sections.filter((s) => s.type === 'formulaire_achat');

  function ajouterCarte() {
    onChange({
      cartes: [...(section.cartes || []), {
        id: crypto.randomUUID(), eyebrow: '', prix: '', prixBarre: '', suffixePrix: '',
        description: '', fonctionnalitesTexte: '', miseEnAvant: false, badgeTexte: 'Le plus choisi', texteBouton: 'Choisir',
      }],
    });
  }
  function modifierCarte(id, patch) {
    onChange({ cartes: section.cartes.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  }
  function retirerCarte(id) {
    onChange({ cartes: section.cartes.filter((c) => c.id !== id) });
  }

  return (
    <div>
      <input
        type="text" placeholder="Titre de la section" value={section.titreSection}
        onChange={(e) => onChange({ titreSection: e.target.value })} style={{ ...styles.input, marginBottom: '0.8rem' }}
      />

      <div style={styles.repeaterItem}>
        <label style={styles.label}>Les boutons "Choisir" redirigent vers :</label>
        <select
          value={section.cibleType || 'scroll'}
          onChange={(e) => onChange({ cibleType: e.target.value })}
          style={{ ...styles.input, marginBottom: '0.5rem' }}
        >
          <option value="scroll">Un formulaire sur cette page</option>
          <option value="commande">La page de commande (panier)</option>
        </select>

        {(section.cibleType || 'scroll') === 'scroll' && (
          <select
            value={section.cibleFormulaireId || ''}
            onChange={(e) => onChange({ cibleFormulaireId: e.target.value })}
            style={styles.input}
          >
            <option value="">Le formulaire principal (par défaut, en haut de la fiche)</option>
            {formulairesSupplementaires.map((f, i) => (
              <option key={f.id} value={f.id}>{f.titre || `Formulaire supplémentaire #${i + 1}`}</option>
            ))}
          </select>
        )}
      </div>

      {(section.cartes || []).map((c) => (
        <div key={c.id} style={styles.repeaterItem}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <input placeholder="Nom" value={c.eyebrow} onChange={(e) => modifierCarte(c.id, { eyebrow: e.target.value })} style={{ ...styles.input, flex: 1 }} />
            <input placeholder="Prix" value={c.prix} onChange={(e) => modifierCarte(c.id, { prix: e.target.value })} style={{ ...styles.input, flex: 1 }} />
            <input placeholder="Prix barré (optionnel)" value={c.prixBarre} onChange={(e) => modifierCarte(c.id, { prixBarre: e.target.value })} style={{ ...styles.input, flex: 1 }} />
            <input placeholder="Unité" value={c.suffixePrix} onChange={(e) => modifierCarte(c.id, { suffixePrix: e.target.value })} style={{ ...styles.input, flex: 1 }} />
          </div>
          <div style={{ marginBottom: '0.4rem' }}>
            <RichTextField value={c.description} onChange={(html) => modifierCarte(c.id, { description: html })} placeholder="Description" />
          </div>
          <textarea
            placeholder="Fonctionnalités, une par ligne" value={c.fonctionnalitesTexte} rows={3}
            onChange={(e) => modifierCarte(c.id, { fonctionnalitesTexte: e.target.value })} style={{ ...styles.input, marginBottom: '0.4rem' }}
          />
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4em', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={c.miseEnAvant} onChange={(e) => modifierCarte(c.id, { miseEnAvant: e.target.checked })} />
              Mettre en avant
            </label>
            {c.miseEnAvant && (
              <input placeholder="Texte badge" value={c.badgeTexte} onChange={(e) => modifierCarte(c.id, { badgeTexte: e.target.value })} style={{ ...styles.input, flex: 1 }} />
            )}
          </div>
          <input placeholder="Texte du bouton" value={c.texteBouton} onChange={(e) => modifierCarte(c.id, { texteBouton: e.target.value })} style={{ ...styles.input, marginBottom: '0.4rem' }} />
          <button type="button" onClick={() => retirerCarte(c.id)} style={styles.repeaterRemove}>Retirer cette offre</button>
        </div>
      ))}
      <button type="button" className="btn-outline btn" onClick={ajouterCarte}>+ Ajouter une offre</button>
    </div>
  );
}

const blocTrieStyle = { border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', background: 'var(--parchment)' };

const styles = {
  label: { display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 500 },
  ligneInsertion: { display: 'flex', justifyContent: 'center', padding: '0.3rem 0' },
  boutonInsertion: {
    width: '28px', height: '28px', borderRadius: '50%', border: '1px dashed var(--line)',
    background: 'var(--parchment)', color: 'var(--sage)', fontSize: '1rem', lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  paletteInsertion: {
    display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.8rem',
    background: 'var(--sage-light)', borderRadius: 'var(--radius)', margin: '0.4rem 0',
  },
  input: {
    width: '100%', padding: '0.6em 0.8em', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', background: 'var(--parchment)',
  },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' },
  repeaterItem: { border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.8rem', marginBottom: '0.6rem' },
  repeaterRemove: { fontSize: '0.78rem', color: 'var(--danger)', background: 'none', marginTop: '0.3rem' },
};