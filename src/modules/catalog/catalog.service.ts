import { SyncStatus, SyncType } from "@prisma/client";

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
    const syncRun = await this.syncRunRepository.startRun({
      provider: this.provider.provider,
      syncType: SyncType.CATALOG,
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

      await this.syncRunRepository.completeRun({
        errorSummary: errors.length > 0 ? errors.slice(0, 5).join(" | ") : undefined,
        id: syncRun.id,
        itemsFailed: errors.length,
        itemsProcessed: totalReceived,
        itemsSucceeded: persisted.totalPersisted,
        metadata: {
          created: persisted.created,
          errors,
          updated: persisted.updated,
        },
        status,
      });

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

