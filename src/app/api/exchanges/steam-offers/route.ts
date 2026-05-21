import { z } from "zod";

import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import { ApplicationError } from "@/lib/errors";
import { ExchangeValuationService } from "@/modules/exchanges/exchangeValuationService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const requestSchema = z.object({
  activeOnly: z.boolean().default(true),
  getReceivedOffers: z.boolean().default(true),
  getSentOffers: z.boolean().default(true),
  steamApiKey: z
    .string()
    .trim()
    .min(32, "Steam Web API key must be 32 hexadecimal characters.")
    .max(64, "Steam Web API key is too long.")
    .regex(/^[a-fA-F0-9]{32}$/, "Steam Web API key must be 32 hexadecimal characters.")
    .optional(),
  tradeOfferId: z
    .string()
    .trim()
    .regex(/^\d{6,32}$/, "Trade offer ID must be numeric.")
    .optional()
    .or(z.literal("")),
});

function getDevelopmentSteamApiKeyFallback() {
  const key = process.env.STEAM_WEB_API_KEY?.trim() ?? "";

  if (process.env.NODE_ENV === "production" || !/^[a-fA-F0-9]{32}$/.test(key)) {
    return null;
  }

  return key;
}

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
    const steamApiKey = body.steamApiKey ?? getDevelopmentSteamApiKeyFallback();

    if (!steamApiKey) {
      throw new ApplicationError("Steam Web API key is required.", 400);
    }

    const result = await new ExchangeValuationService().analyzeSteamOffers({
      ...body,
      steamApiKey,
    });

    return withNoStore(successResponse(result, 200));
  } catch (error) {
    return withNoStore(handleRouteError(error));
  }
}
