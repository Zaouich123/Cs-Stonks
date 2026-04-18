import { describe, expect, it, vi } from "vitest";

import { SteamPriceProvider } from "@/modules/providers/steam/steam-price.provider";

describe("steam-price.provider", () => {
  it("maps a Steam overview payload into the internal raw price format", async () => {
    const client = {
      getPriceOverview: vi.fn(async () => ({
        lowest_price: "$46.93 USD",
        success: true,
        volume: "123",
      })),
    };
    const provider = new SteamPriceProvider(
      {
        appId: 730,
        baseUrl: "https://steamcommunity.com/market/",
        concurrency: 1,
        country: "US",
        currencyCode: 1,
        maxItems: null,
        retryCount: 0,
        timeoutMs: 100,
      },
      client as never,
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

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      phase: null,
      price: 46.93,
      volume: 123,
    });
    expect(result.summary.warnings).toEqual([]);
  });

  it("returns a warning instead of crashing when Steam has no public price", async () => {
    const client = {
      getPriceOverview: vi.fn(async () => ({
        success: false,
      })),
    };
    const provider = new SteamPriceProvider(
      {
        appId: 730,
        baseUrl: "https://steamcommunity.com/market/",
        concurrency: 1,
        country: "US",
        currencyCode: 1,
        maxItems: null,
        retryCount: 0,
        timeoutMs: 100,
      },
      client as never,
    );

    const result = await provider.fetchLatestPrices({
      items: [
        {
          displayName: "Missing Item",
          itemId: "item_missing",
          marketHashName: "Missing Item",
          phase: "Phase 2",
          slug: "missing-item",
          variantKey: "Missing Item::Phase 2",
        },
      ],
    });

    expect(result.items).toEqual([]);
    expect(result.summary.warnings).toHaveLength(1);
    expect(result.summary.warnings[0].code).toBe("NO_ACTIVE_PRICE");
  });
});
