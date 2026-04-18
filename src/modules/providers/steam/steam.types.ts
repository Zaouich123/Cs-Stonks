export interface SteamPriceOverviewPayload {
  lowest_price?: string;
  median_price?: string;
  success: boolean;
  volume?: string;
}

export interface SteamPriceProviderConfig {
  appId: number;
  baseUrl: string;
  concurrency: number;
  country: string;
  currencyCode: number;
  maxItems: number | null;
  retryCount: number;
  timeoutMs: number;
}
