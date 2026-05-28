import { describe, expect, it, vi } from "vitest";

import { PrismaMarketRepository } from "@/modules/markets/market.repository";

describe("PrismaMarketRepository", () => {
  it("counts markets and short-circuits empty slug lookups", async () => {
    const prisma = {
      market: {
        count: vi.fn().mockResolvedValue(3),
        findMany: vi.fn(),
      },
    };
    const repository = new PrismaMarketRepository(prisma as never);

    await expect(repository.count()).resolves.toBe(3);
    await expect(repository.findBySlugs([])).resolves.toEqual(new Map());
    expect(prisma.market.findMany).not.toHaveBeenCalled();
  });

  it("finds markets by unique slugs", async () => {
    const prisma = {
      market: {
        findMany: vi.fn().mockResolvedValue([{ id: "market-1", name: "Steam", slug: "steam" }]),
      },
    };

    const markets = await new PrismaMarketRepository(prisma as never).findBySlugs(["steam", "steam"]);

    expect(prisma.market.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      where: {
        slug: {
          in: ["steam"],
        },
      },
    });
    expect(markets.get("steam")).toEqual({ id: "market-1", name: "Steam", slug: "steam" });
  });

  it("upserts deduped markets and reports created versus updated rows", async () => {
    const upsert = vi.fn((operation) => operation);
    const prisma = {
      $transaction: vi.fn().mockResolvedValue([]),
      market: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ slug: "steam" }])
          .mockResolvedValueOnce([
            { id: "market-1", name: "Steam", slug: "steam" },
            { id: "market-2", name: "CSFloat", slug: "csfloat" },
          ]),
        upsert,
      },
    };

    const result = await new PrismaMarketRepository(prisma as never).upsertMany([
      { enabled: true, name: "Steam", priority: 1, slug: "steam" },
      { enabled: true, name: "CSFloat old", priority: 2, slug: "csfloat" },
      { enabled: false, name: "CSFloat", priority: 3, slug: "csfloat" },
    ]);

    expect(result).toMatchObject({
      created: 1,
      totalPersisted: 2,
      updated: 1,
    });
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        create: { enabled: true, name: "Steam", priority: 1, slug: "steam" },
        where: { slug: "steam" },
      }),
      expect.objectContaining({
        create: { enabled: false, name: "CSFloat", priority: 3, slug: "csfloat" },
        where: { slug: "csfloat" },
      }),
    ]);
  });

  it("short-circuits empty market writes", async () => {
    await expect(new PrismaMarketRepository({ market: { findMany: vi.fn() } } as never).upsertMany([])).resolves.toEqual({
      created: 0,
      markets: [],
      totalPersisted: 0,
      updated: 0,
    });
  });
});
