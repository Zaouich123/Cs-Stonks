import { ItemType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { PrismaLatestPriceRepository } from "@/modules/pricing/pricing.repository";
import type { LatestPriceWriteInput } from "@/modules/pricing/pricing.types";

type FakeDecimal = {
  comparedTo(other: FakeDecimal): number;
  toNumber(): number;
};

function money(value: number): FakeDecimal {
  return {
    comparedTo: (other) => value - other.toNumber(),
    toNumber: () => value,
  };
}

function writePrice(itemId: string, marketId: string, price = 10): LatestPriceWriteInput {
  return {
    currency: "EUR",
    fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
    itemId,
    marketId,
    maxPrice: 12,
    meanPrice: 10,
    medianPrice: 10,
    minPrice: 8,
    price,
    quantity: 3,
    rawPayload: { itemId },
    sales24hMedian: 9,
    sales24hMin: 8,
    sales24hVolume: 4,
    sales30dMedian: 10,
    sales30dMin: 7,
    sales30dVolume: 40,
    sales7dMedian: 10,
    sales7dMin: 8,
    sales7dVolume: 12,
    sales90dMedian: 11,
    sales90dMin: 6,
    sales90dVolume: 120,
    sourceItemUrl: "https://market.test/item",
    sourceMarketUrl: "https://market.test",
    sourceUpdatedAt: new Date("2026-05-01T09:00:00.000Z"),
    suggestedPrice: 10.5,
    volume: 5,
  };
}

describe("PrismaLatestPriceRepository", () => {
  it("counts latest prices", async () => {
    const prisma = {
      latestPrice: {
        count: vi.fn().mockResolvedValue(42),
      },
    };

    await expect(new PrismaLatestPriceRepository(prisma as never).count()).resolves.toBe(42);
  });

  it("lists latest prices and maps decimals to numbers", async () => {
    const prisma = {
      latestPrice: {
        findMany: vi.fn().mockResolvedValue([
          {
            currency: "EUR",
            fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
            item: {
              displayName: "AK-47",
              itemType: ItemType.SKIN,
              marketHashName: "AK-47",
              phase: null,
              variantKey: "ak",
            },
            itemId: "item-1",
            market: {
              id: "market-1",
              name: "Steam",
              slug: "steam",
            },
            marketId: "market-1",
            maxPrice: money(12),
            meanPrice: money(10),
            medianPrice: money(10),
            minPrice: money(8),
            price: money(9),
            quantity: 5,
            rawPayload: { ok: true },
            sales24hMedian: money(9),
            sales24hMin: money(8),
            sales24hVolume: 4,
            sales30dMedian: money(10),
            sales30dMin: money(7),
            sales30dVolume: 40,
            sales7dMedian: money(9.5),
            sales7dMin: money(8.5),
            sales7dVolume: 12,
            sales90dMedian: money(11),
            sales90dMin: money(6),
            sales90dVolume: 120,
            sourceItemUrl: null,
            sourceMarketUrl: null,
            sourceUpdatedAt: null,
            suggestedPrice: money(9.2),
            volume: 3,
          },
        ]),
      },
    };

    const rows = await new PrismaLatestPriceRepository(prisma as never).listLatestPrices("steam");

    expect(prisma.latestPrice.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        market: {
          slug: "steam",
        },
      },
    }));
    expect(rows[0]).toMatchObject({
      displayName: "AK-47",
      maxPrice: 12,
      price: 9,
      sales90dMin: 6,
      suggestedPrice: 9.2,
      variantKey: "ak",
    });
  });

  it("upserts deduped price writes and reports created and updated counts", async () => {
    const upsert = vi.fn((operation) => operation);
    const prisma = {
      $transaction: vi.fn().mockResolvedValue([]),
      latestPrice: {
        findMany: vi.fn().mockResolvedValue([{ itemId: "item-1", marketId: "market-1" }]),
        upsert,
      },
    };

    const result = await new PrismaLatestPriceRepository(prisma as never).upsertMany([
      writePrice("item-1", "market-1", 10),
      writePrice("item-2", "market-1", 12),
      writePrice("item-2", "market-1", 13),
    ]);

    expect(result).toEqual({
      created: 1,
      totalPersisted: 2,
      updated: 1,
    });
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        create: expect.objectContaining({
          itemId: "item-1",
          marketId: "market-1",
          price: 10,
        }),
        where: {
          itemId_marketId: {
            itemId: "item-1",
            marketId: "market-1",
          },
        },
      }),
      expect.objectContaining({
        create: expect.objectContaining({
          itemId: "item-2",
          marketId: "market-1",
          price: 13,
        }),
      }),
    ]);
  });

  it("short-circuits empty price writes", async () => {
    const prisma = {
      latestPrice: {
        findMany: vi.fn(),
      },
    };

    await expect(new PrismaLatestPriceRepository(prisma as never).upsertMany([])).resolves.toEqual({
      created: 0,
      totalPersisted: 0,
      updated: 0,
    });
  });
});
