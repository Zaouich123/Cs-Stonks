# CI/CD Cs-Stonks

Ce document decrit la base CI/CD ajoutee pour le sprint 10. Elle est adaptee au
repo actuel : Next.js 15, React 19, TypeScript strict, npm, Prisma, PostgreSQL,
Vitest et providers marketplace.

## Decisions detectees dans le repo

- Package manager : `npm`, car `package-lock.json` est present.
- Node.js : aucune `.nvmrc` ni `engines.node`; la CI utilise Node `20`, LTS
  stable compatible avec Next.js 15 et les types Node deja utilises.
- Tests : `vitest run` via `npm run test`.
- Lint : `eslint .` via `npm run lint`.
- Typecheck : `tsc --noEmit` via `npm run typecheck`.
- Prisma : schema PostgreSQL dans `prisma/schema.prisma`, migrations presentes
  dans `prisma/migrations`.
- Base CI : PostgreSQL 16 lance comme service GitHub Actions.

## Workflows

### `.github/workflows/ci.yml`

Declencheurs :

- pull request vers `develop`
- pull request vers `main`
- push vers `develop`
- push vers `main`

Job principal : `quality`.

Etapes :

- checkout du repo
- setup Node 20 avec cache npm
- `npm ci`
- `npm run prisma:generate`
- `npm run prisma:validate`
- `npm run prisma:migrate:deploy` sur une base PostgreSQL de test
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

La CI n'utilise jamais la base de production. Elle cree une base
`cs_stonks_test` dans un service PostgreSQL GitHub Actions.

### `.github/workflows/deploy-preview.yml`

Declencheurs :

- pull request vers `develop`
- pull request vers `main`

Objectif : preparer un deploiement preview Vercel.

Le workflow est volontairement optionnel. Si les secrets Vercel ne sont pas
configures, il affiche un message et ne deploie rien.

Secrets requis pour activer le preview :

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### `.github/workflows/deploy-production.yml`

Declencheurs :

- push sur `main`
- lancement manuel via `workflow_dispatch`

Objectif : preparer le deploiement production Vercel.

Le workflow utilise l'environnement GitHub `production`. Il est recommande de
configurer une validation manuelle sur cet environnement dans GitHub.

Le workflow peut appliquer les migrations avec :

```bash
npm run prisma:migrate:deploy
```

Cette etape ne tourne que si `DATABASE_URL` est disponible depuis les secrets
GitHub. Le workflow ne contient aucune URL de production hardcodee.

## Dependabot

Le fichier `.github/dependabot.yml` configure des mises a jour hebdomadaires
pour :

- GitHub Actions
- dependances npm

Le nombre de PR ouvertes est limite pour eviter le bruit. Les dependances Next.js
et Prisma sont groupees.

## Scripts npm utiles

La CI depend des scripts suivants :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate:deploy
```

## Secrets GitHub

Configurer les secrets dans :

```text
GitHub Repository Settings -> Secrets and variables -> Actions
```

Secrets principaux selon l'environnement :

- `DATABASE_URL` : base PostgreSQL de production ou preview.
- `DIRECT_URL` : optionnel, utile si l'hebergeur DB fournit une URL directe.
- `SESSION_SECRET` : secret long pour signer les sessions applicatives.
- `APP_URL` : URL publique de l'application.
- `STEAM_WEB_API_KEY` : lecture du profil Steam apres OpenID.
- `CSFLOAT_API_KEY` : sync CSFloat.
- `VERCEL_TOKEN` : token Vercel pour deploy GitHub Actions.
- `VERCEL_ORG_ID` : organisation Vercel.
- `VERCEL_PROJECT_ID` : projet Vercel.

Variables actuellement publiques ou non sensibles possibles :

- `NEXT_PUBLIC_USD_EUR_RATE`
- `CATALOG_PROVIDER`
- `PRICE_PROVIDER`
- `ENABLE_INTERNAL_CRON`
- `SNAPSHOT_TIMEZONE`

Secrets a ne jamais commiter :

- `.env`
- cles Steam
- cles CSFloat
- URL de base de production
- token Vercel

## Variables CI safe

Le workflow CI utilise uniquement des valeurs de test :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cs_stonks_test?schema=public
APP_URL=http://localhost:3000
SESSION_SECRET=ci-session-secret
STEAM_WEB_API_KEY=ci-steam-web-api-key
CSFLOAT_API_KEY=ci-csfloat-api-key
PRICE_PROVIDER=json
ENABLE_INTERNAL_CRON=false
```

Ces valeurs ne permettent pas d'appeler les vrais providers de production.

## Migrations Prisma

En CI :

```bash
npm run prisma:migrate:deploy
```

En production :

```bash
npm run prisma:migrate:deploy
```

Interdit en production :

```bash
prisma migrate reset
prisma db push
```

`db push` peut etre pratique en local temporairement, mais la strategie propre du
repo repose sur les migrations versionnees.

## Protections de branches recommandees

### `main`

- Require a pull request before merging.
- Require status checks to pass.
- Require le workflow `CI`.
- Block force pushes.
- Block deletions.
- Optionnel : require linear history si l'equipe veut un historique plus strict.
- Optionnel : require approval sur l'environnement GitHub `production`.

### `develop`

- Require a pull request before merging.
- Require status checks to pass.
- Require le workflow `CI`.
- Block force pushes.
- Block deletions.

### `feature/*`, `fix/*`, `docs/*`, `chore/*`

- Branches libres pour developper.
- Merge recommande vers `develop` via pull request.

## Debug d'un workflow echoue

1. Ouvrir l'onglet `Actions` du repo GitHub.
2. Selectionner le workflow en erreur.
3. Regarder l'etape exacte qui echoue : install, Prisma, lint, typecheck, test
   ou build.
4. Reproduire localement avec la commande npm correspondante.
5. Si l'erreur concerne Prisma, verifier `DATABASE_URL`, les migrations et
   `prisma/schema.prisma`.
6. Si l'erreur concerne Vercel, verifier `VERCEL_TOKEN`, `VERCEL_ORG_ID` et
   `VERCEL_PROJECT_ID`.
7. Ne jamais afficher les secrets dans les logs pour debugger.

## Validation locale conseillee avant push

```bash
npm run prisma:generate
npm run prisma:validate
npm run lint
npm run typecheck
npm run test
npm run build
```

Pour tester les migrations comme la CI, lancer une base PostgreSQL locale ou
Docker puis :

```bash
npm run prisma:migrate:deploy
```
