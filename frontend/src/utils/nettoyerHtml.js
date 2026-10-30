import DOMPurify from 'dompurify';

// Le contenu riche des fiches est saisi dans l'admin puis affiché tel quel sur le site public.
// On garde la mise en page, on retire tout ce qui peut exécuter du code (onerror, javascript:, <script>…) :
// un compte admin piraté ne doit pas pouvoir piéger les visiteurs.
const OPTIONS = { ADD_ATTR: ['target'] };

export const nettoyerHtml = (html) => DOMPurify.sanitize(html || '', OPTIONS);

// Blocs « code personnalisé » : même nettoyage, mais les balises <style> restent, elles portent le design du bloc.
// FORCE_BODY : sans lui, un <style> placé en tête du bloc serait perdu.
export const nettoyerCodePersonnalise = (html) => DOMPurify.sanitize(html || '', { ...OPTIONS, ADD_TAGS: ['style'], FORCE_BODY: true });
