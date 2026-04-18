# SPRINT_4.md

## Contexte

Les sprints précédents ont posé la base data de l’application `Cs-Stonks`.

Le sprint 4 marque le début du **frontend visuel**.
L’objectif n’est pas encore de construire toute l’application produit.
L’objectif est de créer une **homepage premium**, propre, moderne, immersive, cohérente avec une application de suivi de marché pour skins CS2.

Cette homepage doit :
- donner une forte identité visuelle au projet
- intégrer le logo du projet
- reprendre l’esprit visuel de `exemple_style.png`
- poser les bases UI pour le reste de l’application

---

## Objectif du sprint

Construire une **page d’accueil / landing page** moderne avec :

1. une **navbar** inspirée de `exemple_style.png`
2. une **hero section** forte visuellement
3. un **background semi-transparent / glassmorphism**
4. un **arrière-plan animé** avec des flèches qui montent
5. une **interaction visuelle au scroll et/ou à la souris**
6. l’intégration du **logo**
7. une structure propre et réutilisable pour les futures pages

---

## Résultat attendu à la fin du sprint

À la fin du sprint 4, le projet doit avoir :

- une homepage visuellement soignée
- un style cohérent avec l’exemple fourni
- une navbar propre
- le logo bien intégré
- un fond animé évoquant la hausse / la bourse / les marchés
- des animations fluides mais pas agressives
- une page responsive
- une base UI réutilisable pour la suite

---

## Hors scope

Ne pas faire dans ce sprint :

- dashboard complet
- page item
- graphiques métiers de prix
- auth
- paiement
- recherche réelle connectée à la base
- logique produit avancée
- pages secondaires complexes

Ce sprint est centré sur :
- **la direction artistique**
- **la homepage**
- **l’expérience visuelle**
- **les animations d’ambiance**

---

## Stack frontend à utiliser

Le sprint doit utiliser uniquement la stack du projet :

- Next.js 15
- React
- TypeScript
- Tailwind CSS

Bibliothèques autorisées et recommandées :

- `framer-motion` pour les animations
- `lucide-react` pour les icônes si nécessaire
- éventuellement `clsx` ou équivalent si déjà présent
- pas de dépendance lourde inutile

---

## Source visuelle obligatoire

Le design doit être inspiré de :

- `exemple_style.png`

Le logo à intégrer est celui fourni dans le repository.

### Règles importantes

- utiliser **`exemple_style.png` comme direction visuelle**
- ne pas copier pixel par pixel
- s’inspirer :
  - de la navbar
  - de la hiérarchie visuelle
  - des espacements
  - du rendu premium
  - des contrastes
  - du niveau de finition

### Important

Si `exemple_style.png` et le logo existent dans le repo :
- Gemini Pro doit les lire
- s’en inspirer directement
- intégrer le logo réel

Si les chemins exacts ne sont pas encore branchés, le code doit être structuré pour permettre de brancher facilement :
- `/public/exemple_style.png`
- `/public/logo.png` ou autre nom réel

---

## Objectif artistique

La homepage doit évoquer :

- une plateforme premium
- un outil de marché / bourse
- un univers CS2
- une sensation de mouvement, de montée, d’opportunité
- un rendu moderne, élégant, légèrement futuriste

Le ton visuel attendu :

- sombre
- premium
- propre
- contrasté
- légèrement translucide
- avec des effets subtils de profondeur
- avec des animations fluides

---

## Direction visuelle détaillée

### Ambiance générale

La page doit utiliser un fond sombre avec des couches visuelles :

1. fond principal sombre
2. voile translucide / brume légère
3. éléments graphiques en arrière-plan
4. contenu foreground clair et lisible

### Palette recommandée

La couleur centrale recommandée pour ce sprint est :

- `#093066`

Cette couleur doit être utilisée comme **accent principal** car elle correspond bien à l’identité du logo et donne un rendu premium, profond et financier.

Palette recommandée :
- `#093066` comme accent principal
- variations plus sombres de bleu nuit / bleu encre
- noir doux / anthracite pour le fond
- blanc cassé / gris clair pour le texte
- touches légères de bleu lumineux pour certains highlights

### Effets visuels souhaités

- glassmorphism léger
- blur subtil
- contours fins lumineux si pertinent
- gradient sombre maîtrisé
- profondeur par couches
- glow discret autour de certaines zones accentuées avec le bleu `#093066`

### Interdits

- pas d’effet “crypto scam”
- pas de saturation excessive
- pas d’animations trop rapides
- pas de surcharge visuelle
- pas d’effet kitsch ou gamer criard

---

## Navbar

La navbar doit être inspirée de celle de `exemple_style.png`.

### Objectifs de la navbar

- être premium
- être claire
- être légère visuellement
- rester lisible au-dessus d’un fond animé
- intégrer le logo

### Contenu attendu

La navbar doit contenir au minimum :
- le logo
- le nom du produit `Cs-Stonks`
- quelques liens de navigation placeholders
- un bouton principal de call-to-action

### Exemple de structure

- Logo + nom à gauche
- Navigation au centre ou à droite
- Bouton principal à droite

### Style attendu

- fond semi-transparent ou translucide
- blur léger
- bord fin ou ombre subtile
- coins arrondis si cohérent avec l’exemple
- sticky ou fixed selon le rendu le plus élégant
- accents et hover pouvant utiliser `#093066`

### Comportement attendu

- la navbar doit rester propre au scroll
- possibilité d’ajouter une légère variation de style au scroll :
  - plus opaque
  - plus floue
  - plus compacte
- transitions fluides

---

## Hero section

La homepage doit avoir une hero section forte.

### Objectif

Faire comprendre immédiatement que l’application sert à suivre un marché de skins CS2.

### Contenu attendu

La hero doit contenir :
- un titre principal fort
- un sous-titre clair
- un ou deux boutons d’action
- éventuellement un bloc visuel ou un mockup stylisé

### Exemples de messages

Le contenu exact peut être rédigé en anglais ou en français selon la cohérence du projet, mais le ton doit être premium et concis.

Le message doit évoquer :
- le suivi de marché
- les prix
- les opportunités
- les tendances
- l’univers CS2 skins

### Rendu visuel

- gros titre
- texte lisible
- spacing généreux
- composition aérée
- focus immédiat
- certains accents visuels ou boutons peuvent utiliser `#093066`

---

## Background principal

Le background doit être un élément fort du sprint.

### Ce qui est demandé

Le fond doit être :
- légèrement transparent / diffus
- profond
- vivant
- cohérent avec une app de marché

### Éléments à intégrer

- flèches orientées vers le haut
- lignes ou formes suggérant la croissance
- mouvement subtil
- animation de parallaxe ou de translation légère

### Important

Les flèches doivent rester :
- abstraites
- élégantes
- discrètes
- non envahissantes

On ne veut pas une pluie d’icônes grossières.
On veut un langage visuel premium inspiré de :
- hausse de marché
- momentum
- courbes haussières
- finance / chart / trading

### Couleur du background animé

Le fond ne doit pas être uniformément bleu.
Le bleu `#093066` doit être utilisé comme :
- accent de profondeur
- glow discret
- couleur d’interaction
- teinte de certaines flèches ou lignes

Le fond principal doit rester majoritairement sombre.

---

## Animation au scroll et à la souris

C’est un point important du sprint.

### Au scroll

Quand l’utilisateur scroll :
- le background doit bouger légèrement
- certaines couches doivent avoir un effet de parallaxe
- la sensation générale doit être vivante

### À la souris

Quand l’utilisateur bouge la souris :
- léger déplacement des couches de fond
- éventuellement réaction des flèches / lignes / glow
- interaction subtile uniquement

### Contraintes

- animation fluide
- pas de saccade
- pas d’effet trop fort
- pas de motion sickness
- pas d’interaction qui gêne la lecture

### Implémentation recommandée

Utiliser :
- `framer-motion`
- listeners légers sur scroll / mouse position
- transforms CSS GPU-friendly
- opacity / translate / scale subtils

Éviter :
- re-render massif
- logique complexe inutile
- canvas si ce n’est pas nécessaire

---

## Intégration du logo

Le logo du projet doit être intégré à la homepage.

### Où l’utiliser

- navbar
- éventuellement hero
- favicon ou usage décoratif si pertinent

### Règles

- respecter les proportions du logo
- ne pas le déformer
- le rendre lisible sur fond sombre
- prévoir version claire/sombre si nécessaire

### Important

Gemini Pro doit utiliser **le vrai logo du repo**.
S’il manque le chemin exact, créer un composant de logo facilement branchable.

---

## Responsive design

La homepage doit être responsive.

### Desktop

- expérience premium complète
- background animé visible
- navbar confortable
- hero large et aérée

### Tablet

- layout simplifié
- animations conservées mais légèrement allégées si besoin

### Mobile

- navbar adaptée
- hero lisible
- background toujours beau mais plus léger
- animations non bloquantes
- performance correcte

### Important

Le rendu mobile ne doit pas être négligé.

---

## Performance

Le sprint doit garder un bon niveau de performance.

### À faire

- limiter les effets trop coûteux
- éviter de lourdes dépendances
- optimiser les animations
- utiliser transforms plutôt que layout shifts
- compresser et optimiser les assets si nécessaire

### À éviter

- fond vidéo lourd
- rendu canvas complexe non nécessaire
- animations simultanées trop nombreuses
- blur extrême partout

---

## Structure frontend recommandée

Créer une structure propre et réutilisable.

```text
src/
  app/
    page.tsx

  components/
    layout/
      Navbar.tsx
    home/
      HeroSection.tsx
      BackgroundFX.tsx
      ArrowTrendBackground.tsx
      CTASection.tsx
    ui/
      Logo.tsx
      GlassCard.tsx
      Button.tsx

  lib/
    motion/
      useMouseParallax.ts
      useScrollProgress.ts
```

L’objectif est d’éviter une homepage monolithique dans un seul fichier.

---

## Composants à créer

### `Navbar`
Responsabilités :
- afficher le logo
- afficher les liens
- afficher le CTA principal
- gérer le style au scroll

### `Logo`
Responsabilités :
- encapsuler l’image/logo
- permettre une réutilisation simple
- gérer taille et variante

### `HeroSection`
Responsabilités :
- afficher le message principal
- afficher CTA
- structurer la section principale

### `BackgroundFX`
Responsabilités :
- gérer le fond global
- les gradients
- la profondeur
- les effets de blur

### `ArrowTrendBackground`
Responsabilités :
- afficher les flèches montantes
- gérer leur animation
- gérer leur réaction légère au scroll / à la souris

### `GlassCard` ou équivalent
Responsabilités :
- fournir un style de surface premium réutilisable

---

## Détails UI attendus

### Typographie
- moderne
- lisible
- hiérarchie forte
- gros titre impactant
- texte secondaire plus doux

### Spacing
- généreux
- premium
- respirant

### Boutons
- modernes
- hover subtil
- transitions fluides
- style cohérent avec le fond
- utiliser `#093066` comme accent principal ou couleur d’action, avec variantes plus claires/sombres au hover

### Couleurs
Palette recommandée :
- fond sombre / anthracite / noir bleuté
- `#093066` comme accent principal
- touches lumineuses contrôlées
- accents évoquant la hausse et la finance

Ne pas surcharger.
Les accents doivent être subtils.

---

## Animation détaillée attendue

### Animations minimales à avoir
- apparition douce de la hero
- apparition douce de la navbar
- mouvement lent du background
- animation légère des flèches
- variation du fond au scroll
- micro-interaction sur boutons

### Effet souhaité
On doit sentir :
- de la profondeur
- du mouvement
- une application vivante
- une direction artistique premium

---

## Accessibilité

Même si c’est une landing page visuelle, il faut garder un minimum d’accessibilité.

### À respecter
- contraste suffisant
- texte lisible
- boutons cliquables
- navigation clavier minimale propre
- pas d’animation trop agressive

### Bonus recommandé
Prévoir un fallback ou une réduction des animations si l’utilisateur préfère moins de mouvement.

---

## Ce que Gemini Pro doit faire précisément

Gemini Pro doit :

1. lire la structure actuelle du projet
2. identifier où se trouvent :
   - le logo
   - `exemple_style.png`
3. créer la homepage dans l’esprit visuel de l’exemple
4. intégrer le logo réel
5. créer une navbar cohérente avec l’exemple
6. créer un arrière-plan premium avec des flèches montantes
7. ajouter des animations au scroll et/ou à la souris
8. garder le code propre et modulaire
9. respecter Tailwind et TypeScript
10. utiliser `#093066` comme accent central de la direction artistique
11. livrer une page responsive, soignée et crédible

---

## Règles importantes pour Gemini Pro

### À faire
- utiliser `framer-motion`
- utiliser des composants réutilisables
- s’inspirer fortement de `exemple_style.png`
- intégrer le vrai logo
- produire un rendu premium
- utiliser `#093066` comme couleur d’accent cohérente avec le logo

### À ne pas faire
- ne pas faire un design générique banal
- ne pas ignorer l’exemple de style
- ne pas faire une page trop vide
- ne pas faire une page kitsch
- ne pas faire une animation cheap ou trop forte
- ne pas coder toute la page dans un seul composant énorme

---

## Contenu minimum de la homepage

La homepage doit contenir au minimum :

### Section 1
- navbar
- hero principal
- CTA principal

### Section 2
- une zone visuelle ou informative courte sous la hero
- juste assez pour donner de la profondeur à la page

Pas besoin encore de faire 10 sections marketing.
Le focus est sur :
- la qualité du hero
- la qualité du fond
- la qualité de la navbar

---

## Tests attendus

À la fin du sprint, il faut pouvoir vérifier :

- la homepage charge correctement
- le logo s’affiche
- la navbar est présente
- le background animé fonctionne
- le scroll produit un effet visuel
- la souris produit un léger effet visuel
- le rendu desktop est propre
- le rendu mobile est correct
- il n’y a pas de gros problème de performance
- il n’y a pas d’erreur TypeScript

---

## Branching pour ce sprint

Maximum **3 branches**.

### Branche 1
`feature/homepage-layout-and-navbar`

Contient :
- structure homepage
- navbar
- logo
- hero section
- base responsive

### Branche 2
`feature/homepage-background-and-motion`

Contient :
- background premium
- flèches montantes
- animation scroll
- animation souris
- effets de profondeur

### Branche 3
`feature/homepage-polish-and-responsive`

Contient :
- finitions visuelles
- responsive
- accessibilité
- micro-interactions
- nettoyage du code

---

## Ordre de travail recommandé

1. analyser `exemple_style.png`
2. intégrer le logo
3. construire navbar
4. construire hero
5. créer fond principal
6. ajouter flèches montantes
7. brancher animation scroll
8. brancher animation souris
9. polir responsive
10. finaliser les micro-interactions

---

## Définition of done

Le sprint 4 est terminé si :

- la homepage existe
- elle reprend l’esprit de `exemple_style.png`
- le logo est intégré
- la navbar est cohérente avec l’exemple
- le fond est premium, légèrement transparent et animé
- des flèches montantes sont visibles en arrière-plan
- il existe une animation au scroll et/ou à la souris
- le rendu est responsive
- le code est propre, modulaire et maintenable

---

## Résultat attendu à la fin du sprint

À la fin de ce sprint, le projet doit disposer d’une **homepage premium** qui :

- donne une forte identité au produit
- inspire confiance
- évoque immédiatement une application de marché de skins CS2
- prépare proprement les futurs écrans produit

---

## Instruction finale

Ce sprint doit privilégier :

1. la qualité visuelle
2. la cohérence avec `exemple_style.png`
3. la qualité de l’animation
4. la modularité du code
5. la finition premium

L’objectif n’est pas juste “faire une page”.
L’objectif est de créer une **première impression forte**.
