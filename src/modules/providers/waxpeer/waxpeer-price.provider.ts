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

const DEFAULT_BASE_URL = "https://api.waxpeer.com/v1/prices";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_GAME = "csgo";
const DEFAULT_TIMEOUT_MS = 30_000;

interface WaxpeerPriceRecord {
  count?: number | null;
  img?: string | null;
  min?: number | null;
  name?: string | null;
  rarity_color?: string | null;
  steam_price?: number | null;
  type?: string | null;
}

interface WaxpeerPricesResponse {
  items?: WaxpeerPriceRecord[] | null;
  success?: boolean | null;
}

export interface WaxpeerPriceProviderConfig {
  baseUrl: string;
  currency: string;
  game: string;
  requestTimeoutMs: number;
}

function readWaxpeerPrice(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value / 1000
    : null;
}

function buildWaxpeerMarketUrl(name: string) {
  const url = new URL("https://waxpeer.com/");
  url.searchParams.set("search", name);

  return url.toString();
}

export function getWaxpeerPriceProviderConfig(): WaxpeerPriceProviderConfig {
  return {
    baseUrl: process.env.WAXPEER_BASE_URL?.trim() || DEFAULT_BASE_URL,
    currency: process.env.WAXPEER_CURRENCY?.trim().toUpperCase() || DEFAULT_CURRENCY,
    game: process.env.WAXPEER_GAME?.trim() || DEFAULT_GAME,
    requestTimeoutMs: clampPositiveInteger(
      process.env.WAXPEER_REQUEST_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
    ),
  };
}

export class WaxpeerPriceProvider implements PriceProvider {
  readonly provider = "waxpeer_prices_provider";

  constructor(
    private readonly config: WaxpeerPriceProviderConfig = getWaxpeerPriceProviderConfig(),
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
      const providerName = providerItem.name?.trim();

      if (!providerName) {
        warnings.push({
          code: "INVALID_PROVIDER_RECORD",
          message: "WAXPEER returned a price record without a name.",
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

      const price = readWaxpeerPrice(providerItem.min);

      if (!price) {
        warnings.push({
          code: "NO_USABLE_PRICE",
          marketHashName: providerName,
          message: `WAXPEER did not expose a usable min price for "${providerName}".`,
          variantKey: match.target.variantKey,
        });
        continue;
      }

      const quantity =
        typeof providerItem.count === "number" && providerItem.count >= 0
          ? Math.trunc(providerItem.count)
          : null;
      const steamSuggestedPrice = readWaxpeerPrice(providerItem.steam_price);

      items.push({
        currency: this.config.currency,
        fetchedAt,
        market: {
          enabled: true,
          name: "WAXPEER",
          priority: 65,
          slug: "waxpeer",
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
          provider: "waxpeer",
          providerName,
          record: providerItem as Record<string, unknown>,
        },
        sourceItemUrl: providerItem.img ?? null,
        sourceMarketUrl: buildWaxpeerMarketUrl(providerName),
        suggestedPrice: steamSuggestedPrice,
        variantKeyOverride: match.target.variantKey,
        volume: quantity,
      });
    }

    warnings.push(...buildMissingTargetWarnings(input.items, matchedVariantKeys, "WAXPEER"));

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
    const url = new URL(this.config.baseUrl);
    url.searchParams.set("game", this.config.game);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ApplicationError(
          `WAXPEER prices request failed with status ${response.status}.`,
          response.status,
        );
      }

      const data = (await response.json()) as WaxpeerPricesResponse;

      if (data.success === false) {
        throw new ApplicationError("WAXPEER prices request returned success=false.", 502, data);
      }

      return Array.isArray(data.items) ? data.items : [];
    } finally {
      clearTimeout(timeout);
    }
  }
}
