import type { PrismaClient } from "@prisma/client";

import type {
  LatestPriceRepository,
  LatestPriceRow,
  LatestPriceWriteInput,
  LatestPriceWriteResult,
} from "@/modules/pricing/pricing.types";

const FIND_EXISTING_BATCH_SIZE = 1000;
const UPSERT_BATCH_SIZE = 500;

function dedupePriceWrites(prices: LatestPriceWriteInput[]) {
  const map = new Map<string, LatestPriceWriteInput>();

  for (const price of prices) {
    map.set(`${price.itemId}:${price.marketId}`, price);
  }

  return [...map.values()];
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

export class PrismaLatestPriceRepository implements LatestPriceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async count(): Promise<number> {
    return this.prisma.latestPrice.count();
  }

  async listLatestPrices(marketSlug?: string): Promise<LatestPriceRow[]> {
    const prices = await this.prisma.latestPrice.findMany({
      include: {
        item: {
          select: {
            displayName: true,
            itemType: true,
            marketHashName: true,
            phase: true,
            variantKey: true,
          },
        },
        market: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        {
          market: {
            slug: "asc",
          },
        },
        {
          item: {
            displayName: "asc",
          },
        },
      ],
      where: marketSlug
        ? {
            market: {
              slug: marketSlug,
            },
          }
        : undefined,
    });

    return prices.map((price) => ({
      currency: price.currency,
      displayName: price.item.displayName,
      fetchedAt: price.fetchedAt,
      itemId: price.itemId,
      itemType: price.item.itemType,
      marketHashName: price.item.marketHashName,
      marketId: price.marketId,
      marketName: price.market.name,
      marketSlug: price.market.slug,
      phase: price.item.phase,
      price: price.price.toNumber(),
      quantity: price.quantity,
      sourceUpdatedAt: price.sourceUpdatedAt,
      variantKey: price.item.variantKey,
      volume: price.volume,
    }));
  }

  async upsertMany(prices: LatestPriceWriteInput[]): Promise<LatestPriceWriteResult> {
    const uniquePrices = dedupePriceWrites(prices);

    if (uniquePrices.length === 0) {
      return {
        created: 0,
        totalPersisted: 0,
        updated: 0,
      };
    }

    const existingPrices = [];

    for (const chunk of chunkArray(uniquePrices, FIND_EXISTING_BATCH_SIZE)) {
      existingPrices.push(
        ...(await this.prisma.latestPrice.findMany({
          select: {
            itemId: true,
            marketId: true,
          },
          where: {
            OR: chunk.map((price) => ({
              itemId: price.itemId,
              marketId: price.marketId,
            })),
          },
        })),
      );
    }
    const existingKeys = new Set(existingPrices.map((price) => `${price.itemId}:${price.marketId}`));

    for (const chunk of chunkArray(uniquePrices, UPSERT_BATCH_SIZE)) {
      await this.prisma.$transaction(
        chunk.map((price) =>
          this.prisma.latestPrice.upsert({
            create: {
              currency: price.currency,
              fetchedAt: price.fetchedAt,
              itemId: price.itemId,
              marketId: price.marketId,
              price: price.price,
              quantity: price.quantity,
              sourceUpdatedAt: price.sourceUpdatedAt,
              volume: price.volume,
            },
            update: {
              currency: price.currency,
              fetchedAt: price.fetchedAt,
              price: price.price,
              quantity: price.quantity,
              sourceUpdatedAt: price.sourceUpdatedAt,
              volume: price.volume,
            },
            where: {
              itemId_marketId: {
                itemId: price.itemId,
                marketId: price.marketId,
              },
            },
          }),
        ),
      );
    }

    return {
      created: uniquePrices.filter(
        (price) => !existingKeys.has(`${price.itemId}:${price.marketId}`),
      ).length,
      totalPersisted: uniquePrices.length,
      updated: uniquePrices.filter((price) =>
        existingKeys.has(`${price.itemId}:${price.marketId}`),
      ).length,
    };
  }
}
