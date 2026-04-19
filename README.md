# Cs-Stonks

Socle data platform pour `Cs-Stonks`, construit avec `Next.js 15`, `TypeScript`, `Prisma` et `PostgreSQL`.

Le sprint 1 a pose la fondation catalogue / latest prices / snapshots.
Le sprint 2 ajoute :

- un vrai provider de prix `real` base sur Steam Community Market
- une sync pricing plus robuste avec logs, timeouts, retries et resume structure
- un read side public pour les items, les prix courants et l'historique
- un catalogue enrichi avec `slug` et `searchText`

Le sprint 3 ajoute :

- un provider catalogue `bymykel` base sur `ByMykel/CSGO-API`
- un import relancable du catalogue local complet ou quasi complet
- l'enrichissement image Steam/CDN stocke en base
- des metadonnees catalogue supplementaires sur `Item`

Le sprint 6 ajoute :

- une ingestion quotidienne Skinport a grande echelle
- `GET /v1/items` comme source principale de prix
- `GET /v1/sales/history` comme enrichissement complementaire
- un enrichissement de `LatestPrice` pour conserver les metriques Skinport utiles
- des snapshots journaliers relies a la BDD pour les graphes

## Stack

- Next.js `15.5.15`
- React `19`
- TypeScript strict
- Tailwind CSS `4`
- Prisma + PostgreSQL
- Vitest
- `node-cron` pour la planification interne optionnelle

## Architecture

```text
src
  app
    api
      internal
      items
  lib
    api.ts
    date.ts
    db/prisma.ts
    errors.ts
    logger
    runtime.ts
  modules
    api
    bootstrap.ts
    catalog
    health
    items
    jobs
    markets
    pricing
    providers
      steam
    snapshots
    sync-runs
prisma
  schema.prisma
  migrations
    0001_init
    0002_item_read_fields
    20260418172954_sprint3_catalog_import
```

## Modele de donnees

Le schema Prisma suit la separation du sprint :

- `Item` : variante vendable unique du catalogue
- `Market` : source de prix comme `steam`, `skinport`, `csfloat`
- `LatestPrice` : dernier etat connu pour `(item, market)`
- `DailySnapshot` : copie figee des `LatestPrice` a heure logique fixe
- `SyncRun` : audit de sync catalogue, prix et snapshot

Ajouts sprint 2 sur `Item` :

- `slug`
- `searchText`

Ajouts sprint 3 sur `Item` :

- `baseItemName`
- `hasVariants`
- `steamAppId`
- `source`
- `sourceExternalId`
- `lastCatalogSyncAt`

`LatestPrice` reste la source de verite quasi temps reel.
`DailySnapshot` continue de copier `LatestPrice` sans aucun refetch provider.

Ajouts sprint 6 sur `LatestPrice` :

- `minPrice`
- `maxPrice`
- `meanPrice`
- `medianPrice`
- `suggestedPrice`
- `sourceItemUrl`
- `sourceMarketUrl`
- `rawPayload`

## Providers

### Catalogue

- `ByMykelCatalogProvider` via la source `bymykel`
- `LocalFallbackCatalogProvider` via la source `local_fallback`
- `MockCatalogProvider`
- `JsonCatalogProvider`

### Prix

- `MockPriceProvider`
- `JsonPriceProvider`
- `SteamPriceProvider` via la source `real`
- `SkinportPriceProvider` via la source `skinport`

Le provider reel :

- est isole dans `src/modules/providers/steam`
- utilise un client HTTP dedie
- applique timeout et retry simple
- transforme les payloads Steam `priceoverview` en `RawPriceProviderItem`
- ne persiste jamais directement en base

Le provider reel actuel ne depend d'aucune cle API et peut etre smoke-teste en local.

## Fixtures locales

- [catalog.fixture.json](src/modules/providers/local-data/catalog.fixture.json)
- [latest-prices.fixture.json](src/modules/providers/local-data/latest-prices.fixture.json)

Elles restent utiles pour les tests et les smoke tests deterministes.

## Setup local

1. Option recommandee avec Docker :

```bash
npm run db:docker:setup
```

Cette commande :

- demarre PostgreSQL dans Docker sur `localhost:5432`
- cree `cs_stonks` et `cs_stonks_shadow`
- applique le schema Prisma
- migre les donnees depuis la base courante pointee par `.env`
- reecrit `.env` vers la base Docker

Commandes utiles :

```bash
npm run dev:docker
npm run db:docker:up
npm run db:docker:status
npm run db:docker:down
```

Fichiers Docker :

- [compose.yml](compose.yml)
- [docker/postgres/init/01-create-shadow-db.sql](docker/postgres/init/01-create-shadow-db.sql)

2. Option rapide sans Docker :

```bash
npx prisma dev -d --name cs-stonks
```

3. Copier `.env.example` vers `.env`.
4. Installer les dependances :

```bash
npm install
```

5. Generer le client Prisma :

```bash
npm run prisma:generate
```

6. Appliquer les migrations :

```bash
npm run prisma:migrate
```

7. Lancer l'app :

```bash
npm run dev
```

Note pour `prisma dev` :

- laisser `pgbouncer=true` sur `DATABASE_URL` pour eviter les conflits de prepared statements dans les jobs
- garder `SHADOW_DATABASE_URL` sans `pgbouncer=true`

## Setup local durable avec Prisma Dev

Si tu n'as pas PostgreSQL installe localement, le workflow le plus simple pour garder une base locale persistante pour ce repo est :

```bash
npm run db:local:setup
```

Cette commande :

- demarre un serveur Prisma Dev nomme `cs-stonks-local`
- reecrit `DATABASE_URL` et `SHADOW_DATABASE_URL` dans `.env`
- genere Prisma
- applique le schema avec `prisma db push`
- importe le catalogue seulement si la base est vide

Le point important n'est pas d'avoir des ports imposes, mais d'avoir toujours le bon port dans `.env`.
Le script relit automatiquement les vraies URLs du serveur Prisma Dev et remet `.env` a jour a chaque demarrage.

Commandes utiles :

```bash
npm run dev:local
npm run db:local:start
npm run db:local:status
npm run db:local:stop
```

`npm run dev:local` est la commande recommandee en developpement : elle prepare la bonne base locale puis lance Next.js avec un `.env` synchronise.

Important :

- les donnees restent attachees au serveur Prisma Dev `cs-stonks-local`
- tu n'as plus besoin de recreer une nouvelle base a chaque sprint
- si les items disparaissent, relance `npm run db:local:setup` ou `npm run db:local:start` pour resynchroniser `.env`

## Variables d'environnement

Variables principales :

- `DATABASE_URL`
- `SHADOW_DATABASE_URL`
- `CATALOG_PROVIDER`
- `BYMYKEL_API_BASE_URL`
- `BYMYKEL_API_LOCALE`
- `PRICE_PROVIDER`
- `ENABLE_INTERNAL_CRON`
- `CATALOG_CRON`
- `SKINPORT_DAILY_INGESTION_CRON`
- `DAILY_SNAPSHOT_CRON`
- `SNAPSHOT_TIMEZONE`
- `SNAPSHOT_HOUR`

Variables du provider reel :

- `SKINPORT_BASE_URL`
- `SKINPORT_APP_ID`
- `SKINPORT_CURRENCY`
- `SKINPORT_CHUNK_SIZE`
- `SKINPORT_FETCH_SALES_HISTORY`
- `SKINPORT_FETCH_ALL_SALES_HISTORY`
- `SKINPORT_REQUEST_TIMEOUT_MS`
- `SKINPORT_TRADABLE_ONLY`

- `REAL_PROVIDER_BASE_URL`
- `REAL_PROVIDER_APP_ID`
- `REAL_PROVIDER_COUNTRY`
- `REAL_PROVIDER_CURRENCY_CODE`
- `REAL_PROVIDER_TIMEOUT_MS`
- `REAL_PROVIDER_RETRY_COUNT`
- `REAL_PROVIDER_CONCURRENCY`
- `REAL_PROVIDER_MAX_ITEMS`

Par defaut, `CATALOG_PROVIDER="bymykel"` et `.env.example` propose `PRICE_PROVIDER="skinport"` pour le flux sprint 6.
Pour utiliser le fallback local catalogue :

```bash
CATALOG_PROVIDER=local_fallback
```

Pour utiliser le provider catalogue reel :

```bash
CATALOG_PROVIDER=bymykel
```

Le provider ByMykel importe :

- `skins_not_grouped.json`
- `stickers.json`
- `crates.json`
- `agents.json`
- `keychains.json`
- `tools.json`
- `music_kits.json`
- `graffiti.json`
- `patches.json`

et mappe les types internes :

- `SKIN`
- `KNIFE`
- `GLOVE`
- `STICKER`
- `CASE`
- `CAPSULE`
- `AGENT`
- `CHARM`
- `TOOL`
- `MUSIC_KIT`
- `GRAFFITI`
- `PATCH`

Les URLs d'images sont resolues et stockees dans `imageUrl` et `steamImageUrl`.

Pour utiliser Skinport :

```bash
PRICE_PROVIDER=skinport
```

Le provider Skinport :

- utilise `GET /v1/items` comme source principale
- utilise `GET /v1/sales/history` seulement comme enrichissement complementaire
- ne demande pas d'API key pour cette sync publique
- envoie `Accept-Encoding: br` comme demande par la doc officielle
- choisit un prix produit stable avec cette priorite :
  - `median_price`
  - `mean_price`
  - `suggested_price`
  - `min_price`
  - puis fallback sur les fenetres `24h`, `7d`, `30d`, `90d`
- persiste le market `skinport`
- alimente `LatestPrice`, puis `DailySnapshot` devient la source des graphes

Pour utiliser le vrai provider :

```bash
PRICE_PROVIDER=real
```

## Routes internes

### Health

```bash
curl http://localhost:3000/api/internal/health
```

### Sync catalogue

```bash
curl -X POST http://localhost:3000/api/internal/catalog/import \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"bymykel\"}"
```

Sources catalogue :

- `bymykel`
- `local_fallback`
- `json`
- `mock`

Alias legacy toujours disponibles :

- `POST /api/internal/catalog/sync`
- `POST /api/internal/sync/catalog`

### Refresh images catalogue

```bash
curl -X POST http://localhost:3000/api/internal/catalog/refresh-images \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"bymykel\"}"
```

### Sync derniers prix

```bash
curl -X POST http://localhost:3000/api/internal/sync/prices \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"skinport\"}"
```

Sources prix :

- `json`
- `mock`
- `real`
- `skinport`

Si `source` est omise, la route prend `PRICE_PROVIDER`.

### Sync Skinport recommandee

```bash
curl -X POST http://localhost:3000/api/internal/sync/skinport
```

### Sync Skinport puis snapshot

```bash
curl -X POST http://localhost:3000/api/internal/sync/skinport-and-snapshot
```

### Lire tous les derniers prix stockes

```bash
curl http://localhost:3000/api/internal/pricing/latest
```

Filtrer par market :

```bash
curl "http://localhost:3000/api/internal/pricing/latest?market=steam"
```

### Creer le snapshot journalier

```bash
curl -X POST http://localhost:3000/api/internal/snapshots/daily \
  -H "Content-Type: application/json" \
  -d "{\"snapshotDate\":\"2026-04-18T00:00:00.000Z\",\"snapshotHour\":\"02:05\",\"timeZone\":\"Europe/Paris\"}"
```

## Routes de lecture publiques

### Lister les items

```bash
curl "http://localhost:3000/api/items?query=ak+redline&page=1&limit=20&sort=displayName_asc"
```

Filtres utiles :

- `query`
- `itemType`
- `page`
- `limit`
- `sort`

### Detail d'un item

```bash
curl http://localhost:3000/api/items/<ITEM_ID>
```

### Derniers prix d'un item

```bash
curl "http://localhost:3000/api/items/<ITEM_ID>/latest-prices?sort=price_asc"
```

### Historique d'un item

```bash
curl "http://localhost:3000/api/items/<ITEM_ID>/history?market=steam&sort=asc"
```

L'historique vient de `DailySnapshot` et est pret pour les futurs charts :

- `date`
- `hour`
- `marketSlug`
- `price`
- `currency`

## Jobs et scheduling

Scripts manuels :

- `npm run job:catalog`
- `npm run job:catalog:refresh-images`
- `npm run job:skinport`
- `npm run job:prices`
- `npm run job:snapshot`
- `npm run jobs:scheduler`

Politique documentee :

- catalogue : `0 3 * * *`
- ingestion Skinport : `30 1 * * *`
- daily snapshot : `5 2 * * *`
- timezone logique : `Europe/Paris`
- heure logique de snapshot : `02:05`

Le scheduler interne reste optionnel tant que `ENABLE_INTERNAL_CRON` vaut `false`.

## Validation

Le socle sprint 6 est valide localement avec :

- `npm run prisma:generate`
- `npm run lint`
- `npm run test`
- `npm run job:skinport`
- `npm run job:snapshot`

Les tests couvrent :

- normalisation catalogue avec `slug` et `searchText`
- client HTTP Steam, retry et timeout
- client HTTP Skinport, timeout et construction des requetes
- mapping du provider reel Steam
- mapping du provider Skinport et l'enrichissement history
- resume enrichi de la sync pricing
- read side `items`, `latest-prices`, `history`
- snapshot deterministic

## Notes

- le provider reel actuel cible Steam Community Market pour une premiere ingestion reelle simple
- l'endpoint public `GET /api/items` est pense pour un frontend futur, pas pour l'admin
- les handlers API restent minces
- la logique metier reste dans les services et repositories
- les alias legacy `/api/internal/catalog/sync`, `/api/internal/pricing/sync` et `/api/internal/status` sont conserves
