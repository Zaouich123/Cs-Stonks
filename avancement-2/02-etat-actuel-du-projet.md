# 02 - Etat actuel du projet

## Etat global

Le projet est une application Next.js fullstack avec une base PostgreSQL et
Prisma.

Le frontend, les routes API et les jobs de synchronisation sont dans le meme
depot.

## Fonctionnalites deja presentes

### Page d'accueil

La landing page presente le produit, le positionnement et les principales
promesses :

- suivi du marche CS2 ;
- donnees de prix ;
- analytics ;
- portfolio.

### Market / prix

La page `Prices` / `Market` permet :

- de lister les items CS2 ;
- de rechercher dans le catalogue ;
- de filtrer ;
- de paginer ;
- d'afficher les prix disponibles ;
- d'afficher une mini-tendance 7 jours visuelle.

### Fiche item

Chaque item dispose d'une page detaillee :

- image de l'item ;
- variantes wear / StatTrak / Souvenir ;
- phases pour certains items comme Doppler ;
- prix par marketplace ;
- graphique d'evolution ;
- informations d'origine comme collection et caisses lorsque disponibles.

### Page Analyze

La page `Analyze` est l'une des experiences centrales du projet.

Elle propose :

- graphique type trading ;
- selection d'item ;
- selection de market ;
- periodes 7j, 90j et 1 an ;
- zoom sur une plage par selection souris ;
- tendance et pourcentage ;
- annotations ;
- outil stylo ;
- choix de couleur ;
- undo / redo ;
- nettoyage complet ;
- export image.

Cette page est importante car elle differencie Cs-Stonks d'un simple catalogue
de prix.

### Authentification Steam

Le projet integre Steam OpenID :

- connexion via Steam ;
- creation d'un utilisateur local ;
- session locale HTTP-only ;
- recuperation de l'avatar et du pseudo Steam ;
- page profil.

### Inventaire Steam

Le projet contient une page inventaire :

- lecture de l'inventaire Steam lorsque possible ;
- affichage visuel des items ;
- estimation avec les prix disponibles en base ;
- bouton permettant de voir les prix sur tous les markets.

Limite connue :

- Steam peut repondre `429` si trop de requetes sont faites.

### Management / dashboard utilisateur

Une base de dashboard personnel existe :

- widgets personnalisables ;
- suivi de skins ;
- valeur d'inventaire ;
- news CS2 ;
- listings marketplaces ;
- trades ;
- notifications.

L'objectif futur est d'en faire un vrai portfolio utilisateur.

### Echanges Steam

Le projet explore l'analyse des trades Steam.

L'idee est de comparer :

- items donnes ;
- items recus ;
- valeur estimee depuis les prix en base ;
- verdict sur la rentabilite.

Limite importante :

- l'API Steam ne renvoie pas toujours les details d'une offre meme quand Steam
  affiche un compteur d'offres.

### Documentation API

Une page `api-docs` permet de documenter les endpoints internes et publics.

### CI/CD

Le projet contient des workflows GitHub Actions :

- installation propre avec `npm ci` ;
- generation Prisma ;
- validation Prisma ;
- migrations sur PostgreSQL de test ;
- lint ;
- typecheck ;
- tests ;
- build.

## Providers de donnees

Le projet utilise plusieurs sources :

- catalogue ByMykel / CSGO-API ;
- Skinport ;
- CSFloat ;
- DMarket ;
- WAXPEER ;
- white.market.

Les donnees sont normalisees et stockees localement.

## Base de donnees

La base PostgreSQL stocke :

- catalogue d'items ;
- markets ;
- derniers prix ;
- snapshots journaliers ;
- utilisateurs ;
- sessions ;
- portfolio/dashboard ;
- inventaire ;
- trades ;
- notifications.

## Ce qui est important a expliquer dans le rapport

Le projet n'est pas seulement une interface.

Il contient :

- une vraie architecture data ;
- une base PostgreSQL ;
- des jobs d'ingestion ;
- plusieurs providers externes ;
- une couche backend ;
- une couche frontend ;
- des tests et une CI.

