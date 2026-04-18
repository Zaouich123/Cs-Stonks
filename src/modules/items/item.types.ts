import type { ItemType } from "@prisma/client";

export const itemListSortOptions = [
  "displayName_asc",
  "displayName_desc",
  "createdAt_desc",
] as const;
export const itemLatestPriceSortOptions = [
  "market_asc",
  "market_desc",
  "price_asc",
  "price_desc",
  "fetchedAt_desc",
] as const;
export const itemHistorySortOptions = ["asc", "desc"] as const;

export type ItemListSort = (typeof itemListSortOptions)[number];
export type ItemLatestPriceSort = (typeof itemLatestPriceSortOptions)[number];
export type ItemHistorySort = (typeof itemHistorySortOptions)[number];

export interface ListItemsInput {
  itemType?: ItemType;
  limit: number;
  page: number;
  query?: string;
  sort: ItemListSort;
}

export interface ListItemsRow {
  collection: string | null;
  createdAt: Date;
  displayName: string;
  exterior: string | null;
  id: string;
  imageUrl: string | null;
  isActive: boolean;
  itemType: ItemType;
  latestPriceCount: number;
  lowestCurrentPrice: number | null;
  lowestCurrentPriceCurrency: string | null;
  marketHashName: string;
  phase: string | null;
  rarity: string | null;
  slug: string;
  steamImageUrl: string | null;
  updatedAt: Date;
}

export interface ListItemsResult {
  items: ListItemsRow[];
  totalItems: number;
}

export interface ItemDetailRow {
  collection: string | null;
  createdAt: Date;
  displayName: string;
  exterior: string | null;
  id: string;
  imageUrl: string | null;
  isActive: boolean;
  itemType: ItemType;
  marketHashName: string;
  phase: string | null;
  rarity: string | null;
  searchText: string;
  skinName: string | null;
  slug: string;
  souvenir: boolean;
  stattrak: boolean;
  steamImageUrl: string | null;
  updatedAt: Date;
  variantKey: string;
  weapon: string | null;
}

export interface ItemLatestPriceRow {
  currency: string;
  fetchedAt: Date;
  marketId: string;
  marketName: string;
  marketSlug: string;
  price: number;
  quantity: number | null;
  sourceUpdatedAt: Date | null;
  volume: number | null;
}

export interface GetItemLatestPricesInput {
  itemId: string;
  sort: ItemLatestPriceSort;
}

export interface ItemHistoryRow {
  currency: string;
  marketId: string;
  marketName: string;
  marketSlug: string;
  price: number;
  quantity: number | null;
  snapshotDate: Date;
  snapshotHour: string;
  sourceFetchedAt: Date;
  sourceUpdatedAt: Date | null;
  volume: number | null;
}

export interface GetItemHistoryInput {
  from?: Date;
  itemId: string;
  market?: string;
  sort: ItemHistorySort;
  to?: Date;
}

export interface ItemReadRepository {
  findById(itemId: string): Promise<ItemDetailRow | null>;
  listHistoryByItem(input: GetItemHistoryInput): Promise<ItemHistoryRow[]>;
  listItems(input: ListItemsInput): Promise<ListItemsResult>;
  listLatestPricesByItem(input: GetItemLatestPricesInput): Promise<ItemLatestPriceRow[]>;
}
