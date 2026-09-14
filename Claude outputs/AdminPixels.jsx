import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useConfirm } from '../../context/ConfirmContext.jsx';

const PLATEFORMES_API = [
  {
    cle: 'facebook',
    nom: 'Facebook / Instagram',
    champs: [
      { cle: 'access_token', label: "Jeton d'accès CAPI", type: 'password', placeholder: 'EAAG...', aide: "Business Manager > Paramètres des événements > Conversions API > Générer un jeton d'accès" },
      { cle: 'test_event_code', label: 'Code de test (optionnel)', type: 'text', placeholder: 'TEST12345', aide: "Pour vérifier les événements en direct dans Events Manager sans polluer les vraies données" },
    ],
  },
  {
    cle: 'tiktok',
    nom: 'TikTok',
    champs: [
      { cle: 'access_token', label: "Jeton d'accès Events API", type: 'password', placeholder: '...', aide: 'TikTok Ads Manager > Événements > Configurer > Events API > Générer un jeton' },
    ],
  },
  {
    cle: 'google',
    nom: 'Google (GA4)',
    champs: [
      { cle: 'ga4_measurement_id', label: 'ID de mesure GA4', type: 'text', placeholder: 'G-XXXXXXXXXX', aide: 'Google Analytics > Administration > Flux de données > ton flux web' },
      { cle: 'ga4_api_secret', label: 'Clé API secrète', type: 'password', placeholder: '...', aide: 'Google Analytics > Administration > Flux de données > Measurement Protocol > Créer' },
    ],
  },
];

export default function AdminPixels() {
  const confirmer = useConfirm();
  const [pixels, setPixels] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [plateforme, setPlateforme] = useState('facebook');
  const [pixelId, setPixelId] = useState('');
  const [libelle, setLibelle] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const [configsApi, setConfigsApi] = useState({});
  const [erreurApi, setErreurApi] = useState('');
  const [tableApiAbsente, setTableApiAbsente] = useState(false);

  function charger() {
    setChargement(true);
    supabase.from('parametres_pixels').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErreur(error.message);
        else setPixels(data);
      })
      .finally(() => setChargement(false));
  }

  function chargerApiConversion() {
    supabase.from('parametres_api_conversion').select('*')
      .then(({ data, error }) => {
        if (error) {
          // Table pas encore créée (le SQL de mise en place n'a pas été exécuté)
          setTableApiAbsente(true);
          return;
        }
        const parCle = {};
        (data || []).forEach((c) => { parCle[c.plateforme] = c; });
        setConfigsApi(parCle);
      });
  }

  useEffect(() => { charger(); chargerApiConversion(); }, []);

  async function handleAjouter(e) {
    e.preventDefault();
    if (!pixelId.trim()) return;
    setEnvoi(true);
    setErreur('');
    const { error } = await supabase.from('parametres_pixels').insert({ plateforme, pixel_id: pixelId.trim(), libelle: libelle.trim() });
    if (error) setErreur(error.message);
    else {
      setPixelId(''); setLibelle('');
      charger();
    }
    setEnvoi(false);
  }

  async function handleBasculer(pixel) {
    await supabase.from('parametres_pixels').update({ actif: !pixel.actif }).eq('id', pixel.id);
    charger();
  }

  async function handleSupprimer(id) {
    const ok = await confirmer('Supprimer ce pixel ?', { titre: 'Supprimer le pixel', labelConfirmer: 'Supprimer' });
    if (!ok) return;
    await supabase.from('parametres_pixels').delete().eq('id', id);
    charger();
  }

  async function handleEnregistrerApi(cle, valeurs) {
    setErreurApi('');
    const { error } = await supabase.from('parametres_api_conversion')
      .update({ ...valeurs, updated_at: new Date().toISOString() })
      .eq('plateforme', cle);
    if (error) { setErreurApi(error.message); return false; }
    chargerApiConversion();
    return true;
  }

  return (
    <div>
      <h1>Publicité</h1>
      <p style={{ opacity: 0.7, fontSize: '0.9rem', maxWidth: '600px' }}>
        Ajoute ici les identifiants de pixel fournis par Facebook, TikTok ou Google Ads.
        Le site enverra automatiquement les événements standards (vue de page, vue produit,
        ajout au panier, début de commande, achat) à chaque pixel actif.
      </p>

      <form onSubmit={handleAjouter} style={styles.form}>
        <select value={plateforme} onChange={(e) => setPlateforme(e.target.value)} style={styles.input}>
          <option value="facebook">Facebook</option>
          <option value="tiktok">TikTok</option>
          <option value="google">Google</option>
        </select>
        <input value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder="ID du pixel" style={styles.input} required />
        <input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Repère (optionnel, ex: Campagne parfum)" style={styles.input} />
        <button className="btn btn-primary" type="submit" disabled={envoi}>+ Ajouter</button>
      </form>

      {erreur && <p style={{ color: 'var(--danger)' }}>{erreur}</p>}

      {chargement ? <p>Chargement…</p> : pixels.length === 0 ? (
        <p style={{ opacity: 0.6 }}>Aucun pixel configuré.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Plateforme</th>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Repère</th>
              <th style={styles.th}>Actif</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {pixels.map((p) => (
              <tr key={p.id}>
                <td style={{ ...styles.td, textTransform: 'capitalize' }}>{p.plateforme}</td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)' }}>{p.pixel_id}</td>
                <td style={styles.td}>{p.libelle || '—'}</td>
                <td style={styles.td}>
                  <button className="btn-ghost" onClick={() => handleBasculer(p)}>{p.actif ? 'Actif' : 'Inactif'}</button>
                </td>
                <td style={styles.td}>
                  <button className="btn-ghost" onClick={() => handleSupprimer(p.id)} style={{ color: 'var(--danger)' }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={styles.separateur} />

      <h2 style={{ fontSize: '1.1rem' }}>Réglages avancés — API de conversion (envoi côté serveur)</h2>
      <p style={{ opacity: 0.7, fontSize: '0.9rem', maxWidth: '640px' }}>
        En plus du pixel classique dans le navigateur, le site peut envoyer les mêmes événements
        directement depuis le serveur à Meta, TikTok et Google. C'est plus fiable (les bloqueurs
        de pub et la confidentialité iOS n'affectent pas cet envoi). Ces réglages complètent les
        pixels ci-dessus — ils ne les remplacent pas.
      </p>

      {tableApiAbsente ? (
        <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
          Cette section n'est pas encore activée sur la base de données. Demande le script SQL de mise en place.
        </p>
      ) : (
        <div style={styles.grilleApi}>
          {PLATEFORMES_API.map((plate) => (
            <CarteApiConversion
              key={plate.cle}
              plateforme={plate}
              config={configsApi[plate.cle]}
              onEnregistrer={(valeurs) => handleEnregistrerApi(plate.cle, valeurs)}
            />
          ))}
        </div>
      )}
      {erreurApi && <p style={{ color: 'var(--danger)' }}>{erreurApi}</p>}
    </div>
  );
}

function CarteApiConversion({ plateforme, config, onEnregistrer }) {
  const [valeurs, setValeurs] = useState(() => {
    const init = { actif: config?.actif || false };
    plateforme.champs.forEach((c) => { init[c.cle] = config?.[c.cle] || ''; });
    return init;
  });
  const [enregistrement, setEnregistrement] = useState(false);
  const [messageOk, setMessageOk] = useState(false);

  useEffect(() => {
    const init = { actif: config?.actif || false };
    plateforme.champs.forEach((c) => { init[c.cle] = config?.[c.cle] || ''; });
    setValeurs(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnregistrement(true);
    setMessageOk(false);
    const ok = await onEnregistrer(valeurs);
    setEnregistrement(false);
    if (ok) { setMessageOk(true); setTimeout(() => setMessageOk(false), 2500); }
  }

  const configure = plateforme.champs.every((c) => (config?.[c.cle] || '').length > 0);

  return (
    <form onSubmit={handleSubmit} style={styles.carteApi}>
      <div style={styles.carteApiEntete}>
        <span style={{ fontWeight: 600 }}>{plateforme.nom}</span>
        <span style={{ fontSize: '0.75rem', color: configure ? 'var(--sage)' : 'var(--copper)' }}>
          {configure ? '● Configuré' : '○ Non configuré'}
        </span>
      </div>

      {plateforme.champs.map((champ) => (
        <label key={champ.cle} style={styles.champApi}>
          <span style={styles.labelApi}>{champ.label}</span>
          <input
            type={champ.type}
            value={valeurs[champ.cle]}
            onChange={(e) => setValeurs((v) => ({ ...v, [champ.cle]: e.target.value }))}
            placeholder={champ.placeholder}
            style={styles.input}
            autoComplete="off"
          />
          <span style={styles.aideApi}>{champ.aide}</span>
        </label>
      ))}

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
        <input
          type="checkbox"
          checked={valeurs.actif}
          onChange={(e) => setValeurs((v) => ({ ...v, actif: e.target.checked }))}
        />
        Envoi côté serveur actif
      </label>

      <button className="btn btn-outline" type="submit" disabled={enregistrement} style={{ width: '100%', justifyContent: 'center' }}>
        {enregistrement ? 'Enregistrement…' : messageOk ? '✓ Enregistré' : 'Enregistrer'}
      </button>
    </form>
  );
}

const styles = {
  form: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem', maxWidth: '700px' },
  input: { padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--parchment)', flex: 1 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--sage)', textTransform: 'uppercase' },
  td: { padding: '0.7rem 0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.9rem' },
  separateur: { height: '1px', background: 'var(--line)', margin: '2.5rem 0 1.5rem' },
  grilleApi: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' },
  carteApi: {
    display: 'flex', flexDirection: 'column', gap: '0.8rem',
    background: 'var(--parchment-dark)', border: '1px solid var(--line)',
    borderRadius: 'var(--radius)', padding: '1.1rem',
  },
  carteApiEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  champApi: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  labelApi: { fontSize: '0.82rem', fontWeight: 500 },
  aideApi: { fontSize: '0.72rem', opacity: 0.6 },
};
