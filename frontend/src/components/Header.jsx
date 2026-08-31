import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { nombreArticles } = useCart();
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <>
      <div style={styles.annonce}>
        Livraison à domicile • Paiement à la livraison • Distributeur officiel en Afrique
      </div>
      <header style={styles.header}>
        <div className="container" style={styles.inner}>
          <Link to="/" style={styles.logo} onClick={() => setMenuOuvert(false)}>
            <img src="/brand/logo-circle.png" alt="MédiThé" style={styles.logoImg} />
            MédiThé
          </Link>

          <nav className="header-nav-desktop" style={styles.nav}>
            <Link to="/" style={styles.navLink}>Catalogue</Link>
            <Link to="/suivi" style={styles.navLink}>Suivre ma commande</Link>
          </nav>

          <div style={styles.actionsDroite}>
            <Link to="/panier" style={styles.cartLink} aria-label="Voir le panier" onClick={() => setMenuOuvert(false)}>
              <ShoppingCart size={19} />
              <span>Panier</span>
              {nombreArticles > 0 && <span style={styles.badge}>{nombreArticles}</span>}
            </Link>

            <button
              type="button"
              className="header-hamburger"
              onClick={() => setMenuOuvert((v) => !v)}
              aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
              style={styles.hamburgerBtn}
            >
              {menuOuvert ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {menuOuvert && (
          <nav className="header-nav-mobile">
            <Link to="/" style={styles.navLinkMobile} onClick={() => setMenuOuvert(false)}>Catalogue</Link>
            <Link to="/suivi" style={styles.navLinkMobile} onClick={() => setMenuOuvert(false)}>Suivre ma commande</Link>
          </nav>
        )}
      </header>
    </>
  );
}

const styles = {
  annonce: {
    background: 'var(--copper)',
    color: 'var(--forest)',
    textAlign: 'center',
    fontSize: 'clamp(0.68rem, 2.5vw, 0.78rem)',
    fontWeight: 600,
    padding: '0.45rem 1rem',
    letterSpacing: '0.02em',
    lineHeight: 1.4,
  },
  header: {
    background: 'var(--forest)',
    borderBottom: '1px solid var(--line-dark)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '68px',
    gap: '0.75rem',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
    fontWeight: 600,
    color: 'var(--parchment)',
    letterSpacing: '0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5em',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  logoImg: { height: '36px', width: '36px', objectFit: 'contain', flexShrink: 0 },
  nav: {
    display: 'flex',
    gap: '1.8rem',
  },
  navLink: {
    color: 'var(--parchment)',
    fontSize: '0.9rem',
    opacity: 0.85,
  },
  navLinkMobile: {
    display: 'block',
    color: 'var(--parchment)',
    fontSize: '0.95rem',
    padding: '0.9rem 1.5rem',
    borderTop: '1px solid var(--line-dark)',
  },
  actionsDroite: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
    flexShrink: 0,
  },
  cartLink: {
    color: 'var(--parchment)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4em',
    whiteSpace: 'nowrap',
  },
  badge: {
    background: 'var(--copper)',
    color: 'var(--forest)',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.72rem',
    fontWeight: 600,
  },
  hamburgerBtn: {
    display: 'none',
    background: 'transparent',
    color: 'var(--parchment)',
    padding: '0.3rem',
  },
};