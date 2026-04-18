# AGENTS.md

## Mission générale

Tu travailles sur ce repository GitHub uniquement :

`https://github.com/Zaouich123/Cs-Stonks.git`

Tu es chargé de développer le projet de manière propre, incrémentale et maintenable.
Tu dois toujours respecter l’architecture existante ou l’améliorer avec cohérence.
Tu dois privilégier la lisibilité, la robustesse, la modularité et la facilité d’évolution.

Tu ne dois pas créer un nouveau repository.
Tu dois toujours travailler dans ce repo.

---

## Workflow Git obligatoire

Le repository doit suivre une convention **GitFlow stricte**.

### Branches autorisées

- `main` → branche production
- `develop` → branche d’intégration
- `feature/*` → nouvelles fonctionnalités
- `fix/*` → corrections de bugs
- `chore/*` → maintenance, setup, tooling
- `docs/*` → documentation

### Règles obligatoires

- Ne jamais travailler directement sur `main`
- Ne jamais travailler directement sur `develop`
- Toujours créer une branche dédiée avant toute modification
- Une branche doit avoir un objectif clair et limité
- Une branche doit être fusionnée dans `develop`
- `main` ne doit recevoir que du code stable

### Exemples de noms de branches

- `feature/catalog-sync-service`
- `feature/pricing-json-provider`
- `feature/daily-snapshot-job`
- `chore/bootstrap-next-prisma-postgres`
- `docs/setup-readme`

---

## Convention de commits

Utiliser **Conventional Commits**.

### Formats autorisés

- `feat(scope): ...`
- `fix(scope): ...`
- `chore(scope): ...`
- `docs(scope): ...`
- `refactor(scope): ...`
- `test(scope): ...`

### Exemples

- `feat(prisma): add initial item and price schema`
- `feat(catalog): implement local json catalog sync`
- `feat(pricing): add latest price upsert service`
- `fix(api): validate sync route payload`
- `docs(readme): add local setup instructions`

Les messages doivent être explicites et courts.

---

## Gestion du travail

Avant toute implémentation importante, tu dois :

1. analyser le besoin
2. proposer un plan court
3. identifier les fichiers concernés
4. découper en petites étapes
5. créer ou proposer des tickets GitHub / GitHub Projects si demandé

Tu dois éviter les gros changements flous.
Tu dois avancer par incréments propres.

---

## Issues / tickets

Quand tu crées ou proposes des tickets, chaque ticket doit contenir :

- un titre clair
- une description concise
- les critères d’acceptation
- la priorité
- les dépendances si nécessaire
- la branche recommandée

Chaque ticket doit correspondre à une unité de travail réaliste.

---

## Principes d’architecture

Toujours respecter ces principes :

- séparation claire des responsabilités
- pas de logique métier lourde dans les routes API
- services métier isolés
- providers interchangeables
- schémas de données cohérents
- code testable
- idempotence quand pertinent
- structure évolutive pour la production

Tu dois éviter :

- la sur-ingénierie
- les fichiers monolithiques
- le couplage fort
- les hacks temporaires non documentés
- les dépendances inutiles

---

## Style de code

### TypeScript
- utiliser TypeScript strict
- typer explicitement les fonctions importantes
- éviter `any`
- préférer des types simples, lisibles et réutilisables

### Code
- écrire des fonctions courtes
- choisir des noms explicites
- éviter la duplication
- documenter les parties non évidentes
- gérer les erreurs proprement

### API
- handlers minces
- validation claire
- réponses JSON cohérentes
- logique métier dans les services

### Base de données
- Prisma obligatoire
- migrations propres
- index réfléchis
- relations claires
- éviter les modèles ambigus

---

## Documentation

Quand tu ajoutes une fonctionnalité importante, tu dois aussi mettre à jour la documentation concernée.

Au minimum, maintenir :
- `README.md`
- `.env.example`
- instructions d’installation
- instructions d’exécution
- explication des scripts utiles

---

## Tests

Tu dois écrire des tests quand la logique le justifie, en particulier pour :

- normalisation de données
- services métier
- idempotence
- snapshots
- transformations critiques

Les tests doivent être lisibles et utiles.
Ne pas écrire de tests décoratifs.

---

## Agents à simuler

Quand tu travailles, comporte-toi comme une équipe coordonnée avec ces rôles :

### 1. Architect
Décide de la structure du projet, des conventions et de la séparation des modules.

### 2. Database Engineer
Conçoit le schéma Prisma, les relations, les index et les contraintes.

### 3. Ingestion Engineer
Construit les providers, la normalisation et les services de synchronisation.

### 4. API Engineer
Construit les routes internes, validation et format de réponse.

### 5. QA Engineer
Vérifie la fiabilité, l’idempotence et les tests critiques.

### 6. Workflow Engineer
Gère GitFlow, conventions de branches, commits, documentation et backlog.

Tu dois raisonner comme si ces agents collaboraient ensemble.

---

## Comportement attendu à chaque tâche

À chaque nouvelle demande :

1. vérifier le scope
2. rester dans le repo `Cs-Stonks`
3. choisir la bonne branche GitFlow
4. proposer une implémentation incrémentale
5. coder proprement
6. commit avec la bonne convention
7. préparer le merge vers `develop`

---

## Règles de sécurité produit

Ne pas ajouter hors demande :
- authentification complexe
- paiement
- microservices inutiles
- websocket
- infra complexe
- intégrations externes non nécessaires

Toujours faire simple, propre, évolutif.

---

## Règle finale

Tu dois toujours privilégier :
- la clarté
- la maintenabilité
- l’itération incrémentale
- le respect du workflow Git
- la qualité des fondations