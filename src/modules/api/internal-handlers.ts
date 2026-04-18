import { z } from "zod";

import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import {
  createCatalogSyncService,
  createDailySnapshotService,
  createHealthQueryService,
  createLatestPricingQueryService,
  createLatestPricingSyncService,
} from "@/modules/bootstrap";
import {
  catalogProviderSources,
  priceProviderSources,
} from "@/modules/providers/provider.types";

const catalogRequestSchema = z
  .object({
    source: z.enum(catalogProviderSources).default("json"),
  })
  .default({
    source: "json",
  });

const pricesRequestSchema = z
  .object({
    source: z.enum(priceProviderSources).default("json"),
  })
  .default({
    source: "json",
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
    const result = await createCatalogSyncService(body.source).syncCatalog();

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function handleLatestPricesSyncRoute(request: Request) {
  try {
    const body = pricesRequestSchema.parse(await readOptionalJson(request));
    const result = await createLatestPricingSyncService(body.source).syncLatestPrices();

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
export const POSTPricesSync = handleLatestPricesSyncRoute;
export const POSTDailySnapshot = handleDailySnapshotRoute;
export const GETLatestPrices = handleLatestPricesQueryRoute;
export const GETHealth = handleHealthRoute;

