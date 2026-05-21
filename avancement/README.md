# Dossier d'avancement - Cs-Stonks

Ce dossier a ete prepare pour deux usages :

1. servir de base a ton livrable academique "Rapport d'avancement"
2. servir d'entree claire pour ChatGPT 5.5 afin de produire ensuite des schemas, diagrammes ou reformulations

## Ordre de lecture recommande

1. [01-rapport-avancement-conception.md](./01-rapport-avancement-conception.md)
2. [02-conception-detaillee.md](./02-conception-detaillee.md)
3. [03-architecture-donnees-et-flux.md](./03-architecture-donnees-et-flux.md)
4. [04-brief-chatgpt-55.md](./04-brief-chatgpt-55.md)

## Conseils d'utilisation

- Si tu veux rendre un rapport : pars surtout du fichier `01`.
- Si tu veux demander a ChatGPT de generer des schemas : donne-lui `02`, `03` et `04`.
- Si tu veux qu'il te fasse une version plus academique : donne-lui `01` + `04`.

## Perimetre actuel du projet

Le dossier decrit l'etat reel du projet `Cs-Stonks` au `27 avril 2026`, a partir du code present dans le repository :

- application web `Next.js 15`
- backend integre via routes API Next.js
- base `PostgreSQL` avec `Prisma`
- ingestion catalogue et pricing
- pages produit principales : homepage, market, fiche item, analyze, prices, auth, api-docs

## Objectif de cette documentation

L'objectif n'est pas uniquement de decrire le code.
Le but est aussi de formaliser clairement :

- le besoin
- la proposition de valeur
- les fonctionnalites
- l'architecture
- les modeles de donnees
- les flux
- les choix techniques
- l'organisation par sprints
- les tests et validations

