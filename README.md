# Cs-Stonks

Socle data platform pour `Cs-Stonks`, construit avec `Next.js 15`, `TypeScript`, `Prisma` et `PostgreSQL`.

Ce sprint livre la V1 de la couche de recuperation, normalisation, stockage et planification des donnees CS2 :

- catalogue d'items vendables uniques
- derniers prix connus par `(item, market)`
- snapshots journaliers a heure fixe
- audit de sync via `SyncRun`
- jobs manuels et scheduler documente

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
    api/internal
      health
      pricing/latest
      snapshots/daily
      sync/catalog
      sync/prices
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
      jobs
    health
    jobs
    markets
    pricing
      jobs
    providers
    snapshots
      jobs
    sync-runs
prisma
  schema.prisma
  migrations/0001_init/migration.sql
```

## Modele de donnees

Le schema Prisma suit exactement la strategie du sprint :

- `Item` : variante vendable unique du catalogue
- `Market` : source de prix comme `steam`, `skinport`, `csfloat`
- `LatestPrice` : dernier etat connu pour `(item, market)`
- `DailySnapshot` : copie figee des `LatestPrice` a heure logique fixe
- `SyncRun` : table d'audit pour chaque sync catalogue, prix ou snapshot

`LatestPrice` fait des upserts sur `(itemId, marketId)`.

`DailySnapshot` stocke :

- `snapshotDate`
- `snapshotHour`
- `sourceFetchedAt`
- `sourceUpdatedAt`

Le snapshot ne declenche jamais de fetch provider : il copie uniquement l'etat courant de `LatestPrice`.

## Providers et fixtures

Le projet contient les implementations demandees :

- `MockCatalogProvider`
- `JsonCatalogProvider`
- `MockPriceProvider`
- `JsonPriceProvider`

Fixtures locales :

- [catalog.fixture.json](src/modules/providers/local-data/catalog.fixture.json)
- [latest-prices.fixture.json](src/modules/providers/local-data/latest-prices.fixture.json)

Les fixtures couvrent :

- skins
- sticker
- case
- capsule
- knife avec `phase`
- glove
- agent
- item `StatTrak`
- plusieurs markets
- donnees partielles comme `quantity` ou `volume` null

## Setup local

1. Demarrer PostgreSQL.
2. Option rapide sans Docker :

```bash
npx prisma dev -d --name cs-stonks
```

3. Copier `.env.example` vers `.env`.
4. Renseigner `DATABASE_URL` et `SHADOW_DATABASE_URL`.
5. Installer les dependances :

```bash
npm install
```

6. Generer le client Prisma :

```bash
npm run prisma:generate
```

7. Appliquer les migrations :

```bash
npm run prisma:migrate
```

8. Lancer l'app :

```bash
npm run dev
```

Note pour `prisma dev` :

- laisser `pgbouncer=true` sur `DATABASE_URL` pour eviter les conflits de prepared statements dans les scripts de jobs
- garder `SHADOW_DATABASE_URL` sans `pgbouncer=true` pour les migrations

## Routes internes

### Health

```bash
curl http://localhost:3000/api/internal/health
```

### Sync catalogue

```bash
curl -X POST http://localhost:3000/api/internal/sync/catalog \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"json\"}"
```

Sources possibles :

- `json`
- `mock`

### Sync derniers prix

```bash
curl -X POST http://localhost:3000/api/internal/sync/prices \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"json\"}"
```

### Lire les derniers prix stockes

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

## Jobs et scheduling

Scripts manuels :

- `npm run job:catalog`
- `npm run job:prices`
- `npm run job:snapshot`
- `npm run jobs:scheduler`

Recommandation documentee du sprint :

- catalogue : `0 3 * * *`
- latest prices : `0 * * * *`
- daily snapshot : `5 2 * * *`
- timezone logique : `Europe/Paris`
- heure logique de snapshot : `02:05`

Le scheduler interne existe dans [registerCronJobs.ts](src/modules/jobs/registerCronJobs.ts), mais reste optionnel tant que `ENABLE_INTERNAL_CRON` n'est pas active a `true`.

## Scripts utiles

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`
- `npm run job:catalog`
- `npm run job:prices`
- `npm run job:snapshot`
- `npm run jobs:scheduler`

## Tests

Les tests couvrent les zones critiques du sprint :

- normalisation du catalogue et gestion de `phase`
- deduplication et mapping `(item, market)` des prix
- creation deterministe des snapshots journaliers

Execution :

```bash
npm run test
```

## Notes

- aucune integration reelle Steam / CSFloat / Skinport n'est active dans ce sprint
- les handlers API restent fins
- la logique metier reste dans les services et repositories
- les alias legacy `/api/internal/catalog/sync`, `/api/internal/pricing/sync` et `/api/internal/status` sont conserves pour compatibilite locale
