import type { PrismaClient } from "@prisma/client";

import type {
  MarketLookup,
  MarketRepository,
  MarketWriteResult,
  NormalizedMarket,
} from "@/modules/markets/market.types";

function dedupeMarkets(markets: NormalizedMarket[]) {
  const map = new Map<string, NormalizedMarket>();

  for (const market of markets) {
    map.set(market.slug, market);
  }

  return [...map.values()];
}

export class PrismaMarketRepository implements MarketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async count(): Promise<number> {
    return this.prisma.market.count();
  }

  async findBySlugs(slugs: string[]): Promise<Map<string, MarketLookup>> {
    if (slugs.length === 0) {
      return new Map();
    }

    const markets = await this.prisma.market.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      where: {
        slug: {
          in: [...new Set(slugs)],
        },
      },
    });

    return new Map(markets.map((market) => [market.slug, market]));
  }

  async upsertMany(markets: NormalizedMarket[]): Promise<MarketWriteResult> {
    const uniqueMarkets = dedupeMarkets(markets);

    if (uniqueMarkets.length === 0) {
      return {
        created: 0,
        markets: [],
        totalPersisted: 0,
        updated: 0,
      };
    }

    const existingMarkets = await this.prisma.market.findMany({
      select: {
        slug: true,
      },
      where: {
        slug: {
          in: uniqueMarkets.map((market) => market.slug),
        },
      },
    });
    const existingSlugs = new Set(existingMarkets.map((market) => market.slug));

    await this.prisma.$transaction(
      uniqueMarkets.map((market) =>
        this.prisma.market.upsert({
          create: {
            enabled: market.enabled,
            name: market.name,
            priority: market.priority,
            slug: market.slug,
          },
          update: {
            enabled: market.enabled,
            name: market.name,
            priority: market.priority,
          },
          where: {
            slug: market.slug,
          },
        }),
      ),
    );

    const persistedMarkets = await this.prisma.market.findMany({
      orderBy: {
        slug: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      where: {
        slug: {
          in: uniqueMarkets.map((market) => market.slug),
        },
      },
    });

    return {
      created: uniqueMarkets.filter((market) => !existingSlugs.has(market.slug)).length,
      markets: persistedMarkets,
      totalPersisted: uniqueMarkets.length,
      updated: uniqueMarkets.filter((market) => existingSlugs.has(market.slug)).length,
    };
  }
}

