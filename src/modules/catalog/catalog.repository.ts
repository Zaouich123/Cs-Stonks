import type { PrismaClient } from "@prisma/client";

import type {
  CatalogWriteResult,
  ItemLookup,
  ItemRepository,
  NormalizedCatalogItem,
} from "@/modules/catalog/catalog.types";

function dedupeItems(items: NormalizedCatalogItem[]) {
  const map = new Map<string, NormalizedCatalogItem>();

  for (const item of items) {
    map.set(item.variantKey, item);
  }

  return [...map.values()];
}

export class PrismaItemRepository implements ItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async count(): Promise<number> {
    return this.prisma.item.count();
  }

  async findByVariantKeys(keys: string[]): Promise<Map<string, ItemLookup>> {
    if (keys.length === 0) {
      return new Map();
    }

    const items = await this.prisma.item.findMany({
      select: {
        displayName: true,
        id: true,
        itemType: true,
        marketHashName: true,
        phase: true,
        variantKey: true,
      },
      where: {
        variantKey: {
          in: [...new Set(keys)],
        },
      },
    });

    return new Map(items.map((item) => [item.variantKey, item]));
  }

  async upsertMany(items: NormalizedCatalogItem[]): Promise<CatalogWriteResult> {
    const uniqueItems = dedupeItems(items);

    if (uniqueItems.length === 0) {
      return {
        created: 0,
        items: [],
        totalPersisted: 0,
        updated: 0,
      };
    }

    const existingItems = await this.prisma.item.findMany({
      select: {
        variantKey: true,
      },
      where: {
        variantKey: {
          in: uniqueItems.map((item) => item.variantKey),
        },
      },
    });
    const existingVariantKeys = new Set(existingItems.map((item) => item.variantKey));

    await this.prisma.$transaction(
      uniqueItems.map((item) =>
        this.prisma.item.upsert({
          create: {
            collection: item.collection,
            displayName: item.displayName,
            exterior: item.exterior,
            imageUrl: item.imageUrl,
            isActive: item.isActive,
            itemType: item.itemType,
            marketHashName: item.marketHashName,
            phase: item.phase,
            rarity: item.rarity,
            skinName: item.skinName,
            souvenir: item.souvenir,
            stattrak: item.stattrak,
            steamImageUrl: item.steamImageUrl,
            variantKey: item.variantKey,
            weapon: item.weapon,
          },
          update: {
            collection: item.collection,
            displayName: item.displayName,
            exterior: item.exterior,
            imageUrl: item.imageUrl,
            isActive: item.isActive,
            itemType: item.itemType,
            marketHashName: item.marketHashName,
            phase: item.phase,
            rarity: item.rarity,
            skinName: item.skinName,
            souvenir: item.souvenir,
            stattrak: item.stattrak,
            steamImageUrl: item.steamImageUrl,
            weapon: item.weapon,
          },
          where: {
            variantKey: item.variantKey,
          },
        }),
      ),
    );

    const persistedItems = await this.prisma.item.findMany({
      orderBy: {
        displayName: "asc",
      },
      select: {
        displayName: true,
        id: true,
        itemType: true,
        marketHashName: true,
        phase: true,
        variantKey: true,
      },
      where: {
        variantKey: {
          in: uniqueItems.map((item) => item.variantKey),
        },
      },
    });

    return {
      created: uniqueItems.filter((item) => !existingVariantKeys.has(item.variantKey)).length,
      items: persistedItems,
      totalPersisted: uniqueItems.length,
      updated: uniqueItems.filter((item) => existingVariantKeys.has(item.variantKey)).length,
    };
  }
}

