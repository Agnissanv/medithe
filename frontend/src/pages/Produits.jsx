import React, { useState } from 'react';
import Catalogue from '../components/Catalogue.jsx';
import { useCatalogue } from '../hooks/useCatalogue.js';
import { useSEO } from '../hooks/useSEO.js';

// Page « Nos produits » : tout le catalogue, avec une adresse à partager (/produits).
export default function Produits() {
  useSEO({
    title: 'Nos produits',
    description: 'Tous les thés de soin MédiThé : livraison à domicile et paiement à la livraison.',
  });
  const { produits, chargement, erreur, recharger } = useCatalogue();
  const [categorie, setCategorie] = useState('Toutes');

  return (
    <Catalogue
      titre="Nos produits" Titre="h1"
      produits={produits} chargement={chargement} erreur={erreur} onReessayer={recharger}
      categorie={categorie} onCategorie={setCategorie}
    />
  );
}
