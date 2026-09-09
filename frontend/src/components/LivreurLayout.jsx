import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LivreurLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/connexion');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--parchment)' }}>
      <header style={styles.header}>
        <span style={styles.logo}>◈ MédiThé <span className="eyebrow" style={{ color: 'var(--sage)' }}>livraison</span></span>
        <button className="btn-ghost" onClick={handleLogout} style={{ color: 'var(--parchment)' }}>Se déconnecter</button>
      </header>
      <nav style={styles.nav}>
        <NavLink to="/livraison" end style={({ isActive }) => ({ ...styles.lien, ...(isActive ? styles.lienActif : {}) })}>
          Mes livraisons
        </NavLink>
        <NavLink to="/livraison/historique" style={({ isActive }) => ({ ...styles.lien, ...(isActive ? styles.lienActif : {}) })}>
          Historique
        </NavLink>
      </nav>
      <main style={{ padding: '2rem 1.5rem' }} className="livraison-main">
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  header: {
    background: 'var(--forest)', padding: '1rem 1.5rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  logo: { fontFamily: 'var(--font-display)', color: 'var(--parchment)', fontSize: '1.1rem', fontWeight: 600 },
  nav: {
    background: 'var(--forest)', borderTop: '1px solid rgba(255,255,255,0.12)',
    padding: '0 1.5rem', display: 'flex', gap: '1.2rem',
  },
  lien: {
    padding: '0.7rem 0.1rem', color: 'var(--parchment)', opacity: 0.65, fontSize: '0.9rem',
    borderBottom: '2px solid transparent',
  },
  lienActif: { opacity: 1, borderBottom: '2px solid var(--copper)' },
};