import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

export default function AdminPixels() {
  const [pixels, setPixels] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [plateforme, setPlateforme] = useState('facebook');
  const [pixelId, setPixelId] = useState('');
  const [libelle, setLibelle] = useState('');
  const [envoi, setEnvoi] = useState(false);

  function charger() {
    setChargement(true);
    supabase.from('parametres_pixels').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErreur(error.message);
        else setPixels(data);
      })
      .finally(() => setChargement(false));
  }

  useEffect(charger, []);

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
    if (!confirm('Supprimer ce pixel ?')) return;
    await supabase.from('parametres_pixels').delete().eq('id', id);
    charger();
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
    </div>
  );
}

const styles = {
  form: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem', maxWidth: '700px' },
  input: { padding: '0.6em 0.8em', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--parchment)', flex: 1 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--sage)', textTransform: 'uppercase' },
  td: { padding: '0.7rem 0.6rem', borderBottom: '1px solid var(--line)', fontSize: '0.9rem' },
};