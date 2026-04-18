import { SyncStatus, SyncType } from "@prisma/client";

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
    const syncRun = await this.syncRunRepository.startRun({
      provider: this.provider.provider,
      syncType: SyncType.PRICES,
    });

    let totalReceived = 0;

    try {
      const rawPrices = await this.provider.fetchLatestPrices();
      totalReceived = rawPrices.length;

      const normalizedPrices = [];
      const errors: string[] = [];

      for (const rawPrice of rawPrices) {
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
      const failed = errors.length + prepared.skippedCount;
      const status = failed > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;

      await this.syncRunRepository.completeRun({
        errorSummary:
          failed > 0
            ? [...errors, ...prepared.missingItems].slice(0, 5).join(" | ")
            : undefined,
        id: syncRun.id,
        itemsFailed: failed,
        itemsProcessed: totalReceived,
        itemsSucceeded: persisted.totalPersisted,
        metadata: {
          errors,
          marketsCreated: marketWrite.created,
          marketsUpdated: marketWrite.updated,
          missingItems: prepared.missingItems,
          upsertedRows: persisted.totalPersisted,
        },
        status,
      });

      return {
        created: persisted.created,
        errors,
        failed,
        marketsCreated: marketWrite.created,
        marketsUpdated: marketWrite.updated,
        missingItems: prepared.missingItems,
        provider: this.provider.provider,
        skippedMissingItems: prepared.skippedCount,
        status,
        syncRunId: syncRun.id,
        totalPersisted: persisted.totalPersisted,
        totalReceived,
        updated: persisted.updated,
      };
    } catch (error) {
      const errorMessage = toErrorMessage(error);

      await this.syncRunRepository.failRun({
        errorSummary: errorMessage,
        id: syncRun.id,
        itemsFailed: totalReceived,
        itemsProcessed: totalReceived,
        metadata: {
          provider: this.provider.provider,
        },
      });

      throw error;
    }
  }
}

