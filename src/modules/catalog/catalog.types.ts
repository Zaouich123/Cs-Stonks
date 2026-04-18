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
  baseItemName: string | null;
  collection: string | null;
  displayName: string;
  exterior: string | null;
  hasVariants: boolean;
  imageUrl: string | null;
  isActive: boolean;
  itemType: ItemType;
  lastCatalogSyncAt: Date;
  marketHashName: string;
  phase: string | null;
  rarity: string | null;
  searchText: string;
  skinName: string | null;
  slug: string;
  source: string;
  sourceExternalId: string | null;
  souvenir: boolean;
  stattrak: boolean;
  steamAppId: number;
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
  imagesMissing: number;
  imagesResolved: number;
  itemsProcessed: number;
  provider: string;
  status: SyncStatus;
  syncRunId: string;
  totalPersisted: number;
  totalReceived: number;
  updated: number;
}

export interface ItemRepository {
  count(): Promise<number>;
  deactivateMissing(source: string, activeVariantKeys: string[]): Promise<number>;
  findByVariantKeys(keys: string[]): Promise<Map<string, ItemLookup>>;
  listPriceSyncTargets(): Promise<PriceSyncTargetItem[]>;
  upsertMany(items: NormalizedCatalogItem[]): Promise<CatalogWriteResult>;
}
