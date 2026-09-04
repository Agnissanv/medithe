import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { trackPageView } from '../utils/tracking.js';

export default function PublicLayout() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
    trackPageView();
  }, [location.pathname]);

  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
