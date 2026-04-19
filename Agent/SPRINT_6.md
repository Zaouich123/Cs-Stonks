# SPRINT_6.md

## Contexte

Les sprints précédents ont posé :

- la base de données produit
- le catalogue d’items
- les pages frontend principales
- une logique de graphiques côté produit

Le sprint 6 doit maintenant construire la **première vraie ingestion marché à grande échelle**.

Le market visé pour ce sprint est :

- **Skinport**

L’objectif principal n’est pas de faire lire les graphiques directement depuis l’API Skinport.
L’objectif principal est de faire de Skinport une **source d’ingestion**, puis de faire de la base de données du projet la **source de vérité produit**.

---

## Objectif du sprint

Construire une ingestion quotidienne complète des prix Skinport pour les items suivis par l’application.

Le système doit :

1. récupérer les données de prix Skinport
2. couvrir **tous les items disponibles dans la réponse Skinport utile au produit**
3. normaliser et mapper ces données vers les items déjà présents dans la BDD
4. mettre à jour `LatestPrice`
5. créer des snapshots persistés en base
6. permettre ensuite aux graphiques de lire uniquement la BDD
7. ne pas dépendre de Skinport au runtime du frontend pour dessiner l’historique

---

## Vision produit obligatoire

Le système doit respecter cette logique :

- **Skinport = source d’ingestion**
- **BDD locale = source de vérité**
- **graphes = calculés depuis la BDD**
- **frontend = lecture de la BDD uniquement**

### Règle importante
Le frontend ne doit pas appeler Skinport directement pour afficher les graphiques historiques.

Les pages d’analyse et les pages de prix doivent lire :
- `LatestPrice` pour l’état courant
- les snapshots journaliers pour l’historique

---

## Ce sprint doit produire

À la fin du sprint 6, le projet doit avoir :

- un provider Skinport réel
- un client HTTP Skinport propre
- une stratégie de récupération quotidienne
- une normalisation des payloads Skinport
- un mapping fiable vers les items de la BDD
- une mise à jour de `LatestPrice`
- un snapshot journalier persistant
- une logique propre de logs, erreurs et runs
- une base propre pour les graphiques long terme

---

## Hors scope

Ne pas faire dans ce sprint :

- support multi-markets massif
- ingestion Steam
- crawling de Steam
- websockets
- auth avancée
- trading en temps réel
- analyse technique complexe
- alerting temps réel complexe
- système distribué lourd
- refresh infra-minute

Ce sprint est centré sur :
- **Skinport**
- **ingestion quotidienne**
- **stockage produit propre**
- **historique fiable**

---

## APIs Skinport à utiliser

Pour ce sprint, Gemini Pro doit utiliser en priorité les endpoints Skinport suivants :

### 1. Endpoint principal prix / catalogue marché

- `GET /v1/items`

Cet endpoint permet de récupérer des données prix et marché sur un grand nombre d’items.

Il peut retourner des champs comme :
- `market_hash_name`
- `suggested_price`
- `min_price`
- `max_price`
- `mean_price`
- `median_price`
- `quantity`
- `created_at`
- `updated_at`
- `item_page`
- `market_page`

### 2. Endpoint historique agrégé complémentaire

- `GET /v1/sales/history`

Cet endpoint peut être utilisé pour enrichir les métriques de marché avec :
- `last_24_hours`
- `last_7_days`
- `last_30_days`
- `last_90_days`

avec potentiellement :
- `min`
- `max`
- `avg`
- `median`
- `volume`

### Règle produit importante

Pour ce sprint :
- `GET /v1/items` doit être la **source principale**
- `GET /v1/sales/history` est un **enrichissement complémentaire**, pas la source principale du graphe

---

## Pourquoi ne pas utiliser directement les fenêtres glissantes Skinport pour les graphes

Le sprint doit explicitement respecter ce principe produit :

Les données type :
- `last_24_hours`
- `last_7_days`
- `last_30_days`
- `last_90_days`

sont utiles pour :
- enrichir une fiche
- afficher une vue marché rapide
- comparer la situation actuelle

Mais elles ne doivent pas être la base principale des graphes long terme.

### Pourquoi
Parce qu’il s’agit de fenêtres glissantes agrégées :
- elles évoluent avec le temps
- elles ne sont pas un historique figé
- elles peuvent être recalculées différemment
- elles ne garantissent pas une parfaite reproductibilité du passé

### Conséquence
Le produit doit construire son historique de référence via :
- snapshots quotidiens persistés en BDD

---

## Modèle produit attendu

Le sprint doit consolider ce modèle :

### `LatestPrice`
Source de vérité pour :
- le dernier état connu d’un item sur Skinport

### `DailySnapshot`
Source de vérité pour :
- les graphiques
- l’historique
- les analyses 7j / 30j / 90j / 1 an

### Option recommandée
Gemini Pro peut ajouter une table spécifique si nécessaire, par exemple :

- `SkinportDailyMetrics`

si cela améliore la clarté pour stocker les agrégats `last_24_hours`, `last_7_days`, etc.

Mais cette table est optionnelle.
Le cœur du sprint reste :

- ingestion Skinport
- mise à jour `LatestPrice`
- snapshot journalier stable

---

## Base de données : objectif détaillé

La base doit stocker suffisamment d’informations pour :

- afficher le dernier prix connu
- tracer l’historique jour par jour
- afficher la quantité ou liquidité si disponible
- afficher des tendances
- construire les graphes depuis les snapshots internes

---

## Modèles à utiliser ou enrichir

Les modèles centraux restent :

- `Item`
- `Market`
- `LatestPrice`
- `DailySnapshot`
- `SyncRun`

---

## Évolution recommandée de `Market`

Le market `skinport` doit exister explicitement en base.

### Attendu
- `slug = skinport`
- `name = Skinport`
- `enabled = true`

---

## Évolution recommandée de `LatestPrice`

`LatestPrice` doit pouvoir contenir au minimum les données Skinport suivantes :

- `itemId`
- `marketId`
- `price`
- `currency`
- `quantity`
- `fetchedAt`
- `sourceUpdatedAt`

### Recommandation forte
Si le modèle n’est pas encore assez riche, ajouter proprement les champs utiles suivants :

- `minPrice`
- `maxPrice`
- `meanPrice`
- `medianPrice`
- `suggestedPrice`
- `sourceItemUrl`
- `sourceMarketUrl`
- `rawPayload` JSON nullable

### Règle
Il faut rester propre :
- ne pas casser le modèle
- garder des noms clairs
- documenter les choix
- rester cohérent avec Prisma

---

## Évolution recommandée de `DailySnapshot`

`DailySnapshot` doit servir pour les graphes.

Pour Skinport, le snapshot journalier doit stocker au minimum :

- `snapshotDate`
- `snapshotHour`
- `itemId`
- `marketId`
- `price`
- `currency`
- `quantity`
- `sourceFetchedAt`
- `sourceUpdatedAt`

### Recommandation
Le champ `price` dans le snapshot doit correspondre à une métrique produit claire.

Gemini Pro doit choisir et documenter une seule valeur principale pour le graphe, par exemple :
- `medianPrice`
- `meanPrice`
- `suggestedPrice`

### Recommandation produit
Pour un graphe produit, `medianPrice` ou `meanPrice` est souvent plus robuste qu’un prix extrême.
Gemini Pro doit documenter le choix retenu.

---

## Choix produit attendu pour le graphe

Le sprint doit clarifier quelle métrique Skinport devient :

- le **prix courant affiché**
- le **prix historisé pour les graphes**

### Attendu
Gemini Pro doit choisir une règle stable, par exemple :

- `LatestPrice.price = medianPrice` si disponible
- fallback sur `meanPrice`
- fallback sur `suggestedPrice`
- fallback sur `minPrice` si vraiment nécessaire

ou toute autre règle cohérente, mais elle doit être :

- documentée
- stable
- appliquée de manière uniforme

---

## Couverture fonctionnelle : “inclure tous les prix”

Dans le contexte de ce sprint, “inclure tous les prix” signifie :

- récupérer la réponse complète utile de Skinport
- mapper tous les items Skinport trouvables vers la table `Item`
- persister tous les couples `(item, skinport)` mappables
- ignorer proprement les items non résolus
- loguer ce qui n’a pas pu être mappé

### Important
Le système ne doit pas s’arrêter au premier item non reconnu.
Il doit :
- traiter le maximum
- résumer les échecs
- rester relançable

---

## Mapping entre Skinport et la BDD

### Clé principale attendue
Le mapping doit se faire en priorité via :

- `market_hash_name`

car c’est la clé la plus stable pour relier Skinport à ton catalogue produit.

### Règle
Gemini Pro doit :
- normaliser le `market_hash_name`
- rechercher l’item correspondant dans `Item`
- faire un mapping fiable
- documenter les cas non trouvés

### Si un item n’est pas trouvé
Le système doit :
- logger le cas
- l’inclure dans les stats d’échec ou d’ignoré
- continuer la sync

### Option possible
Créer une petite couche utilitaire dédiée :
- `resolveItemByMarketHashName.ts`

---

## Architecture attendue

Le code doit rester modulaire.

Structure recommandée :

```text
src/
  app/
    api/
      internal/
        sync/
          skinport/
            route.ts
        snapshots/
          daily/
            route.ts

  lib/
    db/
      prisma.ts
    logger/
      logger.ts
    http/
      skinportClient.ts

  modules/
    providers/
      skinport/
        skinport.types.ts
        skinport.client.ts
        skinport.mapper.ts
        skinportPriceProvider.ts
        skinportHistoryProvider.ts

    pricing/
      services/
        latestPriceSyncService.ts
        skinportPriceIngestionService.ts
      utils/
        resolveItemByMarketHashName.ts
        chooseSkinportChartPrice.ts

    snapshots/
      services/
        dailySnapshotService.ts

    jobs/
      runSkinportDailyIngestion.ts
      runDailySnapshot.ts
```

---

## Provider Skinport à créer

### `skinport.client.ts`

Responsabilités :
- gérer les appels HTTP Skinport
- centraliser la base URL
- gérer les headers requis
- gérer timeout
- gérer la compression si nécessaire
- ne pas contenir la logique métier de mapping

### Important
Le client doit explicitement gérer les exigences connues de Skinport :
- header `Accept-Encoding: br` si nécessaire selon la doc
- paramètres de requête propres
- timeouts
- réponses d’erreur claires

---

### `skinportPriceProvider.ts`

Responsabilités :
- appeler `GET /v1/items`
- récupérer les données brutes
- retourner un format typé
- ne pas écrire en base directement

---

### `skinportHistoryProvider.ts` (optionnel mais recommandé)

Responsabilités :
- appeler `GET /v1/sales/history`
- récupérer les agrégats
- retourner un format typé
- permettre un enrichissement futur

Ce provider est utile, mais ne doit pas bloquer le sprint s’il alourdit trop l’implémentation.

---

## Service principal d’ingestion

Créer un service dédié, par exemple :

- `skinportPriceIngestionService.ts`

### Responsabilités
- appeler le provider Skinport
- résoudre les items
- résoudre le market `skinport`
- normaliser les valeurs
- mettre à jour `LatestPrice`
- produire un résumé de sync
- tracer dans `SyncRun`

### Comportement attendu
Le service doit :
- être relançable
- être idempotent
- supporter les erreurs partielles
- continuer si certains items ne matchent pas
- journaliser proprement

---

## Sync quotidienne

Le sprint 6 doit mettre en place une ingestion quotidienne Skinport.

### Attendu
Créer un job du type :

- `runSkinportDailyIngestion()`

### Responsabilités
- lancer la récupération Skinport
- lancer la mise à jour de `LatestPrice`
- enregistrer un `SyncRun`
- pouvoir être déclenché par route interne ou scheduler

---

## Snapshot quotidien

Après ingestion Skinport, le système doit créer le snapshot journalier.

### Règle produit
Le snapshot doit être pris depuis la BDD, pas depuis Skinport directement.

### Ordre logique attendu
1. récupération Skinport
2. mise à jour `LatestPrice`
3. création de `DailySnapshot`

### Important
Le snapshot doit lire :
- les valeurs déjà ingérées
- pas les providers externes

---

## Scheduling attendu

Le sprint doit documenter un cycle simple :

### 1. Ingestion Skinport
- 1 fois par jour minimum
- à heure fixe
- exemple : tous les jours à `01:30 Europe/Paris`

### 2. Snapshot journalier
- après ingestion
- exemple : `02:05 Europe/Paris`

### Variante acceptable
Si besoin, ingestion plus fréquente plus tard.
Mais pour ce sprint :
- le minimum viable propre = **1 ingestion quotidienne complète**

---

## Gestion des erreurs

Le sprint 6 doit être robuste.

### À gérer
- timeout HTTP
- réponse API inattendue
- item non mappable
- valeur de prix absente
- données partielles
- erreur Prisma ponctuelle

### Comportement attendu
- ne pas planter sur un seul item invalide
- distinguer erreur fatale et erreur partielle
- produire des logs lisibles
- produire des stats exploitables

---

## Logs et observabilité

Le sprint doit enrichir `SyncRun` et les logs.

### Un run Skinport doit permettre de savoir :
- quand il a commencé
- quand il a fini
- quel provider a été utilisé
- combien d’items ont été reçus
- combien d’items ont été mappés
- combien d’items ont été upsertés
- combien d’items ont été ignorés
- combien d’erreurs ont eu lieu

### Résultat attendu
Le service doit retourner un résumé structuré, par exemple :

- totalReceived
- totalMapped
- totalUpserted
- totalIgnored
- totalFailed
- durationMs

---

## Endpoints internes à créer

Créer au minimum :

### `POST /api/internal/sync/skinport`
Déclenche une ingestion Skinport.

### `POST /api/internal/sync/skinport-and-snapshot`
Optionnel mais recommandé.
Déclenche :
1. ingestion Skinport
2. snapshot journalier

### `GET /api/internal/health`
Doit continuer à fonctionner.

---

## Variables d’environnement attendues

Le sprint doit documenter clairement les variables nécessaires.

Exemples :

- `DATABASE_URL`
- `SKINPORT_API_BASE_URL`
- `SKINPORT_API_KEY` si requis par le mode choisi
- `SKINPORT_CURRENCY`
- `SKINPORT_APP_ID`
- `SKINPORT_TIMEOUT_MS`

### Important
Gemini Pro doit inspecter la doc Skinport et le mode exact d’auth nécessaire.
Le code doit rester propre et configurable.

---

## TypeScript et types

Gemini Pro doit créer des types dédiés pour les réponses Skinport.

Exemples :
- `SkinportItemResponse`
- `SkinportHistoryResponse`
- `NormalizedSkinportPriceRecord`

### Règle
Pas de gros parsing dynamique non typé dans les composants ou services principaux.

---

## Lecture produit après ingestion

À la fin de ce sprint, le frontend ou les pages analytics doivent pouvoir :

- lire `LatestPrice` pour l’état courant Skinport
- lire `DailySnapshot` pour les graphes
- ne plus dépendre de Skinport pour afficher l’historique

---

## Tests attendus

Le sprint doit ajouter des tests utiles.

### À tester

#### Client Skinport
- construction des requêtes
- gestion timeout
- gestion erreur HTTP

#### Mapping
- item trouvé via `market_hash_name`
- item introuvable logué proprement
- choix de la métrique de prix pour le graphe

#### Ingestion
- upsert correct dans `LatestPrice`
- non-duplication
- résumé de sync correct

#### Snapshot
- copie correcte après ingestion
- aucune dépendance directe à Skinport

---

## Scénarios de test manuels attendus

À la fin du sprint, il faut pouvoir vérifier :

### 1. Ingestion Skinport
Déclencher :
- `POST /api/internal/sync/skinport`

Attendu :
- `LatestPrice` est rempli ou mis à jour pour le market Skinport
- `SyncRun` est créé
- les items non mappables sont logués

### 2. Snapshot
Déclencher le snapshot après ingestion.

Attendu :
- `DailySnapshot` contient les valeurs issues de `LatestPrice`
- pas de fetch direct Skinport pendant le snapshot

### 3. Idempotence
Relancer la sync.

Attendu :
- pas de doublons dans `LatestPrice`
- mise à jour propre
- résumé cohérent

### 4. Lecture analytics
Les pages d’analyse peuvent lire la BDD sans appeler Skinport.

---

## Branching pour ce sprint

Maximum **3 branches**.

### Branche 1
`feature/skinport-provider-and-client`

Contient :
- client HTTP Skinport
- provider `GET /v1/items`
- types
- mapping brut
- config env

### Branche 2
`feature/skinport-ingestion-and-snapshots`

Contient :
- service d’ingestion
- mapping vers `Item`
- upsert `LatestPrice`
- choix métrique chart
- snapshot quotidien
- `SyncRun`

### Branche 3
`feature/skinport-sync-routes-and-tests`

Contient :
- routes internes
- tests
- logs
- doc `.env.example`
- README ingestion Skinport

---

## Ordre de travail recommandé

1. lire la doc Skinport
2. créer le client HTTP Skinport
3. typer les réponses
4. implémenter le provider `GET /v1/items`
5. créer le mapping vers `Item`
6. implémenter l’ingestion vers `LatestPrice`
7. définir la métrique de prix utilisée pour les graphes
8. brancher le snapshot quotidien
9. ajouter les routes internes
10. ajouter les tests
11. documenter le flow complet

---

## Définition of done

Le sprint 6 est terminé si :

- le provider Skinport existe
- l’ingestion quotidienne Skinport fonctionne
- le market `skinport` est bien géré
- `LatestPrice` est mis à jour proprement
- les items sont résolus via `market_hash_name`
- les erreurs partielles sont gérées
- un snapshot quotidien est créé depuis la BDD
- le frontend peut dépendre de la BDD pour les graphes
- les routes internes existent
- les tests critiques existent
- la documentation est à jour

---

## Résultat attendu à la fin du sprint

À la fin de ce sprint, le projet doit disposer de :

- sa première vraie ingestion marché à grande échelle
- une base historique fiable pour Skinport
- une logique produit propre :
  - API externe pour ingérer
  - BDD pour servir le produit
- une base saine pour les graphiques 7 jours / 30 jours / 90 jours / 1 an

---

## Instruction finale

Ce sprint doit privilégier :

1. la qualité de l’ingestion Skinport
2. la stabilité des snapshots
3. la clarté du mapping avec le catalogue
4. l’indépendance du frontend par rapport à l’API externe
5. la robustesse du système

L’objectif n’est pas juste “faire un appel API”.
L’objectif est de construire une **vraie pipeline produit Skinport -> BDD -> graphes**.
