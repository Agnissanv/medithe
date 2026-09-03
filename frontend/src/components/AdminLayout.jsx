import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--parchment)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem 2.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
}