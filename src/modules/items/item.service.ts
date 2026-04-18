import { ApplicationError } from "@/lib/errors";
import type { ItemReadRepository } from "@/modules/items/item.types";
import type {
  GetItemHistoryInput,
  GetItemLatestPricesInput,
  ListItemsInput,
} from "@/modules/items/item.types";

function toItemResponse(item: NonNullable<Awaited<ReturnType<ItemReadRepository["findById"]>>>) {
  return {
    collection: item.collection,
    createdAt: item.createdAt.toISOString(),
    displayName: item.displayName,
    exterior: item.exterior,
    id: item.id,
    imageUrl: item.imageUrl,
    isActive: item.isActive,
    itemType: item.itemType,
    marketHashName: item.marketHashName,
    phase: item.phase,
    rarity: item.rarity,
    skinName: item.skinName,
    slug: item.slug,
    souvenir: item.souvenir,
    stattrak: item.stattrak,
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
        collection: item.collection,
        createdAt: item.createdAt.toISOString(),
        displayName: item.displayName,
        exterior: item.exterior,
        id: item.id,
        imageUrl: item.imageUrl,
        isActive: item.isActive,
        itemType: item.itemType,
        latestPriceCount: item.latestPriceCount,
        lowestCurrentPrice: item.lowestCurrentPrice,
        lowestCurrentPriceCurrency: item.lowestCurrentPriceCurrency,
        marketHashName: item.marketHashName,
        phase: item.phase,
        rarity: item.rarity,
        slug: item.slug,
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
        marketId: price.marketId,
        marketName: price.marketName,
        marketSlug: price.marketSlug,
        price: price.price,
        quantity: price.quantity,
        sourceUpdatedAt: price.sourceUpdatedAt?.toISOString() ?? null,
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
        marketId: point.marketId,
        marketName: point.marketName,
        marketSlug: point.marketSlug,
        price: point.price,
        quantity: point.quantity,
        sourceFetchedAt: point.sourceFetchedAt.toISOString(),
        sourceUpdatedAt: point.sourceUpdatedAt?.toISOString() ?? null,
        volume: point.volume,
      })),
    };
  }
}
