import { SyncStatus, SyncType } from "@prisma/client";

import { logger } from "@/lib/logger";
import type { ItemLookupRepository } from "@/modules/pricing/pricing.types";
import { dedupeLatestPrices, normalizeLatestPrice } from "@/modules/pricing/pricing.normalizer";
import type {
  LatestPricePreparationResult,
  LatestPriceRepository,
  LatestPricingSyncResult,
  MarketLookupRepository,
  NormalizedLatestPrice,
} from "@/modules/pricing/pricing.types";
import type { PriceProvider } from "@/modules/providers/provider.types";
import type { SyncRunRepository } from "@/modules/sync-runs/sync-run.types";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown price normalization error.";
}

export function prepareLatestPriceUpserts(
  normalizedPrices: NormalizedLatestPrice[],
  itemLookup: Awaited<ReturnType<ItemLookupRepository["findByVariantKeys"]>>,
  marketLookup: Awaited<ReturnType<MarketLookupRepository["findBySlugs"]>>,
): LatestPricePreparationResult {
  const ready = [];
  const missingItems = new Set<string>();
  let skippedCount = 0;

  for (const price of dedupeLatestPrices(normalizedPrices)) {
    const item = itemLookup.get(price.variantKey);
    const market = marketLookup.get(price.market.slug);

    if (!item || !market) {
      skippedCount += 1;

      if (!item) {
        missingItems.add(price.variantKey);
      }

      continue;
    }

    ready.push({
      currency: price.currency,
      fetchedAt: price.fetchedAt,
      itemId: item.id,
      marketId: market.id,
      price: price.price,
      quantity: price.quantity,
      sourceUpdatedAt: price.sourceUpdatedAt,
      volume: price.volume,
    });
  }

  return {
    missingItems: [...missingItems].sort(),
    ready,
    skippedCount,
  };
}

export class LatestPricingSyncService {
  constructor(
    private readonly provider: PriceProvider,
    private readonly itemRepository: ItemLookupRepository,
    private readonly marketRepository: MarketLookupRepository,
    private readonly latestPriceRepository: LatestPriceRepository,
    private readonly syncRunRepository: SyncRunRepository,
  ) {}

  async syncLatestPrices(): Promise<LatestPricingSyncResult> {
    const startedAt = Date.now();
    const targets = await this.itemRepository.listPriceSyncTargets();
    const syncRun = await this.syncRunRepository.startRun({
      metadata: {
        requestedTargets: targets.length,
      },
      provider: this.provider.provider,
      syncType: SyncType.PRICES,
    });

    logger.info("Latest prices sync started.", {
      provider: this.provider.provider,
      requestedTargets: targets.length,
    });

    let attemptedTargets = 0;
    let totalReceived = 0;
    let providerWarnings: LatestPricingSyncResult["providerWarnings"] = [];

    try {
      const fetchResult = await this.provider.fetchLatestPrices({
        items: targets,
      });
      attemptedTargets = fetchResult.summary.attemptedTargets;
      totalReceived = fetchResult.summary.returnedRecords;
      providerWarnings = fetchResult.summary.warnings;

      logger.info("Latest prices provider fetch completed.", {
        attemptedTargets,
        provider: this.provider.provider,
        receivedRecords: totalReceived,
        skippedTargets: fetchResult.summary.skippedTargets,
        truncatedTargets: fetchResult.summary.truncatedTargets,
        warnings: providerWarnings.length,
      });

      const normalizedPrices = [];
      const errors: string[] = [];

      for (const rawPrice of fetchResult.items) {
        try {
          normalizedPrices.push(normalizeLatestPrice(rawPrice));
        } catch (error) {
          errors.push(toErrorMessage(error));
        }
      }

      const marketWrite = await this.marketRepository.upsertMany(
        normalizedPrices.map((price) => price.market),
      );
      const itemLookup = await this.itemRepository.findByVariantKeys(
        normalizedPrices.map((price) => price.variantKey),
      );
      const marketLookup = await this.marketRepository.findBySlugs(
        normalizedPrices.map((price) => price.market.slug),
      );
      const prepared = prepareLatestPriceUpserts(normalizedPrices, itemLookup, marketLookup);
      const persisted = await this.latestPriceRepository.upsertMany(prepared.ready);
      const invalidRows = errors.length;
      const totalIgnored =
        prepared.skippedCount +
        fetchResult.summary.skippedTargets +
        fetchResult.summary.truncatedTargets;
      const failed = invalidRows + totalIgnored;
      const status = failed > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;
      const durationMs = Date.now() - startedAt;
      const errorSummaryParts = [
        ...errors,
        ...prepared.missingItems,
        ...providerWarnings.map((warning) => warning.message),
      ];

      await this.syncRunRepository.completeRun({
        errorSummary: errorSummaryParts.length > 0 ? errorSummaryParts.slice(0, 5).join(" | ") : undefined,
        id: syncRun.id,
        itemsFailed: failed,
        itemsProcessed: totalReceived,
        itemsSucceeded: persisted.totalPersisted,
        metadata: {
          durationMs,
          errors,
          invalidRows,
          marketsCreated: marketWrite.created,
          marketsUpdated: marketWrite.updated,
          missingItems: prepared.missingItems,
          providerSummary: fetchResult.summary,
          totalIgnored,
          totalMapped: normalizedPrices.length,
          upsertedRows: persisted.totalPersisted,
        },
        status,
      });

      const logContext = {
        durationMs,
        failed,
        invalidRows,
        mapped: normalizedPrices.length,
        persisted: persisted.totalPersisted,
        provider: this.provider.provider,
        received: totalReceived,
        skipped: totalIgnored,
      };

      if (status === SyncStatus.SUCCESS) {
        logger.info("Latest prices sync completed successfully.", logContext);
      } else {
        logger.warn("Latest prices sync completed with partial issues.", logContext);
      }

      return {
        created: persisted.created,
        durationMs,
        errors,
        failed,
        invalidRows,
        marketsCreated: marketWrite.created,
        marketsUpdated: marketWrite.updated,
        missingItems: prepared.missingItems,
        provider: this.provider.provider,
        providerWarnings,
        requestedTargets: targets.length,
        skippedMissingItems: prepared.skippedCount,
        status,
        syncRunId: syncRun.id,
        totalAttemptedTargets: attemptedTargets,
        totalIgnored,
        totalMapped: normalizedPrices.length,
        totalPersisted: persisted.totalPersisted,
        totalReceived,
        updated: persisted.updated,
      };
    } catch (error) {
      const errorMessage = toErrorMessage(error);
      const durationMs = Date.now() - startedAt;

      logger.error("Latest prices sync failed.", {
        durationMs,
        error: errorMessage,
        provider: this.provider.provider,
        received: totalReceived,
      });

      await this.syncRunRepository.failRun({
        errorSummary: errorMessage,
        id: syncRun.id,
        itemsFailed: totalReceived,
        itemsProcessed: totalReceived,
        metadata: {
          attemptedTargets,
          durationMs,
          provider: this.provider.provider,
          requestedTargets: targets.length,
          warnings: providerWarnings,
        },
      });

      throw error;
    }
  }
}
