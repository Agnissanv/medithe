import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { appliquerTheme } from '../../utils/theme.js';

const COULEURS_DEFAUT = { couleur_principale: '#0B4D1E', couleur_accent: '#C99A2E', couleur_fond: '#EAF6EC' };

const CHAMPS = [
  { cle: 'couleur_principale', label: 'Couleur principale', aide: "En-tête, logo, boutons principaux, éléments dominants du site" },
  { cle: 'couleur_accent', label: "Couleur d'accent", aide: 'Prix, boutons de mise en avant, badges, liens actifs' },
  { cle: 'couleur_fond', label: 'Couleur de fond (teinte)', aide: 'Fond des cartes et sections mises en valeur' },
];

export default function AdminApparence() {
  const [valeurs, setValeurs] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [messageOk, setMessageOk] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    supabase.from('parametres_apparence').select('*').eq('id', 'principal').single()
      .then(({ data, error }) => {
        if (error) setErreur(error.message);
        else setValeurs(data);
      })
      .finally(() => setChargement(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnregistrement(true);
    setErreur('');
    setMessageOk(false);
    const { error } = await supabase.from('parametres_apparence')
      .update({
        couleur_principale: valeurs.couleur_principale,
        couleur_accent: valeurs.couleur_accent,
        couleur_fond: valeurs.couleur_fond,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'principal');
    setEnregistrement(false);
    if (error) { setErreur(error.message); return; }
    appliquerTheme(valeurs); // effet immédiat, sans recharger la page
    setMessageOk(true);
    setTimeout(() => setMessageOk(false), 2500);
  }

  function handleReinitialiser() {
    setValeurs((v) => ({ ...v, ...COULEURS_DEFAUT }));
  }

  if (chargement) return <p>Chargement…</p>;
  if (!valeurs) {
    return (
      <p style={{ color: 'var(--danger)' }}>
        {erreur || "Cette section n'est pas encore activée sur la base de données. Demande le script SQL de mise en place."}
      </p>
    );
  }

  return (
    <div>
      <h1>Apparence</h1>
      <p style={{ opacity: 0.7, fontSize: '0.9rem', maxWidth: '600px' }}>
        Personnalise les couleurs du site à partir de 3 teintes de base. Les autres nuances
        (bordures, fonds secondaires...) s'ajustent automatiquement autour d'elles.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1.3rem', marginTop: '1.5rem' }}>
        {CHAMPS.map((champ) => (
          <label key={champ.cle} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{champ.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                type="color"
                value={valeurs[champ.cle]}
                onChange={(e) => setValeurs((v) => ({ ...v, [champ.cle]: e.target.value }))}
                style={{ width: '48px', height: '38px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '2px', background: 'var(--parchment)', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={valeurs[champ.cle]}
                onChange={(e) => setValeurs((v) => ({ ...v, [champ.cle]: e.target.value }))}
                style={{ padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--parchment)', fontFamily: 'var(--font-mono)', flex: 1 }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{champ.aide}</span>
          </label>
        ))}

        {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit" disabled={enregistrement}>
            {enregistrement ? 'Enregistrement…' : messageOk ? '✓ Enregistré' : 'Enregistrer'}
          </button>
          <button className="btn btn-outline" type="button" onClick={handleReinitialiser}>
            Couleurs MédiThé par défaut
          </button>
        </div>
      </form>
    </div>
  );
}
