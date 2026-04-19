import type { LatestPriceRepository } from "@/modules/pricing/pricing.types";

export class LatestPricingQueryService {
  constructor(private readonly latestPriceRepository: LatestPriceRepository) {}

  async listLatestPrices(marketSlug?: string) {
    const prices = await this.latestPriceRepository.listLatestPrices(marketSlug);

    return prices.map((price) => ({
      currency: price.currency,
      displayName: price.displayName,
      fetchedAt: price.fetchedAt.toISOString(),
      itemId: price.itemId,
      itemType: price.itemType,
      maxPrice: price.maxPrice,
      marketHashName: price.marketHashName,
      marketId: price.marketId,
      marketName: price.marketName,
      marketSlug: price.marketSlug,
      meanPrice: price.meanPrice,
      medianPrice: price.medianPrice,
      minPrice: price.minPrice,
      phase: price.phase,
      price: price.price,
      quantity: price.quantity,
      rawPayload: price.rawPayload,
      sales24hMedian: price.sales24hMedian,
      sales24hMin: price.sales24hMin,
      sales24hVolume: price.sales24hVolume,
      sales30dMedian: price.sales30dMedian,
      sales30dMin: price.sales30dMin,
      sales30dVolume: price.sales30dVolume,
      sales7dMedian: price.sales7dMedian,
      sales7dMin: price.sales7dMin,
      sales7dVolume: price.sales7dVolume,
      sales90dMedian: price.sales90dMedian,
      sales90dMin: price.sales90dMin,
      sales90dVolume: price.sales90dVolume,
      sourceItemUrl: price.sourceItemUrl,
      sourceMarketUrl: price.sourceMarketUrl,
      sourceUpdatedAt: price.sourceUpdatedAt?.toISOString() ?? null,
      suggestedPrice: price.suggestedPrice,
      variantKey: price.variantKey,
      volume: price.volume,
    }));
  }
}

