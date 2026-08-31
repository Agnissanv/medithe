import React from 'react';
import { useNavigate } from 'react-router-dom';
import FaqAccordion from '../FaqAccordion.jsx';
import AvisList from '../AvisList.jsx';
import BeneficesList from '../BeneficesList.jsx';
import InlineOrderForm from '../InlineOrderForm.jsx';
import OfferCards from './OfferCards.jsx';
import { useCart } from '../../context/CartContext.jsx';

export default function SectionRenderer({ section, produit, formulaireDomId }) {
  switch (section.type) {
    case 'texte':
      return (
        <section className="section-generique">
          {section.titre && <h2>{section.titre}</h2>}
          <div className="contenu-riche" dangerouslySetInnerHTML={{ __html: section.contenuHtml || '' }} />
        </section>
      );

    case 'image_titre':
      return (
        <section className="section-generique section-image-titre">
          {section.image && <img src={section.image} alt={section.titre || ''} />}
          {section.titre && <h3>{section.titre}</h3>}
          {section.sousTitre && <p>{section.sousTitre}</p>}
        </section>
      );

    case 'beneficies':
      return <BeneficesList items={section.items || []} titre={section.titreSection} />;

    case 'avis':
      return (
        <section className="section-generique">
          {section.titreSection && <h2>{section.titreSection}</h2>}
          <AvisList items={section.items || []} />
        </section>
      );

    case 'accordeon':
      return (
        <section className="section-generique">
          {section.titreSection && <h2>{section.titreSection}</h2>}
          <FaqAccordion items={section.items || []} />
        </section>
      );

    case 'offre':
      return <OffreSection section={section} produit={produit} formulaireDomId={formulaireDomId} />;

    case 'formulaire_achat':
      return (
        <div className="section-generique">
          <InlineOrderForm produit={produit} domId={`bloc-${section.id}`} titre={section.titre} />
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

function OffreSection({ section, produit, formulaireDomId }) {
  const navigate = useNavigate();
  const { addItem } = useCart();

  function handleChoisir() {
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