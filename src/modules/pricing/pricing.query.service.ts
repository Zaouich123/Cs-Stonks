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
      marketHashName: price.marketHashName,
      marketId: price.marketId,
      marketName: price.marketName,
      marketSlug: price.marketSlug,
      phase: price.phase,
      price: price.price,
      quantity: price.quantity,
      sourceUpdatedAt: price.sourceUpdatedAt?.toISOString() ?? null,
      variantKey: price.variantKey,
      volume: price.volume,
    }));
  }
}

