import { ItemType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@/lib/errors";
import { ItemQueryService } from "@/modules/items/item.service";

describe("item.service", () => {
  it("lists items with pagination metadata and latest price summary", async () => {
    const repository = {
      findById: vi.fn(),
      listHistoryByItem: vi.fn(),
      listItems: vi.fn(async () => ({
        items: [
          {
            collection: "The Phoenix Collection",
            createdAt: new Date("2026-04-18T08:00:00.000Z"),
            displayName: "AK-47 | Redline (Field-Tested)",
            exterior: "Field-Tested",
            id: "item_1",
            imageUrl: null,
            isActive: true,
            itemType: ItemType.SKIN,
            latestPriceCount: 2,
            lowestCurrentPrice: 24.95,
            lowestCurrentPriceCurrency: "USD",
            marketHashName: "AK-47 | Redline (Field-Tested)",
            baseItemName: "AK-47",
            hasVariants: true,
            lastCatalogSyncAt: null,
            phase: null,
            rarity: "Classified",
            slug: "ak-47-redline-field-tested",
            source: "bymykel",
            sourceExternalId: null,
            steamAppId: 730,
            steamImageUrl: null,
            updatedAt: new Date("2026-04-18T09:00:00.000Z"),
          },
        ],
        totalItems: 1,
      })),
      listLatestPricesByItem: vi.fn(),
    };
    const service = new ItemQueryService(repository as never);

    const result = await service.listItems({
      limit: 20,
      page: 1,
      query: "ak redline",
      sort: "displayName_asc",
    });

    expect(result.pagination).toEqual({
      limit: 20,
      page: 1,
      totalItems: 1,
      totalPages: 1,
    });
    expect(result.items[0]).toMatchObject({
      displayName: "AK-47 | Redline (Field-Tested)",
      latestPriceCount: 2,
      lowestCurrentPrice: 24.95,
      lowestCurrentPriceCurrency: "USD",
    });
  });

  it("returns formatted latest prices and history for a known item", async () => {
    const repository = {
      findById: vi.fn(async () => ({
        collection: "The Phoenix Collection",
        createdAt: new Date("2026-04-18T08:00:00.000Z"),
        displayName: "AK-47 | Redline (Field-Tested)",
        exterior: "Field-Tested",
        id: "item_1",
        imageUrl: null,
        isActive: true,
        itemType: ItemType.SKIN,
        marketHashName: "AK-47 | Redline (Field-Tested)",
        phase: null,
        rarity: "Classified",
        searchText: "ak 47 redline field tested",
        skinName: "Redline",
        slug: "ak-47-redline-field-tested",
        souvenir: false,
        stattrak: false,
        source: "bymykel",
        sourceExternalId: null,
        steamAppId: 730,
        steamImageUrl: null,
        updatedAt: new Date("2026-04-18T09:00:00.000Z"),
        variantKey: "AK-47 | Redline (Field-Tested)",
        weapon: "AK-47",
      })),
      listHistoryByItem: vi.fn(async () => [
        {
          currency: "USD",
          maxPrice: 26.2,
          marketId: "market_1",
          marketName: "Steam Community Market",
          marketSlug: "steam",
          meanPrice: 25.7,
          medianPrice: 25.4,
          minPrice: 24.9,
          price: 25.4,
          quantity: 124,
          sales24hMedian: 25.1,
          sales24hMin: 24.8,
          sales24hVolume: 15,
          sales30dMedian: 24.2,
          sales30dMin: 21.4,
          sales30dVolume: 210,
          sales7dMedian: 24.8,
          sales7dMin: 23.6,
          sales7dVolume: 55,
          sales90dMedian: 23.3,
          sales90dMin: 19.1,
          sales90dVolume: 610,
          snapshotDate: new Date("2026-04-18T00:00:00.000Z"),
          snapshotHour: "02:05",
          sourceFetchedAt: new Date("2026-04-18T08:30:00.000Z"),
          sourceUpdatedAt: new Date("2026-04-18T08:29:00.000Z"),
          suggestedPrice: 25.3,
          volume: 92,
        },
      ]),
      listItems: vi.fn(),
      listLatestPricesByItem: vi.fn(async () => [
        {
          currency: "USD",
          fetchedAt: new Date("2026-04-18T08:30:00.000Z"),
          maxPrice: 26.2,
          marketId: "market_1",
          marketName: "Steam Community Market",
          marketSlug: "steam",
          meanPrice: 25.7,
          medianPrice: 25.4,
          minPrice: 24.9,
          price: 25.4,
          quantity: 124,
          sales24hMedian: 25.1,
          sales24hMin: 24.8,
          sales24hVolume: 15,
          sales30dMedian: 24.2,
          sales30dMin: 21.4,
          sales30dVolume: 210,
          sales7dMedian: 24.8,
          sales7dMin: 23.6,
          sales7dVolume: 55,
          sales90dMedian: 23.3,
          sales90dMin: 19.1,
          sales90dVolume: 610,
          sourceItemUrl: "https://steamcommunity.com/item",
          sourceMarketUrl: "https://steamcommunity.com/market",
          sourceUpdatedAt: new Date("2026-04-18T08:29:00.000Z"),
          suggestedPrice: 25.3,
          volume: 92,
        },
      ]),
    };
    const service = new ItemQueryService(repository as never);

    const latestPrices = await service.getLatestPricesByItem({
      itemId: "item_1",
      sort: "market_asc",
    });
    const history = await service.getItemHistory({
      itemId: "item_1",
      sort: "asc",
    });

    expect(latestPrices.count).toBe(1);
    expect(latestPrices.prices[0]).toMatchObject({
      marketSlug: "steam",
      price: 25.4,
      sales90dVolume: 610,
    });
    expect(history.count).toBe(1);
    expect(history.series[0]).toMatchObject({
      date: "2026-04-18",
      hour: "02:05",
      marketSlug: "steam",
      price: 25.4,
      sales24hMin: 24.8,
    });
  });

  it("throws a 404 application error when the item does not exist", async () => {
    const service = new ItemQueryService({
      findById: vi.fn(async () => null),
      listHistoryByItem: vi.fn(),
      listItems: vi.fn(),
      listLatestPricesByItem: vi.fn(),
    } as never);

    await expect(service.getItemById("missing")).rejects.toBeInstanceOf(ApplicationError);
    await expect(service.getItemById("missing")).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<ApplicationError>);
  });
});
