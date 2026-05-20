import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { isApplicationError } from "@/lib/errors";
import type { SessionUser } from "@/modules/auth/types/auth.types";
import { mapSteamInventoryPayload } from "@/modules/inventory/inventory.mapper";
import type {
  InventoryItem,
  InventoryMarketPrice,
  InventoryResponse,
} from "@/modules/inventory/inventory.types";
import { SteamInventoryClient } from "@/modules/inventory/steamInventoryClient";

const DEFAULT_INVENTORY_CACHE_TTL_MS = 15 * 60 * 1000;

interface InventoryCacheEntry {
  fetchedAt: number;
  response: Omit<InventoryResponse, "cache">;
}

const inventoryCache = new Map<string, InventoryCacheEntry>();

type LocalInventoryItem = Awaited<
  ReturnType<InventoryService["getLocalItemsByMarketHashName"]>
>[number];

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function toMarketPrice(price: LocalInventoryItem["latestPrices"][number]): InventoryMarketPrice {
  return {
    currency: price.currency,
    fetchedAt: price.fetchedAt.toISOString(),
    marketName: price.market.name,
    marketSlug: price.market.slug,
    price: price.price.toNumber(),
    quantity: price.quantity,
    sourceItemUrl: price.sourceItemUrl,
    sourceMarketUrl: price.sourceMarketUrl,
  };
}

function mergeMarketPrices(items: LocalInventoryItem[]) {
  const byMarket = new Map<string, InventoryMarketPrice>();

  for (const item of items) {
    for (const price of item.latestPrices) {
      const nextPrice = toMarketPrice(price);
      const existing = byMarket.get(nextPrice.marketSlug);

      if (!existing || nextPrice.price < existing.price) {
        byMarket.set(nextPrice.marketSlug, nextPrice);
      }
    }
  }

  return [...byMarket.values()].sort((left, right) => left.price - right.price);
}

function chooseRepresentative(items: LocalInventoryItem[]) {
  if (items.length === 0) {
    return null;
  }

  return [...items].sort((left, right) => {
    const leftFloor = Math.min(...left.latestPrices.map((price) => price.price.toNumber()), Infinity);
    const rightFloor = Math.min(...right.latestPrices.map((price) => price.price.toNumber()), Infinity);

    if (leftFloor !== rightFloor) {
      return leftFloor - rightFloor;
    }

    if (left.phase === null && right.phase !== null) {
      return -1;
    }

    if (left.phase !== null && right.phase === null) {
      return 1;
    }

    return left.displayName.localeCompare(right.displayName);
  })[0];
}

function enrichInventoryItem(item: InventoryItem, localItems: LocalInventoryItem[]): InventoryItem {
  const representative = chooseRepresentative(localItems);
  const prices = mergeMarketPrices(localItems);
  const referencePrice = prices[0] ?? null;

  return {
    ...item,
    displayName: representative?.displayName ?? item.displayName,
    imageUrl: item.imageUrl ?? representative?.imageUrl ?? representative?.steamImageUrl ?? null,
    itemId: representative?.id ?? null,
    itemType: representative?.itemType ?? item.itemType,
    prices,
    rarity: representative?.rarity ?? item.rarity,
    referenceCurrency: referencePrice?.currency ?? null,
    referencePrice: referencePrice?.price ?? null,
    slug: representative?.slug ?? null,
    tags: unique([item.exterior, item.rarity, item.type, ...item.tags].filter(Boolean) as string[]),
  };
}

function buildSummary(items: InventoryItem[]) {
  const valuedItems = items.filter((item) => item.referencePrice !== null);
  const valueCurrency = valuedItems[0]?.referenceCurrency ?? null;
  const sameCurrency = valuedItems.every((item) => item.referenceCurrency === valueCurrency);
  const totalEstimatedValue =
    valuedItems.length === 0 || !sameCurrency
      ? null
      : valuedItems.reduce((total, item) => total + (item.referencePrice ?? 0), 0);

  return {
    matchedItems: items.filter((item) => item.itemId !== null).length,
    totalEstimatedValue,
    totalInventoryItems: items.length,
    valuedItems: valuedItems.length,
    valueCurrency,
  };
}

function getCacheTtlMs() {
  const parsed = Number(process.env.STEAM_INVENTORY_CACHE_TTL_SECONDS);

  if (!Number.isFinite(parsed) || parsed < 30) {
    return DEFAULT_INVENTORY_CACHE_TTL_MS;
  }

  return parsed * 1000;
}

function withCacheInfo(
  entry: InventoryCacheEntry,
  options: {
    isStale?: boolean;
    source: "cache" | "steam";
    warning?: string | null;
  },
): InventoryResponse {
  const ttlMs = getCacheTtlMs();

  return {
    ...entry.response,
    cache: {
      fetchedAt: new Date(entry.fetchedAt).toISOString(),
      isStale: options.isStale ?? Date.now() - entry.fetchedAt > ttlMs,
      source: options.source,
      ttlSeconds: Math.round(ttlMs / 1000),
      warning: options.warning ?? null,
    },
  };
}

export class InventoryService {
  constructor(
    private readonly client: PrismaClient = prisma,
    private readonly steamInventoryClient = new SteamInventoryClient(),
  ) {}

  async getInventoryForUser(
    user: SessionUser,
    options: { forceRefresh?: boolean } = {},
  ): Promise<InventoryResponse> {
    const ttlMs = getCacheTtlMs();
    const cached = inventoryCache.get(user.steamId);

    if (cached && !options.forceRefresh && Date.now() - cached.fetchedAt <= ttlMs) {
      return withCacheInfo(cached, { source: "cache" });
    }

    try {
      const payload = await this.steamInventoryClient.getInventory(user.steamId);
      const steamItems = mapSteamInventoryPayload(payload, user.steamId);
      const marketHashNames = unique(steamItems.map((item) => item.marketHashName));
      const localItems = await this.getLocalItemsByMarketHashName(marketHashNames);
      const localItemsByHash = new Map<string, LocalInventoryItem[]>();

      for (const item of localItems) {
        const values = localItemsByHash.get(item.marketHashName) ?? [];
        values.push(item);
        localItemsByHash.set(item.marketHashName, values);
      }

      const items = steamItems.map((item) =>
        enrichInventoryItem(item, localItemsByHash.get(item.marketHashName) ?? []),
      );
      const entry: InventoryCacheEntry = {
        fetchedAt: Date.now(),
        response: {
          items,
          summary: buildSummary(items),
          user: {
            steamAvatar: user.steamAvatarMedium ?? user.steamAvatar,
            steamId: user.steamId,
            steamPersonaName: user.steamPersonaName,
          },
        },
      };

      inventoryCache.set(user.steamId, entry);

      return withCacheInfo(entry, { source: "steam" });
    } catch (error) {
      if (cached) {
        return withCacheInfo(cached, {
          isStale: true,
          source: "cache",
          warning: isApplicationError(error)
            ? error.message
            : "Steam inventory could not be refreshed. Showing the last cached inventory.",
        });
      }

      throw error;
    }
  }

  async getLocalItemsByMarketHashName(marketHashNames: string[]) {
    if (marketHashNames.length === 0) {
      return [];
    }

    return this.client.item.findMany({
      orderBy: [{ displayName: "asc" }, { phase: "asc" }],
      select: {
        displayName: true,
        id: true,
        imageUrl: true,
        itemType: true,
        latestPrices: {
          include: {
            market: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          orderBy: [{ price: "asc" }],
        },
        marketHashName: true,
        phase: true,
        rarity: true,
        slug: true,
        steamImageUrl: true,
      },
      where: {
        isActive: true,
        marketHashName: {
          in: marketHashNames,
        },
      },
    });
  }
}
