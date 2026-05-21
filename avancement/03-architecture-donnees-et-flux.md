# Architecture des donnees et flux systeme

## 1. Objectif du document

Ce document est redige pour etre facilement transformable en :

- MCD
- diagramme de classes
- diagramme de sequence
- schema d'architecture logicielle
- schema de flux de donnees

## 2. Entites principales de la base

### Extension prevue a moyen terme

Le modele actuel ne contient pas encore d'entite utilisateur.
Une evolution prevue consiste a ajouter des entites personnelles, par exemple :

- `User`
- `Portfolio`
- `PortfolioItem` ou `Holding`
- `SavedChart` ou `DashboardWidget`

## 2.1 Item

### Role

Represente une variante vendable unique du catalogue CS2.

### Exemples

- `AK-47 | Redline (Field-Tested)`
- `AWP | Dragon Lore (Factory New)`
- `Operation Broken Fang Case`

### Attributs importants

- `id`
- `variantKey`
- `slug`
- `searchText`
- `marketHashName`
- `itemType`
- `weapon`
- `skinName`
- `displayName`
- `baseItemName`
- `exterior`
- `rarity`
- `stattrak`
- `souvenir`
- `phase`
- `collection`
- `imageUrl`
- `steamImageUrl`
- `source`
- `sourceExternalId`

### Interpretation

`Item` est l'entite centrale du domaine produit.

## 2.2 Market

### Role

Represente une source de prix.

### Exemples

- `skinport`
- `steam`
- `csfloat`

### Attributs importants

- `id`
- `slug`
- `name`
- `enabled`
- `priority`

## 2.3 LatestPrice

### Role

Represente le dernier etat connu des donnees de prix pour un couple `(item, market)`.

### Attributs importants

- `itemId`
- `marketId`
- `price`
- `minPrice`
- `maxPrice`
- `meanPrice`
- `medianPrice`
- `suggestedPrice`
- `currency`
- `quantity`
- `volume`
- `sales24hMin`
- `sales24hMedian`
- `sales24hVolume`
- `sales7dMin`
- `sales7dMedian`
- `sales7dVolume`
- `sales30dMin`
- `sales30dMedian`
- `sales30dVolume`
- `sales90dMin`
- `sales90dMedian`
- `sales90dVolume`
- `sourceItemUrl`
- `sourceMarketUrl`
- `fetchedAt`
- `sourceUpdatedAt`
- `rawPayload`

### Interpretation

Cette table sert de source de verite quasi temps reel.

## 2.4 DailySnapshot

### Role

Represente une photo journaliere d'un `LatestPrice`.

### Attributs importants

- `snapshotDate`
- `snapshotHour`
- `itemId`
- `marketId`
- `price`
- `minPrice`
- `medianPrice`
- `sales90dMin`
- `sales90dMedian`
- `sales90dVolume`
- `sourceFetchedAt`

### Interpretation

Cette table sert a :

- construire les graphiques
- historiser les prix
- comparer les evolutions dans le temps

## 2.5 SyncRun

### Role

Trace une execution de synchronisation.

### Attributs importants

- `syncType`
- `provider`
- `status`
- `startedAt`
- `finishedAt`
- `itemsProcessed`
- `itemsSucceeded`
- `itemsFailed`
- `errorSummary`
- `metadata`

### Interpretation

Cette table sert a l'observabilite du systeme.

## 3. Relations entre les entites

### Relation A

Un `Item` peut posseder plusieurs `LatestPrice`.

Interpretation :

- un meme item peut etre present sur plusieurs markets

### Relation B

Un `Market` peut posseder plusieurs `LatestPrice`.

Interpretation :

- un market stocke le dernier prix connu de nombreux items

### Relation C

Un `Item` peut posseder plusieurs `DailySnapshot`.

Interpretation :

- un item peut etre historise sur plusieurs jours

### Relation D

Un `Market` peut posseder plusieurs `DailySnapshot`.

Interpretation :

- un market produit un historique journalier de multiples items

### Relation E

`SyncRun` est une entite de suivi transverse, non metier utilisateur.

## 4. Vue conceptuelle simple des relations

```text
Item 1 --- n LatestPrice n --- 1 Market
Item 1 --- n DailySnapshot n --- 1 Market

SyncRun
  -> trace les executions CATALOG / PRICES / SNAPSHOT
```

## 5. Flux metier principaux

## 5.1 Flux d'import catalogue

### Entree

- provider catalogue

### Etapes

1. lecture des donnees source
2. normalisation
3. mapping vers le modele `Item`
4. creation ou mise a jour des items
5. enregistrement d'un `SyncRun`

### Sortie

- base `Item` a jour

## 5.2 Flux d'ingestion prix

### Entree

- provider de prix

### Etapes

1. recuperation des donnees du provider
2. tentative de correspondance avec le catalogue
3. transformation vers le format interne
4. upsert dans `LatestPrice`
5. trace dans `SyncRun`

### Sortie

- base `LatestPrice` a jour

## 5.3 Flux snapshot journalier

### Entree

- donnees `LatestPrice` deja stockees

### Etapes

1. selection des latest prices
2. copie dans `DailySnapshot`
3. attachement d'une date et d'une heure logique
4. trace dans `SyncRun`

### Sortie

- historique journalier disponible

## 5.4 Flux consultation market

### Entree

- requete utilisateur sur `/prices` ou `/api/items`

### Etapes

1. lecture des items
2. jointure logique avec `LatestPrice`
3. pagination et tri
4. retour JSON
5. rendu frontend

### Sortie

- liste d'items consultable avec infos prix

## 5.5 Flux consultation detail item

### Entree

- identifiant d'un item

### Etapes

1. lecture de l'item
2. lecture des derniers prix
3. lecture des snapshots historiques
4. lecture des infos d'origine si disponibles
5. rendu de la page detail

### Sortie

- fiche item complete

## 5.6 Flux futur portfolio utilisateur

### Entree

- utilisateur authentifie
- item ou graphique a sauvegarder

### Etapes

1. l'utilisateur s'identifie
2. il ajoute un item a son portfolio ou enregistre une vue
3. l'application persiste ces donnees dans des tables dediees
4. le tableau de bord recharge les elements enregistres

### Sortie

- portfolio personnel persistant
- configuration de graphiques reutilisable

## 6. Requetes principales attendues par le frontend

### A. Lister les items

- route : `GET /api/items`
- source principale : `Item` + `LatestPrice`

### B. Charger un item

- route : `GET /api/items/:itemId`
- source principale : `Item`

### C. Charger les prix courants

- route : `GET /api/items/:itemId/latest-prices`
- source principale : `LatestPrice`

### D. Charger l'historique

- route : `GET /api/items/:itemId/history`
- source principale : `DailySnapshot`

### E. Charger l'origine / drop source

- route : `GET /api/items/:itemId/origin`
- source principale : `Item` + heuristiques metier

## 7. Strategie de persistance

Le projet suit la logique suivante :

- le provider ne persiste jamais directement
- la persistance passe par la couche metier
- le schema relationnel reste la source de verite

### Pourquoi ce choix est important

- meilleure maitrise des donnees
- normalisation centralisee
- tracabilite des syncs
- meilleure reutilisation des donnees par le frontend et l'API

## 8. Politique d'automatisation

Les jobs planifiables sont :

- sync catalogue
- ingestion Skinport
- snapshot journalier

### Planification documentee

- catalogue : `0 3 * * *`
- prix Skinport : `30 1 * * *`
- snapshot : `5 2 * * *`
- timezone logique : `Europe/Paris`

### Conditions

- cron interne active si `ENABLE_INTERNAL_CRON=true`
- sinon lancement manuel possible via scripts npm

## 9. Extension future du modele de donnees

Le projet est concu pour permettre une extension vers un espace utilisateur sans casser les entites actuelles.

### Principe

- les entites marche restent separees
- les entites utilisateur viennent se brancher dessus

### Exemple d'extension cible

- un `User` possede `0..N` portfolios
- un `Portfolio` appartient a `1` utilisateur
- un `Portfolio` contient `0..N` items suivis
- un `PortfolioItem` reference `1 Item`
- un `User` peut sauvegarder `0..N` graphiques ou widgets

### Interet

- personnalisation forte
- suivi de favoris ou holdings
- construction d'une page portfolio

## 10. Points de conception a transformer en schemas

Si tu demandes a ChatGPT de generer des schemas, voici les schemas les plus pertinents a produire :

### Schema 1

Diagramme de cas d'usage avec :

- visiteur
- administrateur
- scheduler
- provider externe

### Schema 2

Diagramme de classes ou MCD avec :

- Item
- Market
- LatestPrice
- DailySnapshot
- SyncRun

### Schema 3

Diagramme de sequence "Sync Skinport"

Acteurs :

- cron ou admin
- route ou script
- pricing service
- skinport provider
- prisma
- postgresql

### Schema 4

Diagramme de sequence "Consultation fiche item"

Acteurs :

- utilisateur
- frontend Next.js
- routes API
- base PostgreSQL

### Schema 5

Diagramme d'architecture applicative en couches

- frontend
- API
- services
- providers
- base de donnees

### Schema 6

Diagramme de deploiement cible

- frontend web
- backend / API
- service de jobs ou scheduler
- base PostgreSQL
- pipeline CI/CD

### Schema 7

Diagramme MCD etendu avec la future couche utilisateur

- User
- Portfolio
- PortfolioItem
- SavedChart
- lien avec Item

## 11. Perspective CI/CD et deploiement

Cette partie n'est pas encore implementee, mais elle fait partie de la trajectoire naturelle du projet.

### Cible envisagee

- un frontend deployee separement
- un backend/API deployee sur une cible serveur ou serverless adaptee
- une base PostgreSQL persistante hebergee
- un mecanisme planifie pour les jobs quotidiens

### Etapes logiques futures

1. automatiser `lint`
2. automatiser les tests
3. automatiser le build
4. preparer une pipeline de deploiement
5. distinguer les environnements `developpement`, `preproduction`, `production`

### Interet architectural

- meilleure fiabilite
- meilleure tracabilite
- meilleure repetabilite des livraisons
- meilleure demonstration de maturite projet
