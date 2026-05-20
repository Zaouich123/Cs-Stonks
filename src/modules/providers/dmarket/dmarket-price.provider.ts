import { ApplicationError } from "@/lib/errors";
import type {
  PriceProvider,
  PriceProviderFetchInput,
  PriceProviderFetchResult,
  PriceProviderWarning,
  RawPriceProviderItem,
} from "@/modules/providers/provider.types";
import {
  buildMissingTargetWarnings,
  capWarnings,
  chunkArray,
  clampPositiveInteger,
  countWarningsByCode,
  createPriceTargetMatcher,
  sleep,
} from "@/modules/providers/price-provider.utils";

const DEFAULT_BASE_URL = "https://api.dmarket.com";
const DEFAULT_GAME_ID = "a8db";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_DELAY_MS = 250;
const DEFAULT_TIMEOUT_MS = 30_000;

interface DmarketMoney {
  Amount?: string | null;
  Currency?: string | null;
}

interface DmarketAggregatedPrice {
  offerBestPrice?: DmarketMoney | null;
  offerCount?: string | null;
  orderBestPrice?: DmarketMoney | null;
  orderCount?: string | null;
  title?: string | null;
}

interface DmarketAggregatedPricesResponse {
  aggregatedPrices?: DmarketAggregatedPrice[] | null;
  nextCursor?: string | null;
}

export interface DmarketPriceProviderConfig {
  baseUrl: string;
  batchSize: number;
  currency: string;
  delayMs: number;
  gameId: string;
  requestTimeoutMs: number;
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function readPositiveMoneyAmount(value?: string | null) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed / 100 : null;
}

function readNonNegativeInteger(value?: string | null) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function buildDmarketSearchUrl(title: string) {
  const url = new URL("https://dmarket.com/ingame-items/item-list/csgo-skins");
  url.searchParams.set("title", title);

  return url.toString();
}

export function getDmarketPriceProviderConfig(): DmarketPriceProviderConfig {
  return {
    baseUrl: normalizeBaseUrl(process.env.DMARKET_BASE_URL?.trim() || DEFAULT_BASE_URL),
    batchSize: clampPositiveInteger(process.env.DMARKET_BATCH_SIZE, DEFAULT_BATCH_SIZE),
    currency: process.env.DMARKET_CURRENCY?.trim().toUpperCase() || DEFAULT_CURRENCY,
    delayMs: Math.max(0, Number(process.env.DMARKET_DELAY_MS ?? DEFAULT_DELAY_MS)),
    gameId: process.env.DMARKET_GAME_ID?.trim() || DEFAULT_GAME_ID,
    requestTimeoutMs: clampPositiveInteger(
      process.env.DMARKET_REQUEST_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
    ),
  };
}

export class DmarketPriceProvider implements PriceProvider {
  readonly provider = "dmarket_aggregated_prices_provider";

  constructor(
    private readonly config: DmarketPriceProviderConfig = getDmarketPriceProviderConfig(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async fetchLatestPrices(input: PriceProviderFetchInput): Promise<PriceProviderFetchResult> {
    const fetchedAt = new Date().toISOString();
    const matcher = createPriceTargetMatcher(input.items);
    const uniqueMarketHashNames = [...new Set(input.items.map((item) => item.marketHashName.trim()))];
    const providerItems: DmarketAggregatedPrice[] = [];

    for (const [chunkIndex, titleChunk] of chunkArray(uniqueMarketHashNames, this.config.batchSize).entries()) {
      if (chunkIndex > 0 && this.config.delayMs > 0) {
        await sleep(this.config.delayMs);
      }

      providerItems.push(...(await this.fetchAggregatedPrices(titleChunk)));
    }

    const warnings: PriceProviderWarning[] = [];
    const matchedVariantKeys = new Set<string>();
    let matchedExactCount = 0;
    let matchedCanonicalCount = 0;
    const items: RawPriceProviderItem[] = [];

    for (const providerItem of providerItems) {
      const providerTitle = providerItem.title?.trim();

      if (!providerTitle) {
        warnings.push({
          code: "INVALID_PROVIDER_RECORD",
          message: "DMarket returned an aggregated price record without a title.",
        });
        continue;
      }

      const match = matcher.match(providerTitle);

      if (!match) {
        continue;
      }

      matchedVariantKeys.add(match.target.variantKey);
      matchedExactCount += match.matchType === "exact" ? 1 : 0;
      matchedCanonicalCount += match.matchType === "canonical" ? 1 : 0;

      const price = readPositiveMoneyAmount(providerItem.offerBestPrice?.Amount);

      if (!price) {
        warnings.push({
          code: "NO_USABLE_PRICE",
          marketHashName: providerTitle,
          message: `DMarket did not expose a usable offerBestPrice for "${providerTitle}".`,
          variantKey: match.target.variantKey,
        });
        continue;
      }

      const quantity = readNonNegativeInteger(providerItem.offerCount);
      const suggestedPrice = readPositiveMoneyAmount(providerItem.orderBestPrice?.Amount);

      items.push({
        currency: providerItem.offerBestPrice?.Currency?.trim().toUpperCase() || this.config.currency,
        fetchedAt,
        market: {
          enabled: true,
          name: "DMarket",
          priority: 60,
          slug: "dmarket",
        },
        marketHashName: match.target.marketHashName,
        minPrice: price,
        phase: match.target.phase,
        price,
        quantity,
        rawPayload: {
          matchedTarget: {
            itemId: match.target.itemId,
            marketHashName: match.target.marketHashName,
            variantKey: match.target.variantKey,
          },
          provider: "dmarket",
          providerTitle,
          record: providerItem as Record<string, unknown>,
        },
        sourceMarketUrl: buildDmarketSearchUrl(providerTitle),
        suggestedPrice,
        variantKeyOverride: match.target.variantKey,
        volume: quantity,
      });
    }

    warnings.push(...buildMissingTargetWarnings(input.items, matchedVariantKeys, "DMarket"));

    const warningCodeCounts = countWarningsByCode(warnings);

    return {
      items,
      summary: {
        attemptedTargets: matchedVariantKeys.size,
        matchedCanonicalCount,
        matchedExactCount,
        providerItemsReceived: providerItems.length,
        requestedTargets: input.items.length,
        returnedRecords: items.length,
        skippedTargets: warnings.length,
        truncatedTargets: Math.max(0, warnings.length - 100),
        warningCodeCounts,
        warnings: capWarnings(warnings),
      },
    };
  }

  private async fetchAggregatedPrices(titles: string[]) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await this.fetchImpl(`${this.config.baseUrl}/marketplace-api/v1/aggregated-prices`, {
        body: JSON.stringify({
          cursor: "",
          filter: {
            game: this.config.gameId,
            titles,
          },
          limit: String(titles.length),
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ApplicationError(
          `DMarket aggregated prices request failed with status ${response.status}.`,
          response.status,
        );
      }

      const data = (await response.json()) as DmarketAggregatedPricesResponse;

      return Array.isArray(data.aggregatedPrices) ? data.aggregatedPrices : [];
    } finally {
      clearTimeout(timeout);
    }
  }
}
