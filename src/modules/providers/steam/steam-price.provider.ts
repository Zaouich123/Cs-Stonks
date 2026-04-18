import {
  SteamHttpClient,
  SteamHttpClientError,
} from "@/modules/providers/steam/steam.http-client";
import type {
  SteamPriceOverviewPayload,
  SteamPriceProviderConfig,
} from "@/modules/providers/steam/steam.types";
import type {
  PriceProvider,
  PriceProviderFetchInput,
  PriceProviderFetchResult,
  PriceProviderWarning,
  RawPriceProviderItem,
} from "@/modules/providers/provider.types";

const DEFAULT_BASE_URL = "https://steamcommunity.com/market/";
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_APP_ID = 730;
const DEFAULT_COUNTRY = "US";
const DEFAULT_CURRENCY_CODE = 1;

function clampPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function resolveMaxItems(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function parseSteamPrice(value: string) {
  const numericPart = value.replace(/[^0-9,.\-]/g, "").trim();

  if (!numericPart) {
    throw new Error(`Unable to parse Steam price "${value}".`);
  }

  const commaCount = (numericPart.match(/,/g) ?? []).length;
  const dotCount = (numericPart.match(/\./g) ?? []).length;
  let normalized = numericPart;

  if (commaCount > 0 && dotCount > 0) {
    normalized = numericPart.replace(/,/g, "");
  } else if (commaCount > 0 && dotCount === 0) {
    normalized = numericPart.replace(",", ".");
  } else if (dotCount > 1) {
    normalized = numericPart.replace(/\./g, "");
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Unable to parse Steam price "${value}".`);
  }

  return Math.round(parsed * 100) / 100;
}

function parseSteamVolume(value?: string) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");

  return digits ? Number(digits) : null;
}

export function getSteamPriceProviderConfig(): SteamPriceProviderConfig {
  return {
    appId: clampPositiveInteger(process.env.REAL_PROVIDER_APP_ID, DEFAULT_APP_ID),
    baseUrl: process.env.REAL_PROVIDER_BASE_URL?.trim() || DEFAULT_BASE_URL,
    concurrency: clampPositiveInteger(process.env.REAL_PROVIDER_CONCURRENCY, DEFAULT_CONCURRENCY),
    country: process.env.REAL_PROVIDER_COUNTRY?.trim().toUpperCase() || DEFAULT_COUNTRY,
    currencyCode: clampPositiveInteger(
      process.env.REAL_PROVIDER_CURRENCY_CODE,
      DEFAULT_CURRENCY_CODE,
    ),
    maxItems: resolveMaxItems(process.env.REAL_PROVIDER_MAX_ITEMS),
    retryCount: clampPositiveInteger(process.env.REAL_PROVIDER_RETRY_COUNT, DEFAULT_RETRY_COUNT),
    timeoutMs: clampPositiveInteger(process.env.REAL_PROVIDER_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
  };
}

interface TargetFetchResult {
  record: RawPriceProviderItem | null;
  warning: PriceProviderWarning | null;
}

function toRawPrice(
  overview: SteamPriceOverviewPayload,
  fetchedAt: string,
  marketHashName: string,
  phase: string | null,
): RawPriceProviderItem {
  return {
    currency: "USD",
    fetchedAt,
    market: {
      enabled: true,
      name: "Steam Community Market",
      priority: 100,
      slug: "steam",
    },
    marketHashName,
    phase,
    price: parseSteamPrice(overview.lowest_price ?? ""),
    quantity: null,
    sourceUpdatedAt: null,
    volume: parseSteamVolume(overview.volume),
  };
}

async function mapWithConcurrency<TInput, TOutput>(
  inputs: TInput[],
  concurrency: number,
  mapper: (input: TInput) => Promise<TOutput>,
) {
  const results = new Array<TOutput>(inputs.length);
  let index = 0;

  const workers = Array.from({ length: Math.min(concurrency, inputs.length) }, async () => {
    while (true) {
      const currentIndex = index;
      index += 1;

      if (currentIndex >= inputs.length) {
        return;
      }

      results[currentIndex] = await mapper(inputs[currentIndex]);
    }
  });

  await Promise.all(workers);

  return results;
}

export class SteamPriceProvider implements PriceProvider {
  readonly provider = "steam_market_price_provider";

  private readonly client: SteamHttpClient;

  constructor(
    private readonly config: SteamPriceProviderConfig = getSteamPriceProviderConfig(),
    client?: SteamHttpClient,
  ) {
    this.client = client ?? new SteamHttpClient(config);
  }

  async fetchLatestPrices(input: PriceProviderFetchInput): Promise<PriceProviderFetchResult> {
    const requestedTargets = input.items.length;
    const truncatedTargets =
      this.config.maxItems === null || requestedTargets <= this.config.maxItems
        ? 0
        : requestedTargets - this.config.maxItems;
    const targets =
      this.config.maxItems === null ? input.items : input.items.slice(0, this.config.maxItems);
    const fetchedAt = new Date().toISOString();
    const targetResults = await mapWithConcurrency(targets, this.config.concurrency, async (target) =>
      this.fetchTargetPrice(target.marketHashName, target.phase, target.variantKey, fetchedAt),
    );
    const warnings = targetResults
      .map((result) => result.warning)
      .filter((warning): warning is PriceProviderWarning => warning !== null);
    const items = targetResults
      .map((result) => result.record)
      .filter((record): record is RawPriceProviderItem => record !== null);

    return {
      items,
      summary: {
        attemptedTargets: targets.length,
        requestedTargets,
        returnedRecords: items.length,
        skippedTargets: warnings.length,
        truncatedTargets,
        warnings,
      },
    };
  }

  private async fetchTargetPrice(
    marketHashName: string,
    phase: string | null,
    variantKey: string,
    fetchedAt: string,
  ): Promise<TargetFetchResult> {
    try {
      const overview = await this.client.getPriceOverview(marketHashName);

      if (!overview.success || !overview.lowest_price) {
        return {
          record: null,
          warning: {
            code: "NO_ACTIVE_PRICE",
            marketHashName,
            message: `No public Steam price found for "${marketHashName}".`,
            variantKey,
          },
        };
      }

      return {
        record: toRawPrice(overview, fetchedAt, marketHashName, phase),
        warning: null,
      };
    } catch (error) {
      const providerError =
        error instanceof SteamHttpClientError
          ? error
          : new SteamHttpClientError(
              error instanceof Error ? error.message : "Unknown Steam provider error.",
              "UNKNOWN",
              false,
            );

      return {
        record: null,
        warning: {
          code: providerError.code,
          marketHashName,
          message: providerError.message,
          variantKey,
        },
      };
    }
  }
}
