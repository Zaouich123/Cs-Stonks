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
    analytics: "Analytics",
    apiDocs: "API Docs",
    connectedWith: "Connected with",
    dataSource: "Source",
    displayed: "Displayed",
    english: "English",
    french: "French",
    getStarted: "Get Started",
    inventory: "Inventory",
    inventoryLead:
      "Cards use your Steam inventory and enriched prices stored in the database.",
    items: "items",
    loadingMarketData: "Loading market data...",
    localCache: "local cache",
    login: "Log in",
    market: "Market",
    markets: "Markets",
    noPrice: "Price unavailable",
    priceReference: "Reference price",
    profile: "Profile",
    sync: "Sync",
    updatedAt: "last loaded",
    viewAllPrices: "View all prices",
    withPrices: "With prices",
  },
  FR: {
    analytics: "Analytics",
    apiDocs: "API Docs",
    connectedWith: "Connecté avec",
    dataSource: "Source",
    displayed: "Affichés",
    english: "Anglais",
    french: "Français",
    getStarted: "Commencer",
    inventory: "Inventaire",
    inventoryLead:
      "Les cartes utilisent ton inventaire Steam et les prix enrichis stockés en base.",
    items: "objets",
    loadingMarketData: "Chargement des données marché...",
    localCache: "cache local",
    login: "Connexion",
    market: "Marché",
    markets: "Marchés",
    noPrice: "Prix indisponible",
    priceReference: "Prix de référence",
    profile: "Profil",
    sync: "Sync",
    updatedAt: "dernier chargement",
    viewAllPrices: "Voir tous les prix",
    withPrices: "Avec prix",
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
    const nextPreferences = {
      currency: isCurrency(window.localStorage.getItem(CURRENCY_STORAGE_KEY))
        ? (window.localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyPreference)
        : DEFAULT_PREFERENCES.currency,
      language: isLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
        ? (window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguagePreference)
        : DEFAULT_PREFERENCES.language,
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
