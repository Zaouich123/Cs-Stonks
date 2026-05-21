# Modele relationnel explicite - Cs-Stonks

## 1. Objectif du document

Ce document a pour but de formaliser clairement le modele de donnees relationnel du projet `Cs-Stonks`.

Il est ecrit pour etre exploitable directement par :

- un enseignant
- un lecteur technique
- ChatGPT 5.5 pour generer un MCD
- ChatGPT 5.5 pour generer un diagramme de classes ou un schema relationnel

## 2. Entites principales

Le modele actuel repose sur 5 entites principales :

1. `Item`
2. `Market`
3. `LatestPrice`
4. `DailySnapshot`
5. `SyncRun`

## 2.1 Extension future prevue

Le schema actuel ne contient pas encore de table utilisateur.
Cependant, le projet est pense pour accueillir plus tard une couche personnelle sans refonte majeure.

Les entites futures envisagees sont par exemple :

- `User`
- `Portfolio`
- `PortfolioItem`
- `SavedChart`

## 3. Description des entites

## 3.1 Entite `Item`

### Role

Represente une variante vendable unique du catalogue CS2.

### Cle primaire

- `id`

### Attributs importants

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
- `hasVariants`
- `phase`
- `collection`
- `imageUrl`
- `steamImageUrl`
- `steamAppId`
- `source`
- `sourceExternalId`
- `lastCatalogSyncAt`
- `isActive`
- `createdAt`
- `updatedAt`

### Remarque

`Item` est l'entite metier centrale du projet.

## 3.2 Entite `Market`

### Role

Represente une source de prix ou un marche.

### Cle primaire

- `id`

### Attributs importants

- `slug`
- `name`
- `enabled`
- `priority`
- `createdAt`
- `updatedAt`

### Remarque

Un `Market` correspond a une source comme `skinport`, `steam` ou une source future.

## 3.3 Entite `LatestPrice`

### Role

Represente le dernier prix connu d'un item sur un market donne.

### Cle primaire

- `id`

### Cles etrangeres

- `itemId` reference `Item.id`
- `marketId` reference `Market.id`

### Attributs importants

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
- `createdAt`
- `updatedAt`

### Contrainte importante

Le couple `(itemId, marketId)` est unique.

Interpretation :

Pour un item donne et un market donne, il n'existe qu'une seule ligne `LatestPrice` courante.

## 3.4 Entite `DailySnapshot`

### Role

Represente une photographie journaliere des prix d'un item sur un market.

### Cle primaire

- `id`

### Cles etrangeres

- `itemId` reference `Item.id`
- `marketId` reference `Market.id`

### Attributs importants

- `snapshotDate`
- `snapshotHour`
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
- `sourceFetchedAt`
- `sourceUpdatedAt`
- `createdAt`

### Contrainte importante

Le quadruplet `(snapshotDate, snapshotHour, itemId, marketId)` est unique.

Interpretation :

Pour une date, une heure logique, un item et un market, il n'existe qu'un seul snapshot.

## 3.5 Entite `SyncRun`

### Role

Represente une execution de synchronisation.

### Cle primaire

- `id`

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

### Remarque

`SyncRun` est une entite de suivi technique.
Elle n'est pas au coeur des ecrans utilisateur, mais elle est essentielle pour l'observabilite.

## 4. Relations et cardinalites

## 4.1 Relation entre `Item` et `LatestPrice`

### Formulation

Un `Item` peut etre associe a zero, une ou plusieurs lignes `LatestPrice`.

Une ligne `LatestPrice` est obligatoirement associee a un seul `Item`.

### Cardinalites

- `Item` : `0..N`
- `LatestPrice` : `1..1` vers `Item`

### Lecture simplifiee

- un item peut avoir plusieurs prix courants si plusieurs markets sont supportes
- chaque latest price appartient a un seul item

## 4.2 Relation entre `Market` et `LatestPrice`

### Formulation

Un `Market` peut etre associe a zero, une ou plusieurs lignes `LatestPrice`.

Une ligne `LatestPrice` est obligatoirement associee a un seul `Market`.

### Cardinalites

- `Market` : `0..N`
- `LatestPrice` : `1..1` vers `Market`

### Lecture simplifiee

- un market contient les derniers prix de nombreux items
- chaque latest price appartient a un seul market

## 4.3 Relation entre `Item` et `DailySnapshot`

### Formulation

Un `Item` peut etre associe a zero, une ou plusieurs lignes `DailySnapshot`.

Une ligne `DailySnapshot` est obligatoirement associee a un seul `Item`.

### Cardinalites

- `Item` : `0..N`
- `DailySnapshot` : `1..1` vers `Item`

### Lecture simplifiee

- un item peut posseder un historique de snapshots
- chaque snapshot concerne un seul item

## 4.4 Relation entre `Market` et `DailySnapshot`

### Formulation

Un `Market` peut etre associe a zero, une ou plusieurs lignes `DailySnapshot`.

Une ligne `DailySnapshot` est obligatoirement associee a un seul `Market`.

### Cardinalites

- `Market` : `0..N`
- `DailySnapshot` : `1..1` vers `Market`

### Lecture simplifiee

- un market peut produire beaucoup de snapshots
- chaque snapshot appartient a un seul market

## 4.5 Relation entre `Item` et `Market`

### Nature de la relation

La relation entre `Item` et `Market` est une relation `N..N` indirecte.

Elle est portee par :

- `LatestPrice`
- `DailySnapshot`

### Interpretation

- un item peut exister sur plusieurs markets
- un market peut contenir plusieurs items

## 4.6 Relation autour de `SyncRun`

`SyncRun` n'est pas relie par cle etrangere directe aux autres entites dans le schema actuel.

### Interpretation

Il sert de journal technique transverse pour :

- les imports catalogue
- les synchronisations de prix
- les snapshots

## 4.7 Relations futures envisagees autour de `User`

Cette partie est prospective et ne correspond pas encore au schema implemente.

### Relation entre `User` et `Portfolio`

- un `User` peut posseder `0..N` portfolios
- un `Portfolio` appartient a `1..1` utilisateur

### Relation entre `Portfolio` et `PortfolioItem`

- un `Portfolio` peut contenir `0..N` lignes `PortfolioItem`
- une ligne `PortfolioItem` appartient a `1..1` portfolio

### Relation entre `PortfolioItem` et `Item`

- une ligne `PortfolioItem` reference `1..1` item
- un `Item` peut etre reference par `0..N` lignes `PortfolioItem`

### Relation entre `User` et `SavedChart`

- un `User` peut posseder `0..N` graphiques ou widgets sauvegardes
- un `SavedChart` appartient a `1..1` utilisateur

### Relation entre `SavedChart` et `Item`

- un `SavedChart` peut cibler `0..1` ou `1..1` item selon le niveau de souplesse choisi
- un `Item` peut etre reference par `0..N` graphiques sauvegardes

## 5. Vue relationnelle synthetique

```text
Item (1) -------- (0..N) LatestPrice (0..N) -------- (1) Market
Item (1) -------- (0..N) DailySnapshot (0..N) ------ (1) Market

SyncRun
  entite technique autonome de suivi des traitements
```

## 6. Vue simplifiee type MCD

### Entites

- Item
- Market
- LatestPrice
- DailySnapshot
- SyncRun

### Associations principales

- Item "possede" LatestPrice
- Market "possede" LatestPrice
- Item "possede" DailySnapshot
- Market "possede" DailySnapshot

### Cardinalites resumees

- `Item 1,N LatestPrice`
- `Market 1,N LatestPrice`
- `Item 1,N DailySnapshot`
- `Market 1,N DailySnapshot`

En version plus rigoureuse :

- un `LatestPrice` reference exactement `1 Item` et `1 Market`
- un `DailySnapshot` reference exactement `1 Item` et `1 Market`
- un `Item` peut etre lie a `0..N LatestPrice` et `0..N DailySnapshot`
- un `Market` peut etre lie a `0..N LatestPrice` et `0..N DailySnapshot`

## 7. Contraintes de gestion importantes

### Contrainte A

Un item est unique fonctionnellement via :

- `variantKey`

### Contrainte B

Un couple `(marketHashName, phase)` est egalement contraint pour eviter certaines ambiguities de variantes.

### Contrainte C

Un seul `LatestPrice` courant est conserve par couple `(itemId, marketId)`.

### Contrainte D

Un seul `DailySnapshot` existe pour un couple `(date, heure, item, market)`.

## 8. Interet du modele

Ce modele permet de separer clairement :

- le referentiel produit avec `Item`
- la source de prix avec `Market`
- l'etat courant avec `LatestPrice`
- l'historique avec `DailySnapshot`
- la supervision technique avec `SyncRun`

Cette separation est importante pour :

- la lisibilite
- l'analyse temporelle
- l'ajout futur de nouveaux markets
- la robustesse du projet

L'extension future avec `User` et `Portfolio` permettrait de separer egalement :

- les donnees de marche globales
- les donnees personnelles de l'utilisateur
- les vues d'analyse sauvegardees

## 9. Consigne recommandee pour ChatGPT 5.5

Si tu donnes ce fichier a ChatGPT 5.5, tu peux lui demander :

"Genere a partir de ce document un MCD propre avec cardinalites explicites, puis une version Mermaid ou PlantUML. N'invente pas d'entites supplementaires non mentionnees."

Tu peux aussi lui demander :

"Propose une extension du MCD pour ajouter un espace utilisateur et un portfolio, tout en conservant les entites actuelles du projet."
