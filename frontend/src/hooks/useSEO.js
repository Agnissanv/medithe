import { useEffect } from 'react';

export function useSEO({ title, description, jsonLd }) {
  useEffect(() => {
    if (title) document.title = `${title} — MEDITHE`;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }

    let script = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => { if (script) document.head.removeChild(script); };
  }, [title, description, jsonLd]);
}