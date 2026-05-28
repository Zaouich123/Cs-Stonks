# Cs-Stonks Steam Trade Analyzer

Extension Chrome/Edge locale pour analyser visuellement les offres d'echange
Steam avec les prix stockes dans Cs-Stonks.

## Objectif

Steam ne renvoie pas toujours les details des offres via l'API Web officielle.
Cette extension contourne ce probleme proprement : elle lit uniquement les items
deja visibles dans la page Steam ouverte par l'utilisateur, puis demande a
Cs-Stonks de calculer la valeur avec la base PostgreSQL locale.

Elle ne lit pas les cookies Steam, ne demande pas le mot de passe Steam, et ne
stocke aucune cle API Steam.

## Installation locale

1. Lancer Cs-Stonks en local :

```bash
npm run dev
```

2. Ouvrir Chrome ou Edge.
3. Aller dans `chrome://extensions`.
4. Activer `Mode developpeur`.
5. Cliquer sur `Charger l'extension non empaquetee`.
6. Selectionner le dossier :

```text
steam-trade-extension
```

7. Ouvrir Steam :

```text
https://steamcommunity.com/my/tradeoffers/
```

L'extension injecte automatiquement un bloc `Cs-Stonks` dans chaque offre
detectee.

## Configuration

Par defaut, l'extension appelle :

```text
http://localhost:3000/api/extension/trade-analysis
```

Pour changer l'URL :

1. Ouvrir les details de l'extension.
2. Cliquer sur `Options`.
3. Modifier l'URL Cs-Stonks.

## Fonctionnement technique

- Le content script detecte les blocs `.tradeoffer`.
- Il recupere les items dans `.tradeoffer_items.primary` et
  `.tradeoffer_items.secondary`.
- Si Steam ne met pas le nom dans le HTML, il utilise le `data-economy-item`
  pour appeler le hover HTML Steam et retrouver le nom anglais de l'item.
- Il envoie uniquement les noms, images et quantites a Cs-Stonks.
- Cs-Stonks matche ces noms avec `Item.marketHashName` / `Item.displayName`,
  puis prend le lowest price disponible parmi les markets synchronises.

## Limites connues

- Si un item n'existe pas dans la BDD Cs-Stonks, il est marque `N/A`.
- Si les prices n'ont pas ete synchronises, la valeur peut etre incomplete.
- Si Steam change fortement son HTML, il faudra ajuster les selecteurs du
  content script.

## Fichiers importants

```text
steam-trade-extension/
  manifest.json
  options.html
  src/content-script.js
  src/content-style.css
  src/options.js
```
