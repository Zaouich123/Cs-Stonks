import { SyncStatus, SyncType } from "@prisma/client";

import { assertSnapshotHour, startOfDayInTimeZone } from "@/lib/date";
import { ApplicationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { LatestPriceRepository } from "@/modules/pricing/pricing.types";
import type { SyncRunRepository } from "@/modules/sync-runs/sync-run.types";
import type {
  CreateDailySnapshotInput,
  DailySnapshotRowInput,
  DailySnapshotWriteResult,
  LatestPriceSnapshotRows,
  SnapshotRepository,
} from "@/modules/snapshots/snapshot.types";

export const DEFAULT_SNAPSHOT_HOUR = "02:05";
export const DEFAULT_SNAPSHOT_TIMEZONE = "Europe/Paris";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown snapshot error.";
}

export function buildDailySnapshotRows(
  latestPrices: LatestPriceSnapshotRows,
  snapshotDate: Date,
  snapshotHour: string,
): DailySnapshotRowInput[] {
  if (latestPrices.length === 0) {
    throw new ApplicationError("Cannot create a daily snapshot without latest prices.", 400);
  }

  return latestPrices
    .map((price) => ({
      currency: price.currency,
      itemId: price.itemId,
      marketId: price.marketId,
      price: price.price,
      quantity: price.quantity,
      snapshotDate,
      snapshotHour,
      sourceFetchedAt: price.fetchedAt,
      sourceUpdatedAt: price.sourceUpdatedAt,
      volume: price.volume,
    }))
    .sort((left, right) =>
      `${left.itemId}:${left.marketId}`.localeCompare(`${right.itemId}:${right.marketId}`),
    );
}

export class DailySnapshotService {
  constructor(
    private readonly latestPriceRepository: LatestPriceRepository,
    private readonly snapshotRepository: SnapshotRepository,
    private readonly syncRunRepository: SyncRunRepository,
  ) {}

  async createDailySnapshot(
    input: CreateDailySnapshotInput = {},
  ): Promise<DailySnapshotWriteResult> {
    const startedAt = Date.now();
    const syncRun = await this.syncRunRepository.startRun({
      provider: input.triggerSource ?? "daily_snapshot_job",
      syncType: SyncType.SNAPSHOT,
    });

    logger.info("Daily snapshot sync started.", {
      triggerSource: input.triggerSource ?? "daily_snapshot_job",
    });

    try {
      const timeZone = input.timeZone ?? DEFAULT_SNAPSHOT_TIMEZONE;
      const snapshotHour = assertSnapshotHour(input.snapshotHour ?? DEFAULT_SNAPSHOT_HOUR);
      const latestPrices = await this.latestPriceRepository.listLatestPrices();
      const snapshotDate = startOfDayInTimeZone(input.snapshotDate ?? new Date(), timeZone);
      const rows = buildDailySnapshotRows(latestPrices, snapshotDate, snapshotHour);
      const persisted = await this.snapshotRepository.upsertMany(rows);
      const durationMs = Date.now() - startedAt;

      await this.syncRunRepository.completeRun({
        id: syncRun.id,
        itemsFailed: 0,
        itemsProcessed: latestPrices.length,
        itemsSucceeded: persisted.rowsWritten,
        metadata: {
          durationMs,
          replacedExisting: persisted.replacedExisting,
          snapshotDate: persisted.snapshotDate,
          snapshotHour: persisted.snapshotHour,
          timeZone,
        },
        status: SyncStatus.SUCCESS,
      });

      logger.info("Daily snapshot sync completed successfully.", {
        durationMs,
        replacedExisting: persisted.replacedExisting,
        rowsWritten: persisted.rowsWritten,
        snapshotDate: persisted.snapshotDate,
        snapshotHour: persisted.snapshotHour,
      });

      return {
        created: persisted.created,
        replacedExisting: persisted.replacedExisting,
        rowsWritten: persisted.rowsWritten,
        snapshotDate: persisted.snapshotDate,
        snapshotHour: persisted.snapshotHour,
        status: SyncStatus.SUCCESS,
        syncRunId: syncRun.id,
        updated: persisted.updated,
      };
    } catch (error) {
      const errorMessage = toErrorMessage(error);
      const durationMs = Date.now() - startedAt;

      logger.error("Daily snapshot sync failed.", {
        durationMs,
        error: errorMessage,
        triggerSource: input.triggerSource ?? "daily_snapshot_job",
      });

      await this.syncRunRepository.failRun({
        errorSummary: errorMessage,
        id: syncRun.id,
        itemsFailed: 0,
        itemsProcessed: 0,
        metadata: {
          durationMs,
          triggerSource: input.triggerSource ?? "daily_snapshot_job",
        },
      });

      throw error;
    }
  }
}
