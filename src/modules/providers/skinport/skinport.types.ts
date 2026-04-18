export interface SkinportPriceWindow {
  avg: number | null;
  max: number | null;
  median: number | null;
  min: number | null;
  volume: number;
}

export interface SkinportSalesHistoryItem {
  currency: string;
  item_page: string;
  last_24_hours: SkinportPriceWindow;
  last_30_days: SkinportPriceWindow;
  last_7_days: SkinportPriceWindow;
  last_90_days: SkinportPriceWindow;
  market_hash_name: string;
  market_page: string;
  version: string | null;
}

export interface SkinportPriceProviderConfig {
  appId: number;
  baseUrl: string;
  chunkSize: number;
  currency: string;
  fetchAllSalesHistory: boolean;
}
