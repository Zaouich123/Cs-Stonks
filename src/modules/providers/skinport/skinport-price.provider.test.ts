import { describe, expect, it, vi } from "vitest";

import { chooseSkinportChartPrice } from "@/modules/pricing/utils/chooseSkinportChartPrice";
import { SkinportPriceProvider } from "@/modules/providers/skinport/skinport-price.provider";

function createJsonResponse(data: unknown) {
  return {
    json: async () => data,
    ok: true,
    status: 200,
  } as Response;
}

describe("chooseSkinportChartPrice", () => {
  it("prefers median price from /v1/items", () => {
    const chosen = chooseSkinportChartPrice(
      {
        created_at: 1,
        currency: "USD",
        item_page: "https://skinport.com/item/ak-redline",
        market_hash_name: "AK-47 | Redline (Field-Tested)",
        market_page: "https://skinport.com/market/ak-redline",
        max_price: 46,
        mean_price: 44.5,
        median_price: 44.1,
        min_price: 42.7,
        quantity: 12,
        suggested_price: 44.2,
        updated_at: 2,
      },
      null,
    );

    expect(chosen).toEqual({
      price: 44.1,
      source: "items.median_price",
    });
  });

  it("falls back to history when item prices are missing", () => {
    const chosen = chooseSkinportChartPrice(
      {
        created_at: 1,
        currency: "USD",
        item_page: "https://skinport.com/item/karambit-fade",
        market_hash_name: "\u2605 Karambit | Fade (Factory New)",
        market_page: "https://skinport.com/market/karambit-fade",
        max_price: null,
        mean_price: null,
        median_price: null,
        min_price: null,
        quantity: 0,
        suggested_price: null,
        updated_at: 2,
      },
      {
        currency: "USD",
        item_page: "https://skinport.com/item/karambit-fade",
        last_24_hours: { avg: null, max: null, median: null, min: null, volume: 0 },
        last_30_days: { avg: 2418.91, max: 2999, median: 2342.41, min: 2130, volume: 14 },
        last_7_days: { avg: 2320.78, max: 2654.31, median: 2249.4, min: 2130, volume: 4 },
        last_90_days: { avg: 2374, max: 2999, median: 2360.2, min: 2010.33, volume: 44 },
        market_hash_name: "\u2605 Karambit | Fade (Factory New)",
        market_page: "https://skinport.com/market/karambit-fade",
        version: null,
      },
    );

    expect(chosen).toEqual({
      price: 2249.4,
      source: "history.last_7_days.median",
    });
  });
});

describe("skinport-price.provider", () => {
  it("maps Skinport /v1/items into internal raw prices and enriches with history", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/items?")) {
        return createJsonResponse([
          {
            created_at: 1713400000,
            currency: "USD",
            item_page: "https://skinport.com/item/ak-redline",
            market_hash_name: "AK-47 | Redline (Field-Tested)",
            market_page: "https://skinport.com/market/ak-redline",
            max_price: 46,
            mean_price: 44.5,
            median_price: 44.1,
            min_price: 42.7,
            quantity: 12,
            suggested_price: 44.2,
            updated_at: 1713403600,
          },
        ]);
      }

      return createJsonResponse([
        {
          currency: "USD",
          item_page: "https://skinport.com/item/ak-redline",
          last_24_hours: {
            avg: 44.25,
            max: 45,
            median: 44.1,
            min: 43.8,
            volume: 12,
          },
          last_30_days: {
            avg: 43,
            max: 47,
            median: 43.2,
            min: 40,
            volume: 220,
          },
          last_7_days: {
            avg: 43.9,
            max: 46.5,
            median: 44,
            min: 42.8,
            volume: 48,
          },
          last_90_days: {
            avg: 42.5,
            max: 48,
            median: 42.9,
            min: 39.5,
            volume: 580,
          },
          market_hash_name: "AK-47 | Redline (Field-Tested)",
          market_page: "https://skinport.com/market/ak-redline",
          version: null,
        },
      ]);
    });
    const provider = new SkinportPriceProvider(
      {
        appId: 730,
        baseUrl: "https://api.skinport.test/v1",
        chunkSize: 100,
        currency: "USD",
        fetchAllSalesHistory: true,
        fetchSalesHistory: true,
        requestTimeoutMs: 5000,
        tradableOnly: false,
      },
      fetchImpl,
    );

    const result = await provider.fetchLatestPrices({
      items: [
        {
          displayName: "AK-47 | Redline (Field-Tested)",
          itemId: "item_1",
          marketHashName: "AK-47 | Redline (Field-Tested)",
          phase: null,
          slug: "ak-47-redline-field-tested",
          variantKey: "AK-47 | Redline (Field-Tested)",
        },
      ],
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.summary.providerItemsReceived).toBe(1);
    expect(result.summary.providerHistoryRecordsReceived).toBe(1);
    expect(result.summary.warningCodeCounts).toEqual({});
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      currency: "USD",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      medianPrice: 44.1,
      price: 44.1,
      quantity: 12,
      sales24hMin: 43.8,
      sales24hMedian: 44.1,
      sales24hVolume: 12,
      sales7dMin: 42.8,
      sales7dMedian: 44,
      sales7dVolume: 48,
      sales30dMin: 40,
      sales30dMedian: 43.2,
      sales30dVolume: 220,
      sales90dMin: 39.5,
      sales90dMedian: 42.9,
      sales90dVolume: 580,
      sourceItemUrl: "https://skinport.com/item/ak-redline",
      sourceMarketUrl: "https://skinport.com/market/ak-redline",
      suggestedPrice: 44.2,
      volume: 12,
    });
    expect(result.summary.warnings).toEqual([]);
  });

  it("returns ITEM_NOT_FOUND warnings for tracked items not present in /v1/items", async () => {
    const provider = new SkinportPriceProvider(
      {
        appId: 730,
        baseUrl: "https://api.skinport.test/v1",
        chunkSize: 100,
        currency: "USD",
        fetchAllSalesHistory: true,
        fetchSalesHistory: false,
        requestTimeoutMs: 5000,
        tradableOnly: false,
      },
      vi.fn(async () => createJsonResponse([])),
    );

    const result = await provider.fetchLatestPrices({
      items: [
        {
          displayName: "Missing Item",
          itemId: "item_missing",
          marketHashName: "Missing Item",
          phase: null,
          slug: "missing-item",
          variantKey: "Missing Item",
        },
      ],
    });

    expect(result.items).toEqual([]);
    expect(result.summary.providerItemsReceived).toBe(0);
    expect(result.summary.warningCodeCounts).toEqual({
      ITEM_NOT_FOUND: 1,
    });
    expect(result.summary.warnings).toHaveLength(1);
    expect(result.summary.warnings[0]?.code).toBe("ITEM_NOT_FOUND");
  });

  it("falls back to canonical matching when Skinport casing differs from the catalog", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/items?")) {
        return createJsonResponse([
          {
            created_at: 1713400000,
            currency: "USD",
            item_page: "https://skinport.com/item/volt",
            market_hash_name: "Sticker | volt (Glitter) | Shanghai 2024",
            market_page: "https://skinport.com/market/volt",
            max_price: 1.55,
            mean_price: 1.42,
            median_price: 1.38,
            min_price: 1.31,
            quantity: 9,
            suggested_price: 1.4,
            updated_at: 1713403600,
          },
        ]);
      }

      return createJsonResponse([]);
    });

    const provider = new SkinportPriceProvider(
      {
        appId: 730,
        baseUrl: "https://api.skinport.test/v1",
        chunkSize: 100,
        currency: "USD",
        fetchAllSalesHistory: false,
        fetchSalesHistory: false,
        requestTimeoutMs: 5000,
        tradableOnly: false,
      },
      fetchImpl,
    );

    const result = await provider.fetchLatestPrices({
      items: [
        {
          displayName: "Sticker | Volt (Glitter) | Shanghai 2024",
          itemId: "item_volt",
          marketHashName: "Sticker | Volt (Glitter) | Shanghai 2024",
          phase: null,
          slug: "sticker-volt-glitter-shanghai-2024",
          variantKey: "Sticker | Volt (Glitter) | Shanghai 2024",
        },
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(result.summary.matchedCanonicalCount).toBe(1);
    expect(result.summary.matchedExactCount).toBe(0);
    expect(result.items[0]).toMatchObject({
      marketHashName: "Sticker | Volt (Glitter) | Shanghai 2024",
      price: 1.38,
      variantKeyOverride: "Sticker | Volt (Glitter) | Shanghai 2024",
    });
    expect(result.summary.warnings).toEqual([]);
  });
});
