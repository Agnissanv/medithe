import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, ArrowRight, BadgeCheck, Package, ShoppingBag, FlaskConical,
  Check, ShieldCheck, Sprout, Quote, FileText, Leaf, Award,
  ZoomIn, ExternalLink, ChevronLeft, ChevronRight, Globe, X,
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO.js';

const CERTIFICATS = [
  {
    id: 'iso22000',
    icon: FileText,
    normeCourte: 'Standard ISO 22000:2018',
    organisme: 'Bureau Veritas',
    titre: 'ISO 22000 — Sécurité Alimentaire',
    description: "Garantit que la chaîne d'approvisionnement des plantes sèches respecte scrupuleusement le système d'analyse des dangers et points critiques (HACCP).",
    modalTitre: 'ISO 22000 - Sécurité Alimentaire',
    modalOrganisme: 'Laboratoire Phytomed Europe',
    modalDescription: "Certification internationale attestant du contrôle total de la sécurité des denrées alimentaires à tous les stades de la transformation.",
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'ecocert',
    icon: Leaf,
    normeCourte: 'Ecocert Bio Certified',
    organisme: 'Ecocert Greenlife',
    titre: 'Certification Bio Ecocert',
    description: "Atteste que 100% des ingrédients végétaux récoltés sont cultivés sans engrais chimiques, préservant ainsi la pureté des huiles essentielles naturelles.",
    modalTitre: 'Certification Agriculture Biologique',
    modalOrganisme: 'Ecocert International',
    modalDescription: "Certificat officiel confirmant l'absence totale de pesticides de synthèse, d'herbicides et d'OGM dans la culture de nos plantes.",
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'gmp',
    icon: Award,
    normeCourte: 'GMP / BPF Certificat',
    organisme: 'Health Quality Board',
    titre: 'Conformité GMP / BPF',
    description: "Normes pharmaceutiques relatives au conditionnement hermétique et à la prévention des contaminations croisées lors du processus de mise en sachet.",
    modalTitre: 'Bonnes Pratiques de Fabrication (GMP)',
    modalOrganisme: 'OMS / Normes Pharma',
    modalDescription: "Certification internationale des processus de fabrication garantissant une hygiène absolue et une traçabilité de lot.",
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'phytosanitaire',
    icon: ShieldCheck,
    normeCourte: 'Agrément Phytosanitaire',
    organisme: 'Services Phytosanitaires',
    titre: 'Agrément Phytosanitaire UEMOA',
    description: "Validation officielle de la qualité microbiologique et de l'absence de moisissures ou métaux lourds sur les lots importés et distribués.",
    modalTitre: 'Certificat Phytosanitaire UEMOA',
    modalOrganisme: 'Ministères de la Santé Régionaux',
    modalDescription: "Agrément officiel d'importation et de distribution conforme aux exigences sanitaires inter-états.",
    image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=1000&q=80',
  },
];

const PAYS = [
  { drapeau: '🇨🇮', nom: "Côte d'Ivoire", role: 'Siège Régional & Hub Central', statut: 'actif' },
  { drapeau: '🇸🇳', nom: 'Sénégal', role: 'Bureau de Distribution Dakar', statut: 'actif' },
  { drapeau: '🇬🇳', nom: 'Guinée', role: 'Réseau Partenaire Conakry', statut: 'actif' },
  { drapeau: '🇧🇯', nom: 'Bénin', role: 'Point de Chute Cotonou', statut: 'actif' },
  { drapeau: '🇲🇱', nom: 'Mali', role: 'Antenne Régionale Bamako', statut: 'actif' },
  { drapeau: '🇧🇫', nom: 'Burkina Faso', role: 'Lancement très prochainement', statut: 'bientot' },
];

const STATS = [
  { cible: 50000, prefixe: '+', suffixe: '', label: 'Clients Satisfaits' },
  { cible: 6, prefixe: '', suffixe: '+', label: 'Pays en Afrique' },
  { cible: 100, prefixe: '', suffixe: '%', label: 'Ingrédients Naturels' },
  { cible: 98, prefixe: '', suffixe: '%', label: 'Taux de Recommandation' },
];

export default function About() {
  useSEO({
    title: 'À Propos',
    description: "MédiThé, distributeur officiel de thés de soin 100% naturels en Afrique de l'Ouest — notre histoire, nos certifications et notre réseau.",
  });

  const [certifOuvert, setCertifOuvert] = useState(null);
  const carouselRef = useRef(null);

  function defiler(sens) {
    carouselRef.current?.scrollBy({ left: sens * 360, behavior: 'smooth' });
  }

  return (
    <div>
      {/* HERO */}
      <section className="apropos-hero">
        <div className="container apropos-hero-grid">
          <div className="apropos-hero-visuel">
            <img
              src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=80"
              alt="Thés de soin naturels MédiThé"
              className="apropos-hero-img"
            />
            <div className="apropos-hero-badges">
              <div className="apropos-badge-flottant">
                <span className="apropos-badge-icone"><Leaf size={20} /></span>
                <div>
                  <p className="apropos-badge-label">Qualité Supérieure</p>
                  <p className="apropos-badge-valeur">100% Plantes Naturelles</p>
                </div>
              </div>
              <div className="apropos-badge-flottant apropos-badge-flottant--sombre">
                <span className="apropos-badge-chiffre">100%</span>
                <span className="apropos-badge-mini">Agréé & Testé</span>
              </div>
            </div>
          </div>

          <div className="apropos-hero-texte">
            <span className="eyebrow apropos-pastille"><CheckCircle size={14} /> Pionniers du bien-être naturel en Afrique</span>
            <h1>La santé et la pureté végétale au cœur de notre engagement</h1>
            <p>
              Chez <strong style={{ color: 'var(--forest)' }}>MédiThé</strong>, nous sélectionnons rigoureusement des remèdes à base d'herbes et de plantes médicinales bienfaisantes. Nos thés de soin sont formulés pour soutenir votre corps au quotidien : système prostatique, rénal, digestif, articulations et vitalité globale.
            </p>
            <p className="apropos-citation">
              « Redonner à la nature son rôle fondamental dans la médecine douce moderne et offrir à chaque foyer africain des produits d'une efficacité irréprochable. »
            </p>
            <div className="apropos-cta-ligne">
              <Link to="/" className="btn btn-primary">
                <span>Découvrez nos produits</span>
                <ArrowRight size={16} />
              </Link>
              <a href="#certificats" className="btn btn-outline">
                <BadgeCheck size={16} />
                <span>Voir nos certificats</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3 PILIERS */}
      <section className="apropos-section">
        <div className="container">
          <div className="apropos-entete">
            <span className="eyebrow">Structure & Modèle d'Affaires</span>
            <h2>Nos domaines d'intervention</h2>
            <p>Un écosystème global conçu pour répondre aux besoins des professionnels, des particuliers et des porteurs de projets.</p>
          </div>

          <div className="apropos-piliers-grid">
            <Pilier
              icon={Package}
              numero="01. Service B2B"
              titre="Distributeur de Gros"
              description="Approvisionnement à grande échelle pour les pharmacies, officines, cabinets diététiques et grands revendeurs régionaux. Profitez de tarifs dégressifs d'usine et d'un stock garanti toute l'année."
              points={['Conditionnements par cartons & palettes', 'Tarifications réservées aux grossistes', 'Logistique express transfrontalière']}
            />
            <Pilier
              highlight
              badge="Grand Public"
              icon={ShoppingBag}
              numero="02. Service B2C"
              titre="Distributeur de Détail"
              description="Vente directe aux consommateurs avec un service d'assistance personnalisé. Nous assurons la livraison rapide à domicile et la commodité du paiement comptant uniquement à la réception."
              points={['Paiement sécurisé à la livraison', 'Suivi téléphonique de chaque commande', "Conseils d'utilisation personnalisés"]}
            />
            <Pilier
              icon={FlaskConical}
              numero="03. Service OEM / Label Privé"
              titre="Créateur de Marque"
              description="Solution clé-en-main pour entrepreneurs et marques. Nous prenons en charge la formulation sur-mesure, le packaging, le conditionnement hermétique et l'obtention des certificats d'analyse."
              points={['Formulations personnalisées aux normes', 'Design & packaging haute qualité', 'Délais de production optimisés']}
            />
          </div>
        </div>
      </section>

      {/* HISTOIRE */}
      <section className="apropos-section apropos-section--alt">
        <div className="container apropos-histoire-grid">
          <div>
            <span className="eyebrow" style={{ display: 'inline-block', borderBottom: '2px solid var(--copper)', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}>
              Origines & Valeurs
            </span>
            <h2>Une passion pour la phytothérapie au service du quotidien africain</h2>
            <div className="apropos-histoire-texte">
              <p>L'histoire de <strong>MédiThé</strong> est née d'un constat simple : la richesse de la pharmacopée traditionnelle alliée à la rigueur des exigences de santé modernes peut transformer durablement la santé de nos communautés.</p>
              <p>Face au stress quotidien, à la détérioration de l'alimentation urbaine et aux désagréments de santé récurrents (problèmes prostatiques, faiblesses rénales, digestion difficile, douleurs articulaires), nous avons mis au point des mélanges de thés de soin 100% naturels, faciles à consommer et d'une pureté absolue.</p>
              <p>Chaque plante entrant dans nos compositions fait l'objet d'un contrôle strict : du séchage à température contrôlée jusqu'à la mise en infusettes individuelles étanches pour préserver toutes les vertus des principes actifs.</p>
            </div>
            <div className="apropos-feature-grid">
              <div className="apropos-feature-item">
                <ShieldCheck size={20} color="var(--sage)" />
                <div>
                  <h4>Transparence Totale</h4>
                  <p>Aucun additif chimique, aucun arôme artificiel ni conservateur.</p>
                </div>
              </div>
              <div className="apropos-feature-item">
                <Sprout size={20} color="var(--sage)" />
                <div>
                  <h4>Culture Éthique</h4>
                  <p>Partenariats durables avec des producteurs agricoles certifiés.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="apropos-histoire-visuel">
            <img
              src="https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80"
              alt="Sélection des plantes médicinales"
              className="apropos-histoire-img"
            />
            <div className="apropos-citation-carte">
              <Quote size={22} color="var(--copper)" />
              <p>« Un corps sain dans un esprit apaisé, grâce à la simplicité des feuilles et des fleurs médicinales. »</p>
              <span>— Le Comité Scientifique MédiThé</span>
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATS */}
      <section id="certificats" className="apropos-section">
        <div className="container">
          <div className="apropos-entete-inline">
            <div>
              <span className="eyebrow"><Award size={13} style={{ verticalAlign: '-2px', marginRight: '0.3em' }} />Sécurité & Normes Internationales</span>
              <h2>Les certificats de nos fournisseurs</h2>
              <p style={{ maxWidth: '620px' }}>Pour vous garantir des produits irréprochables, l'ensemble de nos partenaires et laboratoires d'extraction disposent des plus hautes accréditations sanitaires et environnementales.</p>
            </div>
            <div className="apropos-carousel-nav">
              <button type="button" className="apropos-nav-btn" onClick={() => defiler(-1)} aria-label="Précédent"><ChevronLeft size={18} /></button>
              <button type="button" className="apropos-nav-btn" onClick={() => defiler(1)} aria-label="Suivant"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="apropos-carousel" ref={carouselRef}>
            {CERTIFICATS.map((c) => (
              <div key={c.id} className="apropos-cert-carte">
                <div>
                  <div className="apropos-cert-vignette" onClick={() => setCertifOuvert(c)}>
                    <c.icon size={40} color="var(--forest)" />
                    <span>{c.normeCourte}</span>
                    <div className="apropos-cert-survol">
                      <span className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.5em 1em' }}>
                        <ZoomIn size={14} /> Prévisualiser
                      </span>
                    </div>
                  </div>
                  <span className="eyebrow" style={{ display: 'block', marginBottom: '0.3rem' }}>Organisme : {c.organisme}</span>
                  <h3>{c.titre}</h3>
                  <p className="apropos-cert-desc">{c.description}</p>
                </div>
                <button type="button" className="btn-outline btn apropos-cert-bouton" onClick={() => setCertifOuvert(c)}>
                  <span>Voir le document</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS + PRESENCE */}
      <section className="apropos-section-sombre">
        <div className="container">
          <StatsRow />

          <div style={{ paddingTop: '3rem' }}>
            <div className="apropos-entete apropos-entete--sombre">
              <span className="eyebrow">Expansion Continentale</span>
              <h2 style={{ color: 'var(--parchment)' }}>Notre réseau de distribution en Afrique</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Grâce à nos hubs logistiques stratégiques, nous assurons une disponibilité rapide et des livraisons de proximité.</p>
            </div>

            <div className="apropos-pays-grid">
              {PAYS.map((p) => (
                <div key={p.nom} className="apropos-pays-carte">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>{p.drapeau}</span>
                    <div>
                      <h4>{p.nom}</h4>
                      <p>{p.role}</p>
                    </div>
                  </div>
                  <span className={`apropos-statut-badge ${p.statut === 'bientot' ? 'apropos-statut-badge--bientot' : ''}`}>
                    {p.statut === 'bientot' ? 'Bientôt' : 'Actif'}
                  </span>
                </div>
              ))}
            </div>

            <div className="apropos-note-expansion">
              <Globe size={16} color="var(--copper)" />
              <span>Et déploiement progressif dans d'autres pays d'Afrique de l'Ouest et Centrale.</span>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL CERTIFICAT */}
      {certifOuvert && (
        <div className="apropos-modal-fond" onClick={() => setCertifOuvert(null)}>
          <div className="apropos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apropos-modal-entete">
              <span><BadgeCheck size={18} color="var(--copper)" /> {certifOuvert.modalTitre}</span>
              <button type="button" onClick={() => setCertifOuvert(null)} aria-label="Fermer"><X size={18} /></button>
            </div>
            <div className="apropos-modal-corps">
              <img src={certifOuvert.image} alt={certifOuvert.modalTitre} />
              <span className="eyebrow">{certifOuvert.modalOrganisme}</span>
              <p>{certifOuvert.modalDescription}</p>
            </div>
            <div className="apropos-modal-pied">
              <button type="button" className="btn btn-primary" onClick={() => setCertifOuvert(null)}>Fermer la vue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pilier({ icon: Icon, numero, titre, description, points, highlight, badge }) {
  return (
    <div className={`apropos-pilier ${highlight ? 'apropos-pilier--highlight' : ''}`}>
      {badge && <span className="apropos-pilier-badge">{badge}</span>}
      <div className="apropos-pilier-icone"><Icon size={22} /></div>
      <span className="eyebrow">{numero}</span>
      <h3 style={{ fontSize: '1.3rem', marginTop: '0.2rem' }}>{titre}</h3>
      <p className="apropos-pilier-desc">{description}</p>
      <ul className="apropos-pilier-liste">
        {points.map((pt) => (
          <li key={pt}><Check size={14} color="var(--sage)" /> {pt}</li>
        ))}
      </ul>
    </div>
  );
}

function StatsRow() {
  const ref = useRef(null);
  const [valeurs, setValeurs] = useState(STATS.map(() => 0));
  const lance = useRef(false);

  useEffect(() => {
    const observateur = new IntersectionObserver(([entree]) => {
      if (entree.isIntersecting && !lance.current) {
        lance.current = true;
        STATS.forEach((s, i) => {
          const duree = 1600;
          const debut = performance.now();
          function etape(maintenant) {
            const t = Math.min(1, (maintenant - debut) / duree);
            setValeurs((v) => {
              const suivant = [...v];
              suivant[i] = Math.ceil(t * s.cible);
              return suivant;
            });
            if (t < 1) requestAnimationFrame(etape);
          }
          requestAnimationFrame(etape);
        });
      }
    }, { threshold: 0.3 });
    if (ref.current) observateur.observe(ref.current);
    return () => observateur.disconnect();
  }, []);

  return (
    <div className="apropos-stats-grid" ref={ref}>
      {STATS.map((s, i) => (
        <div key={s.label} className="apropos-stat-carte">
          <span className="apropos-stat-valeur">{s.prefixe}{valeurs[i].toLocaleString('fr-FR')}{s.suffixe}</span>
          <span className="apropos-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}