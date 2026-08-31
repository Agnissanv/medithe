import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container footer-grid">
        <div>
          <img src="/brand/logo.png" alt="MédiThé" style={{ height: '48px', marginBottom: '0.8rem' }} />
          <p style={styles.texte}>
            Distributeur officiel et exclusif des thés de soin en Afrique. La santé à chaque gorgée de thé.
          </p>
        </div>

        <div>
          <h4 style={styles.titreColonne}>Liens rapides</h4>
          <Link to="/" style={styles.lien}>Catalogue</Link>
          <Link to="/suivi" style={styles.lien}>Suivre ma commande</Link>
          <Link to="/panier" style={styles.lien}>Mon panier</Link>
        </div>

        <div>
          <h4 style={styles.titreColonne}>Nos engagements</h4>
          <p style={styles.texte}>Paiement à la livraison</p>
          <p style={styles.texte}>Livraison à domicile</p>
          <p style={styles.texte}>Confirmation téléphonique</p>
        </div>
      </div>

      <div className="container" style={styles.copyright}>
        © {new Date().getFullYear()} MédiThé — Tous droits réservés
      </div>
    </footer>
  );
}

const styles = {
  footer: { marginTop: 'auto', background: 'var(--forest)', paddingTop: '2.5rem' },
  texte: { color: 'var(--parchment)', opacity: 0.75, fontSize: '0.88rem', margin: '0.3rem 0' },
  titreColonne: { color: 'var(--parchment)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem' },
  lien: { display: 'block', color: 'var(--parchment)', opacity: 0.75, fontSize: '0.88rem', margin: '0.4rem 0' },
  copyright: {
    borderTop: '1px solid var(--line-dark)', marginTop: '2rem', padding: '1.2rem 1.5rem',
    color: 'var(--parchment)', opacity: 0.6, fontSize: '0.78rem', textAlign: 'center',
  },
};