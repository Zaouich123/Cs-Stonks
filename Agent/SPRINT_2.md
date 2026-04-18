---

## Bloc 1 — vrai provider

### Objectif

Ajouter un provider réel compatible avec l’architecture existante.

### Attendu

Le provider réel doit :

- être isolé dans son propre dossier
- utiliser un client HTTP dédié
- transformer les données brutes en format interne
- ne pas mélanger logique HTTP et logique métier
- implémenter l’interface `PriceProvider`

### Le provider doit gérer

- erreurs HTTP
- réponses partielles
- timeouts
- payload inattendu
- mapping des items
- market courant

### Le provider ne doit pas

- écrire directement en base
- bypass le `latestPriceSyncService`
- mélanger récupération, normalisation et persistance dans une seule fonction

---

## Bloc 2 — robustesse ingestion

Le sprint 2 doit fiabiliser la couche de sync.

### À ajouter

#### 1. Logs plus clairs

Les syncs doivent loguer au minimum :

- début du run
- provider utilisé
- nombre de lignes reçues
- nombre de lignes traitées
- nombre de lignes ignorées
- nombre d’erreurs
- durée

#### 2. Gestion d’erreurs propre

Les syncs ne doivent pas exploser au premier enregistrement invalide.  
Il faut distinguer :

- erreur globale fatale
- erreur partielle sur certaines lignes

#### 3. Timeouts réseau

Le client HTTP du vrai provider doit avoir un timeout clair.

#### 4. Retries simples

Facultatif mais recommandé :

- 1 ou 2 retries max sur erreurs réseau transitoires

#### 5. Données non mappables

Si un prix remonte pour un item non connu :

- le système doit le journaliser
- l’ignorer proprement
- continuer la sync

#### 6. Résultat de sync plus riche

Le service de sync doit renvoyer un résumé structuré, par exemple :

- total reçus
- total mappés
- total upsertés
- total ignorés
- total échoués

---

## Bloc 3 — endpoints de lecture

Le sprint 2 doit ajouter les premiers endpoints de lecture utiles.

### Endpoints minimums à créer

#### `GET /api/items`

**But :**

- lister les items
- permettre recherche simple
- permettre pagination simple

**Réponse attendue :**

- liste d’items
- pagination minimale
- métadonnées simples

#### `GET /api/items/:itemId`

**But :**

- récupérer le détail d’un item

**Réponse attendue :**

- identité item
- métadonnées principales

#### `GET /api/items/:itemId/latest-prices`

**But :**

- récupérer les derniers prix de l’item par market

**Réponse attendue :**

- item
- liste des prix courants
- tri possible par market ou prix

#### `GET /api/items/:itemId/history`

**But :**

- récupérer l’historique journalier d’un item

**Réponse attendue :**

- item
- série historique
- éventuellement filtrable par market
- éventuellement filtrable par période

### Contrat attendu des endpoints de lecture

Les endpoints de lecture doivent être pensés pour un frontend futur.

Ils doivent fournir :

- des réponses JSON propres
- des noms de champs lisibles
- des listes triables
- des formats de date cohérents
- un comportement stable

Ils ne doivent pas :

- exposer la structure Prisma brute sans réflexion
- forcer le frontend à faire trop de reconstruction
- mélanger lecture métier et logique d’admin

---

## Recherche et listing d’items

Le sprint 2 doit permettre au minimum une recherche simple.

### Recherche minimale attendue

Sur `GET /api/items`, permettre :

- recherche texte
- filtre par type d’item
- pagination
- tri simple

### Exemples de filtres utiles

- `query`
- `itemType`
- `page`
- `limit`

### Exemple d’usage

- rechercher `ak redline`
- lister tous les stickers
- lister les cases
- paginer les résultats

---

## Historique d’un item

Le sprint 2 doit ajouter une vraie lecture de l’historique.

### Source

L’historique doit venir de `DailySnapshot`.

### Le service doit permettre

- historique complet d’un item
- filtrage par market
- plage de dates simple si besoin

### Format attendu

Le format doit être prêt pour les graphiques.

Exemple logique :

- `date`
- `hour`
- `market`
- `price`
- `currency`

---

## Prix actuels par item

Le sprint 2 doit permettre de récupérer l’état courant.

### Source

Les données doivent venir de `LatestPrice`.

### Le service doit permettre

- lister tous les prix actuels d’un item
- inclure le market
- inclure `fetchedAt`
- inclure `sourceUpdatedAt`

---

## Catalogue — ajustements attendus

Le sprint 2 peut améliorer le catalogue si nécessaire.

### Améliorations recommandées

- ajout d’un `slug`
- ajout d’un champ de recherche simplifié
- amélioration de `displayName`
- amélioration des métadonnées utiles au front

### Important

Le catalogue doit continuer à rester distinct des prix.

---

## Jobs / cron

Le sprint 2 doit conserver les jobs du sprint 1 et les fiabiliser.

### Jobs existants

- `runCatalogSync()`
- `runLatestPricesSync()`
- `runDailySnapshot()`

### Attendus supplémentaires

- logs plus riches
- meilleure gestion d’erreurs
- paramètres de provider si besoin
- meilleure observabilité

### Politique recommandée

- catalog : rare ou manuel
- prices : régulier
- snapshot : quotidien à heure fixe

---

## Gestion des providers

Le sprint 2 doit permettre de choisir le provider utilisé pour la sync prix.

### Attendu

Le système doit pouvoir utiliser :

- `json`
- `mock`
- `real`

### Exemple

Le job ou la route interne peut recevoir :

- un provider explicite
- ou une valeur par défaut via variable d’environnement

---

## Variables d’environnement attendues

Le sprint 2 doit documenter les variables nécessaires au provider réel.

### Exemples possibles

- `DATABASE_URL`
- `PRICE_PROVIDER`
- `REAL_PROVIDER_BASE_URL`
- `REAL_PROVIDER_API_KEY`
- `REAL_PROVIDER_TIMEOUT_MS`

Même si la source exacte change, le principe doit être documenté.

---

## Services à créer ou enrichir

### Côté ingestion

#### `latestPriceSyncService`

À enrichir pour :

- supporter le vrai provider
- mieux résumer les résultats
- mieux journaliser
- mieux gérer les erreurs partielles

### Côté lecture

Créer :

#### `listItemsService`

**Responsabilités :**

- lister les items
- gérer recherche simple
- gérer pagination

#### `getItemByIdService`

**Responsabilités :**

- récupérer un item
- retourner ses métadonnées

#### `getLatestPricesByItemService`

**Responsabilités :**

- lire `LatestPrice`
- joindre `Market`
- retourner les prix actuels

#### `getItemHistoryService`

**Responsabilités :**

- lire `DailySnapshot`
- joindre `Market`
- retourner une série historique exploitable

---

## Tests attendus

Le sprint 2 doit ajouter des tests ciblés sur les nouveaux comportements.

### À tester

#### Vrai provider

- mapping de payload
- gestion de réponse invalide
- gestion de timeout
- gestion de donnée partielle

#### Sync prix

- upsert correct
- item non trouvé ignoré proprement
- market résolu correctement
- résumé de sync correct

#### Read side

- listing items
- lecture item par ID
- historique item
- latest prices item

#### Snapshot

- continue à fonctionner avec des données réelles en base
- ne fetch aucune donnée

---

## Scénarios de test manuels attendus

À la fin du sprint 2, tu dois pouvoir tester ceci :

### 1. Sync réelle

Déclencher une sync prix avec le vrai provider.

**Attendu :**

- lignes créées ou mises à jour dans `LatestPrice`
- `SyncRun` créé
- pas de crash global sur quelques erreurs de données

### 2. Lecture item

Appeler :

- `GET /api/items`
- `GET /api/items/:itemId`

**Attendu :**

- données lisibles
- pagination simple
- recherche simple

### 3. Lecture latest prices

Appeler :

- `GET /api/items/:itemId/latest-prices`

**Attendu :**

- prix actuels par market
- dates de fetch visibles

### 4. Lecture history

Appeler :

- `GET /api/items/:itemId/history`

**Attendu :**

- série historique structurée
- exploitable ensuite en chart

---

## Branching pour ce sprint

Maximum 3 branches.

### Branche 1

#### `feature/real-provider-and-ingestion-hardening`

Contient :

- vrai provider
- client HTTP
- mapping
- robustesse sync
- logs
- erreurs
- évolution éventuelle du schéma si nécessaire

### Branche 2

#### `feature/read-api-items-and-prices`

Contient :

- services de lecture
- endpoints `GET /api/items`
- `GET /api/items/:itemId`
- `GET /api/items/:itemId/latest-prices`
- `GET /api/items/:itemId/history`

### Branche 3

#### `feature/tests-and-docs-sprint-2`

Contient :

- tests du vrai provider
- tests des endpoints de lecture
- doc d’utilisation
- `.env.example`
- `README` mis à jour

---

## Ordre de travail recommandé

- choisir et brancher le premier vrai provider
- fiabiliser `latestPriceSyncService`
- ajuster le schéma si nécessaire
- tester la sync réelle
- implémenter les services de lecture
- implémenter les endpoints de lecture
- ajouter les tests
- mettre à jour la documentation

---

## Definition of Done

Le sprint 2 est terminé si :

- au moins un vrai provider fonctionne
- les prix réels peuvent être ingérés
- `LatestPrice` reste cohérent
- `DailySnapshot` reste compatible
- les syncs sont plus robustes
- les erreurs sont mieux gérées
- les logs sont plus utiles
- `GET /api/items` fonctionne
- `GET /api/items/:itemId` fonctionne
- `GET /api/items/:itemId/latest-prices` fonctionne
- `GET /api/items/:itemId/history` fonctionne
- les tests critiques existent
- la documentation est à jour

---

## Résultat attendu à la fin du sprint

À la fin de ce sprint, le projet doit être passé de :

> “pipeline de test basé sur JSON/mock”

à :

> “pipeline capable d’ingérer de vraies données”  
> “API capable d’exposer ces données”  
> “base prête pour brancher une première vraie page item”

---

## Instruction finale

Pendant ce sprint :

- ne pas chercher à brancher trop de providers
- ne pas faire de frontend avancé
- ne pas complexifier l’infrastructure

Le focus est :

- ingestion réelle
- fiabilité
- lecture des données
- préparation du sprint UI / charts