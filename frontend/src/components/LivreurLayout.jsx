import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
      <main style={{ padding: '2rem 1.5rem' }}>
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
};