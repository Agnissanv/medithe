import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import Login from './pages/Login.jsx';
import RequireRole from './components/RequireRole.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderTracking from './pages/OrderTracking.jsx';

// Chargées uniquement quand quelqu'un visite réellement l'admin ou le closing —
// jamais téléchargées par un visiteur de la boutique publique.
const AdminLayout = lazy(() => import('./components/AdminLayout.jsx'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminClosers = lazy(() => import('./pages/admin/AdminClosers.jsx'));

const CloserLogin = lazy(() => import('./pages/closing/CloserLogin.jsx'));
const CloserLayout = lazy(() => import('./components/CloserLayout.jsx'));
const CloserOrders = lazy(() => import('./pages/closing/CloserOrders.jsx'));

function ChargementZone() {
  return <div style={{ padding: '3rem', textAlign: 'center' }}>Chargement…</div>;
}

export default function App() {
  return (
    <Routes>
      {/* Vitrine publique — chargée immédiatement, sans rien d'admin dedans */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/produit/:id" element={<ProductDetail />} />
        <Route path="/panier" element={<Cart />} />
        <Route path="/commande" element={<Checkout />} />
        <Route path="/suivi" element={<OrderTracking />} />
      </Route>

      {/* Authentification admin */}
      <Route path="/admin/login" element={
        <Suspense fallback={<ChargementZone />}><AdminLogin /></Suspense>
      } />

      {/* Espace admin protégé — code téléchargé uniquement à la visite */}
      <Route path="/admin" element={
        <Suspense fallback={<ChargementZone />}><AdminLayout /></Suspense>
      }>
        <Route index element={<Suspense fallback={<ChargementZone />}><AdminDashboard /></Suspense>} />
        <Route path="produits" element={<Suspense fallback={<ChargementZone />}><AdminProducts /></Suspense>} />
        <Route path="commandes" element={<Suspense fallback={<ChargementZone />}><AdminOrders /></Suspense>} />
        <Route path="closers" element={<Suspense fallback={<ChargementZone />}><AdminClosers /></Suspense>} />
      </Route>

      {/* Espace closing (closers) */}
      <Route path="/closing/login" element={
        <Suspense fallback={<ChargementZone />}><CloserLogin /></Suspense>
      } />
      <Route path="/closing" element={
        <Suspense fallback={<ChargementZone />}><CloserLayout /></Suspense>
      }>
        <Route index element={<Suspense fallback={<ChargementZone />}><CloserOrders /></Suspense>} />
      </Route>
    </Routes>
  );
}