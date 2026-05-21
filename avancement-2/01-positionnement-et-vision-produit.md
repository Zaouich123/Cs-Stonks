# 01 - Positionnement et vision produit

## Idee generale

Cs-Stonks est une application web dediee au suivi du marche des skins CS2.
Elle permet de consulter les prix d'items, comparer plusieurs marketplaces,
analyser des courbes de prix et construire progressivement un espace personnel
autour de son inventaire Steam.

Le projet se rapproche davantage d'un site de reference comme CSGOSkins /
CS2Skins que d'une marketplace comme CSFloat.

## Ce que le projet n'est pas

Cs-Stonks n'est pas :

- une marketplace qui vend directement des skins ;
- un bot de trading ;
- un clone de CSFloat ;
- un outil d'acceptation automatique des trades ;
- un scraper agressif de marketplaces ;
- une plateforme de paiement.

## Ce que le projet veut devenir

Cs-Stonks veut etre une plateforme de decision et de suivi personnel pour les
joueurs/investisseurs CS2.

L'objectif est de repondre a ces questions :

- Combien vaut mon inventaire ?
- Quels skins dois-je surveiller ?
- Quel est le lowest price actuel selon plusieurs marketplaces ?
- Comment le prix d'un item evolue-t-il sur 7 jours, 90 jours ou 1 an ?
- Puis-je annoter un graphique comme sur un outil d'analyse ?
- Est-ce qu'un trade semble rentable ?
- Quelles marketplaces donnent les meilleurs prix ?
- Quels items sont suivis dans mon portfolio ?

## Probleme traite

Le marche CS2 est fragmente :

- les prix sont repartis sur plusieurs marketplaces ;
- les donnees ne sont pas toujours synchronisees ;
- les joueurs doivent comparer manuellement plusieurs sites ;
- les graphiques sont souvent limites ;
- l'inventaire personnel n'est pas toujours relie a une analyse de marche ;
- les sites existants montrent les items, mais ne proposent pas toujours un
  vrai dashboard personnel evolutif.

Cs-Stonks centralise ces donnees et construit une couche d'analyse au-dessus.

## Opportunite

Le marche des skins CS2 est dynamique, avec des variations de prix importantes.
Un utilisateur peut avoir besoin :

- de suivre ses skins comme un portefeuille ;
- de comparer les prix avant achat ou vente ;
- de visualiser les tendances ;
- d'identifier les opportunites ;
- de garder un historique local des prix ;
- d'analyser ses items avec des outils graphiques.

## Positionnement face aux solutions existantes

### CSFloat

CSFloat est avant tout une marketplace et un outil de listing tres precis.
Il est excellent pour acheter/vendre et inspecter des skins.

Cs-Stonks ne cherche pas a le remplacer.
Il utilise plutot ce type de donnees comme source de prix lorsqu'elles sont
disponibles.

### Skinport

Skinport est une marketplace avec des prix reels et un historique de ventes.
Cs-Stonks peut consommer Skinport pour recuperer des prix, mais ne vend pas
directement les items.

### CSGOSkins / CS2Skins

Ces sites sont proches du positionnement de consultation catalogue :

- fiche item ;
- images ;
- skins similaires ;
- informations de collection ;
- prix ou tendances.

Cs-Stonks veut aller plus loin sur deux aspects :

- portfolio utilisateur ;
- analyse graphique avancee.

## Valeur ajoutee principale

La valeur ajoutee de Cs-Stonks repose sur trois piliers :

1. Centraliser les prix multi-market.
2. Proposer une analyse graphique plus riche avec zoom, annotation et stylo.
3. Relier l'analyse de marche au profil utilisateur, son inventaire et son
   futur portfolio.

## Phrase de synthese pour le rapport

Cs-Stonks est une plateforme web d'analyse du marche CS2 qui centralise les
prix de plusieurs marketplaces, propose des graphiques interactifs annotables
et prepare un espace personnel permettant de suivre son inventaire, ses skins
favoris et ses opportunites de trading.

