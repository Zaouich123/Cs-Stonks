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
      sourceItemUrl: price.sourceItemUrl,
      sourceMarketUrl: price.sourceMarketUrl,
      sourceUpdatedAt: price.sourceUpdatedAt?.toISOString() ?? null,
      suggestedPrice: price.suggestedPrice,
      variantKey: price.variantKey,
      volume: price.volume,
    }));
  }
}

