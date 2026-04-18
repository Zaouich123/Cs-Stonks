export const catalogProviderSources = ["json", "mock"] as const;
export const priceProviderSources = ["json", "mock"] as const;

export type CatalogProviderSource = (typeof catalogProviderSources)[number];
export type PriceProviderSource = (typeof priceProviderSources)[number];

export interface RawCatalogProviderItem {
  collection?: string | null;
  displayName?: string | null;
  exterior?: string | null;
  imageUrl?: string | null;
  itemType: string;
  marketHashName: string;
  phase?: string | null;
  rarity?: string | null;
  skinName?: string | null;
  souvenir?: boolean | null;
  stattrak?: boolean | null;
  steamImageUrl?: string | null;
  weapon?: string | null;
}

export interface RawMarketRecord {
  enabled?: boolean | null;
  name: string;
  priority?: number | null;
  slug: string;
}

export interface RawPriceProviderItem {
  currency?: string | null;
  fetchedAt: string;
  market: RawMarketRecord;
  marketHashName: string;
  phase?: string | null;
  price: number;
  quantity?: number | null;
  sourceUpdatedAt?: string | null;
  volume?: number | null;
}

export interface CatalogProvider {
  readonly provider: string;
  fetchCatalog(): Promise<RawCatalogProviderItem[]>;
}

export interface PriceProvider {
  readonly provider: string;
  fetchLatestPrices(): Promise<RawPriceProviderItem[]>;
}

