import type {
  CsfloatClientConfig,
  CsfloatListing,
  CsfloatListingsQuery,
  CsfloatListingsResponse,
  CsfloatPriceListRecord,
} from "@/modules/providers/csfloat/csfloat.types";

const DEFAULT_BASE_URL = "https://csfloat.com/api/v1";
const MAX_LISTINGS_LIMIT = 50;

function clampLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return MAX_LISTINGS_LIMIT;
  }

  return Math.max(1, Math.min(MAX_LISTINGS_LIMIT, Math.floor(limit)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asListings(value: unknown): CsfloatListing[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord) as CsfloatListing[];
}

function firstListingsPayload(payload: Record<string, unknown>): CsfloatListing[] {
  const candidates = [payload.listings, payload.data, payload.results, payload.items];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return asListings(candidate);
    }

    if (isRecord(candidate)) {
      const nested = firstListingsPayload(candidate);

      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function readCursorPayload(payload: Record<string, unknown>): string | null {
  const direct =
    asString(payload.cursor) ??
    asString(payload.next_cursor) ??
    asString(payload.nextCursor);

  if (direct) {
    return direct;
  }

  if (isRecord(payload.data)) {
    return readCursorPayload(payload.data);
  }

  return null;
}

function readListingsPayload(payload: unknown): CsfloatListingsResponse {
  if (Array.isArray(payload)) {
    return {
      cursor: null,
      listings: asListings(payload),
    };
  }

  if (!isRecord(payload)) {
    return {
      cursor: null,
      listings: [],
    };
  }

  return {
    cursor: readCursorPayload(payload),
    listings: firstListingsPayload(payload),
  };
}

function retryAfterToMs(value: string | null, fallbackMs: number) {
  if (!value) {
    return fallbackMs;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const date = Date.parse(value);

  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return fallbackMs;
}

function sleep(ms: number) {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class CsfloatClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "CsfloatClientError";
  }
}

export function resolveCsfloatClientConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): CsfloatClientConfig {
  return {
    apiKey: env.CSFLOAT_API_KEY ?? "",
    backoffMs: Number(env.CSFLOAT_BACKOFF_MS ?? 30000),
    baseUrl: (env.CSFLOAT_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, ""),
    currency: "USD",
    limit: clampLimit(Number(env.CSFLOAT_LISTINGS_LIMIT ?? 50)),
    maxRetries: Math.max(0, Number(env.CSFLOAT_MAX_RETRIES ?? 3)),
    requestTimeoutMs: Math.max(1000, Number(env.CSFLOAT_TIMEOUT_MS ?? 30000)),
  };
}

export class CsfloatClient {
  constructor(
    private readonly config: CsfloatClientConfig = resolveCsfloatClientConfigFromEnv(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async getListings(query: CsfloatListingsQuery = {}): Promise<CsfloatListingsResponse> {
    const searchParams = new URLSearchParams();
    const limit = clampLimit(query.limit ?? this.config.limit);

    searchParams.set("limit", String(limit));

    if (query.cursor) {
      searchParams.set("cursor", query.cursor);
    }

    if (query.sortBy) {
      searchParams.set("sort_by", query.sortBy);
    }

    if (query.category) {
      searchParams.set("category", query.category);
    }

    if (query.marketHashName) {
      searchParams.set("market_hash_name", query.marketHashName);
    }

    if (query.type) {
      searchParams.set("type", query.type);
    }

    if (Number.isFinite(query.minPrice)) {
      searchParams.set("min_price", String(query.minPrice));
    }

    if (Number.isFinite(query.maxPrice)) {
      searchParams.set("max_price", String(query.maxPrice));
    }

    return this.requestListings(`/listings?${searchParams.toString()}`);
  }

  async getPriceList(): Promise<CsfloatPriceListRecord[]> {
    return this.requestJson<CsfloatPriceListRecord[]>("/listings/price-list");
  }

  private async requestListings(path: string): Promise<CsfloatListingsResponse> {
    return readListingsPayload(await this.requestJson<unknown>(path));
  }

  private async requestJson<T>(path: string): Promise<T> {
    if (!this.config.apiKey.trim()) {
      throw new CsfloatClientError("CSFLOAT_API_KEY is required to call CSFloat.", 400, false);
    }

    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, this.config.requestTimeoutMs);

      try {
        const response = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
          headers: {
            Accept: "application/json",
            Authorization: this.config.apiKey,
          },
          method: "GET",
          signal: controller.signal,
        });

        if ((response.status === 429 || response.status >= 500) && attempt < this.config.maxRetries) {
          clearTimeout(timeout);
          await sleep(retryAfterToMs(response.headers.get("Retry-After"), this.config.backoffMs));
          attempt += 1;
          continue;
        }

        if (!response.ok) {
          throw new CsfloatClientError(
            `CSFloat request failed with status ${response.status} for ${path}.`,
            response.status,
            response.status === 429 || response.status >= 500,
          );
        }

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new CsfloatClientError(
            `CSFloat request timed out after ${this.config.requestTimeoutMs}ms for ${path}.`,
            undefined,
            true,
          );
        }

        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new CsfloatClientError(`CSFloat request exhausted retries for ${path}.`, 429, true);
  }
}
