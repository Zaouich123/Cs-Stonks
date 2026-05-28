import { ItemType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { PrismaItemReadRepository } from "@/modules/items/item.repository";

function money(value: number) {
  return {
    comparedTo: (other: ReturnType<typeof money>) => value - other.toNumber(),
    toNumber: () => value,
  };
}

function priceRow(overrides = {}) {
  return {
    currency: "EUR",
    fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
    market: {
      id: "market-1",
      name: "Steam",
      slug: "steam",
    },
    maxPrice: money(12),
    meanPrice: money(10),
    medianPrice: money(10),
    minPrice: money(8),
    price: money(9),
    quantity: 5,
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
    sourceFetchedAt: new Date("2026-05-01T10:00:00.000Z"),
    sourceItemUrl: null,
    sourceMarketUrl: null,
    sourceUpdatedAt: null,
    suggestedPrice: money(9.2),
    volume: 3,
    ...overrides,
  };
}

describe("PrismaItemReadRepository", () => {
  it("lists active items with search filters, pagination, and lowest price", async () => {
    const prisma = {
      item: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            _count: {
              latestPrices: 2,
            },
            baseItemName: "AK-47 | Redline",
            collection: "Phoenix",
            createdAt: new Date("2026-05-01T10:00:00.000Z"),
            displayName: "AK-47 | Redline (Field-Tested)",
            exterior: "Field-Tested",
            hasVariants: false,
            id: "item-1",
            imageUrl: null,
            isActive: true,
            itemType: ItemType.SKIN,
            lastCatalogSyncAt: null,
            latestPrices: [
              { currency: "EUR", price: money(25) },
              { currency: "USD", price: money(20) },
            ],
            marketHashName: "AK-47 | Redline (Field-Tested)",
            phase: null,
            rarity: "Classified",
            slug: "ak-47-redline-field-tested",
            source: "mock",
            sourceExternalId: "external-1",
            steamAppId: 730,
            steamImageUrl: "steam-image",
            updatedAt: new Date("2026-05-01T11:00:00.000Z"),
          },
        ]),
      },
    };

    const result = await new PrismaItemReadRepository(prisma as never).listItems({
      itemType: ItemType.SKIN,
      limit: 10,
      page: 2,
      query: "AK Redline",
      sort: "createdAt_desc",
    });

    expect(prisma.item.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ createdAt: "desc" }, { displayName: "asc" }],
      skip: 10,
      take: 10,
      where: {
        AND: [
          { isActive: true },
          { itemType: ItemType.SKIN },
          { searchText: { contains: "ak" } },
          { searchText: { contains: "redline" } },
        ],
      },
    }));
    expect(result.totalItems).toBe(1);
    expect(result.items[0]).toMatchObject({
      latestPriceCount: 2,
      lowestCurrentPrice: 20,
      lowestCurrentPriceCurrency: "USD",
    });
  });

  it("finds item details by id", async () => {
    const prisma = {
      item: {
        findUnique: vi.fn().mockResolvedValue({ id: "item-1" }),
      },
    };

    await expect(new PrismaItemReadRepository(prisma as never).findById("item-1")).resolves.toEqual({
      id: "item-1",
    });
    expect(prisma.item.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: "item-1",
      },
    }));
  });

  it.each([
    ["market_desc", [{ market: { slug: "desc" } }, { fetchedAt: "desc" }]],
    ["price_asc", [{ price: "asc" }, { market: { slug: "asc" } }]],
    ["price_desc", [{ price: "desc" }, { market: { slug: "asc" } }]],
    ["fetchedAt_desc", [{ fetchedAt: "desc" }, { market: { slug: "asc" } }]],
    ["market_asc", [{ market: { slug: "asc" } }, { fetchedAt: "desc" }]],
  ] as const)("lists latest prices sorted by %s", async (sort, orderBy) => {
    const prisma = {
      latestPrice: {
        findMany: vi.fn().mockResolvedValue([priceRow()]),
      },
    };

    const prices = await new PrismaItemReadRepository(prisma as never).listLatestPricesByItem({
      itemId: "item-1",
      sort,
    });

    expect(prisma.latestPrice.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy,
      where: {
        itemId: "item-1",
      },
    }));
    expect(prices[0]).toMatchObject({
      maxPrice: 12,
      marketSlug: "steam",
      price: 9,
      suggestedPrice: 9.2,
    });
  });

  it("lists historical snapshots with optional market and date filters", async () => {
    const prisma = {
      dailySnapshot: {
        findMany: vi.fn().mockResolvedValue([
          {
            ...priceRow(),
            currency: "EUR",
            market: {
              id: "market-1",
              name: "Steam",
              slug: "steam",
            },
            snapshotDate: new Date("2026-05-01T00:00:00.000Z"),
            snapshotHour: 10,
          },
        ]),
      },
    };
    const from = new Date("2026-05-01T00:00:00.000Z");
    const to = new Date("2026-05-02T00:00:00.000Z");

    const history = await new PrismaItemReadRepository(prisma as never).listHistoryByItem({
      from,
      itemId: "item-1",
      market: "steam",
      sort: "desc",
      to,
    });

    expect(prisma.dailySnapshot.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ snapshotDate: "desc" }, { snapshotHour: "desc" }, { market: { slug: "asc" } }],
      where: {
        itemId: "item-1",
        market: {
          slug: "steam",
        },
        snapshotDate: {
          gte: from,
          lte: to,
        },
      },
    }));
    expect(history[0]).toMatchObject({
      marketSlug: "steam",
      price: 9,
      snapshotHour: 10,
    });
  });
});
