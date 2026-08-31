import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';
import AdminSidebar from './AdminSidebar.jsx';

export default function AdminLayout() {
  const { isAuthenticated } = useAdmin();

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--parchment)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem 2.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
