# SPRINT_10.md

## Contexte

Le projet `Cs-Stonks` a maintenant plusieurs parties importantes :

- frontend Next.js 15 / React / TypeScript / Tailwind
- backend Next.js API routes
- Prisma
- PostgreSQL
- providers marketplaces
- auth Steam
- pages produit
- ingestion de prix
- snapshots
- documentation API

Le sprint 10 doit ajouter une vraie base **CI/CD GitHub** au repository.

Le but n’est pas de créer des workflows génériques copiés-collés.
Le but est que Codex inspecte le projet existant et mette en place une CI/CD adaptée à ce repo précis.

---

## Objectif du sprint

Ajouter une CI/CD propre pour le repo GitHub.

Le système doit permettre :

1. de vérifier automatiquement les Pull Requests
2. de vérifier les pushes sur `develop` et `main`
3. de lancer lint / typecheck / tests / build
4. de vérifier Prisma
5. de tester avec PostgreSQL si nécessaire
6. de préparer un workflow de déploiement
7. de documenter les secrets GitHub nécessaires
8. d’ajouter des protections de branche recommandées
9. de garder une structure simple, maintenable et adaptée au projet

---

## Règle principale

Codex doit d’abord inspecter le projet existant avant de coder.

Il doit vérifier :

- le package manager réellement utilisé
- la présence de `package-lock.json`, `pnpm-lock.yaml` ou `yarn.lock`
- les scripts existants dans `package.json`
- la version Node attendue
- la structure Next.js
- la configuration Prisma
- les tests existants
- les workflows GitHub Actions déjà présents
- les variables d’environnement nécessaires au build
- les routes et providers qui demandent des secrets
- la façon dont la base PostgreSQL est utilisée

### Important

Codex ne doit pas imposer une CI générique qui ne correspond pas au repo.

Il doit adapter les workflows au projet réel.

---

## Ce sprint doit produire

À la fin du sprint, le repo doit contenir :

- `.github/workflows/ci.yml`
- éventuellement `.github/workflows/deploy-preview.yml`
- éventuellement `.github/workflows/deploy-production.yml`
- éventuellement `.github/dependabot.yml`
- une documentation `docs/ci-cd.md`
- une mise à jour du `README.md` si nécessaire
- une mise à jour de `.env.example` si nécessaire
- des scripts npm/pnpm/yarn cohérents si manquants

---

## Hors scope

Ne pas faire dans ce sprint :

- changer l’architecture produit
- réécrire les providers
- changer le schéma Prisma sans raison
- migrer d’hébergeur
- ajouter Docker complexe si le projet n’en a pas besoin
- mettre en place Kubernetes
- ajouter une infra cloud lourde
- déployer automatiquement en production sans secrets et validation
- exécuter des migrations destructrices
- utiliser une vraie base de production dans les tests CI

---

## Workflow Git attendu

Le projet utilise une logique GitFlow simplifiée.

Branches principales :

- `main` : production stable
- `develop` : intégration
- `feature/*` : nouvelles features
- `fix/*` : corrections
- `docs/*` : documentation
- `chore/*` : maintenance

### CI attendue

La CI doit tourner sur :

- pull requests vers `develop`
- pull requests vers `main`
- push vers `develop`
- push vers `main`

---

## Partie 1 — Workflow CI

Créer :

```text
.github/workflows/ci.yml
```

### Objectif

Le workflow CI doit valider que le projet est sain avant merge.

### Déclencheurs

```yaml
on:
  pull_request:
    branches:
      - develop
      - main
  push:
    branches:
      - develop
      - main
```

### Jobs attendus

Le workflow doit inclure au minimum :

1. checkout du repo
2. setup Node
3. installation des dépendances
4. génération Prisma
5. validation Prisma
6. lint
7. typecheck
8. tests
9. build Next.js

---

## Node.js

Codex doit inspecter le projet pour déterminer la version Node.

### Priorité de détection

1. `.nvmrc`
2. `package.json` > `engines.node`
3. version recommandée par Next.js 15
4. fallback raisonnable : Node 20 ou 22 LTS

### Important

Ne pas hardcoder une version au hasard si le repo fournit déjà une version.

---

## Package manager

Codex doit détecter le package manager :

- `package-lock.json` → npm
- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn

### Règle

Ne pas changer de package manager dans ce sprint.

Si le repo utilise npm, garder npm.
Si le repo utilise pnpm, garder pnpm.
Si le repo utilise yarn, garder yarn.

---

## Installation des dépendances

Utiliser une commande safe :

### npm

```bash
npm ci
```

### pnpm

```bash
pnpm install --frozen-lockfile
```

### yarn

```bash
yarn install --frozen-lockfile
```

---

## Caching

Utiliser le cache intégré de `actions/setup-node`.

Le cache doit correspondre au package manager :

```yaml
cache: npm
```

ou :

```yaml
cache: pnpm
```

ou :

```yaml
cache: yarn
```

---

## Prisma en CI

Le projet utilise Prisma.

La CI doit au minimum faire :

```bash
npx prisma generate
npx prisma validate
```

ou l’équivalent selon le package manager.

### Tests avec base PostgreSQL

Si des tests d’intégration utilisent la base, la CI doit lancer un service PostgreSQL GitHub Actions.

Exemple attendu :

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cs_stonks_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### Variables CI pour PostgreSQL test

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cs_stonks_test
```

### Important

Ne jamais utiliser la base de production dans le job CI.

---

## Migrations Prisma

### En CI

Pour une base de test, il est acceptable d’utiliser :

```bash
npx prisma migrate deploy
```

si les migrations existent.

Alternative possible :

```bash
npx prisma db push
```

uniquement si le projet n’a pas encore une stratégie migrations stable.

### En production

Pour un déploiement réel, utiliser :

```bash
npx prisma migrate deploy
```

Ne jamais utiliser :

```bash
prisma migrate reset
```

en production ou dans un workflow de déploiement.

---

## Scripts attendus dans `package.json`

Codex doit vérifier les scripts existants.

Si certains scripts sont absents, il peut les ajouter proprement.

Scripts recommandés :

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "prisma:generate": "prisma generate",
    "prisma:validate": "prisma validate",
    "prisma:migrate:deploy": "prisma migrate deploy"
  }
}
```

### Important

Ne pas casser les scripts existants.
Si le projet utilise Jest au lieu de Vitest, adapter.
Si le projet n’a pas encore de tests, créer un script test minimal ou documenter le comportement.

---

## Lint

Le job CI doit lancer :

```bash
npm run lint
```

ou équivalent.

Si `lint` n’existe pas, Codex doit vérifier la config Next.js / ESLint et ajouter un script adapté.

---

## Typecheck

Le job CI doit lancer :

```bash
npm run typecheck
```

Si le script n’existe pas, ajouter :

```json
"typecheck": "tsc --noEmit"
```

---

## Tests

Le job CI doit lancer :

```bash
npm test
```

ou :

```bash
npm run test
```

selon le projet.

### Si aucun framework de test n’est installé

Codex doit :

1. vérifier si un framework existe déjà
2. ne pas ajouter une grosse stack de test sans raison
3. si nécessaire, ajouter Vitest comme option légère
4. créer au moins un test minimal utile
5. documenter la décision

---

## Build

Le job CI doit lancer :

```bash
npm run build
```

### Variables d’environnement de build

Si le build Next.js demande des variables d’environnement, Codex doit créer des valeurs CI safe.

Exemple :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cs_stonks_test
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret
STEAM_WEB_API_KEY=test-key
```

### Important

Ne pas mettre de vraie clé API dans le workflow.

Utiliser uniquement des secrets GitHub ou des valeurs mock de CI si le code le permet.

---

## Partie 2 — Workflow de déploiement preview

Créer un workflow de preview seulement si le projet est compatible avec Vercel ou si le repo indique clairement la cible de déploiement.

### Route recommandée

Si le projet utilise Vercel :

```text
.github/workflows/deploy-preview.yml
```

### Déclencheur

```yaml
on:
  pull_request:
    branches:
      - develop
      - main
```

### Objectif

Créer un preview deploy pour chaque Pull Request.

### Important

Si le projet est déjà connecté directement à Vercel via GitHub, Codex ne doit pas dupliquer inutilement les déploiements.

Dans ce cas, il doit documenter que Vercel gère déjà les preview deployments.

---

## Partie 3 — Workflow de déploiement production

Créer un workflow production uniquement si les secrets nécessaires sont disponibles ou documentables.

### Route recommandée

```text
.github/workflows/deploy-production.yml
```

### Déclencheur recommandé

```yaml
on:
  push:
    branches:
      - main
```

### Objectif

Déployer automatiquement ou semi-automatiquement la branche `main`.

### Recommandation

Utiliser GitHub Environments :

- `preview`
- `production`

Pour la production, demander une validation manuelle si possible.

---

## Vercel comme cible probable

Le projet est en Next.js.
La cible la plus probable est Vercel.

### Secrets Vercel attendus

Si Vercel est utilisé, documenter ces secrets :

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Commandes typiques

```bash
npx vercel pull --yes --environment=preview --token=$VERCEL_TOKEN
npx vercel build --token=$VERCEL_TOKEN
npx vercel deploy --prebuilt --token=$VERCEL_TOKEN
```

Pour production :

```bash
npx vercel pull --yes --environment=production --token=$VERCEL_TOKEN
npx vercel build --prod --token=$VERCEL_TOKEN
npx vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

### Important

Ces workflows doivent rester optionnels si les secrets ne sont pas configurés.

---

## Migrations en déploiement

Si le projet déploie une DB production, le workflow de production peut lancer :

```bash
npx prisma migrate deploy
```

### Règle de sécurité

Ne lancer les migrations production que :

- sur `main`
- dans l’environnement `production`
- avec `DATABASE_URL` venant de GitHub Secrets
- jamais avec une URL hardcodée
- jamais avec `migrate reset`

---

## Partie 4 — Dependabot

Ajouter si pertinent :

```text
.github/dependabot.yml
```

### Objectif

Mettre à jour automatiquement :

- GitHub Actions
- npm dependencies

### Exemple de fréquence

- weekly

### Important

Ne pas ouvrir trop de PRs inutiles.
Limiter le nombre d’updates ouvertes.

---

## Partie 5 — Branch protection recommandée

Documenter les règles de protection GitHub recommandées.

### `main`

Recommandé :

- require pull request before merging
- require status checks to pass
- require CI
- require linear history si souhaité
- block force pushes
- block deletions

### `develop`

Recommandé :

- require PR
- require CI
- block force pushes

### Important

Codex ne peut pas forcément configurer les protections via fichier.
Il doit les documenter dans :

```text
docs/ci-cd.md
```

---

## Partie 6 — Secrets GitHub

Créer une section claire dans `docs/ci-cd.md`.

### Secrets possibles

```text
DATABASE_URL
DIRECT_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
STEAM_WEB_API_KEY
CSFLOAT_API_KEY
SKINPORT_CLIENT_ID
SKINPORT_CLIENT_SECRET
CS2CAP_API_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Règle

Ne pas mettre de vraies valeurs dans le repo.

Utiliser :

```text
GitHub Repository Settings -> Secrets and variables -> Actions
```

---

## Partie 7 — Documentation attendue

Créer :

```text
docs/ci-cd.md
```

Cette doc doit expliquer :

1. quels workflows existent
2. quand ils se déclenchent
3. quels jobs ils lancent
4. quels secrets sont nécessaires
5. comment fonctionne la CI
6. comment fonctionne le déploiement preview
7. comment fonctionne le déploiement production
8. comment gérer les migrations Prisma
9. comment configurer les protections de branche
10. comment débugger un workflow échoué

---

## Structure attendue

Créer ou modifier :

```text
.github/
  workflows/
    ci.yml
    deploy-preview.yml
    deploy-production.yml
  dependabot.yml

docs/
  ci-cd.md
```

### Important

Si certains fichiers existent déjà, Codex doit les adapter au lieu de les remplacer brutalement.

---

## Exemple de workflow CI attendu

Codex peut s’inspirer de ce modèle, mais doit l’adapter au projet réel.

```yaml
name: CI

on:
  pull_request:
    branches:
      - develop
      - main
  push:
    branches:
      - develop
      - main

jobs:
  quality:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: cs_stonks_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cs_stonks_test
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: test-secret
      STEAM_WEB_API_KEY: test-key

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Validate Prisma schema
        run: npx prisma validate

      - name: Apply test migrations
        run: npx prisma migrate deploy

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build
```

### Important

Ce YAML est un modèle.
Codex doit le modifier selon :

- le package manager réel
- la version Node réelle
- les scripts existants
- les besoins réels du projet

---

## CI/CD et sécurité

### Règles de sécurité

- ne jamais exposer de secrets
- ne jamais logger les secrets
- ne jamais mettre de clés API dans le repo
- ne jamais lancer de migration destructive
- ne jamais utiliser la DB production dans les tests
- ne jamais déployer en production depuis une branche feature

---

## Tests attendus

À la fin du sprint, il faut vérifier :

### CI

- une PR déclenche la CI
- un push sur `develop` déclenche la CI
- un push sur `main` déclenche la CI
- lint fonctionne
- typecheck fonctionne
- tests fonctionnent
- build fonctionne
- Prisma generate fonctionne
- Prisma validate fonctionne

### PostgreSQL

- le service Postgres démarre en CI
- `DATABASE_URL` de test fonctionne
- les migrations s’appliquent sur la DB de test si nécessaire

### CD

- le workflow preview est documenté
- le workflow production est documenté
- les secrets nécessaires sont listés
- aucun secret n’est hardcodé

---

## Branching pour ce sprint

Maximum **3 branches**.

### Branche 1

```text
chore/github-actions-ci
```

Contient :

- `.github/workflows/ci.yml`
- scripts package si nécessaires
- validation Prisma
- Postgres service si nécessaire

### Branche 2

```text
chore/github-actions-deploy
```

Contient :

- workflow preview si pertinent
- workflow production si pertinent
- configuration Vercel si retenue
- migrations deploy si pertinent

### Branche 3

```text
docs/ci-cd-documentation
```

Contient :

- `docs/ci-cd.md`
- `.env.example` mis à jour
- README mis à jour si nécessaire
- recommandations branch protection

---

## Ordre de travail recommandé

1. inspecter le repo
2. identifier package manager et scripts
3. identifier Node version
4. identifier Prisma / DB requirements
5. vérifier si des workflows existent déjà
6. créer ou adapter `ci.yml`
7. tester localement les scripts
8. ajouter Postgres service si nécessaire
9. ajouter workflows deploy si pertinent
10. documenter secrets et branches
11. ajouter Dependabot si pertinent
12. faire un test de PR

---

## Définition of done

Le sprint 10 est terminé si :

- la CI existe
- la CI est adaptée au projet réel
- lint tourne en CI
- typecheck tourne en CI
- tests tournent en CI
- build tourne en CI
- Prisma est validé en CI
- PostgreSQL test est configuré si nécessaire
- le déploiement est préparé ou documenté
- les secrets sont documentés
- les protections de branche sont documentées
- aucun secret n’est commité
- la documentation CI/CD existe

---

## Résultat attendu à la fin du sprint

À la fin de ce sprint, le repo doit avoir une base CI/CD sérieuse :

- PR vérifiées automatiquement
- erreurs détectées avant merge
- build validé automatiquement
- Prisma contrôlé
- déploiement préparé
- secrets documentés
- workflow maintenable

---

## Instruction finale pour Codex

Codex doit travailler **par rapport au projet existant**.

Il doit :

1. inspecter le repo avant de créer les workflows
2. adapter les commandes aux scripts réels
3. ne pas casser le package manager existant
4. ne pas inventer des secrets inutiles
5. ne pas hardcoder de secrets
6. ne pas utiliser de vraie DB production dans la CI
7. garder les workflows simples et maintenables

La priorité est :

```text
Une CI fiable d’abord.
Un CD préparé ensuite.
Pas de sur-ingénierie.
Pas de secret exposé.
```
