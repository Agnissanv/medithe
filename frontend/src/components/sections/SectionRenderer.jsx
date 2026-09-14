import React from 'react';
import { useNavigate } from 'react-router-dom';
import FaqAccordion from '../FaqAccordion.jsx';
import AvisList from '../AvisList.jsx';
import { optimiserImageCloudinary } from '../../utils/cloudinaryOptimize.js';
import BeneficesList from '../BeneficesList.jsx';
import InlineOrderForm from '../InlineOrderForm.jsx';
import OfferCards from './OfferCards.jsx';
import ProduitsSimilaires from '../ProduitsSimilaires.jsx';
import { useCart } from '../../context/CartContext.jsx';

function estHtmlVide(html) {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length === 0;
}

export default function SectionRenderer({ section, produit, formulaireDomId, previsualisation = false }) {
  switch (section.type) {
    case 'texte':
      // Bloc laissé vide par l'admin (aucun titre, aucun texte) : on n'affiche pas le cadre,
      // sinon ça laisse un grand espace vide sur la fiche produit sans rien pour l'expliquer.
      if (!section.titre && estHtmlVide(section.contenuHtml)) return null;
      return (
        <section className="section-generique">
          {section.titre && <h2>{section.titre}</h2>}
          <div className="contenu-riche" dangerouslySetInnerHTML={{ __html: section.contenuHtml || '' }} />
        </section>
      );

    case 'image_titre':
      if (!section.image && !section.titre && !section.sousTitre) return null;
      return (
        <section className="section-generique section-image-titre">
          {section.image && (
            <img
              src={optimiserImageCloudinary(section.image, 700)}
              alt={section.titre || ''}
              loading="lazy"
              width="700"
              height="525"
            />
          )}
          {section.titre && <h3>{section.titre}</h3>}
          {section.sousTitre && <p>{section.sousTitre}</p>}
        </section>
      );

    case 'beneficies':
      return <BeneficesList items={section.items || []} titre={section.titreSection} />;

    case 'avis':
      if (!section.items?.length) return null;
      return (
        <section className="section-generique">
          {section.titreSection && <h2>{section.titreSection}</h2>}
          <AvisList items={section.items} />
        </section>
      );

    case 'accordeon':
      if (!section.items?.length) return null;
      return (
        <section className="section-generique">
          {section.titreSection && <h2>{section.titreSection}</h2>}
          <FaqAccordion items={section.items} />
        </section>
      );

    case 'offre':
      return <OffreSection section={section} produit={produit} formulaireDomId={formulaireDomId} previsualisation={previsualisation} />;

    case 'produits_similaires':
      // Rien à afficher sans catégorie sur le produit courant — évite une section
      // vide sur une fiche mal remplie.
      if (!produit?.Categorie) return null;
      return (
        <ProduitsSimilaires
          categorie={produit.Categorie}
          excludeId={produit.ID}
          titre={section.titreSection}
          nombre={section.nombre || 4}
        />
      );

    case 'formulaire_achat':
      return (
        <div className="section-generique">
          <InlineOrderForm produit={produit} domId={`bloc-${section.id}`} titre={section.titre} previsualisation={previsualisation} />
        </div>
      );

    case 'cta':
      return (
        <div className="section-generique" style={{ textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '1.05rem', padding: '0.9em 2em' }}
            onClick={() => {
              if (formulaireDomId) document.getElementById(formulaireDomId)?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {section.texte || 'Commander maintenant'}
          </button>
        </div>
      );

    default:
      return null;
  }
}

function OffreSection({ section, produit, formulaireDomId, previsualisation = false }) {
  const navigate = useNavigate();
  const { addItem } = useCart();

  if (!section.cartes?.length) return null;

  function handleChoisir() {
    if (previsualisation) return; // sécurité : pas d'ajout panier / navigation réelle en aperçu
    if (section.cibleType === 'commande') {
      addItem(produit, 1);
      navigate('/commande');
      return;
    }

    // Un bloc supplémentaire précis a été choisi par l'admin
    const cibleId = section.cibleFormulaireId ? `bloc-${section.cibleFormulaireId}` : null;
    if (cibleId && document.getElementById(cibleId)) {
      document.getElementById(cibleId).scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Sinon, direction le formulaire principal (toujours présent sur la fiche)
    if (formulaireDomId) document.getElementById(formulaireDomId)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="section-generique">
      {section.titreSection && <h2 style={{ textAlign: 'center' }}>{section.titreSection}</h2>}
      <OfferCards cartes={section.cartes || []} onChoisir={handleChoisir} />
    </section>
  );
}