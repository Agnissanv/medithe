import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireRole({ roles }) {
  const { session, profil, chargement } = useAuth();

  if (chargement) return <div style={{ padding: '3rem', textAlign: 'center' }}>Chargement…</div>;
  if (!session || !profil) return <Navigate to="/connexion" replace />;
  if (!roles.includes(profil.role)) return <Navigate to="/connexion" replace />;

  return <Outlet />;
}