# Rapport d'avancement - Partie conception finalisee

## 1. Identification du projet

### Articulation avec les livrables

Ce document correspond au livrable `L2` du projet master.
Il s'inscrit dans la continuité du livrable `L1`, qui presentait deja :

- une description succincte du projet et de ses objectifs
- un planning
- une organisation du travail

Le present livrable reprend cette base et la prolonge avec une partie conception finalisee, comme demande dans les consignes.

### Nom du projet
Cs-Stonks

### Nature du projet
Plateforme web de suivi, d'analyse et d'exploitation de donnees de marche autour des skins Counter-Strike 2.

### Type de produit
Application web full-stack avec :

- interface utilisateur
- API interne et publique
- base de donnees relationnelle
- pipeline d'ingestion de donnees marche

## 2. Besoin cible et problematique

Le marche des skins CS2 est tres actif, mais les informations utiles a l'analyse sont souvent dispersees :

- catalogue d'items
- prix actuels selon le market
- historique des ventes
- evolution dans le temps
- comparaison entre variantes d'un meme item

L'utilisateur qui veut suivre un skin, comprendre son evolution, visualiser ses performances ou preparer une decision d'achat/vente doit souvent consulter plusieurs sites et reconstituer lui-meme l'information.

### Probleme a resoudre

Comment centraliser, stocker et presenter de maniere fiable et exploitable les donnees de marche CS2 afin de permettre :

- la consultation d'un catalogue riche
- la visualisation de prix actualises
- le suivi de l'historique
- l'analyse graphique d'un item
- une base exploitable pour des evolutions futures comme le portefeuille ou la comparaison multi-markets

## 3. Motivation et utilite du projet

Le projet repond a une vraie opportunite d'usage.

Le marche CS2 fonctionne comme un micro-marche financier :

- les prix fluctuent
- certaines variantes sont rares
- les volumes de vente influencent la liquidite
- la temporalite des prix a une importance forte

### Interet du projet

- centraliser les donnees utiles dans une seule application
- rendre les prix lisibles et historises
- proposer une experience visuelle plus proche d'une interface de marche
- disposer d'une architecture maitrisee sans dependre entierement d'un service tiers d'affichage

### Utilite pour l'utilisateur final

- consulter rapidement les prix d'un item
- comprendre la tendance recente
- naviguer entre variantes, wears et phases
- lire les donnees de marche sur une page dediee
- disposer d'un historique journalier exploitable pour graphiques et analyses

## 4. Positionnement par rapport a l'existant

Il existe deja plusieurs sites dans l'ecosysteme CS2 :

- marketplaces
- comparateurs de prix
- sites de statistiques
- plateformes de contenu ou d'inspection

### Limites frequentes des solutions existantes

- experience parfois centree sur un seul market
- manque de controle sur les donnees stockees
- historique pas toujours reutilisable comme base de produit
- separation entre consultation catalogue, prix et analyse

### Positionnement de Cs-Stonks

Cs-Stonks n'est pas pense comme un simple marketplace.
Le projet se positionne comme une plateforme de donnees et d'analyse :

- ingestion et maitrise locale des donnees
- stockage structure en base PostgreSQL
- API interne et publique
- pages d'analyse et de lecture marche
- base technique evolutive pour future portfolio / analytics

## 5. Objectifs du projet

### Objectif principal

Concevoir et developper une application web capable de centraliser le catalogue CS2, d'ingérer des donnees de prix issues de markets, de les historiser en base et de les afficher dans une interface moderne orientee analyse.

### Objectifs secondaires

- construire un catalogue d'items normalise
- enrichir les items avec metadonnees utiles
- stocker les derniers prix connus par market
- generer des snapshots journaliers pour l'historique
- exposer ces donnees via une API lisible
- proposer une interface web premium pour la consultation

## 6. Methode de travail et organisation

Le projet a ete mene de facon iterative selon une logique Agile par sprints.

### Organisation retenue

- decoupage fonctionnel en sprints
- progression incrementalement livrable
- priorisation des fondations avant les enrichissements UX
- separation claire entre backend, data model, API et frontend

### Logique des sprints deja menes

- Sprint 1 : fondations data, catalogue, latest prices, snapshots
- Sprint 2 : enrichissement du pipeline de pricing et lecture publique
- Sprint 3 : import catalogue reel et enrichissement images
- Sprint 4 et 5 : premieres vraies experiences frontend
- Sprint 6 : ingestion quotidienne Skinport et structuration history/prices
- Sprint 7 : documentation API et enrichissement experience market / fiche item

### Interet de cette organisation

- limiter les risques
- valider regulierement les choix techniques
- construire d'abord le socle avant les vues avancees
- rendre chaque etape testable et comprehensible

## 7. Cahier des charges fonctionnel

### Utilisateurs cibles

- passionnes de CS2
- utilisateurs qui suivent le prix des skins
- profils interesses par l'analyse de marche
- futur administrateur ou developpeur du produit

### Fonctionnalites principales attendues

- lister les items du catalogue
- consulter la fiche detaillee d'un item
- afficher les derniers prix connus
- afficher des courbes d'evolution
- historiser les donnees journalieres
- lancer des synchronisations de donnees
- documenter l'API du projet

### Contraintes fonctionnelles

- les donnees doivent etre persistantes
- les prix doivent venir de pipelines clairement identifies
- l'historique doit etre exploitable pour les graphiques
- les routes API doivent rester coherentes et documentees

## 8. Conception generale de la solution

La solution est structuree autour de quatre briques principales :

1. une base de donnees PostgreSQL
2. une couche metier en TypeScript
3. une couche API Next.js
4. une interface web React / Next.js

### Principe general

- les providers recuperent ou lisent les donnees
- les services les normalisent et les persistents
- les routes API exposent les operations et la lecture
- les pages frontend consomment les donnees pour les afficher

### Choix technologiques de conception

Les technologies choisies font partie integrante de la conception, car elles conditionnent directement l'architecture, la maintenabilite et l'evolutivite du systeme.

- `Next.js 15` pour unifier frontend, routing et API dans un meme projet
- `React 19` pour construire l'interface utilisateur en composants
- `TypeScript` pour renforcer la fiabilite et le typage du code
- `Tailwind CSS` pour structurer rapidement une interface moderne et coherente
- `Prisma` pour modeliser proprement la base et simplifier l'acces aux donnees
- `PostgreSQL` pour disposer d'une base relationnelle robuste et persistante
- `Vitest` et `ESLint` pour la verification technique et la qualite logicielle
- `node-cron` pour preparer l'automatisation des synchronisations

### Justification generale de ces choix

Ces choix technologiques ont ete retenus pour :

- accelerer le developpement sans sacrifier la structure
- conserver une bonne lisibilite du code
- faciliter les tests et l'evolution future
- disposer d'une architecture credibilisable dans un contexte de projet master

## 9. Etat actuel d'avancement

### Ce qui est deja fonctionnel

- base PostgreSQL connectee via Prisma
- schema de donnees principal en place
- import catalogue
- stockage des items en base
- stockage des derniers prix par market
- snapshots journaliers
- jobs manuels de synchronisation
- routes publiques de lecture
- routes internes d'operations
- pages frontend principales
- documentation API integree a l'application

### Pages disponibles

- `/`
- `/prices`
- `/market/[itemId]`
- `/analyze`
- `/auth`
- `/api-docs`

### Routes API presentes

Publiques :

- `GET /api/items`
- `GET /api/items/:itemId`
- `GET /api/items/:itemId/latest-prices`
- `GET /api/items/:itemId/history`
- `GET /api/items/:itemId/origin`

Internes :

- `POST /api/internal/sync/catalog`
- `POST /api/internal/sync/prices`
- `POST /api/internal/sync/skinport`
- `POST /api/internal/sync/skinport-and-snapshot`
- `POST /api/internal/snapshots/daily`
- `GET /api/internal/health`

## 10. Architecture logique resumee

### Couche donnees

- `Item`
- `Market`
- `LatestPrice`
- `DailySnapshot`
- `SyncRun`

### Couche metier

- services de sync catalogue
- services de sync prix
- services de snapshots
- providers interchangeables

### Couche exposition

- routes publiques pour lecture
- routes internes pour operations
- documentation API

### Couche presentation

- homepage
- market
- fiche item
- analyze
- prices
- auth

## 11. Tests, validation et verification

Le projet integre deja une logique de validation technique.

### Outils et verifications

- `eslint`
- `vitest`
- tests des services et transformations critiques
- verification des jobs
- verification des routes API

### Types de validations deja pertinentes

- validation du schema Prisma
- verification de la persistance
- verification des imports catalogue
- verification des syncs de prix
- verification des snapshots
- verification des pages frontend

## 12. Perspective DevOps et industrialisation

Le projet a egalement vocation a evoluer vers une mise en production plus professionnelle.

### Orientation prevue

- mise en place d'une chaine CI/CD
- deploiement separe des differentes briques
- automatisation des verifications avant livraison

### Cible de deploiement envisagee

- frontend deploye sur une plateforme web moderne
- backend/API deploye sur une cible capable d'executer les routes et les jobs
- base de donnees PostgreSQL hebergee de maniere persistante

### Interet de cette evolution

- fiabiliser les mises en production
- automatiser lint, tests et build
- reduire les erreurs manuelles
- rendre l'application plus maintenable sur le long terme
- preparer un environnement realiste de demonstration ou d'exploitation

### Position dans l'avancement

Cette partie n'est pas encore finalisee dans l'etat actuel du projet, mais elle s'inscrit logiquement dans la suite du travail a partir des fondations deja construites.

## 13. Difficultes et points de vigilance

Le domaine CS2 impose plusieurs difficultes :

- heterogeneite des donnees selon les markets
- absence de certains items dans certains flux
- differences entre item catalogue et item expose par le provider
- distinction entre prix courant, prix minimum, historique de ventes et quantite disponible
- besoin de persister les donnees pour analyses futures

### Reponse apportee dans le projet

- pipeline de matching
- stockage local en base
- separation entre `LatestPrice` et `DailySnapshot`
- conservation d'un historique journalier
- structure modulaire permettant d'ajouter d'autres providers plus tard

## 14. Conclusion du rapport d'avancement

La partie conception du projet peut etre consideree comme finalisee a ce stade.

Les besoins sont identifies, l'architecture est definie, le schema de donnees est stable, les flux principaux sont en place et plusieurs fonctionnalites centrales sont deja realisees.

Le projet n'est donc pas au stade d'une simple idee ou d'un prototype superficiel.
Il dispose deja :

- d'une base conceptuelle claire
- d'une architecture logicielle coherente
- d'un modele de donnees solide
- d'un pipeline data fonctionnel
- d'une premiere experience produit exploitable

La suite du travail pourra s'appuyer sur ces fondations pour approfondir :

- la qualite de l'experience utilisateur
- l'enrichissement multi-markets
- l'analyse avancee
- la robustesse des synchronisations
- l'industrialisation via CI/CD et deploiement
