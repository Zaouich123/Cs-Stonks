import { z } from "zod";

import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import { ApplicationError } from "@/lib/errors";
import { ExchangeValuationService } from "@/modules/exchanges/exchangeValuationService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const manualItemSchema = z.object({
  amount: z.coerce.number().int().min(1).max(10000),
  itemId: z.string().trim().min(1),
});

const requestSchema = z.object({
  itemsToGive: z.array(manualItemSchema).max(50).default([]),
  itemsToReceive: z.array(manualItemSchema).max(50).default([]),
});

function withNoStore(response: Response) {
  response.headers.set("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Robots-Tag", "noindex");

  return response;
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return;
  }

  try {
    if (new URL(origin).host !== host) {
      throw new ApplicationError("Cross-origin exchange analysis is not allowed.", 403);
    }
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }

    throw new ApplicationError("Invalid request origin.", 403);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireManagementSession();

    const body = requestSchema.parse(await readOptionalJson(request));

    if (body.itemsToGive.length === 0 && body.itemsToReceive.length === 0) {
      throw new ApplicationError("At least one item is required to analyze an exchange.", 400);
    }

    const result = await new ExchangeValuationService().analyzeManualOffer(body);

    return withNoStore(successResponse(result, 200));
  } catch (error) {
    return withNoStore(handleRouteError(error));
  }
}
