/**
 * Retire les paragraphes vides que l'éditeur de texte riche (Quill) laisse
 * en début/fin de contenu (souvent en appuyant sur Entrée avant de quitter le champ),
 * qui créent des espaces vides visibles à l'affichage.
 */
export function nettoyerTexteRiche(html) {
  if (!html) return html;
  return html
    .replace(/^(\s*<p><br\s*\/?><\/p>\s*)+/gi, '')
    .replace(/(\s*<p><br\s*\/?><\/p>\s*)+$/gi, '')
    .trim();
}