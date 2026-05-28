import { ItemType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { PrismaItemRepository } from "@/modules/catalog/catalog.repository";
import type { NormalizedCatalogItem } from "@/modules/catalog/catalog.types";

function item(variantKey: string, overrides: Partial<NormalizedCatalogItem> = {}): NormalizedCatalogItem {
  return {
    baseItemName: "AK-47 | Redline",
    collection: "Phoenix",
    displayName: "AK-47 | Redline (Field-Tested)",
    exterior: "Field-Tested",
    hasVariants: false,
    imageUrl: "image",
    isActive: true,
    itemType: ItemType.SKIN,
    lastCatalogSyncAt: new Date("2026-05-01T10:00:00.000Z"),
    marketHashName: "AK-47 | Redline (Field-Tested)",
    phase: null,
    rarity: "Classified",
    searchText: "ak 47 redline field tested",
    skinName: "Redline",
    slug: "ak-47-redline-field-tested",
    source: "mock",
    sourceExternalId: variantKey,
    souvenir: false,
    stattrak: false,
    steamAppId: 730,
    steamImageUrl: "steam-image",
    variantKey,
    weapon: "AK-47",
    ...overrides,
  };
}

describe("PrismaItemRepository", () => {
  it("counts and deactivates missing source items", async () => {
    const prisma = {
      item: {
        count: vi.fn().mockResolvedValue(7),
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const repository = new PrismaItemRepository(prisma as never);

    await expect(repository.count()).resolves.toBe(7);
    await expect(repository.deactivateMissing("mock", ["a", "b"])).resolves.toBe(2);
    expect(prisma.item.updateMany).toHaveBeenCalledWith({
      data: {
        isActive: false,
      },
      where: {
        isActive: true,
        source: "mock",
        variantKey: {
          notIn: ["a", "b"],
        },
      },
    });
  });

  it("returns an empty lookup without querying for empty variant keys", async () => {
    const prisma = {
      item: {
        findMany: vi.fn(),
      },
    };

    const lookup = await new PrismaItemRepository(prisma as never).findByVariantKeys([]);

    expect(lookup.size).toBe(0);
    expect(prisma.item.findMany).not.toHaveBeenCalled();
  });

  it("finds item lookups by unique variant keys", async () => {
    const prisma = {
      item: {
        findMany: vi.fn().mockResolvedValue([
          {
            displayName: "AK-47",
            id: "item-1",
            itemType: ItemType.SKIN,
            marketHashName: "AK-47",
            phase: null,
            variantKey: "ak",
          },
        ]),
      },
    };

    const lookup = await new PrismaItemRepository(prisma as never).findByVariantKeys(["ak", "ak"]);

    expect(prisma.item.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        variantKey: {
          in: ["ak"],
        },
      },
    }));
    expect(lookup.get("ak")).toMatchObject({ id: "item-1" });
  });

  it("lists active price sync targets", async () => {
    const prisma = {
      item: {
        findMany: vi.fn().mockResolvedValue([
          {
            displayName: "Sticker",
            id: "item-1",
            marketHashName: "Sticker",
            phase: null,
            slug: "sticker",
            variantKey: "sticker",
          },
        ]),
      },
    };

    await expect(new PrismaItemRepository(prisma as never).listPriceSyncTargets()).resolves.toEqual([
      {
        displayName: "Sticker",
        itemId: "item-1",
        marketHashName: "Sticker",
        phase: null,
        slug: "sticker",
        variantKey: "sticker",
      },
    ]);
    expect(prisma.item.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        isActive: true,
      },
    }));
  });

  it("upserts unique catalog items and reports created versus updated rows", async () => {
    const upsert = vi.fn((operation) => operation);
    const prisma = {
      $transaction: vi.fn().mockResolvedValue([]),
      item: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ variantKey: "existing" }])
          .mockResolvedValueOnce([
            {
              displayName: "AK-47",
              id: "item-existing",
              itemType: ItemType.SKIN,
              marketHashName: "AK-47",
              phase: null,
              variantKey: "existing",
            },
            {
              displayName: "M4A4",
              id: "item-new",
              itemType: ItemType.SKIN,
              marketHashName: "M4A4",
              phase: null,
              variantKey: "new",
            },
          ]),
        upsert,
      },
    };

    const result = await new PrismaItemRepository(prisma as never).upsertMany([
      item("existing"),
      item("new", { displayName: "M4A4", marketHashName: "M4A4" }),
      item("new", { displayName: "M4A4 duplicate", marketHashName: "M4A4" }),
    ]);

    expect(result).toMatchObject({
      created: 1,
      totalPersisted: 2,
      updated: 1,
    });
    expect(result.items).toHaveLength(2);
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        create: expect.objectContaining({ variantKey: "existing" }),
        where: { variantKey: "existing" },
      }),
      expect.objectContaining({
        create: expect.objectContaining({ variantKey: "new" }),
        where: { variantKey: "new" },
      }),
    ]);
  });

  it("short-circuits empty catalog writes", async () => {
    const prisma = {
      item: {
        findMany: vi.fn(),
      },
    };

    await expect(new PrismaItemRepository(prisma as never).upsertMany([])).resolves.toEqual({
      created: 0,
      items: [],
      totalPersisted: 0,
      updated: 0,
    });
  });
});
