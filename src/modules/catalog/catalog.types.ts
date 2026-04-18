import type { ItemType, SyncStatus } from "@prisma/client";

import type { PriceSyncTargetItem } from "@/modules/providers/provider.types";

export interface ItemLookup {
  displayName: string;
  id: string;
  itemType: ItemType;
  marketHashName: string;
  phase: string | null;
  variantKey: string;
}

export interface NormalizedCatalogItem {
  collection: string | null;
  displayName: string;
  exterior: string | null;
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
  variantKey: string;
  weapon: string | null;
}

export interface CatalogWriteResult {
  created: number;
  items: ItemLookup[];
  totalPersisted: number;
  updated: number;
}

export interface CatalogSyncResult {
  created: number;
  errors: string[];
  failed: number;
  provider: string;
  status: SyncStatus;
  syncRunId: string;
  totalPersisted: number;
  totalReceived: number;
  updated: number;
}

export interface ItemRepository {
  count(): Promise<number>;
  findByVariantKeys(keys: string[]): Promise<Map<string, ItemLookup>>;
  listPriceSyncTargets(): Promise<PriceSyncTargetItem[]>;
  upsertMany(items: NormalizedCatalogItem[]): Promise<CatalogWriteResult>;
}
