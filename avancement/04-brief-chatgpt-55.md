# Brief pret a envoyer a ChatGPT 5.5

Tu peux copier-coller ce prompt dans ChatGPT 5.5 avec les autres fichiers du dossier `avancement/`.

---

## Prompt recommande

Je travaille sur un projet nomme `Cs-Stonks`.

Je vais te fournir plusieurs fichiers Markdown qui decrivent :

- le rapport d'avancement
- la conception detaillee
- l'architecture des donnees et des flux

Ta mission est de m'aider a produire des livrables academiques et visuels a partir de ces documents.

### Regles importantes

1. N'invente pas des fonctionnalites absentes si elles ne sont pas explicitement decrites.
2. Base-toi uniquement sur les documents fournis.
3. Si un point est implicite, formule-le comme une hypothese raisonnable.
4. Utilise un style clair, academique et structure.
5. Si tu proposes un schema, explique d'abord ce qu'il represente.

### Ce que je peux te demander ensuite

- me faire un diagramme de cas d'usage UML
- me faire un MCD ou un diagramme de classes
- me faire un diagramme de sequence
- me faire un diagramme d'architecture logique
- reformuler le rapport dans un style plus universitaire
- produire une version plus courte pour rendu PDF
- produire une soutenance orale

### Contexte du projet

Le projet est une application web full-stack orientee donnees de marche CS2.

Fonctions principales :

- stocker un catalogue d'items
- ingerer des prix depuis des providers externes
- stocker les derniers prix par market
- figer des snapshots journaliers
- exposer une API publique et interne
- fournir des pages frontend de consultation et d'analyse

Le projet ne contient pas encore d'entite `User` dans la base actuelle, mais il doit pouvoir evoluer plus tard vers :

- un espace utilisateur
- une page portfolio
- des graphiques sauvegardes
- des preferences personnelles

### Stack technique

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Vitest
- node-cron

### Perspective proche

Le projet doit aussi pouvoir evoluer vers :

- une CI/CD
- un deploiement du frontend
- un deploiement du backend / API
- une base PostgreSQL hebergee
- une gestion des jobs planifies en environnement de production

### Entites principales

- Item
- Market
- LatestPrice
- DailySnapshot
- SyncRun

### Entites futures possibles

- User
- Portfolio
- PortfolioItem
- SavedChart ou DashboardWidget

### Pages principales

- homepage
- prices
- market detail
- analyze
- auth
- api-docs

### Routes publiques principales

- GET /api/items
- GET /api/items/:itemId
- GET /api/items/:itemId/latest-prices
- GET /api/items/:itemId/history
- GET /api/items/:itemId/origin

### Routes internes principales

- POST /api/internal/sync/catalog
- POST /api/internal/sync/prices
- POST /api/internal/sync/skinport
- POST /api/internal/snapshots/daily
- GET /api/internal/health

### Attentes de sortie

Quand je te demande un schema, donne-moi idealement :

1. une explication du schema
2. une version texte lisible
3. si possible une version compatible Mermaid ou PlantUML

Quand je te demande une reformulation de rapport :

1. garde un ton universitaire
2. garde une structure numerotee
3. veille a la coherence entre besoin, conception, realisation et validation

---

## Exemples de demandes a faire ensuite a ChatGPT 5.5

### Demande 1 - Cas d'usage

En te basant sur les fichiers fournis, genere un diagramme de cas d'usage UML complet du projet.
Je veux :

- les acteurs
- les cas d'usage principaux
- les relations utiles
- une version Mermaid ou PlantUML
- une explication courte

### Demande 2 - MCD

En te basant sur les fichiers fournis, genere un MCD clair du projet avec :

- les entites
- les attributs essentiels
- les cardinalites
- une interpretation lisible

### Demande 3 - Diagramme de sequence

Genere un diagramme de sequence pour le cas "sync des prix Skinport" avec :

- declencheur
- service metier
- provider
- persistance Prisma / PostgreSQL
- enregistrement du SyncRun

### Demande 4 - Diagramme d'architecture

Genere un schema d'architecture logique du projet en couches :

- frontend
- API
- services metier
- providers
- base PostgreSQL

### Demande 5 - Diagramme de deploiement

Genere un diagramme de deploiement cible pour ce projet avec :

- frontend
- backend / API
- base PostgreSQL
- scheduler ou cron de production
- pipeline CI/CD

Explique bien ce qui est deja en place et ce qui releve encore d'une perspective d'evolution.

### Demande 6 - Rapport academique

Reformule le rapport d'avancement dans un style plus academique et plus formel, tout en gardant les informations techniques du projet.

### Demande 7 - Extension BDD utilisateur

En te basant sur les documents fournis, propose une extension propre du modele de donnees pour ajouter :

- un utilisateur
- un portfolio
- des items suivis
- des graphiques ou widgets sauvegardes

Je veux :

- les nouvelles entites
- les cardinalites
- les attributs principaux
- la justification de conception

## Conseils d'usage

### Si tu veux de meilleurs schemas

Donne a ChatGPT au minimum :

- `01-rapport-avancement-conception.md`
- `02-conception-detaillee.md`
- `03-architecture-donnees-et-flux.md`

### Si tu veux juste une meilleure redaction

Donne surtout :

- `01-rapport-avancement-conception.md`

### Si tu veux preparer une soutenance

Demande ensuite :

- un resume oral en 3 minutes
- un plan de slides
- les points forts techniques
- les limites actuelles et perspectives
