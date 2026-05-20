export const CSFLOAT_MARKET = {
  enabled: true,
  name: "CSFloat",
  priority: 70,
  slug: "csfloat",
} as const;

export const CSFLOAT_PROVIDER_ID = "csfloat_listings";

export type CsfloatSyncMode = "price-list" | "sweep" | "targeted";

export interface CsfloatClientConfig {
  apiKey: string;
  backoffMs: number;
  baseUrl: string;
  currency: "USD";
  limit: number;
  maxRetries: number;
  requestTimeoutMs: number;
}

export interface CsfloatListingsQuery {
  category?: string;
  cursor?: string | null;
  limit?: number;
  marketHashName?: string;
  maxPrice?: number;
  minPrice?: number;
  sortBy?: string;
  type?: string;
}

export interface CsfloatListingItem {
  asset_id?: string | null;
  collection?: string | null;
  def_index?: number | null;
  float_value?: number | null;
  icon_url?: string | null;
  inspect_link?: string | null;
  is_souvenir?: boolean | null;
  is_stattrak?: boolean | null;
  item_name?: string | null;
  market_hash_name?: string | null;
  paint_index?: number | null;
  paint_seed?: number | null;
  quality?: number | string | null;
  rarity?: number | string | null;
  scm?: unknown;
  stickers?: unknown;
  wear_name?: string | null;
}

export interface CsfloatListing {
  created_at?: string | null;
  id?: string | null;
  item?: CsfloatListingItem | null;
  max_offer_discount?: number | null;
  min_offer_price?: number | null;
  price?: number | null;
  state?: string | null;
  type?: string | null;
}

export interface CsfloatPriceListRecord {
  market_hash_name?: string | null;
  min_price?: number | null;
  quantity?: number | null;
}

export interface CsfloatListingsResponse {
  cursor: string | null;
  listings: CsfloatListing[];
}

export interface NormalizedCsfloatListing {
  assetId: string | null;
  createdAt: Date | null;
  fetchedAt: Date;
  floatValue: number | null;
  iconUrl: string | null;
  id: string;
  inspectLink: string | null;
  isSouvenir: boolean;
  isStatTrak: boolean;
  marketHashName: string;
  paintIndex: number | null;
  paintSeed: number | null;
  price: number;
  priceCents: number;
  rawPayload: Record<string, unknown>;
  sourceMarketUrl: string;
  wearName: string | null;
}

export interface AggregatedCsfloatPriceRecord {
  currency: "USD";
  fetchedAt: Date;
  listingIds: string[];
  lowestAsk: number;
  lowestAskCents: number;
  marketHashName: string;
  quantity: number;
  rawSample: Record<string, unknown>;
  sourceMarketUrl: string;
  sourceUpdatedAt: Date | null;
}

export interface CsfloatFetchSummary {
  cursor: string | null;
  invalidListings: number;
  listingsReceived: number;
  nextCursor: string | null;
  pagesFetched: number;
}

export interface CsfloatProviderFetchResult {
  listings: NormalizedCsfloatListing[];
  summary: CsfloatFetchSummary;
}

export interface CsfloatPriceListFetchResult {
  records: AggregatedCsfloatPriceRecord[];
  summary: {
    invalidRecords: number;
    recordsReceived: number;
  };
}

export interface CsfloatListingsProviderConfig {
  delayMs: number;
  limit: number;
  maxPagesPerRun: number;
}
