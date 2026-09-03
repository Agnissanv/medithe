import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/connexion');
  }

  const linkStyle = ({ isActive }) => ({
    ...styles.link,
    background: isActive ? 'var(--forest-light)' : 'transparent',
    color: isActive ? 'var(--copper)' : 'var(--parchment)',
  });

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>◈ MédiThé <span className="eyebrow" style={{ color: 'var(--sage)' }}>admin</span></div>
      <nav style={styles.nav}>
        <NavLink to="/admin" end style={linkStyle}>Tableau de bord</NavLink>
        <NavLink to="/admin/produits" style={linkStyle}>Produits</NavLink>
        <NavLink to="/admin/commandes" style={linkStyle}>Commandes</NavLink>
        <NavLink to="/admin/closers" style={linkStyle}>Closers</NavLink>
      </nav>
      <button className="btn-ghost" onClick={handleLogout} style={{ color: 'var(--parchment)', opacity: 0.7, marginTop: 'auto' }}>
        Se déconnecter
      </button>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '220px',
    minHeight: '100vh',
    background: 'var(--forest)',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    position: 'sticky',
    top: 0,
  },
  logo: {
    fontFamily: 'var(--font-display)',
    color: 'var(--parchment)',
    fontSize: '1.1rem',
    fontWeight: 600,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  link: {
    padding: '0.6em 0.8em',
    borderRadius: 'var(--radius)',
    fontSize: '0.9rem',
  },
};