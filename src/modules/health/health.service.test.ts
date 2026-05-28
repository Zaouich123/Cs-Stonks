import { beforeEach, describe, expect, it, vi } from "vitest";

import { HealthQueryService } from "@/modules/health/health.service";

function countRepository(count: number) {
  return {
    count: vi.fn().mockResolvedValue(count),
  };
}

describe("HealthQueryService", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns repository counts and normalized environment health", async () => {
    vi.stubEnv("ENABLE_INTERNAL_CRON", "true");
    vi.stubEnv("PRICE_PROVIDER", "mock");
    vi.stubEnv("REAL_PROVIDER_BASE_URL", "https://steam.example.test/market/");

    const itemRepository = countRepository(10);
    const marketRepository = countRepository(3);
    const latestPriceRepository = countRepository(42);
    const snapshotRepository = countRepository(7);
    const syncRunRepository = countRepository(5);
    const service = new HealthQueryService(
      itemRepository,
      marketRepository,
      latestPriceRepository,
      snapshotRepository,
      syncRunRepository,
    );

    await expect(service.getHealth()).resolves.toMatchObject({
      counts: {
        dailySnapshots: 7,
        items: 10,
        latestPrices: 42,
        markets: 3,
        syncRuns: 5,
      },
      env: {
        internalCronEnabled: true,
        priceProvider: "mock",
        realProviderBaseUrl: "https://steam.example.test/market/",
      },
      status: "ok",
    });

    expect(itemRepository.count).toHaveBeenCalledOnce();
    expect(marketRepository.count).toHaveBeenCalledOnce();
    expect(latestPriceRepository.count).toHaveBeenCalledOnce();
    expect(snapshotRepository.count).toHaveBeenCalledOnce();
    expect(syncRunRepository.count).toHaveBeenCalledOnce();
  });

  it("uses default environment values when variables are absent", async () => {
    vi.stubEnv("ENABLE_INTERNAL_CRON", "false");
    vi.stubEnv("PRICE_PROVIDER", "");
    vi.stubEnv("REAL_PROVIDER_BASE_URL", "https://steamcommunity.com/market/");

    const service = new HealthQueryService(
      countRepository(0),
      countRepository(0),
      countRepository(0),
      countRepository(0),
      countRepository(0),
    );

    const health = await service.getHealth();

    expect(health.env).toMatchObject({
      internalCronEnabled: false,
      priceProvider: "json",
      realProviderBaseUrl: "https://steamcommunity.com/market/",
    });
    expect(health.cron).toHaveProperty("snapshot");
  });
});
