# 03 - Architecture technique et flux

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma
- PostgreSQL 16
- Docker Compose
- Vitest
- GitHub Actions

## Architecture generale

```text
Utilisateur
  |
  v
Frontend Next.js / React
  |
  v
Routes API Next.js
  |
  v
Services metier dans src/modules
  |
  v
Prisma ORM
  |
  v
PostgreSQL Docker
```

## Flux de donnees prix

```text
Providers externes
  Skinport / CSFloat / DMarket / WAXPEER / white.market
        |
        v
Jobs de synchronisation
        |
        v
Mapping et matching par market_hash_name
        |
        v
LatestPrice
        |
        v
DailySnapshot
        |
        v
Graphiques, market, fiches item, analytics
```

## Principe important

Les pages frontend ne doivent pas appeler directement les marketplaces.

Elles lisent les donnees normalisees depuis la base via les routes API.

Cela permet :

- plus de stabilite ;
- moins de dependance temps reel aux APIs externes ;
- historique local ;
- graphiques reproductibles ;
- possibilite de comparer plusieurs sources.

## Flux catalogue

```text
ByMykel / CSGO-API
      |
      v
Job catalogue
      |
      v
Normalisation Item
      |
      v
Table Item
```

Le catalogue contient les informations utiles :

- nom marche ;
- type ;
- arme ;
- skin ;
- wear ;
- StatTrak ;
- Souvenir ;
- phase ;
- collection ;
- image.

## Flux utilisateur

```text
Steam OpenID
    |
    v
Callback auth
    |
    v
Upsert User
    |
    v
Creation Session
    |
    v
Cookie HTTP-only
    |
    v
Pages protegees
```

Les routes personnelles utilisent toujours le `userId` de la session cote
serveur.

Le client ne doit jamais envoyer un `userId` arbitraire pour acceder a des
donnees personnelles.

## Flux dashboard / portfolio

```text
User
  |
  +--> UserTrackedSkin
  |       |
  |       +--> Item + LatestPrice + DailySnapshot
  |
  +--> UserInventorySnapshot
  |
  +--> UserDashboardWidget
  |
  +--> UserMarketplaceListing
  |
  +--> UserTrade
  |
  +--> UserNotification
```

## Flux analyse graphique

```text
Selection item + market + periode
        |
        v
DailySnapshot / LatestPrice
        |
        v
Transformation en points de courbe
        |
        v
Graphique interactif
        |
        +--> zoom plage
        +--> stylo couleur
        +--> annotations
        +--> export image
```

## Securite

Principes appliques :

- `.env` ignore par Git ;
- secrets jamais exposes au frontend ;
- Steam OpenID pour eviter de demander le mot de passe Steam ;
- cookies de session HTTP-only ;
- routes personnelles protegees ;
- donnees utilisateur filtrees par session ;
- pas de stockage de cookies Steam ;
- pas d'automatisation d'acceptation de trades.

## CI/CD

La CI GitHub Actions verifie :

- installation ;
- Prisma ;
- migrations ;
- lint ;
- typecheck ;
- tests ;
- build Next.js.

Le deploiement cloud est prepare mais peut rester une perspective si le projet
est rendu executable localement avec Docker.

