export const catalogProviderSources = ["bymykel", "local_fallback", "json", "mock"] as const;
export const priceProviderSources = ["json", "mock", "real"] as const;

export type CatalogProviderSource = (typeof catalogProviderSources)[number];
export type PriceProviderSource = (typeof priceProviderSources)[number];

export interface PriceSyncTargetItem {
  displayName: string;
  itemId: string;
  marketHashName: string;
  phase: string | null;
  slug: string;
  variantKey: string;
}

export interface RawCatalogProviderItem {
  baseItemName?: string | null;
  collection?: string | null;
  displayName?: string | null;
  exterior?: string | null;
  hasVariants?: boolean | null;
  imageUrl?: string | null;
  itemType: string;
  lastCatalogSyncAt?: string | null;
  marketHashName: string;
  phase?: string | null;
  rarity?: string | null;
  skinName?: string | null;
  source?: string | null;
  sourceExternalId?: string | null;
  souvenir?: boolean | null;
  stattrak?: boolean | null;
  steamAppId?: number | null;
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

export interface PriceProviderWarning {
  code: string;
  marketHashName?: string;
  message: string;
  variantKey?: string;
}

export interface PriceProviderFetchInput {
  items: PriceSyncTargetItem[];
}

export interface PriceProviderFetchSummary {
  attemptedTargets: number;
  requestedTargets: number;
  returnedRecords: number;
  skippedTargets: number;
  truncatedTargets: number;
  warnings: PriceProviderWarning[];
}

export interface PriceProviderFetchResult {
  items: RawPriceProviderItem[];
  summary: PriceProviderFetchSummary;
}

export interface CatalogProvider {
  readonly provider: string;
  fetchCatalog(): Promise<RawCatalogProviderItem[]>;
}

export interface PriceProvider {
  readonly provider: string;
  fetchLatestPrices(input: PriceProviderFetchInput): Promise<PriceProviderFetchResult>;
}

export function isPriceProviderSource(value: string): value is PriceProviderSource {
  return priceProviderSources.includes(value as PriceProviderSource);
}

export function isCatalogProviderSource(value: string): value is CatalogProviderSource {
  return catalogProviderSources.includes(value as CatalogProviderSource);
}

export function resolveCatalogProviderSource(
  value?: string | null,
  fallback: CatalogProviderSource = "bymykel",
): CatalogProviderSource {
  if (!value) {
    return fallback;
  }

  return isCatalogProviderSource(value) ? value : fallback;
}

export function resolvePriceProviderSource(
  value?: string | null,
  fallback: PriceProviderSource = "json",
): PriceProviderSource {
  if (!value) {
    return fallback;
  }

  return isPriceProviderSource(value) ? value : fallback;
}
