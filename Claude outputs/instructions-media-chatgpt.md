# Système `{{MEDIA:NOM}}` — déjà implémenté sur LOOHOO/MédiThé

Le système que tu proposais est **déjà en place sur la plateforme**, exactement selon le principe que tu décris. Voici comment il fonctionne réellement, pour que tu l'utilises correctement à partir de maintenant.

## Syntaxe à utiliser dans le code généré

```html
<img src="{{MEDIA:NOM}}" alt="...">
```

où `NOM` est un identifiant que tu inventes toi-même (ex. `GO1`, `GO2`, `GO3`...).

## Comment la résolution fonctionne

- Le système ne se base **jamais** sur le nom réel du fichier Cloudinary (peu importe qu'il devienne `go1-azjg.jpg` ou autre chose après upload).
- Il se base uniquement sur le champ **Nom** affiché dans la Médiathèque de l'admin.
- Quand le vendeur uploade une image et lui donne le nom `GO1` dans ce champ, puis enregistre la fiche produit, chaque `{{MEDIA:GO1}}` présent dans le code est automatiquement remplacé par le vrai lien Cloudinary de cette image — avant même que la page ne soit visible publiquement (la résolution se fait à l'enregistrement côté admin, pas à chaque visite du site).
- La comparaison est insensible à la casse et aux espaces.

## Ce que ça change pour toi

- N'utilise plus jamais d'URL Cloudinary construite ou devinée.
- Ne demande jamais le nom du cloud Cloudinary, ni le nom du produit utilisé à l'upload, ni le nom réel du fichier — aucune de ces informations n'est nécessaire.
- Pas besoin du code source de la plateforme pour ça : la fonctionnalité existe déjà et fonctionne.

## Règle permanente à appliquer pour toute fiche produit

Utilise exclusivement `{{MEDIA:NOM}}` pour chaque image, choisis des noms courts et clairs (`GO1`, `GO2`...), et indique-les au vendeur pour qu'il nomme ses images pareil dans la Médiathèque au moment de les uploader. C'est tout ce qu'il a à faire ensuite — aucun lien à copier, aucune étape supplémentaire.
