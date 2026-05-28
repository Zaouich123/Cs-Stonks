import { ItemType } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@/lib/errors";
import type { SessionUser } from "@/modules/auth/types/auth.types";
import { InventoryService } from "@/modules/inventory/inventory.service";
import type { SteamInventoryPayload } from "@/modules/inventory/inventory.types";

function money(value: number) {
  return {
    toNumber: () => value,
  };
}

function user(steamId: string): SessionUser {
  return {
    createdAt: "2026-05-01T10:00:00.000Z",
    id: `user-${steamId}`,
    lastLoginAt: null,
    phoneCountryCode: null,
    phoneNumber: null,
    phoneVerified: false,
    steamAvatar: "avatar-small",
    steamAvatarFull: "avatar-full",
    steamAvatarMedium: "avatar-medium",
    steamId,
    steamPersonaName: "Trader",
    steamProfileUrl: null,
    tradeLink: null,
    updatedAt: "2026-05-01T10:00:00.000Z",
  };
}

function steamPayload(marketHashName = "AK-47 | Redline (Field-Tested)"): SteamInventoryPayload {
  return {
    assets: [
      {
        amount: "1",
        appid: 730,
        assetid: "asset-1",
        classid: "class-1",
        contextid: "2",
        instanceid: "0",
      },
    ],
    descriptions: [
      {
        appid: 730,
        classid: "class-1",
        icon_url: "icon",
        instanceid: "0",
        market_hash_name: marketHashName,
        marketable: 1,
        name: "AK-47 | Redline",
        tags: [
          {
            category: "Exterior",
            localized_tag_name: "Field-Tested",
          },
          {
            category: "Rarity",
            localized_tag_name: "Classified",
          },
        ],
        tradable: 1,
        type: "Rifle",
      },
    ],
    success: true,
  };
}

function localItem(overrides = {}) {
  return {
    displayName: "AK-47 | Redline (Field-Tested)",
    id: "item-1",
    imageUrl: null,
    itemType: ItemType.SKIN,
    latestPrices: [
      {
        currency: "EUR",
        fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
        market: {
          name: "Steam",
          slug: "steam",
        },
        price: money(25),
        quantity: 10,
        sourceItemUrl: "https://steam.test/item",
        sourceMarketUrl: "https://steam.test",
      },
      {
        currency: "EUR",
        fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
        market: {
          name: "Skinport",
          slug: "skinport",
        },
        price: money(20),
        quantity: 3,
        sourceItemUrl: null,
        sourceMarketUrl: null,
      },
    ],
    marketHashName: "AK-47 | Redline (Field-Tested)",
    phase: null,
    rarity: "Classified",
    slug: "ak-47-redline-field-tested",
    steamImageUrl: "steam-image",
    ...overrides,
  };
}

describe("InventoryService", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fetches Steam inventory, enriches it with local prices, persists a snapshot, then serves cache", async () => {
    vi.stubEnv("STEAM_INVENTORY_CACHE_TTL_SECONDS", "60");
    const client = {
      item: {
        findMany: vi.fn().mockResolvedValue([
          localItem({
            latestPrices: [
              {
                currency: "EUR",
                fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
                market: {
                  name: "Steam",
                  slug: "steam",
                },
                price: money(25),
                quantity: 10,
                sourceItemUrl: "https://steam.test/item",
                sourceMarketUrl: "https://steam.test",
              },
            ],
          }),
          localItem({
            displayName: "AK-47 | Redline phase variant",
            id: "item-2",
            latestPrices: [
              {
                currency: "EUR",
                fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
                market: {
                  name: "Steam",
                  slug: "steam",
                },
                price: money(22),
                quantity: 5,
                sourceItemUrl: null,
                sourceMarketUrl: null,
              },
              {
                currency: "EUR",
                fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
                market: {
                  name: "Skinport",
                  slug: "skinport",
                },
                price: money(20),
                quantity: 3,
                sourceItemUrl: null,
                sourceMarketUrl: null,
              },
            ],
            phase: "Phase 2",
          }),
        ]),
      },
      userInventorySnapshot: {
        create: vi.fn(),
      },
    };
    const steamInventoryClient = {
      getInventory: vi.fn().mockResolvedValue(steamPayload()),
    };
    const service = new InventoryService(client as never, steamInventoryClient as never);

    const first = await service.getInventoryForUser(user("steam-inventory-1"));
    const second = await service.getInventoryForUser(user("steam-inventory-1"));

    expect(steamInventoryClient.getInventory).toHaveBeenCalledTimes(1);
    expect(first.cache).toMatchObject({
      isStale: false,
      source: "steam",
      ttlSeconds: 60,
      warning: null,
    });
    expect(first.summary).toEqual({
      matchedItems: 1,
      totalEstimatedValue: 20,
      totalInventoryItems: 1,
      valuedItems: 1,
      valueCurrency: "EUR",
    });
    expect(first.items[0]).toMatchObject({
      displayName: "AK-47 | Redline phase variant",
      itemId: "item-2",
      referenceCurrency: "EUR",
      referencePrice: 20,
      slug: "ak-47-redline-field-tested",
      tags: ["Field-Tested", "Classified", "Rifle"],
    });
    expect(first.items[0].prices.map((price) => [price.marketSlug, price.price])).toEqual([
      ["skinport", 20],
      ["steam", 22],
    ]);
    expect(client.userInventorySnapshot.create).toHaveBeenCalledWith({
      data: {
        currency: "EUR",
        itemCount: 1,
        source: "steam_inventory",
        totalValue: 20,
        userId: "user-steam-inventory-1",
      },
    });
    expect(second.cache.source).toBe("cache");
    expect(second.items).toEqual(first.items);
  });

  it("returns stale cache with a warning when Steam refresh fails", async () => {
    vi.stubEnv("STEAM_INVENTORY_CACHE_TTL_SECONDS", "60");
    const client = {
      item: {
        findMany: vi.fn().mockResolvedValue([localItem()]),
      },
      userInventorySnapshot: {
        create: vi.fn(),
      },
    };
    const steamInventoryClient = {
      getInventory: vi
        .fn()
        .mockResolvedValueOnce(steamPayload())
        .mockRejectedValueOnce(new ApplicationError("Steam is tired.", 429)),
    };
    const service = new InventoryService(client as never, steamInventoryClient as never);

    await service.getInventoryForUser(user("steam-inventory-2"));
    const stale = await service.getInventoryForUser(user("steam-inventory-2"), { forceRefresh: true });

    expect(stale.cache).toMatchObject({
      isStale: true,
      source: "cache",
      warning: "Steam is tired.",
    });
  });

  it("persists snapshots when inventory has a valued currency summary", async () => {
    const client = {
      item: {
        findMany: vi.fn().mockResolvedValue([
          localItem({
            latestPrices: [
              {
                currency: "USD",
                fetchedAt: new Date("2026-05-01T10:00:00.000Z"),
                market: {
                  name: "Steam",
                  slug: "steam",
                },
                price: money(25),
                quantity: null,
                sourceItemUrl: null,
                sourceMarketUrl: null,
              },
            ],
          }),
        ]),
      },
      userInventorySnapshot: {
        create: vi.fn(),
      },
    };
    const steamInventoryClient = {
      getInventory: vi.fn().mockResolvedValue(steamPayload("AK-47 | Redline (Field-Tested)")),
    };

    const response = await new InventoryService(client as never, steamInventoryClient as never).getInventoryForUser(
      user("steam-inventory-3"),
    );

    expect(response.summary).toMatchObject({
      totalEstimatedValue: 25,
      valueCurrency: "USD",
    });
    expect(client.userInventorySnapshot.create).toHaveBeenCalledTimes(1);
  });

  it("skips local item lookup for empty market hash names", async () => {
    const client = {
      item: {
        findMany: vi.fn(),
      },
      userInventorySnapshot: {
        create: vi.fn(),
      },
    };

    await expect(new InventoryService(client as never).getLocalItemsByMarketHashName([])).resolves.toEqual([]);
    expect(client.item.findMany).not.toHaveBeenCalled();
  });

  it("throws the Steam error when there is no cache to fall back to", async () => {
    const steamError = new ApplicationError("Inventory unavailable.", 403);
    const service = new InventoryService(
      {
        item: {
          findMany: vi.fn(),
        },
        userInventorySnapshot: {
          create: vi.fn(),
        },
      } as never,
      {
        getInventory: vi.fn().mockRejectedValue(steamError),
      } as never,
    );

    await expect(service.getInventoryForUser(user("steam-inventory-4"))).rejects.toBe(steamError);
  });
});
