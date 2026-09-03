import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar.jsx';

export default function AdminLayout() {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="admin-shell">
      <header className="admin-topbar-mobile">
        <span className="admin-topbar-logo">◈ MédiThé <span className="eyebrow" style={{ color: 'var(--sage)' }}>admin</span></span>
        <button type="button" className="admin-hamburger" onClick={() => setMenuOuvert((v) => !v)} aria-label="Ouvrir le menu">
          {menuOuvert ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {menuOuvert && <div className="admin-overlay" onClick={() => setMenuOuvert(false)} />}

      <div className={`admin-sidebar-wrap ${menuOuvert ? 'admin-sidebar-ouvert' : ''}`}>
        <AdminSidebar onNaviguer={() => setMenuOuvert(false)} />
      </div>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}