# SPRINT_8.md

## Contexte

Les sprints précédents ont construit :

- la base data
- le catalogue d’items CS2
- les pages frontend principales
- la page d’analyse
- la page de prix
- la documentation API
- les premières intégrations de providers / snapshots

Le sprint 8 change de priorité par rapport à l’idée initiale de récupération des prix Steam.

Ce sprint doit maintenant construire un système gratuit pour :

1. permettre à un utilisateur de se connecter avec Steam
2. créer ou retrouver son compte local dans la BDD
3. récupérer son profil public Steam
4. afficher une vraie page profil
5. permettre à l’utilisateur d’ajouter son trade link Steam
6. permettre à l’utilisateur d’ajouter son numéro de téléphone

L’objectif est de commencer à transformer l’application en vrai produit utilisateur.

---

## Objectif du sprint

Construire un système complet :

**Steam Login gratuit -> Session locale -> Profil utilisateur -> Paramètres de trading**

Le sprint doit livrer :

- une connexion via Steam gratuite
- une gestion de session côté app
- une table utilisateur liée au SteamID
- une page profil utilisateur
- l’affichage de l’avatar Steam
- l’affichage du pseudo Steam
- l’affichage de l’URL du profil Steam
- un formulaire pour sauvegarder un trade link
- un formulaire pour sauvegarder un numéro de téléphone
- une UX premium cohérente avec le reste du projet

---

## Principe technique principal

Steam utilise **OpenID 2.0** pour l’authentification web.

Cela permet à l’application de vérifier l’identité Steam d’un utilisateur sans demander son mot de passe Steam.

### Point important

Steam OpenID retourne principalement un **SteamID 64-bit**.

Pour récupérer :

- pseudo Steam
- avatar
- avatar medium
- avatar full
- URL de profil

il faut ensuite appeler la Steam Web API, notamment :

```http
GET /ISteamUser/GetPlayerSummaries/v2/
```

avec une clé Steam Web API.

---

## Gratuité

Ce sprint doit rester gratuit.

### Autorisé

- Steam OpenID
- Steam Web API avec clé gratuite
- stockage local en BDD
- sessions locales

### Interdit dans ce sprint

- service d’auth payant
- Clerk payant
- provider Steam payant
- API marketplace payante
- système KYC / SMS payant
- vérification réelle du téléphone via SMS payant

### Important

La page doit permettre d’enregistrer un numéro de téléphone, mais pas forcément de le vérifier par SMS dans ce sprint.

---

## Documentation Steam à respecter

Gemini Pro / Codex doit respecter ces éléments techniques :

### Steam OpenID provider

Provider Steam OpenID :

```text
https://steamcommunity.com/openid
```

Endpoint de login OpenID :

```text
https://steamcommunity.com/openid/login
```

Steam retourne un claimed ID au format :

```text
https://steamcommunity.com/openid/id/<steamid>
```

Le `<steamid>` est le SteamID 64-bit de l’utilisateur.

### Steam Web API profile

Pour récupérer les infos profil :

```http
GET https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/
```

Paramètres :

```text
key=<STEAM_WEB_API_KEY>
steamids=<steamid>
format=json
```

Réponse attendue :

```json
{
  "response": {
    "players": [
      {
        "steamid": "76561198000000000",
        "personaname": "PlayerName",
        "profileurl": "https://steamcommunity.com/id/example/",
        "avatar": "https://...jpg",
        "avatarmedium": "https://..._medium.jpg",
        "avatarfull": "https://..._full.jpg"
      }
    ]
  }
}
```

---

## Architecture d’authentification attendue

Le projet doit utiliser une approche simple et robuste.

### Option recommandée

Implémenter Steam OpenID directement avec des routes Next.js App Router.

Routes internes recommandées :

```text
GET /api/auth/steam/login
GET /api/auth/steam/callback
POST /api/auth/logout
GET /api/auth/me
```

### Pourquoi cette approche

Steam OpenID est un ancien protocole OpenID 2.0, pas un provider OAuth/OIDC classique.

Donc il peut être plus propre d’implémenter le flux directement au lieu d’essayer de forcer un provider OAuth standard.

---

## Flux Steam Login attendu

### 1. L’utilisateur clique sur “Sign in through Steam”

Depuis :

- `/auth`
- ou la navbar
- ou un bouton sur la homepage

Le bouton redirige vers :

```http
GET /api/auth/steam/login
```

---

### 2. La route login construit l’URL Steam OpenID

La route doit rediriger vers :

```text
https://steamcommunity.com/openid/login
```

avec les paramètres :

```text
openid.ns=http://specs.openid.net/auth/2.0
openid.mode=checkid_setup
openid.return_to=<APP_URL>/api/auth/steam/callback
openid.realm=<APP_URL>
openid.identity=http://specs.openid.net/auth/2.0/identifier_select
openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select
```

---

### 3. Steam redirige vers le callback

Steam renvoie l’utilisateur vers :

```text
/api/auth/steam/callback
```

avec des paramètres `openid.*`.

---

### 4. L’application vérifie la réponse auprès de Steam

Le backend doit renvoyer les paramètres à Steam avec :

```text
openid.mode=check_authentication
```

Si Steam répond :

```text
is_valid:true
```

alors le login est accepté.

---

### 5. Extraction du SteamID

Extraire le SteamID depuis :

```text
openid.claimed_id
```

Format :

```text
https://steamcommunity.com/openid/id/76561198000000000
```

---

### 6. Récupération du profil Steam

Appeler :

```http
GET /ISteamUser/GetPlayerSummaries/v2/
```

pour récupérer :

- `steamid`
- `personaname`
- `profileurl`
- `avatar`
- `avatarmedium`
- `avatarfull`

---

### 7. Upsert utilisateur en BDD

Créer ou mettre à jour l’utilisateur local.

Si le SteamID existe déjà :

- mettre à jour pseudo/avatar/profil
- conserver trade link et téléphone déjà sauvegardés

Si le SteamID n’existe pas :

- créer un nouvel utilisateur
- remplir les champs Steam
- laisser trade link et téléphone vides

---

### 8. Création de session locale

Créer une session locale sécurisée.

Options acceptables :

- session cookie HTTP-only signée
- JWT HTTP-only
- `iron-session`
- Auth.js si une intégration Steam OpenID fiable existe déjà dans le repo

### Règle

Ne pas stocker de données sensibles dans un cookie lisible côté client.

---

## Base de données attendue

Le sprint doit ajouter ou ajuster les modèles nécessaires.

---

## Modèle `User`

Créer ou enrichir un modèle utilisateur.

### Champs recommandés

```text
id
steamId
steamPersonaName
steamProfileUrl
steamAvatar
steamAvatarMedium
steamAvatarFull
tradeLink
phoneNumber
phoneCountryCode
phoneVerified
createdAt
updatedAt
lastLoginAt
```

### Contraintes

- `steamId` unique
- index sur `steamId`
- `tradeLink` nullable
- `phoneNumber` nullable
- `phoneVerified` par défaut `false`

---

## Modèle `Session` optionnel

Si le projet n’a pas encore de gestion de session robuste, créer un modèle session.

### Champs possibles

```text
id
userId
sessionToken
expiresAt
createdAt
updatedAt
```

### Règles

- `sessionToken` doit être unique
- stocker le token hashé si possible
- expiration claire
- cookie HTTP-only côté navigateur

### Alternative acceptable

Utiliser une session signée sans table `Session`, si le projet reste simple.

Dans ce cas, documenter clairement la stratégie choisie.

---

## Modèle `UserProfileAudit` optionnel

Optionnel mais utile si on veut tracer les changements sensibles.

### Champs possibles

```text
id
userId
action
metadata
createdAt
```

### Actions possibles

- `trade_link_updated`
- `phone_updated`
- `profile_synced`

Ce modèle est optionnel et ne doit pas bloquer le sprint.

---

## Page `/auth`

La page d’authentification doit être adaptée à Steam.

### Route attendue

```text
/auth
```

### Contenu attendu

- logo du projet
- titre clair
- texte d’explication
- bouton officiel ou style “Sign in through Steam”
- message rassurant : l’application ne demande jamais le mot de passe Steam
- design cohérent avec le thème sombre premium

### Bouton Steam

Le bouton doit :

- être bien visible
- rediriger vers `/api/auth/steam/login`
- avoir un style Steam / premium
- rester cohérent avec le design du projet

### Important

Ne jamais demander le mot de passe Steam dans l’application.

---

## Page `/profile`

Créer une vraie page profil.

### Route attendue

```text
/profile
```

### Accès

La page doit être accessible seulement aux utilisateurs connectés.

Si l’utilisateur n’est pas connecté :

- rediriger vers `/auth`
- ou afficher un état demandant de se connecter

---

## Contenu de la page profil

La page profil doit contenir :

### Bloc identité Steam

Afficher :

- avatar Steam
- pseudo Steam
- SteamID
- lien vers profil Steam
- date de dernière connexion si disponible

### Bloc trade link

Afficher :

- champ input pour le trade link
- bouton sauvegarder
- message d’aide pour trouver son trade link
- validation du format

### Bloc téléphone

Afficher :

- champ numéro de téléphone
- champ indicatif pays si nécessaire
- état `phoneVerified`
- bouton sauvegarder
- message indiquant que la vérification SMS n’est pas encore activée si c’est hors scope

### Bloc actions

Afficher :

- bouton logout
- éventuellement bouton “resync Steam profile”

---

## Validation du trade link

Le trade link doit respecter un format proche de :

```text
https://steamcommunity.com/tradeoffer/new/?partner=<partner>&token=<token>
```

### Règles

- accepter uniquement les URLs Steam Community attendues
- refuser les domaines suspects
- vérifier la présence de `partner`
- vérifier la présence de `token`
- normaliser l’URL si nécessaire

### Message d’aide

La page doit expliquer où trouver le trade link :

```text
Steam > Inventory > Trade Offers > Who can send me Trade Offers? > Third-Party Sites
```

Ou proposer un lien d’aide :

```text
https://steamcommunity.com/my/tradeoffers/privacy
```

---

## Validation du téléphone

Dans ce sprint, il faut seulement stocker le numéro.

### Règles

- champ optionnel
- format téléphone basique
- pas de vérification SMS réelle
- `phoneVerified = false` par défaut
- afficher clairement que le numéro n’est pas vérifié

### Sécurité / confidentialité

Le numéro de téléphone est une donnée personnelle.

Gemini Pro / Codex doit :

- ne jamais afficher le téléphone ailleurs que sur le profil utilisateur
- ne jamais le mettre dans les logs
- ne jamais l’exposer dans une API publique
- prévoir une structure propre pour pouvoir le supprimer ou le modifier

---

## Routes API profil à créer

Créer des routes protégées :

```text
GET /api/me
PATCH /api/me/profile
POST /api/auth/logout
POST /api/auth/steam/resync
```

### `GET /api/me`

Retourne l’utilisateur connecté.

Doit retourner :

- id
- steamId
- steamPersonaName
- steamProfileUrl
- steamAvatarFull
- tradeLink présent ou null
- phoneNumber masqué ou complet seulement pour soi
- phoneVerified

### `PATCH /api/me/profile`

Permet de modifier :

- tradeLink
- phoneNumber
- phoneCountryCode

Doit valider les données.

### `POST /api/auth/logout`

Supprime la session.

### `POST /api/auth/steam/resync`

Relance un fetch du profil Steam pour l’utilisateur connecté.

Met à jour :

- pseudo
- avatar
- URL de profil

---

## Sécurité obligatoire

### Cookies

Les cookies de session doivent être :

- `HttpOnly`
- `Secure` en production
- `SameSite=Lax` ou `Strict`
- avec expiration

### CSRF

Pour les routes `PATCH` / `POST`, prévoir au minimum une stratégie basique.

Options :

- SameSite cookie + vérification session
- token CSRF si le projet en utilise déjà
- protection via headers internes si nécessaire

### Données sensibles

Ne jamais exposer :

- session token
- clé Steam Web API
- téléphone d’autres utilisateurs
- informations internes de session

---

## Variables d’environnement

Ajouter / documenter :

```env
APP_URL=http://localhost:3000
STEAM_OPENID_PROVIDER_URL=https://steamcommunity.com/openid/login
STEAM_WEB_API_BASE_URL=https://api.steampowered.com
STEAM_WEB_API_KEY=
SESSION_SECRET=
SESSION_COOKIE_NAME=cs_stonks_session
SESSION_MAX_AGE_DAYS=30
```

### Important

`STEAM_WEB_API_KEY` doit rester côté serveur.

Ne jamais l’exposer au client.

---

## Architecture recommandée

```text
src/
  app/
    auth/
      page.tsx
    profile/
      page.tsx
    api/
      auth/
        steam/
          login/
            route.ts
          callback/
            route.ts
          resync/
            route.ts
        logout/
          route.ts
      me/
        route.ts
        profile/
          route.ts

  modules/
    auth/
      steam/
        steamOpenId.ts
        steamOpenIdVerifier.ts
        steamProfileClient.ts
        steamAuthService.ts
      session/
        sessionService.ts
        sessionCookie.ts
      types/
        auth.types.ts

    users/
      services/
        userService.ts
        userProfileService.ts
      validators/
        profileValidators.ts
        tradeLinkValidator.ts
        phoneValidator.ts
      types/
        user.types.ts

  components/
    auth/
      SteamLoginCard.tsx
      SteamLoginButton.tsx
    profile/
      ProfileHeader.tsx
      SteamIdentityCard.tsx
      TradeLinkCard.tsx
      PhoneSettingsCard.tsx
      ProfileActionsCard.tsx
```

---

## Services à créer

### `steamOpenId.ts`

Responsabilités :

- construire l’URL de login Steam
- gérer `return_to`
- gérer `realm`

### `steamOpenIdVerifier.ts`

Responsabilités :

- recevoir les query params du callback
- envoyer `check_authentication` à Steam
- vérifier `is_valid:true`
- extraire le SteamID

### `steamProfileClient.ts`

Responsabilités :

- appeler Steam Web API `GetPlayerSummaries`
- récupérer avatar / pseudo / profile URL
- typer la réponse
- gérer les erreurs

### `steamAuthService.ts`

Responsabilités :

- orchestrer le login Steam
- upsert user
- créer session
- retourner la redirection finale

### `sessionService.ts`

Responsabilités :

- créer session
- lire session
- supprimer session
- vérifier expiration

### `userProfileService.ts`

Responsabilités :

- lire le profil utilisateur
- mettre à jour trade link
- mettre à jour téléphone
- resync profil Steam

---

## UX attendue de `/profile`

La page profil doit être une vraie page produit, pas juste un formulaire brut.

### Style attendu

- fond sombre premium
- cartes avec glassmorphism léger
- accent `#093066`
- avatar Steam bien visible
- hiérarchie claire
- états de validation visibles
- feedback après sauvegarde

### Feedback utilisateur

Après sauvegarde du trade link ou téléphone :

- afficher succès
- afficher erreur si format invalide
- garder une UX fluide

---

## Responsive design

### Desktop

- layout en deux colonnes possible
- identité Steam à gauche
- paramètres à droite

### Mobile

- cartes empilées
- inputs lisibles
- boutons accessibles

---

## Tests attendus

Ajouter des tests ciblés.

### Tests auth Steam

- construit correctement l’URL OpenID
- vérifie un callback valide
- refuse un callback invalide
- extrait correctement le SteamID

### Tests Steam profile

- parse correctement `GetPlayerSummaries`
- gère réponse vide
- gère erreur API

### Tests user

- crée un user à la première connexion
- met à jour avatar / pseudo au login suivant
- conserve trade link / téléphone existants

### Tests validators

- trade link valide accepté
- domaine non Steam refusé
- trade link sans token refusé
- téléphone invalide refusé

### Tests session

- session créée
- session lue
- logout supprime la session
- profil inaccessible sans session

---

## Scénarios de test manuels

### 1. Connexion Steam

Aller sur :

```text
/auth
```

Cliquer sur :

```text
Sign in through Steam
```

Attendu :

- redirection vers Steam
- retour vers l’application
- utilisateur connecté
- entrée `User` créée ou mise à jour

---

### 2. Page profil

Aller sur :

```text
/profile
```

Attendu :

- avatar Steam visible
- pseudo Steam visible
- SteamID visible
- lien profil Steam visible
- formulaire trade link visible
- formulaire téléphone visible

---

### 3. Sauvegarde trade link

Entrer un lien du type :

```text
https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=abcdef
```

Attendu :

- validation OK
- sauvegarde en BDD
- message succès

---

### 4. Trade link invalide

Entrer :

```text
https://fake-steam.com/tradeoffer/new/?partner=123&token=abc
```

Attendu :

- refus
- message d’erreur clair
- pas de sauvegarde

---

### 5. Téléphone

Entrer un téléphone valide.

Attendu :

- sauvegarde
- `phoneVerified = false`
- message indiquant que le numéro n’est pas encore vérifié

---

### 6. Logout

Cliquer logout.

Attendu :

- session supprimée
- retour auth ou homepage
- `/profile` inaccessible sans reconnexion

---

## Documentation à mettre à jour

Mettre à jour :

- `README.md`
- `.env.example`
- éventuellement `/api-docs`

### À documenter

- comment créer une clé Steam Web API
- variables d’environnement
- flow Steam OpenID
- routes auth
- routes profil
- limites du sprint
- téléphone non vérifié par SMS
- trade link stocké localement

---

## Branching pour ce sprint

Maximum **3 branches**.

### Branche 1

```text
feature/steam-openid-auth
```

Contient :

- routes Steam login / callback
- vérification OpenID
- récupération profil Steam
- upsert user
- variables env

### Branche 2

```text
feature/session-and-profile-api
```

Contient :

- session locale
- routes `/api/me`
- route update profile
- logout
- validators trade link / téléphone

### Branche 3

```text
feature/profile-page-ui
```

Contient :

- page `/auth`
- page `/profile`
- composants profil
- UX sauvegarde
- responsive
- documentation

---

## Ordre de travail recommandé

1. inspecter l’existant auth / user dans le repo
2. créer ou ajuster le modèle `User`
3. créer les variables d’environnement
4. implémenter Steam OpenID login URL
5. implémenter callback + vérification Steam
6. extraire le SteamID
7. appeler `GetPlayerSummaries`
8. upsert user
9. créer session locale
10. créer `/api/me`
11. créer `/api/me/profile`
12. créer `/auth`
13. créer `/profile`
14. ajouter validators trade link / téléphone
15. ajouter logout
16. ajouter tests
17. mettre à jour documentation

---

## Définition of done

Le sprint 8 est terminé si :

- un utilisateur peut se connecter via Steam gratuitement
- le SteamID est vérifié via OpenID
- le profil Steam est récupéré via Steam Web API
- l’utilisateur est créé ou mis à jour en BDD
- une session locale sécurisée existe
- `/auth` existe
- `/profile` existe
- l’avatar Steam s’affiche
- le pseudo Steam s’affiche
- le trade link peut être sauvegardé
- le numéro de téléphone peut être sauvegardé
- le trade link est validé
- les données sensibles ne sont pas exposées inutilement
- logout fonctionne
- les tests critiques existent
- la documentation est à jour

---

## Résultat attendu à la fin du sprint

À la fin du sprint, le projet doit avoir :

- une vraie connexion Steam
- une vraie identité utilisateur
- une page profil crédible
- un stockage local des paramètres de trading
- une base prête pour de futures fonctionnalités utilisateur

Exemples de futures fonctionnalités possibles :

- inventory tracking
- alertes personnalisées
- favoris
- watchlist
- historique utilisateur
- notifications
- vérification téléphone
- intégration trade bot future

---

## Instruction finale

Ce sprint doit privilégier :

1. gratuité
2. sécurité
3. simplicité
4. UX profil propre
5. compatibilité Steam réelle
6. évolutivité

La règle principale est :

```text
Ne jamais demander le mot de passe Steam.
Utiliser Steam OpenID pour vérifier le SteamID.
Utiliser Steam Web API pour récupérer avatar et pseudo.
Stocker un profil local propre.
Protéger les informations utilisateur.
```
