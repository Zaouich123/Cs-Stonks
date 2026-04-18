import { ItemType } from "@prisma/client";
import { z } from "zod";

import { handleRouteError, successResponse } from "@/lib/api";
import { createItemQueryService } from "@/modules/bootstrap";
import {
  itemHistorySortOptions,
  itemLatestPriceSortOptions,
  itemListSortOptions,
} from "@/modules/items/item.types";

const listItemsQuerySchema = z.object({
  itemType: z.nativeEnum(ItemType).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).default(1),
  query: z.string().trim().min(1).optional(),
  sort: z.enum(itemListSortOptions).default("displayName_asc"),
});

const itemParamsSchema = z.object({
  itemId: z.string().trim().min(1),
});

const latestPricesQuerySchema = z.object({
  sort: z.enum(itemLatestPriceSortOptions).default("market_asc"),
});

const historyQuerySchema = z.object({
  from: z.coerce.date().optional(),
  market: z.string().trim().min(1).optional(),
  sort: z.enum(itemHistorySortOptions).default("asc"),
  to: z.coerce.date().optional(),
});

async function readItemId(context: { params: Promise<{ itemId: string }> }) {
  const params = await context.params;
  const parsed = itemParamsSchema.parse(params);

  return parsed.itemId;
}

export async function handleListItemsRoute(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listItemsQuerySchema.parse({
      itemType: searchParams.get("itemType") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      query: searchParams.get("query") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    });
    const result = await createItemQueryService().listItems(query);

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function handleGetItemRoute(
  _request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const itemId = await readItemId(context);
    const result = await createItemQueryService().getItemById(itemId);

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function handleGetItemLatestPricesRoute(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const itemId = await readItemId(context);
    const { searchParams } = new URL(request.url);
    const query = latestPricesQuerySchema.parse({
      sort: searchParams.get("sort") ?? undefined,
    });
    const result = await createItemQueryService().getLatestPricesByItem({
      itemId,
      sort: query.sort,
    });

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function handleGetItemHistoryRoute(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const itemId = await readItemId(context);
    const { searchParams } = new URL(request.url);
    const query = historyQuerySchema.parse({
      from: searchParams.get("from") ?? undefined,
      market: searchParams.get("market") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    const result = await createItemQueryService().getItemHistory({
      from: query.from,
      itemId,
      market: query.market,
      sort: query.sort,
      to: query.to,
    });

    return successResponse(result, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GETItems = handleListItemsRoute;
export const GETItemById = handleGetItemRoute;
export const GETItemLatestPrices = handleGetItemLatestPricesRoute;
export const GETItemHistory = handleGetItemHistoryRoute;
