export interface SteamInventoryAsset {
  amount: string;
  appid: number;
  assetid: string;
  classid: string;
  contextid: string;
  instanceid: string;
}

export interface SteamInventoryDescriptionLine {
  color?: string;
  type?: string;
  value?: string;
}

export interface SteamInventoryAction {
  link?: string;
  name?: string;
}

export interface SteamInventoryTag {
  category?: string;
  color?: string;
  internal_name?: string;
  localized_category_name?: string;
  localized_tag_name?: string;
}

export interface SteamInventoryDescription {
  actions?: SteamInventoryAction[];
  appid: number;
  background_color?: string;
  classid: string;
  commodity?: number;
  descriptions?: SteamInventoryDescriptionLine[];
  icon_url?: string;
  icon_url_large?: string;
  instanceid: string;
  market_hash_name?: string;
  market_name?: string;
  marketable?: number;
  name: string;
  name_color?: string;
  owner_actions?: SteamInventoryAction[];
  tags?: SteamInventoryTag[];
  tradable?: number;
  type?: string;
}

export interface SteamInventoryPayload {
  assets: SteamInventoryAsset[];
  descriptions: SteamInventoryDescription[];
  success: boolean | number;
  total_inventory_count?: number;
}

export interface InventoryWear {
  label: string | null;
  source: "estimated" | "unknown";
  value: number | null;
}

export interface InventoryMarketPrice {
  currency: string;
  fetchedAt: string;
  marketName: string;
  marketSlug: string;
  price: number;
  quantity: number | null;
  sourceItemUrl: string | null;
  sourceMarketUrl: string | null;
}

export interface InventoryItem {
  amount: number;
  assetId: string;
  classId: string;
  displayName: string;
  exterior: string | null;
  imageUrl: string | null;
  inspectLink: string | null;
  instanceId: string;
  itemId: string | null;
  itemType: string | null;
  marketHashName: string;
  marketable: boolean;
  prices: InventoryMarketPrice[];
  rarity: string | null;
  referenceCurrency: string | null;
  referencePrice: number | null;
  slug: string | null;
  tags: string[];
  tradable: boolean;
  type: string | null;
  wear: InventoryWear;
}

export interface InventorySummary {
  matchedItems: number;
  totalEstimatedValue: number | null;
  totalInventoryItems: number;
  valuedItems: number;
  valueCurrency: string | null;
}

export interface InventoryCacheInfo {
  fetchedAt: string | null;
  isStale: boolean;
  source: "cache" | "steam";
  ttlSeconds: number;
  warning: string | null;
}

export interface InventoryResponse {
  cache: InventoryCacheInfo;
  items: InventoryItem[];
  summary: InventorySummary;
  user: {
    steamAvatar: string | null;
    steamId: string;
    steamPersonaName: string;
  };
}
