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
  market: NormalizedMarket;
  marketHashName: string;
  phase: string | null;
  price: number;
  quantity: number | null;
  sourceUpdatedAt: Date | null;
  variantKey: string;
  volume: number | null;
}

export interface LatestPriceWriteInput {
  currency: string;
  fetchedAt: Date;
  itemId: string;
  marketId: string;
  price: number;
  quantity: number | null;
  sourceUpdatedAt: Date | null;
  volume: number | null;
}

export interface LatestPriceRow {
  currency: string;
  displayName: string;
  fetchedAt: Date;
  itemId: string;
  itemType: ItemType;
  marketHashName: string;
  marketId: string;
  marketName: string;
  marketSlug: string;
  phase: string | null;
  price: number;
  quantity: number | null;
  sourceUpdatedAt: Date | null;
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
