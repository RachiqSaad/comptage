# Déploiement Vercel

## Configuration du projet

- Framework : **Next.js** (détecté via [vercel.json](./vercel.json)).
- Node.js : **22.x** ; gestionnaire : **pnpm 11.19.0**, fixé dans [package.json](./package.json).
- Activer **Corepack** avec la variable Vercel `ENABLE_EXPERIMENTAL_COREPACK=1` pour utiliser cette version de pnpm.
- Build : `pnpm build`. Garder les paramètres d’installation et de sortie automatiques.
- Activer **Fluid compute** ; les actions administrateur déclarent une durée maximale de 300 secondes.
- Root Directory : `.` si ce dossier est la racine du dépôt ; `comptage` uniquement si le dépôt contient ce sous-dossier.
- Publier les sources et [pnpm-lock.yaml](./pnpm-lock.yaml). Ne pas publier [.env.local](./.env.local), les dépendances ou les fichiers de compilation.

Le dossier local n’est pas encore un dépôt Git. Deux possibilités : créer un dépôt privé puis l’importer dans Vercel, ou utiliser la CLI depuis ce dossier (`pnpm dlx vercel`, puis `pnpm dlx vercel --prod` après validation de la prévisualisation).

## Variables Vercel

Dans **Project Settings → Environment Variables**, définir les valeurs pour Production. Les exemples de [.env.example](./.env.example) doivent être remplacés.

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | Supabase → Connect → Transaction pooler, port 6543, avec le mot de passe PostgreSQL encodé dans l’URI. |
| `SESSION_SECRET` | Secret aléatoire d’au moins 32 caractères, conservé entre déploiements. |
| `ADMIN_CODE` | Code d’accès administrateur. |
| `BLOB_READ_WRITE_TOKEN` | Jeton d’un Vercel Blob Store **public** relié au projet. Obligatoire pour les photos d’étiquettes. |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` pour respecter la version de pnpm du projet. |

Générer un secret si nécessaire : `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

Ne pas préfixer ces secrets par `NEXT_PUBLIC_`. Les clés API publiques Supabase ne sont pas utilisées par l’application. Les modifications des variables nécessitent un nouveau déploiement.

Pour Preview, utiliser de préférence une base et un stockage de test : les scans, imports et validations modifient réellement la base configurée.

## Base et photos

La base Supabase actuelle a déjà été initialisée. Pour une nouvelle base, exécuter [db/schema.sql](./db/schema.sql) dans le SQL Editor avant utilisation. Le build ne crée ni ne modifie les tables.

Dans Vercel Storage, créer ou relier un **Blob Store public**, puis associer son jeton à l’environnement Production. Les photos utilisent des URL publiques : ce choix doit correspondre au contenu des étiquettes.

## Taille des fichiers

L’interface limite les CSV et photos à **4 Mo**, afin de rester sous la limite de requête Vercel de 4,5 Mo avec les données du formulaire. Le réglage Next.js de 20 Mo ne contourne pas cette limite Vercel.

Diviser les gros CSV en plusieurs fichiers, chacun avec `EAN;code article;désignation` en première ligne. Réduire la taille des photos avant envoi. Un import reste transactionnel : une erreur annule les modifications de cet import.

## Vérification après déploiement

1. Ouvrir `/admin/login` et vérifier la connexion administrateur.
2. Vérifier les dépôts et articles existants ; importer un petit CSV de test dans un dépôt de test si nécessaire.
3. Ouvrir `/login` et vérifier la connexion agent.
4. Sur un dépôt de test, scanner un EAN connu, puis un inconnu et envoyer une photo.
5. Vérifier la validation d’un emplacement, l’export CSV et la déconnexion.
6. Sur le PDA, utiliser l’URL HTTPS Vercel ; régler le lecteur en mode clavier avec Entrée ou Tabulation.

## Références

- [Limites des fonctions Vercel](https://vercel.com/docs/functions/limitations)
- [Gestionnaires de paquets Vercel](https://vercel.com/docs/package-managers)
- [Variables d’environnement Vercel](https://vercel.com/docs/environment-variables)
