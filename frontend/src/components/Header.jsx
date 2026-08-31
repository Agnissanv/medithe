import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { nombreArticles } = useCart();

  return (
    <>
      <div style={styles.annonce}>
        Livraison à domicile • Paiement à la livraison • Distributeur officiel en Afrique
      </div>
      <header style={styles.header}>
        <div className="container" style={styles.inner}>
          <Link to="/" style={styles.logo}>
            <img src="/brand/logo-circle.png" alt="MédiThé" style={styles.logoImg} />
            MédiThé
          </Link>

          <nav style={styles.nav}>
            <Link to="/" style={styles.navLink}>Catalogue</Link>
            <Link to="/suivi" style={styles.navLink}>Suivre ma commande</Link>
          </nav>

          <Link to="/panier" style={styles.cartLink} aria-label="Voir le panier">
            Panier
            {nombreArticles > 0 && <span style={styles.badge}>{nombreArticles}</span>}
          </Link>
        </div>
      </header>
    </>
  );
}

const styles = {
  annonce: {
    background: 'var(--copper)',
    color: 'var(--forest)',
    textAlign: 'center',
    fontSize: '0.78rem',
    fontWeight: 600,
    padding: '0.45rem 1rem',
    letterSpacing: '0.02em',
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
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--parchment)',
    letterSpacing: '0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5em',
  },
  logoImg: { height: '38px', width: '38px', objectFit: 'contain' },
  nav: {
    display: 'flex',
    gap: '1.8rem',
  },
  navLink: {
    color: 'var(--parchment)',
    fontSize: '0.9rem',
    opacity: 0.85,
  },
  cartLink: {
    color: 'var(--parchment)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4em',
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
};