# Idees de deploiement Cs-Stonks

## Objectif

Garder une trace des options possibles pour deployer toute l'application :

- frontend Next.js
- API routes backend Next.js
- base PostgreSQL
- jobs de recuperation de prix
- jobs catalogue
- snapshots journaliers

Le but court terme est de rester gratuit si possible, sans bloquer l'evolution vers
un setup plus robuste plus tard.

---

## Recommandation gratuite actuelle

Le meilleur setup gratuit pour le projet aujourd'hui :

```text
Vercel Hobby
├─ Front Next.js
├─ API routes Next.js
└─ connexion a PostgreSQL

Neon Free
└─ PostgreSQL managé gratuit

GitHub Actions
├─ CI
├─ sync prix planifiee
├─ sync catalogue ponctuelle ou planifiee
└─ snapshots journaliers
```

### Pourquoi ce choix

- Vercel est tres adapte a Next.js.
- Neon fournit un vrai PostgreSQL compatible Prisma.
- GitHub Actions peut lancer les scripts Node existants.
- Aucun serveur a maintenir.
- Cout initial : 0 euro.

### Commandes de jobs existantes utiles

```bash
npm run job:catalog
npm run job:catalog:refresh-images
npm run job:skinport
npm run job:csfloat
npm run job:dmarket
npm run job:waxpeer
npm run job:white-market
npm run job:snapshot
```

### Secrets a mettre dans GitHub Actions

```text
DATABASE_URL
SHADOW_DATABASE_URL
CSFLOAT_API_KEY
STEAM_WEB_API_KEY
SESSION_SECRET
APP_URL
```

Selon les providers utilises :

```text
SKINPORT_*
DMARKET_*
WAXPEER_*
WHITE_MARKET_*
```

### Secrets a mettre dans Vercel

```text
DATABASE_URL
APP_URL
SESSION_SECRET
STEAM_WEB_API_KEY
NEXT_PUBLIC_USD_EUR_RATE
```

Et selon besoin :

```text
CSFLOAT_API_KEY
PRICE_PROVIDER
CATALOG_PROVIDER
ENABLE_INTERNAL_CRON=false
```

Important : les gros jobs ne doivent pas tourner dans Vercel Hobby. Ils doivent
plutot tourner via GitHub Actions.

---

## Limites du setup gratuit

Ce setup est bon pour un MVP, un projet ecole ou une demo, mais pas pour une
production solide.

Limites principales :

- GitHub Actions schedule peut etre retarde.
- Les jobs tres longs peuvent atteindre des limites de temps.
- Neon Free a des limites de stockage et de compute.
- Vercel Hobby a des limites sur les API routes et fonctions.
- Pas de worker permanent.
- Pas de garantie forte de disponibilite.

Conclusion :

```text
Gratuit = tres bien pour tester et presenter.
Gratuit != infrastructure production definitive.
```

---

## Alternative gratuite moins recommandee

```text
Render Free
├─ Web service gratuit
└─ PostgreSQL gratuit
```

Pourquoi ce n'est pas le meilleur choix ici :

- le web service gratuit peut dormir apres inactivite
- le cold start peut etre visible
- le PostgreSQL gratuit Render est limite et moins interessant long terme
- la base gratuite Render peut expirer selon les conditions du plan

Donc Render est interessant surtout en payant.

---

## Setup payant propre recommande plus tard

Quand le projet devient plus serieux :

```text
Render ou Railway
├─ Web service Next.js
├─ Worker Node.js pour les jobs
├─ Cron jobs planifies
└─ PostgreSQL managé
```

Avantages :

- worker dedie aux syncs marketplace
- jobs plus fiables que GitHub Actions schedule
- base persistante avec backups
- architecture plus proche production
- moins de bricolage

Estimation minimum :

```text
Web service : ~7$/mois
PostgreSQL : ~6$/mois
Worker/Cron : ~0 a 7$/mois selon besoin
Total : environ 13 a 20$/mois
```

---

## Setup proprietaire avec VPS

Autre option long terme :

```text
VPS Docker Compose
├─ nginx / reverse proxy
├─ app Next.js
├─ worker jobs
├─ PostgreSQL
└─ backups
```

Avantages :

- cout bas possible : 5 a 10 euros/mois
- controle total
- tous les services au meme endroit

Inconvenients :

- maintenance serveur
- securite
- backups a gerer
- monitoring a mettre en place
- risque de perdre des donnees si mal configure

Ce choix est interessant si l'objectif devient vraiment "je veux tout posseder".

---

## Strategie recommandee

### Phase 1 : gratuit

```text
Vercel Free + Neon Free + GitHub Actions
```

Objectif :

- deployer rapidement
- garder 0 euro de cout
- tester les vrais flux
- valider que les jobs ecrivent bien en base hebergee

### Phase 2 : semi-prod

```text
Vercel + Neon payant
ou
Render/Railway payant
```

Objectif :

- stabiliser les performances
- eviter les limites gratuites
- securiser les donnees

### Phase 3 : production propre

```text
Web app + worker + Postgres managed + backups + monitoring
```

Objectif :

- syncs fiables
- deploy controle
- base sauvegardee
- observabilite

---

## Workflow GitHub Actions data-sync a prevoir

Un futur workflow pourrait etre :

```yaml
name: Data Sync

on:
  workflow_dispatch:
  schedule:
    - cron: "30 1 * * *"

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup node
      - npm ci
      - prisma generate
      - npm run job:skinport
      - npm run job:csfloat
      - npm run job:dmarket
      - npm run job:waxpeer
      - npm run job:white-market
      - npm run job:snapshot
```

Attention :

- utiliser `DATABASE_URL` Neon depuis GitHub Secrets
- ne jamais mettre de vraie cle dans le repo
- surveiller la duree du job
- eviter de lancer deux syncs en meme temps
- ajouter `concurrency` dans le workflow

---

## Decision courte

Si l'objectif est gratuit :

```text
Vercel + Neon + GitHub Actions
```

Si l'objectif est production propre :

```text
Render/Railway avec web service + worker + PostgreSQL
```

Si l'objectif est controle total :

```text
VPS Docker Compose
```
