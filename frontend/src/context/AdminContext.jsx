import React, { createContext, useContext, useState } from 'react';
import { api } from '../api/supabaseApi.js';

const AdminContext = createContext(null);
const TOKEN_KEY = 'medithe_admin_token';

export function AdminProvider({ children }) {
  const [ setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  async function login(password) {
    const res = await api.adminLogin(password); // lève une erreur si mot de passe incorrect
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return (
    <AdminContext.Provider value={{ isAuthenticated: !! login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin doit être utilisé dans un AdminProvider');
  return ctx;
}
