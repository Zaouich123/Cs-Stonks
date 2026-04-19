import type { PriceSyncTargetItem, RawPriceProviderItem } from "@/modules/providers/provider.types";
import type { SkinportItemRecord, SkinportSalesHistoryItem } from "@/modules/providers/skinport/skinport.types";
import { chooseSkinportChartPrice } from "@/modules/pricing/utils/chooseSkinportChartPrice";

function asIsoDateFromUnix(value: number) {
  return new Date(value * 1000).toISOString();
}

function toSalesWindowMetrics(window: SkinportSalesHistoryItem["last_24_hours"] | undefined) {
  if (!window) {
    return {
      median: null,
      min: null,
      volume: null,
    };
  }

  return {
    median: window.median,
    min: window.min,
    volume: window.volume,
  };
}

export function mapSkinportRecordToRawPrice(
  item: SkinportItemRecord,
  history?: SkinportSalesHistoryItem | null,
  matchedTarget?: PriceSyncTargetItem | null,
  fetchedAt = new Date().toISOString(),
): RawPriceProviderItem | null {
  const chosenPrice = chooseSkinportChartPrice(item, history);

  if (!chosenPrice) {
    return null;
  }

  const sales24h = toSalesWindowMetrics(history?.last_24_hours);
  const sales7d = toSalesWindowMetrics(history?.last_7_days);
  const sales30d = toSalesWindowMetrics(history?.last_30_days);
  const sales90d = toSalesWindowMetrics(history?.last_90_days);

  return {
    currency: item.currency,
    fetchedAt,
    market: {
      enabled: true,
      name: "Skinport",
      priority: 80,
      slug: "skinport",
    },
    marketHashName: matchedTarget?.marketHashName ?? item.market_hash_name.trim(),
    maxPrice: item.max_price,
    meanPrice: item.mean_price,
    medianPrice: item.median_price,
    minPrice: item.min_price,
    phase: matchedTarget?.phase ?? null,
    price: chosenPrice.price,
    quantity: item.quantity,
    rawPayload: {
      chosenPriceSource: chosenPrice.source,
      history,
      items: item,
      matchedTarget: matchedTarget
        ? {
            itemId: matchedTarget.itemId,
            marketHashName: matchedTarget.marketHashName,
            variantKey: matchedTarget.variantKey,
          }
        : null,
      providerMarketHashName: item.market_hash_name.trim(),
    },
    sales24hMedian: sales24h.median,
    sales24hMin: sales24h.min,
    sales24hVolume: sales24h.volume,
    sales30dMedian: sales30d.median,
    sales30dMin: sales30d.min,
    sales30dVolume: sales30d.volume,
    sales7dMedian: sales7d.median,
    sales7dMin: sales7d.min,
    sales7dVolume: sales7d.volume,
    sales90dMedian: sales90d.median,
    sales90dMin: sales90d.min,
    sales90dVolume: sales90d.volume,
    sourceItemUrl: item.item_page,
    sourceMarketUrl: item.market_page,
    sourceUpdatedAt: asIsoDateFromUnix(item.updated_at),
    suggestedPrice: item.suggested_price,
    variantKeyOverride: matchedTarget?.variantKey ?? null,
    volume: sales24h.volume,
  };
}
