import { describe, expect, it } from "vitest";

import {
  createCatalogSyncService,
  createCsfloatIngestionService,
  createDailySnapshotService,
  createHealthQueryService,
  createItemQueryService,
  createLatestPricingQueryService,
  createLatestPricingSyncService,
} from "@/modules/bootstrap";
import { CatalogSyncService } from "@/modules/catalog/catalog.service";
import { HealthQueryService } from "@/modules/health/health.service";
import { ItemQueryService } from "@/modules/items/item.service";
import { LatestPricingQueryService } from "@/modules/pricing/pricing.query.service";
import { LatestPricingSyncService } from "@/modules/pricing/pricing.service";
import { CsfloatIngestionService } from "@/modules/pricing/services/csfloatIngestionService";
import { DailySnapshotService } from "@/modules/snapshots/snapshot.service";

describe("bootstrap factories", () => {
  it("creates catalog sync services for every catalog provider source", () => {
    expect(createCatalogSyncService("bymykel")).toBeInstanceOf(CatalogSyncService);
    expect(createCatalogSyncService("json")).toBeInstanceOf(CatalogSyncService);
    expect(createCatalogSyncService("local_fallback")).toBeInstanceOf(CatalogSyncService);
    expect(createCatalogSyncService("mock")).toBeInstanceOf(CatalogSyncService);
  });

  it("creates pricing sync services for every price provider source", () => {
    expect(createLatestPricingSyncService("json")).toBeInstanceOf(LatestPricingSyncService);
    expect(createLatestPricingSyncService("mock")).toBeInstanceOf(LatestPricingSyncService);
    expect(createLatestPricingSyncService("real")).toBeInstanceOf(LatestPricingSyncService);
    expect(createLatestPricingSyncService("skinport")).toBeInstanceOf(LatestPricingSyncService);
    expect(createLatestPricingSyncService("dmarket")).toBeInstanceOf(LatestPricingSyncService);
    expect(createLatestPricingSyncService("waxpeer")).toBeInstanceOf(LatestPricingSyncService);
    expect(createLatestPricingSyncService("white-market")).toBeInstanceOf(LatestPricingSyncService);
  });

  it("creates read and job services", () => {
    expect(createDailySnapshotService()).toBeInstanceOf(DailySnapshotService);
    expect(createCsfloatIngestionService()).toBeInstanceOf(CsfloatIngestionService);
    expect(createLatestPricingQueryService()).toBeInstanceOf(LatestPricingQueryService);
    expect(createItemQueryService()).toBeInstanceOf(ItemQueryService);
    expect(createHealthQueryService()).toBeInstanceOf(HealthQueryService);
  });
});
