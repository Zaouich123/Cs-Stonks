import type { RawPriceProviderItem } from "@/modules/providers/provider.types";
import type { SkinportItemRecord, SkinportSalesHistoryItem } from "@/modules/providers/skinport/skinport.types";
import { chooseSkinportChartPrice } from "@/modules/pricing/utils/chooseSkinportChartPrice";

function asIsoDateFromUnix(value: number) {
  return new Date(value * 1000).toISOString();
}

export function mapSkinportRecordToRawPrice(
  item: SkinportItemRecord,
  history?: SkinportSalesHistoryItem | null,
  fetchedAt = new Date().toISOString(),
): RawPriceProviderItem | null {
  const chosenPrice = chooseSkinportChartPrice(item, history);

  if (!chosenPrice) {
    return null;
  }

  return {
    currency: item.currency,
    fetchedAt,
    market: {
      enabled: true,
      name: "Skinport",
      priority: 80,
      slug: "skinport",
    },
    marketHashName: item.market_hash_name.trim(),
    maxPrice: item.max_price,
    meanPrice: item.mean_price,
    medianPrice: item.median_price,
    minPrice: item.min_price,
    phase: null,
    price: chosenPrice.price,
    quantity: item.quantity,
    rawPayload: {
      chosenPriceSource: chosenPrice.source,
      history,
      items: item,
    },
    sourceItemUrl: item.item_page,
    sourceMarketUrl: item.market_page,
    sourceUpdatedAt: asIsoDateFromUnix(item.updated_at),
    suggestedPrice: item.suggested_price,
    volume: history?.last_24_hours.volume ?? null,
  };
}
