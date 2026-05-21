# 06 - Annexes a preparer

Le rapport final est limite a 15 pages hors annexes.
Les details longs doivent donc etre mis en annexe.

## Annexes conseillees

### Annexe 1 - Guide d'installation

Reprendre le `README.md` du depot.

Inclure :

- prerequis ;
- installation dependances ;
- copie `.env.example` ;
- Docker PostgreSQL ;
- migrations Prisma ;
- sync catalogue ;
- sync prix ;
- lancement ;
- tests.

### Annexe 2 - Diagramme BDD complet

Utiliser le Mermaid de :

```text
avancement-2/04-modele-bdd-mermaid.md
```

### Annexe 3 - Architecture technique

Faire un schema :

```text
Utilisateur -> Next.js -> API routes -> Services -> Prisma -> PostgreSQL
                                    -> Providers externes
```

### Annexe 4 - Captures d'ecran

Captures importantes :

- page d'accueil ;
- page prices / market ;
- fiche item ;
- modale prix multi-market ;
- page analyze avec graphique ;
- stylo / annotation sur graphique ;
- page inventory ;
- page management ;
- page profile ;
- api-docs.

### Annexe 5 - Exemples de commandes

Commandes utiles :

```bash
npm ci
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate:deploy
npm run job:catalog
npm run job:skinport
npm run job:snapshot
npm run dev
```

Commandes qualite :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Annexe 6 - CI/CD

Inclure ou resumer :

```text
docs/ci-cd.md
```

Montrer que la CI verifie :

- installation ;
- Prisma ;
- migrations ;
- lint ;
- typecheck ;
- tests ;
- build.

### Annexe 7 - Endpoints API

Exemples :

- `GET /api/items`
- `GET /api/items/:itemId`
- `GET /api/items/:itemId/latest-prices`
- `GET /api/items/:itemId/history`
- `POST /api/internal/sync/skinport`
- `POST /api/internal/sync/csfloat`
- `GET /api/management/summary`
- `GET /api/inventory`

### Annexe 8 - Planning / sprints

Utiliser les fichiers :

```text
Agent/SPRINT*.md
```

Ne pas tout coller dans le rapport.
Faire une synthese :

- fondation data ;
- catalogue ;
- homepage ;
- analyse graphique ;
- PostgreSQL Docker ;
- ingestion Skinport ;
- multi-market ;
- Steam auth ;
- dashboard ;
- CI/CD.

## Ce qu'il ne faut pas mettre dans les annexes

Ne jamais inclure :

- `.env` ;
- cles Steam ;
- cles CSFloat ;
- tokens ;
- cookies Steam ;
- secrets GitHub.

## Remarque de rendu

Si le projet n'est pas deploye, ce n'est pas bloquant si le README permet de
l'executer localement.

Il faut cependant bien montrer :

- installation claire ;
- base Docker ;
- migrations ;
- commandes de sync ;
- pages a tester.

