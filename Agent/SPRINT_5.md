# SPRINT_5.md

## Contexte

Les sprints précédents ont posé :
- la base data
- le catalogue d’items
- la homepage / landing page
- les premières fondations frontend

Le sprint 5 a pour but de construire la **première vraie expérience produit** côté interface.

Le focus principal de ce sprint est la route :

- `/analyze`

Cette page doit permettre d’analyser un skin comme sur une interface de trading / bourse, avec un vrai graphique interactif, des outils visuels simples d’annotation, et la possibilité d’exporter le graphique en image.

En plus de cette page principale, le sprint doit aussi créer :
- une page d’authentification
- une page pour les prix

---

## Objectif du sprint

Construire trois pages frontend :

1. **`/analyze`**
   - page principale d’analyse graphique d’un skin
   - lecture des données factices depuis `chart-sample-ak47-redline-90d.json`
   - rendu d’un graphique type marché / bourse
   - outils visuels simples pour marquer le graphique
   - export image

2. **page d’authentification**
   - page propre et premium
   - base UI pour login / sign in

3. **page des prix**
   - page orientée marché / listing / overview
   - structure propre pour présenter les prix

---

## Priorité du sprint

La priorité absolue est :

1. la page `/analyze`
2. l’expérience du graphique
3. l’ergonomie des outils d’analyse
4. l’export image
5. ensuite la page auth
6. ensuite la page prices

---

## Hors scope

Ne pas faire dans ce sprint :

- auth backend réelle complète
- annotations avancées type TradingView pro
- synchronisation serveur des annotations
- multi-user réel
- stratégie data complexe
- websockets
- collaboration temps réel
- backtesting ou indicateurs techniques complexes
- moteur d’analyse automatique

Le but est de livrer une **UI crédible, propre, interactive et exploitable**.

---

## Stack à utiliser

Le sprint doit utiliser la stack du projet :

- Next.js 15
- React
- TypeScript
- Tailwind CSS

Bibliothèques autorisées et recommandées :

- `recharts` ou une librairie chart React adaptée
- `framer-motion`
- `lucide-react`
- éventuellement `html-to-image` ou `dom-to-image` pour l’export image
- éventuellement `react-hook-form` pour la page auth si utile
- éventuellement `cmdk` ou composant searchable select équivalent si nécessaire

### Recommandation importante
Pour la page `/analyze`, utiliser une librairie qui permet :
- un rendu propre
- une personnalisation forte
- une overlay UI pour annotations simples
- une exportabilité facile

L’objectif n’est pas de reproduire TradingView à 100 %.
L’objectif est de faire une interface **inspirée du monde trading**, avec un rendu premium et des outils de marquage simples.

---

## Fichiers de données à utiliser

Le sprint doit utiliser comme source de données factices pour l’analyse :

- `chart-sample-ak47-redline-90d.json`

### Règle importante
Gemini Pro doit :
- lire ce fichier dans le repo
- comprendre sa structure
- créer un adaptateur de parsing si nécessaire
- brancher le graphique sur ces données

Si besoin, créer un mapper propre entre le JSON et le format attendu par la librairie de chart.

---

# Partie 1 — Page `/analyze`

## Objectif produit

La route `/analyze` doit permettre à l’utilisateur :
- de visualiser l’évolution d’un skin
- de lire la tendance de manière immédiate
- de faire une mini-analyse visuelle
- d’annoter simplement le graphique
- d’exporter le résultat final en image

Cette page doit évoquer :
- une interface de marché
- une interface d’analyse
- une app premium
- une expérience proche de la bourse / trading

---

## Layout attendu de `/analyze`

La page `/analyze` doit contenir au minimum :

1. un header ou topbar propre
2. une zone principale avec le graphique
3. une zone d’outils / contrôles
4. un sélecteur avec recherche
5. une zone de résumé du skin / performance
6. un bouton d’export image

---

## Structure recommandée

```text
src/
  app/
    analyze/
      page.tsx
    auth/
      page.tsx
    prices/
      page.tsx

  components/
    analyze/
      AnalyzeHeader.tsx
      AnalyzeChartPanel.tsx
      AnalyzeToolbar.tsx
      AnalyzeFilterSelect.tsx
      AnalyzePerformanceBadge.tsx
      ChartAnnotationLayer.tsx
      ExportChartButton.tsx

    auth/
      AuthCard.tsx
      AuthForm.tsx

    prices/
      PricesHeader.tsx
      PricesTable.tsx
      PricesFilters.tsx

  lib/
    charts/
      chartSampleMapper.ts
      computeTrendStats.ts
      exportChartAsImage.ts

  data/
    chart-sample-ak47-redline-90d.json
```

---

## Comportement global de `/analyze`

La page doit :
- charger les données du fichier JSON
- afficher un graphique propre
- calculer automatiquement la tendance
- afficher la variation en pourcentage
- afficher une flèche de hausse ou de baisse
- colorer le rendu principal en vert si positif, en rouge si négatif
- permettre d’ajouter des rectangles rouges ou verts sur le graphique
- permettre d’exporter le graphique annoté en image

---

## Graphique principal

### Objectif
Le graphique doit donner une sensation de lecture “trading / stock market”.

### Attendu
Le graphique doit :
- afficher l’évolution des données sur 90 jours
- être lisible
- avoir une grille discrète
- avoir une tooltip propre
- avoir des axes lisibles
- avoir un rendu premium sur fond sombre
- être responsive

### Type de graphique
Le plus logique pour ce sprint :
- line chart
ou
- area chart premium

Le choix exact peut dépendre de la structure du JSON, mais le rendu doit évoquer :
- évolution de prix
- tendance de marché
- mouvement lisible

### Style du graphique
- fond sombre
- ligne ou zone colorée selon la tendance
- vert si positif
- rouge si négatif
- tooltips premium
- pas de style générique pauvre

---

## Calcul de tendance

Le système doit calculer automatiquement si la période affichée est :

- positive
- négative
- neutre

### Règle attendue
Comparer au minimum :
- première valeur visible
- dernière valeur visible

Puis calculer :

- variation absolue
- variation en pourcentage

### Affichage attendu
Si positif :
- couleur verte
- flèche vers le haut
- pourcentage de hausse

Si négatif :
- couleur rouge
- flèche vers le bas
- pourcentage de baisse

### Exemple
- `+12.4%` avec flèche vers le haut en vert
- `-7.8%` avec flèche vers le bas en rouge

Cette information doit être visible rapidement au-dessus ou à côté du graphique.

---

## Sélecteur / menu déroulant avec recherche

### Objectif
Permettre à l’utilisateur de filtrer ce qu’il veut voir sur le graphe ou de changer de vue.

### Attendu
La page doit inclure un petit bloc UI de type :
- dropdown
- searchable select
- menu déroulant avec champ de recherche

### Utilisations possibles
Même si on n’a qu’un seul dataset réel pour ce sprint, le composant doit être pensé pour évoluer et servir à :
- filtrer une période
- changer de skin
- changer une vue
- activer / désactiver certains overlays
- changer la granularité ou l’affichage

### Important
Le composant doit être :
- propre
- premium
- compact
- avec recherche intégrée
- cohérent avec la direction visuelle du projet

### Recommandation
Créer un composant réutilisable.
Même si au début il n’y a que peu d’options, il faut le structurer comme un vrai composant produit.

---

## Outils d’annotation simples

### Objectif
Permettre une mini-analyse visuelle sur le graphe.

### Attendu
L’utilisateur doit pouvoir placer :
- des rectangles rouges
- des rectangles verts

Le besoin ici n’est pas de faire un système de drawing ultra avancé.
Il faut permettre un marquage visuel simple.

### Cas d’usage
- marquer une zone de chute
- marquer une zone de rebond
- marquer une zone d’intérêt
- visualiser un pattern simple

### Couleurs attendues
- rectangle rouge = zone négative / zone de chute / zone de risque
- rectangle vert = zone positive / zone de reprise / zone intéressante

### Mode d’interaction recommandé
Le plus simple pour ce sprint :
- boutons d’outil : “Ajouter zone verte” / “Ajouter zone rouge”
- puis placement sur le graphique
- ou ajout de zones prédéfinies déplaçables / redimensionnables
- ou clic + drag simple sur overlay

### Important
Le système doit rester :
- simple
- utilisable
- visuellement propre
- pas buggy
- pas sur-complexe

### Ce que Gemini Pro doit viser
Une première implémentation crédible, même si elle est limitée, par exemple :
- overlay absolu sur le conteneur chart
- zones stockées en state local
- possibilité minimale de créer/supprimer une zone

### Ce qu’il ne faut pas faire
- ne pas créer un éditeur graphique ultra complexe
- ne pas sur-ingénier l’annotation
- ne pas bloquer tout le sprint sur une UX de dessin parfaite

---

## Export en image

### Objectif
Permettre à l’utilisateur d’exporter le graphique annoté.

### Attendu
Un bouton d’action doit permettre :
- d’exporter la zone chart en image
- idéalement PNG

### Ce qui doit être exporté
L’export doit inclure :
- le graphique
- la couleur de tendance
- les annotations visibles
- le rendu actuel du panneau d’analyse

### Recommandation technique
Utiliser une librairie comme :
- `html-to-image`
ou
- `dom-to-image`

Le composant exportable doit être clairement isolé dans un conteneur dédié.

### Important
L’export doit être simple :
- clic bouton
- génération image
- téléchargement fichier

---

## Panneau de performance

### Objectif
Afficher rapidement l’état du skin analysé.

### Attendu
Le panneau doit afficher au minimum :
- nom du skin
- période analysée
- variation %
- variation absolue si pertinent
- flèche directionnelle
- couleur de tendance

### Style
- premium
- compact
- lisible
- cohérent avec l’interface de marché

---

## Expérience visuelle de `/analyze`

La page doit évoquer :
- trading
- analyse
- sérieux
- lecture de marché

### Palette recommandée
Continuer dans l’identité du projet avec :
- fond sombre
- accent `#093066`
- vert pour la hausse
- rouge pour la baisse
- surfaces premium / glassmorphism léger

### Important
Le vert et le rouge doivent être réservés surtout à la lecture du marché.
Le bleu `#093066` reste l’accent de marque et de structure UI.

---

# Partie 2 — Page d’authentification

## Objectif

Créer une page d’authentification visuellement propre.

La page ne doit pas forcément être branchée à une vraie auth backend.
Pour ce sprint, l’objectif principal est :
- la structure UI
- l’expérience visuelle
- la cohérence avec le reste du projet

---

## Route attendue

Créer une route :

- `/auth`

---

## Contenu attendu

La page auth doit contenir :
- un fond cohérent avec le projet
- une carte ou panneau centré
- le logo
- un titre
- un formulaire simple
- email
- mot de passe
- bouton principal
- liens secondaires éventuels

### Exemples de variantes acceptables
- login only
ou
- login + sign up toggle

Le plus simple et propre suffit.

---

## Style attendu

- premium
- sombre
- moderne
- cohérent avec la homepage
- accent `#093066`
- carte propre avec légère transparence si pertinent

---

## Comportement attendu

Même sans backend complet, il faut :
- validation de base des champs
- états focus / hover propres
- structure facilement branchable à une vraie auth plus tard

---

# Partie 3 — Page des prix

## Objectif

Créer une page dédiée aux prix.

Cette page n’a pas besoin d’être ultra avancée dans ce sprint.
Elle doit surtout poser une **base UI crédible** pour afficher :
- les prix
- les variations
- les lignes de marché
- les filtres simples

---

## Route attendue

Créer une route :

- `/prices`

---

## Contenu attendu

La page `/prices` doit contenir :
- un header clair
- une zone de filtres
- une table ou liste premium
- des lignes de prix cohérentes
- une structure réutilisable

### Attendu minimum
- nom de l’item
- marché
- prix
- variation
- état visuel positif / négatif

### Source de données
Pour ce sprint, la page peut utiliser :
- données mockées
- structure statique
- ou une petite source locale si déjà présente

Le plus important est :
- la qualité de la structure
- la cohérence visuelle
- la compatibilité avec les futures vraies données

---

## Style attendu de `/prices`

- sombre
- premium
- lisible
- cohérent avec `/analyze` et la homepage
- accent `#093066`
- vert / rouge pour les tendances

---

# Architecture frontend attendue

Le code doit rester modulaire.

## Structure recommandée

```text
src/
  app/
    analyze/
      page.tsx
    auth/
      page.tsx
    prices/
      page.tsx

  components/
    analyze/
      AnalyzeHeader.tsx
      AnalyzeChartPanel.tsx
      AnalyzeToolbar.tsx
      AnalyzeFilterSelect.tsx
      AnalyzePerformanceBadge.tsx
      ChartAnnotationLayer.tsx
      ExportChartButton.tsx

    auth/
      AuthCard.tsx
      AuthForm.tsx

    prices/
      PricesHeader.tsx
      PricesTable.tsx
      PricesFilters.tsx

    ui/
      Button.tsx
      Input.tsx
      Card.tsx
      Badge.tsx

  lib/
    charts/
      chartSampleMapper.ts
      computeTrendStats.ts
      exportChartAsImage.ts
```

---

# Composants à créer

## `/analyze`

### `AnalyzeHeader`
- titre de la page
- rappel du skin
- éventuelles actions secondaires

### `AnalyzeChartPanel`
- conteneur principal du graphique
- panneau exportable

### `AnalyzeToolbar`
- boutons d’annotation
- actions simples
- reset éventuel

### `AnalyzeFilterSelect`
- dropdown searchable
- filtres / affichages

### `AnalyzePerformanceBadge`
- variation %
- flèche haut / bas
- couleur tendance

### `ChartAnnotationLayer`
- overlay d’annotations
- rectangles rouges / verts
- gestion simple des zones

### `ExportChartButton`
- export PNG / image

## `/auth`

### `AuthCard`
- conteneur premium du formulaire

### `AuthForm`
- champs
- validation UI
- CTA principal

## `/prices`

### `PricesHeader`
- titre
- résumé simple

### `PricesFilters`
- filtres UI simples

### `PricesTable`
- tableau ou liste de prix

---

# Données et parsing

## Attendu
Gemini Pro doit :
- inspecter `chart-sample-ak47-redline-90d.json`
- créer un mapper propre
- ne pas faire de parsing bricolé directement dans le composant React principal

## À créer
- `chartSampleMapper.ts`
- `computeTrendStats.ts`

### `chartSampleMapper.ts`
Doit :
- lire la structure brute
- transformer les données dans un format exploitable par le chart

### `computeTrendStats.ts`
Doit :
- calculer variation absolue
- calculer variation %
- déterminer tendance positive / négative / neutre
- préparer les labels d’affichage

---

# Expérience utilisateur attendue

## `/analyze`
L’utilisateur doit ressentir :
- une vraie interface d’analyse
- une lecture immédiate de la tendance
- un outil sérieux
- une capacité simple à annoter le graphe
- une capacité à exporter son analyse

## `/auth`
L’utilisateur doit ressentir :
- une page propre
- une identité cohérente
- un sentiment premium

## `/prices`
L’utilisateur doit ressentir :
- une base de dashboard marché
- une lecture claire des prix
- une cohérence produit

---

# Responsive design

Les trois pages doivent être responsive.

## `/analyze`
- desktop prioritaire
- tablette propre
- mobile lisible même si l’expérience d’annotation peut être simplifiée

## `/auth`
- parfaitement lisible mobile

## `/prices`
- table adaptable
- mobile au moins acceptable

---

# Performance

Le sprint doit rester raisonnable côté performance.

## À faire
- éviter les re-renders inutiles sur le graphe
- isoler les overlays
- limiter les effets trop lourds
- garder les composants propres

## À éviter
- énorme lib inutile
- dessin complexe non optimisé
- export mal encapsulé

---

# Tests attendus

À la fin du sprint, il faut pouvoir vérifier :

## `/analyze`
- la page charge
- le JSON est bien lu
- le graphique s’affiche
- la tendance est calculée
- le pourcentage s’affiche
- le vert/rouge s’affiche correctement
- les flèches haut/bas fonctionnent
- le dropdown avec recherche fonctionne
- on peut ajouter au moins une zone rouge
- on peut ajouter au moins une zone verte
- l’export image fonctionne

## `/auth`
- la page charge
- le formulaire s’affiche
- les champs sont utilisables
- le rendu est propre

## `/prices`
- la page charge
- les lignes de prix s’affichent
- les variations sont lisibles
- le style est cohérent

---

# Branching pour ce sprint

Maximum **3 branches**.

## Branche 1
`feature/analyze-page-and-chart`

Contient :
- route `/analyze`
- lecture du JSON
- rendering du graphique
- calcul de tendance
- badge performance
- dropdown searchable

## Branche 2
`feature/analyze-annotations-and-export`

Contient :
- rectangles rouges / verts
- overlay d’annotation
- export image
- polish UX du panneau analyse

## Branche 3
`feature/auth-and-prices-pages`

Contient :
- route `/auth`
- route `/prices`
- composants associés
- cohérence visuelle avec le reste du projet

---

# Ordre de travail recommandé

1. lire et mapper `chart-sample-ak47-redline-90d.json`
2. construire `/analyze`
3. afficher le graphique
4. calculer la tendance
5. afficher la variation %
6. intégrer le dropdown searchable
7. ajouter annotations simples
8. ajouter export image
9. construire `/auth`
10. construire `/prices`
11. polir responsive et cohérence visuelle

---

# Définition of done

Le sprint 5 est terminé si :

- la route `/analyze` existe
- le graphique lit correctement `chart-sample-ak47-redline-90d.json`
- la tendance est calculée correctement
- la variation % s’affiche correctement
- la couleur du graphe suit la tendance
- une flèche haut ou bas s’affiche correctement
- un dropdown searchable existe
- l’utilisateur peut ajouter des rectangles rouges et verts
- l’utilisateur peut exporter le graphique annoté en image
- la route `/auth` existe
- la route `/prices` existe
- le design est cohérent avec le produit
- le code est modulaire et maintenable

---

# Résultat attendu à la fin du sprint

À la fin de ce sprint, le projet doit disposer de :

- une première vraie page produit d’analyse
- une base d’outil graphique premium
- une page auth propre
- une page prices cohérente
- une expérience UI beaucoup plus proche du produit final

---

# Instruction finale

Ce sprint doit privilégier :

1. la qualité de la page `/analyze`
2. la lisibilité du graphique
3. la clarté de la tendance
4. la simplicité utile des annotations
5. l’export image
6. la cohérence visuelle globale

L’objectif n’est pas de faire un TradingView complet.
L’objectif est de construire une **première vraie interface d’analyse premium et crédible**.
