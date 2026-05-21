# Conception detaillee de la solution

## 1. Resume executif

Ce document decrit la conception logicielle de `Cs-Stonks` de facon explicite afin qu'un autre humain ou un modele comme ChatGPT 5.5 puisse :

- comprendre rapidement le projet
- produire des schemas UML ou d'architecture
- identifier les acteurs, modules, flux et donnees

## 2. Definition du systeme

### Description courte

`Cs-Stonks` est une application web de collecte, stockage, exposition et visualisation de donnees de marche autour des items Counter-Strike 2.

### Finalite

Le systeme doit permettre de :

- referencer les items du catalogue CS2
- recuperer des donnees de prix depuis des providers
- conserver le dernier etat connu du marche
- historiser l'evolution quotidienne
- exposer ces donnees via une API
- fournir des interfaces de consultation et d'analyse
- preparer l'ajout futur d'un espace utilisateur personnalise

## 3. Acteurs du systeme

### Acteur 1 - Utilisateur visiteur

Peut :

- consulter la homepage
- parcourir le market
- ouvrir la fiche d'un item
- lire des courbes et prix
- consulter les pages d'analyse, d'auth et de docs API

### Acteur 1 bis - Utilisateur authentifie

Peut a terme :

- sauvegarder des items suivis
- composer un portfolio personnel
- enregistrer des graphiques ou vues preferees
- personnaliser un tableau de bord

### Acteur 2 - Operateur / administrateur

Peut :

- lancer une synchronisation catalogue
- lancer une synchronisation prix
- lancer une ingestion Skinport
- lancer un snapshot journalier
- verifier la sante technique du systeme

### Acteur 3 - Schedulers / jobs

Peut :

- declencher automatiquement les syncs selon cron
- alimenter la base sans intervention manuelle

### Acteur 4 - Providers externes

Sources de donnees :

- ByMykel pour le catalogue
- Skinport pour les prix et historiques de ventes
- autres providers possibles a terme

## 4. Cas d'usage principaux

### Cas d'usage A - Parcourir le catalogue

1. l'utilisateur ouvre le market
2. l'application appelle `GET /api/items`
3. la base retourne les items avec metadonnees
4. l'interface affiche liste, pagination et informations de prix

### Cas d'usage B - Consulter la fiche d'un item

1. l'utilisateur clique sur un item
2. l'application charge l'item, ses prix et son historique
3. la page affiche l'image, les variantes, le graphique et les donnees associees

### Cas d'usage C - Lire l'historique d'un item

1. l'application interroge `GET /api/items/:itemId/history`
2. la route lit `DailySnapshot`
3. les points sont retournes au frontend
4. la courbe est rendue dans la page

### Cas d'usage D - Synchroniser les prix du jour

1. un job manuel ou cron lance la synchronisation
2. le provider Skinport retourne les donnees exploitables
3. le service mappe les items du provider avec les items du catalogue
4. les lignes `LatestPrice` sont creees ou mises a jour
5. un `SyncRun` trace l'execution

### Cas d'usage E - Fig er un etat journalier

1. le snapshot journalier est declenche
2. le systeme lit les `LatestPrice`
3. les lignes sont copiees dans `DailySnapshot`
4. l'historique devient disponible pour les graphiques

### Cas d'usage F - Construire un portfolio utilisateur

Cas d'usage prevu pour une evolution future :

1. l'utilisateur se connecte
2. il ajoute un ou plusieurs items a son espace personnel
3. il sauvegarde des vues ou graphiques a suivre
4. l'application recharge ensuite ces preferences sur son tableau de bord

## 5. Exigences fonctionnelles

### Exigences de lecture

- le systeme doit permettre la recherche d'items
- le systeme doit permettre la consultation d'un item detaille
- le systeme doit permettre l'affichage du dernier prix connu
- le systeme doit permettre l'affichage d'un historique journalier

### Exigences d'ingestion

- le systeme doit pouvoir importer un catalogue
- le systeme doit pouvoir ingerer des prix
- le systeme doit historiser l'etat du marche
- le systeme doit conserver une trace d'execution des synchronisations

### Exigences UX

- le frontend doit rester lisible
- le market doit permettre de parcourir beaucoup d'items
- la fiche item doit etre orientee analyse
- la documentation API doit etre consultable dans l'application
- le systeme devra pouvoir evoluer vers une experience personnalisee par utilisateur

## 6. Exigences non fonctionnelles

### Maintenabilite

- architecture modulaire
- separation claire entre routes, services et providers
- schema Prisma coherent

### Evolutivite

- ajout futur de nouveaux markets
- ajout futur de nouvelles pages d'analyse
- reutilisation des snapshots pour graphiques plus complexes
- ajout futur d'un modele utilisateur, portfolio et widgets sauvegardes

### Robustesse

- gestion des erreurs providers
- persistance des syncs en base
- compatibilite avec mode manuel ou cron

### Lisibilite

- API JSON coherente
- nommage explicite des entites
- documentation integree et README detaille

## 7. Architecture applicative

## 7.1 Vue d'ensemble

L'application suit une architecture monolithique modulaire.

Elle combine dans un seul projet :

- frontend
- backend API
- logique metier
- integration base de donnees

### Avantages de ce choix

- mise en oeuvre plus simple
- faible cout de coordination
- bonne rapidite de developpement
- adaptation forte a un projet master

## 7.2 Couches applicatives

### Couche presentation

- pages `Next.js App Router`
- composants React
- pages market, analyze, auth, docs

### Couche API

- routes publiques de lecture
- routes internes d'operation

### Couche metier

- services de catalog
- services de pricing
- services de snapshot
- services de sante

### Couche integration

- providers externes
- mappings
- normalisation

### Couche persistence

- PostgreSQL
- Prisma ORM

## 8. Modules principaux du projet

### Module `catalog`

Responsabilite :

- importer le catalogue
- normaliser les items
- persister les variantes vendables

### Module `pricing`

Responsabilite :

- lancer les syncs de prix
- consommer les providers
- calculer les donnees utiles
- mettre a jour `LatestPrice`

### Module `snapshots`

Responsabilite :

- figer un etat de `LatestPrice`
- alimenter `DailySnapshot`
- fournir une base pour les graphiques

### Module `items`

Responsabilite :

- exposer la lecture publique des items
- servir le market et la fiche detaillee

### Module futur `users` / `portfolio`

Responsabilite prevue :

- gerer les utilisateurs
- stocker les portfolios
- memoriser les items suivis
- sauvegarder des graphiques ou composants de dashboard

### Module `jobs`

Responsabilite :

- enregistrer les cron jobs
- automatiser l'ingestion quotidienne

### Module `sync-runs`

Responsabilite :

- tracer les executions de sync
- stocker statut, volumes et metadonnees

## 9. Pages principales du frontend

### Homepage `/`

But :

- presenter le produit
- positionner la proposition de valeur

### Page `/prices`

But :

- afficher une vue de marche globale
- lister les items avec prix et tendance

### Page `/market/[itemId]`

But :

- offrir une fiche detaillee d'un item
- afficher image, variantes, graphique, provenance

### Page `/analyze`

But :

- fournir une experience graphique orientee analyse
- afficher une courbe et des indicateurs de performance

### Page `/auth`

But :

- poser la base UI de l'authentification future

### Page `/api-docs`

But :

- documenter les routes du projet
- servir de support technique pour des integrations futures

### Future page `/portfolio`

But prevu :

- permettre a un utilisateur authentifie de regrouper ses items favoris
- afficher des graphiques choisis
- personnaliser sa vue de marche

## 10. Choix techniques de realisation

### Framework frontend / backend

- `Next.js 15`

Raisons :

- App Router moderne
- pages et API dans le meme projet
- bonne adequation pour un produit full-stack

### Langage

- `TypeScript`

Raisons :

- typage strict
- fiabilite
- meilleure maintenabilite

### Base de donnees

- `PostgreSQL`

Raisons :

- modele relationnel adapte
- robustesse
- bonne compatibilite Prisma

### ORM

- `Prisma`

Raisons :

- schema lisible
- migrations
- integration simple avec TypeScript

### UI

- `React`
- `Tailwind CSS`
- `Framer Motion`
- `Recharts`

Raisons :

- rapidite de developpement
- composabilite
- interface moderne et reactive

### Tests

- `Vitest`
- `ESLint`

### Perspective DevOps

- futur pipeline CI/CD
- automatisation des etapes de lint, tests et build
- deploiement dissocie du frontend, du backend et de la base PostgreSQL
- preparation d'un cycle de livraison plus proche d'un contexte professionnel

### Perspective produit

- ajout d'une authentification reelle
- ajout d'un espace utilisateur
- ajout d'un portfolio avec composants sauvegardes

## 11. Decisions de conception importantes

### Decision 1 - Separer `LatestPrice` et `DailySnapshot`

Pourquoi :

- `LatestPrice` represente l'etat courant
- `DailySnapshot` represente l'historique fige

Interet :

- eviter de recalculer un historique a partir d'un etat ecrase
- rendre les graphiques stables

### Decision 2 - Utiliser des providers interchangeables

Pourquoi :

- les sources externes peuvent varier
- les formats peuvent changer

Interet :

- le systeme peut evoluer sans casser le coeur metier

### Decision 3 - Garder des routes internes dediees aux operations

Pourquoi :

- separer les usages publics de l'administration technique

Interet :

- clarté d'architecture
- meilleure securisation future

### Decision 4 - Conserver un `SyncRun`

Pourquoi :

- audit
- observabilite
- diagnostic

Interet :

- comprendre les echecs
- suivre les volumes traites

### Decision 5 - Preparer une architecture deploiable

Pourquoi :

- le projet a vocation a depasser le simple environnement local
- les besoins de livraison deviennent plus importants a mesure que le produit se structure

Interet :

- faciliter l'ajout futur d'une CI/CD
- separer clairement les responsabilites frontend, backend et base de donnees
- preparer un hebergement durable et maintenable

### Decision 6 - Garder un modele central extensible vers l'utilisateur

Pourquoi :

- le projet est aujourd'hui centre sur la data et le marche
- une future couche utilisateur doit pouvoir se brancher sans remettre en cause le coeur existant

Interet :

- ajouter plus tard `User`, `Portfolio` ou `SavedChart` sans refonte lourde
- conserver la separation entre donnees marche et donnees personnelles

## 12. Etat de maturite de la conception

La conception est consideree comme finalisee sur les points suivants :

- vision produit
- objectifs fonctionnels
- architecture generale
- decomposition modulaire
- schema de donnees central
- strategie d'ingestion
- logique d'historisation
- choix techniques principaux

### Points encore evolutifs mais non bloquants

- enrichissement multi-markets
- perfectionnement du matching catalogue / market
- amelioration des vues analytiques
- fonctions de portefeuille
- industrialisation du deploiement et integration CI/CD
- ajout effectif des entites utilisateur et portfolio
