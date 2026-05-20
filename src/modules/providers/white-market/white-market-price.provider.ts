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
  clampPositiveInteger,
  countWarningsByCode,
  createPriceTargetMatcher,
} from "@/modules/providers/price-provider.utils";

const DEFAULT_EXPORT_URL = "https://export.white.market/v1/prices/730.json";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_TIMEOUT_MS = 45_000;

interface WhiteMarketPriceRecord {
  cheapest_asset_id?: number | string | null;
  cheapest_float?: number | null;
  inspect_link?: string | null;
  market_hash_name?: string | null;
  market_product_count?: number | null;
  market_product_link?: string | null;
  paint_index?: string | number | null;
  paint_seed?: string | number | null;
  price?: string | number | null;
}

export interface WhiteMarketPriceProviderConfig {
  currency: string;
  exportUrl: string;
  requestTimeoutMs: number;
}

function readPositiveDecimal(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readQuantity(value?: number | null) {
  return typeof value === "number" && value >= 0 ? Math.trunc(value) : null;
}

function buildWhiteMarketUrl(name: string) {
  const url = new URL("https://white.market/item");
  url.searchParams.set("appId", "730");
  url.searchParams.set("nameHash", name);

  return url.toString();
}

export function getWhiteMarketPriceProviderConfig(): WhiteMarketPriceProviderConfig {
  return {
    currency: process.env.WHITE_MARKET_CURRENCY?.trim().toUpperCase() || DEFAULT_CURRENCY,
    exportUrl: process.env.WHITE_MARKET_EXPORT_URL?.trim() || DEFAULT_EXPORT_URL,
    requestTimeoutMs: clampPositiveInteger(
      process.env.WHITE_MARKET_REQUEST_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
    ),
  };
}

export class WhiteMarketPriceProvider implements PriceProvider {
  readonly provider = "white_market_prices_provider";

  constructor(
    private readonly config: WhiteMarketPriceProviderConfig = getWhiteMarketPriceProviderConfig(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async fetchLatestPrices(input: PriceProviderFetchInput): Promise<PriceProviderFetchResult> {
    const fetchedAt = new Date().toISOString();
    const providerItems = await this.fetchPrices();
    const matcher = createPriceTargetMatcher(input.items);
    const warnings: PriceProviderWarning[] = [];
    const matchedVariantKeys = new Set<string>();
    let matchedExactCount = 0;
    let matchedCanonicalCount = 0;
    const items: RawPriceProviderItem[] = [];

    for (const providerItem of providerItems) {
      const providerName = providerItem.market_hash_name?.trim();

      if (!providerName) {
        warnings.push({
          code: "INVALID_PROVIDER_RECORD",
          message: "white.market returned a price record without market_hash_name.",
        });
        continue;
      }

      const match = matcher.match(providerName);

      if (!match) {
        continue;
      }

      matchedVariantKeys.add(match.target.variantKey);
      matchedExactCount += match.matchType === "exact" ? 1 : 0;
      matchedCanonicalCount += match.matchType === "canonical" ? 1 : 0;

      const price = readPositiveDecimal(providerItem.price);

      if (!price) {
        warnings.push({
          code: "NO_USABLE_PRICE",
          marketHashName: providerName,
          message: `white.market did not expose a usable price for "${providerName}".`,
          variantKey: match.target.variantKey,
        });
        continue;
      }

      const quantity = readQuantity(providerItem.market_product_count);

      items.push({
        currency: this.config.currency,
        fetchedAt,
        market: {
          enabled: true,
          name: "white.market",
          priority: 55,
          slug: "white-market",
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
          provider: "white-market",
          providerName,
          record: providerItem as Record<string, unknown>,
        },
        sourceItemUrl: providerItem.market_product_link ?? buildWhiteMarketUrl(providerName),
        sourceMarketUrl: providerItem.market_product_link ?? buildWhiteMarketUrl(providerName),
        variantKeyOverride: match.target.variantKey,
        volume: quantity,
      });
    }

    warnings.push(...buildMissingTargetWarnings(input.items, matchedVariantKeys, "white.market"));

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
        warningCodeCounts: countWarningsByCode(warnings),
        warnings: capWarnings(warnings),
      },
    };
  }

  private async fetchPrices() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await this.fetchImpl(this.config.exportUrl, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ApplicationError(
          `white.market export request failed with status ${response.status}.`,
          response.status,
        );
      }

      const data = (await response.json()) as unknown;

      return Array.isArray(data) ? (data as WhiteMarketPriceRecord[]) : [];
    } finally {
      clearTimeout(timeout);
    }
  }
}
