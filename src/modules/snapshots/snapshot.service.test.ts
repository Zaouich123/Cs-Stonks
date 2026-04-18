import { ItemType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { ApplicationError } from "@/lib/errors";
import { buildDailySnapshotRows } from "@/modules/snapshots/snapshot.service";

describe("snapshot.service", () => {
  it("creates deterministic snapshot rows with logical snapshot metadata", () => {
    const snapshotDate = new Date("2026-04-18T00:00:00.000Z");
    const rows = buildDailySnapshotRows(
      [
        {
          currency: "USD",
          displayName: "B",
          fetchedAt: new Date("2026-04-18T08:31:00.000Z"),
          itemId: "item_b",
          itemType: ItemType.SKIN,
          marketHashName: "B",
          marketId: "market_b",
          marketName: "Steam",
          marketSlug: "steam",
          phase: null,
          price: 42,
          quantity: 5,
          sourceUpdatedAt: new Date("2026-04-18T08:30:00.000Z"),
          variantKey: "B",
          volume: 2,
        },
        {
          currency: "USD",
          displayName: "A",
          fetchedAt: new Date("2026-04-18T08:30:00.000Z"),
          itemId: "item_a",
          itemType: ItemType.SKIN,
          marketHashName: "A",
          marketId: "market_a",
          marketName: "Steam",
          marketSlug: "steam",
          phase: null,
          price: 25,
          quantity: 8,
          sourceUpdatedAt: new Date("2026-04-18T08:29:00.000Z"),
          variantKey: "A",
          volume: 7,
        },
      ],
      snapshotDate,
      "02:05",
    );

    expect(rows).toEqual([
      {
        currency: "USD",
        itemId: "item_a",
        marketId: "market_a",
        price: 25,
        quantity: 8,
        snapshotDate,
        snapshotHour: "02:05",
        sourceFetchedAt: new Date("2026-04-18T08:30:00.000Z"),
        sourceUpdatedAt: new Date("2026-04-18T08:29:00.000Z"),
        volume: 7,
      },
      {
        currency: "USD",
        itemId: "item_b",
        marketId: "market_b",
        price: 42,
        quantity: 5,
        snapshotDate,
        snapshotHour: "02:05",
        sourceFetchedAt: new Date("2026-04-18T08:31:00.000Z"),
        sourceUpdatedAt: new Date("2026-04-18T08:30:00.000Z"),
        volume: 2,
      },
    ]);
  });

  it("rejects empty snapshots to keep the pipeline explicit", () => {
    expect(() =>
      buildDailySnapshotRows([], new Date("2026-04-18T00:00:00.000Z"), "02:05"),
    ).toThrowError(ApplicationError);
  });
});
