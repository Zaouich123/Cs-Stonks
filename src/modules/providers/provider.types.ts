export const catalogProviderSources = ["bymykel", "local_fallback", "json", "mock"] as const;
export const priceProviderSources = ["json", "mock", "real", "skinport"] as const;

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
  maxPrice?: number | null;
  market: RawMarketRecord;
  marketHashName: string;
  meanPrice?: number | null;
  medianPrice?: number | null;
  minPrice?: number | null;
  phase?: string | null;
  price: number;
  quantity?: number | null;
  rawPayload?: Record<string, unknown> | null;
  sales24hMedian?: number | null;
  sales24hMin?: number | null;
  sales24hVolume?: number | null;
  sales30dMedian?: number | null;
  sales30dMin?: number | null;
  sales30dVolume?: number | null;
  sales7dMedian?: number | null;
  sales7dMin?: number | null;
  sales7dVolume?: number | null;
  sales90dMedian?: number | null;
  sales90dMin?: number | null;
  sales90dVolume?: number | null;
  sourceItemUrl?: string | null;
  sourceMarketUrl?: string | null;
  sourceUpdatedAt?: string | null;
  suggestedPrice?: number | null;
  variantKeyOverride?: string | null;
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
  matchedCanonicalCount?: number;
  matchedExactCount?: number;
  providerHistoryRecordsReceived?: number;
  providerItemsReceived?: number;
  requestedTargets: number;
  returnedRecords: number;
  skippedTargets: number;
  truncatedTargets: number;
  warningCodeCounts?: Record<string, number>;
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
