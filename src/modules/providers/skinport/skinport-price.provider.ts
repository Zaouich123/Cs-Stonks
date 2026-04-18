import type {
  PriceProvider,
  PriceProviderFetchInput,
  PriceProviderFetchResult,
  PriceProviderWarning,
  RawPriceProviderItem,
} from "@/modules/providers/provider.types";
import type {
  SkinportPriceProviderConfig,
  SkinportPriceWindow,
  SkinportSalesHistoryItem,
} from "@/modules/providers/skinport/skinport.types";

const DEFAULT_BASE_URL = "https://api.skinport.com/v1";
const DEFAULT_APP_ID = 730;
const DEFAULT_CURRENCY = "USD";
const DEFAULT_CHUNK_SIZE = 100;

interface ResolvedSkinportPrice {
  price: number;
  volume: number;
}

function clampPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  return value.trim().toLowerCase() === "true";
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function isFinitePositiveNumber(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function asPositiveNumber(value: number | null): number | null {
  return isFinitePositiveNumber(value) ? value : null;
}

function resolveSkinportPrice(
  windows: Pick<
    SkinportSalesHistoryItem,
    "last_24_hours" | "last_7_days" | "last_30_days" | "last_90_days"
  >,
): ResolvedSkinportPrice | null {
  const candidates: SkinportPriceWindow[] = [
    windows.last_24_hours,
    windows.last_7_days,
    windows.last_30_days,
    windows.last_90_days,
  ];

  for (const window of candidates) {
    if (window.volume <= 0) {
      continue;
    }

    const median = asPositiveNumber(window.median);

    if (median !== null) {
      return {
        price: median,
        volume: window.volume,
      };
    }

    const average = asPositiveNumber(window.avg);

    if (average !== null) {
      return {
        price: average,
        volume: window.volume,
      };
    }
  }

  return null;
}

export function getSkinportPriceProviderConfig(): SkinportPriceProviderConfig {
  return {
    appId: clampPositiveInteger(process.env.SKINPORT_APP_ID, DEFAULT_APP_ID),
    baseUrl: process.env.SKINPORT_BASE_URL?.trim() || DEFAULT_BASE_URL,
    chunkSize: clampPositiveInteger(process.env.SKINPORT_CHUNK_SIZE, DEFAULT_CHUNK_SIZE),
    currency: process.env.SKINPORT_CURRENCY?.trim().toUpperCase() || DEFAULT_CURRENCY,
    fetchAllSalesHistory: parseBoolean(process.env.SKINPORT_FETCH_ALL_SALES_HISTORY, true),
  };
}

export class SkinportPriceProvider implements PriceProvider {
  readonly provider = "skinport_sales_history_provider";

  constructor(
    private readonly config: SkinportPriceProviderConfig = getSkinportPriceProviderConfig(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async fetchLatestPrices(input: PriceProviderFetchInput): Promise<PriceProviderFetchResult> {
    const fetchedAt = new Date().toISOString();
    const uniqueTargets = [...new Map(input.items.map((item) => [item.marketHashName, item])).values()];
    const salesHistory = this.config.fetchAllSalesHistory
      ? await this.fetchSalesHistory()
      : await this.fetchSalesHistoryForTargets(uniqueTargets.map((item) => item.marketHashName));
    const salesHistoryMap = new Map(
      salesHistory.map((item) => [item.market_hash_name.trim(), item]),
    );
    const items: RawPriceProviderItem[] = [];
    const warnings: PriceProviderWarning[] = [];

    for (const target of uniqueTargets) {
      const salesRecord = salesHistoryMap.get(target.marketHashName);

      if (!salesRecord) {
        warnings.push({
          code: "ITEM_NOT_FOUND",
          marketHashName: target.marketHashName,
          message: `Skinport sales history did not return "${target.marketHashName}".`,
          variantKey: target.variantKey,
        });
        continue;
      }

      const resolvedPrice = resolveSkinportPrice(salesRecord);

      if (!resolvedPrice) {
        warnings.push({
          code: "NO_PRICE_HISTORY",
          marketHashName: target.marketHashName,
          message: `Skinport has no usable recent sales price for "${target.marketHashName}".`,
          variantKey: target.variantKey,
        });
        continue;
      }

      items.push({
        currency: salesRecord.currency,
        fetchedAt,
        market: {
          enabled: true,
          name: "Skinport",
          priority: 80,
          slug: "skinport",
        },
        marketHashName: target.marketHashName,
        phase: target.phase,
        price: resolvedPrice.price,
        quantity: null,
        sourceUpdatedAt: null,
        volume: resolvedPrice.volume,
      });
    }

    return {
      items,
      summary: {
        attemptedTargets: uniqueTargets.length,
        requestedTargets: input.items.length,
        returnedRecords: items.length,
        skippedTargets: warnings.length,
        truncatedTargets: 0,
        warnings,
      },
    };
  }

  private async fetchSalesHistory() {
    const response = await this.requestSalesHistory();

    return response;
  }

  private async fetchSalesHistoryForTargets(targets: string[]) {
    const results: SkinportSalesHistoryItem[] = [];

    for (const chunk of chunkArray(targets, this.config.chunkSize)) {
      results.push(...(await this.requestSalesHistory(chunk)));
    }

    return results;
  }

  private async requestSalesHistory(targets: string[] = []) {
    const searchParams = new URLSearchParams({
      app_id: String(this.config.appId),
      currency: this.config.currency,
    });

    if (targets.length > 0) {
      searchParams.set("market_hash_name", targets.join(","));
    }

    const response = await this.fetchImpl(
      `${this.config.baseUrl}/sales/history?${searchParams.toString()}`,
      {
        headers: {
          "Accept-Encoding": "br",
        },
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(`Skinport sales history request failed with status ${response.status}.`);
    }

    return (await response.json()) as SkinportSalesHistoryItem[];
  }
}
