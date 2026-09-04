import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { trackAddToCart } from '../utils/tracking.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'medithe_panier';

export function CartProvider({ children }) {
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(produit, quantite = 1) {
    trackAddToCart(produit, quantite);
    setItems((prev) => {
      const existant = prev.find((i) => i.id === produit.ID);
      if (existant) {
        return prev.map((i) =>
          i.id === produit.ID ? { ...i, quantite: i.quantite + quantite } : i
        );
      }
      return [
        ...prev,
        {
          id: produit.ID, nom: produit.Nom, prix: produit.Prix, quantite,
          commissionCloser: produit.CommissionCloser || 0,
          commissionLivreur: produit.CommissionLivreur || 0,
        },
      ];
    });
    clearTimeout(toastTimer.current);
    setToast(`${produit.Nom} ajouté au panier`);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function updateQuantite(id, quantite) {
    if (quantite <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantite } : i)));
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  const sousTotal = items.reduce((sum, i) => sum + i.prix * i.quantite, 0);
  const nombreArticles = items.reduce((sum, i) => sum + i.quantite, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantite, removeItem, clearCart, sousTotal, nombreArticles }}
    >
      {children}
      {toast && <div className="toast-panier">✓ {toast}</div>}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans un CartProvider');
  return ctx;
}
