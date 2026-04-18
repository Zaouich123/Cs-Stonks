# SPRINT_3.md

## Contexte

Les sprints précédents ont posé :

- la base de données PostgreSQL avec Prisma
- les modèles `Item`, `Market`, `LatestPrice`, `DailySnapshot`, `SyncRun`
- les providers `JSON` / `Mock`
- les services de synchronisation
- les jobs de sync et de snapshot
- les routes internes pour lancer les synchronisations

Le sprint 3 ne se concentre **pas** sur les prix.
Le sprint 3 se concentre sur la **construction du catalogue complet d’items CS2 en base de données**.

L’objectif est d’avoir une table `Item` complète, fiable, exploitable par le backend et le futur frontend, avec :

- tous les items utiles
- toutes les variantes vendables utiles
- les wears
- les variantes StatTrak
- les variantes Souvenir
- les phases quand c’est pertinent
- les images
- les noms de référence compatibles avec Steam

---

## Objectif du sprint

Construire et importer en base de données le **catalogue complet des items CS2**, afin que l’application dispose d’une source locale de référence pour :

- le mapping futur des prix
- la recherche d’items
- les pages item
- les filtres frontend
- la compatibilité Steam via `marketHashName`

Ce sprint doit permettre de répondre à cette question :

> Est-ce que la base locale contient déjà tous les items et toutes les variantes nécessaires, avec leurs images et leurs métadonnées principales ?

---

## Résultat attendu à la fin du sprint

À la fin du sprint 3, le projet doit avoir :

- une table `Item` remplie avec le catalogue complet ou quasi complet des items CS2 ciblés
- les variantes vendables utiles correctement séparées
- les `marketHashName` normalisés et stockés
- des images stockées en base sous forme d’URL
- un pipeline d’import du catalogue relançable
- des logs et traces d’import
- des routes internes pour importer ou réimporter le catalogue
- des endpoints de lecture de catalogue suffisants pour préparer la future UI

---

## Hors scope

Ne pas faire dans ce sprint :

- récupération massive des prix Steam
- crawling complet des prix Steam
- arbitrage entre plusieurs markets
- dashboard final
- graphiques frontend
- auth complète
- paiement
- websocket
- système complexe de rotation d’IP/proxy
- scraping agressif du Steam Market

---

## Principe clé du sprint

Le sprint 3 sert à construire **le dictionnaire local complet des items**, pas à construire la couche de prix.

Différence fondamentale :

- **catalogue d’items** = quels objets existent et comment ils sont définis
- **prix** = combien ils valent maintenant

Le catalogue est une couche de référence.
Il doit exister avant d’attaquer l’ingestion Steam à grande échelle.

---

## Positionnement par rapport à Steam

Le catalogue doit être **Steam-compatible**, mais il ne doit pas dépendre d’un crawl massif du Steam Market pour être construit.

### Ce que cela signifie

Le système doit :

- utiliser `marketHashName` comme clé métier principale de compatibilité Steam
- stocker des images compatibles avec l’écosystème Steam/CDN
- préparer les données pour le futur provider de prix Steam

Mais pour remplir la BDD avec **tous les items**, il est préférable d’utiliser une source de catalogue structurée, déjà normalisée et plus adaptée que le Steam Market lui-même.

---

## Sources et outils à utiliser

## Source catalogue obligatoire

Pour ce sprint, la source principale du catalogue doit être **ByMykel/CSGO-API**.

Utiliser :

- `skins_not_grouped.json` pour les skins et variantes vendables
- `stickers.json` pour les stickers
- `crates.json` pour les caisses
- `agents.json` pour les agents
- autres endpoints ByMykel si nécessaires selon le périmètre

Règles :
- utiliser `market_hash_name` comme clé de compatibilité Steam
- importer les images fournies par la source
- normaliser toutes les variantes vendables dans la table `Item`
- stocker la donnée en base locale
- ne pas utiliser Steam Market pour découvrir massivement les items

### Source ou utilitaire pour les images Steam/CDN

Utiliser un utilitaire ou une librairie de résolution d’images par `market_hash_name`, par exemple **node-cs2-cdn**.

Cette librairie est explicitement conçue pour retrouver des URLs d’images Steam CDN à partir du `market_hash_name` ou des propriétés d’un item, y compris pour les stickers, weapons, tools/cases, et les phases Doppler. citeturn878867search0

### Référence Steam pour la logique d’image

Quand le projet raisonne en termes d’image “Steam”, il faut garder en tête que le modèle Steam fonctionne bien avec des URLs d’icônes et d’images publiques qui sont téléchargées et mises en cache. La documentation Steamworks décrit bien `icon_url` et `icon_url_large` comme des URLs publiques d’images. citeturn878867search1

### Ce qu’il ne faut pas utiliser comme source catalogue principale

Ne pas construire le catalogue complet en découvrant tous les items via l’endpoint Steam Market `priceoverview` ou d’autres endpoints item-par-item. Cet endpoint est utilisé pour récupérer des infos pour un item donné via `market_hash_name`, mais il n’est pas adapté à un import massif de catalogue. citeturn878867search2

---

## Pourquoi éviter de dépendre de Steam pour l’import catalogue complet

Le Steam Market est utile plus tard pour les prix, mais ce n’est pas le bon point d’entrée pour découvrir tout le catalogue.

### Raisons

- découverte item-par-item
- pas de bulk endpoint simple pour “tous les items”
- risque de rate limiting
- flux trop fragile pour initialiser une BDD catalogue
- plus compliqué à maintenir qu’un dataset structuré

### Conclusion technique

Pour ce sprint :

- **catalogue** via dataset structuré / API catalogue
- **images** via mapping Steam/CDN
- **Steam** utilisé surtout comme contrainte de compatibilité (`marketHashName`), pas comme unique source de découverte

---

## Base de données : objectif du sprint

Le sprint 3 doit remplir proprement la table `Item`.

Le modèle `Item` existe déjà ou doit être finalisé pour accepter les données catalogue suivantes.

### Champs à remplir impérativement

- `marketHashName`
- `displayName`
- `itemType`
- `weapon`
- `skinName`
- `exterior`
- `rarity`
- `stattrak`
- `souvenir`
- `phase`
- `collection`
- `imageUrl`
- `steamImageUrl`
- `isActive`

### Champs recommandés à ajouter si absents

- `slug`
- `searchText`
- `steamAppId`
- `hasVariants`
- `baseItemName`
- `lastCatalogSyncAt`
- `source`
- `sourceExternalId`

---

## Ce que veut dire “importer tous les items”

Ici, “importer tous les items” veut dire remplir la base avec les **objets vendables utiles**, pas juste les noms de base.

### Exemple incorrect

Ne stocker que :

- `AK-47 | Redline`

### Exemple correct

Stocker chaque variante utile :

- `AK-47 | Redline (Factory New)`
- `AK-47 | Redline (Minimal Wear)`
- `AK-47 | Redline (Field-Tested)`
- `AK-47 | Redline (Well-Worn)`
- `AK-47 | Redline (Battle-Scarred)`
- `StatTrak™ AK-47 | Redline (Factory New)`
- `StatTrak™ AK-47 | Redline (Field-Tested)`

Et aussi, selon les types suivis :

- stickers
- cases
- capsules
- charms
- agents
- knives
- gloves
- music kits si souhaité

---

## Variantes à gérer

Le pipeline catalogue doit être capable de représenter au minimum :

### 1. Wears / exterior

Pour les skins d’armes et autres items concernés :

- `factory_new`
- `minimal_wear`
- `field_tested`
- `well_worn`
- `battle_scarred`

### 2. StatTrak

Quand une variante StatTrak existe, elle doit être stockée comme une ligne distincte.

### 3. Souvenir

Quand une variante Souvenir existe, elle doit être stockée comme une ligne distincte.

### 4. Phase

Pour les items concernés (par exemple Doppler / Gamma Doppler), la phase doit être stockée proprement.

### 5. Types non wearables

Pour stickers, cases, capsules, agents, etc. :

- `exterior` doit être nullable
- les champs non pertinents doivent rester propres et cohérents

---

## Types d’items à couvrir

Le sprint doit préciser quels types sont inclus dans le catalogue.

### Minimum attendu

- `weapon_skin`
- `sticker`
- `case`
- `capsule`

### Fortement recommandé

- `knife`
- `glove`
- `agent`
- `charm`
- `music_kit`
- `tool`
- `graffiti`

### Important

Si certains types ne sont pas inclus dans la V1 du sprint, cela doit être documenté clairement.

---

## Gestion des images

Le sprint doit intégrer une vraie stratégie d’image catalogue.

### Objectif

Chaque item en base doit avoir au moins une URL d’image exploitable.

### Champs à utiliser

- `imageUrl` : image principale utilisée par l’application
- `steamImageUrl` : image source Steam/CDN si disponible

### Recommandation

- utiliser `marketHashName` pour résoudre les images CDN quand c’est possible
- préférer des URLs déterministes ou calculables
- stocker le résultat en base pour éviter de recalculer à chaque requête

### Outil recommandé

**node-cs2-cdn** est un bon choix pour résoudre des images Steam CDN à partir du `market_hash_name` ou des propriétés d’un item. Le projet indique explicitement couvrir stickers, characters, weapons avec phases, tools/cases, etc. citeturn878867search0

---

## Architecture attendue

Structure recommandée pour ce sprint :

```text
src/
  app/
    api/
      internal/
        catalog/
          import/
            route.ts
          refresh-images/
            route.ts
      api/
        items/
          route.ts
          [itemId]/
            route.ts

  modules/
    catalog/
      providers/
        bymykelCatalogProvider.ts
        localFallbackCatalogProvider.ts
      services/
        importCatalogService.ts
        enrichCatalogImagesService.ts
        mergeCatalogItemsService.ts
      normalizers/
        normalizeCatalogItem.ts
        expandCatalogVariants.ts
      mappers/
        mapExternalCatalogItemToInternal.ts
      jobs/
        runCatalogImport.ts
        runCatalogImageRefresh.ts
      types/
        catalog.types.ts

  lib/
    db/
      prisma.ts
    logger/
      logger.ts
    images/
      resolveSteamImage.ts

  data/
    fixtures/
      fallback-catalog.json
```

---

## Providers à implémenter

Le sprint 3 doit créer un vrai provider de catalogue.

### Provider principal recommandé

#### `ByMykelCatalogProvider`

Responsabilités :
- récupérer le catalogue depuis une source structurée
- séparer les types d’items
- retourner une structure brute claire
- ne pas écrire directement en base

### Provider de secours

#### `LocalFallbackCatalogProvider`

Responsabilités :
- lire un fichier local JSON
- permettre de relancer un import même si la source externe est inaccessible
- servir de backup de développement

---

## Services à créer

### `importCatalogService`

Responsabilités :
- appeler le provider de catalogue
- normaliser les données
- transformer les données externes en modèle interne
- persister les items
- gérer la mise à jour des items existants
- créer un `SyncRun`

### `expandCatalogVariants`

Responsabilités :
- prendre une entrée “base” si nécessaire
- générer les variantes vendables utiles
- séparer les variantes par wear, StatTrak, Souvenir, phase selon les données disponibles

### `mergeCatalogItemsService`

Responsabilités :
- faire les upserts d’items
- éviter les doublons
- mettre à jour les métadonnées si elles changent
- gérer `isActive`

### `enrichCatalogImagesService`

Responsabilités :
- compléter `imageUrl` et `steamImageUrl`
- appeler le résolveur d’images si nécessaire
- journaliser les images non résolues

---

## Règles de normalisation

Le sprint doit imposer des règles de normalisation strictes.

### `marketHashName`

- doit être conservé tel qu’attendu par la compatibilité Steam
- doit être trimé
- doit être stocké de manière cohérente
- doit être utilisé comme point principal de mapping prix futur

### `displayName`

- doit être lisible côté frontend
- ne doit pas casser la logique de mapping

### `itemType`

- doit appartenir à une liste stable et documentée
- ne pas avoir 12 variantes de libellés pour le même type

### `exterior`

- doit être normalisé selon un enum interne
- nullable pour les types non concernés

### `stattrak`, `souvenir`

- booléens
- jamais déduits de façon floue si la source le dit explicitement

### `phase`

- nullable
- valeur normalisée si concernée

---

## Déduplication et unicité

Le sprint doit définir une stratégie claire pour éviter les doublons.

### Important

Deux items ne doivent pas être fusionnés si une de ces dimensions les distingue réellement :

- wear
- StatTrak
- Souvenir
- phase
- type d’item

### Recommandation technique

Conserver une unicité métier basée au minimum sur :

- `marketHashName`
- ou un identifiant dérivé stable si le projet a besoin de mieux gérer certains cas

### Cas à gérer proprement

- réimport du catalogue
- changement mineur de métadonnée
- ajout d’une image manquante
- item désactivé sans suppression physique

---

## Flux d’import attendu

### Étape 1

Appeler le provider catalogue principal.

### Étape 2

Récupérer les données brutes par type :
- skins
- stickers
- cases
- capsules
- agents
- etc.

### Étape 3

Normaliser les champs communs.

### Étape 4

Étendre / générer les variantes nécessaires si la source ne livre pas déjà directement toutes les variantes utiles.

### Étape 5

Résoudre les images principales.

### Étape 6

Upsert en base dans `Item`.

### Étape 7

Enregistrer un `SyncRun` détaillé.

---

## Logs et observabilité

Chaque import catalogue doit produire des logs exploitables.

### Minimum attendu

- source utilisée
- début du run
- fin du run
- nombre brut d’items reçus
- nombre d’items normalisés
- nombre d’items créés
- nombre d’items mis à jour
- nombre d’images résolues
- nombre d’images manquantes
- nombre d’erreurs
- durée d’exécution

### `SyncRun`

Le `SyncRun` catalogue doit stocker au minimum :
- `syncType = catalog`
- `provider = bymykel` ou `local_fallback`
- `status`
- `itemsProcessed`
- `itemsSucceeded`
- `itemsFailed`
- `metadata`

---

## Cron / jobs

Le sprint 3 doit créer ou améliorer les jobs catalogue.

### Jobs attendus

- `runCatalogImport()`
- `runCatalogImageRefresh()`

### Politique recommandée

#### Import catalogue complet
- manuel
- ou planifié rarement
- par exemple 1 fois par jour ou 1 fois par semaine selon la source choisie

#### Refresh images
- manuel
- ou ponctuel quand le catalogue a changé

### Important

Le sprint 3 n’a pas besoin d’un scheduler complexe.
Il faut surtout des jobs appelables et bien documentés.

---

## Gestion du rate limit

### Point clé

Le rate limit Steam n’est pas le problème principal de ce sprint si l’import catalogue est bien conçu.

### Règle

Ne pas utiliser Steam Market comme source principale pour découvrir tous les items.

### Ce qu’il faut faire à la place

- importer le catalogue depuis une source structurée
- utiliser une lib de résolution d’images pour les images Steam/CDN
- stocker les données localement

### Conséquence

Le sprint 3 peut remplir la BDD sans être bloqué par un rate limit agressif du Steam Market.

---

## Endpoints à ajouter

### Internes

#### `POST /api/internal/catalog/import`
Déclenche l’import complet du catalogue.

#### `POST /api/internal/catalog/refresh-images`
Déclenche un enrichissement ou refresh des images.

### Lecture

#### `GET /api/items`
Liste les items importés.
Doit permettre :
- pagination simple
- filtre par type
- recherche simple

#### `GET /api/items/:itemId`
Retourne le détail d’un item.

---

## Réponses attendues des endpoints

### `POST /api/internal/catalog/import`
Exemple de réponse :

```json
{
  "success": true,
  "syncType": "catalog",
  "provider": "bymykel",
  "itemsProcessed": 12000,
  "itemsCreated": 9500,
  "itemsUpdated": 2500,
  "itemsFailed": 12,
  "imagesResolved": 11800,
  "imagesMissing": 200
}
```

### `GET /api/items`
Exemple de réponse :

```json
{
  "items": [
    {
      "id": "...",
      "displayName": "AK-47 | Redline (Field-Tested)",
      "marketHashName": "AK-47 | Redline (Field-Tested)",
      "itemType": "weapon_skin",
      "exterior": "field_tested",
      "stattrak": false,
      "imageUrl": "..."
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 12000
}
```

---

## Tests attendus

Le sprint 3 doit ajouter des tests ciblés.

### À tester

#### Provider catalogue
- récupération des données
- mapping des types
- robustesse en cas de payload partiel

#### Normalisation
- `marketHashName`
- `itemType`
- `exterior`
- booléens `stattrak` / `souvenir`
- phases

#### Variantes
- génération correcte des variantes utiles
- pas de doublons

#### Persistance
- upsert correct
- réimport relançable
- item existant correctement mis à jour

#### Images
- résolution image OK
- fallback propre si image absente

#### API lecture
- listing items
- filtre type
- pagination
- détail item

---

## Scénarios de test manuels attendus

### 1. Import complet du catalogue

Appeler :

```bash
POST /api/internal/catalog/import
```

Attendu :
- des milliers d’items ou un volume cohérent selon le scope retenu
- `Item` bien rempli
- `SyncRun` créé

### 2. Vérification des variantes

Choisir un skin connu et vérifier que la BDD contient bien :
- plusieurs wears
- variantes StatTrak si disponibles
- image présente

### 3. Vérification des types non skin

Vérifier que la BDD contient :
- stickers
- cases
- capsules

### 4. Vérification API lecture

Appeler :

```bash
GET /api/items
GET /api/items/:itemId
```

Attendu :
- réponses propres
- données cohérentes
- images présentes

---

## Branching pour ce sprint

Maximum **3 branches**.

### Branche 1
`feature/catalog-provider-and-import`

Contient :
- provider principal catalogue
- provider fallback local
- normalisation
- import service
- upserts catalogue

### Branche 2
`feature/catalog-variants-and-images`

Contient :
- génération/expansion des variantes
- enrichissement image
- champs catalogue complémentaires
- ajustements Prisma si nécessaires

### Branche 3
`feature/catalog-api-tests-and-docs`

Contient :
- routes internes catalogue
- endpoints de lecture items
- tests
- README / docs du flux catalogue

---

## Ordre de travail recommandé

1. choisir la source catalogue principale
2. implémenter le provider catalogue
3. normaliser les données
4. définir la logique de variantes
5. enrichir les images
6. persister en base
7. créer les endpoints internes
8. créer les endpoints de lecture catalogue
9. ajouter les tests
10. documenter le flux complet

---

## Définition of done

Le sprint 3 est terminé si :

- le catalogue complet ou quasi complet est importable en base
- la table `Item` contient les variantes utiles
- les wears sont bien gérés
- les variantes StatTrak sont bien gérées
- les variantes Souvenir sont bien gérées quand elles existent
- les phases sont bien gérées quand elles existent
- les images sont présentes pour la grande majorité des items
- `marketHashName` est bien stocké pour la compatibilité Steam
- l’import est relançable sans casser la base
- les endpoints catalogue fonctionnent
- les tests critiques existent
- la documentation décrit les sources et le flux

---

## Résultat attendu à la fin du sprint

À la fin du sprint 3, le projet doit disposer de :

- sa **base locale complète d’items**
- ses **métadonnées d’affichage**
- ses **images**
- sa **compatibilité Steam via `marketHashName`**
- une base propre pour le futur sprint de prix Steam ou multi-markets

Le projet doit pouvoir répondre à ces questions :

- cet item existe-t-il dans le catalogue ?
- quelle est son image ?
- quel est son `marketHashName` ?
- quelle est sa variante exacte ?
- peut-on ensuite le brancher facilement à un provider de prix ?

---

## Instruction finale

Pendant ce sprint :

- ne pas se disperser sur les prix
- ne pas crawler Steam Market pour découvrir tous les items
- construire un vrai catalogue local propre et complet
- garder la compatibilité Steam comme contrainte de mapping
- optimiser pour la fiabilité, la relançabilité et la qualité des données

La priorité absolue est :

1. complétude du catalogue
2. qualité des variantes
3. qualité des images
4. compatibilité Steam
5. simplicité de maintenance
