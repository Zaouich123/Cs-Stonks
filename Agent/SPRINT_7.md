# SPRINT_7.md

## Contexte

Les sprints précédents ont construit :
- la base data
- les providers
- les pages principales produit
- la homepage
- les vues d’analyse
- l’ingestion marché

Le sprint 7 doit maintenant ajouter une **vraie page de documentation API** dans l’application.

Cette page doit permettre à une personne externe ou à un développeur de comprendre rapidement :
- comment fonctionne l’API
- quelles routes existent
- quels paramètres envoyer
- quelles réponses attendre
- quels codes HTTP peuvent être renvoyés

Le but n’est pas de faire une page texte simple.
Le but est de créer une **page de documentation API moderne, colorée, lisible, agréable à parcourir**, inspirée des docs API premium.

---

## Objectif du sprint

Créer une page de documentation API complète, claire et visuellement riche, avec :

1. une **sidebar à gauche** pour naviguer dans les différentes sections
2. une **zone principale de documentation**
3. des **sections par endpoint / requête**
4. des **codes HTTP colorés**
5. des **blocs de code colorés**
6. des **réponses JSON joliment présentées**
7. une hiérarchie visuelle forte
8. une expérience proche d’une vraie doc d’API moderne

---

## Route attendue

Créer une route dédiée, par exemple :

- `/api-docs`

Si le projet préfère une autre convention du type :
- `/docs/api`

cela est acceptable, mais la route doit être clairement dédiée à la documentation API.

### Recommandation
Par défaut, utiliser :

- `/api-docs`

---

## Résultat attendu à la fin du sprint

À la fin du sprint 7, le projet doit avoir :

- une page de documentation API complète
- une navigation latérale fonctionnelle
- des sections organisées par endpoint
- des requêtes et réponses mises en avant
- des blocs code stylés
- une colorisation des statuts HTTP
- une page responsive
- une base réutilisable pour documenter de nouvelles routes plus tard

---

## Hors scope

Ne pas faire dans ce sprint :

- génération automatique Swagger/OpenAPI complète
- playground interactif complexe
- auth backend avancée pour la doc
- génération server-side compliquée depuis annotations code
- docs multi-langues
- système de recherche plein texte complexe

Le focus est :
- **la qualité visuelle**
- **la lisibilité**
- **la navigation**
- **la structure de documentation**
- **l’expérience développeur**

---

## Objectif UX / produit

La page de documentation API doit donner l’impression :

- d’une doc pro
- d’une doc agréable à lire
- d’une doc moderne
- d’une doc technique mais pas austère
- d’un produit sérieux

L’utilisateur doit pouvoir :
- naviguer rapidement à gauche
- lire une requête
- voir ses paramètres
- voir un exemple de réponse
- comprendre visuellement les succès et les erreurs

---

## Direction visuelle

La page doit garder la cohérence avec le reste du projet.

### Palette
Continuer avec l’identité déjà utilisée :
- fond sombre
- accent principal `#093066`
- éléments lumineux contrôlés
- verts pour les succès
- rouges pour les erreurs
- gris clairs / blancs cassés pour le texte

### Couleurs HTTP attendues
Les statuts doivent être colorés visuellement de manière claire.

Exemples :
- `200` / succès → vert
- `201` → vert
- `400` / `401` / `403` / `404` → rouge ou rouge/orange selon le style retenu
- `500` → rouge fort

### Important
Le visuel doit être riche, coloré et agréable, sans devenir criard.

---

## Structure globale de la page

La page doit être divisée en deux zones principales :

### 1. Sidebar de navigation à gauche
Elle sert à naviguer entre :
- introduction
- authentification
- endpoints par catégorie
- exemples de réponses
- erreurs fréquentes
- sections complémentaires si besoin

### 2. Zone principale à droite
Elle affiche :
- le détail des routes
- les explications
- les exemples de requêtes
- les réponses JSON
- les codes de statut

---

## Layout recommandé

Le layout recommandé est :

- sidebar fixe ou sticky à gauche
- contenu scrollable à droite
- sections clairement séparées
- ancrages vers les différentes parties

### Responsive
En mobile :
- la sidebar peut devenir un drawer, un menu collapsible, ou un panneau repliable
- le contenu principal doit rester lisible

---

## Sidebar gauche

### Objectif
Permettre une navigation rapide entre les sections.

### Contenu attendu
La sidebar doit contenir au minimum :
- un titre ou logo docs
- une liste de sections
- des sous-sections si nécessaire
- un état actif visuel sur la section en cours

### Comportement attendu
- clic sur un onglet → scroll ou navigation vers la section
- highlight de l’onglet actif
- hover propre
- cohérence visuelle forte

### Style attendu
- fond légèrement distinct du contenu principal
- contraste suffisant
- lisibilité forte
- accents `#093066`
- animation légère si pertinent

---

## Sections de documentation attendues

La page doit être structurée par blocs.

### Bloc 1 — Introduction
Contient :
- présentation rapide de l’API
- but de l’API
- format général des réponses
- conventions générales

### Bloc 2 — Base URL / conventions
Contient :
- URL de base
- format JSON
- headers
- auth si applicable
- conventions d’erreurs

### Bloc 3 — Endpoints
Chaque endpoint doit avoir sa propre section claire.

### Bloc 4 — Codes de réponse
Expliquer :
- codes succès
- codes d’erreur
- cas fréquents

### Bloc 5 — Exemples
Exemples concrets de requêtes et réponses.

---

## Endpoints à documenter

Même si la page peut évoluer, le sprint doit documenter au minimum les routes importantes déjà présentes dans le projet.

Exemples probables à documenter :
- `GET /api/items`
- `GET /api/items/:itemId`
- `GET /api/items/:itemId/latest-prices`
- `GET /api/items/:itemId/history`
- `POST /api/internal/sync/catalog`
- `POST /api/internal/sync/prices`
- `POST /api/internal/sync/skinport`
- `POST /api/internal/snapshots/daily`
- `GET /api/internal/health`

### Important
Gemini Pro doit inspecter le projet et documenter les routes réellement présentes.
Ne pas inventer des routes si elles n’existent pas.
Si certaines routes ne sont pas encore là, la doc peut être structurée pour les accueillir plus tard.

---

## Structure d’une section endpoint

Chaque endpoint documenté doit contenir au minimum :

1. méthode HTTP
2. route
3. description
4. paramètres
5. query params si applicable
6. body si applicable
7. exemple de requête
8. exemple de réponse succès
9. exemples d’erreurs possibles
10. codes HTTP associés

### Exemple de structure visuelle
- badge méthode (`GET`, `POST`, etc.)
- chemin de route
- petit paragraphe descriptif
- tableau ou liste de paramètres
- bloc code pour requête
- bloc code pour réponse
- badges de statuts

---

## Méthodes HTTP : style visuel

Les méthodes HTTP doivent être visuellement différenciées.

Exemples :
- `GET` → bleu ou cyan
- `POST` → vert
- `PUT` / `PATCH` → orange ou jaune
- `DELETE` → rouge

### Important
Chaque méthode doit être identifiable d’un coup d’œil.

---

## Requêtes et réponses en code coloré

C’est un point essentiel du sprint.

### Attendu
Les blocs de requête et de réponse doivent :
- être affichés en style code block
- être colorés
- être lisibles
- avoir une bonne hiérarchie visuelle
- être cohérents avec le thème sombre

### Types de blocs à afficher
- exemples `curl`
- exemples JSON
- éventuellement exemples fetch / axios si tu veux enrichir

### Minimum attendu
- un bloc exemple requête
- un bloc exemple réponse JSON

### Important
La coloration syntaxique doit être propre.
Éviter des `<pre>` bruts sans style.

---

## Réponses JSON

Les réponses JSON doivent être montrées comme de vrais extraits de documentation.

### Attendu
- indentation propre
- coloration syntaxique
- bloc sombre premium
- éventuellement bouton copy
- bonne lisibilité

### Exemples de blocs
- réponse `200`
- réponse `400`
- réponse `404`
- réponse `500` si pertinent

---

## Codes de statut HTTP

La page doit mettre les codes de réponse en avant.

### Attendu
- badge ou pill coloré
- code + signification
- visuellement très clair

### Exemples
- `200 OK` → vert
- `201 Created` → vert
- `400 Bad Request` → rouge / orange
- `401 Unauthorized` → rouge
- `404 Not Found` → rouge
- `500 Internal Server Error` → rouge fort

### Important
Tu as explicitement demandé :
- du rouge pour les erreurs
- du vert pour les 200

Cela doit être bien visible dans l’UI.

---

## Contenu détaillé d’une doc endpoint

Pour chaque endpoint, la doc doit afficher :

### 1. Nom lisible
Exemple :
- `Get item history`

### 2. Route technique
Exemple :
- `GET /api/items/:itemId/history`

### 3. Description
Expliquer ce que retourne la route.

### 4. Paramètres
Lister :
- path params
- query params
- body params si nécessaire

### 5. Exemple de requête
Exemple `curl` ou équivalent.

### 6. Réponse succès
Exemple JSON complet.

### 7. Réponses erreur
Exemples JSON d’erreur.

### 8. Codes possibles
Badges ou liste stylée.

---

## Composants recommandés

Structure recommandée :

```text
src/
  app/
    api-docs/
      page.tsx

  components/
    api-docs/
      ApiDocsSidebar.tsx
      ApiDocsHeader.tsx
      ApiEndpointSection.tsx
      ApiMethodBadge.tsx
      ApiStatusBadge.tsx
      ApiCodeBlock.tsx
      ApiParamsTable.tsx
      ApiSectionNavItem.tsx
      ApiResponseExample.tsx
      ApiRequestExample.tsx
```

---

## Composants à créer

### `ApiDocsSidebar`
Responsabilités :
- afficher la navigation latérale
- gérer l’état actif
- permettre de cliquer sur les sections

### `ApiEndpointSection`
Responsabilités :
- afficher une section complète d’endpoint
- composer méthode, route, description, params, examples

### `ApiMethodBadge`
Responsabilités :
- afficher la méthode HTTP avec style dédié

### `ApiStatusBadge`
Responsabilités :
- afficher le code HTTP avec couleur adaptée

### `ApiCodeBlock`
Responsabilités :
- afficher les blocs de code colorés
- supporter JSON / curl / autres

### `ApiParamsTable`
Responsabilités :
- afficher les paramètres de manière propre
- colonnes type / nom / requis / description

### `ApiResponseExample`
Responsabilités :
- afficher les réponses JSON
- associer un code de statut

### `ApiRequestExample`
Responsabilités :
- afficher un exemple de requête

---

## Source de vérité pour la doc

Gemini Pro doit s’appuyer sur :
- les routes réellement présentes dans le projet
- les structures de payload connues
- les conventions API existantes

### Important
La page ne doit pas être une doc purement fictive.
Elle doit être alignée autant que possible avec le code existant.

Si nécessaire :
- compléter avec quelques exemples représentatifs
- structurer les réponses de manière réaliste
- rester cohérent avec le projet

---

## Design system attendu

La doc doit rester cohérente avec le projet, mais peut avoir son propre ton.

### Attendu
- fond sombre
- surfaces légèrement différenciées
- sidebar bien marquée
- code blocks premium
- tags colorés
- titres lisibles
- spacing généreux

### Accent principal
Utiliser `#093066` pour :
- liens actifs
- accents structurels
- highlights doux
- éléments de navigation

### Accents secondaires
- vert pour succès
- rouge pour erreurs
- bleu / cyan pour GET si souhaité
- orange / jaune pour autres méthodes si pertinent

---

## Animation et interactions

La page peut contenir de petites interactions, mais sans excès.

### Recommandé
- hover doux sur la sidebar
- transitions fluides sur les badges
- animation légère sur l’apparition des sections
- bouton copy si présent

### À éviter
- animations trop fortes
- surcharges visuelles
- effets qui nuisent à la lisibilité

---

## Accessibilité

Même si la page est visuelle, elle doit rester utilisable.

### À respecter
- bon contraste
- navigation clavier correcte
- textes lisibles
- code blocks lisibles
- liens/ancres accessibles

---

## Responsive design

La page doit être responsive.

### Desktop
- sidebar visible en permanence
- contenu principal large
- code blocks confortables

### Tablet
- sidebar compacte ou sticky

### Mobile
- sidebar transformée en drawer ou menu repliable
- contenu lisible
- blocs de code scrollables horizontalement si nécessaire

---

## Données de doc

Gemini Pro peut utiliser une structure de données locale pour générer les sections, par exemple :

- une liste d’endpoints
- chaque endpoint avec méthode, path, description, paramètres, exemples, réponses

### Recommandation
Créer une structure de données dédiée pour éviter d’écrire toute la page “à la main” dans le JSX.

Exemple logique :
- `apiDocsData.ts`

Cela permettra :
- d’ajouter des routes facilement
- de garder la page maintenable
- de séparer contenu et présentation

---

## Option recommandée : génération par data structure

Créer une data structure du type :

- catégorie
- endpoints
- méthode
- route
- description
- params
- requestExample
- responseExamples
- statusCodes

Puis faire rendre la page à partir de cette structure.

### Avantages
- code plus propre
- maintenance plus simple
- doc plus scalable

---

## Tests attendus

À la fin du sprint, il faut pouvoir vérifier :

- la page `/api-docs` existe
- la sidebar à gauche est présente
- la navigation fonctionne
- les endpoints sont bien affichés
- les badges méthode sont visibles
- les codes HTTP sont colorés correctement
- les blocs de code sont lisibles et colorés
- les réponses JSON sont bien mises en forme
- le rendu mobile reste acceptable
- il n’y a pas d’erreur TypeScript

---

## Branching pour ce sprint

Maximum **3 branches**.

### Branche 1
`feature/api-docs-layout-and-sidebar`

Contient :
- route `/api-docs`
- layout global
- sidebar
- structure responsive
- header docs

### Branche 2
`feature/api-docs-endpoints-and-code-blocks`

Contient :
- structure de données des endpoints
- sections endpoint
- code blocks
- réponses JSON
- badges méthode / statuts

### Branche 3
`feature/api-docs-polish-and-responsive`

Contient :
- finitions visuelles
- responsive mobile
- interactions
- accessibilité
- nettoyage code

---

## Ordre de travail recommandé

1. analyser les routes existantes du projet
2. définir la structure de données de doc
3. créer la route `/api-docs`
4. créer la sidebar gauche
5. créer la structure de section endpoint
6. ajouter les badges méthode
7. ajouter les badges statuts HTTP
8. ajouter les blocs code colorés
9. ajouter les exemples JSON
10. polir le responsive
11. finaliser les finitions visuelles

---

## Définition of done

Le sprint 7 est terminé si :

- la route de doc API existe
- la sidebar gauche fonctionne
- la navigation entre sections fonctionne
- plusieurs endpoints réels du projet sont documentés
- les requêtes sont affichées en blocs code colorés
- les réponses sont affichées en JSON coloré
- les statuts `200` sont en vert
- les erreurs sont en rouge
- la page est cohérente visuellement avec le produit
- le code est modulaire, propre et maintenable

---

## Résultat attendu à la fin du sprint

À la fin de ce sprint, le projet doit disposer d’une **page de documentation API moderne et colorée**, qui :

- aide les personnes à comprendre l’API
- valorise techniquement le produit
- facilite la navigation entre les endpoints
- montre les requêtes et réponses de manière claire
- donne une vraie impression de doc professionnelle

---

## Instruction finale

Ce sprint doit privilégier :

1. la lisibilité
2. la hiérarchie visuelle
3. les couleurs utiles
4. la qualité des blocs de code
5. la clarté des statuts HTTP
6. la qualité de la sidebar

L’objectif n’est pas juste de lister des routes.
L’objectif est de créer une **vraie page de doc API premium, colorée et agréable à utiliser**.
