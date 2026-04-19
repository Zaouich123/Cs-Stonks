import type {
  PriceProvider,
  PriceProviderFetchInput,
  PriceProviderFetchResult,
  PriceProviderWarning,
  PriceSyncTargetItem,
} from "@/modules/providers/provider.types";
import { normalizeSearchText } from "@/modules/catalog/catalog.normalizer";
import { SkinportClient } from "@/modules/providers/skinport/skinport.client";
import { mapSkinportRecordToRawPrice } from "@/modules/providers/skinport/skinport.mapper";
import type { SkinportPriceProviderConfig } from "@/modules/providers/skinport/skinport.types";

const DEFAULT_BASE_URL = "https://api.skinport.com/v1";
const DEFAULT_APP_ID = 730;
const DEFAULT_CURRENCY = "USD";
const DEFAULT_CHUNK_SIZE = 100;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const MAX_PROVIDER_WARNINGS = 100;

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

function capWarnings(warnings: PriceProviderWarning[]) {
  return warnings.slice(0, MAX_PROVIDER_WARNINGS);
}

function countWarningsByCode(warnings: PriceProviderWarning[]) {
  return warnings.reduce<Record<string, number>>((counts, warning) => {
    counts[warning.code] = (counts[warning.code] ?? 0) + 1;

    return counts;
  }, {});
}

function dedupeSkinportItemsByMarketHashName<T extends { market_hash_name: string; updated_at?: number }>(
  items: T[],
) {
  const map = new Map<string, T>();

  for (const item of items) {
    const key = item.market_hash_name.trim();
    const existing = map.get(key);

    if (!existing || (item.updated_at ?? 0) >= (existing.updated_at ?? 0)) {
      map.set(key, item);
    }
  }

  return [...map.values()];
}

function buildUniqueCanonicalTargetMap(items: PriceSyncTargetItem[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = normalizeSearchText(item.marketHashName);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const map = new Map<string, PriceSyncTargetItem>();

  for (const item of items) {
    const key = normalizeSearchText(item.marketHashName);

    if (counts.get(key) === 1) {
      map.set(key, item);
    }
  }

  return map;
}

export function getSkinportPriceProviderConfig(): SkinportPriceProviderConfig {
  return {
    appId: clampPositiveInteger(process.env.SKINPORT_APP_ID, DEFAULT_APP_ID),
    baseUrl: process.env.SKINPORT_BASE_URL?.trim() || DEFAULT_BASE_URL,
    chunkSize: clampPositiveInteger(process.env.SKINPORT_CHUNK_SIZE, DEFAULT_CHUNK_SIZE),
    currency: process.env.SKINPORT_CURRENCY?.trim().toUpperCase() || DEFAULT_CURRENCY,
    fetchAllSalesHistory: parseBoolean(process.env.SKINPORT_FETCH_ALL_SALES_HISTORY, true),
    fetchSalesHistory: parseBoolean(process.env.SKINPORT_FETCH_SALES_HISTORY, true),
    requestTimeoutMs: clampPositiveInteger(
      process.env.SKINPORT_REQUEST_TIMEOUT_MS,
      DEFAULT_REQUEST_TIMEOUT_MS,
    ),
    tradableOnly: parseBoolean(process.env.SKINPORT_TRADABLE_ONLY, false),
  };
}

export class SkinportPriceProvider implements PriceProvider {
  readonly provider = "skinport_items_provider";

  private readonly client: SkinportClient;

  constructor(
    private readonly config: SkinportPriceProviderConfig = getSkinportPriceProviderConfig(),
    fetchImpl: typeof fetch = fetch,
  ) {
    this.client = new SkinportClient(config, fetchImpl);
  }

  async fetchLatestPrices(input: PriceProviderFetchInput): Promise<PriceProviderFetchResult> {
    const requestedTargets = input.items.length;
    const targetMap = new Map(input.items.map((item) => [item.marketHashName.trim(), item]));
    const canonicalTargetMap = buildUniqueCanonicalTargetMap(input.items);
    const fetchedAt = new Date().toISOString();
    const providerItems = dedupeSkinportItemsByMarketHashName(await this.client.fetchItems());
    const providerItemsMatchedTargets = providerItems
      .map((item) => {
        const exactTarget = targetMap.get(item.market_hash_name.trim());

        if (exactTarget) {
          return {
            item,
            matchType: "exact" as const,
            target: exactTarget,
          };
        }

        const canonicalTarget = canonicalTargetMap.get(normalizeSearchText(item.market_hash_name.trim()));

        if (canonicalTarget) {
          return {
            item,
            matchType: "canonical" as const,
            target: canonicalTarget,
          };
        }

        return null;
      })
      .filter((match): match is NonNullable<typeof match> => match !== null);
    const historyEnabled = this.config.fetchSalesHistory;
    const historyItems = historyEnabled
      ? this.config.fetchAllSalesHistory
        ? await this.client.fetchSalesHistory()
        : await this.client.fetchSalesHistoryForTargets(
            providerItemsMatchedTargets.map((entry) => entry.item.market_hash_name.trim()),
          )
      : [];
    const historyMap = new Map(
      historyItems.map((item) => [item.market_hash_name.trim(), item]),
    );
    const warnings: PriceProviderWarning[] = [];
    const matchedTargetKeys = new Set(providerItemsMatchedTargets.map((entry) => entry.target.marketHashName.trim()));
    const matchedExactCount = providerItemsMatchedTargets.filter((entry) => entry.matchType === "exact").length;
    const matchedCanonicalCount = providerItemsMatchedTargets.filter(
      (entry) => entry.matchType === "canonical",
    ).length;
    const items = providerItemsMatchedTargets
      .map(({ item: providerItem, target }) => {
        const mapped = mapSkinportRecordToRawPrice(
          providerItem,
          historyMap.get(providerItem.market_hash_name.trim()) ?? null,
          target,
          fetchedAt,
        );

        if (!mapped) {
          warnings.push({
            code: "NO_USABLE_PRICE",
            marketHashName: providerItem.market_hash_name,
            message: `Skinport did not expose a usable price for "${providerItem.market_hash_name}".`,
            variantKey: target.variantKey,
          });
        }

        return mapped;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    for (const target of input.items) {
      if (!matchedTargetKeys.has(target.marketHashName.trim())) {
        warnings.push({
          code: "ITEM_NOT_FOUND",
          marketHashName: target.marketHashName,
          message: `Skinport /v1/items did not return "${target.marketHashName}".`,
          variantKey: target.variantKey,
        });
      }
    }

    const skippedTargets = warnings.length;
    const warningCodeCounts = countWarningsByCode(warnings);

    return {
      items,
      summary: {
        attemptedTargets: providerItemsMatchedTargets.length,
        matchedCanonicalCount,
        matchedExactCount,
        providerHistoryRecordsReceived: historyItems.length,
        providerItemsReceived: providerItems.length,
        requestedTargets,
        returnedRecords: items.length,
        skippedTargets,
        truncatedTargets: Math.max(0, warnings.length - MAX_PROVIDER_WARNINGS),
        warningCodeCounts,
        warnings: capWarnings(warnings),
      },
    };
  }
}
