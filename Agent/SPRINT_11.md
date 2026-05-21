# SPRINT_11.md

## Contexte

Le projet `Cs-Stonks` dispose déjà de plusieurs briques importantes :

- authentification Steam
- profil utilisateur
- catalogue d’items CS2
- prix par marketplace
- snapshots journaliers
- graphiques d’analyse
- pages prix / analyse / API docs
- providers marketplaces
- base PostgreSQL avec Prisma
- CI/CD GitHub

Le sprint 11 doit ajouter une nouvelle page produit importante :

```text
/management
```

Cette page doit être un **espace personnel utilisateur**, accessible depuis la navbar, uniquement pour les utilisateurs connectés.

Le but est de créer un dashboard personnalisé où l’utilisateur peut suivre :

- des skins
- des graphiques
- son inventaire
- la valeur de son inventaire
- les dernières mises à jour CS2
- ses ventes sur marketplaces
- ses échanges avec des particuliers
- les délais de trade avant qu’un item soit réellement échangeable
- ses notifications importantes

---

## Objectif du sprint

Créer une page **Management / Dashboard utilisateur** accessible à :

```text
/management
```

Cette page doit permettre à un utilisateur connecté de gérer et suivre son activité CS2.

Le système doit :

1. ajouter un lien `Management` dans la navbar
2. protéger la route `/management`
3. créer une page dashboard personnalisée
4. afficher des widgets utilisateur
5. permettre de suivre des skins avec graphiques
6. afficher la dernière mise à jour CS2 si l’utilisateur l’active
7. afficher une estimation de la valeur de l’inventaire
8. permettre de suivre des listings / ventes sur marketplaces
9. permettre de suivre des trades avec des particuliers
10. afficher un countdown jusqu’à la fin du délai de trade
11. créer un système de notifications utilisateur
12. préparer la personnalisation du dashboard

---

## Règle principale

La page `/management` doit être accessible uniquement si l’utilisateur est connecté.

Si l’utilisateur n’est pas connecté :

- rediriger vers `/auth`
- ou afficher une page de blocage claire avec CTA “Sign in with Steam”

Le dashboard ne doit jamais afficher de données personnelles si l’utilisateur n’est pas authentifié.

---

## Hors scope

Ne pas faire dans ce sprint :

- marketplace selling automation complète
- création automatique de trades Steam
- acceptation automatique de trade offers
- bots Steam
- système de paiement
- notifications push complexes
- websocket temps réel
- scraping agressif de marketplaces
- intégration privée avec comptes marketplace sans API officielle
- automatisation de ventes réelles
- contournement de limites Steam ou marketplace

Le but est de construire une **base produit solide**, pas un bot de trading automatisé.

---

## Page à créer

Créer :

```text
/app/management/page.tsx
```

ou équivalent selon l’architecture du projet.

Route attendue :

```http
GET /management
```

---

## Navbar

La navbar doit inclure un lien vers :

```text
Management
```

### Comportement attendu

Si l’utilisateur est connecté :

- afficher le lien `Management`
- éventuellement afficher son avatar Steam
- lien vers `/profile`
- lien vers `/management`

Si l’utilisateur n’est pas connecté :

- afficher un bouton `Sign in`
- ne pas afficher les données utilisateur
- le lien `Management` peut être masqué ou rediriger vers `/auth`

---

## Vision produit de la page Management

Cette page doit être l’équivalent du “centre de contrôle” de l’utilisateur.

Elle doit permettre à l’utilisateur de répondre rapidement à ces questions :

- Quels skins est-ce que je track ?
- Est-ce que mon inventaire prend de la valeur ?
- Quels items dois-je surveiller ?
- Est-ce qu’un de mes skins s’est vendu ?
- Sur quelle marketplace ai-je listé mes skins ?
- Avec qui ai-je fait des trades ?
- Combien de temps reste-t-il avant que mon trade / item soit effectif ?
- Quelles infos importantes dois-je voir aujourd’hui ?

---

## Layout général attendu

La page doit être un dashboard moderne.

### Structure recommandée

```text
ManagementPage
  ├── ManagementHeader
  ├── ManagementSummaryCards
  ├── DashboardWidgetGrid
  │    ├── TrackedSkinChartWidget
  │    ├── InventoryValueWidget
  │    ├── Cs2UpdateWidget
  │    ├── MarketplaceSalesWidget
  │    ├── TradeTrackerWidget
  │    └── NotificationsWidget
  └── DashboardCustomizePanel
```

---

## Structure frontend recommandée

```text
src/
  app/
    management/
      page.tsx

  components/
    management/
      ManagementHeader.tsx
      ManagementSummaryCards.tsx
      DashboardWidgetGrid.tsx
      DashboardCustomizePanel.tsx

      widgets/
        TrackedSkinChartWidget.tsx
        InventoryValueWidget.tsx
        Cs2UpdateWidget.tsx
        MarketplaceSalesWidget.tsx
        TradeTrackerWidget.tsx
        NotificationsWidget.tsx

      trades/
        TradeCountdown.tsx
        TradeStatusBadge.tsx
        TradePartnerCard.tsx

      sales/
        MarketplaceListingRow.tsx
        SaleStatusBadge.tsx

  lib/
    management/
      computeInventoryValue.ts
      computeTradeCountdown.ts
      computeDashboardStats.ts
      dashboardWidgetConfig.ts
```

---

## Design attendu

La page doit rester cohérente avec le reste du projet :

- thème sombre
- accent principal `#093066`
- surfaces premium
- glassmorphism léger si cohérent
- widgets en cartes
- couleurs vertes pour les gains / succès
- couleurs rouges pour pertes / erreurs
- orange / jaune pour pending / attention
- layout clair et respirant

### Style attendu

La page doit donner une impression :

- premium
- dashboard financier
- personnalisable
- sérieuse
- utile
- orientée marché

---

## Partie 1 — Protection de route

### Objectif

Empêcher l’accès à `/management` si l’utilisateur n’est pas connecté.

### Attendu

Codex doit inspecter le système d’auth existant du projet.

Selon l’implémentation actuelle :

- NextAuth
- session custom
- Steam OpenID
- cookie session maison
- middleware existant

il doit adapter la protection.

### Règle

Ne pas inventer un nouveau système d’auth si le projet en a déjà un.

### Comportement

Si connecté :

- afficher le dashboard

Si non connecté :

- rediriger vers `/auth`
- ou afficher un CTA clair de connexion Steam

---

## Partie 2 — Modèles BDD à ajouter ou enrichir

Le dashboard doit s’appuyer sur des données persistées.

Codex doit inspecter les modèles existants avant d’ajouter de nouveaux modèles.

---

## Modèle recommandé : `UserTrackedSkin`

Permet à un utilisateur de suivre un skin.

### Champs recommandés

```text
id
userId
itemId
label
targetPrice
alertAbovePrice
alertBelowPrice
isActive
createdAt
updatedAt
```

### Rôle

Permet d’afficher des graphiques personnalisés sur la page management.

Un utilisateur peut suivre plusieurs skins.

---

## Modèle recommandé : `UserDashboardWidget`

Permet de personnaliser les widgets affichés.

### Champs recommandés

```text
id
userId
widgetType
enabled
position
size
config
createdAt
updatedAt
```

### Exemples de `widgetType`

```text
tracked_skin_chart
inventory_value
cs2_update
marketplace_sales
trade_tracker
notifications
```

### Rôle

Permet à l’utilisateur d’activer / désactiver certains widgets.

---

## Modèle recommandé : `UserInventorySnapshot`

Permet de stocker une estimation de la valeur d’inventaire.

### Champs recommandés

```text
id
userId
totalValue
currency
itemCount
source
createdAt
```

### Rôle

Permet d’afficher l’évolution de la valeur d’inventaire dans le temps.

---

## Modèle recommandé : `UserMarketplaceListing`

Permet de suivre les skins que l’utilisateur liste sur des marketplaces.

### Champs recommandés

```text
id
userId
itemId
marketSlug
externalListingId
listingUrl
listedPrice
currency
status
listedAt
soldAt
lastCheckedAt
createdAt
updatedAt
```

### Valeurs possibles de `status`

```text
active
sold
cancelled
expired
unknown
```

### Rôle

Permet à l’utilisateur de savoir :

- où il a listé un item
- à quel prix
- si l’item semble vendu
- quand le statut a été vérifié

---

## Modèle recommandé : `UserTrade`

Permet de suivre les échanges avec des particuliers.

### Champs recommandés

```text
id
userId
partnerSteamId
partnerName
partnerAvatarUrl
tradeOfferId
status
itemsGiven
itemsReceived
estimatedValueGiven
estimatedValueReceived
currency
createdAt
acceptedAt
effectiveAt
lastCheckedAt
notes
updatedAt
```

### Valeurs possibles de `status`

```text
pending
accepted
declined
cancelled
expired
effective
unknown
```

### Rôle

Permet à l’utilisateur de suivre :

- avec qui il a échangé
- ce qu’il a donné
- ce qu’il a reçu
- combien vaut l’échange
- combien de temps il reste avant que les items soient réellement tradables / effectifs

---

## Modèle recommandé : `UserNotification`

Permet d’afficher des notifications dans le dashboard.

### Champs recommandés

```text
id
userId
type
title
message
severity
readAt
metadata
createdAt
```

### Valeurs possibles de `severity`

```text
info
success
warning
error
```

### Exemples de notifications

- un skin tracké a dépassé un prix cible
- un listing semble vendu
- un trade devient effectif bientôt
- une sync inventory a échoué
- une nouvelle mise à jour CS2 est disponible

---

## Partie 3 — Widgets du dashboard

La page `/management` doit contenir plusieurs widgets.

---

## Widget 1 — Tracked Skin Chart

### Objectif

Afficher un ou plusieurs graphiques de skins suivis par l’utilisateur.

### Source des données

Utiliser :

- `UserTrackedSkin`
- `Item`
- `LatestPrice`
- `DailySnapshot`

### Fonctionnalités attendues

- afficher au moins un graphique de skin tracké
- permettre de sélectionner un skin tracké
- afficher variation 7j / 30j si les données existent
- afficher marché utilisé si pertinent
- bouton pour aller vers `/analyze`

### Important

Le graphique doit lire les données de la BDD.
Il ne doit pas appeler directement les providers externes.

---

## Widget 2 — Inventory Value

### Objectif

Afficher la valeur estimée de l’inventaire utilisateur.

### Source possible

Utiliser :

- inventaire Steam public déjà synchronisé si le projet le supporte
- `UserInventoryItem` si existant
- `LatestPrice`
- fallback mock / empty state si pas encore de sync inventory

### Fonctionnalités attendues

- afficher valeur totale estimée
- afficher nombre d’items
- afficher variation si historique disponible
- afficher date de dernière sync
- bouton “Sync inventory” si disponible

### Important

Si l’inventaire n’est pas public ou pas synchronisé :

- afficher un empty state clair
- proposer d’aller sur `/profile`
- expliquer que l’inventaire doit être public

---

## Widget 3 — CS2 Update Widget

### Objectif

Afficher la dernière mise à jour CS2 si l’utilisateur veut la voir.

### Source possible

Ce sprint peut utiliser une approche simple :

- flux RSS Steam News si déjà disponible
- endpoint backend qui fetch les news Steam
- mock data si pas encore connecté
- dernière update stockée en BDD si un provider existe

### Fonctionnalités attendues

- widget activable / désactivable
- titre de la dernière update
- date
- résumé court
- lien externe si disponible

### Important

Ne pas bloquer le sprint sur l’intégration parfaite des news.
Le widget peut avoir un état mock propre si la source n’est pas encore prête.

---

## Widget 4 — Marketplace Sales

### Objectif

Afficher les skins que l’utilisateur vend sur différents sites et leur statut.

### Source possible

Pour ce sprint, il faut être réaliste.

Le système ne peut savoir automatiquement si un skin s’est vendu sur une marketplace que si :

- la marketplace fournit une API
- l’utilisateur fournit une donnée exploitable
- le listing est tracké avec un `externalListingId`
- un provider dédié est implémenté

### MVP attendu

Créer la structure de tracking :

- listing manuel
- marketplace
- item
- prix listé
- statut
- dernier check
- URL du listing

### Fonctionnalités attendues

- afficher les listings actifs
- afficher si un listing est `active`, `sold`, `unknown`
- afficher prix listé
- afficher marketplace
- afficher dernière vérification
- permettre au moins une action UI future : “Check status”

### Important

Ne pas faire de scraping agressif de marketplaces.
Ne pas demander de cookies utilisateur marketplace.

---

## Widget 5 — Trade Tracker

### Objectif

Suivre les échanges avec des particuliers.

### Fonctionnalités attendues

- afficher les trades de l’utilisateur
- afficher partenaire Steam
- afficher items donnés / reçus
- afficher valeur estimée
- afficher statut du trade
- afficher temps restant avant que le trade soit effectif / tradable
- afficher un badge de statut

### Délai de trade

L’utilisateur a explicitement demandé de suivre un délai d’environ 7 jours.

### Règle produit

Le système doit stocker une date :

```text
effectiveAt
```

Puis calculer :

```text
timeRemaining = effectiveAt - now()
```

### Important

Ne pas hardcoder partout “7 jours”.

Faire une fonction utilitaire :

```text
computeTradeCountdown(trade)
```

et définir `effectiveAt` au moment où le trade est accepté ou renseigné.

### Exemple

Si `acceptedAt = 2026-05-20 15:00`

alors par défaut :

```text
effectiveAt = acceptedAt + 7 days
```

Mais le modèle doit permettre d’ajuster la date si Steam donne une information plus précise.

---

## Widget 6 — Notifications

### Objectif

Afficher les notifications importantes de l’utilisateur.

### Types de notifications

- price_alert
- listing_sold
- trade_pending
- trade_effective
- inventory_sync_failed
- cs2_update
- system

### Fonctionnalités attendues

- afficher dernières notifications
- badge read / unread
- possibilité de marquer comme lue
- couleurs par sévérité

---

## Partie 4 — Personnalisation dashboard

Le dashboard doit être préparé pour être personnalisable.

### MVP attendu

Dans ce sprint :

- widgets activables / désactivables
- ordre simple par `position`
- config stockée en BDD
- bouton ou panneau “Customize”

### Pas nécessaire dans ce sprint

- drag & drop complet
- resizing avancé
- layouts multiples
- sauvegarde temps réel

### Objectif

Poser une base propre.

---

## Partie 5 — API routes à créer

Créer des routes backend pour le dashboard.

### Routes recommandées

```http
GET /api/management/summary
GET /api/management/widgets
PATCH /api/management/widgets
GET /api/management/tracked-skins
POST /api/management/tracked-skins
DELETE /api/management/tracked-skins/:id
GET /api/management/inventory-value
GET /api/management/listings
POST /api/management/listings
PATCH /api/management/listings/:id
GET /api/management/trades
POST /api/management/trades
PATCH /api/management/trades/:id
GET /api/management/notifications
PATCH /api/management/notifications/:id/read
```

### Important

Toutes ces routes doivent être protégées par session.

Un utilisateur ne doit jamais pouvoir lire ou modifier les données d’un autre utilisateur.

---

## Partie 6 — Sécurité

### Règles obligatoires

- toutes les routes `/api/management/*` doivent vérifier la session
- toujours filtrer par `userId`
- ne jamais accepter un `userId` arbitraire venant du client
- utiliser le `userId` de la session côté serveur
- valider les inputs
- ne pas exposer de secrets
- ne pas exposer trade link complet si inutile
- traiter le téléphone comme une donnée personnelle

### Téléphone

Le numéro de téléphone est une donnée sensible.

### Règles

- ne pas le logger
- ne pas l’exposer dans des réponses inutiles
- valider le format
- permettre de le modifier depuis `/profile`, pas forcément depuis `/management`

---

## Partie 7 — UI détails

### Header Management

Doit afficher :

- avatar Steam
- pseudo Steam
- résumé rapide
- valeur inventaire estimée
- nombre de skins trackés
- nombre de notifications non lues

### Summary cards

Cartes recommandées :

- Inventory Value
- Tracked Skins
- Active Listings
- Pending Trades
- Unread Notifications

### Widget grid

Les widgets doivent être dans une grille responsive.

Desktop :

- 2 ou 3 colonnes

Mobile :

- 1 colonne

---

## Partie 8 — Empty states

La page doit être belle même si l’utilisateur n’a pas encore de données.

### Empty states attendus

- aucun skin tracké
- inventaire non synchronisé
- aucune vente suivie
- aucun trade
- aucune notification

### Chaque empty state doit proposer une action

Exemples :

- “Track your first skin”
- “Sync your inventory”
- “Add a marketplace listing”
- “Add a trade”
- “Go to profile”

---

## Partie 9 — Notifications et alertes prix

### Objectif MVP

Créer la structure pour les alertes, même si l’automatisation complète vient plus tard.

### Exemple

Si un `UserTrackedSkin` a :

```text
alertAbovePrice = 100
```

et que `LatestPrice.price >= 100`, alors une notification peut être créée.

### Dans ce sprint

Implémenter au minimum :

- modèle de notification
- affichage notifications
- mark as read
- logique utilitaire pour créer une notification

L’automatisation complète peut venir dans un sprint suivant.

---

## Partie 10 — Gestion des trades

### MVP attendu

L’utilisateur peut créer manuellement un trade :

- partner Steam ID
- partner name
- items given
- items received
- acceptedAt
- effectiveAt
- notes

### Calcul

Si `effectiveAt` n’est pas fourni :

```text
effectiveAt = acceptedAt + 7 days
```

### UI

Afficher :

- temps restant
- badge pending / effective
- partenaire
- valeur estimée
- items concernés

### Important

Ce sprint ne doit pas essayer d’accepter ou créer des trades Steam automatiquement.

---

## Partie 11 — Gestion ventes marketplaces

### MVP attendu

L’utilisateur peut suivre manuellement un listing :

- market
- item
- listed price
- listing URL
- status
- listedAt

### Plus tard

Un sprint futur pourra ajouter :

- check automatique via marketplace APIs
- notifications sold
- sync des ventes
- exports

### Dans ce sprint

Créer la structure et l’UI.

Si un provider existe déjà pour une marketplace, Codex peut préparer une fonction `checkListingStatus`, mais elle ne doit pas être obligatoire.

---

## Partie 12 — Dernière update CS2

### Widget

Le widget `Cs2UpdateWidget` doit pouvoir afficher :

- titre
- date
- résumé
- lien

### Source

Pour ce sprint :

- utiliser mock data propre si aucune source news n’existe
- ou utiliser une source existante si le projet en a déjà une

### Important

Ne pas faire dépendre tout le sprint de l’intégration news.

---

## Architecture attendue

Structure recommandée :

```text
src/
  app/
    management/
      page.tsx
    api/
      management/
        summary/
          route.ts
        widgets/
          route.ts
        tracked-skins/
          route.ts
        inventory-value/
          route.ts
        listings/
          route.ts
        trades/
          route.ts
        notifications/
          route.ts

  components/
    management/
      ManagementHeader.tsx
      ManagementSummaryCards.tsx
      DashboardWidgetGrid.tsx
      DashboardCustomizePanel.tsx
      widgets/
        TrackedSkinChartWidget.tsx
        InventoryValueWidget.tsx
        Cs2UpdateWidget.tsx
        MarketplaceSalesWidget.tsx
        TradeTrackerWidget.tsx
        NotificationsWidget.tsx

  modules/
    management/
      services/
        managementSummaryService.ts
        dashboardWidgetsService.ts
        trackedSkinsService.ts
        inventoryValueService.ts
        marketplaceListingsService.ts
        tradesService.ts
        notificationsService.ts
      utils/
        computeInventoryValue.ts
        computeTradeCountdown.ts
        computeTrackedSkinStats.ts
        createUserNotification.ts
      types/
        management.types.ts
```

---

## Tests attendus

### Tests backend

- route management protégée
- un utilisateur ne peut pas lire les données d’un autre
- création tracked skin
- suppression tracked skin
- création listing
- création trade
- calcul `effectiveAt`
- notification mark as read
- summary service

### Tests frontend / manuels

- `/management` redirige si non connecté
- `/management` affiche dashboard si connecté
- navbar affiche le lien Management
- widgets s’affichent
- empty states propres
- countdown trade fonctionne
- notifications lisibles
- responsive mobile acceptable

---

## Branching pour ce sprint

Maximum **3 branches**.

### Branche 1

```text
feature/management-data-model-and-api
```

Contient :

- modèles Prisma
- migrations
- services management
- routes API protégées

### Branche 2

```text
feature/management-dashboard-ui
```

Contient :

- page `/management`
- navbar link
- layout dashboard
- widgets
- empty states
- responsive

### Branche 3

```text
feature/management-trades-sales-notifications
```

Contient :

- trade tracker
- marketplace sales widget
- notifications
- countdown
- tests
- documentation

---

## Ordre de travail recommandé

1. inspecter l’auth existante
2. protéger la route `/management`
3. ajouter le lien navbar
4. inspecter les modèles User existants
5. ajouter les modèles nécessaires
6. créer les services management
7. créer les routes API protégées
8. construire le layout dashboard
9. créer les widgets principaux
10. ajouter empty states
11. implémenter trade tracker
12. implémenter marketplace sales tracking MVP
13. implémenter notifications
14. tester sécurité userId
15. polir responsive

---

## Définition of done

Le sprint 11 est terminé si :

- `/management` existe
- `/management` est accessible depuis la navbar
- `/management` est protégé par authentification
- un utilisateur connecté voit un dashboard personnalisé
- un utilisateur non connecté est redirigé
- les widgets principaux existent
- les skins trackés peuvent être affichés
- la valeur d’inventaire est affichée ou a un empty state propre
- la dernière update CS2 peut être affichée ou mockée proprement
- les listings marketplace peuvent être suivis en MVP
- les trades peuvent être suivis
- le délai de 7 jours est géré via `effectiveAt`
- les notifications utilisateur existent
- les routes API sont protégées
- un utilisateur ne peut pas accéder aux données d’un autre
- le design est cohérent avec le reste du projet

---

## Résultat attendu à la fin du sprint

À la fin de ce sprint, le projet doit avoir une vraie page utilisateur :

```text
Management Dashboard
```

Elle doit servir de base pour :

- portfolio utilisateur
- inventaire
- tracking prix
- tracking ventes
- tracking trades
- notifications
- personnalisation

---

## Instruction finale pour Codex

Codex doit travailler par rapport au projet existant.

Il doit :

1. inspecter l’auth existante
2. inspecter le modèle User existant
3. réutiliser les composants UI existants
4. protéger toutes les routes management
5. ne pas créer de nouveau système d’auth
6. ne pas exposer de données d’un autre utilisateur
7. ne pas automatiser Steam trades
8. ne pas utiliser de cookies marketplace
9. garder la page modulaire
10. garder une bonne UX même sans données

La priorité est :

```text
Dashboard utilisateur sécurisé
Widgets personnalisables
Tracking skins / inventaire / trades / ventes
Notifications propres
Base évolutive pour les prochains sprints
```
