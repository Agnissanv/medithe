import React, { useState } from 'react';
import { getVideoEmbedUrl } from '../utils/videoEmbed.js';
import { optimiserImageCloudinary } from '../utils/cloudinaryOptimize.js';

export default function ProductGallery({ images = [], videoUrl, nom }) {
  const embedUrl = getVideoEmbedUrl(videoUrl);
  const slides = [
    ...images.map((src) => ({ type: 'image', src })),
    ...(embedUrl ? [{ type: 'video', src: embedUrl }] : []),
  ];
  const [actif, setActif] = useState(0);

  if (slides.length === 0) {
    return (
      <div style={styles.principal}>
        <span style={{ fontSize: '3rem', color: 'var(--sage)' }}>◈</span>
      </div>
    );
  }

  const slide = slides[actif];

  return (
    <div>
      <div style={styles.principal}>
        {slide.type === 'image' ? (
          <img
            src={optimiserImageCloudinary(slide.src)}
            alt={nom}
            style={styles.image}
            fetchPriority="high"
          />
        ) : (
          <iframe
            src={slide.src}
            title={`Vidéo — ${nom}`}
            style={styles.video}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {slides.length > 1 && (
        <div style={styles.miniatures}>
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setActif(i)}
              style={{ ...styles.miniature, borderColor: i === actif ? 'var(--copper)' : 'var(--line)' }}
              aria-label={s.type === 'video' ? 'Voir la vidéo' : `Voir l'image ${i + 1}`}
            >
              {s.type === 'image' ? (
                <img src={s.src} alt="" style={styles.miniatureImg} />
              ) : (
                <span style={styles.miniatureVideo}>▶</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  principal: {
    aspectRatio: '4 / 3', background: 'var(--sage-light)', borderRadius: 'var(--radius)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  video: { width: '100%', height: '100%', border: 'none' },
  miniatures: {
    display: 'flex', gap: '0.6rem', marginTop: '0.6rem',
    overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px',
  },
  miniature: {
    width: '64px', height: '64px', borderRadius: 'var(--radius)', overflow: 'hidden',
    border: '2px solid var(--line)', padding: 0, background: 'var(--sage-light)', flexShrink: 0,
  },
  miniatureImg: { width: '100%', height: '100%', objectFit: 'cover' },
  miniatureVideo: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.2rem', color: 'var(--forest)' },
};