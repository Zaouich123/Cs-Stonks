# 05 - Brief pour generer le rapport final

Ce document explique a ChatGPT ce qu'il doit produire pour le rapport final.

## Contrainte

Le rapport final doit faire 15 pages maximum hors annexes.

Il faut donc etre synthetique dans le corps du rapport et placer les details
longs en annexe.

## Ton attendu

Le rapport doit etre :

- clair ;
- professionnel ;
- structure ;
- comprehensible par un jury ;
- oriente ingenierie logicielle ;
- honnete sur les limites.

## Angle principal du rapport

Ne pas presenter Cs-Stonks comme un clone de CSFloat.

Presenter Cs-Stonks comme :

- une plateforme d'analyse et de suivi du marche CS2 ;
- proche d'un site de reference type CSGOSkins ;
- enrichie avec un portfolio utilisateur ;
- connectee a l'inventaire Steam ;
- capable de lire plusieurs marketplaces ;
- disposant d'outils graphiques d'analyse avances.

## Plan recommande en 15 pages

### 1. Introduction

Presenter Cs-Stonks en quelques lignes.

Dire que le projet traite le suivi du marche des skins CS2, la comparaison de
prix et l'analyse personnelle d'un inventaire.

### 2. Besoin et problematique

Expliquer :

- fragmentation des marketplaces ;
- difficulte de comparer les prix ;
- absence de dashboard personnel complet ;
- besoin d'un historique ;
- besoin d'une analyse graphique plus riche.

### 3. Positionnement

Comparer rapidement avec :

- CSFloat ;
- Skinport ;
- CSGOSkins / CS2Skins.

Insister sur le fait que Cs-Stonks est oriente suivi/analyse/portfolio.

### 4. Objectifs fonctionnels

Lister les objectifs :

- catalogue ;
- market ;
- fiche item ;
- prix multi-market ;
- graphiques ;
- analytics avec stylo ;
- inventaire Steam ;
- profil Steam ;
- dashboard ;
- echanges ;
- API docs.

### 5. Architecture generale

Decrire :

- frontend Next.js ;
- backend via API routes ;
- services metier ;
- Prisma ;
- PostgreSQL ;
- jobs providers.

Inclure un schema simple.

### 6. Modele de donnees

Presenter les tables principales :

- `Item` ;
- `Market` ;
- `LatestPrice` ;
- `DailySnapshot` ;
- `User` ;
- `Session` ;
- `UserTrackedSkin` ;
- `UserInventorySnapshot` ;
- `UserDashboardWidget` ;
- `UserTrade`.

Mettre le diagramme complet en annexe.

### 7. Realisation

Expliquer les pages importantes :

- accueil ;
- prices / market ;
- fiche item ;
- analyze ;
- inventory ;
- management ;
- profile ;
- exchanges.

### 8. Synchronisation des donnees

Expliquer le flux :

```text
providers externes -> jobs -> matching -> LatestPrice -> DailySnapshot -> UI
```

Mentionner les providers :

- Skinport ;
- CSFloat ;
- DMarket ;
- WAXPEER ;
- white.market.

### 9. Securite

Expliquer :

- auth Steam OpenID ;
- sessions HTTP-only ;
- secrets dans `.env` ;
- routes personnelles protegees ;
- pas de mot de passe Steam ;
- pas de cookies Steam stockes.

### 10. Tests et qualite

Mentionner :

- lint ;
- typecheck ;
- tests Vitest ;
- build ;
- migrations Prisma ;
- GitHub Actions.

### 11. Deploiement et execution

Dire que le projet est executable localement avec :

- Docker ;
- PostgreSQL ;
- Prisma migrations ;
- jobs de synchronisation ;
- `npm run dev`.

Si le projet n'est pas deploye en ligne, le presenter comme une limite et une
perspective, pas comme un oubli.

### 12. Limites

Mentionner :

- APIs externes variables ;
- rate limits ;
- Steam inventory peut repondre 429 ;
- CSFloat necessite une cle API ;
- certaines offres Steam ne sont pas detaillees par l'API officielle ;
- donnees dependantes des providers.

### 13. Perspectives

Exemples :

- deploiement production ;
- portfolio complet ;
- alertes prix automatisees ;
- notifications ;
- plus de markets ;
- mobile ;
- export avance ;
- analyse de trades plus robuste.

### 14. Conclusion

Resumer les apprentissages :

- gestion de projet ;
- architecture fullstack ;
- modelisation BDD ;
- UX/UI ;
- API ;
- CI/CD ;
- tests.

## Annexes recommandees

- README d'installation ;
- diagramme BDD complet ;
- captures des pages ;
- workflows CI ;
- endpoints API ;
- sprints ;
- schema d'architecture ;
- commandes de lancement.

## Phrase de conclusion possible

Cs-Stonks a evolue d'une base catalogue/prix vers une plateforme complete de
suivi du marche CS2, combinant donnees multi-market, graphiques interactifs,
authentification Steam et fondations d'un portfolio utilisateur personnalise.

