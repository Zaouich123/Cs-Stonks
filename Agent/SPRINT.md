# SPRINT.md

## Sprint actuel

Objectif : construire la **V1 de la couche de récupération, normalisation et stockage des données** pour `Cs-Stonks`.

Ce sprint doit poser une fondation propre pour :
- stocker un catalogue complet d’items CS2
- stocker les derniers prix connus par market
- figer un snapshot journalier à heure fixe
- permettre plus tard la création de graphiques d’évolution de prix

Ce sprint est uniquement centré sur la **data platform**.
Il ne faut pas construire de vrai produit frontend métier dans ce sprint.

---

## Objectif fonctionnel principal

Le système doit permettre le workflow suivant :

1. importer ou mettre à jour un **catalogue local d’items**
2. importer ou mettre à jour les **derniers prix connus** pour chaque item et chaque market
3. exécuter chaque jour un **snapshot journalier à heure fixe**
4. permettre plus tard d’afficher :
   - prix actuel
   - évolution historique
   - comparaison par market
   - graphiques par item

Le point clé :
**le snapshot journalier ne doit pas déclencher de full fetch au moment du snapshot**.

Le système doit fonctionner avec cette logique :

- le **catalogue** est relativement statique
- les **latest prices** sont mis à jour séparément
- le **daily snapshot** prend une photo de l’état courant de la table `LatestPrice`

---

## Décision d’architecture principale

Le système doit séparer clairement 3 niveaux de données :

### 1. Catalogue des items
Données lentes à changer :
- skin
- sticker
- case
- capsule
- knife
- glove
- charm
- agent
- etc.

Chaque item doit représenter une **variante vendable unique**.

Exemples :
- `AK-47 | Redline (Field-Tested)`
- `StatTrak™ AK-47 | Redline (Field-Tested)`
- `Sticker | Titan (Holo) | Katowice 2014`
- `DreamHack 2014 Legends Capsule`

### 2. Derniers prix connus
Données dynamiques :
- prix actuel
- quantité
- volume
- date de récupération
- source market

Ces données vivent dans une table dédiée de type `LatestPrice`.

### 3. Snapshots historiques
Données figées :
- copie quotidienne des `LatestPrice`
- pour permettre des graphiques historiques
- pour avoir toujours une référence cohérente “à la même heure”

---

## Base de données attendue

Utiliser **PostgreSQL** avec **Prisma**.

La base doit être conçue pour :
- ingérer facilement
- être idempotente
- supporter l’historique
- permettre des requêtes futures pour graphiques

---

## Modèle de données détaillé

### 1. `Item`
Représente une variante vendable unique.

Un `Item` doit correspondre à un objet réellement traçable dans un market.

Exemples :
- un skin avec exterior donné
- un skin StatTrak avec exterior donné
- un skin Souvenir avec exterior donné
- un sticker
- une caisse
- une capsule
- un couteau / gant / charm / agent

#### Champs attendus
- `id`
- `marketHashName`
- `itemType`
- `weapon`
- `skinName`
- `displayName`
- `exterior`
- `rarity`
- `stattrak`
- `souvenir`
- `phase`
- `collection`
- `imageUrl`
- `steamImageUrl`
- `isActive`
- `createdAt`
- `updatedAt`

#### Contraintes
- `marketHashName` doit être indexé
- prévoir une unicité robuste
- si nécessaire, utiliser une contrainte combinée avec `phase`
- `itemType` doit être exploitable en filtres

#### But métier
Cette table est le **catalogue de référence**.
Elle ne doit pas stocker les prix.

---

### 2. `Market`
Représente une source de prix.

Exemples :
- steam
- csfloat
- skinport
- buff
- local_mock

#### Champs attendus
- `id`
- `slug`
- `name`
- `enabled`
- `priority`
- `createdAt`
- `updatedAt`

#### Contraintes
- `slug` unique
- `enabled` permet de désactiver une source sans supprimer les données

#### But métier
Permet de rattacher un prix à un marché précis.

---

### 3. `LatestPrice`
Représente le dernier prix connu pour un couple `(item, market)`.

Cette table doit être la **source de vérité temps quasi-réel**.

#### Champs attendus
- `id`
- `itemId`
- `marketId`
- `price`
- `currency`
- `quantity`
- `volume`
- `fetchedAt`
- `sourceUpdatedAt`
- `createdAt`
- `updatedAt`

#### Contraintes
- unicité sur `(itemId, marketId)`
- index sur `itemId`
- index sur `marketId`
- index sur `(marketId, fetchedAt)`
- index sur `(itemId, fetchedAt)` si utile

#### But métier
Quand un provider remonte un nouveau prix :
- on ne crée pas forcément une nouvelle ligne
- on fait un **upsert**
- la ligne représente toujours le **dernier état connu**

---

### 4. `DailySnapshot`
Représente l’historique figé à heure fixe.

Chaque jour, à heure fixe, on doit copier l’état de `LatestPrice` vers `DailySnapshot`.

#### Champs attendus
- `id`
- `snapshotDate`
- `snapshotHour`
- `itemId`
- `marketId`
- `price`
- `currency`
- `quantity`
- `volume`
- `sourceFetchedAt`
- `sourceUpdatedAt`
- `createdAt`

#### Contraintes
- index sur `snapshotDate`
- index sur `(itemId, snapshotDate)`
- index sur `(marketId, snapshotDate)`
- unicité recommandée sur `(snapshotDate, snapshotHour, itemId, marketId)`

#### But métier
Cette table sert à :
- construire les graphiques
- comparer l’évolution jour par jour
- conserver un historique stable même si `LatestPrice` change ensuite

---

### 5. `SyncRun`
Table d’audit pour chaque synchronisation.

#### Champs attendus
- `id`
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

#### Valeurs utiles
- `syncType` :
  - `catalog`
  - `prices`
  - `snapshot`

- `status` :
  - `pending`
  - `running`
  - `success`
  - `failed`
  - `partial`

#### But métier
Permet de :
- suivre les syncs
- diagnostiquer les erreurs
- savoir combien d’items ont été traités

---

## Relations attendues

### `Item`
- a plusieurs `LatestPrice`
- a plusieurs `DailySnapshot`

### `Market`
- a plusieurs `LatestPrice`
- a plusieurs `DailySnapshot`

### `LatestPrice`
- appartient à un `Item`
- appartient à un `Market`

### `DailySnapshot`
- appartient à un `Item`
- appartient à un `Market`

---

## Stratégie de stockage à respecter

Le projet doit appliquer cette stratégie :

### Catalogue
Le catalogue est mis à jour :
- au démarrage
- à la demande
- éventuellement via un cron lent
- mais pas à haute fréquence

Le catalogue change peu.

### Latest prices
Les derniers prix connus sont mis à jour :
- régulièrement
- indépendamment des snapshots
- via syncs relançables

### Daily snapshots
Les snapshots journaliers sont créés :
- à heure fixe
- à partir des `LatestPrice`
- sans aller chercher de nouvelles données externes

---

## Cron / scheduling attendu

Le système doit intégrer un **mécanisme de planification simple**.

Le but est de pouvoir exécuter automatiquement :

1. une mise à jour du catalogue à faible fréquence
2. une mise à jour des derniers prix à fréquence plus élevée
3. un snapshot journalier à heure fixe

---

## Règles de cron détaillées

### 1. Cron catalogue
Fréquence recommandée :
- 1 fois par jour
- ou 1 fois par semaine
- ou déclenchement manuel si on reste sur un MVP

#### Rôle
- importer nouveaux items
- mettre à jour images / métadonnées si besoin
- garder le catalogue cohérent

#### Important
Le cron catalogue est **lent** et **rare**.

---

### 2. Cron latest prices
Fréquence recommandée pour le sprint MVP :
- toutes les heures
- ou toutes les 30 minutes

Comme on est en provider local/mock pour l’instant, le système doit être architecturé comme s’il pouvait plus tard tourner plus souvent.

#### Rôle
- lire les prix depuis les providers
- résoudre les items concernés
- créer/mettre à jour `LatestPrice`
- enregistrer un `SyncRun`

#### Important
- il doit être **idempotent**
- il doit être **relançable**
- il ne doit pas casser si certains items sont absents
- il doit journaliser les échecs partiels

---

### 3. Cron daily snapshot
Fréquence :
- 1 fois par jour
- à heure fixe

#### Heure recommandée pour le sprint
Choisir une heure claire et documentée, par exemple :
- `02:05 Europe/Paris`

#### Rôle
- lire toutes les lignes de `LatestPrice`
- copier ces données dans `DailySnapshot`
- utiliser la date du jour et l’heure logique de snapshot
- enregistrer un `SyncRun`

#### Important
Le snapshot :
- **ne doit pas déclencher de provider**
- **ne doit pas fetch des prix**
- **doit seulement figer l’état courant**

---

## Logique “même heure tous les jours”

C’est un point obligatoire du sprint.

Le système doit permettre d’avoir :
- un snapshot journalier cohérent
- toujours à la même heure logique
- même si les `LatestPrice` ont été mis à jour avant cette heure

### Ce que cela signifie
À `02:05 Europe/Paris` :
- on exécute le job snapshot
- on copie l’état de `LatestPrice`
- on stocke :
  - `snapshotDate`
  - `snapshotHour`
  - `sourceFetchedAt`

### Pourquoi c’est important
Plus tard, pour les graphiques :
- on pourra afficher un point par jour
- à heure cohérente
- tout en sachant de quand venait réellement la donnée source

### Donc
Le système doit obligatoirement stocker dans `DailySnapshot` :
- la date du snapshot
- l’heure logique du snapshot
- le `sourceFetchedAt` réel du prix copié

---

## Comportement attendu des services

---

### `catalogSyncService`

#### Rôle
- appeler un `CatalogProvider`
- récupérer les items
- normaliser les champs
- insérer ou mettre à jour les items
- enregistrer un `SyncRun`

#### Comportement attendu
- idempotent
- si un item existe déjà, mise à jour propre
- ne pas créer de doublons
- séparer bien la normalisation de la persistance

#### Résultat attendu
- nombre d’items reçus
- nombre créés
- nombre mis à jour
- erreurs éventuelles

---

### `latestPriceSyncService`

#### Rôle
- appeler un `PriceProvider`
- récupérer des prix
- résoudre `itemId` + `marketId`
- upsert dans `LatestPrice`
- enregistrer un `SyncRun`

#### Comportement attendu
- gérer les items absents
- ignorer ou journaliser les prix non mappables
- faire des upserts robustes
- éviter la création de doublons

#### Résultat attendu
- prix traités
- prix upserted
- prix ignorés
- erreurs éventuelles

---

### `dailySnapshotService`

#### Rôle
- lire toutes les lignes de `LatestPrice`
- créer un snapshot figé
- enregistrer un `SyncRun`

#### Comportement attendu
- ne jamais appeler un provider
- être relançable
- éviter les doublons si on relance le même snapshot
- utiliser une contrainte d’unicité pour protéger les insertions

#### Résultat attendu
- nombre de lignes copiées
- date / heure du snapshot
- statut de l’exécution

---

## Providers à créer

Créer des interfaces extensibles :

### `CatalogProvider`
Doit exposer une méthode du type :
- `fetchCatalog(): Promise<RawCatalogItem[]>`

### `PriceProvider`
Doit exposer une méthode du type :
- `fetchLatestPrices(): Promise<RawPriceRecord[]>`

---

## Implémentations obligatoires pour ce sprint

### `MockCatalogProvider`
- retourne un petit jeu de données codé ou mocké

### `JsonCatalogProvider`
- lit un fichier JSON local

### `MockPriceProvider`
- retourne un petit set de prix fictifs

### `JsonPriceProvider`
- lit un fichier JSON local

---

## Fixtures attendues

Créer des fixtures JSON locales pour démontrer :

### Catalogue
Au minimum :
- quelques skins
- quelques stickers
- quelques caisses
- quelques items avec `stattrak`
- quelques items avec `exterior`

### Prix
Au minimum :
- plusieurs marchés
- plusieurs items
- quelques variations de prix
- quelques données partielles pour tester la robustesse

---

## Routes API internes à créer

Créer les routes suivantes :

### `POST /api/internal/sync/catalog`
Déclenche l’import du catalogue

### `POST /api/internal/sync/prices`
Déclenche la sync des derniers prix

### `POST /api/internal/snapshots/daily`
Déclenche la création d’un snapshot journalier

### `GET /api/internal/health`
Retourne l’état basique du service

---

## Règles pour les routes internes

- route handlers minces
- logique dans les services
- réponses JSON structurées
- messages d’erreur propres
- faciles à sécuriser plus tard

---

## Système de planification à implémenter

Pour ce sprint, implémenter une solution simple et claire.

### Option acceptable
- un module de jobs / scheduler dans le projet
- basé sur une librairie simple de cron Node
- ou des scripts déclenchables manuellement + documentation pour cron externe

### Minimum obligatoire
Même si le cron automatique n’est pas branché complètement en production, il faut au moins :
- prévoir les fonctions de jobs
- les rendre appelables
- documenter comment les déclencher
- documenter la future exécution automatique

---

## Recommandation d’implémentation cron

Créer par exemple :

- `src/modules/catalog/jobs/runCatalogSyncJob.ts`
- `src/modules/pricing/jobs/runLatestPricesSyncJob.ts`
- `src/modules/snapshots/jobs/runDailySnapshotJob.ts`

Puis un orchestrateur éventuel :
- `src/modules/jobs/registerCronJobs.ts`

Le scheduler doit documenter :

- cron catalogue : faible fréquence
- cron prix : fréquence moyenne
- cron snapshot : quotidienne à heure fixe

---

## Exemple de stratégie documentée

### Catalogue
- exécution manuelle
- ou quotidienne à `03:00`

### Latest prices
- exécution toutes les heures

### Daily snapshot
- exécution quotidienne à `02:05 Europe/Paris`

Le README doit expliquer ces choix.

---

## Ordre de travail recommandé

1. setup PostgreSQL + Prisma
2. modéliser la base
3. créer migrations
4. créer types et interfaces provider
5. créer fixtures JSON
6. implémenter `catalogSyncService`
7. implémenter `latestPriceSyncService`
8. implémenter `dailySnapshotService`
9. créer les jobs
10. créer les routes API
11. ajouter tests
12. documenter setup et cron

---

## Découpage recommandé en branches

### 1.
`chore/bootstrap-next-prisma-postgres`

### 2.
`feature/prisma-catalog-pricing-snapshots-schema`

### 3.
`feature/provider-interfaces-and-fixtures`

### 4.
`feature/catalog-sync-service`

### 5.
`feature/latest-prices-sync-service`

### 6.
`feature/daily-snapshot-service`

### 7.
`feature/internal-sync-routes`

### 8.
`feature/cron-jobs`

### 9.
`test/data-sync-and-snapshots`

### 10.
`docs/setup-cron-and-data-flow`

---

## Tickets recommandés

### Ticket 1
**Bootstrap project with Next.js, Prisma and PostgreSQL**

### Ticket 2
**Design Prisma schema for items, markets, latest prices and daily snapshots**

### Ticket 3
**Create provider interfaces and local fixtures**

### Ticket 4
**Implement catalog sync service**

### Ticket 5
**Implement latest prices sync service**

### Ticket 6
**Implement daily snapshot service**

### Ticket 7
**Add internal API routes for sync and health**

### Ticket 8
**Add cron job layer and scheduling documentation**

### Ticket 9
**Add tests for idempotence and snapshot behavior**

### Ticket 10
**Document setup, jobs and data flow**

---

## Définition of done

Le sprint est terminé si :

- PostgreSQL est configuré
- Prisma fonctionne avec migrations
- `Item`, `Market`, `LatestPrice`, `DailySnapshot`, `SyncRun` existent
- le catalogue peut être importé depuis JSON/mock
- les derniers prix peuvent être importés depuis JSON/mock
- les upserts `LatestPrice` fonctionnent
- le snapshot journalier copie `LatestPrice` vers `DailySnapshot`
- le snapshot ne déclenche aucun fetch
- les jobs existent
- la logique de cron est documentée
- les routes internes fonctionnent
- les tests critiques existent
- le README explique le flux complet

---

## Instruction finale

Pendant ce sprint :
- concentre-toi sur les fondations data
- ne dérive pas vers le frontend métier
- construis un système simple, propre, relançable et évolutif

La priorité absolue est :
1. qualité du modèle de données
2. robustesse des syncs
3. cohérence du snapshot journalier
4. clarté de l’architecture