import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type {
  ExchangeManualAnalysis,
  ExchangeManualItemInput,
  ExchangeOfferAnalysis,
  ExchangeOfferVerdict,
  ExchangePricedItem,
  ExchangeSteamOffersAnalysis,
  SteamTradeOffer,
  SteamTradeOfferAsset,
} from "@/modules/exchanges/exchange.types";
import { SteamTradeOffersClient } from "@/modules/exchanges/steamTradeOffersClient";

const USD_EUR_RATE = Number(process.env.NEXT_PUBLIC_USD_EUR_RATE ?? "0.92");

interface AnalyzeSteamOffersInput {
  activeOnly: boolean;
  getReceivedOffers: boolean;
  getSentOffers: boolean;
  steamApiKey: string;
  tradeOfferId?: string | null;
}

interface LowestPriceCandidate {
  currency: string;
  fetchedAt: Date;
  itemId: string;
  marketName: string;
  marketSlug: string;
  price: number;
  priceEur: number;
  displayName: string;
}

interface ManualItemRecord {
  amount: number;
  baseItemName: string | null;
  displayName: string;
  id: string;
  imageUrl: string | null;
  marketHashName: string;
  steamAppId: number;
  steamImageUrl: string | null;
}

function toEur(value: number, currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase();

  if (normalizedCurrency === "EUR") {
    return value;
  }

  if (normalizedCurrency === "USD") {
    return value * (USD_EUR_RATE > 0 ? USD_EUR_RATE : 0.92);
  }

  return value;
}

function getMarketHashNames(offers: SteamTradeOffer[]) {
  const names = new Set<string>();

  for (const offer of offers) {
    for (const item of [...offer.itemsToGive, ...offer.itemsToReceive]) {
      if (item.marketHashName) {
        names.add(item.marketHashName);
      }
    }
  }

  return [...names];
}

function getVerdict(input: {
  netValue: number | null;
  totalItems: number;
  unpricedItems: number;
}): ExchangeOfferVerdict {
  if (input.totalItems === 0 || input.unpricedItems > 0 || input.netValue === null) {
    return "incomplete";
  }

  if (input.netValue > 1) {
    return "profitable";
  }

  if (input.netValue < -1) {
    return "risky";
  }

  return "balanced";
}

function sumPriced(items: ExchangePricedItem[]) {
  const pricedValues = items
    .map((item) => item.totalValue)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  return pricedValues.length === 0 ? null : pricedValues.reduce((sum, value) => sum + value, 0);
}

function pickLowestCandidate(candidates: LowestPriceCandidate[]) {
  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => left.priceEur - right.priceEur)[0];
}

function valueManualItem(
  item: ManualItemRecord,
  candidateMap: Map<string, LowestPriceCandidate[]>,
): ExchangePricedItem {
  const candidate = pickLowestCandidate(candidateMap.get(item.id) ?? []);
  const iconUrl = item.imageUrl ?? item.steamImageUrl;
  const baseAsset = {
    amount: item.amount,
    appId: item.steamAppId,
    assetId: item.id,
    classId: item.id,
    iconUrl,
    instanceId: item.id,
    marketHashName: item.marketHashName,
    marketName: item.displayName,
    name: item.displayName,
  };

  if (!candidate) {
    return {
      ...baseAsset,
      itemId: item.id,
      matchedDisplayName: item.displayName,
      sourceCurrency: null,
      sourceMarketName: null,
      sourceMarketSlug: null,
      sourcePrice: null,
      sourceUpdatedAt: null,
      totalValue: null,
      unitPrice: null,
      valuationCurrency: "EUR",
    };
  }

  return {
    ...baseAsset,
    itemId: item.id,
    matchedDisplayName: candidate.displayName,
    sourceCurrency: candidate.currency,
    sourceMarketName: candidate.marketName,
    sourceMarketSlug: candidate.marketSlug,
    sourcePrice: candidate.price,
    sourceUpdatedAt: candidate.fetchedAt.toISOString(),
    totalValue: candidate.priceEur * item.amount,
    unitPrice: candidate.priceEur,
    valuationCurrency: "EUR",
  };
}

function valueAsset(
  asset: SteamTradeOfferAsset,
  candidateMap: Map<string, LowestPriceCandidate[]>,
): ExchangePricedItem {
  const candidate = asset.marketHashName ? pickLowestCandidate(candidateMap.get(asset.marketHashName) ?? []) : null;

  if (!candidate) {
    return {
      ...asset,
      itemId: null,
      matchedDisplayName: null,
      sourceCurrency: null,
      sourceMarketName: null,
      sourceMarketSlug: null,
      sourcePrice: null,
      sourceUpdatedAt: null,
      totalValue: null,
      unitPrice: null,
      valuationCurrency: "EUR",
    };
  }

  return {
    ...asset,
    itemId: candidate.itemId,
    matchedDisplayName: candidate.displayName,
    sourceCurrency: candidate.currency,
    sourceMarketName: candidate.marketName,
    sourceMarketSlug: candidate.marketSlug,
    sourcePrice: candidate.price,
    sourceUpdatedAt: candidate.fetchedAt.toISOString(),
    totalValue: candidate.priceEur * asset.amount,
    unitPrice: candidate.priceEur,
    valuationCurrency: "EUR",
  };
}

function summarizeOffers(offers: ExchangeOfferAnalysis[]): ExchangeSteamOffersAnalysis["summary"] {
  return offers.reduce(
    (summary, offer) => {
      summary.totalOffers += 1;
      summary[offer.direction] += 1;
      summary[offer.verdict] += 1;

      return summary;
    },
    {
      balanced: 0,
      incomplete: 0,
      profitable: 0,
      received: 0,
      risky: 0,
      sent: 0,
      totalOffers: 0,
    },
  );
}

export class ExchangeValuationService {
  constructor(
    private readonly database: PrismaClient = prisma,
    private readonly steamClient = new SteamTradeOffersClient(),
  ) {}

  private async getLowestPriceCandidates(marketHashNames: string[]) {
    if (marketHashNames.length === 0) {
      return new Map<string, LowestPriceCandidate[]>();
    }

    const items = await this.database.item.findMany({
      include: {
        latestPrices: {
          include: {
            market: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          where: {
            market: {
              enabled: true,
            },
            price: {
              gt: 0,
            },
          },
        },
      },
      where: {
        isActive: true,
        marketHashName: {
          in: marketHashNames,
        },
      },
    });
    const candidateMap = new Map<string, LowestPriceCandidate[]>();

    for (const item of items) {
      for (const latestPrice of item.latestPrices) {
        const price = latestPrice.price.toNumber();
        const candidate: LowestPriceCandidate = {
          currency: latestPrice.currency,
          displayName: item.displayName,
          fetchedAt: latestPrice.fetchedAt,
          itemId: item.id,
          marketName: latestPrice.market.name,
          marketSlug: latestPrice.market.slug,
          price,
          priceEur: toEur(price, latestPrice.currency),
        };
        const candidates = candidateMap.get(item.marketHashName) ?? [];

        candidates.push(candidate);
        candidateMap.set(item.marketHashName, candidates);
      }
    }

    return candidateMap;
  }

  private async getLowestPriceCandidatesByItemIds(itemIds: string[]) {
    if (itemIds.length === 0) {
      return new Map<string, LowestPriceCandidate[]>();
    }

    const items = await this.database.item.findMany({
      include: {
        latestPrices: {
          include: {
            market: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          where: {
            market: {
              enabled: true,
            },
            price: {
              gt: 0,
            },
          },
        },
      },
      where: {
        id: {
          in: itemIds,
        },
        isActive: true,
      },
    });
    const candidateMap = new Map<string, LowestPriceCandidate[]>();

    for (const item of items) {
      for (const latestPrice of item.latestPrices) {
        const price = latestPrice.price.toNumber();
        const candidate: LowestPriceCandidate = {
          currency: latestPrice.currency,
          displayName: item.displayName,
          fetchedAt: latestPrice.fetchedAt,
          itemId: item.id,
          marketName: latestPrice.market.name,
          marketSlug: latestPrice.market.slug,
          price,
          priceEur: toEur(price, latestPrice.currency),
        };
        const candidates = candidateMap.get(item.id) ?? [];

        candidates.push(candidate);
        candidateMap.set(item.id, candidates);
      }
    }

    return candidateMap;
  }

  private async resolveManualItems(items: ExchangeManualItemInput[]) {
    if (items.length === 0) {
      return [];
    }

    const amountByItemId = new Map<string, number>();

    for (const item of items) {
      amountByItemId.set(item.itemId, (amountByItemId.get(item.itemId) ?? 0) + item.amount);
    }

    const records = await this.database.item.findMany({
      select: {
        baseItemName: true,
        displayName: true,
        id: true,
        imageUrl: true,
        marketHashName: true,
        steamAppId: true,
        steamImageUrl: true,
      },
      where: {
        id: {
          in: [...amountByItemId.keys()],
        },
        isActive: true,
      },
    });

    return records.map<ManualItemRecord>((record) => ({
      ...record,
      amount: amountByItemId.get(record.id) ?? 1,
    }));
  }

  async analyzeSteamOffers(input: AnalyzeSteamOffersInput): Promise<ExchangeSteamOffersAnalysis> {
    const steamSummary = await this.steamClient.fetchSummary(input.steamApiKey);
    const singleOffer = input.tradeOfferId
      ? await this.steamClient.fetchOfferById({
          steamApiKey: input.steamApiKey,
          tradeOfferId: input.tradeOfferId,
        })
      : null;
    const steamOffers = singleOffer ? [singleOffer] : await this.steamClient.fetchOffers(input);
    const candidateMap = await this.getLowestPriceCandidates(getMarketHashNames(steamOffers));
    const offers = steamOffers.map<ExchangeOfferAnalysis>((offer) => {
      const itemsToGive = offer.itemsToGive.map((item) => valueAsset(item, candidateMap));
      const itemsToReceive = offer.itemsToReceive.map((item) => valueAsset(item, candidateMap));
      const totalGiven = sumPriced(itemsToGive);
      const totalReceived = sumPriced(itemsToReceive);
      const totalItems = itemsToGive.length + itemsToReceive.length;
      const unpricedItems = [...itemsToGive, ...itemsToReceive].filter((item) => item.totalValue === null).length;
      const netValue = totalGiven === null || totalReceived === null ? null : totalReceived - totalGiven;
      const verdict = getVerdict({
        netValue,
        totalItems,
        unpricedItems,
      });

      return {
        ...offer,
        itemsToGive,
        itemsToReceive,
        netValue,
        pricedItems: totalItems - unpricedItems,
        totalGiven,
        totalReceived,
        unpricedItems,
        verdict,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      offers,
      security: {
        apiKeyStored: false,
        notes: [
          "The Steam Web API key is used only for this server-side request.",
          "The key is never written to the database, logs, local storage, or the response payload.",
        ],
      },
      steamSummary,
      summary: summarizeOffers(offers),
    };
  }

  async analyzeManualOffer(input: {
    itemsToGive: ExchangeManualItemInput[];
    itemsToReceive: ExchangeManualItemInput[];
  }): Promise<ExchangeManualAnalysis> {
    const [giveRecords, receiveRecords] = await Promise.all([
      this.resolveManualItems(input.itemsToGive),
      this.resolveManualItems(input.itemsToReceive),
    ]);
    const candidateMap = await this.getLowestPriceCandidatesByItemIds(
      [...giveRecords, ...receiveRecords].map((item) => item.id),
    );
    const itemsToGive = giveRecords.map((item) => valueManualItem(item, candidateMap));
    const itemsToReceive = receiveRecords.map((item) => valueManualItem(item, candidateMap));
    const totalGiven = sumPriced(itemsToGive);
    const totalReceived = sumPriced(itemsToReceive);
    const totalItems = itemsToGive.length + itemsToReceive.length;
    const unpricedItems = [...itemsToGive, ...itemsToReceive].filter((item) => item.totalValue === null).length;
    const netValue = totalGiven === null || totalReceived === null ? null : totalReceived - totalGiven;
    const verdict = getVerdict({
      netValue,
      totalItems,
      unpricedItems,
    });
    const generatedAt = new Date().toISOString();
    const offer: ExchangeOfferAnalysis = {
      createdAt: generatedAt,
      direction: "received",
      expiresAt: null,
      id: `manual-${Date.now()}`,
      itemsToGive,
      itemsToReceive,
      message: "Manual exchange analysis",
      netValue,
      partnerAccountId: null,
      partnerSteamId64: null,
      pricedItems: totalItems - unpricedItems,
      state: 0,
      stateLabel: "Manual",
      totalGiven,
      totalReceived,
      unpricedItems,
      updatedAt: generatedAt,
      verdict,
    };

    return {
      generatedAt,
      offer,
      summary: {
        netValue,
        totalGiven,
        totalReceived,
        unpricedItems,
        verdict,
      },
    };
  }
}
