import { z } from "zod";

import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import {
  createCatalogSyncService,
  createDailySnapshotService,
  createHealthQueryService,
  createLatestPricingQueryService,
  createLatestPricingSyncService,
} from "@/modules/bootstrap";
import { SkinportDailyIngestionService } from "@/modules/pricing/skinport-daily-ingestion.service";
import {
  catalogProviderSources,
  priceProviderSources,
  resolveCatalogProviderSource,
  resolvePriceProviderSource,
} from "@/modules/providers/provider.types";

const catalogRequestSchema = z
  .object({
    source: z.enum(catalogProviderSources).optional(),
  })
  .default({});

const pricesRequestSchema = z
  .object({
    source: z.enum(priceProviderSources).optional(),
  })
  .default({
    source: undefined,
  });

const snapshotRequestSchema = z
  .object({
    snapshotDate: z.coerce.date().optional(),
    snapshotHour: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    timeZone: z.string().trim().min(1).optional(),
    triggerSource: z.string().trim().min(1).optional(),
  })
  .default({});

const latestPricesQuerySchema = z.object({
  market: z.string().trim().min(1).optional(),
});

export async function handleCatalogSyncRoute(request: Request) {
  try {
    const body = catalogRequestSchema.parse(await readOptionalJson(request));
    const result = await createCatalogSyncService(
      resolveCatalogProviderSource(body.source, resolveCatalogProviderSource(process.env.CATALOG_PROVIDER, "bymykel")),
    ).syncCatalog();

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function handleCatalogRefreshImagesRoute(request: Request) {
  return handleCatalogSyncRoute(request);
}

export async function handleLatestPricesSyncRoute(request: Request) {
  try {
    const body = pricesRequestSchema.parse(await readOptionalJson(request));
    const result = await createLatestPricingSyncService(
      resolvePriceProviderSource(body.source, resolvePriceProviderSource(process.env.PRICE_PROVIDER, "json")),
    ).syncLatestPrices();

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function handleDailySnapshotRoute(request: Request) {
  try {
    const body = snapshotRequestSchema.parse(await readOptionalJson(request));
    const result = await createDailySnapshotService().createDailySnapshot(body);

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function handleSkinportSyncRoute() {
  try {
    const result = await new SkinportDailyIngestionService().syncLatestPrices();

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function handleSkinportSyncAndSnapshotRoute() {
  try {
    const result = await new SkinportDailyIngestionService().syncLatestPricesAndSnapshot();

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function handleLatestPricesQueryRoute(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = latestPricesQuerySchema.parse({
      market: searchParams.get("market") ?? undefined,
    });
    const items = await createLatestPricingQueryService().listLatestPrices(query.market);

    return successResponse(
      {
        count: items.length,
        items,
      },
      200,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function handleHealthRoute() {
  try {
    const health = await createHealthQueryService().getHealth();

    return successResponse(health, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POSTCatalogSync = handleCatalogSyncRoute;
export const POSTCatalogImport = handleCatalogSyncRoute;
export const POSTCatalogRefreshImages = handleCatalogRefreshImagesRoute;
export const POSTPricesSync = handleLatestPricesSyncRoute;
export const POSTDailySnapshot = handleDailySnapshotRoute;
export const POSTSkinportSync = handleSkinportSyncRoute;
export const POSTSkinportSyncAndSnapshot = handleSkinportSyncAndSnapshotRoute;
export const GETLatestPrices = handleLatestPricesQueryRoute;
export const GETHealth = handleHealthRoute;
