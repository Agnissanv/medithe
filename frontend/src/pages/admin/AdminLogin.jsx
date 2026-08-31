import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext.jsx';

export default function AdminLogin() {
  const { login, isAuthenticated } = useAdmin();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur('');
    try {
      await login(password);
      navigate('/admin');
    } catch (err) {
      setErreur(err.message || 'Mot de passe incorrect');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <span className="eyebrow" style={{ color: 'var(--copper)' }}>Espace administrateur</span>
        <h1 style={{ color: 'var(--parchment)', margin: '0.3rem 0 1.5rem' }}>MEDITHE</h1>

        <label style={styles.label}>Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          autoFocus
        />
        {erreur && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{erreur}</p>}

        <button className="btn btn-primary" type="submit" disabled={envoi} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
          {envoi ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--forest)',
  },
  card: {
    background: 'var(--forest-light)',
    padding: '2.5rem',
    borderRadius: 'var(--radius)',
    width: '340px',
    border: '1px solid var(--line-dark)',
  },
  label: { color: 'var(--parchment)', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' },
  input: {
    width: '100%', padding: '0.65em 0.8em', border: '1px solid var(--line-dark)',
    borderRadius: 'var(--radius)', background: 'var(--forest)', color: 'var(--parchment)',
    fontFamily: 'var(--font-mono)',
  },
};
