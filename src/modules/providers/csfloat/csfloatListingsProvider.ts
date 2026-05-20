import { CsfloatClient } from "@/modules/providers/csfloat/csfloat.client";
import {
  mapCsfloatPriceListRecordToAggregated,
  normalizeCsfloatListing,
} from "@/modules/providers/csfloat/csfloat.mapper";
import type {
  CsfloatPriceListFetchResult,
  CsfloatListingsProviderConfig,
  CsfloatProviderFetchResult,
  NormalizedCsfloatListing,
} from "@/modules/providers/csfloat/csfloat.types";

function sleep(ms: number) {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clampPositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function resolveCsfloatListingsProviderConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): CsfloatListingsProviderConfig {
  return {
    delayMs: Math.max(0, Number(env.CSFLOAT_DELAY_MS ?? 1000)),
    limit: Math.min(50, clampPositiveInteger(env.CSFLOAT_LISTINGS_LIMIT, 50)),
    maxPagesPerRun: clampPositiveInteger(env.CSFLOAT_MAX_PAGES_PER_RUN, 100),
  };
}

export class CsfloatListingsProvider {
  constructor(
    private readonly client = new CsfloatClient(),
    private readonly config = resolveCsfloatListingsProviderConfigFromEnv(),
  ) {}

  async fetchSweep(cursor?: string | null): Promise<CsfloatProviderFetchResult> {
    const fetchedAt = new Date();
    const listings: NormalizedCsfloatListing[] = [];
    let currentCursor = cursor ?? null;
    let nextCursor: string | null = currentCursor;
    let invalidListings = 0;
    let listingsReceived = 0;
    let pagesFetched = 0;

    for (let page = 0; page < this.config.maxPagesPerRun; page += 1) {
      const response = await this.client.getListings({
        cursor: currentCursor,
        limit: this.config.limit,
        sortBy: "lowest_price",
        type: "buy_now",
      });

      pagesFetched += 1;
      listingsReceived += response.listings.length;
      nextCursor = response.cursor;

      for (const listing of response.listings) {
        const normalized = normalizeCsfloatListing(listing, fetchedAt);

        if (normalized) {
          listings.push(normalized);
        } else {
          invalidListings += 1;
        }
      }

      if (!response.cursor || response.listings.length === 0) {
        nextCursor = null;
        break;
      }

      currentCursor = response.cursor;
      await sleep(this.config.delayMs);
    }

    return {
      listings,
      summary: {
        cursor: cursor ?? null,
        invalidListings,
        listingsReceived,
        nextCursor,
        pagesFetched,
      },
    };
  }

  async fetchPriceList(): Promise<CsfloatPriceListFetchResult> {
    const fetchedAt = new Date();
    const records = await this.client.getPriceList();
    const mapped = [];
    let invalidRecords = 0;

    for (const record of records) {
      const normalized = mapCsfloatPriceListRecordToAggregated(record, fetchedAt);

      if (normalized) {
        mapped.push(normalized);
      } else {
        invalidRecords += 1;
      }
    }

    return {
      records: mapped,
      summary: {
        invalidRecords,
        recordsReceived: records.length,
      },
    };
  }

  async fetchTargeted(marketHashNames: string[]): Promise<CsfloatProviderFetchResult> {
    const fetchedAt = new Date();
    const listings: NormalizedCsfloatListing[] = [];
    let invalidListings = 0;
    let listingsReceived = 0;
    let pagesFetched = 0;

    for (const marketHashName of [...new Set(marketHashNames.map((name) => name.trim()).filter(Boolean))]) {
      const response = await this.client.getListings({
        limit: this.config.limit,
        marketHashName,
        sortBy: "lowest_price",
        type: "buy_now",
      });

      pagesFetched += 1;
      listingsReceived += response.listings.length;

      for (const listing of response.listings) {
        const normalized = normalizeCsfloatListing(listing, fetchedAt);

        if (normalized) {
          listings.push(normalized);
        } else {
          invalidListings += 1;
        }
      }

      await sleep(this.config.delayMs);
    }

    return {
      listings,
      summary: {
        cursor: null,
        invalidListings,
        listingsReceived,
        nextCursor: null,
        pagesFetched,
      },
    };
  }
}
