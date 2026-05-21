# Cs-Stonks

Cs-Stonks est une application web de suivi du marche des skins CS2.
Le projet permet de consulter un catalogue d'items, comparer des prix entre
plusieurs marketplaces, afficher des graphiques d'evolution, analyser un item,
connecter un compte Steam et suivre une base de dashboard personnel.

Ce depot contient toutes les productions du projet : code source, base de
donnees, documentation de conception, sprints, workflows CI/CD et tutoriel
d'installation.

## Acces rapide

- Application locale : `http://localhost:3000`
- Documentation API dans l'app : `http://localhost:3000/api-docs`
- Prisma Studio : `http://localhost:5555`
- Base PostgreSQL Docker : `localhost:5432`

## Ou trouver les productions

| Production demandee | Emplacement dans le depot |
| --- | --- |
| Code frontend | `src/app`, `src/components`, `src/lib` |
| Code backend/API | `src/app/api`, `src/modules` |
| Schema et migrations BDD | `prisma/schema.prisma`, `prisma/migrations` |
| Configuration Docker PostgreSQL | `compose.yml`, `docker/postgres/init` |
| Documentation conception L2 | `avancement/01-rapport-avancement-conception.md` a `avancement/06-ajout-futur-utilisateur-portfolio.md` |
| Livrable L1 initial | `avancement/etienne_baillieux_livr1_projetmaster.docx` |
| Planning et sprints | `Agent/SPRINT*.md` |
| Notes de deploiement | `Agent/DEPLOYMENT_IDEAS.md`, `docs/ci-cd.md` |
| Workflows CI/CD | `.github/workflows` |
| Variables d'environnement exemple | `.env.example` |
| Tests automatises | fichiers `*.test.ts` dans `src` |

## Fonctionnalites principales

- Landing page premium pour presenter le produit.
- Page `Markets` (`/prices`) avec catalogue, recherche, pagination et prix multi-market.
- Page detail item avec graphique, prix par marketplace, variantes et origine.
- Page `Analyze` avec graphique interactif, zoom de plage, outils de dessin,
  couleurs, undo/redo, nettoyage et export image.
- Authentification Steam OpenID.
- Page profil Steam avec avatar, pseudo, trade link et informations locales.
- Page inventaire Steam avec estimation des items lorsque les donnees sont
  disponibles.
- Page management/dashboard avec widgets personnalisables, ajout par grille,
  choix de format carre/rectangle, drag and drop et graphiques prix/stock.
- Page echanges avec analyse manuelle fiable : selection des items donnes/recus,
  quantites, calcul du gain net et comparaison avec les lowest prices en BDD.
- Base technique pour analyser des offres Steam lorsque l'API Steam fournit les
  donnees necessaires.
- API interne de synchronisation catalogue, prix et snapshots.
- Providers prix : Skinport, CSFloat, DMarket, WAXPEER, white.market.
- Commande unique de pipeline quotidien pour synchroniser tous les markets puis
  creer le snapshot du jour.
- CI GitHub Actions : lint, typecheck, tests, build et migrations Prisma.

## Stack technique

- Next.js `15`
- React `19`
- TypeScript
- Tailwind CSS `4`
- Prisma ORM
- PostgreSQL `16`
- Docker Compose
- Vitest
- GitHub Actions

Le frontend et le backend sont dans la meme application Next.js.
Les routes API Next.js jouent le role de backend Node.js.
La base de donnees officielle du projet est PostgreSQL.

## Prerequis

Installer avant de lancer le projet :

- Node.js `20` ou plus recent
- npm `10` ou plus recent
- Docker Desktop
- Git

Verification rapide :

```bash
node -v
npm -v
docker --version
git --version
```

## Installation complete en local

### 1. Cloner le depot

```bash
git clone <LIEN_DU_DEPOT_GITHUB>
cd Cs-Stonks
```

Remplacer `<LIEN_DU_DEPOT_GITHUB>` par le lien GitHub fourni pour le rendu.

### 2. Installer les dependances

```bash
npm ci
```

Important : ce projet utilise `package-lock.json`. Pour une installation
reproductible, `npm ci` est la commande recommandee.

### 3. Creer le fichier d'environnement

Sur Windows PowerShell :

```powershell
Copy-Item .env.example .env
```

Sur macOS/Linux :

```bash
cp .env.example .env
```

Ne jamais commit le fichier `.env`. Il contient les secrets locaux.

### 4. Configurer les variables minimales

Ouvrir `.env` et verifier au minimum :

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cs_stonks?schema=public"
SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cs_stonks_shadow?schema=public"
APP_URL="http://localhost:3000"
SESSION_SECRET="replace-with-a-long-random-secret"
PRICE_PROVIDER="skinport"
CATALOG_PROVIDER="bymykel"
ENABLE_INTERNAL_CRON="false"
```

Generer un secret de session local avec PowerShell :

```powershell
[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
```

Mettre le resultat dans `SESSION_SECRET`.

Variables optionnelles utiles :

```env
STEAM_WEB_API_KEY=""
CSFLOAT_API_KEY=""
NEXT_PUBLIC_USD_EUR_RATE="0.92"
```

- `STEAM_WEB_API_KEY` sert a enrichir le profil Steam et certaines donnees
  Steam. La cle se cree sur `https://steamcommunity.com/dev/apikey`.
- `CSFLOAT_API_KEY` sert a synchroniser CSFloat.
- Skinport, DMarket, WAXPEER et white.market fonctionnent sans cle dans la
  configuration actuelle.

### 5. Lancer PostgreSQL avec Docker

```bash
docker compose up -d postgres
```

Verifier que le conteneur est lance :

```bash
docker compose ps
```

### 6. Generer Prisma et appliquer les migrations

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

Ces commandes creent les tables PostgreSQL a partir des migrations versionnees.

### 7. Importer le catalogue d'items

```bash
npm run job:catalog
```

Cette commande importe les items CS2 depuis le provider catalogue configure.
Elle peut prendre un peu de temps au premier lancement.

### 8. Synchroniser les prix

Commande recommandee pour lancer tous les markets supportes puis creer le
snapshot du jour :

```bash
npm run jobs:daily-markets
```

Cette commande execute dans l'ordre :

```text
CSFloat -> DMarket -> Skinport -> WAXPEER -> white.market -> snapshot journalier
```

Alternative : lancer uniquement Skinport si vous voulez un premier jeu de prix
plus rapide :

```bash
npm run job:skinport
```

Pour enrichir avec les autres marketplaces disponibles :

```bash
npm run job:csfloat
npm run job:dmarket
npm run job:waxpeer
npm run job:white-market
```

Notes :

- `npm run job:csfloat` necessite `CSFLOAT_API_KEY`.
- Si aucune cle CSFloat n'est configuree, passer cette commande ou configurer
  la variable avant `npm run jobs:daily-markets`.
- Les autres providers publics peuvent etre limites par leur API ou leur
  disponibilite.

### 9. Creer un snapshot journalier

Si `npm run jobs:daily-markets` a deja ete lance, cette etape est deja faite.
Sinon :

```bash
npm run job:snapshot
```

Les graphiques utilisent les prix courants et les snapshots stockes en base.

### 10. Lancer l'application

```bash
npm run dev
```

Ouvrir ensuite :

```text
http://localhost:3000
```

## Installation rapide avec le script Docker du projet

Le projet contient aussi un script pratique qui prepare la base Docker :

```powershell
npm ci
Copy-Item .env.example .env
npm run db:docker:setup
npm run job:catalog
npm run jobs:daily-markets
npm run dev
```

Sur macOS/Linux, remplacer `Copy-Item .env.example .env` par :

```bash
cp .env.example .env
```

## Commandes de lancement utiles

Lancer l'application :

```bash
npm run dev
```

Lancer en mode production local :

```bash
npm run build
npm run start
```

Ouvrir Prisma Studio :

```bash
npm run prisma:studio
```

Arreter la base Docker :

```bash
docker compose down
```

Redemarrer la base Docker :

```bash
docker compose up -d postgres
```

## Verification apres installation

Verifier l'API health :

```bash
curl http://localhost:3000/api/internal/health
```

Verifier les items :

```bash
curl "http://localhost:3000/api/items?limit=5"
```

Verifier les prix stockes :

```bash
curl http://localhost:3000/api/internal/pricing/latest
```

Verifier la qualite du code :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Pages principales a tester

- `/` : page d'accueil.
- `/prices` : catalogue, recherche et prix multi-market.
- `/market/<ITEM_ID>` : fiche detaillee d'un item.
- `/analyze` : analyse graphique interactive.
- `/auth` : connexion Steam.
- `/profile` : profil utilisateur connecte.
- `/inventory` : inventaire Steam.
- `/management` : dashboard personnel.
- `/exchanges` : analyse manuelle d'echange et comparaison du gain net.
- `/api-docs` : documentation API integree.

## Synchronisation des donnees

Les jobs de synchronisation lisent les providers externes puis ecrivent dans
PostgreSQL via Prisma.

Catalogue :

```bash
npm run job:catalog
```

Images catalogue :

```bash
npm run job:catalog:refresh-images
```

Prix :

```bash
npm run jobs:daily-markets
```

Cette commande est le chemin recommande : elle synchronise tous les markets
actifs puis cree le snapshot du jour.

Commandes unitaires si vous voulez relancer un provider precis :

```bash
npm run job:skinport
npm run job:csfloat
npm run job:dmarket
npm run job:waxpeer
npm run job:white-market
```

Snapshots :

```bash
npm run job:snapshot
```

Le snapshot stocke les prix et les quantites/listings disponibles. Il alimente
les graphiques historiques, y compris les graphiques de stock du dashboard.

Scheduler interne optionnel :

```bash
npm run jobs:scheduler
```

Par defaut, `ENABLE_INTERNAL_CRON="false"` pour eviter de lancer des jobs en
arriere-plan sans controle pendant le developpement.

## Structure du projet

```text
.
|-- Agent/                  # Sprints, notes projet, idees de deploiement
|-- avancement/             # Livrables de conception et rapport L2
|-- docs/                   # Documentation technique complementaire
|-- docker/                 # Initialisation PostgreSQL Docker
|-- prisma/                 # Schema Prisma et migrations
|-- public/                 # Assets publics
|-- scripts/                # Scripts d'aide base locale/Docker
|-- src/
|   |-- app/                # Pages Next.js et routes API
|   |-- components/         # Composants UI
|   |-- lib/                # Helpers transverses
|   |-- modules/            # Logique metier par domaine
|-- compose.yml             # PostgreSQL Docker
|-- package.json            # Scripts npm
|-- README.md               # Guide de rendu et installation
```

## Modele de donnees principal

Le schema complet est dans `prisma/schema.prisma`.

Entites principales :

- `Item` : item CS2 vendable.
- `Market` : marketplace ou source de prix.
- `LatestPrice` : dernier prix connu pour un item sur un market.
- `DailySnapshot` : historique journalier des prix.
- `SyncRun` : trace des synchronisations.
- `User` : utilisateur connecte via Steam.
- `Session` : session locale HTTP-only.
- `InventorySnapshot` : valeur d'inventaire sauvegardee.
- `TrackedSkin` : skin suivi par l'utilisateur.
- `DashboardWidget` : widget affiche sur le dashboard management, avec taille
  carre/rectangle et position personnalisable.
- `UserListing` : listing suivi manuellement.
- `UserTrade` : echange suivi manuellement.
- `UserNotification` : notification utilisateur.

## CI/CD

Les workflows GitHub Actions sont dans `.github/workflows`.

La CI lance :

```bash
npm ci
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate:deploy
npm run lint
npm run typecheck
npm run test
npm run build
```

Documentation detaillee :

```text
docs/ci-cd.md
```

Les secrets GitHub a ne jamais commiter :

- `DATABASE_URL` de production
- `SESSION_SECRET`
- `STEAM_WEB_API_KEY`
- `CSFLOAT_API_KEY`
- tokens de deploiement

## Deploiement

Le projet peut etre deploye avec :

- Frontend/backend Next.js sur Vercel, Render ou serveur Node.
- Base PostgreSQL sur Neon, Supabase, Render PostgreSQL ou Docker sur VPS.
- Jobs planifies via cron serveur, GitHub Actions planifiees, Render Cron Jobs
  ou scheduler dedie.

Les pistes de deploiement sont documentees dans :

```text
Agent/DEPLOYMENT_IDEAS.md
docs/ci-cd.md
```

## Limites connues

- Certaines APIs externes peuvent limiter les appels ou changer leur format.
- CSFloat demande une cle API pour la synchronisation officielle.
- L'inventaire Steam peut retourner `429` si Steam limite temporairement les
  requetes.
- Les offres Steam ne sont pas toujours detaillees par l'API officielle meme si
  Steam affiche des compteurs d'offres.
- L'analyse d'echange manuelle reste donc le mode fiable du MVP : l'utilisateur
  selectionne les items et Cs-Stonks calcule la valeur avec la BDD locale.
- Les donnees de prix dependent de la derniere synchronisation locale.

## Reset local si la base est cassee

Attention : cette commande supprime les donnees PostgreSQL Docker locales.

```bash
docker compose down -v
docker compose up -d postgres
npm run prisma:migrate:deploy
npm run job:catalog
npm run jobs:daily-markets
npm run dev
```

## Aide en cas de probleme

Si le CSS ne charge plus en developpement :

```bash
Ctrl + Shift + R
```

Si cela ne suffit pas, arreter `npm run dev`, supprimer `.next`, puis relancer :

```bash
npm run dev
```

Si Prisma ne trouve pas les tables :

```bash
docker compose up -d postgres
npm run prisma:migrate:deploy
npm run prisma:generate
```

Si le market est vide :

```bash
npm run job:catalog
npm run jobs:daily-markets
```

Si CSFloat ne se synchronise pas :

```bash
CSFLOAT_API_KEY doit etre renseignee dans .env
```

## Licence et usage

Projet realise dans le cadre du Projet Master. Les donnees de prix et de
catalogue proviennent de providers externes et doivent etre utilisees en
respectant leurs conditions d'utilisation.
