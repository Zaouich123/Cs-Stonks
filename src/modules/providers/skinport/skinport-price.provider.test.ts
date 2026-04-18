import { describe, expect, it, vi } from "vitest";

import { SkinportPriceProvider } from "@/modules/providers/skinport/skinport-price.provider";

function createJsonResponse(data: unknown) {
  return {
    json: async () => data,
    ok: true,
    status: 200,
  } as Response;
}

describe("skinport-price.provider", () => {
  it("maps a Skinport sales history payload into internal raw prices", async () => {
    const fetchImpl = vi.fn(async () =>
      createJsonResponse([
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
          market_page: "https://skinport.com/market?item=redline",
          version: null,
        },
      ]),
    );
    const provider = new SkinportPriceProvider(
      {
        appId: 730,
        baseUrl: "https://api.skinport.test/v1",
        chunkSize: 100,
        currency: "USD",
        fetchAllSalesHistory: false,
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

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      currency: "USD",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      price: 44.1,
      volume: 12,
    });
    expect(result.summary.warnings).toEqual([]);
  });

  it("falls back to a wider window when 24h history is empty", async () => {
    const provider = new SkinportPriceProvider(
      {
        appId: 730,
        baseUrl: "https://api.skinport.test/v1",
        chunkSize: 100,
        currency: "USD",
        fetchAllSalesHistory: false,
      },
      vi.fn(async () =>
        createJsonResponse([
          {
            currency: "USD",
            item_page: "https://skinport.com/item/karambit-fade",
            last_24_hours: {
              avg: null,
              max: null,
              median: null,
              min: null,
              volume: 0,
            },
            last_30_days: {
              avg: 2418.91,
              max: 2999,
              median: 2342.41,
              min: 2130,
              volume: 14,
            },
            last_7_days: {
              avg: 2320.78,
              max: 2654.31,
              median: 2249.4,
              min: 2130,
              volume: 4,
            },
            last_90_days: {
              avg: 2374,
              max: 2999,
              median: 2360.2,
              min: 2010.33,
              volume: 44,
            },
            market_hash_name: "★ Karambit | Fade (Factory New)",
            market_page: "https://skinport.com/market?item=fade",
            version: null,
          },
        ]),
      ),
    );

    const result = await provider.fetchLatestPrices({
      items: [
        {
          displayName: "★ Karambit | Fade (Factory New)",
          itemId: "item_2",
          marketHashName: "★ Karambit | Fade (Factory New)",
          phase: null,
          slug: "karambit-fade-factory-new",
          variantKey: "★ Karambit | Fade (Factory New)",
        },
      ],
    });

    expect(result.items[0]?.price).toBe(2249.4);
    expect(result.items[0]?.volume).toBe(4);
  });

  it("returns a warning when Skinport does not return the item", async () => {
    const provider = new SkinportPriceProvider(
      {
        appId: 730,
        baseUrl: "https://api.skinport.test/v1",
        chunkSize: 100,
        currency: "USD",
        fetchAllSalesHistory: false,
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
    expect(result.summary.warnings).toHaveLength(1);
    expect(result.summary.warnings[0]?.code).toBe("ITEM_NOT_FOUND");
  });
});
