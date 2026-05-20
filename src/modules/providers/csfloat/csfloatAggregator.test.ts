import { describe, expect, it } from "vitest";

import { aggregateCsfloatListings } from "@/modules/providers/csfloat/csfloatAggregator";
import type { NormalizedCsfloatListing } from "@/modules/providers/csfloat/csfloat.types";

function listing(
  marketHashName: string,
  price: number,
  createdAt: string,
): NormalizedCsfloatListing {
  return {
    assetId: null,
    createdAt: new Date(createdAt),
    fetchedAt: new Date("2026-04-18T13:00:00.000Z"),
    floatValue: null,
    iconUrl: null,
    id: `${marketHashName}-${price}`,
    inspectLink: null,
    isSouvenir: false,
    isStatTrak: false,
    marketHashName,
    paintIndex: null,
    paintSeed: null,
    price,
    priceCents: Math.round(price * 100),
    rawPayload: {
      price,
    },
    sourceMarketUrl: `https://csfloat.com/search?market_hash_name=${marketHashName}`,
    wearName: null,
  };
}

describe("csfloatAggregator", () => {
  it("groups listings by market_hash_name and keeps the lowest ask", () => {
    const aggregated = aggregateCsfloatListings([
      listing("AK-47 | Redline (Field-Tested)", 12.9, "2026-04-18T12:00:00.000Z"),
      listing("AK-47 | Redline (Field-Tested)", 12.5, "2026-04-18T12:30:00.000Z"),
      listing("AWP | Dragon Lore (Factory New)", 11195.1, "2026-04-17T12:00:00.000Z"),
    ]);

    expect(aggregated).toHaveLength(2);
    expect(aggregated[0]).toMatchObject({
      lowestAsk: 12.5,
      marketHashName: "AK-47 | Redline (Field-Tested)",
      quantity: 2,
    });
    expect(aggregated[0]?.sourceUpdatedAt?.toISOString()).toBe("2026-04-18T12:30:00.000Z");
  });
});

