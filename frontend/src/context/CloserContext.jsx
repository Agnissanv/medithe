import React, { createContext, useContext, useState } from 'react';
import { api } from '../api/sheetsApi.js';

const CloserContext = createContext(null);
const TOKEN_KEY = 'medithe_closer_token';

export function CloserProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  async function login(password) {
    const res = await api.closerLogin(password);
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return (
    <CloserContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </CloserContext.Provider>
  );
}

export function useCloser() {
  const ctx = useContext(CloserContext);
  if (!ctx) throw new Error('useCloser doit être utilisé dans un CloserProvider');
  return ctx;
}