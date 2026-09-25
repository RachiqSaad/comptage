# Comptage dépôt — application PDA

Application de relevé de présence : l'agent choisit une travée, commence au premier emplacement créé automatiquement, scanne les EAN présents, et valide l'emplacement pour passer au suivant. Aucun champ de quantité n'existe. Un EAN connu affiche son code article et sa désignation ; un EAN inconnu nécessite la photo de son étiquette avant validation.

## Pile

- Next.js / React, interface adaptée aux terminaux PDA et lecteurs de codes-barres qui saisissent les chiffres comme un clavier.
- PostgreSQL Supabase, accès par connexion PostgreSQL depuis les seules fonctions serveur Next.js.
- Vercel Blob pour les photos d'étiquettes.
- Code agent simple, sans Supabase Auth. Chaque code correspond à un seul dépôt.

## Déploiement Vercel

Voir le [guide de déploiement](./DEPLOIEMENT-VERCEL.md) pour les paramètres, variables et vérifications de production.

## Mise en route

1. Créer un projet Supabase, ouvrir **SQL Editor**, puis exécuter le contenu de `db/schema.sql`.
2. Créer un Blob Store Vercel et relier le dépôt de l'application.
3. Dans Vercel, créer un projet à partir du dépôt Git contenant ce dossier. Définir **Root Directory** sur `.` si ce dossier est la racine du dépôt, ou `comptage` si le projet est dans ce sous-dossier.
4. Ajouter les variables d'environnement (Production, Preview si souhaité) :
   - `DATABASE_URL` : chaîne PostgreSQL Supabase avec SSL ; utiliser le pooler Supabase en mode transaction si le runtime serverless le nécessite.
   - `SESSION_SECRET` : secret aléatoire d'au moins 32 caractères.
   - `ADMIN_CODE` : code d'administration initial.
   - `BLOB_READ_WRITE_TOKEN` : ajouté par le Blob Store Vercel.
5. Déployer. Se connecter avec `ADMIN_CODE`, créer les dépôts, travées et agents, puis importer un CSV par dépôt.

## CSV articles

Le CSV doit avoir une ligne d'en-tête avec les colonnes **EAN**, **code article**, **désignation** (les variantes usuelles sont reconnues). Format séparateur virgule, UTF-8. Les zéros en début d'EAN sont conservés si le champ est exporté comme texte.

## PDA

Le champ de scan reste focalisé après chaque lecture. Le scanner du PDA doit être configuré en mode clavier avec la touche **Entrée** après le code-barres. Pour installer l'interface comme raccourci plein écran, ouvrir son URL sur le PDA puis choisir « Ajouter à l'écran d'accueil ».

## Notes de fonctionnement

- La première ouverture d'exercice crée une session de relevé ouverte pour le dépôt. Les articles présents sont uniques par EAN et emplacement dans cet exercice.
- La validation d'un emplacement demande une photo pour chaque EAN inconnu.
- Les accès agents sont limités au dépôt assigné dans les actions serveur. La connexion PostgreSQL est conservée côté serveur et n'est jamais envoyée au navigateur.
- Les codes agents sont stockés en clair conformément au choix demandé. Restreindre fortement l'accès administrateur et les sauvegardes de la base.
- Les photos sont servies par des URL Blob publiques non devinables ; ne pas utiliser ce réglage pour des étiquettes contenant des données confidentielles.
