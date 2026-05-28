import { ItemType, SyncStatus, SyncType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { CatalogSyncService } from "@/modules/catalog/catalog.service";

function rawCatalogItem(name: string, overrides = {}) {
  return {
    collection: "Phoenix",
    exterior: "Field-Tested",
    iconUrl: "https://cdn.test/icon.png",
    imageUrl: null,
    itemType: ItemType.SKIN,
    marketHashName: name,
    marketName: name,
    name,
    phase: null,
    rarity: "Classified",
    source: "mock",
    sourceExternalId: name,
    steamAppId: 730,
    ...overrides,
  };
}

describe("CatalogSyncService", () => {
  it("syncs catalog items, deactivates missing variants, and completes the run", async () => {
    const provider = {
      fetchCatalog: vi.fn().mockResolvedValue([
        rawCatalogItem("AK-47 | Redline (Field-Tested)"),
        rawCatalogItem("", { marketHashName: "", marketName: "" }),
      ]),
      provider: "mock",
    };
    const itemRepository = {
      deactivateMissing: vi.fn().mockResolvedValue(3),
      upsertMany: vi.fn().mockResolvedValue({
        created: 1,
        items: [],
        totalPersisted: 1,
        updated: 0,
      }),
    };
    const syncRunRepository = {
      completeRun: vi.fn(),
      failRun: vi.fn(),
      startRun: vi.fn().mockResolvedValue({ id: "run-1" }),
    };

    const result = await new CatalogSyncService(
      provider as never,
      itemRepository as never,
      syncRunRepository as never,
    ).syncCatalog();

    expect(syncRunRepository.startRun).toHaveBeenCalledWith({
      provider: "mock",
      syncType: SyncType.CATALOG,
    });
    expect(itemRepository.upsertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        displayName: "AK-47 | Redline (Field-Tested)",
        source: "mock",
      }),
    ]);
    expect(itemRepository.deactivateMissing).toHaveBeenCalledWith("mock", [
      "AK-47 | Redline (Field-Tested)",
    ]);
    expect(syncRunRepository.completeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "run-1",
        itemsFailed: 1,
        itemsProcessed: 2,
        itemsSucceeded: 1,
        status: SyncStatus.PARTIAL,
      }),
    );
    expect(result).toMatchObject({
      created: 1,
      failed: 1,
      imagesMissing: 1,
      imagesResolved: 0,
      itemsProcessed: 1,
      provider: "mock",
      status: SyncStatus.PARTIAL,
      totalPersisted: 1,
      totalReceived: 2,
    });
  });

  it("marks sync runs as failed when the provider throws", async () => {
    const error = new Error("provider unavailable");
    const syncRunRepository = {
      completeRun: vi.fn(),
      failRun: vi.fn(),
      startRun: vi.fn().mockResolvedValue({ id: "run-1" }),
    };
    const service = new CatalogSyncService(
      {
        fetchCatalog: vi.fn().mockRejectedValue(error),
        provider: "mock",
      } as never,
      {
        deactivateMissing: vi.fn(),
        upsertMany: vi.fn(),
      } as never,
      syncRunRepository as never,
    );

    await expect(service.syncCatalog()).rejects.toBe(error);
    expect(syncRunRepository.failRun).toHaveBeenCalledWith(
      expect.objectContaining({
        errorSummary: "provider unavailable",
        id: "run-1",
        itemsFailed: 0,
        itemsProcessed: 0,
      }),
    );
  });
});
