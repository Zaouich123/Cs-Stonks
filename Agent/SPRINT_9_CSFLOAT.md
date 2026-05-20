# SPRINT_9.md

## Contexte

Les sprints précédents ont construit :

- le catalogue complet des items CS2
- la base de données produit
- les prix Skinport
- les prix Steam
- les snapshots journaliers
- les pages frontend principales
- les graphiques basés sur la BDD

Le sprint 9 doit maintenant ajouter un nouveau marketplace :

- **CSFloat**

L’objectif est d’intégrer CSFloat comme une source de prix supplémentaire dans le projet, afin de permettre la comparaison multi-market :

- Steam
- Skinport
- CSFloat
- autres markets futurs

---

## Objectif du sprint

Ajouter une ingestion propre pour le market :

```text
csfloat
```

Le système doit :

1. ajouter CSFloat comme market en BDD
2. utiliser l’API CSFloat officielle
3. récupérer les listings CSFloat
4. dériver un prix par item à partir des listings actifs
5. mapper les prix vers les items existants via `market_hash_name`
6. mettre à jour `LatestPrice`
7. créer des snapshots journaliers depuis la BDD
8. permettre aux graphiques de comparer CSFloat avec les autres markets
9. éviter de dépendre de CSFloat au runtime du frontend

---

## Source API à utiliser

Utiliser l’API officielle CSFloat :

```text
https://csfloat.com/api/v1
```

Documentation :

```text
https://docs.csfloat.com/
```

Endpoint principal :

```http
GET /api/v1/listings
```

Cet endpoint récupère les listings actifs sur CSFloat Market.

---

## Authentification CSFloat

CSFloat utilise des API keys.

L’API key est à créer depuis le profil CSFloat, dans l’onglet développeur.

### Header attendu

```http
Authorization: <CSFLOAT_API_KEY>
```

### Important

La clé API doit être :

- stockée côté serveur uniquement
- jamais exposée côté frontend
- jamais envoyée au navigateur
- configurée via `.env`

### Variables d’environnement

Ajouter dans `.env.example` :

```env
CSFLOAT_API_BASE_URL=https://csfloat.com/api/v1
CSFLOAT_API_KEY=
CSFLOAT_SYNC_ENABLED=true
CSFLOAT_CURRENCY=USD
CSFLOAT_TIMEOUT_MS=30000
CSFLOAT_LISTINGS_LIMIT=50
CSFLOAT_MAX_PAGES_PER_RUN=100
CSFLOAT_DELAY_MS=1000
CSFLOAT_MAX_RETRIES=3
CSFLOAT_BACKOFF_MS=30000
```

---

## Faisabilité importante

CSFloat fournit un endpoint de listings, mais pas forcément un endpoint officiel simple du type :

```text
GET all item prices aggregated by market_hash_name
```

Donc il faut dériver les prix à partir des listings actifs.

### Endpoint disponible

```http
GET /api/v1/listings
```

### Paramètres utiles

- `cursor`
- `limit`
- `sort_by`
- `category`
- `min_price`
- `max_price`
- `market_hash_name`
- `type`

### Limite importante

La documentation indique :

```text
limit default = 50
limit max = 50
```

Donc il faut paginer.

---

## Stratégie recommandée

Il y a deux stratégies possibles.

### Stratégie A — Full sweep listings

Le système parcourt les listings actifs page par page.

Pour chaque listing :
- lire `item.market_hash_name`
- lire `price`
- lire `item.float_value`
- lire `item.is_stattrak`
- lire `item.is_souvenir`
- lire `item.wear_name`
- lire `created_at`
- agréger par `market_hash_name`

Ensuite, pour chaque `market_hash_name`, calculer :

- lowest ask
- quantity active listings
- min float si utile
- max float si utile
- date de collecte

Cette stratégie permet de construire une vision large du marché CSFloat.

### Stratégie B — Targeted per-item lookup

Pour un item spécifique :

```http
GET /api/v1/listings?market_hash_name=<name>&sort_by=lowest_price&type=buy_now&limit=1
```

Cette stratégie permet de récupérer rapidement le lowest ask d’un item précis.

### Décision du sprint

Implémenter les deux modes :

1. **full sweep paginé** pour construire la couverture globale progressivement
2. **targeted lookup** pour refresh rapidement un item prioritaire

---

## Pourquoi deux modes

### Full sweep

Avantages :
- permet de découvrir beaucoup de listings
- permet d’agréger les prix par item
- bon pour une ingestion régulière globale

Inconvénients :
- demande beaucoup de pages
- peut être long
- dépend des limites API

### Targeted lookup

Avantages :
- très efficace pour un item précis
- utile pour une page item
- utile pour rafraîchir les items populaires

Inconvénients :
- trop coûteux si utilisé sur tout le catalogue
- ne doit pas remplacer le sweep global pour tous les items

---

## Règle produit principale

Comme pour Steam et Skinport :

```text
CSFloat = source d’ingestion
BDD locale = source de vérité produit
graphes = calculés depuis la BDD
frontend = ne dépend pas directement de CSFloat
```

Le frontend ne doit pas appeler CSFloat directement.

Les pages doivent lire :

- `LatestPrice` pour le dernier prix connu
- `DailySnapshot` pour les graphiques historiques

---

## Market à créer en BDD

Le sprint doit garantir l’existence du market :

```text
slug = csfloat
name = CSFloat
enabled = true
```

### Important

Même si les données viennent du provider technique `csfloat_listings`, le market métier est :

```text
csfloat
```

---

## Champs CSFloat utiles

Dans un listing CSFloat, les champs importants sont :

### Listing

- `id`
- `created_at`
- `type`
- `price`
- `state`
- `min_offer_price`
- `max_offer_discount`

### Item

- `asset_id`
- `def_index`
- `paint_index`
- `paint_seed`
- `float_value`
- `is_stattrak`
- `is_souvenir`
- `rarity`
- `quality`
- `market_hash_name`
- `item_name`
- `wear_name`
- `collection`
- `icon_url`
- `inspect_link`
- `stickers`
- `scm`

---

## Normalisation du prix

CSFloat retourne les prix en cents.

Exemple :

```text
price = 260000
```

signifie :

```text
2600.00 USD
```

### Règle

Si `LatestPrice.price` est un Decimal :

```text
price = listing.price / 100
```

Si le projet utilise des minor units :

```text
price = listing.price
```

### Important

Le choix doit être cohérent avec les sprints précédents.

Ne pas mélanger Decimal et cents sans documentation.

---

## Prix principal à stocker

Pour CSFloat, la métrique produit principale doit être :

```text
lowest ask
```

Le `lowest ask` est le prix le plus bas observé pour un `market_hash_name` pendant le sweep ou le targeted lookup.

### Mapping recommandé

```text
LatestPrice.price = lowestAsk
LatestPrice.quantity = activeListingsCount
LatestPrice.currency = USD
LatestPrice.sourceUpdatedAt = newest listing updated/created date if available
LatestPrice.fetchedAt = now()
```

---

## Agrégation par market_hash_name

Le provider doit transformer plusieurs listings en un record agrégé par item.

### Exemple

Listings reçus :

```text
AK-47 | Redline (Field-Tested) -> 1250 cents
AK-47 | Redline (Field-Tested) -> 1290 cents
AK-47 | Redline (Field-Tested) -> 1400 cents
```

Record final :

```text
marketHashName = AK-47 | Redline (Field-Tested)
lowestAsk = 12.50
quantity = 3
currency = USD
```

---

## Mapping avec le catalogue

### Clé principale

Le mapping doit utiliser :

```text
market_hash_name
```

### Process attendu

Pour chaque record agrégé :

1. lire `market_hash_name`
2. rechercher l’item correspondant dans `Item`
3. si trouvé, mapper vers `itemId`
4. si non trouvé, logger comme `unmapped`
5. continuer la sync

### Important

La sync ne doit jamais échouer entièrement parce qu’un item n’est pas trouvé.

---

## Gestion des stickers / crafts / floats

CSFloat liste des items individuels.
Deux listings du même `market_hash_name` peuvent avoir des valeurs très différentes à cause de :

- float très rare
- stickers chers
- patterns
- seed
- StatTrak / Souvenir
- crafts

### Règle du sprint

Pour `LatestPrice`, on agrège par `market_hash_name`.

Mais les données individuelles peuvent être conservées optionnellement en `rawPayload` ou dans une future table dédiée.

### Hors scope pour ce sprint

Ne pas construire encore :

- pricing premium par stickers
- pricing par float exact
- pricing par pattern rare
- pricing par seed
- analyse de crafts

Le sprint doit se concentrer sur :

```text
lowest ask par market_hash_name
```

---

## Option recommandée : table de listings observés

Pour améliorer la qualité des analyses futures, Gemini Pro peut ajouter une table optionnelle :

```text
MarketListingObservation
```

### Champs possibles

- `id`
- `marketId`
- `itemId`
- `externalListingId`
- `marketHashName`
- `price`
- `currency`
- `floatValue`
- `paintIndex`
- `paintSeed`
- `assetId`
- `inspectLink`
- `sourceUrl`
- `observedAt`
- `rawPayload`

### Important

Cette table est optionnelle.

La priorité reste :

- `LatestPrice`
- `DailySnapshot`

---

## DailySnapshot

Après ingestion, le snapshot doit être créé depuis `LatestPrice`.

### Règle absolue

Le snapshot ne doit pas appeler CSFloat.

Il doit uniquement copier la BDD.

### Données à stocker

- `snapshotDate`
- `snapshotHour`
- `itemId`
- `marketId = csfloat`
- `price`
- `currency`
- `quantity`
- `sourceFetchedAt`
- `sourceUpdatedAt`

---

## Curseur / pagination

CSFloat utilise un curseur opaque.

### Règle

Le provider doit :

- lire le `cursor` de la réponse si présent
- le stocker dans `SyncRun.metadata` ou une table dédiée
- reprendre au curseur suivant au run suivant
- arrêter proprement si plus de cursor

### Variables recommandées

```env
CSFLOAT_LISTINGS_LIMIT=50
CSFLOAT_MAX_PAGES_PER_RUN=100
CSFLOAT_DELAY_MS=1000
```

---

## Rate limits et prudence

La documentation CSFloat ne donne pas forcément une limite claire pour toutes les opérations.

Le sprint doit donc être prudent.

### Règles

- ne pas spammer l’API
- ajouter un délai entre les pages
- gérer `429`
- gérer `Retry-After` si présent
- faire un backoff
- sauvegarder le curseur avant arrêt
- limiter le nombre de pages par run

### Important

Ne pas utiliser de proxies.
Ne pas contourner les limites.
Ne pas faire de scraping agressif.

---

## Modes de sync

Créer trois modes.

### 1. `sweep`

Parcourt les listings actifs avec pagination.

Objectif :
- couverture globale progressive

### 2. `targeted`

Rafraîchit un ou plusieurs items spécifiques via `market_hash_name`.

Objectif :
- refresh rapide d’un item affiché
- refresh d’items prioritaires

### 3. `sweep-and-snapshot`

Lance un sweep, puis crée un snapshot depuis la BDD.

Objectif :
- job manuel simple

---

## Architecture attendue

Structure recommandée :

```text
src/
  app/
    api/
      internal/
        sync/
          csfloat/
            route.ts
          csfloat-and-snapshot/
            route.ts

  modules/
    providers/
      csfloat/
        csfloat.client.ts
        csfloat.types.ts
        csfloatListingsProvider.ts
        csfloat.mapper.ts
        csfloatAggregator.ts

    pricing/
      services/
        csfloatIngestionService.ts
      utils/
        resolveItemByMarketHashName.ts
        normalizeExternalPrice.ts

    jobs/
      runCsfloatListingsSweep.ts
      runCsfloatTargetedRefresh.ts
      runCsfloatIngestionAndSnapshot.ts

    snapshots/
      services/
        dailySnapshotService.ts
```

---

## Client CSFloat

Créer :

```text
csfloat.client.ts
```

### Responsabilités

- centraliser la base URL
- ajouter le header `Authorization`
- gérer `cursor`
- gérer `limit`
- gérer les filtres
- gérer timeout
- gérer 429
- gérer retries
- ne pas écrire en BDD

---

## Types à créer

Créer des types TypeScript propres :

```text
CsfloatListing
CsfloatListingItem
CsfloatListingsResponse
CsfloatListingsQuery
NormalizedCsfloatListing
AggregatedCsfloatPriceRecord
CsfloatSyncMode
```

### Règle

Ne pas utiliser `any` dans les services principaux.

---

## Provider à créer

Créer :

```text
CsfloatListingsProvider
```

### Responsabilités

- appeler `GET /api/v1/listings`
- gérer la pagination
- retourner des listings normalisés
- ne pas écrire en BDD

---

## Aggregator à créer

Créer :

```text
csfloatAggregator.ts
```

### Responsabilités

- recevoir des listings normalisés
- grouper par `market_hash_name`
- calculer `lowestAsk`
- calculer `quantity`
- retourner des records de prix agrégés

### Sortie attendue

```ts
type AggregatedCsfloatPriceRecord = {
  marketHashName: string
  lowestAsk: number
  quantity: number
  currency: "USD"
  sourceUpdatedAt: Date | null
  fetchedAt: Date
  rawSample?: unknown
}
```

---

## Service d’ingestion

Créer :

```text
csfloatIngestionService.ts
```

### Responsabilités

- garantir l’existence du market `csfloat`
- lancer le provider en mode `sweep` ou `targeted`
- agréger les listings
- mapper les items via `market_hash_name`
- upsert `LatestPrice`
- écrire `SyncRun`
- sauvegarder le cursor
- retourner un résumé clair

### Résumé attendu

```text
mode
pagesFetched
listingsReceived
itemsAggregated
itemsMapped
itemsUpserted
itemsIgnored
itemsFailed
nextCursor
durationMs
```

---

## Routes internes à créer

Créer :

```http
POST /api/internal/sync/csfloat
POST /api/internal/sync/csfloat-and-snapshot
```

### `POST /api/internal/sync/csfloat`

Déclenche l’ingestion CSFloat.

Body optionnel :

```json
{
  "mode": "sweep",
  "marketHashNames": []
}
```

ou :

```json
{
  "mode": "targeted",
  "marketHashNames": [
    "AK-47 | Redline (Field-Tested)"
  ]
}
```

### `POST /api/internal/sync/csfloat-and-snapshot`

Déclenche :

1. ingestion CSFloat
2. snapshot global

---

## Scheduling recommandé

### Sweep global

Le sweep global peut être lancé régulièrement mais prudemment.

Exemple :

```text
toutes les 30 à 60 minutes
```

avec un nombre limité de pages par run.

### Snapshot global

Le snapshot doit rester à heure fixe.

Exemple :

```text
02:20 Europe/Paris
```

### Important

Le snapshot global doit copier l’état actuel de `LatestPrice` pour tous les markets disponibles.

---

## Variables d’environnement

Ajouter :

```env
CSFLOAT_API_BASE_URL=https://csfloat.com/api/v1
CSFLOAT_API_KEY=
CSFLOAT_SYNC_ENABLED=true
CSFLOAT_CURRENCY=USD
CSFLOAT_TIMEOUT_MS=30000
CSFLOAT_LISTINGS_LIMIT=50
CSFLOAT_MAX_PAGES_PER_RUN=100
CSFLOAT_DELAY_MS=1000
CSFLOAT_MAX_RETRIES=3
CSFLOAT_BACKOFF_MS=30000
CSFLOAT_TARGETED_REFRESH_ENABLED=true
```

---

## Documentation à mettre à jour

Mettre à jour :

- `README.md`
- `.env.example`
- `/api-docs` si la page existe

### Documenter

- comment obtenir une API key CSFloat
- comment configurer la clé
- comment fonctionne le sweep
- comment fonctionne le targeted refresh
- pourquoi on agrège les listings
- limites connues
- comment lancer la sync
- comment vérifier les résultats en BDD

---

## Limites connues

### CSFloat est listing-based

Le prix récupéré est basé sur les listings actifs, pas forcément les ventes réalisées.

### Items rares

Les items avec stickers, float ou pattern exceptionnels peuvent fausser la lecture du prix.

### Full coverage

Un full coverage complet dépend du nombre de listings actifs et des limites API.

### Solution

Le projet doit :

- stocker localement
- faire des snapshots
- garder un historique stable
- mesurer la couverture

---

## Ce qu’il ne faut pas faire

Ne pas :

- scraper le site HTML CSFloat
- utiliser des cookies utilisateur
- exposer l’API key côté frontend
- spammer l’API
- utiliser des proxies
- contourner les limitations
- mélanger listings individuels et prix agrégé sans documentation

---

## Tests attendus

### Tests client

- construit correctement l’URL `/listings`
- ajoute le header `Authorization`
- gère `cursor`
- gère `limit`
- gère `market_hash_name`
- gère `429`
- gère timeout

### Tests mapper

- extrait `market_hash_name`
- extrait `price`
- extrait `float_value`
- extrait `is_stattrak`
- extrait `is_souvenir`
- ignore listings invalides

### Tests aggregator

- groupe par `market_hash_name`
- calcule le lowest ask
- calcule la quantity
- ignore prix invalides

### Tests service

- crée / résout market `csfloat`
- mappe par `market_hash_name`
- upsert `LatestPrice`
- ne crée pas de doublons
- logue les unmapped
- sauvegarde le cursor
- retourne un résumé correct

### Tests snapshot

- le snapshot lit `LatestPrice`
- le snapshot n’appelle pas CSFloat
- le snapshot contient des lignes `csfloat`

---

## Scénarios de test manuels

### 1. Sweep CSFloat

Déclencher :

```http
POST /api/internal/sync/csfloat
```

Body :

```json
{
  "mode": "sweep"
}
```

Attendu :

- des listings sont récupérés
- des prix agrégés sont produits
- `LatestPrice` contient des lignes `csfloat`
- `SyncRun` est créé

---

### 2. Targeted refresh

Déclencher :

```http
POST /api/internal/sync/csfloat
```

Body :

```json
{
  "mode": "targeted",
  "marketHashNames": [
    "AK-47 | Redline (Field-Tested)"
  ]
}
```

Attendu :

- seul l’item ciblé est rafraîchi
- le lowest ask est stocké
- `LatestPrice` est upsert

---

### 3. Idempotence

Relancer la sync.

Attendu :

- pas de doublons
- update propre
- stats cohérentes

---

### 4. Snapshot

Déclencher :

```http
POST /api/internal/sync/csfloat-and-snapshot
```

Attendu :

- ingestion CSFloat
- snapshot global
- `DailySnapshot` contient des lignes `csfloat`

---

### 5. Graphes multi-market

Vérifier que les pages graphiques peuvent afficher ou préparer :

- Steam
- Skinport
- CSFloat

depuis la BDD uniquement.

---

## Branching pour ce sprint

Maximum **3 branches**.

### Branche 1

```text
feature/csfloat-provider
```

Contient :

- client CSFloat
- types
- provider listings
- mapper

### Branche 2

```text
feature/csfloat-ingestion
```

Contient :

- market `csfloat`
- aggregator listings
- service d’ingestion
- upsert `LatestPrice`
- cursor / pagination
- jobs

### Branche 3

```text
feature/csfloat-routes-tests-docs
```

Contient :

- routes internes
- tests
- documentation
- `.env.example`
- mise à jour `/api-docs`

---

## Ordre de travail recommandé

1. inspecter les providers existants Steam et Skinport
2. ajouter le market `csfloat`
3. créer le client CSFloat
4. créer les types TypeScript
5. créer le provider listings
6. créer le mapper
7. créer l’aggregator par `market_hash_name`
8. implémenter le mode `sweep`
9. implémenter le mode `targeted`
10. upsert `LatestPrice`
11. sauvegarder le cursor
12. brancher snapshot depuis BDD
13. créer les routes internes
14. ajouter les tests
15. documenter la stratégie

---

## Définition of done

Le sprint 9 est terminé si :

- CSFloat est ajouté comme market
- l’API CSFloat officielle est utilisée
- les listings sont récupérés proprement
- les listings sont agrégés par `market_hash_name`
- `LatestPrice` est mis à jour
- `DailySnapshot` peut inclure CSFloat
- le frontend peut lire ces prix depuis la BDD
- l’API key n’est jamais exposée
- la pagination et le cursor sont gérés
- les erreurs et 429 sont gérés
- les routes internes existent
- les tests critiques existent
- la documentation est à jour

---

## Résultat attendu à la fin du sprint

À la fin du sprint, le projet doit avoir :

- CSFloat dans la BDD
- une ingestion CSFloat listing-based
- des prix `lowest ask` par item
- une intégration multi-market plus complète
- des graphes préparés pour comparer Steam / Skinport / CSFloat
- une architecture propre pour ajouter encore d’autres marketplaces

---

## Instruction finale

Ce sprint doit privilégier :

1. intégration propre de CSFloat
2. sécurité de l’API key
3. agrégation claire des listings
4. stockage en BDD
5. snapshots depuis la BDD
6. robustesse face aux limites API
7. architecture réutilisable

La règle principale est :

```text
CSFloat API -> listings actifs -> agrégation par market_hash_name -> LatestPrice -> DailySnapshot -> graphes
```
