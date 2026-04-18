import { SyncStatus, SyncType } from "@prisma/client";

import { logger } from "@/lib/logger";
import type { CatalogProvider } from "@/modules/providers/provider.types";
import { normalizeCatalogItem } from "@/modules/catalog/catalog.normalizer";
import type { CatalogSyncResult, ItemRepository } from "@/modules/catalog/catalog.types";
import type { SyncRunRepository } from "@/modules/sync-runs/sync-run.types";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown normalization error.";
}

export class CatalogSyncService {
  constructor(
    private readonly provider: CatalogProvider,
    private readonly itemRepository: ItemRepository,
    private readonly syncRunRepository: SyncRunRepository,
  ) {}

  async syncCatalog(): Promise<CatalogSyncResult> {
    const startedAt = Date.now();
    const syncRun = await this.syncRunRepository.startRun({
      provider: this.provider.provider,
      syncType: SyncType.CATALOG,
    });

    logger.info("Catalog sync started.", {
      provider: this.provider.provider,
    });

    let totalReceived = 0;

    try {
      const rawItems = await this.provider.fetchCatalog();
      totalReceived = rawItems.length;

      const normalizedItems = [];
      const errors: string[] = [];

      for (const rawItem of rawItems) {
        try {
          normalizedItems.push(normalizeCatalogItem(rawItem));
        } catch (error) {
          errors.push(toErrorMessage(error));
        }
      }

      const persisted = await this.itemRepository.upsertMany(normalizedItems);
      const status = errors.length > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;
      const durationMs = Date.now() - startedAt;

      await this.syncRunRepository.completeRun({
        errorSummary: errors.length > 0 ? errors.slice(0, 5).join(" | ") : undefined,
        id: syncRun.id,
        itemsFailed: errors.length,
        itemsProcessed: totalReceived,
        itemsSucceeded: persisted.totalPersisted,
        metadata: {
          created: persisted.created,
          durationMs,
          errors,
          updated: persisted.updated,
        },
        status,
      });

      const logContext = {
        durationMs,
        failed: errors.length,
        persisted: persisted.totalPersisted,
        provider: this.provider.provider,
        received: totalReceived,
      };

      if (status === SyncStatus.SUCCESS) {
        logger.info("Catalog sync completed successfully.", logContext);
      } else {
        logger.warn("Catalog sync completed with partial issues.", logContext);
      }

      return {
        created: persisted.created,
        errors,
        failed: errors.length,
        provider: this.provider.provider,
        status,
        syncRunId: syncRun.id,
        totalPersisted: persisted.totalPersisted,
        totalReceived,
        updated: persisted.updated,
      };
    } catch (error) {
      const errorMessage = toErrorMessage(error);
      const durationMs = Date.now() - startedAt;

      logger.error("Catalog sync failed.", {
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
          durationMs,
          provider: this.provider.provider,
        },
      });

      throw error;
    }
  }
}
