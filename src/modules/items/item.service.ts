import { ApplicationError } from "@/lib/errors";
import type { ItemReadRepository } from "@/modules/items/item.types";
import type {
  GetItemHistoryInput,
  GetItemLatestPricesInput,
  ListItemsInput,
} from "@/modules/items/item.types";

function toItemResponse(item: NonNullable<Awaited<ReturnType<ItemReadRepository["findById"]>>>) {
  return {
    baseItemName: item.baseItemName,
    collection: item.collection,
    createdAt: item.createdAt.toISOString(),
    displayName: item.displayName,
    exterior: item.exterior,
    hasVariants: item.hasVariants,
    id: item.id,
    imageUrl: item.imageUrl,
    isActive: item.isActive,
    itemType: item.itemType,
    lastCatalogSyncAt: item.lastCatalogSyncAt?.toISOString() ?? null,
    marketHashName: item.marketHashName,
    phase: item.phase,
    rarity: item.rarity,
    skinName: item.skinName,
    slug: item.slug,
    source: item.source,
    sourceExternalId: item.sourceExternalId,
    souvenir: item.souvenir,
    stattrak: item.stattrak,
    steamAppId: item.steamAppId,
    steamImageUrl: item.steamImageUrl,
    updatedAt: item.updatedAt.toISOString(),
    variantKey: item.variantKey,
    weapon: item.weapon,
  };
}

export class ItemQueryService {
  constructor(private readonly repository: ItemReadRepository) {}

  async listItems(input: ListItemsInput) {
    const result = await this.repository.listItems(input);

    return {
      filters: {
        itemType: input.itemType ?? null,
        query: input.query ?? null,
        sort: input.sort,
      },
      items: result.items.map((item) => ({
        baseItemName: item.baseItemName,
        collection: item.collection,
        createdAt: item.createdAt.toISOString(),
        displayName: item.displayName,
        exterior: item.exterior,
        hasVariants: item.hasVariants,
        id: item.id,
        imageUrl: item.imageUrl,
        isActive: item.isActive,
        itemType: item.itemType,
        lastCatalogSyncAt: item.lastCatalogSyncAt?.toISOString() ?? null,
        latestPriceCount: item.latestPriceCount,
        lowestCurrentPrice: item.lowestCurrentPrice,
        lowestCurrentPriceCurrency: item.lowestCurrentPriceCurrency,
        marketHashName: item.marketHashName,
        phase: item.phase,
        rarity: item.rarity,
        slug: item.slug,
        source: item.source,
        sourceExternalId: item.sourceExternalId,
        steamAppId: item.steamAppId,
        steamImageUrl: item.steamImageUrl,
        updatedAt: item.updatedAt.toISOString(),
      })),
      pagination: {
        limit: input.limit,
        page: input.page,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / input.limit)),
      },
    };
  }

  async getItemById(itemId: string) {
    const item = await this.repository.findById(itemId);

    if (!item) {
      throw new ApplicationError("Item not found.", 404, { itemId });
    }

    return toItemResponse(item);
  }

  async getLatestPricesByItem(input: GetItemLatestPricesInput) {
    const item = await this.repository.findById(input.itemId);

    if (!item) {
      throw new ApplicationError("Item not found.", 404, { itemId: input.itemId });
    }

    const prices = await this.repository.listLatestPricesByItem(input);

    return {
      count: prices.length,
      item: toItemResponse(item),
      prices: prices.map((price) => ({
        currency: price.currency,
        fetchedAt: price.fetchedAt.toISOString(),
        maxPrice: price.maxPrice,
        marketId: price.marketId,
        marketName: price.marketName,
        marketSlug: price.marketSlug,
        meanPrice: price.meanPrice,
        medianPrice: price.medianPrice,
        minPrice: price.minPrice,
        price: price.price,
        quantity: price.quantity,
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
        volume: price.volume,
      })),
      sort: input.sort,
    };
  }

  async getItemHistory(input: GetItemHistoryInput) {
    const item = await this.repository.findById(input.itemId);

    if (!item) {
      throw new ApplicationError("Item not found.", 404, { itemId: input.itemId });
    }

    const history = await this.repository.listHistoryByItem(input);

    return {
      count: history.length,
      filters: {
        from: input.from?.toISOString() ?? null,
        market: input.market ?? null,
        sort: input.sort,
        to: input.to?.toISOString() ?? null,
      },
      item: toItemResponse(item),
      series: history.map((point) => ({
        currency: point.currency,
        date: point.snapshotDate.toISOString().slice(0, 10),
        hour: point.snapshotHour,
        maxPrice: point.maxPrice,
        marketId: point.marketId,
        marketName: point.marketName,
        marketSlug: point.marketSlug,
        meanPrice: point.meanPrice,
        medianPrice: point.medianPrice,
        minPrice: point.minPrice,
        price: point.price,
        quantity: point.quantity,
        sales24hMedian: point.sales24hMedian,
        sales24hMin: point.sales24hMin,
        sales24hVolume: point.sales24hVolume,
        sales30dMedian: point.sales30dMedian,
        sales30dMin: point.sales30dMin,
        sales30dVolume: point.sales30dVolume,
        sales7dMedian: point.sales7dMedian,
        sales7dMin: point.sales7dMin,
        sales7dVolume: point.sales7dVolume,
        sales90dMedian: point.sales90dMedian,
        sales90dMin: point.sales90dMin,
        sales90dVolume: point.sales90dVolume,
        sourceFetchedAt: point.sourceFetchedAt.toISOString(),
        sourceUpdatedAt: point.sourceUpdatedAt?.toISOString() ?? null,
        suggestedPrice: point.suggestedPrice,
        volume: point.volume,
      })),
    };
  }
}
