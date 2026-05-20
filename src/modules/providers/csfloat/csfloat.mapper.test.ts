import { describe, expect, it } from "vitest";

import {
  mapCsfloatPriceListRecordToAggregated,
  normalizeCsfloatListing,
} from "@/modules/providers/csfloat/csfloat.mapper";

describe("csfloat.mapper", () => {
  it("normalizes a valid CSFloat listing and converts cents to USD", () => {
    const listing = normalizeCsfloatListing(
      {
        created_at: "2026-04-18T12:30:00.000Z",
        id: "listing_1",
        item: {
          asset_id: "asset_1",
          float_value: 0.1234,
          inspect_link: "steam://inspect/abc",
          is_souvenir: false,
          is_stattrak: true,
          market_hash_name: "AK-47 | Redline (Field-Tested)",
          paint_index: 282,
          paint_seed: 42,
          wear_name: "Field-Tested",
        },
        price: 1250,
      },
      new Date("2026-04-18T12:31:00.000Z"),
    );

    expect(listing).toMatchObject({
      assetId: "asset_1",
      floatValue: 0.1234,
      id: "listing_1",
      inspectLink: "steam://inspect/abc",
      isSouvenir: false,
      isStatTrak: true,
      marketHashName: "AK-47 | Redline (Field-Tested)",
      paintIndex: 282,
      paintSeed: 42,
      price: 12.5,
      priceCents: 1250,
      wearName: "Field-Tested",
    });
    expect(listing?.createdAt?.toISOString()).toBe("2026-04-18T12:30:00.000Z");
  });

  it("ignores listings without a market hash name or usable price", () => {
    expect(
      normalizeCsfloatListing({
        item: {
          market_hash_name: "",
        },
        price: 1250,
      }),
    ).toBeNull();
    expect(
      normalizeCsfloatListing({
        item: {
          market_hash_name: "AK-47 | Redline (Field-Tested)",
        },
        price: 0,
      }),
    ).toBeNull();
  });

  it("maps CSFloat price-list rows into aggregated records", () => {
    const record = mapCsfloatPriceListRecordToAggregated(
      {
        market_hash_name: "AK-47 | Redline (Field-Tested)",
        min_price: 1250,
        quantity: 42,
      },
      new Date("2026-04-18T12:31:00.000Z"),
    );

    expect(record).toMatchObject({
      currency: "USD",
      lowestAsk: 12.5,
      lowestAskCents: 1250,
      marketHashName: "AK-47 | Redline (Field-Tested)",
      quantity: 42,
    });
  });
});
