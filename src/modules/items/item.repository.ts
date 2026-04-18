import type {
  ItemDetailRow,
  ItemHistoryRow,
  ItemReadRepository,
  ItemLatestPriceRow,
  ListItemsInput,
  ListItemsResult,
} from "@/modules/items/item.types";
import { normalizeSearchText } from "@/modules/catalog/catalog.normalizer";
import { Prisma, type PrismaClient } from "@prisma/client";

function buildItemWhere(input: Pick<ListItemsInput, "itemType" | "query">): Prisma.ItemWhereInput {
  const clauses: Prisma.ItemWhereInput[] = [
    {
      isActive: true,
    },
  ];

  if (input.itemType) {
    clauses.push({
      itemType: input.itemType,
    });
  }

  const normalizedQuery = input.query ? normalizeSearchText(input.query) : "";
  const tokens = normalizedQuery.split(" ").filter(Boolean);

  for (const token of tokens) {
    clauses.push({
      searchText: {
        contains: token,
      },
    });
  }

  if (clauses.length === 0) {
    return {};
  }

  return {
    AND: clauses,
  };
}

function toLowestCurrentPrice(
  prices: Array<{
    currency: string;
    price: Prisma.Decimal;
  }>,
) {
  if (prices.length === 0) {
    return {
      currency: null,
      price: null,
    };
  }

  const [lowest] = [...prices].sort((left, right) => left.price.comparedTo(right.price));

  return {
    currency: lowest.currency,
    price: lowest.price.toNumber(),
  };
}

export class PrismaItemReadRepository implements ItemReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listItems(input: ListItemsInput): Promise<ListItemsResult> {
    const where = buildItemWhere(input);
    const orderBy =
      input.sort === "displayName_desc"
        ? [{ displayName: "desc" as const }]
        : input.sort === "createdAt_desc"
          ? [{ createdAt: "desc" as const }, { displayName: "asc" as const }]
          : [{ displayName: "asc" as const }];
    const skip = (input.page - 1) * input.limit;
    const [items, totalItems] = await Promise.all([
      this.prisma.item.findMany({
        orderBy,
        select: {
          baseItemName: true,
          collection: true,
          createdAt: true,
          displayName: true,
          exterior: true,
          hasVariants: true,
          id: true,
          imageUrl: true,
          isActive: true,
          itemType: true,
          lastCatalogSyncAt: true,
          latestPrices: {
            select: {
              currency: true,
              price: true,
            },
          },
          marketHashName: true,
          phase: true,
          rarity: true,
          slug: true,
          source: true,
          sourceExternalId: true,
          steamAppId: true,
          steamImageUrl: true,
          updatedAt: true,
          _count: {
            select: {
              latestPrices: true,
            },
          },
        },
        skip,
        take: input.limit,
        where,
      }),
      this.prisma.item.count({
        where,
      }),
    ]);

    return {
      items: items.map((item) => {
        const lowestCurrentPrice = toLowestCurrentPrice(item.latestPrices);

        return {
          baseItemName: item.baseItemName,
          collection: item.collection,
          createdAt: item.createdAt,
          displayName: item.displayName,
          exterior: item.exterior,
          hasVariants: item.hasVariants,
          id: item.id,
          imageUrl: item.imageUrl,
          isActive: item.isActive,
          itemType: item.itemType,
          lastCatalogSyncAt: item.lastCatalogSyncAt,
          latestPriceCount: item._count.latestPrices,
          lowestCurrentPrice: lowestCurrentPrice.price,
          lowestCurrentPriceCurrency: lowestCurrentPrice.currency,
          marketHashName: item.marketHashName,
          phase: item.phase,
          rarity: item.rarity,
          slug: item.slug,
          source: item.source,
          sourceExternalId: item.sourceExternalId,
          steamAppId: item.steamAppId,
          steamImageUrl: item.steamImageUrl,
          updatedAt: item.updatedAt,
        };
      }),
      totalItems,
    };
  }

  async findById(itemId: string): Promise<ItemDetailRow | null> {
    return this.prisma.item.findUnique({
      select: {
        baseItemName: true,
        collection: true,
        createdAt: true,
        displayName: true,
        exterior: true,
        hasVariants: true,
        id: true,
        imageUrl: true,
        isActive: true,
        itemType: true,
        lastCatalogSyncAt: true,
        marketHashName: true,
        phase: true,
        rarity: true,
        searchText: true,
        skinName: true,
        slug: true,
        source: true,
        sourceExternalId: true,
        souvenir: true,
        stattrak: true,
        steamAppId: true,
        steamImageUrl: true,
        updatedAt: true,
        variantKey: true,
        weapon: true,
      },
      where: {
        id: itemId,
      },
    });
  }

  async listLatestPricesByItem(input: {
    itemId: string;
    sort: "fetchedAt_desc" | "market_asc" | "market_desc" | "price_asc" | "price_desc";
  }): Promise<ItemLatestPriceRow[]> {
    const orderBy =
      input.sort === "market_desc"
        ? [{ market: { slug: "desc" as const } }, { fetchedAt: "desc" as const }]
        : input.sort === "price_asc"
          ? [{ price: "asc" as const }, { market: { slug: "asc" as const } }]
          : input.sort === "price_desc"
            ? [{ price: "desc" as const }, { market: { slug: "asc" as const } }]
            : input.sort === "fetchedAt_desc"
              ? [{ fetchedAt: "desc" as const }, { market: { slug: "asc" as const } }]
              : [{ market: { slug: "asc" as const } }, { fetchedAt: "desc" as const }];

    const prices = await this.prisma.latestPrice.findMany({
      include: {
        market: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy,
      where: {
        itemId: input.itemId,
      },
    });

    return prices.map((price) => ({
      currency: price.currency,
      fetchedAt: price.fetchedAt,
      marketId: price.market.id,
      marketName: price.market.name,
      marketSlug: price.market.slug,
      price: price.price.toNumber(),
      quantity: price.quantity,
      sourceUpdatedAt: price.sourceUpdatedAt,
      volume: price.volume,
    }));
  }

  async listHistoryByItem(input: {
    from?: Date;
    itemId: string;
    market?: string;
    sort: "asc" | "desc";
    to?: Date;
  }): Promise<ItemHistoryRow[]> {
    const direction = input.sort === "desc" ? "desc" : "asc";
    const rows = await this.prisma.dailySnapshot.findMany({
      include: {
        market: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { snapshotDate: direction },
        { snapshotHour: direction },
        { market: { slug: "asc" } },
      ],
      where: {
        itemId: input.itemId,
        market: input.market
          ? {
              slug: input.market,
            }
          : undefined,
        snapshotDate:
          input.from || input.to
            ? {
                gte: input.from,
                lte: input.to,
              }
            : undefined,
      },
    });

    return rows.map((row) => ({
      currency: row.currency,
      marketId: row.market.id,
      marketName: row.market.name,
      marketSlug: row.market.slug,
      price: row.price.toNumber(),
      quantity: row.quantity,
      snapshotDate: row.snapshotDate,
      snapshotHour: row.snapshotHour,
      sourceFetchedAt: row.sourceFetchedAt,
      sourceUpdatedAt: row.sourceUpdatedAt,
      volume: row.volume,
    }));
  }
}
