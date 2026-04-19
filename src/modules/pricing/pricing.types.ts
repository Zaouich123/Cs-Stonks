import type { ItemType, SyncStatus } from "@prisma/client";

import type { ItemLookup } from "@/modules/catalog/catalog.types";
import type {
  MarketLookup,
  MarketRepository,
  MarketWriteResult,
  NormalizedMarket,
} from "@/modules/markets/market.types";
import type {
  PriceProviderWarning,
  PriceSyncTargetItem,
} from "@/modules/providers/provider.types";

export interface NormalizedLatestPrice {
  currency: string;
  fetchedAt: Date;
  maxPrice: number | null;
  market: NormalizedMarket;
  marketHashName: string;
  meanPrice: number | null;
  medianPrice: number | null;
  minPrice: number | null;
  phase: string | null;
  price: number;
  quantity: number | null;
  rawPayload: Record<string, unknown> | null;
  sales24hMedian: number | null;
  sales24hMin: number | null;
  sales24hVolume: number | null;
  sales30dMedian: number | null;
  sales30dMin: number | null;
  sales30dVolume: number | null;
  sales7dMedian: number | null;
  sales7dMin: number | null;
  sales7dVolume: number | null;
  sales90dMedian: number | null;
  sales90dMin: number | null;
  sales90dVolume: number | null;
  sourceItemUrl: string | null;
  sourceMarketUrl: string | null;
  sourceUpdatedAt: Date | null;
  suggestedPrice: number | null;
  variantKey: string;
  volume: number | null;
}

export interface LatestPriceWriteInput {
  currency: string;
  fetchedAt: Date;
  itemId: string;
  marketId: string;
  maxPrice: number | null;
  meanPrice: number | null;
  medianPrice: number | null;
  minPrice: number | null;
  price: number;
  quantity: number | null;
  rawPayload: Record<string, unknown> | null;
  sales24hMedian: number | null;
  sales24hMin: number | null;
  sales24hVolume: number | null;
  sales30dMedian: number | null;
  sales30dMin: number | null;
  sales30dVolume: number | null;
  sales7dMedian: number | null;
  sales7dMin: number | null;
  sales7dVolume: number | null;
  sales90dMedian: number | null;
  sales90dMin: number | null;
  sales90dVolume: number | null;
  sourceItemUrl: string | null;
  sourceMarketUrl: string | null;
  sourceUpdatedAt: Date | null;
  suggestedPrice: number | null;
  volume: number | null;
}

export interface LatestPriceRow {
  currency: string;
  displayName: string;
  fetchedAt: Date;
  itemId: string;
  itemType: ItemType;
  maxPrice: number | null;
  marketHashName: string;
  marketId: string;
  marketName: string;
  marketSlug: string;
  meanPrice: number | null;
  medianPrice: number | null;
  minPrice: number | null;
  phase: string | null;
  price: number;
  quantity: number | null;
  rawPayload: Record<string, unknown> | null;
  sales24hMedian: number | null;
  sales24hMin: number | null;
  sales24hVolume: number | null;
  sales30dMedian: number | null;
  sales30dMin: number | null;
  sales30dVolume: number | null;
  sales7dMedian: number | null;
  sales7dMin: number | null;
  sales7dVolume: number | null;
  sales90dMedian: number | null;
  sales90dMin: number | null;
  sales90dVolume: number | null;
  sourceItemUrl: string | null;
  sourceMarketUrl: string | null;
  sourceUpdatedAt: Date | null;
  suggestedPrice: number | null;
  variantKey: string;
  volume: number | null;
}

export interface LatestPriceWriteResult {
  created: number;
  totalPersisted: number;
  updated: number;
}

export interface LatestPricingSyncResult {
  created: number;
  durationMs: number;
  errors: string[];
  failed: number;
  invalidRows: number;
  marketsCreated: number;
  marketsUpdated: number;
  missingItems: string[];
  provider: string;
  providerHistoryRecordsReceived: number;
  providerItemsReceived: number;
  providerWarningCodeCounts: Record<string, number>;
  providerWarnings: PriceProviderWarning[];
  requestedTargets: number;
  skippedMissingItems: number;
  status: SyncStatus;
  syncRunId: string;
  totalAttemptedTargets: number;
  totalIgnored: number;
  totalMapped: number;
  totalPersisted: number;
  totalReceived: number;
  updated: number;
}

export interface LatestPriceRepository {
  count(): Promise<number>;
  listLatestPrices(marketSlug?: string): Promise<LatestPriceRow[]>;
  upsertMany(prices: LatestPriceWriteInput[]): Promise<LatestPriceWriteResult>;
}

export interface LatestPricePreparationResult {
  missingItems: string[];
  ready: LatestPriceWriteInput[];
  skippedCount: number;
}

export interface ItemLookupRepository {
  findByVariantKeys(keys: string[]): Promise<Map<string, ItemLookup>>;
  listPriceSyncTargets(): Promise<PriceSyncTargetItem[]>;
}

export interface MarketLookupRepository extends MarketRepository {
  findBySlugs(slugs: string[]): Promise<Map<string, MarketLookup>>;
  upsertMany(markets: NormalizedMarket[]): Promise<MarketWriteResult>;
}
