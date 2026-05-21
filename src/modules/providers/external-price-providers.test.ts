import { describe, expect, it, vi } from "vitest";

import { DmarketPriceProvider } from "@/modules/providers/dmarket/dmarket-price.provider";
import type { PriceSyncTargetItem } from "@/modules/providers/provider.types";
import { WaxpeerPriceProvider } from "@/modules/providers/waxpeer/waxpeer-price.provider";
import { WhiteMarketPriceProvider } from "@/modules/providers/white-market/white-market-price.provider";

function createJsonResponse(data: unknown) {
  return {
    json: async () => data,
    ok: true,
    status: 200,
  } as Response;
}

const redlineTarget: PriceSyncTargetItem = {
  displayName: "AK-47 | Redline (Field-Tested)",
  itemId: "item_redline",
  marketHashName: "AK-47 | Redline (Field-Tested)",
  phase: null,
  slug: "ak-47-redline-field-tested",
  variantKey: "AK-47 | Redline (Field-Tested)",
};

describe("external price providers", () => {
  it("maps DMarket aggregated offer prices from cents", async () => {
    const fetchImpl = vi.fn(async () =>
      createJsonResponse({
        aggregatedPrices: [
          {
            offerBestPrice: {
              Amount: "1250",
              Currency: "USD",
            },
            offerCount: "7",
            orderBestPrice: {
              Amount: "1100",
              Currency: "USD",
            },
            orderCount: "4",
            title: "AK-47 | Redline (Field-Tested)",
          },
        ],
      }),
    );
    const provider = new DmarketPriceProvider(
      {
        baseUrl: "https://api.dmarket.test",
        batchSize: 100,
        currency: "USD",
        delayMs: 0,
        gameId: "a8db",
        requestTimeoutMs: 5000,
      },
      fetchImpl,
    );

    const result = await provider.fetchLatestPrices({
      items: [redlineTarget],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      price: 12.5,
      quantity: 7,
      suggestedPrice: 11,
      variantKeyOverride: "AK-47 | Redline (Field-Tested)",
    });
    expect(result.summary.warnings).toEqual([]);
  });

  it("maps WAXPEER min prices from milli-USD values", async () => {
    const provider = new WaxpeerPriceProvider(
      {
        baseUrl: "https://api.waxpeer.test/v1/prices",
        currency: "USD",
        game: "csgo",
        requestTimeoutMs: 5000,
      },
      vi.fn(async () =>
        createJsonResponse({
          items: [
            {
              count: 12,
              img: "https://cdn.example.test/redline.png",
              min: 12990,
              name: "AK-47 | Redline (Field-Tested)",
              steam_price: 16000,
            },
          ],
          success: true,
        }),
      ),
    );

    const result = await provider.fetchLatestPrices({
      items: [redlineTarget],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      price: 12.99,
      quantity: 12,
      suggestedPrice: 16,
    });
  });

  it("maps white.market export prices as decimal values", async () => {
    const provider = new WhiteMarketPriceProvider(
      {
        currency: "USD",
        exportUrl: "https://export.white.market.test/v1/prices/730.json",
        requestTimeoutMs: 5000,
      },
      vi.fn(async () =>
        createJsonResponse([
          {
            market_hash_name: "AK-47 | Redline (Field-Tested)",
            market_product_count: 4,
            market_product_link: "https://white.market/item?appId=730&nameHash=AK-47",
            price: "12.750",
          },
        ]),
      ),
    );

    const result = await provider.fetchLatestPrices({
      items: [redlineTarget],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      price: 12.75,
      quantity: 4,
    });
  });

});
