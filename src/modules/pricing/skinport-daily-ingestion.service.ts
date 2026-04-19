import { createLatestPricingSyncService } from "@/modules/bootstrap";
import { createDailySnapshotService } from "@/modules/bootstrap";

export interface SkinportIngestionAndSnapshotResult {
  latestPrices: Awaited<ReturnType<ReturnType<typeof createLatestPricingSyncService>["syncLatestPrices"]>>;
  snapshot: Awaited<ReturnType<ReturnType<typeof createDailySnapshotService>["createDailySnapshot"]>>;
}

export class SkinportDailyIngestionService {
  async syncLatestPrices() {
    return createLatestPricingSyncService("skinport").syncLatestPrices();
  }

  async syncLatestPricesAndSnapshot(): Promise<SkinportIngestionAndSnapshotResult> {
    const latestPrices = await this.syncLatestPrices();
    const snapshot = await createDailySnapshotService().createDailySnapshot({
      triggerSource: "skinport_daily_ingestion",
    });

    return {
      latestPrices,
      snapshot,
    };
  }
}
