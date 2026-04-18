import { ItemType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { prepareLatestPriceUpserts } from "@/modules/pricing/pricing.service";

describe("pricing.service", () => {
  it("deduplicates prices by item and market and keeps the latest fetch", () => {
    const itemLookup = new Map([
      [
        "AK-47 | Redline (Field-Tested)",
        {
          displayName: "AK-47 | Redline (Field-Tested)",
          id: "item_1",
          itemType: ItemType.SKIN,
          marketHashName: "AK-47 | Redline (Field-Tested)",
          phase: null,
          variantKey: "AK-47 | Redline (Field-Tested)",
        },
      ],
    ]);
    const marketLookup = new Map([
      [
        "steam",
        {
          id: "market_1",
          name: "Steam Community Market",
          slug: "steam",
        },
      ],
    ]);

    const prepared = prepareLatestPriceUpserts(
      [
        {
          currency: "USD",
          fetchedAt: new Date("2026-04-18T08:20:00.000Z"),
          market: {
            enabled: true,
            name: "Steam Community Market",
            priority: 100,
            slug: "steam",
          },
          marketHashName: "AK-47 | Redline (Field-Tested)",
          phase: null,
          price: 24,
          quantity: 100,
          sourceUpdatedAt: new Date("2026-04-18T08:18:00.000Z"),
          variantKey: "AK-47 | Redline (Field-Tested)",
          volume: 50,
        },
        {
          currency: "USD",
          fetchedAt: new Date("2026-04-18T08:40:00.000Z"),
          market: {
            enabled: true,
            name: "Steam Community Market",
            priority: 100,
            slug: "steam",
          },
          marketHashName: "AK-47 | Redline (Field-Tested)",
          phase: null,
          price: 25.4,
          quantity: 124,
          sourceUpdatedAt: new Date("2026-04-18T08:39:00.000Z"),
          variantKey: "AK-47 | Redline (Field-Tested)",
          volume: 92,
        },
      ],
      itemLookup,
      marketLookup,
    );

    expect(prepared.missingItems).toEqual([]);
    expect(prepared.skippedCount).toBe(0);
    expect(prepared.ready).toHaveLength(1);
    expect(prepared.ready[0]).toMatchObject({
      itemId: "item_1",
      marketId: "market_1",
      price: 25.4,
      quantity: 124,
      volume: 92,
    });
  });

  it("reports unmappable items instead of persisting them", () => {
    const prepared = prepareLatestPriceUpserts(
      [
        {
          currency: "USD",
          fetchedAt: new Date("2026-04-18T08:40:00.000Z"),
          market: {
            enabled: true,
            name: "Skinport",
            priority: 80,
            slug: "skinport",
          },
          marketHashName: "Missing Item",
          phase: null,
          price: 99,
          quantity: null,
          sourceUpdatedAt: null,
          variantKey: "Missing Item",
          volume: null,
        },
      ],
      new Map(),
      new Map([
        [
          "skinport",
          {
            id: "market_2",
            name: "Skinport",
            slug: "skinport",
          },
        ],
      ]),
    );

    expect(prepared.ready).toEqual([]);
    expect(prepared.missingItems).toEqual(["Missing Item"]);
    expect(prepared.skippedCount).toBe(1);
  });
});
