export interface NormalizedMarket {
  enabled: boolean;
  name: string;
  priority: number;
  slug: string;
}

export interface MarketLookup {
  id: string;
  name: string;
  slug: string;
}

export interface MarketWriteResult {
  created: number;
  markets: MarketLookup[];
  totalPersisted: number;
  updated: number;
}

export interface MarketRepository {
  count(): Promise<number>;
  findBySlugs(slugs: string[]): Promise<Map<string, MarketLookup>>;
  upsertMany(markets: NormalizedMarket[]): Promise<MarketWriteResult>;
}

