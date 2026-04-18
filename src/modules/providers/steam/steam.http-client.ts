import { z } from "zod";

import type {
  SteamPriceOverviewPayload,
  SteamPriceProviderConfig,
} from "@/modules/providers/steam/steam.types";

const steamPriceOverviewSchema = z.object({
  lowest_price: z.string().trim().min(1).optional(),
  median_price: z.string().trim().min(1).optional(),
  success: z.boolean(),
  volume: z.string().trim().min(1).optional(),
});

export class SteamHttpClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SteamHttpClientError";
  }
}

type FetchLike = typeof fetch;

function buildUrl(baseUrl: string, params: Record<string, string | number | undefined>) {
  const url = new URL("priceoverview/", baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  url.searchParams.set("format", "json");

  return url;
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function withTimeout(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    cleanup: () => clearTimeout(timeout),
    signal: controller.signal,
  };
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Steam HTTP error.";
}

export class SteamHttpClient {
  constructor(
    private readonly config: Pick<
      SteamPriceProviderConfig,
      "appId" | "baseUrl" | "country" | "currencyCode" | "retryCount" | "timeoutMs"
    >,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async getPriceOverview(marketHashName: string): Promise<SteamPriceOverviewPayload> {
    const response = await this.getJson({
      appid: this.config.appId,
      country: this.config.country,
      currency: this.config.currencyCode,
      market_hash_name: marketHashName,
    });

    return steamPriceOverviewSchema.parse(response);
  }

  private async getJson(params: Record<string, string | number | undefined>): Promise<unknown> {
    const maxAttempts = Math.max(1, this.config.retryCount + 1);
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const timeout = withTimeout(this.config.timeoutMs);

      try {
        const response = await this.fetcher(buildUrl(this.config.baseUrl, params), {
          headers: {
            Accept: "application/json",
          },
          method: "GET",
          signal: timeout.signal,
        });

        if (!response.ok) {
          const error = new SteamHttpClientError(
            `Steam request failed with status ${response.status}.`,
            "HTTP_ERROR",
            isRetryableStatus(response.status),
            response.status,
          );

          if (!error.retryable || attempt === maxAttempts) {
            throw error;
          }

          lastError = error;
          continue;
        }

        try {
          return await response.json();
        } catch {
          throw new SteamHttpClientError(
            "Steam response did not contain valid JSON.",
            "INVALID_JSON",
            false,
            response.status,
          );
        }
      } catch (error) {
        if (error instanceof SteamHttpClientError) {
          if (!error.retryable || attempt === maxAttempts) {
            throw error;
          }

          lastError = error;
          continue;
        }

        const wrappedError = new SteamHttpClientError(
          isAbortError(error)
            ? `Steam request timed out after ${this.config.timeoutMs}ms.`
            : `Steam request failed: ${toErrorMessage(error)}`,
          isAbortError(error) ? "TIMEOUT" : "NETWORK_ERROR",
          true,
        );

        if (attempt === maxAttempts) {
          throw wrappedError;
        }

        lastError = wrappedError;
      } finally {
        timeout.cleanup();
      }
    }

    throw (
      lastError ??
      new SteamHttpClientError("Steam request failed unexpectedly.", "UNKNOWN", false)
    );
  }
}
