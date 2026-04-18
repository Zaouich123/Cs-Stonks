import type { ItemType, SyncStatus } from "@prisma/client";

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
  skinName: string | null;
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
  upsertMany(items: NormalizedCatalogItem[]): Promise<CatalogWriteResult>;
}

