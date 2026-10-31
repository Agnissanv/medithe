import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/supabaseApi.js';

export function useCatalogue() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    setErreur(false);
    api.getCatalogue()
      .then(setProduits)
      .catch(() => setErreur(true))
      .finally(() => setChargement(false));
  }, []);

  useEffect(charger, [charger]);

  return { produits, chargement, erreur, recharger: charger };
}
