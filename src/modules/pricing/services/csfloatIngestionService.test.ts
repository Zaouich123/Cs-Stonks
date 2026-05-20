import { SyncStatus, type PrismaClient } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CsfloatIngestionService } from "@/modules/pricing/services/csfloatIngestionService";
import type { NormalizedCsfloatListing } from "@/modules/providers/csfloat/csfloat.types";

function normalizedListing(marketHashName: string, price: number): NormalizedCsfloatListing {
  return {
    assetId: "asset_1",
    createdAt: new Date("2026-04-18T12:30:00.000Z"),
    fetchedAt: new Date("2026-04-18T12:31:00.000Z"),
    floatValue: 0.12,
    iconUrl: null,
    id: "listing_1",
    inspectLink: "steam://inspect/abc",
    isSouvenir: false,
    isStatTrak: false,
    marketHashName,
    paintIndex: 282,
    paintSeed: 42,
    price,
    priceCents: Math.round(price * 100),
    rawPayload: {
      id: "listing_1",
      price: Math.round(price * 100),
    },
    sourceMarketUrl: "https://csfloat.com/search?market_hash_name=ak",
    wearName: "Field-Tested",
  };
}

describe("CsfloatIngestionService", () => {
  const originalSyncEnabled = process.env.CSFLOAT_SYNC_ENABLED;

  beforeEach(() => {
    process.env.CSFLOAT_SYNC_ENABLED = "true";
  });

  afterEach(() => {
    process.env.CSFLOAT_SYNC_ENABLED = originalSyncEnabled;
    vi.restoreAllMocks();
  });

  it("maps CSFloat listings by market_hash_name and upserts LatestPrice", async () => {
    const prisma = {
      item: {
        findMany: vi.fn(async () => [
          {
            id: "item_1",
            marketHashName: "AK-47 | Redline (Field-Tested)",
            phase: null,
          },
        ]),
      },
      syncRun: {
        findFirst: vi.fn(async () => ({
          metadata: {
            nextCursor: "cursor_from_last_run",
          },
        })),
      },
    } as unknown as PrismaClient;
    const provider = {
      fetchPriceList: vi.fn(),
      fetchSweep: vi.fn(async () => ({
        listings: [
          normalizedListing("AK-47 | Redline (Field-Tested)", 12.9),
          normalizedListing("AK-47 | Redline (Field-Tested)", 12.5),
        ],
        summary: {
          cursor: "cursor_from_last_run",
          invalidListings: 0,
          listingsReceived: 2,
          nextCursor: "next_cursor",
          pagesFetched: 1,
        },
      })),
      fetchTargeted: vi.fn(),
    };
    const marketRepository = {
      count: vi.fn(),
      findBySlugs: vi.fn(),
      upsertMany: vi.fn(async () => ({
        created: 1,
        markets: [
          {
            id: "market_csfloat",
            name: "CSFloat",
            slug: "csfloat",
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
      completeRun: vi.fn(),
      count: vi.fn(),
      failRun: vi.fn(),
      startRun: vi.fn(async () => ({
        id: "sync_run_1",
      })),
    };
    const service = new CsfloatIngestionService(
      prisma,
      marketRepository,
      latestPriceRepository,
      syncRunRepository,
      provider,
    );

    const result = await service.sync({
      mode: "sweep",
    });

    expect(provider.fetchSweep).toHaveBeenCalledWith("cursor_from_last_run");
    expect(latestPriceRepository.upsertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        currency: "USD",
        itemId: "item_1",
        marketId: "market_csfloat",
        minPrice: 12.5,
        price: 12.5,
        quantity: 2,
        sourceMarketUrl: "https://csfloat.com/search?market_hash_name=ak",
        volume: 2,
      }),
    ]);
    expect(syncRunRepository.completeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sync_run_1",
        itemsProcessed: 1,
        itemsSucceeded: 1,
        status: SyncStatus.SUCCESS,
      }),
    );
    expect(result).toMatchObject({
      itemsAggregated: 1,
      itemsMapped: 1,
      itemsUpserted: 1,
      nextCursor: "next_cursor",
      status: SyncStatus.SUCCESS,
    });
  });
});
