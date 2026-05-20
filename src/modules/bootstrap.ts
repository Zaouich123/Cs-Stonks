import { prisma } from "@/lib/db/prisma";
import { PrismaItemRepository } from "@/modules/catalog/catalog.repository";
import { CatalogSyncService } from "@/modules/catalog/catalog.service";
import { HealthQueryService } from "@/modules/health/health.service";
import { PrismaItemReadRepository } from "@/modules/items/item.repository";
import { ItemQueryService } from "@/modules/items/item.service";
import { PrismaMarketRepository } from "@/modules/markets/market.repository";
import { ByMykelCatalogProvider } from "@/modules/providers/bymykel-catalog.provider";
import { DmarketPriceProvider } from "@/modules/providers/dmarket/dmarket-price.provider";
import { JsonCatalogProvider } from "@/modules/providers/json-catalog.provider";
import { JsonPriceProvider } from "@/modules/providers/json-price.provider";
import { LocalFallbackCatalogProvider } from "@/modules/providers/local-fallback-catalog.provider";
import { MockCatalogProvider } from "@/modules/providers/mock-catalog.provider";
import { MockPriceProvider } from "@/modules/providers/mock-price.provider";
import { SkinportPriceProvider } from "@/modules/providers/skinport/skinport-price.provider";
import {
  resolveCatalogProviderSource,
  resolvePriceProviderSource,
} from "@/modules/providers/provider.types";
import { SteamPriceProvider as DirectSteamPriceProvider } from "@/modules/providers/steam/steam-price.provider";
import { WaxpeerPriceProvider } from "@/modules/providers/waxpeer/waxpeer-price.provider";
import { WhiteMarketPriceProvider } from "@/modules/providers/white-market/white-market-price.provider";
import type {
  CatalogProvider,
  CatalogProviderSource,
  PriceProvider,
  PriceProviderSource,
} from "@/modules/providers/provider.types";
import { LatestPricingQueryService } from "@/modules/pricing/pricing.query.service";
import { PrismaLatestPriceRepository } from "@/modules/pricing/pricing.repository";
import { LatestPricingSyncService } from "@/modules/pricing/pricing.service";
import { CsfloatIngestionService } from "@/modules/pricing/services/csfloatIngestionService";
import { PrismaSnapshotRepository } from "@/modules/snapshots/snapshot.repository";
import { DailySnapshotService } from "@/modules/snapshots/snapshot.service";
import { PrismaSyncRunRepository } from "@/modules/sync-runs/sync-run.repository";

function createCatalogProvider(source: CatalogProviderSource): CatalogProvider {
  switch (source) {
    case "bymykel":
      return new ByMykelCatalogProvider();
    case "json":
      return new JsonCatalogProvider();
    case "local_fallback":
      return new LocalFallbackCatalogProvider();
    case "mock":
      return new MockCatalogProvider();
    default:
      return new ByMykelCatalogProvider();
  }
}

function createPriceProvider(source: PriceProviderSource): PriceProvider {
  switch (source) {
    case "json":
      return new JsonPriceProvider();
    case "mock":
      return new MockPriceProvider();
    case "real":
      return new DirectSteamPriceProvider();
    case "skinport":
      return new SkinportPriceProvider();
    case "dmarket":
      return new DmarketPriceProvider();
    case "waxpeer":
      return new WaxpeerPriceProvider();
    case "white-market":
      return new WhiteMarketPriceProvider();
    default:
      return new JsonPriceProvider();
  }
}

export function createCatalogSyncService(
  source: CatalogProviderSource = resolveCatalogProviderSource(process.env.CATALOG_PROVIDER, "bymykel"),
) {
  return new CatalogSyncService(
    createCatalogProvider(source),
    new PrismaItemRepository(prisma),
    new PrismaSyncRunRepository(prisma),
  );
}

export function createLatestPricingSyncService(
  source: PriceProviderSource = resolvePriceProviderSource(process.env.PRICE_PROVIDER, "json"),
) {
  return new LatestPricingSyncService(
    createPriceProvider(source),
    new PrismaItemRepository(prisma),
    new PrismaMarketRepository(prisma),
    new PrismaLatestPriceRepository(prisma),
    new PrismaSyncRunRepository(prisma),
  );
}

export function createDailySnapshotService() {
  return new DailySnapshotService(
    new PrismaLatestPriceRepository(prisma),
    new PrismaSnapshotRepository(prisma),
    new PrismaSyncRunRepository(prisma),
  );
}

export function createCsfloatIngestionService() {
  return new CsfloatIngestionService(
    prisma,
    new PrismaMarketRepository(prisma),
    new PrismaLatestPriceRepository(prisma),
    new PrismaSyncRunRepository(prisma),
  );
}

export function createLatestPricingQueryService() {
  return new LatestPricingQueryService(new PrismaLatestPriceRepository(prisma));
}

export function createItemQueryService() {
  return new ItemQueryService(new PrismaItemReadRepository(prisma));
}

export function createHealthQueryService() {
  return new HealthQueryService(
    new PrismaItemRepository(prisma),
    new PrismaMarketRepository(prisma),
    new PrismaLatestPriceRepository(prisma),
    new PrismaSnapshotRepository(prisma),
    new PrismaSyncRunRepository(prisma),
  );
}
