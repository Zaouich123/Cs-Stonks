import { ItemType, SyncStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  LatestPricingSyncService,
  prepareLatestPriceUpserts,
} from "@/modules/pricing/pricing.service";

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

  it("returns a rich partial summary when provider warnings and missing items occur", async () => {
    const provider = {
      fetchLatestPrices: vi.fn(async () => ({
        items: [
          {
            currency: "USD",
            fetchedAt: "2026-04-18T08:40:00.000Z",
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
            sourceUpdatedAt: "2026-04-18T08:39:00.000Z",
            volume: 92,
          },
          {
            currency: "USD",
            fetchedAt: "2026-04-18T08:41:00.000Z",
            market: {
              enabled: true,
              name: "Steam Community Market",
              priority: 100,
              slug: "steam",
            },
            marketHashName: "Missing Item",
            phase: null,
            price: 99,
            quantity: null,
            sourceUpdatedAt: null,
            volume: null,
          },
        ],
        summary: {
          attemptedTargets: 2,
          providerHistoryRecordsReceived: 0,
          providerItemsReceived: 2,
          requestedTargets: 2,
          returnedRecords: 2,
          skippedTargets: 1,
          truncatedTargets: 4,
          warningCodeCounts: {
            NO_ACTIVE_LISTING: 1,
          },
          warnings: [
            {
              code: "NO_ACTIVE_LISTING",
              marketHashName: "AWP | Asiimov (Battle-Scarred)",
              message: "No active listing found.",
              variantKey: "AWP | Asiimov (Battle-Scarred)",
            },
          ],
        },
      })),
      provider: "csfloat_price_provider",
    };
    const itemRepository = {
      findByVariantKeys: vi.fn(async () =>
        new Map([
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
        ]),
      ),
      listPriceSyncTargets: vi.fn(async () => [
        {
          displayName: "AK-47 | Redline (Field-Tested)",
          itemId: "item_1",
          marketHashName: "AK-47 | Redline (Field-Tested)",
          phase: null,
          slug: "ak-47-redline-field-tested",
          variantKey: "AK-47 | Redline (Field-Tested)",
        },
        {
          displayName: "Missing Item",
          itemId: "item_missing",
          marketHashName: "Missing Item",
          phase: null,
          slug: "missing-item",
          variantKey: "Missing Item",
        },
      ]),
    };
    const marketRepository = {
      count: vi.fn(),
      findBySlugs: vi.fn(async () =>
        new Map([
          [
            "steam",
            {
              id: "market_1",
              name: "Steam Community Market",
              slug: "steam",
            },
          ],
        ]),
      ),
      upsertMany: vi.fn(async () => ({
        created: 1,
        markets: [
          {
            id: "market_1",
            name: "Steam Community Market",
            slug: "steam",
          },
        ],
        totalPersisted: 1,
        updated: 0,
      })),
    };
    const latestPriceRepository = {
      count: vi.fn(),
      listLatestPrices: vi.fn(),
      upsertMany: vi.fn(async () => ({
        created: 1,
        totalPersisted: 1,
        updated: 0,
      })),
    };
    const syncRunRepository = {
      completeRun: vi.fn(async () => undefined),
      count: vi.fn(),
      failRun: vi.fn(async () => undefined),
      startRun: vi.fn(async () => ({
        id: "sync_run_1",
      })),
    };

    const service = new LatestPricingSyncService(
      provider,
      itemRepository,
      marketRepository,
      latestPriceRepository,
      syncRunRepository,
    );

    const result = await service.syncLatestPrices();

    expect(result.status).toBe(SyncStatus.PARTIAL);
    expect(result.totalMapped).toBe(2);
    expect(result.totalIgnored).toBe(2);
    expect(result.failed).toBe(2);
    expect(result.providerWarningCodeCounts).toEqual({
      NO_ACTIVE_LISTING: 1,
    });
    expect(result.skippedMissingItems).toBe(1);
    expect(result.providerWarnings).toHaveLength(1);
    expect(result.totalPersisted).toBe(1);
    expect(syncRunRepository.completeRun).toHaveBeenCalledOnce();
  });
});
