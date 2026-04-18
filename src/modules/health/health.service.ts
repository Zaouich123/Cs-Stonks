import type { ItemRepository } from "@/modules/catalog/catalog.types";
import { cronSchedules } from "@/modules/jobs/cron.config";
import type { MarketRepository } from "@/modules/markets/market.types";
import type { LatestPriceRepository } from "@/modules/pricing/pricing.types";
import type { SnapshotRepository } from "@/modules/snapshots/snapshot.types";
import type { SyncRunRepository } from "@/modules/sync-runs/sync-run.types";

export class HealthQueryService {
  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly marketRepository: MarketRepository,
    private readonly latestPriceRepository: LatestPriceRepository,
    private readonly snapshotRepository: SnapshotRepository,
    private readonly syncRunRepository: SyncRunRepository,
  ) {}

  async getHealth() {
    const [items, markets, latestPrices, dailySnapshots, syncRuns] = await Promise.all([
      this.itemRepository.count(),
      this.marketRepository.count(),
      this.latestPriceRepository.count(),
      this.snapshotRepository.count(),
      this.syncRunRepository.count(),
    ]);

    return {
      counts: {
        dailySnapshots,
        items,
        latestPrices,
        markets,
        syncRuns,
      },
      cron: cronSchedules,
      env: {
        internalCronEnabled: process.env.ENABLE_INTERNAL_CRON === "true",
      },
      status: "ok",
    };
  }
}
