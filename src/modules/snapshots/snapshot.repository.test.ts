import { describe, expect, it, vi } from "vitest";

import { PrismaSnapshotRepository } from "@/modules/snapshots/snapshot.repository";
import type { DailySnapshotRowInput } from "@/modules/snapshots/snapshot.types";

function row(itemId: string, marketId: string): DailySnapshotRowInput {
  return {
    currency: "EUR",
    itemId,
    marketId,
    maxPrice: 12,
    meanPrice: 10,
    medianPrice: 10,
    minPrice: 8,
    price: 9,
    quantity: 4,
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
    snapshotDate: new Date("2026-05-01T00:00:00.000Z"),
    snapshotHour: "02:05",
    suggestedPrice: 9.5,
    sourceFetchedAt: new Date("2026-05-01T10:00:00.000Z"),
    sourceUpdatedAt: null,
    volume: 5,
  };
}

describe("PrismaSnapshotRepository", () => {
  it("counts snapshots", async () => {
    const prisma = {
      dailySnapshot: {
        count: vi.fn().mockResolvedValue(12),
      },
    };

    await expect(new PrismaSnapshotRepository(prisma as never).count()).resolves.toBe(12);
  });

  it("short-circuits empty snapshot writes", async () => {
    await expect(new PrismaSnapshotRepository({ dailySnapshot: {} } as never).upsertMany([])).resolves.toEqual({
      created: 0,
      replacedExisting: false,
      rowsWritten: 0,
      snapshotDate: "",
      snapshotHour: "",
      updated: 0,
    });
  });

  it("upserts snapshots and reports created versus updated rows", async () => {
    const upsert = vi.fn((operation) => operation);
    const existingDate = new Date("2026-05-01T00:00:00.000Z");
    const prisma = {
      $transaction: vi.fn().mockResolvedValue([]),
      dailySnapshot: {
        findMany: vi.fn().mockResolvedValue([
          {
            itemId: "item-1",
            marketId: "market-1",
            snapshotDate: existingDate,
            snapshotHour: "02:05",
          },
        ]),
        upsert,
      },
    };

    const result = await new PrismaSnapshotRepository(prisma as never).upsertMany([
      row("item-1", "market-1"),
      row("item-2", "market-1"),
    ]);

    expect(result).toEqual({
      created: 1,
      replacedExisting: true,
      rowsWritten: 2,
      snapshotDate: "2026-05-01",
      snapshotHour: "02:05",
      updated: 1,
    });
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        create: expect.objectContaining({ itemId: "item-1", marketId: "market-1" }),
        where: {
          snapshotDate_snapshotHour_itemId_marketId: {
            itemId: "item-1",
            marketId: "market-1",
            snapshotDate: existingDate,
            snapshotHour: "02:05",
          },
        },
      }),
      expect.objectContaining({
        create: expect.objectContaining({ itemId: "item-2", marketId: "market-1" }),
      }),
    ]);
  });
});
