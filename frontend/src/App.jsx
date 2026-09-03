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

const AdminLayout = lazy(() => import('./components/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminClosers = lazy(() => import('./pages/admin/AdminClosers.jsx'));

const CloserLayout = lazy(() => import('./components/CloserLayout.jsx'));
const CloserOrders = lazy(() => import('./pages/closing/CloserOrders.jsx'));

const LivreurLayout = lazy(() => import('./components/LivreurLayout.jsx'));
const LivreurOrders = lazy(() => import('./pages/livraison/LivreurOrders.jsx'));

function ChargementZone() {
  return <div style={{ padding: '3rem', textAlign: 'center' }}>Chargement…</div>;
}

export default function App() {
  return (
    <Routes>
      {/* Vitrine publique */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/produit/:id" element={<ProductDetail />} />
        <Route path="/panier" element={<Cart />} />
        <Route path="/commande" element={<Checkout />} />
        <Route path="/suivi" element={<OrderTracking />} />
      </Route>

      {/* Connexion unique pour toute l'équipe (admin, closer, livreur) */}
      <Route path="/connexion" element={<Login />} />

      {/* Espace admin protégé */}
      <Route element={<RequireRole roles={['admin']} />}>
        <Route path="/admin" element={
          <Suspense fallback={<ChargementZone />}><AdminLayout /></Suspense>
        }>
          <Route index element={<Suspense fallback={<ChargementZone />}><AdminDashboard /></Suspense>} />
          <Route path="produits" element={<Suspense fallback={<ChargementZone />}><AdminProducts /></Suspense>} />
          <Route path="commandes" element={<Suspense fallback={<ChargementZone />}><AdminOrders /></Suspense>} />
          <Route path="closers" element={<Suspense fallback={<ChargementZone />}><AdminClosers /></Suspense>} />
        </Route>
      </Route>

      {/* Espace closing protégé */}
      <Route element={<RequireRole roles={['closer']} />}>
        <Route path="/closing" element={
          <Suspense fallback={<ChargementZone />}><CloserLayout /></Suspense>
        }>
          <Route index element={<Suspense fallback={<ChargementZone />}><CloserOrders /></Suspense>} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={['livreur']} />}>
        <Route path="/livraison" element={
          <Suspense fallback={<ChargementZone />}><LivreurLayout /></Suspense>
        }>
          <Route index element={<Suspense fallback={<ChargementZone />}><LivreurOrders /></Suspense>} />
        </Route>
      </Route>
    </Routes>
  );
}