import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  catalogSync: vi.fn(),
  createDailySnapshot: vi.fn(),
  csfloatSync: vi.fn(),
  getHealth: vi.fn(),
  listLatestPrices: vi.fn(),
  pricesSync: vi.fn(),
  skinportSync: vi.fn(),
  skinportSyncAndSnapshot: vi.fn(),
}));

vi.mock("@/modules/bootstrap", () => ({
  createCatalogSyncService: vi.fn(() => ({
    syncCatalog: mocks.catalogSync,
  })),
  createCsfloatIngestionService: vi.fn(() => ({
    sync: mocks.csfloatSync,
  })),
  createDailySnapshotService: vi.fn(() => ({
    createDailySnapshot: mocks.createDailySnapshot,
  })),
  createHealthQueryService: vi.fn(() => ({
    getHealth: mocks.getHealth,
  })),
  createLatestPricingQueryService: vi.fn(() => ({
    listLatestPrices: mocks.listLatestPrices,
  })),
  createLatestPricingSyncService: vi.fn(() => ({
    syncLatestPrices: mocks.pricesSync,
  })),
}));

vi.mock("@/modules/pricing/skinport-daily-ingestion.service", () => ({
  SkinportDailyIngestionService: vi.fn(function SkinportDailyIngestionService() {
    return {
    syncLatestPrices: mocks.skinportSync,
    syncLatestPricesAndSnapshot: mocks.skinportSyncAndSnapshot,
    };
  }),
}));

import {
  handleCatalogRefreshImagesRoute,
  handleCatalogSyncRoute,
  handleCsfloatSyncAndSnapshotRoute,
  handleCsfloatSyncRoute,
  handleDailySnapshotRoute,
  handleHealthRoute,
  handleLatestPricesQueryRoute,
  handleLatestPricesSyncRoute,
  handleSkinportSyncAndSnapshotRoute,
  handleSkinportSyncRoute,
} from "@/modules/api/internal-handlers";

async function json(response: Response) {
  return response.json();
}

function post(body?: unknown) {
  return new Request("https://app.test/api/internal", {
    body: body === undefined ? undefined : JSON.stringify(body),
    method: "POST",
  });
}

describe("internal API handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs catalog sync and image refresh routes", async () => {
    mocks.catalogSync.mockResolvedValue({ synced: 1 });

    const sync = await handleCatalogSyncRoute(post({ source: "mock" }));
    const refresh = await handleCatalogRefreshImagesRoute(post({ source: "json" }));

    expect(sync.status).toBe(200);
    expect(refresh.status).toBe(200);
    await expect(json(sync)).resolves.toEqual({ data: { synced: 1 }, ok: true });
    expect(mocks.catalogSync).toHaveBeenCalledTimes(2);
  });

  it("runs price sync with optional provider source", async () => {
    mocks.pricesSync.mockResolvedValue({ updated: 2 });

    const response = await handleLatestPricesSyncRoute(post({ source: "mock" }));

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({ data: { updated: 2 }, ok: true });
  });

  it("creates daily snapshots from parsed body fields", async () => {
    mocks.createDailySnapshot.mockResolvedValue({ totalPersisted: 5 });

    const response = await handleDailySnapshotRoute(
      post({
        snapshotDate: "2026-05-01T00:00:00.000Z",
        snapshotHour: "09:30",
        timeZone: "Europe/Paris",
        triggerSource: "test",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.createDailySnapshot).toHaveBeenCalledWith({
      snapshotDate: new Date("2026-05-01T00:00:00.000Z"),
      snapshotHour: "09:30",
      timeZone: "Europe/Paris",
      triggerSource: "test",
    });
  });

  it("returns validation errors for invalid snapshot body", async () => {
    const response = await handleDailySnapshotRoute(post({ snapshotHour: "99:99" }));

    expect(response.status).toBe(400);
    await expect(json(response)).resolves.toMatchObject({
      error: {
        message: "Request payload validation failed.",
      },
      ok: false,
    });
  });

  it("runs Skinport sync routes", async () => {
    mocks.skinportSync.mockResolvedValue({ synced: true });
    mocks.skinportSyncAndSnapshot.mockResolvedValue({ snapshot: true });

    const sync = await handleSkinportSyncRoute();
    const both = await handleSkinportSyncAndSnapshotRoute();

    expect(sync.status).toBe(200);
    expect(both.status).toBe(200);
    await expect(json(sync)).resolves.toEqual({ data: { synced: true }, ok: true });
    await expect(json(both)).resolves.toEqual({ data: { snapshot: true }, ok: true });
  });

  it("runs CSFloat sync routes and defaults sync-and-snapshot to price-list mode", async () => {
    mocks.csfloatSync.mockResolvedValueOnce({ prices: 1 }).mockResolvedValueOnce({ prices: 2 });
    mocks.createDailySnapshot.mockResolvedValue({ snapshot: 1 });

    const sync = await handleCsfloatSyncRoute(post({ cursor: "abc", marketHashNames: ["AK-47"], mode: "targeted" }));
    const both = await handleCsfloatSyncAndSnapshotRoute(post({ marketHashNames: ["M4A4"] }));

    expect(sync.status).toBe(200);
    expect(both.status).toBe(200);
    expect(mocks.csfloatSync).toHaveBeenNthCalledWith(1, {
      cursor: "abc",
      marketHashNames: ["AK-47"],
      mode: "targeted",
    });
    expect(mocks.csfloatSync).toHaveBeenNthCalledWith(2, {
      marketHashNames: ["M4A4"],
      mode: "price-list",
    });
    await expect(json(both)).resolves.toEqual({
      data: {
        latestPrices: { prices: 2 },
        snapshot: { snapshot: 1 },
      },
      ok: true,
    });
  });

  it("queries latest prices and health", async () => {
    mocks.listLatestPrices.mockResolvedValue([{ itemId: "item-1" }]);
    mocks.getHealth.mockResolvedValue({ ok: true });

    const prices = await handleLatestPricesQueryRoute(new Request("https://app.test/api/prices?market=steam"));
    const health = await handleHealthRoute();

    expect(prices.status).toBe(200);
    expect(mocks.listLatestPrices).toHaveBeenCalledWith("steam");
    await expect(json(prices)).resolves.toEqual({
      data: {
        count: 1,
        items: [{ itemId: "item-1" }],
      },
      ok: true,
    });
    await expect(json(health)).resolves.toEqual({ data: { ok: true }, ok: true });
  });

  it("returns JSON parse errors for malformed request bodies", async () => {
    const response = await handleCatalogSyncRoute(
      new Request("https://app.test/api/internal", {
        body: "{",
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(json(response)).resolves.toMatchObject({
      error: {
        message: "Request body must contain valid JSON.",
      },
      ok: false,
    });
  });
});
