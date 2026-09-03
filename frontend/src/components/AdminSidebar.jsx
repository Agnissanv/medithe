import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminSidebar({ onNaviguer }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/connexion');
    if (onNaviguer) onNaviguer();
  }

  const linkStyle = ({ isActive }) => ({
    padding: '0.6em 0.8em',
    borderRadius: 'var(--radius)',
    fontSize: '0.9rem',
    background: isActive ? 'var(--forest-light)' : 'transparent',
    color: isActive ? 'var(--copper)' : 'var(--parchment)',
  });

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">◈ MédiThé <span className="eyebrow" style={{ color: 'var(--sage)' }}>admin</span></div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <NavLink to="/admin" end style={linkStyle} onClick={onNaviguer}>Tableau de bord</NavLink>
        <NavLink to="/admin/produits" style={linkStyle} onClick={onNaviguer}>Produits</NavLink>
        <NavLink to="/admin/commandes" style={linkStyle} onClick={onNaviguer}>Commandes</NavLink>
        <NavLink to="/admin/closers" style={linkStyle} onClick={onNaviguer}>Équipe</NavLink>
        <NavLink to="/admin/pixels" style={linkStyle} onClick={onNaviguer}>Publicité</NavLink>
      </nav>
      <button className="btn-ghost" onClick={handleLogout} style={{ color: 'var(--parchment)', opacity: 0.7, marginTop: 'auto' }}>
        Se déconnecter
      </button>
    </aside>
  );
}