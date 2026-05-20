import { Prisma, SyncStatus, SyncType, type PrismaClient } from "@prisma/client";

import { ApplicationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { aggregateCsfloatListings } from "@/modules/providers/csfloat/csfloatAggregator";
import type {
  AggregatedCsfloatPriceRecord,
  CsfloatPriceListFetchResult,
  CsfloatProviderFetchResult,
  CsfloatSyncMode,
} from "@/modules/providers/csfloat/csfloat.types";
import { CSFLOAT_MARKET, CSFLOAT_PROVIDER_ID } from "@/modules/providers/csfloat/csfloat.types";
import { CsfloatListingsProvider } from "@/modules/providers/csfloat/csfloatListingsProvider";
import type {
  LatestPriceRepository,
  LatestPriceWriteInput,
  MarketLookupRepository,
} from "@/modules/pricing/pricing.types";
import type { SyncRunRepository } from "@/modules/sync-runs/sync-run.types";

export interface CsfloatSyncInput {
  cursor?: string | null;
  marketHashNames?: string[];
  mode?: CsfloatSyncMode;
}

export interface CsfloatSyncResult {
  created: number;
  cursor: string | null;
  durationMs: number;
  invalidListings: number;
  itemsAggregated: number;
  itemsFailed: number;
  itemsIgnored: number;
  itemsMapped: number;
  itemsUpserted: number;
  listingsReceived: number;
  mode: CsfloatSyncMode;
  nextCursor: string | null;
  pagesFetched: number;
  provider: typeof CSFLOAT_PROVIDER_ID;
  status: SyncStatus;
  syncRunId: string;
  updated: number;
  unmappedMarketHashNames: string[];
}

export interface CsfloatListingsProviderLike {
  fetchPriceList(): Promise<CsfloatPriceListFetchResult>;
  fetchSweep(cursor?: string | null): Promise<CsfloatProviderFetchResult>;
  fetchTargeted(marketHashNames: string[]): Promise<CsfloatProviderFetchResult>;
}

interface ResolvedItem {
  id: string;
  marketHashName: string;
  phase: string | null;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown CSFloat ingestion error.";
}

function asJsonObject(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readCursorFromMetadata(metadata: Prisma.JsonValue | null) {
  const object = asJsonObject(metadata);
  const value = object?.nextCursor;

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function pickItemByMarketHashName(items: ResolvedItem[]) {
  const grouped = new Map<string, ResolvedItem>();

  for (const item of items) {
    const current = grouped.get(item.marketHashName);

    if (!current || (current.phase !== null && item.phase === null)) {
      grouped.set(item.marketHashName, item);
    }
  }

  return grouped;
}

function buildRawPayload(
  record: AggregatedCsfloatPriceRecord,
  mode: CsfloatSyncMode,
) {
  return {
    fetchedAt: record.fetchedAt.toISOString(),
    listingIds: record.listingIds.slice(0, 25),
    lowestAskCents: record.lowestAskCents,
    mode,
    provider: CSFLOAT_PROVIDER_ID,
    rawSample: record.rawSample,
    sourceUpdatedAt: record.sourceUpdatedAt?.toISOString() ?? null,
  };
}

export class CsfloatIngestionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly marketRepository: MarketLookupRepository,
    private readonly latestPriceRepository: LatestPriceRepository,
    private readonly syncRunRepository: SyncRunRepository,
    private readonly provider: CsfloatListingsProviderLike = new CsfloatListingsProvider(),
  ) {}

  async sync(input: CsfloatSyncInput = {}): Promise<CsfloatSyncResult> {
    if (process.env.CSFLOAT_SYNC_ENABLED === "false") {
      throw new ApplicationError("CSFloat sync is disabled by CSFLOAT_SYNC_ENABLED=false.", 400);
    }

    const startedAt = Date.now();
    const mode = input.mode ?? "price-list";

    if (mode === "targeted" && process.env.CSFLOAT_TARGETED_REFRESH_ENABLED === "false") {
      throw new ApplicationError(
        "CSFloat targeted refresh is disabled by CSFLOAT_TARGETED_REFRESH_ENABLED=false.",
        400,
      );
    }

    const targetNames = [...new Set((input.marketHashNames ?? []).map((name) => name.trim()).filter(Boolean))];

    if (mode === "targeted" && targetNames.length === 0) {
      throw new ApplicationError("CSFloat targeted sync requires at least one marketHashName.", 400);
    }

    const cursor = mode === "sweep" ? input.cursor ?? (await this.readLastCursor()) : null;
    const syncRun = await this.syncRunRepository.startRun({
      metadata: {
        cursor,
        mode,
        targetCount: targetNames.length,
      },
      provider: CSFLOAT_PROVIDER_ID,
      syncType: SyncType.PRICES,
    });

    logger.info("CSFloat ingestion started.", {
      cursor,
      mode,
      targetCount: targetNames.length,
    });

    try {
      const fetched = await this.fetchAggregatedRecords(mode, targetNames, cursor);
      const aggregated = fetched.aggregated;
      const market = await this.ensureMarket();
      const itemLookup = await this.resolveItemsByMarketHashName(
        aggregated.map((record) => record.marketHashName),
      );
      const ready: LatestPriceWriteInput[] = [];
      const unmappedMarketHashNames: string[] = [];

      for (const record of aggregated) {
        const item = itemLookup.get(record.marketHashName);

        if (!item) {
          unmappedMarketHashNames.push(record.marketHashName);
          continue;
        }

        ready.push({
          currency: record.currency,
          fetchedAt: record.fetchedAt,
          itemId: item.id,
          marketId: market.id,
          maxPrice: null,
          meanPrice: null,
          medianPrice: null,
          minPrice: record.lowestAsk,
          price: record.lowestAsk,
          quantity: record.quantity,
          rawPayload: buildRawPayload(record, mode),
          sales24hMedian: null,
          sales24hMin: null,
          sales24hVolume: null,
          sales30dMedian: null,
          sales30dMin: null,
          sales30dVolume: null,
          sales7dMedian: null,
          sales7dMin: null,
          sales7dVolume: null,
          sales90dMedian: null,
          sales90dMin: null,
          sales90dVolume: null,
          sourceItemUrl: null,
          sourceMarketUrl: record.sourceMarketUrl,
          sourceUpdatedAt: record.sourceUpdatedAt,
          suggestedPrice: null,
          volume: record.quantity,
        });
      }

      const persisted = await this.latestPriceRepository.upsertMany(ready);
      const itemsIgnored = unmappedMarketHashNames.length + fetched.invalidRows;
      const itemsFailed = itemsIgnored;
      const status = itemsFailed > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;
      const durationMs = Date.now() - startedAt;

      await this.syncRunRepository.completeRun({
        errorSummary:
          unmappedMarketHashNames.length > 0
            ? `Unmapped CSFloat items: ${unmappedMarketHashNames.slice(0, 5).join(" | ")}`
            : undefined,
        id: syncRun.id,
        itemsFailed,
        itemsProcessed: aggregated.length,
        itemsSucceeded: persisted.totalPersisted,
        metadata: {
          cursor: fetched.cursor,
          durationMs,
          invalidListings: fetched.invalidRows,
          itemsAggregated: aggregated.length,
          itemsMapped: ready.length,
          listingsReceived: fetched.receivedRows,
          mode,
          nextCursor: fetched.nextCursor,
          pagesFetched: fetched.pagesFetched,
          targetCount: targetNames.length,
          unmappedMarketHashNames: unmappedMarketHashNames.slice(0, 100),
          upsertedRows: persisted.totalPersisted,
        },
        status,
      });

      logger.info("CSFloat ingestion completed.", {
        durationMs,
        invalidListings: fetched.invalidRows,
        itemsAggregated: aggregated.length,
        itemsMapped: ready.length,
        listingsReceived: fetched.receivedRows,
        mode,
        nextCursor: fetched.nextCursor,
        status,
      });

      return {
        created: persisted.created,
        cursor: fetched.cursor,
        durationMs,
        invalidListings: fetched.invalidRows,
        itemsAggregated: aggregated.length,
        itemsFailed,
        itemsIgnored,
        itemsMapped: ready.length,
        itemsUpserted: persisted.totalPersisted,
        listingsReceived: fetched.receivedRows,
        mode,
        nextCursor: fetched.nextCursor,
        pagesFetched: fetched.pagesFetched,
        provider: CSFLOAT_PROVIDER_ID,
        status,
        syncRunId: syncRun.id,
        updated: persisted.updated,
        unmappedMarketHashNames,
      };
    } catch (error) {
      const errorMessage = toErrorMessage(error);
      const durationMs = Date.now() - startedAt;

      logger.error("CSFloat ingestion failed.", {
        durationMs,
        error: errorMessage,
        mode,
      });

      await this.syncRunRepository.failRun({
        errorSummary: errorMessage,
        id: syncRun.id,
        itemsFailed: 0,
        itemsProcessed: 0,
        metadata: {
          cursor,
          durationMs,
          mode,
          targetCount: targetNames.length,
        },
      });

      throw error;
    }
  }

  private async ensureMarket() {
    const result = await this.marketRepository.upsertMany([CSFLOAT_MARKET]);
    const market = result.markets.find((item) => item.slug === CSFLOAT_MARKET.slug);

    if (!market) {
      throw new ApplicationError("Unable to resolve CSFloat market after upsert.", 500);
    }

    return market;
  }

  private async fetchAggregatedRecords(
    mode: CsfloatSyncMode,
    targetNames: string[],
    cursor: string | null,
  ): Promise<{
    aggregated: AggregatedCsfloatPriceRecord[];
    cursor: string | null;
    invalidRows: number;
    nextCursor: string | null;
    pagesFetched: number;
    receivedRows: number;
  }> {
    if (mode === "price-list") {
      const result = await this.provider.fetchPriceList();

      return {
        aggregated: result.records,
        cursor: null,
        invalidRows: result.summary.invalidRecords,
        nextCursor: null,
        pagesFetched: 1,
        receivedRows: result.summary.recordsReceived,
      };
    }

    const result =
      mode === "targeted"
        ? await this.provider.fetchTargeted(targetNames)
        : await this.provider.fetchSweep(cursor);

    return {
      aggregated: aggregateCsfloatListings(result.listings),
      cursor: result.summary.cursor,
      invalidRows: result.summary.invalidListings,
      nextCursor: result.summary.nextCursor,
      pagesFetched: result.summary.pagesFetched,
      receivedRows: result.summary.listingsReceived,
    };
  }

  private async resolveItemsByMarketHashName(marketHashNames: string[]) {
    const uniqueNames = [...new Set(marketHashNames)];

    if (uniqueNames.length === 0) {
      return new Map<string, ResolvedItem>();
    }

    const items = await this.prisma.item.findMany({
      orderBy: [
        {
          displayName: "asc",
        },
      ],
      select: {
        id: true,
        marketHashName: true,
        phase: true,
      },
      where: {
        isActive: true,
        marketHashName: {
          in: uniqueNames,
        },
      },
    });

    return pickItemByMarketHashName(items);
  }

  private async readLastCursor() {
    const lastRun = await this.prisma.syncRun.findFirst({
      orderBy: {
        startedAt: "desc",
      },
      select: {
        metadata: true,
      },
      where: {
        provider: CSFLOAT_PROVIDER_ID,
        status: {
          in: [SyncStatus.SUCCESS, SyncStatus.PARTIAL],
        },
        syncType: SyncType.PRICES,
      },
    });

    return readCursorFromMetadata(lastRun?.metadata ?? null);
  }
}
