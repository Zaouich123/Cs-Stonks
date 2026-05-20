"use client";

import * as React from "react";

export type CurrencyPreference = "EUR" | "USD";
export type LanguagePreference = "FR" | "EN";

export interface PreferenceState {
  currency: CurrencyPreference;
  language: LanguagePreference;
}

interface PreferencesContextValue extends PreferenceState {
  formatMoney: (value: number | null | undefined, sourceCurrency?: string | null) => string;
  locale: "fr-FR" | "en-US";
  setCurrency: (currency: CurrencyPreference) => void;
  setLanguage: (language: LanguagePreference) => void;
  t: (key: TranslationKey) => string;
}

export const DEFAULT_PREFERENCES: PreferenceState = {
  currency: "EUR",
  language: "FR",
};

export const CURRENCY_STORAGE_KEY = "cs-stonks:currency";
export const LANGUAGE_STORAGE_KEY = "cs-stonks:language";

const USD_EUR_RATE = Number(process.env.NEXT_PUBLIC_USD_EUR_RATE ?? "0.92");
const EUR_USD_RATE = USD_EUR_RATE > 0 ? 1 / USD_EUR_RATE : 1.087;

const translations = {
  EN: {
    accessApi: "Access API",
    active: "Active",
    actions: "Actions",
    addDownZone: "Bearish zone",
    addUpZone: "Bullish zone",
    analytics: "Analytics",
    apiDocs: "API Docs",
    apiDocsBaseHelp:
      "Examples use `http://localhost:3000`, but deployed environments follow the same route paths on the current origin.",
    apiDocsChooseSection:
      "Choose a section on the left and the documentation viewport updates on the right.",
    apiDocsContract:
      "Every documented route returns a stable JSON envelope so frontend screens and automation can share the same parsing strategy.",
    apiDocsCoverage: "What this API covers",
    apiDocsCoverageCatalog: "Public catalog search backed by Postgres.",
    apiDocsCoverageHistory: "Historical snapshots used by analytics charts.",
    apiDocsCoverageOperations: "Internal sync utilities for catalog, pricing, and operations.",
    apiDocsCoveragePrices: "Latest market prices enriched with listing and sales signals.",
    apiDocsReference: "Reference",
    apiDocsResponseContract: "Response contract",
    apiDocsTitle: "API Documentation",
    apiDocsViewport: "Documentation",
    backToMarket: "Back to market",
    browse: "Browse",
    close: "Close",
    color: "Color",
    collection: "Collection",
    connectedWith: "Connected with",
    currentFloor: "Current floor",
    dataSource: "Source",
    discontinued: "Discontinued",
    displayed: "Displayed",
    dragToZoom: "Drag to zoom",
    dropCases: "Drop cases",
    dropCasesDescription: "Which cases are most likely to drop this item.",
    english: "English",
    eraseZones: "Clear zones",
    exploreMarkets: "Explore Markets",
    findMyTradeLink: "Find my trade link",
    finishInferred: "Finish inferred",
    floor: "Floor",
    french: "French",
    fullClean: "Full clean",
    getStarted: "Get Started",
    headers: "Headers",
    homeFeatureAnalyticsDescription:
      "Analyze historical trends, volume, and liquidity to make informed decisions.",
    homeFeatureAnalyticsTitle: "Deep Analytics",
    homeFeatureDataDescription:
      "Track CS2 skins with up-to-the-minute price updates from major markets.",
    homeFeatureDataTitle: "Real-time Data",
    homeFeaturePortfolioDescription:
      "Monitor your inventory value and track your return on investment effortlessly.",
    homeFeaturePortfolioTitle: "Portfolio Management",
    homeHeroDescription:
      "The premium platform for tracking CS2 skin prices, analyzing market trends, and finding the best investment opportunities in real-time.",
    homeHeroKicker: "CS2 Market",
    homeHeroTitle: "Master the",
    implementationNotes: "Implementation notes",
    inventory: "Inventory",
    inventoryLead:
      "Cards use your Steam inventory and enriched prices stored in the database.",
    inventoryLoadError: "Unable to load inventory.",
    inventoryNoItems:
      "Your inventory may be private, empty, or the current search does not match any item.",
    inventoryNoItemsTitle: "No items found.",
    inventoryRateLimit:
      "Steam is temporarily rate-limiting inventory requests. Wait a few minutes before forcing another sync.",
    inventorySearchPlaceholder: "Search for items",
    inventoryStaleCache: "old cache",
    itemName: "Item Name",
    itemNotFound: "Item not found",
    itemNotFoundDescription: "This item could not be loaded from the current catalog.",
    itemOverview: "Item Overview",
    items: "items",
    jsonBody: "JSON body",
    lastLogin: "Last login",
    loadingMarketData: "Loading market data...",
    localCache: "local cache",
    login: "Log in",
    logout: "Logout",
    market: "Market",
    marketActive: "Market active",
    marketCurve: "market curve",
    marketOverview: "Market Overview",
    marketOverviewLead: "Live prices, trends, and market liquidity for CS2 items.",
    markets: "Markets",
    matchedDb: "DB match",
    name: "Name",
    next: "Next",
    noDropCases: "No drop case has been mapped for this item yet.",
    noHistoricalData: "No historical data available for this range yet.",
    noImage: "No image",
    noItemsFound: "No items found. Run a catalog sync to populate the database.",
    noItemsMatch: "No items match your search.",
    noPrice: "Price unavailable",
    noPriceInDb: "No database price for this item.",
    noPriceInDbDescription:
      "It will be filled when a provider has an exact market match.",
    number: "Number",
    open: "Open",
    optional: "Optional",
    page: "Page",
    pathParameters: "Path parameters",
    phases: "Phases",
    phone: "Phone",
    phoneCode: "Code",
    phoneLead: "SMS verification is not enabled in this sprint.",
    phoneNotVerified: "Not verified",
    phoneNumberSaved: "Phone number saved.",
    phoneStatus: "Phone status",
    phoneVerified: "Verified",
    priceAction: "Price action",
    priceReference: "Reference price",
    previous: "Previous",
    profile: "Profile",
    profileLinkedSteam: "Your local Cs-Stonks profile is linked to SteamID",
    queryParameters: "Query parameters",
    requestExample: "Request example",
    required: "Required",
    resetZoom: "Reset zoom",
    responses: "Responses",
    resyncSteam: "Resync Steam",
    runtimeErrors: "Runtime Errors",
    save: "Save",
    searchItemPlaceholder: "Search for an item...",
    searchMarketsPlaceholder: "Search markets...",
    searchSkinsPlaceholder: "Search skins...",
    signInSteam: "Sign in through Steam",
    steamAccount: "Steam account",
    steamLogin: "Steam login",
    steamLoginDescription:
      "Connect your Steam identity to manage your trading settings and future portfolio.",
    steamLoginFailed:
      "Steam login failed. Check `STEAM_WEB_API_KEY` in `.env`, then try again.",
    steamNeverPassword: "Cs-Stonks never asks for your Steam password.",
    steamProfile: "Steam profile",
    steamProfileSynced: "Steam profile synced.",
    steamWebApiSync: "Steam Web API profile sync",
    stylus: "Pen",
    supply: "Supply",
    sync: "Sync",
    syncInventoryFallback: "Displayed data comes from the last available cache.",
    trend: "Trend",
    tradeLink: "Trade link",
    tradeLinkLead: "Steam Inventory, Trade Offers, Third-Party Sites.",
    tradeLinkSaved: "Trade link saved.",
    tradeOfferUrl: "Steam trade offer URL",
    type: "Type",
    unknown: "Unknown",
    updatedAt: "last loaded",
    variant: "Variant",
    variantKey: "Variant key",
    viewAllPrices: "View all prices",
    viewAllPricesSources: "sources available",
    wear: "Wear",
    weeklySales: "Weekly sales",
    withPrices: "With prices",
    year: "Year",
  },
  FR: {
    accessApi: "Accéder à l'API",
    active: "Actif",
    actions: "Actions",
    addDownZone: "Zone baissière",
    addUpZone: "Zone haussière",
    analytics: "Analytics",
    apiDocs: "API Docs",
    apiDocsBaseHelp:
      "Les exemples utilisent `http://localhost:3000`, mais les environnements déployés gardent les mêmes routes sur l'origine courante.",
    apiDocsChooseSection:
      "Choisis une section à gauche et la fenêtre de documentation se met à jour à droite.",
    apiDocsContract:
      "Chaque route documentée renvoie une enveloppe JSON stable pour que le frontend et les automatisations partagent la même stratégie de parsing.",
    apiDocsCoverage: "Ce que couvre cette API",
    apiDocsCoverageCatalog: "Recherche publique du catalogue alimentée par Postgres.",
    apiDocsCoverageHistory: "Snapshots historiques utilisés par les graphiques d'analyse.",
    apiDocsCoverageOperations: "Outils internes de synchronisation du catalogue, des prix et des opérations.",
    apiDocsCoveragePrices: "Prix de marché enrichis avec les listings et les signaux de vente.",
    apiDocsReference: "Référence",
    apiDocsResponseContract: "Contrat de réponse",
    apiDocsTitle: "Documentation API",
    apiDocsViewport: "Documentation",
    backToMarket: "Retour au market",
    browse: "Parcourir",
    close: "Fermer",
    color: "Couleur",
    collection: "Collection",
    connectedWith: "Connecté avec",
    currentFloor: "Prix plancher",
    dataSource: "Source",
    discontinued: "Discontinué",
    displayed: "Affichés",
    dragToZoom: "Glisser pour zoomer",
    dropCases: "Caisses de drop",
    dropCasesDescription: "Les caisses les plus susceptibles de contenir cet item.",
    english: "Anglais",
    eraseZones: "Effacer zones",
    exploreMarkets: "Explorer les marchés",
    findMyTradeLink: "Trouver mon trade link",
    finishInferred: "Finition déduite",
    floor: "Plancher",
    french: "Français",
    fullClean: "Tout effacer",
    getStarted: "Commencer",
    headers: "En-têtes",
    homeFeatureAnalyticsDescription:
      "Analyse les tendances historiques, le volume et la liquidité pour prendre de meilleures décisions.",
    homeFeatureAnalyticsTitle: "Analytics avancés",
    homeFeatureDataDescription:
      "Suis les skins CS2 avec des mises à jour de prix récentes depuis les principaux marchés.",
    homeFeatureDataTitle: "Données temps réel",
    homeFeaturePortfolioDescription:
      "Surveille la valeur de ton inventaire et suis ton retour sur investissement simplement.",
    homeFeaturePortfolioTitle: "Gestion de portfolio",
    homeHeroDescription:
      "La plateforme premium pour suivre les prix des skins CS2, analyser les tendances du marché et repérer les meilleures opportunités en temps réel.",
    homeHeroKicker: "marché CS2",
    homeHeroTitle: "Maîtrise le",
    implementationNotes: "Notes d'implémentation",
    inventory: "Inventaire",
    inventoryLead:
      "Les cartes utilisent ton inventaire Steam et les prix enrichis stockés en base.",
    inventoryLoadError: "Impossible de charger l'inventaire.",
    inventoryNoItems:
      "Ton inventaire peut être privé, vide, ou la recherche actuelle ne correspond à aucun item.",
    inventoryNoItemsTitle: "Aucun objet trouvé.",
    inventoryRateLimit:
      "Steam bloque temporairement les requêtes d'inventaire. Attends quelques minutes avant de forcer une nouvelle sync.",
    inventorySearchPlaceholder: "Rechercher des objets",
    inventoryStaleCache: "cache ancien",
    itemName: "Nom de l'item",
    itemNotFound: "Item introuvable",
    itemNotFoundDescription: "Cet item n'a pas pu être chargé depuis le catalogue actuel.",
    itemOverview: "Vue item",
    items: "objets",
    jsonBody: "Corps JSON",
    lastLogin: "Dernière connexion",
    loadingMarketData: "Chargement des données marché...",
    localCache: "cache local",
    login: "Connexion",
    logout: "Déconnexion",
    market: "Marché",
    marketActive: "Marché actif",
    marketCurve: "courbe marché",
    marketOverview: "Vue d'ensemble du marché",
    marketOverviewLead: "Prix live, tendances et liquidité du marché pour les items CS2.",
    markets: "Marchés",
    matchedDb: "Match BDD",
    name: "Nom",
    next: "Suivant",
    noDropCases: "Aucune caisse de drop n'a encore été associée à cet item.",
    noHistoricalData: "Aucune donnée historique disponible sur cette période pour l'instant.",
    noImage: "Pas d'image",
    noItemsFound: "Aucun item trouvé. Lance une sync catalogue pour remplir la base.",
    noItemsMatch: "Aucun item ne correspond à ta recherche.",
    noPrice: "Prix indisponible",
    noPriceInDb: "Aucun prix en base pour cet item.",
    noPriceInDbDescription:
      "Il sera rempli dès qu'un provider aura une correspondance exacte.",
    number: "Numéro",
    open: "Ouvrir",
    optional: "Optionnel",
    page: "Page",
    pathParameters: "Paramètres de chemin",
    phases: "Phases",
    phone: "Téléphone",
    phoneCode: "Indicatif",
    phoneLead: "La vérification SMS n'est pas activée dans ce sprint.",
    phoneNotVerified: "Non vérifié",
    phoneNumberSaved: "Numéro enregistré.",
    phoneStatus: "Statut téléphone",
    phoneVerified: "Vérifié",
    priceAction: "Mouvement du prix",
    priceReference: "Prix de référence",
    previous: "Précédent",
    profile: "Profil",
    profileLinkedSteam: "Ton profil local Cs-Stonks est lié au SteamID",
    queryParameters: "Paramètres de requête",
    requestExample: "Exemple de requête",
    required: "Obligatoire",
    resetZoom: "Réinitialiser le zoom",
    responses: "Réponses",
    resyncSteam: "Resync Steam",
    runtimeErrors: "Erreurs runtime",
    save: "Enregistrer",
    searchItemPlaceholder: "Rechercher un item...",
    searchMarketsPlaceholder: "Rechercher des markets...",
    searchSkinsPlaceholder: "Rechercher des skins...",
    signInSteam: "Se connecter avec Steam",
    steamAccount: "Compte Steam",
    steamLogin: "Connexion Steam",
    steamLoginDescription:
      "Connecte ton identité Steam pour gérer tes paramètres de trading et ton futur portfolio.",
    steamLoginFailed:
      "Connexion Steam échouée. Vérifie `STEAM_WEB_API_KEY` dans `.env`, puis réessaie.",
    steamNeverPassword: "Cs-Stonks ne demande jamais ton mot de passe Steam.",
    steamProfile: "Profil Steam",
    steamProfileSynced: "Profil Steam synchronisé.",
    steamWebApiSync: "Synchronisation profil via Steam Web API",
    stylus: "Stylo",
    supply: "Offre",
    sync: "Sync",
    syncInventoryFallback: "Données affichées depuis le dernier cache disponible.",
    trend: "Tendance",
    tradeLink: "Trade link",
    tradeLinkLead: "Inventaire Steam, offres d'échange, sites tiers.",
    tradeLinkSaved: "Trade link enregistré.",
    tradeOfferUrl: "URL d'offre d'échange Steam",
    type: "Type",
    unknown: "Inconnu",
    updatedAt: "dernier chargement",
    variant: "Variante",
    variantKey: "Clé de variante",
    viewAllPrices: "Voir tous les prix",
    viewAllPricesSources: "sources disponibles",
    wear: "Usure",
    weeklySales: "Ventes 7j",
    withPrices: "Avec prix",
    year: "Année",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["FR"];

const PreferencesContext = React.createContext<PreferencesContextValue | null>(null);

function isCurrency(value: string | null): value is CurrencyPreference {
  return value === "EUR" || value === "USD";
}

function isLanguage(value: string | null): value is LanguagePreference {
  return value === "FR" || value === "EN";
}

function publishPreferences(preferences: PreferenceState) {
  document.documentElement.lang = preferences.language.toLowerCase();
  document.documentElement.dataset.currency = preferences.currency;
  window.dispatchEvent(new CustomEvent("cs-stonks:preferences", { detail: preferences }));
}

function convertMoney(value: number, sourceCurrency: string | null | undefined, targetCurrency: CurrencyPreference) {
  const normalizedSource = sourceCurrency?.trim().toUpperCase() || "USD";

  if (normalizedSource === targetCurrency) {
    return value;
  }

  if (normalizedSource === "USD" && targetCurrency === "EUR") {
    return value * USD_EUR_RATE;
  }

  if (normalizedSource === "EUR" && targetCurrency === "USD") {
    return value * EUR_USD_RATE;
  }

  return value;
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = React.useState<PreferenceState>(DEFAULT_PREFERENCES);

  React.useEffect(() => {
    const storedCurrency = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const nextPreferences = {
      currency: isCurrency(storedCurrency) ? storedCurrency : DEFAULT_PREFERENCES.currency,
      language: isLanguage(storedLanguage) ? storedLanguage : DEFAULT_PREFERENCES.language,
    };

    setPreferences(nextPreferences);
    publishPreferences(nextPreferences);
  }, []);

  const updatePreferences = React.useCallback((nextPreferences: PreferenceState) => {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, nextPreferences.currency);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextPreferences.language);
    setPreferences(nextPreferences);
    publishPreferences(nextPreferences);
  }, []);

  const value = React.useMemo<PreferencesContextValue>(() => {
    const locale = preferences.language === "FR" ? "fr-FR" : "en-US";

    return {
      ...preferences,
      locale,
      formatMoney: (amount, sourceCurrency = "USD") => {
        if (amount === null || amount === undefined || !Number.isFinite(amount)) {
          return translations[preferences.language].noPrice;
        }

        const converted = convertMoney(amount, sourceCurrency, preferences.currency);

        return new Intl.NumberFormat(locale, {
          currency: preferences.currency,
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
          style: "currency",
        }).format(converted);
      },
      setCurrency: (currency) => updatePreferences({ ...preferences, currency }),
      setLanguage: (language) => updatePreferences({ ...preferences, language }),
      t: (key) => translations[preferences.language][key],
    };
  }, [preferences, updatePreferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = React.useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used inside PreferencesProvider.");
  }

  return context;
}
