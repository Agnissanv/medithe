/**
 * Remplace chaque {{MEDIA:NOM}} par le vrai lien Cloudinary de l'image portant ce nom dans la
 * médiathèque — comparaison insensible à la casse/aux espaces.
 *
 * Permet à une IA (ChatGPT ou autre) de générer une fiche produit en inventant elle-même des
 * noms d'images (ex: t1, t2, t3...), de les poser directement dans le code généré
 * (<img src="{{MEDIA:t1}}">), puis de dire au vendeur : "nomme tes images t1.jpg, t2.jpg... et
 * uploade-les". Le vendeur n'a jamais à connaître ni copier un lien Cloudinary — le système les
 * retrouve tout seul par leur nom.
 *
 * @param {string} code
 * @param {Array<{nom: string, url: string}>} medias
 * @returns {{ codeResolu: string, manquants: string[] }}
 */
export function resoudreMediasDansCode(code, medias) {
  const manquants = [];
  const codeResolu = (code || '').replace(/\{\{\s*MEDIA:([^}]+?)\s*\}\}/gi, (correspondance, nomBrut) => {
    const nomRecherche = nomBrut.trim().toLowerCase();
    const media = (medias || []).find((m) => (m.nom || '').trim().toLowerCase() === nomRecherche);
    if (!media) {
      manquants.push(nomBrut.trim());
      return correspondance;
    }
    return media.url;
  });
  return { codeResolu, manquants };
}

// Liste les noms {{MEDIA:NOM}} présents dans une section (utilisé pour un aperçu "en direct" du
// texte, sans modifier le contenu réel) — pratique pour signaler à l'admin ce qui manque encore
// pendant qu'il tape/colle le code, avant même d'enregistrer.
export function listerMediasManquants(code, medias) {
  const noms = [...(code || '').matchAll(/\{\{\s*MEDIA:([^}]+?)\s*\}\}/gi)].map((m) => m[1].trim());
  const disponibles = new Set((medias || []).map((m) => (m.nom || '').trim().toLowerCase()));
  return [...new Set(noms.filter((n) => !disponibles.has(n.toLowerCase())))];
}

// Applique la résolution à toutes les sections "code_personnalise" d'un produit (utilisé à la
// fois pour l'aperçu admin et pour l'enregistrement final — même logique, une seule fois).
export function resoudreMediasDansSections(sections, medias) {
  return (sections || []).map((s) => {
    if (s.type !== 'code_personnalise' || !s.code) return s;
    const { codeResolu } = resoudreMediasDansCode(s.code, medias);
    return { ...s, code: codeResolu };
  });
}
