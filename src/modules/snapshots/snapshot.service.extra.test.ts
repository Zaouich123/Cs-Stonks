import { SyncStatus, SyncType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@/lib/errors";
import {
  DEFAULT_SNAPSHOT_HOUR,
  DailySnapshotService,
  buildDailySnapshotRows,
} from "@/modules/snapshots/snapshot.service";
import type { LatestPriceRow } from "@/modules/pricing/pricing.types";

function latestPrice(itemId: string, marketId: string): LatestPriceRow {
  return {
    currency: "EUR",
    displayName: "AK-47",
    fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
    itemId,
    itemType: "SKIN",
    marketHashName: "AK-47",
    marketId,
    marketName: "Steam",
    marketSlug: "steam",
    maxPrice: 12,
    meanPrice: 10,
    medianPrice: 10,
    minPrice: 8,
    phase: null,
    price: 9,
    quantity: 4,
    rawPayload: null,
    sales24hMedian: 9,
    sales24hMin: 8,
    sales24hVolume: 3,
    sales30dMedian: 10,
    sales30dMin: 7,
    sales30dVolume: 30,
    sales7dMedian: 9,
    sales7dMin: 8,
    sales7dVolume: 12,
    sales90dMedian: 11,
    sales90dMin: 6,
    sales90dVolume: 90,
    sourceItemUrl: null,
    sourceMarketUrl: null,
    sourceUpdatedAt: null,
    suggestedPrice: 9.5,
    variantKey: "ak",
    volume: 5,
  };
}

describe("DailySnapshotService extras", () => {
  it("builds sorted daily snapshot rows and rejects empty latest prices", () => {
    const snapshotDate = new Date("2026-05-01T00:00:00.000Z");

    const rows = buildDailySnapshotRows(
      [latestPrice("item-2", "market-1"), latestPrice("item-1", "market-1")],
      snapshotDate,
      DEFAULT_SNAPSHOT_HOUR,
    );

    expect(rows.map((row) => row.itemId)).toEqual(["item-1", "item-2"]);
    expect(rows[0]).toMatchObject({
      currency: "EUR",
      price: 9,
      snapshotDate,
      snapshotHour: DEFAULT_SNAPSHOT_HOUR,
      sourceFetchedAt: new Date("2026-05-01T10:00:00.000Z"),
    });
    expect(() => buildDailySnapshotRows([], snapshotDate, DEFAULT_SNAPSHOT_HOUR)).toThrow(ApplicationError);
  });

  it("creates daily snapshots and completes the sync run", async () => {
    const latestPriceRepository = {
      listLatestPrices: vi.fn().mockResolvedValue([latestPrice("item-1", "market-1")]),
    };
    const snapshotRepository = {
      upsertMany: vi.fn().mockResolvedValue({
        created: 1,
        replacedExisting: false,
        rowsWritten: 1,
        snapshotDate: "2026-05-01",
        snapshotHour: "09:30",
        updated: 0,
      }),
    };
    const syncRunRepository = {
      completeRun: vi.fn(),
      failRun: vi.fn(),
      startRun: vi.fn().mockResolvedValue({ id: "run-1" }),
    };

    const result = await new DailySnapshotService(
      latestPriceRepository as never,
      snapshotRepository as never,
      syncRunRepository as never,
    ).createDailySnapshot({
      snapshotDate: new Date("2026-05-01T15:00:00.000Z"),
      snapshotHour: "09:30",
      timeZone: "UTC",
      triggerSource: "test",
    });

    expect(syncRunRepository.startRun).toHaveBeenCalledWith({
      provider: "test",
      syncType: SyncType.SNAPSHOT,
    });
    expect(snapshotRepository.upsertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        itemId: "item-1",
        snapshotDate: new Date("2026-05-01T00:00:00.000Z"),
        snapshotHour: "09:30",
      }),
    ]);
    expect(syncRunRepository.completeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "run-1",
        itemsFailed: 0,
        itemsProcessed: 1,
        itemsSucceeded: 1,
        status: SyncStatus.SUCCESS,
      }),
    );
    expect(result).toEqual({
      created: 1,
      replacedExisting: false,
      rowsWritten: 1,
      snapshotDate: "2026-05-01",
      snapshotHour: "09:30",
      status: SyncStatus.SUCCESS,
      syncRunId: "run-1",
      updated: 0,
    });
  });

  it("fails the sync run when snapshot creation throws", async () => {
    const syncRunRepository = {
      completeRun: vi.fn(),
      failRun: vi.fn(),
      startRun: vi.fn().mockResolvedValue({ id: "run-1" }),
    };
    const service = new DailySnapshotService(
      {
        listLatestPrices: vi.fn().mockResolvedValue([]),
      } as never,
      {
        upsertMany: vi.fn(),
      } as never,
      syncRunRepository as never,
    );

    await expect(service.createDailySnapshot({ triggerSource: "manual" })).rejects.toBeInstanceOf(ApplicationError);
    expect(syncRunRepository.failRun).toHaveBeenCalledWith(
      expect.objectContaining({
        errorSummary: "Cannot create a daily snapshot without latest prices.",
        id: "run-1",
        itemsFailed: 0,
        itemsProcessed: 0,
      }),
    );
  });
});
