# Ajout futur - Couche utilisateur et portfolio

## 1. Objet de ce document

Ce document complete les fichiers `01` a `05` deja transmis.

Il a pour but de preciser une evolution fonctionnelle et de conception qui n'etait pas encore formellement detaillee dans la premiere version des documents :

- l'ajout futur d'un utilisateur
- l'ajout futur d'un portfolio
- l'ajout futur de graphiques ou vues sauvegardees

Ce document doit etre lu comme une **extension prevue du projet**, et non comme une fonctionnalite deja implementee dans la version actuelle.

## 2. Contexte

Le projet `Cs-Stonks` est actuellement centre sur :

- le catalogue d'items
- les prix de marche
- les snapshots historiques
- les pages de consultation et d'analyse

La base de donnees actuelle contient principalement :

- `Item`
- `Market`
- `LatestPrice`
- `DailySnapshot`
- `SyncRun`

Il n'existe pas encore de table `User` dans la base actuelle.

## 3. Motivation de l'ajout

L'evolution vers une couche utilisateur est pertinente pour faire evoluer le projet d'une plateforme de consultation de donnees vers une plateforme d'usage personnalise.

### Objectifs de cette extension

- permettre a un utilisateur de sauvegarder des items suivis
- permettre a un utilisateur de constituer un portfolio personnel
- permettre a un utilisateur de choisir quels graphiques il souhaite voir
- permettre a un utilisateur de retrouver son espace personnalise d'une session a l'autre

## 4. Fonctionnalites futures visees

### Fonctionnalite 1 - Compte utilisateur

L'utilisateur pourra disposer d'un compte personnel.

### Fonctionnalite 2 - Portfolio

L'utilisateur pourra :

- ajouter des items a suivre
- organiser ses items dans un portfolio
- consulter une vue centralisee de ses actifs suivis

### Fonctionnalite 3 - Graphiques sauvegardes

L'utilisateur pourra :

- enregistrer une vue graphique precise
- choisir une periode
- choisir un item
- retrouver plus tard cette configuration

### Fonctionnalite 4 - Tableau de bord personnalise

L'utilisateur pourra a terme disposer d'un espace ou il choisit :

- les items affiches
- les graphiques a surveiller
- les informations de marche importantes pour lui

## 5. Entites futures envisagees

## 5.1 `User`

### Role

Represente un utilisateur du systeme.

### Attributs possibles

- `id`
- `email`
- `username`
- `passwordHash` ou identifiant externe
- `createdAt`
- `updatedAt`

## 5.2 `Portfolio`

### Role

Represente un espace personnel appartenant a un utilisateur.

### Attributs possibles

- `id`
- `userId`
- `name`
- `description`
- `createdAt`
- `updatedAt`

## 5.3 `PortfolioItem`

### Role

Represente un item suivi dans un portfolio.

### Attributs possibles

- `id`
- `portfolioId`
- `itemId`
- `targetBuyPrice`
- `notes`
- `createdAt`

## 5.4 `SavedChart`

### Role

Represente un graphique ou une vue sauvegardee par l'utilisateur.

### Attributs possibles

- `id`
- `userId`
- `itemId`
- `title`
- `period`
- `marketSlug`
- `layoutPosition`
- `createdAt`
- `updatedAt`

## 6. Cardinalites futures envisagees

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

- un `User` peut posseder `0..N` graphiques sauvegardes
- un `SavedChart` appartient a `1..1` utilisateur

### Relation entre `SavedChart` et `Item`

- un `SavedChart` peut etre lie a `0..1` ou `1..1` item selon le niveau de souplesse retenu
- un `Item` peut etre reference par `0..N` graphiques sauvegardes

## 7. Principe architectural

L'ajout de la couche utilisateur ne doit pas casser le coeur du projet existant.

### Principe de conception retenu

- les donnees de marche restent separees des donnees personnelles
- `Item`, `Market`, `LatestPrice` et `DailySnapshot` restent le socle central
- les futures entites utilisateur viennent se greffer autour de ce socle

### Avantages

- meilleure maintenabilite
- extension progressive possible
- faible impact sur le pipeline de pricing existant
- bonne separation entre donnees globales et donnees privees

## 8. Impact sur les pages futures

Cette extension permettrait de creer a terme une page du type :

- `/portfolio`

Cette page pourrait afficher :

- les items suivis par l'utilisateur
- les graphiques selectionnes
- les vues favorites
- un tableau de bord personnalise

## 9. Impact sur la base de donnees

Le schema actuel n'a pas besoin d'etre refondu.

L'evolution peut se faire par ajout progressif de nouvelles tables :

- `User`
- `Portfolio`
- `PortfolioItem`
- `SavedChart`

Le modele actuel est compatible avec cette extension car :

- les entites marche sont deja bien isolees
- la relation avec un item peut etre ajoutee simplement
- l'historique et les prix sont deja persistants

## 10. Impact sur l'API future

Cette evolution conduira probablement a ajouter des routes telles que :

- `GET /api/portfolio`
- `POST /api/portfolio`
- `POST /api/portfolio/items`
- `GET /api/user/saved-charts`
- `POST /api/user/saved-charts`

Ces routes sont seulement des pistes de conception a ce stade.
Elles ne doivent pas etre considerees comme deja presentes.

## 11. Position dans le projet

Cette extension appartient a une phase future du produit.

Elle s'inscrit logiquement apres :

- la stabilisation du catalogue
- la stabilisation du pipeline de prix
- la fiabilisation de l'historique
- l'amelioration du deploiement et de la CI/CD

## 12. Consigne recommandee pour ChatGPT 5.5

Si ce document est envoye en complement des fichiers `01` a `05`, on peut demander :

"A partir des documents deja fournis et de ce fichier complementaire, propose une extension propre du modele de donnees pour ajouter un espace utilisateur, un portfolio et des graphiques sauvegardes. Je veux les entites, les cardinalites, les attributs principaux et un schema Mermaid ou PlantUML."

