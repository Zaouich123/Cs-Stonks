import { ItemType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { LatestPricingQueryService } from "@/modules/pricing/pricing.query.service";
import type { LatestPriceRepository, LatestPriceRow } from "@/modules/pricing/pricing.types";

describe("LatestPricingQueryService", () => {
  it("maps latest price rows to API DTOs with ISO dates", async () => {
    const row: LatestPriceRow = {
      currency: "EUR",
      displayName: "AK-47 | Redline (Field-Tested)",
      fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
      itemId: "item-1",
      itemType: ItemType.SKIN,
      marketHashName: "AK-47 | Redline (Field-Tested)",
      marketId: "market-1",
      marketName: "Steam",
      marketSlug: "steam",
      maxPrice: 28,
      meanPrice: 25,
      medianPrice: 24,
      minPrice: 20,
      phase: null,
      price: 24.5,
      quantity: 42,
      rawPayload: { source: "fixture" },
      sales24hMedian: 24.4,
      sales24hMin: 23.7,
      sales24hVolume: 11,
      sales30dMedian: 23.6,
      sales30dMin: 20.2,
      sales30dVolume: 300,
      sales7dMedian: 24.1,
      sales7dMin: 22.9,
      sales7dVolume: 80,
      sales90dMedian: 22.8,
      sales90dMin: 18.5,
      sales90dVolume: 900,
      sourceItemUrl: "https://steam.test/item",
      sourceMarketUrl: "https://steam.test",
      sourceUpdatedAt: new Date("2026-05-01T09:58:00.000Z"),
      suggestedPrice: 24.9,
      variantKey: "AK-47 | Redline (Field-Tested)",
      volume: 100,
    };
    const repository: LatestPriceRepository = {
      count: vi.fn(),
      listLatestPrices: vi.fn().mockResolvedValue([row]),
      upsertMany: vi.fn(),
    };

    const prices = await new LatestPricingQueryService(repository).listLatestPrices("steam");

    expect(repository.listLatestPrices).toHaveBeenCalledWith("steam");
    expect(prices).toEqual([
      {
        ...row,
        fetchedAt: "2026-05-01T10:00:00.000Z",
        sourceUpdatedAt: "2026-05-01T09:58:00.000Z",
      },
    ]);
  });

  it("keeps null source update dates as null", async () => {
    const repository: LatestPriceRepository = {
      count: vi.fn(),
      listLatestPrices: vi.fn().mockResolvedValue([
        {
          currency: "USD",
          displayName: "Sticker",
          fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
          itemId: "item-2",
          itemType: ItemType.STICKER,
          marketHashName: "Sticker",
          marketId: "market-2",
          marketName: "CSFloat",
          marketSlug: "csfloat",
          maxPrice: null,
          meanPrice: null,
          medianPrice: null,
          minPrice: null,
          phase: null,
          price: 1.25,
          quantity: null,
          rawPayload: null,
          sales24hMedian: null,
          sales24hMin: null,
          sales24hVolume: null,
          sales30dMedian: null,
          sales30dMin: null,
          sales30dVolume: null,
          sales7dMedian: null,
          sales7dMin: null,
          sales7dVolume: null,
          sales90dMedian: null,
          sales90dMin: null,
          sales90dVolume: null,
          sourceItemUrl: null,
          sourceMarketUrl: null,
          sourceUpdatedAt: null,
          suggestedPrice: null,
          variantKey: "Sticker",
          volume: null,
        } satisfies LatestPriceRow,
      ]),
      upsertMany: vi.fn(),
    };

    await expect(new LatestPricingQueryService(repository).listLatestPrices()).resolves.toMatchObject([
      {
        fetchedAt: "2026-05-01T10:00:00.000Z",
        sourceUpdatedAt: null,
      },
    ]);
  });
});
